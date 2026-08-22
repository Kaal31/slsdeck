"""Tokeer Linux integration used by the Anti-Denuvo page.

SLSDeck does not vendor the upstream Tokeer sources.  Runtime files are fetched
from Tesla697/TokeerDRM-App when the user explicitly prepares a game, then the
upstream Linux verifier/redeemer are invoked locally and their results surfaced
through Decky RPC.
"""
from __future__ import annotations

import base64
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
from typing import Any, Dict

from .paths import get_user_home
from .httpc import ensure_http_client

RUNTIME_ZIP = "https://github.com/Tesla697/TokeerDRM-App/releases/latest/download/tokeer-linux.zip"
INSTALL_SCRIPT = "https://raw.githubusercontent.com/Tesla697/TokeerDRM-App/main/install_linux.sh"
DEFAULT_COOLDOWN_HOURS = 48
RELEASE_API = "https://api.github.com/repos/Tesla697/TokeerDRM-App/releases/latest"
VERSION_FILE = ".slsdeck_runtime_version"
REQUIRED_PROTON = "GE-Proton10-34"
def _home() -> str:
    return get_user_home()


def _tdir() -> str:
    return os.path.join(_home(), ".tokeer")


def _deck_user() -> str:
    home = _home()
    try:
        return pwd.getpwuid(os.stat(home).st_uid).pw_name
    except Exception:
        return "deck"


def _run_as_user(argv, timeout=180) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["HOME"] = _home()
    env.setdefault("USER", _deck_user())
    env.setdefault("LOGNAME", _deck_user())
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
                for root in module.steam_roots() or []:
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
        roots = module.steam_roots()
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


def prepare_and_verify(appid: int) -> Dict[str, Any]:
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
    checked = verify(appid)
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


def verify(appid: int) -> Dict[str, Any]:
    if not str(appid).isdigit() or int(appid) <= 0:
        return {"success": False, "error": "Invalid Steam AppID."}
    cmd = os.path.join(_tdir(), "tokeer")
    if not os.path.isfile(cmd):
        return {"success": False, "needsPrepare": True, "error": "Tokeer is not prepared yet."}
    try:
        p = _run_as_user([cmd, "verify", str(int(appid))], timeout=120)
        out = p.stdout or ""
        m = re.search(r"TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", out)
        code = m.group(0) if m else ""
        report = _decode_tlx(code) if code else {}
        checks = {
            "installed": bool(report.get("installed")),
            "prefix": bool(report.get("prefix")),
            "hook": bool(report.get("hook")),
            "launchOpt": bool(report.get("launch_opt")),
            "proton": report.get("proton"),
        }
        passed = bool(code and checks["installed"] and checks["prefix"] and checks["hook"] and checks["launchOpt"])
        return {"success": passed, "code": code, "report": report, "checks": checks,
                "output": out[-24000:], "returnCode": p.returncode,
                "error": "" if passed else "One or more Tokeer setup checks failed."}
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
        p = _run_as_user([cmd, code, "--no-launch"], timeout=120)
        out = p.stdout or ""
        return {"success": p.returncode == 0, "returnCode": p.returncode,
                "output": out[-24000:], "error": "" if p.returncode == 0 else "Activation failed."}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
