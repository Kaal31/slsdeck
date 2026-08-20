"""Deep System Health Audit & One-Touch Auto-Repair for SLSDeck.

Scans the system for configuration errors, missing hooks, permission issues,
stale caches, or broken launch wrappers, and provides automatic one-touch
repair routines.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

from .art import sync_game_art
from .logger import logger
from .paths import get_user_home
from .steam import detect_steam_install_path, set_only_update_on_launch, stplugin_dir
from .utils import chown_to_user, is_root
from . import slssteam, downloads


def system_health_audit() -> Dict[str, Any]:
    """Perform a full system audit and return a health report with issues and score."""
    issues: List[Dict[str, str]] = []
    warnings: List[Dict[str, str]] = []

    # 1. SLSsteam library installation
    lib = slssteam.find_installed_lib()
    if not lib:
        issues.append({
            "code": "SLSSTEAM_MISSING",
            "title": "SLSsteam engine not installed",
            "description": "The SLSsteam shared library was not found on disk.",
        })

    # 2. Injection functional status
    injected = slssteam._injection_functional()
    configured = slssteam._injection_active()
    if lib and not injected:
        if configured:
            warnings.append({
                "code": "INJECTION_PENDING_RESTART",
                "title": "SLSsteam configured, restart required",
                "description": "Injection wrapper is set up, but Steam has not been restarted since activation.",
            })
        else:
            issues.append({
                "code": "INJECTION_OFF",
                "title": "SLSsteam injection is disabled",
                "description": "Gamescope hook and steam.sh wrapper are not active.",
            })

    # 3. Gamescope Game Mode hook
    hook_active = slssteam.gamescope_hook_active()
    if lib and not hook_active:
        warnings.append({
            "code": "GAMESCOPE_HOOK_INACTIVE",
            "title": "Game Mode session hook missing",
            "description": "The gamescope session override hook is not present in ~/.config/gamescope-session*/.",
        })

    # 4. Config file validity
    cfg = slssteam.config_path()
    if not os.path.isfile(cfg):
        issues.append({
            "code": "CONFIG_MISSING",
            "title": "config.yaml missing",
            "description": "SLSsteam configuration file does not exist.",
        })
    else:
        apps = slssteam.read_additional_apps()
        if not apps:
            warnings.append({
                "code": "NO_APPS_REGISTERED",
                "title": "No games registered in config.yaml",
                "description": "AdditionalApps list in config.yaml is empty.",
            })

    # 5. Permission & ownership check (root vs deck user)
    permission_issues = []
    for path_to_check in (slssteam.config_dir(), slssteam.lib_dir(), stplugin_dir()):
        if os.path.exists(path_to_check):
            try:
                st = os.stat(path_to_check)
                if is_root() and st.st_uid == 0:
                    permission_issues.append(path_to_check)
            except Exception:
                pass
    if permission_issues:
        warnings.append({
            "code": "ROOT_OWNERSHIP",
            "title": "Root ownership detected",
            "description": f"Some directories are owned by root: {', '.join(permission_issues)}",
        })

    # Conditions that are normal, or that auto_repair_system() has no ability to
    # fix. These must NOT drag the health score down, because the watchdog uses
    # the score to decide whether to repair -- and repeatedly "repairing" an
    # unfixable condition on a timer is what pegged Game Mode.
    #   NO_APPS_REGISTERED        - having added no games yet is not ill health
    #   INJECTION_PENDING_RESTART - only the user restarting Steam clears this
    #   SLSSTEAM_MISSING          - needs a real install, not a repair pass
    _NOT_A_DEFECT = {"NO_APPS_REGISTERED", "INJECTION_PENDING_RESTART"}
    _UNREPAIRABLE = {"SLSSTEAM_MISSING"} | _NOT_A_DEFECT

    scored_issues = [i for i in issues if i.get("code") not in _NOT_A_DEFECT]
    scored_warnings = [w for w in warnings if w.get("code") not in _NOT_A_DEFECT]
    penalties = len(scored_issues) * 20 + len(scored_warnings) * 10
    health_score = max(0, 100 - penalties)

    # What the watchdog should actually act on. Empty => nothing to do, so it must
    # not run a repair pass at all.
    repairable = [c.get("code") for c in (issues + warnings)
                  if c.get("code") and c.get("code") not in _UNREPAIRABLE]

    return {
        "success": True,
        "healthScore": health_score,
        "issues": issues,
        "warnings": warnings,
        "repairableCodes": repairable,
        "installed": bool(lib),
        "injected": injected,
        "injectionActive": injected,
        "configured": configured,
        "gamescopeHookActive": hook_active,
        "additionalAppsCount": len(slssteam.read_additional_apps()) if os.path.isfile(cfg) else 0,
        "steamPath": detect_steam_install_path(),
    }


def auto_repair_system() -> Dict[str, Any]:
    """Perform one-touch automated repair of permissions, hooks, wrappers, and config."""
    repairs_done = []
    errors = []

    # 1. Ensure config.yaml exists and API is enabled
    try:
        if slssteam.ensure_config():
            repairs_done.append("Seeded/verified config.yaml with API enabled")
    except Exception as exc:
        errors.append(f"Config repair error: {exc}")

    # 2. Re-create launch wrapper
    try:
        pw = slssteam._ensure_path_wrapper()
        if os.path.isfile(pw):
            repairs_done.append(f"Recreated path/steam launch wrapper at {pw}")
    except Exception as exc:
        errors.append(f"Wrapper repair error: {exc}")

    # 3. Re-install gamescope session hook
    try:
        hook_res = slssteam.install_gamescope_hook()
        if hook_res.get("success"):
            repairs_done.append("Re-installed gamescope Game Mode session hook across session paths")
    except Exception as exc:
        errors.append(f"Gamescope hook repair error: {exc}")

    # 4. Activate injection
    try:
        act_res = slssteam.activate_injection()
        if act_res.get("success"):
            repairs_done.append(f"Activated injection via {act_res.get('method')}")
    except Exception as exc:
        errors.append(f"Activation error: {exc}")

    # 5. Fix permissions on OUR OWN directories only.
    #    This used to also pass os.path.join(home, ".config") with recursive=True,
    #    walking the entire user config tree (~8000 entries / >1 GB on a stock
    #    Deck). With the watchdog calling this every 5 minutes it never stopped --
    #    that was the Game Mode slowdown. SLSDeck only ever writes inside its own
    #    directories, so there is nothing else to repair.
    try:
        for p in (slssteam.config_dir(), slssteam.lib_dir(), stplugin_dir()):
            if os.path.exists(p):
                chown_to_user(p, recursive=True)
        repairs_done.append("Restored user permissions across SLSDeck directories")
    except Exception as exc:
        errors.append(f"Chown repair error: {exc}")

    logger.log(f"SLSDeck auto_repair_system: {len(repairs_done)} repair(s) performed, {len(errors)} error(s)")
    # NOTE: deliberately does NOT re-run system_health_audit() here. The watchdog
    # calls this in a loop and re-auditing doubled the per-tick cost.
    return {
        "success": len(errors) == 0,
        "repairs": repairs_done,
        "errors": errors,
    }


def repair_game(appid: int) -> Dict[str, Any]:
    """Repair a specific game: AdditionalApps entry, auto-update policy, and grid art."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    steps = []

    # 1. Register in AdditionalApps if missing
    try:
        if not slssteam.has_app(appid):
            name = downloads.fetch_app_name(appid) or ""
            slssteam.add_app(appid, name)
            steps.append(f"Added {appid} to config.yaml AdditionalApps")
        else:
            steps.append(f"{appid} already present in AdditionalApps")
    except Exception as exc:
        logger.warn(f"SLSDeck repair_game {appid} add_app failed: {exc}")

    # 2. Set AutoUpdateBehavior=1 in appmanifest
    try:
        res = set_only_update_on_launch(appid)
        if res.get("success"):
            steps.append("Set AutoUpdateBehavior=1 (Only update on launch)")
    except Exception as exc:
        logger.warn(f"SLSDeck repair_game {appid} acf update failed: {exc}")

    # 3. Sync grid artwork
    try:
        art_res = sync_game_art(appid)
        if art_res.get("success"):
            steps.append(f"Synced grid artwork (downloaded: {art_res.get('downloaded')})")
    except Exception as exc:
        logger.warn(f"SLSDeck repair_game {appid} art sync failed: {exc}")

    # 4. Trigger live Steam install if injection is live
    try:
        if slssteam._running_injected():
            slssteam.trigger_steam_install(appid)
            steps.append("Triggered live Steam download via SLSsteam IPC")
    except Exception:
        pass

    return {"success": True, "appid": appid, "steps": steps}
