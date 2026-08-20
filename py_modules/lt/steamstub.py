"""SteamStub DRM removal (Steamless AIO integration).

Steam wraps many game .exes in SteamStub DRM — a ``.bind`` PE section that
decrypts the real code at launch and does an ownership check. SLSsteam doesn't
strip it, so some SteamStub titles fail to launch under an added game or fight
achievement / mod tools.

We run niwia/ASSella's ``steamless-aio.sh`` — a self-contained wrapper around a
pure-Python Steamless (pycryptodome + capstone, NO .NET). The script manages its
own venv + pip deps; we just fetch it once, find the game's main exe, and run it.
Steamless backs the original up to ``<exe>.original``; we also stash a
``.slsdeck-orig`` so Un-fix restores it like any other fix.
"""
from __future__ import annotations

import os
import subprocess
from typing import Any, Dict

from .logger import logger
from .paths import get_user_home
from .httpc import ensure_http_client
from .utils import chown_to_user
from . import slssteam
from . import fixes as _fixes

_AIO_URL = "https://raw.githubusercontent.com/niwia/ASSella/main/steamless-aio.sh"
_UA = "SLSDeck/steamstub"


def _dir() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "SLSDeck", "steamless")
    os.makedirs(d, exist_ok=True)
    return d


def _script() -> str:
    return os.path.join(_dir(), "steamless-aio.sh")


def ensure_script(force: bool = False) -> Dict[str, Any]:
    p = _script()
    if not force and os.path.isfile(p) and os.path.getsize(p) > 2000:
        return {"success": True, "path": p, "cached": True}
    try:
        client = ensure_http_client("steamstub: aio")
        r = client.get(_AIO_URL, headers={"User-Agent": _UA}, follow_redirects=True, timeout=60)
        if r.status_code != 200 or not r.content:
            return {"success": False, "error": f"download HTTP {r.status_code}"}
        with open(p, "wb") as fh:
            fh.write(r.content)
        try:
            chown_to_user(_dir(), recursive=True)
        except Exception:
            pass
        return {"success": True, "path": p, "cached": False}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def has_steamstub(exe_path: str) -> bool:
    """Cheap gate: an MZ/PE whose header region carries a '.bind' section (the
    SteamStub wrapper). The real Steamless run confirms/handles the variant."""
    try:
        with open(exe_path, "rb") as fh:
            head = fh.read(65536)
        return head[:2] == b"MZ" and b".bind" in head
    except Exception:
        return False


def status(install_path: str) -> Dict[str, Any]:
    try:
        r = _fixes.find_main_exe(install_path)
        exe = r.get("exe") if r.get("success") else ""
        if not exe or not os.path.isfile(exe):
            return {"success": True, "supported": False}
        stub = has_steamstub(exe)
        done = os.path.isfile(exe + ".original")
        return {"success": True, "supported": bool(stub or done),
                "hasStub": bool(stub), "installed": bool(done), "exe": exe}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def unstub(appid, install_path: str, game_name: str = "") -> Dict[str, Any]:
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    r = _fixes.find_main_exe(install_path)
    if not r.get("success") or not r.get("exe"):
        return {"success": False, "error": "couldn't find the game's main executable"}
    exe = r["exe"]
    if not has_steamstub(exe) and not os.path.isfile(exe + ".original"):
        return {"success": False, "notStub": True,
                "error": "this exe has no SteamStub (.bind) — nothing to remove"}
    ens = ensure_script()
    if not ens.get("success"):
        return {"success": False, "error": ens.get("error", "couldn't fetch Steamless")}

    rel = os.path.relpath(exe, install_path).replace("\\", "/")
    try:
        _fixes._stash_original(install_path, rel)   # .slsdeck-orig for Un-fix
    except Exception:
        pass

    env = slssteam._rich_env()
    cmd = slssteam._wrap_as_user(["bash", _script(), exe])
    try:
        proc = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=900)
    except Exception as exc:
        return {"success": False, "error": f"Steamless run failed: {exc}"}
    out = ((proc.stdout or "") + (proc.stderr or ""))[-1000:]

    if proc.returncode == 0 and not has_steamstub(exe):
        try:
            chown_to_user(exe, recursive=False)
            _fixes._write_fix_log(install_path, int(appid), game_name,
                                  "SteamStub removed", "steamless", [], [rel])
            chown_to_user(_fixes._fix_log_path(install_path, int(appid)), recursive=False)
        except Exception:
            pass
        return {"success": True, "exe": exe,
                "note": "SteamStub removed. Original kept (restorable via Un-fix). Restart Steam.",
                "log": out}
    return {"success": False,
            "error": "Steamless didn't remove the stub — it may be an unsupported variant (see log).",
            "log": out}
