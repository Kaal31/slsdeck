"""Shared HTTP client management for the SLSDeck Decky backend."""

from __future__ import annotations

import threading
from typing import Optional

import httpx  # type: ignore

from .config import HTTP_TIMEOUT_SECONDS
from .logger import logger

_HTTP_CLIENT: Optional[httpx.Client] = None
_CLIENT_LOCK = threading.Lock()


def ensure_http_client(context: str = "") -> httpx.Client:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        with _CLIENT_LOCK:
            if _HTTP_CLIENT is None:
                prefix = f"{context}: " if context else ""
                logger.log(f"{prefix}Initializing shared HTTPX client with connection pooling...")
                limits = httpx.Limits(max_keepalive_connections=20, max_connections=50, keepalive_expiry=30.0)
                _HTTP_CLIENT = httpx.Client(timeout=HTTP_TIMEOUT_SECONDS, limits=limits)
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
