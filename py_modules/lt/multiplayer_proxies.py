"""Manual, per-game installs of upstream multiplayer API proxy DLLs."""

import io
import os
import shutil
import threading
import zipfile

from . import fixes, slssteam, settings
from .httpc import ensure_http_client
from .logger import logger
from .paths import runtime_path
from .steam import get_game_install_path_response
from .utils import chown_to_user


SOURCES = {
    "uc-online2": ("UnionCrax-Team/uc-online2", "UC Online 2", ("steam_api.dll", "steam_api64.dll")),
    "eos-proxy": ("yesyes0649/eos-proxy", "EOS Proxy", ("EOSSDK-Win64-Shipping.dll",)),
}
_locks = {}
_guard = threading.Lock()
_cache_locks = {key: threading.Lock() for key in ("uc-online2", "eos-proxy", "eos-proxy-absolum")}


def _game(appid):
    result = get_game_install_path_response(int(appid))
    path = result.get("installPath") if result.get("success") else None
    if not path or not os.path.isdir(path):
        raise ValueError("Install the game before applying this fix")
    return path


def _targets(path, kind):
    names = {name.casefold() for name in SOURCES[kind][2]}
    found = []
    for root, dirs, files in os.walk(path, followlinks=False):
        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d))]
        for file in files:
            full = os.path.join(root, file)
            if file.casefold() in names and not os.path.islink(full):
                found.append(os.path.relpath(full, path).replace(os.sep, "/"))
    return sorted(found)


def _records(path, appid):
    log = fixes._fix_log_path(path, appid)
    if not os.path.isfile(log):
        return []
    with open(log, encoding="utf-8") as handle:
        return fixes._parse_fix_log(handle.read(), appid, "", path)


def status(appid):
    try:
        path = _game(appid)
        records = _records(path, int(appid))
        return {"success": True, "fixes": {
            key: {"targets": _targets(path, key),
                  "installed": any(r["fixType"] == spec[1] for r in records)}
            for key, spec in SOURCES.items()}}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _release_assets(kind, appid, names):
    repo = SOURCES[kind][0]
    client = ensure_http_client("SLSDeck: multiplayer proxy release")
    endpoint = (f"https://api.github.com/repos/{repo}/releases/tags/absolum"
                if kind == "eos-proxy" and int(appid) == 1904480 else
                f"https://api.github.com/repos/{repo}/releases/latest")
    response = client.get(endpoint, headers={"Accept": "application/vnd.github+json", "User-Agent": "SLSDeck"}, timeout=20)
    response.raise_for_status()
    release = response.json()
    assets = release.get("assets", [])
    archives = [a for a in assets if a.get("name", "").lower().endswith(".zip")
                and "src" not in a.get("name", "").lower()]
    direct = {name: [a for a in assets if a.get("name", "").casefold() == name]
              for name in names}
    if all(len(items) == 1 for items in direct.values()):
        selected = [items[0] for items in direct.values()]
    elif len(archives) == 1:
        selected = archives
    else:
        raise ValueError("Upstream release must provide the expected DLLs or one ZIP archive")
    urls = [a.get("browser_download_url", "") for a in selected]
    if any(not url.startswith("https://github.com/" + repo + "/releases/download/") for url in urls):
        raise ValueError("Unexpected release download URL")
    return str(release.get("tag_name") or ""), selected


def _payloads(data, names):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        result = {}
        for name in names:
            matches = [entry for entry in archive.infolist()
                       if not entry.is_dir() and os.path.basename(entry.filename).casefold() == name.casefold()]
            if len(matches) != 1 or matches[0].file_size > 30 * 1024 * 1024:
                raise ValueError(f"Release must contain exactly one {name}")
            payload = archive.read(matches[0])
            if not payload.startswith(b"MZ"):
                raise ValueError(f"Invalid Windows DLL: {name}")
            result[name.casefold()] = payload
        return result


def _cache_dir(kind, appid):
    # Absolum has a different upstream EOS binary; never share its cache with
    # the generic EOS release used for other games.
    variant = "eos-proxy-absolum" if kind == "eos-proxy" and int(appid) == 1904480 else kind
    path = runtime_path("multiplayer-proxies", variant)
    os.makedirs(path, exist_ok=True)
    return path, variant


def _valid_cached(path):
    try:
        if not 2 <= os.path.getsize(path) <= 30 * 1024 * 1024:
            return False
        with open(path, "rb") as handle:
            return handle.read(2) == b"MZ"
    except OSError:
        return False


def ensure_dlls(kind, appid=0, force=False):
    """Persist upstream release DLLs, like SmokeAPI's runtime cache.

    A cache refresh stages and validates every DLL before replacing any of the
    existing files. Game installs read complete DLLs under the same lock.
    """
    if kind not in SOURCES:
        return {"success": False, "error": "Unknown multiplayer fix"}
    folder, variant = _cache_dir(kind, appid)
    names = {n.casefold() for n in SOURCES[kind][2]}
    with _cache_locks[variant]:
        paths = {name: os.path.join(folder, name) for name in names}
        if not force and all(_valid_cached(p) for p in paths.values()):
            return {"success": True, "cached": True, "dlls": paths,
                    "tag": settings.get_dep_version(variant)}
        try:
            tag, assets = _release_assets(kind, appid, names)
            client = ensure_http_client("SLSDeck: multiplayer proxy download")
            payloads = {}
            for asset in assets:
                response = client.get(asset["browser_download_url"],
                                      headers={"User-Agent": "SLSDeck"}, timeout=120,
                                      follow_redirects=True)
                response.raise_for_status()
                data = response.content
                if asset["name"].lower().endswith(".zip"):
                    payloads.update(_payloads(data, names))
                elif data.startswith(b"MZ") and len(data) <= 30 * 1024 * 1024:
                    payloads[asset["name"].casefold()] = data
                else:
                    raise ValueError("Invalid upstream DLL")
            if set(payloads) != names:
                raise ValueError("Upstream release is missing a required DLL")
            staged = {}
            try:
                for name, data in payloads.items():
                    stage = paths[name] + ".new"
                    with open(stage, "wb") as handle:
                        handle.write(data)
                    staged[name] = stage
                for name, stage in staged.items():
                    os.replace(stage, paths[name])
                    chown_to_user(paths[name], recursive=False)
            finally:
                for stage in staged.values():
                    if os.path.exists(stage):
                        os.remove(stage)
            if tag:
                settings.set_dep_version(variant, tag)
            logger.log(f"SLSDeck: cached {variant} {tag}")
            return {"success": True, "cached": False, "dlls": paths, "tag": tag,
                    "url": assets[0]["browser_download_url"]}
        except Exception as exc:
            logger.warn(f"SLSDeck: {variant} cache refresh failed: {exc}")
            return {"success": False, "error": str(exc)}


def install(appid, kind):
    if kind not in SOURCES:
        return {"success": False, "error": "Unknown multiplayer fix"}
    try:
        appid = int(appid)
        with _guard:
            lock = _locks.setdefault(appid, threading.Lock())
        if not lock.acquire(blocking=False):
            return {"success": False, "error": "Another multiplayer fix is running for this game"}
        try:
            path = _game(appid)
            if fixes._get_unfix_state(appid).get("status") in ("queued", "removing"):
                return {"success": False, "error": "Wait for Un-fix to finish"}
            spec = SOURCES[kind]
            records = _records(path, appid)
            if any(r["fixType"] == spec[1] for r in records):
                return {"success": False, "error": "Already installed; use Un-fix and unpin before applying again"}
            targets = _targets(path, kind)
            if not targets:
                return {"success": False, "error": "No matching game DLL found; download the game first"}
            occupied = {f.casefold() for r in records for f in r["files"]}
            if any(t.casefold() in occupied or os.path.exists(os.path.join(path, t) + fixes.ORIG_SUFFIX)
                   for t in targets):
                return {"success": False, "error": "Another fix owns a target DLL; un-fix it before applying this proxy"}
            if kind == "eos-proxy" and any(os.path.lexists(os.path.join(path, t[:-4] + ".yes")) for t in targets):
                return {"success": False, "error": "EOS .yes backup already exists; refusing to overwrite it"}
            cached = ensure_dlls(kind, appid)
            if not cached.get("success"):
                return cached
            payloads = {}
            for name, filename in cached["dlls"].items():
                with open(filename, "rb") as handle:
                    payloads[name] = handle.read()
            written, replaced = [], []
            try:
                for rel in targets:
                    full = os.path.join(path, rel)
                    if os.path.islink(full) or not fixes._is_safe_path(os.path.realpath(path), os.path.realpath(full)):
                        raise ValueError("Game DLL path changed during install")
                    if not os.path.isfile(full) or os.path.exists(full + fixes.ORIG_SUFFIX):
                        raise ValueError("Game DLL changed during install")
                    if kind == "eos-proxy":
                        yes = full[:-4] + ".yes"
                        if os.path.lexists(yes):
                            raise ValueError("EOS backup appeared during install")
                        shutil.copy2(full, yes)
                        written.append(rel[:-4] + ".yes")
                        chown_to_user(yes, recursive=False)
                    if not fixes._stash_original(path, rel):
                        raise OSError("Could not back up " + rel)
                    replaced.append(rel)
                    # Record the target before writing so failed writes can be reverted.
                    written.append(rel)
                    staged = full + ".slsdeck-new"
                    try:
                        with open(staged, "wb") as handle:
                            handle.write(payloads[os.path.basename(rel).casefold()])
                        os.replace(staged, full)
                    finally:
                        if os.path.exists(staged):
                            os.remove(staged)
                    chown_to_user(full, recursive=False)
            except Exception:
                for rel in reversed(written):
                    full = os.path.join(path, rel)
                    backup = full + fixes.ORIG_SUFFIX
                    if os.path.isfile(backup):
                        os.replace(backup, full)
                    elif rel not in replaced and os.path.isfile(full) and rel.lower().endswith(".yes"):
                        os.remove(full)
                raise
            fixes._write_fix_log(path, appid, f"AppID {appid}", spec[1],
                                 cached.get("url") or f"https://github.com/{spec[0]}/releases", written, replaced)
            if not any(r["fixType"] == spec[1] for r in _records(path, appid)):
                raise RuntimeError("Fix files installed, but could not record them. Keep the .slsdeck-orig backups")
            chown_to_user(fixes._fix_log_path(path, appid), recursive=False)
            warning = ""
            if settings.get_pin_on_fix():
                try:
                    pin = slssteam.pin_app_current(appid)
                    if not pin.get("success"):
                        warning = "Fix installed, but manifest pin failed: " + str(pin.get("error", "unknown error"))
                except Exception as exc:
                    warning = "Fix installed, but manifest pin failed: " + str(exc)
            return {"success": True, "warning": warning, "files": written}
        finally:
            lock.release()
    except Exception as exc:
        logger.warn(f"SLSDeck: multiplayer proxy install failed: {exc}")
        return {"success": False, "error": str(exc)}
