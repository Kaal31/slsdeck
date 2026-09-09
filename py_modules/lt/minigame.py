"""Random Steam Store discovery for the Advanced-page mini-game."""

from __future__ import annotations

import json
import os
import random
import time
from typing import Any, Dict, List, Set, Tuple

from .httpc import get_http_client
from .paths import get_user_home

_APP_LIST_URL = "https://api.steampowered.com/ISteamApps/GetAppList/v2/"
_DETAIL_URL = "https://store.steampowered.com/api/appdetails"
_CACHE_SECONDS = 24 * 60 * 60
_MEMORY: List[Tuple[int, str]] = []


def _cache_path() -> str:
    return os.path.join(get_user_home(), ".cache", "slsdeck", "minigame_apps.json")


def _usable(app: Any) -> Tuple[int, str] | None:
    try:
        appid = int(app.get("appid") or 0)
        name = str(app.get("name") or "").strip()
        if appid <= 0 or not name or name.lower().startswith(("dedicated server", "steamworks common")):
            return None
        return appid, name
    except (TypeError, ValueError):
        return None


def _catalog() -> List[Tuple[int, str]]:
    global _MEMORY
    if _MEMORY:
        return _MEMORY
    path = _cache_path()
    try:
        if time.time() - os.path.getmtime(path) < _CACHE_SECONDS:
            with open(path, "r", encoding="utf-8") as fh:
                cached = json.load(fh)
            _MEMORY = [item for raw in cached if (item := _usable(raw))]
            if _MEMORY:
                return _MEMORY
    except (OSError, ValueError, TypeError):
        pass

    response = get_http_client().get(_APP_LIST_URL, timeout=45.0)
    response.raise_for_status()
    raw_apps = response.json().get("applist", {}).get("apps", [])
    _MEMORY = [item for raw in raw_apps if (item := _usable(raw))]
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump([{"appid": appid, "name": name} for appid, name in _MEMORY], fh)
    except OSError:
        pass
    return _MEMORY


def _store_game(appid: int) -> Dict[str, Any] | None:
    try:
        response = get_http_client().get(
            _DETAIL_URL,
            params={"appids": str(appid), "cc": "US", "l": "english"},
            timeout=15.0,
        )
        response.raise_for_status()
        entry = response.json().get(str(appid), {})
        data = entry.get("data") if entry.get("success") else None
        if not isinstance(data, dict) or data.get("type") != "game" or not data.get("name"):
            return None
        return {
            "appid": appid,
            "name": str(data["name"]),
            "image": str(data.get("header_image") or ""),
            "shortDescription": str(data.get("short_description") or ""),
            "isFree": bool(data.get("is_free")),
        }
    except Exception:
        return None


def roll(excluded_appids: List[int] | None = None, count: int = 36) -> Dict[str, Any]:
    excluded: Set[int] = {int(value) for value in (excluded_appids or []) if int(value) > 0}
    catalog = [(appid, name) for appid, name in _catalog() if appid not in excluded]
    if len(catalog) < 40:
        return {"success": False, "error": "Steam Store catalog is unavailable"}

    # Validate the prize against Store appdetails so the reel cannot land on a
    # tool, DLC, soundtrack, demo, or removed catalog entry.
    candidates = random.sample(catalog, min(48, len(catalog)))
    winner = None
    for appid, _ in candidates:
        winner = _store_game(appid)
        if winner:
            break
    if not winner:
        return {"success": False, "error": "Could not find a live Steam game; try again"}

    count = max(28, min(int(count), 42))
    filler_pool = [item for item in catalog if item[0] != winner["appid"]]
    filler = random.sample(filler_pool, count - 1)
    stop_index = count - 6
    reel = []
    for appid, name in filler:
        reel.append({
            "appid": appid,
            "name": name,
            "image": f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg",
        })
    reel.insert(stop_index, winner)
    return {"success": True, "items": reel, "winnerIndex": stop_index, "winner": winner}
