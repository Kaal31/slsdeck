"""Layered pin-lua resolver.

To pin a game to the exact build a fix targets we need a manifest .lua whose
`setManifestid(depot,"gid")` lines name that build. This resolves one, in
priority order, and pins to its gids:

  1. lua.tools   — if signed in (Discord), the fix's paired manifest.
  2. Hubcap      — if a Morrenus/Hubcap API key is set, fetch the app manifest.
  3. ~/Downloads — a <appid>.lua (or *<appid>*.lua) the user downloaded manually.
  4. none        — do NOT auto-pin (the manual "Pin manually" button still works,
                   pinning the currently-installed build).
"""

from __future__ import annotations

import io
import os
import re
import zipfile
from typing import Dict, Optional, Tuple

from .logger import logger
from .paths import get_user_home
from .httpc import ensure_http_client
from . import luatools, settings, slssteam

# Matches setManifestid(depot,"gid") even when commented (LuaTools ships it as a
# "-- setManifestid(...) from LuaTools" hint line).
_RE_SETMANIFEST = re.compile(
    r'setManifestid\s*\(\s*(\d+)\s*,\s*["\'](\d+)["\']', re.IGNORECASE)

HUBCAP_MANIFEST = "https://hubcapmanifest.com/api/v1/manifest/{appid}?api_key={key}"
HUBCAP_USAGE = "https://hubcapmanifest.com/api/v1/generate/usage"


HUBCAP_WORKSHOP = "https://hubcapmanifest.com/api/v1/generate/workshopmanifest/{appid}"


def hubcap_workshop_manifest(appid: int) -> Dict[str, object]:
    """Fetch the Hubcap-generated Workshop manifest for a game and publish it to
    the SLSsteam ManifestStore so the engine can serve the workshop depot. Bearer
    auth. Returns {success, path, bytes}."""
    try:
        key = settings.get_morrenus_api_key()
    except Exception:
        key = ""
    if not key:
        return {"success": False, "error": "No Hubcap key set"}
    try:
        client = ensure_http_client("pinsource: hubcap workshop")
        r = client.get(HUBCAP_WORKSHOP.format(appid=int(appid)), headers={
            "Authorization": f"Bearer {key}", "User-Agent": "SLSDeck/hubcap",
        }, timeout=90, follow_redirects=True)
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    if r.status_code != 200:
        body = ""
        try:
            body = r.text[:160]
        except Exception:
            body = ""
        return {"success": False, "status": r.status_code, "error": f"HTTP {r.status_code} {body}".strip()}
    data = r.content
    if not data:
        return {"success": False, "error": "empty manifest"}
    try:
        mdir = os.path.join(slssteam.config_dir(), "manifests")
        os.makedirs(mdir, exist_ok=True)
        path = os.path.join(mdir, f"workshop_{int(appid)}.manifest")
        with open(path, "wb") as fh:
            fh.write(data)
        try:
            from .utils import chown_to_user
            chown_to_user(path, recursive=False)
        except Exception:
            pass
    except Exception as exc:
        return {"success": False, "error": f"saved fetch but could not store: {exc}"}
    return {"success": True, "path": path, "bytes": len(data)}


def hubcap_usage() -> Dict[str, object]:
    """Live Hubcap generation quota (single / bundle / workshop) for the
    configured Hubcap/Morrenus key. Uses Bearer auth per the Hubcap API."""
    try:
        key = settings.get_morrenus_api_key()
    except Exception:
        key = ""
    if not key:
        return {"success": False, "error": "No Hubcap key set"}
    try:
        client = ensure_http_client("pinsource: hubcap usage")
        r = client.get(HUBCAP_USAGE, headers={
            "Authorization": f"Bearer {key}",
            "User-Agent": "SLSDeck/hubcap",
        }, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            return {"success": False, "status": r.status_code,
                    "error": f"HTTP {r.status_code}"}
        return {"success": True, "usage": r.json()}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def parse_setmanifestid(text: str) -> Dict[int, str]:
    out: Dict[int, str] = {}
    for m in _RE_SETMANIFEST.finditer(text or ""):
        try:
            out[int(m.group(1))] = m.group(2)
        except Exception:
            continue
    return out


def _lua_from_zip(data: bytes) -> Optional[str]:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for n in z.namelist():
                if n.lower().endswith(".lua"):
                    return z.read(n).decode("utf-8", "ignore")
    except Exception:
        pass
    return None


def _hubcap_lua(appid: int, key: str) -> Optional[str]:
    """Fetch the app's manifest from Hubcap. Response may be a .lua or a zip."""
    try:
        client = ensure_http_client("pinsource: hubcap")
        r = client.get(HUBCAP_MANIFEST.format(appid=int(appid), key=key),
                       timeout=30, follow_redirects=True)
        if r.status_code != 200:
            logger.debug(f"pinsource: hubcap HTTP {r.status_code} for {appid}")
            return None
        content = r.content
        if content[:2] == b"PK":
            return _lua_from_zip(content)
        text = r.text
        return text if "addappid" in text else None
    except Exception as exc:
        logger.warn(f"pinsource: hubcap fetch failed for {appid}: {exc}")
        return None


def _downloads_lua(appid: int) -> Optional[str]:
    home = get_user_home()
    dl = os.path.join(home, "Downloads")
    cands = [os.path.join(dl, f"{appid}.lua")]
    try:
        for fn in sorted(os.listdir(dl)):
            if fn.lower().endswith(".lua") and str(appid) in fn:
                cands.append(os.path.join(dl, fn))
    except Exception:
        pass
    seen = set()
    for p in cands:
        if p in seen or not os.path.isfile(p):
            continue
        seen.add(p)
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                t = fh.read()
            if "setManifestid" in t:
                return t
        except Exception:
            continue
    return None


def resolve_pin_lua(appid: int) -> Tuple[Optional[str], str]:
    """Return (lua_text, source) or (None, 'none')."""
    try:
        appid = int(appid)
    except Exception:
        return None, "none"
    # 1. lua.tools (signed in)
    try:
        if luatools.is_authed():
            t = luatools.fetch_manifest_lua(appid)
            if t and "setManifestid" in t:
                return t, "lua.tools"
    except Exception as exc:
        logger.debug(f"pinsource: lua.tools resolve failed: {exc}")
    # 2. Hubcap key
    try:
        key = settings.get_morrenus_api_key()
    except Exception:
        key = ""
    if key:
        t = _hubcap_lua(appid, key)
        if t and "setManifestid" in t:
            return t, "hubcap"
    # 3. Downloads
    t = _downloads_lua(appid)
    if t:
        return t, "downloads"
    return None, "none"


def auto_pin_from_source(appid: int) -> Dict[str, object]:
    """Resolve a pin lua and pin the game to its setManifestid gids. When nothing
    is found, does NOT pin (returns pinned=False) — the manual pin button remains
    the fallback."""
    text, src = resolve_pin_lua(appid)
    if not text:
        return {"success": True, "pinned": False, "source": "none"}
    gids = parse_setmanifestid(text)
    if not gids:
        return {"success": True, "pinned": False, "source": src,
                "error": "manifest lua had no setManifestid"}
    r = dict(slssteam.pin_app_gids(appid, gids))
    r["pinned"] = bool(r.get("success"))
    r["source"] = src
    logger.log(f"SLSDeck: pinned {appid} to {len(gids)} depot(s) via {src}")
    return r


def auto_pin_from_luatools_fix(appid: int, fix_id: str) -> Dict[str, object]:
    """Pin to the EXACT build a specific lua.tools fix targets, using that fix's
    paired manifest (slot=manifest). This makes the update-vs-skip decision
    accurate per-fix instead of relying on the generic per-app manifest. The
    selected fix is authoritative; never substitute a generic/latest manifest."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "pinned": False, "error": "invalid appid"}
    text = None
    try:
        text = luatools.download_fix_manifest(str(fix_id), appid)
    except Exception as exc:
        logger.debug(f"pinsource: fix manifest fetch failed: {exc}")
    if not text:
        return {"success": True, "pinned": False, "source": "lua.tools-fix",
                "error": "selected fix has no readable paired manifest .lua"}
    gids = parse_setmanifestid(text)
    if not gids:
        return {"success": True, "pinned": False, "source": "lua.tools",
                "error": "fix manifest had no setManifestid"}
    r = dict(slssteam.pin_app_gids(appid, gids))
    r["pinned"] = bool(r.get("success"))
    r["source"] = "lua.tools"
    logger.log(f"SLSDeck: pinned {appid} to {len(gids)} depot(s) via lua.tools fix {fix_id}")
    return r
