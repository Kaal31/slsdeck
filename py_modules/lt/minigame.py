"""Random Steam Store discovery for the Advanced-page mini-game."""

from __future__ import annotations

import html
import json
import random
import re
import time
from typing import Any, Dict, List, Set, Tuple

from .httpc import get_http_client

_SEARCH_URL = "https://store.steampowered.com/search/results/"
_DETAIL_URL = "https://store.steampowered.com/api/appdetails"
_REVIEWS_URL = "https://store.steampowered.com/appreviews/{appid}"
_DECK_URL = "https://store.steampowered.com/saleaction/ajaxgetdeckappcompatibilityreport"
_CACHE_SECONDS = 60 * 60
_MEMORY: Dict[str, Tuple[float, List[Tuple[int, str, int]]]] = {}
_TOTAL_RESULTS: Dict[str, int] = {}
_TAG_IDS = {
    "action": 19, "rpg": 122, "strategy": 9, "simulation": 599,
    "adventure": 21, "horror": 1667, "racing": 699, "sports": 701,
    "singleplayer": 4182, "multiplayer": 3859, "coop": 1685,
}


def _filters(value: Dict[str, Any] | None = None) -> Dict[str, Any]:
    raw = value if isinstance(value, dict) else {}
    return {
        "priceEnabled": bool(raw.get("priceEnabled", False)),
        "priceDirection": "max" if str(raw.get("priceDirection") or "").lower() == "max" else "min",
        "priceCents": max(100, min(100000, int(raw.get("priceCents") or 6000))),
        "qualityMode": bool(raw.get("qualityMode", False)),
        "genre": str(raw.get("genre") or "").lower() if str(raw.get("genre") or "").lower() in _TAG_IDS else "",
        "players": str(raw.get("players") or "").lower() if str(raw.get("players") or "").lower() in ("singleplayer", "multiplayer", "coop") else "",
        "deck": str(raw.get("deck") or "").lower() if str(raw.get("deck") or "").lower() in ("playable", "verified") else "",
        "minRating": max(0, min(100, int(raw.get("minRating") or 0))),
        "minReviews": max(0, int(raw.get("minReviews") or 0)),
        "releaseFrom": max(0, int(raw.get("releaseFrom") or 0)),
        "releaseTo": max(0, int(raw.get("releaseTo") or 0)),
    }


def _search_key(value: Dict[str, Any]) -> str:
    return json.dumps({
        "genre": value.get("genre"),
        "players": value.get("players"),
        "deck": value.get("deck"),
        # Review-filtered catalogs deliberately use Reviews_DESC pages. Keep
        # them separate from ordinary Random/price caches.
        "reviewFiltered": bool(value.get("qualityMode") or value.get("minRating") or value.get("minReviews")),
    }, sort_keys=True)


def _usable(app: Any) -> Tuple[int, str] | None:
    try:
        appid = int(app.get("appid") or 0)
        name = str(app.get("name") or "").strip()
        if appid <= 0 or not name or name.lower().startswith(("dedicated server", "steamworks common")):
            return None
        return appid, name
    except (TypeError, ValueError):
        return None


def _search_page(start: int, count: int = 100, sort_by: str = "_ASC",
                 filters: Dict[str, Any] | None = None) -> Tuple[List[Tuple[int, str, int]], int]:
    selected = _filters(filters)
    params: Dict[str, Any] = {
        "query": "", "start": max(0, int(start)), "count": max(1, int(count)),
        "sort_by": sort_by, "category1": "998", "infinite": "1",
        "ignore_preferences": "1", "ndl": "1", "cc": "US", "l": "english",
    }
    tags = [_TAG_IDS[value] for value in (selected["genre"], selected["players"]) if value]
    if tags:
        params["tags"] = ",".join(str(tag) for tag in tags)
    if selected["deck"] == "verified":
        params["deck_compatibility"] = "verified"
    elif selected["deck"] == "playable":
        params["deck_compatibility"] = "verified,playable"
    payload: Dict[str, Any] | None = None
    last_error = "Steam Store returned an invalid response"
    for attempt in range(3):
        try:
            response = get_http_client().get(_SEARCH_URL, params=params, timeout=30.0)
            response.raise_for_status()
            if not str(getattr(response, "text", "") or "").strip():
                raise ValueError("Steam Store returned an empty response")
            decoded = response.json()
            if not isinstance(decoded, dict):
                raise ValueError("Steam Store returned an unexpected response")
            payload = decoded
            break
        except Exception as exc:
            last_error = str(exc) or last_error
            if attempt < 2:
                time.sleep(0.35 * (attempt + 1))
    if payload is None:
        raise RuntimeError(f"Steam Store search is temporarily unavailable: {last_error}")
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


def _catalog(min_price_cents: int = 0, max_price_cents: int = 0,
             filters: Dict[str, Any] | None = None) -> List[Tuple[int, str, int]]:
    global _MEMORY, _TOTAL_RESULTS
    selected = _filters(filters)
    search_key = _search_key(selected)
    cache_key = f"{min_price_cents}:{max_price_cents}:{search_key}"
    cached = _MEMORY.get(cache_key)
    if cached and time.time() - cached[0] < _CACHE_SECONDS:
        return cached[1]

    # Steam retired the unauthenticated ISteamApps/GetAppList endpoint. Its
    # replacement requires an API key, whereas the Store's own paginated
    # search feed remains public. Read a random page from the Games category.
    if not _TOTAL_RESULTS.get(search_key):
        _, _TOTAL_RESULTS[search_key] = _search_page(0, 1, "_ASC", selected)
    pool: List[Tuple[int, str, int]] = []
    expensive = min_price_cents > 0
    review_filtered = bool(selected["qualityMode"] or selected["minRating"] or selected["minReviews"])
    if review_filtered:
        # Random Store pages are overwhelmingly populated by little-reviewed
        # releases, so post-validating a small random batch frequently produces
        # no winner. Draw from a broad slice of Steam's review-sorted catalog;
        # the exact count/rating thresholds are still verified below against
        # the live review-summary API.
        page_count = max(1, (_TOTAL_RESULTS[search_key] + 99) // 100)
        review_page_count = min(20, page_count)
        sample_count = min(8, review_page_count)
        for page_number in random.sample(range(review_page_count), sample_count):
            page, reported_total = _search_page(page_number * 100, 100, "Reviews_DESC", selected)
            _TOTAL_RESULTS[search_key] = max(_TOTAL_RESULTS[search_key], reported_total)
            pool.extend(page)
    elif expensive:
        # Price_DESC is useful for finding the minimum-price boundary, but
        # always reading it from page zero heavily biases every tier toward the
        # Store's highest ($199.99 and above) listings. Binary-search the last
        # page that still contains an eligible price, then sample uniformly
        # across the whole eligible page range.
        page_count = max(1, (_TOTAL_RESULTS[search_key] + 99) // 100)
        pages: Dict[int, List[Tuple[int, str, int]]] = {}

        def priced_page(page_number: int) -> List[Tuple[int, str, int]]:
            global _TOTAL_RESULTS
            if page_number not in pages:
                page, reported_total = _search_page(page_number * 100, 100, "Price_DESC", selected)
                _TOTAL_RESULTS[search_key] = max(_TOTAL_RESULTS[search_key], reported_total)
                pages[page_number] = page
            return pages[page_number]

        low, high, last_eligible_page = 0, page_count - 1, -1
        while low <= high:
            middle = (low + high) // 2
            page = priced_page(middle)
            if any(price >= min_price_cents for _, _, price in page):
                last_eligible_page = middle
                low = middle + 1
            else:
                high = middle - 1

        if last_eligible_page >= 0:
            sample_count = min(6, last_eligible_page + 1)
            chosen_pages = random.sample(range(last_eligible_page + 1), sample_count)
            for page_number in chosen_pages:
                pool.extend(priced_page(page_number))
    else:
        for _ in range(4):
            upper = max(0, _TOTAL_RESULTS[search_key] - 100)
            start = random.randint(0, upper) if upper else 0
            page, reported_total = _search_page(start, 100, "_ASC", selected)
            _TOTAL_RESULTS[search_key] = max(_TOTAL_RESULTS[search_key], reported_total)
            pool.extend(page)
            if len({appid for appid, _, _ in pool}) >= 80:
                break
    deduplicated: Dict[int, Tuple[str, int]] = {}
    for appid, name, price_cents in pool:
        if price_cents >= max(1, min_price_cents) and (not max_price_cents or price_cents <= max_price_cents):
            deduplicated[appid] = (name, price_cents)
    result = [(appid, name, price) for appid, (name, price) in deduplicated.items()]
    _MEMORY[cache_key] = (time.time(), result)
    return result


def _review_summary(appid: int) -> Tuple[int, int] | None:
    try:
        response = get_http_client().get(
            _REVIEWS_URL.format(appid=appid),
            params={"json": "1", "language": "all", "purchase_type": "all", "filter": "summary", "num_per_page": "1"},
            timeout=15.0,
        )
        response.raise_for_status()
        summary = response.json().get("query_summary") or {}
        total = int(summary.get("total_reviews") or 0)
        positive = int(summary.get("total_positive") or 0)
        return total, (positive * 100) // total if total else 0
    except Exception:
        return None


def _deck_category(appid: int) -> int:
    try:
        response = get_http_client().get(_DECK_URL, params={"nAppID": str(appid)}, timeout=15.0)
        response.raise_for_status()
        payload = response.json()
        result = payload.get("results") if isinstance(payload, dict) else {}
        return int((result or {}).get("resolved_category") or 0)
    except Exception:
        return 0


def _store_game(appid: int, min_price_cents: int, max_price_cents: int = 0,
                filters: Dict[str, Any] | None = None) -> Dict[str, Any] | None:
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
        try:
            actual_price_cents = int(price.get("final") or 0)
        except (TypeError, ValueError):
            return None
        # Search-row prices can refer to stale package/bundle data. The app
        # details price is authoritative for both eligibility and display.
        if actual_price_cents < max(1, int(min_price_cents or 0)):
            return None
        if max_price_cents and actual_price_cents > int(max_price_cents):
            return None
        selected = _filters(filters)
        # Quality mode owns the two overlapping review constraints. Preserve
        # the manual values in settings for later, but ignore them until the
        # preset is turned off so the result cannot be ambiguous.
        effective_min_reviews = 300 if selected["qualityMode"] else selected["minReviews"]
        effective_min_rating = 60 if selected["qualityMode"] else selected["minRating"]
        release_match = re.search(r"\b(19|20)\d{2}\b", str((data.get("release_date") or {}).get("date") or ""))
        release_year = int(release_match.group(0)) if release_match else 0
        if selected["releaseFrom"] and (not release_year or release_year < selected["releaseFrom"]):
            return None
        if selected["releaseTo"] and (not release_year or release_year > selected["releaseTo"]):
            return None
        if effective_min_reviews:
            recommendations = int((data.get("recommendations") or {}).get("total") or 0)
            if recommendations < effective_min_reviews:
                return None
        if effective_min_rating or effective_min_reviews:
            reviews = _review_summary(appid)
            if not reviews or reviews[0] < effective_min_reviews or reviews[1] < effective_min_rating:
                return None
        if selected["deck"]:
            deck_category = _deck_category(appid)
            if selected["deck"] == "verified" and deck_category != 3:
                return None
            if selected["deck"] == "playable" and deck_category not in (2, 3):
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
            "priceCents": actual_price_cents,
            "currency": str(price.get("currency") or "USD"),
        }
    except Exception:
        return None


def roll(excluded_appids: List[int] | None = None, count: int = 36, min_price_cents: int = 0,
         filters: Dict[str, Any] | None = None) -> Dict[str, Any]:
    excluded: Set[int] = {int(value) for value in (excluded_appids or []) if int(value) > 0}
    min_price_cents = max(0, int(min_price_cents or 0))
    selected = _filters(filters)
    # New slider settings supersede the legacy minimum-price argument. Keeping
    # the argument supported lets older frontends continue to work.
    max_price_cents = 0
    if selected["priceEnabled"]:
        if selected["priceDirection"] == "max":
            min_price_cents = 0
            max_price_cents = selected["priceCents"]
        else:
            min_price_cents = selected["priceCents"]
    catalog = [(appid, name, price) for appid, name, price in _catalog(min_price_cents, max_price_cents, selected) if appid not in excluded]
    if not catalog:
        return {"success": False, "error": "No paid Steam games matched the selected price and filters; try broadening them"}

    # Validate the prize against Store appdetails so the reel cannot land on a
    # tool, DLC, soundtrack, demo, or removed catalog entry.
    filters_active = bool(
        selected["priceEnabled"] or selected["qualityMode"] or selected["genre"]
        or selected["players"] or selected["deck"] or selected["minRating"]
        or selected["minReviews"] or selected["releaseFrom"] or selected["releaseTo"]
    )
    candidates = random.sample(catalog, min(72 if filters_active else 48, len(catalog)))
    winner = None
    for appid, _, _ in candidates:
        winner = _store_game(appid, min_price_cents, max_price_cents, selected)
        if winner:
            break
    if not winner:
        return {"success": False, "error": "Could not find a live Steam game matching every selected filter; try broadening them"}

    count = max(28, min(int(count), 42))
    # Only the winning card must satisfy the selected price floor. Fill the
    # surrounding reel from the normal paid catalog so very rare tiers (such
    # as $1000+) still produce a full, varied animation.
    filler_pool = [item for item in _catalog(0, 0, {}) if item[0] not in excluded and item[0] != winner["appid"]]
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
