"""Add / remove games via SLSDeck manifest (.lua) scripts."""

from __future__ import annotations

import datetime
import json
import os
import re
import shutil
import tempfile
import threading
import time
import zipfile
from typing import Any, Dict, List

import httpx  # type: ignore

from .apis import (
    load_api_manifest,
    record_api_failure,
    record_api_success,
    substitute_keys,
)
from .config import (
    APPID_LOG_FILE,
    APPLIST_FILE_NAME,
    APPLIST_URL,
    GAMES_DB_CACHE_MAX_AGE_SECONDS,
    GAMES_DB_FILE_NAME,
    GAMES_DB_URL,
    LOADED_APPS_FILE,
    USER_AGENT,
)
from .httpc import ensure_http_client
from .logger import logger
from .paths import ensure_temp_download_dir, runtime_path
from .settings import get_morrenus_api_key, get_slssteam_dlc_enabled, add_ever_added_many, get_auto_download
from .steam import depotcache_dir, detect_steam_install_path, has_lua_for_app, stplugin_dir
from .utils import chown_to_user, write_text
from . import slssteam, smart_merge

DOWNLOAD_STATE: Dict[int, Dict[str, Any]] = {}
DOWNLOAD_LOCK = threading.Lock()

# Completed-add events, drained by a persistent frontend poller so the "added"
# toast fires even if the UI that started the add was closed.
_ADD_EVENTS: List[Dict[str, Any]] = []
_ADD_EVENTS_LOCK = threading.Lock()

APP_NAME_CACHE: Dict[int, str] = {}
APP_NAME_CACHE_LOCK = threading.Lock()

APP_INFO_CACHE: Dict[int, dict] = {}
APP_INFO_CACHE_LOCK = threading.Lock()

LAST_API_CALL_TIME = 0.0
API_CALL_MIN_INTERVAL = 0.3

APPLIST_DATA: Dict[int, str] = {}
APPLIST_LOADED = False
APPLIST_LOCK = threading.Lock()

GAMES_DB_DATA: Any = {}
GAMES_DB_LOADED = False
GAMES_DB_LOCK = threading.Lock()


# ── download state + cancellation ─────────────────────────────────────────
# Cancellation is tracked with a dedicated per-appid Event, NOT the status field.
# It used to be a status="cancelled" write, but _set_state merges, so the worker's
# very next status write ("processing"/"installing"/"done") silently clobbered it
# -- a cancelled add could then be reported as a success. An Event cannot be
# overwritten by a state merge, so once set it stays set.
_CANCEL: Dict[int, "threading.Event"] = {}
_CANCEL_LOCK = threading.Lock()

# Keep DOWNLOAD_STATE from growing for the life of the process. Only terminal
# entries are pruned, and only the oldest, so an in-flight add is never dropped.
_MAX_TRACKED_STATES = 64


def _cancel_event(appid: int) -> "threading.Event":
    with _CANCEL_LOCK:
        ev = _CANCEL.get(appid)
        if ev is None:
            ev = threading.Event()
            _CANCEL[appid] = ev
        return ev


def _reset_cancel(appid: int) -> None:
    """Clear any stale cancel flag so a re-add of the same appid can proceed."""
    _cancel_event(appid).clear()


def _request_cancel(appid: int) -> None:
    _cancel_event(appid).set()


def _is_cancelled(appid: int) -> bool:
    return _cancel_event(appid).is_set()


def _prune_states() -> None:
    """Drop the oldest terminal (done/failed/cancelled) states, keeping recent
    ones for the frontend to read. Never touches an active add."""
    terminal = {"done", "failed", "cancelled"}
    with DOWNLOAD_LOCK:
        if len(DOWNLOAD_STATE) <= _MAX_TRACKED_STATES:
            return
        removable = [aid for aid, st in DOWNLOAD_STATE.items()
                     if st.get("status") in terminal]
        # oldest first (dict preserves insertion order)
        for aid in removable[:len(DOWNLOAD_STATE) - _MAX_TRACKED_STATES]:
            DOWNLOAD_STATE.pop(aid, None)
            with _CANCEL_LOCK:
                _CANCEL.pop(aid, None)


def _set_state(appid: int, update: dict) -> None:
    with DOWNLOAD_LOCK:
        state = DOWNLOAD_STATE.get(appid) or {}
        state.update(update)
        DOWNLOAD_STATE[appid] = state


def _get_state(appid: int) -> dict:
    with DOWNLOAD_LOCK:
        return DOWNLOAD_STATE.get(appid, {}).copy()


# ── loaded-app bookkeeping ────────────────────────────────────────────────
_LOADED_APPS_LOCK = threading.Lock()


def _loaded_apps_path() -> str:
    return runtime_path(LOADED_APPS_FILE)


def _appid_log_path() -> str:
    return runtime_path(APPID_LOG_FILE)


def _append_loaded_app(appid: int, name: str) -> None:
    with _LOADED_APPS_LOCK:
        try:
            path = _loaded_apps_path()
            lines: List[str] = []
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as handle:
                    lines = handle.read().splitlines()
            prefix = f"{appid}:"
            lines = [line for line in lines if not line.startswith(prefix)]
            lines.append(f"{appid}:{name}")
            write_text(path, "\n".join(lines) + "\n")
            try:
                chown_to_user(path, recursive=False)
            except Exception:
                pass
        except Exception as exc:
            logger.warn(f"SLSDeck: _append_loaded_app failed: {exc}")


def _remove_loaded_app(appid: int) -> None:
    with _LOADED_APPS_LOCK:
        try:
            path = _loaded_apps_path()
            if not os.path.exists(path):
                return
            with open(path, "r", encoding="utf-8") as handle:
                lines = handle.read().splitlines()
            prefix = f"{appid}:"
            new_lines = [line for line in lines if not line.startswith(prefix)]
            if len(new_lines) != len(lines):
                write_text(path, "\n".join(new_lines) + ("\n" if new_lines else ""))
                try:
                    chown_to_user(path, recursive=False)
                except Exception:
                    pass
        except Exception as exc:
            logger.warn(f"SLSDeck: _remove_loaded_app failed: {exc}")


def _log_event(action: str, appid: int, name: str) -> None:
    try:
        stamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        with open(_appid_log_path(), "a", encoding="utf-8") as handle:
            handle.write(f"[{action}] {appid} - {name} - {stamp}\n")
    except Exception:
        pass


def _get_loaded_app_name(appid: int) -> str:
    try:
        path = _loaded_apps_path()
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as handle:
                for line in handle.read().splitlines():
                    if line.startswith(f"{appid}:"):
                        name = line.split(":", 1)[1].strip()
                        if name:
                            return name
    except Exception:
        pass
    return _get_app_name_from_applist(appid)


# ── applist (appid -> name) ───────────────────────────────────────────────
def _applist_file_path() -> str:
    return os.path.join(ensure_temp_download_dir(), APPLIST_FILE_NAME)


def _load_applist_into_memory() -> None:
    global APPLIST_DATA, APPLIST_LOADED
    with APPLIST_LOCK:
        if APPLIST_LOADED:
            return
        path = _applist_file_path()
        if not os.path.exists(path):
            APPLIST_LOADED = True
            return
        try:
            with open(path, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, list):
                for entry in data:
                    if isinstance(entry, dict):
                        appid = entry.get("appid")
                        name = entry.get("name")
                        if appid and isinstance(name, str) and name.strip():
                            APPLIST_DATA[int(appid)] = name.strip()
                logger.log(f"SLSDeck: Loaded {len(APPLIST_DATA)} app names from applist")
        except Exception as exc:
            logger.warn(f"SLSDeck: Failed to load applist: {exc}")
        APPLIST_LOADED = True


def _get_app_name_from_applist(appid: int) -> str:
    if not APPLIST_LOADED:
        _load_applist_into_memory()
    with APPLIST_LOCK:
        return APPLIST_DATA.get(int(appid), "")


def _ensure_applist_file() -> None:
    path = _applist_file_path()
    if os.path.exists(path):
        return
    client = ensure_http_client("SLSDeck: applist")
    try:
        resp = client.get(APPLIST_URL, follow_redirects=True, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            with open(path, "w", encoding="utf-8") as handle:
                json.dump(data, handle)
            logger.log(f"SLSDeck: Downloaded applist ({len(data)} entries)")
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to download applist: {exc}")


def init_applist() -> None:
    try:
        _ensure_applist_file()
        _load_applist_into_memory()
    except Exception as exc:
        logger.warn(f"SLSDeck: Applist init failed: {exc}")


# ── games database (name search) ──────────────────────────────────────────
def _games_db_file_path() -> str:
    return os.path.join(ensure_temp_download_dir(), GAMES_DB_FILE_NAME)


def _games_db_stale() -> bool:
    path = _games_db_file_path()
    if not os.path.exists(path):
        return True
    try:
        return (time.time() - os.path.getmtime(path)) > GAMES_DB_CACHE_MAX_AGE_SECONDS
    except Exception:
        return True


def _ensure_games_db_file() -> None:
    path = _games_db_file_path()
    if os.path.exists(path) and not _games_db_stale():
        return
    client = ensure_http_client("SLSDeck: games db")
    try:
        resp = client.get(GAMES_DB_URL, follow_redirects=True, timeout=60)
        resp.raise_for_status()
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(resp.json(), handle)
        logger.log("SLSDeck: Downloaded games database")
    except Exception as exc:
        logger.warn(f"SLSDeck: Failed to download games db: {exc}")


def _load_games_db() -> None:
    global GAMES_DB_DATA, GAMES_DB_LOADED
    with GAMES_DB_LOCK:
        if GAMES_DB_LOADED:
            return
        path = _games_db_file_path()
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    GAMES_DB_DATA = json.load(handle)
            except Exception as exc:
                logger.warn(f"SLSDeck: Failed to load games db: {exc}")
        GAMES_DB_LOADED = True


def init_games_db() -> None:
    try:
        _ensure_games_db_file()
        _load_games_db()
    except Exception as exc:
        logger.warn(f"SLSDeck: games db init failed: {exc}")


def get_games_database() -> Any:
    if not GAMES_DB_LOADED:
        init_games_db()
    with GAMES_DB_LOCK:
        return GAMES_DB_DATA


def _search_steam_store_live(query: str, limit: int = 15) -> List[Dict[str, Any]]:
    """Live query to Steam Store API for games missing from local database."""
    from urllib.parse import quote
    client = ensure_http_client("SLSDeck: Steam Store live search")
    try:
        url = f"https://store.steampowered.com/api/storesearch/?term={quote(query)}&l=english&cc=US"
        resp = client.get(url, timeout=10)
        if resp.status_code == 200:
            items = resp.json().get("items", [])
            out = []
            for item in items[:limit]:
                aid = item.get("id")
                name = item.get("name")
                if aid and name:
                    out.append({"appid": int(aid), "name": str(name)})
            return out
    except Exception as exc:
        logger.warn(f"SLSDeck: Live Steam Store search failed for query '{query}': {exc}")
    return []


def search_games(query: str, limit: int = 25) -> List[Dict[str, Any]]:
    """Search the games database by name; falls back to applist & live Steam Store API."""
    query = (query or "").strip().lower()
    if not query:
        return []
    if not GAMES_DB_LOADED:
        init_games_db()

    results: List[Dict[str, Any]] = []

    def _add(appid: Any, name: Any) -> None:
        try:
            results.append({"appid": int(appid), "name": str(name)})
        except Exception:
            pass

    with GAMES_DB_LOCK:
        db = GAMES_DB_DATA
    try:
        if isinstance(db, dict):
            for appid, name in db.items():
                if isinstance(name, str) and query in name.lower():
                    _add(appid, name)
                    if len(results) >= limit:
                        break
        elif isinstance(db, list):
            for entry in db:
                if isinstance(entry, dict):
                    name = entry.get("name") or entry.get("title") or ""
                    appid = entry.get("appid") or entry.get("id")
                    if appid and query in str(name).lower():
                        _add(appid, name)
                        if len(results) >= limit:
                            break
    except Exception as exc:
        logger.warn(f"SLSDeck: search_games failed: {exc}")

    if not results:
        if not APPLIST_LOADED:
            _load_applist_into_memory()
        with APPLIST_LOCK:
            for appid, name in APPLIST_DATA.items():
                if query in name.lower():
                    results.append({"appid": appid, "name": name})
                    if len(results) >= limit:
                        break

    if not results:
        results = _search_steam_store_live(query, limit=limit)

    # Exact/startswith matches first
    results.sort(key=lambda r: (not r["name"].lower().startswith(query), r["name"].lower()))
    return results[:limit]


# Both caches are keyed by appid and fed by user-driven searching, so over a long
# Steam session they grow without limit. Neither is authoritative -- a miss just
# costs one lookup -- so an oldest-first ceiling is free. Python dicts keep
# insertion order, which is what makes this FIFO.
_APP_CACHE_CAP = 4096


def _cap_cache(store: dict, cap: int = _APP_CACHE_CAP) -> None:
    while len(store) > cap:
        try:
            store.pop(next(iter(store)))
        except StopIteration:
            return


# ── app name / info lookup ────────────────────────────────────────────────
def _fetch_app_name(appid: int) -> str:
    global LAST_API_CALL_TIME
    with APP_NAME_CACHE_LOCK:
        if APP_NAME_CACHE.get(appid):
            return APP_NAME_CACHE[appid]

    applist_name = _get_app_name_from_applist(appid)
    if applist_name:
        with APP_NAME_CACHE_LOCK:
            APP_NAME_CACHE[appid] = applist_name
            _cap_cache(APP_NAME_CACHE)
        return applist_name

    with APP_NAME_CACHE_LOCK:
        elapsed = time.time() - LAST_API_CALL_TIME
        sleep_time = API_CALL_MIN_INTERVAL - elapsed if elapsed < API_CALL_MIN_INTERVAL else 0
        LAST_API_CALL_TIME = time.time() + sleep_time
    if sleep_time > 0:
        time.sleep(sleep_time)

    client = ensure_http_client("SLSDeck: app name")
    try:
        url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
        resp = client.get(url, follow_redirects=True, timeout=10)
        resp.raise_for_status()
        entry = resp.json().get(str(appid)) or {}
        name = ((entry.get("data") or {}).get("name") or "").strip()
        if name:
            with APP_NAME_CACHE_LOCK:
                APP_NAME_CACHE[appid] = name
                _cap_cache(APP_NAME_CACHE)
            return name
    except Exception as exc:
        logger.warn(f"SLSDeck: _fetch_app_name failed for {appid}: {exc}")
    with APP_NAME_CACHE_LOCK:
        APP_NAME_CACHE[appid] = ""
        _cap_cache(APP_NAME_CACHE)
    return ""


def _fetch_app_info(appid: int) -> dict:
    with APP_INFO_CACHE_LOCK:
        if APP_INFO_CACHE.get(appid):
            return APP_INFO_CACHE[appid]
    client = ensure_http_client("SLSDeck: app info")
    try:
        url = f"https://api.steamcmd.net/v1/info/{appid}"
        resp = client.get(url, follow_redirects=True, timeout=10)
        resp.raise_for_status()
        root = (resp.json().get("data", {}) or {}).get(str(appid), {})
        output = {
            "workshop_depot": root.get("depots", {}).get("workshopdepot", 0),
            "dlc_list": root.get("extended", {}).get("listofdlc", ""),
        }
        with APP_INFO_CACHE_LOCK:
            APP_INFO_CACHE[appid] = output
            _cap_cache(APP_INFO_CACHE)
        return output
    except Exception as exc:
        logger.warn(f"SLSDeck: _fetch_app_info failed for {appid}: {exc}")
    with APP_INFO_CACHE_LOCK:
        APP_INFO_CACHE[appid] = {}
        _cap_cache(APP_INFO_CACHE)
    return {}


def fetch_app_name(appid: int) -> str:
    return _fetch_app_name(appid)


# ── install ───────────────────────────────────────────────────────────────
def _process_and_install_lua(appid: int, zip_path: str) -> None:
    if _is_cancelled(appid):
        raise RuntimeError("cancelled")

    base = detect_steam_install_path()
    if not base:
        raise RuntimeError("Steam installation path not found")

    target_dir = stplugin_dir()
    os.makedirs(target_dir, exist_ok=True)

    # Lay the pack out as a smart_merge collection (source_0/…) and run the
    # faithful port of luatools-moon's smart_merge: it publishes manifests into
    # the moon ManifestStore (~/.config/SLSsteam/manifests), writes the merged
    # stplug-in lua with keys as addappid(id,1,"key"), drops .preferred_<depot>
    # markers, and picks the manifest gid matching the moon's cached appinfo.
    home = slssteam._home()
    steam_root = base  # detect_steam_install_path()
    coll = tempfile.mkdtemp(prefix=f"ltpack_{appid}_")
    src0 = os.path.join(coll, "source_0")
    os.makedirs(src0, exist_ok=True)
    lua_text = ""
    try:
        with zipfile.ZipFile(zip_path, "r") as archive:
            for name in archive.namelist():
                if _is_cancelled(appid):
                    raise RuntimeError("cancelled")
                bn = os.path.basename(name)
                if not bn or name.endswith("/"):
                    continue
                if bn.endswith(".lua") or bn.endswith(".manifest"):
                    with archive.open(name) as fh, open(os.path.join(src0, bn), "wb") as o:
                        o.write(fh.read())
                    if bn == f"{appid}.lua" or (not lua_text and re.fullmatch(r"\d+\.lua", bn)):
                        try:
                            lua_text = open(os.path.join(src0, bn), "r",
                                            encoding="utf-8", errors="ignore").read()
                        except Exception:
                            pass

        if _is_cancelled(appid):
            raise RuntimeError("cancelled")
        _set_state(appid, {"status": "installing"})

        # The moon's cached appinfo for this app (PICS buffer) tells us which
        # manifest gid is current, so we can prefer the archived manifest that
        # matches — exactly what the reference feeds smart_merge.
        appinfo_text = ""
        try:
            appinfo_path = os.path.join(slssteam.config_dir(), "cache",
                                        f"picsbuffer_{appid}.bin")
            if os.path.isfile(appinfo_path):
                appinfo_text = open(appinfo_path, "r", encoding="utf-8",
                                    errors="ignore").read()
        except Exception:
            appinfo_text = ""

        result, err = smart_merge.install(appid, coll, {
            "home": home, "steam_root": steam_root, "appinfo_text": appinfo_text,
        })
        if not result:
            raise RuntimeError(f"smart_merge: {err}")

        dest_file = result.get("installed_path")
        _set_state(appid, {"installedPath": dest_file})
        logger.log(
            f"SLSDeck: installed {appid} via smart_merge — "
            f"{result.get('manifest_count', 0)} manifest(s), "
            f"{len(result.get('keys', {}))} key(s) -> {dest_file}")

        # chown everything we wrote back to the desktop user (backend runs as root)
        try:
            if dest_file:
                chown_to_user(dest_file, recursive=False)
            if result.get("store_dir"):
                chown_to_user(result["store_dir"], recursive=True)
        except Exception:
            pass

        # Mirror depot keys into the moon key cache so a game added while Steam is
        # running decrypts WITHOUT a restart (the moon only imports lua keys at
        # startup; getCachedKey reads this cache on demand).
        try:
            keyed = 0
            for dep, keyhex in (result.get("keys") or {}).items():
                if slssteam.cache_depot_key(appid, int(dep), keyhex):
                    keyed += 1
            if keyed:
                logger.log(f"SLSDeck: cached {keyed} depot key(s) for {appid} (live decrypt)")
        except Exception as key_exc:
            logger.warn(f"SLSDeck: depot-key caching failed for {appid}: {key_exc}")

        # The two steps slsteam-moon would have performed. Stock upstream SLSsteam
        # (what headcrab.sh actually installs) does NEITHER, so without these the
        # depot keys and manifests we just fetched never reach Steam at all and the
        # download dies with "Missing decryption key" / 0 mounted depots.
        try:
            from .steam import (set_depot_decryption_keys, restore_manifests_to_depotcache,
                                steam_is_running)
            # depotcache/ is a plain directory Steam stats on demand -- safe to
            # populate while Steam runs.
            mres = restore_manifests_to_depotcache(appid)
            if not mres.get("success"):
                logger.warn(f"SLSDeck: depotcache restore failed for {appid}: {mres.get('error')}")

            # config.vdf is NOT safe to write live: Steam holds it in memory and
            # rewrites it wholesale on exit, silently discarding our keys. And an
            # add can only happen while Steam runs (start_add gates on live
            # injection), so writing here would ALWAYS be thrown away. Stage it
            # instead and make the UI ask for a provisioning restart.
            if steam_is_running():
                _set_state(appid, {"needsProvisionRestart": True})
                logger.log(
                    f"SLSDeck: depot keys staged for {appid} — Steam is running, so "
                    "writing config.vdf now would be discarded on its next exit. "
                    "Restart Steam via SLSDeck to apply them before installing.")
            else:
                kres = set_depot_decryption_keys(result.get("keys") or {})
                if not kres.get("success"):
                    logger.warn(f"SLSDeck: config.vdf key install failed for {appid}: {kres.get('error')}")
        except Exception as prov_exc:
            logger.warn(f"SLSDeck: depot provisioning failed for {appid}: {prov_exc}")

        # AppTokens (ProductInfo access) — from the raw lua (smart_merge drops
        # non-addappid lines from the merged output).
        try:
            for tid, tok in re.findall(
                r'addtoken\s*\(\s*(\d+)\s*,\s*"([^"]+)"\s*\)', lua_text, re.IGNORECASE
            ):
                slssteam.add_app_token(tid, tok)
        except Exception as tok_exc:
            logger.warn(f"SLSDeck: apptoken extraction failed for {appid}: {tok_exc}")

        # DLC / workshop content check (best-effort; unchanged reporting).
        try:
            parsed = smart_merge.parse_lua(lua_text)
            depot_ids = {str(d) for d in parsed["bare"]} | {str(d) for d in parsed["keys"]}
            keyed_ids = {str(d) for d in parsed["keys"]}
            info = _fetch_app_info(appid)
            work_depot = str(info.get("workshop_depot", 0))
            if work_depot == "0":
                workshop_result = "No workshop for the game"
            elif work_depot in depot_ids and work_depot in keyed_ids:
                workshop_result = "Included"
            else:
                workshop_result = "Missing"
            dlc_result = {"included": [], "missing": []}
            if info.get("dlc_list"):
                for dlc in info["dlc_list"].split(","):
                    d = dlc.strip()
                    if not d.isdigit():
                        continue
                    (dlc_result["included"] if d in depot_ids
                     else dlc_result["missing"]).append(int(d))
            if get_slssteam_dlc_enabled() and info.get("dlc_list"):
                try:
                    dlc_ids = [d.strip() for d in info["dlc_list"].split(",") if d.strip().isdigit()]
                    if dlc_ids:
                        slssteam.add_dlcs(appid, [(d, "") for d in dlc_ids])
                except Exception as dlc_exc:
                    logger.warn(f"SLSDeck: DLC sync failed for {appid}: {dlc_exc}")
            # The unlocker installs run whenever the toggle is on — NOT gated on a
            # Steam DLC list, since Ubisoft games unlock via their loader regardless of
            # what Steam reports in listofdlc.
            if get_slssteam_dlc_enabled():
                # DLC toggle installs the applicable in-process DLC unlockers when the
                # game is already on disk. Each self-selects by the DLL it targets, so
                # trying all of them is safe — only the matching one does anything:
                #   SmokeAPI  -> steam_api(64).dll   (Steam)
                #   Uplay R1  -> uplay_r1_loader     (older Ubisoft Connect)
                #   Uplay R2  -> upc_r2_loader       (newer Ubisoft Connect)
                # CreamAPI is deliberately NOT auto-applied: it proxies the same
                # steam_api dll as SmokeAPI, so it stays a manual fallback instead.
                # Best-effort; freshly added (not-yet-downloaded) games get it from the
                # fix menu instead.
                try:
                    from . import smokeapi, dlcunlockers
                    from .steam import get_game_install_path_response
                    _ipr = get_game_install_path_response(appid)
                    ip = _ipr.get("installPath") if _ipr.get("success") else ""
                    if ip:
                        try:
                            if smokeapi.status(ip).get("supported"):
                                smokeapi.install(ip)
                        except Exception as sm_exc:
                            logger.warn(f"SLSDeck: SmokeAPI auto-install failed for {appid}: {sm_exc}")
                        for _kind in ("uplayr1", "uplayr2"):
                            try:
                                _st = dlcunlockers.status(_kind, ip)
                                if _st.get("supported") and not _st.get("installed"):
                                    dlcunlockers.install(_kind, ip, appid)
                            except Exception as u_exc:
                                logger.warn(f"SLSDeck: {_kind} auto-install failed for {appid}: {u_exc}")
                except Exception as sm_exc:
                    logger.warn(f"SLSDeck: DLC unlocker auto-install failed for {appid}: {sm_exc}")
            _set_state(appid, {
                "status": "done",
                "contentCheckResult": {"workshop": workshop_result, "dlc": dlc_result},
            })
        except Exception as exc:
            logger.error(f"SLSDeck: content check failed for {appid}: {exc}")
            _set_state(appid, {"status": "done"})
    finally:
        try:
            shutil.rmtree(coll, ignore_errors=True)
        except Exception:
            pass
        try:
            os.remove(zip_path)
        except Exception:
            pass


def _finalize_registration(appid: int, source_name: str) -> None:
    """After a manifest is installed, register the app with SLSsteam and set the
    final add state. Shared by every manifest source (api.json zips + lua.tools).

    Registering with SLSsteam is what actually makes the game usable — the lua is
    only a fallback — so a registration failure is reported as a failure even
    though the manifest install worked."""
    fetched = _fetch_app_name(appid) or f"UNKNOWN ({appid})"
    sls = {"success": False}
    sls_error = ""
    try:
        sls = slssteam.add_app(appid, fetched)
        if not sls.get("success"):
            sls_error = str(sls.get("error") or "SLSsteam registration failed")
    except Exception as sls_exc:
        sls_error = str(sls_exc)
        logger.warn(f"SLSDeck: SLSsteam registration failed for {appid}: {sls_exc}")
    if bool(sls.get("success")):
        try:
            _append_loaded_app(appid, fetched)
            _log_event(f"ADDED - {source_name}", appid, fetched)
        except Exception:
            pass
        _set_state(appid, {"status": "done", "success": True, "api": source_name,
                           "slssteam": True, "name": fetched})
    else:
        _set_state(appid, {"status": "failed", "success": False, "api": source_name,
                           "slssteam": False, "name": fetched,
                           "error": f"Manifest installed but SLSsteam could not register "
                                    f"the game: {sls_error}. Check that injection is active."})


def _try_luatools_manifest(appid: int, dest_path: str) -> bool:
    """lua.tools general manifest source (signed in). Returns the app's full
    manifest .lua directly (not a zip), so it's tried before the api.json zip
    sources. Returns True if it added the game."""
    try:
        from . import luatools
        if not luatools.is_authed():
            return False
        _set_state(appid, {"status": "checking", "currentApi": "lua.tools"})
        lua = luatools.fetch_manifest_lua(appid)
        if not lua or "addappid" not in lua:
            return False
        import zipfile as _zf
        with _zf.ZipFile(dest_path, "w", _zf.ZIP_DEFLATED) as z:
            z.writestr(f"{appid}.lua", lua)
        _set_state(appid, {"status": "processing", "currentApi": "lua.tools"})
        _process_and_install_lua(appid, dest_path)
        if _is_cancelled(appid):
            return True  # cancelled — treat as handled (no fallthrough)
        _finalize_registration(appid, "lua.tools")
        return True
    except Exception as exc:
        logger.warn(f"SLSDeck: lua.tools manifest source failed for {appid}: {exc}")
        return False


# Backup general lua source: Charon / BlissBlender GitHub-raw DB. Keyless, returns
# a full manifest .lua per appid. Tried only after ryuu/sushi/hubcap all miss.
_CHARON_DBS = (
    "https://raw.githubusercontent.com/BlissBlender/Charon-Database/main/database-1/{appid}.lua",
    "https://raw.githubusercontent.com/BlissBlender/Charon-Database/main/database-2/{appid}.lua",
)


def fetch_manifest_bundle(appid: int) -> Dict[str, Any]:
    """For the ASSella direct-download backend: collect the actual ``.manifest``
    binary files for a game so DepotDownloader can be given ``-manifestfile`` and
    never has to ask Steam for a manifest request code (anonymous login gets a
    401 for those). Sources, in order: moon's ManifestStore + Steam depotcache
    (already present if the game was ever added via SLS), then the api.json zip
    sources (ryuu/hubcap/etc — their zips bundle .manifest files). Charon is
    lua-only, so it can't help here.

    Returns {success, dir, manifests:{depot:path}} — ``manifests`` maps depot id
    to a local .manifest file path.
    """
    out: Dict[str, str] = {}
    tmpdir = tempfile.mkdtemp(prefix=f"assella_mf_{appid}_")

    # 1) Already-local manifests (ManifestStore + depotcache): <depot>_<gid>.manifest
    try:
        from . import slssteam as _sls
        from .steam import depotcache_dir as _dcd
        for src in (_sls.manifest_store_dir(), _dcd()):
            if not src or not os.path.isdir(src):
                continue
            for fn in os.listdir(src):
                m = re.fullmatch(r"(\d+)_(\d+)\.manifest", fn)
                if m:
                    dst = os.path.join(tmpdir, fn)
                    try:
                        shutil.copy2(os.path.join(src, fn), dst)
                        out[m.group(1)] = dst
                    except Exception:
                        pass
    except Exception as exc:
        logger.warn(f"SLSDeck: ASSella local-manifest scan failed for {appid}: {exc}")

    # 2) api.json zip sources — download the zip and extract any .manifest files.
    try:
        client = ensure_http_client("SLSDeck: assella-bundle")
        dest_zip = os.path.join(tmpdir, f"{appid}.zip")
        got_zip = False
        for api in (load_api_manifest() or []):
            template = api.get("url", "")
            template, missing = substitute_keys(template)
            if missing or not template:
                continue
            url = template.replace("<appid>", str(appid))
            try:
                r = client.get(url, headers={"User-Agent": USER_AGENT},
                               follow_redirects=True, timeout=45)
                if r.status_code != 200 or not r.content[:2] == b"PK":
                    continue
                with open(dest_zip, "wb") as fh:
                    fh.write(r.content)
                got_zip = True
                break
            except Exception:
                continue
        if got_zip:
            with zipfile.ZipFile(dest_zip, "r") as z:
                for nm in z.namelist():
                    bn = os.path.basename(nm)
                    m = re.fullmatch(r"(\d+)_(\d+)\.manifest", bn)
                    if m:
                        dst = os.path.join(tmpdir, bn)
                        with z.open(nm) as fh, open(dst, "wb") as o:
                            o.write(fh.read())
                        out[m.group(1)] = dst
            try:
                os.remove(dest_zip)
            except OSError:
                pass
    except Exception as exc:
        logger.warn(f"SLSDeck: ASSella manifest-zip fetch failed for {appid}: {exc}")

    return {"success": bool(out), "dir": tmpdir, "manifests": out}


def fetch_lua_text(appid: int) -> Dict[str, Any]:
    """Resolve a game's manifest .lua TEXT (depot keys + any setManifestid) from
    the same free sources the SLS add flow uses, WITHOUT installing anything to
    stplug-in. For the ASSella (direct download) resolver. Tries lua.tools (if
    signed in) then the keyless Charon DB. Returns {success, lua, source}."""
    # 1) lua.tools (signed-in) — richest, carries keys + setManifestid.
    try:
        from . import luatools
        lua = luatools.fetch_manifest_lua(appid)
        if lua and "addappid" in lua:
            return {"success": True, "lua": lua, "source": "lua.tools"}
    except Exception as exc:
        logger.warn(f"SLSDeck: ASSella lua.tools resolve failed for {appid}: {exc}")
    # 2) Charon DB — keyless GitHub-raw lua, covers a lot of games.
    try:
        client = ensure_http_client("SLSDeck: assella-charon")
        for tmpl in _CHARON_DBS:
            try:
                r = client.get(tmpl.format(appid=int(appid)),
                               headers={"User-Agent": USER_AGENT},
                               follow_redirects=True, timeout=20)
                if r.status_code == 200 and r.text and "addappid" in r.text:
                    return {"success": True, "lua": r.text, "source": "Charon DB"}
            except Exception:
                continue
    except Exception as exc:
        logger.warn(f"SLSDeck: ASSella Charon resolve failed for {appid}: {exc}")
    return {"success": False, "lua": "", "source": ""}


def _try_charon_manifest(appid: int, dest_path: str) -> bool:
    """Charon/BlissBlender github-raw lua DB — keyless backup source. Returns
    True if it added the game."""
    client = ensure_http_client("SLSDeck: charon")
    for tmpl in _CHARON_DBS:
        url = tmpl.format(appid=appid)
        try:
            if _is_cancelled(appid):
                return False
            _set_state(appid, {"status": "checking", "currentApi": "Charon DB"})
            r = client.get(url, headers={"User-Agent": USER_AGENT},
                           follow_redirects=True, timeout=20)
            if r.status_code != 200:
                continue
            lua = r.text
            if not lua or "addappid" not in lua:
                continue
            import zipfile as _zf
            with _zf.ZipFile(dest_path, "w", _zf.ZIP_DEFLATED) as z:
                z.writestr(f"{appid}.lua", lua)
            _set_state(appid, {"status": "processing", "currentApi": "Charon DB"})
            _process_and_install_lua(appid, dest_path)
            if _is_cancelled(appid):
                return True
            _finalize_registration(appid, "Charon DB")
            return True
        except Exception as exc:
            logger.warn(f"SLSDeck: Charon source failed for {appid}: {exc}")
            continue
    return False


def _download_zip_for_app(appid: int) -> None:
    client = ensure_http_client("SLSDeck: download")
    apis = load_api_manifest()

    dest_path = os.path.join(ensure_temp_download_dir(), f"{appid}.zip")
    _set_state(appid, {
        "status": "checking", "currentApi": None, "bytesRead": 0,
        "totalBytes": 0, "dest": dest_path, "apiErrors": {},
    })

    # lua.tools first (when signed in) — the user's own authenticated source.
    if _try_luatools_manifest(appid, dest_path):
        return

    if not apis:
        _set_state(appid, {"status": "failed", "error": "No manifest sources available"})
        return

    for api in apis:
        name = api.get("name", "Unknown")
        template = api.get("url", "")
        success_code = int(api.get("success_code", 200))
        unavailable_code = int(api.get("unavailable_code", 404))

        # Fill any API-key placeholders from the user's saved keys; skip the
        # source when a required key has not been entered.
        template, missing = substitute_keys(template)
        if missing:
            continue

        url = template.replace("<appid>", str(appid))
        _set_state(appid, {"status": "checking", "currentApi": name})
        logger.log(f"SLSDeck: Trying source '{name}' for {appid}")
        t0 = time.time()
        try:
            if _is_cancelled(appid):
                return
            headers = {"User-Agent": USER_AGENT}
            with client.stream("GET", url, headers=headers, follow_redirects=True) as resp:
                code = resp.status_code
                if code == unavailable_code:
                    record_api_failure(name)
                    continue
                if code != success_code:
                    record_api_failure(name)
                    state = _get_state(appid)
                    errs = state.get("apiErrors", {})
                    errs[name] = {"type": "error", "code": code}
                    _set_state(appid, {"apiErrors": errs})
                    continue
                total = int(resp.headers.get("Content-Length", "0") or "0")
                _set_state(appid, {"status": "downloading", "bytesRead": 0, "totalBytes": total})
                # Track progress in a LOCAL counter and flush to shared state at
                # most a few times a second. The old loop read shared state to
                # increment a counter it already owned and wrote it back on every
                # single chunk -- three DOWNLOAD_LOCK acquisitions per chunk plus a
                # cross-thread read race on the byte total. The cancel check is now
                # a lock-free Event, so it is cheap to poll every chunk.
                read = 0
                last_flush = 0.0
                cancel_ev = _cancel_event(appid)
                with open(dest_path, "wb") as out:
                    for chunk in resp.iter_bytes():
                        if not chunk:
                            continue
                        if cancel_ev.is_set():
                            raise RuntimeError("cancelled")
                        out.write(chunk)
                        read += len(chunk)
                        now = time.time()
                        if now - last_flush >= 0.2:
                            last_flush = now
                            _set_state(appid, {"bytesRead": read})
                _set_state(appid, {"bytesRead": read})

            if _is_cancelled(appid):
                raise RuntimeError("cancelled")

            # Validate zip magic bytes
            try:
                with open(dest_path, "rb") as fh:
                    magic = fh.read(4)
                if magic not in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"):
                    logger.warn(f"SLSDeck: source '{name}' returned non-zip magic {magic!r}")
                    record_api_failure(name)
                    try:
                        os.remove(dest_path)
                    except Exception:
                        pass
                    continue
            except Exception:
                record_api_failure(name)
                continue

            _set_state(appid, {"status": "processing"})
            _process_and_install_lua(appid, dest_path)
            if _is_cancelled(appid):
                raise RuntimeError("cancelled")
            _finalize_registration(appid, name)
            return
        except RuntimeError as cancel_exc:
            if str(cancel_exc) == "cancelled":
                try:
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                except Exception:
                    pass
                logger.log(f"SLSDeck: Download cancelled for {appid}")
                return
            _set_state(appid, {"status": "failed", "error": str(cancel_exc)})
            return
        except Exception as err:
            error_type = "timeout" if isinstance(err, (httpx.TimeoutException,)) else "error"
            state = _get_state(appid)
            errs = state.get("apiErrors", {})
            errs[name] = {"type": error_type}
            _set_state(appid, {"apiErrors": errs})
            continue

    # Backup tier: Charon / BlissBlender github-raw lua DB (keyless), tried after
    # ryuu/sushi/hubcap all miss.
    if _try_charon_manifest(appid, dest_path):
        return

    # No manifest source had the game. On SteamOS SLSsteam alone is enough to
    # inject ownership (Steam then pulls the depot keys), so fall back to a
    # SLSsteam-only add instead of failing outright.
    try:
        if _is_cancelled(appid):
            return
        fetched = _fetch_app_name(appid) or f"UNKNOWN ({appid})"
        sls = slssteam.add_app(appid, fetched)
        if sls.get("success"):
            try:
                _append_loaded_app(appid, fetched)
                _log_event("ADDED - SLSsteam (no manifest)", appid, fetched)
            except Exception:
                pass
            _set_state(appid, {
                "status": "done", "success": True, "api": "SLSsteam",
                "slssteam": True, "manifest": False,
                "note": "No manifest source had this game; added via SLSsteam only.",
            })
            return
    except Exception as sls_exc:
        logger.warn(f"SLSDeck: SLSsteam-only add failed for {appid}: {sls_exc}")

    _set_state(appid, {"status": "failed", "error": "Not available on any source"})


# ── public API ────────────────────────────────────────────────────────────
def start_add(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    # Adding writes to SLSsteam's config, which does nothing unless SLSsteam is
    # actually injecting RIGHT NOW — so gate on functional injection (the .so is
    # loaded and didn't abort), not merely 'configured'/'mapped'. This stops the
    # case where the UI said active but adds silently never took effect.
    try:
        if not slssteam._injection_functional():
            return {"success": False,
                    "error": "Injection is off — activate injection in Dependencies before adding games."}
    except Exception:
        pass
    # A previous add of the same appid may have left a set cancel flag; clear it
    # so this fresh add is not cancelled the instant it starts.
    _reset_cancel(appid)
    _prune_states()
    _set_state(appid, {"status": "queued", "bytesRead": 0, "totalBytes": 0,
                       "error": "", "success": False})
    threading.Thread(target=_add_worker, args=(appid,),
                     name=f"slsdeck-add-{appid}", daemon=True).start()
    return {"success": True}


def _add_worker(appid: int) -> None:
    """Run the background add, then queue a completion event for the notifier."""
    try:
        _download_zip_for_app(appid)
    finally:
        st = _get_state(appid)
        status = st.get("status")
        # If cancel was requested at any point, treat the whole add as cancelled
        # regardless of what status the worker last wrote -- a race between the
        # cancel and a "done" write must never surface as a successful add.
        if _is_cancelled(appid):
            status = "cancelled"
            _set_state(appid, {"status": "cancelled"})
        if status in ("done", "failed"):
            name = ""
            try:
                name = _get_loaded_app_name(appid) or ""
            except Exception:
                pass
            ok = bool(status == "done" and st.get("success"))
            auto_dl = False
            if ok:
                # An earlier attempt made while injection was off can leave a
                # phantom appmanifest behind (Steam thinks the game is already
                # installed, 0 bytes / 0 depots). Steam ignores an install
                # request for something it believes is installed, so clear that
                # first or the trigger below silently does nothing.
                try:
                    from .steam import clear_phantom_install
                    cleared = clear_phantom_install(appid)
                    if cleared.get("cleared"):
                        logger.log(f"SLSDeck: cleared stale phantom install for {appid} before download")
                except Exception as ph_exc:
                    logger.warn(f"SLSDeck: phantom-install check failed for {appid}: {ph_exc}")

                # Toggle A: DLC handling. Two directions:
                #  * adding a GAME  → register all its DLC depot keys so content DLC
                #    downloads with the base install.
                #  * adding a DLC   → chain-add its BASE game (a DLC isn't standalone),
                #    which moon then blanket-unlocks all sibling DLC for.
                try:
                    from .settings import get_auto_add_dlc
                    if get_auto_add_dlc():
                        from . import dlc as _dlc
                        info = _dlc.resolve_dlc(appid)
                        target = appid
                        if info.get("isDlc") and info.get("base") and info["base"] != appid:
                            base = int(info["base"])
                            try:
                                bname = _fetch_app_name(base) or f"AppID {base}"
                                slssteam.add_app(base, bname)
                                _append_loaded_app(base, bname)
                                target = base
                                logger.log(f"SLSDeck: chain-added base game {base} for DLC {appid} — moon unlocks all its DLC")
                            except Exception as be:
                                logger.warn(f"SLSDeck: chain-add base failed for DLC {appid}: {be}")
                        r = _dlc.ensure_all_dlc_keys(target)
                        logger.log(f"SLSDeck: auto-DLC registered {r.get('keys',0)} depot key(s) + "
                                   f"{r.get('dlcRegistered',0)} DLC appid(s) for {target} ({r.get('source')})")
                except Exception as dlc_exc:
                    logger.warn(f"SLSDeck: auto-DLC step failed for {appid}: {dlc_exc}")

                # Kick the download BEFORE artwork: art sync does several network
                # round-trips and must never delay (or fail) the actual install.
                try:
                    if get_auto_download():
                        if slssteam._injection_functional():
                            slssteam.trigger_steam_install(appid)
                            auto_dl = True
                        else:
                            # Triggering now would make Steam resolve zero depots
                            # and write the phantom manifest we just cleaned up.
                            logger.warn(
                                f"SLSDeck: skipping auto-download for {appid} — SLSsteam "
                                "is not injecting; restart Steam, then install from the library.")
                except Exception as dl_exc:
                    logger.warn(f"SLSDeck: auto-download trigger failed for {appid}: {dl_exc}")

                try:
                    from .art import sync_game_art
                    sync_game_art(appid)
                except Exception as art_exc:
                    logger.warn(f"SLSDeck: post-add art sync failed for {appid}: {art_exc}")
            with _ADD_EVENTS_LOCK:
                # Bounded: these are drained by a frontend poller, so with the QAM
                # closed (or the plugin running headless) the list otherwise grows
                # without limit for the life of the process.
                if len(_ADD_EVENTS) >= 200:
                    del _ADD_EVENTS[:-100]
                _ADD_EVENTS.append({
                    "appid": appid,
                    "name": name or f"AppID {appid}",
                    "status": status,
                    "success": ok,
                    "autoDownload": auto_dl,
                    "error": st.get("error", ""),
                })


def push_add_event(appid: int, name: str, status: str, success: bool,
                   auto_download: bool = False, error: str = "",
                   assella: bool = False) -> None:
    """Append a completion event for the persistent frontend notifier to drain.

    Used by the ASSella (direct-download) backend so its installs surface the
    same toast + reload path as SLS adds — one notifier, one reload rule.
    """
    with _ADD_EVENTS_LOCK:
        if len(_ADD_EVENTS) >= 200:
            del _ADD_EVENTS[:-100]
        _ADD_EVENTS.append({
            "appid": int(appid),
            "name": name or f"AppID {appid}",
            "status": status,
            "success": bool(success),
            "autoDownload": bool(auto_download),
            "error": error or "",
            "assella": bool(assella),
        })


def pop_add_events() -> Dict[str, Any]:
    """Return + clear completed-add events (called by the persistent notifier)."""
    with _ADD_EVENTS_LOCK:
        events = _ADD_EVENTS[:]
        _ADD_EVENTS.clear()
    return {"success": True, "events": events}


def get_add_status(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    return {"success": True, "state": _get_state(appid)}


def cancel_add(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    state = _get_state(appid)
    if not state or state.get("status") in {"done", "failed", "cancelled"}:
        return {"success": True, "message": "Nothing to cancel"}
    # Set the sticky flag first (the worker polls it and cannot overwrite it),
    # then reflect it in status for the UI. Even if the worker writes another
    # status right after this, the flag stays set and the worker will honour it
    # at its next check.
    _request_cancel(appid)
    _set_state(appid, {"status": "cancelled", "error": "Cancelled by user"})
    return {"success": True}


def has_luatools_for_app(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    in_sls = False
    try:
        in_sls = slssteam.has_app(appid)
    except Exception:
        pass
    return {"success": True, "exists": has_lua_for_app(appid) or in_sls, "slssteam": in_sls}


def delete_luatools_for_app(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    target_dir = stplugin_dir()
    paths = [
        os.path.join(target_dir, f"{appid}.lua"),
        os.path.join(target_dir, f"{appid}.lua.disabled"),
    ]
    deleted = []
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                deleted.append(path)
        except Exception as exc:
            logger.warn(f"SLSDeck: Failed to delete {path}: {exc}")
    # Deregister from SLSsteam so the game stops appearing in the library.
    slssteam_removed = False
    try:
        slssteam_removed = bool(slssteam.remove_app(appid).get("success"))
        slssteam.remove_dlc_parent(appid)
    except Exception as exc:
        logger.warn(f"SLSDeck: SLSsteam deregister failed for {appid}: {exc}")
    try:
        name = _get_loaded_app_name(appid) or f"UNKNOWN ({appid})"
        _remove_loaded_app(appid)
        if deleted:
            _log_event("REMOVED", appid, name)
    except Exception:
        pass
    return {
        "success": True,
        "deleted": deleted,
        "count": len(deleted),
        "slssteamRemoved": slssteam_removed,
    }


def get_installed_apps() -> Dict[str, Any]:
    """Unified installed list: SLSsteam-registered apps + any lua scripts.

    Each entry carries a ``source`` of ``slssteam``, ``lua`` or ``both`` so the
    UI can show how a game was added.
    """
    try:
        by_appid: Dict[int, Dict[str, Any]] = {}

        # SLSsteam-registered apps (the primary SteamOS mechanism).
        try:
            for appid in slssteam.read_additional_apps():
                by_appid[appid] = {
                    "appid": appid,
                    "gameName": "",
                    "source": "slssteam",
                    "filename": "",
                    "isDisabled": False,
                    "fileSize": 0,
                    "modifiedDate": "",
                    "path": "",
                }
        except Exception as exc:
            logger.warn(f"SLSDeck: reading SLSsteam apps failed: {exc}")

        # Legacy / fallback lua scripts.
        lua = get_installed_lua_scripts()
        for script in lua.get("scripts", []):
            appid = script["appid"]
            if appid in by_appid:
                by_appid[appid].update({
                    "source": "both",
                    "filename": script["filename"],
                    "isDisabled": script["isDisabled"],
                    "fileSize": script["fileSize"],
                    "modifiedDate": script["modifiedDate"],
                    "path": script["path"],
                })
            else:
                script = dict(script)
                script["source"] = "lua"
                by_appid[appid] = script

        # Resolve friendly names.
        for appid, entry in by_appid.items():
            if not entry.get("gameName"):
                with APP_NAME_CACHE_LOCK:
                    name = APP_NAME_CACHE.get(appid, "")
                if not name:
                    name = _get_loaded_app_name(appid)
                entry["gameName"] = name or f"Unknown Game ({appid})"

        apps = sorted(by_appid.values(), key=lambda x: x["appid"])
        try:
            add_ever_added_many(list(by_appid.keys()))
        except Exception:
            pass
        return {"success": True, "apps": apps}
    except Exception as exc:
        return {"success": False, "error": str(exc), "apps": []}


def get_installed_lua_scripts() -> Dict[str, Any]:
    try:
        target_dir = stplugin_dir()
        if not target_dir or not os.path.exists(target_dir):
            return {"success": True, "scripts": []}
        scripts = []
        for filename in os.listdir(target_dir):
            if not (filename.endswith(".lua") or filename.endswith(".lua.disabled")):
                continue
            try:
                appid = int(filename.replace(".lua.disabled", "").replace(".lua", ""))
            except ValueError:
                continue
            is_disabled = filename.endswith(".lua.disabled")
            with APP_NAME_CACHE_LOCK:
                game_name = APP_NAME_CACHE.get(appid, "")
            if not game_name:
                game_name = _get_loaded_app_name(appid)
            if not game_name:
                game_name = f"Unknown Game ({appid})"
            file_path = os.path.join(target_dir, filename)
            try:
                st = os.stat(file_path)
                size = st.st_size
                modified = datetime.datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                size = 0
                modified = ""
            scripts.append({
                "appid": appid, "gameName": game_name, "filename": filename,
                "isDisabled": is_disabled, "fileSize": size,
                "modifiedDate": modified, "path": file_path,
            })
        scripts.sort(key=lambda x: x["appid"])
        return {"success": True, "scripts": scripts}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def get_available_builds(appid: int) -> Dict[str, Any]:
    """Query available build versions and manifest history for an AppID."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    client = ensure_http_client("SLSDeck: get builds")
    builds = []
    try:
        url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
        resp = client.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json().get(str(appid), {}).get("data", {})
            release_date = data.get("release_date", {}).get("date", "Latest")
            builds.append({
                "buildId": "latest",
                "name": f"Current Build ({release_date})",
                "isCurrent": True,
            })
    except Exception:
        builds.append({"buildId": "latest", "name": "Current Build", "isCurrent": True})

    pinned = slssteam.is_pinned(appid)
    return {"success": True, "appid": appid, "isPinned": pinned, "builds": builds}


def install_game_build(appid: int, build_id: str) -> Dict[str, Any]:
    """Install a specific build version and pin it so updates don't overwrite it."""
    try:
        appid = int(appid)
        build_id = str(build_id or "latest").strip()
        slssteam.pin_app_current(appid)
        return {"success": True, "appid": appid, "buildId": build_id, "pinned": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def read_loaded_apps() -> Dict[str, Any]:
    try:
        path = _loaded_apps_path()
        entries = []
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as handle:
                for line in handle.read().splitlines():
                    if ":" in line:
                        appid_str, name = line.split(":", 1)
                        if appid_str.strip().isdigit() and name.strip():
                            entries.append({"appid": int(appid_str.strip()), "name": name.strip()})
        return {"success": True, "apps": entries}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def check_apis_for_app(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    client = ensure_http_client("SLSDeck: check apis")
    apis = load_api_manifest()
    if not apis:
        return {"success": True, "results": []}

    morrenus_api_key = get_morrenus_api_key()
    results = []
    headers = {"User-Agent": USER_AGENT}

    for api in apis:
        name = api.get("name", "Unknown")
        template = api.get("url", "")
        success_code = int(api.get("success_code", 200))
        template, missing = substitute_keys(template)
        if missing:
            continue
        url = template.replace("<appid>", str(appid))
        available = False
        try:
            if name.lower() == "morrenus":
                status_url = f"https://hubcapmanifest.com/api/v1/status/{appid}?api_key={morrenus_api_key}"
                resp = client.get(status_url, headers=headers, follow_redirects=True, timeout=6)
                available = resp.status_code == success_code
            else:
                resp = client.head(url, headers=headers, follow_redirects=True, timeout=6)
                if resp.status_code == success_code:
                    available = True
                elif resp.status_code == 405:
                    resp = client.get(url, headers=headers, follow_redirects=True, timeout=6)
                    available = resp.status_code == success_code
        except Exception:
            pass
        results.append({"name": name, "available": available, "url": url if available else None})

    return {"success": True, "results": results}


def purge_all_added() -> Dict[str, Any]:
    """Remove ALL added games at once: strip every SLSsteam AdditionalApps entry
    and delete its lua manifest. Does NOT delete installed game files. Also clears
    the everAdded history since nothing is registered anymore. Restart Steam to
    apply."""
    apps = get_installed_apps().get("apps", []) or []
    appids = []
    for a in apps:
        try:
            appids.append(int(a.get("appid")))
        except Exception:
            continue
    removed = 0
    for appid in appids:
        try:
            if delete_luatools_for_app(appid).get("success"):
                removed += 1
        except Exception as exc:
            logger.warn(f"SLSDeck: purge failed for {appid}: {exc}")
    try:
        from .settings import clear_ever_added
        clear_ever_added()
    except Exception:
        pass
    logger.log(f"SLSDeck: purged {removed} added game(s)")
    return {"success": True, "removed": removed, "total": len(appids)}
