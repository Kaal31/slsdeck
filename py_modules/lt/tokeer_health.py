"""Evidence-based health for persisted Tokeer activation records.

The activation service has no local API that can prove an offline key is still
accepted.  We therefore distinguish an unchanged activation environment from
one that needs verification, and never invent a time-based expiry result.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from typing import Any, Dict

from . import slssteam, steam, tokeer


CHECK_AFTER_DAYS = 30
FINGERPRINT_VERSION = 1
_CACHE_SECONDS = 120
_CACHE: Dict[int, tuple[float, Dict[str, Any]]] = {}
_LOCK = threading.Lock()

_VOLATILE_DIRS = {
    "cache", "caches", "crash", "crashes", "crashdumps", "logs", "log",
    "save", "saves", "saved", "screenshots", "shadercache", "temp", "tmp",
}
_VOLATILE_SUFFIXES = (".log", ".dmp", ".tmp", ".temp", ".bak", ".old")


def _installation(appid: int) -> Dict[str, Any]:
    result = steam.get_game_install_path_response(int(appid)) or {}
    return result if result.get("success") else {}


def _prefix_exists(appid: int, installation: Dict[str, Any]) -> bool:
    library = str(installation.get("libraryPath") or "")
    if not library:
        return False
    return os.path.isdir(os.path.join(
        library, "steamapps", "compatdata", str(int(appid)), "pfx"
    ))


def game_fingerprint(appid: int) -> Dict[str, Any]:
    """Fingerprint stable game-install metadata without reading huge assets.

    Runtime-generated logs, saves and caches are excluded so launching a game
    does not invalidate its activation. Mods, executables, textures and package
    files remain included and therefore change the digest normally.
    """
    installation = _installation(appid)
    root = os.path.realpath(str(installation.get("installPath") or ""))
    if not root or not os.path.isdir(root):
        return {"success": False, "error": "Game installation was not found."}
    digest = hashlib.sha256()
    count = 0
    total = 0
    try:
        for current, dirs, files in os.walk(root):
            dirs[:] = sorted(d for d in dirs if d.lower() not in _VOLATILE_DIRS)
            for name in sorted(files):
                if name.lower().endswith(_VOLATILE_SUFFIXES):
                    continue
                path = os.path.join(current, name)
                try:
                    stat = os.stat(path, follow_symlinks=False)
                except OSError:
                    continue
                rel = os.path.relpath(path, root).replace(os.sep, "/")
                row = f"{rel}\0{stat.st_size}\0{stat.st_mtime_ns}\n".encode("utf-8", "surrogateescape")
                digest.update(row)
                count += 1
                total += int(stat.st_size)
        return {
            "success": True,
            "version": FINGERPRINT_VERSION,
            "digest": digest.hexdigest(),
            "files": count,
            "bytes": total,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _file_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def capture(appid: int, kind: str, evidence_path: str = "") -> Dict[str, Any]:
    appid = int(appid)
    installation = _installation(appid)
    depots = {str(d): str(g) for d, g in (steam.get_installed_depots(appid) or {}).items()}
    live_pin = {str(d): str(g) for d, g in (slssteam._read_pin_gids(appid) or {}).items()}
    snapshot: Dict[str, Any] = {
        "activationBuildId": str(steam.get_installed_buildid(appid) or ""),
        "activationDepots": depots,
        "pinExpected": bool(live_pin),
        "activationFingerprint": game_fingerprint(appid),
        "prefixPresentAtActivation": _prefix_exists(appid, installation),
    }
    if str(kind).lower() == "ubisoft" and evidence_path:
        path = os.path.realpath(str(evidence_path))
        try:
            with open(path, "r", encoding="utf-8-sig") as handle:
                payload = json.load(handle)
            if isinstance(payload, dict) and str(payload.get("DenuvoToken") or "").strip():
                snapshot["dbdataPath"] = path
                snapshot["dbdataSha256"] = _file_sha256(path)
        except Exception:
            pass
    return snapshot


def _result(status: str, reason: str, **extra: Any) -> Dict[str, Any]:
    return {"health": status, "healthReason": reason, **extra}


def evaluate(appid: int, record: Dict[str, Any], force: bool = False) -> Dict[str, Any]:
    appid = int(appid)
    now = time.time()
    with _LOCK:
        cached = _CACHE.get(appid)
        if cached and not force and now - cached[0] < _CACHE_SECONDS:
            return dict(cached[1])

    applied_at = int(record.get("appliedAt") or 0)
    age_days = max(0, int((time.time() * 1000 - applied_at) / 86400000)) if applied_at else 0
    installation = _installation(appid)
    if not installation:
        result = _result("changed", "Game installation is missing.", ageDays=age_days)
    elif not record.get("activationBuildId") and not record.get("activationDepots"):
        result = _result(
            "check", "Activation predates environment tracking; verify that the game still starts.",
            ageDays=age_days,
        )
    else:
        steam_activation = str(record.get("kind") or "steam") != "ubisoft"
        runtime = tokeer.runtime_status() if steam_activation else {"installed": True}
        proton = tokeer.required_proton_status() if steam_activation else {"healthy": True}
        saved_build = str(record.get("activationBuildId") or "")
        current_build = str(steam.get_installed_buildid(appid) or "")
        saved_depots = {str(d): str(g) for d, g in (record.get("activationDepots") or {}).items()}
        current_depots = {str(d): str(g) for d, g in (steam.get_installed_depots(appid) or {}).items()}
        if not runtime.get("installed"):
            result = _result("changed", "The Tokeer runtime or native hook is missing.", ageDays=age_days)
        elif not proton.get("healthy"):
            result = _result("changed", f"Required {tokeer.REQUIRED_PROTON} is missing.", ageDays=age_days)
        elif saved_build and current_build and saved_build != current_build:
            result = _result("changed", f"Installed build changed from {saved_build} to {current_build}.", ageDays=age_days)
        elif saved_depots and current_depots != saved_depots:
            result = _result("changed", "Installed depot manifests changed after activation.", ageDays=age_days)
        elif record.get("prefixPresentAtActivation") and not _prefix_exists(appid, installation):
            result = _result("changed", "The Proton prefix used for activation is missing.", ageDays=age_days)
        else:
            saved_fp = record.get("activationFingerprint") or {}
            current_fp = game_fingerprint(appid)
            if not saved_fp.get("digest") or not current_fp.get("success"):
                result = _result("check", "The game-file baseline could not be verified.", ageDays=age_days)
            elif current_fp.get("digest") != saved_fp.get("digest"):
                result = _result("changed", "Game files changed after activation.", ageDays=age_days)
            elif str(record.get("kind") or "") == "ubisoft" and record.get("dbdataPath"):
                path = os.path.realpath(str(record.get("dbdataPath") or ""))
                try:
                    dbdata_ok = os.path.isfile(path) and _file_sha256(path) == str(record.get("dbdataSha256") or "")
                except Exception:
                    dbdata_ok = False
                result = (_result("valid", "Activation environment is unchanged.", ageDays=age_days)
                          if dbdata_ok else
                          _result("changed", "Ubisoft dbdata.json is missing or changed.", ageDays=age_days))
            elif str(record.get("kind") or "") == "ubisoft":
                result = _result("check", "Ubisoft activation data could not be verified.", ageDays=age_days)
            else:
                result = _result("valid", "Activation environment is unchanged.", ageDays=age_days)

    if result.get("health") == "valid" and age_days >= CHECK_AFTER_DAYS:
        result = _result(
            "check",
            f"Activation is {age_days} days old; local files are unchanged, but DRM acceptance cannot be proven offline.",
            ageDays=age_days,
        )

    saved_depots = {str(d): str(g) for d, g in (record.get("activationDepots") or {}).items()}
    live_pin = {str(d): str(g) for d, g in (slssteam._read_pin_gids(appid) or {}).items()}
    result["pinned"] = bool(live_pin)
    result["pinMatchesActivation"] = bool(saved_depots and live_pin == saved_depots)
    if (record.get("pinExpected") and result.get("health") != "changed" and not result["pinMatchesActivation"]):
        result = {
            **result,
            "health": "check",
            "healthReason": "The exact activation-build pin is missing or does not match.",
        }
    with _LOCK:
        _CACHE[appid] = (now, dict(result))
    return result


def invalidate(appid: int = 0) -> None:
    with _LOCK:
        if int(appid or 0):
            _CACHE.pop(int(appid), None)
        else:
            _CACHE.clear()
