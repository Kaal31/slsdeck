"""Local per-game build history — roll back to a build you've been on without
re-resolving it from the mirrors (ACCELA-style rollback).

We snapshot the depot gids each time a build is pinned; rollback re-pins a stored
gid set so Steam re-downloads that exact build. Stored under
~/.local/share/SLSDeck/build_history/<appid>.json (capped, newest-first).
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List

from .paths import get_user_home
from .utils import chown_to_user

_CAP = 6


def _root() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "SLSDeck", "build_history")
    os.makedirs(d, exist_ok=True)
    return d


def _path(appid) -> str:
    return os.path.join(_root(), f"{int(appid)}.json")


def _load(appid) -> List[Dict[str, Any]]:
    try:
        with open(_path(appid), encoding="utf-8") as fh:
            return json.load(fh) or []
    except Exception:
        return []


def _save(appid, entries: List[Dict[str, Any]]) -> None:
    try:
        with open(_path(appid), "w", encoding="utf-8") as fh:
            json.dump(entries[:_CAP], fh)
        chown_to_user(_path(appid), recursive=False)
    except Exception:
        pass


def snapshot(appid, gids: Dict[Any, Any], buildid: str = "", source: str = "") -> None:
    """Record a build's depot gids (dedup by identical gid set; newest first)."""
    try:
        clean = {str(int(d)): str(g) for d, g in (gids or {}).items()
                 if str(d).isdigit() and str(g).isdigit()}
        if not clean:
            return
        entries = [e for e in _load(appid) if e.get("gids") != clean]
        entries.insert(0, {"id": str(int(time.time() * 1000)), "gids": clean,
                           "buildid": str(buildid or ""), "source": source or "",
                           "savedAt": int(time.time())})
        _save(appid, entries)
    except Exception:
        pass


def list_for(appid) -> Dict[str, Any]:
    entries = _load(appid)
    cur: Dict[str, str] = {}
    try:
        from . import steam
        inst = steam.get_installed_depots(int(appid)) or {}
        cur = {str(int(d)): str(g) for d, g in inst.items() if str(d).isdigit()}
    except Exception:
        cur = {}
    if cur and not any(e.get("gids") == cur for e in entries):
        entries.insert(0, {"id": "current", "gids": cur, "buildid": "",
                           "source": "installed now", "savedAt": 0})
    for e in entries:
        e["current"] = bool(cur and e.get("gids") == cur)
    return {"success": True, "items": entries}


def rollback(appid, entry_id: str) -> Dict[str, Any]:
    entries = list_for(appid).get("items", [])
    entry = next((e for e in entries if e.get("id") == entry_id), None)
    if not entry:
        return {"success": False, "error": "build not found in history"}
    try:
        gids = {int(d): str(g) for d, g in entry["gids"].items()}
        from . import slssteam
        r = slssteam.pin_app_gids(int(appid), gids)
        return {"success": bool(r.get("success")), "changed": r.get("changed"),
                "unsupported": r.get("unsupported"), "error": r.get("error", ""),
                "buildid": entry.get("buildid", "")}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def clear(appid) -> Dict[str, Any]:
    try:
        p = _path(appid)
        if os.path.isfile(p):
            os.remove(p)
        return {"success": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
