"""Public NERAI fix catalogue provider.

NERAI remains a distinct source. Download/extraction may reuse the generic
local-fix machinery, but records are never presented as CrakFiles or HVCrack.
"""
from __future__ import annotations

import json
import os
import re
import time
import unicodedata
from typing import Any, Dict, List, Optional

from .httpc import ensure_http_client
from .logger import logger
from .paths import runtime_path

CATALOG_URL = "https://nerai.qd.je/api/fixes"
_TTL = 3600
_cache: Dict[str, Any] = {"ts": 0.0, "data": None}


def _norm(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    value = value.lower().replace("&", " and ")
    for roman, digit in (("viii", "8"), ("vii", "7"), ("vi", "6"),
                         ("iv", "4"), ("iii", "3"), ("ii", "2"), ("i", "1")):
        value = re.sub(rf"\b{roman}\b", digit, value)
    value = re.sub(r"\b(?:bypass|game\s*fix|fix|by\s+xero\s+nation)\b", " ", value)
    return re.sub(r"[^a-z0-9]", "", value)


def fetch_catalog(force: bool = False) -> Dict[str, List[Dict[str, Any]]]:
    now = time.time()
    if not force and _cache["data"] is not None and now - _cache["ts"] < _TTL:
        return _cache["data"]
    disk = runtime_path("nerai_fixes_cache.json")
    data: Optional[Dict[str, List[Dict[str, Any]]]] = None
    try:
        response = ensure_http_client("nerai: catalogue").get(
            CATALOG_URL, headers={"User-Agent": "SLSDeck/nerai"}, timeout=20,
            follow_redirects=True,
        )
        payload = response.json() if response.status_code == 200 else None
        if isinstance(payload, dict):
            data = payload
    except Exception as exc:
        logger.warn(f"nerai: catalogue fetch failed: {exc}")
    if data is None and os.path.isfile(disk):
        try:
            payload = json.loads(open(disk, "r", encoding="utf-8").read())
            if isinstance(payload, dict):
                data = payload
        except Exception:
            pass
    if data is None:
        return _cache["data"] or {}
    try:
        with open(disk, "w", encoding="utf-8") as handle:
            json.dump(data, handle)
    except Exception:
        pass
    _cache.update({"ts": now, "data": data})
    return data


def _entry_name(entry: Dict[str, Any]) -> str:
    name = str(entry.get("game_name") or "")
    normalized = _norm(name)
    if not normalized or "neraivault" in normalized or "fileonmega" in normalized:
        name = str(entry.get("filename") or "")
    return re.sub(r"\.(?:zip|rar|7z)$", "", name, flags=re.I)


def _placeholder_name(entry: Dict[str, Any]) -> bool:
    normalized = _norm(str(entry.get("game_name") or ""))
    return not normalized or "neraivault" in normalized or "fileonmega" in normalized


def _matches(entry: Dict[str, Any], appid: int, names: List[str]) -> bool:
    candidate = _norm(_entry_name(entry))
    targets = {_norm(name) for name in names if _norm(name)}
    raw_appid = str(entry.get("app_id") or "").strip()
    if raw_appid.isdigit() and int(raw_appid) == appid:
        # Some imported rows carry the right AppID but only a decorative title;
        # validate their filename too so a mis-tagged archive is never offered.
        return not _placeholder_name(entry) or candidate in targets
    # Exact normalized titles only: substring matching is unsafe for large
    # families such as Assassin's Creed, GTA, and Call of Duty.
    return bool(candidate and candidate in targets)


def find_for_game(appid: int, *names: str) -> List[Dict[str, Any]]:
    useful_names = [str(name) for name in names if str(name or "").strip()]
    found: List[Dict[str, Any]] = []
    catalogue = fetch_catalog()
    for category in ("bypass", "game", "online"):
        for entry in catalogue.get(category, []) or []:
            if not isinstance(entry, dict) or not entry.get("url"):
                continue
            if _matches(entry, int(appid), useful_names):
                found.append({
                    "id": str(entry.get("id") or entry.get("app_id") or ""),
                    "category": category,
                    "name": _entry_name(entry) or (useful_names[0] if useful_names else "NERAI fix"),
                    "url": str(entry["url"]),
                    "file": str(entry.get("filename") or entry.get("file_name") or ""),
                    "size": entry.get("size_bytes") or entry.get("file_size"),
                    "updatedAt": entry.get("updated_at"),
                    "source": "nerai",
                })
    return found
