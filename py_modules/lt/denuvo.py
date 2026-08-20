"""Denuvo detection.

The authoritative per-game signal is Steam's own store API, which returns a
publisher-declared ``drm_notice`` (e.g. "Denuvo", "Denuvo Anti-tamper") for
protected titles. Ryuu's "bypass" fixes are deliberately NOT used as a Denuvo
signal — bypass/crack fixes exist for plenty of non-Denuvo games and would
badge them incorrectly.

Lookups are throttled and cached to disk so the library fills in over time
without hammering the store API (~200 req / 5 min per IP). A game stays
unbadged until Steam confirms it, so there are no false positives.
"""

from __future__ import annotations

import json
import os
import threading
import time
from typing import Dict, List, Set

from .logger import logger
from .paths import runtime_path, get_user_home, defaults_path

STORE_API = "https://store.steampowered.com/api/appdetails"
CACHE_FILE = "denuvo_cache.json"
# Denuvo status changes rarely (usually removal post-launch) — re-check monthly.
TTL = 30 * 24 * 60 * 60
MIN_INTERVAL = 1.5  # seconds between store lookups

_lock = threading.Lock()
_cache: Dict[str, Dict] = {}   # appid -> {"denuvo": bool, "ts": float}
_loaded = False
_queue: List[int] = []
_worker: threading.Thread | None = None
_last_call = 0.0


_SEED: set | None = None


def _seed_ids() -> set:
    """Bundled list of confirmed Denuvo appids — instant, offline badges that
    don't depend on the (rate-limited) store API. Supplemented by store lookups."""
    global _SEED
    if _SEED is not None:
        return _SEED
    _SEED = set()
    try:
        import json as _json
        with open(defaults_path("denuvo_seed.json"), "r", encoding="utf-8") as fh:
            d = _json.load(fh)
        _SEED = {int(x) for x in (d.get("appids") or [])}
    except Exception:
        _SEED = set()
    return _SEED


def _path() -> str:
    # Kept under the user's config, NOT the plugin runtime dir, so the resolved
    # Denuvo list survives a plugin reinstall/update (runtime/ is wiped then).
    d = os.path.join(get_user_home(), ".config", "slsdeck")
    try:
        os.makedirs(d, exist_ok=True)
    except Exception:
        return runtime_path(CACHE_FILE)
    return os.path.join(d, CACHE_FILE)


def _legacy_path() -> str:
    return runtime_path(CACHE_FILE)


def _load() -> None:
    global _cache, _loaded
    if _loaded:
        return
    for p in (_path(), _legacy_path()):
        try:
            with open(p, "r", encoding="utf-8") as fh:
                d = json.load(fh)
            if isinstance(d, dict):
                for k, v in d.items():
                    if isinstance(v, dict) and k not in _cache:
                        _cache[k] = v
        except Exception:
            pass
    _loaded = True


def _persist() -> None:
    try:
        os.makedirs(os.path.dirname(_path()), exist_ok=True)
        with open(_path(), "w", encoding="utf-8") as fh:
            json.dump(_cache, fh)
    except Exception as exc:
        logger.warn(f"SLSDeck denuvo: cache write failed: {exc}")




def _fetch(appid: int) -> bool | None:
    """Ask the Steam store whether this app declares Denuvo. None = unknown."""
    global _last_call
    try:
        from .httpc import get_http_client
        wait = MIN_INTERVAL - (time.time() - _last_call)
        if wait > 0:
            time.sleep(wait)
        _last_call = time.time()

        client = get_http_client()
        r = client.get(
            STORE_API,
            params={"appids": str(appid), "filters": "basic,drm_notice",
                    "cc": "us", "l": "english"},
            headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en"},
            timeout=15,
            follow_redirects=True,
        )
        if r.status_code != 200:
            return None
        payload = r.json() or {}
        node = payload.get(str(appid)) or {}
        if not node.get("success"):
            return False
        data = node.get("data")
        if not isinstance(data, dict):
            return False
        notice = str(data.get("drm_notice", "") or "").lower()
        return "denuvo" in notice
    except Exception:
        return None


def _drain() -> None:
    global _worker
    while True:
        with _lock:
            if not _queue:
                _worker = None
                _persist()
                return
            appid = _queue.pop(0)
        result = _fetch(appid)
        if result is None:
            continue
        with _lock:
            _cache[str(appid)] = {"denuvo": bool(result), "ts": time.time()}


def _ensure_worker() -> None:
    global _worker
    if _worker is None or not _worker.is_alive():
        _worker = threading.Thread(target=_drain, daemon=True)
        _worker.start()


def known_denuvo() -> Set[int]:
    """Everything currently confirmed Denuvo via Steam's drm_notice (cache)."""
    with _lock:
        _load()
        cached = {int(k) for k, v in _cache.items() if v.get("denuvo")}
    return cached | _seed_ids()


def is_denuvo(appid: int) -> bool | None:
    """Cached/seed answer, or None if not resolved yet (queues a lookup)."""
    appid = int(appid)
    if appid in _seed_ids():
        return True
    with _lock:
        _load()
        entry = _cache.get(str(appid))
        if entry is not None:
            # Confirmed-Denuvo is sticky: once recorded it stays cached across
            # sessions and never expires, so a known game always badges.
            if entry.get("denuvo"):
                return True
            # Negatives re-check after the TTL (a game could gain Denuvo later).
            if (time.time() - float(entry.get("ts", 0))) < TTL:
                return False
        if appid not in _queue:
            _queue.append(appid)
    _ensure_worker()
    return None


def _resolve_sync(appid: int) -> None:
    """Resolve one appid immediately (blocking store call) and cache it."""
    appid = int(appid)
    if appid in _seed_ids():
        return
    with _lock:
        _load()
        entry = _cache.get(str(appid))
        if entry and (entry.get("denuvo") or (time.time() - float(entry.get("ts", 0))) < TTL):
            return
    r = _fetch(appid)
    if r is not None:
        with _lock:
            _cache[str(appid)] = {"denuvo": bool(r), "ts": time.time()}
            _persist()


# ── background resolution queue ────────────────────────────────────────────
# _fetch() rate-limits itself with a BLOCKING time.sleep(MIN_INTERVAL). Looping a
# large batch through it inside the RPC executor pinned a worker thread for
# minutes (a ~350-app library is ~9 minutes at 1.5 s/app) and could exhaust the
# pool, so every other backend call stalled and the QAM appeared frozen. Large
# batches now go to ONE dedicated daemon thread and resolve() returns instantly
# with whatever is already cached -- which is what its docstring always claimed.
# NOTE: imported as _stdqueue, NOT _queue. This module already has a
# module-global `_queue: List[int] = []` (the legacy pending list) declared near
# the top; importing the stdlib module as `_queue` rebound that name to a module
# object, so `appid not in _queue` in is_denuvo() raised
# "TypeError: argument of type 'module' is not iterable" for every uncached
# appid -- and _bg_worker's bare except swallowed it, silently disabling all
# background Denuvo detection.
import queue as _stdqueue
import threading as _threading

_BG_QUEUE: "_stdqueue.Queue[int]" = _stdqueue.Queue(maxsize=4096)
_BG_THREAD = None
_BG_LOCK = _threading.Lock()


def _bg_worker() -> None:
    while True:
        try:
            appid = _BG_QUEUE.get()
        except Exception:
            return
        try:
            is_denuvo(appid)
        except Exception:
            pass
        finally:
            try:
                _BG_QUEUE.task_done()
            except Exception:
                pass


def _ensure_bg_thread() -> None:
    global _BG_THREAD
    with _BG_LOCK:
        if _BG_THREAD is None or not _BG_THREAD.is_alive():
            _BG_THREAD = _threading.Thread(
                target=_bg_worker, name="slsdeck-denuvo", daemon=True)
            _BG_THREAD.start()


def resolve(appids: List[int]) -> Dict[str, object]:
    """Resolve a batch. A small batch (the game the user is viewing) resolves
    synchronously so its badge appears at once; large batches are queued to a
    background thread so the call returns immediately."""
    ids = []
    for a in appids or []:
        try:
            ids.append(int(a))
        except Exception:
            continue
    if 0 < len(ids) <= 5:
        for a in ids:
            try:
                _resolve_sync(a)
            except Exception:
                continue
    elif ids:
        _ensure_bg_thread()
        for a in ids:
            # Already-cached ids cost nothing; only unknowns need a lookup.
            try:
                if str(a) in _cache:
                    continue
                _BG_QUEUE.put_nowait(a)
            except _stdqueue.Full:
                break
            except Exception:
                continue
    return {"success": True, "denuvo": sorted(known_denuvo()),
            "pending": _BG_QUEUE.qsize()}
