"""Persisted plugin settings — multiple per-source API keys.

Keys are stored under ``apiKeys`` keyed by their manifest placeholder token
(e.g. ``<moapikey>``) so the user can save several keys, one per source. The
legacy single ``morrenusApiKey`` field is still honoured for compatibility.
"""

from __future__ import annotations

import json
import os
import threading
from typing import Any, Dict

from .logger import logger
from .paths import get_user_home, settings_path

_LOCK = threading.Lock()
_CACHE: Dict[str, Any] = {}
_LOADED = False

SETTINGS_FILE = "settings.json"
API_KEYS_FIELD = "apiKeys"
_LEGACY_MORRENUS_PLACEHOLDER = "<moapikey>"


def _file() -> str:
    return settings_path(SETTINGS_FILE)


# True when settings.json EXISTS but could not be read or parsed. In that state an
# empty cache must never be written back over it: doing so turns a transient read
# error or a half-written file into permanent, total loss of the user's settings
# (API keys, added-game history, every toggle).
_LOAD_FAILED = False


def _load_locked() -> Dict[str, Any]:
    global _CACHE, _LOADED, _LOAD_FAILED
    if _LOADED:
        return _CACHE
    import os
    path = _file()
    _LOAD_FAILED = False
    if not os.path.exists(path):
        _CACHE = {}                      # genuine first run
    else:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                _CACHE = json.load(handle) or {}
        except Exception as exc:
            # The file is there but unreadable. Start empty in memory so the UI
            # still works, keep a copy of the original, and block persistence
            # until the user actually changes something.
            _CACHE = {}
            _LOAD_FAILED = True
            logger.warn(f"SLSDeck: settings unreadable ({exc}); refusing to overwrite {path}")
            try:
                bad = path + ".corrupt"
                if not os.path.exists(bad):
                    import shutil
                    shutil.copy2(path, bad)
                    logger.warn(f"SLSDeck: kept a copy at {bad}")
            except Exception:
                pass
    _LOADED = True
    return _CACHE


def reset_cache() -> None:
    """Force the next read to come from disk.

    restore_backup() replaces settings.json underneath us; without this the stale
    in-memory cache gets persisted straight back and the restore silently reverts."""
    global _LOADED, _LOAD_FAILED
    _LOADED = False
    _LOAD_FAILED = False


def _persist_locked() -> None:
    import os
    # Never write an empty cache over a file we failed to read -- that is the
    # difference between "your settings are temporarily unavailable" and "your
    # settings are gone forever".
    if _LOAD_FAILED and not _CACHE:
        logger.warn("SLSDeck: skipping settings write (previous load failed and "
                    "there is nothing to save) to avoid clobbering the existing file")
        return
    path = _file()
    tmp = path + ".tmp"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump(_CACHE, handle, indent=2)
        # This file holds secrets: the Steam Web API key, per-source manifest API
        # keys, the online-fix username. It was being created 0644 -- readable by
        # every user and every process on the machine. Lock it down BEFORE it is
        # moved into place so it never exists world-readable, even briefly.
        try:
            os.chmod(tmp, 0o600)
        except Exception:
            pass
        os.replace(tmp, path)
        try:
            os.chmod(path, 0o600)
        except Exception:
            pass
        try:
            from .utils import chown_to_user
            chown_to_user(path, recursive=False)
        except Exception:
            pass
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to persist settings: {exc}")
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except Exception:
            pass


def get_value(key: str, default: Any = "") -> Any:
    with _LOCK:
        values = _load_locked()
        return values.get(key, default)


def set_value(key: str, value: Any) -> None:
    with _LOCK:
        _load_locked()
        _CACHE[key] = value
        _persist_locked()


def get_pinned_build(appid) -> str:
    """The buildid a game was pinned to, recorded at pin time (the config only
    stores the {depot: gid} map, so we remember the human-facing build here)."""
    try:
        m = get_value("pinnedBuilds", {}) or {}
        return str(m.get(str(int(appid)), ""))
    except Exception:
        return ""


def set_pinned_build(appid, buildid) -> None:
    try:
        m = dict(get_value("pinnedBuilds", {}) or {})
        key = str(int(appid))
        if buildid:
            m[key] = str(buildid)
        else:
            m.pop(key, None)
        set_value("pinnedBuilds", m)
    except Exception:
        pass


# ── multiple API keys ──────────────────────────────────────────────────────
def get_api_keys() -> Dict[str, str]:
    """Return the placeholder -> key map (merging the legacy single key)."""
    with _LOCK:
        values = _load_locked()
        keys = dict(values.get(API_KEYS_FIELD, {}) or {})
        legacy = str(values.get("morrenusApiKey", "") or "")
    if legacy and not keys.get(_LEGACY_MORRENUS_PLACEHOLDER):
        keys[_LEGACY_MORRENUS_PLACEHOLDER] = legacy
    return keys


def get_api_key_for(placeholder: str) -> str:
    return str(get_api_keys().get(placeholder, "") or "")


def set_api_key_for(placeholder: str, key: str) -> None:
    placeholder = str(placeholder or "").strip()
    if not placeholder:
        return
    with _LOCK:
        values = _load_locked()
        keys = dict(values.get(API_KEYS_FIELD, {}) or {})
        keys[placeholder] = str(key or "").strip()
        _CACHE[API_KEYS_FIELD] = keys
        if placeholder == _LEGACY_MORRENUS_PLACEHOLDER:
            _CACHE["morrenusApiKey"] = keys[placeholder]
        _persist_locked()


def get_morrenus_api_key() -> str:
    return get_api_key_for(_LEGACY_MORRENUS_PLACEHOLDER)


def set_morrenus_api_key(key: str) -> None:
    set_api_key_for(_LEGACY_MORRENUS_PLACEHOLDER, key)


def get_all() -> Dict[str, Any]:
    with _LOCK:
        return dict(_load_locked())


def get_slssteam_dlc_enabled() -> bool:
    return bool(get_value("slssteamDlc", False))


def set_slssteam_dlc_enabled(value: bool) -> None:
    set_value("slssteamDlc", bool(value))


# ── game-page bar style ("row" = compact button row, "panel" = titled box) ──
def get_game_bar_style() -> str:
    value = str(get_value("gameBarStyle", "row") or "row")
    return value if value in ("row", "panel") else "row"


def set_game_bar_style(value: str) -> None:
    set_value("gameBarStyle", "panel" if str(value) == "panel" else "row")


# ── floating buttons on game/store pages (off by default; sidebar is primary) ─
def get_floating_enabled() -> bool:
    return bool(get_value("floatingButtons", False))


def set_floating_enabled(value: bool) -> None:
    set_value("floatingButtons", bool(value))


# ── store button fully disabled (overrides floating; no injection at all) ─────
def get_store_disabled() -> bool:
    return bool(get_value("storeButtonDisabled", False))


def set_store_disabled(value: bool) -> None:
    set_value("storeButtonDisabled", bool(value))


def get_skip_wrapper() -> bool:
    """When true, Install does NOT apply the plugin's steam.sh wrapper — only
    headcrab patches steam.sh (for A/B testing headcrab-only injection)."""
    return bool(get_value("skipSteamShWrapper", False))


def set_skip_wrapper(value: bool) -> None:
    set_value("skipSteamShWrapper", bool(value))


# ── injection watchdog: recover automatically after a Steam client update ─────
def get_auto_reinject() -> bool:
    """Auto re-activate injection on boot if it isn't live (light: re-patch
    steam.sh + restart Steam)."""
    return bool(get_value("autoReinject", True))


def set_auto_reinject(value: bool) -> None:
    set_value("autoReinject", bool(value))


def get_auto_client_repin() -> bool:
    """Auto re-run the h3adcr-b client fix on boot if injection broke (heavy:
    pins/downgrades the Steam client, reboots)."""
    return bool(get_value("autoClientRepin", True))


def set_auto_client_repin(value: bool) -> None:
    set_value("autoClientRepin", bool(value))


def get_check_dependencies_on_boot() -> bool:
    """Verify and repair the complete managed dependency chain at boot."""
    return bool(get_value("checkDependenciesOnBoot", True))


def set_check_dependencies_on_boot(value: bool) -> None:
    set_value("checkDependenciesOnBoot", bool(value))


# ── hypervisor per-game flags (appid -> True) ────────────────────────────────
HV_GAMES_FIELD = "hvGames"


def get_hv_games() -> Dict[str, bool]:
    with _LOCK:
        values = _load_locked()
        d = values.get(HV_GAMES_FIELD, {})
        return {str(k): bool(v) for k, v in d.items()} if isinstance(d, dict) else {}


def get_hv_game(appid: int) -> bool:
    return bool(get_hv_games().get(str(appid), False))


def set_hv_game(appid: int, enabled: bool) -> None:
    with _LOCK:
        values = _load_locked()
        d = values.get(HV_GAMES_FIELD, {})
        d = dict(d) if isinstance(d, dict) else {}
        if enabled:
            d[str(appid)] = True
        else:
            d.pop(str(appid), None)
        values[HV_GAMES_FIELD] = d
        _persist_locked()


# ── hypervisor: auto-manage UMIP on boot ─────────────────────────────────────
def get_umip_auto() -> bool:
    return bool(get_value("umipAuto", True))


def set_umip_auto(value: bool) -> None:
    set_value("umipAuto", bool(value))


# ── hypervisor: load the anti-Denuvo module globally at startup (opt-in) ──────
def get_hv_autoload() -> bool:
    return bool(get_value("hvAutoload", False))


def set_hv_autoload(value: bool) -> None:
    set_value("hvAutoload", bool(value))


# ── custom Proton (GE-Proton-HV) download source for Denuvo games ─────────────
# Canonical LinUwUx build published with SLSDeck's rolling main release.
DEFAULT_PROTON_URL = (
    "https://github.com/Kaal31/slsdeck/releases/download/main-latest/"
    "Proton-GE11-1-LinUwUx.tar.gz"
)
# Stale values that used to be defaults; treat them as unset so existing
# installs migrate to the canonical rolling asset instead of resolving an old
# fork or a removed release.
_STALE_PROTON_URLS = (
    "https://github.com/Kaal31/slsdeckhv/releases/download/latest/GE-Proton11-1-LinUwUx.tar.gz",
    "xXJSONDeruloXx/proton-LinUwUx-patch",
    "brcly/proton-LinUwUx-patch",
)


def get_proton_url() -> str:
    val = str(get_value("protonUrl", DEFAULT_PROTON_URL) or "").strip()
    if not val or val in _STALE_PROTON_URLS or any(
        hint in val
        for hint in (
            "Kaal31/slsdeckhv",
            "xXJSONDeruloXx/proton-LinUwUx-patch",
            "brcly/proton-LinUwUx-patch",
        )
    ):
        return DEFAULT_PROTON_URL
    return val


def set_proton_url(value: str) -> None:
    set_value("protonUrl", (value or "").strip())


# ── manifest pinning on fix-apply ────────────────────────────────────────────
def get_pin_on_fix() -> bool:
    return bool(get_value("pinOnFix", True))


def set_pin_on_fix(value: bool) -> None:
    set_value("pinOnFix", bool(value))


def get_no_internet_fix() -> bool:
    # OST-style fix: strip the steam.cfg update-block while a pinned build
    # downloads, so Steam doesn't fail with "no internet connection". On by default.
    return bool(get_value("noInternetFix", True))


def set_no_internet_fix(value: bool) -> None:
    set_value("noInternetFix", bool(value))


def get_auto_repoint() -> bool:
    """After a fix is applied to a game whose real executable is nested (e.g. an
    Unreal *-Shipping.exe), automatically rewrite the Steam launch target to that
    exe via launch options so the crack actually loads. Opt-in: automatic target
    changes must never happen unless the user explicitly enables them."""
    return bool(get_value("autoRepoint", False))


def set_auto_repoint(value: bool) -> None:
    set_value("autoRepoint", bool(value))


def get_auto_apply() -> bool:
    """When True, after pinning a fix's build and triggering the Steam update we
    poll for the download to finish and apply the fix automatically. When False
    (default) the flow is guided: we pin + start the update, then wait for the
    user to press Apply once the download bar completes."""
    return bool(get_value("autoApplyAfterUpdate", False))


def set_auto_apply(value: bool) -> None:
    set_value("autoApplyAfterUpdate", bool(value))


# ── ryuu API key (X-Auth-Key for generator.ryuu.lol gated fix downloads) ──
def get_ryuu_key() -> str:
    return str(get_value("ryuuApiKey", "") or "").strip()


def set_ryuu_key(value: str) -> None:
    set_value("ryuuApiKey", (value or "").strip())


# ── online-fix username (written into emulator configs on fix apply) ─────────
# Blank = auto (use the logged-in Steam account's display/persona name).
def get_online_username() -> str:
    return str(get_value("onlineFixUsername", "") or "").strip()


def set_online_username(value: str) -> None:
    set_value("onlineFixUsername", (value or "").strip())


# ── CloudRedirect non-Steam shortcut appid (so we launch it in Game Mode) ────
def get_cr_shortcut() -> int:
    try:
        return int(get_value("crShortcutAppId", 0) or 0)
    except Exception:
        return 0


def set_cr_shortcut(value: int) -> None:
    try:
        set_value("crShortcutAppId", int(value or 0))
    except Exception:
        set_value("crShortcutAppId", 0)


# ── dependency version tracking (for the boot update-check) ──────────────────
def get_dep_version(name: str) -> str:
    return str(get_value(f"depVer:{name}", "") or "").strip()


def set_dep_version(name: str, tag: str) -> None:
    set_value(f"depVer:{name}", (tag or "").strip())


def get_last_plugin_version() -> str:
    """The plugin version last seen at boot — used to detect a plugin update and
    re-check the engine / headcrab afterwards."""
    return str(get_value("lastPluginVersion", "") or "").strip()


def set_last_plugin_version(v: str) -> None:
    set_value("lastPluginVersion", (v or "").strip())


def get_auto_update() -> bool:
    v = get_value("autoUpdateDeps", True)
    return True if v is None else bool(v)


def set_auto_update(enabled: bool) -> None:
    set_value("autoUpdateDeps", bool(enabled))

# ── hide plugin buttons on genuinely-owned games ─────────────────────────────
def get_hide_on_owned() -> bool:
    return bool(get_value("hideOnOwned", True))


def set_hide_on_owned(value: bool) -> None:
    set_value("hideOnOwned", bool(value))


# ── DLC unlockers (CreamAPI / SmokeAPI / Ubisoft) only on owned games ────────
def get_dlc_owned_only() -> bool:
    return bool(get_value("dlcOwnedOnly", True))


def set_dlc_owned_only(value: bool) -> None:
    set_value("dlcOwnedOnly", bool(value))


# ── group SLS-added games into an auto-maintained Steam collection ────────────
def get_group_collection() -> bool:
    return bool(get_value("groupCollection", False))


def set_group_collection(value: bool) -> None:
    set_value("groupCollection", bool(value))


# ── include imported custom fixes/manifests in the backup archive ────────────
def get_backup_custom() -> bool:
    return bool(get_value("backupCustom", False))


def set_backup_custom(value: bool) -> None:
    set_value("backupCustom", bool(value))


# ── library game-page buttons (the injected Add / Fixes bar) ─────────────────
def get_library_buttons() -> bool:
    return bool(get_value("libraryButtons", True))


def set_library_buttons(value: bool) -> None:
    set_value("libraryButtons", bool(value))


# ── badges ───────────────────────────────────────────────────────────────────
def get_badge_sls() -> bool:
    return bool(get_value("badgeSls", True))


def set_badge_sls(value: bool) -> None:
    set_value("badgeSls", bool(value))


def get_badge_legit() -> bool:
    return bool(get_value("badgeLegit", True))


def set_badge_legit(value: bool) -> None:
    set_value("badgeLegit", bool(value))


def get_badge_denuvo() -> bool:
    return bool(get_value("badgeDenuvo", True))


def set_badge_denuvo(value: bool) -> None:
    set_value("badgeDenuvo", bool(value))


def get_badge_online_fix() -> bool:
    return bool(get_value("badgeOnlineFix", True))


def set_badge_online_fix(value: bool) -> None:
    set_value("badgeOnlineFix", bool(value))


def get_badge_nonsteam() -> bool:
    return bool(get_value("badgeNonSteam", True))


def set_badge_nonsteam(value: bool) -> None:
    set_value("badgeNonSteam", bool(value))


def get_badge_nonsteam_name() -> bool:
    return bool(get_value("badgeNonSteamName", True))


def set_badge_nonsteam_name(value: bool) -> None:
    set_value("badgeNonSteamName", bool(value))


def get_badge_store_page() -> bool:
    return bool(get_value("badgeStorePage", False))


def set_badge_store_page(value: bool) -> None:
    set_value("badgeStorePage", bool(value))


def get_badge_fixed() -> bool:
    return bool(get_value("badgeFixed", True))


def set_badge_fixed(value: bool) -> None:
    set_value("badgeFixed", bool(value))


def get_badge_tokeer() -> bool:
    return bool(get_value("badgeTokeer", True))


def set_badge_tokeer(value: bool) -> None:
    set_value("badgeTokeer", bool(value))


def get_tokeer_applied_games() -> Dict[str, Dict[str, Any]]:
    """Return successful Tokeer activations, keyed by Steam AppID."""
    raw = get_value("tokeerAppliedGames", {}) or {}
    if not isinstance(raw, dict):
        return {}
    return {str(key): dict(value) for key, value in raw.items() if isinstance(value, dict)}


def set_tokeer_applied_game(appid: int, record: Dict[str, Any]) -> None:
    games = get_tokeer_applied_games()
    games[str(int(appid))] = dict(record)
    set_value("tokeerAppliedGames", games)


def get_badge_game_page() -> bool:
    return bool(get_value("badgeGamePage", True))


def set_badge_game_page(value: bool) -> None:
    set_value("badgeGamePage", bool(value))


def get_badge_library() -> bool:
    return bool(get_value("badgeLibrary", True))


def set_badge_library(value: bool) -> None:
    set_value("badgeLibrary", bool(value))


def get_badge_emoji() -> bool:
    """Replace enabled text badges with their compact emoji analogues."""
    return bool(get_value("badgeEmoji", False))


def set_badge_emoji(value: bool) -> None:
    set_value("badgeEmoji", bool(value))


# ── auto-apply fixes after a game is added ───────────────────────────────────
# Off by default: it installs things without asking. Universal Unsteam and the
# netsock patch are never auto-applied (see src/lib/autoFix.ts).
def get_auto_download() -> bool:
    """After a successful add, auto-restart Steam so the added game appears.
    Default OFF — the user restarts when ready."""
    return bool(get_value("autoDownload", False))


def set_auto_download(value: bool) -> None:
    set_value("autoDownload", bool(value))


def get_auto_fix() -> bool:
    return bool(get_value("autoFix", False))


def set_auto_fix(value: bool) -> None:
    set_value("autoFix", bool(value))


def get_auto_add_dlc() -> bool:
    """When adding a game, also fetch the FULL manifest (all depots incl. DLC) so
    the base install pulls all content DLC. Off by default."""
    return bool(get_value("autoAddDlc", False))


def set_auto_add_dlc(value: bool) -> None:
    set_value("autoAddDlc", bool(value))


def get_disable_cloud() -> bool:
    """Disable Steam cloud saves on SLS-added games (moon DisableCloud — only
    affects added/unlocked games, not your legit ones). Off by default. Mutually
    exclusive with CloudRedirect. This mirror flag is the UI's source of truth;
    the real switch is written into moon's config.yaml."""
    return bool(get_value("disableCloud", False))


def set_disable_cloud(value: bool) -> None:
    set_value("disableCloud", bool(value))


def get_check_engine_updates() -> bool:
    """When on, add slsteam-moon (the engine) to the Updates registry so it's
    version-checked. Off by default — engine updates are risky."""
    return bool(get_value("checkEngineUpdates", False))


def set_check_engine_updates(value: bool) -> None:
    set_value("checkEngineUpdates", bool(value))


def get_check_headcrab_updates() -> bool:
    """When on, add headcrab (the client fix) to the Updates registry. It's a
    rolling raw script (no release tags), so 'update' = re-apply the client fix."""
    return bool(get_value("checkHeadcrabUpdates", False))


def set_check_headcrab_updates(value: bool) -> None:
    set_value("checkHeadcrabUpdates", bool(value))


def get_disable_dlc_unlock_owned() -> bool:
    """Disable moon's global DLC unlock for games you legit own (their unowned DLC
    stops auto-unlocking). Off by default. Implemented by blacklisting the owned
    games' DLC appids in moon's AppIds list."""
    return bool(get_value("disableDlcUnlockOwned", False))


def set_disable_dlc_unlock_owned(value: bool) -> None:
    set_value("disableDlcUnlockOwned", bool(value))


# ── netsock multiplayer patch, per game (appid -> True) ──────────────────────
NETSOCK_GAMES_FIELD = "netsockGames"


def get_netsock_games() -> Dict[str, bool]:
    with _LOCK:
        values = _load_locked()
        d = values.get(NETSOCK_GAMES_FIELD, {})
        return {str(k): bool(v) for k, v in d.items()} if isinstance(d, dict) else {}


def get_netsock_game(appid: int) -> bool:
    return bool(get_netsock_games().get(str(appid), False))


def set_netsock_game(appid: int, enabled: bool) -> None:
    with _LOCK:
        values = _load_locked()
        d = values.get(NETSOCK_GAMES_FIELD, {})
        d = dict(d) if isinstance(d, dict) else {}
        if enabled:
            d[str(appid)] = True
        else:
            d.pop(str(appid), None)
        values[NETSOCK_GAMES_FIELD] = d
        _persist_locked()


# ── show the added-games list in the Quick Access panel (under Game controls) ─
def get_games_in_qam() -> bool:
    return bool(get_value("gamesInQam", True))


def set_games_in_qam(value: bool) -> None:
    set_value("gamesInQam", bool(value))


def get_hide_tools_qam() -> bool:
    """Hide the Tools & Diagnostics sections from the Quick Access panel. On by
    default for a cleaner QAM (they remain available in Advanced)."""
    return bool(get_value("hideToolsQam", True))


def set_hide_tools_qam(value: bool) -> None:
    set_value("hideToolsQam", bool(value))


# ── auto-fix pending queue (appids added via SLSsteam awaiting a fix) ─────────
# The game is queued here on add; a background sweep applies its fix once the
# game is actually installed and has no fix yet, then removes it.
AUTO_FIX_PENDING_FIELD = "autoFixPending"


def get_auto_fix_pending() -> list:
    with _LOCK:
        v = _load_locked().get(AUTO_FIX_PENDING_FIELD, [])
        return [int(x) for x in v] if isinstance(v, list) else []


def add_auto_fix_pending(appid: int) -> None:
    with _LOCK:
        values = _load_locked()
        cur = values.get(AUTO_FIX_PENDING_FIELD, [])
        cur = [int(x) for x in cur] if isinstance(cur, list) else []
        if int(appid) not in cur:
            cur.append(int(appid))
        values[AUTO_FIX_PENDING_FIELD] = cur
        _persist_locked()


def remove_auto_fix_pending(appid: int) -> None:
    with _LOCK:
        values = _load_locked()
        cur = values.get(AUTO_FIX_PENDING_FIELD, [])
        cur = [int(x) for x in cur if int(x) != int(appid)] if isinstance(cur, list) else []
        values[AUTO_FIX_PENDING_FIELD] = cur
        _persist_locked()


# ── Quick Access: show the Reinstall SLSsteam button (default on) ────────────
def get_show_reinstall_qam() -> bool:
    return bool(get_value("showReinstallQam", True))


def set_show_reinstall_qam(value: bool) -> None:
    set_value("showReinstallQam", bool(value))


# ── games we have EVER added via SLSsteam (persists across removal) ──────────
# Used so a game whose manifest we removed but is still installed isn't
# mistaken for a genuinely-owned ("legit") title.
EVER_ADDED_FIELD = "everAdded"


# The list lives in its own file under ~/.local/share, NOT in settings.json.
# It is the record of every game the user has ever added, and the plugin's own
# settings directory is wiped by a reinstall/update -- losing this list makes
# previously-added-but-since-unmanifested games look genuinely owned. Keeping it
# outside the plugin dir means it survives. Written atomically (temp +
# os.replace) so an interrupted write cannot truncate the history.
_EVER_LOCK = threading.Lock()


def _ever_added_file() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, "ever_added.json")


def _read_ever_added_file() -> list:
    try:
        with open(_ever_added_file(), "r", encoding="utf-8") as fh:
            v = json.load(fh)
            return [int(x) for x in v] if isinstance(v, list) else []
    except Exception:
        return []


def _write_ever_added_file(ids) -> None:
    path = _ever_added_file()
    try:
        tmp = "%s.tmp.%d" % (path, os.getpid())
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(sorted(set(int(x) for x in ids)), fh, indent=2)
            fh.flush()
            try:
                os.fsync(fh.fileno())
            except Exception:
                pass
        os.replace(tmp, path)
        try:
            from .utils import chown_to_user
            chown_to_user(os.path.dirname(path), recursive=True)
        except Exception:
            pass
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to persist ever_added: {exc}")


def _migrate_legacy_ever_added_locked() -> list:
    """Fold any legacy settings.json everAdded into the stable file (once)."""
    cur = _read_ever_added_file()
    with _LOCK:
        legacy = _load_locked().get(EVER_ADDED_FIELD, [])
    legacy = [int(x) for x in legacy] if isinstance(legacy, list) else []
    if legacy and set(legacy) - set(cur):
        cur = sorted(set(cur) | set(legacy))
        _write_ever_added_file(cur)
    return cur


def get_ever_added() -> list:
    with _EVER_LOCK:
        return _migrate_legacy_ever_added_locked()


def add_ever_added_many(appids) -> None:
    ids = []
    for a in appids or []:
        try:
            ids.append(int(a))
        except Exception:
            pass
    if not ids:
        return
    with _EVER_LOCK:
        cur = _migrate_legacy_ever_added_locked()
        new = set(cur) | set(ids)
        if new != set(cur):
            _write_ever_added_file(sorted(new))


# ── auto-install failure counter (stop auto-retrying a broken dependency) ────
# Keyed by dependency name ("cloudredirect", "proton", "hvmodule"). Auto-install
# paths give up once the count reaches DEP_FAIL_CAP; a manual reinstall resets it.
DEP_FAIL_FIELD = "depFailCounts"
DEP_FAIL_CAP = 3


def get_dep_fail(name: str) -> int:
    with _LOCK:
        d = _load_locked().get(DEP_FAIL_FIELD, {})
        try:
            return int(d.get(str(name), 0)) if isinstance(d, dict) else 0
        except Exception:
            return 0


def inc_dep_fail(name: str) -> int:
    with _LOCK:
        values = _load_locked()
        d = dict(values.get(DEP_FAIL_FIELD, {}) or {})
        n = 0
        try:
            n = int(d.get(str(name), 0))
        except Exception:
            n = 0
        n += 1
        d[str(name)] = n
        values[DEP_FAIL_FIELD] = d
        _persist_locked()
        return n


def reset_dep_fail(name: str) -> None:
    with _LOCK:
        values = _load_locked()
        d = dict(values.get(DEP_FAIL_FIELD, {}) or {})
        if str(name) in d:
            d.pop(str(name), None)
            values[DEP_FAIL_FIELD] = d
            _persist_locked()


def dep_fail_capped(name: str) -> bool:
    return get_dep_fail(name) >= DEP_FAIL_CAP


# ── UI & Toast Notification Customizations ────────────────────────────────────
UI_SETTINGS_DEFAULTS = {
    "toastOnAutoRepair": True,
    "toastOnCloudSync": True,
    "toastOnArtSync": True,
    "uiViewMode": "detailed",  # "detailed" or "compact"
    "autoArtSyncOnAdd": True,
}


def get_ui_settings() -> Dict[str, Any]:
    with _LOCK:
        values = _load_locked()
        res = {}
        for key, default in UI_SETTINGS_DEFAULTS.items():
            res[key] = values.get(key, default)
        return res


def set_ui_setting(key: str, value: Any) -> Dict[str, Any]:
    key = str(key or "").strip()
    if key not in UI_SETTINGS_DEFAULTS:
        return {"success": False, "error": f"Unknown setting key: {key}"}
    with _LOCK:
        _load_locked()
        _CACHE[key] = value
        _persist_locked()
    return {"success": True, "key": key, "value": value}


# ── Steam Web API key (user-supplied) ────────────────────────────────────────
# Needed for Workshop search. The plugin previously shipped a hardcoded key,
# which was both somebody else's credential and long since revoked (HTTP 403),
# so the feature silently never worked. Users mint their own free key at
# https://steamcommunity.com/dev/apikey.
def get_steam_web_api_key() -> str:
    return str(get_value("steamWebApiKey", "") or "").strip()


def set_steam_web_api_key(value: str) -> None:
    set_value("steamWebApiKey", str(value or "").strip())

# Aliases. The upstream build names these get/set_steam_web_key while this build
# has always exposed get/set_steam_web_api_key; both read the same settings field,
# so keep both names working rather than breaking one caller or the other.
def get_steam_web_key() -> str:
    return get_steam_web_api_key()


def set_steam_web_key(value: str) -> None:
    set_steam_web_api_key(value)


def clear_ever_added() -> None:
    """Forget the added-games history (used by purge_all_added).

    BOTH stores have to be cleared. Emptying only the ever_added.json file is
    not enough: the next get_ever_added() runs the legacy migration, finds the
    old list still sitting in settings.json, and merges it straight back -- so
    the history would reappear and "purge all added games" would not stick."""
    with _EVER_LOCK:
        try:
            _write_ever_added_file([])
        except Exception:
            pass
        try:
            set_value(EVER_ADDED_FIELD, [])
        except Exception:
            pass
