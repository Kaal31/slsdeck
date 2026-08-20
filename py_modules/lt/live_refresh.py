"""Live slsteam-moon hot-add reconciliation helpers.

This module observes the moon's own log instead of guessing with a fixed sleep.
A hot add is considered ready only after the same HotReload generation reaches
PackagePatch's processed runtime package-change state and Steam accepts the live
appinfo request. Any defer/timeout leaves the existing restart path available.
"""

from __future__ import annotations

import os
import re
import time
from typing import Any, Dict

from .logger import logger
from . import slssteam

_HOT_RE = re.compile(r"HotReload:\s+generation\s+(\d+)\s+dispatched\b.*\badded=(\d+)", re.I)
_PROCESSED_RE = re.compile(r"PackagePatch:\s+processed runtime package change generation\s+(\d+)", re.I)
_DEFERRED_RE = re.compile(r"PackagePatch:\s+runtime refresh generation\s+(\d+)\s+deferred\s*\((.*?)\)", re.I)
_APPINFO_OK_RE = re.compile(r"PackagePatch:\s+requested live appinfo for\s+\d+\s+inserted app\(s\)\s+in generation\s+(\d+)", re.I)
_APPINFO_BAD_RE = re.compile(r"PackagePatch:\s+live appinfo request generation\s+(\d+)\s+not accepted\s*\((.*?)\)", re.I)


def snapshot() -> Dict[str, Any]:
    """Capture the current end of the active moon log."""
    try:
        path = slssteam._slssteam_log_path()
    except Exception:
        path = None
    if not path or not os.path.isfile(path):
        return {"path": "", "offset": 0}
    try:
        return {"path": path, "offset": os.path.getsize(path)}
    except Exception:
        return {"path": path, "offset": 0}


def poke(path: str) -> None:
    """Emit a real close-write event after an atomic/rename-style source update."""
    if not path or not os.path.isfile(path):
        return
    try:
        with open(path, "a", encoding="utf-8"):
            pass
    except Exception as exc:
        logger.warn(f"SLSDeck: live-refresh poke failed for {path}: {exc}")


def wait_for_add(appid: int, start: Dict[str, Any], timeout: float = 15.0) -> Dict[str, Any]:
    """Wait for the first new moon HotReload generation to complete live add.

    The Add Game UI starts one add at a time, so the first generation after the
    captured log offset is the generation produced by the source file we just
    published. We still require added>0 and correlate every downstream line by
    that exact generation number.
    """
    path = str(start.get("path") or "")
    offset = int(start.get("offset") or 0)
    if not path:
        return {"ready": False, "reason": "moon log unavailable"}

    generation = None
    processed = False
    appinfo = False
    deadline = time.monotonic() + max(1.0, float(timeout))
    carry = ""

    while time.monotonic() < deadline:
        try:
            size = os.path.getsize(path)
            if size < offset:
                offset = 0
                carry = ""
            if size > offset:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    fh.seek(offset)
                    chunk = fh.read()
                    offset = fh.tell()
                text = carry + chunk
                lines = text.splitlines(True)
                carry = ""
                if lines and not lines[-1].endswith(("\n", "\r")):
                    carry = lines.pop()

                for raw in lines:
                    line = raw.strip()
                    if generation is None:
                        m = _HOT_RE.search(line)
                        if m and int(m.group(2)) > 0:
                            generation = int(m.group(1))
                            logger.log(
                                f"SLSDeck: moon hot-add generation {generation} observed for {appid}")
                        continue

                    m = _DEFERRED_RE.search(line)
                    if m and int(m.group(1)) == generation:
                        return {
                            "ready": False,
                            "generation": generation,
                            "reason": m.group(2).strip() or "moon deferred runtime refresh",
                        }

                    m = _APPINFO_BAD_RE.search(line)
                    if m and int(m.group(1)) == generation:
                        return {
                            "ready": False,
                            "generation": generation,
                            "reason": m.group(2).strip() or "Steam rejected live appinfo refresh",
                        }

                    m = _PROCESSED_RE.search(line)
                    if m and int(m.group(1)) == generation:
                        processed = True

                    m = _APPINFO_OK_RE.search(line)
                    if m and int(m.group(1)) == generation:
                        appinfo = True

                    if processed and appinfo:
                        return {"ready": True, "generation": generation, "reason": ""}
        except Exception as exc:
            logger.warn(f"SLSDeck: live-refresh log observation failed for {appid}: {exc}")
            return {"ready": False, "generation": generation, "reason": str(exc)}

        time.sleep(0.1)

    if generation is None:
        reason = "no moon HotReload generation observed"
    elif not processed:
        reason = "moon did not confirm runtime license/package processing"
    else:
        reason = "Steam did not confirm the live appinfo request"
    return {"ready": False, "generation": generation, "reason": reason}


def patch_downloads(downloads: Any) -> None:
    """Add verified no-restart behavior around the existing downloader module.

    The original implementation remains the fallback source of truth. We only
    wrap the manifest install so its already-written stplug-in source is poked
    and correlated with moon's HotReload generation, then replace the add worker
    so native install fires only after that generation is confirmed live.
    """
    if getattr(downloads, "_slsdeck_live_refresh_patched", False):
        return

    original_process = downloads._process_and_install_lua

    def process_with_live_refresh(appid: int, zip_path: str) -> None:
        start = snapshot()
        original_process(appid, zip_path)
        state = downloads._get_state(appid)
        installed_path = str(state.get("installedPath") or "")
        if installed_path:
            poke(installed_path)

        downloads._set_state(appid, {"status": "reconciling"})
        result = wait_for_add(appid, start)
        ready = bool(result.get("ready"))
        generation = result.get("generation")
        reason = str(result.get("reason") or "")
        downloads._set_state(appid, {
            "status": "done",
            "liveReady": ready,
            "liveGeneration": generation,
            "liveReason": reason,
            "needsProvisionRestart": not ready,
        })
        if ready:
            logger.log(
                f"SLSDeck: live add confirmed for {appid} via moon generation {generation}; "
                "Steam restart not required")
        else:
            logger.warn(
                f"SLSDeck: live add not confirmed for {appid}: {reason or 'unknown'}; "
                "restart fallback retained")

    def add_worker_with_live_refresh(appid: int) -> None:
        try:
            downloads._download_zip_for_app(appid)
        finally:
            st = downloads._get_state(appid)
            status = st.get("status")
            if downloads._is_cancelled(appid):
                status = "cancelled"
                downloads._set_state(appid, {"status": "cancelled"})
            if status not in ("done", "failed"):
                return

            name = ""
            try:
                name = downloads._get_loaded_app_name(appid) or ""
            except Exception:
                pass
            ok = bool(status == "done" and st.get("success"))
            auto_dl = False
            live_ready = bool(st.get("liveReady"))

            if ok and st.get("manifest") is False and "liveReady" not in st:
                # SLS-only fallback has no stplug-in source for moon's managed
                # HotReload path, so do not risk the 0-depot native install.
                downloads._set_state(appid, {
                    "liveReady": False,
                    "needsProvisionRestart": True,
                    "liveReason": "no managed manifest source was available for live refresh",
                })
                st = downloads._get_state(appid)
                live_ready = False

            if ok:
                try:
                    from .steam import clear_phantom_install
                    cleared = clear_phantom_install(appid)
                    if cleared.get("cleared"):
                        logger.log(
                            f"SLSDeck: cleared stale phantom install for {appid} before download")
                except Exception as ph_exc:
                    logger.warn(f"SLSDeck: phantom-install check failed for {appid}: {ph_exc}")

                try:
                    from .settings import get_auto_add_dlc
                    if get_auto_add_dlc():
                        from . import dlc as _dlc
                        info = _dlc.resolve_dlc(appid)
                        target = appid
                        if info.get("isDlc") and info.get("base") and info["base"] != appid:
                            base = int(info["base"])
                            try:
                                bname = downloads._fetch_app_name(base) or f"AppID {base}"
                                slssteam.add_app(base, bname)
                                downloads._append_loaded_app(base, bname)
                                target = base
                                logger.log(
                                    f"SLSDeck: chain-added base game {base} for DLC {appid} — "
                                    "moon unlocks all its DLC")
                            except Exception as be:
                                logger.warn(f"SLSDeck: chain-add base failed for DLC {appid}: {be}")
                        r = _dlc.ensure_all_dlc_keys(target)
                        logger.log(
                            f"SLSDeck: auto-DLC registered {r.get('keys',0)} depot key(s) + "
                            f"{r.get('dlcRegistered',0)} DLC appid(s) for {target} ({r.get('source')})")
                except Exception as dlc_exc:
                    logger.warn(f"SLSDeck: auto-DLC step failed for {appid}: {dlc_exc}")

                try:
                    if downloads.get_auto_download():
                        if live_ready and slssteam._injection_functional():
                            trig = slssteam.trigger_steam_install(appid)
                            auto_dl = bool(trig.get("success"))
                            if not auto_dl:
                                logger.warn(
                                    f"SLSDeck: live install trigger failed for {appid}: "
                                    f"{trig.get('error') or 'unknown'}")
                        else:
                            logger.warn(
                                f"SLSDeck: skipping auto-download for {appid} — moon live refresh "
                                "was not confirmed; restart fallback remains available.")
                except Exception as dl_exc:
                    logger.warn(f"SLSDeck: auto-download trigger failed for {appid}: {dl_exc}")

                try:
                    from .art import sync_game_art
                    sync_game_art(appid)
                except Exception as art_exc:
                    logger.warn(f"SLSDeck: post-add art sync failed for {appid}: {art_exc}")

            with downloads._ADD_EVENTS_LOCK:
                if len(downloads._ADD_EVENTS) >= 200:
                    del downloads._ADD_EVENTS[:-100]
                downloads._ADD_EVENTS.append({
                    "appid": appid,
                    "name": name or f"AppID {appid}",
                    "status": status,
                    "success": ok,
                    "autoDownload": auto_dl,
                    "liveReady": live_ready,
                    "needsProvisionRestart": bool(st.get("needsProvisionRestart")),
                    "liveGeneration": st.get("liveGeneration"),
                    "liveReason": st.get("liveReason", ""),
                    "error": st.get("error", ""),
                })

    downloads._process_and_install_lua = process_with_live_refresh
    downloads._add_worker = add_worker_with_live_refresh
    downloads._slsdeck_live_refresh_patched = True
    logger.log("SLSDeck: slsteam-moon verified live-add wrapper enabled")
