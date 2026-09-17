"""Automatic manifest refresh for installed SLS-managed games.

The inexpensive Hubcap ``/contents`` endpoint is used as the probe.  A quota-
counting ``force_update`` download happens only when its depot GID set differs
from the set currently targeted by Moon.  Refreshed manifest creation times are
then compared with the local target manifests before anything is published.
"""

from __future__ import annotations

import os
import re
import tempfile
import threading
import time
import zipfile
from typing import Any, Dict, Optional, Tuple

from . import buildhistory, downloads, settings, slssteam, smart_merge, steam
from .httpc import ensure_http_client
from .logger import logger

CONTENTS_URL = "https://hubcapmanifest.com/api/v1/manifest/{appid}/contents"
MANIFEST_URL = "https://hubcapmanifest.com/api/v1/manifest/{appid}?force_update=true"
CHECK_INTERVAL = 2 * 60 * 60
BOOT_DELAY = 90

_STOP = threading.Event()
_WAKE = threading.Event()
_THREAD: Optional[threading.Thread] = None
_LOCK = threading.Lock()
_STATUS: Dict[str, Any] = {
    "running": False, "checking": False, "lastCheck": 0,
    "checked": 0, "updated": 0, "skipped": 0, "failed": 0,
}


def _enabled() -> bool:
    return bool(settings.get_ui_settings().get("hubcapUpdates", False))


def status() -> Dict[str, Any]:
    key = bool(settings.get_morrenus_api_key())
    enabled = _enabled() and key
    if not key and _enabled():
        settings.set_ui_setting("hubcapUpdates", False)
    with _LOCK:
        return {"success": True, "enabled": enabled, "keyAvailable": key, **_STATUS}


def set_enabled(enabled: bool) -> Dict[str, Any]:
    if enabled and not settings.get_morrenus_api_key():
        settings.set_ui_setting("hubcapUpdates", False)
        return {"success": False, "enabled": False, "keyAvailable": False,
                "error": "Add a Hubcap key first"}
    result = settings.set_ui_setting("hubcapUpdates", bool(enabled))
    if enabled:
        start()
        _WAKE.set()  # an already-running scheduler should not wait up to 2h
    return {**result, "enabled": bool(enabled), "keyAvailable": True}


def _moon_target_gids(appid: int) -> Dict[str, str]:
    path = os.path.join(steam.stplugin_dir(), f"{int(appid)}.lua")
    installed = steam.get_installed_depots(appid)
    try:
        text = open(path, "r", encoding="utf-8", errors="ignore").read()
        gids = smart_merge.parse_lua(text).get("manifests") or {}
        target = {str(d): str(g) for d, g in gids.items()}
    except Exception:
        target = {}
    # smart_merge communicates its selected version to Moon with global
    # .preferred_<depot> markers; its generated Lua intentionally contains only
    # registrations and keys. Depot IDs are globally unique, so overlaying the
    # markers belonging to this app's installed depots is unambiguous and also
    # prevents re-downloading the same update while Steam is still patching it.
    store = slssteam.manifest_store_dir()
    for depot, gid in installed.items():
        marker = os.path.join(store, f".preferred_{depot}")
        try:
            preferred = open(marker, "r", encoding="utf-8").read().strip()
            if preferred.isdigit():
                target[str(depot)] = preferred
        except Exception:
            target.setdefault(str(depot), str(gid))
    return target


def _contents(appid: int, key: str) -> Tuple[Dict[str, str], Dict[str, Any]]:
    client = ensure_http_client("hubcap updates: contents")
    r = client.get(CONTENTS_URL.format(appid=int(appid)), headers={
        "Authorization": f"Bearer {key}", "User-Agent": "SLSDeck/hubcap-updates",
    }, timeout=20, follow_redirects=True)
    if r.status_code != 200:
        raise RuntimeError(f"contents HTTP {r.status_code}")
    data = r.json()
    if not data.get("zip_exists", True):
        return {}, data
    out: Dict[str, str] = {}
    for item in data.get("manifests") or []:
        depot, gid = str(item.get("depot_id") or ""), str(item.get("manifest_id") or "")
        if depot.isdigit() and gid.isdigit():
            out[depot] = gid
    return out, data


def _download_refreshed(appid: int, key: str) -> str:
    client = ensure_http_client("hubcap updates: refresh")
    r = client.get(MANIFEST_URL.format(appid=int(appid)), headers={
        "Authorization": f"Bearer {key}", "User-Agent": "SLSDeck/hubcap-updates",
    }, timeout=120, follow_redirects=True)
    if r.status_code != 200:
        raise RuntimeError(f"refresh HTTP {r.status_code}")
    if r.content[:2] != b"PK":
        raise RuntimeError("Hubcap refresh returned a non-ZIP response")
    fd, path = tempfile.mkstemp(prefix=f"hubcap_update_{appid}_", suffix=".zip")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(r.content)
    except Exception:
        try:
            os.remove(path)
        except OSError:
            pass
        raise
    return path


def _zip_manifests(path: str) -> Dict[str, Dict[str, Any]]:
    newest: Dict[str, Dict[str, Any]] = {}
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            bn = os.path.basename(name)
            m = re.fullmatch(r"(\d+)_(\d+)\.manifest", bn)
            if not m:
                continue
            raw = z.read(name)
            meta, _ = smart_merge.parse_manifest(raw, int(m.group(1)), m.group(2))
            if not meta:
                continue
            depot = str(meta["depot"])
            if depot not in newest or int(meta.get("creation_time") or 0) > int(newest[depot].get("creation_time") or 0):
                newest[depot] = meta
    return newest


def _local_manifest_time(depot: str, gid: str) -> Optional[int]:
    name = f"{depot}_{gid}.manifest"
    for root in (slssteam.manifest_store_dir(), steam.depotcache_dir()):
        path = os.path.join(root, name)
        try:
            raw = open(path, "rb").read()
            meta, _ = smart_merge.parse_manifest(raw, int(depot), gid)
            if meta and meta.get("creation_time") is not None:
                return int(meta["creation_time"])
        except Exception:
            continue
    return None


def _is_newer(candidate: Dict[str, Dict[str, Any]], current: Dict[str, str]) -> bool:
    comparisons = []
    for depot, old_gid in current.items():
        new = candidate.get(str(depot))
        if not new or str(new.get("gid")) == str(old_gid):
            continue
        old_time = _local_manifest_time(str(depot), str(old_gid))
        new_time = new.get("creation_time")
        if old_time is not None and new_time is not None:
            comparisons.append(int(new_time) - int(old_time))
    # Automatic replacement requires positive evidence and never crosses a
    # depot whose refreshed manifest is older than the local target.
    return bool(comparisons) and max(comparisons) > 0 and min(comparisons) >= 0


def check_app(appid: int, key: str) -> Dict[str, Any]:
    installed = steam.get_installed_depots(appid)
    if not installed:
        return {"status": "skipped", "reason": "not installed"}
    if slssteam.is_pinned(appid):
        return {"status": "skipped", "reason": "pinned"}
    current = _moon_target_gids(appid) or installed
    remote, _ = _contents(appid, key)
    overlap = set(current) & set(remote)
    if not remote or not overlap or all(current[d] == remote[d] for d in overlap):
        return {"status": "current"}
    archive = _download_refreshed(appid, key)
    try:
        candidate = _zip_manifests(archive)
        if not _is_newer(candidate, current):
            return {"status": "skipped", "reason": "not proven newer"}
        try:
            buildhistory.snapshot(appid, {int(d): g for d, g in current.items()}, source="hubcap-update-before")
        except Exception:
            pass
        result = downloads._process_and_install_lua(
            appid, archive, prefer_source_newest=True)
        archive = ""  # installer owns and removes the ZIP
        logger.log(f"SLSDeck: Hubcap Updates published newer manifests for {appid}")
        return {"status": "updated", "preferred": (result or {}).get("preferred", {})}
    finally:
        if archive:
            try:
                os.remove(archive)
            except OSError:
                pass


def check_all() -> Dict[str, Any]:
    key = settings.get_morrenus_api_key()
    if not _enabled() or not key:
        if not key and _enabled():
            settings.set_ui_setting("hubcapUpdates", False)
        return {"success": True, "enabled": False}
    apps = downloads.read_loaded_apps().get("apps") or []
    counts = {"checked": 0, "updated": 0, "skipped": 0, "failed": 0}
    with _LOCK:
        _STATUS["checking"] = True
    try:
        for app in apps:
            if _STOP.is_set() or not _enabled():
                break
            try:
                result = check_app(int(app["appid"]), key)
                counts["checked"] += 1
                if result.get("status") == "updated":
                    counts["updated"] += 1
                elif result.get("status") == "skipped":
                    counts["skipped"] += 1
            except Exception as exc:
                counts["failed"] += 1
                logger.warn(f"SLSDeck: Hubcap update check failed for {app.get('appid')}: {exc}")
    finally:
        with _LOCK:
            _STATUS.update(counts)
            _STATUS["lastCheck"] = int(time.time())
            _STATUS["checking"] = False
    return {"success": counts["failed"] == 0, **counts}


def _worker() -> None:
    with _LOCK:
        _STATUS["running"] = True
    try:
        if _STOP.wait(BOOT_DELAY):
            return
        while not _STOP.is_set():
            if _enabled() and settings.get_morrenus_api_key():
                check_all()
            _WAKE.wait(CHECK_INTERVAL)
            _WAKE.clear()
            if _STOP.is_set():
                return
    finally:
        with _LOCK:
            _STATUS["running"] = False


def start() -> Dict[str, Any]:
    global _THREAD
    if _THREAD and _THREAD.is_alive():
        return status()
    _STOP.clear()
    _WAKE.clear()
    _THREAD = threading.Thread(target=_worker, name="slsdeck-hubcap-updates", daemon=True)
    _THREAD.start()
    return status()


def stop() -> None:
    _STOP.set()
    _WAKE.set()
