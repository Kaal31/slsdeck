"""DLC helpers: resolve a game's DLC list / parent, register all DLC depot keys
so content DLC downloads with the base (Toggle A), and compute the DLC appids to
blacklist for owned games (Toggle B).

Owned-game *enumeration* only exists in the frontend (Steam's JS stores), so the
frontend passes owned appids in; the backend resolves each one's DLC via Steam's
public appdetails API and does the config work.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from .logger import logger
from .httpc import ensure_http_client
from . import slssteam

_APPDETAILS = "https://store.steampowered.com/api/appdetails?appids={appid}&l=english"


def resolve_dlc(appid: int) -> Dict[str, Any]:
    """Return {appid, isDlc, base, dlcs} for a game. `base` is the parent appid if
    `appid` is itself a DLC (Steam `fullgame`); `dlcs` is the base game's DLC
    appid list."""
    try:
        appid = int(appid)
    except Exception:
        return {"appid": appid, "isDlc": False, "base": appid, "dlcs": []}
    client = ensure_http_client("SLSDeck: dlc")
    def _details(a: int) -> Dict[str, Any]:
        try:
            r = client.get(_APPDETAILS.format(appid=a), timeout=12)
            if r.status_code != 200:
                return {}
            return r.json().get(str(a), {}).get("data", {}) or {}
        except Exception:
            return {}
    data = _details(appid)
    is_dlc = (data.get("type") == "dlc") or ("fullgame" in data)
    base = appid
    if is_dlc:
        try:
            base = int(data.get("fullgame", {}).get("appid") or appid)
        except Exception:
            base = appid
    base_data = data if base == appid else _details(base)
    dlcs = []
    for d in (base_data.get("dlc") or []):
        try:
            dlcs.append(int(d))
        except Exception:
            pass
    return {"appid": appid, "isDlc": bool(is_dlc), "base": base, "dlcs": dlcs}


def owned_dlc_appids(owned_appids: List[int]) -> List[int]:
    """Given the owned appids (from the frontend), return all their DLC appids —
    the set to blacklist so moon stops unlocking DLC on games you legit own."""
    out: set = set()
    for a in owned_appids or []:
        try:
            info = resolve_dlc(int(a))
        except Exception:
            continue
        for d in info.get("dlcs", []):
            out.add(int(d))
    return sorted(out)


def set_dlc_unlock_owned(disabled: bool, owned_appids: List[int]) -> Dict[str, Any]:
    """Toggle B: when `disabled`, blacklist the owned games' DLC appids so moon
    won't unlock them; when re-enabled, clear the blacklist. Preserves any
    non-DLC blacklist entries the user/plugin already had is out of scope — this
    owns the AppIds list for the DLC-unlock feature."""
    try:
        if disabled:
            ids = owned_dlc_appids(owned_appids)
            r = slssteam.set_blacklist(ids)
            r["blacklisted"] = len(ids)
            return r
        return slssteam.set_blacklist([])
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# ── Toggle A: ensure all DLC depot keys are registered so content DLC downloads ─

def ensure_all_dlc_keys(appid: int) -> Dict[str, Any]:
    """Fetch the FULL manifest for a game (all depots incl. DLC) and register
    every depot key, so the base install pulls content DLC too. Prefers Hubcap's
    /manifest zip (carries all depots + keys + .manifest binaries); falls back to
    the resolved lua. Returns {success, keys, source}."""
    from . import downloads
    registered = 0
    dlc_registered = 0
    source = ""
    # 0) Register the game's DLC appids explicitly in moon's DlcData so they show
    # OWNED everywhere — not just in-game. moon's blanket unlock only fires while a
    # game is running (getAppId != 0); in the library/store view DLC still read as
    # unowned. DlcData is the context-independent ownership map, so writing each
    # DLC appid here is what makes them appear added in the store. Each DLC has its
    # own appid (as expected); we write them all in one atomic pass.
    try:
        info = resolve_dlc(appid)
        base = int(info.get("base") or appid)
        dlc_ids = info.get("dlcs") or []
        if dlc_ids:
            rr = slssteam.add_dlc_block(base, dlc_ids)
            dlc_registered = int(rr.get("added", 0))
    except Exception as exc:
        logger.warn(f"SLSDeck: ensure_all_dlc_keys DlcData step failed for {appid}: {exc}")
    # 1) The resolved lua text (lua.tools/Charon) — parse ALL addappid keys.
    try:
        r = downloads.fetch_lua_text(appid)
        if r.get("success"):
            source = r.get("source", "")
            for m in re.finditer(r'addappid\s*\(\s*(\d+)\s*,\s*\d+\s*,\s*["\']([0-9a-fA-F]{64})["\']',
                                 r.get("lua", "")):
                depot, key = int(m.group(1)), m.group(2)
                try:
                    if slssteam.cache_depot_key(appid, depot, key):
                        registered += 1
                except Exception:
                    pass
    except Exception as exc:
        logger.warn(f"SLSDeck: ensure_all_dlc_keys lua step failed for {appid}: {exc}")
    # 2) Hubcap manifest bundle (has DLC depots + .manifest binaries) — best source.
    try:
        b = downloads.fetch_manifest_bundle(appid)
        if b.get("manifests"):
            source = (source + "+hubcap").strip("+") if source else "hubcap"
    except Exception:
        pass
    return {"success": True, "keys": registered, "dlcRegistered": dlc_registered,
            "source": source or "none"}
