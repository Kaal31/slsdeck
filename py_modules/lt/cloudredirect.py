"""CloudRedirect control surface.

CloudRedirect ("Steam Cloud" for lua/added games, redirecting saves to Google
Drive / OneDrive / a local folder) is installed by the h3adcr-b client fix when
the SLSsteam config has ``DisableCloud: no``. This module exposes the native
controls the plugin UI needs:

  * a toggle for that ``DisableCloud`` flag (on = cloud saves via CloudRedirect),
  * provider selection, OAuth, stats toggles, and save discovery using the file
    contract consumed directly by cloudredirect-moon.

The legacy Flatpak is migration input only and is not installed or launched.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
from .paths import defaults_path, runtime_path
import re
import secrets
import socket
import subprocess
import tarfile
import tempfile
import threading
import time
import zipfile
from urllib.parse import parse_qs, urlencode, urlsplit

from .logger import logger
from .httpc import ensure_http_client
from .utils import chown_to_user
from . import slssteam, settings

_slssteam_add_app = slssteam.add_app

CR_APP_ID = "org.cloudredirect.CloudRedirect"
CR_REPO = "https://raw.githubusercontent.com/Selectively11/CloudRedirect/refs/heads/gh-pages/cloudredirect.flatpakrepo"
FLATHUB_REPO = "https://dl.flathub.org/repo/flathub.flatpakrepo"
KDE_RUNTIME = "org.kde.Platform//6.10"
# The actual save-redirect library (we were only doing the flatpak app before —
# this .so is what makes redirection work).
#
# We ALWAYS install the patched moon hook, for BOTH build variants — this is the
# exact source luatools-moon/install.sh ships (CR_SO_URL). The old Selectively11
# ``linux-test`` release .so was the WRONG version for our moon engine and was
# why cloud redirect silently didn't work; the moon fork adds the cross-distro
# attach fixes, legacy save-layout healing, and worker-thread crash containment
# the moon steamclient needs. It's a committed 32-bit ELF on master (not LFS),
# loaded into Steam via LD_PRELOAD. The flatpak app below stays Selectively11
# (same app id — it's a fork, so the config/token layout is identical and the
# moon .so reads it fine); only the injected library changes here.
CR_LIB_URL_MOON = "https://raw.githubusercontent.com/swwayps/cloudredirect-moon/master/cloud_redirect.so"
# Back-compat alias (older call sites referenced CR_LIB_URL); both point at moon.
CR_LIB_URL = CR_LIB_URL_MOON
CR_OAUTH_SOURCE_URL = ("https://raw.githubusercontent.com/swwayps/cloudredirect-moon/"
                       "67d2c81a2064718acbcd0351874c640295803525/ui-linux/src/oauthservice.cpp")
_OAUTH_SECRET_NAMES = {
    "gdrive": "GDRIVE_CLIENT_SECRET",
    "onedrive": "ONEDRIVE_CLIENT_SECRET",
}
_OAUTH_SECRETS = {}

_PROVIDERS = {
    "gdrive": {
        "client_id": "1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com",
        "scope": "https://www.googleapis.com/auth/drive.file",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        # CloudRedirect Moon's Linux UI uses this registered fixed callback.
        "fixed_port": 53692,
        "redirect_path": "/callback",
        "access_type": "offline",
        "body_scope": False,
    },
    "onedrive": {
        "client_id": "b15665d9-eda6-4092-8539-0eec376afd59",
        "scope": "Files.ReadWrite offline_access",
        "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "fixed_port": 53682,
        "redirect_path": "/",
        "access_type": None,
        "body_scope": True,
    },
}
_AUTH_TIMEOUT = 5 * 60
_AUTH_LOCK = threading.Lock()
_AUTH_PENDING = None
_AUTH_RESULT = None
_TOKEN_REFRESH_LOCK = threading.Lock()
_REMOTE_APPS_CACHE = {}
_REMOTE_APPS_CACHE_SECONDS = 60
_IMPORT_MAX_FILES = 20000
_IMPORT_MAX_BYTES = 4 * 1024 * 1024 * 1024
_MIGRATION_LOCK = threading.Lock()
_MIGRATION_HISTORY = ".slsdeck-provider-migrations.json"
_FOLDER_BRIDGE = "tokens_folder.json"


def _native_config_dir() -> str:
    return os.path.join(slssteam._home(), ".config", "CloudRedirect")


def _native_config_path() -> str:
    return os.path.join(_native_config_dir(), "config.json")


def _legacy_config_dirs() -> list:
    home = slssteam._home()
    return [
        os.path.join(home, ".var", "app", CR_APP_ID, "config", "CloudRedirect"),
        os.path.join(home, ".var", "app", CR_APP_ID, "config"),
        os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".config", "CloudRedirect"),
    ]


def _read_provider_config() -> dict:
    try:
        with open(_native_config_path(), "r", encoding="utf-8") as fh:
            value = json.load(fh)
        if isinstance(value, dict):
            value.setdefault("provider", "local")
            return value
    except Exception:
        pass
    return {"provider": "local"}


def _write_json_atomic(path: str, value: dict, mode: int = 0o600) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp.slsdeck.{os.getpid()}.{secrets.token_hex(4)}"
    try:
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(value, fh, separators=(",", ":"))
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.chmod(tmp, mode)
        os.replace(tmp, path)
        chown_to_user(path, recursive=False)
        chown_to_user(os.path.dirname(path), recursive=False)
    finally:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass


def _token_path(provider: str, cfg: dict | None = None) -> str:
    cfg = cfg or _read_provider_config()
    override = cfg.get("token_path")
    if isinstance(override, str) and override.strip():
        override = override.strip()
        return override if os.path.isabs(override) else os.path.join(_native_config_dir(), override)
    return os.path.join(_native_config_dir(), f"tokens_{provider}.json")


def _has_refresh_token(path: str) -> bool:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            value = json.load(fh)
        return isinstance(value, dict) and bool(str(value.get("refresh_token") or "").strip())
    except Exception:
        return False


def _provider_access_token(provider: str) -> str:
    """Return a live provider token, refreshing CloudRedirect's token file.

    The injected hook and the former companion share this exact JSON contract,
    so refreshing here also leaves a valid token for the next game sync.
    """
    cfg = _read_provider_config()
    path = _token_path(provider, cfg)
    with _TOKEN_REFRESH_LOCK:
        try:
            with open(path, "r", encoding="utf-8") as fh:
                token = json.load(fh)
        except Exception:
            return ""
        access = str(token.get("access_token") or "")
        if access and int(token.get("expires_at") or 0) > int(time.time()) + 60:
            return access
        refresh = str(token.get("refresh_token") or "")
        spec = _PROVIDERS.get(provider)
        if not refresh or not spec:
            return ""
        form = {
            "client_id": spec["client_id"], "refresh_token": refresh,
            "grant_type": "refresh_token",
        }
        if spec["body_scope"]:
            form["scope"] = spec["scope"]
        try:
            form["client_secret"] = _oauth_client_secret(provider)
            response = ensure_http_client("CloudRedirect remote discovery").post(
                spec["token_url"], data=form, timeout=30,
            )
            response.raise_for_status()
            fresh = response.json()
            access = str(fresh.get("access_token") or "")
            if not access:
                return ""
            token["access_token"] = access
            token["expires_at"] = int(time.time()) + int(fresh.get("expires_in") or 3600)
            if fresh.get("refresh_token"):
                token["refresh_token"] = str(fresh["refresh_token"])
            _write_json_atomic(path, token)
            return access
        except Exception as exc:
            logger.warn(f"CloudRedirect: {provider} token refresh failed: {exc}")
            return ""


def migrate_provider_data() -> dict:
    """Copy legacy Flatpak provider files/saves into Moon's native contract.

    Existing native files win and legacy copies are retained, making migration
    non-destructive for users who already authenticated through the old app.
    """
    import shutil
    target = _native_config_dir()
    os.makedirs(target, exist_ok=True)
    copied = []
    for source in _legacy_config_dirs():
        if not os.path.isdir(source):
            continue
        for name in ("config.json", "tokens_gdrive.json", "tokens_onedrive.json"):
            src, dst = os.path.join(source, name), os.path.join(target, name)
            if os.path.isfile(src) and not os.path.exists(dst):
                try:
                    shutil.copy2(src, dst)
                    os.chmod(dst, 0o600)
                    chown_to_user(dst, recursive=False)
                    copied.append(name)
                except OSError as exc:
                    logger.warn(f"CloudRedirect: migration of {src} failed: {exc}")
        legacy_storage = os.path.join(source, "storage")
        native_storage = os.path.join(target, "storage")
        if os.path.isdir(legacy_storage):
            for current, dirs, names in os.walk(legacy_storage):
                relative = os.path.relpath(current, legacy_storage)
                destination = native_storage if relative == "." else os.path.join(native_storage, relative)
                try:
                    os.makedirs(destination, exist_ok=True)
                except OSError as exc:
                    logger.warn(f"CloudRedirect: save migration mkdir failed: {exc}")
                    dirs[:] = []
                    continue
                for name in names:
                    src, dst = os.path.join(current, name), os.path.join(destination, name)
                    if os.path.exists(dst):
                        continue
                    try:
                        shutil.copy2(src, dst)
                        copied.append(os.path.join("storage", relative, name))
                    except OSError as exc:
                        logger.warn(f"CloudRedirect: save migration of {src} failed: {exc}")
    if not os.path.isfile(_native_config_path()):
        _write_json_atomic(_native_config_path(), {"provider": "local"})
        copied.append("config.json(default)")
    chown_to_user(target, recursive=True)
    return {"success": True, "copied": copied, "configPath": _native_config_path()}


def _is_simple_variant() -> bool:
    """True on the v1 (slsdecksimple) package. That build ships without
    ``depotdl.py`` (excluded at package time), so its absence next to this module
    is our build-variant signal — no extra marker file needed."""
    return not os.path.isfile(os.path.join(os.path.dirname(__file__), "depotdl.py"))


def _cr_lib_url() -> str:
    """The CloudRedirect .so URL — the patched moon hook for every build variant
    (matches luatools-moon/install.sh, which always ships the moon .so)."""
    return CR_LIB_URL_MOON


def _cr_dirs() -> list:
    """CloudRedirect data dir(s) the .so must land in — native, plus the Flatpak
    Steam location when that's what's installed (mirrors headcrab)."""
    home = slssteam._home()
    dirs = [os.path.join(home, ".local", "share", "CloudRedirect")]
    try:
        if slssteam._is_flatpak_steam():
            dirs.append(os.path.join(home, ".var", "app", "com.valvesoftware.Steam",
                                     ".local", "share", "CloudRedirect"))
    except Exception:
        pass
    return dirs


def _uid() -> int:
    try:
        import pwd
        return pwd.getpwnam(slssteam._decky_user()).pw_uid
    except Exception:
        return 1000


def _wrap_cr(cmd: list) -> list:
    """Like slssteam._wrap_as_user, but also hands the user session's runtime dir
    + DBUS to flatpak — the piece headcrab has for free (it runs in the real
    session) and whose absence made our install flakier than headcrab's."""
    base = slssteam._wrap_as_user(cmd)
    if base is cmd:  # not root → already in the user session
        return cmd
    uid = _uid()
    extra = [f"XDG_RUNTIME_DIR=/run/user/{uid}",
             f"DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{uid}/bus"]
    try:
        i = base.index("env") + 1
        return base[:i] + extra + base[i:]
    except ValueError:
        return base


def _folder_writable(path: str) -> bool:
    """Check access as the desktop/Steam user, not Decky's root backend."""
    if not path or not os.path.isdir(path):
        return False
    try:
        return subprocess.run(
            _wrap_cr(["test", "-w", path]), check=False,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        ).returncode == 0
    except Exception:
        return False


def _running_sls_apps() -> list[int]:
    """Return SLS AppIDs found in live process environments."""
    managed = {int(x) for x in slssteam.read_additional_apps() if int(x) > 0}
    running = set()
    if not managed:
        return []
    try:
        pids = os.listdir("/proc")
    except OSError:
        return []
    for pid in pids:
        if not pid.isdigit():
            continue
        try:
            with open(os.path.join("/proc", pid, "environ"), "rb") as fh:
                entries = fh.read().split(b"\0")
            for entry in entries:
                if entry.startswith((b"SteamAppId=", b"SteamGameId=")):
                    value = entry.split(b"=", 1)[1].decode("ascii", "ignore")
                    if value.isdigit() and int(value) in managed:
                        running.add(int(value))
        except OSError:
            continue
    return sorted(running)


def _file_digest(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _migration_history_append(result: dict) -> None:
    path = os.path.join(_native_config_dir(), _MIGRATION_HISTORY)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            history = json.load(fh)
        if not isinstance(history, list):
            history = []
    except Exception:
        history = []
    record = {k: v for k, v in result.items() if k not in ("success", "error")}
    record["timestamp"] = int(time.time())
    history.append(record)
    _write_json_atomic(path, history[-50:])


def _sync_provider_tree(source: str, destination: str, source_name: str,
                        destination_name: str) -> dict:
    """Incrementally merge provider data without deleting either side."""
    result = {
        "success": False, "source": source_name, "destination": destination_name,
        "inspected": 0, "copied": 0, "updated": 0, "identical": 0,
        "conflicts": 0, "failed": 0, "bytes": 0,
    }
    if not os.path.isdir(source):
        result.update({"success": True, "note": "Source has no saves yet"})
        return result
    os.makedirs(destination, exist_ok=True)
    for current, dirs, names in os.walk(source, followlinks=False):
        dirs[:] = [d for d in dirs if d != ".slsdeck-conflicts" and
                   not os.path.islink(os.path.join(current, d))]
        relative = os.path.relpath(current, source)
        target_dir = destination if relative == "." else os.path.join(destination, relative)
        os.makedirs(target_dir, exist_ok=True)
        for name in names:
            src = os.path.join(current, name)
            if os.path.islink(src) or not os.path.isfile(src):
                continue
            result["inspected"] += 1
            dst = os.path.join(target_dir, name)
            staged = ""
            try:
                src_stat = os.stat(src)
                action = "copied"
                final_dst = dst
                if os.path.exists(dst):
                    if not os.path.isfile(dst):
                        raise OSError("destination entry is not a regular file")
                    dst_stat = os.stat(dst)
                    if src_stat.st_size == dst_stat.st_size and _file_digest(src) == _file_digest(dst):
                        result["identical"] += 1
                        continue
                    delta = src_stat.st_mtime_ns - dst_stat.st_mtime_ns
                    if delta > 1_000_000_000:
                        action = "updated"
                    elif delta < -1_000_000_000:
                        result["identical"] += 1
                        continue
                    else:
                        suffix = _file_digest(src)[:10]
                        relative_file = os.path.relpath(dst, destination)
                        final_dst = os.path.join(destination, ".slsdeck-conflicts", suffix,
                                                 relative_file)
                        os.makedirs(os.path.dirname(final_dst), exist_ok=True)
                        if os.path.exists(final_dst) and _file_digest(src) == _file_digest(final_dst):
                            result["identical"] += 1
                            continue
                        action = "conflicts"
                staged = f"{final_dst}.slsdeck-stage-{os.getpid()}-{secrets.token_hex(3)}"
                shutil.copy2(src, staged)
                if os.path.getsize(staged) != src_stat.st_size or _file_digest(staged) != _file_digest(src):
                    raise OSError("copy verification failed")
                os.replace(staged, final_dst)
                result[action] += 1
                result["bytes"] += src_stat.st_size
            except Exception as exc:
                result["failed"] += 1
                logger.warn(f"CloudRedirect migration: {src} failed: {exc}")
                try:
                    if staged and os.path.exists(staged):
                        os.remove(staged)
                except OSError:
                    pass
    result["success"] = result["failed"] == 0
    if result["success"]:
        chown_to_user(destination, recursive=True)
    _migration_history_append(result)
    return result


def _install_folder_bridge(folder: str) -> dict:
    """Support Moon builds that treat tokens_folder.json as provider root."""
    bridge = os.path.join(_native_config_dir(), _FOLDER_BRIDGE)
    try:
        if os.path.islink(bridge):
            if os.path.realpath(bridge) == os.path.realpath(folder):
                return {"success": True, "path": bridge}
            os.unlink(bridge)
        elif os.path.exists(bridge):
            os.replace(bridge, f"{bridge}.legacy-{int(time.time())}")
        staged = f"{bridge}.slsdeck-stage-{os.getpid()}"
        try:
            os.unlink(staged)
        except FileNotFoundError:
            pass
        os.symlink(folder, staged, target_is_directory=True)
        os.replace(staged, bridge)
        chown_to_user(bridge, recursive=False)
        return {"success": True, "path": bridge}
    except Exception as exc:
        return {"success": False, "error": f"Could not activate Moon folder bridge: {exc}"}


def _remove_folder_bridge() -> None:
    bridge = os.path.join(_native_config_dir(), _FOLDER_BRIDGE)
    try:
        if os.path.islink(bridge):
            os.unlink(bridge)
    except OSError as exc:
        logger.warn(f"CloudRedirect: could not remove folder bridge: {exc}")


def _transition_provider(provider: str, folder: str = "") -> dict:
    """Reconcile local/folder data before atomically activating a provider."""
    running = _running_sls_apps()
    if running:
        return {"success": False, "error": "Close running SLS games before changing save providers",
                "runningAppIds": running}
    with _MIGRATION_LOCK:
        cfg = _read_provider_config()
        previous = str(cfg.get("provider") or "local")
        previous_folder = str(cfg.get("sync_folder_path") or "").strip()
        cache = os.path.join(_native_config_dir(), "storage")
        migrations = []
        if provider == "folder" and (not folder or not os.path.isdir(folder) or not _folder_writable(folder)):
            return {"success": False, "error": "The selected custom folder is unavailable or not writable"}
        if previous in _PROVIDERS and previous != provider:
            remote, remote_error = _discover_remote_apps(previous)
            local = set()
            if os.path.isdir(cache):
                for account in os.listdir(cache):
                    account_root = os.path.join(cache, account)
                    if not account.isdigit() or not os.path.isdir(account_root):
                        continue
                    for appid in os.listdir(account_root):
                        if appid.isdigit() and os.path.isdir(os.path.join(account_root, appid)):
                            local.add((int(account), int(appid)))
            missing = sorted(set(remote) - local)
            if remote_error:
                return {"success": False, "error": "Could not verify that all remote saves are cached locally: " + remote_error}
            if missing:
                return {"success": False,
                        "error": "Some cloud-only saves are not cached locally; open those games before changing providers",
                        "remoteOnly": [{"account": account, "appid": appid} for account, appid in missing]}
        changing_folder = provider != "folder" or (
            previous_folder and os.path.realpath(previous_folder) != os.path.realpath(folder)
        )
        if previous == "folder" and previous_folder and changing_folder:
            imported = _sync_provider_tree(previous_folder, cache, "custom folder", "local cache")
            migrations.append(imported)
            if not imported["success"]:
                return {"success": False, "error": "Could not safely import the current custom folder",
                        "migration": imported}
        if provider == "folder":
            # The destination may already contain newer saves (for example an
            # existing Syncthing folder). Import it before exporting the merge.
            imported_destination = _sync_provider_tree(
                folder, cache, "custom folder", "local cache",
            )
            migrations.append(imported_destination)
            if not imported_destination["success"]:
                return {"success": False, "error": "Could not safely import the selected custom folder",
                        "migration": imported_destination}
            exported = _sync_provider_tree(cache, folder, "local cache", "custom folder")
            migrations.append(exported)
            if not exported["success"]:
                return {"success": False, "error": "Could not safely populate the custom folder",
                        "migration": exported}
            bridge = _install_folder_bridge(folder)
            if not bridge["success"]:
                return bridge
        else:
            _remove_folder_bridge()
        new_cfg = dict(cfg)
        new_cfg["provider"] = provider
        if provider == "folder":
            new_cfg["sync_folder_path"] = folder
        _write_json_atomic(_native_config_path(), new_cfg)
        status = provider_status()
        status["migrations"] = migrations
        status["restartRequired"] = True
        if provider in _PROVIDERS:
            status["migrationNote"] = "Local cache will synchronize through CloudRedirect after Steam restarts"
        return status


def provider_status() -> dict:
    """Return the native configuration consumed by cloudredirect-moon."""
    migrate_provider_data()
    cfg = _read_provider_config()
    provider = str(cfg.get("provider") or "local")
    sync_folder_path = str(cfg.get("sync_folder_path") or "").strip()
    folder_ready = provider == "folder" and bool(sync_folder_path) and os.path.isdir(sync_folder_path)
    folder_writable = folder_ready and _folder_writable(sync_folder_path)
    bridge_path = os.path.join(_native_config_dir(), _FOLDER_BRIDGE)
    bridge_ready = (folder_ready and os.path.islink(bridge_path) and
                    os.path.realpath(bridge_path) == os.path.realpath(sync_folder_path))
    repair = None
    if folder_writable and not bridge_ready:
        # Self-heal configurations written before the Moon folder-root mismatch
        # was handled. Reconcile both sides before the bridge is activated.
        cache = os.path.join(_native_config_dir(), "storage")
        imported = _sync_provider_tree(sync_folder_path, cache, "custom folder", "local cache")
        repair = imported
        if imported["success"]:
            exported = _sync_provider_tree(cache, sync_folder_path, "local cache", "custom folder")
            repair = dict(exported)
            for key in ("inspected", "copied", "updated", "identical", "conflicts", "failed", "bytes"):
                repair[key] = int(imported.get(key) or 0) + int(exported.get(key) or 0)
            if exported["success"]:
                bridge_ready = bool(_install_folder_bridge(sync_folder_path).get("success"))
    providers = [p for p in _PROVIDERS if _has_refresh_token(_token_path(p, cfg))]
    authenticated = provider in providers
    return {
        "success": True,
        "configured": provider == "local" or authenticated or (folder_writable and bridge_ready),
        "authenticated": authenticated,
        "provider": provider,
        "providers": providers,
        "syncFolderPath": sync_folder_path,
        "folderReady": folder_ready,
        "folderWritable": folder_writable,
        "folderBridgeReady": bridge_ready,
        "repairMigration": repair,
        "syncAchievements": cfg.get("sync_achievements") is True,
        "syncPlaytime": cfg.get("sync_playtime") is True,
        "native": True,
    }


def set_provider(provider: str) -> dict:
    provider = str(provider or "").lower()
    if provider not in ("local", "folder", "gdrive", "onedrive"):
        return {"success": False, "error": "unknown provider"}
    migrate_provider_data()
    try:
        cfg = _read_provider_config()
        if provider == "folder":
            folder = str(cfg.get("sync_folder_path") or "").strip()
            if not folder:
                return {"success": False, "error": "Choose a custom folder first"}
            return _transition_provider(provider, folder)
        if provider in _PROVIDERS and not _has_refresh_token(_token_path(provider, cfg)):
            status = provider_status()
            # Let the frontend present the provider and start OAuth without
            # activating a provider that cannot initialize yet.
            status.update({"provider": provider, "configured": False,
                           "authenticated": False, "pendingProvider": True})
            return status
        return _transition_provider(provider)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def set_sync_folder(path: str) -> dict:
    """Select CloudRedirect Moon's folder/network-drive provider root."""
    migrate_provider_data()
    raw = str(path or "").strip()
    if not raw:
        return {"success": False, "error": "Choose a folder first"}
    if raw == "~" or raw.startswith("~/"):
        raw = os.path.join(slssteam._home(), raw[2:]) if raw != "~" else slssteam._home()
    if not os.path.isabs(raw):
        return {"success": False, "error": "Use an absolute folder path"}
    expanded = os.path.abspath(raw)
    if expanded == os.path.sep:
        return {"success": False, "error": "The filesystem root cannot be used as a sync folder"}
    config_root = os.path.realpath(_native_config_dir())
    candidate = os.path.realpath(expanded)
    if candidate == config_root or candidate.startswith(config_root + os.sep):
        return {"success": False, "error": "Choose a folder outside CloudRedirect's local cache"}
    try:
        created = not os.path.exists(expanded)
        mkdir = subprocess.run(
            _wrap_cr(["mkdir", "-p", "--", expanded]), check=False,
            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True,
        )
        if mkdir.returncode != 0:
            detail = (mkdir.stderr or "").strip()
            return {"success": False, "error": detail or "Could not create the selected folder"}
        if not os.path.isdir(expanded):
            return {"success": False, "error": "The selected path is not a folder"}
        if created:
            chown_to_user(expanded, recursive=False)
        if not _folder_writable(expanded):
            return {"success": False, "error": "The selected folder is not writable"}
        return _transition_provider("folder", expanded)
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def set_provider_toggle(key: str, value: bool) -> dict:
    if key not in ("sync_achievements", "sync_playtime"):
        return {"success": False, "error": "unknown toggle"}
    migrate_provider_data()
    cfg = _read_provider_config()
    cfg[key] = bool(value)
    try:
        _write_json_atomic(_native_config_path(), cfg)
        return provider_status()
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def sign_out(provider: str = "") -> dict:
    migrate_provider_data()
    cfg = _read_provider_config()
    provider = str(provider or cfg.get("provider") or "local")
    try:
        result = _transition_provider("local")
        if not result.get("success"):
            return result
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    if provider in _PROVIDERS:
        try:
            os.remove(_token_path(provider, cfg))
        except FileNotFoundError:
            pass
        except OSError as exc:
            return {"success": False, "error": str(exc)}
    return provider_status()


def _pkce(value: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode("ascii")).digest()).decode("ascii").rstrip("=")


def _oauth_client_secret(provider: str) -> str:
    """Read Moon's public desktop-client credential from its immutable source.

    This keeps third-party credentials out of SLSDeck while matching the exact
    token exchange performed by the pinned CloudRedirect Moon implementation.
    """
    cached = _OAUTH_SECRETS.get(provider)
    if cached:
        return cached
    response = ensure_http_client("CloudRedirect OAuth configuration").get(CR_OAUTH_SOURCE_URL, timeout=20)
    response.raise_for_status()
    source = response.text
    for key, constant in _OAUTH_SECRET_NAMES.items():
        match = re.search(rf'{constant}\s*=\s*"([^"]+)"', source)
        if match:
            _OAUTH_SECRETS[key] = match.group(1)
    secret = _OAUTH_SECRETS.get(provider)
    if not secret:
        raise ValueError(f"CloudRedirect Moon {provider} OAuth configuration was not found")
    return secret


def auth_start(provider: str) -> dict:
    """Start a five-minute OAuth/PKCE loopback flow and return its browser URL."""
    global _AUTH_PENDING, _AUTH_RESULT
    provider = str(provider or "").lower()
    spec = _PROVIDERS.get(provider)
    if not spec:
        return {"success": False, "status": "error", "error": "unknown provider"}
    migrate_provider_data()
    with _AUTH_LOCK:
        _AUTH_RESULT = None
        if _AUTH_PENDING:
            try:
                _AUTH_PENDING["listener"].close()
            except Exception:
                pass
            _AUTH_PENDING = None
        listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            # Match CloudRedirect Moon's QHostAddress::LocalHost listener.
            listener.bind(("127.0.0.1", int(spec["fixed_port"] or 0)))
            listener.listen(1)
            listener.setblocking(False)
            port = int(listener.getsockname()[1])
        except Exception as exc:
            try:
                listener.close()
            except Exception:
                pass
            return {"success": False, "status": "error", "error": f"callback bind failed: {exc}"}
        state = secrets.token_urlsafe(24)
        verifier = secrets.token_urlsafe(48)
        redirect_uri = f"http://localhost:{port}{spec['redirect_path']}"
        query = {
            "client_id": spec["client_id"], "redirect_uri": redirect_uri,
            "response_type": "code", "scope": spec["scope"], "prompt": "consent",
            "state": state, "code_challenge": _pkce(verifier),
            "code_challenge_method": "S256",
        }
        if spec["access_type"]:
            query["access_type"] = spec["access_type"]
        _AUTH_PENDING = {
            "listener": listener, "provider": provider, "state": state,
            "verifier": verifier, "redirect_uri": redirect_uri,
            "deadline": time.time() + _AUTH_TIMEOUT,
        }
        threading.Thread(target=_auth_listener_worker, args=(_AUTH_PENDING,),
                         name="cloudredirect-oauth", daemon=True).start()
        return {"success": True, "status": "waiting",
                "authUrl": spec["auth_url"] + "?" + urlencode(query)}


def _auth_finish(result: dict) -> dict:
    global _AUTH_PENDING, _AUTH_RESULT
    try:
        if _AUTH_PENDING:
            _AUTH_PENDING["listener"].close()
    except Exception:
        pass
    _AUTH_PENDING = None
    _AUTH_RESULT = result
    return result


def _auth_listener_worker(pending: dict) -> None:
    """Accept the OAuth redirect independently of the Decky/React page.

    Steam's browser hides or unmounts the plugin UI. Callback handling must
    therefore live in the backend instead of depending on a frontend poll RPC.
    """
    listener = pending["listener"]
    while time.time() <= pending["deadline"]:
        with _AUTH_LOCK:
            if _AUTH_PENDING is not pending:
                return
        try:
            client, _ = listener.accept()
        except BlockingIOError:
            time.sleep(0.1)
            continue
        except OSError as exc:
            with _AUTH_LOCK:
                if _AUTH_PENDING is pending:
                    _auth_finish({"success": False, "status": "error", "error": str(exc)})
            return
        params = {}
        try:
            client.settimeout(3)
            request = client.recv(16384).decode("utf-8", "replace")
            first = request.splitlines()[0] if request else ""
            target = first.split(" ", 2)[1] if first.startswith("GET ") else ""
            params = parse_qs(urlsplit(target).query)
            html = ("<html><body style='font-family:sans-serif;background:#1e1e1e;color:white;"
                    "text-align:center;padding:60px'><h1>Signed in</h1>"
                    "<p>You can close this window and return to Steam.</p></body></html>")
            response = ("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n"
                        f"Content-Length: {len(html.encode('utf-8'))}\r\nConnection: close\r\n\r\n{html}")
            client.sendall(response.encode("utf-8"))
        except Exception as exc:
            with _AUTH_LOCK:
                if _AUTH_PENDING is pending:
                    _auth_finish({"success": False, "status": "error",
                                  "error": f"callback failed: {exc}"})
            return
        finally:
            try:
                client.close()
            except Exception:
                pass
        state = (params.get("state") or [""])[0]
        code = (params.get("code") or [""])[0]
        oauth_error = (params.get("error") or [""])[0]
        with _AUTH_LOCK:
            if _AUTH_PENDING is not pending:
                return
            if not code:
                _auth_finish({"success": False, "status": "error",
                              "error": oauth_error or "no authorization code"})
            else:
                _exchange_auth_code(pending, code, state)
        return
    with _AUTH_LOCK:
        if _AUTH_PENDING is pending:
            _auth_finish({"success": False, "status": "timeout", "error": "sign-in timed out"})


def _exchange_auth_code(pending: dict, code: str, state: str) -> dict:
    """Validate a loopback response and exchange it for persistent tokens.

    Shared by the automatic localhost listener and the Gaming Mode fallback
    where the user pastes the failed callback URL from Steam's browser.
    """
    if state != pending["state"]:
        return _auth_finish({"success": False, "status": "error", "error": "OAuth state mismatch"})
    if not code:
        return _auth_finish({"success": False, "status": "error", "error": "no authorization code"})
    spec = _PROVIDERS[pending["provider"]]
    form = {
        "code": code, "client_id": spec["client_id"],
        "redirect_uri": pending["redirect_uri"],
        "grant_type": "authorization_code", "code_verifier": pending["verifier"],
    }
    if spec["body_scope"]:
        form["scope"] = spec["scope"]
    try:
        form["client_secret"] = _oauth_client_secret(pending["provider"])
        response = ensure_http_client("CloudRedirect OAuth").post(spec["token_url"], data=form, timeout=30)
        response.raise_for_status()
        token = response.json()
        refresh = str(token.get("refresh_token") or "")
        if not refresh:
            raise ValueError("provider returned no refresh token")
        token_data = {
            "access_token": str(token.get("access_token") or ""),
            "refresh_token": refresh,
            "expires_at": int(time.time()) + int(token.get("expires_in") or 3600),
        }
        cfg = _read_provider_config()
        _write_json_atomic(_token_path(pending["provider"], cfg), token_data)
        transition = _transition_provider(pending["provider"])
        if not transition.get("success"):
            raise ValueError(transition.get("error") or "provider migration failed")
        return _auth_finish({"success": True, "status": "done",
                             "provider": pending["provider"], "authenticated": True})
    except Exception as exc:
        return _auth_finish({"success": False, "status": "error", "error": f"token exchange failed: {exc}"})


def auth_callback(value: str) -> dict:
    """Finish a pending OAuth flow from a pasted code or callback URL."""
    global _AUTH_PENDING, _AUTH_RESULT
    raw = str(value or "").strip()
    with _AUTH_LOCK:
        pending = _AUTH_PENDING
        if not pending:
            return _AUTH_RESULT or {"success": False, "status": "idle", "error": "No CloudRedirect sign-in is waiting"}
        params = parse_qs(urlsplit(raw).query) if "://" in raw or "?" in raw else {}
        code = (params.get("code") or [raw])[0]
        state = (params.get("state") or [""])[0]
        if not state:
            return {"success": False, "status": "error",
                    "error": "Paste the complete localhost callback URL so its security state can be verified"}
        return _exchange_auth_code(pending, code, state)


def auth_poll() -> dict:
    """Read backend-owned OAuth progress; callback handling runs independently."""
    global _AUTH_PENDING, _AUTH_RESULT
    with _AUTH_LOCK:
        if _AUTH_RESULT:
            return dict(_AUTH_RESULT)
        pending = _AUTH_PENDING
        if not pending:
            return {"success": True, "status": "idle"}
        return {"success": True, "status": "waiting"}


_STORAGE_META = {
    "cn.cloudredirect", "cn.dat", "root_token.cloudredirect", "root_token.dat",
    "file_tokens.cloudredirect", "file_tokens.dat", "manifest.cloudredirect",
    "manifest.dat", "state.cloudredirect", "deleted.cloudredirect", "deleted.dat",
}


def _gdrive_folders(token: str, query: str) -> list:
    client = ensure_http_client("CloudRedirect Google Drive discovery")
    headers = {"Authorization": f"Bearer {token}"}
    result = []
    page_token = ""
    while True:
        params = {
            "q": query, "fields": "nextPageToken,files(id,name,mimeType)",
            "spaces": "drive", "pageSize": 1000,
        }
        if page_token:
            params["pageToken"] = page_token
        response = client.get("https://www.googleapis.com/drive/v3/files",
                              headers=headers, params=params, timeout=30)
        response.raise_for_status()
        page = response.json()
        result.extend(page.get("files") or [])
        page_token = str(page.get("nextPageToken") or "")
        if not page_token:
            return result


def _discover_gdrive_apps(token: str) -> list:
    folder_type = "application/vnd.google-apps.folder"
    roots = _gdrive_folders(
        token, f"name='CloudRedirect' and mimeType='{folder_type}' and trashed=false",
    )
    found = set()
    for root in roots:
        root_id = str(root.get("id") or "").replace("'", "\\'")
        if not root_id:
            continue
        accounts = _gdrive_folders(
            token, f"'{root_id}' in parents and mimeType='{folder_type}' and trashed=false",
        )
        for account in accounts:
            account_name = str(account.get("name") or "")
            account_id = str(account.get("id") or "").replace("'", "\\'")
            if not account_name.isdigit() or not account_id:
                continue
            apps = _gdrive_folders(
                token, f"'{account_id}' in parents and mimeType='{folder_type}' and trashed=false",
            )
            for app in apps:
                appid = str(app.get("name") or "")
                if appid.isdigit() and appid != "0":
                    found.add((int(account_name), int(appid)))
    return sorted(found)


def _onedrive_children(token: str, path: str) -> list:
    client = ensure_http_client("CloudRedirect OneDrive discovery")
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{path}:/children"
    params = {"$select": "name,folder", "$top": 1000}
    result = []
    while url:
        response = client.get(url, headers=headers, params=params, timeout=30)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        page = response.json()
        result.extend(page.get("value") or [])
        url = str(page.get("@odata.nextLink") or "")
        params = None
    return result


def _discover_onedrive_apps(token: str) -> list:
    found = set()
    for account in _onedrive_children(token, "CloudRedirect"):
        account_id = str(account.get("name") or "")
        if not account_id.isdigit() or not isinstance(account.get("folder"), dict):
            continue
        for app in _onedrive_children(token, f"CloudRedirect/{account_id}"):
            appid = str(app.get("name") or "")
            if appid.isdigit() and appid != "0" and isinstance(app.get("folder"), dict):
                found.add((int(account_id), int(appid)))
    return sorted(found)


def _discover_remote_apps(provider: str) -> tuple[list, str]:
    """List remote account/AppID folders without downloading save contents."""
    cached = _REMOTE_APPS_CACHE.get(provider)
    if cached and time.time() - cached[0] < _REMOTE_APPS_CACHE_SECONDS:
        return list(cached[1]), ""
    token = _provider_access_token(provider)
    if not token:
        return [], "provider token unavailable"
    try:
        apps = (_discover_gdrive_apps(token) if provider == "gdrive"
                else _discover_onedrive_apps(token))
        _REMOTE_APPS_CACHE[provider] = (time.time(), list(apps))
        return apps, ""
    except Exception as exc:
        logger.warn(f"CloudRedirect: {provider} remote discovery failed: {exc}")
        return [], str(exc)


def _discover_folder_apps(root: str) -> tuple[list, str]:
    """List the account/AppID layout used by Moon's folder provider."""
    if not root:
        return [], "custom folder is not configured"
    if not os.path.isdir(root):
        return [], "custom folder is unavailable"
    found = set()
    try:
        for account in os.listdir(root):
            account_dir = os.path.join(root, account)
            if not account.isdigit() or not os.path.isdir(account_dir):
                continue
            for appid in os.listdir(account_dir):
                if appid.isdigit() and appid != "0" and os.path.isdir(os.path.join(account_dir, appid)):
                    found.add((int(account), int(appid)))
        return sorted(found), ""
    except OSError as exc:
        return [], str(exc)


def list_local_apps() -> dict:
    """Merge local/inherited save trees with cloud-only provider folders."""
    root = os.path.join(_native_config_dir(), "storage")
    apps = []
    if os.path.isdir(root):
        for account in os.listdir(root):
            account_dir = os.path.join(root, account)
            if not account.isdigit() or not os.path.isdir(account_dir):
                continue
            for appid in os.listdir(account_dir):
                app_dir = os.path.join(account_dir, appid)
                if not appid.isdigit() or appid == "0" or not os.path.isdir(app_dir):
                    continue
                files = size = 0
                for current, _, names in os.walk(app_dir):
                    for name in names:
                        path = os.path.join(current, name)
                        rel = os.path.relpath(path, app_dir)
                        if os.sep not in rel and (name in _STORAGE_META or re.match(r"manifest\.\d+\.cloudredirect$", name)):
                            continue
                        files += 1
                        try:
                            size += os.path.getsize(path)
                        except OSError:
                            pass
                apps.append({"appid": int(appid), "account": int(account),
                             "files": files, "size": size, "local": True,
                             "remote": False})
    remote_error = ""
    cfg = _read_provider_config()
    provider = str(cfg.get("provider") or "local")
    remote = []
    if provider == "folder":
        remote, remote_error = _discover_folder_apps(str(cfg.get("sync_folder_path") or ""))
    elif provider in _PROVIDERS and _has_refresh_token(_token_path(provider, cfg)):
        remote, remote_error = _discover_remote_apps(provider)
    if remote:
        by_key = {(app["account"], app["appid"]): app for app in apps}
        for account, appid in remote:
            current = by_key.get((account, appid))
            if current:
                current["remote"] = True
            else:
                item = {"appid": appid, "account": account, "files": 0,
                        "size": 0, "local": False, "remote": True}
                apps.append(item)
                by_key[(account, appid)] = item
    # Cloud-only games do not exist in Steam's local appStore, so resolve their
    # display names in the backend. The shared resolver uses the downloaded
    # Steam applist first and only falls back to a rate-limited Store lookup.
    try:
        from . import downloads
        names = {}
        for app in apps:
            appid = int(app["appid"])
            if appid not in names:
                names[appid] = downloads._fetch_app_name(appid)
            app["name"] = names[appid] or ""
    except Exception as exc:
        logger.warn(f"CloudRedirect: game-name resolution failed: {exc}")
    apps.sort(key=lambda item: (item["account"], item["appid"]))
    return {"success": True, "apps": apps, "storageRoot": root,
            "provider": provider, "remoteError": remote_error}


def _import_source_root(selected_path: str, staging: str) -> tuple[str, bool]:
    """Return the directory whose contents should land in the AppID folder."""
    if not os.path.isfile(selected_path):
        raise ValueError("The selected save file no longer exists")

    from .utils import safe_extract
    extracted = os.path.join(staging, "extracted")
    os.makedirs(extracted, exist_ok=True)
    if zipfile.is_zipfile(selected_path):
        with zipfile.ZipFile(selected_path, "r") as archive:
            members = [m for m in archive.infolist() if not m.is_dir()]
            if len(members) > _IMPORT_MAX_FILES:
                raise ValueError("The save archive contains too many files")
            total = sum(max(0, int(m.file_size)) for m in members)
            if total > _IMPORT_MAX_BYTES:
                raise ValueError("The expanded save archive is larger than 4 GB")
            safe_extract(archive, extracted, "zip")
    elif tarfile.is_tarfile(selected_path):
        with tarfile.open(selected_path, "r:*") as archive:
            members = [m for m in archive.getmembers() if m.isfile()]
            if len(members) > _IMPORT_MAX_FILES:
                raise ValueError("The save archive contains too many files")
            total = sum(max(0, int(m.size)) for m in members)
            if total > _IMPORT_MAX_BYTES:
                raise ValueError("The expanded save archive is larger than 4 GB")
            safe_extract(archive, extracted, "tar")
    else:
        if selected_path.lower().endswith((".7z", ".7z.001", ".rar")):
            raise ValueError("Unsupported archive format. Please use ZIP or TAR.")
        # A loose/unpacked save is imported exactly as selected.
        loose = os.path.join(staging, "loose")
        os.makedirs(loose, exist_ok=True)
        shutil.copy2(selected_path, os.path.join(loose, os.path.basename(selected_path)))
        return loose, False

    entries = [name for name in os.listdir(extracted) if name not in ("__MACOSX", ".DS_Store")]
    if not entries:
        raise ValueError("The selected archive contains no save files")
    # Save exports commonly wrap everything in one named folder. Import that
    # folder's contents rather than nesting the wrapper below the AppID.
    if len(entries) == 1 and os.path.isdir(os.path.join(extracted, entries[0])):
        return os.path.join(extracted, entries[0]), True
    return extracted, False


def _copy_import_tree(source: str, destination: str) -> tuple[int, int]:
    files = total = 0
    for current, dirs, names in os.walk(source, followlinks=False):
        dirs[:] = [name for name in dirs if not os.path.islink(os.path.join(current, name))]
        relative = os.path.relpath(current, source)
        target_dir = destination if relative == "." else os.path.join(destination, relative)
        os.makedirs(target_dir, exist_ok=True)
        for name in names:
            src = os.path.join(current, name)
            if os.path.islink(src) or not os.path.isfile(src):
                continue
            size = os.path.getsize(src)
            files += 1
            total += size
            if files > _IMPORT_MAX_FILES or total > _IMPORT_MAX_BYTES:
                raise ValueError("The selected save exceeds the import safety limit")
            dst = os.path.join(target_dir, name)
            staged = f"{dst}.slsdeck-import-{os.getpid()}-{secrets.token_hex(3)}"
            shutil.copyfile(src, staged)
            os.replace(staged, dst)
    return files, total


def import_save(appid: int, selected_path: str) -> dict:
    """Import a loose save or safe archive into CloudRedirect's active store."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Choose a game first"}
    if appid <= 0:
        return {"success": False, "error": "Choose a game first"}
    raw_path = str(selected_path or "").strip()
    if not raw_path:
        return {"success": False, "error": "Choose an existing save file or archive"}
    selected_path = os.path.abspath(os.path.expanduser(raw_path))
    if not os.path.isfile(selected_path):
        return {"success": False, "error": "Choose an existing save file or archive"}
    if appid in _running_sls_apps():
        return {"success": False, "error": "Close the game before importing its saves"}
    account = _recent_steam_account_id()
    if not account:
        return {"success": False, "error": "Could not determine the current Steam account"}

    cfg = _read_provider_config()
    provider = str(cfg.get("provider") or "local")
    cache_root = os.path.join(_native_config_dir(), "storage")
    active_root = cache_root
    if provider == "folder":
        folder = str(cfg.get("sync_folder_path") or "").strip()
        if not folder or not os.path.isdir(folder) or not _folder_writable(folder):
            return {"success": False, "error": "The configured custom folder is unavailable or not writable"}
        active_root = folder
    destination = os.path.join(active_root, account, str(appid))
    backup = ""
    try:
        with _MIGRATION_LOCK, tempfile.TemporaryDirectory(prefix="slsdeck-save-import-") as staging:
            source, wrapper_removed = _import_source_root(selected_path, staging)
            if os.path.isdir(destination) and os.listdir(destination):
                backup = os.path.join(_native_config_dir(), "import-backups", account,
                                      str(appid), f"{int(time.time())}-{secrets.token_hex(3)}")
                os.makedirs(os.path.dirname(backup), exist_ok=True)
                shutil.copytree(destination, backup)
            os.makedirs(destination, exist_ok=True)
            files, size = _copy_import_tree(source, destination)
            if not files:
                raise ValueError("The selected archive contains no importable save files")
            chown_to_user(destination, recursive=True)
            if backup:
                chown_to_user(backup, recursive=True)
            # The custom-folder provider is the active authority, but the local
            # cache remains CloudRedirect's recovery/index source.
            if provider == "folder":
                mirrored = _sync_provider_tree(active_root, cache_root,
                                               "custom folder", "local cache")
                if not mirrored.get("success"):
                    raise RuntimeError("Save imported, but the local cache mirror could not be updated")
        _REMOTE_APPS_CACHE.clear()
        logger.log(f"CloudRedirect: imported {files} save file(s) for {appid} from {selected_path}")
        return {"success": True, "appid": appid, "account": int(account),
                "files": files, "bytes": size, "destination": destination,
                "backup": backup, "wrapperRemoved": wrapper_removed,
                "provider": provider}
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, tarfile.TarError) as exc:
        return {"success": False, "error": str(exc), "backup": backup}


def _recent_steam_account_id() -> str:
    """Return the account-id CloudRedirect uses below ``storage/``.

    The companion derives this from the low 32 bits of the MostRecent SteamID64
    in loginusers.vdf.  Mirror that exact rule so its storage-first app list can
    be seeded before a game performs its first cloud operation.
    """
    try:
        from . import steam
        paths = steam._loginusers_paths()
    except Exception:
        paths = []
    block_re = re.compile(r'"(\d{17})"\s*\{(.*?)\}', re.DOTALL)
    recent_re = re.compile(r'"MostRecent"\s*"1"', re.IGNORECASE)
    for path in paths:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
        except OSError:
            continue
        for match in block_re.finditer(text):
            if recent_re.search(match.group(2)):
                return str(int(match.group(1)) & 0xFFFFFFFF)
    return ""


def sync_registered_games() -> dict:
    """Expose every SLSsteam game to both the Moon hook and companion UI.

    New slsteam-moon discovers games primarily from ``stplug-in/*.lua`` while
    CloudRedirect still reads ``AdditionalApps``.  Its current companion also
    has an unused AdditionalApps loader and displays only directories already
    present under its storage tree.  Keep the legacy list in sync and create
    empty per-app directories (never save files or metadata) so registered games
    are visible immediately.  The hook fills those directories normally later.
    """
    appids = [int(x) for x in slssteam.read_additional_apps() if int(x) > 0]
    mirrored = 0
    try:
        content = slssteam._read() or ""
        legacy = slssteam._read_additional_from(content)
        for appid in appids:
            if appid not in legacy:
                result = _slssteam_add_app(appid)
                if not result.get("success"):
                    return {"success": False, "error": result.get("error") or
                            f"could not mirror AppID {appid} into AdditionalApps"}
                mirrored += 1
                legacy.add(appid)
    except Exception as exc:
        return {"success": False, "error": f"could not synchronize AdditionalApps: {exc}"}

    account_id = _recent_steam_account_id()
    seeded = 0
    if account_id:
        config_root = os.path.join(slssteam._home(), ".config", "CloudRedirect")
        root = os.path.join(config_root, "storage", account_id)
        seed_index = os.path.join(config_root, ".slsdeck_seeded_apps.json")
        try:
            os.makedirs(root, exist_ok=True)
            try:
                with open(seed_index, "r", encoding="utf-8") as fh:
                    tracked = {int(x) for x in json.load(fh) if int(x) > 0}
            except Exception:
                tracked = set()
            current = set(appids)
            # Remove only obsolete placeholders that are still empty. Once the
            # hook writes anything, that directory is real user data and is
            # deliberately left alone even if the game is removed from SLSsteam.
            for appid in tracked - current:
                old_dir = os.path.join(root, str(appid))
                try:
                    if os.path.isdir(old_dir) and not os.listdir(old_dir):
                        os.rmdir(old_dir)
                except OSError:
                    pass
            tracked &= current
            for appid in appids:
                app_dir = os.path.join(root, str(appid))
                if not os.path.isdir(app_dir):
                    os.makedirs(app_dir, exist_ok=True)
                    tracked.add(appid)
                    seeded += 1
            with open(seed_index + ".tmp", "w", encoding="utf-8") as fh:
                json.dump(sorted(tracked), fh)
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(seed_index + ".tmp", seed_index)
            chown_to_user(config_root, recursive=True)
        except Exception as exc:
            return {"success": False, "error": f"could not seed CloudRedirect app list: {exc}"}
    logger.log(f"CloudRedirect: synchronized {len(appids)} game(s), "
               f"mirrored={mirrored}, seeded={seeded}, account={account_id or 'unknown'}")
    return {"success": True, "games": len(appids), "mirrored": mirrored,
            "seeded": seeded, "accountId": account_id}


def _download_cr_lib() -> str:
    """Download cloud_redirect.so into the CloudRedirect dir(s) (headcrab step)."""
    try:
        url = _cr_lib_url()
        src = "moon" if url == CR_LIB_URL_MOON else "selectively11"
        client = ensure_http_client("cloudredirect: cloud_redirect.so")
        r = client.get(url, follow_redirects=True, timeout=120)
        if r.status_code != 200 or not r.content:
            return f"cloud_redirect.so ({src}): HTTP {r.status_code}"
        data = r.content
        if data[:4] != b"\x7fELF":
            return f"cloud_redirect.so ({src}): download was not an ELF (got an error page?)"
        # Steam's client is 32-bit, so the hook MUST be a 32-bit ELF (EI_CLASS==1)
        # or the loader silently ignores the LD_PRELOAD — the exact "installed but
        # does nothing" failure. Refuse a 64-bit build rather than deploy a dud.
        if len(data) < 5 or data[4] != 1:
            return f"cloud_redirect.so ({src}): not a 32-bit ELF (EI_CLASS={data[4] if len(data) > 4 else '?'}) — wrong build, skipping"
        logger.log(f"CloudRedirect: fetching {src} cloud_redirect.so ({len(data)} bytes, 32-bit)")
        wrote = 0
        for d in _cr_dirs():
            try:
                os.makedirs(d, exist_ok=True)
                p = os.path.join(d, "cloud_redirect.so")
                with open(p, "wb") as fh:
                    fh.write(data)
                try:
                    chown_to_user(p, recursive=False)
                    chown_to_user(d, recursive=False)
                except Exception:
                    pass
                wrote += 1
            except Exception as exc:
                logger.warn(f"CloudRedirect: writing .so to {d} failed: {exc}")
        return f"cloud_redirect.so: {len(data)} bytes -> {wrote} dir(s)"
    except Exception as exc:
        return f"cloud_redirect.so download failed: {exc}"


def _config_path() -> str:
    return slssteam.config_path()


def _valid_cr_lib(path: str) -> bool:
    """A usable Moon hook is a nontrivial 32-bit ELF, not merely a leftover file."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(5)
        return head[:4] == b"\x7fELF" and len(head) == 5 and head[4] == 1 and os.path.getsize(path) > 4096
    except OSError:
        return False


def _install_healthy() -> bool:
    return _installed() and all(
        _valid_cr_lib(os.path.join(d, "cloud_redirect.so")) for d in _cr_dirs()
    )


def _clean_managed_leftovers() -> list:
    """Remove only SLSDeck/CloudRedirect hook payloads and partial artifacts.

    Provider tokens and app configuration are deliberately outside these data
    directories and are never touched, so reinstalling cannot sign the user out.
    """
    removed = []
    managed = (
        "cloud_redirect.so", "cloud_redirect.so.tmp", "cloud_redirect.so.part",
        "cloud_redirect.so.new", "cloud_redirect.so.old",
    )
    for directory in _cr_dirs():
        for name in managed:
            path = os.path.join(directory, name)
            try:
                if os.path.lexists(path):
                    os.remove(path)
                    removed.append(path)
            except OSError as exc:
                logger.warn(f"CloudRedirect: could not remove leftover {path}: {exc}")
    return removed


# ── install the CloudRedirect flatpak directly (same steps as headcrab's
#    crinstall, but not gated on DisableCloud and with errors surfaced) ────────
def install_app() -> dict:
    """Full CloudRedirect install, faithful to headcrab's crinstall: create the
    CloudRedirect data dir(s), add the flatpak remotes, refresh appstream, install
    the KDE runtime + the CloudRedirect app, and — the piece we were missing —
    download cloud_redirect.so into the data dir(s). Runs as the desktop user with
    a real session env (runtime dir + DBUS) so flatpak behaves like it does under
    headcrab."""
    log = []
    removed = _clean_managed_leftovers()
    if removed:
        log.append(f"cleaned {len(removed)} stale/partial managed CloudRedirect file(s)")
    # 0) ensure the CloudRedirect data dir(s) exist (headcrab mkdir -p step)
    for d in _cr_dirs():
        try:
            os.makedirs(d, exist_ok=True)
            chown_to_user(d, recursive=False)
        except Exception as exc:
            log.append(f"mkdir {d}: {exc}")
    steps = [
        ["flatpak", "remote-add", "--user", "--if-not-exists", "cloudredirect", CR_REPO],
        ["flatpak", "remote-add", "--user", "--if-not-exists", "flathub", FLATHUB_REPO],
        ["flatpak", "--user", "update", "--appstream", "--noninteractive"],
        ["flatpak", "install", "--user", "-y", "--noninteractive", "flathub", KDE_RUNTIME],
        ["flatpak", "install", "--user", "-y", "--noninteractive", "--reinstall", CR_APP_ID],
        ["update-desktop-database"],
    ]
    env = slssteam._rich_env()
    for cmd in steps:
        try:
            r = subprocess.run(_wrap_cr(cmd), env=env, capture_output=True, timeout=900)
            tail = (r.stdout.decode("utf-8", "replace") +
                    r.stderr.decode("utf-8", "replace")).strip()
            log.append(f"[rc={r.returncode}] {' '.join(cmd[:4])}\n{tail[-400:]}")
        except Exception as exc:
            log.append(f"{' '.join(cmd[:4])}: {exc}")
    # download cloud_redirect.so (headcrab's `wget -O cloud_redirect.so`)
    log.append(_download_cr_lib())
    have_lib = all(_valid_cr_lib(os.path.join(d, "cloud_redirect.so")) for d in _cr_dirs())
    ok = _installed() and have_lib
    logger.log(f"CloudRedirect install: app={_installed()} lib={have_lib} -> {'ok' if ok else 'incomplete'}")
    if ok:
        settings.reset_dep_fail("cloudredirect")
    else:
        settings.inc_dep_fail("cloudredirect")
    return {"success": ok, "installed": ok, "hasLib": have_lib, "log": "\n".join(log)[-1800:]}


def install_status() -> dict:
    """Read-only Moon-hook health. The legacy Flatpak is not a dependency."""
    app = _installed()
    paths = [os.path.join(d, "cloud_redirect.so") for d in _cr_dirs()]
    valid = [path for path in paths if _valid_cr_lib(path)]
    return {
        "success": True,
        "installed": len(valid) == len(paths),
        "healthy": len(valid) == len(paths),
        "appInstalled": app,
        "moonHookInstalled": bool(valid),
        "allHookLocationsValid": len(valid) == len(paths),
        "expectedHookLocations": len(paths),
        "validHookLocations": len(valid),
        "legacyFlatpakInstalled": app,
        "nativeProviderConfig": os.path.isfile(_native_config_path()),
        "partial": bool(valid) and len(valid) != len(paths),
    }


def ensure_installed() -> dict:
    """Manual reinstall: replace managed files even when the Flatpak exists."""
    settings.reset_dep_fail("cloudredirect")
    return install_app()


def ensure_installed_auto() -> dict:
    """Skip a verified complete install; repair partial app/library leftovers."""
    if _install_healthy():
        settings.reset_dep_fail("cloudredirect")
        return {"success": True, "installed": True, "log": "existing app + Moon hook verified"}
    if settings.dep_fail_capped("cloudredirect"):
        return {"success": False, "installed": False, "capped": True,
                "log": f"auto-install disabled after {settings.get_dep_fail('cloudredirect')} failed attempts — use Reinstall CloudRedirect"}
    return install_app()


# ── DisableCloud flag (enabled == cloud saves on == DisableCloud: no) ─────────
#
# `[ \t]*`, never `\s*`. In a MULTILINE pattern `\s` matches the newline too, so
# `^\s*DisableCloud:\s*(\S+)` given a valueless key:
#
#     DisableCloud:
#     AdditionalApps:
#       - 480
#
# ate the newline and captured "AdditionalApps:" as the flag's value. Reading it
# back was merely wrong; set_enabled()'s re.sub then rewrote that captured text,
# turning the user's AdditionalApps key into a bare "no" and orphaning their
# whole added-games list. Restricting the class to spaces and tabs keeps every
# match on one line.
_DISABLE_CLOUD_RE = re.compile(r"^([ \t]*)DisableCloud:[ \t]*(.*)$", re.MULTILINE)

_TRUEISH = ("yes", "true", "1", "on")


def _scalar(raw: str) -> str:
    """The value from a `key: value` line: comment stripped, unquoted, trimmed.
    A '#' only opens a comment at the start of the value or after whitespace,
    so a value that merely contains '#' is left alone."""
    text = str(raw or "")
    cut = len(text)
    for i, ch in enumerate(text):
        if ch == "#" and (i == 0 or text[i - 1] in " \t"):
            cut = i
            break
    return text[:cut].strip().strip('"').strip("'").strip()


def get_enabled() -> dict:
    try:
        with open(_config_path(), "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
    except Exception:
        return {"success": True, "enabled": False, "present": False}
    m = _DISABLE_CLOUD_RE.search(content)
    if not m:
        return {"success": True, "enabled": False, "present": False}
    value = _scalar(m.group(2)).lower()
    if not value:
        # Key is there but carries no value. Report it present so set_enabled
        # rewrites this line instead of appending a duplicate key, but do not
        # claim cloud saves are on.
        return {"success": True, "enabled": False, "present": True}
    return {"success": True, "enabled": (value not in _TRUEISH), "present": True}


def set_enabled(enabled: bool) -> dict:
    path = _config_path()
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
    except Exception as exc:
        return {"success": False, "error": f"cannot read SLSsteam config: {exc}"}
    newval = "no" if enabled else "yes"
    if _DISABLE_CLOUD_RE.search(content):
        # Rebuild the line from the captured indent so a key written as
        # "DisableCloud:" with no space does not become "DisableCloud:no",
        # which YAML reads as a plain string rather than a mapping.
        new = _DISABLE_CLOUD_RE.sub(
            lambda m: "%sDisableCloud: %s" % (m.group(1), newval), content, count=1)
    else:
        new = content.rstrip("\n") + f"\nDisableCloud: {newval}\n"
    # Write through SLSsteam's atomic writer (temp + fsync + os.replace) rather
    # than open(path,"w"). Truncating this file in place risked losing
    # AdditionalApps -- every game the user has added -- if the write was cut
    # short.
    if not slssteam._atomic_write(new):
        return {"success": False, "error": "cannot write SLSsteam config"}
    if enabled:
        synced = sync_registered_games()
        if not synced.get("success"):
            return {"success": False, "error": synced.get("error"), "enabled": True}
    logger.log(f"CloudRedirect: DisableCloud -> {newval}")
    return {"success": True, "enabled": bool(enabled)}


# ── launch the flatpak companion (for cloud-provider sign-in) ─────────────────
def _installed() -> bool:
    try:
        cmd = slssteam._wrap_as_user(["flatpak", "info", "--user", CR_APP_ID])
        r = subprocess.run(cmd, env=slssteam._rich_env(),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
        return r.returncode == 0
    except Exception:
        return False


def uninstall_app(purge_data: bool = True) -> dict:
    """Remove the companion, Moon hooks, and every known CloudRedirect leftover.

    This is deliberately used only by Decky's true plugin-uninstall callback or
    an explicit full-removal action, never by plugin unload/update.
    """
    home = slssteam._home()
    removed = []
    errors = []
    try:
        cmd = _wrap_cr([
            "flatpak", "uninstall", "--user", "-y", "--noninteractive",
            "--delete-data", CR_APP_ID,
        ])
        result = subprocess.run(cmd, env=slssteam._rich_env(), capture_output=True, timeout=300)
        if result.returncode not in (0, 1):
            errors.append((result.stderr or result.stdout).decode("utf-8", "replace")[-800:])
    except Exception as exc:
        errors.append(f"flatpak uninstall: {exc}")

    targets = list(_cr_dirs())
    if purge_data:
        targets.extend([
            os.path.join(home, ".config", "CloudRedirect"),
            os.path.join(home, ".cache", "CloudRedirect"),
            os.path.join(home, ".local", "state", "CloudRedirect"),
            os.path.join(home, ".var", "app", CR_APP_ID),
            os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".config", "CloudRedirect"),
        ])
    import shutil
    for path in dict.fromkeys(targets):
        try:
            if os.path.isdir(path) and not os.path.islink(path):
                shutil.rmtree(path)
                removed.append(path)
            elif os.path.lexists(path):
                os.remove(path)
                removed.append(path)
        except OSError as exc:
            errors.append(f"{path}: {exc}")
    logger.log(f"CloudRedirect uninstall: removed={len(removed)} errors={len(errors)}")
    return {
        "success": not errors, "installed": False, "removedPaths": removed,
        "errors": errors, "purgedData": bool(purge_data),
    }


def open_app() -> dict:
    if not _installed():
        # Try to install it right here (first launch can take a few minutes for
        # the KDE runtime). Surface the real error if it fails.
        r = install_app()
        if not r.get("installed"):
            return {"success": False,
                    "error": "CloudRedirect install failed (see below). Needs network + flatpak.\n"
                             + (r.get("log") or "")}
    synced = sync_registered_games()
    if not synced.get("success"):
        return {"success": False, "error": synced.get("error")}
    try:
        env = slssteam._rich_env()
        try:
            import pwd
            uid = pwd.getpwnam(slssteam._decky_user()).pw_uid
            env.setdefault("XDG_RUNTIME_DIR", f"/run/user/{uid}")
        except Exception:
            pass
        env.setdefault("DISPLAY", ":0")
        cmd = slssteam._wrap_as_user(["flatpak", "run", "--user", CR_APP_ID])
        subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, start_new_session=True)
        logger.log("CloudRedirect: launched companion app")
        return {"success": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def artwork() -> dict:
    """Return the bundled CloudRedirect library art as base64 (cover/capsule/hero)."""
    import base64
    out = {"success": True}
    for key, fn in (("cover", "cover.png"), ("capsule", "capsule.png"), ("hero", "hero.png"), ("logo", "logo.png")):
        try:
            p = defaults_path(os.path.join("cloudredirect", fn))
            with open(p, "rb") as fh:
                out[key] = base64.b64encode(fh.read()).decode("ascii")
        except Exception:
            out[key] = ""
    return out


def icon_path() -> dict:
    """Copy the bundled shortcut icon to a stable runtime path Steam can read,
    and return that absolute path (Steam stores the shortcut icon by path)."""
    import shutil
    try:
        src = defaults_path(os.path.join("cloudredirect", "icon.png"))
        dst = runtime_path("cloudredirect_icon.png")
        if not os.path.isfile(dst) or os.path.getsize(dst) != os.path.getsize(src):
            shutil.copy(src, dst)
        return {"success": True, "path": dst}
    except Exception as exc:
        return {"success": False, "error": str(exc), "path": ""}
