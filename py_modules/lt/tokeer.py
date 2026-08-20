"""Small Tokeer/luastools integration helpers.

For now this module intentionally exposes only diagnostic, read-only probes of
Tokeer's public quota routes. We do not assume a response schema until we have
observed the live service from a user's Deck.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List

from .httpc import ensure_http_client

TOKEER_BASE = "https://luastools.xyz"

# Keep this deliberately small and read-only. POST /quota sends an empty JSON
# object only; no redemption/generation endpoints or user codes are touched.
_PROBES = (
    ("GET", "/quota"),
    ("POST", "/quota"),
    ("GET", "/quota/status"),
    ("GET", "/quota/games"),
    ("GET", "/quota/inventory"),
)


def _probe_one(method: str, path: str) -> Dict[str, Any]:
    url = TOKEER_BASE + path
    try:
        client = ensure_http_client("SLSDeck: Tokeer quota probe")
        headers = {
            "User-Agent": "SLSDeck-Tokeer/1.0",
            "Accept": "application/json, text/plain;q=0.9, */*;q=0.1",
        }
        if method == "POST":
            resp = client.post(url, headers=headers, json={}, follow_redirects=True, timeout=15)
        else:
            resp = client.get(url, headers=headers, follow_redirects=True, timeout=15)
        raw = resp.text or ""
        parsed: Any = None
        parse_error = ""
        try:
            parsed = resp.json()
        except Exception as exc:
            parse_error = str(exc)
            try:
                parsed = json.loads(raw)
                parse_error = ""
            except Exception:
                pass
        return {
            "method": method,
            "path": path,
            "success": 200 <= resp.status_code < 300,
            "status": int(resp.status_code),
            "url": str(resp.url),
            "json": parsed,
            "raw": raw[:20000],
            "contentType": resp.headers.get("content-type", ""),
            "parseError": parse_error,
        }
    except Exception as exc:
        return {
            "method": method,
            "path": path,
            "success": False,
            "status": 0,
            "url": url,
            "json": None,
            "raw": "",
            "contentType": "",
            "parseError": "",
            "error": str(exc),
        }


def quota_probe() -> Dict[str, Any]:
    """Probe a small safe matrix of public quota routes and return each verbatim."""
    results: List[Dict[str, Any]] = []
    for method, path in _PROBES:
        results.append(_probe_one(method, path))
    return {
        "success": any(bool(r.get("success")) for r in results),
        "base": TOKEER_BASE,
        "results": results,
    }
