Warning: truncated output (original token count: 52181)
Total output lines: 5032

"""SLSsteam integration — the SteamOS / Linux replacement for SteamTools.

The original SLSDeck plugin relied on **SteamTools** (a Windows-only ``st`` Lua
loader) that read ``config/stplug-in/<appid>.lua`` scripts. That mechanism does
not exist on SteamOS. The native Linux equivalent is **SLSsteam**
(https://github.com/AceSLS/SLSsteam) — an ``LD_AUDIT`` shared library that hooks
``steamclient.so`` and makes Steam believe you own a set of apps. Steam then
requests the depot decryption keys from its own servers, so no ``.lua`` script
or manually supplied depot key is needed.

SLSsteam is driven by a single YAML file at ``~/.config/SLSsteam/config.yaml``.
Reading its source (``src/config.cpp`` / ``src/feats/apps.cpp``) shows:

* ``AppIds:``        — a black/whitelist *filter* over apps you already own.
                        With the default ``UseWhitelist: no`` an entry here
                        **excludes** an app, so it must NOT be used to add games.
* ``AdditionalApps:`` — the list that is actually *injected* into the owned-apps
                        list (``getSubscribedApps`` appends it and
                        ``checkAppOwnership`` only unlocks apps found here).

Therefore "adding a game" == inserting its AppId under ``AdditionalApps:``. This
matches the reference implementation in ``project-example`` (its
``yaml_config_manager.add_additional_app``).

This module edits the YAML with line-targeted, comment-preserving, *atomic*
writes (temp file + ``os.replace``) — mirroring the reference — so an
interrupted write can never corrupt the user's config.
"""

from __future__ import annotations

import os
import platform
import re
import shutil
import subprocess
import threading
import time
from typing import Any, Dict, List, Optional, Set, Tuple

from .logger import logger
from .paths import defaults_path, get_user_home

CONFIG_FILENAME = "config.yaml"
ADDITIONAL_APPS_KEY = "AdditionalApps"
BACKUP_SUFFIX = ".bak"

# Native install (default Steam / SteamOS gamemode)
_NATIVE_LIB_DIR = os.path.join("~", ".local", "share", "SLSsteam")
# Flatpak install (com.valvesoftware.Steam sandbox)
_FLATPAK_CONFIG_DIR = os.path.join(
    "~", ".var", "app", "com.valvesoftware.Steam", ".config", "SLSsteam"
)
_FLATPAK_LIB_DIR = os.path.join(
    "~", ".var", "app", "com.valvesoftware.Steam", ".local", "share", "SLSsteam"
)

_INSTALL_STATE: Dict[str, Any] = {}
_INSTALL_LOCK = threading.Lock()


def _home() -> str:
    return get_user_home()


def _candidate_homes() -> list:
    """All plausible Deck-user homes. The plugin backend runs as root, so ~ /
    $HOME can resolve to /root and miss /home/deck; resolve the real user via
    pwd as well so steam.sh lookups don't silently fail."""
    homes = []
    def _add(h):
        if h and h not in homes and os.path.isdir(h):
            homes.append(h)
    _add(get_user_home())
    try:
        import pwd as _pwd
        _add(_pwd.getpwnam(_decky_user()).pw_dir)
    except Exception:
        pass
    _add("/home/deck")
    try:
        import glob as _glob
        for h in _glob.glob("/home/*"):
            if os.path.isdir(os.path.join(h, ".steam")):
                _add(h)
    except Exception:
        pass
    return homes or [get_user_home()]


def _steam_sh_candidates() -> list:
    """Existing steam.sh paths across all candidate homes."""
    out = []
    for h in _candidate_homes():
        for rel in ((".steam", "steam", "steam.sh"),
                    (".local", "share", "Steam", "steam.sh")):
            p = os.path.join(h, *rel)
            if os.path.isfile(p) and p not in out:
                out.append(p)
    return out


def _expand(path: str) -> str:
    if path.startswith("~"):
        path = _home() + path[1:]
    return os.path.expanduser(path)


def _is_flatpak_steam() -> bool:
    flat = _expand(_FLATPAK_CONFIG_DIR)
    flat_lib = _expand(_FLATPAK_LIB_DIR)
    native_lib = _expand(_NATIVE_LIB_DIR)
    if (os.path.isdir(flat) or os.path.isdir(flat_lib)) and not os.path.isdir(native_lib):
        return True
    flat_steam = _expand(
        os.path.join("~", ".var", "app", "com.valvesoftware.Steam", ".steam", "steam")
    )
    native_steam = _expand(os.path.join("~", ".steam", "steam"))
    return os.path.isdir(flat_steam) and not os.path.isdir(native_steam)


def _native_config_dir() -> str:
    """Honour XDG_CONFIG_HOME like the reference implementation does."""
    xdg = os.environ.get("XDG_CONFIG_HOME", "")
    if xdg and os.path.isabs(os.path.expanduser(xdg)):
        return os.path.join(os.path.expanduser(xdg), "SLSsteam")
    return os.path.join(_home(), ".config", "SLSsteam")


def config_dir() -> str:
    return _expand(_FLATPAK_CONFIG_DIR) if _is_flatpak_steam() else _native_config_dir()


def config_path() -> str:
    return os.path.join(config_dir(), CONFIG_FILENAME)


def _native_lib_dir() -> str:
    """Honour XDG_DATA_HOME like the reference implementation does."""
    xdg = os.environ.get("XDG_DATA_HOME", "")
    if xdg and os.path.isabs(os.path.expanduser(xdg)):
        return os.path.join(os.path.expanduser(xdg), "SLSsteam")
    return _expand(_NATIVE_LIB_DIR)


def lib_dir() -> str:
    return _expand(_FLATPAK_LIB_DIR) if _is_flatpak_steam() else _native_lib_dir()


def _lib_candidates() -> List[str]:
    base = lib_dir()
    return [
        os.path.join(base, "SLSsteam.so"),
        os.path.join(base, "bin", "SLSsteam.so"),
        os.path.join(base, "lib", "SLSsteam.so"),
    ]


def find_installed_lib() -> str:
    for candidate in _lib_candidates():
        if os.path.isfile(candidate):
            return candidate
    return ""


def _injection_markers() -> List[str]:
    home = _home()
    return [
        os.path.join(home, ".steam", "steam", "steam_dev.cfg"),
        os.path.join(home, ".config", "environment.d", "slssteam.conf"),
        os.path.join(home, ".local", "share", "applications", "headcrab.desktop"),
        os.path.join(config_dir(), "tools", "netsock", "netsock.so"),
    ]


def is_injected() -> bool:
    try:
        if gamescope_hook_active():
            return True
    except Exception:
        pass
    for marker in _injection_markers():
        if os.path.exists(marker):
            return True
    for launch in _steam_sh_candidates():
        try:
            with open(launch, "r", encoding="utf-8", errors="ignore") as handle:
                text = handle.read()
            if "SLSsteam" in text or "LD_AUDIT" in text:
                return True
        except Exception:
            continue
    return False


# ── status ─────────────────────────────────────────────────────────────────
def _steamsh_injection_live() -> bool:
    """True if the current steam.sh actively exports LD_AUDIT for SLSsteam —
    headcrab's patch OR our wrapper. Real active injection (next Steam launch is
    hooked), so the add-gate must accept it. Commented-out lines are ignored."""
    for launch in _steam_sh_candidates():
        try:
            if not os.path.isfile(launch):
                continue
            with open(launch, "r", encoding="utf-8", errors="ignore") as fh:
                for line in fh:
                    s = line.strip()
                    if not s or s.startswith("#"):
                        continue
                    if "LD_AUDIT" in s and "slssteam" in s.lower():
                        return True
        except Exception:
            continue
    return False


def _injection_active() -> bool:
    """True when injection is actually active for the next Steam launch — via the
    gamescope hook, our own steam.sh wrapper, OR headcrab's steam.sh LD_AUDIT
    patch. Ignores install-marker files and commented-out leftovers."""
    try:
        if gamescope_hook_active():
            return True
    except Exception:
        pass
    try:
        if wrapper_active():
            return True
    except Exception:
        pass
    try:
        return _steamsh_injection_live()
    except Exception:
        return False


# LOAD-time fatal markers only. These strings are emitted by the moon when the
# .so maps but its pattern-scan against the Steam binary fails (i.e. it's inert).
# They must NOT match the benign, per-game/per-DLC warnings the moon prints while
# unlocking a live session — e.g. an "unsupported" DLC or a bare "abort" substring
# inside an unrelated word. If a runtime warning matched here, then adding a few
# games would make the last matching line a benign one, flip _log_last_load_ok to
# False, trip _injection_functional, turn the chip orange, and BLOCK further adds
# even though injection is live. That was the "injection off after 4-5 adds" bug.
_LOAD_FAIL_MARKERS = (
    "failed to find all patterns",
    "unknown hash",
    "unsupported steam",
    "unsupported version",
    "aborting due to",
    "aborting!",
)
_LOAD_OK_MARKERS = ("loaded successfully",)


def _log_last_load_ok() -> Optional[bool]:
    """Read SLSsteam's own log and report whether its MOST RECENT *load* succeeded.
    Returns True (last load marker is a success), False (last load marker is a
    load-time abort), or None (no load info). Only LOAD-time lines count — runtime
    unlock warnings are ignored, because an aborted load happens INSTEAD of a
    successful load, never after one within the same session."""
    ok = bad = -1
    seen = False
    for h in _candidate_homes():
        p = os.path.join(h, ".SLSsteam.log")
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                lines = fh.readlines()
        except Exception:
            continue
        for i, ln in enumerate(lines):
            low = ln.lower()
            if any(s in low for s in _LOAD_OK_MARKERS):
                ok = i; seen = True
            if any(s in low for s in _LOAD_FAIL_MARKERS):
                bad = i; seen = True
        if seen:
            return ok > bad
    return None


def _system_boot_epoch() -> Optional[float]:
    """Wall-clock time of the last system boot (stable for the whole uptime)."""
    try:
        with open("/proc/uptime", "r") as fh:
            uptime = float(fh.read().split()[0])
        return time.time() - uptime
    except Exception:
        return None


def _slssteam_log_path() -> Optional[str]:
    for h in _candidate_homes():
        p = os.path.join(h, ".SLSsteam.log")
        if os.path.isfile(p):
            return p
    return None


def _injection_functional() -> bool:
    """True only when SLSsteam is actually live in the CURRENT boot's session.

    'Mapped' alone is a false positive (an aborted load leaves the .so mapped but
    dead, and a stale 'Loaded successfully' persists in the append-only log). The
    moon appends to ~/.SLSsteam.log every time it loads, so if the log was last
    written BEFORE the current boot, the moon didn't load this session.

    Keyed to SYSTEM BOOT TIME (stable) rather than a Steam process start — the
    latter was fragile because steamwebhelper restarts mid-session, making the
    'session start' jump ahead of the moon's last log write and wrongly reporting
    'not injected' even when injection was live (the false-negative this fixes)."""
    try:
        if not _running_injected():
            return False
    except Exception:
        return False
    # Freshness gate vs boot time: the moon must have written its log since the
    # last boot. Soft Steam restarts within the same boot re-load the moon and
    # re-write the log, so they don't trip this.
    try:
        boot = _system_boot_epoch()
        logp = _slssteam_log_path()
        if boot and logp:
            if os.path.getmtime(logp) < (boot - 5):
                return False  # log not written since boot → moon not live
    except Exception:
        pass
    # And the most recent load outcome must not be an abort.
    try:
        if _log_last_load_ok() is False:
            return False
    except Exception:
        pass
    return True


# ── boot-time injection watchdog (recover after a Steam client update) ───────
_INJ_EVENTS = []
_INJ_EVENTS_LOCK = threading.Lock()


def pop_injection_events() -> Dict[str, Any]:
    with _INJ_EVENTS_LOCK:
        ev = list(_INJ_EVENTS)
        _INJ_EVENTS.clear()
    return {"success": True, "events": ev}


def _push_injection_event(kind: str, message: str) -> None:
    with _INJ_EVENTS_LOCK:
        # Bounded for the same reason as _ADD_EVENTS: the frontend poller is the
        # only drain, so an unopened QAM would let this grow indefinitely.
        if len(_INJ_EVENTS) >= 200:
            del _INJ_EVENTS[:-100]
        _INJ_EVENTS.append({"kind": kind, "message": message})


def trigger_steam_install(appid, library: int = 0) -> Dict[str, Any]:
    """Ask the LIVE SLSsteam hook to start downloading an added game via its
    private runtime API ("install|appid|library")."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    candidates = []
    try:
        import pwd
        uid = pwd.getpwnam(_decky_user()).pw_uid
        candidates.append(f"/run/user/{uid}/SLSsteam/api")
    except Exception:
        pass
    candidates.append(os.path.join(_home(), ".cache", "SLSsteam", "api"))
    # Compatibility with older, pre-private-runtime engines only when their
    # contract already exists. Never recreate this insecure legacy endpoint.
    candidates.append("/tmp/SLSsteam.API")
    for path in candidates:
        if not os.path.isfile(path):
            continue
        try:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write("install|%d|%d\n" % (appid, int(library)))
            logger.log(f"SLSsteam: API install trigger -> {appid} via {path} (library {library})")
            return {"success": True, "path": path}
        except Exception as exc:
            logger.warn(f"SLSsteam: API install trigger failed via {path}: {exc}")
    return {"success": False, "error": "live SLSsteam API contract not found",
            "checked": candidates}


def validate_steam_app(appid) -> Dict[str, Any]:
    """Ask the running Steam client to validate an installed app.

    Historical manifest pins on an already-installed game do not reliably react
    to the SLSsteam `install|...` IPC because Steam may still consider the app
    fully installed. `steam://validate/<appid>` is Steam's own Verify integrity
    action, which forces it to reconcile the newly pinned manifests and download
    the changed files.
    """
    try:
        appid = int(appid)
        if appid <= 0:
            raise ValueError()
    except Exception:
        return {"success": False, "error": "invalid appid"}
    try:
        steam_candidates = _steam_sh_candidates()
        steam_cmd = steam_candidates[0] if steam_candidates else "steam"
        cmd = _wrap_as_user([steam_cmd, f"steam://validate/{appid}"])
        subprocess.Popen(
            cmd, env=_rich_env(), stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        logger.log(f"SLSsteam: Steam validation trigger -> {appid}")
        return {"success": True}
    except Exception as exc:
        logger.warn(f"SLSsteam: Steam validation trigger failed: {exc}")
        return {"success": False, "error": str(exc)}


def injection_health() -> Dict[str, Any]:
    try:
        active = _injection_active()
    except Exception:
        active = False
    return {"success": True, "installed": bool(find_installed_lib()), "active": bool(active)}


def restart_steam_apply() -> Dict[str, Any]:
    """Fully restart Steam so a steam.sh/injection change takes effect: clean
    shutdown, wait, then relaunch THROUGH steam.sh as the desktop user. Unlike
    the frontend's soft SteamClient.User.StartRestart (which relaunches the bare
    client without re-execing steam.sh), this re-reads LD_AUDIT, so injection
    actually turns on."""
    try:
        cmd = _wrap_as_user([
            "bash", "-lc",
            "steam -shutdown >/dev/null 2>&1; sleep 5; nohup steam >/dev/null 2>&1 &",
        ])
        subprocess.Popen(
            cmd, env=_rich_env(), stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        return {"success": True}
    except Exception as exc:
        logger.warn(f"SLSsteam: restart_steam_apply failed: {exc}")
        return {"success": False, "error": str(exc)}


def _running_injected() -> bool:
    """True if SLSsteam.so is actually loaded into the running Steam process --
    i.e. injection is LIVE right now (not just steam.sh being patched)."""
    import glob
    # SLSsteam.so only ever gets mapped into a Steam-family process, so any
    # process that has it mapped means injection is LIVE. We no longer restrict
    # to an exact comm allow-list: the moon's library-inject.so bootstraps
    # SLSsteam.so and the mapping can land in a process whose comm isn't exactly
    # "steam"/"steamwebhelper"/"steamclient" (e.g. a reaper/runtime shim), which
    # made the strict filter report "not injected" even while it was loaded and
    # actively injecting. Fast path checks the obvious Steam procs first, then
    # falls back to a full scan.
    def _maps_has_sls(maps_path):
        try:
            with open(maps_path, "r", errors="ignore") as fh:
                return "SLSsteam.so" in fh.read()
        except Exception:
            return False

    try:
        all_maps = glob.glob("/proc/[0-9]*/maps")
        # Fast path: Steam-named processes first.
        rest = []
        for maps in all_maps:
            try:
                pid = maps.split("/")[2]
                try:
                    comm = open("/proc/%s/comm" % pid).read().strip().lower()
                except Exception:
                    comm = ""
                if "steam" in comm:
                    if _maps_has_sls(maps):
                        return True
                else:
                    rest.append(maps)
            except Exception:
                continue
        # Fallback: any other process (covers reaper/runtime shims).
        for maps in rest:
            if _maps_has_sls(maps):
                return True
    except Exception:
        pass
    return False


def boot_injection_watchdog() -> None:
    """On startup, keep injection healthy without nagging:
      * live (process hooked) + steam.sh patched  -> nothing to do
      * live but steam.sh reverted                -> silently re-patch (no nag)
      * not live but steam.sh patched             -> "restart to apply" notice
      * genuinely off                             -> warn + opt-in auto-recover (capped)
    """
    try:
        from . import settings as _s
    except Exception:
        return
    try:
        if not find_installed_lib():
            return
        # Newer engines ship a `pattern-refresh` helper: re-resolve the moon's
        # Steam-binary offsets against the CURRENT client build so injection
        # survives a Steam update instead of aborting ("unknown hash"). No-op on
        # older engines that don't ship it. Fire-and-forget; never blocks boot.
        try:
            refresh_patterns()
        except Exception:
            pass
        live = _running_injected()
        patched = _injection_active()
        if live:
            # Injection is working right now — Steam is up with the hook mapped,
            # so we're not in a crash loop: clear the path/steam failsafe counter.
            try:
                _reset_inject_failsafe()
            except Exception:
                pass
            if not patched:
                # steam.sh got reverted; re-patch quietly so the next launch stays hooked.
                try:
                    activate_injection()
                except Exception:
                    pass
            _s.reset_dep_fail("reinject")
            _s.reset_dep_fail("clientpin")
            return
        if patched:
            # Set up, just not applied to the running session yet.
            if _s.get_auto_reinject() and not _s.dep_fail_capped("reinject"):
                _s.inc_dep_fail("reinject")
                _push_injection_event("info", "Restarting Steam to apply SLSsteam injection…")
                try:
                    restart_steam_apply()
                except Exception:
                    pass
            else:
                _push_injection_event(
                    "info",
                    "SLSsteam injection is set up but not active in this session - "
                    "fully restart Steam (Power > Restart Steam) or reboot to apply.")
            return
        # Genuinely off: not live and steam.sh not patched.
        _push_injection_event(
            "warn",
            "SLSsteam injection is off - Steam may have updated. Re-pin in Dependencies.")
        if _s.get_auto_client_repin() and not _s.dep_fail_capped("clientpin"):
            _s.inc_dep_fail("clientpin")
            _push_injection_event("info", "Auto re-pinning the Steam client...")
            try:
                start_client_fix()
            except Exception as exc:
                logger.warn(f"watchdog client re-pin failed: {exc}")
            return
        if _s.get_auto_reinject() and not _s.dep_fail_capped("reinject"):
            _s.inc_dep_fail("reinject")
            _push_injection_event(
                "info",
                "Re-activating SLSsteam injection and restarting Steam to apply it…")
            try:
                activate_injection()
                restart_steam_apply()  # full steam -shutdown + relaunch through steam.sh
            except Exception as exc:
                logger.warn(f"watchdog reinject failed: {exc}")
            return
    except Exception as exc:
        try:
            logger.warn(f"boot_injection_watchdog error: {exc}")
        except Exception:
            pass


def get_status() -> Dict[str, Any]:
    lib = find_installed_lib()
    cfg = config_path()
    with _INSTALL_LOCK:
        install = dict(_INSTALL_STATE)
    return {
        "success": True,
        "installed": bool(lib),
        "libPath": lib,
        # 'injected'/'injectionActive' now report FUNCTIONAL injection (adds work
        # right now), not merely 'configured' or 'mapped'. A .so that LD_AUDIT
        # mapped but which then aborted ('unknown hash') is NOT counted, so the UI
        # no longer says active while nothing is actually injecting.
        "injected": _injection_functional(),
        "flatpak": _is_flatpak_steam(),
        "configPath": cfg,
        "configExists": os.path.isfile(cfg),
        "additionalApps": read_additional_apps(),
        "missingDeps": _missing_dependencies(),
        "clientFixRan": os.path.isfile(os.path.join(config_dir(), "tools", "headcrab-run.log")),
        "injectionActive": _injection_functional(),
        # 'configured' = hook/steam.sh present (will inject on next proper launch).
        # Used to distinguish "set up, needs restart" from "genuinely off".
        "injectionConfigured": _injection_active(),
        "install": install,
    }


# ── atomic IO ──────────────────────────────────────────────────────────────
def _read() -> Optional[str]:
    path = config_path()
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read()
    except Exception as exc:
        logger.warn(f"SLSsteam: failed to read {path}: {exc}")
        return None


def _atomic_write_path(path: str, content: str) -> bool:
    """Replace config.yaml in one step. This file holds AdditionalApps -- the
    user's entire added-games list -- so a partial write loses their library.

    The temp name is unique per call: RPC handlers run on a thread pool, and two
    concurrent writers sharing a fixed "<path>.tmp" would have one clobber the
    other's staged bytes before either rename. The fsync pair (file, then parent
    directory) is what makes the rename durable -- without it the rename can
    survive a power cut while the data does not, leaving an empty config. On a
    handheld people shut off by holding the power button, that is a realistic
    way to lose the whole game list."""
    tmp = "%s.tmp.%d.%d" % (path, os.getpid(), threading.get_ident())
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            handle.write(content)
            handle.flush()
            try:
                os.fsync(handle.fileno())
            except Exception:
                pass
        try:
            os.chmod(tmp, 0o644)
            _chown_to_user(os.path.dirname(path))
            _chown_to_user(tmp)
        except Exception:
            pass
        os.replace(tmp, path)
        try:
            dfd = os.open(os.path.dirname(path), os.O_RDONLY)
            try:
                os.fsync(dfd)
            finally:
                os.close(dfd)
        except Exception:
            pass
        try:
            _chown_to_user(path)
        except Exception:
            pass
        return True
    except Exception as exc:
        logger.error(f"SLSsteam: failed to write {path}: {exc}")
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except Exception:
            pass
        return False


def _atomic_write(content: str) -> bool:
    return _atomic_write_path(config_path(), content)


def _backup_once() -> None:
    path = config_path()
    if not os.path.isfile(path):
        return
    backup = path + BACKUP_SUFFIX
    try:
        if os.path.exists(backup) and os.path.getsize(path) < os.path.getsize(backup):
            return  # don't overwrite a good backup with a smaller (possibly bad) file
        shutil.copy2(path, backup)
    except Exception as exc:
        logger.warn(f"SLSsteam: backup failed: {exc}")


# ── AdditionalApps editing (line-targeted, comment-preserving) ─────────────
_ADDITIONAL_APPS_RE = re.compile(r"^AdditionalApps:[ \t]*$", re.MULTILINE)


def _read_additional_from(content: str) -> Set[int]:
    ids: Set[int] = set()
    match = _ADDITIONAL_APPS_RE.search(content)
    if not match:
        # tolerate an inline flow list form too
        inline = re.search(r"^AdditionalApps:[ \t]*\[([^\]]*)\]", content, re.MULTILINE)
        if inline:
            for m in re.findall(r"\d+", inline.group(1)):
                ids.add(int(m))
        return ids
    start = match.end()
    for line in content[start:].split("\n"):
        stripped = line.strip()
        if stripped == "" or stripped.startswith("#"):
            continue
        if stripped.startswith("-"):
            m = re.match(r"-\s*(\d+)", stripped)
            if m:
                ids.add(int(m.group(1)))
            continue
        # A non-indented, non-list line means the next top-level key.
        if not line[:1].isspace():
            break
    return ids


def _remove_additional_from(content: str, appid: int) -> str:
    """Remove an id only from AdditionalApps, never from an unrelated YAML list."""
    inline = re.search(r"^AdditionalApps:[ \t]*\[([^\]]*)\]", content, re.MULTILINE)
    if inline:
        values = [int(value) for value in re.findall(r"\d+", inline.group(1))]
        kept = [str(value) for value in values if value != appid]
        replacement = "AdditionalApps: [" + ", ".join(kept) + "]"
        return content[:inline.start()] + replacement + content[inline.end():]

    match = _ADDITIONAL_APPS_RE.search(content)
    if not match:
        return content
    end = len(content)
    for next_line in re.finditer(r"^\S[^\n]*$", content[match.end():], re.MULTILINE):
        # The first match may be the newline-adjacent next top-level key.
        end = match.end() + next_line.start()
        break
    block = content[match.end():end]
    entry = re.compile(rf"^[ \t]*-[ \t]*{appid}[ \t]*(?:#.*)?$\n?", re.MULTILINE)
    return content[:match.end()] + entry.sub("", block) + content[end:]


def _all_config_paths() -> List[str]:
    """Every config.yaml an SLSsteam frontend might have written — native,
    flatpak, and the currently-detected one — so games added by any plugin or
    version are recognised no matter where that tool put the config."""
    candidates = [
        os.path.join(_native_config_dir(), CONFIG_FILENAME),
        os.path.join(_expand(_FLATPAK_CONFIG_DIR), CONFIG_FILENAME),
        config_path(),
    ]
    seen: Set[str] = set()
    out: List[str] = []
    for p in candidates:
        try:
            rp = os.path.realpath(p)
        except Exception:
            rp = p
        if rp not in seen:
            seen.add(rp)
            out.append(p)
    return out


def _stplugin_appids() -> Set[int]:
    """Main-app ids discovered from SteamTools-format scripts under
    <Steam>/config/stplug-in/<appid>.lua. Recent slsteam-moon reads the game list
    from HERE (the filename stem is the authoritative main-app id) — config.yaml's
    AdditionalApps is now legacy back-compat. The plugin already writes these luas
    on every add, so counting the stems keeps 'added games' correct on the new
    engine even for games that were never mirrored into AdditionalApps. Only active
    `<digits>.lua` count (a `.lua.disabled` game is paused; the engine skips it)."""
    ids: Set[int] = set()
    dirs = []
    try:
        from .steam import stplugin_dir
        d = stplugin_dir()
        if d:
            dirs.append(d)
    except Exception:
        pass
    home = _home()
    for extra in (
        os.path.join(home, ".steam", "steam", "config", "stplug-in"),
        os.path.join(home, ".local", "share", "Steam", "config", "stplug-in"),
        os.path.join(home, ".var", "app", "com.valvesoftware.Steam",
                     ".local", "share", "Steam", "config", "stplug-in"),
    ):
        dirs.append(extra)
    seen_dir: Set[str] = set()
    for d in dirs:
        try:
            rp = os.path.realpath(d)
            if rp in seen_dir or not os.path.isdir(d):
                continue
            seen_dir.add(rp)
            for name in os.listdir(d):
                m = re.fullmatch(r"(\d+)\.lua", name)
                if m:
                    ids.add(int(m.group(1)))
        except Exception:
            continue
    return ids


def _luaappids_yaml_ids() -> Set[int]:
    """Manual/plugin main-app overrides from ~/.config/SLSsteam/luaappids.yaml —
    the supported replacement for config.yaml AdditionalApps on newer engines.
    Parsed line-wise (no YAML dep): an `AdditionalApps:` block of `- <id>`."""
    ids: Set[int] = set()
    path = os.path.join(config_dir(), "luaappids.yaml")
    try:
        if not os.path.isfile(path):
            return ids
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            ids |= _read_additional_from(fh.read())
    except Exception as exc:
        logger.warn(f"SLSsteam: read {path} failed: {exc}")
    return ids


def read_additional_apps() -> List[int]:
    """Every added main-app id, engine-version-agnostic: the union of
      * config.yaml `AdditionalApps:` (legacy — still read by the engine),
      * ~/.config/SLSsteam/luaappids.yaml (new manual-override path), and
      * <Steam>/config/stplug-in/<appid>.lua stems (new PRIMARY source).
    Every feature that lists/checks 'added games' (backup, workshop art, audit,
    diagnostics, watchdog, remove-all) flows through here, so widening the source
    here is what keeps them all correct after the AdditionalApps deprecation."""
    ids: Set[int] = set()
    for path in _all_config_paths():
        try:
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as fh:
                    ids |= _read_additional_from(fh.read())
        except Exception as exc:
            logger.warn(f"SLSsteam: read {path} failed: {exc}")
    try:
        ids |= _luaappids_yaml_ids()
    except Exception:
        pass
    try:
        ids |= _stplugin_appids()
    except Exception:
        pass
    return sorted(ids)


def has_app(appid: int) -> bool:
    try:
        return int(appid) in set(read_additional_apps())
    except Exception:
        return False


def manifest_store_dir() -> str:
    """slsteam-moon's ManifestStore — where it reads depot manifests to pair with
    the depot key when provisioning appinfo. The moon hardcodes
    $HOME/.config/SLSsteam/manifests (ManifestStore::dir()), so match that
    exactly rather than the XDG-aware config dir."""
    return os.path.join(_home(), ".config", "SLSsteam", "manifests")


def cache_depot_key(app_id: int, depot_id: int, key_hex: str) -> bool:
    """Write a depot decryption key into slsteam-moon's on-disk key cache
    (<config>/cache/depotkey_<depotId>.yaml) so downloads for a freshly-added
    game can be decrypted WITHOUT a full Steam restart.

    The moon imports Lua depot keys only once, at startup (DepotKey::onStartup ->
    importLuaScripts is idempotent), so a game added while Steam is already
    running never gets its keys — and the moon then hands Steam a *zero key* for
    the AdditionalApps depot, which downloads but can't decrypt (empty folder).
    But DepotKey::getCachedKey() falls back to reading this cache file on demand,
    and the zero-key path is never persisted, so writing the real key here makes
    the moon substitute it live. Format mirrors DepotKey::saveKeyToCache exactly:
    key is base64 of the raw 32 bytes; managed:true keeps it in manifest scope."""
    try:
        key_hex = (key_hex or "").strip()
        raw = bytes.fromhex(key_hex)
        if len(raw) != 32:
            return False
        import base64 as _b64
        b64 = _b64.b64encode(raw).decode("ascii")
        cache = os.path.join(config_dir(), "cache")
        os.makedirs(cache, exist_ok=True)
        path = os.path.join(cache, "depotkey_%d.yaml" % int(depot_id))
        content = ("appId: %d\ndepotId: %d\nkey: %s\nmanaged: true\n"
                   % (int(app_id), int(depot_id), b64))
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        try:
            _chown_file_to_user(cache)
            _chown_file_to_user(path)
        except Exception:
            pass
        return True
    except Exception as exc:
        logger.warn(f"SLSsteam: cache_depot_key failed for depot {depot_id}: {exc}")
        return False


def ensure_config() -> bool:
    """Guarantee a valid config.yaml exists, seeding from the bundled default,
    and make sure SLSsteam's API is enabled (needed for schema/app features)."""
    path = config_path()
    if not os.path.isfile(path):
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
        except Exception as exc:
            logger.error(f"SLSsteam: cannot create config dir: {exc}")
            return False
        seed = defaults_path(os.path.join("slssteam", "config.default.yaml"))
        try:
            if os.path.isfile(seed):
                shutil.copy(seed, path)
                logger.log(f"SLSsteam: seeded config from bundled default -> {path}")
            else:
                _atomic_write("AdditionalApps:\n")
        except Exception as exc:
            logger.warn(f"SLSsteam: failed to seed config: {exc}")
            _atomic_write("AdditionalApps:\n")
    _ensure_required_keys()
    return os.path.isfile(path)


# Boolean config keys SLSsteam must see a specific value for, or SLSDeck cannot
# do its job. SLSsteam falls back to its OWN compiled-in default for any key that
# is absent from config.yaml (and logs "Issues during config loading encountered!
# Missing key(s)"), so omitting a key is NOT neutral -- it silently opts into
# whatever upstream chose.
_REQUIRED_BOOL_KEYS = {
    # Needed for Moon's private per-user runtime API (schema + install triggers).
    "API": "yes",
    # Both SLSsteam and slsteam-moon ship this OFF ("Enables playing of not owned
    # games"), and SLSDeck's bundled template inherited that default -- which
    # directly contradicts the plugin's entire purpose. Adding a game to
    # AdditionalApps while this is off leaves the engine unwilling to treat it as
    # playable. Turn it on explicitly.
    "PlayNotOwnedGames": "yes",
}


def _ensure_bool_key(content: str, key: str, want: str) -> str:
    """Return `content` with top-level `key` set to `want` (appending if absent)."""
    pattern = re.compile(rf"^(\s*){re.escape(key)}\s*:\s*(yes|no|true|false)\b",
                         re.MULTILINE | re.IGNORECASE)
    m = pattern.search(content)
    truthy = want.lower() in ("yes", "true")
    if m:
        if (m.group(2).lower() in ("yes", "true")) == truthy:
            return content
        return pattern.sub(lambda mm: f"{mm.group(1)}{key}: {want}", content, count=1)
    return content.rstrip("\n") + f"\n{key}: {want}\n"


def _ensure_required_keys() -> None:
    content = _read()
    if content is None:
        return
    new = content
    for key, want in _REQUIRED_BOOL_KEYS.items():
        new = _ensure_bool_key(new, key, want)
    if new != content:
        if _atomic_write(new):
            logger.log("SLSsteam: repaired required config keys "
                       f"({', '.join(f'{k}: {v}' for k, v in _REQUIRED_BOOL_KEYS.items())})")


def _ensure_api_enabled() -> None:
    """Back-compat alias — superseded by _ensure_required_keys()."""
    _ensure_required_keys()


def set_inject_all_advertised_dlc(enabled: bool) -> Dict[str, Any]:
    """Write moon's `InjectAllAdvertisedDlc` flag. `yes` injects EVERY
    storefront-advertised DLC into package 0, so DLC read as owned in the
    library/store view — not just in-game (moon's blanket unlock is gated on a
    running-game context). This is the native, one-key answer to 'added game's DLC
    don't show owned'; content-backed DLC is still injected automatically. Newer
    engine only — harmless (unknown key, ignored) on older builds, where the
    per-appid DlcData registration remains the fallback. Returns {success}."""
    try:
        ensure_config()
        content = _read()
        if content is None:
            return {"success": False, "error": "no config"}
        new = _ensure_bool_key(content, "InjectAllAdvertisedDlc", "yes" if enabled else "no")
        if new != content:
            if not _atomic_write(new):
                return {"success": False, "error": "write failed"}
        return {"success": True, "injectAllAdvertisedDlc": bool(enabled)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def set_disable_cloud(enabled: bool) -> Dict[str, Any]:
    """Write moon's DisableCloud flag. `yes` disables Steam cloud for SLS-added
    (unlocked) games only — legit games are untouched. Mutually exclusive with
    CloudRedirect (which needs cloud on). Returns {success}."""
    try:
        ensure_config()
        content = _read()
        if content is None:
            return {"success": False, "error": "no config"}
        new = _ensure_bool_key(content, "DisableCloud", "yes" if enabled else "no")
        if new != content:
            if not _atomic_write(new):
                return {"success": False, "error": "write failed"}
        return {"success": True, "disableCloud": bool(enabled)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# ── AppIds blacklist (moon's shouldExcludeAppId list) ────────────────────────
_APPIDS_RE = re.compile(r"^AppIds:[ \t]*$", re.MULTILINE)


def read_blacklist() -> List[int]:
    """The appids in moon's `AppIds` list (blacklist by default). Used to stop DLC
    unlock for specific appids (e.g. DLC of games you legit own)."""
    content = _read() or ""
    m = _APPIDS_RE.search(content)
    if not m:
        # tolerate inline form: AppIds: [1, 2]
        inline = re.search(r"^AppIds:[ \t]*\[([^\]]*)\]", content, re.MULTILINE)
        if inline:
            return [int(x) for x in re.findall(r"\d+", inline.group(1))]
        return []
    out: List[int] = []
    for line in content[m.end():].split("\n"):
        s = line.strip()
        if s.startswith("-"):
            mm = re.match(r"-\s*(\d+)", s)
            if mm:
                out.append(int(mm.group(1)))
        elif s and not s.startswith("#"):
            break
    return out


def set_blacklist(appids) -> Dict[str, Any]:
    """Replace moon's `AppIds` blacklist with the given appids (block form)."""
    try:
        ensure_config()
        content = _read()
        if content is None:
            return {"success": False, "error": "no config"}
        ids = sorted({int(a) for a in appids})
        block = "AppIds:\n" + "".join(f"  - {a}\n" for a in ids) if ids else "AppIds:\n"
        # Remove any existing AppIds block (list or inline), then append fresh.
        stripped = _strip_appids_block(content)
        new = stripped.rstrip("\n") + "\n" + block
        if not _atomic_write(new):
            return {"success": False, "error": "write failed"}
        return {"success": True, "count": len(ids)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _strip_appids_block(content: str) -> str:
    lines = content.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^AppIds:", line):
            i += 1
            # skip following list items / blanks belonging to the block
            while i < len(lines):
                s = lines[i].strip()
                if s.startswith("-") or s == "" or s.startswith("#"):
                    i += 1
                    continue
                break
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


def add_app(appid: int, comment: str = "") -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    ensure_config()
    _backup_once()
    content = _read() or "AdditionalApps:\n"

    if appid in _read_additional_from(content):
        return {"success": True, "additionalApps": read_additional_apps(),
                "alreadyPresent": True}

    # Game names are used as trailing YAML comments; strip any newline/CR so a
    # multi-line name can never break out of the comment and corrupt the file.
    comment = str(comment or "").replace("\r", " ").replace("\n", " ").strip()
    entry = f"  - {appid}   # {comment}\n" if comment else f"  - {appid}\n"
    match = _ADDITIONAL_APPS_RE.search(content)
    if match:
        # Insert after the last existing list item / comment in the block.
        start = match.end()
        if start < len(content) and content[start] == "\n":
            start += 1
        rest = content[start:]
        lines = rest.split("\n")
        insert_at = start
        cursor = start
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("-") or stripped == "" or stripped.startswith("#"):
                cursor += len(line) + 1
                if stripped.startswith("-"):
                    insert_at = cursor
                continue
            if not line[:1].isspace():
                break
            cursor += len(line) + 1
        if insert_at == start:  # empty list, insert right after the key line
            insert_at = start
        # Safety: never weld the entry onto the "AdditionalApps:" line itself.
        # This can only happen for a hand-edited config where the key has no
        # trailing newline (the seeded/atomic-written config always does).
        if insert_at > 0 and content[insert_at - 1] != "\n":
            entry = "\n" + entry
        new_content = content[:insert_at] + entry + content[insert_at:]
    else:
        new_content = content.rstrip("\n") + f"\nAdditionalApps:\n{entry}"

    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: added {appid} to {ADDITIONAL_APPS_KEY}")
    return {"success": True, "additionalApps": read_additional_apps()}


def remove_app(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    failed: List[str] = []

    # Old and new SLSsteam builds can leave registrations in different files.
    # Remove every occurrence from every candidate, rather than only the config
    # selected by today's environment detection.
    yaml_paths = list(_all_config_paths())
    for cfg in list(_all_config_paths()):
        lua_ids = os.path.join(os.path.dirname(cfg), "luaappids.yaml")
        if lua_ids not in yaml_paths:
            yaml_paths.append(lua_ids)
    for path in yaml_paths:
        try:
            if not os.path.isfile(path):
                continue
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
            new_content = _remove_additional_from(content, appid)
            if new_content != content:
                try:
                    backup = path + BACKUP_SUFFIX
                    if not os.path.exists(backup) or os.path.getsize(path) >= os.path.getsize(backup):
                        shutil.copy2(path, backup)
                except Exception as exc:
                    logger.warn(f"SLSsteam: backup failed for {path}: {exc}")
                if not _atomic_write_path(path, new_content):
                    failed.append(path)
        except Exception as exc:
            logger.warn(f"SLSsteam: failed to remove {appid} from {path}: {exc}")
            failed.append(path)

    # Lua stems are authoritative on current slsteam-moon. Clear native,
    # Flatpak, and detected Steam roots, including disabled leftovers.
    script_dirs: List[str] = []
    try:
        from .steam import stplugin_dir
        script_dirs.append(stplugin_dir())
    except Exception:
        pass
    for home in _candidate_homes():
        script_dirs.extend([
            os.path.join(home, ".steam", "steam", "config", "stplug-in"),
            os.path.join(home, ".local", "share", "Steam", "config", "stplug-in"),
            os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam", "config", "stplug-in"),
        ])
    for directory in set(filter(None, script_dirs)):
        for suffix in (".lua", ".lua.disabled"):
            path = os.path.join(directory, f"{appid}{suffix}")
            try:
                if os.path.isfile(path):
                    os.remove(path)
            except Exception as exc:
                logger.warn(f"SLSsteam: failed to remove {path}: {exc}")
                failed.append(path)

    remaining = read_additional_apps()
    if appid not in remaining:
        logger.log(f"SLSsteam: removed {appid} from all registration stores")
    return {
        "success": not failed and appid not in remaining,
        "additionalApps": remaining,
        "failedPaths": failed,
    }


def remove_apps(appids: List[int]) -> Dict[str, Any]:
    """Remove a set of registrations as one settled hot-reload transaction.

    Moon watches the Lua directory plus config.yaml/luaappids.yaml. Reusing
    ``remove_app`` in a loop publishes a succession of partially-removed
    snapshots and can leave SteamUI showing whichever intermediate package
    state won the race. Delete every Lua first, rewrite every YAML store once,
    and finish by replacing the canonical luaappids.yaml after the filesystem
    has reached its final state. That last event gives Moon one authoritative
    snapshot to reconcile.
    """
    targets: Set[int] = set()
    for value in appids:
        try:
            targets.add(int(value))
        except Exception:
            continue
    if not targets:
        return {"success": True, "additionalApps": read_additional_apps(),
                "failedPaths": [], "deleted": []}

    failed: List[str] = []
    deleted: List[str] = []

    # Lua stems are authoritative. Reach the final directory state before any
    # YAML notification asks Moon to take a fresh snapshot.
    script_dirs: List[str] = []
    try:
        from .steam import stplugin_dir
        script_dirs.append(stplugin_dir())
    except Exception:
        pass
    for home in _candidate_homes():
        script_dirs.extend([
            os.path.join(home, ".steam", "steam", "config", "stplug-in"),
            os.path.join(home, ".local", "share", "Steam", "config", "stplug-in"),
            os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam", "config", "stplug-in"),
        ])
    for directory in set(filter(None, script_dirs)):
        for appid in targets:
            for suffix in (".lua", ".lua.disabled"):
                path = os.path.join(directory, f"{appid}{suffix}")
                try:
                    if os.path.isfile(path):
                        os.remove(path)
                        deleted.append(path)
                except Exception as exc:
                    logger.warn(f"SLSsteam: failed to remove {path}: {exc}")
                    failed.append(path)

    yaml_paths = list(_all_config_paths())
    for cfg in list(_all_config_paths()):
        lua_ids = os.path.join(os.path.dirname(cfg), "luaappids.yaml")
        if lua_ids not in yaml_paths:
            yaml_paths.append(lua_ids)
    final_signal = os.path.join(config_dir(), "luaappids.yaml")
    yaml_paths = [path for path in yaml_paths if path != final_signal] + [final_signal]

    for path in yaml_paths:
        try:
            exists = os.path.isfile(path)
            if not exists and path != final_signal:
                continue
            if exists:
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
            else:
                content = "AdditionalApps:\n"
            new_content = content
            for appid in targets:
                new_content = _remove_additional_from(new_content, appid)
            # Always replace final_signal, even when its text is unchanged: it
            # is the completion event after all Lua/YAML mutations have settled.
            if new_content != content or path == final_signal:
                if exists:
                    try:
                        backup = path + BACKUP_SUFFIX
                        if not os.path.exists(backup) or os.path.getsize(path) >= os.path.getsize(backup):
                            shutil.copy2(path, backup)
                    except Exception as exc:
                        logger.warn(f"SLSsteam: backup failed for {path}: {exc}")
                if not _atomic_write_path(path, new_content):
                    failed.append(path)
        except Exception as exc:
            logger.warn(f"SLSsteam: batch removal failed for {path}: {exc}")
            failed.append(path)

    remaining = read_additional_apps()
    still_present = sorted(targets & set(remaining))
    logger.log(
        f"SLSsteam: batch removed {len(targets) - len(still_present)}/"
        f"{len(targets)} app registration(s); final hot-reload signal written"
    )
    return {
        "success": not failed and not still_present,
        "additionalApps": remaining,
        "remaining": still_present,
        "failedPaths": sorted(set(failed)),
        "deleted": deleted,
    }


# ── SLSsteam install (direct download from GitHub; no apt/sudo/wget) ─────────
# The bundled h3adcr-b bootstrap calls ``sudo apt-get``/``wget``/``7z`` which do
# not exist / are not permitted on SteamOS's read-only rootfs (that produced the
# "exit 127" failures). Instead we mirror the reference app: download the latest
# SLSsteam release, extract it, and run its own dependency-light ``setup.sh``.
SLS_RELEASE_URL = "https://github.com/AceSLS/SLSsteam/releases/latest/download/SLSsteam-Any.7z"
SLS_RELEASE_API = "https://api.github.com/repos/AceSLS/SLSsteam/releases/latest"
HEADCRAB_RAW_URL = "https://raw.githubusercontent.com/Deadboy666/h3adcr-b/refs/heads/main/headcrab.sh"


def _rich_env() -> Dict[str, str]:
    """A subprocess env with HOME set and a full PATH (fixes ``command not
    found`` / exit 127 when the plugin's own PATH is minimal)."""
    env = dict(os.environ)
    # Decky runs plugin backends from a frozen (PyInstaller) runtime and exports
    # LD_LIBRARY_PATH / LD_PRELOAD pointing at its bundled libs (incl. an older
    # OpenSSL under /tmp/_MEI…). Those must NOT leak into system binaries we
    # spawn — flatpak/libostree/libcurl then fail with "OPENSSL_3.x.0 not found".
    for _bad in ("LD_LIBRARY_PATH", "LD_PRELOAD"):
        env.pop(_bad, None)
    env["HOME"] = _home()
    base = ":".join([
        "/usr/bin", "/bin", "/usr/local/bin", "/sbin", "/usr/sbin", "/usr/local/sbin",
        "/var/lib/flatpak/exports/bin",                 # flatpak (all distros)
        os.path.join(_home(), ".local", "share", "flatpak", "exports", "bin"),
        os.path.join(_home(), ".local", "bin"),
    ])
    env["PATH"] = base + ((":" + env["PATH"]) if env.get("PATH") else "")
    env.setdefault("XDG_DATA_HOME", os.path.join(_home(), ".local", "share"))
    env.setdefault("XDG_CONFIG_HOME", os.path.join(_home(), ".config"))
    try:
        import pwd as _pwd
        uid = _pwd.getpwnam(_decky_user()).pw_uid
        runtime = f"/run/user/{uid}"
        if os.path.isdir(runtime):
            env["XDG_RUNTIME_DIR"] = runtime
            env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path={runtime}/bus"
    except Exception:
        pass
    return env


def _decky_user() -> str:
    """The desktop user (Decky plugins run as root; work must land as this
    user, mirroring junk-store's ``sudo -u $DECKY_USER`` pattern)."""
    for key in ("DECKY_USER",):
        val = os.environ.get(key)
        if val:
            return val
    home = _home().rstrip("/")
    try:
        import pwd as _pwd
        real_home = os.path.realpath(home)
        for entry in _pwd.getpwall():
            if entry.pw_uid >= 1000 and os.path.realpath(entry.pw_dir or "") == real_home:
                return entry.pw_name
    except Exception:
        pass
    return os.path.basename(home) or "deck"


def _is_root() -> bool:
    try:
        return os.geteuid() == 0
    except Exception:
        return False


def _wrap_as_user(cmd: List[str]) -> List[str]:
    """Run a command as the desktop user when we are root, with a sane env."""
    if not _is_root():
        return cmd
    user = _decky_user()
    env = _rich_env()
    prefix = ["sudo", "-u", user, "env",
              f"HOME={env['HOME']}", f"PATH={env['PATH']}",
              f"XDG_DATA_HOME={env['XDG_DATA_HOME']}",
              f"XDG_CONFIG_HOME={env['XDG_CONFIG_HOME']}"]
    if env.get("XDG_RUNTIME_DIR"):
        prefix.append(f"XDG_RUNTIME_DIR={env['XDG_RUNTIME_DIR']}")
    if env.get("DBUS_SESSION_BUS_ADDRESS"):
        prefix.append(f"DBUS_SESSION_BUS_ADDRESS={env['DBUS_SESSION_BUS_ADDRESS']}")
    return prefix + cmd


def _pattern_refresh_bin() -> Optional[str]:
    """Locate the engine's `pattern-refresh` helper (installed next to
    SLSsteam.so by newer setup.sh). Returns the path or None on older engines."""
    cands: List[str] = []
    lib = find_installed_lib()
    if lib:
        d = os.path.dirname(lib)
        cands += [os.path.join(d, "pattern-refresh"),
                  os.path.join(os.path.dirname(d), "pattern-refresh")]
    base = lib_dir()
    cands += [os.path.join(base, "pattern-refresh"),
              os.path.join(base, "bin", "pattern-refresh")]
    for p in cands:
        try:
            if p and os.path.isfile(p) and os.access(p, os.X_OK):
                return p
        except Exception:
            continue
    return None


def refresh_patterns() -> Dict[str, Any]:
    """Refresh the moon's Steam-binary pattern cache against the CURRENT client
    build via the bundled `pattern-refresh` helper — the mechanism that keeps
    injection working across a Steam client update without a new engine release.
    Mirrors setup.sh's slsm_refresh_patterns: a fast synchronous `--cache-only`
    pass, then a detached full refresh. No-op (skipped) when the helper is absent
    (older engine). Runs as the desktop user with the loader vars unset."""
    helper = _pattern_refresh_bin()
    if not helper:
        return {"success": False, "skipped": True, "reason": "no pattern-refresh helper"}
    try:
        from .steam import detect_steam_install_path
        steam_root = detect_steam_install_path() or ""
    except Exception:
        steam_root = ""
    config_root = os.path.join(_home(), ".config")
    env = _rich_env()
    for _v in ("LD_AUDIT", "LD_PRELOAD", "LD_LIBRARY_PATH"):
        env.pop(_v, None)
    base = [helper, "--steam-root", steam_root, "--config-root", config_root]
    try:
        subprocess.run(
            _wrap_as_user(base + ["--cache-only"]),
            env=env, timeout=90, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    except Exception as exc:
        logger.warn(f"SLSsteam: pattern-refresh --cache-only failed: {exc}")
    # Detached full refresh (may fetch signed metadata) — don't block boot.
    try:
        subprocess.Popen(
            _wrap_as_user(base), env=env, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception as exc:
        logger.warn(f"SLSsteam: pattern-refresh (full) failed to spawn: {exc}")
    logger.log("SLSsteam: pattern-refresh dispatched (cache-only + full)")
    return {"success": True}


# Build that headcrab downgrades the client to; the moon's patterns are matched
# to this. If the running client differs, the downgrade didn't hold. This is only
# a FALLBACK — upstream bumps it whenever Steam updates, so the live value is read
# from the fetched headcrab script (headcrab_compatible_client()).
HEADCRAB_COMPATIBLE_CLIENT = "1782866176"

_HEADCRAB_COMPAT_CACHE = {"ts": 0.0, "ver": ""}


def headcrab_compatible_client() -> str:
    """The client build headcrab currently downgrades to, read LIVE from the
    upstream script's ``HeadcrabCompatibleClientVer=...`` (it's bumped on every
    Steam client update, so the hardcoded constant goes stale and makes our
    'client matches?' check wrong). Cached ~1h; falls back to the constant on any
    fetch failure. Populated for free when _run_headcrab_shimmed fetches the
    script."""
    import time as _t
    now = _t.time()
    if _HEADCRAB_COMPAT_CACHE["ver"] and now - _HEADCRAB_COMPAT_CACHE["ts"] < 3600:
        return _HEADCRAB_COMPAT_CACHE["ver"]
    # The installer caches the exact upstream script it actually runs. Prefer
    # that over another network request: Decky's HTTP client can be offline or
    # return a stale raw-GitHub response, which previously made this check fall
    # back to an obsolete constant and launch Headcrab against an already-
    # compatible client.
    try:
        cached = os.path.join(config_dir(), "tools", "headcrab.sh")
        if os.path.isfile(cached):
            with open(cached, "r", encoding="utf-8", errors="ignore") as fh:
                m = re.search(r"HeadcrabCompatibleClientVer\s*=\s*(\d+)", fh.read())
            if m:
                _HEADCRAB_COMPAT_CACHE.update(ts=now, ver=m.group(1))
                return m.group(1)
    except Exception:
        pass
    try:
        client = ensure_http_client("headcrab: compat ver")
        r = client.get(_cache_bust(HEADCRAB_RAW_URL), timeout=15, follow_redirects=True)
        if r.status_code == 200:
            m = re.search(r"HeadcrabCompatibleClientVer\s*=\s*(\d+)", r.text)
            if m:
                _HEADCRAB_COMPAT_CACHE.update(ts=now, ver=m.group(1))
                return m.group(1)
    except Exception as exc:
        logger.debug(f"headcrab compat-ver fetch failed: {exc}")
    return HEADCRAB_COMPATIBLE_CLIENT


def _note_headcrab_compat_from_script(script_text: str) -> None:
    """Cache the compatible-client version parsed from an already-fetched script."""
    try:
        import time as _t
        m = re.search(r"HeadcrabCompatibleClientVer\s*=\s*(\d+)", script_text or "")
        if m:
            _HEADCRAB_COMPAT_CACHE.update(ts=_t.time(), ver=m.group(1))
    except Exception:
        pass


def steam_client_version() -> Optional[str]:
    """The currently-installed Steam client build number, read from the package
    manifest Steam writes (`.../package/steam_client_*_ubuntu12.manifest` →
    `"version" "<n>"`). Lets us show current-vs-supported so a stuck injection is
    obvious: if this != HEADCRAB_COMPATIBLE_CLIENT, the downgrade didn't apply."""
    try:
        from .steam import detect_steam_install_path
        root = detect_steam_install_path() or os.path.join(_home(), ".steam", "steam")
    except Exception:
        root = os.path.join(_home(), ".steam", "steam")
    pkg = os.path.join(root, "package")
    best = None
    try:
        names = sorted(os.listdir(pkg)) if os.path.isdir(pkg) else []
    except Exception:
        names = []
    for name in names:
        if re.match(r"steam_client_.*ubuntu12\.manifest$", name):
            try:
                with open(os.path.join(pkg, name), "r", encoding="utf-8", errors="ignore") as fh:
                    m = re.search(r'"version"\s+"(\d+)"', fh.read())
                    if m:
                        best = m.group(1)
                        # prefer the stable-deck manifest if present
                        if "steamdeck_stable" in name:
                            return best
            except Exception:
                continue
    return best


def refresh_patterns_now() -> Dict[str, Any]:
    """Manual, user-triggered pattern refresh that CAPTURES output so the UI can
    show what happened — unlike the silent boot pass. Reports whether the helper
    is even installed (if not, the engine predates pattern-refresh → reinstall it),
    plus current vs supported client build so a failed downgrade is visible."""
    helper = _pattern_refresh_bin()
    client = steam_client_version()
    supported = headcrab_compatible_client()
    out: Dict[str, Any] = {
        "present": bool(helper),
        "helperPath": helper or "",
        "clientVersion": client or "unknown",
        "supportedClient": supported,
        "clientMatches": (client == supported) if client else None,
    }
    if not helper:
        out["success"] = False
        out["message"] = ("pattern-refresh isn't installed — the engine on disk predates it. "
                          "Reinstall SLSsteam from Dependencies to get it, then reboot.")
        return out
    try:
        from .steam import detect_steam_install_path
        steam_root = detect_steam_install_path() or ""
    except Exception:
        steam_root = ""
    config_root = os.path.join(_home(), ".config")
    env = _rich_env()
    for _v in ("LD_AUDIT", "LD_PRELOAD", "LD_LIBRARY_PATH"):
        env.pop(_v, None)
    args = [helper, "--steam-root", steam_root, "--config-root", config_root]
    try:
        r = subprocess.run(
            _wrap_as_user(args), env=env, timeout=180, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        )
        tail = (r.stdout or b"").decode("utf-8", "ignore").splitlines()[-25:]
        out["success"] = (r.returncode == 0)
        out["returncode"] = r.returncode
        out["output"] = tail
        out["message"] = ("Patterns refreshed — fully restart Steam to reload the engine."
                          if r.returncode == 0 else
                          "pattern-refresh ran but reported an error (see output). "
                          "If the client build is newer than upstream coverage, a client "
                          "downgrade via the Client fix is the only option.")
    except Exception as exc:
        out["success"] = False
        out["message"] = f"pattern-refresh failed to run: {exc}"
    return out


def _chown_to_user(path: str) -> None:
    """Recursively give installed files back to the desktop user (we run as
    root under Decky, so files would otherwise be root-owned in ~deck).

    Delegates to utils.chown_to_user, which refuses to recursively walk
    over-broad roots like ~/.config. Callers here used to pass exactly those,
    on a repeating timer, which pegged Game Mode."""
    try:
        from .utils import chown_to_user as _c
        _c(path, recursive=True)
        return
    except Exception:
        pass
    if not _is_root() or not os.path.exists(path):
        return
    try:
        import pwd
        pw = pwd.getpwnam(_decky_user())
        uid, gid = pw.pw_uid, pw.pw_gid
    except Exception as exc:
        logger.warn(f"SLSsteam: chown skipped ({exc})")
        return
    try:
        os.chown(path, uid, gid)
        for root, dirs, files in os.walk(path, followlinks=False):
            for name in dirs + files:
                try:
                    os.chown(os.path.join(root, name), uid, gid)
                except Exception:
                    pass
    except Exception as exc:
        logger.warn(f"SLSsteam: chown failed for {path}: {exc}")


def _extraction_available() -> bool:
    if any(shutil.which(n) for n in ("7z", "7za", "7zr", "bsdtar")):
        return True
    # The plugin bundles a static x86_64 7zz precisely so Arch/Cachy installs
    # do not depend on pacman or Decky's embedded Python having py7zr ready.
    try:
        bundled = defaults_path(os.path.join("bin", "7zz"))
        if os.path.isfile(bundled):
            try:
                os.chmod(bundled, 0o755)
            except Exception:
                pass
            if os.access(bundled, os.X_OK):
                return True
    except Exception:
        pass
    try:
        import py7zr  # noqa: F401
        return True
    except Exception:
        return False


def _missing_dependencies() -> List[str]:
    """We no longer need apt/wget/sudo. The only hard requirement is a way to
    unpack the .7z release; report it only if truly unavailable."""
    return [] if _extraction_available() else ["7z (or the py7zr fallback)"]


def _install_preflight() -> Dict[str, Any]:
    """Fail early with an actionable host diagnosis.

    LuaToolsLinux supports CachyOS by treating it as an Arch-family system and
    resolving all Steam paths relative to the real desktop user's HOME.  SLSDeck
    does not need distro-specific package installation, but it does require the
    same two facts: an x86_64 host and a discoverable Steam user/install.
    """
    machine = (platform.machine() or "").lower()
    if machine not in ("x86_64", "amd64"):
        return {"success": False, "error": f"Unsupported CPU architecture: {machine or 'unknown'} (x86_64 required)"}

    home = _home()
    if not home or home.rstrip("/") in ("", "/", "/root") or not os.path.isdir(home):
        return {"success": False, "error": f"Could not resolve the Steam desktop user's home directory (resolved: {home or 'none'})"}

    user = _decky_user()
    try:
        import pwd as _pwd
        account = _pwd.getpwnam(user)
        if os.path.realpath(account.pw_dir) != os.path.realpath(home):
            user = account.pw_name
    except Exception:
        return {"success": False, "error": f"Desktop user '{user}' does not exist for resolved home {home}"}

    if _is_root() and not shutil.which("sudo"):
        return {"success": False, "error": "sudo is required to install files as the Steam desktop user"}

    try:
        from .steam import detect_steam_install_path
        steam_root = detect_steam_install_path()
    except Exception:
        steam_root = ""
    if not steam_root:
        return {
            "success": False,
            "error": f"Steam was not found under {home}. Start native Steam once, then retry.",
        }

    distro_id = ""
    distro_like = ""
    try:
        with open("/etc/os-release", "r", encoding="utf-8", errors="ignore") as handle:
            values = {}
            for line in handle:
                if "=" in line:
                    key, value = line.rstrip().split("=", 1)
                    values[key] = value.strip().strip('"')
            distro_id = values.get("ID", "")
            distro_like = values.get("ID_LIKE", "")
    except OSError:
        pass
    family = "arch" if distro_id == "arch" or "arch" in distro_like.split() else (distro_id or "linux")
    return {
        "success": True,
        "home": home,
        "user": user,
        "steamRoot": steam_root,
        "distro": distro_id or "unknown",
        "family": family,
        "flatpak": _is_flatpak_steam(),
    }


def _set_install(update: Dict[str, Any]) -> None:
    with _INSTALL_LOCK:
        _INSTALL_STATE.update(update)


def get_install_status() -> Dict[str, Any]:
    with _INSTALL_LOCK:
        state = dict(_INSTALL_STATE)
    # Safety net: if a run wedges (a blocking child that never returns), never
    # let the UI spin forever — fail it after a generous cap.
    if state.get("status") == "running":
        unit = state.get("unit") if state.get("detached") else ""
        if unit and not _detached_repair_active(str(unit)):
            _set_install({
                "status": "failed",
                "success": False,
                "error": "The independent Steam repair stopped before completion. You can retry.",
            })
            with _INSTALL_LOCK:
                state = dict(_INSTALL_STATE)
        started = state.get("startedAt")
        if started and (time.time() - float(started)) > 1800:
            _set_install({
                "status": "failed",
                "error": "Install timed out (30 min). See the log; you can retry, "
                         "or run the client fix from Desktop Mode.",
            })
            with _INSTALL_LOCK:
                state = dict(_INSTALL_STATE)
    return {"success": True, "state": state}


_INSTALL_LOG: List[str] = []


def _log(line: str) -> None:
    _INSTALL_LOG.append(str(line))
    if len(_INSTALL_LOG) > 400:
        del _INSTALL_LOG[:-400]
    _set_install({"log": "\n".join(_INSTALL_LOG)})
    logger.log(f"SLSsteam install: {line}")


def _stage(name: str, message: str) -> None:
    _set_install({"stage": name})
    _log(message)


def _find_file(root: str, name: str) -> Optional[str]:
    for dirpath, _dirs, files in os.walk(root):
        if name in files:
            return os.path.join(dirpath, name)
    return None


def _cache_bust(url: str) -> str:
    """Append a timestamp query so GitHub's raw CDN can't hand back a stale copy.
    headcrab.sh is fetched from raw.githubusercontent.com, which caches for a few
    minutes — without this a client fix can run an out-of-date headcrab that pins
    the wrong client version. Mirrors how ACELLA always fetches the current
    headcrab (headcrab.sh?t=<timestamp>)."""
    try:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}t={int(time.time())}"
    except Exception:
        return url


def _download(url: str, dest: str, sha256: str = "") -> bool:
    """Download `url` to `dest` over HTTPS only, optionally verifying a sha256.

    This function feeds engine binaries, a kernel module, and .so files that are
    then executed as root, so the transport must be trustworthy:
      * HTTPS only, including across redirects. httpx follows redirects blindly,
        so a compromised or MITM'd host could 302 to http:// and downgrade the
        whole transfer. Reject any non-https hop.
      * If a sha256 is known, the file must match it or it is discarded. This is
        the difference between "we fetched a file" and "we fetched the file we
        expected".
    """
    from .httpc import ensure_http_client
    if not str(url).lower().startswith("https://"):
        _log(f"refusing non-HTTPS download: {url}")
        return False
    h = __import__("hashlib").sha256() if sha256 else None
    try:
        client = ensure_http_client("SLSsteam: engine download")
        with client.stream("GET", url, follow_redirects=True, timeout=120) as resp:
            # Guard every redirect hop, not just the first URL.
            for r in list(getattr(resp, "history", []) or []) + [resp]:
                hop = str(r.url)
                if not hop.lower().startswith("https://"):
                    _log(f"refusing redirect to non-HTTPS: {hop}")
                    return False
            resp.raise_for_status()
            total = int(resp.headers.get("Content-Length", "0") or "0")
            read = 0
            with open(dest, "wb") as fh:
                for chunk in resp.iter_bytes():
                    if not chunk:
                        continue
                    fh.write(chunk)
                    if h is not None:
                        h.update(chunk)
                    read += len(chunk)
                    if total:
                        # Clamp: a gzipped response reports a compressed
                        # Content-Length while iter_bytes yields decompressed
                        # bytes, so read can exceed total (was showing >100%).
                        _set_install({"percent": min(100, int(read / total * 100))})
        if os.path.getsize(dest) <= 0:
            return False
        if h is not None:
            got = h.hexdigest()
            if got.lower() != sha256.lower():
                _log(f"sha256 mismatch: expected {sha256[:16]}…, got {got[:16]}… — discarding")
                try:
                    os.remove(dest)
                except Exception:
                    pass
                return False
            _log("sha256 verified")
        return True
    except Exception as exc:
        _log(f"download failed: {exc}")
        try:
            if os.path.exists(dest):
                os.remove(dest)
        except Exception:
            pass
        return False


def _extract_archive(archive: str, dest: str) -> bool:
    os.makedirs(dest, exist_ok=True)
    env = _rich_env()
    attempts = [
        ["7z", "x", archive, f"-o{dest}", "-y"],
        ["7za", "x", archive, f"-o{dest}", "-y"],
        ["7zr", "x", archive, f"-o{dest}", "-y"],
        ["bsdtar", "-xf", archive, "-C", dest],
    ]
    try:
        bz = defaults_path(os.path.join("bin", "7zz"))
        if os.path.isfile(bz):
            try:
                os.chmod(bz, 0o755)
            except Exception:
                pass
            attempts.insert(0, [bz, "x", archive, f"-o{dest}", "-y"])
    except Exception:
        pass
    for cmd in attempts:
        if not shutil.which(cmd[0]):
            continue
        try:
            subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)
        except Exception as exc:
            _log(f"{cmd[0]} extract error: {exc}")
            continue
        if _find_file(dest, "SLSsteam.so"):
            _log(f"extracted with {cmd[0]}")
            return True
    # Pure-Python fallback so extraction never depends on a missing system tool.
    from .utils import is_safe_path as _within

    try:
        import py7zr
        with py7zr.SevenZipFile(archive, "r") as zf:
            # py7zr has no per-member extract API, so vet the name list first
            # and refuse the whole archive if any member escapes `dest`.
            names = list(zf.getnames() or [])
            bad = [n for n in names if os.path.isabs(n) or not _within(dest, n)]
            if bad:
                _log(f"refusing 7z archive: {len(bad)} entry(s) escape the destination")
                return False
            zf.extractall(path=dest)
        if _find_file(dest, "SLSsteam.so"):
            _log("extracted with py7zr (fallback)")
            return True
    except Exception as exc:
        _log(f"py7zr fallback failed: {exc}")
    return _find_file(dest, "SLSsteam.so") is not None


def _place_libraries(extract_root: str) -> bool:
    """Copy the extracted bin/* into the SLSsteam dir (native or Flatpak)."""
    so = _find_file(extract_root, "SLSsteam.so")
    if not so:
        return False
    bin_dir = os.path.dirname(so)
    target = lib_dir()
    try:
        os.makedirs(target, exist_ok=True)
        for entry in os.listdir(bin_dir):
            src = os.path.join(bin_dir, entry)
            dst = os.path.join(target, entry)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            else:
                shutil.copy2(src, dst)
                # Guarantee helpers stay executable — `pattern-refresh` (no
                # extension) otherwise reads as "not installed" via os.access.
                if (entry.endswith(".so") or entry.endswith(".sh")
                        or "pattern-refresh" in entry or entry in ("steam", "library-inject")):
                    try:
                        os.chmod(dst, 0o755)
                    except Exception:
                        pass
        _chown_to_user(target)
        _log(f"placed SLSsteam libraries in {target} (owned by {_decky_user()})")
        return True
    except Exception as exc:
        _log(f"failed to place libraries: {exc}")
        return False


def _run_setup_script(extract_root: str) -> int:
    """Run SLSsteam's own setup.sh (creates .desktop launch wrappers for
    injection). Dependency-light — no apt/sudo. Best-effort."""
    setup = _find_file(extract_root, "setup.sh")
    if not setup:
        _log("setup.sh not found in archive; skipping wrapper install")
        return -1
    mode = "flatpak-install" if _is_flatpak_steam() else "install"
    try:
        # Decky runs the backend as root, but setup.sh deliberately runs as the
        # desktop user. tempfile.mkdtemp() creates a root-owned 0700 directory,
        # so without transferring the extracted tree first bash exits 126 before
        # it can even read setup.sh.
        _chown_to_user(extract_root)
        proc = subprocess.run(
            _wrap_as_user(["bash", setup, mode]),
            cwd=os.path.dirname(setup),
            env=_rich_env(),
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=180,
        )
        for ln in (proc.stdout or "").splitlines():
            _log(ln)
        if proc.returncode != 0 and proc.stderr:
            _log(f"setup.sh stderr: {proc.stderr.strip()[:400]}")
        return proc.returncode
    except Exception as exc:
        _log(f"setup.sh failed: {exc}")
        return -1


def _fetch_headcrab_for_desktop() -> None:
    """Download the latest official h3adcr-b to the config tools dir so the user
    can run the full Deck/gamemode setup from Desktop Mode if injection needs it."""
    try:
        dest_dir = os.path.join(config_dir(), "tools")
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, "headcrab.sh")
        if _download(_cache_bust(HEADCRAB_RAW_URL), dest):
            os.chmod(dest, 0o755)
            _log(f"downloaded latest h3adcr-b to {dest}")
    except Exception as exc:
        _log(f"headcrab fetch skipped: {exc}")


def _run_install() -> None:
    import tempfile
    _INSTALL_LOG.clear()
    _set_install({"status": "running", "stage": "preflight", "error": "", "log": "", "percent": 0,
                  "startedAt": time.time()})
    tmp = tempfile.mkdtemp(prefix="slssteam_")
    try:
        # Clear known conflicts first (Millennium holds Steam's CEF port closed;
        # an Arch system slssteam pkg shadows our .so). Best-effort, never fata…12181 tokens truncated…        _chown_to_user(cfg)
            logger.log("SLSsteam: stripped headcrab lines from steam.cfg (kept other content)")
        else:
            os.remove(cfg)
            logger.log("SLSsteam: removed steam.cfg update block (no other content)")
        return True
    except Exception as exc:
        logger.warn(f"SLSsteam: clean steam.cfg failed: {exc}")
    return False


def _write_update_block(cfg_path: str) -> None:
    """(Re)write the steam.cfg BootStrapperInhibitAll block, owned by the user."""
    try:
        with open(cfg_path, "w", encoding="utf-8") as fh:
            fh.write(_STEAM_CFG)
        try:
            from .utils import chown_to_user as _c
            _c(cfg_path, recursive=False)
        except Exception:
            pass
    except Exception as exc:
        logger.warn(f"SLSsteam: could not write steam.cfg: {exc}")


def no_internet_fix_begin(appid) -> Dict[str, Any]:
    """OST-style "no internet" fix. The steam.cfg BootStrapperInhibitAll block the
    client fix installs puts Steam in a bootstrapper-inhibited state where content
    updates fail with "no internet connection". When the toggle is on, strip that
    block so a pinned build can download, then restore it in the background once
    the download is under way — so the Steam client can't self-update past the
    headcrab-compatible build while the block is off. No-op if the toggle is off,
    there's no steam root, or the present steam.cfg isn't ours."""
    try:
        from . import settings as _s
        if not _s.get_no_internet_fix():
            return {"success": True, "stripped": False, "reason": "toggle off"}
    except Exception:
        pass
    try:
        _root, sh = _steam_root_and_sh()
    except Exception:
        sh = None
    if not sh:
        return {"success": True, "stripped": False, "reason": "no steam root"}
    cfg = os.path.join(os.path.dirname(sh), "steam.cfg")
    try:
        if not os.path.isfile(cfg):
            return {"success": True, "stripped": False, "reason": "no block present"}
        with open(cfg, "r", encoding="utf-8", errors="ignore") as fh:
            if "BootStrapperInhibitAll" not in fh.read():
                return {"success": True, "stripped": False, "reason": "not our block"}
        os.remove(cfg)
        logger.log(f"no-internet-fix: removed steam.cfg block so app {appid} can download")
    except Exception as exc:
        return {"success": False, "error": str(exc)}

    def _watch_and_restore():
        import time as _t
        from . import steam as _steam
        deadline = _t.time() + 150
        while _t.time() < deadline:
            _t.sleep(4)
            try:
                d = _steam.app_download_complete(int(appid))
                flags = int(d.get("stateFlags", 0) or 0)
                # Downloading(0x100000) / Staging(0x200000) / Committing(0x400000)
                # or fully complete → the update is under way; safe to restore the
                # block (an in-progress content download isn't stopped by it).
                if d.get("complete") or (flags & 0x100000) or (flags & 0x200000) or (flags & 0x400000):
                    break
            except Exception:
                pass
        _write_update_block(cfg)
        try:
            logger.log("no-internet-fix: restored steam.cfg block")
        except Exception:
            pass

    try:
        threading.Thread(target=_watch_and_restore, daemon=True).start()
        return {"success": True, "stripped": True, "watching": True}
    except Exception:
        # Never leave the block off if we couldn't arm the watcher.
        _write_update_block(cfg)
        return {"success": True, "stripped": True, "watching": False}


def full_uninstall_cleanup() -> Dict[str, Any]:
    """Complete removal of everything SLSsteam-related (plugin uninstall).

    Removes: injection (hooks/steam.sh/steam.cfg/desktop launchers), the moon
    (~/.local/share/SLSsteam), all moon data (~/.config/SLSsteam — config,
    ManifestStore, depot-key cache), the stplug-in luas, headcrab leftovers, and
    the appmanifest + installed files of every game ADDED via SLSsteam.

    SAFETY: only games in AdditionalApps / everAdded are deleted — never a
    legit-owned Steam game. Runs on _uninstall (a deliberate removal; Decky uses
    _unload, not _uninstall, for updates/reloads, so this won't fire on update)."""
    report = {"deactivated": False, "removedPaths": [], "removedGames": [], "errors": []}

    # 1) Injection off + Steam restored to normal.
    try:
        deactivate_injection()
        report["deactivated"] = True
    except Exception as e:
        report["errors"].append("deactivate: %s" % e)

    # 2) Our appids — read BEFORE deleting the config. Union of the live
    #    AdditionalApps and the persisted everAdded history.
    ours = set()
    try:
        for a in read_additional_apps():
            try:
                ours.add(int(a))
            except Exception:
                pass
    except Exception:
        pass
    try:
        from .settings import get_ever_added
        for a in get_ever_added():
            ours.add(int(a))
    except Exception:
        pass

    # 3) Remove our games (appmanifest + installed files). Never touches games
    #    that aren't in our list.
    try:
        from . import steam as _steam
        for appid in sorted(ours):
            try:
                r = _steam.remove_added_game(appid)
                if r.get("removed"):
                    report["removedGames"].append(r)
            except Exception as e:
                report["errors"].append("game %s: %s" % (appid, e))
    except Exception as e:
        report["errors"].append("games: %s" % e)

    # 4) Remove SLSsteam infrastructure + moon data + luas + headcrab leftovers.
    home = _home()
    _root, sh = _steam_root_and_sh()
    steam_root = os.path.dirname(sh) if sh else None
    targets = [
        os.path.join(home, ".local", "share", "SLSsteam"),
        os.path.join(home, ".config", "SLSsteam"),
        os.path.join(home, ".headcrab"),
    ]
    if steam_root:
        targets.append(os.path.join(steam_root, "config", "stplug-in"))
        targets.append(os.path.join(steam_root, "steam.sh.slsorig"))
        targets.append(os.path.join(steam_root, "client.sh"))
    for p in targets:
        try:
            if os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)
                report["removedPaths"].append(p)
            elif os.path.isfile(p):
                os.remove(p)
                report["removedPaths"].append(p)
        except Exception as e:
            report["errors"].append("%s: %s" % (p, e))

    try:
        _log("Full uninstall cleanup: %d path(s), %d game(s) removed"
             % (len(report["removedPaths"]), len(report["removedGames"])))
    except Exception:
        pass
    return {"success": True, "report": report}


def deactivate_injection() -> Dict[str, Any]:
    """Full off-switch: remove the gamescope hook, restore a pristine steam.sh
    (ours OR headcrab's), and drop the update-blocking steam.cfg."""
    try:
        remove_gamescope_hook()
        restored = _restore_steam_sh()
        _remove_update_block()
        # Also un-patch any *steam*.desktop launchers so the Steam icon never
        # points at a removed path/steam wrapper.
        try:
            _restore_desktop_launchers()
        except Exception:
            pass
        return {"success": True, "restored": restored}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def wrapper_active() -> bool:
    _root, sh = _steam_root_and_sh()
    if not sh:
        return False
    try:
        with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
            return _WRAPPER_MARK in fh.read()
    except Exception:
        return False


# ── diagnostics (why isn't injection working?) ──────────────────────────────
def _owner_of(path: str) -> str:
    try:
        import pwd
        st = os.stat(path)
        try:
            name = pwd.getpwuid(st.st_uid).pw_name
        except Exception:
            name = str(st.st_uid)
        return f"{name} {oct(st.st_mode)[-3:]}"
    except Exception:
        return "?"


def _config_scalar(text: str, key: str) -> str:
    m = re.search(rf"^{re.escape(key)}[ \t]*:[ \t]*(\S+)", text or "", re.MULTILINE)
    return m.group(1) if m else "(unset)"


# ── slsteam-moon achievements toggle (config.yaml `Achievements:`) ────────────
# moon fetches the real achievement schema live by impersonating an owner; this
# flag (default true in moon) turns that behaviour on/off. Writing it on stock
# SLSsteam is harmless (the key is simply ignored).
_TRUE_WORDS = {"true", "1", "yes", "on"}


def _get_moon_bool(key: str, default: bool) -> Dict[str, Any]:
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found", "enabled": default}
    enabled = default
    present = False
    for ln in lines:
        m = re.match(rf"^{re.escape(key)}[ \t]*:[ \t]*(\S+)", ln)
        if m:
            enabled = m.group(1).strip().strip('"').lower() in _TRUE_WORDS
            present = True
            break
    return {"success": True, "enabled": enabled, "present": present}


def _set_moon_bool(key: str, enabled: bool) -> Dict[str, Any]:
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    newval = "yes" if enabled else "no"
    found = False
    for i, ln in enumerate(lines):
        if re.match(rf"^{re.escape(key)}[ \t]*:", ln):
            lines[i] = f"{key}: {newval}"
            found = True
            break
    if not found:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(f"{key}: {newval}")
    ok = _write_config_lines(lines)
    return {"success": ok, "enabled": enabled}


def get_auto_update_apps() -> Dict[str, Any]:
    """Moon defaults to updating every managed app unless individually pinned."""
    return _get_moon_bool("AutoUpdateApps", True)


def set_auto_update_apps(enabled: bool) -> Dict[str, Any]:
    return _set_moon_bool("AutoUpdateApps", enabled)


def get_manifest_donation() -> Dict[str, Any]:
    """Read Donate.Enabled without disturbing the rest of Moon's Donate map."""
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found", "enabled": True}
    enabled = True
    present = False
    in_donate = False
    for ln in lines:
        if re.match(r"^Donate[ \t]*:", ln):
            in_donate = True
            continue
        if in_donate and ln.strip() and not ln.startswith((" ", "\t", "#")):
            break
        if in_donate:
            m = re.match(r"^[ \t]+Enabled[ \t]*:[ \t]*(\S+)", ln)
            if m:
                enabled = m.group(1).strip().strip('"').lower() in _TRUE_WORDS
                present = True
                break
    return {"success": True, "enabled": enabled, "present": present}


def set_manifest_donation(enabled: bool) -> Dict[str, Any]:
    """Change only Donate.Enabled, preserving URL, limits, and user comments."""
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    newval = "yes" if enabled else "no"
    donate_at = None
    end = len(lines)
    for i, ln in enumerate(lines):
        if re.match(r"^Donate[ \t]*:", ln):
            donate_at = i
            for j in range(i + 1, len(lines)):
                if lines[j].strip() and not lines[j].startswith((" ", "\t", "#")):
                    end = j
                    break
            for j in range(i + 1, end):
                if re.match(r"^[ \t]+Enabled[ \t]*:", lines[j]):
                    lines[j] = f"  Enabled: {newval}"
                    ok = _write_config_lines(lines)
                    return {"success": ok, "enabled": enabled}
            lines.insert(i + 1, f"  Enabled: {newval}")
            ok = _write_config_lines(lines)
            return {"success": ok, "enabled": enabled}
    if lines and lines[-1].strip() != "":
        lines.append("")
    lines.extend(["Donate:", f"  Enabled: {newval}"])
    ok = _write_config_lines(lines)
    return {"success": ok, "enabled": enabled}


def get_achievements() -> Dict[str, Any]:
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found", "enabled": True}
    enabled = True  # moon default when the key is absent
    present = False
    for ln in lines:
        m = re.match(r"^Achievements[ \t]*:[ \t]*(\S+)", ln)
        if m:
            enabled = m.group(1).strip().strip('"').lower() in _TRUE_WORDS
            present = True
            break
    supported = False
    try:
        supported = _pin_key_supported()  # moon-only feature detection
    except Exception:
        supported = False
    return {"success": True, "enabled": enabled, "present": present, "moon": supported}


def set_achievements(enabled: bool) -> Dict[str, Any]:
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    newval = "true" if enabled else "false"
    found = False
    for i, ln in enumerate(lines):
        if re.match(r"^Achievements[ \t]*:", ln):
            lines[i] = f"Achievements: {newval}"
            found = True
            break
    if not found:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(f"Achievements: {newval}")
    ok = _write_config_lines(lines)
    return {"success": ok, "enabled": enabled}


def get_diagnostics() -> Dict[str, Any]:
    home = _home()
    os_info = {}
    try:
        for p in ("/etc/os-release", "/usr/lib/os-release"):
            if os.path.isfile(p):
                with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                    for line in fh:
                        if "=" in line:
                            k, v = line.strip().split("=", 1)
                            os_info[k] = v.strip('"\'')
                break
    except Exception:
        pass

    out: Dict[str, Any] = {
        "success": True,
        "home": home,
        "user": _decky_user(),
        "runningAsRoot": _is_root(),
        "flatpak": _is_flatpak_steam(),
        "osRelease": os_info,
        "steamOSChannel": os_info.get("VARIANT_ID") or os_info.get("BUILD_ID") or os_info.get("ID") or "unknown",
    }

    # SLSsteam libraries
    ld = lib_dir()
    lib_files = {}
    try:
        if os.path.isdir(ld):
            for name in sorted(os.listdir(ld)):
                p = os.path.join(ld, name)
                if os.path.isfile(p):
                    lib_files[name] = {"size": os.path.getsize(p), "owner": _owner_of(p)}
    except Exception:
        pass
    out["libDir"] = ld
    out["libFiles"] = lib_files
    out["hasSLSsteamSo"] = "SLSsteam.so" in lib_files
    out["hasLibraryInject"] = "library-inject.so" in lib_files

    # config.yaml SLSsteam actually reads
    cfg = config_path()
    text = ""
    try:
        if os.path.isfile(cfg):
            with open(cfg, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
    except Exception:
        pass
    out["configPath"] = cfg
    out["configExists"] = os.path.isfile(cfg)
    out["configOwner"] = _owner_of(cfg) if os.path.isfile(cfg) else "-"
    out["additionalApps"] = read_additional_apps()
    out["safeMode"] = _config_scalar(text, "SafeMode")
    out["api"] = _config_scalar(text, "API")
    out["useWhitelist"] = _config_scalar(text, "UseWhitelist")

    # steam.sh launch wrapper
    root, sh = _steam_root_and_sh()
    out["steamRoot"] = root or "(not found)"
    out["steamShPath"] = sh or "(not found)"
    out["steamShIsSymlinkTarget"] = sh
    wrapper = False
    head = ""
    if sh:
        try:
            with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
                head = fh.read(600)
            wrapper = _WRAPPER_MARK in head
        except Exception:
            pass
        out["backupExists"] = os.path.exists(os.path.join(os.path.dirname(sh), "steam.sh.slsorig"))
        cfgp = os.path.join(os.path.dirname(sh), "steam.cfg")
        out["steamCfgExists"] = os.path.exists(cfgp)
    out["steamShWrapped"] = wrapper
    out["steamShHead"] = head[:280]

    # candidate steam.sh files across all known roots (to spot a wrong-path patch)
    cands = []
    for r in (
        os.path.join(home, ".steam", "steam", "steam.sh"),
        os.path.join(home, ".local", "share", "Steam", "steam.sh"),
        os.path.join(home, ".steam", "root", "steam.sh"),
        os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam", "steam.sh"),
    ):
        if os.path.isfile(os.path.realpath(r)):
            real = os.path.realpath(r)
            patched = False
            try:
                with open(real, "r", encoding="utf-8", errors="ignore") as fh:
                    patched = _WRAPPER_MARK in fh.read(600)
            except Exception:
                pass
            cands.append({"path": r, "real": real, "patched": patched})
    out["steamShCandidates"] = cands

    # h3adcr-b client-fix run log (why the downgrade did/didn't happen)
    hlog = os.path.join(config_dir(), "tools", "headcrab-run.log")
    out["headcrabRunLog"] = hlog
    out["headcrabRunLogExists"] = os.path.isfile(hlog)
    try:
        if os.path.isfile(hlog):
            with open(hlog, "r", encoding="utf-8", errors="ignore") as fh:
                out["headcrabRunTail"] = fh.read().splitlines()[-18:]
    except Exception as exc:
        out["headcrabRunTail"] = [f"(read error: {exc})"]

    # SLSsteam's own runtime log — the ground truth for "did it load + inject?"
    slog = os.path.join(_home(), ".SLSsteam.log")
    out["slssteamLog"] = slog
    out["slssteamLogExists"] = os.path.isfile(slog)
    try:
        if os.path.isfile(slog):
            import datetime as _dt
            out["slssteamLogAgeSec"] = int(time.time() - os.path.getmtime(slog))
            out["slssteamLogModified"] = _dt.datetime.fromtimestamp(
                os.path.getmtime(slog)).strftime("%Y-%m-%d %H:%M:%S")
            with open(slog, "r", encoding="utf-8", errors="ignore") as fh:
                tail = fh.read().splitlines()[-14:]
            out["slssteamLogTail"] = tail
            joined = "\n".join(tail).lower()
            out["slssteamLoaded"] = ("loaded" in joined or "unlocked" in joined or "added" in joined)
            out["slssteamUnlockedApps"] = [n for n in re.findall(r"unlocked\s+(\d+)", "\n".join(tail), re.IGNORECASE)]
        else:
            out["slssteamLogTail"] = ["(no ~/.SLSsteam.log — SLSsteam has not loaded)"]
            out["slssteamLoaded"] = False
    except Exception as exc:
        out["slssteamLogTail"] = [f"(log read error: {exc})"]

    # Engine: which SLSsteam.so is on disk — the depot-key fork (slsteam-moon,
    # which alone supports ManifestPins/version pinning + depot-key decryption)
    # or stock upstream SLSsteam. Plus whether it's actually live this session.
    try:
        eng = installed_lib_is_moon() or {}
    except Exception:
        eng = {}
    out["engineMoon"] = bool(eng.get("moon"))
    out["engine"] = ("slsteam-moon" if eng.get("moon")
                     else ("SLSsteam (stock)" if eng.get("installed") or out.get("hasSLSsteamSo")
                           else "(none installed)"))
    out["pinSupported"] = bool(eng.get("moon"))
    try:
        out["injectionLive"] = _injection_functional()
    except Exception:
        out["injectionLive"] = None

    # gamescope Game Mode hook (the persistent, rootless injection)
    out["gamescopeBase"] = _gamescope_base() or "(none)"
    gh = _gamescope_hook_file()
    out["gamescopeHook"] = gh or "(no gamescope session)"
    out["gamescopeHookActive"] = gamescope_hook_active()
    pw = _path_wrapper()
    out["pathWrapper"] = pw
    out["pathWrapperExists"] = os.path.isfile(pw)

    # steamclient.so (SLSsteam must match a supported build)
    sc = []
    for r in (
        os.path.join(home, ".steam", "steam", "ubuntu12_64", "steamclient.so"),
        os.path.join(home, ".local", "share", "Steam", "ubuntu12_64", "steamclient.so"),
    ):
        real = os.path.realpath(r)
        if os.path.isfile(real):
            sc.append(real)
    out["steamclientSo"] = sc or ["(not found)"]

    return out


# ── Steam-client compatibility fix via h3adcr-b (shimmed for SteamOS) ────────
# SLSsteam only hooks specific steamclient.so builds; when it logs "Failed to
# find all patterns! Aborting", the live Steam client is newer than this
# SLSsteam release supports. h3adcr-b fixes that by pinning/downgrading the
# client to a compatible build. It normally dies on SteamOS because it calls
# ``sudo pacman``/``wget``/``7z`` (absent on the immutable rootfs → exit 127).
# We run it as the desktop user with tiny wget→curl and 7z→bsdtar/py7zr shims on
# PATH, so the real downloads/extraction work and the pacman step just no-ops.
_WGET_SHIM = """#!/bin/sh
out=""; url=""
while [ $# -gt 0 ]; do
  case "$1" in
    -O) out="$2"; shift 2 ;;
    -O*) out="${1#-O}"; shift ;;
    --output-document=*) out="${1#*=}"; shift ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
[ -z "$url" ] && exit 1
if [ -n "$out" ]; then exec curl -fsSL --retry 3 -o "$out" "$url"; fi
exec curl -fsSL --retry 3 -O "$url"
"""
_SEVENZ_SHIM = """#!/bin/sh
[ "$1" = "x" ] && shift
archive=""; outdir="."
for a in "$@"; do
  case "$a" in
    -o*) outdir="${a#-o}" ;;
    -*) ;;
    *) [ -z "$archive" ] && archive="$a" ;;
  esac
done
mkdir -p "$outdir"
if command -v bsdtar >/dev/null 2>&1; then exec bsdtar -xf "$archive" -C "$outdir"; fi
exec python3 -c "import sys,py7zr; py7zr.SevenZipFile(sys.argv[1],'r').extractall(sys.argv[2])" "$archive" "$outdir"
"""


_PRIVILEGE_SHIM = """#!/bin/sh
# SLSDeck's Decky backend deliberately runs Headcrab as the desktop user.  A
# first install has no terminal in which sudo can request a password, and
# pkexec may open a prompt behind Game Mode.  Headcrab treats its package-manager
# step as optional because SLSDeck supplies the required user-space tools below.
echo "SLSDeck: skipped interactive privilege command: $*" >&2
exit 1
"""


def _write_shims(shim_dir: str) -> None:
    os.makedirs(shim_dir, exist_ok=True)
    wget = os.path.join(shim_dir, "wget")
    with open(wget, "w", encoding="utf-8") as fh:
        fh.write(_WGET_SHIM)
    os.chmod(wget, 0o755)
    # CachyOS is detected as Arch by Headcrab, which otherwise calls real
    # `sudo pacman` during a no-stdin Decky job.  Always shadow interactive
    # privilege frontends; installation itself is intentionally rootless.
    for name in ("sudo", "pkexec"):
        p = os.path.join(shim_dir, name)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(_PRIVILEGE_SHIM)
        os.chmod(p, 0o755)
    if not any(shutil.which(n) for n in ("7z", "7za", "7zr")):
        for name in ("7z", "7za"):
            p = os.path.join(shim_dir, name)
            with open(p, "w", encoding="utf-8") as fh:
                fh.write(_SEVENZ_SHIM)
            os.chmod(p, 0o755)


def _run_headcrab_shimmed() -> bool:
    """Download + run the latest h3adcr-b with wget/7z shims, as the desktop
    user. Returns True if SLSsteam ends up installed. Streams to the install log."""
    import tempfile
    tmp = tempfile.mkdtemp(prefix="headcrab_")
    script = os.path.join(tmp, "headcrab.sh")

    # ALWAYS fetch the LATEST h3adcr-b from upstream (its compatible-client build
    # tracks the current Steam client, so a stale bundled copy is exactly what
    # breaks the downgrade after a Steam update). Fall back to the bundled copy
    # only if the network fetch fails.
    bundled = defaults_path(os.path.join("slssteam", "headcrab.sh"))
    got = False
    try:
        if _download(_cache_bust(HEADCRAB_RAW_URL), script) and os.path.getsize(script) > 500:
            got = True
            _log("Fetched latest h3adcr-b from upstream")
    except Exception as exc:
        _log(f"headcrab network fetch failed ({exc}); falling back to bundled")
    if not got:
        if os.path.isfile(bundled):
            shutil.copy2(bundled, script)
            _log("Using bundled h3adcr-b (network unavailable)")
        else:
            _log("Could not obtain h3adcr-b (no network, no bundled copy)")
            return False

    # Headcrab is a client compatibility tool, but its upstream script also
    # downloads AceSLS's stock SLSsteam and copies it over the installed engine
    # every time it starts Steam.  Stock SLSsteam has no depot-key support, so
    # moon-added games then become 0 B downloads.  Make sure moon is available
    # before touching the client and override only that unrelated copy step.
    moon_before = ensure_moon_engine()
    if not moon_before.get("success"):
        _log(f"Refusing client repair without slsteam-moon: {moon_before.get('error')}")
        return False
    try:
        with open(script, "r", encoding="utf-8", errors="ignore") as fh:
            script_text = fh.read()
        marker = "\n    main\n"
        pos = script_text.rfind(marker)
        if pos < 0:
            marker = "\nmain\n"
            pos = script_text.rfind(marker)
        if pos < 0:
            _log("Refusing unrecognised Headcrab script: final main call not found")
            return False
        preserve = (
            "\n# SLSDeck: Headcrab may repair the client, but must not replace moon.\n"
            "copySLSsteam(){\n"
            "    echo 'SLSDeck: preserving installed slsteam-moon engine'\n"
            "}\n"
        )
        script_text = script_text[:pos] + preserve + script_text[pos:]
        with open(script, "w", encoding="utf-8") as fh:
            fh.write(script_text)
        _log("Patched Headcrab to preserve slsteam-moon (stock engine copy disabled)")
    except Exception as exc:
        _log(f"Could not make Headcrab moon-safe: {exc}")
        return False
    os.chmod(script, 0o755)
    # Cache the compatible-client version straight from the script we just fetched,
    # so our "client matches?" diagnostic uses the real target, not the stale const.
    try:
        with open(script, "r", encoding="utf-8", errors="ignore") as _sfh:
            _note_headcrab_compat_from_script(_sfh.read())
    except Exception:
        pass

    shim = os.path.join(tmp, "bin")
    _write_shims(shim)

    # As with the moon setup archive, this directory was made by Decky's root
    # backend with mode 0700 and is then consumed (and written to) by `deck`.
    # Give the complete staging tree to that user only after all shims exist.
    _chown_to_user(tmp)

    # Our injection writes a steam.cfg with BootStrapperInhibitAll=enable to stop
    # Steam overwriting the wrapper — but that ALSO blocks client updates, which
    # is exactly how headcrab downgrades. Remove it so the downgrade can run.
    #
    # This USED to rely on headcrab re-creating it. It does not always get there:
    # if headcrab fails, is killed by the stall watchdog below, or the network
    # drops, the block stays gone. Steam's background updater polls every couple
    # of minutes, so it then pulls a full ~170 MB client update, which changes the
    # steamclient.so hash, which makes SafeMode disable SLSsteam, which makes the
    # plugin think injection broke and offer to run this fix again -- a loop that
    # re-downloads the Steam client indefinitely. So we restore it ourselves in a
    # finally, and treat headcrab re-creating it as a bonus rather than a promise.
    _cfg_suspended: List[Tuple[str, str]] = []
    try:
        for _cfg in _steam_cfg_paths():
            try:
                with open(_cfg, "r", encoding="utf-8", errors="ignore") as _fh:
                    _content = _fh.read()
                if not _HEADCRAB_CFG_RE.search(_content):
                    continue
                _custom = _HEADCRAB_CFG_RE.sub("", _content)
                _custom = re.sub(r"\n{3,}", "\n\n", _custom).strip()
                _cfg_suspended.append((_cfg, (_custom + "\n") if _custom else ""))
                os.remove(_cfg)
                _log(f"Temporarily removed stale Steam update block: {_cfg}")
            except Exception as exc:
                _log(f"Could not suspend Steam update block at {_cfg}: {exc}")
    except Exception as exc:
        _log(f"Could not enumerate stale steam.cfg files: {exc}")

    def _restore_update_block():
        """Put the update block back no matter how this function exits."""
        if not _cfg_suspended:
            return
        for _cfg_path, _custom in _cfg_suspended:
            try:
                # Headcrab may have recreated the active file. Normalize it as
                # well: preserve unrelated user settings, but never preserve an
                # old or duplicated BootStrapper directive.
                if os.path.isfile(_cfg_path):
                    with open(_cfg_path, "r", encoding="utf-8", errors="ignore") as fh:
                        _now = _HEADCRAB_CFG_RE.sub("", fh.read()).strip()
                    if _now:
                        _custom = _now + "\n"
                with open(_cfg_path, "w", encoding="utf-8") as fh:
                    fh.write(_custom + _STEAM_CFG)
                try:
                    from .utils import chown_to_user as _c
                    _c(_cfg_path, recursive=False)
                except Exception:
                    pass
                _log(f"Restored normalized Steam update block: {_cfg_path}")
            except Exception as exc:
                logger.warn(f"SLSsteam: could not restore steam.cfg at {_cfg_path}: {exc}")

    home = _home()
    base_path = f"{shim}:/usr/bin:/bin:/usr/local/bin:/sbin:/usr/sbin"
    if _is_root():
        cmd = ["sudo", "-u", _decky_user(), "env",
               f"HOME={home}", f"PATH={base_path}",
               f"XDG_DATA_HOME={home}/.local/share",
               f"XDG_CONFIG_HOME={home}/.config",
               "NONINTERACTIVE=1", "bash", script]
        run_env = dict(os.environ)
    else:
        cmd = ["bash", script]
        run_env = _rich_env()
        run_env["PATH"] = base_path
        run_env["NONINTERACTIVE"] = "1"

    runlog = os.path.join(config_dir(), "tools", "headcrab-run.log")
    try:
        os.makedirs(os.path.dirname(runlog), exist_ok=True)
    except Exception:
        pass
    lf = None
    try:
        lf = open(runlog, "w", encoding="utf-8")
        lf.write(f"cmd: {' '.join(cmd)}\nPATH: {run_env.get('PATH')}\nroot: {_is_root()}\n\n")
        lf.flush()
    except Exception:
        lf = None

    _log("Running h3adcr-b (client compatibility fix)… this can take a few minutes")
    rc = None
    try:
        proc = subprocess.Popen(
            cmd, cwd=tmp, env=run_env, stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
            start_new_session=True,
        )
        assert proc.stdout is not None
        # Watchdog: headcrab can stall silently (e.g. a network read that never
        # returns). In that case `for line in proc.stdout` blocks forever and the
        # install button spins with no end. A separate thread hard-kills the
        # process past the deadline regardless of whether anything was printed.
        timed_out = {"v": False}
        _HEADCRAB_TIMEOUT = 600  # 10 minute hard cap

        def _watchdog(p=proc, flag=timed_out):
            end = time.time() + _HEADCRAB_TIMEOUT
            while time.time() < end:
                if p.poll() is not None:
                    return
                time.sleep(2)
            if p.poll() is None:
                flag["v"] = True
                # Kill the whole session, not just bash.  A surviving pacman,
                # sudo or downloader child can inherit stdout and keep the
                # reader loop blocked forever after its parent is gone.
                import signal
                for sig in (signal.SIGTERM, signal.SIGKILL):
                    try:
                        os.killpg(p.pid, sig)
                    except Exception:
                        pass
                    try:
                        p.wait(timeout=5)
                        return
                    except Exception:
                        continue

        _wd = threading.Thread(target=_watchdog, daemon=True)
        _wd.start()
        try:
            for line in proc.stdout:
                ln = line.rstrip("\n")
                _log(ln)
                if lf:
                    lf.write(ln + "\n")
                    lf.flush()
        except Exception as read_exc:
            _log(f"h3adcr-b read error: {read_exc}")
        try:
            rc = proc.wait(timeout=30)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
            rc = -1
        if timed_out["v"]:
            _log("h3adcr-b timed out (10 min) — continuing without the client pin")
        _log(f"h3adcr-b exit code: {rc}")
        if lf:
            lf.write(f"[exit code: {rc}]\n")
    except Exception as exc:
        _log(f"h3adcr-b run error: {exc}")
        if lf:
            lf.write(f"[run error: {exc}]\n")
    finally:
        # Always re-arm the update block, whatever happened above. Leaving it off
        # lets Steam self-update within minutes and breaks injection for good.
        _restore_update_block()
        if lf:
            try:
                lf.close()
            except Exception:
                pass
        try:
            _chown_file_to_user(runlog)
        except Exception:
            pass
        try:
            shutil.rmtree(tmp, ignore_errors=True)
        except Exception:
            pass
    # An already-installed .so says nothing about whether this run succeeded.
    # Returning it here used to turn permission errors and failed downgrades into
    # a green "Done" state. The compatibility operation itself must exit cleanly.
    if rc != 0:
        return False
    installed_client = steam_client_version()
    compatible_client = headcrab_compatible_client()
    if installed_client and compatible_client and installed_client != compatible_client:
        _log("Client repair rejected: Steam client build "
             f"{installed_client} does not match Headcrab target {compatible_client}")
        return False
    final_engine = installed_lib_is_moon()
    if not final_engine.get("moon"):
        _log("Client repair rejected: final engine is not slsteam-moon")
        return False
    return True


def client_fix_needed() -> Dict[str, Any]:
    """Is the Steam client actually incompatible, or is this a no-op download?

    The client fix downgrades/re-pins the Steam client, which means Steam pulls a
    full ~170 MB client package. Running it when the current client already works
    is pure damage: minutes of downloading, and a window where the update block is
    off. SLSsteam tells us directly -- it hashes steamclient.so against a
    known-good list and, under SafeMode, refuses to load on a mismatch. So if its
    own log shows a clean load, the client is compatible and there is nothing to
    fix."""
    log_path = os.path.join(_home(), ".SLSsteam.log")
    if not os.path.isfile(log_path):
        return {"needed": False, "unknown": True,
                "reason": "SLSsteam load log is unavailable; no explicit failure was detected"}
    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as fh:
            text = fh.read()
    except Exception as exc:
        return {"needed": True, "reason": f"could not read SLSsteam log: {exc}"}
    # Only the most recent session matters.
    marker = "SLSsteam loading in steam"
    if marker in text:
        text = text[text.rfind(marker):]
    lowered = text.lower()
    current = steam_client_version()
    supported = headcrab_compatible_client()

    # "Loaded successfully" is DEFINITIVE: SLSsteam only reaches it after the
    # steamclient.so hash check, so the installed client is supported.
    #
    # Do not try to be cleverer than this. Matching failure keywords anywhere in
    # the log gives false positives, because SLSsteam echoes its whole config at
    # startup -- "[Info] SafeMode: 1" contains "safemode", and
    # "[Info] steamclient.so hash is <sha>" contains "hash". Either would have us
    # re-download the Steam client for no reason, which is the exact bug this
    # guard exists to prevent.
    if "loaded successfully" in lowered:
        return {"needed": False,
                "reason": "SLSsteam loaded successfully against the current client "
                          "(steamclient.so hash accepted) — no client change needed"}
    for bad in ("hash missmatch", "hash mismatch", "aborting", "refusing to load"):
        if bad in lowered:
            if current and supported and current == supported:
                return {
                    "needed": True,
                    "engineOnly": True,
                    "reason": "SLSsteam aborted, but Steam already matches Headcrab's "
                              "supported client build — repair the engine and launcher only",
                }
            return {"needed": True,
                    "reason": f"SLSsteam reported '{bad}' against the current client"}
    # Missing success text is not failure evidence. Newer Moon builds may change
    # or omit that exact sentence, rotate the log, or write through another user
    # home while injection remains fully functional. Only explicit abort/hash
    # markers above justify offering the destructive client repair.
    return {"needed": False, "unknown": True,
            "reason": "SLSsteam log has no explicit success or failure marker"}


def _gaming_mode_client_fix_entry(relaunch_desktop: bool = False) -> int:
    """Finish Headcrab outside Decky's Steam-owned process tree.

    In Gaming Mode Steam is the UI shell. Headcrab must stop it to replace the
    client, which also takes Decky and an ordinary plugin worker down. The user
    service running this entry survives that shell restart and restores the moon
    engine after Headcrab temporarily installs stock SLSsteam.
    """
    try:
        if not _run_headcrab_shimmed():
            return 1
        moon = ensure_moon_engine()
        if not moon.get("success"):
            _log(f"slsteam-moon restore failed: {moon.get('error')}")
            return 1
        ensure_config()
        activate_injection()
        _log("Gaming Mode client repair completed; the session may now reload Steam")
        return 0
    except Exception as exc:
        _log(f"Gaming Mode client repair failed: {exc}")
        return 1
    finally:
        if relaunch_desktop:
            try:
                subprocess.Popen(
                    ["steam"], env=_rich_env(), stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                _log("Restarted Steam after Desktop Mode client repair")
            except Exception as exc:
                _log(f"Could not restart Steam after Desktop Mode repair: {exc}")


def _detached_repair_active(unit: str) -> bool:
    """Whether the transient user service backing the UI's running state exists."""
    if not unit:
        return False
    try:
        import pwd
        pw = pwd.getpwnam(_decky_user())
        uid = pw.pw_uid
        cmd = [
            "sudo", "-u", pw.pw_name, "env",
            f"XDG_RUNTIME_DIR=/run/user/{uid}",
            f"DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{uid}/bus",
            "systemctl", "--user", "is-active", unit,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        return proc.returncode == 0 and (proc.stdout or "").strip() in ("active", "activating")
    except Exception:
        return False


def _start_engine_only_repair() -> Dict[str, Any]:
    """Repair moon + launch wrappers without letting Headcrab stop Steam."""
    def _worker():
        _INSTALL_LOG.clear()
        _set_install({"status": "running", "stage": "repairing-engine",
                      "startedAt": time.time(), "detached": False, "unit": ""})
        try:
            _log("Steam client already matches Headcrab; skipping the destructive client repair")
            # Headcrab may have left its bootstrap steam.sh behind from an older
            # failed attempt. Replace it with our known launcher immediately,
            # before a moon download or pattern refresh can delay recovery.
            act = activate_injection()
            if not act.get("success"):
                _set_install({"status": "failed", "success": False,
                              "error": act.get("error") or "launcher restoration failed"})
                return
            moon = refresh_moon_engine()
            if not moon.get("success"):
                _set_install({"status": "failed", "success": False,
                              "error": moon.get("error") or "slsteam-moon reinstall failed"})
                return
            # Re-assert after replacing the binary as well; idempotent.
            act = activate_injection()
            if not act.get("success"):
                _set_install({"status": "failed", "success": False,
                              "error": act.get("error") or "injection activation failed"})
                return
            patterns = refresh_patterns_now()
            if not patterns.get("success"):
                _set_install({
                    "status": "failed", "success": False, "installed": True,
                    "needsRestart": True,
                    "error": "The launcher was restored, but the latest slsteam-moon "
                             "still cannot match this Steam binary. Restart the Deck; "
                             "if it still aborts, upstream moon pattern coverage is required.",
                    "patternResult": patterns,
                })
                return
            _set_install({"status": "done", "success": True, "installed": True,
                          "needsRestart": True,
                          "message": "Engine and launcher repaired. Restart the Deck once to load them."})
            _log("Engine and launcher repaired — restart the Deck once to apply")
        except Exception as exc:
            _set_install({"status": "failed", "success": False, "error": str(exc)})

    threading.Thread(target=_worker, daemon=True).start()
    return {"success": True, "engineOnly": True,
            "message": "Repairing the engine without changing the Steam client."}


def _start_gaming_mode_client_fix() -> Dict[str, Any]:
    """Start repair in the user's systemd manager, independent of Steam/Decky."""
    if not _is_root() or not shutil.which("systemd-run"):
        return {"success": False, "error": "Gaming Mode user-service launcher unavailable"}
    try:
        import pwd
        import sys
        pw = pwd.getpwnam(_decky_user())
        uid = pw.pw_uid
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        unit = f"slsdeck-headcrab-repair-{int(time.time())}"
        # gamescope supervises and restarts Steam in Gaming Mode. Desktop Mode
        # has no such supervisor, so the repair service must relaunch it itself.
        gaming_mode = False
        try:
            probe = subprocess.run(["pgrep", "-fa", "gamescope-session"],
                                   capture_output=True, text=True, timeout=3)
            gaming_mode = probe.returncode == 0 and bool((probe.stdout or "").strip())
        except Exception:
            pass
        code = (
            "from py_modules.lt.slssteam import _gaming_mode_client_fix_entry; "
            f"raise SystemExit(_gaming_mode_client_fix_entry({not gaming_mode!r}))"
        )
        cmd = [
            "sudo", "-u", pw.pw_name, "env",
            f"HOME={pw.pw_dir}",
            f"XDG_RUNTIME_DIR=/run/user/{uid}",
            f"DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{uid}/bus",
            f"PYTHONPATH={project_root}",
            "systemd-run", "--user", f"--unit={unit}", "--collect",
            "--property=Type=exec", sys.executable, "-c", code,
        ]
        proc = subprocess.run(cmd, cwd=project_root, env=_rich_env(),
                              capture_output=True, text=True, timeout=20)
        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "systemd-run failed").strip()
            return {"success": False, "error": detail[:400]}
        _log("Gaming Mode repair handed to an independent user service")
        return {"success": True, "detached": True, "unit": unit,
                "mode": "gaming" if gaming_mode else "desktop"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def start_client_fix(force: bool = False) -> Dict[str, Any]:
    # Guard the heavy path: without this, enabling injection re-downloads the
    # whole Steam client even when the installed one is already supported.
    # Reconcile a previous transient service before honoring the in-memory lock.
    # Without this, a service which exited while Steam/Decky was restarting left
    # Repair permanently returning "A task is already running".
    get_install_status()
    chk = client_fix_needed()
    if not force:
        if not chk.get("needed"):
            logger.log(f"SLSsteam: skipping client fix — {chk.get('reason')}")
            return {"success": True, "skipped": True, "reason": chk.get("reason")}
    with _INSTALL_LOCK:
        if _INSTALL_STATE.get("status") == "running":
            return {"success": False, "error": "A task is already running"}
    # Re-pinning the client is a fresh attempt — let injection try again next boot.
    try:
        _reset_inject_failsafe()
    except Exception:
        pass
    _set_install({"status": "queued", "error": "", "log": "", "percent": 0})

    # Force means "repair despite the banner", not "downgrade a client which is
    # already exactly Headcrab's target". In that case Headcrab only replaces
    # steam.sh, stops Steam, and creates a bootstrap loop; refresh moon + wrapper.
    if chk.get("engineOnly"):
        return _start_engine_only_repair()

    # Headcrab deliberately stops Steam. In Gaming Mode that also destroys the
    # Decky worker which started it, so hand the operation to the user's systemd
    # manager first. The gamescope session owns restarting its Steam shell.
    detached = _start_gaming_mode_client_fix()
    if detached.get("success"):
        _set_install({"status": "running", "success": True,
                      "stage": "client-compatibility", "detached": True,
                      "message": "Repair continues across the Gaming Mode Steam restart.",
                      "unit": detached.get("unit"), "startedAt": time.time()})
        return detached
    _log(f"Independent Gaming Mode repair unavailable ({detached.get('error')}); using fallback")

    def _worker():
        _INSTALL_LOG.clear()
        _set_install({"status": "running", "error": "", "log": "",
                      "startedAt": time.time()})
        try:
            ok = _run_headcrab_shimmed()
            if not ok:
                _set_install({
                    "status": "failed",
                    "success": False,
                    "installed": bool(find_installed_lib()),
                    "error": "Steam client compatibility setup failed; see the install log",
                })
                return
            # headcrab installs stock AceSLS SLSsteam over whatever engine is
            # present, which silently downgrades slsteam-moon and kills depot-key
            # support. Put the fork back before declaring success.
            moon = {"changed": False}
            try:
                moon = ensure_moon_engine()
                if moon.get("changed"):
                    _log("Re-installed slsteam-moon (the client fix had replaced it "
                         "with stock SLSsteam, which cannot decrypt added games)")
                elif not moon.get("success"):
                    _log(f"WARNING: {moon.get('error')}")
            except Exception as mexc:
                _log(f"slsteam-moon re-assert failed: {mexc}")
            if not moon.get("success") or not installed_lib_is_moon().get("moon"):
                _set_install({
                    "status": "failed",
                    "success": False,
                    "installed": bool(find_installed_lib()),
                    "engineIsMoon": False,
                    "error": "Client repair finished, but slsteam-moon could not be verified; "
                             "stock SLSsteam was not accepted",
                })
                return
            ensure_config()
            installed = bool(find_installed_lib())
            injected = is_injected()
            _set_install({"status": "done", "success": bool(ok and installed),
                          "installed": installed, "injected": injected,
                          "clientFixed": True,
                          "moonRestored": bool(moon.get("changed")),
                          "engineIsMoon": installed_lib_is_moon().get("moon")})
            _log("Done — reboot the Deck, then check the SLSsteam log again.")
        except Exception as exc:
            _set_install({"status": "failed", "error": str(exc)})

    threading.Thread(target=_worker, daemon=True).start()
    return {"success": True}


# ── slsteam-moon (the SLSsteam FORK that reads depot keys from the .lua) ─────
# Stock AceSLS/SLSsteam only fakes ownership — it has NO depot-key support, so
# genuinely unowned games download but stay encrypted. slsteam-moon reads the
# depot decryption keys from config/stplug-in/<appid>.lua (which this plugin
# already writes), so added games actually decrypt and launch.
_MOON_MARKERS = (b"stplug-in", b"addappid", b"depotkey", b"ManifestStore")


def _detect_foreign_engine():
    """Best-effort: is a *different* depot-key engine (e.g. LumaDeck's lumalinux)
    already managing injection? If so the frontend edition defers to it instead of
    installing our own SLSsteam over the top."""
    home = _home()
    for p in (os.path.join(home, ".local", "share", "lumalinux"),
              os.path.join(home, ".steam", "steam", "keys.txt"),
              os.path.join(home, ".config", "lumalinux")):
        try:
            if os.path.exists(p):
                return True, "lumalinux"
        except Exception:
            pass
    try:
        _root, sh = _steam_root_and_sh()
        if sh and os.path.isfile(sh):
            with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
                if "lumalinux" in fh.read(6000).lower():
                    return True, "lumalinux"
    except Exception:
        pass
    return False, ""


def system_status() -> Dict[str, Any]:
    """One call for the frontend-edition onboarding: which engine (if any) is
    present, whether a foreign engine is managing injection, and whether
    CloudRedirect is installed — so Quick Install knows what to do vs defer."""
    eng = {}
    try:
        eng = installed_lib_is_moon() or {}
    except Exception:
        eng = {}
    engine = ("slsteam-moon" if eng.get("moon")
              else ("SLSsteam" if eng.get("installed") else "none"))
    foreign, foreign_name = _detect_foreign_engine()
    cr = False
    try:
        from . import cloudredirect
        cr = cloudredirect._installed()
    except Exception:
        cr = False
    injected = False
    try:
        injected = _injection_functional() if engine != "none" else False
    except Exception:
        injected = False
    return {"success": True, "engine": engine, "engineInstalled": engine != "none",
            "foreignEngine": bool(foreign), "foreignName": foreign_name,
            "cloudredirect": bool(cr), "injected": bool(injected)}


def disable_foreign_engines() -> Dict[str, Any]:
    """Called when Install is pressed: neutralise a non-moon engine so it can't
    fight moon's injection. Stock SLSsteam.so is overwritten by the moon install
    itself; a steam.sh-hook engine like lumalinux is disabled by renaming its
    deployed artifacts to *.slsdeck-disabled (reversible) — after which the moon
    install reclaims steam.sh, so the foreign hook no longer loads."""
    import time as _t
    home = _home()
    disabled: list = []
    notes: list = []
    foreign, name = _detect_foreign_engine()
    if foreign:
        for p in (os.path.join(home, ".local", "share", "lumalinux"),
                  os.path.join(home, ".config", "lumalinux"),
                  os.path.join(home, ".steam", "steam", "keys.txt"),
                  os.path.join(home, ".local", "share", "Steam", "keys.txt")):
            try:
                if os.path.exists(p):
                    tgt = p + ".slsdeck-disabled"
                    if os.path.exists(tgt):
                        tgt = f"{p}.slsdeck-disabled.{int(_t.time())}"
                    os.rename(p, tgt)
                    disabled.append(os.path.basename(p))
            except Exception as exc:
                notes.append(f"{os.path.basename(p)}: {exc}")
        if disabled:
            notes.append(f"{name}: disabled {len(disabled)} artifact(s); moon install reclaims steam.sh.")
        else:
            notes.append(f"{name} detected but no removable artifacts found.")
    try:
        eng = installed_lib_is_moon() or {}
        if eng.get("installed") and not eng.get("moon"):
            notes.append("stock SLSsteam present — the moon install replaces SLSsteam.so.")
    except Exception:
        pass
    return {"success": True, "foreign": bool(foreign), "foreignName": name,
            "disabled": disabled, "notes": notes}


def installed_lib_is_moon() -> Dict[str, Any]:
    """Is the SLSsteam.so on disk the slsteam-moon fork, or stock upstream?

    This matters more than anything else in the install: only the fork reads the
    depot keys out of config/stplug-in/<appid>.lua. Stock upstream has no depot
    key support at all, so an unowned game can never decrypt and Steam ends up
    reporting zero target depots.

    They are trivially distinguishable -- the fork's binary references the lua /
    ManifestStore paths it reads, upstream's does not."""
    lib = find_installed_lib()
    if not lib:
        return {"installed": False, "moon": False, "lib": "", "markers": []}
    try:
        with open(lib, "rb") as fh:
            blob = fh.read()
    except Exception as exc:
        return {"installed": True, "moon": False, "lib": lib, "error": str(exc)}
    hits = [m.decode() for m in _MOON_MARKERS if m in blob]
    return {"installed": True, "moon": bool(hits), "lib": lib, "markers": hits}


def _record_engine_version() -> None:
    """Record the currently-installed slsteam-moon release tag so the Updates tab
    can later tell when a newer engine ships. The install always pulls
    releases/latest, so the just-installed version IS the latest right now."""
    try:
        from . import settings as _s, ghrel as _g
        tag = _g.latest_tag("swwayps/slsteam-moon")
        if tag:
            _s.set_dep_version("engine", tag)
    except Exception:
        pass


def refresh_moon_engine() -> Dict[str, Any]:
    """Force‑install the LATEST slsteam-moon (the real 'update engine' action).
    Unlike ensure_moon_engine (which no‑ops when moon is already present), this
    always pulls the current release and re‑places the binaries, then records the
    version. Deleting/overwriting the mapped .so is safe while Steam runs — the old
    mapping stays live until the next launch, which then uses the new engine."""
    url = _resolve_moon_zip_url()
    if not url:
        return {"success": False, "error": "could not resolve a slsteam-moon release"}
    import tempfile
    tmp = tempfile.mkdtemp(prefix="slsmoon_upd_")
    try:
        archive = os.path.join(tmp, "slsteam-moon.zip")
        if not _download(url, archive):
            return {"success": False, "error": "moon download failed"}
        root = os.path.join(tmp, "x")
        if not _extract_any(archive, root):
            return {"success": False, "error": "moon extract failed"}
        _chown_to_user(tmp)
        # Decky owns launcher installation; upstream setup.sh is interactive and
        # must not be run from the plugin repair path.
        _place_libraries(root)
        _record_engine_version()
        ok = installed_lib_is_moon()
        return {"success": bool(ok.get("moon")), "lib": ok.get("lib"),
                "note": "Engine updated — fully restart Steam to load it."}
    finally:
        try:
            shutil.rmtree(tmp, ignore_errors=True)
        except Exception:
            pass


def remove_engine_and_headcrab_livesafe() -> Dict[str, Any]:
    """Remove the slsteam-moon ENGINE binaries + headcrab artifacts in a way that's
    safe while Steam is still live this session. Deleting the mapped SLSsteam.so is
    fine on Linux (the inode survives until Steam exits), and headcrab's downgrader
    isn't watched. Deliberately LEAVES ~/.config/SLSsteam (moon holds a file watcher
    on config.yaml, so deleting it live can crash Steam) and the stplug-in game luas
    (the user's added games) — the deliberate 'remove everything' flow (with a Steam
    restart) is the place to nuke those."""
    removed: List[str] = []
    home = _home()
    targets = [lib_dir(), os.path.join(home, ".headcrab")]
    try:
        _root, sh = _steam_root_and_sh()
        if sh:
            d = os.path.dirname(sh)
            targets += [os.path.join(d, "steam.sh.slsorig"), os.path.join(d, "client.sh")]
    except Exception:
        pass
    for p in targets:
        try:
            if p and os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True); removed.append(p)
            elif p and os.path.isfile(p):
                os.remove(p); removed.append(p)
        except Exception:
            pass
    # Belt-and-suspenders: drop headcrab's steam.cfg update block here too, so it's
    # gone on uninstall even if deactivate_injection() errored before it reached
    # _remove_update_block(). Idempotent — no-op if already removed. Without this,
    # a leftover BootStrapperInhibitAll steam.cfg keeps Steam pinned and unable to
    # update after the plugin is gone.
    try:
        if _remove_update_block():
            removed.append("steam.cfg (headcrab update block cleared)")
    except Exception:
        pass
    try:
        from . import settings as _s
        _s.set_dep_version("engine", "")  # so a fresh install re-checks cleanly
    except Exception:
        pass
    try:
        _log(f"Removed engine + headcrab (live-safe): {len(removed)} path(s)")
    except Exception:
        pass
    return {"success": True, "removed": removed}


def ensure_moon_engine() -> Dict[str, Any]:
    """Re-assert slsteam-moon if something replaced it with stock SLSsteam.

    h3adcr-b (headcrab.sh) ships its OWN downloadSLSsteam() that pulls upstream
    AceSLS SLSsteam-Any.7z and `cp -f`s it over ~/.local/share/SLSsteam/SLSsteam.so.
    So running the client fix silently downgrades the engine from the fork to
    stock -- undoing the one thing that makes added games downloadable. Since
    headcrab is also fetched from the network at run time, patching our bundled
    copy is not enough; re-assert afterwards instead."""
    state = installed_lib_is_moon()
    if state.get("moon"):
        return {"success": True, "changed": False, "reason": "slsteam-moon already installed"}
    url = _resolve_moon_zip_url()
    if not url:
        return {"success": False, "changed": False,
                "error": "could not resolve a slsteam-moon release; leaving stock "
                         "SLSsteam in place (added games will not download)"}
    import tempfile
    tmp = tempfile.mkdtemp(prefix="slsmoon_")
    try:
        archive = os.path.join(tmp, "slsteam-moon.zip")
        if not _download(url, archive):
            return {"success": False, "changed": False, "error": "moon download failed"}
        root = os.path.join(tmp, "x")
        if not _extract_any(archive, root):
            return {"success": False, "changed": False, "error": "moon extract failed"}
        _chown_to_user(tmp)
        # Avoid upstream setup.sh here as well (sudo/pkexec + Steam restarts).
        # Always place the full bin/* (incl. pattern-refresh), not only when the
        # moon .so is missing — headcrab's AceSLS overlay strips pattern-refresh,
        # so re-asserting the .so alone would leave the helper gone.
        _place_libraries(root)
        ok = installed_lib_is_moon()
        if ok.get("moon"):
            logger.log("SLSsteam: re-asserted slsteam-moon over stock SLSsteam")
            _record_engine_version()
            return {"success": True, "changed": True, "lib": ok.get("lib")}
        return {"success": False, "changed": False,
                "error": "moon install did not produce a fork library"}
    finally:
        try:
            shutil.rmtree(tmp, ignore_errors=True)
        except Exception:
            pass


def _resolve_moon_zip_url() -> str:
    """Find the latest slsteam-moon-linux-*.zip download URL."""
    try:
        from . import ghrel
        release = ghrel.latest("swwayps/slsteam-moon", force=True)
        if not release.get("success"):
            raise RuntimeError(release.get("error") or "GitHub release lookup failed")
        assets = release.get("assets", []) or []
        zips = [a for a in assets
                if str(a.get("name", "")).startswith("slsteam-moon-linux")
                and str(a.get("name", "")).endswith(".zip")]
        if not zips:
            return ""
        # Prefer the -lumen build: it's the complete distribution that ships the
        # `pattern-refresh` helper (and library-inject.so). The plain build omits
        # pattern-refresh, which leaves injection unable to recover after a Steam
        # client update ("Failed to find all patterns"). Fall back to plain.
        lumen = [a for a in zips if "lumen" in str(a.get("name", "")).lower()]
        chosen = (lumen or zips)[0]
        _log(f"slsteam-moon asset: {chosen.get('name')}")
        return chosen.get("url", "")
    except Exception as exc:
        _log(f"Could not resolve slsteam-moon release: {exc}")
        return ""


def _extract_any(archive: str, dest: str) -> bool:
    """Extract a .zip (native) or .7z (shims/py7zr) release with path traversal protection."""
    os.makedirs(dest, exist_ok=True)
    if archive.lower().endswith(".zip"):
        try:
            import zipfile
            from .utils import is_safe_path
            with zipfile.ZipFile(archive) as z:
                for member in z.infolist():
                    if not is_safe_path(dest, member.filename):
                        continue
                    z.extract(member, dest)
            # restore exec bits zip may drop. Extension-less helpers like
            # `pattern-refresh` MUST be included — otherwise they extract without
            # +x and later fail the os.access(X_OK) check, reading as "not
            # installed" even though the file is right there.
            _exec_names = {"steam", "pattern-refresh", "library-inject"}
            for dirpath, _dirs, files in os.walk(dest):
                for n in files:
                    if (n.endswith(".sh") or n.endswith(".so") or n in _exec_names
                            or "pattern-refresh" in n):
                        try:
                            os.chmod(os.path.join(dirpath, n), 0o755)
                        except Exception:
                            pass
            return (_find_file(dest, "SLSsteam.so") is not None
                    or _find_file(dest, "setup.sh") is not None)
        except Exception as exc:
            _log(f"zip extract failed: {exc}")
            return False
    return _extract_archive(archive, dest)


# ── ManifestPins (slsteam-moon version-locking) ──────────────────────────────
# slsteam-moon honours a ManifestPins map in config.yaml:
#   ManifestPins:
#     <appid>:
#       locked: true
#       depots:
#         <depot>: "<gid>"
#
# WARNING: `ManifestPins` is NOT a key stock upstream SLSsteam understands. Its
# embedded config template defines exactly 27 keys and version-locking is spelled
# `ManifestIds` ("Override Depot manifest IDs -- use this to download older game
# versions or to lock a game to a specific version"). So on a stock install every
# pin written here is inert: SLSsteam ignores the block and logs "Issues during
# config loading encountered! Missing key(s)", and the game is NOT actually
# version-locked even though the UI says it is.
#
# BUT it IS a real key on slsteam-moon -- verified by scanning the v2.8 binary:
# "ManifestPins" appears 8 times there and "ManifestIds" appears 0 times, exactly
# inverted from upstream. So pinning is engine-dependent, not simply broken:
#   slsteam-moon  -> ManifestPins works, pin normally
#   stock upstream -> ManifestPins is inert; its key is ManifestIds, whose nested
#                     schema we have not confirmed, and a wrongly-shaped key makes
#                     SLSsteam fail config parsing outright ("Error parsing
#                     config.yaml!"), disabling everything rather than just
#                     pinning. Refuse rather than guess.
def _pin_key_supported() -> bool:
    try:
        return bool(installed_lib_is_moon().get("moon"))
    except Exception:
        return False
from . import steam as _steam_mod


def _config_lines():
    content = _read()
    if content is None:
        return None
    return content.split("\n")


def _write_config_lines(lines) -> bool:
    ok = _atomic_write("\n".join(lines).rstrip("\n") + "\n")
    if ok:
        try:
            _chown_file_to_user(config_path())
        except Exception:
            pass
    return ok


# SLSonline uses Moon's FakeAppIds map. Only the selected game's entry is
# managed here; no Steam launch options or other YAML settings are rewritten.
_SLSONLINE_APPID = 480
_FAKE_APPID_HEADER = re.compile(r"^FakeAppIds[ \t]*:[ \t]*(?:#.*)?$")
_FAKE_APPID_ENTRY = re.compile(r"^[ \t]+['\"]?(\d+)['\"]?[ \t]*:[ \t]*(\d+)(?:[ \t]+#.*)?$")


def _fake_appid_block(lines):
    headers = [i for i, line in enumerate(lines) if re.match(r"^FakeAppIds[ \t]*:", line)]
    if len(headers) > 1:
        raise ValueError("Duplicate FakeAppIds sections in config.yaml")
    if not headers:
        return None, None, {}
    start = headers[0]
    if not _FAKE_APPID_HEADER.match(lines[start]):
        raise ValueError("Unsupported inline FakeAppIds map in config.yaml")
    end = start + 1
    while end < len(lines) and (not lines[end].strip() or lines[end][0].isspace() or lines[end].startswith("#")):
        end += 1
    entries = {}
    for i in range(start + 1, end):
        line = lines[i]
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = _FAKE_APPID_ENTRY.match(line)
        if not match:
            raise ValueError("Unsupported FakeAppIds entry in config.yaml")
        appid = int(match.group(1))
        if appid in entries:
            raise ValueError(f"Duplicate FakeAppIds entry for {appid}")
        entries[appid] = (i, int(match.group(2)))
    return start, end, entries


def slsonline_status(appid: int) -> Dict[str, Any]:
    if int(appid) <= 0:
        return {"success": False, "error": "invalid appid"}
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    try:
        _, _, entries = _fake_appid_block(lines)
    except ValueError as exc:
        return {"success": False, "error": str(exc)}
    current = entries.get(int(appid))
    return {"success": True, "enabled": current is not None,
            "fakeAppId": current[1] if current else None}


def set_slsonline(appid: int, enabled: bool) -> Dict[str, Any]:
    if int(appid) <= 0:
        return {"success": False, "error": "invalid appid"}
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    try:
        start, end, entries = _fake_appid_block(lines)
    except ValueError as exc:
        return {"success": False, "error": str(exc)}
    current = entries.get(int(appid))
    if enabled == (current is not None):
        return {"success": True, "enabled": enabled,
                "fakeAppId": current[1] if current else None, "changed": False}
    if enabled:
        if start is None:
            if lines and lines[-1].strip():
                lines.append("")
            lines.extend(["FakeAppIds:", f"  {appid}: {_SLSONLINE_APPID}"])
        else:
            lines.insert(end, f"  {appid}: {_SLSONLINE_APPID}")
    else:
        del lines[current[0]]
    if not _write_config_lines(lines):
        return {"success": False, "error": "Could not write config.yaml"}
    return {"success": True, "enabled": bool(enabled),
            "fakeAppId": _SLSONLINE_APPID if enabled else None, "changed": True}


def _purge_pins_lines(lines, appid: int):
    """Remove the ManifestPins sub-block for appid; drop the header if empty.
    Returns (new_lines, changed)."""
    header = None
    for i, ln in enumerate(lines):
        if re.match(r"^ManifestPins\s*:", ln):
            header = i
            break
    if header is None:
        return lines, False
    block_end = len(lines) - 1
    for i in range(header + 1, len(lines)):
        if re.match(r"^\S", lines[i]):
            block_end = i - 1
            break
    app_start = app_end = None
    for i in range(header + 1, block_end + 1):
        m = re.match(r"^  (\d+)\s*:\s*$", lines[i])
        if m and int(m.group(1)) == int(appid):
            app_start = i
            app_end = block_end
            for j in range(i + 1, block_end + 1):
                if re.match(r"^  \S", lines[j]):
                    app_end = j - 1
                    break
            break
    if app_start is None:
        return lines, False
    del lines[app_start:app_end + 1]
    # recompute block end; drop header if no apps remain
    new_end = len(lines) - 1
    for i in range(header + 1, len(lines)):
        if re.match(r"^\S", lines[i]):
            new_end = i - 1
            break
    any_app = any(re.match(r"^  \d+\s*:", lines[i]) for i in range(header + 1, new_end + 1))
    if not any_app:
        del lines[header]
    return lines, True


def purge_pins_for_app(appid) -> Dict[str, Any]:
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    lines, changed = _purge_pins_lines(lines, int(appid))
    if not changed:
        try:
            from . import settings
            settings.set_pinned_build(int(appid), "")
            settings.clear_pinned_manifest_snapshot(int(appid))
        except Exception:
            pass
        return {"success": True, "changed": False}
    ok = _write_config_lines(lines)
    if ok:
        try:
            from . import settings
            settings.set_pinned_build(int(appid), "")
            settings.clear_pinned_manifest_snapshot(int(appid))
        except Exception:
            pass
    return {"success": ok, "changed": ok}


def pin_app_current(appid) -> Dict[str, Any]:
    """Pin the game to its currently-installed depot manifests."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    if not _pin_key_supported():
        # Report honestly instead of writing a key the engine ignores. Callers
        # treated a silent success as "this game is version-locked", which on
        # stock upstream it never was.
        return {"success": False, "unsupported": True, "error":
                "Version pinning needs slsteam-moon. The installed engine is stock "
                "SLSsteam, which has no ManifestPins key (its version-lock key is "
                "ManifestIds, whose schema is unverified). Pin not written, rather "
                "than written and silently ignored."}
    depots = _steam_mod.get_installed_depots(appid)
    if not depots:
        return {"success": False, "error": "no installed depots (game not installed?)"}
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    # replace any existing pin for this app, then insert a fresh block
    lines, _ = _purge_pins_lines(lines, appid)
    block = [f"  {appid}:", "    locked: true", "    depots:"]
    for depot, gid in sorted(depots.items()):
        block.append(f'      {depot}: "{gid}"')
    header = None
    for i, ln in enumerate(lines):
        if re.match(r"^ManifestPins\s*:", ln):
            header = i
            break
    if header is None:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append("ManifestPins:")
        lines.extend(block)
    else:
        for k, b in enumerate(block):
            lines.insert(header + 1 + k, b)
    ok = _write_config_lines(lines)
    if ok:
        try:
            from . import settings
            current_build = _steam_mod.get_installed_buildid(appid)
            settings.set_pinned_manifest_snapshot(
                appid, depots, current_build
            )
            if current_build:
                settings.set_pinned_build(appid, current_build)
        except Exception:
            pass
    return {"success": ok, "depots": len(depots)}


def _read_pin_gids(appid: int) -> Dict[int, str]:
    """Return the currently-pinned {depot: gid} for appid from config.yaml, or {}."""
    lines = _config_lines()
    if lines is None:
        return {}
    header = None
    for i, ln in enumerate(lines):
        if re.match(r"^ManifestPins\s*:", ln):
            header = i
            break
    if header is None:
        return {}
    block_end = len(lines) - 1
    for i in range(header + 1, len(lines)):
        if re.match(r"^\S", lines[i]):
            block_end = i - 1
            break
    app_start = None
    for i in range(header + 1, block_end + 1):
        m = re.match(r"^  (\d+)\s*:\s*$", lines[i])
        if m and int(m.group(1)) == int(appid):
            app_start = i
            break
    if app_start is None:
        return {}
    out: Dict[int, str] = {}
    for j in range(app_start + 1, block_end + 1):
        if re.match(r"^  \S", lines[j]) and not re.match(r"^   ", lines[j]):
            break  # next appid / dedent
        m = re.match(r'^\s+(\d+)\s*:\s*"?(\d+)"?\s*$', lines[j])
        if m:
            out[int(m.group(1))] = m.group(2)
    return out


def pin_app_gids(appid, depot_gids: Dict[int, str], buildid: str = "",
                 source: str = "") -> Dict[str, Any]:
    """Pin the game to a SPECIFIC set of depot manifest gids (build-accurate),
    e.g. the setManifestid gids from a fix's manifest .lua — as opposed to
    pin_app_current which locks whatever is installed now. slsteam-moon fetches
    each manifest on demand via the depot key, so the build need not be installed
    or archived yet."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    buildid = str(buildid or "").strip()
    if buildid and not buildid.isdigit():
        buildid = ""
    source = str(source or "").strip()
    clean = {}
    for d, g in (depot_gids or {}).items():
        try:
            if str(d).isdigit() and str(g).isdigit():
                clean[int(d)] = str(g)
        except Exception:
            continue
    if not clean:
        return {"success": False, "error": "no valid depot:gid pairs"}
    if not _pin_key_supported():
        return {"success": False, "unsupported": True,
                "error": "Version pinning needs slsteam-moon (no ManifestPins key on stock SLSsteam)."}
    # Was the game already pinned to exactly these gids? If so the pin is a no-op
    # and the caller can skip re-downloading. If it differs (or wasn't pinned),
    # the build is changing and Steam must update to it.
    existing = _read_pin_gids(appid)
    was_pinned = bool(existing)
    changed = existing != clean
    # The "needs a Steam re-download" decision must reflect the build actually on
    # disk, not just the pin file. Reading the installed appmanifest lets us catch
    # the "unpin -> reapply on a build that's already installed" case: the pin file
    # is empty so `existing != clean` is True, but nothing needs downloading. When
    # the installed manifest already carries exactly these gids for every pinned
    # depot, report changed=False (+ alreadyOnBuild) so the caller skips the wait
    # and applies the fix straight away. Never flips changed True->False the wrong
    # way: we only downgrade to False, and only on a confirmed on-disk match.
    already_on_build = False
    try:
        from . import steam as _steam
        installed_raw = _steam.get_installed_depots(appid) or {}
        installed = {int(d): str(g) for d, g in installed_raw.items() if str(d).isdigit()}
        if installed:
            already_on_build = all(installed.get(d) == g for d, g in clean.items())
            # A pre-existing pin is not proof that the files on disk match it.
            # If Steam stayed on latest, this must remain a build change and the
            # fix must not be applied onto the wrong installed manifests.
            changed = not already_on_build
    except Exception:
        pass
    lines = _config_lines()
    if lines is None:
        return {"success": False, "error": "config.yaml not found"}
    lines, _ = _purge_pins_lines(lines, appid)
    block = [f"  {appid}:", "    locked: true", "    depots:"]
    for depot, gid in sorted(clean.items()):
        block.append(f'      {depot}: "{gid}"')
    header = None
    for i, ln in enumerate(lines):
        if re.match(r"^ManifestPins\s*:", ln):
            header = i
            break
    if header is None:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append("ManifestPins:")
        lines.extend(block)
    else:
        for k, b in enumerate(block):
            lines.insert(header + 1 + k, b)
    ok = _write_config_lines(lines)
    if ok:
        try:
            from . import settings
            settings.set_pinned_manifest_snapshot(appid, clean, buildid, source)
            if buildid:
                settings.set_pinned_build(appid, buildid)
            elif changed:
                settings.set_pinned_build(appid, "")
        except Exception:
            pass
        try:
            from . import buildhistory
            buildhistory.snapshot(appid, clean, buildid=buildid, source=source or "pin")
        except Exception:
            pass
    return {"success": ok, "depots": len(clean), "changed": changed,
            "wasPinned": was_pinned, "alreadyOnBuild": already_on_build,
            "buildid": buildid, "source": source}


def is_pinned(appid) -> bool:
    lines = _config_lines()
    if lines is None:
        return False
    header = None
    for i, ln in enumerate(lines):
        if re.match(r"^ManifestPins\s*:", ln):
            header = i
            break
    if header is None:
        return False
    for i in range(header + 1, len(lines)):
        if re.match(r"^\S", lines[i]):
            break
        if re.match(rf"^  {int(appid)}\s*:", lines[i]):
            return True
    return False
