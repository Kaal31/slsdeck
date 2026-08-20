"""Management of the SLSDeck API manifest (free manifest-source list).

Sources may embed API-key placeholders in their URLs (e.g. ``<moapikey>``).
Any placeholder whose name contains "key" is treated as a user-supplied key so
the frontend can render one input per source and save several keys at once.
"""

from __future__ import annotations

import json
import os
import re
import shutil
from typing import Any, Dict, List, Tuple

from .config import (
    API_JSON_FILE,
    API_MANIFEST_PROXY_URL,
    API_MANIFEST_URL,
    HTTP_PROXY_TIMEOUT_SECONDS,
)
from .httpc import ensure_http_client
from .logger import logger
from .paths import defaults_path, runtime_path
from .settings import get_api_key_for, get_api_keys, get_morrenus_api_key
from .utils import count_apis, normalize_manifest_text, read_text, write_text

_INIT_DONE = False

# Any manifest placeholder whose name contains "key" is a user-supplied API key.
_KEY_PLACEHOLDER_RE = re.compile(r"<[a-zA-Z0-9_]*key[a-zA-Z0-9_]*>", re.IGNORECASE)
_PLACEHOLDER_LABELS = {
    "<moapikey>": "Hubcap / Morrenus API key",
}


def _placeholders_in(template: str) -> List[str]:
    return _KEY_PLACEHOLDER_RE.findall(template or "")


def get_required_key_fields() -> Dict[str, Any]:
    """Distinct API-key fields required by the enabled sources (one per key)."""
    try:
        apis = load_api_manifest()
        keys = get_api_keys()
        fields: Dict[str, Dict[str, Any]] = {}
        for api in apis:
            name = api.get("name", "Unknown")
            for placeholder in _placeholders_in(api.get("url", "")):
                entry = fields.setdefault(placeholder, {
                    "placeholder": placeholder,
                    "label": _PLACEHOLDER_LABELS.get(
                        placeholder,
                        placeholder.strip("<>").replace("_", " ").title(),
                    ),
                    "sources": [],
                    "hasKey": bool(keys.get(placeholder)),
                    "value": keys.get(placeholder, ""),
                })
                if name not in entry["sources"]:
                    entry["sources"].append(name)
        return {"success": True, "fields": list(fields.values())}
    except Exception as exc:
        return {"success": False, "error": str(exc), "fields": []}


def substitute_keys(template: str) -> Tuple[str, List[str]]:
    """Fill every key placeholder; return (url, missing_placeholders)."""
    missing: List[str] = []
    url = template or ""
    for placeholder in _placeholders_in(url):
        value = get_api_key_for(placeholder)
        if not value:
            missing.append(placeholder)
            continue
        url = url.replace(placeholder, value)
    return url, missing


def _api_json_path() -> str:
    return runtime_path(API_JSON_FILE)


def _seed_from_defaults() -> None:
    """Copy the bundled default api.json into the runtime dir if missing."""
    dest = _api_json_path()
    if os.path.exists(dest):
        return
    src = defaults_path(API_JSON_FILE)
    try:
        if os.path.exists(src):
            shutil.copy(src, dest)
            logger.log("SLSDeck: Seeded api.json from bundled defaults")
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to seed api.json: {exc}")


import threading

_APIS_LOCK = threading.Lock()


def init_apis() -> Dict[str, Any]:
    """Ensure an api.json exists; fetch the free list if we have none."""
    global _INIT_DONE
    with _APIS_LOCK:
        if _INIT_DONE:
            return {"success": True, "message": ""}

        _seed_from_defaults()
        path = _api_json_path()
        message = ""

        if not os.path.exists(path):
            manifest_text = _fetch_manifest_text()
            normalized = normalize_manifest_text(manifest_text) if manifest_text else ""
            if normalized:
                write_text(path, normalized)
                message = f"Loaded {count_apis(normalized)} free manifest sources"
            else:
                message = "No manifest sources configured and failed to fetch free ones"

        _INIT_DONE = True
        return {"success": True, "message": message}


def _fetch_manifest_text() -> str:
    client = ensure_http_client("SLSDeck: fetch manifest")
    try:
        resp = client.get(API_MANIFEST_URL, follow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except Exception as primary_err:
        logger.warn(f"SLSDeck: Primary manifest URL failed ({primary_err}), trying proxy")
        try:
            resp = client.get(
                API_MANIFEST_PROXY_URL,
                follow_redirects=True,
                timeout=HTTP_PROXY_TIMEOUT_SECONDS,
            )
            resp.raise_for_status()
            return resp.text
        except Exception as proxy_err:
            logger.warn(f"SLSDeck: Proxy manifest URL also failed: {proxy_err}")
            return ""


def fetch_free_apis_now() -> Dict[str, Any]:
    """Force a refresh of the free manifest source list."""
    manifest_text = _fetch_manifest_text()
    normalized = normalize_manifest_text(manifest_text) if manifest_text else ""
    if not normalized:
        return {"success": False, "error": "Failed to fetch manifest sources"}
    write_text(_api_json_path(), normalized)
    return {"success": True, "count": count_apis(normalized)}


_MIRROR_HEALTH: Dict[str, Dict[str, Any]] = {}
_HEALTH_LOCK = threading.Lock()


def record_api_success(name: str, latency_ms: float) -> None:
    with _HEALTH_LOCK:
        entry = _MIRROR_HEALTH.setdefault(name, {"success": 0, "fail": 0, "latency": 500.0})
        entry["success"] += 1
        entry["latency"] = 0.7 * entry["latency"] + 0.3 * max(10.0, latency_ms)


def record_api_failure(name: str) -> None:
    with _HEALTH_LOCK:
        entry = _MIRROR_HEALTH.setdefault(name, {"success": 0, "fail": 0, "latency": 1500.0})
        entry["fail"] += 1


def load_api_manifest() -> List[Dict[str, Any]]:
    """Return the enabled APIs from api.json, ranked by health & latency."""
    _seed_from_defaults()
    path = _api_json_path()
    text = read_text(path)
    normalized = normalize_manifest_text(text)
    if normalized and normalized != text:
        try:
            write_text(path, normalized)
        except Exception:
            pass
        text = normalized
    try:
        data = json.loads(text or "{}")
        apis = [api for api in data.get("api_list", []) if api.get("enabled", False)]
        with _HEALTH_LOCK:
            def _rank(a):
                nm = a.get("name", "")
                h = _MIRROR_HEALTH.get(nm, {"success": 0, "fail": 0, "latency": 500.0})
                fail_penalty = h["fail"] * 1000
                return h["latency"] + fail_penalty
            apis.sort(key=_rank)
        return apis
    except Exception as exc:
        logger.error(f"SLSDeck: Failed to parse api.json: {exc}")
        return []


def get_api_list() -> Dict[str, Any]:
    """Return the enabled sources, each addressed by NAME.

    This used to hand back a positional ``index`` into the list returned by
    load_api_manifest(). That list is re-sorted by live health on every call, so
    an index captured by the UI could point at a different source seconds later;
    and because key-missing sources were skipped *after* enumerate(), the indices
    had gaps and did not line up with the list the user was shown. Nothing can
    address a source safely by position, so position is no longer offered.

    Sources whose required keys are missing are now reported rather than hidden.
    Silently dropping them meant a user who had not entered an API key saw a
    shorter list with no hint that the source existed or why it was absent."""
    try:
        apis = load_api_manifest()
        out = []
        usable = []
        for api in apis:
            name = api.get("name", "Unknown")
            _, missing = substitute_keys(api.get("url", ""))
            entry = {
                "name": name,
                "usable": not missing,
                "missingKeys": sorted(missing) if missing else [],
            }
            with _HEALTH_LOCK:
                h = _MIRROR_HEALTH.get(name)
                if h:
                    entry["success"] = h.get("success", 0)
                    entry["fail"] = h.get("fail", 0)
                    entry["latencyMs"] = round(h.get("latency", 0.0))
            out.append(entry)
            if not missing:
                usable.append(entry)
        # `apis` stays the usable-only list so existing callers keep their
        # meaning; `all` exposes the gated ones alongside the reason.
        return {"success": True, "apis": usable, "all": out,
                "gated": [e["name"] for e in out if not e["usable"]]}
    except Exception as exc:
        return {"success": False, "error": str(exc), "apis": [], "all": [], "gated": []}
