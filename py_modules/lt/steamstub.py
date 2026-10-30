"""SteamStub processing: bundled Moon helper, with bundled Python fallback.

Steam wraps many game .exes in SteamStub DRM — a ``.bind`` PE section that
decrypts the real code at launch and does an ownership check. SLSsteam doesn't
strip it, so some SteamStub titles fail to launch under an added game or fight
achievement / mod tools.

The manual action runs Moon's bundled Steamless CLI and DLL plugins using the
selected Proton's Wine, with bundled ASSella Python Steamless as a fallback.
Original executables are journaled so Un-fix can restore them.
"""
from __future__ import annotations

import os
import struct
import threading
import subprocess
import stat
import tempfile
from typing import Any, Dict

from .logger import logger
from .paths import get_user_home
from .utils import chown_to_user
from . import slssteam
from . import fixes as _fixes

def _dir() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "SLSDeck", "steamless")
    os.makedirs(d, exist_ok=True)
    chown_to_user(d, recursive=False)
    return d


def _python_script() -> str:
    return os.path.join(os.path.dirname(__file__), "_vendor", "steamless.py")


def _python_command(args, timeout=180):
    # Use system Python, not Decky's frozen executable or its Python environment.
    command = slssteam._wrap_as_user(["env", "-u", "PYTHONHOME", "-u", "PYTHONPATH"] + args)
    return subprocess.run(command, env=slssteam._rich_env(), capture_output=True,
                          text=True, timeout=timeout)


def _ensure_python_runtime() -> str:
    """Create an isolated desktop-user venv only when fallback is requested."""
    script = _python_script()
    if not os.path.isfile(script):
        raise RuntimeError("Bundled Python Steamless is missing; reinstall SLSDeck")
    runtime = os.path.join(_dir(), "python-env")
    python = os.path.join(runtime, "bin", "python3")
    if not os.path.isfile(python):
        logger.log(f"SteamStub Python setup: creating isolated environment at {runtime!r}")
        result = _python_command(["/usr/bin/python3", "-m", "venv", runtime])
        if result.returncode:
            raise RuntimeError(f"Python Steamless environment setup failed: {result.stderr[-1500:]}")
    check = _python_command([python, "-c", "from Crypto.Cipher import AES; from capstone import Cs"])
    if check.returncode:
        logger.log("SteamStub Python setup: installing pycryptodome and capstone (first use)")
        result = _python_command([python, "-m", "pip", "install", "--disable-pip-version-check",
                                  "--only-binary=:all:", "pycryptodome==3.23.0", "capstone==5.0.6"], timeout=300)
        logger.log(f"SteamStub Python dependency setup: exit={result.returncode} outputTail={(result.stdout + result.stderr)[-2000:]!r}")
        if result.returncode:
            raise RuntimeError("Python Steamless dependency setup failed; see plugin log (first use needs network access)")
        check = _python_command([python, "-c", "from Crypto.Cipher import AES; from capstone import Cs"])
        if check.returncode:
            raise RuntimeError(f"Python Steamless dependencies cannot load: {check.stderr[-1500:]}")
    return python


def has_steamstub(exe_path: str) -> bool:
    """Cheap gate: an MZ/PE whose header region carries a '.bind' section (the
    SteamStub wrapper). The real Steamless run confirms/handles the variant."""
    try:
        with open(exe_path, "rb") as fh:
            head = fh.read(65536)
        if head[:2] != b"MZ":
            return False
        if head[0x40:0x44] == b"VLV\0":
            return True
        offset = struct.unpack_from("<I", head, 0x3c)[0]
        if head[offset:offset + 4] != b"PE\0\0":
            return False
        count = struct.unpack_from("<H", head, offset + 6)[0]
        start = offset + 24 + struct.unpack_from("<H", head, offset + 20)[0]
        return any(head[start + i * 40:start + i * 40 + 8].rstrip(b"\0") == b".bind"
                   for i in range(min(count, 96)))
    except (OSError, struct.error):
        return False


def native_paths():
    root = os.path.join(slssteam.lib_dir(), "tools")
    return (os.path.join(root, "steamstub-bypass", "run-steamless.sh"),
            os.path.join(root, "steamless-bin"))


def native_ready():
    script, kit = native_paths()
    return all(os.path.isfile(p) for p in (script, os.path.join(kit, "Steamless.CLI.exe"),
               os.path.join(kit, "Plugins", "Steamless.API.dll")))


def ensure_native() -> bool:
    """Install only helper tools from our bundled archive; preserve the live engine/hooks."""
    script, kit = native_paths()
    logger.log(f"SteamStub native availability: script={os.path.isfile(script)} cli={os.path.isfile(os.path.join(kit, 'Steamless.CLI.exe'))} api={os.path.isfile(os.path.join(kit, 'Plugins', 'Steamless.API.dll'))} root={kit!r}")
    if native_ready():
        return True
    import tempfile
    archive = slssteam._bundled_moon_archive()
    if not archive:
        logger.warn("SteamStub native deployment: bundled archive unavailable")
        return False
    try:
        with tempfile.TemporaryDirectory(prefix="slsdeck-steamstub-") as work:
            if not slssteam._extract_archive(archive, work):
                logger.warn("SteamStub native deployment: archive extraction failed")
                return False
            ready = slssteam._place_steamstub_tools(work) and native_ready()
            logger.log(f"SteamStub native deployment: ready={ready}")
            return ready
    except Exception as exc:
        logger.warn(f"SteamStub native kit deployment failed: {type(exc).__name__}: {exc}")
        return False


def _selected_runtime_env(appid: int) -> Dict[str, str]:
    """Resolve installed Proton across Steam libraries; never use a game's prefix."""
    from . import compat, steam
    mapping = compat.get_proton_mapping(int(appid))
    selected = str(mapping.get("toolName") or "")
    if not selected:
        selected = str(compat.get_proton_mapping(0).get("toolName") or "")
    libraries = steam._all_library_paths()
    home = get_user_home()
    custom_dirs = [os.path.join(root, "compatibilitytools.d") for root in libraries]
    custom_dirs += [os.path.join(home, ".steam", "root", "compatibilitytools.d"),
                    os.path.join(home, ".local", "share", "Steam", "compatibilitytools.d"),
                    "/usr/share/steam/compatibilitytools.d"]
    candidates = []
    for parent in custom_dirs + [os.path.join(root, "steamapps", "common") for root in libraries]:
        try:
            for entry in sorted(os.scandir(parent), key=lambda e: e.name):
                if not entry.is_dir():
                    continue
                names = {entry.name}
                metadata = os.path.join(entry.path, "compatibilitytool.vdf")
                try:
                    with open(metadata, encoding="utf-8") as fh:
                        data = steam._parse_vdf_simple(fh.read())
                    names.update(data.get("compatibilitytools", {}).get("compat_tools", {}).keys())
                except (OSError, ValueError, AttributeError, TypeError):
                    pass
                # Valve's built-in tool IDs differ from their installation directories.
                import re
                if entry.name == "Proton - Experimental":
                    names.add("proton_experimental")
                elif entry.name == "Proton Hotfix":
                    names.add("proton_hotfix")
                else:
                    version = re.fullmatch(r"Proton (\d+)\.0", entry.name)
                    if version:
                        major = int(version.group(1))
                        names.add(f"proton_{major}" if major >= 9 else f"proton_{major}0")
                if selected and selected not in names:
                    continue
                for layout in ("files", "dist"):
                    wine = os.path.join(entry.path, layout, "bin", "wine")
                    server = os.path.join(entry.path, layout, "bin", "wineserver")
                    if all(os.path.isfile(p) and os.access(p, os.X_OK) for p in (wine, server)):
                        candidates.append((wine, server, os.path.join(entry.path, layout)))
                        break
        except OSError:
            continue
    if not candidates:
        logger.warn(f"SteamStub runtime: appid={appid} selected={selected!r} no matching installed Wine/wineserver pair; libraries={libraries!r}")
        if selected:
            raise RuntimeError(f"Selected Proton {selected} has no usable installed Wine/wineserver pair. Install or repair it in Steam.")
        return {}  # Keep upstream's system-Wine discovery when no mapping exists.
    wine, server, files = candidates[0]
    logger.log(f"SteamStub runtime: appid={appid} selected={selected!r} wine={wine!r} wineserver={server!r}")
    return {"WINE_BIN": wine, "WINESERVER": server,
            "WINE_PREFIX": os.path.join(home, ".local", "share", "SLSsteam", "steamless-prefix"),
            "LD_LIBRARY_PATH": os.path.join(files, "lib64") + ":" + os.path.join(files, "lib"),
            "WINEDLLPATH": os.path.join(files, "lib64", "wine") + ":" + os.path.join(files, "lib", "wine")}


_LOCK = threading.Lock()


def status(install_path: str) -> Dict[str, Any]:
    try:
        native_count = len(native_backups(install_path))
        r = _fixes.find_main_exe(install_path)
        exe = r.get("exe") if r.get("success") else ""
        if not exe or not os.path.isfile(exe):
            return {"success": True, "supported": native_count > 0, "nativeBackupCount": native_count}
        stub = has_steamstub(exe)
        done = os.path.isfile(exe + ".original")
        managed = False
        import glob
        for log in glob.glob(os.path.join(install_path, "luatools-fix-log-*.log")):
            with open(log, encoding="utf-8") as fh:
                if "steamstub-managed" in fh.read():
                    managed = True
        return {"success": True, "supported": bool(stub or done or managed or native_count),
                "hasStub": bool(stub), "installed": bool(done or (managed and os.path.isfile(exe + _fixes.ORIG_SUFFIX))),
                "nativeReady": native_ready(), "nativeBackupCount": native_count, "exe": exe}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _python_unstub(appid, install_path: str, exe: str) -> Dict[str, Any]:
    """Caller has journaled the original and holds _LOCK. Replace only verified output."""
    try:
        python = _ensure_python_runtime()
        with tempfile.TemporaryDirectory(prefix=".slsdeck-steamless-", dir=install_path) as work:
            chown_to_user(work, recursive=False)
            output = os.path.join(work, "unpacked.exe")
            logger.log(f"SteamStub Python run: appid={appid} exe={exe!r} script={_python_script()!r} timeout=900s")
            proc = _python_command([python, _python_script(), exe, "--output", output], timeout=900)
            log = ((proc.stdout or "") + (proc.stderr or ""))[-4000:]
            clean = False
            if proc.returncode == 0 and not os.path.islink(output) and os.path.isfile(output):
                with open(output, "rb") as fh:
                    head = fh.read(65536)
                    pe_offset = struct.unpack_from("<I", head, 0x3c)[0] if len(head) >= 64 else 0
                    clean = (head[:2] == b"MZ" and pe_offset >= 64
                             and head[pe_offset:pe_offset + 4] == b"PE\0\0"
                             and not has_steamstub(output))
            logger.log(f"SteamStub Python result: appid={appid} exit={proc.returncode} cleanOutput={clean} outputTail={log!r}")
            if not clean:
                return {"success": False, "method": "python", "error": "Bundled Python Steamless did not produce a clean executable; original retained", "log": log}
            os.chmod(output, stat.S_IMODE(os.stat(exe).st_mode))
            chown_to_user(output, recursive=False)
            os.replace(output, exe)
            return {"success": True, "method": "python", "exe": exe,
                    "note": "Applied bundled Python Steamless. Restorable through Un-fix.", "log": log}
    except Exception as exc:
        logger.warn(f"SteamStub Python failure: appid={appid} {type(exc).__name__}: {exc}")
        return {"success": False, "method": "python", "error": str(exc)}


def unstub(appid, install_path: str, game_name: str = "") -> Dict[str, Any]:
    logger.log(f"SteamStub apply start: appid={appid} install={install_path!r}")
    result = _unstub_impl(appid, install_path, game_name)
    logger.log(f"SteamStub apply result: appid={appid} success={result.get('success')} method={result.get('method', 'unspecified')} error={result.get('error', '')!r}")
    for key in ('nativeLog', 'log'):
        if result.get(key):
            logger.log(f"SteamStub appid={appid} {key} tail: {str(result[key])[-4000:]!r}")
    return result


def _unstub_impl(appid, install_path: str, game_name: str = "") -> Dict[str, Any]:
    """Prefer Moon's helper; record originals before either engine can modify files."""
    if not _LOCK.acquire(blocking=False):
        return {"success": False, "error": "SteamStub processing is already running"}
    try:
        from .fixes import _get_unfix_state
        if _get_unfix_state(int(appid)).get("status") in {"queued", "removing"}:
            return {"success": False, "error": "Wait for restore to finish"}
        result = _fixes.find_main_exe(install_path)
        exe = result.get("exe") if result.get("success") else ""
        if not exe or not _fixes._is_safe_path(install_path, os.path.relpath(exe, install_path)):
            return {"success": False, "error": "No safe game executable found"}
        logger.log(f"SteamStub selected executable: appid={appid} exe={exe!r} detected={has_steamstub(exe)}")
        if not has_steamstub(exe):
            return {"success": False, "notStub": True, "error": "No SteamStub detected"}
        for suffix in (".original.exe", ".unpacked.exe", ".steamless_done"):
            if os.path.lexists(exe + suffix):
                return {"success": False, "error": "Existing native Steamless artifacts found; restore or verify the game before applying this fix"}
        rel = os.path.relpath(exe, install_path).replace("\\", "/")
        if not _fixes._stash_original(install_path, rel):
            return {"success": False, "error": "Cannot preserve executable; no changes made"}
        # Journal BEFORE processing so an interrupted or failed run remains restorable.
        _fixes._write_fix_log(install_path, int(appid), game_name, "SteamStub removal",
                              "steamstub-managed", [rel], [rel])
        record = _fixes._fix_log_path(install_path, int(appid))
        with open(record, encoding="utf-8") as fh:
            if "steamstub-managed" not in fh.read():
                return {"success": False, "error": "Cannot record recoverable fix; no processing started"}
        chown_to_user(record, recursive=False)
        if not ensure_native():
            logger.warn(f"SteamStub fallback: appid={appid} native helper unavailable")
            return _python_unstub(appid, install_path, exe)
        try:
            script, kit = native_paths()
            env = slssteam._rich_env()
            helper_env = {"STEAMLESS_HOME": kit, **_selected_runtime_env(int(appid))}
            # sudo resets the caller environment. Set overrides AFTER changing user.
            command = slssteam._wrap_as_user(["env"] + [f"{key}={value}" for key, value in helper_env.items()]
                                             + ["bash", script, exe])
            logger.log(f"SteamStub native run: appid={appid} script={script!r} exe={exe!r} timeout=900s")
            proc = subprocess.run(command,
                                  env=env, capture_output=True, text=True, timeout=900)
            output = ((proc.stdout or "") + (proc.stderr or ""))[-2000:]
            logger.log(f"SteamStub native result: appid={appid} exit={proc.returncode} stubRemaining={has_steamstub(exe)} outputTail={output!r}")
            exit_code = proc.returncode
        except subprocess.TimeoutExpired:
            logger.warn(f"SteamStub native timeout: appid={appid}; fallback skipped while helper termination is uncertain")
            return {"success": False, "error": "Native SteamStub helper timed out; fallback skipped. Restore before retrying."}
        except Exception as exc:
            exit_code = -1
            output = f"Native helper could not run: {type(exc).__name__}: {exc}"
            logger.warn(f"SteamStub native failure: appid={appid} {output}")
        if exit_code not in (0, 2) or has_steamstub(exe):
            # Fall back only if native processing left the input byte-for-byte intact.
            import filecmp
            if filecmp.cmp(exe, exe + _fixes.ORIG_SUFFIX, shallow=False):
                logger.warn(f"SteamStub fallback: appid={appid} native processing unsuccessful; executable unchanged")
                fallback = _python_unstub(appid, install_path, exe)
                fallback["nativeLog"] = output
                return fallback
            return {"success": False, "error": "Native helper failed; restore before retrying", "log": output}
        # The explicit fix is owned by SLSDeck. Avoid Moon's default-mode restore
        # consuming its duplicate backup on the next launch; our journal owns recovery.
        for suffix in (".original.exe", ".steamless_done"):
            artifact = exe + suffix
            if os.path.isfile(artifact) and not os.path.islink(artifact):
                os.remove(artifact)
        return {"success": True, "method": "native", "exe": exe,
                "note": "Applied Moon SteamStub helper. Restorable through Un-fix.", "log": output}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    finally:
        _LOCK.release()


def native_backups(install_path: str):
    """Match Moon's bounded native backup layout; never follow directory symlinks."""
    found = []
    for root, dirs, files in os.walk(install_path, followlinks=False):
        depth = len(os.path.relpath(root, install_path).split(os.sep)) if root != install_path else 0
        dirs[:] = [] if depth >= 4 else [d for d in dirs if not os.path.islink(os.path.join(root, d))]
        for name in files:
            if name.endswith('.original.exe'):
                backup = os.path.join(root, name)
                live = backup[:-len('.original.exe')]
                if os.path.islink(backup) or not _fixes._is_safe_path(install_path, os.path.relpath(live, install_path)):
                    raise RuntimeError('Unsafe native SteamStub backup path')
                found.append((live, backup))
    return found


def restore_native_files(install_path: str):
    """Caller holds _LOCK. Validate every backup before replacing any executable."""
    pairs = native_backups(install_path)
    for live, backup in pairs:
        with open(backup, 'rb') as fh:
            if fh.read(2) != b'MZ':
                raise RuntimeError('Invalid native SteamStub backup; original and recovery files retained')
    restored = 0
    for live, backup in pairs:
        os.replace(backup, live)
        chown_to_user(live, recursive=False)
        for suffix in ('.steamless_done', '.unpacked.exe'):
            path = live + suffix
            if os.path.isfile(path) and not os.path.islink(path):
                os.remove(path)
        restored += 1
    return restored


def restore_native(appid, install_path: str):
    if not _LOCK.acquire(blocking=False):
        return {'success': False, 'error': 'SteamStub processing or restore is already running'}
    try:
        if _fixes._get_unfix_state(int(appid)).get('status') in {'queued', 'removing'}:
            return {'success': False, 'error': 'Wait for Un-fix to finish'}
        logger.log(f"SteamStub native restore start: appid={appid} install={install_path!r}")
        count = restore_native_files(install_path)
        logger.log(f"SteamStub native restore result: appid={appid} restored={count}")
        return {'success': True, 'restored': count,
                'note': f'Native SteamStub disabled; restored {count} executable(s).'}
    except Exception as exc:
        logger.warn(f"SteamStub native restore failed: appid={appid} {type(exc).__name__}: {exc}")
        return {'success': False, 'error': str(exc)}
    finally:
        _LOCK.release()
