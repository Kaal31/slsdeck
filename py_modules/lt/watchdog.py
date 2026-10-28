"""Read-only background health monitoring. Repairs require an explicit user action."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, Optional

from .logger import logger
from .audit import system_health_audit

_WATCHDOG_TASK: Optional[asyncio.Task] = None
_WATCHDOG_RUNNING = False
_LAST_CHECK_TIME = 0.0
_LAST_AUDIT_SCORE = 100


_BASE_INTERVAL = 300


async def _watchdog_loop(interval_seconds: int = _BASE_INTERVAL) -> None:
    """Observe health without changing launchers, permissions, or injection."""
    global _WATCHDOG_RUNNING, _LAST_CHECK_TIME, _LAST_AUDIT_SCORE
    _WATCHDOG_RUNNING = True
    logger.log("SLSDeck watchdog: read-only health monitor started")

    last_state = None

    while _WATCHDOG_RUNNING:
        try:
            audit = system_health_audit()
            score = audit.get("healthScore", 100)
            _LAST_AUDIT_SCORE = score
            _LAST_CHECK_TIME = time.time()

            codes = tuple(sorted(audit.get("repairableCodes") or []))
            state = (score, codes, bool(audit.get("gamescopeHookActive")),
                     bool(audit.get("injectionActive")))
            if state != last_state and codes:
                logger.warn(f"SLSDeck watchdog: health {score}%, findings={codes}; "
                            "observation only; use explicit repair to make changes")
            last_state = state
        except Exception as exc:
            logger.warn(f"SLSDeck watchdog iteration error: {exc}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break

    _WATCHDOG_RUNNING = False
    logger.log("SLSDeck watchdog: background daemon stopped")


def start_watchdog(loop: Optional[asyncio.AbstractEventLoop] = None) -> Dict[str, Any]:
    """Start the background watchdog task if not already running."""
    global _WATCHDOG_TASK
    if _WATCHDOG_TASK and not _WATCHDOG_TASK.done():
        return {"success": True, "running": True, "message": "Watchdog daemon already running"}

    if loop is None:
        try:
            loop = asyncio.get_event_loop()
        except Exception:
            return {"success": False, "error": "No active event loop found"}

    _WATCHDOG_TASK = loop.create_task(_watchdog_loop())
    return {"success": True, "running": True, "started": True}


def stop_watchdog() -> Dict[str, Any]:
    """Stop the background watchdog task."""
    global _WATCHDOG_TASK, _WATCHDOG_RUNNING
    _WATCHDOG_RUNNING = False
    if _WATCHDOG_TASK and not _WATCHDOG_TASK.done():
        _WATCHDOG_TASK.cancel()
    return {"success": True, "running": False}


def get_watchdog_status() -> Dict[str, Any]:
    """Return status of the background self-healing daemon."""
    running = bool(_WATCHDOG_TASK and not _WATCHDOG_TASK.done() and _WATCHDOG_RUNNING)
    return {
        "success": True,
        "running": running,
        "lastCheckTimestamp": _LAST_CHECK_TIME,
        "lastHealthScore": _LAST_AUDIT_SCORE,
    }
