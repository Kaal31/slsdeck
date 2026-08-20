"""Build-picker: let the user install/pin a specific build of a game, or (advanced)
pick the manifest gid per depot manually.

Sources (all keyless, already used by depot_history):
  * SteamDB PatchnotesRSS  → the build list (date ↔ buildid)
  * GitHub manifest mirrors → the historical <depot>_<gid>.manifest gids per depot

Apply path (v1): moon ManifestPins via ``slssteam.pin_app_gids`` — moon fetches
each manifest on demand with the depot key, so the build need not be installed.
(v2 additionally offers downloading the chosen gids via DepotDownloader.)
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from .logger import logger
from . import depot_history, slssteam


def _depot_ids_for(appid: int) -> List[str]:
    """Depot ids for a game, parsed from its resolved manifest lua (addappid with a
    64-hex key = a keyed depot; setManifestid names a depot too)."""
    ids: List[str] = []
    try:
        from . import downloads
        r = downloads.fetch_lua_text(appid)
        lua = r.get("lua", "") if r.get("success") else ""
        for m in re.finditer(r'addappid\s*\(\s*(\d+)\s*,\s*\d+\s*,\s*["\'][0-9a-fA-F]{64}["\']', lua):
            ids.append(m.group(1))
        for m in re.finditer(r'setManifestid\s*\(\s*(\d+)', lua):
            ids.append(m.group(1))
    except Exception as exc:
        logger.warn(f"buildpicker: depot id resolve failed for {appid}: {exc}")
    # dedupe, keep order
    seen, out = set(), []
    for d in ids:
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out


def list_builds(appid: int) -> Dict[str, Any]:
    """Build list for the picker: [{buildid, date}], newest first, plus a
    'latest' pseudo-entry. From SteamDB PatchnotesRSS."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid", "builds": []}
    try:
        by_date = depot_history._build_ids(str(appid))  # {date: buildid}
    except Exception as exc:
        return {"success": False, "error": str(exc), "builds": []}
    builds = [{"buildid": bid, "date": date}
              for date, bid in sorted(by_date.items(), reverse=True)]
    out = [{"buildid": "latest", "date": "current", "isCurrent": True}] + builds
    return {"success": True, "appid": appid, "builds": out,
            "pinned": slssteam.is_pinned(appid)}


def list_depot_manifests(appid: int) -> Dict[str, Any]:
    """Advanced: per depot, the available manifest gids (deduped) with dates —
    for manual 'select manifest per depot'. From the GitHub mirror history."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid", "depots": []}
    # {date: buildid} from SteamDB patchnotes, so each gid can be labelled with the
    # build it belongs to (a manifest per depot IS a build for that depot).
    try:
        build_ids = depot_history._build_ids(str(appid))
    except Exception:
        build_ids = {}
    depots = []
    for d in _depot_ids_for(appid):
        try:
            entries = depot_history._depot_entries(d, fetch_dates=True)
        except Exception:
            entries = []
        gids = []
        for e in entries:
            bid = ""
            try:
                bid = depot_history.build_for_date(build_ids, e.date)
            except Exception:
                bid = ""
            gids.append({"gid": e.gid, "date": e.date, "source": e.source, "buildid": bid})
        depots.append({"depot": d, "gids": gids})
    return {"success": True, "appid": appid, "depots": depots,
            "note": "Mixing gids from different builds can break the game — prefer a single build."}


def list_depot_manifests_merged(appid: int, scraped) -> Dict[str, Any]:
    """Like list_depot_manifests, but merges a frontend SteamDB scrape (PRIMARY —
    the authoritative full history) with the GitHub archive (FALLBACK), labelling
    every gid with its build. `scraped` is {depot: [{gid, date}]} (or JSON string);
    when empty this degrades to the archive-only list."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid", "depots": []}
    if isinstance(scraped, str):
        try:
            import json as _json
            scraped = _json.loads(scraped or "{}")
        except Exception:
            scraped = {}
    scraped = scraped or {}
    try:
        build_ids = depot_history._build_ids(str(appid))
    except Exception:
        build_ids = {}
    depots = []
    for d in _depot_ids_for(appid):
        merged: Dict[str, Dict[str, Any]] = {}  # gid -> {gid, date, source, buildid}
        # PRIMARY: SteamDB scrape for this depot (keyed by str or int depot id).
        scraped_for_d = []
        if isinstance(scraped, dict):
            scraped_for_d = scraped.get(str(d)) or scraped.get(int(d)) or []
        for e in scraped_for_d:
            try:
                gid = str(e.get("gid"))
                date = str(e.get("date") or "")
                if gid.isdigit():
                    merged[gid] = {"gid": gid, "date": date, "source": "SteamDB"}
            except Exception:
                continue
        # FALLBACK: GitHub archive fills in anything the scrape missed.
        try:
            for e in depot_history._depot_entries(d, fetch_dates=True):
                if e.gid not in merged:
                    merged[e.gid] = {"gid": e.gid, "date": e.date, "source": e.source}
        except Exception:
            pass
        gids = []
        for g in merged.values():
            try:
                g["buildid"] = depot_history.build_for_date(build_ids, g.get("date", ""))
            except Exception:
                g["buildid"] = ""
            gids.append(g)
        # newest first when the date parses
        gids.sort(key=lambda x: str(x.get("date") or ""), reverse=True)
        depots.append({"depot": d, "gids": gids})
    return {"success": True, "appid": appid, "depots": depots,
            "note": "SteamDB (full history) with GitHub archive fallback. Mixing gids "
                    "from different builds can break the game — prefer one build."}


def apply_build(appid: int, buildid: str, date: str = "", primary_gids=None) -> Dict[str, Any]:
    """Pin the game to a specific build (resolve its {depot: gid} then pin). `date`
    (YYYY-MM-DD) and `primary_gids` ({depot: gid}, scraped from SteamDB's signed-in
    history) may be supplied by the frontend so resolution doesn't depend on the
    backend's Cloudflare-blocked SteamDB access — SteamDB is primary, the GitHub
    archive is the per-depot fallback."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    buildid = str(buildid or "latest").strip()
    if buildid in ("", "latest", "current"):
        # 'latest' = unpin so the game tracks the public build again.
        try:
            from . import settings as _s
            _s.set_pinned_build(appid, "")
        except Exception:
            pass
        try:
            slssteam.purge_pins_for_app(appid)
        except Exception:
            pass
        return {"success": True, "status": "unpinned"}
    r = depot_history.resolve(appid, buildid, target_date=date, primary_gids=primary_gids)
    if not r.get("success") or not r.get("gids"):
        return {"success": False, "status": r.get("status", "unresolved"),
                "error": r.get("message", "Could not resolve that build's manifests")}
    gids = {int(k): str(v) for k, v in r["gids"].items()}
    pin = slssteam.pin_app_gids(appid, gids)
    pin.setdefault("gids", gids)
    if pin.get("success"):
        try:
            from . import settings as _s
            _s.set_pinned_build(appid, buildid)
        except Exception:
            pass
    return pin


def apply_manifests(appid: int, depot_gids: Dict[str, str]) -> Dict[str, Any]:
    """Advanced apply: pin an explicit {depot: gid} map chosen per depot."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    try:
        gids = {int(k): str(v) for k, v in (depot_gids or {}).items() if v}
    except Exception:
        return {"success": False, "error": "bad depot/gid map"}
    if not gids:
        return {"success": False, "error": "no manifests selected"}
    return slssteam.pin_app_gids(appid, gids)
