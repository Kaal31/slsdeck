"""Tokeer Linux integration used by the Anti-Denuvo page.

SLSDeck does not vendor the upstream Tokeer sources.  Runtime files are fetched
from Tesla697/TokeerDRM-App when the user explicitly prepares a game, then the
upstream Linux verifier/redeemer are invoked locally and their results surfaced
through Decky RPC.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import pwd
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request
import zipfile
import importlib.util
import unicodedata
from typing import Any, Dict

from .paths import get_user_home
from .httpc import ensure_http_client
from .steam import detect_steam_install_path
from . import steam

RUNTIME_ZIP = "https://github.com/Tesla697/TokeerDRM-App/releases/latest/download/tokeer-linux.zip"
INSTALL_SCRIPT = "https://raw.githubusercontent.com/Tesla697/TokeerDRM-App/main/install_linux.sh"
DEFAULT_COOLDOWN_HOURS = 48
RELEASE_API = "https://api.github.com/repos/Tesla697/TokeerDRM-App/releases/latest"
VERSION_FILE = ".slsdeck_runtime_version"
REQUIRED_PROTON = "GE-Proton10-34"
LINUX_VALIDATE_SECRET = b"tokeer_linux_setup_validate_2026_v1_shared"
GENERATOR_REVISION = "a6cf158ad7b9bd31dd5d1cd281684922ba0b9505"
GENERATOR_URL = (
    "https://raw.githubusercontent.com/Tesla697/TokeerDRM-App/"
    + GENERATOR_REVISION + "/extract_tickets.exe"
)
GENERATOR_SHA256 = "58f9c1a283eea20c544ad93532597cc3ee6108c4959bf9b6cffe199cee1b07a9"
GENERATOR_SERVER = "https://luastools.xyz"
def _home() -> str:
    return get_user_home()


def _tdir() -> str:
    return os.path.join(_home(), ".tokeer")


def _steam_roots(config_module=None):
    """Return Steam roots using SLSDeck discovery plus upstream fallbacks.

    Decky may run the backend as root, so Tokeer's standalone configurator can
    inspect /root and report no Steam installation.  SLSDeck already resolves
    the actual Deck user home; keep upstream results, but merge them with that
    proven resolver and explicit native/Flatpak locations.
    """
    roots = []
    if config_module is not None:
        try:
            roots.extend(config_module.steam_roots() or [])
        except Exception:
            pass
    detected = detect_steam_install_path()
    if detected:
        roots.append(detected)
    home = _home()
    roots.extend([
        os.path.join(home, ".steam", "steam"),
        os.path.join(home, ".steam", "root"),
        os.path.join(home, ".local", "share", "Steam"),
        os.path.join(home, ".var", "app", "com.valvesoftware.Steam",
                     ".steam", "steam"),
    ])
    result = []
    seen = set()
    for root in roots:
        try:
            real = os.path.realpath(root)
            if real in seen or not os.path.isdir(real):
                continue
            if not (os.path.isdir(os.path.join(real, "steamapps")) or
                    os.path.isdir(os.path.join(real, "config"))):
                continue
            seen.add(real)
            result.append(real)
        except Exception:
            continue
    return result


def _deck_user() -> str:
    home = _home()
    try:
        return pwd.getpwuid(os.stat(home).st_uid).pw_name
    except Exception:
        return "deck"


def _run_as_user(argv, timeout=180, extra_env=None, cwd=None) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    # Decky is launched from Steam's/frozen Python runtime and can inherit
    # loader paths containing a libreadline that is incompatible with the
    # system /usr/bin/bash.  Letting those variables reach Tokeer's shell
    # wrapper makes bash itself abort before any verification runs:
    #   undefined symbol: rl_trim_arg_from_keyseq
    # Spawn host tools against SteamOS's own libraries instead.  This changes
    # only the setup/verifier subprocess; game launch options remain intact.
    for key in (
        "LD_LIBRARY_PATH", "LD_PRELOAD", "LD_AUDIT",
        "STEAM_RUNTIME_LIBRARY_PATH", "SYSTEM_LD_LIBRARY_PATH",
    ):
        env.pop(key, None)
    env["HOME"] = _home()
    env["USER"] = _deck_user()
    env["LOGNAME"] = _deck_user()
    # Decky runs the backend as root. `runuser` changes uid/gid but does not
    # attach the process to the Deck user's graphical/login session. Tokeer's
    # final steam:// launch and some Proton helpers need that session bus.
    try:
        uid = pwd.getpwnam(_deck_user()).pw_uid
    except Exception:
        uid = os.stat(_home()).st_uid
    env["XDG_RUNTIME_DIR"] = f"/run/user/{uid}"
    env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path=/run/user/{uid}/bus"
    # Preserve compositor/display values from the live Steam process when
    # Decky's own environment does not contain them (normal in Gaming Mode).
    session_keys = ("DISPLAY", "WAYLAND_DISPLAY", "XAUTHORITY")
    if not all(env.get(key) for key in session_keys[:2]):
        try:
            for pid in os.listdir("/proc"):
                if not pid.isdigit():
                    continue
                proc = f"/proc/{pid}"
                if os.stat(proc).st_uid != uid:
                    continue
                try:
                    with open(os.path.join(proc, "comm"), "r", encoding="utf-8", errors="ignore") as fh:
                        comm = fh.read().strip().lower()
                    if comm not in ("steam", "steamwebhelper", "gamescope"):
                        continue
                    with open(os.path.join(proc, "environ"), "rb") as fh:
                        entries = fh.read().split(b"\0")
                    live = {}
                    for entry in entries:
                        key, sep, value = entry.partition(b"=")
                        if sep:
                            live[key.decode("utf-8", "ignore")] = value.decode("utf-8", "ignore")
                    for key in session_keys:
                        if live.get(key):
                            env[key] = live[key]
                    if env.get("DISPLAY") or env.get("WAYLAND_DISPLAY"):
                        break
                except (OSError, PermissionError):
                    continue
        except (OSError, PermissionError):
            pass
    env["PATH"] = ":".join([
        os.path.join(_home(), ".local", "bin"),
        "/usr/local/bin", "/usr/bin", "/bin",
        "/usr/local/sbin", "/usr/sbin", "/sbin",
    ])
    if extra_env:
        env.update({str(key): str(value) for key, value in extra_env.items()})
    cmd = list(argv)
    if os.geteuid() == 0:
        if shutil.which("runuser"):
            cmd = ["runuser", "-u", _deck_user(), "--"] + cmd
        elif shutil.which("sudo"):
            cmd = ["sudo", "-u", _deck_user(), "-H"] + cmd
    return subprocess.run(cmd, env=env, cwd=cwd, text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, timeout=timeout)


def runtime_status() -> Dict[str, Any]:
    td = _tdir()
    need = ["tokeer", "tokeer_validate_linux.py", "tokeer_redeem_linux.py",
            "ost-run.sh", "ost_native_hook.so"]
    missing = [x for x in need if not os.path.isfile(os.path.join(td, x))]
    return {"success": True, "installed": not missing, "home": td, "missing": missing,
            "defaultCooldownHours": DEFAULT_COOLDOWN_HOURS}


def _normal_game_name(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = re.sub(r"\b\d+\s+of\s+\d+\s+remaining(?:\s*\(\d+%\))?.*$", "", text,
                  flags=re.IGNORECASE)
    # Discord's vault titles commonly append a marketing/availability suffix
    # which is not part of Steam's installed app name (e.g. Assassin's Creed
    # Shadows Free). Apostrophes also vary between straight, curly and absent;
    # removing them keeps "Assassin's" and "Assassins" equivalent.
    text = re.sub(r"['’‘`´]", "", text)
    text = text.replace("®", "").replace("™", "").replace("©", "")
    text = re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
    return re.sub(
        r"\s+(?:(?:standard|deluxe|ultimate|complete) edition|free(?: trial)?|trial)$",
        "", text, flags=re.IGNORECASE,
    ).strip()


def _game_name_variants(value: str):
    """Conservative aliases shared by Discord-title installation preflight.

    Only known presentation differences are expanded; matching remains exact
    after normalization so similarly named installed games do not collide.
    """
    name = _normal_game_name(value)
    if not name:
        return set()
    variants = {name}
    if re.match(r"^assassins? creed\s+", name):
        variants.add(re.sub(r"^assassins? creed\s+", "ac ", name))
    if name.startswith("ac "):
        variants.add("assassins creed " + name[3:])
    return variants


def preflight(appid: int = 0, game_name: str = "") -> Dict[str, Any]:
    """Require the same installed-game condition as upstream TLX validation.

    For an AppID, Steam's appmanifest and the referenced common/ directory must
    both exist. Discord selections initially provide only a title, so match it
    conservatively against Steam's installed manifests and refuse ambiguity.
    """
    try:
        wanted_appid = int(appid or 0)
    except Exception:
        wanted_appid = 0
    if wanted_appid > 0:
        found = steam.get_game_install_path_response(wanted_appid)
        if found.get("success") and os.path.isdir(str(found.get("installPath") or "")):
            return {"success": True, "installed": True, "appid": wanted_appid,
                    "gameName": found.get("name", ""),
                    "installPath": found.get("installPath", "")}
        return {"success": False, "installed": False, "appid": wanted_appid,
                "failedCheck": "installed",
                "error": "Game is not installed: Steam appmanifest or installation directory is missing."}

    wanted = _game_name_variants(game_name)
    if not wanted:
        return {"success": False, "installed": False, "failedCheck": "installed",
                "error": "Could not identify the selected game before opening Tokeer."}
    matches = []
    for item in steam.list_installed_games():
        path = str(item.get("installPath") or "")
        if not os.path.isdir(path):
            continue
        if wanted.intersection(_game_name_variants(item.get("name", ""))):
            matches.append(item)
    if len(matches) == 1:
        item = matches[0]
        return {"success": True, "installed": True, "appid": int(item["appid"]),
                "gameName": item.get("name", ""), "installPath": item.get("installPath", "")}
    if len(matches) > 1:
        return {"success": False, "installed": False, "ambiguous": True,
                "failedCheck": "installed",
                "candidates": [{"appid": int(x["appid"]), "name": x.get("name", "")}
                               for x in matches],
                "error": "More than one installed Steam game matches this Discord title; open Tokeer from the game's Fixes menu."}
    return {"success": False, "installed": False, "failedCheck": "installed",
            "error": "Game is not installed. Install it completely in Steam before using Tokeer."}


def uninstall_runtime() -> Dict[str, Any]:
    """Remove the SLSDeck-managed Tokeer runtime, but preserve GE-Proton.

    Only remove the command link when it is the link created by Tokeer and
    points into ~/.tokeer.  A different user-owned executable at the same path
    is left untouched. Compatibility tools live in Steam's separate
    compatibilitytools.d directory and are deliberately not considered here.
    """
    td = os.path.realpath(_tdir())
    link = os.path.join(_home(), ".local", "bin", "tokeer")
    removed = []
    errors = []
    try:
        if os.path.islink(link):
            target = os.path.realpath(link)
            if target == td or target.startswith(td + os.sep):
                os.remove(link)
                removed.append(link)
    except Exception as exc:
        errors.append(f"command link: {exc}")
    try:
        if os.path.isdir(td):
            shutil.rmtree(td)
            removed.append(td)
        elif os.path.lexists(td):
            os.remove(td)
            removed.append(td)
    except Exception as exc:
        errors.append(f"runtime: {exc}")
    return {
        "success": not errors,
        "removed": removed,
        "errors": errors,
        "protonPreserved": True,
        "requiredProton": REQUIRED_PROTON,
    }


def uninstall_required_proton() -> Dict[str, Any]:
    """Remove only the exact GE-Proton version managed for Tokeer."""
    compat_dirs = []
    for root in _steam_roots():
        compat_dirs.extend([
            os.path.join(root, "compatibilitytools.d"),
            os.path.join(root, "steamapps", "compatibilitytools.d"),
        ])
    home = _home()
    compat_dirs.extend([
        os.path.join(home, ".steam", "root", "compatibilitytools.d"),
        os.path.join(home, ".steam", "steam", "compatibilitytools.d"),
        os.path.join(home, ".local", "share", "Steam", "compatibilitytools.d"),
    ])
    removed = []
    errors = []
    seen = set()
    for compat in compat_dirs:
        try:
            real = os.path.realpath(compat)
            if real in seen:
                continue
            seen.add(real)
            target = os.path.join(real, REQUIRED_PROTON)
            if os.path.isdir(target):
                shutil.rmtree(target)
                removed.append(target)
            elif os.path.lexists(target):
                os.remove(target)
                removed.append(target)
            for archive_name in (
                f".{REQUIRED_PROTON}.tar.gz",
                f"{REQUIRED_PROTON}.tar.gz.part",
                f".{REQUIRED_PROTON}.tmp",
            ):
                stale = os.path.join(real, archive_name)
                if os.path.lexists(stale):
                    os.remove(stale)
                    removed.append(stale)
        except Exception as exc:
            errors.append(f"{compat}: {exc}")
    return {"success": not errors, "removed": removed, "errors": errors,
            "name": REQUIRED_PROTON}


def _shared_fetch(url: str, dest: str | None = None, label: str = ""):
    """Fetch through the same pooled HTTPX transport used by CloudRedirect Moon.

    When dest is None return bytes (matching Tokeer's bundled _fetch contract);
    otherwise stream to disk so the ~400 MiB Proton archive is never held in RAM.
    """
    client = ensure_http_client(f"tokeer: {label or os.path.basename(url)}")
    try:
        if dest is None:
            response = client.get(url, follow_redirects=True, timeout=120)
            response.raise_for_status()
            return response.content
        with client.stream("GET", url, follow_redirects=True, timeout=None) as response:
            response.raise_for_status()
            with open(dest, "wb") as target:
                for chunk in response.iter_bytes(1 << 20):
                    if chunk:
                        target.write(chunk)
        return bool(os.path.isfile(dest) and os.path.getsize(dest) > 0)
    except Exception:
        try:
            if dest and os.path.exists(dest):
                os.remove(dest)
        except OSError:
            pass
        return None


def _download(url: str, dest: str) -> None:
    if not _shared_fetch(url, dest, os.path.basename(dest)):
        raise RuntimeError(f"Secure GitHub download failed: {url}")


def _latest_bundle() -> tuple[str, str]:
    """Return (release tag, Linux bundle URL), with the stable asset fallback."""
    try:
        client = ensure_http_client("tokeer: latest release")
        response = client.get(
            RELEASE_API,
            headers={
                "User-Agent": "SLSDeck-Tokeer/1.0",
                "Accept": "application/vnd.github+json",
            },
            follow_redirects=True,
            timeout=60,
        )
        response.raise_for_status()
        release = response.json()
        tag = str(release.get("tag_name") or "")
        for asset in release.get("assets") or []:
            if str(asset.get("name") or "").lower() == "tokeer-linux.zip":
                return tag, str(asset.get("browser_download_url") or RUNTIME_ZIP)
        return tag, RUNTIME_ZIP
    except Exception:
        return "", RUNTIME_ZIP


def _installed_runtime_version() -> str:
    try:
        with open(os.path.join(_tdir(), VERSION_FILE), "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return ""


def ensure_runtime_latest() -> Dict[str, Any]:
    """Install/update shared Tokeer files without touching live Steam config."""
    td = _tdir()
    required = ["tokeer", "tokeer_validate_linux.py", "tokeer_redeem_linux.py",
                "ost-run.sh", "ost_native_hook.so", "tokeer_steam_config.py"]
    tag, bundle_url = _latest_bundle()
    installed_version = _installed_runtime_version()
    complete = all(os.path.isfile(os.path.join(td, name)) for name in required)

    # A known matching release is a true latest-version skip. If GitHub is
    # temporarily unreachable, preserve a complete runtime instead of replacing
    # it blindly; the next invocation checks the release again.
    if complete and ((tag and installed_version == tag) or not tag):
        return {
            "success": True, "installed": True, "updated": False,
            "skipped": True, "version": installed_version or "installed",
            "latest": tag or None, "home": td, "requiredProton": REQUIRED_PROTON,
        }

    try:
        os.makedirs(td, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="slsdeck-tokeer-runtime-") as tmp:
            archive = os.path.join(tmp, "tokeer-linux.zip")
            _download(bundle_url, archive)
            unpacked = os.path.join(tmp, "unpacked")
            os.makedirs(unpacked, exist_ok=True)
            with zipfile.ZipFile(archive) as zf:
                base = os.path.abspath(unpacked)
                for member in zf.infolist():
                    target = os.path.abspath(os.path.join(base, member.filename))
                    if not (target == base or target.startswith(base + os.sep)):
                        raise RuntimeError("Unsafe path in Tokeer runtime archive.")
                zf.extractall(unpacked)

            source_dir = ""
            for root, _dirs, files in os.walk(unpacked):
                if "ost_native_hook.c" in files and "tokeer" in files:
                    source_dir = root
                    break
            if not source_dir:
                raise RuntimeError("The latest Tokeer Linux bundle is incomplete.")
            # Validate the replacement before removing anything. Then clear only
            # files managed by the upstream bundle plus interrupted-write
            # siblings; logs and any user state in ~/.tokeer remain intact.
            source_files = [
                name for name in os.listdir(source_dir)
                if os.path.isfile(os.path.join(source_dir, name))
            ]
            managed = set(source_files) | set(required) | {
                "build.sh", "ost_native_hook.c", "server_config.py", VERSION_FILE,
            }
            for name in managed:
                for suffix in ("", ".tmp", ".part", ".new", ".old"):
                    stale = os.path.join(td, name + suffix)
                    try:
                        if os.path.lexists(stale):
                            os.remove(stale)
                    except OSError:
                        pass
            for name in source_files:
                src = os.path.join(source_dir, name)
                dst = os.path.join(td, name)
                staged = dst + ".tmp"
                shutil.copy2(src, staged)
                os.replace(staged, dst)

        with open(os.path.join(td, "server_config.py"), "w", encoding="utf-8") as fh:
            fh.write('SERVER_URL = "https://luastools.xyz"\n')
        for name in ("tokeer", "ost-run.sh", "build.sh"):
            path = os.path.join(td, name)
            if os.path.isfile(path):
                os.chmod(path, os.stat(path).st_mode | 0o111)

        hook = os.path.join(td, "ost_native_hook.so")
        if not os.path.isfile(hook):
            build = os.path.join(td, "build.sh")
            if not os.path.isfile(build):
                raise RuntimeError("Tokeer bundle has no native hook or build script.")
            built = _run_as_user(["bash", build], timeout=240)
            if built.returncode != 0 or not os.path.isfile(hook):
                raise RuntimeError((built.stdout or "Could not build Tokeer native hook.")[-6000:])

        bindir = os.path.join(_home(), ".local", "bin")
        os.makedirs(bindir, exist_ok=True)
        link = os.path.join(bindir, "tokeer")
        try:
            if os.path.lexists(link):
                os.remove(link)
            os.symlink(os.path.join(td, "tokeer"), link)
        except OSError:
            pass

        saved_version = tag or installed_version or "latest"
        with open(os.path.join(td, VERSION_FILE), "w", encoding="utf-8") as fh:
            fh.write(saved_version + "\n")
        return {
            "success": True, "installed": True, "updated": True,
            "skipped": False, "version": saved_version, "latest": tag or None,
            "home": td, "requiredProton": REQUIRED_PROTON,
        }
    except Exception as exc:
        return {"success": False, "installed": complete, "error": str(exc),
                "home": td, "requiredProton": REQUIRED_PROTON}


def required_proton_status() -> Dict[str, Any]:
    """Read-only health check for the exact compatibility tool Tokeer requires."""
    candidates = []
    try:
        cfg_path = os.path.join(_tdir(), "tokeer_steam_config.py")
        if os.path.isfile(cfg_path):
            spec = importlib.util.spec_from_file_location("slsdeck_tokeer_status_config", cfg_path)
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                for root in _steam_roots(module):
                    candidates.extend([
                        os.path.join(root, "compatibilitytools.d", REQUIRED_PROTON),
                        os.path.join(root, "steamapps", "compatibilitytools.d", REQUIRED_PROTON),
                    ])
    except Exception:
        pass
    candidates.append(os.path.join(_home(), ".steam", "root", "compatibilitytools.d", REQUIRED_PROTON))
    seen = set()
    for path in candidates:
        real = os.path.realpath(path)
        if real in seen:
            continue
        seen.add(real)
        if os.path.isdir(os.path.join(real, "files")) or os.path.isdir(os.path.join(real, "dist")):
            return {"success": True, "installed": True, "healthy": True,
                    "name": REQUIRED_PROTON, "path": real}
    partial = next((os.path.realpath(p) for p in candidates if os.path.isdir(p)), "")
    return {"success": True, "installed": False, "healthy": False,
            "partial": bool(partial), "name": REQUIRED_PROTON, "path": partial}


def ensure_required_proton(force: bool = False) -> Dict[str, Any]:
    """Install upstream's exact GE-Proton requirement, without editing VDF."""
    before = required_proton_status()
    if before.get("installed") and before.get("healthy") and not force:
        return {
            "success": True, "installed": True, "healthy": True,
            "updated": False, "skipped": True, "name": REQUIRED_PROTON,
            "path": before.get("path", ""), "requiredProton": REQUIRED_PROTON,
        }
    cfg_path = os.path.join(_tdir(), "tokeer_steam_config.py")
    if not os.path.isfile(cfg_path):
        return {"success": False, "error": "Tokeer Steam configurator is missing.",
                "requiredProton": REQUIRED_PROTON}
    try:
        spec = importlib.util.spec_from_file_location("slsdeck_tokeer_steam_config", cfg_path)
        if not spec or not spec.loader:
            raise RuntimeError("Could not load Tokeer's Proton installer.")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        # The upstream configurator's _fetch uses urllib and Decky's embedded
        # Python CA store. Reuse SLSDeck's proven CloudRedirect HTTPX transport
        # while preserving upstream URLs, extraction and SHA-512 verification.
        module._fetch = _shared_fetch
        roots = _steam_roots(module)
        if not roots:
            raise RuntimeError("Steam installation was not found.")

        # The upstream installer skips an exact valid directory. Remove only an
        # exact-name partial extraction and its interrupted archive first; never
        # touch any other compatibility tool/version.
        compat_dirs = []
        for root in roots:
            compat_dirs.extend([
                os.path.join(root, "compatibilitytools.d"),
                os.path.join(root, "steamapps", "compatibilitytools.d"),
            ])
        compat_dirs.append(os.path.join(_home(), ".steam", "root", "compatibilitytools.d"))
        seen = set()
        for compat in compat_dirs:
            compat = os.path.realpath(compat)
            if compat in seen:
                continue
            seen.add(compat)
            target = os.path.join(compat, REQUIRED_PROTON)
            valid = os.path.isdir(os.path.join(target, "files")) or os.path.isdir(os.path.join(target, "dist"))
            if os.path.isdir(target) and (force or not valid):
                # Exact-version manual reinstall or partial extraction repair.
                # Other GE-Proton versions and compatibility tools are untouched.
                shutil.rmtree(target)
            for archive_name in (
                f".{REQUIRED_PROTON}.tar.gz", f"{REQUIRED_PROTON}.tar.gz.part",
                f".{REQUIRED_PROTON}.tmp",
            ):
                stale = os.path.join(compat, archive_name)
                try:
                    if os.path.lexists(stale):
                        os.remove(stale)
                except OSError:
                    pass

        path = module.ensure_proton_installed(roots[0], REQUIRED_PROTON)
        if not path:
            raise RuntimeError(f"Could not install {REQUIRED_PROTON}.")
        return {"success": True, "installed": True, "healthy": True,
                "updated": True, "skipped": False, "name": REQUIRED_PROTON,
                "path": path, "requiredProton": REQUIRED_PROTON}
    except Exception as exc:
        return {"success": False, "error": str(exc), "requiredProton": REQUIRED_PROTON}


def prepare(appid: int) -> Dict[str, Any]:
    """Run the official Linux setup for one installed Steam game.

    The upstream setup may restart Steam because localconfig.vdf must be edited
    while Steam is closed.  Decky stays alive; after Steam returns the user can
    reopen SLSDeck and continue with Verify.
    """
    if not str(appid).isdigit() or int(appid) <= 0:
        return {"success": False, "error": "Invalid Steam AppID."}
    try:
        with tempfile.TemporaryDirectory(prefix="slsdeck-tokeer-") as tmp:
            script = os.path.join(tmp, "install_linux.sh")
            _download(INSTALL_SCRIPT, script)
            os.chmod(script, 0o755)
            p = _run_as_user(["bash", script, str(int(appid))], timeout=420)
        out = (p.stdout or "")[-24000:]
        return {"success": p.returncode == 0, "returnCode": p.returncode,
                "output": out, "steamMayRestart": True,
                "error": "" if p.returncode == 0 else "Tokeer setup failed."}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def prepare_and_verify(appid: int, ubisoft: bool = False) -> Dict[str, Any]:
    """Run upstream Step 1 and then its local verifier as one backend job.

    Keeping both commands in one Decky-side call matters because Step 1 may
    restart Steam, destroying the React UI before it could issue a second RPC.
    """
    prepared = prepare(appid)
    if not prepared.get("success"):
        return {
            "success": False,
            "phase": "prepare",
            "prepare": prepared,
            "output": prepared.get("output", ""),
            "error": prepared.get("error") or "Tokeer setup failed.",
        }
    checked = verify(appid, ubisoft)
    return {
        **checked,
        "phase": "verified" if checked.get("success") else "verify",
        "prepare": prepared,
        "steamMayRestart": bool(prepared.get("steamMayRestart")),
    }


def _decode_tlx(code: str) -> Dict[str, Any]:
    try:
        parts = code.split(".")
        if len(parts) < 3 or parts[0] != "TLX1":
            return {}
        s = parts[1] + "=" * (-len(parts[1]) % 4)
        return json.loads(base64.urlsafe_b64decode(s.encode("ascii")).decode("utf-8"))
    except Exception:
        return {}


def verify(appid: int, ubisoft: bool = False,
           live_launch_options: str = "") -> Dict[str, Any]:
    if not str(appid).isdigit() or int(appid) <= 0:
        return {"success": False, "error": "Invalid Steam AppID."}
    cmd = os.path.join(_tdir(), "tokeer")
    if not os.path.isfile(cmd):
        return {"success": False, "needsPrepare": True, "error": "Tokeer is not prepared yet."}
    try:
        # The upstream `tokeer verify-ubi` wrapper appends the literal
        # `ubisoft` argument for the validator itself. Passing `--ubi` here
        # occupies that positional slot and makes the validator fall back to
        # Steam mode, despite using the verify-ubi subcommand.
        args = ([cmd, "verify-ubi", str(int(appid))]
                if ubisoft else [cmd, "verify", str(int(appid))])
        p = _run_as_user(args, timeout=120)
        out = p.stdout or ""
        m = re.search(r"TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", out)
        code = m.group(0) if m else ""
        report = _decode_tlx(code) if code else {}
        # Without a TLX1 payload there is no structured report to evaluate.
        # Treating absent keys as False made one verifier/process failure look
        # like four independent setup failures (including "game installation"
        # immediately after preflight had found the game). Preserve the raw
        # verifier result instead so the UI can show the actual cause.
        if not code:
            clean = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", out).strip()
            detail = (
                f"Tokeer verifier did not generate a TLX1 report (exit {p.returncode})."
            )
            if clean:
                detail += "\n\nVerifier output:\n" + clean[-12000:]
            else:
                detail += " The verifier returned no diagnostic output."
            return {
                "success": False,
                "code": "",
                "report": {},
                "checks": None,
                "output": out[-24000:],
                "returnCode": p.returncode,
                "failedChecks": [],
                "error": detail,
            }
        expected_mode = "ubisoft" if ubisoft else "steam"
        actual_mode = str(report.get("mode") or "steam").lower()
        if actual_mode != expected_mode:
            return {
                "success": False,
                "code": "",
                "report": report,
                "checks": None,
                "output": out[-24000:],
                "returnCode": p.returncode,
                "failedChecks": [],
                "error": (
                    f"Tokeer generated a {actual_mode} setup code while "
                    f"{expected_mode} verification was requested. The code was not submitted."
                ),
            }
        # SLSDeck writes launch options through Steam's live API so Steam does
        # not need to restart. Upstream verifies localconfig.vdf, which can lag
        # behind the live value. Correct only that stale field, and only for the
        # exact wrapper installed in this user's Tokeer home. Every other check
        # remains exactly as reported by the upstream validator.
        wrapper = os.path.join(_tdir(), "ost-run.sh")
        live_options = str(live_launch_options or "")
        live_wrapper_set = bool(
            not ubisoft
            and re.search(
                r"(?:^|\s)(?:'" + re.escape(wrapper) + r"'|\""
                + re.escape(wrapper) + r"\"|" + re.escape(wrapper)
                + r")(?:\s|$)",
                live_options,
            )
            and "%command%" in live_options
        )
        if not report.get("launch_opt") and live_wrapper_set:
            report["launch_opt"] = True
            raw = json.dumps(report, separators=(",", ":"), sort_keys=True).encode("utf-8")
            sig = hmac.new(LINUX_VALIDATE_SECRET, raw, hashlib.sha256).digest()

            def _b64(value: bytes) -> str:
                return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")

            code = "TLX1." + _b64(raw) + "." + _b64(sig)
            out += "\nSLSDeck: launch option confirmed through Steam's live API.\n"
        checks = {
            "installed": bool(report.get("installed")),
            "prefix": bool(report.get("prefix")),
            "hook": bool(report.get("hook")),
            "launchOpt": bool(report.get("launch_opt")),
            "proton": report.get("proton"),
        }
        passed = bool(
            code and checks["installed"] and checks["prefix"]
            and (ubisoft or (checks["hook"] and checks["launchOpt"]))
        )
        failed = []
        if not checks["installed"]:
            failed.append("game installation")
        if not checks["prefix"]:
            failed.append("Proton prefix")
        if not ubisoft and not checks["hook"]:
            failed.append("native hook")
        if not ubisoft and not checks["launchOpt"]:
            failed.append("launch option")
        if failed:
            detail = "Tokeer setup checks failed: " + ", ".join(failed) + "."
        else:
            detail = ""
        return {"success": passed, "code": code, "report": report, "checks": checks,
                "output": out[-24000:], "returnCode": p.returncode,
                "failedChecks": failed, "error": "" if passed else detail}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def redeem(code: str) -> Dict[str, Any]:
    code = (code or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{4,32}", code):
        return {"success": False, "error": "Enter the activation code returned by Tokeer Discord."}
    cmd = os.path.join(_tdir(), "tokeer")
    if not os.path.isfile(cmd):
        return {"success": False, "needsPrepare": True, "error": "Tokeer is not prepared yet."}
    try:
        # Follow Tokeer's official one-command flow: write the activation
        # tickets and launch the game through steam://rungameid/<appid>.
        # Upstream's Wine registry import has its own 120-second timeout. Give
        # it enough room to unwind and print the failing phase instead of
        # killing the wrapper at the exact same deadline with no diagnostics.
        p = _run_as_user([cmd, code], timeout=150)
        out = p.stdout or ""
        phase = ""
        matches = re.findall(r"\[([1-4])/4\]\s*([^\n]+)", out)
        if matches:
            phase = f"Tokeer stopped during step {matches[-1][0]}/4 ({matches[-1][1].strip()}). "
        return {"success": p.returncode == 0, "returnCode": p.returncode,
                "output": out[-24000:],
                "error": "" if p.returncode == 0 else phase + "Activation failed.\n\n" + out[-6000:]}
    except subprocess.TimeoutExpired as exc:
        partial = exc.stdout or exc.output or ""
        if isinstance(partial, bytes):
            partial = partial.decode("utf-8", "replace")
        partial = str(partial)
        matches = re.findall(r"\[([1-4])/4\]\s*([^\n]+)", partial)
        phase = (f" during step {matches[-1][0]}/4 ({matches[-1][1].strip()})"
                 if matches else " before reporting its current step")
        return {"success": False, "output": partial[-24000:], "timedOut": True,
                "error": f"Tokeer did not finish{phase} after 150 seconds.\n\n{partial[-6000:]}".strip()}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _generator_exe() -> str:
    return os.path.join(_tdir(), "generator", "extract_tickets.exe")


def _ensure_generator() -> str:
    """Install only upstream's ticket extractor, pinned and hash-verified."""
    target = _generator_exe()
    try:
        if os.path.isfile(target):
            with open(target, "rb") as fh:
                if hashlib.sha256(fh.read()).hexdigest() == GENERATOR_SHA256:
                    return target
        os.makedirs(os.path.dirname(target), exist_ok=True)
        staged = target + ".tmp"
        _download(GENERATOR_URL, staged)
        with open(staged, "rb") as fh:
            actual = hashlib.sha256(fh.read()).hexdigest()
        if actual != GENERATOR_SHA256:
            os.remove(staged)
            raise RuntimeError("Downloaded Tokeer extractor failed its SHA-256 check.")
        os.replace(staged, target)
        return target
    except Exception:
        try:
            if os.path.exists(target + ".tmp"):
                os.remove(target + ".tmp")
        except OSError:
            pass
        raise


def _recent_steam_id() -> str:
    block_re = re.compile(r'"(\d{17})"\s*\{(.*?)\}', re.DOTALL)
    recent_re = re.compile(r'"MostRecent"\s*"1"', re.IGNORECASE)
    fallback = ""
    for path in steam._loginusers_paths():
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
        except OSError:
            continue
        for match in block_re.finditer(content):
            fallback = fallback or match.group(1)
            if recent_re.search(match.group(2)):
                return match.group(1)
    return fallback


def _ticket_owner(appticket: str) -> str:
    try:
        raw = bytes.fromhex(appticket)
        owner = int.from_bytes(raw[8:16], "little")
        return str(owner) if owner >= 76561197960265728 else ""
    except Exception:
        return ""


def _generator_post(body: Dict[str, Any]) -> tuple[int, Dict[str, Any]]:
    client = ensure_http_client("tokeer: generate key")
    response = client.post(
        GENERATOR_SERVER + "/drm/generate",
        json=body,
        headers={"User-Agent": "SLSDeck-Tokeer-Generator/1.0", "Accept": "application/json"},
        timeout=30,
    )
    try:
        data = response.json()
    except Exception:
        data = {"reason": response.text[:500]}
    return response.status_code, data


def generate_key(appid: int) -> Dict[str, Any]:
    """Mint a Tokeer share code from a genuinely-owned installed Steam game."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid Steam AppID."}
    if appid <= 0:
        return {"success": False, "error": "Invalid Steam AppID."}

    # Reject SLS-injected games before starting Proton. The server independently
    # verifies the signed ownership ticket, so this is an early safety check.
    try:
        from . import slssteam
        if appid in set(slssteam.read_additional_apps()):
            return {"success": False, "error": "Dump key only works with a game genuinely owned by the signed-in Steam account."}
    except Exception:
        pass

    found = steam.get_game_install_path_response(appid)
    if not found.get("success"):
        return {"success": False, "error": "The owned game must be installed before dumping its key."}
    proton = required_proton_status()
    proton_root = str(proton.get("path") or "")
    proton_cmd = os.path.join(proton_root, "proton")
    if not proton.get("healthy") or not os.path.isfile(proton_cmd):
        return {"success": False, "needsProton": True,
                "error": f"{REQUIRED_PROTON} is required to run the stripped Tokeer extractor."}

    library = str(found.get("libraryPath") or "")
    compatdata = os.path.join(library, "steamapps", "compatdata", str(appid))
    if not os.path.isdir(os.path.join(compatdata, "pfx")):
        return {"success": False, "error": "This game has no Proton prefix yet. Launch it once with Proton, then try Dump key again."}

    steam_root = detect_steam_install_path()
    current_sid = _recent_steam_id()
    if not current_sid:
        return {"success": False, "error": "Could not identify the Steam account currently signed in."}
    try:
        extractor = _ensure_generator()
    except Exception as exc:
        return {"success": False, "error": f"Could not install the stripped Tokeer extractor: {exc}"}

    env = {
        "STEAM_COMPAT_CLIENT_INSTALL_PATH": steam_root,
        "STEAM_COMPAT_DATA_PATH": compatdata,
        "SteamAppId": str(appid),
        "SteamGameId": str(appid),
        "STEAM_APP_ID": str(appid),
        "STEAM_GAME_ID": str(appid),
    }
    tickets = None
    output = ""
    for attempt in range(3):
        try:
            proc = _run_as_user([proton_cmd, "run", extractor, "--pipe", str(appid)],
                                timeout=55, extra_env=env, cwd=os.path.dirname(extractor))
            output = proc.stdout or ""
        except subprocess.TimeoutExpired as exc:
            partial = exc.stdout or exc.output or ""
            output = partial.decode("utf-8", "replace") if isinstance(partial, bytes) else str(partial)
        lines = [line for line in output.splitlines() if "|" in line]
        if lines:
            parts = lines[-1].strip().split("|")
            if len(parts) >= 4 and parts[1].strip() and parts[2].strip():
                tickets = {
                    "app_id": parts[0].strip(), "appticket": parts[1].strip(),
                    "eticket": parts[2].strip(), "steam_id": parts[3].strip(),
                }
                break
        if attempt < 2:
            time.sleep(1.5)
    if not tickets:
        clean = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", output).strip()
        detail = clean[-4000:] if clean else "The extractor returned no ticket."
        return {"success": False, "error": "Could not dump an ownership ticket through Proton.\n\n" + detail,
                "output": output[-12000:]}

    owner_sid = _ticket_owner(tickets["appticket"])
    if owner_sid and owner_sid != current_sid:
        return {"success": False, "error": "The dumped ticket belongs to a different Steam account, so no key was generated."}
    if tickets.get("steam_id") and tickets["steam_id"] != current_sid:
        return {"success": False, "error": "The extractor connected to a different Steam account, so no key was generated."}
    try:
        status, data = _generator_post({
            "appticket": tickets["appticket"], "eticket": tickets["eticket"],
            "steam_id": tickets["steam_id"], "app_id": str(appid), "max_uses": 1,
            "created_by_user": tickets["steam_id"], "current_steam_id": current_sid,
        })
    except Exception as exc:
        return {"success": False, "error": f"Tokeer server unreachable: {exc}"}
    if status != 200 or not data.get("success"):
        return {"success": False,
                "error": data.get("reason") or data.get("error") or f"Tokeer server error {status}."}
    code = str(data.get("code") or "").strip().upper()
    if not code:
        return {"success": False, "error": "Tokeer generated an empty code."}
    return {"success": True, "code": code, "appid": appid,
            "gameName": found.get("name", ""), "maxUses": data.get("max_uses", 1),
            "expiresIn": data.get("expires_in", 86400)}
