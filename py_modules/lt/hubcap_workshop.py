"""Automatic Hubcap fallback for missing Steam Workshop manifests.

Steam writes the Workshop item id and desired manifest gid to
``appworkshop_<appid>.acf``.  When Moon cannot obtain that manifest itself, this
watcher asks Hubcap for the item, validates Hubcap's Moon-format filename, and
atomically publishes the unchanged binary to both Moon's persistent
ManifestStore and Steam's live depotcache.
"""

from __future__ import annotations

import os
import re
import tempfile
import threading
import time
from typing import Any, Dict, Iterable, Optional, Tuple

from . import settings, slssteam, steam
from .httpc import ensure_http_client
from .logger import logger
from .utils import chown_to_user

HUBCAP_WORKSHOP = "https://hubcapmanifest.com/api/v1/generate/workshopmanifest/{workshop_id}"
_NAME_RE = re.compile(r"^(\d+)_(\d+)\.manifest$")
_CD_NAME_RE = re.compile(r"filename\*?=(?:UTF-8''|\")?([^\";]+)", re.IGNORECASE)
_MANIFEST_MAGIC = b"\xd0\x17\xf6\x71"
_MAX_BYTES = 64 * 1024 * 1024
_SCAN_SECONDS = 5.0
_IDLE_SECONDS = 30.0
_RETRY_SECONDS = 15 * 60.0

_lock = threading.RLock()
_stop = threading.Event()
_thread: Optional[threading.Thread] = None
_attempt_after: Dict[Tuple[int, int, int], float] = {}
_status: Dict[str, Any] = {
    "running": False, "scans": 0, "published": 0, "lastError": "",
    "lastPublished": "", "lastScan": 0,
}


def _managed_appids() -> set[int]:
    """Only games managed by SLSDeck, never unrelated owned Steam games."""
    ids: set[int] = set()
    try:
        ids.update(int(x) for x in slssteam.read_additional_apps() if int(x) > 0)
    except Exception:
        pass
    return ids


def _workshop_acfs(appids: Iterable[int]):
    wanted = set(appids)
    for root in steam._all_library_paths():
        base = os.path.join(root, "steamapps", "workshop")
        for appid in wanted:
            path = os.path.join(base, f"appworkshop_{appid}.acf")
            if os.path.isfile(path):
                yield appid, path


def _items(appid: int, path: str):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            root = steam._parse_vdf_simple(fh.read())
        workshop = root.get("AppWorkshop", {})
        details = workshop.get("WorkshopItemDetails", {}) or {}
        installed = workshop.get("WorkshopItemsInstalled", {}) or {}
        itemids = set(details) | set(installed)
        for raw_itemid in itemids:
            if not str(raw_itemid).isdigit():
                continue
            detail = details.get(raw_itemid, {}) or {}
            local = installed.get(raw_itemid, {}) or {}
            raw_gid = detail.get("latest_manifest") or detail.get("manifest") or local.get("manifest") or "0"
            gid = int(raw_gid) if str(raw_gid).isdigit() else 0
            yield int(raw_itemid), gid
    except Exception as exc:
        logger.warn(f"SLSDeck: Hubcap Workshop could not parse {path}: {exc}")


def _valid_file(path: str) -> bool:
    try:
        if os.path.getsize(path) < 8:
            return False
        with open(path, "rb") as fh:
            return fh.read(4) == _MANIFEST_MAGIC
    except Exception:
        return False


def _already_present(appid: int, gid: int) -> bool:
    if not gid:
        return False
    name = f"{appid}_{gid}.manifest"
    return any(_valid_file(os.path.join(folder, name)) for folder in (
        slssteam.manifest_store_dir(), steam.depotcache_dir()))


def _response_name(response) -> str:
    header = str(response.headers.get("content-disposition", ""))
    match = _CD_NAME_RE.search(header)
    return os.path.basename(match.group(1).strip()) if match else ""


def _atomic_publish(data: bytes, target: str) -> None:
    os.makedirs(os.path.dirname(target), exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".hubcap-workshop-", dir=os.path.dirname(target))
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(temporary, target)
        chown_to_user(target, recursive=False)
    finally:
        try:
            if os.path.exists(temporary):
                os.unlink(temporary)
        except OSError:
            pass


def fetch_and_publish(workshop_id: int, appid: int = 0, expected_gid: int = 0) -> Dict[str, Any]:
    """Fetch one Workshop item and publish Hubcap's binary without conversion."""
    try:
        key = str(settings.get_morrenus_api_key() or "").strip()
    except Exception:
        key = ""
    if not key:
        return {"success": False, "error": "No Hubcap key set"}
    try:
        response = ensure_http_client("hubcap workshop").get(
            HUBCAP_WORKSHOP.format(workshop_id=int(workshop_id)),
            headers={"Authorization": f"Bearer {key}", "User-Agent": "SLSDeck/hubcap-workshop"},
            timeout=90, follow_redirects=True,
        )
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    if response.status_code != 200:
        return {"success": False, "status": response.status_code,
                "error": f"Hubcap HTTP {response.status_code}"}
    data = response.content
    if not data or len(data) > _MAX_BYTES or data[:4] != _MANIFEST_MAGIC:
        return {"success": False, "error": "Hubcap returned an invalid Workshop manifest"}

    name = _response_name(response)
    match = _NAME_RE.fullmatch(name)
    if match:
        depot_id, gid = int(match.group(1)), int(match.group(2))
        if appid and depot_id != int(appid):
            return {"success": False, "error": f"Hubcap returned depot {depot_id}, expected {appid}"}
        if expected_gid and gid != int(expected_gid):
            return {"success": False, "error": f"Hubcap returned manifest {gid}, expected {expected_gid}"}
    elif appid and expected_gid:
        depot_id, gid = int(appid), int(expected_gid)
        name = f"{depot_id}_{gid}.manifest"
    else:
        return {"success": False, "error": "Hubcap response did not include a Moon-format filename"}

    targets = [os.path.join(slssteam.manifest_store_dir(), name),
               os.path.join(steam.depotcache_dir(), name)]
    try:
        for target in targets:
            _atomic_publish(data, target)
    except Exception as exc:
        return {"success": False, "error": f"Could not publish Workshop manifest: {exc}"}
    logger.log(f"SLSDeck: Hubcap Workshop staged {name} for item {workshop_id}")
    return {"success": True, "workshopId": int(workshop_id), "appid": depot_id,
            "gid": gid, "filename": name, "paths": targets, "bytes": len(data)}


def scan_once() -> Dict[str, Any]:
    appids = _managed_appids()
    missing = 0
    fetched = 0
    now = time.monotonic()
    for appid, path in _workshop_acfs(appids):
        for itemid, gid in _items(appid, path):
            if _already_present(appid, gid):
                continue
            missing += 1
            attempt = (appid, itemid, gid)
            with _lock:
                if _attempt_after.get(attempt, 0) > now:
                    continue
                _attempt_after[attempt] = now + _RETRY_SECONDS
            result = fetch_and_publish(itemid, appid, gid)
            if result.get("success"):
                fetched += 1
                with _lock:
                    _status["published"] += 1
                    _status["lastPublished"] = result.get("filename", "")
                    _status["lastError"] = ""
            else:
                with _lock:
                    _status["lastError"] = str(result.get("error", "Unknown error"))
                logger.warn(f"SLSDeck: Hubcap Workshop item {itemid} failed: {_status['lastError']}")
    with _lock:
        _status["scans"] += 1
        _status["lastScan"] = int(time.time())
    return {"success": True, "managedApps": len(appids), "missing": missing, "fetched": fetched}


def _run() -> None:
    while not _stop.is_set():
        try:
            result = scan_once()
            delay = _SCAN_SECONDS if result.get("missing") else _IDLE_SECONDS
        except Exception as exc:
            with _lock:
                _status["lastError"] = str(exc)
            logger.warn(f"SLSDeck: Hubcap Workshop watcher failed: {exc}")
            delay = _IDLE_SECONDS
        _stop.wait(delay)
    with _lock:
        _status["running"] = False


def start_watcher() -> Dict[str, Any]:
    global _thread
    with _lock:
        if _thread and _thread.is_alive():
            return status()
        _stop.clear()
        _thread = threading.Thread(target=_run, name="slsdeck-hubcap-workshop", daemon=True)
        _status["running"] = True
        _thread.start()
    logger.log("SLSDeck: Hubcap Workshop watcher started")
    return status()


def stop_watcher() -> Dict[str, Any]:
    global _thread
    _stop.set()
    thread = _thread
    if thread and thread.is_alive() and thread is not threading.current_thread():
        thread.join(timeout=2.0)
    with _lock:
        _thread = None
        _status["running"] = False
    return status()


def status() -> Dict[str, Any]:
    with _lock:
        return {"success": True, **_status}
