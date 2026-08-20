"""Steam Workshop mod downloader/installer (WorkshopDL engine, no GUI).

Reuses WorkshopDL's mechanism — SteamCMD `+workshop_download_item` — and adds:
  * mod-id / workshop-URL / collection-URL resolution to the owning game appid
    via the public Steam Web API (consumer_app_id),
  * install into the GAME's own steamapps/workshop/content/<appid>/<modid>/ so
    the game loads it (gated on the game being locally installed),
  * per-game mod management: list, enable/disable (.disabled rename), remove.

Anonymous download only (most workshop items allow it); items that require an
owning account surface a clear error rather than prompting for credentials.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tarfile
import threading
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import runtime_path, get_user_home
from .httpc import ensure_http_client
from .utils import chown_to_user, safe_extract
from . import steam, settings, slssteam

STEAMCMD_URL = "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz"
_API = "https://api.steampowered.com/ISteamRemoteStorage"

# job state keyed by the resolved root id (collection or single mod)
_STATE: Dict[str, Dict[str, Any]] = {}
_LOCK = threading.Lock()


# One entry per download job for the life of the session. Only FINISHED jobs are
# evicted -- dropping a running one would make its progress unreadable.
_STATE_CAP = 64
_TERMINAL = {"done", "failed"}


def _prune_state() -> None:
    if len(_STATE) <= _STATE_CAP:
        return
    for k in [k for k, v in _STATE.items() if (v or {}).get("status") in _TERMINAL][
            : max(0, len(_STATE) - _STATE_CAP)]:
        _STATE.pop(k, None)


def _set_state(job: str, upd: Dict[str, Any]) -> None:
    with _LOCK:
        st = _STATE.setdefault(job, {})
        st.update(upd)
        _prune_state()


def _get_state(job: str) -> Dict[str, Any]:
    with _LOCK:
        return dict(_STATE.get(job, {}))


# ── SteamCMD bootstrap ───────────────────────────────────────────────────────
def _steamcmd_dir() -> str:
    return runtime_path("steamcmd")


def _steamcmd_sh() -> str:
    return os.path.join(_steamcmd_dir(), "steamcmd.sh")


def ensure_steamcmd() -> Dict[str, Any]:
    """Download + extract SteamCMD into the plugin runtime dir if absent."""
    sh = _steamcmd_sh()
    if os.path.isfile(sh):
        return {"success": True, "present": True}
    d = _steamcmd_dir()
    try:
        os.makedirs(d, exist_ok=True)
        tar = os.path.join(d, "steamcmd_linux.tar.gz")
        client = ensure_http_client("workshop: steamcmd")
        with client.stream("GET", STEAMCMD_URL) as r:
            r.raise_for_status()
            with open(tar, "wb") as fh:
                for chunk in r.iter_bytes():
                    if chunk:
                        fh.write(chunk)
        # safe_extract, not extractall: same rule the rest of the plugin follows
        # for downloaded archives -- reject members that escape the destination
        # and any symlink/special entries.
        with tarfile.open(tar, "r:gz") as t:
            safe_extract(t, d, "tar")
        try:
            os.remove(tar)
        except Exception:
            pass
        if os.path.isfile(sh):
            os.chmod(sh, 0o755)
        chown_to_user(d, recursive=True)
        return {"success": os.path.isfile(sh), "present": os.path.isfile(sh)}
    except Exception as exc:
        logger.error(f"workshop: steamcmd bootstrap failed: {exc}")
        return {"success": False, "error": str(exc)}


# ── id / url parsing + Steam API resolution ──────────────────────────────────
def _parse_id(text: str) -> str:
    text = str(text or "").strip()
    m = re.search(r"[?&]id=(\d+)", text)
    if m:
        return m.group(1)
    m = re.search(r"\b(\d{6,})\b", text)
    return m.group(1) if m else ""


def resolve_mod(text: str) -> Dict[str, Any]:
    """Resolve a mod id / workshop URL / collection URL to its owning game and,
    for collections, the list of child mod ids."""
    mid = _parse_id(text)
    if not mid:
        return {"success": False, "error": "No mod or collection ID found in input"}
    client = ensure_http_client("workshop: api")
    try:
        r = client.post(
            f"{_API}/GetPublishedFileDetails/v1/",
            data={"itemcount": 1, "publishedfileids[0]": mid},
        )
        d = (r.json().get("response", {}).get("publishedfiledetails") or [{}])[0]
    except Exception as exc:
        return {"success": False, "error": f"Steam API lookup failed: {exc}"}

    if int(d.get("result", 0) or 0) != 1:
        return {"success": False, "error": "Steam API returned no data for that ID"}

    file_type = int(d.get("file_type", 0) or 0)  # 2 == collection
    appid = int(d.get("consumer_app_id", 0) or d.get("creator_app_id", 0) or 0)
    title = d.get("title") or f"Item {mid}"
    is_collection = file_type == 2
    children: List[str] = []
    if is_collection:
        try:
            rc = client.post(
                f"{_API}/GetCollectionDetails/v1/",
                data={"collectioncount": 1, "publishedfileids[0]": mid},
            )
            items = (rc.json().get("response", {}).get("collectiondetails") or [{}])[0].get("children") or []
            children = [str(c.get("publishedfileid")) for c in items if c.get("publishedfileid")]
        except Exception:
            pass
    return {
        "success": True,
        "modid": mid,
        "appid": appid,
        "title": title,
        "isCollection": is_collection,
        "children": children,
        "installed": is_game_installed(appid),
        "allowed": is_allowed_target(appid),
    }


# ── game / library helpers ───────────────────────────────────────────────────
def _allowed_appids() -> set:
    """AppIds we're permitted to install mods for: games added via SLSDeck
    (SLSsteam AdditionalApps ∪ everAdded history) and non-Steam shortcuts.
    Never a genuinely-owned Steam game — we don't touch those."""
    ids: set = set()
    try:
        ids |= {int(x) for x in slssteam.read_additional_apps()}
    except Exception:
        pass
    try:
        ids |= {int(x) for x in settings.get_ever_added()}
    except Exception:
        pass
    try:
        apps = (steam.get_nonsteam_apps() or {}).get("apps", {}) or {}
        ids |= {int(k) for k in apps.keys() if str(k).isdigit()}
    except Exception:
        pass
    return ids


def is_allowed_target(appid: int) -> bool:
    """True only for SLSDeck-added or non-Steam games (not owned Steam games)."""
    try:
        return int(appid) in _allowed_appids()
    except Exception:
        return False


def is_game_installed(appid: int) -> bool:
    try:
        appid = int(appid)
    except Exception:
        return False
    for lib in steam._all_library_paths():
        if os.path.exists(os.path.join(lib, "steamapps", f"appmanifest_{appid}.acf")):
            return True
    return False


def _game_workshop_dir(appid: int) -> Optional[str]:
    """The game's own workshop content dir (in the library that has the game)."""
    for lib in steam._all_library_paths():
        if os.path.exists(os.path.join(lib, "steamapps", f"appmanifest_{appid}.acf")):
            return os.path.join(lib, "steamapps", "workshop", "content", str(appid))
    return None


# ── persistent state: which mods WE downloaded (survives plugin reinstall) ────
def _state_dir() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return d


def _manifest_path() -> str:
    return os.path.join(_state_dir(), "workshop_mods.json")


def _safe_modid(modid) -> str:
    """A Workshop id is always a plain number. Return it, or "" if it is not.

    This guard is load-bearing. set_mod_enabled() and remove_mod() take the id
    straight from an RPC argument, join it onto the game's workshop content dir
    and then shutil.rmtree() the result -- so a modid of "../../.." resolves to
    <library>/steamapps and would delete every installed game. Downloads are
    already safe because they route through _parse_id(), which is digits-only;
    these two entry points were not."""
    s = str(modid or "").strip()
    return s if s.isdigit() else ""


def _contained(base: str, path: str) -> bool:
    """Belt and braces for the rmtree/move calls below: the resolved path must
    sit strictly inside base, and never be base itself."""
    try:
        b = os.path.realpath(base)
        p = os.path.realpath(path)
        return p.startswith(b + os.sep) and p != b
    except Exception:
        return False


def _disabled_store(appid: int, modid: str) -> str:
    return os.path.join(_state_dir(), "workshop_disabled", str(appid), str(modid))


def _load_manifest() -> Dict[str, Any]:
    try:
        with open(_manifest_path(), "r", encoding="utf-8") as fh:
            d = json.load(fh)
            return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def _save_manifest(m: Dict[str, Any]) -> None:
    try:
        tmp = _manifest_path() + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(m, fh, indent=2)
        os.replace(tmp, _manifest_path())
        chown_to_user(_state_dir(), recursive=True)
    except Exception as exc:
        logger.warn(f"workshop: manifest save failed: {exc}")


def _manifest_add(appid: int, modid: str, title: str = "") -> None:
    m = _load_manifest()
    g = m.setdefault(str(appid), {})
    g[str(modid)] = {"title": title or g.get(str(modid), {}).get("title", ""),
                     "enabled": True, "ts": int(time.time())}
    _save_manifest(m)


def _manifest_set_enabled(appid: int, modid: str, enabled: bool) -> None:
    m = _load_manifest()
    g = m.setdefault(str(appid), {})
    e = g.setdefault(str(modid), {"title": "", "ts": int(time.time())})
    e["enabled"] = bool(enabled)
    _save_manifest(m)


def _manifest_remove(appid: int, modid: str) -> None:
    m = _load_manifest()
    g = m.get(str(appid), {})
    if str(modid) in g:
        del g[str(modid)]
    if not g:
        m.pop(str(appid), None)
    _save_manifest(m)


def _manifest_ids(appid: int) -> List[str]:
    return list(_load_manifest().get(str(appid), {}).keys())


# ── Steam workshop ACF: stop the client from re-downloading removed items ─────
def _acf_path(appid: int) -> Optional[str]:
    """appworkshop_<appid>.acf lives beside the workshop content dir."""
    for lib in steam._all_library_paths():
        if os.path.exists(os.path.join(lib, "steamapps", f"appmanifest_{appid}.acf")):
            p = os.path.join(lib, "steamapps", "workshop", f"appworkshop_{appid}.acf")
            return p
    return None


def _strip_acf_block(text: str, modid: str) -> str:
    """Remove every `"<modid>" { ...balanced... }` sub-block from the acf text.
    Safe because a modid only ever appears as a quoted sub-key followed by `{`
    (the appid appears as a value, never followed by a brace)."""
    key = f'"{modid}"'
    out = []
    i = 0
    n = len(text)
    while i < n:
        j = text.find(key, i)
        if j == -1:
            out.append(text[i:])
            break
        # look ahead past whitespace for an opening brace
        k = j + len(key)
        while k < n and text[k] in " \t\r\n":
            k += 1
        if k < n and text[k] == "{":
            # balanced-brace scan
            depth = 0
            p = k
            while p < n:
                if text[p] == "{":
                    depth += 1
                elif text[p] == "}":
                    depth -= 1
                    if depth == 0:
                        p += 1
                        break
                p += 1
            # drop from the start of this key's line to end of block
            line_start = text.rfind("\n", 0, j) + 1
            out.append(text[i:line_start])
            # skip trailing newline after the block
            while p < n and text[p] in " \t\r":
                p += 1
            if p < n and text[p] == "\n":
                p += 1
            i = p
        else:
            out.append(text[i:k])
            i = k
    return "".join(out)


def _acf_remove_item(appid: int, modid: str) -> bool:
    """Remove modid from appworkshop_<appid>.acf so Steam stops restoring it.
    Best-effort: most reliable when the game isn't actively syncing."""
    path = _acf_path(appid)
    if not path or not os.path.isfile(path):
        return False
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
        new = _strip_acf_block(content, str(modid))
        if new != content:
            tmp = path + ".tmp"
            with open(tmp, "w", encoding="utf-8") as fh:
                fh.write(new)
            os.replace(tmp, path)
            chown_to_user(path, recursive=False)
            return True
    except Exception as exc:
        logger.warn(f"workshop: acf edit failed for {appid}/{modid}: {exc}")
    return False


# ── download + install ───────────────────────────────────────────────────────
def _run_steamcmd_download(appid: int, modid: str) -> Dict[str, Any]:
    boot = ensure_steamcmd()
    if not boot.get("success"):
        return {"success": False, "error": "SteamCMD unavailable: " + str(boot.get("error", ""))}
    sh = _steamcmd_sh()
    cmd = [sh, "+force_install_dir", _steamcmd_dir(), "+login", "anonymous",
           "+workshop_download_item", str(appid), str(modid), "+quit"]
    try:
        proc = subprocess.run(cmd, cwd=_steamcmd_dir(), capture_output=True,
                              text=True, timeout=3600)
    except Exception as exc:
        return {"success": False, "error": f"SteamCMD run failed: {exc}"}
    src = os.path.join(_steamcmd_dir(), "steamapps", "workshop", "content", str(appid), str(modid))
    if not os.path.isdir(src) or not os.listdir(src):
        tail = (proc.stdout or "")[-300:]
        hint = " (this item may require an owning Steam account)" if "anonymous" in tail.lower() or "Access Denied" in tail else ""
        return {"success": False, "error": f"SteamCMD did not produce the mod{hint}"}
    dst_base = _game_workshop_dir(appid)
    if not dst_base:
        return {"success": False, "error": "target game is not installed"}
    try:
        os.makedirs(dst_base, exist_ok=True)
        dst = os.path.join(dst_base, str(modid))
        if os.path.isdir(dst):
            shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(src, dst)
        chown_to_user(dst_base, recursive=True)
        return {"success": True, "path": dst}
    except Exception as exc:
        return {"success": False, "error": f"install copy failed: {exc}"}


def _download_worker(job: str, appid: int, ids: List[str], title: str = "") -> None:
    total = len(ids)
    done = 0
    failed: List[Dict[str, str]] = []
    for mid in ids:
        _set_state(job, {"status": "downloading", "current": mid,
                         "done": done, "total": total})
        res = _run_steamcmd_download(appid, mid)
        if res.get("success"):
            done += 1
            _manifest_add(appid, mid, title)  # remember it's ours
        else:
            failed.append({"modid": mid, "error": res.get("error", "")})
        _set_state(job, {"done": done, "failed": failed})
    _set_state(job, {"status": "done" if not failed or done else "failed",
                     "done": done, "total": total, "failed": failed,
                     "success": done > 0})


def start_download(text: str) -> Dict[str, Any]:
    """Resolve + download + install a mod or a whole collection. Gated on the
    owning game being locally installed."""
    info = resolve_mod(text)
    if not info.get("success"):
        return info
    appid = int(info.get("appid") or 0)
    if not appid:
        return {"success": False, "error": "Could not determine the game this mod belongs to"}
    if not is_allowed_target(appid):
        return {"success": False, "error": "owned_game", "appid": appid, "title": info.get("title", "")}
    if not is_game_installed(appid):
        return {"success": False, "error": "not_installed", "appid": appid, "title": info.get("title", "")}
    ids = info["children"] if info.get("isCollection") else [info["modid"]]
    ids = [i for i in ids if i]
    if not ids:
        return {"success": False, "error": "Collection has no items"}
    job = str(info["modid"])
    _set_state(job, {"status": "queued", "appid": appid, "title": info.get("title", ""),
                     "isCollection": info.get("isCollection"), "total": len(ids),
                     "done": 0, "failed": []})
    threading.Thread(target=_download_worker, args=(job, appid, ids, info.get("title", "")),
                     daemon=True).start()
    return {"success": True, "job": job, "appid": appid, "count": len(ids),
            "title": info.get("title", ""), "isCollection": info.get("isCollection")}


def get_download_state(job: str) -> Dict[str, Any]:
    return {"success": True, "state": _get_state(str(job))}


# ── Workshop browse/search across the pool of installed SLS games ────────────
def _installed_pool() -> List[int]:
    """SLSDeck-added / non-Steam games that are actually installed."""
    return [a for a in sorted(_allowed_appids()) if is_game_installed(a)]


def _game_name(appid: int) -> str:
    try:
        for lib in steam._all_library_paths():
            p = os.path.join(lib, "steamapps", f"appmanifest_{appid}.acf")
            if os.path.isfile(p):
                with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                    m = re.search(r'"name"\s*"([^"]+)"', fh.read())
                    if m:
                        return m.group(1)
    except Exception:
        pass
    return ""


def _query_files_one(client, key: str, appid: int, text: str, per: int) -> List[Dict[str, Any]]:
    """One QueryFiles call for a single app (needs a Steam Web API key)."""
    params = {
        "key": key,
        "appid": appid,
        "numperpage": per,
        "page": 1,
        "return_details": 1,
        "return_previews": 1,
        "return_metadata": 1,
        "query_type": 12 if text else 3,  # 12 = ranked by text search, 3 = by trend
    }
    if text:
        params["search_text"] = text
    try:
        r = client.get("https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/", params=params)
        details = (r.json().get("response", {}) or {}).get("publishedfiledetails", []) or []
    except Exception:
        return []
    out = []
    for d in details:
        mid = str(d.get("publishedfileid") or "")
        if not mid:
            continue
        out.append({
            "modid": mid,
            "title": d.get("title") or f"Item {mid}",
            "appid": int(d.get("consumer_app_id") or appid),
            "preview": d.get("preview_url", ""),
            "subs": int(d.get("subscriptions", 0) or d.get("lifetime_subscriptions", 0) or 0),
        })
    return out


_WS_ITEM_RE = re.compile(
    r'sharedfiles/filedetails/\?id=(\d+)[^>]*>.*?workshopItemTitle[^>]*>([^<]+)<',
    re.DOTALL,
)


def _scrape_one(client, appid: int, text: str, per: int) -> List[Dict[str, Any]]:
    """No-key fallback: parse Steam's server-rendered workshop browse page."""
    url = ("https://steamcommunity.com/workshop/browse/"
           f"?appid={appid}&browsesort=textsearch&section=readytouseitems&numperpage={per}")
    if text:
        url += f"&searchtext={text}"
    try:
        r = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        html = r.text
    except Exception:
        return []
    out = []
    seen = set()
    for m in _WS_ITEM_RE.finditer(html):
        mid = m.group(1)
        if mid in seen:
            continue
        seen.add(mid)
        out.append({"modid": mid, "title": (m.group(2) or "").strip() or f"Item {mid}",
                    "appid": appid, "preview": "", "subs": 0})
    return out


def search_workshop(text: str, limit: int = 40) -> Dict[str, Any]:
    """Search Steam Workshop across the pool of installed SLS games. Uses the
    QueryFiles API when a Steam Web API key is set (richer, ranked, thumbnails),
    otherwise falls back to scraping the public browse page."""
    text = (text or "").strip()
    pool = _installed_pool()
    if not pool:
        return {"success": True, "results": [], "note": "no_installed_games"}
    key = settings.get_steam_web_key()
    client = ensure_http_client("workshop: search")
    per = max(5, min(20, (limit // max(1, min(len(pool), 12))) + 3))
    results: List[Dict[str, Any]] = []
    used_scrape = False
    for appid in pool[:12]:
        rows = _query_files_one(client, key, appid, text, per) if key else _scrape_one(client, appid, text, per)
        if not key:
            used_scrape = True
        gname = _game_name(appid)
        for row in rows:
            row["gameName"] = gname
            results.append(row)
    # dedupe by modid, keep the highest-subs copy, then rank
    best: Dict[str, Dict[str, Any]] = {}
    for r in results:
        cur = best.get(r["modid"])
        if not cur or r.get("subs", 0) > cur.get("subs", 0):
            best[r["modid"]] = r
    ranked = sorted(best.values(), key=lambda r: r.get("subs", 0), reverse=True)
    return {"success": True, "results": ranked[:limit],
            "pool": len(pool), "usedScrape": used_scrape, "hasKey": bool(key)}


# ── management: list / enable / disable / remove ─────────────────────────────
def _mod_size(path: str) -> int:
    total = 0
    try:
        for root, _dirs, files in os.walk(path):
            for f in files:
                try:
                    total += os.path.getsize(os.path.join(root, f))
                except Exception:
                    pass
    except Exception:
        pass
    return total


def list_mods(appid: int) -> Dict[str, Any]:
    """Workshop mods THIS PLUGIN downloaded for a game (from our manifest), so we
    never touch Steam-subscribed items the user wants Steam to manage. Enabled =
    present in the game's live workshop dir; disabled = held in our store."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    base = _game_workshop_dir(appid)
    # One-time migration: if we have no record yet for this (allowed) game but its
    # workshop dir already holds mods, adopt them so pre-existing downloads stay
    # manageable.
    if str(appid) not in _load_manifest() and is_allowed_target(appid) and base and os.path.isdir(base):
        for name in os.listdir(base):
            mid = name[:-9] if name.endswith(".disabled") else name
            if mid.isdigit() and os.path.isdir(os.path.join(base, name)):
                _manifest_add(appid, mid, "")
    man = _load_manifest().get(str(appid), {})
    mods: List[Dict[str, Any]] = []
    for modid, meta in sorted(man.items()):
        live = os.path.join(base, str(modid)) if base else ""
        held = _disabled_store(appid, modid)
        if live and os.path.isdir(live):
            enabled, path = True, live
        elif os.path.isdir(held):
            enabled, path = False, held
        else:
            # gone from disk (Steam or user deleted it) — keep the record but 0 size
            enabled, path = bool(meta.get("enabled", True)), ""
        mods.append({"modid": modid, "title": meta.get("title", ""),
                     "enabled": enabled, "sizeBytes": _mod_size(path) if path else 0,
                     "path": path})
    return {"success": True, "appid": appid, "mods": mods}


def list_mod_games() -> Dict[str, Any]:
    """Games that have mods WE downloaded (from our manifest), restricted to
    SLSDeck-added / non-Steam games."""
    allowed = _allowed_appids()
    out = []
    for appid, mods in sorted(_load_manifest().items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else 0):
        if not appid.isdigit() or int(appid) not in allowed:
            continue
        if mods:
            out.append({"appid": int(appid), "modCount": len(mods)})
    return {"success": True, "games": out}


def set_mod_enabled(appid: int, modid: str, enabled: bool) -> Dict[str, Any]:
    """Enable = move the mod back into the game's workshop dir. Disable = move it
    OUT to our store AND strip it from Steam's appworkshop acf, so the running
    client stops re-downloading it."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    modid = _safe_modid(modid)
    if not modid:
        return {"success": False, "error": "Invalid Workshop item id"}
    base = _game_workshop_dir(appid)
    if not base:
        return {"success": False, "error": "game not installed"}
    live = os.path.join(base, str(modid))
    held = _disabled_store(appid, modid)
    if not _contained(base, live) or not _contained(_state_dir(), held):
        return {"success": False, "error": "Refusing to touch a path outside the mod directories"}
    try:
        if enabled:
            if os.path.isdir(held):
                os.makedirs(base, exist_ok=True)
                if os.path.isdir(live):
                    shutil.rmtree(live, ignore_errors=True)
                shutil.move(held, live)
                chown_to_user(base, recursive=True)
        else:
            if os.path.isdir(live):
                os.makedirs(os.path.dirname(held), exist_ok=True)
                if os.path.isdir(held):
                    shutil.rmtree(held, ignore_errors=True)
                shutil.move(live, held)
                chown_to_user(_state_dir(), recursive=True)
            _acf_remove_item(appid, modid)  # stop Steam from restoring it
        _manifest_set_enabled(appid, modid, enabled)
        return {"success": True, "enabled": bool(enabled)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def remove_mod(appid: int, modid: str) -> Dict[str, Any]:
    """Delete the mod from the game dir AND our store, strip it from Steam's acf
    (so it isn't re-downloaded), and forget it from our manifest."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    modid = _safe_modid(modid)
    if not modid:
        return {"success": False, "error": "Invalid Workshop item id"}
    base = _game_workshop_dir(appid)
    removed = False
    store = _state_dir()
    cands = [(store, _disabled_store(appid, modid))]
    if base:
        cands += [(base, os.path.join(base, str(modid))),
                  (base, os.path.join(base, str(modid) + ".disabled"))]
    for root, cand in cands:
        # Never rmtree anything that is not strictly inside its own root.
        if not _contained(root, cand):
            logger.warn(f"workshop: refusing to delete out-of-tree path {cand}")
            continue
        if os.path.isdir(cand):
            try:
                shutil.rmtree(cand, ignore_errors=True)
                removed = True
            except Exception as exc:
                return {"success": False, "error": str(exc)}
    _acf_remove_item(appid, modid)
    _manifest_remove(appid, modid)
    return {"success": True, "removed": removed}
