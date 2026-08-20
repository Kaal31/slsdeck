"""Persistent build-state backup that survives SLSDeck plugin removal.

The archive lives outside the plugin directory and contains exact per-AppID
{depot: gid} maps plus matching binary manifests. It is restored idempotently on
next plugin startup and again after a moon install finishes if necessary.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import zipfile
from typing import Any, Dict

from .logger import logger
from .paths import get_user_home

_PATCHED = False
_RESTORING = False


def backup_path() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, "build_survival_backup.zip")


def _lua_gid_maps() -> Dict[str, Dict[str, str]]:
    out: Dict[str, Dict[str, str]] = {}
    try:
        from .steam import stplugin_dir
        d = stplugin_dir()
        if not d or not os.path.isdir(d): return out
        for fn in os.listdir(d):
            m = re.fullmatch(r"(\d+)\.lua", fn)
            if not m: continue
            try:
                txt = open(os.path.join(d, fn), "r", encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            gids = {}
            for dm in re.finditer(r"setManifestid\s*\(\s*(\d+)\s*,\s*[\"']?(\d+)[\"']?", txt, re.I):
                gids[dm.group(1)] = dm.group(2)
            if gids: out[m.group(1)] = gids
    except Exception:
        pass
    return out


def _pin_maps() -> Dict[str, Dict[str, str]]:
    out = _lua_gid_maps()
    try:
        from . import slssteam
        text = slssteam._read() or ""
        mh = re.search(r"^ManifestPins\s*:\s*$", text, re.M)
        if not mh: return out
        body = text[mh.end():]
        nxt = re.search(r"^\S", body, re.M)
        if nxt: body = body[:nxt.start()]
        current = None
        for line in body.splitlines():
            a = re.match(r"^  (\d+)\s*:\s*$", line)
            if a:
                current = a.group(1); out.setdefault(current, {}); continue
            if current:
                d = re.match(r"^\s{6}(\d+)\s*:\s*[\"']?(\d+)[\"']?\s*$", line)
                if d: out[current][d.group(1)] = d.group(2)
    except Exception:
        pass
    return {a: g for a, g in out.items() if g}


def _manifest_sources() -> list:
    out = []
    try:
        from . import slssteam
        out.append(slssteam.manifest_store_dir())
    except Exception: pass
    try:
        from .steam import depotcache_dir
        out.append(depotcache_dir())
    except Exception: pass
    # Full DepotDownloader builds keep exact fetched manifests in the game dir.
    try:
        from . import depot_cleanup
        data = depot_cleanup._read()
        for rec in data.values():
            p = str(rec.get("installPath") or "")
            if p: out.append(os.path.join(p, ".slsdeck_manifests"))
    except Exception: pass
    seen = []
    for p in out:
        if p and p not in seen: seen.append(p)
    return seen


def save() -> Dict[str, Any]:
    pins = _pin_maps()
    if not pins:
        # Never replace a useful survival archive with an empty first-run state.
        return {"success": True, "skipped": True, "reason": "no build gids"}
    try:
        from . import settings
        builds = dict(settings.get_value("pinnedBuilds", {}) or {})
    except Exception:
        builds = {}
    wanted = set()
    for gids in pins.values():
        for depot, gid in gids.items(): wanted.add(f"{depot}_{gid}.manifest")
    path = backup_path(); tmp = path + ".tmp"
    try:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr("state.json", json.dumps({"version": 1, "pins": pins, "buildids": builds}, indent=2))
            found = set()
            for src in _manifest_sources():
                if not src or not os.path.isdir(src): continue
                for name in wanted:
                    if name in found: continue
                    fp = os.path.join(src, name)
                    if os.path.isfile(fp) and os.path.getsize(fp) > 0:
                        z.write(fp, f"manifests/{name}"); found.add(name)
        os.replace(tmp, path)
        try:
            from .utils import chown_to_user
            chown_to_user(path, recursive=False)
        except Exception: pass
        logger.log(f"SLSDeck: saved survival build backup ({len(pins)} app(s), {len(found)} manifest(s))")
        return {"success": True, "apps": len(pins), "manifests": len(found), "path": path}
    except Exception as exc:
        try:
            if os.path.exists(tmp): os.remove(tmp)
        except Exception: pass
        logger.warn(f"SLSDeck: survival backup failed: {exc}")
        return {"success": False, "error": str(exc)}


def restore() -> Dict[str, Any]:
    global _RESTORING
    if _RESTORING: return {"success": True, "busy": True}
    path = backup_path()
    if not os.path.isfile(path): return {"success": True, "found": False}
    _RESTORING = True
    try:
        from . import settings, slssteam
        from .steam import depotcache_dir
        with zipfile.ZipFile(path, "r") as z:
            state = json.loads(z.read("state.json").decode("utf-8"))
            pins = state.get("pins") or {}; builds = state.get("buildids") or {}
            targets = [slssteam.manifest_store_dir(), depotcache_dir()]
            restored = 0
            for t in targets:
                if not t: continue
                os.makedirs(t, exist_ok=True)
                for name in z.namelist():
                    if not name.startswith("manifests/") or name.endswith("/"): continue
                    bn = os.path.basename(name)
                    dst = os.path.join(t, bn)
                    if not os.path.isfile(dst) or os.path.getsize(dst) == 0:
                        with z.open(name) as src, open(dst, "wb") as out:
                            shutil.copyfileobj(src, out)
                        restored += 1
            for appid, buildid in builds.items():
                try: settings.set_pinned_build(int(appid), str(buildid))
                except Exception: pass
            applied = 0
            try:
                moon = bool(slssteam.installed_lib_is_moon().get("moon"))
            except Exception:
                moon = False
            if moon:
                slssteam.ensure_config()
                for appid, gids in pins.items():
                    try:
                        r = slssteam.pin_app_gids(int(appid), {int(d): str(g) for d, g in gids.items()})
                        if r.get("success"): applied += 1
                    except Exception: pass
        logger.log(f"SLSDeck: restored survival build backup ({applied} pin(s), {restored} manifest copy/copies)")
        return {"success": True, "found": True, "pins": applied, "manifests": restored}
    except Exception as exc:
        logger.warn(f"SLSDeck: survival backup restore failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        _RESTORING = False


def patch(slssteam: Any, downloads: Any) -> None:
    global _PATCHED
    if _PATCHED: return
    _PATCHED = True
    # Restore first, before any wrapper can save current state over the archive.
    try: restore()
    except Exception: pass

    for name in ("pin_app_gids", "pin_app_current"):
        original = getattr(slssteam, name, None)
        if not callable(original): continue
        def make_wrapper(fn):
            def wrapped(*args, **kwargs):
                r = fn(*args, **kwargs)
                try:
                    if isinstance(r, dict) and r.get("success"): save()
                except Exception: pass
                return r
            return wrapped
        setattr(slssteam, name, make_wrapper(original))

    original_status = slssteam.get_install_status
    def status_wrapped():
        r = original_status()
        try:
            st = r.get("state") or {}
            if st.get("status") == "done" and st.get("installed"): restore()
        except Exception: pass
        return r
    slssteam.get_install_status = status_wrapped

    original_final = downloads._finalize_registration
    def final_wrapped(appid, source_name):
        original_final(appid, source_name)
        try: save()
        except Exception: pass
    downloads._finalize_registration = final_wrapped
