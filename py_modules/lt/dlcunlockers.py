"""Extra DLC-ownership unlockers: CreamAPI (Steam, SmokeAPI alternative) and the
acidicoala Uplay R1 / R2 unlockers (Ubisoft Connect DLC).

All three are the same KoalaBox-style proxy pattern as ``smokeapi.py``:

    <target>.dll      ->  <target>_o.dll   (original, proxied to)
    <unlocker>.dll    ->  <target>.dll     (unlocker, loaded by the game)
    + a small config file next to it

Kinds:
  cream    steam_api(64).dll   + cream_api.ini          (Steam DLC, alt to SmokeAPI)
  uplayr1  uplay_r1_loader(64) + UplayR1Unlocker.jsonc  (older Ubisoft Connect)
  uplayr2  upc_r2_loader(64)   + UplayR2Unlocker.jsonc  (newer Ubisoft Connect)

Everything is per-game and fully reversible (restore ``_o`` + delete config), so
un-fix can wipe it. Launch-option overrides are returned to the UI and merged
additively there — this module never touches launch options itself.
"""

from __future__ import annotations

import io
import json
import os
import shutil
import zipfile
from typing import Any, Dict, List, Optional, Tuple

from .logger import logger
from .paths import runtime_path, plugin_path
from .httpc import ensure_http_client
from .utils import chown_to_user

_UA = "SLSDeck/dlcunlockers"

# ── per-kind spec ────────────────────────────────────────────────────────────
# repo             : acidicoala GitHub release to pull the unlocker from
# targets          : {game_dll_basename: is64}  — the DLL the game ships that we proxy
# assets           : {is64: [candidate names inside the release zip]}  — the unlocker DLL
# config           : filename written next to the proxied DLL
# overrides         : additive WINEDLLOVERRIDES string handed to the UI
_SPECS: Dict[str, Dict[str, Any]] = {
    "cream": {
        # CreamAPI has no GitHub releases API (the old acidicoala/CreamAPI repo
        # 404s — it's a cs.rin.ru forum release). We ship the binaries in
        # defaults/creamapi and install from there (bundled=True → no download).
        # Unlike SmokeAPI (Windows steam_api64.dll only), CreamAPI also ships a
        # native Linux libsteam_api.so, so it can unlock DLC on native-Linux
        # games (e.g. Factorio) that have no Windows steam_api DLL to proxy.
        "bundled": True,
        "label": "CreamAPI",
        "targets": {"steam_api64.dll": True, "steam_api.dll": False, "libsteam_api.so": True},
        "config": "cream_api.ini",
        "overrides": 'WINEDLLOVERRIDES="steam_api64=n,b;steam_api=n,b"',
        "signs": (b"CreamAPI", b"cream_api", b"Cream"),
    },
    "uplayr1": {
        "repo": "https://api.github.com/repos/acidicoala/UplayR1Unlocker/releases/latest",
        "label": "Uplay R1 Unlocker",
        "targets": {"uplay_r1_loader64.dll": True, "uplay_r1_loader.dll": False},
        "assets": {True: ["UplayR1Unlocker64.dll", "UplayR1Unlocker.dll"],
                   False: ["UplayR1Unlocker32.dll", "UplayR1Unlocker.dll"]},
        "config": "UplayR1Unlocker.jsonc",
        "overrides": 'WINEDLLOVERRIDES="uplay_r1_loader=n,b;uplay_r1_loader64=n,b"',
        "signs": (b"UplayR1Unlocker", b"KoalaBox", b"acidicoala"),
    },
    "uplayr2": {
        "repo": "https://api.github.com/repos/acidicoala/UplayR2Unlocker/releases/latest",
        "label": "Uplay R2 Unlocker",
        "targets": {"upc_r2_loader64.dll": True, "upc_r2_loader.dll": False},
        "assets": {True: ["UplayR2Unlocker64.dll", "UplayR2Unlocker.dll"],
                   False: ["UplayR2Unlocker32.dll", "UplayR2Unlocker.dll"]},
        "config": "UplayR2Unlocker.jsonc",
        "overrides": 'WINEDLLOVERRIDES="upc_r2_loader=n,b;upc_r2_loader64=n,b"',
        "signs": (b"UplayR2Unlocker", b"KoalaBox", b"acidicoala"),
    },
}

KINDS = tuple(_SPECS.keys())


def _spec(kind: str) -> Dict[str, Any]:
    spec = _SPECS.get(kind)
    if not spec:
        raise ValueError(f"unknown unlocker kind: {kind}")
    return spec


def _cache_dir(kind: str) -> str:
    d = runtime_path(os.path.join("dlcunlockers", kind))
    os.makedirs(d, exist_ok=True)
    return d


def _cached(kind: str, is64: bool) -> str:
    return os.path.join(_cache_dir(kind), "unlock64.dll" if is64 else "unlock32.dll")


def _has_sign(path: str, signs: Tuple[bytes, ...]) -> bool:
    try:
        with open(path, "rb") as fh:
            head = fh.read(400_000)
        return any(s in head for s in signs)
    except Exception:
        return False


# ── extension-aware proxy naming (works for .dll and .so) ────────────────────
def _split_ext(base: str) -> Tuple[str, str]:
    low = base.lower()
    for ext in (".dll", ".so"):
        if low.endswith(ext):
            return base[: -len(ext)], base[-len(ext):]
    stem, ext = os.path.splitext(base)
    return stem, ext


def _orig_name(base: str) -> str:
    """steam_api64.dll -> steam_api64_o.dll; libsteam_api.so -> libsteam_api_o.so"""
    stem, ext = _split_ext(base)
    return f"{stem}_o{ext}"


def _is_win_target(base: str) -> bool:
    return base.lower().endswith(".dll")


# ── bundled CreamAPI proxy binaries (defaults/creamapi) ──────────────────────
def _cream_dir() -> str:
    return plugin_path("defaults", "creamapi")


def _elf_is_64(path: str) -> bool:
    """ELF class byte: 2 = 64-bit, 1 = 32-bit. Default 64-bit if unreadable."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(5)
        if head[:4] == b"\x7fELF":
            return head[4] == 2
    except Exception:
        pass
    return True


def _cream_proxy(base: str, orig_path: str) -> str:
    """Bundled CreamAPI proxy file for a given game target."""
    d = _cream_dir()
    low = base.lower()
    if low == "steam_api64.dll":
        return os.path.join(d, "windows", "steam_api64.dll")
    if low == "steam_api.dll":
        return os.path.join(d, "windows", "steam_api.dll")
    if low == "libsteam_api.so":
        arch = "x64" if _elf_is_64(orig_path) else "x86"
        return os.path.join(d, "linux", arch, "libsteam_api.so")
    return ""


def _cream_ini_template(is_win: bool) -> str:
    p = os.path.join(_cream_dir(), "windows" if is_win else "linux", "cream_api.ini.template")
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except Exception:
        return ""


# ── download the unlocker ────────────────────────────────────────────────────
def ensure_dlls(kind: str, force: bool = False) -> Dict[str, Any]:
    """Download the latest release for *kind* and cache the 32/64-bit unlocker DLLs."""
    spec = _spec(kind)
    dll64, dll32 = _cached(kind, True), _cached(kind, False)
    if not force and (os.path.isfile(dll64) or os.path.isfile(dll32)):
        return {"success": True, "cached": True,
                "dll64": dll64 if os.path.isfile(dll64) else "",
                "dll32": dll32 if os.path.isfile(dll32) else ""}
    client = ensure_http_client(f"dlcunlockers: {kind} release")
    try:
        r = client.get(spec["repo"], headers={"User-Agent": _UA,
                       "Accept": "application/vnd.github+json"}, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            return {"success": False, "error": f"release lookup HTTP {r.status_code}"}
        rel = r.json()
    except Exception as exc:
        return {"success": False, "error": f"release lookup failed: {exc}"}
    tag = str(rel.get("tag_name") or "")
    zip_url = ""
    for a in rel.get("assets") or []:
        n = str(a.get("name") or "").lower()
        if n.endswith(".zip") and "src" not in n and "source" not in n:
            zip_url = a.get("browser_download_url") or ""
            break
    if not zip_url:
        return {"success": False, "error": "no .zip asset in the latest release"}
    want64 = [n.lower() for n in spec["assets"][True]]
    want32 = [n.lower() for n in spec["assets"][False]]
    try:
        z = client.get(zip_url, headers={"User-Agent": _UA}, timeout=120, follow_redirects=True)
        if z.status_code != 200:
            return {"success": False, "error": f"download HTTP {z.status_code}"}
        got64 = got32 = False
        with zipfile.ZipFile(io.BytesIO(z.content)) as arc:
            members = {m.rsplit("/", 1)[-1].lower(): m for m in arc.namelist()}
            for cand in want64:
                if cand in members and not got64:
                    with arc.open(members[cand]) as src, open(dll64, "wb") as out:
                        shutil.copyfileobj(src, out)
                    got64 = True
            for cand in want32:
                if cand in members and not got32:
                    with arc.open(members[cand]) as src, open(dll32, "wb") as out:
                        shutil.copyfileobj(src, out)
                    got32 = True
        if not got64 and not got32:
            return {"success": False, "error": "no matching unlocker DLL in release archive"}
        with open(os.path.join(_cache_dir(kind), "version.txt"), "w", encoding="utf-8") as fh:
            fh.write(tag)
        logger.log(f"dlcunlockers: cached {spec['label']} {tag}")
        return {"success": True, "cached": False, "tag": tag,
                "dll64": dll64 if got64 else "", "dll32": dll32 if got32 else ""}
    except Exception as exc:
        return {"success": False, "error": f"extract failed: {exc}"}


# ── locate the game's target DLL(s) ──────────────────────────────────────────
def _find_targets(kind: str, install_path: str) -> List[Tuple[str, bool]]:
    """Return [(full_path, is64)] for each game DLL we can proxy for *kind*."""
    spec = _spec(kind)
    out: List[Tuple[str, bool]] = []
    try:
        for root, _dirs, files in os.walk(install_path):
            low = {f.lower(): f for f in files}
            for base, is64 in spec["targets"].items():
                if base in low:
                    full = os.path.join(root, low[base])
                    # Skip if this file is already OUR unlocker (proxy in place).
                    if _has_sign(full, spec["signs"]):
                        continue
                    out.append((full, is64))
    except Exception as exc:
        logger.warn(f"dlcunlockers: scan failed for {kind}: {exc}")
    return out


def _config_text(kind: str, appid: int = 0, dlc_ids: Optional[List[str]] = None,
                 is_win: bool = True) -> str:
    if kind == "cream":
        ids = [str(d) for d in (dlc_ids or []) if str(d).strip().isdigit()]
        unlockall = "false" if ids else "true"
        # Start from the bundled template (it already carries the right orgapi
        # lines for the platform: steam_api*_o.dll for Windows, libsteam_api_o.so
        # for Linux), then patch appid + unlockall and append any DLC ids.
        tmpl = _cream_ini_template(is_win)
        if tmpl:
            out_lines: List[str] = []
            for ln in tmpl.splitlines():
                s = ln.strip()
                if s.startswith("appid") and "=" in s:
                    out_lines.append(f"appid = {appid}")
                elif s.startswith("unlockall") and "=" in s:
                    out_lines.append(f"unlockall = {unlockall}")
                else:
                    out_lines.append(ln)
            if ids:
                out_lines.append("")
                for d in ids:
                    out_lines.append(f"{d} = DLC_{d}")
            out_lines.append("")
            return "\n".join(out_lines)
        # Fallback if the template is missing (shouldn't happen).
        org = "libsteam_api_o.so" if not is_win else "steam_api_o.dll"
        org64 = "libsteam_api_o.so" if not is_win else "steam_api64_o.dll"
        lines = [
            f"; CreamAPI configuration (SLSDeck) for App ID {appid}",
            "", "[steam]", f"appid = {appid}", f"unlockall = {unlockall}",
            f"orgapi = {org}", f"orgapi64 = {org64}", "forceoffline = false",
            "", "[steam_misc]", "disableuserinterface = false", "", "[dlc]",
        ]
        for d in ids:
            lines.append(f"{d} = DLC_{d}")
        lines.append("")
        return "\n".join(lines)
    # Uplay R1 / R2 — empty blacklist means unlock every DLC.
    return json.dumps({"logging": False, "lang": "default", "blacklist": []}, indent=2)


def _resolve_dlc_ids(appid: int) -> List[str]:
    """Best-effort DLC-id list for a game (from steamcmd's extended.listofdlc)."""
    if not appid:
        return []
    try:
        from .downloads import _fetch_app_info
        info = _fetch_app_info(int(appid)) or {}
        csv = str(info.get("dlc_list") or "")
        return [d.strip() for d in csv.split(",") if d.strip().isdigit()]
    except Exception as exc:
        logger.warn(f"dlcunlockers: DLC-id resolve failed for {appid}: {exc}")
        return []


# ── public: status / install / remove ────────────────────────────────────────
def status(kind: str, install_path: str) -> Dict[str, Any]:
    spec = _spec(kind)
    installed = False
    supported = False
    try:
        for root, _dirs, files in os.walk(install_path):
            low = {f.lower() for f in files}
            for base in spec["targets"]:
                if base in low:
                    supported = True
                    o_name = _orig_name(base)
                    if o_name in low and spec["config"].lower() in low:
                        installed = True
    except Exception:
        pass
    return {"success": True, "installed": installed, "supported": supported}


def install(kind: str, install_path: str, appid: int = 0) -> Dict[str, Any]:
    spec = _spec(kind)
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "install path not found"}

    # CreamAPI and SmokeAPI both proxy steam_api — clear a SmokeAPI proxy first so
    # we don't stack two proxies / double-backup the original.
    if kind == "cream":
        try:
            from . import smokeapi
            smokeapi.remove(install_path)
        except Exception:
            pass

    targets = _find_targets(kind, install_path)
    if not targets:
        return {"success": False, "notSupported": True,
                "error": f"no {spec['label']} target for this game"}

    dlc_ids: List[str] = _resolve_dlc_ids(int(appid or 0)) if kind == "cream" else []

    # Source of the proxy binaries. CreamAPI is bundled (per target, .dll or .so);
    # Uplay downloads a release zip and caches 32/64-bit DLLs.
    if not spec.get("bundled"):
        ens = ensure_dlls(kind)
        if not ens.get("success"):
            return {"success": False, "error": ens.get("error", "could not fetch unlocker")}
        dll64, dll32 = ens.get("dll64"), ens.get("dll32")
        tag = ens.get("tag", "")
    else:
        dll64 = dll32 = None
        tag = "bundled"

    done: List[str] = []
    win_done = False
    for full, is64 in targets:
        base = os.path.basename(full)
        if spec.get("bundled"):
            unlocker = _cream_proxy(base, full)     # .dll (win) or .so (linux)
        else:
            unlocker = dll64 if is64 else dll32
        if not unlocker or not os.path.isfile(unlocker):
            continue  # not shipped for this bitness/platform; skip
        o_path = os.path.join(os.path.dirname(full), _orig_name(base))
        try:
            if not os.path.exists(o_path):
                shutil.move(full, o_path)           # original -> _o (proxied to)
            shutil.copy2(unlocker, full)            # unlocker -> target
            cfg = os.path.join(os.path.dirname(full), spec["config"])
            with open(cfg, "w", encoding="utf-8") as fh:
                fh.write(_config_text(kind, int(appid or 0), dlc_ids, is_win=_is_win_target(base)))
            chown_to_user(full, recursive=False)
            chown_to_user(o_path, recursive=False)
            chown_to_user(cfg, recursive=False)
            done.append(full)
            if _is_win_target(base):
                win_done = True
        except Exception as exc:
            logger.warn(f"dlcunlockers: {kind} install failed for {full}: {exc}")

    if not done:
        return {"success": False, "error": "could not install (no matching build?)"}
    logger.log(f"dlcunlockers: {spec['label']} installed for {len(done)} target(s) in {install_path}")
    # WINEDLLOVERRIDES only matters for a Windows/Proton target; a native-Linux
    # .so proxy is loaded directly and needs no launch-option override.
    return {"success": True, "installed": done,
            "overrides": spec["overrides"] if win_done else "",
            "tag": tag, "label": spec["label"],
            "dlcCount": len(dlc_ids), "unlockAll": (kind == "cream" and not dlc_ids),
            "nativeLinux": (not win_done)}


def remove(kind: str, install_path: str) -> Dict[str, Any]:
    spec = _spec(kind)
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "install path not found"}
    target_bases = set(spec["targets"].keys())
    o_names = {_orig_name(b).lower(): b for b in target_bases}
    restored = 0
    try:
        for root, _dirs, files in os.walk(install_path):
            low = {f.lower(): f for f in files}
            for o_lower, base in o_names.items():
                if o_lower not in low:
                    continue
                o_path = os.path.join(root, low[o_lower])
                base_path = os.path.join(root, base)
                try:
                    if os.path.exists(base_path):
                        os.remove(base_path)          # delete our proxy copy
                    shutil.move(o_path, base_path)    # restore original
                    chown_to_user(base_path, recursive=False)
                    restored += 1
                except Exception as exc:
                    logger.warn(f"dlcunlockers: {kind} restore failed for {o_path}: {exc}")
            # Delete our config file if present in this dir.
            cfg_lower = spec["config"].lower()
            if cfg_lower in low:
                try:
                    os.remove(os.path.join(root, low[cfg_lower]))
                except Exception:
                    pass
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    return {"success": True, "restored": restored}


def status_all(install_path: str) -> Dict[str, Any]:
    """Per-kind status for the UI in one call."""
    out: Dict[str, Any] = {"success": True}
    for kind in KINDS:
        try:
            out[kind] = status(kind, install_path)
        except Exception as exc:
            out[kind] = {"success": False, "error": str(exc)}
    return out


def remove_all(install_path: str) -> Dict[str, Any]:
    """Remove every unlocker kind (used by un-fix)."""
    total = 0
    for kind in KINDS:
        try:
            r = remove(kind, install_path)
            total += int(r.get("restored") or 0)
        except Exception:
            pass
    return {"success": True, "restored": total}
