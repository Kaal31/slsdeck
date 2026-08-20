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
                # Log was truncated/recreated after the snapshot.
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
