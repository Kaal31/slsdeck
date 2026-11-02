"""Tokeer Linux integration used by the Anti-Denuvo page.

SLSDeck does not vendor the upstream Tokeer sources. Runtime files are fetched
from the official lua.tools TokeerDRM-App Forgejo when the user explicitly
prepares a game, then the
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
import urllib.request
import zipfile
import importlib.util
import unicodedata
from typing import Any, Dict

from .paths import get_user_home
from .httpc import ensure_http_client
from .steam import detect_steam_install_path
from . import steam

# Forgejo has no GitHub-style /releases/latest/download shortcut. Normal
# installs resolve the newest asset through RELEASE_API below; this known-good
# Linux bundle is used only if the release metadata request is unavailable.
RUNTIME_ZIP = "https://git.lua.tools/luatools-dedivision/TokeerDRM-App/releases/download/v1.0.34/tokeer-linux.zip"
INSTALL_SCRIPT = "https://git.lua.tools/luatools-dedivision/TokeerDRM-App/raw/branch/main/install_linux.sh"
DEFAULT_COOLDOWN_HOURS = 48
RELEASE_API = "https://git.lua.tools/api/v1/repos/luatools-dedivision/TokeerDRM-App/releases/latest"
VERSION_FILE = ".slsdeck_runtime_version"
REQUIRED_PROTON = "GE-Proton10-34"
LINUX_VALIDATE_SECRET = b"tokeer_linux_setup_validate_2026_v1_shared"
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


def _run_as_user(argv, timeout=180) -> subprocess.CompletedProcess:
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
    cmd = list(argv)
    if os.geteuid() == 0:
        if shutil.which("runuser"):
            cmd = ["runuser", "-u", _deck_user(), "--"] + cmd
        elif shutil.which("sudo"):
            cmd = ["sudo", "-u", _deck_user(), "-H"] + cmd
    return subprocess.run(cmd, env=env, text=True, stdout=subprocess.PIPE,
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
    """Preserve shared GE-Proton on uninstall.

    GE is now an optional legacy/manual compatibility tool and can be in use
    by unrelated games. A plugin uninstall cannot safely infer ownership from
    its folder name; removal is therefore left to Steam's compatibility-tools
    manager or an explicit user action.
    """
    return {"success": True, "preserved": True, "removed": [],
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
        raise RuntimeError(f"Secure Tokeer Linux download failed: {url}")


def _latest_bundle() -> tuple[str, str, str]:
    """Return release tag, Linux bundle URL and an exact asset identity.

    Forgejo permits replacing release assets without incrementing the tag. An
    asset id/updated_at/digest change must invalidate an old runtime even when
    the visible Tokeer version remains identical.
    """
    try:
        client = ensure_http_client("tokeer: latest release")
        response = client.get(
            RELEASE_API,
            headers={"User-Agent": "SLSDeck-Tokeer/1.0",
                     "Accept": "application/json"},
            follow_redirects=True, timeout=60,
        )
        response.raise_for_status()
        release = response.json()
        tag = str(release.get("tag_name") or "")
        for asset in release.get("assets") or []:
            if str(asset.get("name") or "").lower() != "tokeer-linux.zip":
                continue
            # Prefer a stable asset id and its revision metadata; file size
            # alone is not sufficient when a same-sized archive is replaced.
            parts = [str(asset.get(field) or "") for field in
                     ("id", "updated_at", "digest", "size")]
            revision = "|".join(parts) if any(parts) else ""
            return tag, str(asset.get("browser_download_url") or RUNTIME_ZIP), revision
        # A release without its Linux asset is not a known update; don't
        # download an older hardcoded fallback and replace a healthy runtime.
        return "", RUNTIME_ZIP, ""
    except Exception:
        return "", RUNTIME_ZIP, ""


def _installed_runtime_version() -> tuple[str, str]:
    try:
        with open(os.path.join(_tdir(), VERSION_FILE), "r", encoding="utf-8") as fh:
            raw = fh.read().strip()
        if raw.startswith("{"):
            value = json.loads(raw)
            return (str(value.get("tag") or ""),
                    str(value.get("assetRevision") or ""))
        return raw, ""  # legacy version-only marker, one-time refresh
    except (OSError, ValueError, TypeError):
        return "", ""


def ensure_runtime_latest() -> Dict[str, Any]:
    """Install/update shared Tokeer files without touching live Steam config."""
    td = _tdir()
    required = ["tokeer", "tokeer_validate_linux.py", "tokeer_redeem_linux.py",
                "ost-run.sh", "ost_native_hook.so", "tokeer_steam_config.py"]
    tag, bundle_url, revision = _latest_bundle()
    installed_version, installed_revision = _installed_runtime_version()
    complete = all(os.path.isfile(os.path.join(td, name)) for name in required)

    # A matching *tag and asset revision* is current. Keep a complete runtime
    # if the release API cannot be reached; never downgrade on a metadata miss.
    if complete and (not tag or (installed_version == tag and
                                (not revision or installed_revision == revision))):
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
            json.dump({"tag": saved_version, "assetRevision": revision}, fh)
            fh.write("\n")
        return {
            "success": True, "installed": True, "updated": True,
            "skipped": False, "version": saved_version, "latest": tag or None,
            "home": td, "requiredProton": REQUIRED_PROTON,
        }
    except Exception as exc:
        return {"success": False, "installed": complete, "error": str(exc),
                "home": td, "requiredProton": REQUIRED_PROTON}



def recommended_proton(appid: int) -> Dict[str, Any]:
    """Read the installed Linux Tokeer configurator's game-specific policy.

    Modern Tokeer provides choose_proton(appid, roots). Old bundles used
    TARGET_PROTON and require the matching GE build. Do not download a GE
    tarball for modern Valve-Proton selections, and never invent a community
    compatibility-tool mapping that is absent on disk.
    """
    try:
        appid = int(appid)
        if appid <= 0:
            raise ValueError("Invalid Steam AppID.")
        cfg = os.path.join(_tdir(), "tokeer_steam_config.py")
        if os.path.isfile(cfg):
            spec = importlib.util.spec_from_file_location("slsdeck_tokeer_proton_policy", cfg)
            if not spec or not spec.loader:
                raise RuntimeError("Could not load Tokeer's Steam configurator.")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            picker = getattr(module, "choose_proton", None)
            if callable(picker):
                roots = _steam_roots(module)
                chosen = str(picker(str(appid), roots) or "").strip()
                valve = {
                    "proton_experimental", "proton_hotfix", "proton_11",
                    "proton_10", "proton_9", "proton_8", "proton_7",
                    "proton_63", "proton_513",
                }
                # A custom mapping must correspond to a real installed tool.
                custom_ready = chosen and chosen not in valve and any(
                    (os.path.isdir(os.path.join(root, "compatibilitytools.d",
                                               chosen, "files")) or
                     os.path.isdir(os.path.join(root, "compatibilitytools.d",
                                               chosen, "dist")))
                    for root in roots
                )
                if chosen in valve or custom_ready:
                    return {"success": True, "name": chosen, "legacy": False,
                            "requiresInstall": False, "source": "upstream"}
                raise RuntimeError("Tokeer returned an unavailable Proton compatibility tool.")
            # Legacy configurators always pinned GE-Proton10-34. Keep the old
            # dependency path only for that version of Tokeer.
            legacy = str(getattr(module, "TARGET_PROTON", "") or "").strip()
            if legacy == REQUIRED_PROTON:
                return {"success": True, "name": legacy, "legacy": True,
                        "requiresInstall": True, "source": "legacy"}
        # A missing configurator or a bundle without either selection API
        # must not cause an unnecessary 500 MiB download.
        return {"success": True, "name": "proton_experimental",
                "legacy": False, "requiresInstall": False, "source": "fallback"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}



# Install the exact Tokeer-compatible GE-Proton release independently of the
# upstream Tokeer configurator. That configurator no longer consistently exports
# ensure_proton_installed(), so treating it as a stable API breaks Decky setup.
REQUIRED_PROTON_RELEASE = (
    "https://github.com/GloriousEggroll/proton-ge-custom/releases/download/"
    "GE-Proton10-34/"
)


def _proton_ready(path: str) -> bool:
    return (os.path.isfile(os.path.join(path, "compatibilitytool.vdf"))
            and (os.path.isdir(os.path.join(path, "files"))
                 or os.path.isdir(os.path.join(path, "dist"))))


def _proton_candidates() -> list[str]:
    roots = _steam_roots()
    home = _home()
    roots.extend([os.path.join(home, ".steam", "root"),
                  os.path.join(home, ".local", "share", "Steam")])
    candidates: list[str] = []
    seen: set[str] = set()
    for root in roots:
        for compat in (os.path.join(root, "compatibilitytools.d"),
                       os.path.join(root, "steamapps", "compatibilitytools.d")):
            path = os.path.realpath(os.path.join(compat, REQUIRED_PROTON))
            if path not in seen:
                seen.add(path)
                candidates.append(path)
    return candidates


def required_proton_status() -> Dict[str, Any]:
    """Read-only check for the *exact* Proton build Tokeer needs."""
    candidates = _proton_candidates()
    for path in candidates:
        if _proton_ready(path):
            return {"success": True, "installed": True, "healthy": True,
                    "name": REQUIRED_PROTON, "path": path}
    partial = next((path for path in candidates if os.path.isdir(path)), "")
    return {"success": True, "installed": False, "healthy": False,
            "partial": bool(partial), "name": REQUIRED_PROTON, "path": partial}


def _verify_proton_archive(archive: str, checksum_text: str) -> None:
    """Verify the SHA-512 published alongside the pinned GitHub asset."""
    matches = re.findall(r"(?<![a-fA-F0-9])[a-fA-F0-9]{128}(?![a-fA-F0-9])",
                         checksum_text)
    if len(matches) != 1:
        raise RuntimeError("GE-Proton10-34 release checksum is missing or ambiguous.")
    digest = hashlib.sha512()
    with open(archive, "rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    if not hmac.compare_digest(digest.hexdigest(), matches[0].lower()):
        raise RuntimeError("GE-Proton10-34 download failed SHA-512 verification.")


def _unpack_verified_proton(archive: str, destination: str) -> str:
    """Extract a verified archive without allowing path traversal or link escapes."""
    import posixpath
    import tarfile

    prefix = REQUIRED_PROTON + "/"
    with tarfile.open(archive, "r:gz") as bundle:
        members = bundle.getmembers()
        if not members:
            raise RuntimeError("GE-Proton10-34 archive is empty.")
        for member in members:
            name = posixpath.normpath(member.name)
            if (member.name.startswith("/") or ".." in member.name.split("/") or name != REQUIRED_PROTON
                    and not name.startswith(prefix)):
                raise RuntimeError("Unexpected path in GE-Proton10-34 archive.")
            if member.issym():
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name),
                                                           member.linkname))
                if target != REQUIRED_PROTON and not target.startswith(prefix):
                    raise RuntimeError("Unsafe symbolic link in Proton archive.")
            elif member.islnk():
                target = posixpath.normpath(member.linkname)
                if target != REQUIRED_PROTON and not target.startswith(prefix):
                    raise RuntimeError("Unsafe hard link in Proton archive.")
            elif not (member.isfile() or member.isdir()):
                raise RuntimeError("Unsupported entry in Proton archive.")
        # Validate the entire archive before extracting any member. The archive
        # itself is SHA-512 verified against the publisher's separate checksum.
        if hasattr(tarfile, "data_filter"):
            bundle.extractall(destination, filter="data")
        else:
            bundle.extractall(destination)
    result = os.path.join(destination, REQUIRED_PROTON)
    if not _proton_ready(result):
        raise RuntimeError("GE-Proton10-34 archive did not contain a usable Proton installation.")
    return result


def ensure_required_proton(force: bool = False) -> Dict[str, Any]:
    """Install the exact pinned GE-Proton release; never remove a working copy first.

    Stage download and extraction inside Steam's compatibilitytools.d so neither
    large intermediate lives in tmpfs. Swap only the exact matching installation
    after its checksum and layout have been verified; restore it on failure.
    """
    before = required_proton_status()
    if before.get("healthy") and not force:
        return {"success": True, "installed": True, "healthy": True,
                "updated": False, "skipped": True, "name": REQUIRED_PROTON,
                "path": before.get("path", ""), "requiredProton": REQUIRED_PROTON}
    try:
        existing = str(before.get("path") or "")
        if existing:
            compat = os.path.dirname(existing)
        else:
            roots = _steam_roots()
            if not roots:
                raise RuntimeError("Steam installation was not found.")
            compat = os.path.realpath(os.path.join(roots[0], "compatibilitytools.d"))
        os.makedirs(compat, exist_ok=True)
        from .utils import chown_to_user
        chown_to_user(compat, recursive=False)
        target = os.path.join(compat, REQUIRED_PROTON)
        with tempfile.TemporaryDirectory(prefix=".slsdeck-ge-proton-", dir=compat) as stage:
            archive = os.path.join(stage, REQUIRED_PROTON + ".tar.gz")
            checksum_bytes = _shared_fetch(REQUIRED_PROTON_RELEASE + REQUIRED_PROTON + ".sha512sum")
            if not isinstance(checksum_bytes, bytes):
                raise RuntimeError("Could not download the official GE-Proton10-34 checksum.")
            checksum = checksum_bytes.decode("ascii", "strict")
            if not _shared_fetch(REQUIRED_PROTON_RELEASE + REQUIRED_PROTON + ".tar.gz", archive):
                raise RuntimeError("Could not download GE-Proton10-34 from its official release.")
            _verify_proton_archive(archive, checksum)
            unpacked = _unpack_verified_proton(archive, stage)
            chown_to_user(unpacked, recursive=True)
            # The old exact-version directory stays intact until extraction,
            # checksum verification and ownership repair have all completed successfully.
            previous = os.path.join(stage, "previous")
            had_target = os.path.lexists(target)
            if had_target:
                os.replace(target, previous)
            try:
                os.replace(unpacked, target)
            except Exception:
                if had_target:
                    os.replace(previous, target)
                raise
        result = required_proton_status()
        if not result.get("healthy"):
            raise RuntimeError("GE-Proton10-34 was installed but was not detected.")
        return {"success": True, "installed": True, "healthy": True,
                "updated": True, "skipped": False, "name": REQUIRED_PROTON,
                "path": result.get("path", target), "requiredProton": REQUIRED_PROTON}
    except Exception as exc:
        return {"success": False, "installed": bool(before.get("installed")),
                "error": str(exc), "name": REQUIRED_PROTON,
                "requiredProton": REQUIRED_PROTON}


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


def verify_ea(appid: int) -> Dict[str, Any]:
    """Run Tokeer's EA verifier and return the same structured shape as verify."""
    if not str(appid).isdigit() or int(appid) <= 0:
        return {"success": False, "error": "Invalid Steam AppID."}
    cmd = os.path.join(_tdir(), "tokeer")
    if not os.path.isfile(cmd):
        return {"success": False, "needsPrepare": True, "error": "Tokeer is not prepared yet."}
    try:
        p = _run_as_user([cmd, "ea-verify", str(int(appid))], timeout=120)
        out = p.stdout or ""
        match = re.search(r"TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", out)
        code = match.group(0) if match else ""
        report = _decode_tlx(code) if code else {}
        if not code:
            clean = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", out).strip()
            return {"success": False, "code": "", "report": {}, "checks": None,
                    "output": out[-24000:], "returnCode": p.returncode,
                    "error": "Tokeer EA verifier did not generate a TLX1 report."
                             + (("\n\nVerifier output:\n" + clean[-12000:]) if clean else "")}
        mode = str(report.get("mode") or "ea").lower()
        if mode not in {"ea", "electronic-arts", "electronic_arts"}:
            return {"success": False, "code": "", "report": report, "checks": None,
                    "output": out[-24000:], "returnCode": p.returncode,
                    "error": f"Tokeer generated a {mode} setup code while EA verification was requested."}
        checks = {
            "installed": bool(report.get("installed")),
            "prefix": bool(report.get("prefix")),
            "hook": bool(report.get("hook")),
            "launchOpt": bool(report.get("launch_opt")),
            "proton": report.get("proton"),
        }
        passed = bool(code and checks["installed"] and checks["prefix"])
        failed = [name for name, value in (("game installation", checks["installed"]),
                                             ("Proton prefix", checks["prefix"])) if not value]
        return {"success": passed, "code": code, "report": report,
                "checks": checks, "output": out[-24000:], "returnCode": p.returncode,
                "failedChecks": failed,
                "error": "" if passed else "Tokeer EA setup checks failed: " + ", ".join(failed) + "."}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def prepare_and_verify_ea(appid: int) -> Dict[str, Any]:
    prepared = prepare(appid)
    if not prepared.get("success"):
        return {"success": False, "phase": "prepare", "prepare": prepared,
                "output": prepared.get("output", ""),
                "error": prepared.get("error") or "Tokeer setup failed."}
    checked = verify_ea(appid)
    return {**checked, "phase": "verified" if checked.get("success") else "verify",
            "prepare": prepared, "steamMayRestart": bool(prepared.get("steamMayRestart"))}


def ea_request(appid: int) -> Dict[str, Any]:
    """Generate the EA activation request and locate the exact upstream file."""
    appid = int(appid)
    cmd = os.path.join(_tdir(), "tokeer")
    if appid <= 0 or not os.path.isfile(cmd):
        return {"success": False, "error": "Tokeer is not prepared for this game."}
    started = time.time()
    try:
        p = _run_as_user([cmd, "ea-request", str(appid)], timeout=180)
        out = p.stdout or ""
        candidates = []
        for value in re.findall(r"(?:^|[\s'\"])(/[^\n\r'\"]+)", out):
            path = os.path.realpath(value.strip())
            try:
                name = os.path.basename(path).lower()
                if (os.path.isfile(path) and os.path.getmtime(path) >= started - 2
                        and 0 < os.path.getsize(path) <= 16 * 1024 * 1024
                        and "request" in name and "dbdata" not in name):
                    candidates.append((os.path.getmtime(path), path))
            except OSError:
                pass
        for root, _dirs, files in os.walk(_tdir()):
            for name in files:
                path = os.path.realpath(os.path.join(root, name))
                low = name.lower()
                try:
                    modified = os.path.getmtime(path)
                    size = os.path.getsize(path)
                except OSError:
                    continue
                if (modified >= started - 2 and 0 < size <= 16 * 1024 * 1024
                        and "request" in low and "dbdata" not in low):
                    candidates.append((modified, path))
        candidates.sort(reverse=True)
        if p.returncode != 0:
            return {"success": False, "output": out[-24000:],
                    "error": "Tokeer ea-request failed."}
        if not candidates:
            return {"success": False, "output": out[-24000:],
                    "error": "Tokeer completed ea-request but no fresh request file was found."}
        path = candidates[0][1]
        return {"success": True, "path": path, "filename": os.path.basename(path),
                "size": os.path.getsize(path), "output": out[-24000:]}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def ea_apply(appid: int, dbdata_path: str) -> Dict[str, Any]:
    appid = int(appid)
    cmd = os.path.join(_tdir(), "tokeer")
    path = os.path.realpath(str(dbdata_path or ""))
    if appid <= 0 or not os.path.isfile(cmd):
        return {"success": False, "error": "Tokeer is not prepared for this game."}
    if not os.path.isfile(path) or os.path.basename(path).lower() not in {"dbdata.json", "dbata.json"}:
        return {"success": False, "error": "A downloaded EA dbdata.json file is required."}
    try:
        p = _run_as_user([cmd, "ea-apply", str(appid), path], timeout=180)
        out = p.stdout or ""
        return {"success": p.returncode == 0, "path": path, "output": out[-24000:],
                "error": "" if p.returncode == 0 else "Tokeer ea-apply failed."}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def ea_download_and_apply(appid: int, url: str) -> Dict[str, Any]:
    try:
        if not (str(url).startswith("https://cdn.discordapp.com/attachments/") or
                str(url).startswith("https://media.discordapp.net/attachments/")):
            return {"success": False, "error": "Discord returned an untrusted EA dbdata URL."}
        response = ensure_http_client("tokeer: EA dbdata.json").get(
            str(url), follow_redirects=True, timeout=120)
        response.raise_for_status()
        if not response.content or len(response.content) > 10 * 1024 * 1024:
            return {"success": False, "error": "EA dbdata response has an invalid size."}
        payload = json.loads(response.content.decode("utf-8-sig"))
        if not isinstance(payload, dict):
            return {"success": False, "error": "EA dbdata response is not a JSON object."}
        directory = os.path.join(_tdir(), "ea", str(int(appid)))
        os.makedirs(directory, exist_ok=True)
        path = os.path.join(directory, "dbdata.json")
        staged = path + ".slsdeck-new"
        with open(staged, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
        os.replace(staged, path)
        result = ea_apply(int(appid), path)
        return {**result, "directory": directory}
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
