"""Depot + DLC enumeration for the DepotDownloader / SmokeAPI path.

Why this exists
---------------
SLSDeck has two unrelated ways to make a game behave as though DLC is owned,
and they fail in opposite directions:

  * **SLSsteam** convinces the Steam CLIENT. The entitlement is real as far as
    Steam is concerned, so Steam itself will happily download the DLC's depots.
    Nothing here is needed for that path.
  * **SmokeAPI** convinces the GAME, by proxying ``steam_api(64).dll`` and
    answering ``IsDlcInstalled`` / ``GetDLCCount`` itself. Steam is never party
    to the lie -- which means Steam will never fetch those depots. In that path
    the DLC's files can only arrive out of band, so DepotDownloader is not an
    optimisation, it is the only way the content can exist on disk.

This module answers the question that path needs: *which DLC actually have
files, what are their depots/manifests, and do we hold the key to decrypt
them.* It deliberately is NOT an ownership checker -- it never asks what the
user owns, only what content exists.

Source of truth
---------------
``api.steamcmd.net/v1/info/<appid>`` (already used by ``hvauto`` and
``downloads``), whose ``depots`` section carries the classification Valve
publishes:

  ``manifests.public.gid``  the depot has downloadable content at this build
  ``dlcappid``              the depot belongs to a DLC
  ``depotfromapp``          the depot is defined by ANOTHER app (proxy depot).
                            DepotDownloader resolves these itself, so we only
                            record it -- we must NOT rewrite ``-app``.
  ``sharedinstall``         Steamworks Common Redistributables (VC++/DirectX).
                            Irrelevant under Proton, which ships its own.
  ``config.oslist/osarch``  platform gate, pairs with our ``-os windows``.

and ``extended.listofdlc``, the authoritative DLC appid list.

Scope: this module resolves DEPOTS, not builds
----------------------------------------------
Downloading one depot at one build needs THREE independent things. They come
from different places and it is a mistake (one this module previously made) to
treat them as a single "source":

  1. **The depot key** -- decrypts any manifest of that depot, so it is
     build-independent. Supplied in lua form (``addappid(depot,_,"<64hex>")``)
     by whichever provider resolved the game: lua.tools, Hubcap, Charon, Ryuu.
     One FORMAT, several providers -- not one supply.

  2. **Which gid names which build.**
       * SteamDB per-depot scrape -- PRIMARY, the only source with a depot's
         FULL history, so the only way to name an arbitrary older build. It is
         per-depot, so a DLC depot behaves exactly like a base depot here.
       * lua ``setManifestid`` -- opportunistic: present only when the fix that
         shipped the lua happened to pin a build.
       * appinfo ``manifests.public.gid`` (below) -- CURRENT public build only.
       * depot_history archive tree -- only gids people uploaded.

  3. **The manifest FILE for that depot+gid** (DepotDownloader's
     ``-manifestfile``).
       * Hubcap's generator -- can produce ANY depot+gid, so THIS is what makes
         historic builds reachable at all. Needs the user's Hubcap API key.
       * GitHub mirror archive -- fallback, only gids someone uploaded.

The practical consequence for DLC: a DLC depot's historic build is reachable
when SteamDB names the gid (2) AND Hubcap can generate the manifest (3) AND the
lua carried the depot key (1). Without a Hubcap key, (3) collapses to "whatever
is in the archive" and most historic builds are simply unavailable -- no amount
of gid resolution changes that.

So the gids this module reports are HINTS, not answers: enough to tell whether a
DLC has downloadable content at all, and to cover the common "latest build"
case. Build selection stays with the existing picker + ``download_build_with_gids``
flow. This module's job is the part nothing else does: WHICH depots sit behind
each DLC, and whether we hold their keys.
"""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .httpc import ensure_http_client

STEAMCMD_URL = "https://api.steamcmd.net/v1/info/{appid}"
_UA = "SLSDeck/depotmap"

# appinfo is stable for minutes at a time and a DLC sweep can touch dozens of
# apps, so cache aggressively rather than re-fetching per depot.
_TTL = 900.0
_CACHE: Dict[int, Dict[str, Any]] = {}

# Depot classes.
KIND_CONTENT = "content"    # base game content for this app
KIND_DLC = "dlc"            # belongs to a DLC appid
KIND_SHARED = "shared"      # sharedinstall redistributable
KIND_PROXY = "proxy"        # defined by another app (depotfromapp)


def _appinfo(appid: int) -> Dict[str, Any]:
    """Raw appinfo root for one app ({} on any failure). Cached."""
    try:
        appid = int(appid)
    except Exception:
        return {}
    hit = _CACHE.get(appid)
    now = time.time()
    if hit and now - hit.get("_at", 0) < _TTL:
        return hit.get("_root", {})
    try:
        client = ensure_http_client("depotmap: steamcmd")
        r = client.get(STEAMCMD_URL.format(appid=appid),
                       headers={"User-Agent": _UA}, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            logger.warn(f"depotmap: steamcmd HTTP {r.status_code} for {appid}")
            return {}
        root = (r.json().get("data", {}) or {}).get(str(appid), {}) or {}
    except Exception as exc:
        logger.warn(f"depotmap: steamcmd fetch failed for {appid}: {exc}")
        return {}
    _CACHE[appid] = {"_at": now, "_root": root}
    return root


def _int_or_none(value: Any) -> Optional[int]:
    try:
        return int(str(value).strip())
    except Exception:
        return None


def _depot_records(root: Dict[str, Any], owner_appid: int) -> List[Dict[str, Any]]:
    """Flatten one app's ``depots`` map into classified records."""
    depots = (root.get("depots", {}) or {})
    out: List[Dict[str, Any]] = []
    for key, value in depots.items():
        # Non-numeric keys are metadata: branches, baselanguages, privatebranches.
        if not str(key).isdigit() or not isinstance(value, dict):
            continue
        cfg = value.get("config", {}) or {}
        public = ((value.get("manifests", {}) or {}).get("public", {}) or {})
        dlc_appid = _int_or_none(value.get("dlcappid"))
        from_app = _int_or_none(value.get("depotfromapp"))
        shared = str(value.get("sharedinstall") or "") == "1"
        if shared:
            kind = KIND_SHARED
        elif dlc_appid is not None:
            kind = KIND_DLC
        elif from_app is not None and from_app != owner_appid:
            kind = KIND_PROXY
        else:
            kind = KIND_CONTENT
        out.append({
            "depot": int(key),
            "kind": kind,
            # Recorded for display only. DepotDownloader resolves depotfromapp
            # internally (ContentDownloader.GetSteam3DepotProxyAppId), so the
            # caller must keep passing the game's own appid as -app.
            "fromApp": from_app,
            "dlcAppid": dlc_appid,
            "gid": str(public.get("gid") or ""),
            "size": _int_or_none(public.get("size")) or 0,
            "download": _int_or_none(public.get("download")) or 0,
            "oslist": str(cfg.get("oslist") or ""),
            "osarch": str(cfg.get("osarch") or ""),
            "language": str(cfg.get("language") or ""),
            "optional": str(value.get("optional") or "") == "1",
        })
    out.sort(key=lambda d: d["depot"])
    return out


_LUA_KEY_RE = re.compile(
    r'addappid\s*\(\s*(\d+)\s*,\s*\d+\s*,\s*["\']([0-9a-fA-F]{64})["\']')
_LUA_GID_RE = re.compile(
    r'setManifestid\s*\(\s*(\d+)\s*,\s*["\'](\d+)["\']', re.IGNORECASE)


def _lua_map(appid: int) -> Dict[str, Dict[str, str]]:
    """``{"keys": {depot: key}, "gids": {depot: gid}}`` from the game's resolved
    lua -- the SAME artifact SLSsteam is driven from.

    Worth being explicit about, because it is the crux of how the two unlock
    paths relate: SLSsteam and DepotDownloader do not have separate supplies.
    One lua (lua.tools / Hubcap / Charon / Ryuu) carries both the depot keys and
    the ``setManifestid`` build pins; SLSsteam feeds them to the client so Steam
    downloads, DepotDownloader feeds them to itself and downloads directly. So
    if a game can be unlocked at all, the material to fetch its DLC depots is
    already in hand.

    The gids matter independently: appinfo only ever reports the CURRENT public
    build, while the lua names whatever build the fix actually targets. For a
    pinned game the lua gid is the correct one.

    Imported lazily so this module still loads on the v1 build, which ships no
    DepotDownloader."""
    try:
        from . import downloads
        r = downloads.fetch_lua_text(int(appid))
        text = r.get("lua", "") if r.get("success") else ""
    except Exception:
        return {"keys": {}, "gids": {}}
    return {
        "keys": {m.group(1): m.group(2) for m in _LUA_KEY_RE.finditer(text)},
        "gids": {m.group(1): m.group(2) for m in _LUA_GID_RE.finditer(text)},
    }


def _keys_for(appid: int) -> Dict[str, str]:
    return _lua_map(appid)["keys"]


def describe(appid: int) -> Dict[str, Any]:
    """Full depot picture for one app: every depot, classified, with whether we
    hold a usable decryption key for it. Writes nothing, downloads nothing."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    root = _appinfo(appid)
    if not root:
        return {"success": False, "error": "could not read appinfo from steamcmd"}
    lua = _lua_map(appid)
    keys, lua_gids = lua["keys"], lua["gids"]
    records = _depot_records(root, appid)
    for rec in records:
        d = str(rec["depot"])
        rec["hasKey"] = d in keys
        # The build the lua pins, when it names one. Distinct from ``gid``,
        # which appinfo reports for the CURRENT public build only.
        rec["luaGid"] = lua_gids.get(d, "")
    branches = ((root.get("depots", {}) or {}).get("branches", {}) or {})
    return {
        "success": True,
        "appid": appid,
        "name": str(((root.get("common", {}) or {}).get("name") or "")),
        "installdir": str(((root.get("config", {}) or {}).get("installdir") or "")),
        "buildid": str(((branches.get("public", {}) or {}).get("buildid") or "")),
        "depots": records,
        "dlcAppids": _listofdlc(root, appid),
    }


def _listofdlc(root: Dict[str, Any], appid: int = 0) -> List[int]:
    """The game's DLC appids.

    Prefers the EXISTING resolver (``dlcunlockers._resolve_dlc_ids`` ->
    ``downloads._fetch_app_info`` -> ``extended.listofdlc``) so the unlock side
    and the download side can never disagree about what the DLC set is -- the
    unlockers already write exactly this list into ``cream_api.ini``'s ``[dlc]``
    section. Falls back to parsing our own appinfo copy if that path fails."""
    out: List[int] = []
    if appid:
        try:
            from .dlcunlockers import _resolve_dlc_ids
            out = [int(d) for d in _resolve_dlc_ids(int(appid)) if str(d).isdigit()]
        except Exception:
            out = []
    if not out:
        raw = str(((root.get("extended", {}) or {}).get("listofdlc") or ""))
        for part in raw.split(","):
            n = _int_or_none(part)
            if n is not None:
                out.append(n)
    return out


def dlc_content(appid: int, deep: bool = False) -> Dict[str, Any]:
    """Which of this game's DLC actually have files to download.

    This is the enumeration the SmokeAPI path needs. Each DLC lands in exactly
    one bucket:

      ``files``       a depot with a public manifest exists -> DepotDownloader
                      can fetch it (``hasKey`` says whether we can decrypt it).
      ``entitlement`` the DLC has no downloadable depot: either its content
                      already ships inside the base depots or it is a pure
                      unlock. Nothing to download -- SmokeAPI alone is the
                      whole fix.

    ``deep`` additionally fetches each entitlement-looking DLC's OWN appinfo,
    since a DLC can define depots there that the base app never lists. Costs one
    request per DLC, so it is opt-in.
    """
    base = describe(appid)
    if not base.get("success"):
        return base

    lua = _lua_map(appid)
    keys, lua_gids = lua["keys"], lua["gids"]
    by_dlc: Dict[int, List[Dict[str, Any]]] = {}
    for rec in base["depots"]:
        if rec["kind"] == KIND_DLC and rec["dlcAppid"] is not None:
            by_dlc.setdefault(rec["dlcAppid"], []).append(rec)

    files: List[Dict[str, Any]] = []
    entitlement: List[Dict[str, Any]] = []
    for dlc_appid in base["dlcAppids"] or sorted(by_dlc.keys()):
        depots = by_dlc.get(dlc_appid, [])
        # A depot is fetchable if EITHER source names a build for it: appinfo's
        # current-build gid, or the lua's setManifestid pin. The lua wins when
        # both exist -- it names the build the fix actually targets, whereas
        # appinfo always describes today's public build.
        downloadable = []
        for d in depots:
            gid = lua_gids.get(str(d["depot"])) or d["gid"]
            if gid:
                downloadable.append({**d, "gid": gid,
                                     "gidSource": "lua" if lua_gids.get(str(d["depot"])) else "appinfo"})
        if not downloadable and deep:
            # The base app may only advertise the DLC as an id; its own appinfo
            # can still carry real depots.
            sub = _appinfo(dlc_appid)
            if sub:
                for rec in _depot_records(sub, dlc_appid):
                    if rec["gid"] and rec["kind"] in (KIND_CONTENT, KIND_DLC):
                        rec["hasKey"] = str(rec["depot"]) in keys or \
                            str(rec["depot"]) in _keys_for(dlc_appid)
                        downloadable.append(rec)
        if downloadable:
            files.append({
                "appid": dlc_appid,
                "depots": downloadable,
                "bytes": sum(d.get("size") or 0 for d in downloadable),
                "hasKey": all(d.get("hasKey") for d in downloadable),
                "missingKeys": [d["depot"] for d in downloadable if not d.get("hasKey")],
            })
        else:
            entitlement.append({
                "appid": dlc_appid,
                "reason": ("declared as a depot with no public manifest — content ships "
                           "in the base depots" if depots else
                           "no depot of its own — pure entitlement"),
            })
    return {
        "success": True,
        "appid": base["appid"],
        "name": base["name"],
        "installdir": base["installdir"],
        # DLC with real files: download these, then SmokeAPI so the game uses them.
        "files": files,
        # Nothing to fetch; the DLL answer is the entire fix.
        "entitlement": entitlement,
        "counts": {"files": len(files), "entitlement": len(entitlement)},
    }


def dlc_depots_for_picker(appid: int) -> Dict[str, Any]:
    """The depot ids behind each DLC, for the SteamDB per-depot picker.

    This is the intended entry point for choosing a BUILD. ``dlc_content``'s
    gids only cover "latest public" (appinfo) or "whatever a fix pinned" (lua);
    to reach any other build the frontend scrapes ``steamdb.info/depot/<id>/
    manifests/``, which needs exactly one thing from us -- the depot id. Handing
    those over keeps build selection in the machinery that already does it well
    instead of duplicating a weaker resolver here."""
    info = dlc_content(appid)
    if not info.get("success"):
        return info
    out = []
    for entry in info.get("files", []):
        out.append({
            "appid": entry["appid"],
            # Feed each of these to scrapeDepotManifests for the full history.
            "depots": [d["depot"] for d in entry["depots"]],
            "hintGids": {str(d["depot"]): d.get("gid", "") for d in entry["depots"]},
            "hintSource": {str(d["depot"]): d.get("gidSource", "") for d in entry["depots"]},
            "hasKey": entry["hasKey"],
            "missingKeys": entry["missingKeys"],
        })
    return {"success": True, "appid": info["appid"], "name": info["name"], "dlc": out}


def downloadable_depot_gids(appid: int, dlc_appids: List[int]) -> Dict[str, str]:
    """{depot: gid} for the chosen DLC, in the shape ``depotdl`` already takes.

    Convenience for the "just give me the latest build" case ONLY -- the gids
    come from appinfo/lua hints. For any other build, resolve through the
    SteamDB picker (see ``dlc_depots_for_picker``) and pass that map to
    ``download_build_with_gids`` instead.

    Keeps the caller's selection explicit: only DLC named here are included, so
    nothing is fetched that the user did not tick."""
    want = {int(a) for a in (dlc_appids or [])}
    info = dlc_content(appid)
    if not info.get("success"):
        return {}
    out: Dict[str, str] = {}
    for entry in info.get("files", []):
        if entry["appid"] not in want:
            continue
        for rec in entry["depots"]:
            if rec.get("gid"):
                out[str(rec["depot"])] = str(rec["gid"])
    return out
