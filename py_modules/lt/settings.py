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


_LOAD_FAILED = False


def _load_locked() -> Dict[str, Any]:
    global _CACHE, _LOADED, _LOAD_FAILED
    if _LOADED:
        return _CACHE
    path = _file()
    _LOAD_FAILED = False
    if not os.path.exists(path):
        _CACHE = {}
    else:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                _CACHE = json.load(handle) or {}
        except Exception as exc:
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
    global _LOADED, _LOAD_FAILED
    _LOADED = False
    _LOAD_FAILED = False


def _persist_locked() -> None:
    if _LOAD_FAILED and not _CACHE:
        logger.warn("SLSDeck: skipping settings write (previous load failed and there is nothing to save) to avoid clobbering the existing file")
        return
    path = _file()
    tmp = path + ".tmp"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump(_CACHE, handle, indent=2)
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


def get_all() -> Dict[str, Any]:
    with _LOCK:
        return dict(_load_locked())


def get_pinned_build(appid) -> str:
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


def get_api_keys() -> Dict[str, str]:
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


def get_slssteam_dlc_enabled() -> bool:
    return bool(get_value("slssteamDlc", False))


def set_slssteam_dlc_enabled(value: bool) -> None:
    set_value("slssteamDlc", bool(value))


def get_game_bar_style() -> str:
    value = str(get_value("gameBarStyle", "row") or "row")
    return value if value in ("row", "panel") else "row"


def set_game_bar_style(value: str) -> None:
    set_value("gameBarStyle", "panel" if str(value) == "panel" else "row")


def get_floating_enabled() -> bool:
    return bool(get_value("floatingButtons", False))


def set_floating_enabled(value: bool) -> None:
    set_value("floatingButtons", bool(value))


def get_store_disabled() -> bool:
    return bool(get_value("storeButtonDisabled", False))


def set_store_disabled(value: bool) -> None:
    set_value("storeButtonDisabled", bool(value))


def get_skip_wrapper() -> bool:
    return bool(get_value("skipSteamShWrapper", False))


def set_skip_wrapper(value: bool) -> None:
    set_value("skipSteamShWrapper", bool(value))


def get_auto_reinject() -> bool:
    return bool(get_value("autoReinject", False))


def set_auto_reinject(value: bool) -> None:
    set_value("autoReinject", bool(value))


def get_auto_client_repin() -> bool:
    return bool(get_value("autoClientRepin", False))


def set_auto_client_repin(value: bool) -> None:
    set_value("autoClientRepin", bool(value))

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


def get_umip_auto() -> bool:
    return bool(get_value("umipAuto", True))


def set_umip_auto(value: bool) -> None:
    set_value("umipAuto", bool(value))


def get_hv_autoload() -> bool:
    return bool(get_value("hvAutoload", False))


def set_hv_autoload(value: bool) -> None:
    set_value("hvAutoload", bool(value))

DEFAULT_PROTON_URL = "xXJSONDeruloXx/proton-LinUwUx-patch"
_STALE_PROTON_URLS = (
    "https://github.com/Kaal31/slsdeckhv/releases/download/latest/GE-Proton11-1-LinUwUx.tar.gz",
)


def get_proton_url() -> str:
    val = str(get_value("protonUrl", DEFAULT_PROTON_URL) or "").strip()
    if not val or val in _STALE_PROTON_URLS or "Kaal31/slsdeckhv" in val:
        return DEFAULT_PROTON_URL
    return val


def set_proton_url(value: str) -> None:
    set_value("protonUrl", (value or "").strip())


def get_pin_on_fix() -> bool:
    return bool(get_value("pinOnFix", True))


def set_pin_on_fix(value: bool) -> None:
    set_value("pinOnFix", bool(value))


def get_no_internet_fix() -> bool:
    return bool(get_value("noInternetFix", True))


def set_no_internet_fix(value: bool) -> None:
    set_value("noInternetFix", bool(value))


def get_auto_repoint() -> bool:
    return bool(get_value("autoRepoint", True))


def set_auto_repoint(value: bool) -> None:
    set_value("autoRepoint", bool(value))


def get_auto_apply() -> bool:
    return bool(get_value("autoApplyAfterUpdate", False))


def set_auto_apply(value: bool) -> None:
    set_value("autoApplyAfterUpdate", bool(value))


def get_ryuu_key() -> str:
    return str(get_value("ryuuApiKey", "") or "").strip()


def set_ryuu_key(value: str) -> None:
    set_value("ryuuApiKey", (value or "").strip())


def get_online_username() -> str:
    return str(get_value("onlineFixUsername", "") or "").strip()


def set_online_username(value: str) -> None:
    set_value("onlineFixUsername", (value or "").strip())


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


def get_dep_version(name: str) -> str:
    return str(get_value(f"depVer:{name}", "") or "").strip()


def set_dep_version(name: str, tag: str) -> None:
    set_value(f"depVer:{name}", (tag or "").strip())


def get_last_plugin_version() -> str:
    return str(get_value("lastPluginVersion", "") or "").strip()


def set_last_plugin_version(v: str) -> None:
    set_value("lastPluginVersion", (v or "").strip())


def get_auto_update() -> bool:
    return bool(get_value("autoUpdateDeps", False))


def set_auto_update(value: bool) -> None:
    set_value("autoUpdateDeps", bool(value))


def get_hide_on_owned() -> bool:
    return bool(get_value("hideOnOwned", True))


def set_hide_on_owned(value: bool) -> None:
    set_value("hideOnOwned", bool(value))


def get_dlc_owned_only() -> bool:
    return bool(get_value("dlcOwnedOnly", True))


def set_dlc_owned_only(value: bool) -> None:
    set_value("dlcOwnedOnly", bool(value))


def get_group_collection() -> bool:
    return bool(get_value("groupCollection", False))


def set_group_collection(value: bool) -> None:
    set_value("groupCollection", bool(value))


def get_backup_custom() -> bool:
    return bool(get_value("backupCustom", False))


def set_backup_custom(value: bool) -> None:
    set_value("backupCustom", bool(value))


def get_library_buttons() -> bool:
    return bool(get_value("libraryButtons", True))


def set_library_buttons(value: bool) -> None:
    set_value("libraryButtons", bool(value))


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


def get_badge_game_page() -> bool:
    return bool(get_value("badgeGamePage", True))


def set_badge_game_page(value: bool) -> None:
    set_value("badgeGamePage", bool(value))


def get_badge_library() -> bool:
    return bool(get_value("badgeLibrary", True))


def set_badge_library(value: bool) -> None:
    set_value("badgeLibrary", bool(value))


def get_badge_emoji() -> bool:
    return bool(get_value("badgeEmoji", False))


def set_badge_emoji(value: bool) -> None:
    set_value("badgeEmoji", bool(value))


def get_auto_download() -> bool:
    return bool(get_value("autoDownload", False))


def set_auto_download(value: bool) -> None:
    set_value("autoDownload", bool(value))


def get_auto_fix() -> bool:
    return bool(get_value("autoFix", False))


def set_auto_fix(value: bool) -> None:
    set_value("autoFix", bool(value))


def get_auto_add_dlc() -> bool:
    return bool(get_value("autoAddDlc", False))


def set_auto_add_dlc(value: bool) -> None:
    set_value("autoAddDlc", bool(value))


def get_disable_cloud() -> bool:
    return bool(get_value("disableCloud", False))


def set_disable_cloud(value: bool) -> None:
    set_value("disableCloud", bool(value))


def get_check_engine_updates() -> bool:
    return bool(get_value("checkEngineUpdates", False))


def set_check_engine_updates(value: bool) -> None:
    set_value("checkEngineUpdates", bool(value))


def get_check_headcrab_updates() -> bool:
    return bool(get_value("checkHeadcrabUpdates", False))


def set_check_headcrab_updates(value: bool) -> None:
    set_value("checkHeadcrabUpdates", bool(value))


def get_disable_dlc_unlock_owned() -> bool:
    return bool(get_value("disableDlcUnlockOwned", False))


def set_disable_dlc_unlock_owned(value: bool) -> None:
    set_value("disableDlcUnlockOwned", bool(value))

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


def get_games_in_qam() -> bool:
    return bool(get_value("gamesInQam", True))


def set_games_in_qam(value: bool) -> None:
    set_value("gamesInQam", bool(value))


def get_hide_tools_qam() -> bool:
    return bool(get_value("hideToolsQam", True))


def set_hide_tools_qam(value: bool) -> None:
    set_value("hideToolsQam", bool(value))

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


def get_show_reinstall_qam() -> bool:
    return bool(get_value("showReinstallQam", True))


def set_show_reinstall_qam(value: bool) -> None:
    set_value("showReinstallQam", bool(value))

EVER_ADDED_FIELD = "everAdded"
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
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(sorted({int(x) for x in ids}), fh)
        os.replace(tmp, path)
    except Exception:
        pass


def get_ever_added() -> list:
    with _EVER_LOCK:
        return _read_ever_added_file()


def add_ever_added(appid: int) -> None:
    with _EVER_LOCK:
        ids = set(_read_ever_added_file())
        ids.add(int(appid))
        _write_ever_added_file(ids)


def clear_ever_added() -> None:
    with _EVER_LOCK:
        _write_ever_added_file([])
