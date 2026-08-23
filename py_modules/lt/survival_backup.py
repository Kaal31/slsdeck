"""Persistent SLSDeck state backup that survives plugin removal.

Stored outside the plugin directory. The archive contains registered games,
per-AppID depot->manifest GIDs, matching manifests, pinned build IDs, moon Lua
registrations, and per-game fix history logs. Restore is idempotent and runs on
plugin startup and again after slsteam-moon installation completes.
"""
from __future__ import annotations

import json
import os
import re
import shutil
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
        if not d or not os.path.isdir(d):
            return out
        for fn in os.listdir(d):
            m = re.fullmatch(r"(\d+)\.lua", fn)
            if not m:
                continue
            try:
                with open(os.path.join(d, fn), "r", encoding="utf-8", errors="ignore") as fh:
                    txt = fh.read()
            except Exception:
                continue
            gids: Dict[str, str] = {}
            for dm in re.finditer(r"setManifestid\s*\(\s*(\d+)\s*,\s*[\"']?(\d+)[\"']?", txt, re.I):
                gids[dm.group(1)] = dm.group(2)
            if gids:
                out[m.group(1)] = gids
    except Exception:
        pass
    return out


def _pin_maps() -> Dict[str, Dict[str, str]]:
    out = _lua_gid_maps()
    try:
        from . import slssteam
        text = slssteam._read() or ""
        mh = re.search(r"^ManifestPins\s*:\s*$", text, re.M)
        if not mh:
            return out
        body = text[mh.end():]
        nxt = re.search(r"^\S", body, re.M)
        if nxt:
            body = body[:nxt.start()]
        current = None
        for line in body.splitlines():
            a = re.match(r"^  (\d+)\s*:\s*$", line)
            if a:
                current = a.group(1)
                out.setdefault(current, {})
                continue
            if current:
                d = re.match(r"^\s{6}(\d+)\s*:\s*[\"']?(\d+)[\"']?\s*$", line)
                if d:
                    out[current][d.group(1)] = d.group(2)
    except Exception:
        pass
    return {a: g for a, g in out.items() if g}


def _registered_apps() -> Dict[str, Dict[str, str]]:
    apps: Dict[str, Dict[str, str]] = {}
    try:
        from . import slssteam
        appids = list(slssteam.read_additional_apps() or [])
    except Exception:
        appids = []
    try:
        from . import downloads
    except Exception:
        downloads = None
    for raw in appids:
        try:
            appid = int(raw)
        except Exception:
            continue
        name = ""
        if downloads is not None:
            try:
                name = str(downloads._get_loaded_app_name(appid) or "").strip()
            except Exception:
                pass
        apps[str(appid)] = {"name": name or f"App {appid}"}
    return apps


def _manifest_sources() -> list:
    out = []
    try:
        from . import slssteam
        out.append(slssteam.manifest_store_dir())
    except Exception:
        pass
    try:
        from .steam import depotcache_dir
        out.append(depotcache_dir())
    except Exception:
        pass
    try:
        from . import buildarchive
        out.append(buildarchive.archive_dir())
    except Exception:
        pass
    try:
        from . import depot_cleanup
        for rec in depot_cleanup._read().values():
            p = str(rec.get("installPath") or "")
            if p:
                out.append(os.path.join(p, ".slsdeck_manifests"))
    except Exception:
        pass
    seen = []
    for p in out:
        if p and p not in seen:
            seen.append(p)
    return seen


def _registration_dir() -> str:
    try:
        from .steam import stplugin_dir
        return str(stplugin_dir() or "")
    except Exception:
        return ""


def _game_install_path(appid: int) -> str:
    try:
        from .steam import get_game_install_path_response
        r = get_game_install_path_response(int(appid)) or {}
        if r.get("success"):
            return str(r.get("installPath") or "")
    except Exception:
        pass
    return ""


def save() -> Dict[str, Any]:
    pins = _pin_maps()
    apps = _registered_apps()
    try:
        from . import settings
        builds = dict(settings.get_value("pinnedBuilds", {}) or {})
    except Exception:
        builds = {}

    # Archived builds are a deliberate, user-curated library: they must survive
    # even when no games are currently registered, so they count as content here.
    try:
        from . import buildarchive
        archived = buildarchive._read()
    except Exception:
        archived = {}

    path = backup_path()
    if not pins and not apps and not (archived.get("apps") or {}):
        # A deliberate remove-all must stay removed. Do not let a stale archive
        # resurrect games on the next install.
        try:
            if os.path.isfile(path):
                os.remove(path)
        except Exception:
            pass
        return {"success": True, "cleared": True}

    wanted = {
        f"{depot}_{gid}.manifest"
        for gids in pins.values()
        for depot, gid in gids.items()
    }
    try:
        from . import buildarchive
        wanted |= buildarchive.wanted_manifest_names()
    except Exception:
        pass
    tmp = path + ".tmp"
    try:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr(
                "state.json",
                json.dumps({"version": 2, "apps": apps, "pins": pins, "buildids": builds}, indent=2),
            )
            if archived.get("apps"):
                z.writestr("build_archive.json", json.dumps(archived, indent=2))

            found = set()
            for src in _manifest_sources():
                if not src or not os.path.isdir(src):
                    continue
                for name in wanted:
                    if name in found:
                        continue
                    fp = os.path.join(src, name)
                    if os.path.isfile(fp) and os.path.getsize(fp) > 0:
                        z.write(fp, f"manifests/{name}")
                        found.add(name)

            lua_count = 0
            reg_dir = _registration_dir()
            if reg_dir and os.path.isdir(reg_dir):
                for appid in apps:
                    fp = os.path.join(reg_dir, f"{appid}.lua")
                    if os.path.isfile(fp) and os.path.getsize(fp) > 0:
                        z.write(fp, f"registrations/{appid}.lua")
                        lua_count += 1

            fix_count = 0
            for appid in apps:
                game_dir = _game_install_path(int(appid))
                if not game_dir:
                    continue
                fp = os.path.join(game_dir, f"luatools-fix-log-{appid}.log")
                if os.path.isfile(fp) and os.path.getsize(fp) > 0:
                    z.write(fp, f"fix-history/{appid}.log")
                    fix_count += 1

        os.replace(tmp, path)
        try:
            from .utils import chown_to_user
            chown_to_user(path, recursive=False)
        except Exception:
            pass
        logger.log(
            f"SLSDeck: saved survival backup ({len(apps)} app(s), {len(pins)} pin map(s), "
            f"{len(found)} manifest(s), {lua_count} registration(s), {fix_count} fix log(s))"
        )
        return {
            "success": True, "apps": len(apps), "pins": len(pins),
            "manifests": len(found), "registrations": lua_count,
            "fixHistory": fix_count, "path": path,
        }
    except Exception as exc:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except Exception:
            pass
        logger.warn(f"SLSDeck: survival backup failed: {exc}")
        return {"success": False, "error": str(exc)}


def restore() -> Dict[str, Any]:
    global _RESTORING
    if _RESTORING:
        return {"success": True, "busy": True}
    path = backup_path()
    if not os.path.isfile(path):
        return {"success": True, "found": False}
    _RESTORING = True
    try:
        from . import settings, slssteam, downloads
        from .steam import depotcache_dir
        with zipfile.ZipFile(path, "r") as z:
            state = json.loads(z.read("state.json").decode("utf-8"))
            # Restore the archived-build library first: it is pure metadata, so
            # it cannot fail in a way that should block the rest of the restore.
            try:
                if "build_archive.json" in z.namelist():
                    from . import buildarchive
                    payload = json.loads(z.read("build_archive.json").decode("utf-8"))
                    if isinstance(payload, dict) and payload.get("apps"):
                        existing = buildarchive._read()
                        merged = existing.get("apps", {}) or {}
                        for aid, entry in (payload.get("apps") or {}).items():
                            tgt = merged.setdefault(aid, {"name": entry.get("name", ""), "builds": {}})
                            tgt.setdefault("builds", {}).update(entry.get("builds") or {})
                        buildarchive._write({"version": 1, "apps": merged})
            except Exception as exc:
                logger.warn(f"survival_backup: build archive restore failed: {exc}")
            pins = state.get("pins") or {}
            builds = state.get("buildids") or {}
            if "apps" in state:
                apps = state.get("apps") or {}
            else:
                # Backward compatibility with the original v1 archive.
                apps = {str(a): {"name": f"App {a}"} for a in pins.keys()}

            manifests_restored = 0
            for target in (slssteam.manifest_store_dir(), depotcache_dir()):
                if not target:
                    continue
                os.makedirs(target, exist_ok=True)
                for member in z.namelist():
                    if not member.startswith("manifests/") or member.endswith("/"):
                        continue
                    bn = os.path.basename(member)
                    dst = os.path.join(target, bn)
                    if not os.path.isfile(dst) or os.path.getsize(dst) == 0:
                        with z.open(member) as src, open(dst, "wb") as out:
                            shutil.copyfileobj(src, out)
                        manifests_restored += 1

            lua_restored = 0
            reg_dir = _registration_dir()
            if reg_dir:
                os.makedirs(reg_dir, exist_ok=True)
                for appid in apps:
                    member = f"registrations/{appid}.lua"
                    if member not in z.namelist():
                        continue
                    dst = os.path.join(reg_dir, f"{appid}.lua")
                    if not os.path.isfile(dst) or os.path.getsize(dst) == 0:
                        with z.open(member) as src, open(dst, "wb") as out:
                            shutil.copyfileobj(src, out)
                        lua_restored += 1

            fix_restored = 0
            for appid in apps:
                member = f"fix-history/{appid}.log"
                if member not in z.namelist():
                    continue
                game_dir = _game_install_path(int(appid))
                if not game_dir or not os.path.isdir(game_dir):
                    continue
                dst = os.path.join(game_dir, f"luatools-fix-log-{appid}.log")
                if not os.path.isfile(dst) or os.path.getsize(dst) == 0:
                    with z.open(member) as src, open(dst, "wb") as out:
                        shutil.copyfileobj(src, out)
                    fix_restored += 1

            for appid, buildid in builds.items():
                try:
                    settings.set_pinned_build(int(appid), str(buildid))
                except Exception:
                    pass

            registered = 0
            applied = 0
            try:
                moon = bool(slssteam.installed_lib_is_moon().get("moon"))
            except Exception:
                moon = False
            if moon:
                slssteam.ensure_config()
                for appid, meta in apps.items():
                    try:
                        aid = int(appid)
                        name = str((meta or {}).get("name") or f"App {appid}")
                        r = slssteam.add_app(aid, name)
                        if r.get("success"):
                            registered += 1
                            try:
                                downloads._append_loaded_app(aid, name)
                            except Exception:
                                pass
                    except Exception:
                        pass
                for appid, gids in pins.items():
                    try:
                        r = slssteam.pin_app_gids(
                            int(appid), {int(d): str(g) for d, g in gids.items()}
                        )
                        if r.get("success"):
                            applied += 1
                    except Exception:
                        pass

        logger.log(
            f"SLSDeck: restored survival backup ({registered} app registration(s), "
            f"{applied} pin(s), {manifests_restored} manifest copy/copies, "
            f"{lua_restored} lua registration(s), {fix_restored} fix log(s))"
        )
        return {
            "success": True, "found": True, "apps": registered, "pins": applied,
            "manifests": manifests_restored, "registrations": lua_restored,
            "fixHistory": fix_restored,
        }
    except Exception as exc:
        logger.warn(f"SLSDeck: survival backup restore failed: {exc}")
        return {"success": False, "error": str(exc)}
    finally:
        _RESTORING = False


def patch(slssteam: Any, downloads: Any) -> None:
    global _PATCHED
    if _PATCHED:
        return
    _PATCHED = True
    try:
        restore()
    except Exception:
        pass

    for name in ("pin_app_gids", "pin_app_current", "add_app", "remove_app"):
        original = getattr(slssteam, name, None)
        if not callable(original):
            continue

        def make_wrapper(fn):
            def wrapped(*args, **kwargs):
                r = fn(*args, **kwargs)
                try:
                    if isinstance(r, dict) and r.get("success") and not _RESTORING:
                        save()
                except Exception:
                    pass
                return r
            return wrapped
        setattr(slssteam, name, make_wrapper(original))

    original_status = slssteam.get_install_status
    def status_wrapped():
        r = original_status()
        try:
            st = r.get("state") or {}
            if st.get("status") == "done" and st.get("installed"):
                restore()
        except Exception:
            pass
        return r
    slssteam.get_install_status = status_wrapped

    original_final = downloads._finalize_registration
    def final_wrapped(appid, source_name):
        original_final(appid, source_name)
        try:
            save()
        except Exception:
            pass
    downloads._finalize_registration = final_wrapped
