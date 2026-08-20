"""OnlineFix Multiplayer & DLL Override Engine for SLSDeck.

Automatically scans game install directories under steamapps/common/ for OnlineFix,
SteamOverlay, or third-party emulator DLLs (OnlineFix64.dll, SteamOverlay64.dll, winmm.dll, dxgi.dll),
and configures optimal WINEDLLOVERRIDES launch flags so multiplayer fixes work zero-config!
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

from .logger import logger
from .storage import get_storage_info
from .steam import get_install_dir_from_acf
from .compat import set_proton_mapping
from .utils import chown_to_user


_TARGET_FIX_DLLS = {
    "OnlineFix64.dll": "OnlineFix64=n,b",
    "OnlineFix.dll": "OnlineFix=n,b",
    "SteamOverlay64.dll": "SteamOverlay64=n,b",
    "SteamOverlay.dll": "SteamOverlay=n,b",
    "winmm.dll": "winmm=n,b",
    "dxgi.dll": "dxgi=n,b",
    "d3d11.dll": "d3d11=n,b",
    "version.dll": "version=n,b",
}


def scan_game_directory(install_path: str) -> List[str]:
    """Scan a game directory for known OnlineFix / multiplayer hook DLLs."""
    detected_overrides: List[str] = []
    if not install_path or not os.path.isdir(install_path):
        return detected_overrides

    try:
        for root, _dirs, files in os.walk(install_path):
            for fn in files:
                fn_lower = fn.lower()
                for dll_name, override_flag in _TARGET_FIX_DLLS.items():
                    if fn_lower == dll_name.lower():
                        if override_flag not in detected_overrides:
                            detected_overrides.append(override_flag)
    except Exception as exc:
        logger.warn(f"SLSDeck online_patch: scan {install_path} failed: {exc}")

    return detected_overrides


def generate_winedlloverrides_flag(overrides: List[str]) -> str:
    """Combine detected DLL override tokens into a standard WINEDLLOVERRIDES string."""
    if not overrides:
        return ""
    joined = ";".join(overrides)
    return f'WINEDLLOVERRIDES="{joined}" %command%'


def patch_game_onlinefix(appid: int) -> Dict[str, Any]:
    """Auto-detect OnlineFix DLLs for a game and configure launch overrides."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    # Find game install folder across all storage drives
    install_dir = None
    storage_info = get_storage_info()

    for lib in storage_info.get("libraries", []):
        steamapps = lib.get("steamapps")
        if steamapps:
            p = get_install_dir_from_acf(steamapps, appid)
            if p and os.path.isdir(p):
                install_dir = p
                break

    if not install_dir:
        return {
            "success": False,
            "appid": appid,
            "error": "Game installation directory not found on any storage drive",
        }

    overrides = scan_game_directory(install_dir)
    if not overrides:
        return {
            "success": True,
            "appid": appid,
            "installDir": install_dir,
            "detectedFixes": [],
            "launchOption": "",
            "message": "No OnlineFix DLLs detected in game directory.",
        }

    launch_flag = generate_winedlloverrides_flag(overrides)
    logger.log(f"SLSDeck online_patch: appid {appid} in {install_dir} -> {launch_flag}")

    return {
        "success": True,
        "appid": appid,
        "installDir": install_dir,
        "detectedFixes": overrides,
        "launchOption": launch_flag,
    }


def auto_patch_all_onlinefix() -> Dict[str, Any]:
    """Scan all SLSsteam registered games and return OnlineFix patch reports."""
    try:
        from .slssteam import read_additional_apps
        apps = read_additional_apps()
    except Exception as exc:
        return {"success": False, "error": f"Failed to read apps: {exc}"}

    results = {}
    patched_count = 0
    for appid in apps:
        res = patch_game_onlinefix(appid)
        results[str(appid)] = res
        if res.get("detectedFixes"):
            patched_count += 1

    return {
        "success": True,
        "totalApps": len(apps),
        "patchedApps": patched_count,
        "results": results,
    }
