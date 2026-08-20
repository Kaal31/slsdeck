"""Shared HTTP client management for the SLSDeck Decky backend.

The client also centralises credential transport for manifest services. Callers
can keep using their existing source URLs while secrets are moved into request
headers immediately before transport:

* Hubcap's legacy ``?api_key=...`` form is converted to ``Authorization: Bearer``.
* Ryuu manifest downloads use the existing Ryuu API key as ``X-Auth-Key``.

This keeps credentials out of URLs/logs and avoids maintaining a separate Ryuu
browser-session credential for manifest downloads.
"""

from __future__ import annotations

import threading
from typing import Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx  # type: ignore

from .config import HTTP_TIMEOUT_SECONDS
from .logger import logger

_HTTP_CLIENT: Optional[httpx.Client] = None
_CLIENT_LOCK = threading.Lock()


def _auth_request(url, headers):
    """Return ``(url, headers)`` with service credentials moved into headers.

    This is deliberately best-effort: an unavailable settings store must never
    break unrelated HTTP traffic, and unauthenticated requests still get their
    normal service response/fallback behaviour.
    """
    raw = str(url)
    out_headers = dict(headers or {})
    try:
        parts = urlsplit(raw)
        host = (parts.hostname or "").lower()

        # Hubcap historically accepted an API key in the query string. Remove it
        # before httpx logs/sends the URL and use the service's Bearer form.
        if host == "hubcapmanifest.com":
            pairs = parse_qsl(parts.query, keep_blank_values=True)
            key = ""
            clean = []
            for k, v in pairs:
                if k.lower() == "api_key" and v:
                    key = v
                else:
                    clean.append((k, v))
            if key:
                out_headers.setdefault("Authorization", f"Bearer {key}")
                raw = urlunsplit((parts.scheme, parts.netloc, parts.path,
                                  urlencode(clean), parts.fragment))

        # Ryuu's documented manifest API accepts the same API key used by gated
        # fixes via X-Auth-Key. Support the current /api/download/<appid> route
        # and the older /download route while existing runtime source lists age
        # out, so users do not need a separate captured browser session.
        if host == "generator.ryuu.lol" and (
            parts.path.startswith("/api/download/") or parts.path == "/download"
        ):
            try:
                from .settings import get_ryuu_key
                key = str(get_ryuu_key() or "").strip()
            except Exception:
                key = ""
            if key:
                out_headers.setdefault("X-Auth-Key", key)
    except Exception as exc:
        logger.warn(f"SLSDeck: auth transport preparation failed: {exc}")
    return raw, out_headers


class _SLSDeckClient(httpx.Client):
    """httpx client that applies service auth immediately before transport."""

    def request(self, method, url, *, content=None, data=None, files=None,
                json=None, params=None, headers=None, cookies=None, auth=None,
                follow_redirects=None, timeout=httpx.USE_CLIENT_DEFAULT,
                extensions=None):
        clean_url, clean_headers = _auth_request(url, headers)
        return super().request(
            method, clean_url, content=content, data=data, files=files, json=json,
            params=params, headers=clean_headers, cookies=cookies, auth=auth,
            follow_redirects=follow_redirects, timeout=timeout,
            extensions=extensions,
        )


def ensure_http_client(context: str = "") -> httpx.Client:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        with _CLIENT_LOCK:
            if _HTTP_CLIENT is None:
                prefix = f"{context}: " if context else ""
                logger.log(f"{prefix}Initializing shared HTTPX client with connection pooling...")
                limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0)
                _HTTP_CLIENT = _SLSDeckClient(timeout=HTTP_TIMEOUT_SECONDS, limits=limits)
    return _HTTP_CLIENT


def get_http_client() -> httpx.Client:
    return ensure_http_client()


def close_http_client(context: str = "") -> None:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        return
    with _CLIENT_LOCK:
        if _HTTP_CLIENT is None:
            return
        try:
            _HTTP_CLIENT.close()
        except Exception:
            pass
        finally:
            _HTTP_CLIENT = None
