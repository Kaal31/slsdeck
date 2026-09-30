"""Read the public lua.tools collection catalogue and collection game lists."""

from __future__ import annotations

import re
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

BASE_URL = "https://lua.tools"
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
_COLLECTION_PATH = re.compile(r"^/c/([a-zA-Z0-9][a-zA-Z0-9-]{2,160})/?$")


class _AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.current: Optional[Dict[str, Any]] = None
        self.collections: List[Dict[str, Any]] = []
        self.games: List[Dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        href = values.get("href", "")
        path = urlparse(href).path
        collection = _COLLECTION_PATH.match(path)
        game = re.match(r"^/appid/(\d+)/?$", path)
        if tag == "a" and self.current is None and (collection or game):
            self.current = {
                "kind": "collection" if collection else "game",
                "slug": collection.group(1) if collection else "",
                "appid": int(game.group(1)) if game else 0,
                "url": urljoin(BASE_URL, href),
                "image": "",
                "text": [],
            }
            self.depth = 1
        elif self.current is not None:
            if tag == "img" and not self.current["image"]:
                self.current["image"] = urljoin(BASE_URL, values.get("src", ""))
            if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
                self.depth += 1

    def handle_data(self, data: str) -> None:
        if self.current is not None and data.strip():
            self.current["text"].append(data.strip())

    def handle_endtag(self, tag: str) -> None:
        if self.current is None:
            return
        self.depth -= 1
        if self.depth > 0:
            return
        item = self.current
        self.current = None
        text = [part for part in item.pop("text") if part]
        # The first visible string in both public card types is the title.
        title = next((part for part in text if not part.replace(",", "").isdigit()), "")
        item["name"] = title if title else (
            f"AppID {item['appid']}" if item["kind"] == "game" else item["slug"].replace("-", " ").title()
        )
        if item.pop("kind") == "collection":
            item.pop("appid", None)
            if item["slug"] not in {entry["slug"] for entry in self.collections}:
                self.collections.append(item)
        elif item["appid"] not in {entry["appid"] for entry in self.games}:
            item.pop("slug", None)
            self.games.append(item)


def parse_collections_html(html: str, limit: int = 20) -> List[Dict[str, Any]]:
    parser = _AnchorParser()
    parser.feed(html or "")
    return parser.collections[:max(1, min(int(limit), 50))]


def parse_collection_html(html: str) -> List[Dict[str, Any]]:
    parser = _AnchorParser()
    parser.feed(html or "")
    return parser.games


def list_collections(sort: str = "popular", limit: int = 20) -> Dict[str, Any]:
    from .httpc import ensure_http_client
    sort = sort if sort in {"popular", "top", "new", "updated"} else "popular"
    try:
        response = ensure_http_client("lua.tools collections").get(
            f"{BASE_URL}/collections", params={"sort": sort},
            headers={"User-Agent": BROWSER_UA}, follow_redirects=True,
        )
        response.raise_for_status()
        return {"success": True, "collections": parse_collections_html(response.text, limit)}
    except Exception as exc:
        return {"success": False, "collections": [], "error": str(exc)}


def get_collection(value: str) -> Dict[str, Any]:
    from .httpc import ensure_http_client
    path = urlparse(str(value or "").strip()).path
    if not path.startswith("/c/"):
        path = "/c/" + path.strip("/")
    match = _COLLECTION_PATH.match(path)
    if not match:
        return {"success": False, "error": "Invalid lua.tools collection"}
    slug = match.group(1)
    try:
        response = ensure_http_client("lua.tools collection").get(
            f"{BASE_URL}/c/{slug}", headers={"User-Agent": BROWSER_UA}, follow_redirects=True,
        )
        response.raise_for_status()
        games = parse_collection_html(response.text)
        if not games:
            return {"success": False, "error": "This collection contains no games"}
        return {"success": True, "slug": slug, "url": f"{BASE_URL}/c/{slug}", "games": games}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
