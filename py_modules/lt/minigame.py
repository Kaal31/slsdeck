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
_MEMORY: Dict[int, Tuple[float, List[Tuple[int, str, int]]]] = {}
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


def _search_page(start: int, count: int = 100, sort_by: str = "_ASC") -> Tuple[List[Tuple[int, str, int]], int]:
    response = get_http_client().get(_SEARCH_URL, params={
        "query": "", "start": max(0, int(start)), "count": max(1, int(count)),
        "sort_by": sort_by, "category1": "998", "infinite": "1",
        "ignore_preferences": "1", "ndl": "1", "cc": "US", "l": "english",
    }, timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    markup = str(payload.get("results_html") or "")
    total = int(payload.get("total_count") or 0)
    found: List[Tuple[int, str, int]] = []
    seen: Set[int] = set()
    for match in re.finditer(r'<a\b(?P<attrs>[^>]*\bdata-ds-appid="(?P<appid>\d+)"[^>]*)>(?P<body>.*?)</a>', markup, re.I | re.S):
        appid = int(match.group("appid"))
        title_match = re.search(r'<span\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>(.*?)</span>', match.group("body"), re.I | re.S)
        if appid in seen or not title_match:
            continue
        title = html.unescape(re.sub(r"<[^>]+>", "", title_match.group(1))).strip()
        price_match = re.search(r'data-price-final="(\d+)"', match.group("body"), re.I)
        price_cents = int(price_match.group(1)) if price_match else 0
        if title and price_cents > 0:
            seen.add(appid)
            found.append((appid, title, price_cents))
    return found, total


def _catalog(min_price_cents: int = 0) -> List[Tuple[int, str, int]]:
    global _MEMORY, _TOTAL_RESULTS
    cached = _MEMORY.get(min_price_cents)
    if cached and time.time() - cached[0] < _CACHE_SECONDS:
        return cached[1]

    # Steam retired the unauthenticated ISteamApps/GetAppList endpoint. Its
    # replacement requires an API key, whereas the Store's own paginated
    # search feed remains public. Read a random page from the Games category.
    if not _TOTAL_RESULTS:
        _, _TOTAL_RESULTS = _search_page(0, 1)
    pool: List[Tuple[int, str, int]] = []
    expensive = min_price_cents > 0
    for page_number in range(4):
        upper = max(0, _TOTAL_RESULTS - 100)
        start = page_number * 100 if expensive else (random.randint(0, upper) if upper else 0)
        page, reported_total = _search_page(start, 100, "Price_DESC" if expensive else "_ASC")
        _TOTAL_RESULTS = max(_TOTAL_RESULTS, reported_total)
        pool.extend(page)
        if len({appid for appid, _, _ in pool}) >= 80:
            break
    deduplicated: Dict[int, Tuple[str, int]] = {}
    for appid, name, price_cents in pool:
        if price_cents >= max(1, min_price_cents):
            deduplicated[appid] = (name, price_cents)
    result = [(appid, name, price) for appid, (name, price) in deduplicated.items()]
    _MEMORY[min_price_cents] = (time.time(), result)
    return result


def _store_game(appid: int, price_cents: int) -> Dict[str, Any] | None:
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
        price = data.get("price_overview") or {}
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
            "priceCents": price_cents,
            "currency": str(price.get("currency") or "USD"),
        }
    except Exception:
        return None


def roll(excluded_appids: List[int] | None = None, count: int = 36, min_price_cents: int = 0) -> Dict[str, Any]:
    excluded: Set[int] = {int(value) for value in (excluded_appids or []) if int(value) > 0}
    min_price_cents = max(0, int(min_price_cents or 0))
    catalog = [(appid, name, price) for appid, name, price in _catalog(min_price_cents) if appid not in excluded]
    if not catalog:
        return {"success": False, "error": "No paid Steam games matched that price mode; try again"}

    # Validate the prize against Store appdetails so the reel cannot land on a
    # tool, DLC, soundtrack, demo, or removed catalog entry.
    candidates = random.sample(catalog, min(48, len(catalog)))
    winner = None
    for appid, _, price_cents in candidates:
        winner = _store_game(appid, price_cents)
        if winner:
            break
    if not winner:
        return {"success": False, "error": "Could not find a live Steam game; try again"}

    count = max(28, min(int(count), 42))
    # Only the winning card must satisfy the selected price floor. Fill the
    # surrounding reel from the normal paid catalog so very rare tiers (such
    # as $1000+) still produce a full, varied animation.
    filler_pool = [item for item in _catalog(0) if item[0] not in excluded and item[0] != winner["appid"]]
    if not filler_pool:
        return {"success": False, "error": "Steam Store catalog is unavailable"}
    filler = random.sample(filler_pool, count - 1) if len(filler_pool) >= count - 1 else random.choices(filler_pool, k=count - 1)
    stop_index = count - 6
    reel = []
    for appid, name, _ in filler:
        reel.append({
            "appid": appid,
            "name": name,
            "image": f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg",
        })
    reel.insert(stop_index, winner)
    return {"success": True, "items": reel, "winnerIndex": stop_index, "winner": winner}
