"""Filesystem path helpers for the SLSDeck Decky backend.

On SteamOS / Steam Deck the plugin runs under decky-loader, which provides a
set of environment-derived directories. We store mutable runtime data (api
manifest, download temp, loaded-app logs, cached databases) under the plugin
runtime dir and the API key under the plugin settings dir.
"""

from __future__ import annotations

import os

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
    """Home directory of the Steam Deck user (e.g. /home/deck)."""
    home = _env("DECKY_USER_HOME", _env("HOME", os.path.expanduser("~")))
    if not home or home.rstrip("/") in ("/root", "", "/"):
        if os.path.isdir("/home/deck"):
            return "/home/deck"
        try:
            import pwd
            for user in ("deck", "steam", "gamer", "fedora", "ubuntu", "arch"):
                try:
                    pw = pwd.getpwnam(user)
                    if pw and pw.pw_dir and os.path.isdir(pw.pw_dir):
                        return pw.pw_dir
                except Exception:
                    pass
        except Exception:
            pass
        return "/home/deck"
    return home


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
