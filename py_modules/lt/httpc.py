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
import socket
from typing import Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx  # type: ignore

from .config import HTTP_TIMEOUT_SECONDS
from .logger import logger

_HTTP_CLIENT: Optional[httpx.Client] = None
_CLIENT_LOCK = threading.Lock()
# Some large-file paths explicitly pass timeout=None so a healthy transfer can
# run as long as it needs. Do not let that become an infinite hang when a crack
# host/CDN stops sending bytes: keep connect/pool bounded and allow at most two
# minutes of read inactivity between chunks.
_STREAM_TIMEOUT = httpx.Timeout(connect=20.0, read=120.0, write=120.0, pool=20.0)
_HUBCAP_HOST = "hubcapmanifest.com"
_HUBCAP_DOH_ENDPOINTS = (
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/resolve",
)


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

    @staticmethod
    def _hubcap_blocked(response) -> bool:
        content_type = str(response.headers.get("content-type") or "").lower()
        return response.status_code == 451 or (
            response.status_code == 200 and "text/html" in content_type
        )

    @staticmethod
    def _resolve_hubcap_doh() -> list[str]:
        """Resolve Hubcap outside the system DNS path; never sends credentials."""
        for endpoint in _HUBCAP_DOH_ENDPOINTS:
            try:
                with httpx.Client(timeout=6.0, follow_redirects=True) as resolver:
                    response = resolver.get(
                        endpoint,
                        params={"name": _HUBCAP_HOST, "type": "A"},
                        headers={"Accept": "application/dns-json", "User-Agent": "SLSDeck/isp-bypass"},
                    )
                    response.raise_for_status()
                    answers = response.json().get("Answer") or []
                    values = [str(item.get("data") or "") for item in answers
                              if int(item.get("type") or 0) == 1]
                    ips = [value for value in values
                           if value and all(part.isdigit() for part in value.split("."))]
                    if ips:
                        return ips
            except Exception as exc:
                logger.warn(f"SLSDeck Hubcap bypass: DoH resolver failed: {exc}")
        return []

    @staticmethod
    def _local_tor_proxy() -> str:
        """Use an existing local Tor listener; never install or launch Tor."""
        for port, scheme in ((9080, "http"), (9050, "socks5")):
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.25):
                    return f"{scheme}://127.0.0.1:{port}"
            except OSError:
                continue
        return ""

    def request(self, method, url, *, content=None, data=None, files=None,
                json=None, params=None, headers=None, cookies=None, auth=None,
                follow_redirects=None, timeout=httpx.USE_CLIENT_DEFAULT,
                extensions=None):
        clean_url, clean_headers = _auth_request(url, headers)
        # ``timeout=None`` disables *every* timeout in httpx. Several crack/file
        # downloaders used it intentionally for large archives, but a dead host
        # then left the Fixes menu stuck on "Downloading fix" forever. A read
        # inactivity timeout preserves unlimited total transfer duration while
        # still failing a connection that has stopped delivering data.
        if timeout is None:
            timeout = _STREAM_TIMEOUT
        request_kwargs = dict(
            content=content, data=data, files=files, json=json, params=params,
            headers=clean_headers, cookies=cookies, auth=auth,
            follow_redirects=follow_redirects, timeout=timeout,
            extensions=extensions,
        )
        is_hubcap = (urlsplit(clean_url).hostname or "").lower() == _HUBCAP_HOST
        direct_error = None
        try:
            response = super().request(method, clean_url, **request_kwargs)
            if not is_hubcap or not self._hubcap_blocked(response):
                return response
            direct_error = f"HTTP {response.status_code} {response.headers.get('content-type', '')}"
        except httpx.TransportError as exc:
            if not is_hubcap:
                raise
            direct_error = str(exc)

        logger.warn(f"SLSDeck Hubcap bypass: direct route failed ({direct_error}); trying DoH")
        parts = urlsplit(clean_url)
        for ip in self._resolve_hubcap_doh():
            try:
                netloc = ip if parts.port is None else f"{ip}:{parts.port}"
                ip_url = urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
                doh_headers = dict(clean_headers or {})
                doh_headers["Host"] = _HUBCAP_HOST
                doh_extensions = dict(extensions or {})
                # httpcore uses this for TLS SNI and certificate hostname checks
                # while the TCP connection itself goes to the DoH-resolved IP.
                doh_extensions["sni_hostname"] = _HUBCAP_HOST.encode("ascii")
                response = super().request(
                    method, ip_url, **{**request_kwargs, "headers": doh_headers,
                                      "extensions": doh_extensions},
                )
                if not self._hubcap_blocked(response):
                    logger.log(f"SLSDeck Hubcap bypass: connected through DoH ({ip})")
                    return response
            except httpx.TransportError as exc:
                logger.warn(f"SLSDeck Hubcap bypass: DoH route {ip} failed: {exc}")

        proxy = self._local_tor_proxy()
        if proxy:
            try:
                logger.warn("SLSDeck Hubcap bypass: trying the existing local Tor proxy")
                with httpx.Client(proxy=proxy, timeout=timeout, follow_redirects=True) as tor_client:
                    response = tor_client.request(
                        method, clean_url, content=content, data=data, files=files,
                        json=json, params=params, headers=clean_headers,
                        cookies=cookies, auth=auth,
                    )
                    if not self._hubcap_blocked(response):
                        logger.log("SLSDeck Hubcap bypass: connected through local Tor")
                        return response
            except Exception as exc:
                logger.warn(f"SLSDeck Hubcap bypass: local Tor route failed: {exc}")

        raise httpx.ConnectError(
            f"Hubcap is unreachable through direct, DoH, and available local Tor routes: {direct_error}"
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
