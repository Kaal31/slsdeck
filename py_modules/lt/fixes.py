"""Game fix lookup, application, and removal."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import threading
import time
import urllib.parse
import zipfile
from datetime import datetime
from typing import Any, Dict, List, Optional

from .config import (
    GENERIC_FIX_URL,
    ONLINE_FIX_URL,
    PERONDEPOT_INDEX_URL,
    UNSTEAM_AIO_URL,
    USER_AGENT,
)
from .downloads import fetch_app_name
from .httpc import ensure_http_client
from .logger import logger
from .paths import ensure_temp_download_dir
from .steam import get_game_install_path_response, list_installed_games, resolve_persona_name
from .utils import chown_to_user
from . import ryuu
from . import slssteam
from . import pinsource
from . import luatools
from . import settings as _settings

FIX_STATE: Dict[int, Dict[str, Any]] = {}
FIX_LOCK = threading.Lock()
UNFIX_STATE: Dict[int, Dict[str, Any]] = {}
UNFIX_LOCK = threading.Lock()
UNFIX_JOB_LOCK = threading.Lock()


def init_fixes_index() -> None:
    # Online fixes now come only from the perondepot mirror (matched by game
    # name). The rate-limited luatools catalog index has been removed.
    return None


# ── online-fix mirror (perondepot), matched by game NAME ─────────────────────
# The appid index (onlineFixes) is heavily rate-limited (HTTP 429) so online
# fixes there almost always read as "unavailable". The desktop Linux app instead
# resolves online fixes by matching the game name against the perondepot mirror's
# .rar autoindex. We do both and offer whichever resolves.
_PERO_MARKER = "\u043f\u043e \u0441\u0435\u0442\u0438"  # Cyrillic "\u043f\u043e \u0441\u0435\u0442\u0438" (over network)
_pero_lock = threading.Lock()
_pero_cache: Optional[List[Dict[str, str]]] = None
_pero_ts = 0.0


def _pero_normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def _pero_clean_name(decoded: str) -> str:
    s2 = re.sub(r"\.rar$", "", decoded)
    idx = s2.rfind(" - ")
    if idx != -1:
        s2 = s2[:idx]
    m = s2.find(_PERO_MARKER)
    if m != -1:
        s2 = s2[:m]
    else:
        s2 = re.sub(r"\s+[Oo]nline\s*$", "", s2)
    return s2.strip()


def _pero_parse(html: str) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for href in re.findall(r'href="([^"]*?\.rar)"', html or ""):
        name = _pero_clean_name(urllib.parse.unquote(href))
        if name:
            out.append({"name": name, "href": href})
    return out


def _pero_fetch() -> List[Dict[str, str]]:
    global _pero_cache, _pero_ts
    with _pero_lock:
        if _pero_cache is not None and (time.time() - _pero_ts) < 600:
            return _pero_cache
    client = ensure_http_client("SLSDeck: online-fix mirror")
    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0"}
    for _ in range(3):
        try:
            r = client.get(PERONDEPOT_INDEX_URL, headers=headers, follow_redirects=True, timeout=15)
            if r.status_code == 200 and r.text:
                entries = _pero_parse(r.text)
                with _pero_lock:
                    _pero_cache = entries
                    _pero_ts = time.time()
                logger.log(f"SLSDeck: online-fix mirror loaded ({len(entries)} entries)")
                return entries
        except Exception as exc:
            logger.warn(f"SLSDeck: online-fix mirror fetch failed: {exc}")
    return _pero_cache or []


def resolve_online_fix(game_name: str) -> Optional[Dict[str, str]]:
    target = _pero_normalize(game_name)
    if not target:
        return None
    entries = _pero_fetch()
    # 1) exact normalized match.
    for e in entries:
        if _pero_normalize(e["name"]) == target:
            return {"name": e["name"], "url": PERONDEPOT_INDEX_URL + e["href"]}
    # 2) edition/suffix tolerance: one normalized name is a prefix of the other
    #    (e.g. Steam "CarX Street" vs mirror "CarX Street EA"). Guarded to names
    #    >= 8 chars to avoid short false positives, and picks the closest length.
    best = None
    best_len = None
    for e in entries:
        en = _pero_normalize(e["name"])
        if not en:
            continue
        shorter = min(len(en), len(target))
        if shorter >= 8 and (en.startswith(target) or target.startswith(en)):
            if best is None or abs(len(en) - len(target)) < best_len:
                best = e
                best_len = abs(len(en) - len(target))
    if best:
        return {"name": best["name"], "url": PERONDEPOT_INDEX_URL + best["href"]}
    return None


_FF_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0"


def _pero_near_matches(game_name: str, limit: int = 6) -> List[str]:
    """Diagnostics: mirror entries whose name overlaps the target (substring
    either way), so we can see how a game is actually spelled on the mirror."""
    t = _pero_normalize(game_name)
    if not t:
        return []
    out: List[str] = []
    # use a shorter probe so partial-word overlaps show up too
    probe = t[:6]
    for e in _pero_fetch():
        en = _pero_normalize(e["name"])
        if t and (t in en or en in t or (probe and probe in en)):
            out.append(e["name"])
            if len(out) >= limit:
                break
    return out


def _is_safe_path(base_path: str, target_path: str) -> bool:
    abs_base = os.path.abspath(base_path)
    abs_target = os.path.abspath(os.path.join(base_path, target_path))
    return abs_target.startswith(abs_base + os.sep) or abs_target == abs_base


# These dicts live for the whole Steam session and gain an entry per game the
# user ever fixes, so they need a ceiling. Only FINISHED entries are dropped --
# evicting a running fix would make its progress unreadable and cancel unusable.
_STATE_CAP = 64
_TERMINAL = {"done", "failed", "cancelled"}


def _prune_state(store: dict) -> None:
    if len(store) <= _STATE_CAP:
        return
    finished = [k for k, v in store.items() if (v or {}).get("status") in _TERMINAL]
    for k in finished[: max(0, len(store) - _STATE_CAP)]:
        store.pop(k, None)


def _set_fix_state(appid: int, update: dict) -> None:
    with FIX_LOCK:
        state = FIX_STATE.get(appid) or {}
        state.update(update)
        FIX_STATE[appid] = state
        _prune_state(FIX_STATE)


def _get_fix_state(appid: int) -> dict:
    with FIX_LOCK:
        return FIX_STATE.get(appid, {}).copy()


def _set_unfix_state(appid: int, update: dict) -> None:
    with UNFIX_LOCK:
        state = UNFIX_STATE.get(appid) or {}
        state.update(update)
        UNFIX_STATE[appid] = state
        _prune_state(UNFIX_STATE)


def _get_unfix_state(appid: int) -> dict:
    with UNFIX_LOCK:
        return UNFIX_STATE.get(appid, {}).copy()


def _reserve_unfix(appid: int) -> bool:
    """Atomically reserve the one un-fix job allowed for an app."""
    with UNFIX_JOB_LOCK:
        state = _get_unfix_state(appid)
        if state.get("status") in {"queued", "removing"}:
            return False
        _set_unfix_state(appid, {"status": "queued", "progress": "", "error": None})
        return True


def check_for_fixes(appid: int, game_name: str = "") -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    result = {
        "success": True,
        "appid": appid,
        "gameName": "",
        "genericFix": {"status": 0, "available": False},
        "onlineFix": {"status": 0, "available": False},
    }
    # The frontend passes the exact Steam display name when it can (most
    # reliable for the perondepot name match); otherwise resolve it ourselves.
    backend_name = ""
    try:
        backend_name = fetch_app_name(appid) or ""
    except Exception:
        backend_name = ""
    result["gameName"] = (game_name or backend_name or f"Unknown Game ({appid})")

    generic_url = GENERIC_FIX_URL.format(appid=appid)
    client = ensure_http_client("SLSDeck: check fixes")

    # Browser-like UA + a 1-byte Range so existing files answer 206/200 without
    # pulling the whole archive; falls back to HEAD.
    _probe_headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
        "Range": "bytes=0-0",
    }

    def _exists(url):
        try:
            with client.stream(
                "GET", url, headers=_probe_headers, follow_redirects=True, timeout=12
            ) as resp:
                if resp.status_code in (200, 206, 416):
                    return True
                if resp.status_code == 404:
                    return False
        except Exception:
            pass
        try:
            h = client.head(url, follow_redirects=True, timeout=8)
            return h.status_code in (200, 206)
        except Exception:
            return False

    # Fixes come from the ryuu.lol appid catalogue (bundled + background-refreshed);
    # generic/crack from the best non-online/non-hypervisor entry.
    try:
        ry = ryuu.resolve(appid)
    except Exception:
        ry = {"generic": None, "online": None, "hypervisor": None, "count": 0}
    rg = ry.get("generic")
    result["genericFix"] = {
        "status": 200 if rg else 404,
        "available": bool(rg),
        "url": rg["url"] if rg else None,
        "file": rg["file"] if rg else None,
        "badge": rg["badge"] if rg else None,
    }

    # Online fix: perondepot mirror ONLY, matched by game NAME (.rar). This is
    # the same source the official Linux app uses; the rate-limited luatools
    # catalog has been removed.
    name_candidates = []
    for nm in (game_name, backend_name, result["gameName"]):
        if nm and nm not in name_candidates and not nm.startswith("Unknown Game"):
            name_candidates.append(nm)
    pero = None
    for nm in name_candidates:
        try:
            pero = resolve_online_fix(nm)
        except Exception:
            pero = None
        if pero:
            break
    try:
        pero_count = len(_pero_fetch())
    except Exception:
        pero_count = 0
    ro = ry.get("online")
    online_url = pero["url"] if pero else (ro["url"] if ro else None)
    online_ok = bool(pero) or bool(ro)
    result["onlineFix"] = {
        "status": 200 if online_ok else 404,
        "available": online_ok,
        "url": online_url,
        "perondepot": pero["url"] if pero else None,
        "ryuuOnline": ro["url"] if ro else None,
        # diagnostics: perondepot mirror state only.
        "mirrorEntries": pero_count,
        "namesTried": name_candidates,
        "nearMatches": ([] if pero else _pero_near_matches(result["gameName"])),
    }

    # luatools.work fix FILES as a fallback — probe the per-appid zip directly,
    # skipping the rate-limited index.luatools.work (only the index 429s; the
    # files don't). Generic = GameBypasses, online = OnlineFix1. Only probed for a
    # type ryuu/perondepot didn't already cover, so it's at most two extra
    # requests and only when we'd otherwise show nothing.
    luatools_fixes: List[Dict[str, Any]] = []
    try:
        if not rg:
            lu_generic = GENERIC_FIX_URL.format(appid=appid)
            if _exists(lu_generic):
                luatools_fixes.append({
                    "file": f"GameBypasses/{appid}.zip", "badge": "bypass",
                    "type": "generic", "source": "luatools", "url": lu_generic,
                })
                if not result["genericFix"].get("available"):
                    result["genericFix"] = {
                        "status": 200, "available": True, "url": lu_generic,
                        "file": f"GameBypasses/{appid}.zip", "badge": "bypass",
                        "source": "luatools",
                    }
        if not online_ok:
            lu_online = ONLINE_FIX_URL.format(appid=appid)
            if _exists(lu_online):
                luatools_fixes.append({
                    "file": f"OnlineFix1/{appid}.zip", "badge": "online",
                    "type": "online", "source": "luatools", "url": lu_online,
                })
                if not result["onlineFix"].get("available"):
                    result["onlineFix"]["available"] = True
                    result["onlineFix"]["status"] = 200
                    result["onlineFix"]["url"] = result["onlineFix"].get("url") or lu_online
                    result["onlineFix"]["luatools"] = lu_online
    except Exception as exc:
        logger.warn(f"SLSDeck: luatools fallback probe failed: {exc}")
    result["luatoolsFixes"] = luatools_fixes

    # lua.tools fix CATALOG — the account-gated full list (the desktop app's
    # FixesViewModel: /api/denuvo/fixes?appid=). Every release for this game, each
    # carrying the exact manifest/build to pin. Only queried when signed in;
    # otherwise we surface a "sign in" hint so the UI can offer the Discord login.
    result["luatoolsCatalog"] = []
    result["luatoolsAuthed"] = False
    # Auth state is decided by whether we hold a valid session — NOT by whether
    # the catalog fetch happened to succeed. Deriving it from list_fixes meant any
    # error there bounced the UI back to the sign-in prompt and hid the real cause.
    try:
        result["luatoolsAuthed"] = bool(luatools.is_authed())
    except Exception:
        result["luatoolsAuthed"] = False
    try:
        cat = luatools.list_fixes(appid)
        if "authed" in cat:
            result["luatoolsAuthed"] = bool(cat.get("authed"))
        result["luatoolsDebug"] = cat.get("debug") or {}
        if cat.get("success"):
            result["luatoolsCatalog"] = cat.get("fixes", []) or []
        elif cat.get("error"):
            result["luatoolsCatalogError"] = cat.get("error", "")
    except Exception as exc:
        result["luatoolsCatalogError"] = f"catalog error: {exc}"
        result["luatoolsDebug"] = {"exception": str(exc)}
        logger.warn(f"SLSDeck: lua.tools catalog fetch failed: {exc}")

    # HV / Denuvo fix from ryuu (if any) — the Denuvo toggle applies this
    # alongside enabling the anti-Denuvo hypervisor + the custom GE-Proton-HV.
    rh = ry.get("hypervisor")
    result["hypervisorFix"] = {
        "status": 200 if rh else 404,
        "available": bool(rh),
        "url": rh["url"] if rh else None,
        "file": rh["file"] if rh else None,
    }

    # Universal Unsteam (the desktop app's always-available "All-In-One" option).
    # Not per-game gated — it's a generic emulator applied like an online fix.
    result["unsteamFix"] = {
        "status": 200,
        "available": True,
        "url": UNSTEAM_AIO_URL,
    }

    # Full ryuu entry list so the UI can show EVERY fix/variant/version for the
    # game (not just the best pick per category) — lets the user match a fix to
    # their installed build.
    result["ryuuFixes"] = ry.get("all", [])

    return result


# ── WINEDLLOVERRIDES builder (port of the desktop fix_overlays.lua) ──────────
# Fix DLLs that are loader stubs Wine also ships -> native THEN builtin (n,b);
# everything else the fix ships is its own code -> native only (n).
# Proxy/loader-stub DLLs Wine also ships as builtins: a fix that drops one of
# these needs native-THEN-builtin ("n,b") so Wine loads the fix's copy first but
# still has its own for anything the fix doesn't implement. This list is broad on
# purpose (OnlineFix builds use many different proxy names) — safe because we only
# ever override DLLs the fix ACTUALLY shipped into the game folder.
_NATIVE_THEN_BUILTIN = {
    "winmm", "winhttp", "version", "dxgi", "dinput8", "dinput", "dwmapi",
    "dsound", "ddraw", "d3d8", "d3d9", "d3d10", "d3d11", "d3d12",
    "xinput1_1", "xinput1_2", "xinput1_3", "xinput1_4", "xinput9_1_0",
    "wininet", "msacm32", "wsock32", "iphlpapi",
}
# Fix-payload DLLs that ARE the fix's own code (replace the builtin entirely -> "n").
_FIX_CODE_DLLS = {
    "onlinefix64": "OnlineFix64", "onlinefix": "OnlineFix",
    "steamoverlay64": "SteamOverlay64", "steamoverlay": "SteamOverlay",
    "dnet": "dnet", "steam_api64": "steam_api64", "steam_api": "steam_api",
    "steamclient64": "steamclient64", "steamclient": "steamclient",
}
_KNOWN_FIX_DLLS = dict(_FIX_CODE_DLLS)
for _p in _NATIVE_THEN_BUILTIN:
    _KNOWN_FIX_DLLS.setdefault(_p, _p)


def _build_overrides(dll_names) -> str:
    seen = set()
    order = []
    for name in dll_names:
        base = str(name).lower()
        if base.endswith(".dll"):
            stem = base[:-4]
            if stem in _KNOWN_FIX_DLLS and stem not in seen:
                seen.add(stem)
                order.append(stem)
    if not order:
        return ""
    parts = []
    for stem in order:
        key = _KNOWN_FIX_DLLS[stem]
        parts.append(f"{key}=n,b" if stem in _NATIVE_THEN_BUILTIN else f"{key}=n")
    return 'WINEDLLOVERRIDES="' + ";".join(parts) + '"'


def _download_archive(client, download_url, dest_path, appid):
    """Download a fix archive with the SAME mechanism the desktop app uses:
    system curl, Steam runtime libs stripped, luatools User-Agent. ryuu.lol
    rejects other HTTP clients (401), so matching curl is required."""
    _set_fix_state(appid, {"status": "downloading", "bytesRead": 0, "totalBytes": 0, "error": None})
    curl = shutil.which("curl") or "curl"
    env = dict(os.environ)
    for k in ("LD_LIBRARY_PATH", "LD_PRELOAD", "LD_AUDIT",
              "STEAM_RUNTIME_LIBRARY_PATH", "STEAM_ZENITY"):
        env.pop(k, None)
    cmd = [curl, "-L", "--fail", "-A", USER_AGENT,
           "-e", "https://generator.ryuu.lol/fixes",
           "--connect-timeout", "15", "--max-time", "1800"]
    # ryuu gates fixes behind an account; the API key (X-Auth-Key) authorizes the
    # download. Only sent to ryuu's host, never leaked elsewhere.
    if "generator.ryuu.lol" in download_url:
        try:
            _rk = _settings.get_ryuu_key()
        except Exception:
            _rk = ""
        if _rk:
            cmd += ["-H", f"X-Auth-Key: {_rk}"]
    cmd += ["-o", dest_path, download_url]
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL,
                                stderr=subprocess.PIPE, env=env)
    except Exception as exc:
        raise RuntimeError(f"could not start curl: {exc}")
    while proc.poll() is None:
        if _get_fix_state(appid).get("status") == "cancelled":
            try:
                proc.kill()
            except Exception:
                pass
            raise RuntimeError("cancelled")
        try:
            sz = os.path.getsize(dest_path) if os.path.exists(dest_path) else 0
            _set_fix_state(appid, {"bytesRead": sz})
        except Exception:
            pass
        time.sleep(0.5)
    rc = proc.returncode
    try:
        err = (proc.stderr.read() or b"").decode("utf-8", "replace") if proc.stderr else ""
    except Exception:
        err = ""
    if rc != 0 or not os.path.exists(dest_path) or os.path.getsize(dest_path) == 0:
        hint = ""
        if "generator.ryuu.lol" in download_url:
            try:
                _hk = _settings.get_ryuu_key()
            except Exception:
                _hk = ""
            hint = (" — ryuu login required: set your ryuu API key in Settings."
                    if not _hk else
                    " — ryuu rejected the API key (expired, or your account lacks access to this fix).")
        raise RuntimeError(f"download failed (curl rc={rc}).{hint} {err[:180]}")
    size = os.path.getsize(dest_path)
    _set_fix_state(appid, {"bytesRead": size, "totalBytes": size})



def _bundled_7zz():
    """Path to the static 7zz we ship in defaults/bin (guaranteed extraction on
    distros without p7zip, e.g. Bazzite/CachyOS). Made executable on first use.
    Returns the path if usable, else None."""
    try:
        from .paths import defaults_path
        p = defaults_path(os.path.join("bin", "7zz"))
        if os.path.isfile(p):
            try:
                os.chmod(p, 0o755)
            except Exception:
                pass
            return p
    except Exception:
        pass
    return None

# A fix archive routinely ships a replacement for a file the game already has
# (steam_api64.dll is the classic one). Overwriting it used to be irreversible:
# un-fix deleted every path the log listed, so removing a fix that had REPLACED
# steam_api64.dll left the game with no steam_api64.dll at all -- unlaunchable,
# and only a Steam "verify integrity" got it back. Keep the original beside it
# so un-fix can put things back exactly as they were.
ORIG_SUFFIX = ".slsdeck-orig"


def _existing_case_rel(install_path: str, rel: str) -> str:
    """Use the on-disk spelling for path components that already exist.

    Fix archives are commonly assembled on Windows, where ``acshadows.exe``
    and ``ACShadows.exe`` name the same file.  Linux treats them as different
    files, so blindly using the archive spelling can leave the original beside
    a lower-case replacement that the game never launches.

    Exact matches always win.  A case-insensitive match is used only when it is
    unique; an ambiguous directory is left unchanged rather than guessing.
    """
    normalized = rel.replace("\\", "/")
    parts = [part for part in normalized.split("/") if part not in ("", ".")]
    resolved: List[str] = []
    current = install_path
    for part in parts:
        exact = os.path.join(current, part)
        chosen = part
        if not os.path.lexists(exact) and os.path.isdir(current):
            try:
                matches = [name for name in os.listdir(current)
                           if name.casefold() == part.casefold()]
            except OSError:
                matches = []
            if len(matches) == 1:
                chosen = matches[0]
        resolved.append(chosen)
        current = os.path.join(current, chosen)
    return "/".join(resolved)


def _stash_original(install_path: str, rel: str) -> bool:
    """Preserve a game file the fix is about to overwrite. Returns True when the
    target already existed, i.e. this is a replacement rather than a new file."""
    target = os.path.join(install_path, rel.replace("/", os.sep))
    if not os.path.isfile(target):
        return False
    backup = target + ORIG_SUFFIX
    # Never clobber an existing stash: a second fix applied over the first must
    # not overwrite the pristine original with the first fix's file.
    if not os.path.exists(backup):
        try:
            shutil.copy2(target, backup)
            chown_to_user(backup, recursive=False)
        except Exception as exc:
            logger.warn(f"SLSDeck: could not preserve original {rel}: {exc}")
            return False
    return True


def _extract_rar_fix(archive_path, install_path, appid, extracted=None, replaced=None):
    """Extract a .rar online fix (perondepot) using whatever archiver is on the
    Deck, then copy files into the game folder with safe-path checks.

    ``extracted``/``replaced`` are appended to in place so a cancel or crash
    mid-extraction still leaves the caller holding the list of what landed."""
    tmp = os.path.join(ensure_temp_download_dir(), f"fix_{appid}_rar")
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp, exist_ok=True)
    cmds = []
    _bz = _bundled_7zz()
    if _bz:
        cmds.append([_bz, "x", "-y", "-o" + tmp, archive_path])
    if shutil.which("bsdtar"):
        cmds.append(["bsdtar", "-xf", archive_path, "-C", tmp])
    for exe in ("7zz", "7z", "7za"):
        if shutil.which(exe):
            cmds.append([exe, "x", "-y", "-o" + tmp, archive_path])
    if shutil.which("unrar"):
        cmds.append(["unrar", "x", "-y", "-o+", archive_path, tmp + os.sep])
    ok = False
    for cmd in cmds:
        try:
            proc = subprocess.run(cmd, capture_output=True, timeout=300)
            if proc.returncode == 0 and any(os.scandir(tmp)):
                ok = True
                break
        except Exception:
            continue
    if not ok:
        raise RuntimeError("Could not extract .rar online fix (need bsdtar, 7z, or unrar)")
    extracted = [] if extracted is None else extracted
    replaced = [] if replaced is None else replaced
    for root, _dirs, files in os.walk(tmp):
        for fn in files:
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, tmp)
            if not _is_safe_path(install_path, rel):
                continue
            norm = _existing_case_rel(install_path, rel)
            if not _is_safe_path(install_path, norm):
                continue
            target = os.path.join(install_path, norm.replace("/", os.sep))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            if _stash_original(install_path, norm):
                replaced.append(norm)
            shutil.copy2(full, target)
            extracted.append(norm)
            if _get_fix_state(appid).get("status") == "cancelled":
                raise RuntimeError("cancelled")
    shutil.rmtree(tmp, ignore_errors=True)
    return extracted


def _extract_zip_fix(dest_zip, install_path, appid, extracted=None, replaced=None):
    extracted_files = [] if extracted is None else extracted
    replaced = [] if replaced is None else replaced
    with zipfile.ZipFile(dest_zip, "r") as archive:
        all_names = archive.namelist()
        appid_folder = f"{appid}/"
        top_level = {n.split("/")[0] for n in all_names if n.split("/")[0]}
        has_appid_root = (len(top_level) == 1 and str(appid) in top_level)
        for member in all_names:
            if member.endswith("/"):
                continue
            if has_appid_root:
                if not member.startswith(appid_folder) or member == appid_folder:
                    continue
                rel = member[len(appid_folder):]
            else:
                rel = member
            if not rel or not _is_safe_path(install_path, rel):
                continue
            norm = _existing_case_rel(install_path, rel)
            if not _is_safe_path(install_path, norm):
                continue
            target = os.path.join(install_path, norm.replace("/", os.sep))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            if _stash_original(install_path, norm):
                replaced.append(norm)
            with archive.open(member) as src, open(target, "wb") as out:
                shutil.copyfileobj(src, out)
            extracted_files.append(norm)
            if _get_fix_state(appid).get("status") == "cancelled":
                raise RuntimeError("cancelled")
    return extracted_files


# ── place the emulator payload next to the game's REAL executable ─────────────
# Many crack/online fixes ship the loose emulator files (steam_api64.dll,
# OnlineFix64.dll, OnlineFix.ini, …) at the archive root, which lands them in the
# game's install root. But Unreal Engine (and similar) titles run a nested
# executable — e.g. <Game>/Binaries/Win64/<Game>-Win64-Shipping.exe — and the
# DLL hijack only works when the files sit NEXT TO the process that loads
# steam_api. So after extracting we detect the main exe's directory and mirror
# the recognized fix files there.
_MIRROR_CONFIG_NAMES = {
    "onlinefix.ini", "onlinefix64.dll", "onlinefix.dll", "dlllist.txt",
    "steam_emu.ini", "valve.ini", "cream_api.ini", "coldclientloader.ini",
    "account_name.txt", "force_account_name.txt", "configs.user.ini",
    "unsteam.ini", "unsteam_api64.dll", "unsteam_api.dll", "steamclient_loader.ini",
    "local_save.txt", "steam_interfaces.txt",
}
_SKIP_EXE_DIRS = {
    "_commonredist", "commonredist", "directx", "dxsetup", "vcredist",
    "_redist", "redist", "prerequisites", "engine",
}


def _mirror_names() -> set:
    names = set(_MIRROR_CONFIG_NAMES)
    for stem in _KNOWN_FIX_DLLS:
        names.add(f"{stem}.dll")
    return names


def _find_main_exe_dir(install_path: str) -> Optional[str]:
    """Directory containing the game's primary Windows executable. Prefers an
    Unreal *-Shipping.exe under Binaries/Win64, else the largest .exe below the
    install root (skipping redist/prereq folders). Returns None if none found."""
    shipping: List[str] = []
    win64: List[str] = []
    other: List[tuple] = []  # (size, path)
    try:
        for root, dirs, files in os.walk(install_path):
            # prune obvious non-game dirs to keep the walk cheap
            dirs[:] = [d for d in dirs if d.lower() not in _SKIP_EXE_DIRS]
            low_root = root.replace("\\", "/").lower()
            for fn in files:
                if not fn.lower().endswith(".exe"):
                    continue
                full = os.path.join(root, fn)
                if fn.lower().endswith("-shipping.exe") or fn.lower().endswith("-win64-shipping.exe"):
                    shipping.append(full)
                elif "/binaries/win64" in low_root or "/binaries/win32" in low_root:
                    win64.append(full)
                else:
                    try:
                        other.append((os.path.getsize(full), full))
                    except Exception:
                        continue
    except Exception:
        return None
    if shipping:
        # deepest shipping exe (handles nested game folder)
        return os.path.dirname(sorted(shipping, key=len, reverse=True)[0])
    if win64:
        return os.path.dirname(sorted(win64, key=len, reverse=True)[0])
    if other:
        # largest .exe that isn't a tiny launcher/uninstaller
        other.sort(reverse=True)
        for _sz, path in other:
            base = os.path.basename(path).lower()
            if base.startswith(("unins", "setup", "vcredist", "dxsetup", "crashreport")):
                continue
            return os.path.dirname(path)
    return None


def find_main_exe(install_path: str) -> Dict[str, Any]:
    """Public: locate the game's real Windows executable so the UI can repoint
    Steam's launch target to it. Returns {success, exe, dir, isShipping}."""
    try:
        if not install_path or not os.path.isdir(install_path):
            return {"success": False, "error": "install path not found"}
        shipping: List[str] = []
        win64: List[str] = []
        other: List[tuple] = []
        for root, dirs, files in os.walk(install_path):
            dirs[:] = [d for d in dirs if d.lower() not in _SKIP_EXE_DIRS]
            low_root = root.replace("\\", "/").lower()
            for fn in files:
                if not fn.lower().endswith(".exe"):
                    continue
                full = os.path.join(root, fn)
                if fn.lower().endswith("-shipping.exe"):
                    shipping.append(full)
                elif "/binaries/win64" in low_root or "/binaries/win32" in low_root:
                    win64.append(full)
                else:
                    try:
                        other.append((os.path.getsize(full), full))
                    except Exception:
                        continue
        exe = ""
        is_shipping = False
        if shipping:
            exe = sorted(shipping, key=len, reverse=True)[0]
            is_shipping = True
        elif win64:
            exe = sorted(win64, key=len, reverse=True)[0]
        elif other:
            other.sort(reverse=True)
            for _sz, path in other:
                base = os.path.basename(path).lower()
                if base.startswith(("unins", "setup", "vcredist", "dxsetup", "crashreport", "launcher")):
                    continue
                exe = path
                break
        if not exe:
            return {"success": True, "exe": "", "dir": "", "isShipping": False}
        return {"success": True, "exe": exe, "dir": os.path.dirname(exe),
                "isShipping": is_shipping}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# Publisher launchers that MUST run for the game to work (they do entitlement /
# DRM init). Auto-repointing straight to the game exe bypasses them and breaks
# launch, so we exclude these from the automatic launch-target repoint.
_LAUNCHER_FILE_SIGNS = {
    # Ubisoft (Uplay / Ubisoft Connect)
    "ubisoftconnect.exe", "upc.exe", "uplay.exe", "uplayinstaller.exe",
    "ubisoftgamelauncher.exe", "ubisoftgamelauncher64.exe",
    "uplay_r1_loader.dll", "uplay_r1_loader64.dll", "uplay_r2_loader.dll",
    "uplay_r2_loader64.dll",
    # EA (Origin / EA App / EA Desktop)
    "eabootstrapper.exe", "ealaunchhelper.exe", "eadesktop.exe", "origin.exe",
    "easteamproxy.exe", "eacore.ini", "link2ea.exe", "activation.exe",
    "eaanticheat.gameservicelauncher.exe",
    # Rockstar (Social Club / Rockstar Launcher)
    "rockstarservice.exe", "socialclubhelper.exe", "playgtav.exe",
    "gtavlauncher.exe", "rockstarsteamhelper.exe", "launcher.exe",
}
_LAUNCHER_DIR_SIGNS = (
    "ubisoft game launcher", "__installer", "social club", "rockstar games launcher",
)


def _is_launcher_publisher_game(install_path: str) -> bool:
    """Heuristic: does this game ship a Ubisoft/EA/Rockstar launcher that must run
    first? Detected by signature launcher files/dirs in the install tree."""
    try:
        for root, dirs, files in os.walk(install_path):
            low_root = root.replace("\\", "/").lower()
            if any(sig in low_root for sig in _LAUNCHER_DIR_SIGNS):
                return True
            for fn in files:
                if fn.lower() in _LAUNCHER_FILE_SIGNS:
                    return True
    except Exception:
        return False
    return False


def _repoint_target(install_path: str, extracted_files: List[str]) -> str:
    """Exe to auto-repoint the launch target to (a fix's shipped exe) — but NOT
    for Ubisoft/EA/Rockstar launcher games, where the launcher must run first."""
    exe = _fix_shipped_exe(install_path, extracted_files)
    if exe and _is_launcher_publisher_game(install_path):
        logger.log("SLSDeck: skipping auto launch-repoint (Ubisoft/EA/Rockstar "
                   "launcher game — launcher must run first)")
        return ""
    return exe


def _fix_shipped_exe(install_path: str, extracted_files: List[str]) -> str:
    """If the fix archive shipped a replacement executable (e.g. a cracked
    *-Shipping.exe), return its absolute path so the launch target can be
    repointed to it. Prefers a shipping-named exe, then one under Binaries/Win64,
    then any .exe. Returns "" if the fix shipped no exe."""
    shipping = ""
    win64 = ""
    any_exe = ""
    for rel in extracted_files:
        low = rel.lower()
        if not low.endswith(".exe"):
            continue
        full = os.path.join(install_path, rel.replace("/", os.sep))
        if low.endswith("-shipping.exe"):
            shipping = shipping or full
        elif "/binaries/win64" in ("/" + low) or "/binaries/win32" in ("/" + low):
            win64 = win64 or full
        else:
            any_exe = any_exe or full
    return shipping or win64 or any_exe or ""


def _mirror_fix_to_exe_dir(install_path: str, extracted_files: List[str],
                           replaced_files: List[str]) -> List[str]:
    """Copy recognized loose emulator files to the main exe's folder if they were
    extracted somewhere else. Returns the list of newly-created rel paths (added
    to the fix log so un-fix removes them)."""
    exe_dir = _find_main_exe_dir(install_path)
    if not exe_dir:
        return []
    exe_dir_abs = os.path.abspath(exe_dir)
    root_abs = os.path.abspath(install_path)
    if exe_dir_abs == root_abs:
        return []  # flat game — files are already next to the exe
    names = _mirror_names()
    added: List[str] = []
    for rel in list(extracted_files):
        base = os.path.basename(rel).lower()
        if base not in names:
            continue
        src = os.path.join(install_path, rel.replace("/", os.sep))
        if not os.path.isfile(src):
            continue
        cur_dir = os.path.abspath(os.path.dirname(src))
        if cur_dir == exe_dir_abs:
            continue  # already beside the exe
        proposed_rel = os.path.join(
            os.path.relpath(exe_dir_abs, install_path), os.path.basename(rel)
        ).replace("\\", "/")
        dst_rel = _existing_case_rel(install_path, proposed_rel)
        if not _is_safe_path(install_path, dst_rel):
            continue
        dst = os.path.join(install_path, dst_rel.replace("/", os.sep))
        try:
            if _stash_original(install_path, dst_rel):
                replaced_files.append(dst_rel)
            shutil.copy2(src, dst)
            if dst_rel not in extracted_files and dst_rel not in added:
                added.append(dst_rel)
        except Exception as exc:
            logger.warn(f"SLSDeck: could not mirror {rel} to exe dir: {exc}")
    if added:
        extracted_files.extend(added)
        logger.log(f"SLSDeck: mirrored {len(added)} fix file(s) next to the game exe "
                   f"({os.path.basename(exe_dir_abs)})")
    return added


def _resolve_online_username() -> str:
    """Manual setting wins; else the logged-in Steam display name; else ''."""
    try:
        manual = _settings.get_online_username()
    except Exception:
        manual = ""
    if manual:
        return manual
    try:
        return resolve_persona_name()
    except Exception:
        return ""


def _set_ini_key(path: str, section: str, key: str, value: str) -> bool:
    """Set key=value under [section] in an INI file, only if that section (and,
    for OnlineFix, the key) already exists. Returns True if written."""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            lines = fh.read().splitlines()
    except Exception:
        return False
    sec_l = section.lower()
    in_sec = False
    found_key = False
    out = []
    for ln in lines:
        st = ln.strip()
        if st.startswith("[") and st.endswith("]"):
            in_sec = st[1:-1].strip().lower() == sec_l
            out.append(ln)
            continue
        if in_sec and "=" in ln and ln.split("=", 1)[0].strip().lower() == key.lower():
            out.append(f"{key}={value}")
            found_key = True
            continue
        out.append(ln)
    if not found_key:
        return False
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(out) + "\n")
        return True
    except Exception:
        return False


def _apply_online_username(install_path: str, extracted_files: List[str]) -> List[str]:
    """Write the player name into any recognized emulator config the fix shipped.
    Content-driven + edit-only: matches specific basenames and validates the
    section/key before writing, so non-online fixes (Denuvo, plain crack) are
    untouched. All targets are already in extracted_files -> un-fix cleans them."""
    name = _resolve_online_username()
    if not name:
        return []
    changed: List[str] = []
    for rel in extracted_files:
        full = os.path.join(install_path, rel.replace("/", os.sep))
        base = os.path.basename(rel).lower()
        try:
            if base in ("account_name.txt", "force_account_name.txt"):
                with open(full, "w", encoding="utf-8") as fh:
                    fh.write(name + "\n")
                changed.append(rel)
            elif base == "configs.user.ini":
                if _set_ini_key(full, "user::general", "account_name", name):
                    changed.append(rel)
            elif base == "onlinefix.ini":
                if _set_ini_key(full, "Settings", "AccountName", name):
                    changed.append(rel)
            elif base == "unsteam.ini":
                # unsteam uses AccountName under a [Settings]/[User] block when present
                if _set_ini_key(full, "Settings", "AccountName", name) or \
                   _set_ini_key(full, "User", "AccountName", name):
                    changed.append(rel)
        except Exception as exc:
            logger.warn(f"SLSDeck: username write skipped for {rel}: {exc}")
    if changed:
        logger.log(f"SLSDeck: set online-fix username '{name}' in {len(changed)} file(s)")
    return changed


def _fix_log_path(install_path: str, appid: int) -> str:
    return os.path.join(install_path, f"luatools-fix-log-{appid}.log")


def _write_fix_log(install_path, appid, game_name, fix_type, download_url,
                   extracted_files, replaced_files=None, partial="") -> None:
    """Append a [FIX] block recording what this fix put on disk.

    ``Replaced:`` lists the subset of ``Files:`` that overwrote a file the game
    already had; un-fix restores those from their .slsdeck-orig copies instead
    of deleting them. Older logs have no Replaced section and simply parse as
    "everything was newly created", which is what the old behaviour assumed."""
    log_path = _fix_log_path(install_path, appid)
    replaced_set = set(replaced_files or [])
    try:
        existing = ""
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8") as fh:
                existing = fh.read()
        tmp = f"{log_path}.tmp.{os.getpid()}"
        with open(tmp, "w", encoding="utf-8") as fh:
            if existing:
                fh.write(existing)
                if not existing.endswith("\n"):
                    fh.write("\n")
                fh.write("\n---\n\n")
            fh.write("[FIX]\n")
            fh.write(f'Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
            fh.write(f'Game: {game_name or f"Unknown Game ({appid})"}\n')
            fh.write(f"Fix Type: {fix_type}\n")
            fh.write(f"Download URL: {download_url}\n")
            if partial:
                fh.write(f"Partial: {partial}\n")
            fh.write("Files:\n")
            for fitem in extracted_files:
                fh.write(f"{fitem}\n")
            if replaced_set:
                fh.write("Replaced:\n")
                for fitem in extracted_files:
                    if fitem in replaced_set:
                        fh.write(f"{fitem}\n")
            fh.write("[/FIX]\n")
            fh.flush()
            try:
                os.fsync(fh.fileno())
            except Exception:
                pass
        os.replace(tmp, log_path)
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to write fix log: {exc}")


def _download_and_extract_fix(appid, download_url, install_path, fix_type, game_name="", no_pin=False):
    client = ensure_http_client("SLSDeck: fix download")
    is_rar = download_url.lower().split("?")[0].endswith(".rar")
    dest_zip = os.path.join(
        ensure_temp_download_dir(), f"fix_{appid}{'.rar' if is_rar else '.zip'}"
    )
    # Filled in place by the extractor. Keeping the lists out here is what makes
    # a cancelled extraction recoverable: the files already written to the game
    # folder are still known to us, so the log below can record them and un-fix
    # can clean them up. Previously the log was only written on success, so a
    # cancel left files behind that un-fix reported "No fix log found" for --
    # permanently unremovable.
    extracted_files: List[str] = []
    replaced_files: List[str] = []
    try:
        _download_archive(client, download_url, dest_zip, appid)
        _set_fix_state(appid, {"status": "extracting"})
        if is_rar:
            _extract_rar_fix(dest_zip, install_path, appid, extracted_files, replaced_files)
        else:
            _extract_zip_fix(dest_zip, install_path, appid, extracted_files, replaced_files)

        # Emulator DLLs only hijack when they sit next to the process that loads
        # steam_api — for UE/nested games that's Binaries/Win64/<Game>-Shipping.exe,
        # not the install root. Mirror the loose fix files there.
        try:
            _mirror_fix_to_exe_dir(install_path, extracted_files, replaced_files)
        except Exception as exc:
            logger.warn(f"SLSDeck: exe-dir mirror step failed: {exc}")

        # Patch unsteam.ini <appid> placeholder for online fixes
        if fix_type.lower() == "online fix (unsteam)":
            for rel in extracted_files:
                if rel.lower().endswith("unsteam.ini"):
                    ini_full = os.path.join(install_path, rel.replace("/", os.sep))
                    try:
                        with open(ini_full, "r", encoding="utf-8", errors="ignore") as fh:
                            contents = fh.read()
                        updated = contents.replace("<appid>", str(appid))
                        if updated != contents:
                            with open(ini_full, "w", encoding="utf-8") as fh:
                                fh.write(updated)
                    except Exception as exc:
                        logger.warn(f"SLSDeck: Failed to patch unsteam.ini: {exc}")
                    break

        # Set the player username in any online-fix emulator config the archive
        # shipped (content-driven: only edits recognized files; Denuvo/crack fixes
        # have none, so this is a silent no-op for them).
        try:
            _apply_online_username(install_path, extracted_files)
        except Exception as exc:
            logger.warn(f"SLSDeck: online-fix username step failed: {exc}")


        _write_fix_log(install_path, appid, game_name, fix_type, download_url,
                       extracted_files, replaced_files)
        log_path = _fix_log_path(install_path, appid)

        # We run as root (Decky root flag); hand the extracted fix files + log
        # back to the desktop user so Steam can still verify/update the game.
        for rel in extracted_files:
            chown_to_user(os.path.join(install_path, rel.replace("/", os.sep)), recursive=False)
        chown_to_user(log_path, recursive=False)

        overrides = _build_overrides([os.path.basename(x) for x in extracted_files])
        # Version-lock: pin the game to its current depot manifests so a game
        # update can't silently break a version-specific fix.
        pin_warning = ""
        try:
            # Auto-pin only for build-SPECIFIC fixes (ryuu crack/online,
            # perondepot online, luatools, Denuvo). The Unsteam AIO is a
            # universal emulator that works on any build, so pinning the version
            # would be pointless (and could block wanted updates) — skip it.
            _ft = (fix_type or "").lower()
            _universal = ("unsteam" in _ft) or ("universal" in _ft)
            # no_pin: the Archive's reconcile re-applies a fix to satisfy a
            # template that ALREADY owns the pin. Letting the fix re-pin here
            # would have it fight the active build for control of the manifest.
            if _settings.get_pin_on_fix() and not _universal and not no_pin:
                # Build-accurate pin: resolve a manifest .lua (lua.tools if signed
                # in → Hubcap key → ~/Downloads/<appid>.lua) and pin to its
                # setManifestid build. If none is available (build-agnostic fix
                # like Binding of Isaac), _apply_pin falls back to the installed
                # build so the game is still locked from updating.
                pin = _apply_pin(int(appid))
                if pin.get("pinned"):
                    logger.log(f"SLSDeck: version-locked {appid} to the "
                               f"{'installed' if pin.get('fellBack') else 'fix'} build "
                               f"(source: {pin.get('source', 'current')})")
                elif pin.get("unsupported"):
                    pin_warning = (
                        "Fix applied, but this game could not be version-locked "
                        "(needs the slsteam-moon engine). A Steam update to the game "
                        "may undo the fix.")
                    logger.warn(f"SLSDeck: manifest pin on fix failed: {pin}")
                elif not pin.get("success"):
                    pin_warning = (
                        "Fix applied, but this game could not be version-locked "
                        f"({pin.get('error') or 'no build to pin'}). A Steam update "
                        "to the game may undo the fix.")
                    logger.warn(f"SLSDeck: manifest pin on fix failed: {pin}")
        except Exception as exc:
            pin_warning = ("Fix applied, but version-locking failed "
                           f"({exc}). A Steam update to the game may undo the fix.")
            logger.warn(f"SLSDeck: manifest pin on fix failed: {exc}")
        _set_fix_state(appid, {"status": "done", "success": True, "overrides": overrides,
                               "warning": pin_warning,
                               "repointExe": _repoint_target(install_path, extracted_files)})
        try:
            os.remove(dest_zip)
        except Exception:
            pass
    except Exception as exc:
        cancelled = str(exc) == "cancelled"
        # Record whatever made it onto disk before we stopped, so the user can
        # actually un-fix it. Without this the files are orphaned forever.
        if extracted_files:
            try:
                _write_fix_log(install_path, appid, game_name, fix_type, download_url,
                               extracted_files, replaced_files,
                               partial=("cancelled" if cancelled else "failed"))
                chown_to_user(_fix_log_path(install_path, appid), recursive=False)
                for rel in extracted_files:
                    chown_to_user(os.path.join(install_path, rel.replace("/", os.sep)),
                                  recursive=False)
            except Exception as log_exc:
                logger.warn(f"SLSDeck: could not record partial fix: {log_exc}")
        try:
            if os.path.exists(dest_zip):
                os.remove(dest_zip)
        except Exception:
            pass
        if cancelled:
            _set_fix_state(appid, {
                "status": "cancelled", "success": False, "error": "Cancelled by user",
                "partialFiles": len(extracted_files),
                "warning": (f"Cancelled after {len(extracted_files)} file(s) were already "
                            "written. Use Un-fix to remove them." if extracted_files else "")})
            return
        logger.warn(f"SLSDeck: Failed to apply fix: {exc}")
        _set_fix_state(appid, {
            "status": "failed", "error": str(exc),
            "partialFiles": len(extracted_files),
            "warning": (f"{len(extracted_files)} file(s) were written before the failure. "
                        "Use Un-fix to remove them." if extracted_files else "")})


def _pin_to_build(appid: int, manifest_id: str, depot_id: str) -> Dict[str, Any]:
    """Pin a game to a specific build. Prefer the exact depot→manifest gid the
    catalog gave us; fall back to the layered pin-source resolver."""
    try:
        if manifest_id and str(depot_id or "").isdigit():
            return slssteam.pin_app_gids(int(appid), {int(depot_id): str(manifest_id)}) or {}
    except Exception as exc:
        logger.warn(f"SLSDeck: explicit pin failed for {appid}: {exc}")
    try:
        return pinsource.auto_pin_from_source(appid) or {}
    except Exception:
        return {}


def _apply_pin(appid: int, prefer_gids: Optional[Dict[int, str]] = None) -> Dict[str, Any]:
    """Version-lock a fixed game, with a current-build fallback.

    Order: (1) the exact depot→gid map the fix names (setManifestid / catalog);
    (2) the layered pin-source resolver (Hubcap / ~/Downloads lua); (3) if neither
    yields a build-specific manifest — as with a build-agnostic fix like Binding
    of Isaac — pin the CURRENTLY-INSTALLED build so Steam still can't update past
    the version the fix was applied to. Only the engine truly lacking a pin key
    (`unsupported`) skips the fallback.

    Returns a dict with a reliable ``pinned`` bool (True only when depots were
    actually written), plus ``fellBack`` when it used the installed build.
    """
    def _did_pin(r: Dict[str, Any]) -> bool:
        # pin_app_gids reports success (+depots); auto_pin_from_source sets pinned.
        return bool(r.get("pinned")) or bool(r.get("success") and r.get("depots"))

    r: Dict[str, Any] = {}
    try:
        if prefer_gids:
            r = dict(slssteam.pin_app_gids(int(appid), prefer_gids) or {})
        else:
            r = dict(pinsource.auto_pin_from_source(appid) or {})
    except Exception as exc:
        logger.warn(f"SLSDeck: build-specific pin failed for {appid}: {exc}")
        r = {"success": False, "error": str(exc)}
    if _did_pin(r):
        r["pinned"] = True
        return r
    if r.get("unsupported"):
        return r  # engine has no pin key at all — a current-build pin can't work
    # fall back to the installed build (build-agnostic fix)
    try:
        cur = dict(slssteam.pin_app_current(appid) or {})
    except Exception as exc:
        return {"success": False, "pinned": False, "error": str(exc)}
    cur["pinned"] = bool(cur.get("success"))
    cur["fellBack"] = True
    return cur


def _download_and_extract_luatools_fix(appid, fix_id, manifest_id, depot_id,
                                       install_path, fix_type, game_name=""):
    """Apply a lua.tools catalog fix: the payload is account-gated, so we fetch
    the bytes through the authenticated client (Bearer) rather than curl, then
    extract + log + pin exactly like a normal fix."""
    extracted_files: List[str] = []
    replaced_files: List[str] = []
    dest_zip = os.path.join(ensure_temp_download_dir(), f"fix_lt_{appid}.zip")
    try:
        _set_fix_state(appid, {"status": "downloading", "bytesRead": 0, "totalBytes": 0, "error": None})
        dl = luatools.download_fix(str(fix_id), appid=int(appid), build=str(manifest_id or ""))
        data = dl.get("data") if isinstance(dl, dict) else None
        if not data:
            detail = (dl.get("error") if isinstance(dl, dict) else "") or "unknown error"
            raise RuntimeError(f"lua.tools fix download failed: {detail}")
        with open(dest_zip, "wb") as fh:
            fh.write(data)
        _set_fix_state(appid, {"bytesRead": len(data), "totalBytes": len(data), "status": "extracting"})
        # lua.tools ships fixes as zips; if a bare .lua ever comes back, treat it
        # as a manifest pin only (no files to extract into the game folder).
        is_zip = data[:2] == b"PK"
        if is_zip:
            _extract_zip_fix(dest_zip, install_path, appid, extracted_files, replaced_files)
            # Mirror loose emulator files next to the game's real (often nested) exe.
            try:
                _mirror_fix_to_exe_dir(install_path, extracted_files, replaced_files)
            except Exception as exc:
                logger.warn(f"SLSDeck: exe-dir mirror step failed: {exc}")
            try:
                _apply_online_username(install_path, extracted_files)
            except Exception as exc:
                logger.warn(f"SLSDeck: online-fix username step failed: {exc}")
        # Build-accurate pin: prefer THIS fix's paired manifest (slot=manifest),
        # which names the exact build the fix targets. Fall back to a setManifestid
        # in the payload if it was a bare .lua.
        pin_from_lua = None
        try:
            mtext = luatools.download_fix_manifest(str(fix_id), int(appid))
            if mtext:
                gids = pinsource.parse_setmanifestid(mtext)
                pin_from_lua = gids or None
        except Exception as exc:
            logger.warn(f"SLSDeck: fix manifest fetch failed: {exc}")
        if not pin_from_lua and not is_zip:
            try:
                gids = pinsource.parse_setmanifestid(data.decode("utf-8", "ignore"))
                pin_from_lua = gids or None
            except Exception:
                pin_from_lua = None

        _write_fix_log(install_path, appid, game_name, fix_type,
                       f"lua.tools:fix/{fix_id}", extracted_files, replaced_files)
        log_path = _fix_log_path(install_path, appid)
        for rel in extracted_files:
            chown_to_user(os.path.join(install_path, rel.replace("/", os.sep)), recursive=False)
        chown_to_user(log_path, recursive=False)
        overrides = _build_overrides([os.path.basename(x) for x in extracted_files])

        # Version-lock to the fix's exact build (catalog manifest_id/depot_id, or
        # a setManifestid harvested from a .lua payload).
        pin_warning = ""
        try:
            if _settings.get_pin_on_fix():
                # Prefer the fix's exact build (setManifestid, else catalog
                # depot/manifest); _apply_pin falls back to the installed build
                # when the fix is build-agnostic (e.g. Binding of Isaac).
                prefer = pin_from_lua
                if not prefer and manifest_id and str(depot_id or "").isdigit():
                    prefer = {int(depot_id): str(manifest_id)}
                pin = _apply_pin(int(appid), prefer)
                if pin.get("pinned"):
                    logger.log(f"SLSDeck: version-locked {appid} to the "
                               f"{'installed' if pin.get('fellBack') else 'lua.tools fix'} build")
                elif pin.get("unsupported"):
                    pin_warning = ("Fix applied, but version-locking needs the "
                                   "slsteam-moon engine. A game update may undo the fix.")
                else:
                    pin_warning = ("Fix applied, but this game could not be version-locked "
                                   f"({pin.get('error') or 'no build to pin'}). A game update may undo it.")
        except Exception as exc:
            pin_warning = f"Fix applied, but version-locking failed ({exc})."
            logger.warn(f"SLSDeck: lua.tools pin failed: {exc}")

        _set_fix_state(appid, {"status": "done", "success": True, "overrides": overrides,
                               "warning": pin_warning,
                               "repointExe": _repoint_target(install_path, extracted_files)})
        try:
            os.remove(dest_zip)
        except Exception:
            pass
    except Exception as exc:
        cancelled = str(exc) == "cancelled"
        if extracted_files:
            try:
                _write_fix_log(install_path, appid, game_name, fix_type,
                               f"lua.tools:fix/{fix_id}", extracted_files, replaced_files,
                               partial=("cancelled" if cancelled else "failed"))
                chown_to_user(_fix_log_path(install_path, appid), recursive=False)
            except Exception as log_exc:
                logger.warn(f"SLSDeck: could not record partial lua.tools fix: {log_exc}")
        try:
            if os.path.exists(dest_zip):
                os.remove(dest_zip)
        except Exception:
            pass
        if cancelled:
            _set_fix_state(appid, {"status": "cancelled", "success": False,
                                   "error": "Cancelled by user"})
            return
        logger.warn(f"SLSDeck: Failed to apply lua.tools fix: {exc}")
        _set_fix_state(appid, {"status": "failed", "error": str(exc)})


def apply_luatools_fix(appid, fix_id, install_path, manifest_id="", depot_id="",
                       fix_type="lua.tools fix", game_name="") -> Dict[str, Any]:
    """Apply a fix chosen from the lua.tools catalog (account-gated)."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    if not str(fix_id or "").strip():
        return {"success": False, "error": "Missing fix id"}
    if not install_path or not os.path.exists(install_path):
        return {"success": False, "error": "Install path does not exist"}
    if not luatools.is_authed():
        return {"success": False, "error": "Sign in with Discord to apply lua.tools fixes"}
    _set_fix_state(appid, {"status": "queued", "bytesRead": 0, "totalBytes": 0, "error": None})
    threading.Thread(
        target=_download_and_extract_luatools_fix,
        args=(appid, str(fix_id).strip(), str(manifest_id or ""), str(depot_id or ""),
              install_path, fix_type, game_name),
        daemon=True,
    ).start()
    return {"success": True}


def apply_game_fix(appid, download_url, install_path, fix_type="", game_name="", no_pin=False) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    if not download_url or not install_path:
        return {"success": False, "error": "Missing download URL or install path"}
    if not os.path.exists(install_path):
        return {"success": False, "error": "Install path does not exist"}
    _set_fix_state(appid, {"status": "queued", "bytesRead": 0, "totalBytes": 0, "error": None})
    threading.Thread(
        target=_download_and_extract_fix,
        args=(appid, download_url, install_path, fix_type, game_name, no_pin),
        daemon=True,
    ).start()
    return {"success": True}


def get_apply_fix_status(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    return {"success": True, "state": _get_fix_state(appid)}


def cancel_apply_fix(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    state = _get_fix_state(appid)
    if not state or state.get("status") in {"done", "failed"}:
        return {"success": True, "message": "Nothing to cancel"}
    _set_fix_state(appid, {"status": "cancelled", "success": False, "error": "Cancelled by user"})
    return {"success": True}


def _parse_fix_log(log_content: str, appid: int, game_name: str, install_path: str) -> List[Dict[str, Any]]:
    fixes: List[Dict[str, Any]] = []
    blocks = log_content.split("[FIX]") if "[FIX]" in log_content else [log_content]
    for block in blocks:
        if not block.strip():
            continue
        fix = {
            "appid": appid, "gameName": game_name, "installPath": install_path,
            "date": "", "fixType": "", "downloadUrl": "", "filesCount": 0, "files": [],
            "replaced": [], "partial": "",
        }
        in_files = False
        in_replaced = False
        for raw in block.split("\n"):
            line = raw.strip()
            if line in ("[/FIX]", "---"):
                break
            if line.startswith("Date:"):
                fix["date"] = line[len("Date:"):].strip()
            elif line.startswith("Game:"):
                nm = line[len("Game:"):].strip()
                if nm and nm != f"Unknown Game ({appid})":
                    fix["gameName"] = nm
            elif line.startswith("Fix Type:"):
                fix["fixType"] = line[len("Fix Type:"):].strip()
            elif line.startswith("Download URL:"):
                fix["downloadUrl"] = line[len("Download URL:"):].strip()
            elif line.startswith("Partial:"):
                fix["partial"] = line[len("Partial:"):].strip()
            elif line == "Files:":
                in_files, in_replaced = True, False
            elif line == "Replaced:":
                in_files, in_replaced = False, True
            elif in_replaced and line:
                fix["replaced"].append(line)
            elif in_files and line:
                fix["files"].append(line)
        fix["filesCount"] = len(fix["files"])
        if fix["date"]:
            fixes.append(fix)
    return fixes


def _unfix_worker(appid: int, install_path: str, fix_date: Optional[str],
                  preserve_unlockers: bool = False):
    try:
        log_path = os.path.join(install_path, f"luatools-fix-log-{appid}.log")
        if not os.path.exists(log_path):
            _set_unfix_state(appid, {"status": "failed", "error": "No fix log found"})
            return
        _set_unfix_state(appid, {"status": "removing", "progress": "Reading log..."})
        with open(log_path, "r", encoding="utf-8") as fh:
            content = fh.read()

        files_to_delete = set()
        files_to_restore = set()
        remaining_fixes = []
        blocks = content.split("[FIX]") if "[FIX]" in content else [content]
        multi = "[FIX]" in content
        for block in blocks:
            if not block.strip():
                continue
            block_date = None
            in_files = False
            in_replaced = False
            block_lines = []
            block_files = []
            block_replaced = []
            for raw in block.split("\n"):
                line = raw.strip()
                if line in ("[/FIX]", "---"):
                    break
                if line.startswith("Date:"):
                    block_date = line[len("Date:"):].strip()
                block_lines.append(raw)
                if line == "Files:":
                    in_files, in_replaced = True, False
                elif line == "Replaced:":
                    in_files, in_replaced = False, True
                elif in_replaced and line:
                    block_replaced.append(line)
                elif in_files and line:
                    block_files.append(line)
            if fix_date is None or (block_date and block_date == fix_date):
                # A file this fix REPLACED gets its original put back; only files
                # the fix actually created are deleted. Deleting a replaced file
                # is what used to leave games unlaunchable.
                replaced_here = set(block_replaced)
                files_to_restore |= replaced_here
                files_to_delete |= (set(block_files) - replaced_here)
            if multi and fix_date is not None and block_date and block_date != fix_date:
                remaining_fixes.append("[FIX]\n" + "\n".join(block_lines) + "\n[/FIX]")

        # Fixes layer. If fix A CREATED x.dll and fix B later replaced it, the
        # stash next to x.dll holds fix A's copy, not something the game shipped.
        # Removing both fixes must therefore delete x.dll rather than "restore"
        # a file the game never had. Created wins over replaced; the delete loop
        # cleans up the stash. Removing only fix B still restores fix A's copy,
        # because then no processed block lists x.dll as created.
        files_to_restore -= files_to_delete

        _set_unfix_state(appid, {"status": "removing",
                                 "progress": f"Removing {len(files_to_delete)} files, "
                                             f"restoring {len(files_to_restore)}..."})
        deleted = 0
        restored = 0
        for rel in sorted(files_to_restore):
            try:
                # The log is plain text and could be hand-edited; only ever touch
                # paths that resolve back inside the game's install dir.
                if not _is_safe_path(install_path, rel):
                    logger.warn(f"SLSDeck: refusing to restore out-of-tree path: {rel}")
                    continue
                full = os.path.join(install_path, rel.replace("/", os.sep))
                backup = full + ORIG_SUFFIX
                if os.path.isfile(backup):
                    os.replace(backup, full)
                    chown_to_user(full, recursive=False)
                    restored += 1
                elif os.path.exists(full):
                    # Log says we replaced it but the original is gone (older fix
                    # applied before backups existed, or the user removed it).
                    # Leaving the fix's file in place keeps the game launchable,
                    # which is strictly better than deleting it.
                    logger.warn(f"SLSDeck: no saved original for {rel}; leaving the "
                                "fix's copy in place so the game still launches")
            except Exception as exc:
                logger.warn(f"SLSDeck: Failed to restore {rel}: {exc}")

        for rel in sorted(files_to_delete):
            try:
                if not _is_safe_path(install_path, rel):
                    logger.warn(f"SLSDeck: refusing to delete out-of-tree path: {rel}")
                    continue
                full = os.path.join(install_path, rel.replace("/", os.sep))
                if os.path.exists(full):
                    os.remove(full)
                    deleted += 1
                # Clean up a stray stash if one exists for a created file.
                try:
                    if os.path.isfile(full + ORIG_SUFFIX):
                        os.remove(full + ORIG_SUFFIX)
                except Exception:
                    pass
            except Exception as exc:
                logger.warn(f"SLSDeck: Failed to delete {rel}: {exc}")

        if remaining_fixes:
            staged_log = log_path + ".slsdeck-new"
            with open(staged_log, "w", encoding="utf-8") as fh:
                fh.write("\n\n---\n\n".join(remaining_fixes))
            os.replace(staged_log, log_path)
        else:
            try:
                os.remove(log_path)
            except FileNotFoundError:
                pass
            except Exception as exc:
                raise RuntimeError(f"Fix files were reverted, but the fix record could not be removed: {exc}")

        # The FIXED/ONLINE FIX badges are derived from this log. Never report a
        # successful unfix while the selected record is still present, or every
        # UI surface will correctly recreate a badge for a fix that looked gone.
        if os.path.isfile(log_path):
            with open(log_path, "r", encoding="utf-8") as handle:
                remaining_content = handle.read()
            remaining_records = _parse_fix_log(
                remaining_content, appid, f"AppID {appid}", install_path
            )
            if fix_date is None or any(str(item.get("date") or "") == fix_date for item in remaining_records):
                raise RuntimeError("Fix files were reverted, but the fix record is still present.")

        if not preserve_unlockers:
            # Also strip any SmokeAPI DLC-unlock proxy (restore the original
            # steam_api dll) so normal un-fix fully reverts the game.
            try:
                from . import smokeapi
                smokeapi.remove(install_path)
            except Exception as exc:
                logger.warn(f"SLSDeck: SmokeAPI removal on unfix failed: {exc}")
            # Also strip any CreamAPI / Uplay R1 / R2 DLC unlocker.
            try:
                from . import dlcunlockers
                dlcunlockers.remove_all(install_path)
            except Exception as exc:
                logger.warn(f"SLSDeck: DLC unlocker removal on unfix failed: {exc}")

        # Version-unlock: un-fix ALWAYS unpins the game's manifest so Steam can
        # update it again (the button is "Un-fix and unpin"). Best-effort.
        unpinned = False
        try:
            slssteam.purge_pins_for_app(appid)
            unpinned = True
        except Exception as exc:
            logger.warn(f"SLSDeck: manifest unpin on unfix failed: {exc}")
        _set_unfix_state(appid, {"status": "done", "success": True, "filesRemoved": deleted,
                                 "filesRestored": restored, "unpinned": unpinned})
    except Exception as exc:
        logger.warn(f"SLSDeck: Un-fix failed: {exc}")
        _set_unfix_state(appid, {"status": "failed", "error": str(exc)})


def unfix_game(appid, install_path="", fix_date="") -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    resolved = install_path
    if not resolved:
        result = get_game_install_path_response(appid)
        if not result.get("success") or not result.get("installPath"):
            return {"success": False, "error": "Could not find game install path"}
        resolved = result["installPath"]
    if not os.path.exists(resolved):
        return {"success": False, "error": "Install path does not exist"}
    if not _reserve_unfix(appid):
        return {"success": False, "busy": True, "error": "An un-fix is already running"}
    threading.Thread(target=_unfix_worker, args=(appid, resolved, fix_date or None), daemon=True).start()
    return {"success": True}


def unfix_game_sync(appid, install_path="", fix_date="",
                    preserve_unlockers: bool = False) -> Dict[str, Any]:
    """Serialized synchronous un-fix for an already-backgrounded lifecycle RPC.

    Snapshot transitions run in their own dedicated executor. This entry point
    shares the same reservation gate and state reporting as the user-facing
    asynchronous operation, so the two can never restore/delete files at once.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    resolved = install_path
    if not resolved:
        result = get_game_install_path_response(appid)
        if not result.get("success") or not result.get("installPath"):
            return {"success": False, "error": "Could not find game install path"}
        resolved = result["installPath"]
    if not os.path.exists(resolved):
        return {"success": False, "error": "Install path does not exist"}
    if not _reserve_unfix(appid):
        return {"success": False, "busy": True, "error": "An un-fix is already running"}
    _unfix_worker(appid, resolved, fix_date or None, bool(preserve_unlockers))
    state = _get_unfix_state(appid)
    return {"success": state.get("status") == "done", "state": state,
            "error": state.get("error")}


def get_unfix_status(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    return {"success": True, "state": _get_unfix_state(appid)}


def get_installed_fixes() -> Dict[str, Any]:
    try:
        installed = []
        for game in list_installed_games():
            appid = game["appid"]
            install_path = game["installPath"]
            log_path = os.path.join(install_path, f"luatools-fix-log-{appid}.log")
            if not os.path.exists(log_path):
                continue
            try:
                with open(log_path, "r", encoding="utf-8") as fh:
                    content = fh.read()
                installed.extend(_parse_fix_log(content, appid, game["name"], install_path))
            except Exception as exc:
                logger.warn(f"SLSDeck: Failed to parse fix log for {appid}: {exc}")
        return {"success": True, "fixes": installed}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
