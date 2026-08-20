"""Backup & Restore Manager for SLSDeck.

Exports and imports everything that defines an SLSDeck setup — the SLSsteam
config (added games / AdditionalApps), the ManifestStore, the depot-key cache,
the stplug-in lua manifests, and the plugin's own settings (API keys, toggles) —
to/from a single compressed .tar.gz. Lets you restore your whole library + keys
after a full-nuke uninstall, a client reset, or moving to another device.
"""

from __future__ import annotations

import datetime
import io
import json
import os
import shutil
import tarfile
from typing import Any, Dict, List, Optional, Tuple

from .logger import logger
from .paths import get_settings_dir, get_user_home
from .steam import stplugin_dir, _all_library_paths
from .utils import chown_to_user, is_safe_path
from . import slssteam

# Proton-prefix save locations to capture (label -> subpath under steamuser/).
_SAVE_SUBDIRS = [
    ("AppData/Local", ("AppData", "Local")),
    ("AppData/Roaming", ("AppData", "Roaming")),
    ("Saved Games", ("Saved Games",)),
    ("Documents", ("Documents",)),
]


def _sls_appids() -> set:
    """AppIds of games added via SLSDeck (SLSsteam AdditionalApps ∪ everAdded)."""
    ids: set = set()
    try:
        ids |= {int(x) for x in slssteam.read_additional_apps()}
    except Exception:
        pass
    try:
        from .settings import get_ever_added
        ids |= {int(x) for x in get_ever_added()}
    except Exception:
        pass
    return ids


def _find_proton_prefix(appid: int) -> str:
    """The game's Proton prefix (steamapps/compatdata/<appid>/pfx) on any drive."""
    for lib in _all_library_paths():
        pfx = os.path.join(lib, "steamapps", "compatdata", str(appid), "pfx")
        if os.path.isdir(pfx):
            return pfx
    return ""


def _iter_sls_save_files():
    """Yield (full_path, arcname) for the Proton-prefix saves of every installed
    SLSDeck game. arcname is slsdeck_saves/<appid>/<label>/<relpath> so the files
    round-trip into a known staging folder on restore, independent of drive."""
    for appid in sorted(_sls_appids()):
        pfx = _find_proton_prefix(appid)
        if not pfx:
            continue
        steamuser = os.path.join(pfx, "drive_c", "users", "steamuser")
        if not os.path.isdir(steamuser):
            continue
        for label, parts in _SAVE_SUBDIRS:
            base = os.path.join(steamuser, *parts)
            if not os.path.isdir(base):
                continue
            for root, _dirs, files in os.walk(base):
                for fn in files:
                    full = os.path.join(root, fn)
                    try:
                        rel = os.path.relpath(full, base)
                    except Exception:
                        continue
                    arc = os.path.join("slsdeck_saves", str(appid), label, rel)
                    yield full, arc


def _resolve_save_target(name: str, home: str) -> Optional[Tuple[str, str, bool]]:
    """For a 'slsdeck_saves/<appid>/<label>/<rel>' archive member, return
    (base_dir, rel_path, into_prefix): the game's Proton prefix steamuser dir if
    the game is installed (into_prefix=True), else the ~/slsdeck_saves/<appid>
    staging dir. Returns None for non-save members."""
    parts = name.replace("\\", "/").split("/")
    if len(parts) < 3 or parts[0] != "slsdeck_saves":
        return None
    appid = parts[1]
    rel = "/".join(parts[2:])
    if not rel:
        return None
    pfx = ""
    try:
        pfx = _find_proton_prefix(int(appid))
    except Exception:
        pfx = ""
    if pfx:
        return (os.path.join(pfx, "drive_c", "users", "steamuser"), rel, True)
    return (os.path.join(home, "slsdeck_saves", appid), rel, False)

# Any settings field whose (lower-cased) name contains this is treated as a
# secret and dropped from the export when the user opts out of including keys.
# Covers apiKeys, ryuuApiKey, steamWebApiKey, morrenusApiKey, etc.
_SECRET_MARK = "apikey"


def _redacted_settings(path: str) -> bytes:
    """settings.json with every API-key field removed, as UTF-8 bytes."""
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh) or {}
    if isinstance(data, dict):
        for k in list(data.keys()):
            if _SECRET_MARK in str(k).lower():
                data.pop(k, None)
    return json.dumps(data, indent=2).encode("utf-8")


def create_backup(dest_path: str = "", include_keys: bool = True,
                   include_saves: bool = True) -> Dict[str, Any]:
    """Create a compressed .tar.gz backup of SLSDeck config, manifests, keys, and
    settings. Default location: ~/Downloads/slsdeck_backup_<timestamp>.tar.gz.

    include_keys=False strips API keys from the archived settings.json (toggles,
    added-games history, etc. are still included).
    include_saves=True also captures each installed SLSDeck game's Proton-prefix
    savegames (AppData, Saved Games, Documents) under slsdeck_saves/<appid>/."""
    home = get_user_home()
    if not dest_path:
        stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        dest_dir = os.path.join(home, "Downloads")
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, f"slsdeck_backup_{stamp}.tar.gz")

    try:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        archived: List[str] = []

        def _add_tree(root_dir: str, only_ext=None):
            if not os.path.isdir(root_dir):
                return
            for root, _dirs, files in os.walk(root_dir):
                for fn in files:
                    if only_ext and not fn.endswith(only_ext):
                        continue
                    full = os.path.join(root, fn)
                    # Store paths relative to $HOME so restore lands them back
                    # in the same place regardless of username.
                    try:
                        rel = os.path.relpath(full, home)
                    except Exception:
                        continue
                    if rel.startswith(".."):
                        continue  # outside home — skip
                    try:
                        tar.add(full, arcname=rel)
                        archived.append(rel)
                    except Exception:
                        pass

        with tarfile.open(dest_path, "w:gz") as tar:
            # 1. SLSsteam config dir: config.yaml (AdditionalApps), manifests/
            #    (ManifestStore + .preferred_*), cache/ (depot keys, picsbuffer).
            _add_tree(slssteam.config_dir())
            # 2. stplug-in lua manifests (the merged keyed luas).
            _add_tree(stplugin_dir(), only_ext=(".lua", ".disabled"))
            # 2b. Imported custom fixes/manifests, if the user opted in.
            try:
                from . import settings as _s
                if _s.get_backup_custom():
                    from . import custom_fixes as _cf
                    _add_tree(_cf.custom_fixes_root())
                    _add_tree(_cf.custom_manifests_root())
            except Exception as exc:
                logger.warn(f"backup: custom-content step failed: {exc}")
            # 3. Plugin settings (toggles, ever-added, auto-fix queue, and — unless
            #    the user opts out — API keys). settings.json is added specially so
            #    keys can be redacted while keeping the rest.
            settings_dir = get_settings_dir()
            settings_file = os.path.join(settings_dir, "settings.json")
            if os.path.isdir(settings_dir):
                for root, _dirs, files in os.walk(settings_dir):
                    for fn in files:
                        full = os.path.join(root, fn)
                        try:
                            rel = os.path.relpath(full, home)
                        except Exception:
                            continue
                        if rel.startswith(".."):
                            continue
                        is_settings = os.path.abspath(full) == os.path.abspath(settings_file)
                        try:
                            if is_settings and not include_keys:
                                raw = _redacted_settings(full)
                                info = tarfile.TarInfo(name=rel)
                                info.size = len(raw)
                                info.mtime = int(os.path.getmtime(full))
                                tar.addfile(info, io.BytesIO(raw))
                                archived.append(rel + " (keys redacted)")
                            else:
                                tar.add(full, arcname=rel)
                                archived.append(rel)
                        except Exception:
                            pass

            # 4. SLSDeck games' Proton-prefix saves (optional; can be large).
            save_count = 0
            if include_saves:
                for full, arc in _iter_sls_save_files():
                    try:
                        tar.add(full, arcname=arc)
                        archived.append(arc)
                        save_count += 1
                    except Exception:
                        pass

        chown_to_user(dest_path, recursive=False)
        size = os.path.getsize(dest_path) if os.path.isfile(dest_path) else 0
        logger.log(f"SLSDeck backup: created {dest_path} ({len(archived)} files, "
                   f"{save_count} save files, {size} bytes)")
        return {
            "success": True,
            "path": dest_path,
            "fileCount": len(archived),
            "saveCount": save_count,
            "sizeBytes": size,
            "files": archived[:20],
        }
    except Exception as exc:
        logger.error(f"SLSDeck backup creation failed: {exc}")
        return {"success": False, "error": str(exc)}


def list_backups() -> Dict[str, Any]:
    """List SLSDeck backup archives found in ~/Downloads (newest first)."""
    home = get_user_home()
    found: List[Dict[str, Any]] = []
    for d in (os.path.join(home, "Downloads"), home):
        if not os.path.isdir(d):
            continue
        try:
            for fn in os.listdir(d):
                if fn.startswith("slsdeck_backup_") and fn.endswith(".tar.gz"):
                    full = os.path.join(d, fn)
                    try:
                        st = os.stat(full)
                    except Exception:
                        continue
                    found.append({"path": full, "name": fn,
                                  "sizeBytes": st.st_size, "mtime": int(st.st_mtime)})
        except Exception:
            pass
    # de-dupe by path, newest first
    seen = set()
    uniq = []
    for b in sorted(found, key=lambda x: x["mtime"], reverse=True):
        if b["path"] in seen:
            continue
        seen.add(b["path"])
        uniq.append(b)
    return {"success": True, "backups": uniq}


def _within_allowed(abs_target: str, allowed_roots) -> bool:
    """True only when abs_target lands inside one of SLSDeck's own directories."""
    try:
        rt = os.path.realpath(abs_target)
    except Exception:
        return False
    return any(rt == r or rt.startswith(r + os.sep) for r in allowed_roots)


def restore_backup(archive_path: str) -> Dict[str, Any]:
    """Extract a backup archive back into $HOME, restoring SLSDeck config,
    manifests, depot keys, luas, and settings. Path-traversal guarded.

    Does NOT auto-activate injection — restoring on a drifted/incompatible client
    could crash Steam. After restoring, run the client fix if needed, then
    Activate injection and restart."""
    archive_path = str(archive_path or "").strip()
    if not archive_path or not os.path.isfile(archive_path):
        return {"success": False, "error": "Backup archive file not found"}

    home = get_user_home()
    allowed_roots = []
    for _p in (slssteam.config_dir(), stplugin_dir(), get_settings_dir(),
               os.path.join(home, ".config", "SLSsteam"),
               os.path.join(home, ".steam", "steam", "config", "stplug-in")):
        try:
            allowed_roots.append(os.path.realpath(_p))
        except Exception:
            pass
    restored = 0
    saves_to_prefix = 0
    saves_to_staging = 0
    skipped: List[str] = []
    try:
        with tarfile.open(archive_path, "r:*") as tar:
            for member in tar.getmembers():
                # Saves: put them back exactly where they were taken — the game's
                # Proton prefix if it's installed, else the ~/slsdeck_saves staging
                # folder. Handled separately from the $HOME-relative members.
                dest = _resolve_save_target(member.name, home)
                if dest is not None:
                    base, rel, to_prefix = dest
                    if not is_safe_path(base, rel):
                        skipped.append(member.name)
                        continue
                    target = os.path.join(base, rel)
                    try:
                        if member.isdir():
                            os.makedirs(target, exist_ok=True)
                        elif member.isfile():
                            os.makedirs(os.path.dirname(target), exist_ok=True)
                            src = tar.extractfile(member)
                            if src is not None:
                                with src, open(target, "wb") as out:
                                    shutil.copyfileobj(src, out)
                                chown_to_user(target, recursive=False)
                                restored += 1
                                if to_prefix:
                                    saves_to_prefix += 1
                                else:
                                    saves_to_staging += 1
                    except Exception as exc:
                        logger.warn(f"SLSDeck restore: save {member.name} failed: {exc}")
                    continue

                # Reject links outright -- a symlink/hardlink member is the
                # classic way to redirect a write outside the allowed set after
                # the name check has already passed.
                if member.issym() or member.islnk():
                    skipped.append(member.name)
                    logger.warn(f"SLSDeck restore: skipping link entry {member.name}")
                    continue
                if not is_safe_path(home, member.name):
                    skipped.append(member.name)
                    logger.warn(f"SLSDeck restore: skipping unsafe entry {member.name}")
                    continue
                target = os.path.join(home, member.name)
                # The $HOME guard alone is not enough: an archive (ours, an old
                # one, or a hand-crafted one a user was talked into importing)
                # can carry ".bashrc" or ".ssh/authorized_keys", which are
                # technically inside $HOME and would be happily overwritten.
                # Restrict writes to the directories SLSDeck actually owns.
                if not _within_allowed(target, allowed_roots):
                    skipped.append(member.name)
                    logger.warn(f"SLSDeck restore: {member.name} is outside "
                                "SLSDeck's own directories - skipping")
                    continue
                try:
                    if member.isdir():
                        os.makedirs(target, exist_ok=True)
                        chown_to_user(target, recursive=False)
                    elif member.isfile():
                        os.makedirs(os.path.dirname(target), exist_ok=True)
                        tar.extract(member, path=home)
                        chown_to_user(target, recursive=False)
                        restored += 1
                except Exception as exc:
                    logger.warn(f"SLSDeck restore: failed {member.name}: {exc}")

        # The restored settings.json is on disk, but the in-memory settings cache
        # still holds the pre-restore values and would be written straight back
        # over it on the next save. Drop the cache so the restored file wins.
        try:
            from . import settings as _settings
            _settings.reset_cache()
        except Exception:
            pass

        # Re-seed config (idempotent) + hand the restored files back to the user,
        # but do NOT re-activate injection here (see docstring).
        try:
            slssteam.ensure_config()
            for p in (slssteam.config_dir(), slssteam.lib_dir(), stplugin_dir()):
                if os.path.exists(p):
                    chown_to_user(p, recursive=True)
        except Exception:
            pass

        logger.log(f"SLSDeck restore: {restored} file(s) from {archive_path} "
                   f"(saves: {saves_to_prefix} into prefixes, {saves_to_staging} staged)")
        return {
            "success": True,
            "restoredCount": restored,
            "savesToPrefix": saves_to_prefix,
            "savesToStaging": saves_to_staging,
            "skipped": skipped[:20],
            "archivePath": archive_path,
        }
    except Exception as exc:
        logger.error(f"SLSDeck backup restore failed: {exc}")
        return {"success": False, "error": str(exc)}
