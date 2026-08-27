"""Safe cleanup for plugin upgrades and Decky uninstall.

Decky removes the active plugin directory itself, but intentionally does not
remove files created in its data/settings/log roots.  SLSDeck has also shipped
under an older ``SLSDeckHV`` identity, so those directories can survive forever
and feed stale state into a later install.

The live Steam process watches ``~/.config/SLSsteam``.  This module therefore
only removes Decky-owned cache/runtime paths while Steam is running; SLSsteam's
watched configuration and all installed games are deliberately out of scope.
"""

from __future__ import annotations

import os
import shutil
from typing import Any, Dict, Iterable, List

from .logger import logger
from .paths import get_plugin_dir, get_runtime_dir, get_settings_dir


CURRENT_ID = "SLSDeckUniversal"
LEGACY_IDS = ("SLSDeckHV",)


def _inside(parent: str, child: str) -> bool:
    try:
        return os.path.commonpath((os.path.realpath(parent), os.path.realpath(child))) == os.path.realpath(parent)
    except Exception:
        return False


def _remove_tree(path: str, allowed_parent: str, removed: List[str], errors: List[str]) -> None:
    try:
        real = os.path.realpath(path)
        parent = os.path.realpath(allowed_parent)
        if real == parent or not _inside(parent, real):
            raise RuntimeError(f"refusing unsafe cleanup target: {path}")
        if os.path.lexists(path):
            if os.path.isdir(path) and not os.path.islink(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
            removed.append(path)
    except FileNotFoundError:
        pass
    except Exception as exc:
        errors.append(f"{path}: {exc}")


def _homebrew_root() -> str:
    # Normally runtime is <home>/homebrew/data/<plugin-id>.  Derive the root
    # from Decky's supplied path rather than assuming /home/deck. Prefer the
    # preserved settings path: get_runtime_dir() creates its directory, which
    # would accidentally recreate an empty data folder after uninstall cleanup.
    settings = os.path.realpath(get_settings_dir())
    parent = os.path.dirname(settings)
    if os.path.basename(parent).lower() == "settings":
        return os.path.dirname(parent)
    runtime = os.path.realpath(get_runtime_dir())
    parent = os.path.dirname(runtime)
    if os.path.basename(parent).lower() == "data":
        return os.path.dirname(parent)
    return ""


def _remove_legacy_identities(removed: List[str], errors: List[str]) -> None:
    root = _homebrew_root()
    if not root:
        return
    for bucket in ("data", "logs", "settings", "plugins"):
        base = os.path.join(root, bucket)
        for plugin_id in LEGACY_IDS:
            _remove_tree(os.path.join(base, plugin_id), base, removed, errors)


def cleanup_for_update() -> Dict[str, Any]:
    """Drop rebuildable caches and obsolete plugin identities on version change.

    The current settings directory is preserved in full.  The settings module
    separately clears transient retry counters while retaining user choices,
    API keys, pin records and Tokeer-applied records.
    """
    removed: List[str] = []
    errors: List[str] = []
    runtime = os.path.realpath(get_runtime_dir())
    runtime_parent = os.path.dirname(runtime)
    _remove_tree(runtime, runtime_parent, removed, errors)
    try:
        os.makedirs(runtime, exist_ok=True)
    except Exception as exc:
        errors.append(f"recreate {runtime}: {exc}")
    _remove_legacy_identities(removed, errors)
    logger.log(f"SLSDeck lifecycle: update cleanup removed {len(removed)} stale path(s)")
    return {"success": not errors, "removed": removed, "errors": errors}


def cleanup_for_uninstall() -> Dict[str, Any]:
    """Remove safe Decky-owned state during uninstall.

    Keep the active settings directory so explicit user settings and keys
    survive a reinstall.  Never touch watched SLSsteam config or game content.
    """
    removed: List[str] = []
    errors: List[str] = []
    runtime = os.path.realpath(get_runtime_dir())
    _remove_tree(runtime, os.path.dirname(runtime), removed, errors)
    _remove_legacy_identities(removed, errors)

    root = _homebrew_root()
    if root:
        logs = os.path.join(root, "logs")
        _remove_tree(os.path.join(logs, CURRENT_ID), logs, removed, errors)

    logger.log(f"SLSDeck lifecycle: uninstall cleanup removed {len(removed)} safe path(s)")
    return {"success": not errors, "removed": removed, "errors": errors,
            "preserved": [get_settings_dir(), "~/.config/SLSsteam (watched while Steam is live)"]}
