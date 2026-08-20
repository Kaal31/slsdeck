"""v2 (slsdeckdlc) — trimmed DepotDownloader path, scoped to two jobs only:

  * download a SPECIFIC BUILD's depots (older build) into the Steam library
  * download CONTENT DLC depots into an already-installed game's folder
    (works for legit-owned games — Steam won't fetch unowned-DLC depots, so we
    place the files directly; moon grants ownership)

Reuses the DepotDownloader runtime from ``assella`` (bundled DLL + lazy .NET,
process runner, clean-env). The manifest binary for a chosen gid comes from the
GitHub archive (``depot_history`` mirrors); depot keys come from the resolved
lua. This is NOT the full ASSella acquisition backend — no safe mode, no
full-game download, no uninstall.
"""

from __future__ import annotations

import os
import re
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from .logger import logger
from . import assella, depot_history, downloads, steam, slssteam

# background state (mirrors assella's shape so the same UI polling works)
DL_STATE: Dict[int, Dict[str, Any]] = {}
_LOCK = threading.Lock()

# Per-app Steam app-tokens (DepotDownloaderMod ``-apptoken``). Needed for
# restricted apps whose manifest requests are otherwise rejected. Populated by
# whichever source has one (Hubcap manifest-gen, moon PICS, resolved lua); empty
# until then, in which case DD proceeds without a token.
_APP_TOKENS: Dict[int, str] = {}


def cache_app_token(app_id: int, token: str) -> None:
    """Record a Steam app-token for later ``-apptoken`` use."""
    try:
        t = (token or "").strip()
        if t:
            _APP_TOKENS[int(app_id)] = t
    except Exception:
        pass


def _apptoken_for(app_id: int) -> str:
    try:
        return _APP_TOKENS.get(int(app_id), "")
    except Exception:
        return ""


def _set(appid: int, upd: Dict[str, Any]) -> None:
    with _LOCK:
        s = DL_STATE.get(appid) or {}
        s.update(upd)
        s["appid"] = appid
        DL_STATE[appid] = s


def get_state(appid: int) -> Dict[str, Any]:
    with _LOCK:
        return dict(DL_STATE.get(int(appid), {}))


def all_states() -> List[Dict[str, Any]]:
    with _LOCK:
        return [dict(s) for s in DL_STATE.values()]


# ── manifest file (GitHub archive) ───────────────────────────────────────────
_RAW = "https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"


def _fetch_manifest_file(depot: str, gid: str, dest_dir: str) -> Optional[str]:
    """Get <depot>_<gid>.manifest into dest_dir. Prefers Hubcap's generator (can
    produce ANY depot+gid) when a key is set, then falls back to the GitHub mirror
    archive (only gids someone uploaded)."""
    fname = f"{depot}_{gid}.manifest"
    dst = os.path.join(dest_dir, fname)
    if os.path.isfile(dst) and os.path.getsize(dst) > 0:
        return dst
    client = downloads.ensure_http_client("depotdl: manifest")
    # 1) Hubcap generator — verified to return the raw .manifest binary
    # (application/octet-stream). Works for any depot+gid, so it's the primary
    # source when the user has a Hubcap key set.
    try:
        from .settings import get_api_key_for
        key = get_api_key_for("<moapikey>")
        if key:
            url = ("https://hubcapmanifest.com/api/v1/generate/manifest"
                   f"?depot_id={depot}&manifest_id={gid}&api_key={key}")
            r = client.get(url, headers={"User-Agent": "SLSDeck/depotdl"},
                           follow_redirects=True, timeout=120)
            if r.status_code == 200 and r.content and len(r.content) > 64:
                with open(dst, "wb") as fh:
                    fh.write(r.content)
                logger.log(f"depotdl: manifest {depot}_{gid} from Hubcap generator")
                return dst
    except Exception as exc:
        logger.warn(f"depotdl: Hubcap manifest gen failed for {depot}_{gid}: {exc}")
    # 2) GitHub archive fallback
    for owner, repo in depot_history._MIRRORS:
        tree = depot_history._mirror_tree(owner, repo)
        if gid not in (tree.get(str(depot)) or []):
            continue
        for branch in ("main", "master"):
            try:
                url = _RAW.format(owner=owner, repo=repo, branch=branch, path=fname)
                r = client.get(url, headers={"User-Agent": "SLSDeck/depotdl"},
                               follow_redirects=True, timeout=60)
                if r.status_code == 200 and r.content:
                    with open(dst, "wb") as fh:
                        fh.write(r.content)
                    return dst
            except Exception:
                continue
    return None


def _keys_for(appid: int) -> Dict[str, str]:
    """{depot: key} parsed from the game's resolved lua."""
    out: Dict[str, str] = {}
    try:
        r = downloads.fetch_lua_text(appid)
        for m in re.finditer(r'addappid\s*\(\s*(\d+)\s*,\s*\d+\s*,\s*["\']([0-9a-fA-F]{64})["\']',
                             r.get("lua", "") if r.get("success") else ""):
            out[m.group(1)] = m.group(2)
    except Exception:
        pass
    return out


def _write_keyfile(depot_keys: Dict[str, str], dest_dir: str) -> str:
    kf = os.path.join(dest_dir, "keys.key")
    with open(kf, "w", encoding="utf-8") as fh:
        for d, k in depot_keys.items():
            fh.write(f"{d};{k}\n")
    return kf


def _run(appid: int, app: int, depot_gid: Dict[str, str], keys: Dict[str, str],
         dest_dir: str, mf_dir: str) -> Tuple[int, int, str]:
    """Run DepotDownloader for each depot/gid into dest_dir. Returns
    (ok_count, fail_count, last_output)."""
    backend = assella.ensure_backend()
    if not backend.get("ok"):
        _set(appid, {"status": "failed", "error": backend.get("error", "")})
        return 0, len(depot_gid), backend.get("error", "")
    dotnet = backend["dotnet"]
    kf = _write_keyfile({d: keys[d] for d in depot_gid if d in keys}, dest_dir)
    ok = fail = 0
    last = ""
    for i, (depot, gid) in enumerate(depot_gid.items()):
        if depot not in keys:
            fail += 1
            last = f"no depot key for {depot}"
            continue
        mfile = _fetch_manifest_file(depot, gid, mf_dir)
        # DepotDownloaderMod REQUIRES the pre-fetched manifest file for a pinned
        # gid — without it DD tries to pull the manifest itself (fails on a
        # restricted/old build → "no internet" style errors). Fail loud rather
        # than silently downloading whatever DD picks.
        if not mfile:
            fail += 1
            last = f"could not fetch manifest {gid} for depot {depot}"
            _set(appid, {"percent": int((i + 1) * 100 / max(1, len(depot_gid)))})
            continue
        # -os windows -osarch 64: the Deck's Linux host otherwise defaults to the
        # game's Linux depots (usually nonexistent), which is why builds "did
        # nothing". Force the Windows depots we actually have keys/manifests for.
        args = [dotnet, assella._dll_path(), "-app", str(app), "-depot", str(depot),
                "-manifest", str(gid), "-os", "windows", "-osarch", "64",
                "-manifestfile", mfile]
        tok = _apptoken_for(app)
        if tok:
            args += ["-apptoken", tok]
        args += ["-depotkeys", kf, "-max-downloads", "8", "-dir", dest_dir, "-validate"]
        code, out_tail, _mid = assella._run_depot(dotnet, args, appid)
        if code != 0:
            fail += 1
            last = out_tail or last
        else:
            ok += 1
        _set(appid, {"percent": int((i + 1) * 100 / max(1, len(depot_gid)))})
    return ok, fail, last


def _game_dir(appid: int) -> Tuple[str, str, str]:
    """(library_root, installdir, full_common_dir) for the game, from its
    appmanifest; falls back to a name-based dir under the main library."""
    try:
        r = steam.get_game_install_path_response(appid)
        if r.get("success"):
            return r["libraryPath"], r["installDir"], r["installPath"]
    except Exception:
        pass
    root = steam.detect_steam_install_path()
    name = ""
    try:
        name = downloads.fetch_app_name(appid) or f"App_{appid}"
    except Exception:
        name = f"App_{appid}"
    installdir = re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_") or f"App_{appid}"
    return root, installdir, os.path.join(root, "steamapps", "common", installdir)


# ── public jobs ──────────────────────────────────────────────────────────────

def download_build(appid: int, buildid: str) -> Dict[str, Any]:
    """Download a specific older build's depots via DepotDownloader into the
    game's install folder."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    r = depot_history.resolve(appid, str(buildid))
    if not r.get("success") or not r.get("gids"):
        return {"success": False, "error": r.get("message", "Could not resolve that build")}
    depot_gid = {str(k): str(v) for k, v in r["gids"].items()}
    _set(appid, {"status": "downloading", "op": "build", "percent": 0, "error": ""})
    threading.Thread(target=_build_worker, args=(appid, depot_gid, str(buildid)),
                     name=f"depotdl-build-{appid}", daemon=True).start()
    return {"success": True}


def download_build_with_gids(appid: int, buildid: str, depot_gid: Dict[str, str]) -> Dict[str, Any]:
    """Like download_build, but the caller supplies the exact {depot: gid} map
    (already resolved by the frontend's SteamDB scrape). This skips depot_history's
    own resolver — which can wrongly report "no older builds" for games SteamDB
    hasn't archived — and downloads those exact manifests directly via Hubcap,
    bypassing moon's on-demand fetch (the "no internet" path)."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    clean = {str(d): str(g) for d, g in (depot_gid or {}).items()
             if str(d).isdigit() and str(g).isdigit()}
    if not clean:
        return {"success": False, "error": "no depot:gid pairs supplied"}
    _set(appid, {"status": "downloading", "op": "build", "percent": 0, "error": ""})
    threading.Thread(target=_build_worker, args=(appid, clean, str(buildid)),
                     name=f"depotdl-build-{appid}", daemon=True).start()
    return {"success": True}


def _build_worker(appid: int, depot_gid: Dict[str, str], buildid: str) -> None:
    try:
        root, installdir, dest = _game_dir(appid)
        os.makedirs(dest, exist_ok=True)
        mf_dir = os.path.join(dest, ".slsdeck_manifests")
        os.makedirs(mf_dir, exist_ok=True)
        keys = _keys_for(appid)
        ok, fail, last = _run(appid, appid, depot_gid, keys, dest, mf_dir)
        if ok == 0:
            _set(appid, {"status": "failed", "error": f"No depot downloaded. {last}"})
            return
        # Pin the build in moon too so Steam agrees on the version.
        try:
            slssteam.pin_app_gids(appid, {int(d): g for d, g in depot_gid.items()})
        except Exception:
            pass
        try:
            from .utils import chown_to_user
            chown_to_user(dest, recursive=True)
        except Exception:
            pass
        _set(appid, {"status": "done", "success": True, "percent": 100,
                     "error": (f"{fail} depot(s) failed" if fail else "")})
    except Exception as exc:
        _set(appid, {"status": "failed", "error": str(exc)})


def download_dlc(appid: int) -> Dict[str, Any]:
    """Download the game's CONTENT DLC depots into its install folder (works for
    a legit-owned base game). Resolves DLC depots + keys from the full manifest."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    _set(appid, {"status": "resolving", "op": "dlc", "percent": 0, "error": ""})
    threading.Thread(target=_dlc_worker, args=(appid,),
                     name=f"depotdl-dlc-{appid}", daemon=True).start()
    return {"success": True}


def _dlc_worker(appid: int) -> None:
    try:
        # Depots + gids come from the full manifest bundle (Hubcap) / lua.
        bundle = downloads.fetch_manifest_bundle(appid)
        mf = bundle.get("manifests", {})  # {depot: path}
        keys = _keys_for(appid)
        # Determine gid per depot from the manifest filename.
        depot_gid: Dict[str, str] = {}
        for depot, path in mf.items():
            m = re.search(r"_(\d+)\.manifest$", os.path.basename(path))
            if m:
                depot_gid[depot] = m.group(1)
        # Only fetch depots we have a key for (the DLC content depots).
        depot_gid = {d: g for d, g in depot_gid.items() if d in keys}
        if not depot_gid:
            _set(appid, {"status": "failed",
                         "error": "No keyed DLC depots resolved (set a Hubcap key for full manifests)."})
            return
        root, installdir, dest = _game_dir(appid)
        os.makedirs(dest, exist_ok=True)
        mf_dir = os.path.join(dest, ".slsdeck_manifests")
        os.makedirs(mf_dir, exist_ok=True)
        # Reuse the .manifest files the bundle already fetched.
        for depot, path in mf.items():
            try:
                dst = os.path.join(mf_dir, os.path.basename(path))
                if path != dst and os.path.isfile(path):
                    import shutil as _sh
                    _sh.copy2(path, dst)
            except Exception:
                pass
        _set(appid, {"status": "downloading", "percent": 0})
        ok, fail, last = _run(appid, appid, depot_gid, keys, dest, mf_dir)
        if ok == 0:
            _set(appid, {"status": "failed", "error": f"No DLC depot downloaded. {last}"})
            return
        try:
            from .utils import chown_to_user
            chown_to_user(dest, recursive=True)
        except Exception:
            pass
        _set(appid, {"status": "done", "success": True, "percent": 100,
                     "error": (f"{fail} depot(s) failed" if fail else "")})
    except Exception as exc:
        _set(appid, {"status": "failed", "error": str(exc)})
