"""A keepable library of specific game builds.

Pinning a build only records *which* gids you want; the material needed to
actually reconstruct that build later -- the manifest binaries and the depot
keys -- lives in places that expire. Hubcap's generator can produce any
depot+gid but needs a live key and network; the GitHub mirror archive only has
what people uploaded; and a lua's ``setManifestid`` pin can change the next time
the fix is republished. So a build that works today can quietly become
unreachable.

This module keeps a build once you have resolved it: the depot->gid map, the
matching ``.manifest`` binaries, and the depot keys, stored under the plugin's
own data directory. Entries ride along in ``survival_backup``'s zip, so they
survive plugin removal like the rest of the state.

It downloads no game content -- only the small metadata needed to fetch that
content again later.
"""

from __future__ import annotations

import json
import os
import shutil
import threading
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home

INDEX_NAME = "build_archive.json"
DIR_NAME = "build_archive"
_FIX_REAPPLY_LOCK = threading.Lock()
_FIX_REAPPLY_ACTIVE: set = set()


def _root() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return d


def archive_dir() -> str:
    """Where archived ``.manifest`` binaries live. Added to
    ``survival_backup._manifest_sources`` so ``save()`` sweeps it up."""
    d = os.path.join(_root(), DIR_NAME)
    os.makedirs(d, exist_ok=True)
    return d


def index_path() -> str:
    return os.path.join(_root(), INDEX_NAME)


def _material_status(build: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the material that makes an archived build self-contained."""
    gids = {str(d): str(g) for d, g in (build.get("gids") or {}).items()}
    keys = {str(d): str(k) for d, k in (build.get("keys") or {}).items()}
    missing_manifests, missing_keys = [], []
    for depot, gid in gids.items():
        name = f"{depot}_{gid}.manifest"
        if not os.path.isfile(os.path.join(archive_dir(), name)):
            missing_manifests.append(name)
        key = keys.get(depot, "")
        if len(key) != 64 or any(c not in "0123456789abcdefABCDEF" for c in key):
            missing_keys.append(depot)
    return {"complete": bool(gids) and not missing_manifests and not missing_keys,
            "missingManifests": missing_manifests, "missingKeys": missing_keys}


def _deploy_material(appid: int, build: Dict[str, Any]) -> Dict[str, Any]:
    """Deploy retained manifests and keys into slsteam-moon's live stores."""
    status = _material_status(build)
    if not status["complete"]:
        return {"success": False, **status, "error": "archived build is incomplete"}
    from . import slssteam, steam
    copied = 0
    for target in (slssteam.manifest_store_dir(), steam.depotcache_dir()):
        if not target:
            continue
        os.makedirs(target, exist_ok=True)
        for depot, gid in (build.get("gids") or {}).items():
            name = f"{depot}_{gid}.manifest"
            shutil.copy2(os.path.join(archive_dir(), name), os.path.join(target, name))
            copied += 1
        try:
            from .utils import chown_to_user
            chown_to_user(target, recursive=True)
        except Exception:
            pass
    cached = sum(1 for depot, key in (build.get("keys") or {}).items()
                 if slssteam.cache_depot_key(int(appid), int(depot), str(key)))
    if cached != len(build.get("gids") or {}):
        return {"success": False, **status, "copied": copied, "cachedKeys": cached,
                "error": "could not deploy every archived depot key"}
    return {"success": True, **status, "copied": copied, "cachedKeys": cached}


def _read() -> Dict[str, Any]:
    try:
        with open(index_path(), "r", encoding="utf-8") as fh:
            v = json.load(fh)
        if not isinstance(v, dict):
            return {}
        # v1 briefly allowed several independently-managed builds per game.
        # A record is now one game snapshot, so collapse legacy records to the
        # active build, or otherwise the most recently archived build.
        for entry in (v.get("apps", {}) or {}).values():
            builds = entry.get("builds") or {}
            if len(builds) > 1:
                active = str(entry.get("activeBuild") or "")
                chosen = builds.get(active)
                if not chosen:
                    chosen = max(builds.values(),
                                 key=lambda b: float(b.get("archivedAt") or 0))
                entry["builds"] = {str(chosen.get("buildid")): chosen}
                if active and active != str(chosen.get("buildid")):
                    entry["activeBuild"] = str(chosen.get("buildid"))
            for fix in entry.get("fixes") or []:
                fix["wanted"] = True
        return v
    except Exception:
        return {}


def _write(data: Dict[str, Any]) -> bool:
    try:
        tmp = index_path() + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=1)
        os.replace(tmp, index_path())
        try:
            from .utils import chown_to_user
            chown_to_user(index_path(), recursive=False)
        except Exception:
            pass
        return True
    except Exception as exc:
        logger.warn(f"buildarchive: could not write index: {exc}")
        return False


def add_build(appid: int, buildid: str, gids: Dict[str, str],
              date: str = "", name: str = "") -> Dict[str, Any]:
    """Archive one build: its gids, its manifest binaries, and its depot keys.

    ``gids`` is the {depot: gid} map the caller already resolved (the SteamDB
    per-depot scrape is the authoritative source -- see depotmap's notes on why
    appinfo and lua pins are not). Manifests are fetched through depotdl's
    resolver, which prefers Hubcap's generator and falls back to the mirror
    archive; whatever it cannot get is reported rather than silently skipped, so
    a half-archived build is never mistaken for a complete one.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    clean = {str(d): str(g) for d, g in (gids or {}).items()
             if str(d).isdigit() and str(g).isdigit()}
    if not clean:
        return {"success": False, "error": "no depot:gid pairs to archive"}
    previous_data = _read()
    previous_entry = (previous_data.get("apps", {}) or {}).get(str(appid)) or {}
    if previous_entry.get("activeBuild"):
        return {"success": False,
                "error": "deactivate this game snapshot before replacing its recorded build"}

    # Depot keys: build-independent, so one copy per depot is enough forever.
    keys: Dict[str, str] = {}
    try:
        from . import depotdl
        keys = {d: k for d, k in (depotdl._keys_for(appid) or {}).items()
                if d in clean and len(str(k)) == 64
                and all(c in "0123456789abcdefABCDEF" for c in str(k))}
    except Exception as exc:
        logger.warn(f"buildarchive: key lookup failed for {appid}: {exc}")

    dest = archive_dir()
    stored: List[str] = []
    missing: List[str] = []
    for depot, gid in clean.items():
        fname = f"{depot}_{gid}.manifest"
        if os.path.isfile(os.path.join(dest, fname)):
            stored.append(fname)
            continue
        try:
            from . import depotdl
            got = depotdl._fetch_manifest_file(depot, gid, dest)
        except Exception as exc:
            logger.warn(f"buildarchive: manifest fetch failed for {fname}: {exc}")
            got = None
        if got:
            stored.append(os.path.basename(got))
        else:
            missing.append(fname)

    missing_keys = sorted(set(clean) - set(keys))
    if missing or missing_keys:
        return {"success": False, "incomplete": True,
                "error": "a game snapshot requires every manifest and depot key",
                "appid": appid, "buildid": str(buildid), "depots": len(clean),
                "manifests": len(stored), "keys": len(keys),
                "missingManifests": sorted(set(missing)),
                "missingKeys": missing_keys, "complete": False}

    data = _read()
    apps = data.setdefault("apps", {})
    entry = apps.setdefault(str(appid), {"name": name or "", "builds": {}})
    if name:
        entry["name"] = name
    old_manifests = {m for b in (entry.get("builds") or {}).values()
                     for m in (b.get("manifests") or [])}
    new_build = {
        "buildid": str(buildid),
        "date": str(date or ""),
        "gids": clean,
        "keys": keys,
        "manifests": sorted(set(stored)),
        "missingManifests": sorted(set(missing)),
        # Admission date: when this build was committed to the archive. Distinct
        # from "date", which is the build's own release date on SteamDB -- an
        # entry can be added years after the build shipped, and when you added it
        # is what tells you how stale the archived material might be.
        "archivedAt": time.time(),
        "archivedOn": time.strftime("%Y-%m-%d %H:%M", time.localtime()),
    }
    # A game record has one build component. Re-archiving starts a fresh game
    # snapshot: optional components are cleared, then snapshot_game captures
    # whichever of them are available now. This prevents mixing a new build
    # with fixes or arguments retained from the previous snapshot.
    entry["builds"] = {str(buildid): new_build}
    for optional in ("fixes", "launchOptions", "compatTool", "dlcFiles", "updatedOn"):
        entry.pop(optional, None)
    data["version"] = 2
    if not _write(data):
        return {"success": False, "error": "could not write the archive index"}
    still_used = wanted_manifest_names()
    for fname in old_manifests - still_used:
        try:
            os.remove(os.path.join(archive_dir(), fname))
        except Exception:
            pass

    logger.log(f"buildarchive: archived build {buildid} for {appid} "
               f"({len(clean)} depot(s), {len(stored)} manifest(s), {len(missing)} missing)")
    return {
        "success": True, "appid": appid, "buildid": str(buildid),
        "depots": len(clean), "manifests": len(stored), "keys": len(keys),
        "missingManifests": missing,
        "archivedOn": entry["builds"][str(buildid)]["archivedOn"],
        # Honest about completeness: without every manifest this build cannot be
        # rebuilt offline later.
        "complete": not missing and len(keys) == len(clean),
    }


def list_builds(appid: int = 0) -> Dict[str, Any]:
    data = _read()
    apps = data.get("apps", {}) or {}
    if appid:
        entry = apps.get(str(int(appid))) or {"name": "", "builds": {}}
        builds = sorted(entry.get("builds", {}).values(),
                        key=lambda b: str(b.get("date") or ""), reverse=True)
        return {"success": True, "appid": int(appid), "name": entry.get("name", ""),
                "builds": builds}
    out = []
    for aid, entry in apps.items():
        for b in (entry.get("builds", {}) or {}).values():
            out.append({"appid": int(aid), "name": entry.get("name", ""), **b})
    out.sort(key=lambda b: float(b.get("archivedAt") or 0), reverse=True)
    return {"success": True, "builds": out, "count": len(out)}


def remove_build(appid: int, buildid: str) -> Dict[str, Any]:
    """Compatibility endpoint: removing the build removes the game snapshot."""
    entry = (_read().get("apps", {}) or {}).get(str(int(appid))) or {}
    if str(buildid) not in (entry.get("builds") or {}):
        return {"success": False, "error": "that build is not in the game snapshot"}
    if entry.get("activeBuild"):
        return {"success": False,
                "error": "deactivate the game snapshot in Archive before unarchiving it"}
    return remove_game(int(appid))


# ── per-game snapshot: required build + optional captured state ──────────────
#
# The build material is mandatory; fixes, launch arguments, compatibility tool
# and DLC state are optional fields captured at the same moment. Components are
# never independently archived or removed.

def _fix_key(fix: Dict[str, Any]) -> str:
    return f"{fix.get('fixType') or ''}|{fix.get('downloadUrl') or ''}"


def snapshot_game(appid: int, launch_options: Optional[str] = None, compat_tool: str = "",
                  name: str = "") -> Dict[str, Any]:
    """Record a game's current fix/launch/compat state into its archive entry.

    ``launch_options`` comes from the frontend: Steam owns it (SetAppLaunchOptions)
    and there is no backend read for it, so it is passed in rather than guessed.
    This finalizes the optional fields immediately after add_build establishes
    the mandatory build component.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}

    live: List[Dict[str, Any]] = []
    fixes_known = False
    try:
        from . import fixes as _fixes
        r = _fixes.get_installed_fixes()
        if r.get("success"):
            fixes_known = True
            live = [f for f in r.get("fixes", []) if int(f.get("appid") or 0) == appid]
    except Exception as exc:
        logger.warn(f"buildarchive: fix scan failed for {appid}: {exc}")

    compat_known = bool(compat_tool)
    if not compat_tool:
        try:
            from . import compat
            cm = compat.get_proton_mapping(appid) or {}
            compat_tool = str(cm.get("toolName") or "")
            compat_known = True
        except Exception:
            compat_tool = ""
            compat_known = False

    dlc_files = 0
    dlc_known = False
    try:
        from . import depotdl
        from . import dlcdepot
        ip = dlcdepot._install_path(appid)
        if ip:
            dlc_known = True
            p = depotdl.dlc_log_path(appid, ip)
            if os.path.isfile(p):
                with open(p, "r", encoding="utf-8") as fh:
                    dlc_files = len(json.load(fh).get("created") or [])
    except Exception:
        dlc_files = 0

    data = _read()
    apps = data.setdefault("apps", {})
    entry = apps.get(str(appid))
    if not entry or not (entry.get("builds") or {}):
        return {"success": False,
                "error": "archive the complete game build before recording optional snapshot fields"}
    if name:
        entry["name"] = name
    merged: List[Dict[str, Any]] = []
    for f in live:
        key = _fix_key(f)
        merged.append({
            "key": key,
            "fixType": f.get("fixType") or "",
            "downloadUrl": f.get("downloadUrl") or "",
            "date": f.get("date") or "",
            "files": int(f.get("filesCount") or 0),
            "wanted": True,
            "appliedAt": time.strftime("%Y-%m-%d %H:%M", time.localtime()),
        })

    if fixes_known:
        entry["fixes"] = merged
    # Tri-state: "" means Steam positively reported no launch arguments; None
    # means this Steam build could not expose them, so retain the last known
    # game-level value rather than replacing it with invented information.
    if launch_options is not None:
        entry["launchOptions"] = str(launch_options)
    if compat_known:
        entry["compatTool"] = str(compat_tool or "")
    if dlc_known:
        entry["dlcFiles"] = dlc_files
    entry["updatedOn"] = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    data["version"] = 2
    if not _write(data):
        return {"success": False, "error": "could not write the archive index"}
    return {"success": True, "appid": appid, "fixes": len(merged),
            "launchOptions": entry.get("launchOptions") or "",
            "hasLaunchOptions": "launchOptions" in entry,
            "compatTool": entry.get("compatTool") or "",
            "hasCompatTool": "compatTool" in entry,
            "dlcFiles": dlc_files}


def set_fix_wanted(appid: int, key: str, wanted: bool) -> Dict[str, Any]:
    return {"success": False,
            "error": "fixes belong to the game snapshot and cannot be changed separately"}


def forget_fix(appid: int, key: str) -> Dict[str, Any]:
    return {"success": False,
            "error": "fixes belong to the game snapshot and cannot be removed separately"}


def entries() -> Dict[str, Any]:
    """Every archived game, for the Archive page."""
    data = _read()
    out = []
    for aid, entry in (data.get("apps", {}) or {}).items():
        builds = sorted((entry.get("builds") or {}).values(),
                        key=lambda b: float(b.get("archivedAt") or 0), reverse=True)
        fixes = entry.get("fixes") or []
        out.append({
            "appid": int(aid),
            "name": entry.get("name") or "",
            "builds": builds,
            "buildCount": len(builds),
            "fixes": fixes,
            "hasFixState": "fixes" in entry,
            "fixCount": len(fixes),
            "wantedFixes": sum(1 for f in fixes if f.get("wanted")),
            "launchOptions": entry.get("launchOptions") or "",
            "compatTool": entry.get("compatTool") or "",
            "dlcFiles": int(entry.get("dlcFiles") or 0),
            "hasDlcState": "dlcFiles" in entry,
            "updatedOn": entry.get("updatedOn") or "",
            "activeBuild": str(entry.get("activeBuild") or ""),
        })
    out.sort(key=lambda e: (e["name"] or str(e["appid"])).lower())
    return {"success": True, "entries": out, "count": len(out)}


def pending_reapply(appid: int) -> Dict[str, Any]:
    """Fixes this game is flagged to want but does not currently have.

    What a restore should act on. Reporting only -- applying stays with the
    normal fix path, which knows how to fetch and install a fix properly."""
    data = _read()
    entry = (data.get("apps", {}) or {}).get(str(int(appid)))
    if not entry:
        return {"success": True, "pending": []}
    live_keys = set()
    try:
        from . import fixes as _fixes
        r = _fixes.get_installed_fixes()
        if r.get("success"):
            live_keys = {_fix_key(f) for f in r.get("fixes", [])
                         if int(f.get("appid") or 0) == int(appid)}
    except Exception:
        pass
    pending = [f for f in (entry.get("fixes") or [])
               if f.get("wanted") and f.get("key") not in live_keys]
    return {"success": True, "pending": pending, "count": len(pending)}


def _fix_reapply_worker(appid: int, install_path: str, name: str,
                        pending: List[Dict[str, Any]]) -> None:
    """Run installers serially because their status and destination are shared."""
    try:
        from . import fixes as _fixes
        for fix in pending:
            url = str(fix.get("downloadUrl") or "")
            if not url:
                continue
            result = _fixes.apply_game_fix(appid, url, install_path,
                                           fix.get("fixType") or "", name, no_pin=True) or {}
            if not result.get("success"):
                logger.warn(f"buildarchive: fix queue rejected for {appid}: {result.get('error')}")
                continue
            deadline = time.time() + 900
            while time.time() < deadline:
                state = (_fixes.get_apply_fix_status(appid) or {}).get("state") or {}
                if state.get("status") in ("done", "failed", "cancelled"):
                    break
                time.sleep(1)
            else:
                logger.warn(f"buildarchive: fix re-apply timed out for {appid}")
    finally:
        with _FIX_REAPPLY_LOCK:
            _FIX_REAPPLY_ACTIVE.discard(int(appid))


def _start_fix_reapply_queue(appid: int, install_path: str, name: str,
                             pending: List[Dict[str, Any]]) -> bool:
    try:
        from . import fixes as _fixes
        state = (_fixes.get_apply_fix_status(int(appid)) or {}).get("state") or {}
        if state.get("status") in ("queued", "downloading", "extracting"):
            return False
    except Exception:
        pass
    with _FIX_REAPPLY_LOCK:
        if int(appid) in _FIX_REAPPLY_ACTIVE:
            return False
        _FIX_REAPPLY_ACTIVE.add(int(appid))
    threading.Thread(target=_fix_reapply_worker,
                     args=(int(appid), install_path, name, list(pending)),
                     name=f"archive-fixes-{appid}", daemon=True).start()
    return True


# ── activation: an archived build as a live template ─────────────────────────
#
# Activating restores the entire game snapshot. The mandatory build is pinned;
# every optional captured component is then reconciled when present.

def is_build_archived(appid: int, buildid: str) -> Dict[str, Any]:
    entry = (_read().get("apps", {}) or {}).get(str(int(appid))) or {}
    builds = entry.get("builds") or {}
    return {"success": True, "archived": str(buildid) in builds,
            "active": str(entry.get("activeBuild") or "") == str(buildid),
            "activeBuild": str(entry.get("activeBuild") or "")}


def activate(appid: int, buildid: str,
             launch_options_before: Optional[str] = None) -> Dict[str, Any]:
    """Mark an archived build as the template this game should match.

    Captures what the game looked like BEFORE activation -- its launch arguments
    and its compat-tool mapping -- so deactivating restores that state instead
    of blanking it. This is what gives Proton and native-Linux games the same
    behaviour: a Proton game gets its tool put back, a native game gets its
    (absent) mapping put back, and neither is left in a state the template
    invented.
    """
    data = _read()
    entry = (data.get("apps", {}) or {}).get(str(int(appid)))
    builds = (entry or {}).get("builds") or {}
    if not entry or str(buildid) not in builds:
        return {"success": False, "error": "that game snapshot is not archived"}
    try:
        material = _deploy_material(int(appid), builds[str(buildid)])
    except Exception as exc:
        material = {"success": False, "error": str(exc)}
    if not material.get("success"):
        return {"success": False, "error": material.get("error", "archive material unavailable"),
                "missingManifests": material.get("missingManifests", []),
                "missingKeys": material.get("missingKeys", [])}
    if not entry.get("activeBuild"):
        # Only snapshot the "before" state on a fresh activation -- switching
        # between two archived builds must not overwrite the original.
        before_tool = ""
        before_tool_known = False
        try:
            from . import compat
            before_tool = str((compat.get_proton_mapping(int(appid)) or {}).get("toolName") or "")
            before_tool_known = True
        except Exception:
            before_tool = ""
        if before_tool_known:
            entry["compatToolBefore"] = before_tool
        if launch_options_before is not None:
            entry["launchOptionsBefore"] = str(launch_options_before)
    # activeBuild doubles as the activation marker for backward compatibility.
    previous = str(entry.get("activeBuild") or "")
    if previous and previous != str(buildid):
        try:
            from . import slssteam
            slssteam.purge_pins_for_app(int(appid))
        except Exception as exc:
            logger.warn(f"buildarchive: could not clear the previous pin for {appid}: {exc}")
    entry["activeBuild"] = str(buildid)
    entry["activatedOn"] = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    _write(data)
    logger.log(f"buildarchive: activated build {buildid} for {appid}"
               + (f" (replacing {previous})" if previous and previous != str(buildid) else ""))
    return {"success": True, "activeBuild": str(buildid), "replaced": previous}


def deactivate(appid: int, reset: bool = True) -> Dict[str, Any]:
    """Stop trailing, and undo what activation put in place.

    Unpins the manifest and clears the recorded launch arguments/target path.
    ``reset`` additionally asks Steam to restore the game's files (the "Reset
    files" flow) -- the caller triggers that, since it is Steam-side work.
    Fix files are NOT deleted here: use the Fixes tab's un-fix for that, which
    knows how to restore the originals it replaced.
    """
    data = _read()
    entry = (data.get("apps", {}) or {}).get(str(int(appid)))
    if not entry:
        return {"success": False, "error": "no archive entry for that game"}
    was = str(entry.get("activeBuild") or "")
    launch_before_known = "launchOptionsBefore" in entry
    restore_args = str(entry.get("launchOptionsBefore") or "")
    compat_before_known = "compatToolBefore" in entry
    restore_tool = str(entry.get("compatToolBefore") or "")
    entry["activeBuild"] = ""
    entry["deactivatedOn"] = time.strftime("%Y-%m-%d %H:%M", time.localtime())
    entry.pop("compatToolBefore", None)
    entry.pop("launchOptionsBefore", None)
    _write(data)

    # Put the compat tool back exactly as it was before activation. Restoring an
    # EMPTY tool means removing the override, which is the correct end state for
    # a native Linux game -- the same code path serves both.
    if compat_before_known:
        try:
            from . import compat
            if restore_tool:
                compat.set_proton_mapping(int(appid), restore_tool)
            else:
                compat.remove_proton_mapping(int(appid))
        except Exception as exc:
            logger.warn(f"buildarchive: compat tool restore failed for {appid}: {exc}")

    unpinned = False
    try:
        from . import slssteam
        r = slssteam.purge_pins_for_app(int(appid))
        unpinned = bool((r or {}).get("success"))
    except Exception as exc:
        logger.warn(f"buildarchive: unpin failed for {appid}: {exc}")
    logger.log(f"buildarchive: deactivated build {was or '?'} for {appid}")
    return {"success": True, "was": was, "unpinned": unpinned,
            # The frontend owns launch options and the Reset-files trigger.
            # restoreLaunchOptions is what the game had BEFORE activation -- an
            # empty string legitimately means "it had none", so the frontend
            # always writes this value rather than treating "" as "skip".
            "clearLaunchOptions": launch_before_known,
            "restoreLaunchOptions": restore_args,
            "restoredCompatTool": restore_tool,
            "resetFiles": bool(reset)}


def reconcile(appid: int, apply: bool = True) -> Dict[str, Any]:
    """Compare the game against its active template and close the gaps.

    Reports every check so the UI can explain itself; with ``apply=False`` it
    only reports. Never touches a game with no active build.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    entry = (_read().get("apps", {}) or {}).get(str(appid)) or {}
    active = str(entry.get("activeBuild") or "")
    if not active:
        return {"success": True, "active": "", "skipped": "no active build"}
    build = (entry.get("builds") or {}).get(active) or {}
    actions: List[str] = []
    todo: List[str] = []

    # 1) Installed at all? A template trails the library: if the game is not
    #    there yet, everything else waits rather than erroring.
    install_path = ""
    try:
        from . import dlcdepot
        install_path = dlcdepot._install_path(appid)
    except Exception:
        install_path = ""
    if not install_path:
        return {"success": True, "active": active, "installed": False,
                "waiting": "game is not installed — the template will apply once it is",
                "actions": actions, "todo": todo}

    # 2) Correct build pinned?
    want_gids = {str(d): str(g) for d, g in (build.get("gids") or {}).items()}
    if want_gids and apply:
        try:
            material = _deploy_material(appid, build)
        except Exception as exc:
            material = {"success": False, "error": str(exc)}
        if not material.get("success"):
            return {"success": False, "active": active, "installed": True,
                    "error": material.get("error", "could not deploy archived build"),
                    "missingManifests": material.get("missingManifests", []),
                    "missingKeys": material.get("missingKeys", []),
                    "actions": actions, "todo": todo}
    have = {}
    try:
        from . import steam
        have = {str(k): str(v) for k, v in (steam.get_installed_depots(appid) or {}).items()}
    except Exception:
        have = {}
    mismatched = {d: g for d, g in want_gids.items() if have.get(d) != g}
    if mismatched:
        todo.append(f"{len(mismatched)} depot(s) not on build {active}")
        if apply:
            try:
                from . import slssteam
                pin = slssteam.pin_app_gids(appid, {int(d): g for d, g in want_gids.items()}) or {}
                if not pin.get("success"):
                    return {"success": False, "active": active, "installed": True,
                            "error": pin.get("error", "could not pin archived build"),
                            "actions": actions, "todo": todo, "pinnedOk": False}
                actions.append(f"pinned build {active}")
            except Exception as exc:
                logger.warn(f"buildarchive: pin failed for {appid}: {exc}")
                return {"success": False, "active": active, "installed": True,
                        "error": f"could not pin archived build: {exc}",
                        "actions": actions, "todo": todo, "pinnedOk": False}

    # 3) Flagged fixes that are not currently applied.
    pend = pending_reapply(appid).get("pending") or []
    for f in pend:
        url = f.get("downloadUrl") or ""
        if not url:
            todo.append(f"fix {f.get('fixType') or f.get('key')} has no source URL recorded")
            continue
        todo.append(f"fix {f.get('fixType') or 'unknown'} missing")
    runnable = [f for f in pend if f.get("downloadUrl")]
    if apply and runnable:
        if _start_fix_reapply_queue(appid, install_path, entry.get("name") or "", runnable):
            actions.append(f"queued {len(runnable)} fix re-application(s)")
        else:
            todo.append("fix re-application is already running")

    # 4) DLC content: fetch once, only if the archive recorded some and the
    #    game has no DLC log yet. Re-running would be wasted bandwidth.
    dlc_wanted = int(entry.get("dlcFiles") or 0)
    dlc_have = 0
    try:
        from . import depotdl
        p = depotdl.dlc_log_path(appid, install_path)
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8") as fh:
                dlc_have = len(json.load(fh).get("created") or [])
    except Exception:
        dlc_have = 0
    if dlc_wanted and not dlc_have:
        todo.append(f"{dlc_wanted} DLC file(s) recorded but not downloaded")
        if apply:
            try:
                from . import dlcdepot
                dlcdepot.start(appid)
                actions.append("started the DLC download")
            except Exception as exc:
                logger.warn(f"buildarchive: DLC fetch failed for {appid}: {exc}")

    # 5) Compat tool. Applied here rather than reported, so Proton and native
    #    Linux games behave identically: a recorded tool is forced, and a
    #    recorded EMPTY tool means "no override" -- which is what a native Linux
    #    game needs, and what a Proton game reverts to if its template says so.
    has_tool = "compatTool" in entry
    want_tool = str(entry.get("compatTool") or "")
    if has_tool:
        try:
            from . import compat
            have_tool = str((compat.get_proton_mapping(appid) or {}).get("toolName") or "")
            if want_tool and have_tool != want_tool:
                todo.append(f"Proton tool is {have_tool or 'default'}, template wants {want_tool}")
                if apply:
                    compat.set_proton_mapping(appid, want_tool)
                    actions.append(f"set Proton to {want_tool}")
            elif not want_tool and have_tool:
                todo.append(f"Proton tool {have_tool} set, template wants the default (native)")
                if apply:
                    compat.remove_proton_mapping(appid)
                    actions.append("cleared the Proton override")
        except Exception as exc:
            logger.warn(f"buildarchive: compat tool reconcile failed for {appid}: {exc}")

    # 6) Launch arguments are Steam-owned (SetAppLaunchOptions); report what
    #    they should be and let the frontend set them.
    return {
        "success": True, "active": active, "installed": True,
        "actions": actions, "todo": todo,
        "wantLaunchOptions": entry.get("launchOptions") or "",
        "hasLaunchOptions": "launchOptions" in entry,
        "wantCompatTool": entry.get("compatTool") or "",
        "hasCompatTool": has_tool,
        "pinnedOk": not mismatched,
        "dlcPending": bool(dlc_wanted and not dlc_have),
    }


def remove_game(appid: int) -> Dict[str, Any]:
    """Unarchive a whole game: every build, its fix flags, launch args and
    compat tool -- the entire snapshot.

    Deactivates first if the game was active, so nothing is left half-applied:
    dropping the template while the game is still pinned to it would leave it
    held to a build that no longer exists anywhere in the UI. Manifests shared
    with another game's archived build are kept.
    """
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}

    deactivated: Dict[str, Any] = {}
    pre = (_read().get("apps", {}) or {}).get(str(appid)) or {}
    if not pre:
        return {"success": False, "error": "that game is not archived"}
    if str(pre.get("activeBuild") or ""):
        deactivated = deactivate(appid, reset=True)

    data = _read()
    apps = data.get("apps", {}) or {}
    entry = apps.pop(str(appid), None) or {}
    doomed = {m for b in (entry.get("builds") or {}).values()
              for m in (b.get("manifests") or [])}
    still_used = {
        m
        for e in apps.values()
        for b in (e.get("builds") or {}).values()
        for m in (b.get("manifests") or [])
    }
    removed = 0
    for fname in doomed - still_used:
        try:
            os.remove(os.path.join(archive_dir(), fname))
            removed += 1
        except Exception:
            pass
    _write(data)
    logger.log(f"buildarchive: unarchived game {appid} "
               f"({len(entry.get('builds') or {})} build(s), {removed} manifest(s) freed)")
    return {"success": True, "appid": appid,
            "builds": len(entry.get("builds") or {}),
            "removedManifests": removed,
            "deactivated": deactivated}


def activate_game(appid: int,
                  launch_options_before: Optional[str] = None) -> Dict[str, Any]:
    """Activate a game's archived build without naming one.

    With a single archived build the choice is obvious; with several the newest
    is used, because that is the one the user most recently decided was worth
    keeping. Picking a specific older build stays available per build.
    """
    entry = (_read().get("apps", {}) or {}).get(str(int(appid))) or {}
    builds = entry.get("builds") or {}
    if not builds:
        return {"success": False, "error": "that game snapshot has no complete archived build"}
    newest = sorted(builds.values(), key=lambda b: float(b.get("archivedAt") or 0),
                    reverse=True)[0]
    r = activate(int(appid), str(newest.get("buildid")), launch_options_before)
    r["chosen"] = str(newest.get("buildid"))
    r["ofBuilds"] = len(builds)
    return r


def active_templates() -> List[int]:
    """AppIDs currently held to an archived build."""
    return [int(aid) for aid, e in (_read().get("apps", {}) or {}).items()
            if str(e.get("activeBuild") or "")]


def reconcile_all(apply: bool = True) -> Dict[str, Any]:
    """Boot sweep: re-check every activated game and close any gaps.

    This is what makes activation persistent rather than a one-shot. A Steam
    update can unpin a game, an update can replace fixed files, DLC content can
    be missing after a verify -- so the template is re-asserted on every start
    instead of only when the button was pressed. Idempotent: a game that already
    matches produces no actions.
    """
    out = []
    for appid in active_templates():
        try:
            r = reconcile(appid, apply=apply)
            if r.get("installed") or r.get("actions") or r.get("todo") or r.get("waiting"):
                out.append({"appid": appid, **r})
        except Exception as exc:
            logger.warn(f"buildarchive: boot reconcile failed for {appid}: {exc}")
    if out:
        logger.log(f"buildarchive: boot reconcile touched {len(out)} game(s)")
    return {"success": True, "checked": len(active_templates()), "results": out}


def wanted_manifest_names() -> set:
    """Manifest filenames the archive wants preserved -- consumed by
    ``survival_backup.save`` so archived builds ride along in its zip."""
    out: set = set()
    for entry in (_read().get("apps", {}) or {}).values():
        for b in (entry.get("builds") or {}).values():
            out.update(b.get("manifests") or [])
            for depot, gid in (b.get("gids") or {}).items():
                out.add(f"{depot}_{gid}.manifest")
    return out
