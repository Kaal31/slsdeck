"""Background Self-Healing Watchdog Daemon for SLSDeck.

Runs non-blocking health checks in the background, automatically repairing gamescope session
hooks, permissions, and launcher wrappers whenever SteamOS performs an OS update or Steam restarts.
"""

from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Dict, Optional

from .logger import logger
from .audit import system_health_audit, auto_repair_system

_WATCHDOG_TASK: Optional[asyncio.Task] = None
_WATCHDOG_RUNNING = False
_LAST_CHECK_TIME = 0.0
_LAST_AUDIT_SCORE = 100


# A repair that does not move the health score is almost always "repairing"
# something that CANNOT be satisfied on this system -- e.g. a Game Mode session
# hook on a Deck where injection already works through the PATH wrapper. Retrying
# it on a fixed timer forever is pure overhead, and it is what made Game Mode
# crawl. So: back off exponentially and stand down after a few useless attempts,
# resuming only if the observed state actually changes.
_BASE_INTERVAL = 300
_MAX_INTERVAL = 3600
_MAX_INEFFECTIVE = 3


async def _watchdog_loop(interval_seconds: int = _BASE_INTERVAL) -> None:
    """Background health loop with backoff. Never repairs blindly on a timer."""
    global _WATCHDOG_RUNNING, _LAST_CHECK_TIME, _LAST_AUDIT_SCORE
    _WATCHDOG_RUNNING = True
    logger.log("SLSDeck watchdog: background self-healing daemon started")

    delay = interval_seconds
    ineffective = 0
    last_state = None
    stood_down = False

    while _WATCHDOG_RUNNING:
        try:
            audit = system_health_audit()
            score = audit.get("healthScore", 100)
            _LAST_AUDIT_SCORE = score
            _LAST_CHECK_TIME = time.time()

            state = (score, bool(audit.get("gamescopeHookActive")),
                     bool(audit.get("injectionActive")))
            if state != last_state:
                # Something genuinely changed -- worth trying again.
                ineffective, delay, stood_down = 0, interval_seconds, False
            last_state = state

            # Only act on conditions auto_repair_system can actually fix. The old
            # trigger was `score < 80 or not gamescopeHookActive`, which stayed
            # true forever on a healthy Deck (an empty AdditionalApps list alone
            # docked the score), so it repaired on every single tick for nothing.
            repairable = audit.get("repairableCodes") or []
            if repairable and not stood_down:
                logger.warn(f"SLSDeck watchdog: health {score}%, repairable={repairable}, "
                            f"auto-repair (attempt {ineffective + 1}/{_MAX_INEFFECTIVE})")
                auto_repair_system()
                after = system_health_audit().get("healthScore", score)
                if after > score:
                    ineffective, delay = 0, interval_seconds
                    _LAST_AUDIT_SCORE = after
                else:
                    ineffective += 1
                    delay = min(delay * 2, _MAX_INTERVAL)
                    if ineffective >= _MAX_INEFFECTIVE:
                        stood_down = True
                        logger.warn(
                            f"SLSDeck watchdog: auto-repair is not improving health "
                            f"(stuck at {after}%); standing down so it stops burning "
                            "CPU/IO in Game Mode. Resumes if system state changes.")
        except Exception as exc:
            logger.warn(f"SLSDeck watchdog iteration error: {exc}")

        try:
            await asyncio.sleep(delay)
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
