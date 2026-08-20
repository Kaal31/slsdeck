"""Track full DepotDownloader installs and remove leftovers after Steam uninstalls them.

Only full build downloads are registered here. DLC-only DepotDownloader jobs are
never registered, so this watcher cannot delete a legitimately-owned base game.
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil
import threading
from typing import Any, Dict

from .logger import logger
from .paths import get_user_home
from .utils import chown_to_user

_LOCK = threading.Lock()
_TASK = None
_RUNNING = False


def _registry_path() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, "depot_managed.json")


def _read() -> Dict[str, Any]:
    try:
        with open(_registry_path(), "r", encoding="utf-8") as fh:
            v = json.load(fh)
        return v if isinstance(v, dict) else {}
    except Exception:
        return {}


def _write(data: Dict[str, Any]) -> None:
    path = _registry_path()
    tmp = path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
            fh.flush()
            try: os.fsync(fh.fileno())
            except Exception: pass
        os.replace(tmp, path)
        try:
            chown_to_user(path, recursive=False)
        except Exception:
            pass
    except Exception as exc:
        logger.warn(f"depot-cleanup: registry write failed: {exc}")
        try:
            if os.path.exists(tmp): os.remove(tmp)
        except Exception:
            pass


def _appmanifest_for(appid: int, install_path: str) -> str:
    try:
        p = os.path.realpath(install_path)
        common = os.path.dirname(p)
        steamapps = os.path.dirname(common)
        if os.path.basename(common) != "common" or os.path.basename(steamapps) != "steamapps":
            return ""
        return os.path.join(steamapps, f"appmanifest_{int(appid)}.acf")
    except Exception:
        return ""


def _hand_install_back_to_user(appid: int, install_path: str) -> None:
    """Make a completed root-run DepotDownloader install manageable by Steam/Dolphin.

    Decky's backend runs as root, so files created by DepotDownloader can otherwise
    remain root-owned. That makes later Steam updates and even deleting a stale game
    from Dolphin's Trash fail with "Access denied". A full-build download is the
    correct ownership boundary: recursively hand only that game's directory back to
    the desktop user, plus its appmanifest when present. This deliberately never
    walks steamapps/common itself.
    """
    path = os.path.realpath(str(install_path or ""))
    if not path or not _safe_managed_path(path):
        return
    try:
        chown_to_user(path, recursive=True)
        acf = _appmanifest_for(int(appid), path)
        if acf and os.path.exists(acf):
            chown_to_user(acf, recursive=False)
        logger.log(f"depot-cleanup: handed full build {appid} back to desktop user -> {path}")
    except Exception as exc:
        logger.warn(f"depot-cleanup: ownership handoff failed for {appid}: {exc}")


def register_full_build(appid: int, install_path: str) -> None:
    """Remember a directory that SLSDeck populated with a full DepotDownloader build."""
    try:
        appid = int(appid)
        path = os.path.realpath(str(install_path or ""))
        acf = _appmanifest_for(appid, path)
        if not path or not acf or "/steamapps/common/" not in (path.replace("\\", "/") + "/"):
            return
        with _LOCK:
            data = _read()
            data[str(appid)] = {
                "appid": appid,
                "installPath": path,
                "appmanifest": acf,
                "seenInstalled": bool(os.path.isfile(acf)),
                "missingScans": 0,
            }
            _write(data)
        logger.log(f"depot-cleanup: tracking full build {appid} -> {path}")
        try:
            from . import survival_backup
            survival_backup.save()
        except Exception:
            pass
    except Exception as exc:
        logger.warn(f"depot-cleanup: register failed for {appid}: {exc}")


def _safe_managed_path(path: str) -> bool:
    try:
        rp = os.path.realpath(path)
        norm = rp.replace("\\", "/")
        return "/steamapps/common/" in (norm + "/") and os.path.basename(rp) not in ("", "common")
    except Exception:
        return False


def scan_once() -> None:
    """Two consecutive missing-appmanifest scans == Steam completed uninstall."""
    with _LOCK:
        data = _read()
        changed = False
        for key, rec in list(data.items()):
            path = str(rec.get("installPath") or "")
            acf = str(rec.get("appmanifest") or "")
            if not path or not acf or not _safe_managed_path(path):
                data.pop(key, None); changed = True; continue
            if os.path.isfile(acf):
                if not rec.get("seenInstalled") or rec.get("missingScans"):
                    rec["seenInstalled"] = True
                    rec["missingScans"] = 0
                    changed = True
                continue
            if not rec.get("seenInstalled"):
                # Do not infer an uninstall for a record that never had a Steam
                # appmanifest. A later successful install can still arm it.
                continue
            rec["missingScans"] = int(rec.get("missingScans", 0) or 0) + 1
            changed = True
            if rec["missingScans"] < 2:
                continue
            try:
                if os.path.isdir(path):
                    shutil.rmtree(path)
                    logger.log(f"depot-cleanup: Steam uninstalled {key}; removed leftover {path}")
            except Exception as exc:
                logger.warn(f"depot-cleanup: could not remove {path}: {exc}")
                continue
            data.pop(key, None)
        if changed:
            _write(data)


async def _loop() -> None:
    global _RUNNING
    _RUNNING = True
    while _RUNNING:
        try: scan_once()
        except Exception as exc: logger.warn(f"depot-cleanup: scan failed: {exc}")
        try: await asyncio.sleep(3)
        except asyncio.CancelledError: break
    _RUNNING = False


def start(loop=None) -> None:
    global _TASK
    if _TASK is not None and not _TASK.done(): return
    try:
        loop = loop or asyncio.get_event_loop()
        _TASK = loop.create_task(_loop())
    except Exception as exc:
        logger.warn(f"depot-cleanup: watcher start failed: {exc}")


def stop() -> None:
    global _RUNNING, _TASK
    _RUNNING = False
    try:
        if _TASK is not None and not _TASK.done(): _TASK.cancel()
    except Exception: pass


def patch_depotdl(depotdl: Any) -> None:
    if getattr(depotdl, "_slsdeck_cleanup_patched", False): return
    original = depotdl._build_worker
    def wrapped(appid, depot_gid, buildid):
        original(appid, depot_gid, buildid)
        try:
            st = depotdl.get_state(appid)
            if st.get("status") == "done" and st.get("success") and st.get("installPath"):
                path = str(st["installPath"])
                _hand_install_back_to_user(int(appid), path)
                register_full_build(int(appid), path)
        except Exception as exc:
            logger.warn(f"depot-cleanup: post-build tracking failed for {appid}: {exc}")
    depotdl._build_worker = wrapped
    depotdl._slsdeck_cleanup_patched = True


def patch_watchdog(watchdog: Any) -> None:
    if getattr(watchdog, "_slsdeck_depot_cleanup_patched", False): return
    orig_start, orig_stop = watchdog.start_watchdog, watchdog.stop_watchdog
    def start_wrapped(loop=None):
        res = orig_start(loop)
        start(loop)
        return res
    def stop_wrapped():
        stop()
        return orig_stop()
    watchdog.start_watchdog = start_wrapped
    watchdog.stop_watchdog = stop_wrapped
    watchdog._slsdeck_depot_cleanup_patched = True
