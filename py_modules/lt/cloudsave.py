"""Proton Savegame Backup Manager for SteamOS / Steam Deck.

Scans Proton prefixes (steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/) for
savegames in AppData/Local, AppData/Roaming, Saved Games, and Documents, creating compressed
zip backups under ~/Downloads/slsdeck_saves/.
"""

from __future__ import annotations

import datetime
import os
import shutil
import zipfile
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home
from .storage import get_storage_info
from .utils import chown_to_user, is_safe_path


def find_proton_prefix(appid: int) -> Optional[str]:
    """Locate the Proton prefix directory for an AppID across all storage drives."""
    storage_info = get_storage_info()
    for lib in storage_info.get("libraries", []):
        steamapps = lib.get("steamapps")
        if steamapps:
            pfx = os.path.join(steamapps, "compatdata", str(appid), "pfx")
            if os.path.isdir(pfx):
                return pfx
    return None


def discover_save_locations(prefix_path: str) -> List[Dict[str, str]]:
    """Scan drive_c under the Proton prefix for user save game folders."""
    locations: List[Dict[str, str]] = []
    if not prefix_path or not os.path.isdir(prefix_path):
        return locations

    steamuser = os.path.join(prefix_path, "drive_c", "users", "steamuser")
    if not os.path.isdir(steamuser):
        return locations

    target_subdirs = [
        ("AppData/Local", os.path.join(steamuser, "AppData", "Local")),
        ("AppData/Roaming", os.path.join(steamuser, "AppData", "Roaming")),
        ("Saved Games", os.path.join(steamuser, "Saved Games")),
        ("Documents", os.path.join(steamuser, "Documents")),
    ]

    for label, path in target_subdirs:
        if os.path.isdir(path):
            try:
                # Count files inside
                cnt = sum(len(files) for _, _, files in os.walk(path))
                if cnt > 0:
                    locations.append({
                        "label": label,
                        "path": path,
                        "fileCount": cnt,
                    })
            except Exception:
                continue

    return locations


def default_backup_dir() -> str:
    return os.path.join(get_user_home(), "Downloads", "slsdeck_saves")


def list_game_save_backups(appid: int, dest_dir: str = "") -> Dict[str, Any]:
    """Existing save backups for an appid, newest first.

    Restore takes an absolute zip path, which is unusable from a controller
    without something to pick from -- this is that list."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid", "backups": []}
    d = dest_dir or default_backup_dir()
    out = []
    try:
        prefix = f"saves_appid_{appid}_"
        for fn in os.listdir(d):
            if not (fn.startswith(prefix) and fn.endswith(".zip")):
                continue
            full = os.path.join(d, fn)
            try:
                st = os.stat(full)
            except Exception:
                continue
            out.append({
                "path": full,
                "name": fn,
                "sizeBytes": st.st_size,
                "sizeMB": round(st.st_size / (1024 * 1024), 1),
                "mtime": st.st_mtime,
                "when": datetime.datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M"),
            })
    except FileNotFoundError:
        pass
    except Exception as exc:
        return {"success": False, "error": str(exc), "backups": []}
    out.sort(key=lambda b: b["mtime"], reverse=True)
    return {"success": True, "appid": appid, "backups": out, "dir": d}


def backup_game_saves(appid: int, dest_dir: str = "") -> Dict[str, Any]:
    """Export all Proton prefix savegame folders for an appid into a compressed zip archive."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    pfx = find_proton_prefix(appid)
    if not pfx:
        return {"success": False, "appid": appid, "error": f"Proton prefix (compatdata/{appid}) not found"}

    locations = discover_save_locations(pfx)
    if not locations:
        return {"success": False, "appid": appid, "error": "No savegame files found in Proton prefix"}

    home = get_user_home()
    if not dest_dir:
        dest_dir = os.path.join(home, "Downloads", "slsdeck_saves")

    os.makedirs(dest_dir, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_path = os.path.join(dest_dir, f"saves_appid_{appid}_{stamp}.zip")

    total_files = 0
    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for loc in locations:
                base_path = loc["path"]
                rel_base = loc["label"]
                for root, _dirs, files in os.walk(base_path):
                    for fn in files:
                        full_path = os.path.join(root, fn)
                        rel_path = os.path.join(rel_base, os.path.relpath(full_path, base_path))
                        zf.write(full_path, arcname=rel_path)
                        total_files += 1

        chown_to_user(zip_path, recursive=False)
        sz = os.path.getsize(zip_path)
        logger.log(f"SLSDeck savegame: backed up appid {appid} -> {zip_path} ({total_files} files, {sz} bytes)")

        return {
            "success": True,
            "appid": appid,
            "zipPath": zip_path,
            "fileCount": total_files,
            "sizeBytes": sz,
            "locations": [loc["label"] for loc in locations],
        }
    except Exception as exc:
        logger.error(f"SLSDeck savegame backup failed for {appid}: {exc}")
        return {"success": False, "appid": appid, "error": str(exc)}


def restore_game_saves(appid: int, zip_path: str) -> Dict[str, Any]:
    """Restore savegames from a zip archive into a game's Proton prefix."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    if not zip_path or not os.path.isfile(zip_path):
        return {"success": False, "error": "Savegame zip file not found"}

    pfx = find_proton_prefix(appid)
    if not pfx:
        return {"success": False, "error": f"Proton prefix for appid {appid} not found"}

    steamuser = os.path.join(pfx, "drive_c", "users", "steamuser")
    restored_files = 0

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            for member in zf.infolist():
                if member.filename.endswith("/"):
                    continue

                parts = member.filename.split("/", 1)
                if len(parts) < 2:
                    continue

                category, rel_path = parts[0], parts[1]
                target_base = os.path.join(steamuser, category)

                if not is_safe_path(target_base, rel_path):
                    continue

                target_file = os.path.join(target_base, rel_path)
                os.makedirs(os.path.dirname(target_file), exist_ok=True)

                with zf.open(member) as src, open(target_file, "wb") as dst:
                    dst.write(src.read())

                chown_to_user(target_file, recursive=False)
                restored_files += 1

        logger.log(f"SLSDeck savegame: restored {restored_files} save files for appid {appid}")
        return {"success": True, "appid": appid, "restoredFiles": restored_files}
    except Exception as exc:
        logger.error(f"SLSDeck savegame restore failed for {appid}: {exc}")
        return {"success": False, "error": str(exc)}
