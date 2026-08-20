"""Multi-Storage & MicroSD Library Manager for SteamOS / Steam Deck.

Parses Steam's libraryfolders.vdf to discover all active library drives
(Internal NVMe, MicroSD card /run/media/mmcblk0p1, USB SSDs), computes disk
space usage, and cleans temporary download caches.
"""

from __future__ import annotations

import os
import re
import shutil
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home
from .steam import detect_steam_install_path
from .utils import chown_to_user


def get_library_folders_vdf_path() -> Optional[str]:
    """Find Steam's libraryfolders.vdf file."""
    base = detect_steam_install_path()
    if base:
        p = os.path.join(base, "steamapps", "libraryfolders.vdf")
        if os.path.isfile(p):
            return p
    home = get_user_home()
    for cand in (
        os.path.join(home, ".steam", "steam", "steamapps", "libraryfolders.vdf"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "libraryfolders.vdf"),
    ):
        if os.path.isfile(cand):
            return cand
    return None


def get_storage_info() -> Dict[str, Any]:
    """Discover all Steam library storage locations (NVMe, MicroSD, USB) and disk space."""
    vdf_path = get_library_folders_vdf_path()
    libraries: List[Dict[str, Any]] = []
    seen_paths = set()

    # Always include standard Steam path
    base = detect_steam_install_path() or os.path.join(get_user_home(), ".steam", "steam")
    if os.path.isdir(base):
        real = os.path.realpath(base)
        seen_paths.add(real)
        libraries.append(_build_library_info("Internal Storage", base))

    if vdf_path and os.path.isfile(vdf_path):
        try:
            with open(vdf_path, "r", encoding="utf-8", errors="ignore") as fh:
                content = fh.read()

            # Find all path entries in libraryfolders.vdf
            path_matches = re.findall(r'"path"\s*"([^"]+)"', content, re.IGNORECASE)
            for raw_path in path_matches:
                clean_path = raw_path.replace("\\\\", "/").replace("\\", "/")
                real = os.path.realpath(clean_path)
                if real not in seen_paths and os.path.isdir(clean_path):
                    seen_paths.add(real)
                    label = "MicroSD Card" if "mmcblk" in clean_path or "media" in clean_path else os.path.basename(clean_path)
                    libraries.append(_build_library_info(label, clean_path))
        except Exception as exc:
            logger.warn(f"SLSDeck storage: parse libraryfolders.vdf failed: {exc}")

    return {"success": True, "libraryCount": len(libraries), "libraries": libraries}


def _build_library_info(label: str, path: str) -> Dict[str, Any]:
    """Helper to query disk space usage and game count for a library folder."""
    total, used, free = 0, 0, 0
    try:
        usage = shutil.disk_usage(path)
        total, used, free = usage.total, usage.used, usage.free
    except Exception:
        pass

    steamapps = os.path.join(path, "steamapps")
    if not os.path.isdir(steamapps) and os.path.isdir(os.path.join(path, "common")):
        steamapps = path

    game_count = 0
    if os.path.isdir(steamapps):
        try:
            game_count = len([
                f for f in os.listdir(steamapps)
                if f.startswith("appmanifest_") and f.endswith(".acf")
            ])
        except Exception:
            pass

    return {
        "label": label,
        "path": path,
        "steamapps": steamapps,
        "totalBytes": total,
        "usedBytes": used,
        "freeBytes": free,
        "freeGB": round(free / (1024 ** 3), 2),
        "totalGB": round(total / (1024 ** 3), 2),
        "gameCount": game_count,
    }


def clean_temp_downloads() -> Dict[str, Any]:
    """Purge temporary SLSDeck download files and leftover zip archives."""
    home = get_user_home()
    cleaned_bytes = 0
    cleaned_files = 0

    target_dirs = [
        os.path.join(home, ".config", "SLSsteam", "cache"),
        os.path.join(home, ".local", "share", "SLSsteam", "tmp"),
        os.path.join(home, "Downloads"),
    ]

    for d in target_dirs:
        if not os.path.isdir(d):
            continue
        try:
            for fn in os.listdir(d):
                if fn.endswith(".tmp") or fn.endswith(".sltmp") or (fn.startswith("slsdeck_") and fn.endswith(".tmp")):
                    full = os.path.join(d, fn)
                    try:
                        sz = os.path.getsize(full)
                        os.remove(full)
                        cleaned_bytes += sz
                        cleaned_files += 1
                    except Exception:
                        pass
        except Exception:
            continue

    logger.log(f"SLSDeck storage: cleaned {cleaned_files} temp file(s) ({cleaned_bytes} bytes)")
    return {
        "success": True,
        "cleanedFiles": cleaned_files,
        "cleanedBytes": cleaned_bytes,
        "cleanedMB": round(cleaned_bytes / (1024 ** 2), 2),
    }
