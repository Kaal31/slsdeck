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
from typing import Any, Dict

from .paths import get_user_home

RUNTIME_ZIP = "https://github.com/Tesla697/TokeerDRM-App/releases/latest/download/tokeer-linux.zip"
INSTALL_SCRIPT = "https://raw.githubusercontent.com/Tesla697/TokeerDRM-App/main/install_linux.sh"
DEFAULT_COOLDOWN_HOURS = 48


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


def _download(url: str, dest: str) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "SLSDeck-Tokeer/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)


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
