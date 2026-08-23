"""DLC content acquisition: plan which DLC depots to fetch, then fetch them.

The problem
-----------
The unlockers (SmokeAPI / CreamAPI / CreamySteamy / Uplay R1+R2) only answer
ownership questions inside the game process. Steam is never told, so Steam will
never download a DLC's depots -- which is fine for the many DLC that are pure
entitlement, and useless for the ones that ship actual files. For those, the
bytes have to arrive out of band. That is what this module plans.

It deliberately does NOT check ownership of anything. It answers two questions:
*which DLC have real content*, and *what of that is not already on disk*.

Nothing is assumed about the game
---------------------------------
An earlier design assumed "the base game is installed and running under Proton".
That is false for a native Linux title, for a dual-platform game currently on
its Linux depots, for a game installed but never launched, and for a game that
is not installed at all -- and acting on it would drop Windows DLC files into a
native Linux install. So the platform is DETECTED from disk, never inferred,
via two independent signals that are reported separately when they disagree:

  1. the ``oslist`` of the depots Steam actually installed (ground truth for
     what is on disk), and
  2. which Steam API library is present in the game tree -- ``steam_api64.dll``
     (Windows/Proton), ``libsteam_api.so`` (native Linux), or an Uplay loader
     (Ubisoft, where SmokeAPI is refused anyway).

Signal 2 is the more directly useful one, because it names the unlocker as well
as the platform.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from .logger import logger
from . import steam, depotmap

# Steam API libraries, mapped to (platform, which unlocker family applies).
_PROBES = (
    ("steam_api64.dll", "windows", "steam"),
    ("steam_api.dll", "windows", "steam"),
    ("libsteam_api.so", "linux", "steam-native"),
    ("upc_r2_loader64.dll", "windows", "uplay_r2"),
    ("upc_r2_loader.dll", "windows", "uplay_r2"),
    ("uplay_r1_loader64.dll", "windows", "uplay_r1"),
    ("uplay_r1_loader.dll", "windows", "uplay_r1"),
)

# Our own proxies / backups, so a game we already patched is not mistaken for
# a fresh one (SmokeAPI moves the original to *_o.dll, CreamySteamy to
# steam_api_o.so and stashes libsteam_api.so.slsdeck-orig).
_IGNORE_SUFFIXES = ("_o.dll", "_o.so", ".slsdeck-orig", ".bak")


def _install_path(appid: int) -> str:
    try:
        r = steam.get_game_install_path_response(int(appid)) or {}
    except Exception as exc:
        logger.warn(f"dlcdepot: install path lookup failed for {appid}: {exc}")
        return ""
    return str(r.get("installPath") or r.get("path") or "") if r.get("success") else ""


def _probe_libraries(install_path: str) -> List[Dict[str, str]]:
    """Every Steam API / Uplay library in the game tree, with what it implies.
    Walks once and matches basenames -- cheaper and less brittle than calling
    each unlocker module's own finder, and it sees ALL of them at once, which is
    what lets us notice a game that carries more than one."""
    found: List[Dict[str, str]] = []
    seen: set = set()
    if not install_path or not os.path.isdir(install_path):
        return found
    try:
        for root, _dirs, files in os.walk(install_path):
            lower = {f.lower(): f for f in files}
            for base, platform, family in _PROBES:
                real = lower.get(base)
                if not real:
                    continue
                if any(real.lower().endswith(s) for s in _IGNORE_SUFFIXES):
                    continue
                key = (base, family)
                if key in seen:
                    continue
                seen.add(key)
                found.append({"file": base, "platform": platform, "family": family,
                              "path": os.path.join(root, real)})
    except Exception as exc:
        logger.warn(f"dlcdepot: library probe failed under {install_path}: {exc}")
    return found


def _installed_platform(appid: int, depots: Dict[str, str]) -> str:
    """Platform implied by the depots Steam actually installed."""
    if not depots:
        return ""
    try:
        info = depotmap.describe(int(appid))
    except Exception:
        return ""
    if not info.get("success"):
        return ""
    by_id = {str(d["depot"]): d for d in info.get("depots", [])}
    seen: set = set()
    for depot_id in depots:
        rec = by_id.get(str(depot_id))
        os_list = (rec or {}).get("oslist") or ""
        for part in str(os_list).split(","):
            part = part.strip().lower()
            if part:
                seen.add(part)
    if len(seen) == 1:
        return next(iter(seen))
    if "windows" in seen:
        # Mixed (e.g. a shared content depot with no oslist plus windows
        # binaries). Windows wins because the binaries decide how it runs.
        return "windows"
    return next(iter(seen)) if seen else ""


def detect_target(appid: int) -> Dict[str, Any]:
    """What is actually installed, and which unlocker applies. Detects; never
    assumes. ``platform`` is "" when we genuinely cannot tell -- callers must
    treat that as "stop and ask", not as a default."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}

    install_path = _install_path(appid)
    installed_depots = {}
    try:
        installed_depots = steam.get_installed_depots(appid) or {}
    except Exception:
        installed_depots = {}

    if not install_path and not installed_depots:
        return {"success": False, "installed": False, "appid": appid,
                "error": "that game is not installed — install it first, then fetch its DLC content"}

    libs = _probe_libraries(install_path)
    lib_platforms = sorted({l["platform"] for l in libs})
    depot_platform = _installed_platform(appid, installed_depots)

    # Reconcile the two signals rather than silently preferring one.
    conflict = ""
    if lib_platforms and depot_platform and depot_platform not in lib_platforms:
        conflict = (f"installed depots look {depot_platform}, but the game tree contains "
                    f"{', '.join(l['file'] for l in libs)}")
    platform = (lib_platforms[0] if len(lib_platforms) == 1
                else (depot_platform or (lib_platforms[0] if lib_platforms else "")))

    families = sorted({l["family"] for l in libs})
    if "uplay_r2" in families:
        unlocker = "uplay_r2"
    elif "uplay_r1" in families:
        unlocker = "uplay_r1"
    elif "steam-native" in families:
        unlocker = "creamysteamy"
    elif "steam" in families:
        unlocker = "smokeapi"
    else:
        unlocker = ""

    return {
        "success": True, "installed": True, "appid": appid,
        "installPath": install_path,
        "platform": platform,
        "unlocker": unlocker,
        "libraries": libs,
        "installedDepots": installed_depots,
        "depotPlatform": depot_platform,
        "conflict": conflict,
        "note": ("" if platform else
                 "could not determine the platform — no Steam API library found and "
                 "the installed depots do not declare an oslist"),
    }


def _hubcap_key_present() -> bool:
    try:
        from .settings import get_api_key_for
        return bool(get_api_key_for("<moapikey>"))
    except Exception:
        return False


def plan(appid: int) -> Dict[str, Any]:
    """Which DLC depots would actually be downloaded, and why the rest are not.

    Every exclusion is reported rather than silently applied, because "nothing
    happened" is the failure mode this whole feature exists to avoid.
    """
    target = detect_target(appid)
    if not target.get("success"):
        return target
    platform = target.get("platform") or ""

    content = depotmap.dlc_content(int(appid))
    if not content.get("success"):
        return {"success": False, "error": content.get("error", "could not read DLC info"),
                "target": target}

    installed = {str(k): str(v) for k, v in (target.get("installedDepots") or {}).items()}
    fetch: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []

    for entry in content.get("files", []):
        keep: List[Dict[str, Any]] = []
        for rec in entry.get("depots", []):
            depot = str(rec.get("depot"))
            os_list = str(rec.get("oslist") or "").lower()
            # Platform gate. A depot with no oslist is platform-agnostic
            # (shared content) and is kept.
            if platform and os_list and platform not in os_list:
                skipped.append({"dlc": entry["appid"], "depot": depot,
                                "reason": f"{os_list} depot, this install is {platform}"})
                continue
            # Already on disk at exactly this build.
            if installed.get(depot) and installed[depot] == str(rec.get("gid")):
                skipped.append({"dlc": entry["appid"], "depot": depot,
                                "reason": f"already installed at manifest {rec.get('gid')}"})
                continue
            if not rec.get("hasKey"):
                skipped.append({"dlc": entry["appid"], "depot": depot,
                                "reason": "no depot key in the resolved lua — cannot decrypt"})
                continue
            keep.append(rec)
        if keep:
            fetch.append({"appid": entry["appid"], "depots": keep,
                          "bytes": sum(int(d.get("size") or 0) for d in keep)})

    warnings: List[str] = []
    if target.get("conflict"):
        warnings.append(target["conflict"])
    if not platform:
        warnings.append(target.get("note") or "platform unknown")
    if not _hubcap_key_present():
        warnings.append(
            "No Hubcap API key set. Manifests can then only come from the GitHub "
            "archive, which carries few DLC depots — set a key for reliable results.")
    if target.get("unlocker") in ("uplay_r1", "uplay_r2"):
        warnings.append(
            f"This is a Ubisoft-launcher game ({target['unlocker']}); its DLC may not "
            "ship through Steam depots at all, and SmokeAPI is refused for it.")

    # Name the outcome here rather than leaving the UI to infer it from empty
    # lists. "Nothing to download" has four quite different meanings and the
    # user deserves to be told which one they hit -- that is the entire reason
    # this is a plan-then-download button instead of a silent one.
    entitlement = content.get("entitlement", [])
    if fetch:
        outcome = "fetch"
    elif not entitlement and not skipped:
        outcome = "no-dlc"
    elif skipped and all("already installed" in s["reason"] for s in skipped):
        outcome = "up-to-date"
    elif entitlement and not skipped:
        outcome = "entitlement-only"
    else:
        # Something real exists but we cannot get it (no key, wrong platform).
        outcome = "blocked"

    return {
        "success": True,
        "appid": int(appid),
        "name": content.get("name", ""),
        "outcome": outcome,
        "target": target,
        # DLC with content we can and should fetch.
        "fetch": fetch,
        # DLC with content we are deliberately not fetching, each with a reason.
        "skipped": skipped,
        # DLC with nothing to download at all -- the unlocker alone is the fix.
        "entitlement": entitlement,
        "bytes": sum(int(e.get("bytes") or 0) for e in fetch),
        "warnings": warnings,
    }


def remove_downloaded(appid: int, also_unlock: bool = True) -> Dict[str, Any]:
    """Delete the files a previous DLC fetch brought in, and drop the unlocker.

    Reads the log ``_write_dlc_log`` left in the install folder, which records
    ONLY files the download newly created -- never files it overwrote. A DLC
    depot may legitimately replace a base-game file, and deleting those would
    corrupt the base install, so anything that already existed is not ours to
    remove. Empty directories left behind are pruned; nothing outside the
    recorded list is ever touched.
    """
    import json
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}

    install_path = _install_path(appid)
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game install folder not found"}

    try:
        from . import depotdl
        log_path = depotdl.dlc_log_path(appid, install_path)
    except Exception as exc:
        return {"success": False, "error": f"DepotDownloader backend unavailable: {exc}"}

    if not os.path.isfile(log_path):
        return {"success": False, "noLog": True,
                "error": "no record of DLC files downloaded for this game — nothing to remove"}
    try:
        with open(log_path, "r", encoding="utf-8") as fh:
            data = json.load(fh) or {}
    except Exception as exc:
        return {"success": False, "error": f"could not read the DLC file log: {exc}"}

    removed, failed = 0, []
    dirs_touched = set()
    for rel in (data.get("created") or []):
        full = os.path.normpath(os.path.join(install_path, rel))
        # Refuse anything that escaped the install folder.
        if not full.startswith(os.path.normpath(install_path) + os.sep):
            failed.append(rel)
            continue
        try:
            if os.path.isfile(full):
                os.remove(full)
                removed += 1
                dirs_touched.add(os.path.dirname(full))
        except Exception as exc:
            logger.warn(f"dlcdepot: could not remove {rel}: {exc}")
            failed.append(rel)

    # Prune directories that the removal emptied (deepest first).
    for d in sorted(dirs_touched, key=len, reverse=True):
        try:
            if os.path.isdir(d) and not os.listdir(d):
                os.rmdir(d)
        except Exception:
            pass

    try:
        os.remove(log_path)
    except Exception:
        pass

    unlocker_result = {}
    if also_unlock:
        unlocker_result = _remove_unlocker(appid, install_path)

    logger.log(f"dlcdepot: removed {removed} DLC file(s) for {appid}")
    return {"success": True, "removed": removed, "failed": failed,
            "unlocker": unlocker_result}


def _remove_unlocker(appid: int, install_path: str) -> Dict[str, Any]:
    """Take the DLC unlocker back off, whichever one is actually installed."""
    out: Dict[str, Any] = {}
    try:
        from . import smokeapi
        if smokeapi.status(install_path).get("installed"):
            out["smokeapi"] = smokeapi.remove(install_path)
    except Exception as exc:
        out["smokeapi"] = {"success": False, "error": str(exc)}
    try:
        from . import dlcunlockers
        out["unlockers"] = dlcunlockers.remove_all(install_path)
    except Exception as exc:
        out["unlockers"] = {"success": False, "error": str(exc)}
    return out


def start(appid: int, dlc_appids: Optional[List[int]] = None) -> Dict[str, Any]:
    """Download the planned DLC depots into the game's install folder.

    Only DLC named in ``dlc_appids`` are fetched (all planned ones when it is
    omitted), so nothing is downloaded that the user did not choose.
    """
    p = plan(appid)
    if not p.get("success"):
        return p
    want = {int(a) for a in dlc_appids} if dlc_appids else {e["appid"] for e in p["fetch"]}
    depot_gid: Dict[str, str] = {}
    for entry in p["fetch"]:
        if entry["appid"] not in want:
            continue
        for rec in entry["depots"]:
            if rec.get("gid"):
                depot_gid[str(rec["depot"])] = str(rec["gid"])
    if not depot_gid:
        return {"success": False, "error": "nothing to download for that selection",
                "plan": p}
    try:
        from . import depotdl
    except Exception as exc:
        return {"success": False, "error": f"DepotDownloader backend unavailable: {exc}"}
    # download_dlc_with_gids, NOT download_build_with_gids. The build path's
    # worker rewrites the game's appmanifest with the passed depots as the whole
    # InstalledDepots set, pins those gids in moon, and calls add_app -- which on
    # an installed, owned game would erase the base game's depot record, pin it to
    # DLC manifests, and mark it SLS-added. Adding DLC files changes no build, so
    # nothing about the installed build may be touched: no pin, no manifest
    # rewrite. It also sets op="dlc", which keeps these out of depot_cleanup's
    # registry (that watcher only tracks full build downloads, precisely so it
    # can never delete a legitimately-owned base game).
    logger.log(f"dlcdepot: starting DLC fetch for {appid}: {len(depot_gid)} depot(s)")
    return depotdl.download_dlc_with_gids(int(appid), depot_gid)
