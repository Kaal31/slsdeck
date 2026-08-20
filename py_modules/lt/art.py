"""Steam Library Grid Artwork Auto-Sync for SteamOS / Steam Deck.

Downloads high-resolution cover art (vertical capsule 600x900), hero banner,
logo, and landscape header from Steam CDN into all user profile grid directories
(~/.steam/steam/userdata/<account_id>/config/grid/).

SteamGridDB & Custom Art Plugin Protection:
Strictly checks existing artwork files (.png, .jpg, .jpeg, .webp, .tga) in
userdata/<account_id>/config/grid/ to ensure custom artwork set by SteamGridDB or
the user is NEVER overwritten unless overwrite=True is explicitly passed.
"""

from __future__ import annotations

import os
import shutil
from typing import Any, Dict, List

from .httpc import ensure_http_client
from .logger import logger
from .paths import get_user_home
from .steam import detect_steam_install_path
from .utils import chown_to_user

_STEAM_CDN_BASE = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{appid}"

_ARTWORK_TYPES = [
    {
        "name": "cover",
        "url": f"{_STEAM_CDN_BASE}/library_600x900.jpg",
        "filenames": ["{appid}p.jpg", "{appid}_library_600x900.jpg"],
    },
    {
        "name": "hero",
        "url": f"{_STEAM_CDN_BASE}/library_hero.jpg",
        "filenames": ["{appid}_hero.jpg"],
    },
    {
        "name": "logo",
        "url": f"{_STEAM_CDN_BASE}/logo.png",
        "filenames": ["{appid}_logo.png"],
    },
    {
        "name": "header",
        "url": f"{_STEAM_CDN_BASE}/header.jpg",
        "filenames": ["{appid}_header.jpg", "{appid}.jpg"],
    },
]


def _grid_dirs() -> List[str]:
    """Find all grid directories across all Steam user profiles."""
    home = get_user_home()
    roots = []
    base = detect_steam_install_path()
    if base:
        roots.append(os.path.join(base, "userdata"))
    roots.append(os.path.join(home, ".steam", "steam", "userdata"))
    roots.append(os.path.join(home, ".local", "share", "Steam", "userdata"))

    grid_dirs = []
    seen = set()
    for root in roots:
        if not os.path.isdir(root):
            continue
        try:
            for user_id in os.listdir(root):
                if not user_id.isdigit() or user_id == "0":
                    continue
                grid_dir = os.path.join(root, user_id, "config", "grid")
                real = os.path.realpath(grid_dir)
                if real not in seen:
                    seen.add(real)
                    grid_dirs.append(grid_dir)
        except Exception:
            continue
    return grid_dirs


def _has_custom_art(grid_dir: str, appid: int, art_type_name: str) -> bool:
    """Check if the user or a plugin (like SteamGridDB) already set custom art for this slot.

    Scans for all standard image extensions (.png, .jpg, .jpeg, .webp, .tga) and
    SteamGridDB naming patterns.
    """
    if not os.path.isdir(grid_dir):
        return False

    valid_exts = (".png", ".jpg", ".jpeg", ".webp", ".tga")
    try:
        filenames = os.listdir(grid_dir)
    except Exception:
        return False

    str_appid = str(appid)

    for fn in filenames:
        fn_lower = fn.lower()
        if not any(fn_lower.endswith(ext) for ext in valid_exts):
            continue

        if art_type_name == "cover":
            if (
                fn_lower.startswith(f"{str_appid}p.")
                or fn_lower.startswith(f"{str_appid}_library_600x900.")
                or fn_lower.startswith(f"{str_appid}_cover.")
            ):
                return True
        elif art_type_name == "hero":
            if fn_lower.startswith(f"{str_appid}_hero."):
                return True
        elif art_type_name == "logo":
            if fn_lower.startswith(f"{str_appid}_logo."):
                return True
        elif art_type_name == "header":
            if (
                fn_lower.startswith(f"{str_appid}_header.")
                or fn_lower.startswith(f"{str_appid}_landscape.")
            ):
                return True
            name_no_ext, _ = os.path.splitext(fn_lower)
            if name_no_ext == str_appid:
                return True

    return False


def sync_game_art(appid: int, overwrite: bool = False) -> Dict[str, Any]:
    """Download missing artwork for a game into all user grid directories.

    Guarantees zero interference with SteamGridDB or custom artwork plugins.
    Preserves all existing custom artwork unless overwrite=True is explicitly set.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    grid_dirs = _grid_dirs()
    if not grid_dirs:
        # Create a default grid directory if none exists yet
        base = detect_steam_install_path() or os.path.join(get_user_home(), ".steam", "steam")
        user_root = os.path.join(base, "userdata")
        if os.path.isdir(user_root):
            try:
                for uid in os.listdir(user_root):
                    if uid.isdigit() and uid != "0":
                        grid_dirs.append(os.path.join(user_root, uid, "config", "grid"))
            except Exception:
                pass

    if not grid_dirs:
        return {"success": False, "error": "No Steam user profile grid directory found"}

    client = ensure_http_client("SLSDeck: art sync")
    headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
    downloaded = []
    skipped = []
    failed = []

    for art_type in _ARTWORK_TYPES:
        name = art_type["name"]

        # Skip download if custom artwork exists across all grid dirs and overwrite=False
        if not overwrite and all(_has_custom_art(gd, appid, name) for gd in grid_dirs):
            skipped.append(name)
            continue

        url = art_type["url"].format(appid=appid)
        try:
            resp = client.get(url, headers=headers, follow_redirects=True, timeout=10)
            if resp.status_code != 200 or not resp.content or len(resp.content) < 100:
                failed.append(name)
                continue

            for grid_dir in grid_dirs:
                try:
                    if not overwrite and _has_custom_art(grid_dir, appid, name):
                        continue  # Preserve custom SteamGridDB art in this profile
                    os.makedirs(grid_dir, exist_ok=True)
                    chown_to_user(grid_dir, recursive=False)
                    for fn_template in art_type["filenames"]:
                        fn = fn_template.format(appid=appid)
                        target = os.path.join(grid_dir, fn)
                        with open(target, "wb") as fh:
                            fh.write(resp.content)
                        chown_to_user(target, recursive=False)
                except Exception as write_exc:
                    logger.warn(f"SLSDeck art: write {name} to {grid_dir} failed: {write_exc}")
            downloaded.append(name)
        except Exception as exc:
            logger.warn(f"SLSDeck art: fetch {name} for {appid} failed: {exc}")
            failed.append(name)

    logger.log(f"SLSDeck art: synced {appid} -> downloaded: {downloaded}, skipped (SteamGridDB preserved): {skipped}, failed: {failed}")
    return {
        "success": True,
        "appid": appid,
        "downloaded": downloaded,
        "skipped": skipped,
        "failed": failed,
        "gridDirs": grid_dirs,
    }


def sync_all_added_art(overwrite: bool = False) -> Dict[str, Any]:
    """Sync missing artwork for all games registered in SLSsteam config."""
    try:
        from .slssteam import read_additional_apps
        apps = read_additional_apps()
    except Exception as exc:
        return {"success": False, "error": f"Failed to read added apps: {exc}"}

    results = {}
    synced = 0
    for appid in apps:
        r = sync_game_art(appid, overwrite=overwrite)
        results[str(appid)] = r
        if r.get("success"):
            synced += 1

    return {"success": True, "total": len(apps), "synced": synced, "results": results}
