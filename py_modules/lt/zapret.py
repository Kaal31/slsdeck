"""SLSDeck-owned Zapret dependency and selective DPI-bypass lifecycle.

Upstream files are downloaded unchanged from bol-van/zapret.  SLSDeck keeps
its SteaMidra-derived hostlist beside that tree and owns only queue 210, its
PID file, and firewall rules carrying the ``SLSDeck-zapret`` comment.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import signal
import subprocess
import tarfile
import tempfile
import time
from typing import Any, Dict

from .httpc import ensure_http_client
from .paths import get_user_home


RELEASE_API = "https://api.github.com/repos/bol-van/zapret/releases/latest"
ASSET_NAME = "zapret release bundle"
QUEUE = "210"
RULE_COMMENT = "SLSDeck-zapret"
PID_FILE = "/run/slsdeck-zapret.pid"


def _root() -> str:
    return os.path.join(get_user_home(), ".local", "share", "slsdeck", "dependencies", "zapret")


def _upstream() -> str:
    return os.path.join(_root(), "upstream")


def _overlay() -> str:
    return os.path.join(_root(), "slsdeck")


def _hostlist() -> str:
    return os.path.join(_overlay(), "list-general.txt")


def _bundled_hostlist() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "zapret", "list-general.txt"))


def _state_path() -> str:
    return os.path.join(_root(), "install-state.json")


def _sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def _read_state() -> Dict[str, Any]:
    try:
        with open(_state_path(), "r", encoding="utf-8") as handle:
            value = json.load(handle)
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def _write_state(values: Dict[str, Any]) -> None:
    os.makedirs(_root(), exist_ok=True)
    state = {**_read_state(), **values}
    temporary = _state_path() + ".new"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)
        handle.write("\n")
    os.replace(temporary, _state_path())


def _nfqws() -> str:
    candidates = (
        os.path.join(_upstream(), "binaries", "linux-x86_64", "nfqws"),
        os.path.join(_upstream(), "nfqws"),
    )
    return next((path for path in candidates if os.path.isfile(path)), candidates[0])


def _fake_tls() -> str:
    return os.path.join(_upstream(), "files", "fake", "tls_clienthello_4pda_to.bin")


def _pid() -> int:
    try:
        with open(PID_FILE, "r", encoding="ascii") as handle:
            pid = int(handle.read().strip())
        cmdline = open(f"/proc/{pid}/cmdline", "rb").read().decode("utf-8", "ignore")
        return pid if os.path.realpath(_nfqws()) in cmdline else 0
    except Exception:
        return 0


def _copy_hostlist() -> None:
    os.makedirs(_overlay(), exist_ok=True)
    temporary = _hostlist() + ".new"
    shutil.copyfile(_bundled_hostlist(), temporary)
    os.replace(temporary, _hostlist())


def _release() -> Dict[str, Any]:
    client = ensure_http_client("zapret: release")
    response = client.get(RELEASE_API, headers={"Accept": "application/vnd.github+json",
                                                "User-Agent": "SLSDeck-Zapret/1.0"},
                          follow_redirects=True, timeout=60)
    response.raise_for_status()
    release = response.json()
    tag = str(release.get("tag_name") or "")
    wanted = f"zapret-{tag}.tar.gz"
    asset = next((item for item in release.get("assets") or []
                  if str(item.get("name") or "") == wanted), None)
    if not asset:
        raise RuntimeError(f"The latest Zapret release has no {wanted} asset.")
    return {"version": tag,
            "url": str(asset.get("browser_download_url") or ""),
            "size": int(asset.get("size") or 0), "asset": wanted}


def _safe_extract(archive: tarfile.TarFile, destination: str) -> None:
    base = os.path.realpath(destination)
    for member in archive.getmembers():
        target = os.path.realpath(os.path.join(base, member.name))
        if not (target == base or target.startswith(base + os.sep)):
            raise RuntimeError("Unsafe path in the Zapret dependency archive.")
        if member.issym() or member.islnk():
            raise RuntimeError("Links are not accepted in the Zapret dependency archive.")
    archive.extractall(destination)


def status() -> Dict[str, Any]:
    state = _read_state()
    installed = os.path.isfile(_nfqws()) and os.path.isfile(_fake_tls()) and os.path.isfile(_hostlist())
    host_sha = _sha256(_hostlist()) if os.path.isfile(_hostlist()) else ""
    bundled_sha = _sha256(_bundled_hostlist())
    return {"success": True, "installed": installed, "enabled": bool(_pid()),
            "enableOnBoot": bool(state.get("enableOnBoot", False)),
            "version": str(state.get("version") or ""), "path": _root(),
            "asset": str(state.get("asset") or ""),
            "hostEntries": sum(1 for line in open(_hostlist(), encoding="utf-8") if line.strip())
            if os.path.isfile(_hostlist()) else 0,
            "hostlistCurrent": host_sha == bundled_sha,
            "hostlistSha256": host_sha or bundled_sha}


def ensure_installed(force: bool = False) -> Dict[str, Any]:
    release = _release()
    current = status()
    if not force and current["installed"] and current.get("version") == release["version"] \
            and current.get("hostlistCurrent"):
        return {**current, "updated": False, "skipped": True, "latest": release["version"]}
    was_enabled = bool(current.get("enabled"))
    if was_enabled:
        disable(False)
    staged = ""
    try:
        os.makedirs(os.path.dirname(_root()), exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="slsdeck-zapret-") as temporary:
            archive_path = os.path.join(temporary, str(release["asset"]))
            client = ensure_http_client("zapret: asset")
            with client.stream("GET", release["url"], follow_redirects=True, timeout=None) as response:
                response.raise_for_status()
                expected = int(response.headers.get("content-length") or 0)
                with open(archive_path, "wb") as output:
                    for chunk in response.iter_bytes(1 << 20):
                        if chunk:
                            output.write(chunk)
                actual = os.path.getsize(archive_path)
                if expected and actual != expected:
                    raise RuntimeError(f"Incomplete Zapret download ({actual}/{expected} bytes).")
                if release["size"] and actual != release["size"]:
                    raise RuntimeError(f"Zapret asset size mismatch ({actual}/{release['size']} bytes).")
            expanded = os.path.join(temporary, "expanded")
            os.makedirs(expanded)
            with tarfile.open(archive_path, "r:gz") as archive:
                _safe_extract(archive, expanded)
            roots = [os.path.join(expanded, name) for name in os.listdir(expanded)]
            source = next((path for path in roots
                           if os.path.isdir(path)
                           and os.path.isfile(os.path.join(path, "binaries", "linux-x86_64", "nfqws"))), "")
            if not source:
                raise RuntimeError("The Zapret Linux archive does not contain nfqws.")
            staged = tempfile.mkdtemp(prefix=".zapret-", dir=os.path.dirname(_root()))
            shutil.copytree(source, os.path.join(staged, "upstream"), dirs_exist_ok=True)
            os.makedirs(os.path.join(staged, "slsdeck"), exist_ok=True)
            shutil.copyfile(_bundled_hostlist(), os.path.join(staged, "slsdeck", "list-general.txt"))
            with open(os.path.join(staged, "install-state.json"), "w", encoding="utf-8") as handle:
                json.dump({**release, "downloadSha256": _sha256(archive_path),
                           "installedAt": int(time.time()),
                           "enableOnBoot": bool(was_enabled or current.get("enableOnBoot"))},
                          handle, indent=2)
                handle.write("\n")
            old = _root() + ".old"
            if os.path.isdir(old):
                shutil.rmtree(old)
            if os.path.isdir(_root()):
                os.replace(_root(), old)
            os.replace(staged, _root())
            staged = ""
            shutil.rmtree(old, ignore_errors=True)
            os.chmod(_nfqws(), 0o755)
        result = {**status(), "updated": True, "latest": release["version"]}
        try:
            from . import settings
            settings.set_dep_version("zapret", release["version"])
        except Exception:
            pass
        if was_enabled:
            enabled = enable()
            if not enabled.get("success"):
                return {**result, "success": False, "error": enabled.get("error")}
        return result
    except Exception as exc:
        if staged:
            shutil.rmtree(staged, ignore_errors=True)
        return {**status(), "success": False, "error": str(exc)}


def _rule_args(binary: str, delete: bool = False) -> list[str]:
    action = "-D" if delete else "-I"
    return [binary, "-t", "mangle", action, "OUTPUT", "1", "-p", "tcp", "-m", "multiport",
            "--dports", "80,443", "-m", "connbytes", "--connbytes", "1:12",
            "--connbytes-dir", "original", "--connbytes-mode", "packets", "-m", "comment",
            "--comment", RULE_COMMENT, "-j", "NFQUEUE", "--queue-num", QUEUE, "--queue-bypass"]


def _remove_rules() -> list[str]:
    errors = []
    for binary in ("iptables", "ip6tables"):
        if not shutil.which(binary):
            continue
        while True:
            result = subprocess.run(_rule_args(binary, True), stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True)
            if result.returncode:
                break
        # deletion failing means the rule simply was not present
    return errors


def enable() -> Dict[str, Any]:
    current = status()
    if not current["installed"]:
        return {**current, "success": False, "error": "Install the Zapret dependency first."}
    if os.geteuid() != 0:
        return {"success": False, "error": "Decky's backend must run as root to activate NFQUEUE."}
    if current["enabled"]:
        _write_state({"enableOnBoot": True})
        return current
    if not shutil.which("iptables"):
        return {"success": False, "error": "SteamOS iptables is unavailable."}
    _copy_hostlist()
    _remove_rules()
    command = [_nfqws(), "--qnum=" + QUEUE, "--user=daemon", "--dpi-desync-fwmark=0x40000000",
               "--filter-tcp=80,443", "--hostlist=" + _hostlist(),
               "--dpi-desync=multisplit", "--dpi-desync-split-seqovl=568",
               "--dpi-desync-split-pos=1", "--dpi-desync-split-seqovl-pattern=" + _fake_tls()]
    try:
        process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL, start_new_session=True)
        time.sleep(0.25)
        if process.poll() is not None:
            raise RuntimeError(f"nfqws exited immediately with code {process.returncode}.")
        with open(PID_FILE, "w", encoding="ascii") as handle:
            handle.write(str(process.pid) + "\n")
        for binary in ("iptables", "ip6tables"):
            if shutil.which(binary):
                result = subprocess.run(_rule_args(binary), stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT, text=True)
                if result.returncode:
                    raise RuntimeError(f"{binary}: {result.stdout.strip()}")
        _write_state({"enableOnBoot": True})
        return status()
    except Exception as exc:
        disable()
        return {**status(), "success": False, "error": str(exc)}


def disable(persist: bool = True) -> Dict[str, Any]:
    _remove_rules()
    pid = _pid()
    if pid:
        try:
            os.kill(pid, signal.SIGTERM)
            for _ in range(20):
                if not os.path.exists(f"/proc/{pid}"):
                    break
                time.sleep(0.05)
        except (OSError, ProcessLookupError):
            pass
    try:
        os.remove(PID_FILE)
    except OSError:
        pass
    if persist and os.path.isdir(_root()):
        _write_state({"enableOnBoot": False})
    return status()


def resume_if_enabled() -> Dict[str, Any]:
    """Restore an explicitly enabled bypass after a cold boot/backend restart."""
    state = _read_state()
    if not state.get("enableOnBoot") or not status().get("installed"):
        return status()
    return enable()


def uninstall() -> Dict[str, Any]:
    stopped = disable(False)
    removed, errors = [], []
    for path in (_root(), _root() + ".old"):
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
                removed.append(path)
        except Exception as exc:
            errors.append(f"{path}: {exc}")
    try:
        from . import settings
        settings.set_dep_version("zapret", "")
    except Exception:
        pass
    return {"success": not errors, "enabled": False, "installed": False,
            "removed": removed, "errors": errors, "stopped": stopped.get("success", False)}
