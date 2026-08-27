"""Filesystem path helpers for the SLSDeck Decky backend.

On SteamOS / Steam Deck the plugin runs under decky-loader, which provides a
set of environment-derived directories. We store mutable runtime data (api
manifest, download temp, loaded-app logs, cached databases) under the plugin
runtime dir and the API key under the plugin settings dir.
"""

from __future__ import annotations

import os
import pwd

try:
    import decky  # type: ignore
except Exception:  # pragma: no cover - allow import outside decky for testing
    decky = None  # type: ignore


def _env(name: str, default: str) -> str:
    if decky is not None:
        value = getattr(decky, name, None)
        if value:
            return str(value)
    value = os.environ.get(name)
    if value:
        return value
    return default


def get_plugin_dir() -> str:
    """Directory containing this plugin's files (read-only-ish)."""
    here = os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
    return _env("DECKY_PLUGIN_DIR", here)


def get_runtime_dir() -> str:
    """Writable directory for runtime data. Created if missing."""
    default = os.path.join(get_plugin_dir(), "runtime")
    path = _env("DECKY_PLUGIN_RUNTIME_DIR", default)
    os.makedirs(path, exist_ok=True)
    return path


def get_settings_dir() -> str:
    """Writable directory for persisted settings. Created if missing."""
    default = os.path.join(get_plugin_dir(), "settings")
    path = _env("DECKY_PLUGIN_SETTINGS_DIR", default)
    os.makedirs(path, exist_ok=True)
    return path


def get_user_home() -> str:
    """Home directory of the desktop user running Steam.

    Decky normally exports ``DECKY_USER_HOME``.  On non-SteamOS Decky hosts
    (notably CachyOS) that variable has not always been present, and the backend
    itself runs as root.  Do not fall back to a list of distribution-specific
    usernames: score real login users by whether their home contains Steam or
    Decky's homebrew tree instead.
    """
    home = _env("DECKY_USER_HOME", _env("HOME", os.path.expanduser("~")))
    if home and home.rstrip("/") not in ("/root", "", "/") and os.path.isdir(home):
        return os.path.realpath(home)

    # Explicit user identity is the next most authoritative source.
    for key in ("DECKY_USER", "SUDO_USER", "USER"):
        user = (os.environ.get(key) or "").strip()
        if not user or user == "root":
            continue
        try:
            candidate = pwd.getpwnam(user).pw_dir
            if candidate and os.path.isdir(candidate):
                return os.path.realpath(candidate)
        except (KeyError, OSError):
            continue

    def _score(candidate: str) -> int:
        score = 0
        for rel in (
            (".steam", "steam"),
            (".local", "share", "Steam"),
            (".var", "app", "com.valvesoftware.Steam"),
        ):
            if os.path.isdir(os.path.join(candidate, *rel)):
                score += 10
        if os.path.isdir(os.path.join(candidate, "homebrew")):
            score += 4
        if candidate.startswith("/home/") or candidate.startswith("/var/home/"):
            score += 1
        return score

    candidates = []
    try:
        for entry in pwd.getpwall():
            candidate = entry.pw_dir or ""
            if entry.pw_uid < 1000 or entry.pw_name in ("nobody", "root"):
                continue
            if candidate and os.path.isdir(candidate):
                candidates.append((_score(candidate), entry.pw_uid, candidate))
    except OSError:
        pass
    if candidates:
        candidates.sort(key=lambda item: (-item[0], item[1], item[2]))
        return os.path.realpath(candidates[0][2])

    # Historical last resort.  Returning the path keeps diagnostics usable,
    # while the installer preflight now rejects it when it does not exist.
    return "/home/deck"


def plugin_path(*parts: str) -> str:
    return os.path.join(get_plugin_dir(), *parts)


def runtime_path(*parts: str) -> str:
    return os.path.join(get_runtime_dir(), *parts)


def settings_path(*parts: str) -> str:
    return os.path.join(get_settings_dir(), *parts)


def defaults_path(filename: str) -> str:
    return plugin_path("defaults", filename)


def ensure_temp_download_dir() -> str:
    root = runtime_path("temp_dl")
    os.makedirs(root, exist_ok=True)
    return root
