"""Detect a narrowly-defined Proton Steam bootstrap failure and apply Unsteam.

Steam owns launch options, so the frontend enables per-AppID Proton logs and
reports short launches here.  This module only reads a fresh log and starts the
existing Universal Unsteam fix job; fixes.py remains the sole owner of applying
and recording files, which keeps the normal per-game Un-fix path working.
"""

from __future__ import annotations

import os
import re
import threading
import time
from typing import Any, Dict, List

from . import fixes, settings, slssteam
from .config import UNSTEAM_AIO_URL
from .downloads import fetch_app_name
from .logger import logger
from .paths import get_user_home
from .steam import get_game_install_path_response
from .utils import chown_to_user

_LOCK = threading.Lock()
_ATTEMPTED: Dict[int, float] = {}
_MAX_LOG_BYTES = 4 * 1024 * 1024
_SIGNATURES = (
    re.compile(r"application\s+load\s+error\s*3\s*:\s*0*65432", re.I),
    re.compile(r"application\s+load\s+error.*0000065432", re.I),
)


def log_dir() -> str:
    path = os.path.join(get_user_home(), ".config", "slsdeck", "proton-logs")
    os.makedirs(path, exist_ok=True)
    try:
        chown_to_user(path, recursive=True)
    except Exception:
        pass
    return path


def candidates() -> Dict[str, Any]:
    """Return SLS registrations plus previously managed AppIDs.

    Previously managed IDs stay visible even after purge/uninstall so disabling
    the feature can still remove the exact launch-option additions it made.
    Proton selection is live-only Steam state and is filtered by the frontend.
    """
    out = []
    registered = {int(value) for value in slssteam.read_additional_apps()}
    managed = {int(value) for value in settings.get_value("automaticUnsteamApps", []) or []}
    for appid in sorted(registered | managed):
        try:
            installed = get_game_install_path_response(appid)
            out.append({
                "appid": appid,
                "gameName": installed.get("name") or fetch_app_name(appid) or f"AppID {appid}",
                "installed": bool(installed.get("success")),
                "registered": appid in registered,
            })
        except Exception:
            continue
    return {"success": True, "apps": out, "logDir": log_dir()}


def set_managed(appids: List[int]) -> Dict[str, Any]:
    clean = sorted({int(value) for value in (appids or []) if int(value) > 0})
    settings.set_value("automaticUnsteamApps", clean)
    return {"success": True, "appids": clean}


def _fresh_log(appid: int, launch_started_ms: int) -> tuple[str, str]:
    path = os.path.join(log_dir(), f"steam-{appid}.log")
    if not os.path.isfile(path):
        return "", path
    # Allow a small clock/order margin: Proton may create the file immediately
    # before Steam's lifetime callback reaches the plugin frontend.
    if launch_started_ms and os.path.getmtime(path) * 1000 < launch_started_ms - 5000:
        return "", path
    with open(path, "rb") as fh:
        size = os.path.getsize(path)
        if size > _MAX_LOG_BYTES:
            fh.seek(size - _MAX_LOG_BYTES)
        return fh.read().decode("utf-8", errors="replace"), path


def _already_unsteam(install_path: str, appid: int) -> bool:
    path = os.path.join(install_path, f"luatools-fix-log-{appid}.log")
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return "Fix Type: Online Fix (Unsteam)" in fh.read()
    except OSError:
        return False


def inspect_short_launch(appid: int, launch_started_ms: int = 0,
                         duration_ms: int = 0) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    if not settings.get_ui_settings().get("automaticUnsteam", False):
        return {"success": True, "matched": False, "reason": "disabled"}
    if appid not in set(slssteam.read_additional_apps()):
        return {"success": True, "matched": False, "reason": "not-sls"}
    # The frontend only calls us for short launches; enforce the bound again so
    # an accidental/manual RPC cannot apply a fix after a normal play session.
    if duration_ms <= 0 or duration_ms > 45000:
        return {"success": True, "matched": False, "reason": "not-short"}

    try:
        text, path = _fresh_log(appid, int(launch_started_ms or 0))
    except Exception as exc:
        return {"success": False, "matched": False, "error": f"Could not read Proton log: {exc}"}
    signature = next((m.group(0) for pattern in _SIGNATURES if (m := pattern.search(text))), "")
    if not signature:
        return {"success": True, "matched": False, "reason": "signature-absent", "logPath": path}

    installed = get_game_install_path_response(appid)
    if not installed.get("success"):
        return {"success": False, "matched": True, "error": "Game is no longer installed", "logPath": path}
    install_path = str(installed.get("installPath") or installed.get("path") or "")
    if _already_unsteam(install_path, appid):
        return {"success": True, "matched": True, "alreadyApplied": True, "logPath": path}

    with _LOCK:
        last = _ATTEMPTED.get(appid, 0)
        if time.time() - last < 300:
            return {"success": True, "matched": True, "queued": False,
                    "reason": "attempt-throttled", "logPath": path}
        state = fixes.get_apply_fix_status(appid).get("state") or {}
        if state.get("status") in {"queued", "checking", "downloading", "extracting", "applying", "finalizing"}:
            return {"success": True, "matched": True, "queued": False,
                    "reason": "fix-running", "logPath": path}
        _ATTEMPTED[appid] = time.time()

    name = str(installed.get("name") or fetch_app_name(appid) or f"AppID {appid}")
    result = fixes.apply_game_fix(appid, UNSTEAM_AIO_URL, install_path,
                                  "Online Fix (Unsteam)", name)
    if result.get("success"):
        logger.log(f"SLSDeck: Automatic Unsteam matched Proton load error for {appid}; fix queued")
    return {**result, "matched": True, "queued": bool(result.get("success")),
            "gameName": name, "logPath": path, "signature": signature}
