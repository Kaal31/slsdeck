"""Generic helpers for file and data handling."""

from __future__ import annotations

import json
import re
from typing import Any, Dict

from .logger import logger


def read_text(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read()
    except Exception:
        return ""


def write_text(path: str, text: str) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def read_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {}


def count_apis(text: str) -> int:
    try:
        data = json.loads(text)
        apis = data.get("api_list", [])
        if isinstance(apis, list):
            return len(apis)
    except Exception:
        pass
    return text.count('"name"')


def normalize_manifest_text(text: str) -> str:
    content = (text or "").strip()
    if not content:
        return content

    content = re.sub(r",\s*]", "]", content)
    content = re.sub(r",\s*}\s*$", "}", content)

    if content.startswith('"api_list"') or content.startswith("'api_list'") or content.startswith("api_list"):
        if not content.startswith("{"):
            content = "{" + content
        if not content.endswith("}"):
            content = content.rstrip(",") + "}"

    try:
        json.loads(content)
        return content
    except Exception:
        return text


# ── privilege helpers (the backend runs as root under Decky's root flag; files
# we create in deck-owned space must be handed back to the desktop user so Steam
# and Proton can manage them, e.g. verify/update a game with a fix applied) ────
import os as _os


def is_root() -> bool:
    try:
        return _os.geteuid() == 0
    except Exception:
        return False


def decky_user() -> str:
    val = _os.environ.get("DECKY_USER")
    if val and val != "root":
        return val
    home = (_os.environ.get("DECKY_USER_HOME") or _os.environ.get("HOME") or "/home/deck").rstrip("/")
    user = _os.path.basename(home)
    if user and user != "root":
        return user
    return "deck"


def write_json(path: str, data: Dict[str, Any]) -> bool:
    """Write data to path atomically using a temp file and user chown."""
    tmp = f"{path}.tmp.{_os.getpid()}"
    try:
        _os.makedirs(_os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2)
        try:
            _os.chmod(tmp, 0o644)
            chown_to_user(tmp, recursive=False)
        except Exception:
            pass
        _os.replace(tmp, path)
        return True
    except Exception as exc:
        logger.warn(f"write_json failed for {path}: {exc}")
        try:
            if _os.path.exists(tmp):
                _os.remove(tmp)
        except Exception:
            pass
        return False


def is_safe_path(base_path: str, target_path: str) -> bool:
    """Check if target_path stays within base_path (prevents path traversal)."""
    if not base_path or not target_path:
        return False
    try:
        # realpath, NOT abspath. abspath is purely lexical, so a symlink that
        # already exists inside base_path and points outside it is approved --
        # an archive can then write straight through it to anywhere on disk.
        # realpath resolves those links (and resolves existing parent components
        # even when the final entry does not exist yet, which is the case during
        # extraction).
        abs_base = _os.path.realpath(base_path)
        abs_target = _os.path.realpath(_os.path.join(base_path, target_path))
        return abs_target == abs_base or abs_target.startswith(abs_base + _os.sep)
    except Exception:
        return False


def safe_extract(archive, dest_dir: str, kind: str = "zip") -> int:
    """Extract a zip/tar into dest_dir, refusing anything that escapes it.

    ``ZipFile.extractall`` / ``TarFile.extractall`` happily honour members named
    "../../x" or symlink members pointing outside the destination ("zip slip"),
    which turns any downloaded archive into arbitrary file write. These archives
    come off the network -- Workshop payloads via a third-party mirror, Proton
    tarballs off GitHub -- so they are exactly the untrusted input that attack
    targets. Returns the number of members actually written.

    (Python 3.12+ has tarfile's ``filter="data"``, but this must also cover zips
    and must behave identically on the 3.11 runtimes still in the wild.)
    """
    written = 0
    members = archive.infolist() if kind == "zip" else archive.getmembers()
    for member in members:
        name = member.filename if kind == "zip" else member.name
        if kind == "tar":
            # Links are the other half of the escape: a symlink member can
            # redirect a later write outside dest_dir after the name check.
            if member.issym() or member.islnk():
                _log_skip(name, "link entry")
                continue
            if not (member.isfile() or member.isdir()):
                _log_skip(name, "special file")
                continue
        if _os.path.isabs(name) or name.startswith(("/", "\\")):
            _log_skip(name, "absolute path")
            continue
        if not is_safe_path(dest_dir, name):
            _log_skip(name, "escapes the destination")
            continue
        try:
            archive.extract(member, path=dest_dir)
            if kind == "zip" and not name.endswith("/"):
                written += 1
            elif kind == "tar" and member.isfile():
                written += 1
        except Exception as exc:
            _log_skip(name, f"extract failed: {exc}")
    return written


def _log_skip(name: str, why: str) -> None:
    try:
        from .logger import logger
        logger.warn(f"SLSDeck: refusing archive entry {name!r} ({why})")
    except Exception:
        pass


# Directories that must never be walked by a recursive chown. Handing one of
# these to chown_to_user(recursive=True) walks tens of thousands of files -- on a
# stock Deck ~/.config alone is ~8000 entries / >1 GB -- and callers were doing
# exactly that on a 5-minute watchdog timer, which is what made Game Mode crawl.
# Walking them is also pointless: they already belong to the desktop user.
_NEVER_WALK = (
    "", ".config", ".local", ".local/share", ".steam", ".local/share/Steam",
    ".var", ".cache",
)


def _too_broad_to_walk(path: str) -> bool:
    try:
        real = _os.path.realpath(path)
    except Exception:
        return False
    home = _os.path.realpath(
        _os.environ.get("DECKY_USER_HOME") or f"/home/{decky_user()}")
    blocked = {_os.path.normpath(_os.path.join(home, rel)) for rel in _NEVER_WALK}
    blocked.update({"/", "/home", "/usr", "/etc", "/var", "/opt", "/run"})
    return real in blocked


def chown_to_user(path: str, recursive: bool = True) -> None:
    """Give `path` (and its tree) back to the desktop user when running as root, safely skipping symlinks."""
    if not is_root() or not path or not _os.path.exists(path):
        return
    if recursive and _too_broad_to_walk(path):
        # Still fix the directory entry itself -- just never descend into it.
        logger.warn(f"chown: refusing recursive walk of {path} (too broad)")
        recursive = False
    try:
        import pwd
        pw = pwd.getpwnam(decky_user())
        uid, gid = pw.pw_uid, pw.pw_gid
    except Exception as exc:
        logger.warn(f"chown skipped ({exc})")
        return
    try:
        if not _os.path.islink(path):
            _os.chown(path, uid, gid)
        if recursive and _os.path.isdir(path) and not _os.path.islink(path):
            for root, dirs, files in _os.walk(path, followlinks=False):
                for name in dirs + files:
                    item = _os.path.join(root, name)
                    if not _os.path.islink(item):
                        try:
                            _os.chown(item, uid, gid)
                        except Exception:
                            pass
    except Exception as exc:
        logger.warn(f"chown failed for {path}: {exc}")

