"""Steam path discovery and helpers for SteamOS / Steam Deck.

On SteamOS the Steam client lives under the user's home directory. The common
locations are ~/.steam/steam (a symlink), ~/.local/share/Steam and
~/.steam/root. SteamTools reads Lua manifest scripts from
<steam>/config/stplug-in and decrypted depot manifests from <steam>/depotcache,
mirroring the Windows layout the original plugin targeted.
"""

from __future__ import annotations

import os
import re
import subprocess
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home

_STEAM_PATH: Optional[str] = None


def _candidate_roots() -> List[str]:
    home = get_user_home()
    return [
        os.path.join(home, ".steam", "steam"),
        os.path.join(home, ".local", "share", "Steam"),
        os.path.join(home, ".steam", "root"),
        os.path.join(home, ".steam", "Steam"),
        "/home/deck/.steam/steam",
        "/home/deck/.local/share/Steam",
    ]


def detect_steam_install_path() -> str:
    """Return the cached Steam root or discover it. Empty string on failure."""
    global _STEAM_PATH
    if _STEAM_PATH:
        return _STEAM_PATH

    for candidate in _candidate_roots():
        try:
            real = os.path.realpath(candidate)
            if os.path.isdir(real) and (
                os.path.isdir(os.path.join(real, "steamapps"))
                or os.path.isdir(os.path.join(real, "config"))
            ):
                _STEAM_PATH = real
                logger.log(f"SLSDeck: Steam install path set to {real}")
                return real
        except Exception:
            continue

    logger.warn("SLSDeck: Could not detect a Steam installation path")
    _STEAM_PATH = ""
    return ""


def _loginusers_paths() -> List[str]:
    home = get_user_home()
    out = []
    base = detect_steam_install_path()
    if base:
        out.append(os.path.join(base, "config", "loginusers.vdf"))
    # explicit native + flatpak fallbacks
    out.append(os.path.join(home, ".steam", "steam", "config", "loginusers.vdf"))
    out.append(os.path.join(home, ".local", "share", "Steam", "config", "loginusers.vdf"))
    out.append(os.path.join(home, ".var", "app", "com.valvesoftware.Steam",
                            ".steam", "steam", "config", "loginusers.vdf"))
    seen, uniq = set(), []
    for p in out:
        if p and p not in seen:
            seen.add(p); uniq.append(p)
    return uniq


def resolve_persona_name() -> str:
    """The logged-in Steam account's display (persona) name, from loginusers.vdf.
    Prefers the MostRecent=1 account; falls back to the first PersonaName. Empty
    string if none found. Used as the default handle for online-fix emulators."""
    block_re = re.compile(r'"(\d{17})"\s*\{(.*?)\}', re.DOTALL)
    persona_re = re.compile(r'"PersonaName"\s*"([^"]*)"', re.IGNORECASE)
    recent_re = re.compile(r'"MostRecent"\s*"1"', re.IGNORECASE)
    for path in _loginusers_paths():
        try:
            if not os.path.isfile(path):
                continue
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
        except Exception:
            continue
        first = ""
        for m in block_re.finditer(text):
            body = m.group(2)
            pm = persona_re.search(body)
            name = pm.group(1).strip() if pm else ""
            if not name:
                continue
            if not first:
                first = name
            if recent_re.search(body):
                return name
        if first:
            return first
    return ""


def stplugin_dir() -> str:
    base = detect_steam_install_path()
    return os.path.join(base or "", "config", "stplug-in")


def depotcache_dir() -> str:
    base = detect_steam_install_path()
    return os.path.join(base or "", "depotcache")


def has_lua_for_app(appid: int) -> bool:
    try:
        target = stplugin_dir()
        if not target:
            return False
        lua_file = os.path.join(target, f"{appid}.lua")
        disabled_file = os.path.join(target, f"{appid}.lua.disabled")
        return os.path.exists(lua_file) or os.path.exists(disabled_file)
    except Exception as exc:
        logger.error(f"SLSDeck: Error checking Lua for {appid}: {exc}")
        return False


def _parse_vdf_simple(content: str) -> Dict[str, Any]:
    """Minimal VDF parser for libraryfolders.vdf / appmanifest files."""
    result: Dict[str, Any] = {}
    stack: List[Dict[str, Any]] = [result]
    current_key: Optional[str] = None

    tokens: List[str] = []
    for line in content.split("\n"):
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        tokens.extend(re.findall(r'"[^"]*"|\{|\}', line))

    for token in tokens:
        stripped = token.strip('"')
        if token == "{":
            if current_key is not None:
                new_dict: Dict[str, Any] = {}
                parent = stack[-1]
                if current_key in parent:
                    existing = parent[current_key]
                    if isinstance(existing, dict):
                        # merge into existing dict
                        stack.append(existing)
                    elif isinstance(existing, list):
                        existing.append(new_dict)
                        stack.append(new_dict)
                    else:
                        parent[current_key] = [existing, new_dict]
                        stack.append(new_dict)
                else:
                    parent[current_key] = new_dict
                    stack.append(new_dict)
                current_key = None
        elif token == "}":
            if len(stack) > 1:
                stack.pop()
        elif current_key is None:
            current_key = stripped
        else:
            parent = stack[-1]
            if current_key in parent:
                existing = parent[current_key]
                if isinstance(existing, list):
                    existing.append(stripped)
                else:
                    parent[current_key] = [existing, stripped]
            else:
                parent[current_key] = stripped
            current_key = None

    return result


def _library_vdf_paths() -> List[str]:
    base = detect_steam_install_path()
    if not base:
        return []
    return [
        os.path.join(base, "steamapps", "libraryfolders.vdf"),
        os.path.join(base, "config", "libraryfolders.vdf"),
    ]


def _all_library_paths() -> List[str]:
    paths: List[str] = []
    for vdf_path in _library_vdf_paths():
        if not os.path.exists(vdf_path):
            continue
        try:
            with open(vdf_path, "r", encoding="utf-8") as handle:
                data = _parse_vdf_simple(handle.read())
        except Exception:
            continue
        folders = data.get("libraryfolders", {})
        folder_items = folders.values() if isinstance(folders, dict) else (folders if isinstance(folders, list) else [])
        for folder in folder_items:
            if isinstance(folder, dict):
                folder_path = folder.get("path", "")
                if folder_path and folder_path not in paths:
                    paths.append(folder_path)
        if paths:
            break
    # Always include the base steam path as a library.
    base = detect_steam_install_path()
    if base and base not in paths:
        paths.append(base)
    return paths


def get_installed_depots(appid: int) -> Dict[str, str]:
    """Return {depotid: manifest_gid} for an installed game, read from its Steam
    appmanifest_<appid>.acf (AppState.InstalledDepots). Empty if not found."""
    try:
        appid = int(appid)
    except Exception:
        return {}
    for lib_path in _all_library_paths():
        manifest = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(manifest):
            continue
        try:
            with open(manifest, "r", encoding="utf-8") as handle:
                data = _parse_vdf_simple(handle.read())
        except Exception:
            continue
        app_state = data.get("AppState", {}) if isinstance(data, dict) else {}
        if isinstance(app_state, list):
            app_state = app_state[0] if app_state and isinstance(app_state[0], dict) else {}
        depots = (app_state or {}).get("InstalledDepots", {}) if isinstance(app_state, dict) else {}
        if isinstance(depots, list):
            merged_depots = {}
            for item in depots:
                if isinstance(item, dict):
                    merged_depots.update(item)
            depots = merged_depots
        out: Dict[str, str] = {}
        if isinstance(depots, dict):
            for depot_id, info in depots.items():
                if isinstance(info, dict) and info.get("manifest"):
                    out[str(depot_id)] = str(info["manifest"])
        return out
    return {}


_GENERIC_DIRS = {
    "bin", "bin64", "binaries", "win64", "win32", "x64", "x86", "x86_64",
    "game", "games", "app", "apps", "release", "retail", "redist", "current",
    "content", "data", "build", "shipping", "steamapps", "common",
    # system / flatpak / sandbox path segments — never a real app name
    "usr", "opt", "srv", "sbin", "lib", "lib64", "libexec", "run", "var",
    "local", "share", "flatpak", "exports", "home", "deck", "mnt", "media",
    ".local", ".var",
}
# Launcher/system executables whose path tells us nothing about the app (e.g. a
# flatpak shortcut is `/usr/bin/flatpak run <app-id>`), so we fall back to the
# shortcut's AppName instead of deriving a bogus name like "usr".
_LAUNCHER_EXES = {"flatpak", "flatpak-spawn", "env", "sh", "bash", "python", "python3"}


def _derive_app_name(exe: str, startdir: str) -> str:
    """Best-effort 'real' app name for a non-Steam shortcut: the deepest folder
    in the target exe's path that isn't a generic build folder (bin, Win64…).
    e.g. /Games/MyApp/Binaries/Win64/app.exe -> 'MyApp'. Returns "" when the path
    yields nothing meaningful (system/flatpak launcher) so the caller can use the
    shortcut's AppName."""
    exe = (exe or "").strip().strip('"').replace("\\", "/")
    startdir = (startdir or "").strip().strip('"').replace("\\", "/")
    base = exe.rsplit("/", 1)[-1].lower()
    if base in _LAUNCHER_EXES:
        return ""  # e.g. flatpak — the exe path is not the app
    # The exe's last segment is the executable itself — drop it to get its
    # containing folder. StartDir is already a folder, so keep it as-is.
    path = exe.rsplit("/", 1)[0] if ("/" in exe) else ""
    if not path:
        path = startdir
    parts = [p for p in path.split("/") if p and p not in (".", "..")]
    for cand in reversed(parts):
        if cand.lower() not in _GENERIC_DIRS:
            return cand
    return ""  # all-generic path -> let the caller fall back to AppName


def _parse_binary_vdf(data: bytes) -> Dict[str, Any]:
    """Minimal binary VDF (shortcuts.vdf) parser -> nested dict. Types: 0x00 map,
    0x01 string, 0x02 int32, 0x07 uint64; 0x08 ends a map."""
    n = len(data)

    def read_cstr(p):
        try:
            end = data.index(b"\x00", p)
        except ValueError:
            raise IndexError("Unterminated C-string in binary VDF")
        return data[p:end].decode("utf-8", "replace"), end + 1

    def parse_map(p):
        out: Dict[str, Any] = {}
        while p < n:
            t = data[p]; p += 1
            if t == 0x08:
                return out, p
            key, p = read_cstr(p)
            if t == 0x00:
                val, p = parse_map(p)
            elif t == 0x01:
                val, p = read_cstr(p)
            elif t == 0x02:
                if p + 4 > n:
                    raise IndexError("Truncated int32 in binary VDF")
                val = int.from_bytes(data[p:p + 4], "little", signed=True); p += 4
            elif t == 0x07:
                if p + 8 > n:
                    raise IndexError("Truncated uint64 in binary VDF")
                val = int.from_bytes(data[p:p + 8], "little", signed=False); p += 8
            else:
                return out, p  # unknown type — stop this map
            if key in out:
                existing = out[key]
                if isinstance(existing, list):
                    existing.append(val)
                else:
                    out[key] = [existing, val]
            else:
                out[key] = val
        return out, p

    try:
        root, _ = parse_map(0)
        return root
    except Exception:
        return {}


def _ci_get(d: Dict[str, Any], key: str):
    if not isinstance(d, dict):
        return None
    if key in d:
        return d[key]
    kl = key.lower()
    for k, v in d.items():
        if k.lower() == kl:
            return v
    return None


def get_nonsteam_apps() -> Dict[str, Any]:
    """Map each non-Steam shortcut's library appid (unsigned 32-bit, as the grid
    uses) -> a derived app name from its target exe folder. Read from Steam's
    shortcuts.vdf across all user profiles."""
    apps: Dict[str, str] = {}
    roots = []
    try:
        base = detect_steam_install_path()
        if base:
            roots.append(os.path.join(base, "userdata"))
    except Exception:
        pass
    from .paths import get_user_home
    roots.append(os.path.join(get_user_home(), ".steam", "steam", "userdata"))
    seen_roots = set()
    for ud in roots:
        if ud in seen_roots or not os.path.isdir(ud):
            continue
        seen_roots.add(ud)
        try:
            users = [d for d in os.listdir(ud) if d.isdigit() and d != "0"]
        except Exception:
            users = []
        for u in users:
            vdf_path = os.path.join(ud, u, "config", "shortcuts.vdf")
            if not os.path.isfile(vdf_path):
                continue
            try:
                with open(vdf_path, "rb") as fh:
                    root = _parse_binary_vdf(fh.read())
            except Exception:
                continue
            shortcuts = _ci_get(root, "shortcuts") or {}
            if not isinstance(shortcuts, dict):
                continue
            for _idx, entry in shortcuts.items():
                if not isinstance(entry, dict):
                    continue
                appid = _ci_get(entry, "appid")
                if appid is None:
                    continue
                uappid = appid & 0xFFFFFFFF if isinstance(appid, int) and appid < 0 else appid
                exe = str(_ci_get(entry, "Exe") or "")
                startdir = str(_ci_get(entry, "StartDir") or "")
                name = _derive_app_name(exe, startdir) or str(_ci_get(entry, "AppName") or "")
                if name:
                    apps[str(uappid)] = name
    return {"success": True, "apps": apps}


def remove_added_game(appid: int) -> Dict[str, Any]:
    """Delete a SLSsteam-added game's Steam appmanifest AND its installed files.

    SAFETY: the caller MUST only pass appids that were added via SLSsteam
    (AdditionalApps / everAdded) — never a legit-owned game. Extra guards: the
    folder is only removed when it is a direct child of <library>/steamapps/common
    and installdir is a plain name (no path separators)."""
    import shutil as _sh
    try:
        appid = int(appid)
    except Exception:
        return {"appid": appid, "removed": False, "error": "invalid appid"}
    for lib in _all_library_paths():
        acf = os.path.join(lib, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(acf):
            continue
        result = {"appid": appid, "removed": True, "acf": None, "dir": None}
        try:
            data = _parse_vdf_simple(open(acf, "r", encoding="utf-8").read())
            installdir = (data.get("AppState", {}) or {}).get("installdir", "")
        except Exception:
            installdir = ""
        if installdir and not any(c in installdir for c in ("/", "\\")) and installdir not in (".", ".."):
            common = os.path.join(lib, "steamapps", "common")
            game_dir = os.path.join(common, installdir)
            if os.path.isdir(game_dir) and os.path.dirname(os.path.normpath(game_dir)) == os.path.normpath(common):
                try:
                    _sh.rmtree(game_dir, ignore_errors=True)
                    result["dir"] = game_dir
                except Exception:
                    pass
        try:
            os.remove(acf)
            result["acf"] = acf
        except Exception:
            pass
        return result
    return {"appid": appid, "removed": False}


def app_download_complete(appid: int) -> Dict[str, Any]:
    """True only when the game has actually finished downloading to disk — the
    appmanifest shows FullyInstalled with no update-required / files-missing and
    real bytes on disk. A created-but-empty install folder (StateFlags 4|32,
    SizeOnDisk 0) returns False. Used to gate auto-fix so it never applies to a
    mid-download or empty install."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "complete": False, "error": "invalid appid"}
    for lib_path in _all_library_paths():
        manifest = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(manifest):
            continue
        try:
            data = _parse_vdf_simple(open(manifest, "r", encoding="utf-8").read())
        except Exception:
            continue
        st = data.get("AppState", {}) or {}

        def _i(k):
            try:
                return int(str(st.get(k, "0")))
            except Exception:
                return 0

        flags = _i("StateFlags")
        size = _i("SizeOnDisk")
        btd, bd = _i("BytesToDownload"), _i("BytesDownloaded")
        complete = bool(
            (flags & 4) and not (flags & 2) and not (flags & 32)
            and size > 0 and (btd == 0 or bd >= btd)
        )
        return {"success": True, "complete": complete,
                "stateFlags": flags, "sizeOnDisk": size}
    return {"success": True, "complete": False, "error": "no appmanifest"}


def _phantom_acf_paths(appid: int) -> List[str]:
    """appmanifest paths for `appid` that describe a PHANTOM install: Steam
    marked the app fully installed (StateFlags bit 4) while nothing was actually
    downloaded — zero bytes on disk AND zero InstalledDepots.

    This is what Steam writes when it is told to install an app whose depots it
    cannot resolve (i.e. SLSsteam was not injecting, so the app was not treated
    as owned). The app then sits in the library as "installed" forever: Play
    does nothing and Steam will never download it, because as far as Steam is
    concerned the install already succeeded.

    A genuinely installed game always has SizeOnDisk > 0 and a non-empty
    InstalledDepots, so this cannot match a real install."""
    out: List[str] = []
    for lib_path in _all_library_paths():
        manifest = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(manifest):
            continue
        try:
            data = _parse_vdf_simple(open(manifest, "r", encoding="utf-8").read())
        except Exception:
            continue
        st = data.get("AppState", {}) or {}
        if not isinstance(st, dict):
            continue

        def _i(k):
            try:
                return int(str(st.get(k, "0")))
            except Exception:
                return 0

        depots = st.get("InstalledDepots") or {}
        depot_count = len(depots) if isinstance(depots, dict) else 0
        if (_i("StateFlags") & 4) and _i("SizeOnDisk") == 0 \
                and _i("BytesDownloaded") == 0 and depot_count == 0:
            out.append(manifest)
    return out


def is_phantom_install(appid: int) -> Dict[str, Any]:
    """True when `appid` is stuck in the phantom "installed but empty" state."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    paths = _phantom_acf_paths(appid)
    return {"success": True, "appid": appid, "phantom": bool(paths), "paths": paths}


def clear_phantom_install(appid: int) -> Dict[str, Any]:
    """Remove a phantom appmanifest so Steam shows the game as uninstalled again
    and will re-resolve its depots on the next install attempt.

    Only ever deletes the .acf — never game files — and only when the manifest
    matches the strict phantom signature above."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    removed: List[str] = []
    for manifest in _phantom_acf_paths(appid):
        try:
            os.remove(manifest)
            removed.append(manifest)
        except Exception as exc:
            logger.warn(f"SLSDeck: could not remove phantom acf {manifest}: {exc}")
    if removed:
        logger.log(f"SLSDeck: cleared phantom install for {appid} ({len(removed)} manifest(s))")
    return {"success": True, "appid": appid, "cleared": bool(removed), "removed": removed}


def _match_brace(text: str, open_idx: int) -> int:
    """Index of the '}' matching the '{' at open_idx, or -1. Quote-aware."""
    depth, i, n, in_str = 0, open_idx, len(text), False
    while i < n:
        c = text[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _depots_block(text: str):
    """(open_brace_idx, close_brace_idx) of the config.vdf "depots" map that holds
    DecryptionKey entries, or None. config.vdf can contain more than one "depots"
    key, so pick the one that actually stores decryption keys."""
    pos = 0
    while True:
        k = text.find('"depots"', pos)
        if k < 0:
            return None
        ob = text.find("{", k)
        if ob < 0:
            return None
        cb = _match_brace(text, ob)
        if cb < 0:
            return None
        body = text[ob:cb]
        # The real one either already has keys, or is empty (first ever write).
        if "DecryptionKey" in body or not body.strip("{} \t\r\n"):
            return ob, cb
        pos = cb
    return None


def set_depot_decryption_keys(keys: Dict[int, str]) -> Dict[str, Any]:
    """Write depot decryption keys into Steam's config/config.vdf.

    THIS is how Steam actually obtains a depot key locally. Without an entry here
    Steam asks Valve for the key, is refused for an app the account has no license
    for, and the download dies with "Missing decryption key" — which is exactly
    what SLSDeck-added games hit. Games whose depots DO have an entry here download
    normally, which is the differential that identified this.

    `keys` maps depot id -> 64-char hex key (the form used by addappid(id,1,"...")).

    NOTE: Steam rewrites config.vdf from memory when it exits, so edits made while
    Steam is running are lost. Callers should apply these with Steam stopped, or
    restart Steam afterwards and re-apply."""
    clean: Dict[int, str] = {}
    for dep, hexkey in (keys or {}).items():
        try:
            d = int(dep)
        except Exception:
            continue
        h = str(hexkey or "").strip().lower()
        if d > 0 and re.fullmatch(r"[0-9a-f]{64}", h):
            clean[d] = h
    if not clean:
        return {"success": True, "written": 0, "skipped": 0, "note": "no valid keys"}

    base = detect_steam_install_path()
    if not base:
        return {"success": False, "error": "Steam install path not found"}
    path = os.path.join(base, "config", "config.vdf")
    if not os.path.isfile(path):
        return {"success": False, "error": f"config.vdf not found at {path}"}
    try:
        text = open(path, "r", encoding="utf-8", errors="ignore").read()
    except Exception as exc:
        return {"success": False, "error": f"read failed: {exc}"}

    blk = _depots_block(text)
    if not blk:
        return {"success": False, "error": 'no "depots" block in config.vdf'}
    ob, cb = blk
    body = text[ob + 1:cb]

    # Indentation of an existing entry, so our additions match Steam's formatting.
    m = re.search(r'\n(\t+)"\d+"\s*\n\1\{', body)
    ind = m.group(1) if m else "\t" * 5
    kind = ind + "\t"

    written = skipped = updated = 0
    for dep, h in sorted(clean.items()):
        ent = re.search(rf'\n(\t*)"{dep}"\s*\n\1\{{(.*?)\n\1\}}', body, re.DOTALL)
        if ent:
            cur = re.search(r'"DecryptionKey"\s+"([0-9a-fA-F]+)"', ent.group(2))
            if cur and cur.group(1).lower() == h:
                skipped += 1
                continue
            inner = f'\n{ent.group(1)}\t"DecryptionKey"\t\t"{h}"'
            body = body[:ent.start(2)] + inner + body[ent.end(2):]
            updated += 1
        else:
            body = (f'\n{ind}"{dep}"\n{ind}{{\n{kind}"DecryptionKey"\t\t"{h}"\n{ind}}}'
                    + body)
            written += 1

    if not (written or updated):
        return {"success": True, "written": 0, "updated": 0, "skipped": skipped,
                "note": "all keys already present"}

    new_text = text[:ob + 1] + body + text[cb:]
    try:
        bak = path + ".slsdeck.bak"
        if not os.path.exists(bak):
            import shutil as _sh
            _sh.copy2(path, bak)
        tmp = path + ".slsdeck.tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(new_text)
        try:
            os.chmod(tmp, 0o644)
        except Exception:
            pass
        from .utils import chown_to_user
        try:
            chown_to_user(tmp, recursive=False)
        except Exception:
            pass
        os.replace(tmp, path)
    except Exception as exc:
        return {"success": False, "error": f"write failed: {exc}"}

    logger.log(f"SLSDeck: config.vdf depot keys — {written} added, "
               f"{updated} updated, {skipped} already correct")
    return {"success": True, "written": written, "updated": updated,
            "skipped": skipped, "path": path}


def restore_manifests_to_depotcache(appid: int) -> Dict[str, Any]:
    """Copy the manifests SLSDeck published into Steam's depotcache/.

    smart_merge publishes to the ManifestStore (~/.config/SLSsteam/manifests) and
    relies on slsteam-moon's restoreToDepotcache to move them into Steam's own
    depotcache. Stock upstream SLSsteam has no such step, so the manifests never
    reach Steam. Do it ourselves. `.preferred_<depot>` names the gid to use."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    from .paths import get_user_home
    store = os.path.join(get_user_home(), ".config", "SLSsteam", "manifests")
    base = detect_steam_install_path()
    if not base:
        return {"success": False, "error": "Steam install path not found"}
    dest_dir = os.path.join(base, "depotcache")
    if not os.path.isdir(store):
        return {"success": True, "copied": 0, "note": "no ManifestStore"}
    try:
        os.makedirs(dest_dir, exist_ok=True)
    except Exception as exc:
        return {"success": False, "error": f"cannot create depotcache: {exc}"}

    import shutil as _sh
    preferred: Dict[str, str] = {}
    try:
        for fn in os.listdir(store):
            if fn.startswith(".preferred_"):
                dep = fn[len(".preferred_"):]
                try:
                    preferred[dep] = open(os.path.join(store, fn), "r",
                                          encoding="utf-8").read().strip()
                except Exception:
                    pass
    except Exception as exc:
        return {"success": False, "error": f"cannot read ManifestStore: {exc}"}

    copied, failed = [], []
    for dep, gid in preferred.items():
        if not (dep.isdigit() and gid.isdigit()):
            continue
        name = f"{dep}_{gid}.manifest"
        src, dst = os.path.join(store, name), os.path.join(dest_dir, name)
        if not os.path.isfile(src):
            failed.append(name)
            continue
        try:
            if os.path.isfile(dst) and os.path.getsize(dst) == os.path.getsize(src):
                continue
            _sh.copy2(src, dst)
            try:
                os.chmod(dst, 0o644)
                from .utils import chown_to_user
                chown_to_user(dst, recursive=False)
            except Exception:
                pass
            copied.append(name)
        except Exception:
            failed.append(name)
    if copied:
        logger.log(f"SLSDeck: restored {len(copied)} manifest(s) to depotcache for {appid}")
    return {"success": True, "copied": len(copied), "files": copied, "failed": failed}


def restore_manifests_to_depotcache_all() -> Dict[str, Any]:
    """Refresh depotcache for every added game (cheap, no Steam restart)."""
    plug = stplugin_dir()
    copied, apps = 0, []
    if os.path.isdir(plug):
        for fn in sorted(os.listdir(plug)):
            m = re.fullmatch(r"(\d+)\.lua", fn)
            if not m:
                continue
            appid = int(m.group(1))
            apps.append(appid)
            try:
                copied += int(restore_manifests_to_depotcache(appid).get("copied", 0))
            except Exception:
                pass
    return {"apps": len(apps), "copied": copied}


def provision_all_added_depots() -> Dict[str, Any]:
    """Re-apply depot keys + depotcache manifests for EVERY game SLSDeck added.

    Steam rewrites config.vdf from memory when it exits, silently discarding keys
    written while it was running. So this is idempotent and meant to be re-run --
    ideally with Steam closed. Reads the keys back out of the stplug-in luas that
    smart_merge already wrote, so it needs no network."""
    base = detect_steam_install_path()
    if not base:
        return {"success": False, "error": "Steam install path not found"}
    plug = stplugin_dir()
    if not os.path.isdir(plug):
        return {"success": True, "apps": 0, "note": "no stplug-in directory"}

    all_keys: Dict[int, str] = {}
    apps: List[int] = []
    for fn in sorted(os.listdir(plug)):
        m = re.fullmatch(r"(\d+)\.lua", fn)
        if not m:
            continue
        appid = int(m.group(1))
        apps.append(appid)
        try:
            lua = open(os.path.join(plug, fn), "r", encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        for dep, key in re.findall(
                r'addappid\(\s*(\d+)\s*,\s*1\s*,\s*"([0-9a-fA-F]{64})"\s*\)', lua):
            all_keys[int(dep)] = key.lower()

    kres = set_depot_decryption_keys(all_keys)
    copied, cleared = 0, []
    for appid in apps:
        try:
            copied += int(restore_manifests_to_depotcache(appid).get("copied", 0))
        except Exception:
            pass
        # A phantom manifest makes Steam believe the game is installed, so it will
        # never retry the download no matter how correct the keys now are.
        try:
            if clear_phantom_install(appid).get("cleared"):
                cleared.append(appid)
        except Exception:
            pass
    logger.log(f"SLSDeck: provisioned {len(apps)} added app(s), "
               f"{kres.get('written', 0)} new key(s), {copied} manifest(s), "
               f"{len(cleared)} phantom(s) cleared")
    return {"success": True, "apps": apps, "keys": kres,
            "manifestsCopied": copied, "phantomsCleared": cleared}


def _steam_pid() -> Optional[int]:
    """PID of the running Steam client, or None."""
    for rel in (os.path.join(".steam", "steam.pid"), os.path.join(".steam", "pid")):
        p = os.path.join(get_user_home(), rel)
        try:
            pid = int(open(p, "r", encoding="utf-8").read().strip())
        except Exception:
            continue
        if pid > 0 and os.path.isdir(f"/proc/{pid}"):
            try:
                comm = open(f"/proc/{pid}/comm", "r", encoding="utf-8").read().strip()
            except Exception:
                return pid
            if "steam" in comm.lower():
                return pid
    return None


def steam_is_running() -> bool:
    """True if the Steam client is up (best effort, via ~/.steam/steam.pid)."""
    return _steam_pid() is not None


def _steam_relaunch_argv() -> List[str]:
    """The argv to relaunch Steam with, copied from the process we are about to
    stop.

    In Game Mode the session runs `steam -gamepadui` under gamescope-session.
    Relaunching with a bare `steam` would start the desktop client in the wrong
    compositor -- i.e. the user shuts Steam down for provisioning and Game Mode
    never comes back. So replay the exact argv, and only fall back to bare
    `steam` if /proc is unreadable."""
    pid = _steam_pid()
    if pid:
        try:
            raw = open(f"/proc/{pid}/cmdline", "rb").read()
            argv = [a.decode("utf-8", "replace") for a in raw.split(b"\x00") if a]
            if argv:
                # Re-exec through the `steam` wrapper (so steam.sh re-reads
                # LD_AUDIT) but keep the original flags, e.g. -gamepadui.
                return ["steam"] + argv[1:]
        except Exception:
            pass
    return ["steam"]


def provision_and_restart(timeout: int = 45) -> Dict[str, Any]:
    """Shut Steam down, provision depot keys/manifests while it is CLOSED, then
    start it again.

    Steam holds config.vdf in memory and rewrites it wholesale on exit, so any
    depot key written while Steam is running is silently discarded at shutdown --
    which is exactly what happened to the first attempt at this fix. The only
    reliable window is after Steam has fully exited and before it starts again,
    so do all three steps in that gap."""
    from . import slssteam

    # FAST PATH: slsteam-moon does not need a Steam restart at all.
    #
    # It runs an inotify FileWatcher on config.yaml AND config/stplug-in, and it
    # answers Steam's depot-key request at runtime ("DepotKey: substituting cached
    # key for depot N"). So a freshly added game's lua is picked up live -- the
    # engine log shows the imported key count climbing 24 -> 45 -> 58 across adds
    # with no restart in between.
    #
    # The shutdown/relaunch sequence below exists only because STOCK upstream
    # SLSsteam has no depot-key support, so the keys had to be written into
    # Steam's config.vdf, which Steam only re-reads at startup and rewrites on
    # exit. On the moon that whole dance is unnecessary -- and skipping it removes
    # the riskiest thing this plugin does, since stopping Steam in Game Mode and
    # relaunching it is what could strand the user with no session.
    try:
        if slssteam.installed_lib_is_moon().get("moon"):
            res = {"success": True, "restarted": False,
                   "reason": "slsteam-moon picks up new games live — no Steam restart needed"}
            try:
                res["manifests"] = restore_manifests_to_depotcache_all()
            except Exception as exc:
                logger.warn(f"SLSDeck: depotcache refresh failed: {exc}")
            # Nudge the engine's file watcher so it re-imports immediately rather
            # than waiting for the next natural write.
            try:
                cfg = slssteam.config_path()
                if os.path.isfile(cfg):
                    os.utime(cfg, None)
            except Exception:
                pass
            logger.log("SLSDeck: skipped Steam restart (slsteam-moon hot-reloads)")
            return res
    except Exception as exc:
        logger.warn(f"SLSDeck: engine check failed, falling back to restart: {exc}")

    was_running = steam_is_running()
    # Capture how Steam is currently running BEFORE stopping it, so Game Mode
    # comes back as Game Mode.
    relaunch = _steam_relaunch_argv() if was_running else ["steam"]
    if was_running:
        try:
            subprocess.Popen(
                slssteam._wrap_as_user(["bash", "-lc", "steam -shutdown"]),
                env=slssteam._rich_env(), stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
        except Exception as exc:
            return {"success": False, "error": f"could not ask Steam to shut down: {exc}"}
        waited = 0.0
        while steam_is_running() and waited < timeout:
            time.sleep(1.0)
            waited += 1.0
        if steam_is_running():
            return {"success": False, "code": "steam_did_not_exit", "error":
                    f"Steam did not exit within {timeout}s. Depot keys were NOT "
                    "written, because Steam would overwrite config.vdf on its "
                    "shutdown anyway. Close Steam manually and try again."}
        # Steam flushes config.vdf asynchronously as it tears down.
        time.sleep(2.0)

    res = provision_all_added_depots()

    if was_running:
        try:
            import shlex
            cmd = " ".join(shlex.quote(a) for a in relaunch)
            subprocess.Popen(
                slssteam._wrap_as_user(["bash", "-lc", f"nohup {cmd} >/dev/null 2>&1 &"]),
                env=slssteam._rich_env(), stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            res["relaunchArgv"] = relaunch
        except Exception as exc:
            res["relaunchError"] = str(exc)
    res["steamWasRunning"] = was_running
    return res


def download_preflight(appid: int) -> Dict[str, Any]:
    """Check EVERY precondition an unowned app needs before Steam will download it.

    Existed because attempts kept failing ambiguously: Steam just logs
    "0 active: 0 target:" and "Missing decryption key" without saying which
    precondition was absent, and the depot keys kept being wiped by Steam before
    an attempt could use them -- so failures proved nothing. Run this immediately
    before pressing Install; every item must be ok."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}

    from . import slssteam
    checks = []

    def add(key, ok, detail):
        checks.append({"check": key, "ok": bool(ok), "detail": detail})

    # 1. SLSsteam must be injecting, or Steam never treats the app as owned.
    try:
        inj = slssteam._injection_functional()
    except Exception:
        inj = False
    add("injection_live", inj,
        "SLSsteam is loaded into the running Steam process" if inj else
        "SLSsteam is NOT injecting - Steam will deny the ownership ticket")

    # 2. App registered with SLSsteam.
    try:
        listed = appid in set(slssteam.read_additional_apps())
    except Exception:
        listed = False
    add("in_additional_apps", listed,
        f"{appid} is in AdditionalApps" if listed else
        f"{appid} missing from AdditionalApps in config.yaml")

    # 3. DisableUpdates must be off, or SLSsteam hands Steam zero depots.
    du_ok = False
    try:
        cfg = open(slssteam.config_path(), "r", encoding="utf-8").read()
        m = re.search(r"^DisableUpdates[ \t]*:[ \t]*(\S+)", cfg, re.MULTILINE)
        du_ok = bool(m and m.group(1).strip().lower() in ("no", "false"))
        detail = (f"DisableUpdates: {m.group(1)}" if m else
                  "DisableUpdates key ABSENT - SLSsteam defaults it to yes, which "
                  "gives unowned apps zero depots")
    except Exception as exc:
        detail = f"could not read config.yaml: {exc}"
    add("disable_updates_off", du_ok, detail)

    # 4. Depot keys present in config.vdf RIGHT NOW. This is the one that keeps
    #    silently reverting: Steam rewrites config.vdf from memory on exit.
    want, have = set(), set()
    try:
        lua = os.path.join(stplugin_dir(), f"{appid}.lua")
        if os.path.isfile(lua):
            txt = open(lua, "r", encoding="utf-8", errors="ignore").read()
            want = {d for d, _k in re.findall(
                r'addappid\(\s*(\d+)\s*,\s*1\s*,\s*"([0-9a-fA-F]{64})"\s*\)', txt)}
        base = detect_steam_install_path()
        vdf = os.path.join(base or "", "config", "config.vdf")
        if os.path.isfile(vdf):
            t = open(vdf, "r", encoding="utf-8", errors="ignore").read()
            blk = t[t.find('"depots"'):]
            have = set(re.findall(r'"(\d+)"\s*\n\s*\{\s*\n\s*"DecryptionKey"', blk))
    except Exception:
        pass
    missing = sorted(want - have)
    add("depot_keys_in_config_vdf", bool(want) and not missing,
        f"{len(want - set(missing))}/{len(want)} depot keys present in config.vdf" +
        (f"; MISSING {missing[:6]}{'…' if len(missing) > 6 else ''}" if missing else "")
        if want else "no depot keys found in the game's .lua")

    # 5. Manifests in Steam's depotcache.
    dc_ok, dc_detail = False, "depotcache not found"
    try:
        base = detect_steam_install_path()
        dc = os.path.join(base or "", "depotcache")
        if os.path.isdir(dc):
            names = os.listdir(dc)
            present = {n.split("_")[0] for n in names if n.endswith(".manifest")}
            hit = want & present
            dc_ok = bool(want) and len(hit) > 0
            dc_detail = f"{len(hit)}/{len(want)} depots have a manifest in depotcache"
    except Exception as exc:
        dc_detail = str(exc)
    add("manifests_in_depotcache", dc_ok, dc_detail)

    # 6. No phantom manifest -- Steam skips an app it believes is installed.
    ph = is_phantom_install(appid).get("phantom")
    add("no_phantom_manifest", not ph,
        "phantom appmanifest present: Steam thinks this is already installed and "
        "will not download it" if ph else "no phantom manifest")

    failed = [c["check"] for c in checks if not c["ok"]]
    return {"success": True, "appid": appid, "ready": not failed,
            "failed": failed, "checks": checks}


def download_diagnosis(appid: int) -> Dict[str, Any]:
    """What did Steam actually say about the LAST install attempt for this app?

    Reads Steam's own content_log so a failure names its cause instead of us
    guessing. Critically it also reports the TARGET DEPOT COUNT: '0 target' means
    Steam never even tried, which is a completely different failure from a
    download that started and then hit a missing key."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    base = detect_steam_install_path()
    log = os.path.join(base or "", "logs", "content_log.txt")
    if not os.path.isfile(log):
        return {"success": False, "error": "content_log.txt not found"}
    try:
        lines = open(log, "r", encoding="utf-8", errors="ignore").read().splitlines()
    except Exception as exc:
        return {"success": False, "error": str(exc)}

    tag = f"AppID {appid} "
    rel = [ln for ln in lines if tag in ln]
    if not rel:
        return {"success": True, "appid": appid, "attempted": False,
                "summary": "Steam has no record of an install attempt for this app."}

    out = {"success": True, "appid": appid, "attempted": True}
    for ln in reversed(rel):
        if "scheduler finished" in ln and "result" not in out:
            m = re.search(r"result ([^,]+)", ln)
            if m:
                out["result"] = m.group(1).strip()
                out["resultLine"] = ln.strip()
        if "finished update" in ln and "mountedDepots" not in out:
            m = re.search(r"finished update, (\d+) mounted depots", ln)
            if m:
                out["mountedDepots"] = int(m.group(1))
        if " target: " in ln and "targetDepots" not in out:
            after = ln.split(" target:", 1)[1].strip()
            out["targetDepots"] = len([x for x in after.split(",") if x.strip()])
        if "ownership ticket" in ln and "ownershipTicket" not in out:
            out["ownershipTicket"] = "denied" if "Denied" in ln else "ok"
        if all(k in out for k in ("result", "mountedDepots", "targetDepots")):
            break

    md, td = out.get("mountedDepots"), out.get("targetDepots")
    if td == 0:
        out["summary"] = ("Steam targeted ZERO depots - it never attempted a download. "
                          "That points at ownership/DisableUpdates, NOT at depot keys.")
    elif md == 0 and "decryption" in str(out.get("result", "")).lower():
        out["summary"] = ("Steam targeted depots but could not decrypt them - the depot "
                          "keys were not in config.vdf when it tried.")
    elif md and md > 0:
        out["summary"] = f"Steam mounted {md} depot(s) - the download path is working."
    else:
        out["summary"] = f"Last result: {out.get('result', 'unknown')}"
    return out


def get_install_dir_from_acf(steamapps_dir: str, appid: int) -> Optional[str]:
    """Given a steamapps directory and AppID, resolve the full install path under steamapps/common/."""
    acf = os.path.join(steamapps_dir, f"appmanifest_{appid}.acf")
    if not os.path.isfile(acf):
        return None
    try:
        data = _parse_vdf_simple(open(acf, "r", encoding="utf-8", errors="ignore").read())
        installdir = (data.get("AppState", {}) or {}).get("installdir", "")
        if installdir:
            cand = os.path.join(steamapps_dir, "common", installdir)
            if os.path.isdir(cand):
                return cand
    except Exception:
        pass
    return None


def set_only_update_on_launch(appid: int) -> Dict[str, Any]:
    """Set AutoUpdateBehavior=1 ("Only update this game when I launch it") in the
    game's appmanifest, to stop Steam from spamming background updates for an
    SLSsteam-added game whose build Steam thinks is out of date. Best-effort."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    for lib_path in _all_library_paths():
        p = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(p):
            continue
        try:
            txt = open(p, "r", encoding="utf-8").read()
        except Exception as exc:
            return {"success": False, "error": str(exc)}
        if re.search(r'"AutoUpdateBehavior"\s+"\d+"', txt):
            new_txt = re.sub(r'("AutoUpdateBehavior"\s+")\d+(")', r'\g<1>1\g<2>', txt, count=1)
        else:
            m = re.search(r'("appid"\s+"' + str(appid) + r'"\s*\n)', txt)
            if not m:
                return {"success": False, "error": "could not find appid line in acf"}
            ins = m.group(1) + '\t"AutoUpdateBehavior"\t\t"1"\n'
            new_txt = txt[:m.start()] + ins + txt[m.end():]
        if new_txt == txt:
            return {"success": True, "changed": False, "path": p}
        try:
            tmp = p + ".sltmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                fh.write(new_txt)
            os.replace(tmp, p)
            try:
                from .utils import chown_to_user
                chown_to_user(p)
            except Exception:
                pass
        except Exception as exc:
            return {"success": False, "error": f"write failed: {exc}"}
        return {"success": True, "changed": True, "path": p}
    return {"success": False, "error": "appmanifest not found"}


def get_game_install_path_response(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    appid_str = str(appid)
    for lib_path in _all_library_paths():
        manifest = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
        if not os.path.exists(manifest):
            continue
        try:
            with open(manifest, "r", encoding="utf-8") as handle:
                data = _parse_vdf_simple(handle.read())
        except Exception as exc:
            logger.warn(f"SLSDeck: Failed to parse appmanifest for {appid}: {exc}")
            continue
        app_state = data.get("AppState", {})
        install_dir = app_state.get("installdir", "")
        if not install_dir:
            continue
        full = os.path.join(lib_path, "steamapps", "common", install_dir)
        if os.path.exists(full):
            return {
                "success": True,
                "installPath": full,
                "installDir": install_dir,
                "libraryPath": lib_path,
                "path": full,
                "name": app_state.get("name", ""),
            }

    return {"success": False, "error": "menu.error.notInstalled"}


def list_installed_games() -> List[Dict[str, Any]]:
    """Return every installed game across libraries (appid, name, installPath)."""
    games: List[Dict[str, Any]] = []
    seen = set()
    for lib_path in _all_library_paths():
        steamapps = os.path.join(lib_path, "steamapps")
        if not os.path.isdir(steamapps):
            continue
        try:
            names = os.listdir(steamapps)
        except Exception:
            continue
        for filename in names:
            if not (filename.startswith("appmanifest_") and filename.endswith(".acf")):
                continue
            try:
                appid = int(filename[len("appmanifest_"):-len(".acf")])
            except Exception:
                continue
            if appid in seen:
                continue
            try:
                with open(os.path.join(steamapps, filename), "r", encoding="utf-8") as handle:
                    data = _parse_vdf_simple(handle.read())
            except Exception:
                continue
            app_state = data.get("AppState", {})
            install_dir = app_state.get("installdir", "")
            if not install_dir:
                continue
            full = os.path.join(lib_path, "steamapps", "common", install_dir)
            seen.add(appid)
            games.append({
                "appid": appid,
                "name": app_state.get("name", f"App {appid}"),
                "installPath": full,
                "libraryPath": lib_path,
            })
    return games


def open_game_folder(path: str) -> bool:
    try:
        if not path or not os.path.exists(path):
            return False
        subprocess.Popen(["xdg-open", path])
        return True
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to open folder: {exc}")
        return False


def restart_steam() -> Dict[str, Any]:
    """Best-effort Steam restart from the backend.

    The frontend prefers ``SteamClient.User.StartRestart()`` which is reliable
    inside gamemode; this backend path is a fallback for when that is
    unavailable.

    This MUST both shut Steam down *and* bring it back up, and the relaunch has
    to go through ``steam.sh`` so ``LD_AUDIT`` is re-read and SLSsteam actually
    injects again. A shutdown-only restart leaves Steam dead; a soft relaunch of
    the bare client leaves injection off, which makes freshly added games
    resolve zero depots and "install" instantly with no files on disk.
    ``slssteam.restart_steam_apply()` already implements exactly that (runs as
    the desktop user with a full env), so delegate to it.
    """
    try:
        from . import slssteam  # local import: slssteam imports this module
        res = slssteam.restart_steam_apply()
        if res.get("success"):
            return {"success": True, "method": "steam.sh-reexec"}
        logger.warn(f"SLSDeck: restart_steam_apply failed: {res.get('error')}")
    except Exception as exc:
        logger.warn(f"SLSDeck: restart_steam delegation failed: {exc}")

    # Fallback: shut down and relaunch directly. Still re-execs steam.sh via the
    # `steam` wrapper, so injection is preserved.
    try:
        from .utils import decky_user
        cmd = ["bash", "-lc",
               "steam -shutdown >/dev/null 2>&1; sleep 5; nohup steam >/dev/null 2>&1 &"]
        if os.geteuid() == 0:
            cmd = ["sudo", "-u", decky_user(), "-i"] + cmd
        subprocess.Popen(
            cmd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        return {"success": True, "method": "shutdown-relaunch"}
    except Exception as exc:
        logger.warn(f"SLSDeck: restart_steam failed: {exc}")
        return {"success": False, "error": str(exc)}
