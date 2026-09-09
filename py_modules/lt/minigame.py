"""Random Steam Store discovery for the Advanced-page mini-game."""

from __future__ import annotations

import html
import random
import re
import time
from typing import Any, Dict, List, Set, Tuple

from .httpc import get_http_client

_SEARCH_URL = "https://store.steampowered.com/search/results/"
_DETAIL_URL = "https://store.steampowered.com/api/appdetails"
_CACHE_SECONDS = 60 * 60
_MEMORY: List[Tuple[int, str]] = []
_MEMORY_AT = 0.0
_TOTAL_RESULTS = 0


def _usable(app: Any) -> Tuple[int, str] | None:
    try:
        appid = int(app.get("appid") or 0)
        name = str(app.get("name") or "").strip()
        if appid <= 0 or not name or name.lower().startswith(("dedicated server", "steamworks common")):
            return None
        return appid, name
    except (TypeError, ValueError):
        return None


def _search_page(start: int, count: int = 100) -> Tuple[List[Tuple[int, str]], int]:
    response = get_http_client().get(_SEARCH_URL, params={
        "query": "", "start": max(0, int(start)), "count": max(1, int(count)),
        "sort_by": "_ASC", "category1": "998", "infinite": "1",
        "ignore_preferences": "1", "ndl": "1", "cc": "US", "l": "english",
    }, timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    markup = str(payload.get("results_html") or "")
    total = int(payload.get("total_count") or 0)
    found: List[Tuple[int, str]] = []
    seen: Set[int] = set()
    for match in re.finditer(r'<a\b(?P<attrs>[^>]*\bdata-ds-appid="(?P<appid>\d+)"[^>]*)>(?P<body>.*?)</a>', markup, re.I | re.S):
        appid = int(match.group("appid"))
        title_match = re.search(r'<span\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>(.*?)</span>', match.group("body"), re.I | re.S)
        if appid in seen or not title_match:
            continue
        title = html.unescape(re.sub(r"<[^>]+>", "", title_match.group(1))).strip()
        if title:
            seen.add(appid)
            found.append((appid, title))
    return found, total


def _catalog() -> List[Tuple[int, str]]:
    global _MEMORY, _MEMORY_AT, _TOTAL_RESULTS
    if _MEMORY and time.time() - _MEMORY_AT < _CACHE_SECONDS:
        return _MEMORY

    # Steam retired the unauthenticated ISteamApps/GetAppList endpoint. Its
    # replacement requires an API key, whereas the Store's own paginated
    # search feed remains public. Read a random page from the Games category.
    if not _TOTAL_RESULTS:
        _, _TOTAL_RESULTS = _search_page(0, 1)
    pool: List[Tuple[int, str]] = []
    for _ in range(4):
        upper = max(0, _TOTAL_RESULTS - 100)
        page, reported_total = _search_page(random.randint(0, upper) if upper else 0, 100)
        _TOTAL_RESULTS = max(_TOTAL_RESULTS, reported_total)
        pool.extend(page)
        if len({appid for appid, _ in pool}) >= 80:
            break
    deduplicated: Dict[int, str] = {}
    for appid, name in pool:
        deduplicated[appid] = name
    _MEMORY = list(deduplicated.items())
    _MEMORY_AT = time.time()
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
        if (
            not isinstance(data, dict)
            or data.get("type") != "game"
            or not data.get("name")
            or bool(data.get("is_free"))
        ):
            return None
        online_markers = ("massively multiplayer", "mmo")
        classifications = []
        for group in (data.get("categories") or [], data.get("genres") or []):
            classifications.extend(str(item.get("description") or "").lower() for item in group if isinstance(item, dict))
        if any(marker in label for label in classifications for marker in online_markers):
            return None
        return {
            "appid": appid,
            "name": str(data["name"]),
            "image": str(data.get("header_image") or ""),
            "shortDescription": str(data.get("short_description") or ""),
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
