"""Small Tokeer/luastools integration helpers.

For now this module intentionally exposes only a diagnostic probe of the public
``/quota`` endpoint.  We do not assume its schema until we have observed the
live response from a user's Deck.
"""
from __future__ import annotations

import json
from typing import Any, Dict

from .httpc import ensure_http_client

TOKEER_BASE = "https://luastools.xyz"


def quota_probe() -> Dict[str, Any]:
    """GET the public Tokeer quota endpoint and return the response verbatim.

    The Cloudflare proxy for Tokeer deliberately exposes ``/quota*`` publicly,
    but the upstream client does not document the response shape.  Preserve raw
    text as well as parsed JSON so the UI can reveal what the live service
    actually returns without baking in guesses.
    """
    url = TOKEER_BASE + "/quota"
    try:
        client = ensure_http_client("SLSDeck: Tokeer quota")
        resp = client.get(
            url,
            headers={
                "User-Agent": "SLSDeck-Tokeer/1.0",
                "Accept": "application/json, text/plain;q=0.9, */*;q=0.1",
            },
            follow_redirects=True,
            timeout=15,
        )
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
            "success": False,
            "status": 0,
            "url": url,
            "json": None,
            "raw": "",
            "contentType": "",
            "parseError": "",
            "error": str(exc),
        }
