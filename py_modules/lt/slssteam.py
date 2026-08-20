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
import re
import shutil
import subprocess
import threading
import time
from typing import Any, Dict, List, Optional, Set

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
    /tmp/SLSsteam.API IPC ("install|appid|library"). Works in the running Steam
    session with no restart. Harmless (a no-op) when injection isn't active."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    try:
        with open("/tmp/SLSsteam.API", "w", encoding="utf-8") as fh:
            fh.write("install|%d|%d\n" % (appid, int(library)))
        logger.log(f"SLSsteam: API install trigger -> {appid} (library {library})")
        return {"success": True}
    except Exception as exc:
        logger.warn(f"SLSsteam: API install trigger failed: {exc}")
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


def _atomic_write(content: str) -> bool:
    """Replace config.yaml in one step. This file holds AdditionalApps -- the
    user's entire added-games list -- so a partial write loses their library.

    The temp name is unique per call: RPC handlers run on a thread pool, and two
    concurrent writers sharing a fixed "<path>.tmp" would have one clobber the
    other's staged bytes before either rename. The fsync pair (file, then parent
    directory) is what makes the rename durable -- without it the rename can
    survive a power cut while the data does not, leaving an empty config. On a
    handheld people shut off by holding the power button, that is a realistic
    way to lose the whole game list."""
    path = config_path()
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
    # Needed for the /tmp/SLSsteam.API IPC (schema + install triggers).
    "API": "yes",
    # CRITICAL. SLSsteam's own default is `yes`, and it implements this by
    # hooking CUserAppManager::BuildDepotDependency so that unowned apps (i.e.
    # everything in AdditionalApps) are handed ZERO depots. Steam then resolves
    # "0 active: 0 target:", downloads nothing, and writes an appmanifest with
    # StateFlags 4 / SizeOnDisk 0 -- a game that shows as installed but is empty.
    # It must be `no` or no added game can ever download.
    "DisableUpdates": "no",
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
    content = _read()
    if content is None:
        return {"success": True, "additionalApps": []}
    _backup_once()
    pattern = re.compile(rf"^[ \t]*-[ \t]*{appid}[ \t]*(?:#.*)?$\n?", re.MULTILINE)
    if not pattern.search(content):
        return {"success": True, "additionalApps": read_additional_apps()}
    new_content = pattern.sub("", content, count=1)
    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: removed {appid} from {ADDITIONAL_APPS_KEY}")
    return {"success": True, "additionalApps": read_additional_apps()}


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
    return env


def _decky_user() -> str:
    """The desktop user (Decky plugins run as root; work must land as this
    user, mirroring junk-store's ``sudo -u $DECKY_USER`` pattern)."""
    for key in ("DECKY_USER",):
        val = os.environ.get(key)
        if val:
            return val
    home = _home().rstrip("/")
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
    try:
        import py7zr  # noqa: F401
        return True
    except Exception:
        return False


def _missing_dependencies() -> List[str]:
    """We no longer need apt/wget/sudo. The only hard requirement is a way to
    unpack the .7z release; report it only if truly unavailable."""
    return [] if _extraction_available() else ["7z (or the py7zr fallback)"]


def _set_install(update: Dict[str, Any]) -> None:
    with _INSTALL_LOCK:
        _INSTALL_STATE.update(update)


def get_install_status() -> Dict[str, Any]:
    with _INSTALL_LOCK:
        state = dict(_INSTALL_STATE)
    # Safety net: if a run wedges (a blocking child that never returns), never
    # let the UI spin forever — fail it after a generous cap.
    if state.get("status") == "running":
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
    import httpx  # local import; httpx ships with the plugin
    if not str(url).lower().startswith("https://"):
        _log(f"refusing non-HTTPS download: {url}")
        return False
    h = __import__("hashlib").sha256() if sha256 else None
    try:
        with httpx.Client(follow_redirects=True, timeout=120) as client:
            with client.stream("GET", url) as resp:
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
    _set_install({"status": "running", "error": "", "log": "", "percent": 0,
                  "startedAt": time.time()})
    tmp = tempfile.mkdtemp(prefix="slssteam_")
    try:
        # Clear known conflicts first (Millennium holds Steam's CEF port closed;
        # an Arch system slssteam pkg shadows our .so). Best-effort, never fatal.
        try:
            rep = repair_engine_conflicts()
            if rep.get("removed"):
                _log("Cleared conflicts: " + ", ".join(rep["removed"]))
        except Exception as exc:
            _log(f"conflict repair skipped ({exc})")
        _log("Resolving slsteam-moon (SLSsteam fork with depot-key support)…")
        url = _resolve_moon_zip_url()
        if not url:
            # Fall back to stock AceSLS SLSsteam (ownership only) if the fork
            # can't be resolved, so at least install/injection still work.
            _log("slsteam-moon unavailable; falling back to AceSLS SLSsteam")
            url = SLS_RELEASE_URL
            archive = os.path.join(tmp, "SLSsteam-Any.7z")
        else:
            archive = os.path.join(tmp, "slsteam-moon.zip")

        _log("Downloading engine…")
        if not _download(url, archive):
            _set_install({"status": "failed", "error": "Download failed (no network?)"})
            return

        _log("Extracting…")
        extract_root = os.path.join(tmp, "x")
        if not _extract_any(archive, extract_root):
            _set_install({"status": "failed", "error": "Could not extract engine release"})
            return

        # The fork ships its own setup.sh — run it first (it knows its layout),
        # then ALWAYS copy the full bin/* ourselves. Not just as a missing-.so
        # fallback: setup.sh may install SLSsteam.so but not the pattern-refresh
        # helper / library-inject.so, and without pattern-refresh injection can't
        # recover after a Steam update. Copying the whole bin/ guarantees they land.
        _log("Installing engine (setup.sh)…")
        _run_setup_script(extract_root)
        _log("Placing SLSsteam libraries (SLSsteam.so, library-inject.so, pattern-refresh)…")
        _place_libraries(extract_root)
        _record_engine_version()
        # setup.sh only makes the path/steam wrapper for fish; ensure the bash
        # one exists too, so any .desktop patched to it can't dangle.
        try:
            _ensure_path_wrapper()
        except Exception as _wexc:
            _log(f"path wrapper ensure failed: {_wexc}")
        if not find_installed_lib():
            _set_install({"status": "failed", "error": "Failed to place SLSsteam.so"})
            return

        ensure_config()
        _chown_to_user(config_dir())

        # 1) Pin the Steam client to a SLSsteam-compatible build via h3adcr-b
        # (fixes "Failed to find all patterns"). headcrab also patches steam.sh
        # its own way — do it FIRST so our proven wrapper is applied last and wins.
        _fetch_headcrab_for_desktop()
        _chown_to_user(os.path.join(config_dir(), "tools"))
        _log("Setting up Steam client compatibility (h3adcr-b)… this can take a few minutes")
        try:
            _run_headcrab_shimmed()
        except Exception as hc_exc:
            _log(f"Client-compatibility step failed: {hc_exc}")
        ensure_config()

        # 2) Apply OUR steam.sh wrapper LAST — on-device testing showed this is
        # what actually injects in Game Mode (headcrab's launcher patch alone
        # does not). Skippable via the "Headcrab-only injection" toggle.
        _skip = False
        try:
            from .settings import get_skip_wrapper
            _skip = get_skip_wrapper()
        except Exception:
            _skip = False
        if _skip:
            _log("Skipping plugin steam.sh wrapper (headcrab-only mode)")
        else:
            _log("Activating injection (patching steam.sh)…")
            act = activate_injection()
            if act.get("success"):
                _log(f"Injection activated via {act.get('steamSh')}")
            else:
                _log(f"Auto-activation not applied: {act.get('error')}")

        # Keep path/steam present after headcrab (Game Mode's gamescope hook
        # points STEAMCMD here). Desktop mode injects via steam.sh instead, so
        # the desktop icon does NOT need path/steam.
        try:
            _ensure_path_wrapper()
            _log("Recreated path/steam launch wrapper (post-headcrab)")
        except Exception as _rexc:
            _log(f"path/steam wrapper recreate skipped: {_rexc}")

        # The moon's ensure-desktop-coverage.sh re-points the Steam .desktop
        # launchers at path/steam during setup. On-device there's no Lumen daemon
        # re-binding continuously, so neutralising that script and restoring the
        # launchers to /usr/bin/steam as the FINAL step makes the fix stick until
        # the next reinstall (which repeats this). Desktop injection rides on
        # steam.sh, so /usr/bin/steam still injects.
        try:
            _neutralize_desktop_coverage()
        except Exception as _cexc:
            _log(f"desktop-coverage neutralise skipped: {_cexc}")
        try:
            n = _restore_desktop_launchers()
            if n:
                _log(f"Restored {n} Steam .desktop launcher(s) to /usr/bin/steam")
        except Exception as _rexc:
            _log(f"desktop launcher restore skipped: {_rexc}")

        installed = bool(find_installed_lib())
        injected = is_injected()
        _set_install({
            "status": "done",
            "success": installed,
            "installed": installed,
            "injected": injected,
            "needsDesktopMode": installed and not injected,
        })
        if installed:
            _log("All set — reboot (or fully restart Steam) once to apply. "
                 "It then loads automatically on every boot.")
        else:
            _log("Install did not complete; check the log above.")
    except Exception as exc:
        _set_install({"status": "failed", "error": str(exc)})
    finally:
        try:
            shutil.rmtree(tmp, ignore_errors=True)
        except Exception:
            pass


def start_install() -> Dict[str, Any]:
    with _INSTALL_LOCK:
        if _INSTALL_STATE.get("status") == "running":
            return {"success": False, "error": "Install already running"}
    missing = _missing_dependencies()
    if missing:
        _set_install({"status": "failed",
                      "error": f"No way to unpack the release: {', '.join(missing)}"})
        return {"success": False, "error": "Missing extractor", "missingDeps": missing}
    _set_install({"status": "queued", "error": "", "log": "", "percent": 0})
    threading.Thread(target=_run_install, daemon=True).start()
    return {"success": True}


# ── DlcData editing (optional; only needed past Steam's 64-DLC limit) ───────
_DLC_DATA_RE = re.compile(r"^DlcData:[ \t]*$", re.MULTILINE)


def _dlc_section(content: str):
    """Return (dlcdata_line_start, body_start, body_end) or None."""
    m = _DLC_DATA_RE.search(content)
    if not m:
        return None
    body_start = m.end()
    if body_start < len(content) and content[body_start] == "\n":
        body_start += 1
    after = content[body_start:]
    nxt = re.compile(r"^[A-Za-z]", re.MULTILINE).search(after)
    body_end = body_start + nxt.start() if nxt else len(content)
    return (m.start(), body_start, body_end)


def add_dlc(parent_appid: int, dlc_id: int, dlc_name: str = "") -> Dict[str, Any]:
    """Add one DLC under DlcData → parent_appid → dlc_id: "name" (idempotent)."""
    try:
        parent = str(int(parent_appid))
        dlc = str(int(dlc_id))
    except Exception:
        return {"success": False, "error": "Invalid appid/dlc"}
    ensure_config()
    _backup_once()
    content = _read() or ""
    name = (dlc_name or f"DLC {dlc}").replace('"', "'")
    entry = f'    {dlc}: "{name}"\n'

    bounds = _dlc_section(content)
    if bounds is None:
        block = f"DlcData:\n  {parent}:\n{entry}"
        new_content = content.rstrip("\n") + "\n" + block
    else:
        _, body_start, body_end = bounds
        body = content[body_start:body_end]
        pmatch = re.search(rf"^([ \t]+){parent}[ \t]*:[ \t]*$", body, re.MULTILINE)
        if pmatch:
            parent_indent = len(pmatch.group(1))
            rest = body[pmatch.end():]
            sib = re.search(rf"^[ \t]{{{parent_indent}}}\S", rest, re.MULTILINE)
            region = rest[: sib.start()] if sib else rest
            if re.search(rf"^[ \t]+{dlc}[ \t]*:", region, re.MULTILINE):
                return {"success": True, "alreadyPresent": True}
            insert_at = body_start + pmatch.end()
            if insert_at < len(content) and content[insert_at] == "\n":
                insert_at += 1
            new_content = content[:insert_at] + entry + content[insert_at:]
        else:
            block = f"  {parent}:\n{entry}"
            new_content = content[:body_start] + block + content[body_start:]

    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: added DLC {dlc} under {parent}")
    return {"success": True}


def add_dlcs(parent_appid: int, dlcs) -> Dict[str, Any]:
    """Add many DLCs. ``dlcs`` is an iterable of (dlc_id, name) or ids."""
    added = 0
    for item in dlcs or []:
        if isinstance(item, (tuple, list)):
            dlc_id = item[0]
            name = item[1] if len(item) > 1 else ""
        else:
            dlc_id, name = item, ""
        if add_dlc(parent_appid, dlc_id, name).get("success"):
            added += 1
    return {"success": True, "added": added}


def add_dlc_block(parent_appid: int, dlc_ids, names=None) -> Dict[str, Any]:
    """Register MANY DLC appids under one parent in a SINGLE atomic write.

    add_dlcs() does one read-modify-write per DLC — fine for a handful, but a
    content-heavy game (e.g. Hitman WoA) has dozens/hundreds of DLC, and that many
    sequential config rewrites on a handheld is slow and needless. When the parent
    isn't in DlcData yet (the common case on a fresh add) we compose the whole
    block and write once; if the parent already exists we defer to the idempotent
    per-DLC path so we never duplicate entries."""
    try:
        parent = str(int(parent_appid))
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    ids: List[int] = []
    for d in dlc_ids or []:
        try:
            ids.append(int(d))
        except Exception:
            pass
    if not ids:
        return {"success": True, "added": 0}
    name_map = {}
    for i, d in enumerate(ids):
        try:
            name_map[d] = (names[i] if names and i < len(names) else "") or f"DLC {d}"
        except Exception:
            name_map[d] = f"DLC {d}"
    ensure_config()
    _backup_once()
    content = _read() or ""
    bounds = _dlc_section(content)
    # Parent already present → idempotent per-DLC path (handles dedupe).
    if bounds is not None:
        _, bs, be = bounds
        if re.search(rf"^[ \t]+{parent}[ \t]*:[ \t]*$", content[bs:be], re.MULTILINE):
            return add_dlcs(parent_appid, [(d, name_map[d]) for d in ids])
    entries = "".join(f'    {d}: "{name_map[d]}"\n' for d in ids)
    if bounds is None:
        block = f"DlcData:\n  {parent}:\n{entries}"
        new_content = content.rstrip("\n") + "\n" + block
    else:
        _, bs, _be = bounds
        block = f"  {parent}:\n{entries}"
        new_content = content[:bs] + block + content[bs:]
    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: registered {len(ids)} DLC under {parent} (DlcData)")
    return {"success": True, "added": len(ids)}


def remove_dlc_parent(parent_appid: int) -> Dict[str, Any]:
    """Remove an entire parent block (and its DLCs) from DlcData."""
    try:
        parent = str(int(parent_appid))
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    content = _read()
    if content is None:
        return {"success": True}
    bounds = _dlc_section(content)
    if bounds is None:
        return {"success": True}
    _, body_start, body_end = bounds
    body = content[body_start:body_end]
    pmatch = re.search(rf"^([ \t]+){parent}[ \t]*:[ \t]*$", body, re.MULTILINE)
    if not pmatch:
        return {"success": True}
    parent_indent = len(pmatch.group(1))
    rest = body[pmatch.end():]
    sib = re.search(rf"^[ \t]{{{parent_indent}}}\S", rest, re.MULTILINE)
    block_end_in_body = pmatch.end() + (sib.start() if sib else len(rest))
    # include the newline before the parent line so we don't leave a blank line
    line_start = body_start + pmatch.start()
    block_end = body_start + block_end_in_body
    new_content = content[:line_start] + content[block_end:]
    _backup_once()
    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: removed DlcData block for {parent}")
    return {"success": True}


# ── AppTokens editing (ProductInfo access tokens from manifest .lua) ────────
_APP_TOKENS_RE = re.compile(r"^AppTokens:[ \t]*$", re.MULTILINE)


def _app_tokens_section(content: str):
    m = _APP_TOKENS_RE.search(content)
    if not m:
        return None
    body_start = m.end()
    if body_start < len(content) and content[body_start] == "\n":
        body_start += 1
    after = content[body_start:]
    nxt = re.compile(r"^[A-Za-z]", re.MULTILINE).search(after)
    body_end = body_start + nxt.start() if nxt else len(content)
    return (m.start(), body_start, body_end)


def get_app_tokens() -> Dict[str, str]:
    content = _read()
    if content is None:
        return {}
    bounds = _app_tokens_section(content)
    if bounds is None:
        return {}
    _, body_start, body_end = bounds
    tokens: Dict[str, str] = {}
    for line in content[body_start:body_end].split("\n"):
        m = re.match(r"^\s*(\d+)\s*:\s*(\S+)", line)
        if m:
            tokens[m.group(1)] = m.group(2).strip()
    return tokens


def add_app_token(appid: int, token: str) -> Dict[str, Any]:
    """Add/update AppTokens → appid: token (idempotent)."""
    try:
        appid = str(int(appid))
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    token = str(token or "").strip()
    if not token:
        return {"success": False, "error": "Empty token"}
    ensure_config()
    content = _read() or ""
    entry = f"  {appid}: {token}\n"

    bounds = _app_tokens_section(content)
    if bounds is None:
        _backup_once()
        new_content = content.rstrip("\n") + f"\nAppTokens:\n{entry}"
    else:
        _, body_start, body_end = bounds
        body = content[body_start:body_end]
        # [ \t], never \s. In a MULTILINE pattern \s matches the newline, so
        # given an AppTokens entry with an empty value:
        #     480:
        #     223470: abc123
        # searching for 480 matched across the newline, captured "223470:" as
        # 480's value, and the span replaced below then swallowed the 223470
        # line -- silently deleting another game's AppToken.
        # `(.*)`, not `(\S+)`: the entry counts as existing even when it carries
        # no value. Requiring a value meant a bare "480:" line was not found, so
        # a SECOND "480:" was inserted -- and YAML takes the last duplicate key,
        # which was the empty one, so the token silently did nothing.
        existing = re.search(rf"^([ \t]*){appid}[ \t]*:[ \t]*(.*)$", body, re.MULTILINE)
        if existing:
            if existing.group(2).strip() == token:
                return {"success": True, "alreadyPresent": True}
            _backup_once()
            start = body_start + existing.start()
            end = body_start + existing.end()
            indent = existing.group(1) or "  "
            new_content = content[:start] + f"{indent}{appid}: {token}" + content[end:]
        else:
            _backup_once()
            new_content = content[:body_start] + entry + content[body_start:]

    if not _atomic_write(new_content):
        return {"success": False, "error": "Failed to write SLSsteam config"}
    logger.log(f"SLSsteam: set AppToken for {appid}")
    return {"success": True}


# ── Injection activation (rootless, scoped, gaming-mode capable) ────────────
# Mirrors h3adcr-b's proven method: replace the *user-writable*
# ``~/.steam/steam/steam.sh`` with a tiny wrapper that exports LD_AUDIT for the
# SLSsteam libraries and then execs the original launcher. No sudo, no /usr, no
# global LD_AUDIT — the hook is scoped to the Steam process only. A ``steam.cfg``
# stops Steam from overwriting the wrapper on update.
_WRAPPER_MARK = "SLSDeck/SLSsteam injection"
_WRAPPER_TEMPLATE = """#!/usr/bin/env bash
# --- {mark} (managed by the SLSDeck Decky plugin) ---
# Sources the pristine client.sh with LD_AUDIT exported, keeping $0 = steam.sh so
# Steam's self-restart (exec "$0") re-runs this hook and the injection PERSISTS
# across the steamwebhelper restart. Safe: if SLSsteam.so is missing Steam still
# launches normally. Remove by restoring steam.sh.slsorig (or the Deactivate button).
# The engine directory is PROBED, not hard-coded to a single baked-in path.
# A previous version wrote one absolute SLSDIR captured at activation time; if
# that path was wrong (e.g. the backend ran with an unusual XDG_DATA_HOME) or the
# directory later moved, LD_AUDIT was silently never set and injection failed
# with no error anywhere -- Steam just starts normally and nothing works.
# Probing the canonical locations makes the hook self-healing.
_slsdir=""
for _c in "{slsdir}" "$HOME/.local/share/SLSsteam" \\
          "${{XDG_DATA_HOME:-$HOME/.local/share}}/SLSsteam" \\
          "$HOME/.var/app/com.valvesoftware.Steam/.local/share/SLSsteam"; do
  [ -n "$_c" ] && [ -f "$_c/SLSsteam.so" ] && {{ _slsdir="$_c"; break; }}
done
SLSDIR="$_slsdir"
_a=""
[ -n "$SLSDIR" ] && [ -f "$SLSDIR/library-inject.so" ] && _a="$SLSDIR/library-inject.so"
[ -n "$SLSDIR" ] && [ -f "$SLSDIR/SLSsteam.so" ] && _a="${{_a:+$_a:}}$SLSDIR/SLSsteam.so"
[ -n "$_a" ] && export LD_AUDIT="$_a"
source "{client}" "$@"
"""
_STEAM_CFG = "BootStrapperInhibitAll=enable\nBootStrapperForceSelfUpdate=disable\n"


def _chown_file_to_user(path: str) -> None:
    if not _is_root() or not os.path.exists(path):
        return
    try:
        import pwd
        pw = pwd.getpwnam(_decky_user())
        os.chown(path, pw.pw_uid, pw.pw_gid)
    except Exception:
        pass


def _steam_root_and_sh():
    home = _home()
    if _is_flatpak_steam():
        roots = [
            os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".steam", "steam"),
            os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
        ]
    else:
        roots = [
            os.path.join(home, ".steam", "steam"),
            os.path.join(home, ".local", "share", "Steam"),
            os.path.join(home, ".steam", "root"),
        ]
    for r in roots:
        sh = os.path.join(r, "steam.sh")
        real = os.path.realpath(sh)
        if os.path.isfile(real):
            return os.path.dirname(real), real
    return None, None


# ── Pre-install conflict repair (borrowed from luatools-moon install.sh) ──────
# Two things silently break our moon/Lumen engine and are worth clearing before
# an install: a pre-existing Millennium framework, and an Arch system slssteam
# package. Everything here is best-effort and idempotent — it must never raise
# or abort an install. We run as root under Decky, so system paths and pacman
# are reachable directly (no sudo prefix needed).
def _remove_millennium_framework() -> List[str]:
    """Millennium and our engine both want Steam's single CEF DevTools endpoint
    (port 8080). Millennium forces the Steam webhelper onto
    ``--remote-debugging-pipe``, which keeps 8080 CLOSED — and our moon/Lumen
    engine attaches over that port. So a pre-existing Millennium install (incl.
    the Millennium luatools port) silently blocks injection. Remove the whole
    framework: the injected runtime symlinks, the user dirs, Steam's own
    millennium dir, and the system loader. Steam re-extracts libXtst.so.6 from
    its bootstrap on next launch."""
    removed: List[str] = []
    home = _home()
    steam_root, _sh = _steam_root_and_sh()
    if not steam_root:
        steam_root = os.path.join(home, ".steam", "steam")

    # Symlinks Millennium drops into Steam's runtime dirs (point at its libs).
    # Only remove a link we can confirm targets Millennium — never a real lib.
    for link in (
        os.path.join(steam_root, "ubuntu12_32", "libXtst.so.6"),
        os.path.join(steam_root, "ubuntu12_64", "libXtst.so.6"),
        os.path.join(steam_root, "ubuntu12_64", "libmillennium_hhx64.so"),
    ):
        try:
            if os.path.islink(link):
                target = os.readlink(link)
                if "millennium" in target.lower():
                    os.unlink(link)
                    removed.append(link)
        except Exception:
            pass

    # User-side dirs (themes, plugins, config.json), Steam's own millennium dir,
    # and the system loader. We're the desktop user's home even when running as
    # root, so join from _home() rather than trusting XDG_* in the root env.
    for d in (
        os.path.join(home, ".config", "millennium"),
        os.path.join(home, ".local", "share", "millennium"),
        os.path.join(home, ".millennium"),
        os.path.join(steam_root, "millennium"),
        "/usr/lib/millennium",
        "/usr/share/millennium",
    ):
        try:
            if os.path.isdir(d) or os.path.islink(d):
                shutil.rmtree(d, ignore_errors=True)
                if not os.path.exists(d):
                    removed.append(d)
        except Exception:
            pass
    return removed


def _remove_system_slssteam_pkg() -> List[str]:
    """On Arch-family systems (SteamOS is Arch-based) a system ``slssteam`` /
    ``slssteam-git`` package would shadow our local SLSsteam.so. Remove it if
    present. Best-effort: on an immutable / read-only rootfs ``pacman -R`` will
    fail, which we swallow (the local install still wins in most layouts)."""
    notes: List[str] = []
    pacman = shutil.which("pacman")
    if not pacman:
        return notes
    try:
        q = subprocess.run([pacman, "-Qq"], capture_output=True, text=True, timeout=30)
        pkgs = [ln for ln in q.stdout.split() if ln in ("slssteam", "slssteam-git")]
    except Exception:
        pkgs = []
    for pkg in pkgs:
        try:
            r = subprocess.run([pacman, "-Rns", "--noconfirm", pkg],
                               capture_output=True, text=True, timeout=120)
            notes.append(f"removed system package {pkg}" if r.returncode == 0
                         else f"could not remove {pkg} (read-only rootfs?)")
        except Exception as exc:
            notes.append(f"could not remove {pkg}: {exc}")
    return notes


def repair_engine_conflicts() -> Dict[str, Any]:
    """Pre-install repair pass: clear things that silently break our engine — a
    pre-existing Millennium framework (holds Steam's CEF port closed so our
    engine can't attach) and any Arch system slssteam package (shadows our local
    .so). Idempotent and best-effort; never raises. Returns a summary the UI can
    surface from a manual 'Repair conflicts' button too."""
    removed: List[str] = []
    notes: List[str] = []
    try:
        removed += _remove_millennium_framework()
    except Exception as exc:
        notes.append(f"millennium repair error: {exc}")
    try:
        notes += _remove_system_slssteam_pkg()
    except Exception as exc:
        notes.append(f"pacman repair error: {exc}")
    if removed:
        _log("Conflict repair removed: " + ", ".join(removed))
    for n in notes:
        _log("Conflict repair: " + n)
    return {"success": True, "removed": removed, "notes": notes,
            "changed": bool(removed)}


_GAMEMODE_SENTINEL = "# managed-by: luatools-slssteam"


def _real_steam_binary() -> str:
    for c in ("/usr/bin/steam", "/usr/games/steam", "/usr/local/bin/steam", "/bin/steam"):
        if os.path.exists(c):
            return c
    return shutil.which("steam") or "/usr/bin/steam"


def _gamescope_base() -> str:
    """Detect the installed gamescope session flavour (Deck Game Mode).

    Robust against the plugin running as root (stripped PATH, so shutil.which
    misses the launcher) and against SteamOS builds that ship the session as a
    /usr/bin script with no /usr/share|/etc/gamescope-session*/sessions.d dir."""
    # An existing user config dir (possibly one we wrote before) wins.
    for base in ("gamescope-session-plus", "gamescope-session"):
        if os.path.isdir(os.path.join(_home(), ".config", base)):
            return base
    # System session data / override dirs.
    for root in ("/usr/share", "/etc"):
        for base in ("gamescope-session-plus", "gamescope-session"):
            p = os.path.join(root, base, "sessions.d")
            if os.path.isdir(p) or os.path.isfile(os.path.join(p, "steam")):
                return base
    # The launcher binary/script itself — probe common dirs directly, since
    # which() depends on PATH which is empty for a root service.
    for base in ("gamescope-session-plus", "gamescope-session"):
        if shutil.which(base):
            return base
        for d in ("/usr/bin", "/usr/local/bin", "/bin", "/usr/sbin"):
            if os.path.isfile(os.path.join(d, base)):
                return base
    # A running session process.
    try:
        out = subprocess.run(
            ["pgrep", "-fa", "gamescope-session"],
            capture_output=True, text=True, timeout=3,
        ).stdout
        if "gamescope-session-plus" in out:
            return "gamescope-session-plus"
        if "gamescope-session" in out:
            return "gamescope-session"
    except Exception:
        pass
    # SteamOS/Deck default: the modern session is gamescope-session-plus, and it
    # sources ~/.config/gamescope-session-plus/sessions.d even without a system
    # dir present.
    try:
        if os.path.isdir("/home/deck"):
            return "gamescope-session-plus"
        with open("/etc/os-release", "r", encoding="utf-8", errors="ignore") as fh:
            if "steamos" in fh.read().lower():
                return "gamescope-session-plus"
    except Exception:
        pass
    return ""


def _path_wrapper() -> str:
    return os.path.join(lib_dir(), "path", "steam")


def ensure_launch_wrapper() -> bool:
    """Boot-time self-heal for the Steam desktop icon.

    The moon/Lumen re-binds the Steam .desktop launchers to path/steam on every
    launch, but h3adcr-b renames path/steam away — so after a reboot the icon can
    dangle ("Could not find …/path/steam"). Recreate the wrapper whenever the
    moon is installed so the launchers always resolve. No-op if SLSsteam isn't
    installed (nothing points at path/steam then)."""
    try:
        ld = lib_dir()
        if not ld or not os.path.isdir(ld):
            return False
        w = _path_wrapper()
        if os.path.isfile(w):
            return False  # already present; leave as-is
        _ensure_path_wrapper()
        _log("Recreated missing path/steam launch wrapper at boot")
        return True
    except Exception as exc:
        _log(f"ensure_launch_wrapper skipped: {exc}")
        return False


def _reset_inject_failsafe() -> None:
    """Clear the path/steam crash-loop counter — call when injection is confirmed
    working, or when the user re-activates / re-pins the client (a fresh attempt
    that should get to inject again)."""
    try:
        p = os.path.join(lib_dir(), ".inject_fails")
        with open(p, "w", encoding="utf-8") as fh:
            fh.write("0\n")
        _chown_file_to_user(p)
    except Exception:
        pass


def _ensure_path_wrapper() -> str:
    """Create SLSsteam's path/steam wrapper: sets LD_AUDIT then execs real Steam.

    SLSsteam's setup.sh only makes this for the fish shell, so on the Deck (bash)
    we create it ourselves. The gamescope Game Mode hook points STEAMCMD here."""
    ld = lib_dir()
    pathdir = os.path.join(ld, "path")
    os.makedirs(pathdir, exist_ok=True)
    real = _real_steam_binary()
    parts = []
    li = os.path.join(ld, "library-inject.so")
    so = os.path.join(ld, "SLSsteam.so")
    if os.path.isfile(li):
        parts.append(li)
    if os.path.isfile(so):
        parts.append(so)
    audit = ":".join(parts)
    _ = audit  # (kept for clarity; resolved live below)
    fail = os.path.join(ld, ".inject_fails")
    # Self-healing + CRASH-LOOP FAILSAFE.
    #   * Self-healing: if the SLSsteam hook is gone (plugin uninstalled), the
    #     wrapper just execs Steam normally, so a leftover patched .desktop can
    #     never brick the launcher.
    #   * Failsafe: injection happens at Steam launch, BEFORE anything can fix an
    #     incompatible client — so if the client has drifted, the moon crashes
    #     Steam (and Decky with it) before headcrab could re-pin. The wrapper
    #     counts injection attempts and, after 2 un-recovered ones, launches
    #     Steam WITHOUT injection so Steam + Decky stay up and the plugin can
    #     re-pin the client. The plugin resets the counter to 0 whenever
    #     injection is confirmed working, or on activate/client-fix.
    lines = [
        "#!/bin/sh",
        '# SLSsteam launch wrapper (self-healing + crash-loop failsafe).',
        'REAL="%s"' % real,
        'SO="%s"' % so,
        'LI="%s"' % li,
        'FAIL="%s"' % fail,
        'n=$(cat "$FAIL" 2>/dev/null || echo 0)',
        'case "$n" in ""|*[!0-9]*) n=0 ;; esac',
        'if [ -f "$SO" ] && [ "$n" -lt 2 ]; then',
        '  echo $((n+1)) > "$FAIL" 2>/dev/null',
        '  AUD="$SO"; [ -f "$LI" ] && AUD="$LI:$SO"',
        '  LD_AUDIT="$AUD" exec "$REAL" "$@"',
        'fi',
        '# failsafe: too many failed injected launches — run Steam clean.',
        'exec "$REAL" "$@"',
    ]
    w = _path_wrapper()
    with open(w, "w", encoding="utf-8") as fh:
        fh.write(chr(10).join(lines) + chr(10))
    os.chmod(w, 0o755)
    _chown_file_to_user(pathdir)
    _chown_file_to_user(w)
    return w


def boot_desktop_icon_guard() -> bool:
    """On plugin startup, make sure the Steam desktop icon isn't left pointing at
    path/steam (which a prior reinstall's desktop-coverage may have set). Restore
    it to /usr/bin/steam and neutralise the coverage script so it stays put.
    No-op if SLSsteam isn't installed."""
    try:
        if not find_installed_lib():
            return False
        _neutralize_desktop_coverage()
        n = _restore_desktop_launchers()
        if n:
            _log(f"Boot guard restored {n} Steam .desktop launcher(s) to /usr/bin/steam")
        return bool(n)
    except Exception as exc:
        _log(f"boot_desktop_icon_guard skipped: {exc}")
        return False


def _neutralize_desktop_coverage() -> bool:
    """Stop the moon's desktop-coverage from re-pointing the Steam icon at
    path/steam. Overwrites ensure-desktop-coverage.sh (and the lib it sources)
    with no-ops. headcrab re-extracts these on each reinstall, so we redo it
    every install; between installs nothing re-binds (no Lumen daemon runs)."""
    changed = False
    ld = lib_dir()
    for rel in ("ensure-desktop-coverage.sh", "desktop-coverage.lib.sh"):
        p = os.path.join(ld, rel)
        try:
            if not os.path.isfile(p):
                continue
            with open(p, "w", encoding="utf-8") as fh:
                fh.write("#!/bin/sh\n# neutralised by SLSDeck: leave the Steam "
                         "desktop launcher on /usr/bin/steam.\nexit 0\n")
            os.chmod(p, 0o755)
            _chown_file_to_user(p)
            changed = True
        except Exception as exc:
            _log(f"neutralise {rel} failed: {exc}")
    return changed


def _restore_desktop_launchers() -> int:
    """Undo the desktop-coverage patch: revert any *steam*.desktop whose Exec
    points at our path/steam wrapper back to launching 'steam' directly. Keeps
    an uninstall/deactivate from leaving the Steam icon pointing at a deleted
    wrapper. Returns the number of launchers restored."""
    dirs = [
        os.path.join(_home(), ".local", "share", "applications"),
        "/usr/share/applications",
        os.path.join(_home(), ".config", "autostart"),
        "/etc/xdg/autostart",
    ]
    n = 0
    for d in dirs:
        try:
            if not os.path.isdir(d):
                continue
            for fn in os.listdir(d):
                if not fn.endswith(".desktop") or "steam" not in fn.lower():
                    continue
                p = os.path.join(d, fn)
                try:
                    txt = open(p, "r", encoding="utf-8", errors="ignore").read()
                except Exception:
                    continue
                if "SLSsteam/path/steam" not in txt:
                    continue
                new_txt = re.sub(r'(?m)^(Exec=).*SLSsteam/path/steam\s*(.*)$',
                                 r'\1/usr/bin/steam \2', txt)
                if new_txt == txt:
                    continue
                try:
                    tmp = p + ".sltmp"
                    with open(tmp, "w", encoding="utf-8") as fh:
                        fh.write(new_txt)
                    os.replace(tmp, p)
                    try:
                        _chown_file_to_user(p)
                    except Exception:
                        pass
                    n += 1
                except Exception:
                    continue
        except Exception:
            continue
    return n


def _gamescope_hook_files() -> List[str]:
    """Return all plausible gamescope session hook target locations so all SteamOS
    channels (Prerelease, Beta, Main, Stable) and distro variants are covered."""
    out = []
    home = _home()
    bases = ["gamescope-session-plus", "gamescope-session", "gamescope"]
    primary = _gamescope_base()
    if primary and primary not in bases:
        bases.insert(0, primary)
    for b in bases:
        p = os.path.join(home, ".config", b, "sessions.d", "steam")
        if p not in out:
            out.append(p)
    return out


def _gamescope_hook_file() -> Optional[str]:
    files = _gamescope_hook_files()
    for f in files:
        if os.path.isfile(f):
            return f
    return files[0] if files else None


def _gamescope_hook_content() -> str:
    wrapper = _path_wrapper()
    lines = [
        _GAMEMODE_SENTINEL,
        "# Re-point Game Mode launcher at the SLSsteam wrapper, preserving the",
        "# distro's own client flags across 32-bit & 64-bit gamescope session beta settings.",
        'if [ -n "${CLIENTCMD:-}" ]; then',
        '  _lt_args="${CLIENTCMD#* }"',
        '  [ "$_lt_args" = "$CLIENTCMD" ] && _lt_args=""',
        'else',
        '  _lt_args=""',
        'fi',
        'export STEAMCMD="%s${_lt_args:+ $_lt_args}"' % wrapper,
    ]
    return chr(10).join(lines) + chr(10)


def install_gamescope_hook() -> Dict[str, Any]:
    hooks = _gamescope_hook_files()
    if not hooks:
        return {"success": False, "error": "No gamescope session (not Game Mode)"}
    _ensure_path_wrapper()
    written = []
    try:
        for hook in hooks:
            d = os.path.dirname(hook)
            os.makedirs(d, exist_ok=True)
            if os.path.isfile(hook):
                try:
                    with open(hook, "r", encoding="utf-8", errors="ignore") as fh:
                        existing = fh.read()
                except Exception:
                    existing = ""
                if _GAMEMODE_SENTINEL not in existing:
                    shutil.copy2(hook, hook + f".bak.{int(time.time())}")
            with open(hook, "w", encoding="utf-8") as fh:
                fh.write(_gamescope_hook_content())
            os.chmod(hook, 0o644)
            # Only the specific files/dirs we just created. This used to also
            # chown ~/.config RECURSIVELY, once per hook -- three full walks of
            # ~8000 entries every time the watchdog fired.
            from .utils import chown_to_user as _c
            for p in (os.path.dirname(os.path.dirname(hook)), d, hook):
                _c(p, recursive=False)
            written.append(hook)
            logger.log(f"SLSsteam: gamescope Game Mode hook written -> {hook}")
        return {"success": True, "hook": written[0] if written else "", "all_hooks": written}
    except Exception as exc:
        logger.error(f"SLSsteam: gamescope hook failed: {exc}")
        return {"success": False, "error": str(exc)}


def remove_gamescope_hook() -> None:
    for hook in _gamescope_hook_files():
        if not hook or not os.path.isfile(hook):
            continue
        try:
            with open(hook, "r", encoding="utf-8", errors="ignore") as fh:
                if _GAMEMODE_SENTINEL in fh.read():
                    os.remove(hook)
                    logger.log(f"SLSsteam: gamescope Game Mode hook removed ({hook})")
        except Exception as exc:
            logger.warn(f"SLSsteam: remove gamescope hook failed for {hook}: {exc}")


def gamescope_hook_active() -> bool:
    for hook in _gamescope_hook_files():
        if hook and os.path.isfile(hook):
            try:
                with open(hook, "r", encoding="utf-8", errors="ignore") as fh:
                    if _GAMEMODE_SENTINEL in fh.read():
                        return True
            except Exception:
                pass
    return False


def activate_injection() -> Dict[str, Any]:
    """Activate SLSsteam so Steam loads it.

    Preferred (Deck/handheld Game Mode): a rootless, persistent gamescope
    sessions.d override that re-points STEAMCMD at the SLSsteam path/steam
    LD_AUDIT wrapper — the method the maintained Linux port uses; Steam cannot
    overwrite it. Fallback (plain desktop, no gamescope session): wrap steam.sh.
    """
    hook_res = install_gamescope_hook()
    hook_ok = bool(hook_res.get("success"))
    # Do NOT restore steam.sh here. Desktop mode launches through steam.sh (which
    # headcrab patches earlier in the install flow) while Game Mode launches
    # through the gamescope hook — the two paths are independent and both point
    # at the same path/steam LD_AUDIT injection. Restoring steam.sh would undo
    # headcrab's working Desktop patch and leave Desktop uninjected. Keep both.
    sh_res = _activate_steam_sh_wrapper()
    sh_ok = bool(sh_res.get("success"))
    # Deliberate (re)activation — give injection a fresh run at the failsafe.
    try:
        _reset_inject_failsafe()
    except Exception:
        pass
    if hook_ok or sh_ok:
        methods = ([] + (["gamescope"] if hook_ok else []) +
                   (["steam.sh"] if sh_ok else []))
        return {
            "success": True,
            "method": "+".join(methods) or "steam.sh",
            "hook": hook_res.get("hook"),
            "wrapper": _path_wrapper(),
            "steamSh": sh_res.get("steamSh"),
        }
    return {"success": False,
            "error": hook_res.get("error") or sh_res.get("error") or "activation failed"}


def _activate_steam_sh_wrapper() -> Dict[str, Any]:
    """Desktop fallback: install the LD_AUDIT wrapper over steam.sh."""
    root, sh = _steam_root_and_sh()
    if not sh:
        return {"success": False, "error": "steam.sh not found"}
    d = os.path.dirname(sh)
    orig = os.path.join(d, "steam.sh.slsorig")
    try:
        current = ""
        try:
            with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
                current = fh.read()
        except Exception:
            pass
        already = _WRAPPER_MARK in current
        # Only back up steam.sh when it's genuinely pristine (mentions
        # bootstrap.tar.xz and has no injection markers) so we never save an
        # already-wrapped launcher as the "original".
        if not already and not os.path.exists(orig) and _looks_pristine(current):
            shutil.copy2(sh, orig)
        if not os.path.exists(orig):
            return {"success": False, "error": "Could not back up steam.sh"}

        # client.sh = a pristine copy of Valve's launcher that our wrapper sources.
        client = os.path.join(d, "client.sh")
        if not os.path.exists(client):
            shutil.copy2(orig, client)
        try:
            os.chmod(client, 0o755)
        except Exception:
            pass

        wrapper = _WRAPPER_TEMPLATE.format(mark=_WRAPPER_MARK, slsdir=lib_dir(), client=client)
        tmp = sh + ".slsnew"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(wrapper)
        os.chmod(tmp, 0o755)
        os.replace(tmp, sh)
        # Lock the launcher read-only so Steam can't overwrite our wrapper on
        # relaunch/update (the protection h3adcr-b relies on: chmod 555 + steam.cfg).
        try:
            os.chmod(sh, 0o555)
        except Exception:
            pass

        cfg = os.path.join(d, "steam.cfg")
        if not os.path.exists(cfg):
            with open(cfg, "w", encoding="utf-8") as fh:
                fh.write(_STEAM_CFG)

        for p in (sh, orig, cfg, client):
            _chown_file_to_user(p)
        logger.log(f"SLSsteam: injection activated via {sh}")
        return {"success": True, "steamSh": sh, "backup": orig}
    except Exception as exc:
        logger.error(f"SLSsteam: activate_injection failed: {exc}")
        return {"success": False, "error": str(exc)}


# Markers that mean steam.sh has been wrapped for injection (by us OR headcrab).
_INJECT_MARKERS = ("SLSDeck/SLSsteam injection", "SLSsteam", "LD_AUDIT",
                   "GameLauncher", "INJECT_SLS", "headcrab", "client.sh")


def _looks_injected(text: str) -> bool:
    return any(m in (text or "") for m in _INJECT_MARKERS)


def _looks_pristine(text: str) -> bool:
    """A genuine Valve steam.sh mentions bootstrap.tar.xz and has no hook markers."""
    return ("bootstrap.tar.xz" in (text or "")) and not _looks_injected(text)


def _restore_steam_sh() -> bool:
    """Restore a pristine steam.sh, undoing EITHER our wrapper or headcrab's
    launcher. Tries the saved backup, then client.sh, then the bootstrap archive,
    then (last resort) removes steam.sh so Steam regenerates it."""
    root, sh = _steam_root_and_sh()
    if not sh:
        return False
    d = os.path.dirname(sh)
    try:
        with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
            current = fh.read()
    except Exception:
        current = ""
    if not _looks_injected(current):
        return False  # already pristine — nothing to undo

    try:
        os.chmod(sh, 0o755)  # our/headcrab wrapper is read-only (555)
    except Exception:
        pass

    # 1) a saved pristine copy (our backup or the client.sh both wrappers source)
    for cand in (os.path.join(d, "steam.sh.slsorig"), os.path.join(d, "client.sh")):
        try:
            if os.path.isfile(cand):
                with open(cand, "r", encoding="utf-8", errors="ignore") as fh:
                    ctext = fh.read()
                if _looks_pristine(ctext):
                    shutil.copy2(cand, sh)
                    os.chmod(sh, 0o755)
                    _chown_file_to_user(sh)
                    logger.log(f"SLSsteam: steam.sh restored from {os.path.basename(cand)}")
                    return True
        except Exception:
            continue

    # 2) extract a fresh steam.sh from Valve's bootstrap archive
    boot = os.path.join(d, "bootstrap.tar.xz")
    try:
        if os.path.isfile(boot):
            subprocess.run(["tar", "xJf", boot, "-C", d, "steam.sh"],
                           timeout=60, check=False)
            with open(sh, "r", encoding="utf-8", errors="ignore") as fh:
                if _looks_pristine(fh.read()):
                    os.chmod(sh, 0o755)
                    _chown_file_to_user(sh)
                    logger.log("SLSsteam: steam.sh restored from bootstrap.tar.xz")
                    return True
    except Exception:
        pass

    # 3) last resort: remove it — Steam regenerates steam.sh on next launch
    try:
        os.remove(sh)
        logger.log("SLSsteam: removed patched steam.sh (Steam will regenerate it)")
        return True
    except Exception as exc:
        logger.warn(f"SLSsteam: could not restore steam.sh: {exc}")
        return False


_HEADCRAB_CFG_RE = re.compile(
    r"^[ \t]*BootStrapper(InhibitAll|ForceSelfUpdate)[ \t]*=.*$", re.MULTILINE)


def _remove_update_block() -> bool:
    """Strip headcrab's BootStrapper lines from steam.cfg so Steam updates normally
    again, preserving any other (user-authored) content. Deletes the file only when
    nothing else is left. Returns True if steam.cfg was changed or removed."""
    root, sh = _steam_root_and_sh()
    if not sh:
        return False
    cfg = os.path.join(os.path.dirname(sh), "steam.cfg")
    try:
        if not os.path.isfile(cfg):
            return False
        with open(cfg, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
        if "BootStrapper" not in content:
            return False  # not headcrab's — leave a user-authored steam.cfg alone
        stripped = _HEADCRAB_CFG_RE.sub("", content)
        stripped = re.sub(r"\n{3,}", "\n\n", stripped).strip()
        if stripped:
            with open(cfg, "w", encoding="utf-8") as fh:
                fh.write(stripped + "\n")
            _chown_to_user(cfg)
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


def _write_shims(shim_dir: str) -> None:
    os.makedirs(shim_dir, exist_ok=True)
    wget = os.path.join(shim_dir, "wget")
    with open(wget, "w", encoding="utf-8") as fh:
        fh.write(_WGET_SHIM)
    os.chmod(wget, 0o755)
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
    _cfg_removed = None
    try:
        _root, _sh = _steam_root_and_sh()
        if _sh:
            _cfg = os.path.join(os.path.dirname(_sh), "steam.cfg")
            if os.path.isfile(_cfg):
                _cfg_removed = _cfg
                os.remove(_cfg)
                _log("Temporarily removed steam.cfg so the client downgrade isn't blocked")
    except Exception:
        pass

    def _restore_update_block():
        """Put the update block back no matter how this function exits."""
        if not _cfg_removed:
            return
        try:
            if os.path.isfile(_cfg_removed):
                return  # headcrab already recreated it
            with open(_cfg_removed, "w", encoding="utf-8") as fh:
                fh.write(_STEAM_CFG)
            try:
                from .utils import chown_to_user as _c
                _c(_cfg_removed, recursive=False)
            except Exception:
                pass
            _log("Restored steam.cfg update block")
        except Exception as exc:
            logger.warn(f"SLSsteam: could not restore steam.cfg: {exc}")

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
                for _kill in (p.terminate, p.kill):
                    try:
                        _kill()
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
    return bool(find_installed_lib())


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
        return {"needed": True, "reason": "SLSsteam has never loaded (no ~/.SLSsteam.log)"}
    try:
        text = open(log_path, "r", encoding="utf-8", errors="ignore").read()
    except Exception as exc:
        return {"needed": True, "reason": f"could not read SLSsteam log: {exc}"}
    # Only the most recent session matters.
    marker = "SLSsteam loading in steam"
    if marker in text:
        text = text[text.rfind(marker):]
    lowered = text.lower()

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
            return {"needed": True,
                    "reason": f"SLSsteam reported '{bad}' against the current client"}
    return {"needed": True, "reason": "SLSsteam did not report a successful load"}


def start_client_fix(force: bool = False) -> Dict[str, Any]:
    # Guard the heavy path: without this, enabling injection re-downloads the
    # whole Steam client even when the installed one is already supported.
    if not force:
        chk = client_fix_needed()
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

    def _worker():
        _INSTALL_LOG.clear()
        _set_install({"status": "running", "error": "", "log": "",
                      "startedAt": time.time()})
        try:
            ok = _run_headcrab_shimmed()
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
            ensure_config()
            installed = bool(find_installed_lib())
            injected = is_injected()
            _set_install({"status": "done", "success": ok or installed,
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
SLS_MOON_API = "https://api.github.com/repos/swwayps/slsteam-moon/releases/latest"


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
        _run_setup_script(root)
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
        _run_setup_script(root)
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
        import httpx
        with httpx.Client(follow_redirects=True, timeout=30) as c:
            r = c.get(SLS_MOON_API, headers={"Accept": "application/vnd.github+json",
                                             "User-Agent": "SLSDeck"})
            r.raise_for_status()
            data = r.json()
        assets = data.get("assets", []) or []
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
        return chosen.get("browser_download_url", "")
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
        return {"success": True, "changed": False}
    ok = _write_config_lines(lines)
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


def pin_app_gids(appid, depot_gids: Dict[int, str]) -> Dict[str, Any]:
    """Pin the game to a SPECIFIC set of depot manifest gids (build-accurate),
    e.g. the setManifestid gids from a fix's manifest .lua — as opposed to
    pin_app_current which locks whatever is installed now. slsteam-moon fetches
    each manifest on demand via the depot key, so the build need not be installed
    or archived yet."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
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
        if installed and all(installed.get(d) == g for d, g in clean.items()):
            already_on_build = True
            changed = False
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
            from . import buildhistory
            buildhistory.snapshot(appid, clean, source="pin")
        except Exception:
            pass
    return {"success": ok, "depots": len(clean), "changed": changed,
            "wasPinned": was_pinned, "alreadyOnBuild": already_on_build}


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
