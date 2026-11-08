"""Read-only Steam launcher/injection verification for SLSDeck.

Automatic snapshots go to Decky's normal log on startup, after activation, and
when the Steam PID/injection state changes. Never edits launchers or restarts Steam.
"""
from __future__ import annotations

import os
import re
import subprocess
import threading
import time
from typing import Any, Dict

from .logger import logger
from . import slssteam

_LOCK = threading.Lock()
_LAST: Dict[str, Any] = {}
_LAST_LOG_TIME = 0.0
_HEARTBEAT = 600


def _steam_process() -> Dict[str, Any]:
    """Inspect only candidate Steam processes; include process start ticks to
    distinguish a new Steam session from an old log and reused PID."""
    found = []
    try:
        with os.scandir("/proc") as entries:
            for entry in entries:
                if not entry.name.isdigit():
                    continue
                pid = entry.name
                try:
                    with open(f"/proc/{pid}/comm", encoding="utf-8") as fh:
                        name = fh.read(80).strip()
                    if name not in ("steam", "steamwebhelper", "steamclient"):
                        continue
                    # /proc/stat comm may contain spaces and parentheses.
                    with open(f"/proc/{pid}/stat", encoding="utf-8") as fh:
                        stat = fh.read()
                    ticks = int(stat.rsplit(")", 1)[1].split()[19])
                    with open(f"/proc/{pid}/maps", encoding="utf-8", errors="replace") as fh:
                        mapped = any("SLSsteam.so" in line for line in fh)
                    found.append({"pid": int(pid), "name": name, "startTicks": ticks,
                                  "moonMapped": mapped})
                except (OSError, ValueError, IndexError):
                    continue
    except OSError:
        pass
    found.sort(key=lambda p: (p["name"] != "steam", p["pid"]))
    primary = next((p for p in found if p["name"] == "steam"), None)
    return {"primary": primary, "processes": found[:12],
            "mapped": any(p["moonMapped"] for p in found)}


def _effective_service() -> Dict[str, Any]:
    """Actual effective ExecStart and DropInPaths from user systemd, not merely
    presence of a .conf file. Do not log Environment properties or secrets."""
    if not slssteam._steamos_unit_present():
        return {"available": False, "selected": None, "reason": "SteamOS service not detected"}
    try:
        cmd = slssteam._wrap_as_user([
            "systemctl", "--user", "show", "steam-launcher.service",
            "--property=ExecStart", "--property=DropInPaths", "--no-pager"])
        run = subprocess.run(cmd, env=slssteam._rich_env(), capture_output=True,
                             text=True, timeout=6, check=False)
        if run.returncode:
            return {"available": False, "selected": None,
                    "reason": "systemctl user show exit " + str(run.returncode)}
        fields = dict(line.split("=", 1) for line in run.stdout.splitlines() if "=" in line)
        execution = fields.get("ExecStart", "")
        dropins = fields.get("DropInPaths", "")
        marker = ".local/share/SLSsteam/path"
        selected = marker in execution and "steam-launcher" in execution
        return {"available": True, "selected": selected,
                "dropinActive": "50-slsdeck.conf" in dropins,
                "execUsesSLSPath": marker in execution}
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"available": False, "selected": None, "reason": type(exc).__name__}


def classify(snapshot: Dict[str, Any]) -> str:
    """Never report success just because a hook exists or a .so is mapped."""
    if not snapshot.get("steamRunning"):
        return "steam-not-running"
    if snapshot.get("functional"):
        return "functional-confirmed"
    if snapshot.get("moonMapped") and snapshot.get("moonLogSuccess") is False:
        return "moon-initialization-failed"
    if not snapshot.get("hookConfigured"):
        return "hook-not-configured"
    if snapshot.get("serviceSelected") is False:
        return "service-not-selecting-slsdeck"
    if snapshot.get("wrapperThisBoot") is False:
        return "wrapper-not-observed"
    if not snapshot.get("moonMapped"):
        return "moon-not-mapped"
    return "mapped-but-function-unconfirmed"


def snapshot() -> Dict[str, Any]:
    processes = _steam_process()
    service = _effective_service()
    try:
        boot_id = open("/proc/sys/kernel/random/boot_id", encoding="ascii").read().strip()
    except OSError:
        boot_id = ""
    trace_file = os.path.join(slssteam.lib_dir(), ".launch_trace")
    try:
        with open(trace_file, encoding="utf-8", errors="replace") as fh:
            trace = fh.read(4096).strip()
        trace_mtime = os.path.getmtime(trace_file)
    except OSError:
        trace, trace_mtime = "", 0
    boot_time = slssteam._system_boot_epoch()
    wrapper_this_boot = (bool(boot_id and f"boot={boot_id} " in trace)
                         if trace and boot_id else None)
    if wrapper_this_boot is None and trace and boot_time and trace_mtime >= boot_time:
        wrapper_this_boot = True
    moon_log = slssteam._slssteam_log_path()
    recent = False
    if moon_log and boot_time:
        try:
            recent = os.path.getmtime(moon_log) >= boot_time - 5
        except OSError:
            pass
    moon_ok = slssteam._log_last_load_ok() if recent else None
    try:
        functional = bool(slssteam._injection_functional())
    except Exception:
        functional = False
    hook = slssteam.gamescope_hook_active()
    try:
        root, sh = slssteam._steam_root_and_sh()
        steamsh = bool(sh and os.path.isfile(sh) and
                       slssteam._WRAPPER_MARK in open(sh, encoding="utf-8",
                                                      errors="replace").read(8192))
    except OSError:
        steamsh = False
    selected = service.get("selected")
    result = {
        "steamRunning": bool(processes["primary"]),
        "steamSession": (f'{processes["primary"]["pid"]}:{processes["primary"]["startTicks"]}'
                         if processes["primary"] else ""),
        "steamPid": processes["primary"]["pid"] if processes["primary"] else None,
        "hookConfigured": bool(hook or steamsh),
        "hookType": "steamos-service" if service["available"] else
                    ("gamescope-session" if hook else "steam.sh" if steamsh else "none"),
        "serviceSelected": selected,
        "serviceDropinActive": service.get("dropinActive"),
        "serviceError": service.get("reason", ""),
        "wrapperThisBoot": wrapper_this_boot,
        "moonMapped": processes["mapped"],
        "moonLogSuccess": moon_ok,
        "functional": functional,
        "moonLogFreshThisBoot": recent,
        "steamClientVersion": slssteam.steam_client_version() or "unknown",
        "engineInstalled": bool(slssteam.find_installed_lib()),
    }
    result["stage"] = classify(result)
    return result


def log_snapshot(reason: str = "manual", force: bool = False) -> Dict[str, Any]:
    """Only log state transitions, explicit actions, and a ten-minute heartbeat."""
    global _LAST_LOG_TIME
    if not _LOCK.acquire(blocking=False):
        return {"success": False, "reason": "snapshot already running"}
    try:
        result = snapshot()
        key = (result["steamSession"], result["hookType"],
               result["serviceSelected"], result["wrapperThisBoot"],
               result["moonMapped"], result["moonLogSuccess"],
               result["functional"], result["stage"])
        now = time.monotonic()
        changed = key != _LAST.get("key")
        if force or changed or now - _LAST_LOG_TIME >= _HEARTBEAT:
            _LAST["key"] = key
            _LAST_LOG_TIME = now
            # No raw process command lines, environment, Steam auth, or API keys.
            level = logger.log if result["stage"] == "functional-confirmed" else logger.warn
            level("[INJECTION-DIAG] "
                  f"event={reason} stage={result['stage']} "
                  f"steamSession={result['steamSession'] or 'none'} "
                  f"hook={result['hookType']} effectiveService={result['serviceSelected']} "
                  f"dropinActive={result['serviceDropinActive']} "
                  f"wrapperThisBoot={result['wrapperThisBoot']} "
                  f"moonMapped={result['moonMapped']} "
                  f"moonLogFresh={result['moonLogFreshThisBoot']} "
                  f"moonInitialized={result['moonLogSuccess']} "
                  f"functional={result['functional']} "
                  f"clientVersion={result['steamClientVersion']}")
        return {"success": True, **result}
    except Exception as exc:
        logger.warn(f"[INJECTION-DIAG] event={reason} stage=diagnostic-error type={type(exc).__name__}")
        return {"success": False, "error": type(exc).__name__}
    finally:
        _LOCK.release()
