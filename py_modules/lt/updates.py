"""Central dependency updater — keep GitHub-sourced tools/DLLs on the latest
release, and check for newer versions on boot.

Every GitHub-sourced module already downloads from ``releases/latest`` at install
time, so a fresh install is always current. What was missing is *re-checking*
after install. This module records the release tag we last installed per
dependency, compares it against the current latest on boot, and either
auto-updates the lightweight ones or flags the heavy ones (Proton ~500 MB, the
kernel-specific HV module) for a one-tap manual update.

Registry entries:
  name    – display name
  repo    – owner/name on GitHub
  heavy   – True → never auto-download (flag only); False → safe to auto-update
  current – stored tag we last installed ("" if unknown)
  refresh – callable(force) that re-fetches the latest build and records the tag
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional

from .logger import logger
from . import settings, ghrel


# ── per-dependency refresh callbacks (lazy imports avoid import cycles) ───────
def _refresh_opensave(force: bool = True) -> Dict[str, Any]:
    from . import opensave
    return opensave.ensure_cli(force=force)


def _refresh_smokeapi(force: bool = True) -> Dict[str, Any]:
    from . import smokeapi
    r = smokeapi.ensure_dlls(force=True)
    if r.get("success"):
        settings.set_dep_version("SmokeAPI", ghrel.latest_tag("acidicoala/SmokeAPI"))
    return r


def _refresh_unlocker(kind: str, repo: str) -> Callable[[bool], Dict[str, Any]]:
    def _do(force: bool = True) -> Dict[str, Any]:
        from . import dlcunlockers
        try:
            r = dlcunlockers.ensure_dlls(kind, force=True)
        except TypeError:
            r = dlcunlockers.ensure_dlls(kind)
        if isinstance(r, dict) and r.get("success"):
            settings.set_dep_version(kind, ghrel.latest_tag(repo))
        return r if isinstance(r, dict) else {"success": bool(r)}
    return _do


def _flag_only(name: str) -> Callable[[bool], Dict[str, Any]]:
    def _do(force: bool = True) -> Dict[str, Any]:
        return {"success": False, "flagOnly": True,
                "error": f"{name} is updated from its own tab (large / system-specific download)"}
    return _do


# name -> {repo, heavy, dep_key, refresh}
_REGISTRY: List[Dict[str, Any]] = [
    {"name": "SmokeAPI", "repo": "acidicoala/SmokeAPI", "heavy": False,
     "dep_key": "SmokeAPI", "refresh": _refresh_smokeapi},
    # CreamAPI is bundled (defaults/creamapi) — no upstream release to check.
    {"name": "Uplay R1 Unlocker", "repo": "acidicoala/UplayR1Unlocker", "heavy": False,
     "dep_key": "uplayr1", "refresh": _refresh_unlocker("uplayr1", "acidicoala/UplayR1Unlocker")},
    {"name": "Uplay R2 Unlocker", "repo": "acidicoala/UplayR2Unlocker", "heavy": False,
     "dep_key": "uplayr2", "refresh": _refresh_unlocker("uplayr2", "acidicoala/UplayR2Unlocker")},
    {"name": "GE-Proton (LinUwUx)", "repo": "Kaal31/slsdeck", "heavy": True,
     "rolling": True,
     "dep_key": "proton", "refresh": _flag_only("GE-Proton")},
    {"name": "HV cpuid module", "repo": "PareidoliaDev/glowing-tribble", "heavy": True,
     "dep_key": "hvmodule", "refresh": _flag_only("The HV module")},
]


# Optional entries — only checked when their toggle is on. Engine + headcrab
# updates are heavy/risky, so 'update' points the user at the Dependencies tab
# (reinstall SLSsteam / re-run the client fix) rather than auto-applying.
def _refresh_engine(force: bool = True) -> Dict[str, Any]:
    """Real 'update engine' — force‑install the latest slsteam-moon."""
    from . import slssteam
    return slssteam.refresh_moon_engine()


def _refresh_headcrab(force: bool = True) -> Dict[str, Any]:
    """Real 'update headcrab' — re‑run the client fix, which now always fetches the
    LATEST h3adcr-b (and it installs its own updater going forward)."""
    from . import slssteam
    try:
        ok = slssteam._run_headcrab_shimmed()
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    return {"success": bool(ok), "note": "Client fix re-run with the latest headcrab."}


_OPTIONAL: List[Dict[str, Any]] = [
    {"name": "SLSsteam engine (moon)", "repo": "swwayps/slsteam-moon", "heavy": True,
     "dep_key": "engine", "toggle": "checkEngineUpdates", "refresh": _refresh_engine},
    {"name": "headcrab (client fix)", "repo": "Deadboy666/h3adcr-b", "heavy": True,
     "dep_key": "headcrab", "toggle": "checkHeadcrabUpdates", "rolling": True,
     "refresh": _refresh_headcrab},
]


def _all_entries() -> List[Dict[str, Any]]:
    """Base registry plus any optional entries whose toggle is on."""
    entries = list(_REGISTRY)
    if settings.get_check_engine_updates():
        entries.append(_OPTIONAL[0])
    if settings.get_check_headcrab_updates():
        entries.append(_OPTIONAL[1])
    return entries


def _entry_status(e: Dict[str, Any]) -> Dict[str, Any]:
    current = settings.get_dep_version(e["dep_key"])
    latest = ghrel.latest_tag(e["repo"])
    update = bool(current and latest and current != latest)
    # Rolling sources (headcrab raw script) have no release tag to compare; surface
    # them as "check via Dependencies" rather than claiming a version diff.
    if e.get("rolling"):
        update = False
        latest = latest or "rolling"
    return {"name": e["name"], "repo": e["repo"], "heavy": bool(e["heavy"]),
            "optional": "toggle" in e, "rolling": bool(e.get("rolling")),
            "current": current, "latest": latest, "updateAvailable": update}


def check_all() -> Dict[str, Any]:
    """Resolve latest tags for every registered dep and report update state."""
    items = [_entry_status(e) for e in _all_entries()]
    return {"success": True, "items": items,
            "updates": [i for i in items if i["updateAvailable"]]}


def optional_status() -> Dict[str, Any]:
    """Force a check of the OPTIONAL engine + headcrab entries regardless of their
    toggles. Used right after a plugin update so the user is prompted to refresh
    them for the new version (engine flags a newer release; headcrab is rolling,
    so it's always 're-run the client fix')."""
    out: Dict[str, Any] = {}
    for e in _OPTIONAL:
        st = _entry_status(e)
        st["dep_key"] = e["dep_key"]
        out[e["dep_key"]] = st
    return {"success": True, "items": list(out.values()),
            "engine": out.get("engine"), "headcrab": out.get("headcrab")}


def update_one(name: str, include_heavy: bool = True) -> Dict[str, Any]:
    for e in _all_entries():
        if e["name"] == name or e["dep_key"] == name:
            if e["heavy"] and not include_heavy:
                return {"success": False, "flagOnly": True, "name": e["name"]}
            try:
                r = e["refresh"](True)
            except Exception as exc:
                return {"success": False, "error": str(exc), "name": e["name"]}
            r["name"] = e["name"]
            return r
    return {"success": False, "error": f"unknown dependency: {name}"}


def update_all(include_heavy: bool = False) -> Dict[str, Any]:
    done, skipped, failed = [], [], []
    for e in _all_entries():
        st = _entry_status(e)
        if not st["updateAvailable"]:
            continue
        if e["heavy"] and not include_heavy:
            skipped.append(e["name"])
            continue
        try:
            r = e["refresh"](True)
        except Exception as exc:
            failed.append(f"{e['name']}: {exc}")
            continue
        (done if r.get("success") else failed).append(e["name"])
    return {"success": True, "updated": done, "skipped": skipped, "failed": failed}


def boot_check(auto: Optional[bool] = None) -> Dict[str, Any]:
    """Called at plugin startup (background). Resolves latest tags; if the user
    has auto-update on, applies the lightweight updates and returns a summary the
    UI can toast. Heavy deps are only ever flagged, never auto-downloaded."""
    if auto is None:
        auto = settings.get_auto_update()
    chk = check_all()
    updates = chk["updates"]
    result = {"success": True, "checked": len(chk["items"]),
              "available": [u["name"] for u in updates],
              "heavyAvailable": [u["name"] for u in updates if u["heavy"]],
              "applied": [], "failed": []}
    if auto and updates:
        up = update_all(include_heavy=False)
        result["applied"] = up["updated"]
        result["failed"] = up["failed"]
    if updates:
        logger.log("updates: available -> " + ", ".join(u["name"] for u in updates))
    return result
