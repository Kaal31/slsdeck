"""Ryuu fixes catalogue — appid-indexed Crack/Online/Denuvo fixes.

The moon Linux port resolves fixes from https://generator.ryuu.lol/fixes, an
HTML page that embeds every fix as data-appid/data-filename attributes. There is
no JSON API, so a scraper (defaults/ryuu/ryuu_refresh.sh) turns it into an
appid -> [{file,badge}] map. We ship a bundled snapshot and refresh a user-local
cache in the background (detached, <= every 6h) so new fixes appear without a
release. Unlike the moon port we KEEP hypervisor-badged fixes (routed into the
Denuvo toggle). Download URL: generator.ryuu.lol/fixes/<url-encoded file>.
"""

from __future__ import annotations

import json
import os
import subprocess
import threading
import time
import urllib.parse
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import defaults_path, runtime_path

RYUU_SOURCE = "https://generator.ryuu.lol/fixes"
RYUU_BASE = "https://generator.ryuu.lol/fixes/"
REFRESH_TTL = 6 * 60 * 60

_lock = threading.Lock()
_cache_index: Optional[Dict[str, Any]] = None
_cache_ts = 0.0

# Refresh-spawn throttle. The spawn used to be gated purely on the cache file's
# mtime, so when the cache could never be written (no network, read-only runtime
# dir, scraper failing) _mtime() stayed 0 and every _load() past the 5-minute
# memo launched another detached bash. Worse, the memo check and the memo write
# sat in separate lock scopes, so a burst of concurrent RPC calls all fell
# through together and each spawned one. These track the last attempt and the
# live child so at most one refresh runs at a time, backing off when it keeps
# failing to produce a cache.
_last_spawn = 0.0
_spawn_backoff = 0.0
_refresh_proc = None
_SPAWN_MIN_INTERVAL = 5 * 60.0        # never more than once every 5 minutes
_SPAWN_MAX_BACKOFF = 6 * 60 * 60.0    # give a persistently broken refresh a rest


def _bundled_path() -> str:
    return defaults_path(os.path.join("ryuu", "ryuu_index.json"))


def _refresh_script() -> str:
    return defaults_path(os.path.join("ryuu", "ryuu_refresh.sh"))


def _cache_path() -> str:
    return runtime_path("ryuu_index.json")


def _read_json(path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            d = json.load(fh)
        return d if isinstance(d, dict) and isinstance(d.get("fixes"), dict) else None
    except Exception:
        return None


def _mtime(path: str) -> float:
    try:
        return os.path.getmtime(path)
    except Exception:
        return 0.0


def _spawn_refresh() -> None:
    """Detached background refresh of the user cache. Best-effort, never blocks,
    and never stacks up: one child at a time, rate-limited, with backoff."""
    global _last_spawn, _spawn_backoff, _refresh_proc
    script = _refresh_script()
    cache = _cache_path()
    if not os.path.isfile(script):
        return
    now = time.time()
    with _lock:
        # Reap the previous child if it has exited; if it is still running,
        # there is nothing to gain from starting a second one.
        proc = _refresh_proc
        if proc is not None:
            if proc.poll() is None:
                return
            _refresh_proc = None
            # It finished. If it still produced no cache, lengthen the backoff.
            if _mtime(cache) == 0:
                _spawn_backoff = min(
                    _SPAWN_MAX_BACKOFF,
                    (_spawn_backoff * 2) if _spawn_backoff else _SPAWN_MIN_INTERVAL)
            else:
                _spawn_backoff = 0.0
        if (now - _last_spawn) < max(_SPAWN_MIN_INTERVAL, _spawn_backoff):
            return
        _last_spawn = now
    try:
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        proc = subprocess.Popen(
            ["bash", script, cache, RYUU_SOURCE],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        with _lock:
            _refresh_proc = proc
    except Exception as exc:
        logger.warn(f"SLSDeck ryuu: refresh spawn failed: {exc}")


def _load() -> Dict[str, Any]:
    global _cache_index, _cache_ts
    with _lock:
        if _cache_index is not None and (time.time() - _cache_ts) < 300:
            return _cache_index
    cache = _cache_path()
    bundled = _bundled_path()
    idx = _read_json(cache) or _read_json(bundled) or {"fixes": {}}
    # Refresh in the background when the cache is missing or stale.
    age = time.time() - _mtime(cache)
    if _mtime(cache) == 0 or age > REFRESH_TTL:
        _spawn_refresh()
    with _lock:
        _cache_index = idx
        _cache_ts = time.time()
    return idx


def _url_for(filename: str) -> str:
    return RYUU_BASE + urllib.parse.quote(filename, safe="")


def entries(appid: int) -> List[Dict[str, str]]:
    """All ryuu entries for an appid, each {file, badge, url}."""
    idx = _load()
    raw = idx.get("fixes", {}).get(str(appid)) or []
    out = []
    for e in raw:
        if isinstance(e, dict) and e.get("file"):
            # HV build: keep hypervisor-badged fixes — the Denuvo toggle routes
            # them through the anti-Denuvo hypervisor + custom Proton.
            out.append({
                "file": e["file"], "badge": (e.get("badge") or ""),
                "url": _url_for(e["file"]),
                "description": str(e.get("description") or e.get("desc") or e.get("notes") or ""),
            })
    return out


def _pick(cands: List[Dict[str, str]], prefer: List[str]) -> Optional[Dict[str, str]]:
    for p in prefer:
        for e in cands:
            if e["badge"].lower() == p:
                return e
    return cands[0] if cands else None


def resolve(appid: int) -> Dict[str, Any]:
    """Categorise this appid's ryuu fixes into generic / online / hypervisor."""
    es = entries(appid)
    hyper = [e for e in es if e["badge"].lower() == "hypervisor"]
    online = [e for e in es if e["badge"].lower() == "online"]
    generic_cands = [e for e in es if e["badge"].lower() not in ("hypervisor", "online")]
    generic = _pick(generic_cands, ["bypass", "tested", ""])
    return {
        "generic": generic,                       # DRM crack / bypass (best pick)
        "online": _pick(online, ["tested", ""]),  # ryuu online entry
        "hypervisor": _pick(hyper, ["tested", ""]),
        "all": es,
        "count": len(es),
    }


def init() -> None:
    """Warm the index at startup (and kick a refresh if stale)."""
    _load()
