"""Anti-Denuvo hypervisor helper — GitHub-fetched CPUID-faulting kernel module.

This ports the *automatic* (prebuilt, GitHub-download) path of HV-Decky and
nothing else: no local compiler, no container build. It downloads the prebuilt
``cpuid_fault_emulation-<kernel>.ko`` that matches the running SteamOS kernel
from the upstream GitHub release, then loads/unloads it.

Requires the plugin to run as root (Decky ``root`` flag) because loading a
kernel module needs ``insmod``/``rmmod`` and unloading KVM first.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import threading
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import runtime_path
from . import settings

MODULE_NAME = "cpuid_fault_emulation"
MODULE_FILE = "cpuid_fault_emulation.ko"

# Upstream prebuilt-module releases (same as HV-Decky). Primary + fallback.
RELEASE_API_URLS = [
    "https://api.github.com/repos/PareidoliaDev/glowing-tribble/releases/latest",
    "https://api.github.com/repos/2804u13j200-spec/glowing-tribble/releases/latest",
]


def kernel_release() -> str:
    return os.uname().release


_avail_cache: Dict[str, bool] = {}


def check_available() -> bool:
    """Is a prebuilt module for the running kernel present in the GitHub release?
    Cached per kernel for the session (one network probe, then reused)."""
    kernel = kernel_release()
    if kernel in _avail_cache:
        return _avail_cache[kernel]
    curl = shutil.which("curl")
    if not curl:
        return False
    expected = f"cpuid_fault_emulation-{kernel}.ko"
    found = False
    for api in RELEASE_API_URLS:
        code, body = _run([curl, "-fsSL", "--max-time", "20", api], timeout=30)
        if code != 0 or not body:
            continue
        try:
            assets = (json.loads(body).get("assets") or [])
        except Exception:
            continue
        if any(isinstance(a, dict) and a.get("name") == expected for a in assets):
            found = True
            break
    _avail_cache[kernel] = found
    return found


def _module_dir() -> str:
    d = runtime_path("hypervisor")
    os.makedirs(d, exist_ok=True)
    return d


def _module_path() -> str:
    return os.path.join(_module_dir(), MODULE_FILE)


def _is_root() -> bool:
    try:
        return os.geteuid() == 0
    except Exception:
        return False


def _clean_env() -> dict:
    """Steam's LD_LIBRARY_PATH breaks the system curl (it loads a cut-down
    libcurl without HTTPS); strip the loader vars and use a sane PATH."""
    env = dict(os.environ)
    for k in ("LD_LIBRARY_PATH", "LD_PRELOAD", "LD_AUDIT"):
        env.pop(k, None)
    env["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/sbin:/sbin:/bin"
    return env


def _run(cmd: List[str], timeout: int = 60) -> tuple[int, str]:
    try:
        p = subprocess.run(cmd, capture_output=True, timeout=timeout, env=_clean_env())
        out = (p.stdout.decode("utf-8", "replace") + p.stderr.decode("utf-8", "replace")).strip()
        return p.returncode, out
    except Exception as exc:
        return 1, f"{type(exc).__name__}: {exc}"


def _loaded_modules() -> set:
    try:
        return {
            line.split()[0]
            for line in open("/proc/modules", encoding="utf-8").read().splitlines()
            if line.strip()
        }
    except Exception:
        return set()


def is_loaded() -> bool:
    return MODULE_NAME in _loaded_modules()


def _downloaded_kernel_ok() -> bool:
    """True if a .ko is present and built for the running kernel (vermagic)."""
    path = _module_path()
    if not os.path.isfile(path):
        return False
    modinfo = shutil.which("modinfo")
    if not modinfo:
        return True  # can't check; assume ok
    code, vermagic = _run([modinfo, "-F", "vermagic", path], timeout=20)
    return code == 0 and kernel_release() in vermagic


def status() -> Dict[str, Any]:
    path = _module_path()
    return {
        "success": True,
        "kernel": kernel_release(),
        "root": _is_root(),
        "downloaded": os.path.isfile(path),
        "kernelMatch": _downloaded_kernel_ok(),
        "available": os.path.isfile(path) or check_available(),
        "loaded": is_loaded(),
        "insmod": bool(shutil.which("insmod")),
        "rmmod": bool(shutil.which("rmmod")),
        "umipDisabled": umip_status().get("disabled", False),
    }


def download_module() -> Dict[str, Any]:
    """Fetch the prebuilt .ko matching the running kernel from the GitHub release."""
    curl = shutil.which("curl")
    if not curl:
        return {"success": False, "error": "curl not found"}

    kernel = kernel_release()
    expected = f"cpuid_fault_emulation-{kernel}.ko"
    last_err = ""
    for api in RELEASE_API_URLS:
        code, body = _run([curl, "-fsSL", "--max-time", "30", api], timeout=40)
        if code != 0 or not body:
            last_err = f"release query failed ({api}): {body[:160]}"
            continue
        try:
            release = json.loads(body)
            assets = release.get("assets", []) or []
        except Exception as exc:
            last_err = f"bad release JSON: {exc}"
            continue
        url = None
        for a in assets:
            if isinstance(a, dict) and a.get("name") == expected and isinstance(a.get("browser_download_url"), str):
                url = a["browser_download_url"]
                break
        if not url:
            names = [str(a.get("name")) for a in assets if isinstance(a, dict) and str(a.get("name", "")).endswith(".ko")]
            last_err = f"no prebuilt module '{expected}' in latest release. Available: {', '.join(names[:12]) or 'none'}"
            continue
        # This file becomes a kernel module loaded as root. The transport must be
        # HTTPS end to end -- github asset URLs are, but a tampered release JSON
        # could point elsewhere, so verify before fetching. --proto '=https' also
        # stops curl following a redirect down to plain http.
        if not str(url).lower().startswith("https://"):
            last_err = f"refusing non-HTTPS module URL: {url}"
            continue
        tmp = _module_path() + ".tmp"
        code, out = _run([curl, "-fsSL", "--proto", "=https", "--proto-redir", "=https",
                          "--max-time", "300", "-o", tmp, url], timeout=320)
        if code != 0 or not os.path.isfile(tmp) or os.path.getsize(tmp) == 0:
            last_err = f"download failed: {out[:160]}"
            try:
                os.remove(tmp)
            except Exception:
                pass
            continue
        os.replace(tmp, _module_path())
        settings.reset_dep_fail("hvmodule")
        logger.log(f"SLSDeckHV HV: downloaded {expected}")
        return {"success": True, "message": f"Downloaded module for kernel {kernel}."}
    return {"success": False, "error": last_err or "could not download module"}


def load_module() -> Dict[str, Any]:
    if not _is_root():
        return {"success": False, "error": "backend is not running as root"}
    path = _module_path()
    if not os.path.isfile(path):
        return {"success": False, "error": "module not downloaded"}
    if is_loaded():
        return {"success": True, "message": f"{MODULE_NAME} already loaded."}

    # Verifying vermagic is MANDATORY, never best-effort. Inserting a module built
    # against a different kernel is one of the very few things this plugin can do
    # that takes the whole machine down (oops/panic on load). This check used to
    # sit inside `if modinfo:`, so whenever modinfo was not on PATH it was skipped
    # entirely and the unchecked insmod went ahead anyway. If we cannot verify, we
    # do not load.
    modinfo = shutil.which("modinfo")
    if not modinfo:
        return {
            "success": False,
            "error": "cannot verify the module matches this kernel (modinfo is "
                     "missing), so it will not be loaded. Install kmod and retry.",
        }
    code, vermagic = _run([modinfo, "-F", "vermagic", path], timeout=20)
    if code != 0 or kernel_release() not in vermagic:
        return {
            "success": False,
            "error": f"module was not built for the running kernel {kernel_release()}; re-download after a SteamOS update.",
        }

    insmod = shutil.which("insmod")
    if not insmod:
        return {"success": False, "error": "insmod not found (kmod missing)"}

    # KVM has to actually be gone before this module goes in -- they contend for
    # the same CPU virtualisation state. `modprobe -r` fails (safely) when
    # something still holds KVM open: a VM, Waydroid, an emulator. The result was
    # previously ignored, so we would insmod on top of a live KVM. Verify instead.
    modprobe = shutil.which("modprobe")
    if modprobe:
        _run([modprobe, "-r", "kvm_amd"], timeout=30)
        _run([modprobe, "-r", "kvm"], timeout=30)
        try:
            with open("/proc/modules", "r", encoding="utf-8", errors="ignore") as fh:
                still = [ln.split()[0] for ln in fh
                         if ln.split() and ln.split()[0] in ("kvm", "kvm_amd", "kvm_intel")]
        except Exception:
            still = []
        if still:
            return {
                "success": False,
                "error": "KVM is still loaded (%s) — something is using it (a VM, "
                         "Waydroid, an emulator). Close it and try again; loading "
                         "on top of active KVM risks destabilising the system."
                         % ", ".join(still),
            }

    code, out = _run([insmod, path], timeout=60)
    if code != 0:
        return {"success": False, "error": f"insmod failed: {out[:200]}"}
    return {"success": True, "message": f"Loaded {MODULE_NAME}."}


def unload_module() -> Dict[str, Any]:
    if not _is_root():
        return {"success": False, "error": "backend is not running as root"}
    if not is_loaded():
        return {"success": True, "message": f"{MODULE_NAME} is not loaded."}

    rmmod = shutil.which("rmmod")
    if not rmmod:
        return {"success": False, "error": "rmmod not found (kmod missing)"}
    code, out = _run([rmmod, MODULE_NAME], timeout=30)
    if code != 0:
        return {"success": False, "error": f"rmmod failed (module may be in use): {out[:200]}"}

    modprobe = shutil.which("modprobe")
    if modprobe:
        _run([modprobe, "kvm"], timeout=30)
        _run([modprobe, "kvm_amd"], timeout=30)
    return {"success": True, "message": f"Unloaded {MODULE_NAME}; KVM restored."}


# ── per-game automatic activation ────────────────────────────────────────────
# A game marked as HV (settings.hvGames) auto-loads the module when it starts and
# unloads it when the last such game exits. The frontend reports start/stop via
# SteamClient game-lifetime notifications.
_lifecycle_lock = threading.Lock()
_running: set = set()          # appids currently running (reported by frontend)
_auto_loaded = False           # True if WE loaded the module for a running game
_startup_loaded = False        # True if loaded globally at startup (stays resident)


def get_game(appid: int) -> Dict[str, Any]:
    return {"success": True, "enabled": settings.get_hv_game(int(appid))}


def get_games() -> Dict[str, Any]:
    return {"success": True, "games": settings.get_hv_games()}


def set_game(appid: int, enabled: bool) -> Dict[str, Any]:
    settings.set_hv_game(int(appid), bool(enabled))
    _reconcile()
    return {"success": True, "enabled": bool(enabled)}


def _flagged_ids() -> set:
    return {int(k) for k, v in settings.get_hv_games().items() if v}


def _reconcile() -> None:
    """Load the module while any flagged game runs; unload when none do."""
    global _auto_loaded
    with _lifecycle_lock:
        should = bool(_running & _flagged_ids())
        if should and not is_loaded():
            if not (os.path.isfile(_module_path()) and _downloaded_kernel_ok()):
                # Don't re-download on every game launch once it has failed
                # repeatedly — a manual "Install module" clears this.
                if settings.dep_fail_capped("hvmodule"):
                    logger.warn("SLSDeckHV HV: auto-download disabled after repeated failures — use Install module")
                    return
                d = download_module()
                if not d.get("success"):
                    settings.inc_dep_fail("hvmodule")
                    logger.warn(f"SLSDeckHV HV: auto-download failed: {d.get('error')}")
                    return
            r = load_module()
            if r.get("success"):
                _auto_loaded = True
                logger.log("SLSDeckHV HV: auto-loaded for a running game")
            else:
                logger.warn(f"SLSDeckHV HV: auto-load failed: {r.get('error')}")
        elif not should and is_loaded() and _auto_loaded and not _startup_loaded:
            # Keep it resident if it was loaded globally at startup.
            r = unload_module()
            if r.get("success"):
                _auto_loaded = False
                logger.log("SLSDeckHV HV: auto-unloaded after game exit")


def game_lifetime(appid: int, running: bool) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    with _lifecycle_lock:
        if running:
            _running.add(appid)
        else:
            _running.discard(appid)
    _reconcile()
    return {"success": True}


# ── UMIP (must be OFF for the CPUID-faulting method; boot-level change) ───────
def umip_status() -> Dict[str, Any]:
    """UMIP is disabled when the CPU 'umip' flag is absent from /proc/cpuinfo."""
    try:
        with open("/proc/cpuinfo", "r", encoding="utf-8") as fh:
            has = any("umip" in line.lower().split(":", 1)[-1].split()
                      for line in fh if line.lower().startswith("flags"))
        return {"success": True, "disabled": not has}
    except Exception as exc:
        return {"success": False, "disabled": False, "error": str(exc)}


def disable_umip() -> Dict[str, Any]:
    """Add clearcpuid=514 to the kernel cmdline via GRUB and regenerate grub.cfg.
    Needs a reboot to take effect; SteamOS updates reset grub so it must be
    redone after updates. /etc is writable on SteamOS (no readonly toggle)."""
    if not _is_root():
        return {"success": False, "error": "backend is not running as root"}
    if umip_status().get("disabled"):
        return {"success": True, "message": "UMIP already disabled.", "rebootRequired": False}
    grub = "/etc/default/grub"
    if not os.path.isfile(grub):
        return {"success": False, "error": "/etc/default/grub not found"}
    try:
        content = open(grub, "r", encoding="utf-8").read()
    except Exception as exc:
        return {"success": False, "error": f"cannot read grub config: {exc}"}
    if "clearcpuid=514" not in content:
        new = re.sub(
            r'GRUB_CMDLINE_LINUX_DEFAULT="([^"]*)"',
            r'GRUB_CMDLINE_LINUX_DEFAULT="\1 clearcpuid=514"',
            content,
        )
        if new == content:
            return {"success": False, "error": "could not patch GRUB_CMDLINE_LINUX_DEFAULT"}
        try:
            open(grub, "w", encoding="utf-8").write(new)
        except Exception as exc:
            return {"success": False, "error": f"cannot write grub config: {exc}"}
    # Regenerate grub.cfg: update-grub (Debian) or grub-mkconfig (SteamOS/Arch).
    update = shutil.which("update-grub")
    if update:
        code, out = _run([update], timeout=120)
    else:
        mkconfig = shutil.which("grub-mkconfig")
        if not mkconfig:
            return {"success": False, "error": "no update-grub or grub-mkconfig found"}
        code, out = _run([mkconfig, "-o", "/boot/grub/grub.cfg"], timeout=120)
    if code != 0:
        return {"success": False, "error": f"grub regen failed: {out[:200]}"}
    return {"success": True, "message": "UMIP will be disabled after a reboot.", "rebootRequired": True}


# ── auto-set UMIP on load (write GRUB param only; a reboot applies it) ────────
# We never reboot on our own. The GRUB param is written once (idempotent); it
# takes effect on the next reboot — including the reboot the headcrab client fix
# triggers, and any manual reboot. A manual "Disable UMIP" button is also offered.
def reboot_system() -> Dict[str, Any]:
    if not _is_root():
        return {"success": False, "error": "not root"}
    sysctl = shutil.which("systemctl")
    if sysctl:
        code, out = _run([sysctl, "reboot"], timeout=30)
    else:
        rb = shutil.which("reboot") or "/sbin/reboot"
        code, out = _run([rb], timeout=30)
    return {"success": code == 0, "output": out}


def disable_umip_reboot() -> Dict[str, Any]:
    """Manual button: disable UMIP and trigger a one-time reboot to apply it."""
    r = disable_umip()
    if r.get("success") and r.get("rebootRequired"):
        logger.log("SLSDeckHV HV: UMIP disabled via button; rebooting.")
        time.sleep(3)
        reboot_system()
        r["rebooting"] = True
    return r


def auto_umip_on_load() -> None:
    try:
        if not settings.get_umip_auto():
            return
        if umip_status().get("disabled"):
            return
        r = disable_umip()  # writes GRUB param + regenerates grub.cfg, no reboot
        if r.get("success"):
            logger.log("SLSDeckHV HV: UMIP GRUB param set (applies on next reboot).")
        else:
            logger.warn(f"SLSDeckHV HV: auto UMIP set failed: {r.get('error')}")
    except Exception as exc:
        logger.warn(f"SLSDeckHV HV: auto_umip_on_load error: {exc}")


def auto_load_on_start() -> None:
    """When the 'load module at startup' toggle is on, download (if needed) and
    load the hypervisor module globally at plugin start, and keep it resident.
    This is the opt-in alternative to the default per-game auto-load. Requires
    root, UMIP disabled, and a module matching the running kernel."""
    global _startup_loaded
    try:
        if not settings.get_hv_autoload():
            return
        if is_loaded():
            _startup_loaded = True
            return
        if not _is_root():
            logger.warn("SLSDeckHV HV: startup auto-load skipped — not running as root.")
            return
        if not umip_status().get("disabled"):
            logger.warn("SLSDeckHV HV: startup auto-load skipped — UMIP still enabled (reboot needed).")
            return
        # Ensure a kernel-matching module is present (capped so a broken fetch
        # doesn't retry forever; a manual 'Install module' resets the cap).
        if not (os.path.isfile(_module_path()) and _downloaded_kernel_ok()):
            if settings.dep_fail_capped("hvmodule"):
                logger.warn("SLSDeckHV HV: startup auto-load — download capped, use Install module.")
                return
            d = download_module()
            if not d.get("success"):
                settings.inc_dep_fail("hvmodule")
                logger.warn(f"SLSDeckHV HV: startup auto-load download failed: {d.get('error')}")
                return
        r = load_module()
        if r.get("success"):
            _startup_loaded = True
            logger.log("SLSDeckHV HV: module loaded at startup (resident).")
        else:
            logger.warn(f"SLSDeckHV HV: startup auto-load failed: {r.get('error')}")
    except Exception as exc:
        logger.warn(f"SLSDeckHV HV: auto_load_on_start error: {exc}")


def detect_gaming_os() -> str:
    """Return 'steamos', 'bazzite', or 'other' by reading /etc/os-release."""
    try:
        data = {}
        with open("/etc/os-release", "r", encoding="utf-8", errors="ignore") as fh:
            for line in fh:
                if "=" in line:
                    k, v = line.rstrip("\n").split("=", 1)
                    data[k.strip()] = v.strip().strip('"').lower()
        os_id = data.get("ID", "")
        variant = data.get("VARIANT_ID", "")
        name = f"{data.get('NAME','')} {data.get('PRETTY_NAME','')}"
        if os_id == "bazzite" or variant == "bazzite":
            return "bazzite"
        if os_id == "steamos" or variant == "steamdeck" or "steamos" in name:
            return "steamos"
    except Exception:
        pass
    return "other"


def is_steamos() -> bool:
    return detect_gaming_os() == "steamos"
