"""SmokeAPI DLC-ownership emulator integration.

SmokeAPI (acidicoala) is a ``steam_api(64).dll`` proxy that makes a legitimately
owned game think it owns all of its DLC — it hooks the game's own Steamworks DLC
checks (SLSsteam only unlocks DLC at the Steam-client level). Proxy-mode install:

    steam_api64.dll  ->  steam_api64_o.dll   (original, proxied to)
    smoke_api64.dll  ->  steam_api64.dll     (SmokeAPI, loaded by the game)

We fetch the latest release from GitHub, install/remove per game (reversible via
un-fix), and skip Ubisoft/EA/Rockstar launcher games (their DRM breaks it).
"""

from __future__ import annotations

import io
import os
import shutil
import zipfile
from typing import Any, Dict, List, Optional, Tuple

from .logger import logger
from .paths import runtime_path
from .httpc import ensure_http_client
from .utils import chown_to_user

RELEASE_API = "https://api.github.com/repos/acidicoala/SmokeAPI/releases/latest"
_UA = "SLSDeck/smokeapi"
# steam_api dll basenames we proxy, by bitness.
_STEAM_API = {"steam_api64.dll": True, "steam_api.dll": False}
_OVERRIDES = 'WINEDLLOVERRIDES="steam_api64=n,b;steam_api=n,b"'
_SMOKE_SIGNS = (b"SmokeAPI", b"KoalaBox", b"acidicoala")


def _cache_dir() -> str:
    d = runtime_path("smokeapi")
    os.makedirs(d, exist_ok=True)
    return d


def _cached(name: str) -> str:
    return os.path.join(_cache_dir(), name)


def _is_smokeapi_dll(path: str) -> bool:
    try:
        with open(path, "rb") as fh:
            head = fh.read(400_000)
        return any(sig in head for sig in _SMOKE_SIGNS)
    except Exception:
        return False


def ensure_dlls(force: bool = False) -> Dict[str, Any]:
    """Download the latest SmokeAPI release and cache smoke_api64/32.dll."""
    dll64, dll32 = _cached("smoke_api64.dll"), _cached("smoke_api32.dll")
    if not force and os.path.isfile(dll64):
        return {"success": True, "cached": True, "dll64": dll64,
                "dll32": dll32 if os.path.isfile(dll32) else ""}
    client = ensure_http_client("smokeapi: release")
    try:
        r = client.get(RELEASE_API, headers={"User-Agent": _UA,
                       "Accept": "application/vnd.github+json"}, timeout=20, follow_redirects=True)
        if r.status_code != 200:
            return {"success": False, "error": f"release lookup HTTP {r.status_code}"}
        rel = r.json()
    except Exception as exc:
        return {"success": False, "error": f"release lookup failed: {exc}"}
    tag = str(rel.get("tag_name") or "")
    assets = rel.get("assets") or []
    zip_url = ""
    for a in assets:
        n = str(a.get("name") or "").lower()
        if n.endswith(".zip") and "src" not in n:
            zip_url = a.get("browser_download_url") or ""
            break
    if not zip_url:
        return {"success": False, "error": "no .zip asset in the latest release"}
    try:
        z = client.get(zip_url, headers={"User-Agent": _UA}, timeout=120, follow_redirects=True)
        if z.status_code != 200:
            return {"success": False, "error": f"download HTTP {z.status_code}"}
        got64 = got32 = False
        with zipfile.ZipFile(io.BytesIO(z.content)) as arc:
            for member in arc.namelist():
                base = member.rsplit("/", 1)[-1].lower()
                if base == "smoke_api64.dll":
                    with arc.open(member) as src, open(dll64, "wb") as out:
                        shutil.copyfileobj(src, out)
                    got64 = True
                elif base == "smoke_api32.dll":
                    with arc.open(member) as src, open(dll32, "wb") as out:
                        shutil.copyfileobj(src, out)
                    got32 = True
        if not got64:
            return {"success": False, "error": "smoke_api64.dll not found in release archive"}
        with open(_cached("version.txt"), "w", encoding="utf-8") as fh:
            fh.write(tag)
        logger.log(f"SmokeAPI: cached {tag}")
        return {"success": True, "cached": False, "tag": tag, "dll64": dll64,
                "dll32": dll32 if got32 else ""}
    except Exception as exc:
        return {"success": False, "error": f"extract failed: {exc}"}


def _find_steam_api(install_path: str) -> List[Tuple[str, bool]]:
    """Locate the game's real steam_api dll(s) (not already SmokeAPI, not _o)."""
    out: List[Tuple[str, bool]] = []
    try:
        for root, _dirs, files in os.walk(install_path):
            low = {f.lower(): f for f in files}
            for base, is64 in _STEAM_API.items():
                if base in low:
                    full = os.path.join(root, low[base])
                    o_sibling = os.path.join(root, base.replace(".dll", "_o.dll"))
                    # Skip if already converted (SmokeAPI in place + _o present).
                    if os.path.exists(o_sibling) and _is_smokeapi_dll(full):
                        continue
                    if _is_smokeapi_dll(full):
                        continue
                    out.append((full, is64))
    except Exception as exc:
        logger.warn(f"SmokeAPI: scan failed: {exc}")
    return out


def status(install_path: str) -> Dict[str, Any]:
    """Is SmokeAPI installed (a steam_api*_o.dll with a SmokeAPI sibling)?"""
    installed = False
    can = False
    try:
        for root, _dirs, files in os.walk(install_path):
            low = {f.lower() for f in files}
            for base in _STEAM_API:
                if base in low:
                    can = True
                    o_name = base.replace(".dll", "_o.dll")
                    if o_name in low and _is_smokeapi_dll(os.path.join(root, base)):
                        installed = True
    except Exception:
        pass
    return {"success": True, "installed": installed, "supported": can}


def install(install_path: str) -> Dict[str, Any]:
    """Proxy-mode install SmokeAPI beside each steam_api dll in the game."""
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "install path not found"}
    # Skip publisher-launcher games (Ubisoft/EA/Rockstar): SmokeAPI can't help.
    try:
        from . import fixes
        if fixes._is_launcher_publisher_game(install_path):
            return {"success": False, "skippedLauncher": True,
                    "error": "Ubisoft/EA/Rockstar game — SmokeAPI won't work (3rd-party DRM)"}
    except Exception:
        pass
    ens = ensure_dlls()
    if not ens.get("success"):
        return {"success": False, "error": ens.get("error", "could not fetch SmokeAPI")}
    dll64, dll32 = ens.get("dll64"), ens.get("dll32")
    targets = _find_steam_api(install_path)
    if not targets:
        return {"success": False, "error": "no steam_api(64).dll in this game — not supported"}
    done: List[str] = []
    for full, is64 in targets:
        smoke = dll64 if is64 else dll32
        if not smoke or not os.path.isfile(smoke):
            continue  # no 32-bit build shipped, skip 32-bit target
        o_path = full.replace(".dll", "_o.dll")
        try:
            if not os.path.exists(o_path):
                shutil.move(full, o_path)          # original -> _o (proxied to)
            shutil.copy2(smoke, full)              # SmokeAPI -> steam_api(64).dll
            chown_to_user(full, recursive=False)
            chown_to_user(o_path, recursive=False)
            done.append(full)
        except Exception as exc:
            logger.warn(f"SmokeAPI: install failed for {full}: {exc}")
    if not done:
        return {"success": False, "error": "could not install (no matching bitness build?)"}
    logger.log(f"SmokeAPI: installed for {len(done)} steam_api dll(s) in {install_path}")
    return {"success": True, "installed": done, "overrides": _OVERRIDES,
            "tag": ens.get("tag", "")}


def remove(install_path: str) -> Dict[str, Any]:
    """Restore the original steam_api dll(s) and delete the SmokeAPI copies."""
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "install path not found"}
    restored = 0
    try:
        for root, _dirs, files in os.walk(install_path):
            for f in list(files):
                if not f.lower().endswith("_o.dll"):
                    continue
                base_lower = f.lower().replace("_o.dll", ".dll")
                if base_lower not in _STEAM_API:
                    continue
                o_path = os.path.join(root, f)
                base_path = os.path.join(root, f[:-len("_o.dll")] + ".dll")
                try:
                    if os.path.exists(base_path) and _is_smokeapi_dll(base_path):
                        os.remove(base_path)
                    if os.path.exists(o_path):
                        shutil.move(o_path, base_path)
                        chown_to_user(base_path, recursive=False)
                        restored += 1
                except Exception as exc:
                    logger.warn(f"SmokeAPI: restore failed for {o_path}: {exc}")
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    return {"success": True, "restored": restored}
