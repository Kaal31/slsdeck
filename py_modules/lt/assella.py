"""ASSella direct-download backend (vendor-trimmed).

This is the "Path B" acquisition backend: instead of adding an appid to
SLSsteam's ``AdditionalApps`` and letting the real Steam client pull the depot
from the official CDN (Path A / moon-CDN), it downloads depot content directly
with the bundled DepotDownloader .NET DLL, decrypts it with the depot key, drops
it into the Steam library, writes an ``appmanifest`` so Steam lists it installed,
and registers the appid with moon so the game shows as owned.

Only the acquisition pieces of ASSella are vendored — the DepotDownloader DLL
bundle under ``defaults/assella/deps`` plus this clean re-implementation of the
Qt-coupled ``download_depots_task``. No PyQt, no SLScheevo, no GIF manager.

Design notes
------------
* moon stays the injection engine. This module never installs an engine; it only
  downloads bytes and tells moon about them (``slssteam.add_app`` +
  ``slssteam.cache_depot_key``) — exactly like ASSella writes the standard
  ``config.yaml`` moon already reads. There is never a second engine.
* Downloads and uninstalls run on daemon threads with a shared state dict, so
  closing the QAM / Advanced panel never interrupts them — mirrors ``downloads``.
* The .NET 9 runtime is fetched lazily on first use via the official
  ``dot.net/v1/dotnet-install.sh`` and cached under ``~/.dotnet``; the DLL bundle
  is vendored, so nothing is downloaded on plugin install.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import threading
import time
from typing import Any, Callable, Dict, List, Optional

from .logger import logger
from .paths import get_user_home, settings_path
from . import slssteam, steam

try:
    import psutil  # type: ignore
except Exception:  # pragma: no cover
    psutil = None  # type: ignore


# ── paths ──────────────────────────────────────────────────────────────────

def _plugin_deps_dir() -> str:
    """Vendored DepotDownloader DLL bundle: <plugin>/defaults/assella/deps."""
    here = os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
    return os.path.join(here, "defaults", "assella", "deps")


def _dll_path() -> str:
    return os.path.join(_plugin_deps_dir(), "DepotDownloader.dll")


def _records_path() -> str:
    return settings_path("assella_installs.json")


def _dotnet_root() -> str:
    return os.path.join(get_user_home(), ".dotnet")


def _clean_env(base: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """Environment for spawned subprocesses with Decky's injected loader paths
    removed. Decky Loader runs as a PyInstaller/AppImage bundle and exports its
    own LD_LIBRARY_PATH (bundled libcurl.so.3, etc). That poisons system
    curl/wget/dotnet — e.g. "curl: libcurl.so.3: version 'OPENSSL_3.2.0' not
    found (required by /usr/lib/libcurl.so.4)". Dropping these makes subprocesses
    use the OS libraries."""
    env = dict(base if base is not None else os.environ)
    for k in ("LD_LIBRARY_PATH", "LD_PRELOAD", "LD_AUDIT"):
        env.pop(k, None)
    return env


# ── install records ────────────────────────────────────────────────────────
# { "<appid>": {appid, name, dir, lib, installdir, depots:[...], bytes, ts} }

_RECORDS_LOCK = threading.Lock()


def _load_records() -> Dict[str, Any]:
    try:
        with open(_records_path(), "r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _save_records(records: Dict[str, Any]) -> None:
    try:
        tmp = _records_path() + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(records, fh, indent=2)
        os.replace(tmp, _records_path())
    except Exception as exc:
        logger.warn(f"ASSella: could not write install records: {exc}")


def _record_install(appid: int, entry: Dict[str, Any]) -> None:
    with _RECORDS_LOCK:
        records = _load_records()
        records[str(appid)] = entry
        _save_records(records)


def _forget_install(appid: int) -> None:
    with _RECORDS_LOCK:
        records = _load_records()
        if records.pop(str(appid), None) is not None:
            _save_records(records)


def is_assella_install(appid: int) -> bool:
    try:
        return str(int(appid)) in _load_records()
    except Exception:
        return False


# ── background state ───────────────────────────────────────────────────────
# status: queued | resolving | downloading | registering | done | failed |
#         cancelled | uninstalling | removed
# op: "download" | "uninstall"

ASSELLA_STATE: Dict[int, Dict[str, Any]] = {}
_STATE_LOCK = threading.Lock()
_PROC: Dict[int, Any] = {}
_CANCEL: Dict[int, threading.Event] = {}
_MAX_TRACKED = 60


def _set_state(appid: int, update: Dict[str, Any]) -> None:
    with _STATE_LOCK:
        st = ASSELLA_STATE.get(appid) or {}
        st.update(update)
        st["appid"] = appid
        ASSELLA_STATE[appid] = st


def _get_state(appid: int) -> Dict[str, Any]:
    with _STATE_LOCK:
        return dict(ASSELLA_STATE.get(appid, {}))


def _prune_states() -> None:
    terminal = {"done", "failed", "cancelled", "removed"}
    with _STATE_LOCK:
        if len(ASSELLA_STATE) <= _MAX_TRACKED:
            return
        removable = [a for a, s in ASSELLA_STATE.items() if s.get("status") in terminal]
        for a in removable[: len(ASSELLA_STATE) - _MAX_TRACKED]:
            ASSELLA_STATE.pop(a, None)


def _cancel_event(appid: int) -> threading.Event:
    ev = _CANCEL.get(appid)
    if ev is None:
        ev = threading.Event()
        _CANCEL[appid] = ev
    return ev


def all_states() -> List[Dict[str, Any]]:
    with _STATE_LOCK:
        return [dict(s) for s in ASSELLA_STATE.values()]


# ── .NET runtime (lazy) ────────────────────────────────────────────────────

def _dotnet_candidates() -> List[str]:
    out = []
    sysd = shutil.which("dotnet")
    if sysd:
        out.append(sysd)
    out.append(os.path.join(_dotnet_root(), "dotnet"))
    seen, uniq = set(), []
    for c in out:
        if c and c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq


def get_dotnet_path() -> Optional[str]:
    """First dotnet exe that reports a .NET 9 runtime; else None."""
    for exe in _dotnet_candidates():
        try:
            env = _clean_env()
            env.setdefault("DOTNET_ROOT", os.path.dirname(exe))
            r = subprocess.run([exe, "--list-runtimes"], capture_output=True,
                               text=True, timeout=10, env=env)
            if "Microsoft.NETCore.App 9." in (r.stdout or ""):
                return exe
        except Exception:
            continue
    return None


def _tail(s: str, n: int = 300) -> str:
    s = (s or "").strip()
    return s[-n:] if len(s) > n else s


def _install_dotnet9() -> tuple:
    """Fetch .NET 9 runtime via the official installer script into ~/.dotnet.
    Returns (ok, detail) — detail carries the real failure text for the UI."""
    root = _dotnet_root()
    try:
        os.makedirs(root, exist_ok=True)
    except Exception as exc:
        return False, f"cannot create {root}: {exc}"
    script = os.path.join(root, "dotnet-install.sh")
    env = _clean_env()
    # The Decky plugin backend runs as ROOT, so $HOME points at root's home, not
    # the deck user. dotnet-install.sh installs to --install-dir / $HOME/.dotnet,
    # NOT DOTNET_ROOT — so without an explicit --install-dir the runtime landed in
    # the wrong home and our probe ("no dotnet binary at ~/.dotnet") missed it.
    # Pin the install dir + HOME to exactly where we look.
    env["DOTNET_ROOT"] = root
    env["DOTNET_INSTALL_DIR"] = root
    env["HOME"] = get_user_home()
    dl = None
    if shutil.which("curl"):
        dl = ["curl", "-sSL", "-o", script, "https://dot.net/v1/dotnet-install.sh"]
    elif shutil.which("wget"):
        dl = ["wget", "-q", "-O", script, "https://dot.net/v1/dotnet-install.sh"]
    if not dl:
        return False, "neither curl nor wget is available to fetch the .NET installer"
    try:
        r = subprocess.run(dl, capture_output=True, text=True, timeout=60, env=env)
        if r.returncode != 0:
            return False, f"installer download failed (rc {r.returncode}): {_tail(r.stderr)}"
        os.chmod(script, 0o755)
        r = subprocess.run(
            ["bash", script, "--channel", "9.0", "--runtime", "dotnet",
             "--install-dir", root],
            capture_output=True, text=True, timeout=900, env=env)
        try:
            os.remove(script)
        except OSError:
            pass
        if r.returncode != 0:
            return False, f"dotnet-install.sh failed (rc {r.returncode}): {_tail(r.stderr or r.stdout)}"
        # Installed as root under the deck user's home — hand it back to the user.
        try:
            from .utils import chown_to_user
            chown_to_user(root, recursive=True)
        except Exception:
            pass
        if not os.path.isfile(os.path.join(root, "dotnet")):
            return False, f"dotnet-install.sh reported success but no binary at {root}: {_tail(r.stdout)}"
        return True, ""
    except subprocess.TimeoutExpired:
        return False, "timed out downloading/installing .NET (slow or no network)"
    except Exception as exc:
        return False, f".NET install error: {exc}"


def _dotnet_probe_error() -> str:
    """Why get_dotnet_path() returns nothing, for diagnostics: run the installed
    dotnet --list-runtimes and report what it said (or the OS error)."""
    exe = os.path.join(_dotnet_root(), "dotnet")
    if not os.path.isfile(exe):
        return "no dotnet binary at ~/.dotnet after install"
    try:
        env = _clean_env()
        env.setdefault("DOTNET_ROOT", os.path.dirname(exe))
        r = subprocess.run([exe, "--list-runtimes"], capture_output=True,
                           text=True, timeout=15, env=env)
        if r.returncode != 0:
            return f"dotnet --list-runtimes failed (rc {r.returncode}): {_tail(r.stderr or r.stdout)}"
        runtimes = _tail(r.stdout, 200) or "(none)"
        return f"installed, but no .NET 9 runtime detected. Runtimes: {runtimes}"
    except Exception as exc:
        return f"cannot run dotnet: {exc}"


def ensure_backend() -> Dict[str, Any]:
    """Verify the DLL bundle is present and a .NET 9 runtime is available,
    installing the runtime lazily. Returns {ok, dotnet, error}."""
    if not os.path.isfile(_dll_path()):
        return {"ok": False, "error": "DepotDownloader.dll missing from plugin bundle"}
    dotnet = get_dotnet_path()
    if dotnet:
        return {"ok": True, "dotnet": dotnet}
    logger.log("ASSella: .NET 9 not found — installing (first use, one-time)…")
    ok, detail = _install_dotnet9()
    dotnet = get_dotnet_path()
    if dotnet:
        return {"ok": True, "dotnet": dotnet}
    if not ok:
        return {"ok": False, "error": f".NET 9 install failed: {detail}"}
    # Install script succeeded but the runtime still isn't detected — surface why.
    return {"ok": False, "error": f".NET 9 installed but not detected: {_dotnet_probe_error()}"}


def backend_status() -> Dict[str, Any]:
    """Non-installing probe for the UI: is the DLL present, is dotnet ready."""
    return {
        "success": True,
        "dllPresent": os.path.isfile(_dll_path()),
        "dotnetReady": bool(get_dotnet_path()),
    }


# ── manifest / depot-key resolution ────────────────────────────────────────

_RE_ADDAPPID_KEY = re.compile(
    r'addappid\s*\(\s*(\d+)\s*,\s*\d+\s*,\s*["\']([0-9a-fA-F]{64})["\']')
_RE_ADDAPPID_BARE = re.compile(r'addappid\s*\(\s*(\d+)\s*\)')
_RE_SETMANIFEST = re.compile(
    r'setManifestid\s*\(\s*(\d+)\s*,\s*["\'](\d+)["\']', re.IGNORECASE)


def _parse_lua_text(lua: str) -> Dict[str, Any]:
    """Extract depot keys + manifest ids + bare (DLC/base) appids from a manifest
    .lua. ``addappid(depot,_,"<64-hex>")`` = keyed depot, ``setManifestid(depot,
    "gid")`` = manifest per depot, bare ``addappid(id)`` = an owned appid (base or
    DLC). Returns {depots:{id:{key}}, manifests:{id:gid}, appids:[...]}."""
    depots: Dict[str, Dict[str, str]] = {}
    manifests: Dict[str, str] = {}
    appids: List[str] = []
    if lua:
        for m in _RE_ADDAPPID_KEY.finditer(lua):
            depots[m.group(1)] = {"key": m.group(2)}
        for m in _RE_SETMANIFEST.finditer(lua):
            manifests[m.group(1)] = m.group(2)
        for m in _RE_ADDAPPID_BARE.finditer(lua):
            appids.append(m.group(1))
    return {"depots": depots, "manifests": manifests, "appids": appids}


def _resolve_game_data(appid: int, lua_text: str = "") -> Dict[str, Any]:
    """Build the depot map DepotDownloader needs from our existing free sources.

    Reuses the manifest .lua a game already resolves through (LuaTools / fixes),
    or a caller-supplied ``lua_text`` (e.g. an uploaded manifest under safe mode).
    Returns {appid, name, depots:{id:{key}}, manifests:{id:gid}, appids:[...]}.
    """
    lua = lua_text or ""
    source = "uploaded" if lua_text else ""
    if not lua:
        try:
            from . import downloads
            r = downloads.fetch_lua_text(appid)
            if r.get("success"):
                lua = r.get("lua", "")
                source = r.get("source", "")
        except Exception as exc:
            logger.warn(f"ASSella: manifest lua resolve failed for {appid}: {exc}")
    parsed = _parse_lua_text(lua)
    name = ""
    try:
        from . import downloads
        name = downloads.fetch_app_name(appid) or ""
    except Exception:
        pass
    return {"appid": int(appid), "name": name, "source": source,
            "hasLua": bool(lua), **parsed}


def list_depots(appid: int) -> Dict[str, Any]:
    """Depots resolvable for a game, for the pre-download picker. Each entry:
    {depot, manifest, hasKey, downloadable, isDlc, label}. isDlc is best-effort —
    a depot id that also appears as a bare owned appid is treated as base; ids far
    from the base appid are hinted as DLC content."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid", "depots": []}
    gd = _resolve_game_data(appid)
    owned = set(gd.get("appids", []))
    out = []
    reason = ""
    if not gd["depots"]:
        if not gd.get("hasLua"):
            reason = ("No manifest found for this game from the free sources "
                      "(lua.tools needs you signed in; Charon DB didn't have it). "
                      "Sign into lua.tools in Sources & keys, or import a manifest.")
        else:
            reason = ("A manifest was found but it lists no keyed depots to "
                      "download (it may be a keyless/ownership-only lua).")
    for d, info in gd["depots"].items():
        manifest = gd["manifests"].get(d, "")
        # Heuristic DLC hint: the base game's own depots cluster near its appid;
        # a depot whose id is also listed as a separate owned appid (or is far
        # from the base) is likely DLC content. Best-effort label only.
        is_dlc = d in owned and str(d) != str(appid)
        # A depot key is enough to download — DepotDownloader fetches the latest
        # manifest when none is given, so setManifestid is optional.
        out.append({
            "depot": d,
            "manifest": manifest,
            "hasKey": bool(info.get("key")),
            "downloadable": bool(info.get("key")),
            "isDlc": is_dlc,
            "label": f"Depot {d}" + (" (DLC)" if is_dlc else "") + ("" if manifest else " · latest"),
        })
    out.sort(key=lambda x: int(x["depot"]))
    return {"success": True, "appid": appid, "name": gd.get("name", ""),
            "depots": out, "reason": reason, "source": gd.get("source", "")}


# ── appmanifest writing ────────────────────────────────────────────────────

def _dir_size(path: str) -> int:
    total = 0
    for root, _dirs, files in os.walk(path):
        for f in files:
            try:
                total += os.path.getsize(os.path.join(root, f))
            except OSError:
                pass
    return total


def _write_appmanifest(lib: str, appid: int, installdir: str, name: str,
                       manifests: Dict[str, str], size: int) -> str:
    """Write appmanifest_<appid>.acf so Steam lists the game installed
    (StateFlags 4 = FullyInstalled). Uses the REAL per-depot manifest gids that
    DepotDownloader reported so Steam sees the depots as current (a manifest of
    "0" makes Steam flag the game 'update required'). AutoUpdateBehavior 1 = only
    update on launch, to avoid Steam immediately re-pulling over our files."""
    steamapps = os.path.join(lib, "steamapps")
    os.makedirs(steamapps, exist_ok=True)
    acf = os.path.join(steamapps, f"appmanifest_{appid}.acf")
    installed = "".join(
        f'\t\t"{d}"\n\t\t{{\n\t\t\t"manifest"\t\t"{mid or 0}"\n\t\t\t"size"\t\t"0"\n\t\t}}\n'
        for d, mid in manifests.items())
    now = int(time.time())
    safe_name = (name or f"App {appid}").replace('"', "'")
    content = (
        '"AppState"\n{\n'
        f'\t"appid"\t\t"{appid}"\n'
        '\t"Universe"\t\t"1"\n'
        f'\t"name"\t\t"{safe_name}"\n'
        '\t"StateFlags"\t\t"4"\n'
        f'\t"installdir"\t\t"{installdir}"\n'
        f'\t"LastUpdated"\t\t"{now}"\n'
        f'\t"SizeOnDisk"\t\t"{size}"\n'
        '\t"buildid"\t\t"0"\n'
        '\t"AutoUpdateBehavior"\t\t"1"\n'
        '\t"InstalledDepots"\n\t{\n'
        f'{installed}'
        '\t}\n'
        '}\n'
    )
    with open(acf, "w", encoding="utf-8") as fh:
        fh.write(content)
    try:
        from .utils import chown_to_user
        chown_to_user(acf, recursive=False)
    except Exception:
        pass
    return acf


# ── download ───────────────────────────────────────────────────────────────

_RE_PCT = re.compile(rb"(\d{1,3}(?:\.\d{1,2})?)%")


def _run_depot(dotnet: str, args: List[str], appid: int,
               progress_cb: Optional[Callable[[int], None]] = None) -> int:
    """Run one DepotDownloader invocation, streaming percent into state. Honors
    pause/resume/cancel through the process handle. Returns exit code."""
    env = _clean_env()
    env.setdefault("DOTNET_ROOT", os.path.dirname(dotnet))
    proc = subprocess.Popen(args, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, env=env)
    _PROC[appid] = proc
    ev = _cancel_event(appid)
    out = b""
    try:
        assert proc.stdout is not None
        while True:
            if ev.is_set():
                try:
                    proc.terminate()
                except Exception:
                    pass
                return 130, "", ""
            chunk = proc.stdout.read(256)
            if not chunk:
                if proc.poll() is not None:
                    break
                continue
            out += chunk
            for m in _RE_PCT.finditer(chunk):
                try:
                    pct = int(float(m.group(1)))
                    pct = max(0, min(100, pct))
                    _set_state(appid, {"percent": pct})
                    if progress_cb:
                        progress_cb(pct)
                except ValueError:
                    pass
            # Keep a bounded tail for diagnostics + manifest-id parsing.
            if len(out) > 16384:
                out = out[-8192:]
        text = out.decode("utf-8", "ignore")
        # DepotDownloader prints the manifest gid it downloaded ("... manifest
        # 1234567890123456789 ..."). Capture the last one so we can write a
        # correct appmanifest and Steam doesn't flag the game for update.
        mids = re.findall(r"manifest[^\d]{0,8}(\d{10,})", text, re.IGNORECASE)
        return (proc.poll() or 0), _tail(text, 600), (mids[-1] if mids else "")
    finally:
        _PROC.pop(appid, None)


def _download_worker(appid: int, lua_text: str = "",
                     selected: Optional[List[str]] = None) -> None:
    try:
        _set_state(appid, {"status": "resolving", "op": "download", "percent": 0,
                           "error": ""})
        backend = ensure_backend()
        if not backend.get("ok"):
            _set_state(appid, {"status": "failed", "error": backend.get("error", "")})
            return
        dotnet = backend["dotnet"]

        gd = _resolve_game_data(appid, lua_text)
        name = gd.get("name") or f"App {appid}"
        _set_state(appid, {"name": name})
        # A depot needs a key to decrypt; the manifest id is optional (omit it
        # and DepotDownloader pulls the latest).
        usable = [d for d in gd["depots"] if gd["depots"][d].get("key")]
        # If the caller picked a subset (depot picker), honour it.
        if selected:
            sel = set(str(s) for s in selected)
            usable = [d for d in usable if d in sel]
        if not usable:
            _set_state(appid, {"status": "failed",
                               "error": "No depot keys resolved for this game "
                                        "(no free manifest source had it)."})
            return

        steam_root = steam.detect_steam_install_path()
        if not steam_root:
            _set_state(appid, {"status": "failed", "error": "Steam install not found"})
            return
        installdir = re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_") or f"App_{appid}"
        dest_dir = os.path.join(steam_root, "steamapps", "common", installdir)
        os.makedirs(dest_dir, exist_ok=True)

        keys_vdf = os.path.join(dest_dir, ".slsdeck_keys.vdf")
        with open(keys_vdf, "w", encoding="utf-8") as fh:
            for d in usable:
                fh.write(f"{d};{gd['depots'][d]['key']}\n")

        # Gather actual .manifest binaries so DepotDownloader is handed
        # -manifestfile and never has to ask Steam for a manifest request code
        # (anonymous login gets a 401 for those). Without a manifest file for a
        # depot, an anonymous download of a non-free app cannot succeed.
        mfiles: Dict[str, str] = {}
        try:
            from . import downloads as _dl
            b = _dl.fetch_manifest_bundle(appid)
            mfiles = b.get("manifests", {}) or {}
        except Exception as exc:
            logger.warn(f"ASSella: manifest bundle fetch failed for {appid}: {exc}")

        _set_state(appid, {"status": "downloading", "percent": 0,
                           "depots": len(usable)})
        ev = _cancel_event(appid)
        failed = []
        real_manifests: Dict[str, str] = {}
        last_output = ""
        no_manifest_file = []
        for idx, d in enumerate(usable):
            if ev.is_set():
                _set_state(appid, {"status": "cancelled"})
                return
            args = [dotnet, _dll_path(), "-app", str(appid), "-depot", str(d)]
            gid = gd["manifests"].get(d) or ""
            mfile = mfiles.get(d)
            if mfile:
                # Derive the gid from the manifest filename if the lua didn't name it.
                if not gid:
                    mm = re.search(r"_(\d+)\.manifest$", os.path.basename(mfile))
                    if mm:
                        gid = mm.group(1)
                if gid:
                    args += ["-manifest", str(gid)]
                args += ["-manifestfile", mfile]
            else:
                no_manifest_file.append(str(d))
                if gid:
                    args += ["-manifest", str(gid)]
            args += ["-depotkeys", keys_vdf, "-max-downloads", "8",
                     "-dir", dest_dir, "-validate"]
            code, out_tail, mid = _run_depot(dotnet, args, appid)
            if code == 130:
                _set_state(appid, {"status": "cancelled"})
                return
            # Record the manifest gid actually used (the one we pinned, or the one
            # DepotDownloader reported it fetched) for a correct appmanifest.
            real_manifests[d] = gd["manifests"].get(d) or mid or ""
            if code != 0:
                failed.append(str(d))
                last_output = out_tail or last_output
            _set_state(appid, {"depotDone": idx + 1})

        try:
            os.remove(keys_vdf)
        except OSError:
            pass

        size = _dir_size(dest_dir)
        # GUARD: if nothing meaningful landed on disk (every depot failed, or the
        # tree is essentially empty), this is NOT a successful install — do not
        # write an appmanifest or register it (that's what produced a phantom
        # "installed but needs update" entry). Report the real reason.
        if len(failed) >= len(usable) or size < 1_000_000:
            try:
                shutil.rmtree(dest_dir, ignore_errors=True)
            except Exception:
                pass
            detail = last_output or "DepotDownloader downloaded no data"
            hint = ""
            if no_manifest_file:
                hint = (" No .manifest file was available for this game, so "
                        "DepotDownloader had to ask Steam for one and anonymous "
                        "login can't (401). Set your Hubcap key in Sources & keys "
                        "(Hubcap generates the manifest), or import a manifest for it.")
            _set_state(appid, {"status": "failed", "bytes": size,
                               "error": f"Download failed — no game data.{hint} {detail}"})
            return

        _set_state(appid, {"status": "registering", "percent": 100})
        _write_appmanifest(steam_root, appid, installdir, name, real_manifests, size)
        # Tell moon about it: owned via AdditionalApps + cache each depot key so a
        # running moon can decrypt without a restart.
        try:
            slssteam.add_app(appid, name)
        except Exception as exc:
            logger.warn(f"ASSella: add_app failed for {appid}: {exc}")
        for d in usable:
            try:
                slssteam.cache_depot_key(appid, int(d), gd["depots"][d]["key"])
            except Exception:
                pass
        try:
            from .utils import chown_to_user
            chown_to_user(dest_dir, recursive=True)
        except Exception:
            pass

        _record_install(appid, {
            "appid": appid, "name": name, "dir": dest_dir, "lib": steam_root,
            "installdir": installdir, "depots": usable, "bytes": size,
            "ts": int(time.time()),
        })
        err = ""
        if failed:
            err = f"Installed, but {len(failed)} depot(s) failed: {', '.join(failed)}"
        _set_state(appid, {"status": "done", "success": True, "error": err,
                           "bytes": size})
        try:
            from . import art
            art.sync_game_art(appid)
        except Exception:
            pass
        # Notify (toast) but do NOT auto-reload — a direct download doesn't need an
        # immediate client reboot; the user restarts Steam when ready (matches how
        # they add via SLS). auto_download=False keeps the notifier from rebooting.
        try:
            from . import downloads
            downloads.push_add_event(appid, name, "done", True,
                                     auto_download=False, error=err, assella=True)
        except Exception:
            pass
    except Exception as exc:
        logger.error(f"ASSella: download worker crashed for {appid}: {exc}")
        _set_state(appid, {"status": "failed", "error": str(exc)})


def download(appid: int, selected: Optional[List[str]] = None) -> Dict[str, Any]:
    """Queue a background ASSella (DepotDownloader) install for ``appid``. If
    ``selected`` (a list of depot ids) is given, only those depots download."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    st = _get_state(appid).get("status")
    if st in ("resolving", "downloading", "registering", "queued"):
        return {"success": True, "alreadyRunning": True}
    _cancel_event(appid).clear()
    _prune_states()
    _set_state(appid, {"status": "queued", "op": "download", "percent": 0,
                       "error": "", "success": False})
    threading.Thread(target=_download_worker, args=(appid, "", selected),
                     name=f"assella-dl-{appid}", daemon=True).start()
    return {"success": True}


def install_from_lua(appid: int, path: str,
                     selected: Optional[List[str]] = None) -> Dict[str, Any]:
    """Safe-mode manifest upload: parse an uploaded .lua/.manifest and download
    its depots via ASSella instead of installing to the SLS engine's stplug-in.
    ``appid`` binds the resulting install; ``path`` is the uploaded file."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            lua = fh.read()
    except Exception as exc:
        return {"success": False, "error": f"Could not read file: {exc}"}
    if "addappid" not in lua:
        return {"success": False, "error": "No addappid entries found in the uploaded file"}
    _cancel_event(appid).clear()
    _prune_states()
    _set_state(appid, {"status": "queued", "op": "download", "percent": 0,
                       "error": "", "success": False})
    threading.Thread(target=_download_worker, args=(appid, lua, selected),
                     name=f"assella-lua-{appid}", daemon=True).start()
    return {"success": True}


def pause(appid: int, paused: bool) -> Dict[str, Any]:
    """Suspend/resume the running DepotDownloader process tree via psutil."""
    proc = _PROC.get(int(appid))
    if not proc or not psutil:
        return {"success": False, "error": "not running or psutil missing"}
    try:
        parent = psutil.Process(proc.pid)
        targets = [parent] + parent.children(recursive=True)
        for p in targets:
            try:
                p.suspend() if paused else p.resume()
            except Exception:
                pass
        _set_state(int(appid), {"paused": bool(paused)})
        return {"success": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def cancel(appid: int) -> Dict[str, Any]:
    _cancel_event(int(appid)).set()
    proc = _PROC.get(int(appid))
    if proc:
        try:
            proc.terminate()
        except Exception:
            pass
    return {"success": True}


# ── uninstall ──────────────────────────────────────────────────────────────

def _uninstall_worker(appid: int) -> None:
    try:
        _set_state(appid, {"status": "uninstalling", "op": "uninstall", "percent": 0,
                           "error": ""})
        # Remove appmanifest + installed files (guarded to steamapps/common).
        try:
            steam.remove_added_game(appid)
        except Exception as exc:
            logger.warn(f"ASSella: file removal failed for {appid}: {exc}")
        # Drop from moon config so it stops appearing owned.
        try:
            slssteam.remove_app(appid)
        except Exception as exc:
            logger.warn(f"ASSella: remove_app failed for {appid}: {exc}")
        _forget_install(appid)
        _set_state(appid, {"status": "removed", "success": True, "percent": 100})
    except Exception as exc:
        logger.error(f"ASSella: uninstall worker crashed for {appid}: {exc}")
        _set_state(appid, {"status": "failed", "error": str(exc)})


def uninstall(appid: int) -> Dict[str, Any]:
    """Queue a background uninstall of an ASSella-installed game."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    if not is_assella_install(appid):
        return {"success": False, "error": "Not an ASSella install"}
    _set_state(appid, {"status": "uninstalling", "op": "uninstall", "percent": 0})
    threading.Thread(target=_uninstall_worker, args=(appid,),
                     name=f"assella-rm-{appid}", daemon=True).start()
    return {"success": True}


# ── listing ────────────────────────────────────────────────────────────────

def list_installed() -> List[Dict[str, Any]]:
    """ASSella-installed games as installed-list entries (source='assella')."""
    out = []
    for key, rec in _load_records().items():
        try:
            appid = int(rec.get("appid", key))
        except Exception:
            continue
        out.append({
            "appid": appid,
            "gameName": rec.get("name", "") or f"Unknown Game ({appid})",
            "source": "assella",
            "filename": "",
            "isDisabled": False,
            "fileSize": int(rec.get("bytes", 0) or 0),
            "modifiedDate": "",
            "path": rec.get("dir", ""),
        })
    return out
