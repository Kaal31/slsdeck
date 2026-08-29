"""HVAuto (KoriaPolis/HVAuto) hypervisor-crack source with build compatibility hints.

HVAuto ships a static JSON: a list of ``{name, buildid, fixes:[{href, badges}]}``.
The crack is built for a *specific* Steam build. Build selection is independent:

  1. match the game by TITLE  -> get the crack's target ``buildid``
  2. resolve that buildid for compatibility/status
       * if buildid == the game's CURRENT public build, steamcmd.net gives the
         gids directly (no scraping) — the common case for fresh cracks
       * otherwise it's an older build and we flag "needs history" (the SteaMidra
         depot_history resolver would be needed; not wired here yet)
  3. let the user select/downgrade that build in the specific-build workflow
  4. download + extract the crack's GAME-folder files (done in the apply step,
     dropping the Windows-HV bits — our cpuid module + Proton-HV replace those)

This module covers steps 1-2 and reports the compatible BuildID without changing
ManifestPins. The download/extract/auto-HV
orchestration lives in the apply step.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import runtime_path, get_user_home
from .httpc import ensure_http_client
from .utils import chown_to_user

HV_JSON_URL = "https://raw.githubusercontent.com/KoriaPolis/HVAuto/main/HV.json"
STEAMCMD_URL = "https://api.steamcmd.net/v1/info/{appid}"
_UA = "SLSDeck/hvauto"
_TTL = 3600  # cache HV.json for an hour

_cache: Dict[str, Any] = {"ts": 0.0, "list": None, "byname": {}}


# ── name matching (reuse the online-fix normaliser) ──────────────────────────
def _norm(name: str) -> str:
    try:
        from .fixes import _pero_normalize
        return _pero_normalize(name or "")
    except Exception:
        return "".join(c for c in (name or "").lower() if c.isalnum())


# ── HV.json fetch (cached) ───────────────────────────────────────────────────
def fetch_hv_list(force: bool = False) -> List[Dict[str, Any]]:
    now = time.time()
    if not force and _cache["list"] is not None and (now - _cache["ts"]) < _TTL:
        return _cache["list"]
    # disk cache fallback (survives transient network failures)
    disk = runtime_path("hvauto_cache.json")
    client = ensure_http_client("hvauto: HV.json")
    data: Optional[List[Dict[str, Any]]] = None
    try:
        r = client.get(HV_JSON_URL, headers={"User-Agent": _UA}, timeout=20, follow_redirects=True)
        if r.status_code == 200:
            data = r.json()
    except Exception as exc:
        logger.warn(f"hvauto: HV.json fetch failed: {exc}")
    if data is None:
        try:
            if os.path.isfile(disk):
                data = json.loads(open(disk, "r", encoding="utf-8").read())
        except Exception:
            data = None
    if data is None:
        return _cache["list"] or []
    try:
        with open(disk, "w", encoding="utf-8") as fh:
            json.dump(data, fh)
    except Exception:
        pass
    byname = {}
    for e in data:
        n = _norm(str(e.get("name") or ""))
        if n:
            byname.setdefault(n, e)
    _cache.update({"ts": now, "list": data, "byname": byname})
    logger.log(f"hvauto: HV.json loaded ({len(data)} entries)")
    return data


# ── match a game to an HVAuto crack (by title) ───────────────────────────────
def find_for_game(appid: int, name: str = "") -> Dict[str, Any]:
    """Return the HVAuto entry for a title, matched by name. appid is only used
    to look up the name when one isn't supplied."""
    fetch_hv_list()
    byname = _cache.get("byname") or {}
    if not name:
        try:
            from .downloads import _fetch_app_name
            name = _fetch_app_name(int(appid)) or ""
        except Exception:
            name = ""
    q = _norm(name)
    hit = byname.get(q)
    if not hit and q:
        # loose contains match (handle "™"/edition suffixes)
        for k, e in byname.items():
            if q and (q in k or k in q) and abs(len(q) - len(k)) <= 6:
                hit = e
                break
    if not hit:
        return {"success": True, "found": False}
    fixes = hit.get("fixes") or []
    hrefs = [f.get("href") for f in fixes if f.get("href")]
    badges = sorted({b for f in fixes for b in (f.get("badges") or [])})
    return {"success": True, "found": True, "name": hit.get("name"),
            "buildid": str(hit.get("buildid") or ""), "hrefs": hrefs, "badges": badges}


# ── current public build + depot gids (steamcmd.net, keyless) ────────────────
def get_current_build(appid: int) -> Dict[str, Any]:
    client = ensure_http_client("hvauto: steamcmd")
    try:
        r = client.get(STEAMCMD_URL.format(appid=int(appid)),
                       headers={"User-Agent": _UA}, timeout=15, follow_redirects=True)
        if r.status_code != 200:
            return {"success": False, "error": f"steamcmd HTTP {r.status_code}"}
        root = (r.json().get("data", {}) or {}).get(str(appid), {})
    except Exception as exc:
        return {"success": False, "error": f"steamcmd fetch failed: {exc}"}
    depots = root.get("depots", {}) or {}
    buildid = str(((depots.get("branches", {}) or {}).get("public", {}) or {}).get("buildid") or "")
    gids: Dict[int, str] = {}
    for k, v in depots.items():
        if not str(k).isdigit() or not isinstance(v, dict):
            continue
        gid = (((v.get("manifests", {}) or {}).get("public", {}) or {}).get("gid"))
        if gid:
            gids[int(k)] = str(gid)
    return {"success": True, "buildid": buildid, "gids": gids}


# ── resolve a crack's target buildid -> pinnable gids ────────────────────────
def resolve_build(appid: int, buildid: str) -> Dict[str, Any]:
    """Turn HVAuto's target buildid into the depot gids to pin.
    status: 'current'  -> gids returned, ready to pin (crack build == live build)
            'older'     -> crack targets a superseded build; needs depot-history
            'unknown'   -> couldn't reach steamcmd
    """
    cur = get_current_build(appid)
    if not cur.get("success"):
        return {"success": False, "status": "unknown", "error": cur.get("error")}
    cur_build = cur.get("buildid") or ""
    if buildid and cur_build and str(buildid) == str(cur_build):
        return {"success": True, "status": "current", "buildid": cur_build,
                "gids": cur.get("gids", {})}
    # Older build: hand off to the depot-history resolver (GitHub manifest archive
    # + PatchnotesRSS date-join) to recover that build's per-depot gids.
    try:
        from . import depot_history
        dh = depot_history.resolve(int(appid), str(buildid))
        if dh.get("success") and dh.get("status") == "resolved" and dh.get("gids"):
            return {"success": True, "status": "resolved", "buildid": str(buildid),
                    "currentBuildid": cur_build, "gids": dh["gids"],
                    "message": dh.get("message", "")}
        older_msg = dh.get("message", "") if isinstance(dh, dict) else ""
    except Exception as exc:
        logger.warn(f"hvauto: depot-history resolve failed: {exc}")
        older_msg = ""
    return {"success": True, "status": "older", "buildid": str(buildid),
            "currentBuildid": cur_build,
            "message": ("HV crack targets an older build; depot-history couldn't "
                        "resolve its gids" + (f" ({older_msg})" if older_msg else "") + ".")}


# ── one-call status for the UI ───────────────────────────────────────────────
def status_for_game(appid: int, name: str = "") -> Dict[str, Any]:
    match = find_for_game(appid, name)
    if not match.get("found"):
        return {"success": True, "found": False}
    res = resolve_build(appid, match["buildid"])
    return {"success": True, "found": True, "name": match["name"],
            "buildid": match["buildid"], "hrefs": match["hrefs"], "badges": match["badges"],
            "resolve": res}


# ── crack download (buzzheavier signed-token / vikingfile / direct) ──────────
_ARCHIVE_MAGIC = {b"Rar!": ".rar", b"7z\xbc\xaf": ".7z", b"PK\x03\x04": ".zip",
                  b"PK\x05\x06": ".zip", b"PK\x07\x08": ".zip"}
# Windows-hypervisor setup bits that our cpuid module + Proton-HV replace — never
# copy these into the game folder.
_HV_DROP_NAMES = {"vbs.cmd", "autorun.inf", "install.cmd", "install.bat", "setup.cmd", "setup.bat"}
_HV_DROP_EXT = {".sys", ".cmd", ".bat", ".ps1", ".inf", ".reg", ".msi", ".txt", ".url", ".nfo"}


def _valid_archive(path: str) -> str:
    try:
        with open(path, "rb") as fh:
            head = fh.read(8)
    except Exception:
        return ""
    for sig, ext in _ARCHIVE_MAGIC.items():
        if head.startswith(sig):
            return ext
    return ""


_ARCHIVE_EXTS = (".zip", ".rar", ".7z", ".7z.001")


def _stem(fn: str) -> str:
    """Filename without its archive extension(s), lowercased."""
    low = fn.lower()
    for ext in (".7z.001", ".zip", ".rar", ".7z"):
        if low.endswith(ext):
            return low[: -len(ext)]
    return os.path.splitext(low)[0]


def find_in_downloads(names: Optional[List[str]] = None, max_age_min: int = 30) -> str:
    """Look in ~/Downloads (and $HOME) for a crack archive the user grabbed by
    hand — so pressing Apply again after downloading just works, no browser.

    Preference order: a valid archive whose name matches any hint in `names`
    (case-insensitive, either-way substring); otherwise the newest archive
    modified within `max_age_min` minutes (i.e. clearly just downloaded). Passing
    a game title as a hint is enough for most cracks, which are named after the
    game. Returns a path or ""."""
    home = get_user_home()
    dirs = [os.path.join(home, "Downloads"), home]
    cand: List[str] = []
    for d in dirs:
        try:
            for fn in os.listdir(d):
                p = os.path.join(d, fn)
                if not os.path.isfile(p):
                    continue
                if fn.lower().endswith(_ARCHIVE_EXTS) or _valid_archive(p):
                    cand.append(p)
        except Exception:
            continue
    if not cand:
        return ""
    cand.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    wants = [_stem(os.path.basename(n)) for n in (names or []) if n and n.strip()]
    for p in cand:
        stem = _stem(os.path.basename(p))
        for w in wants:
            if w and (w in stem or stem in w):
                return p
    # No name match → only auto-use a *recently* downloaded archive, so we never
    # grab some unrelated old file. Skip when the caller demanded a name match.
    if max_age_min > 0:
        newest = cand[0]
        try:
            if (time.time() - os.path.getmtime(newest)) <= max_age_min * 60:
                return newest
        except Exception:
            pass
    return ""


def _download_buzzheavier(file_id: str, dest_dir: str) -> Dict[str, Any]:
    client = ensure_http_client("hvauto: buzzheavier")
    page_url = f"https://buzzheavier.com/{file_id}"
    token = None
    try:
        pr = client.get(page_url, headers={"User-Agent": _UA, "Accept": "text/html"},
                        follow_redirects=True, timeout=20)
        m = re.search(r'hx-get="[^"]*?/download\?t=([^"&]+)', pr.text or "")
        if m:
            token = m.group(1)
    except Exception as exc:
        logger.warn(f"hvauto: buzzheavier page fetch failed: {exc}")
    if not token:
        return {"success": False, "needsManual": True, "url": page_url,
                "error": "buzzheavier: no download token (open the page manually)"}
    hx = {"User-Agent": _UA, "Accept": "*/*", "HX-Request": "true",
          "HX-Current-URL": page_url, "Referer": page_url}
    cdn = None
    for alt in (False, True):
        trig = f"{page_url}/download?t={token}" + ("&alt=true" if alt else "")
        try:
            tr = client.get(trig, headers=hx, follow_redirects=False, timeout=20)
            cdn = tr.headers.get("hx-redirect") or tr.headers.get("Hx-Redirect")
            if cdn:
                break
        except Exception:
            pass
    if not cdn:
        return {"success": False, "needsManual": True, "url": page_url,
                "error": "buzzheavier: no CDN redirect (open the page manually)"}
    dest = os.path.join(dest_dir, f"{file_id}.bin")
    try:
        with client.stream("GET", cdn, headers={"User-Agent": _UA}, follow_redirects=True, timeout=None) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=524288):
                    f.write(chunk)
    except Exception as exc:
        return {"success": False, "error": f"buzzheavier download failed: {exc}"}
    ext = _valid_archive(dest)
    if not ext:
        try:
            os.remove(dest)
        except Exception:
            pass
        return {"success": False, "needsManual": True, "url": page_url,
                "error": "buzzheavier returned a non-archive (open the page manually)"}
    fixed = dest[:-4] + ext
    if fixed != dest:
        os.rename(dest, fixed)
    return {"success": True, "path": fixed}


def download_crack(href: str, dest_dir: str) -> Dict[str, Any]:
    os.makedirs(dest_dir, exist_ok=True)
    if "buzzheavier.com/" in href:
        fid = href.rstrip("/").split("/")[-1]
        return _download_buzzheavier(fid, dest_dir)
    # vikingfile / direct: best-effort straight download; hand off to browser if it
    # isn't a real archive.
    client = ensure_http_client("hvauto: direct dl")
    dest = os.path.join(dest_dir, "crack.bin")
    try:
        with client.stream("GET", href, headers={"User-Agent": _UA}, follow_redirects=True, timeout=None) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=524288):
                    f.write(chunk)
    except Exception as exc:
        return {"success": False, "needsManual": True, "url": href, "error": str(exc)}
    ext = _valid_archive(dest)
    if not ext:
        return {"success": False, "needsManual": True, "url": href,
                "error": "host needs a manual download (not a direct archive link)"}
    fixed = dest[:-4] + ext
    os.rename(dest, fixed)
    return {"success": True, "path": fixed}


# ── extraction (game-files-only) ─────────────────────────────────────────────
def _extract_archive(archive: str, out_dir: str) -> bool:
    os.makedirs(out_dir, exist_ok=True)
    cmds = []
    try:
        from .fixes import _bundled_7zz
        bz = _bundled_7zz()
        if bz:
            cmds.append([bz, "x", "-y", f"-o{out_dir}", archive])
    except Exception:
        pass
    for exe in ("7zz", "7z", "7za"):
        if shutil.which(exe):
            cmds.append([exe, "x", "-y", f"-o{out_dir}", archive])
    if shutil.which("unrar"):
        cmds.append(["unrar", "x", "-y", "-o+", archive, out_dir + os.sep])
    if shutil.which("bsdtar"):
        cmds.append(["bsdtar", "-xf", archive, "-C", out_dir])
    for cmd in cmds:
        try:
            r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=600)
            if r.returncode == 0 and any(True for _ in os.scandir(out_dir)):
                return True
        except Exception:
            continue
    return False


def _mirror_game_files(staging: str, install_path: str) -> Dict[str, Any]:
    """Copy the crack's GAME-folder files from *staging* into the game, dropping
    Windows-HV setup bits. Then mirror the emulator DLLs next to the real exe."""
    extracted: List[str] = []
    replaced: List[str] = []
    for root, _dirs, files in os.walk(staging):
        rel_root = os.path.relpath(root, staging)
        for fn in files:
            low = fn.lower()
            ext = os.path.splitext(low)[1]
            if low in _HV_DROP_NAMES or ext in _HV_DROP_EXT:
                continue  # Windows-HV / setup / notes — our HV module handles this
            src = os.path.join(root, fn)
            rel = fn if rel_root == "." else os.path.join(rel_root, fn)
            dst = os.path.join(install_path, rel)
            try:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                if os.path.exists(dst):
                    bak = dst + "_o"
                    if not os.path.exists(bak):
                        shutil.copy2(dst, bak)
                    replaced.append(dst)
                shutil.copy2(src, dst)
                chown_to_user(dst, recursive=False)
                extracted.append(dst)
            except Exception as exc:
                logger.warn(f"hvauto: copy failed for {rel}: {exc}")
    # Mirror recognised emulator DLLs next to the real nested exe (reuses fix logic).
    try:
        from .fixes import _mirror_fix_to_exe_dir
        _mirror_fix_to_exe_dir(install_path, extracted, replaced)
    except Exception as exc:
        logger.warn(f"hvauto: exe-dir mirror failed: {exc}")
    return {"extracted": extracted, "replaced": replaced}


# ── apply: pin build -> download crack -> extract -> ensure Proton-HV ────────
def apply_hv_local(appid: int, install_path: str, archive_path: str, name: str = "") -> Dict[str, Any]:
    """Apply an HV crack the user downloaded by hand (host blocked auto-download).

    Build pinning already happened on the first attempt; here we extract the
    local archive (game-files only, dropping the Windows-HV bits) and ensure the
    Denuvo/HV Proton — same tail as apply_hv()."""
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    if not archive_path or not os.path.isfile(archive_path):
        return {"success": False, "error": "that file no longer exists — download it again"}
    tmp = tempfile.mkdtemp(prefix=f"hvauto_local_{appid}_")
    staging = os.path.join(tmp, "x")
    if not _extract_archive(archive_path, staging):
        shutil.rmtree(tmp, ignore_errors=True)
        return {"success": False, "error": "could not extract that archive "
                "(needs 7z/unrar/bsdtar; may not be the crack file)"}
    mir = _mirror_game_files(staging, install_path)
    shutil.rmtree(tmp, ignore_errors=True)
    proton_tool = ""
    try:
        from . import proton
        proton.install_proton()
        proton_tool = getattr(proton, "TOOL_NAME", "")
    except Exception as exc:
        logger.warn(f"hvauto: proton ensure failed: {exc}")
    return {"success": True, "installed": len(mir["extracted"]), "protonTool": proton_tool,
            "activateHv": True, "note": "HV crack installed from your download."}


def apply_hv(appid: int, install_path: str, name: str = "", href: str = "") -> Dict[str, Any]:
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    match = find_for_game(appid, name)
    if not match.get("found"):
        return {"success": False, "notFound": True, "error": "no HVAuto crack for this title"}
    buildid = match["buildid"]
    href = href or (match["hrefs"][0] if match["hrefs"] else "")
    if not href:
        return {"success": False, "error": "HVAuto entry has no download link"}

    # The catalog BuildID is compatibility metadata, not authority to replace a
    # pin selected in the specific-build menu. Resolve it for status only.
    res = resolve_build(appid, buildid)
    pinned = False

    # 2) get the crack archive. First: did the user already download it (host
    #    blocked auto-DL last time)? Scan ~/Downloads so a second Apply press
    #    just works. Otherwise try every mirror in the entry (one may have
    #    expired) before handing off to the browser.
    tmp = tempfile.mkdtemp(prefix=f"hvauto_{appid}_")
    archive = ""
    from_downloads = find_in_downloads(names=[match.get("name") or "", name])
    if from_downloads:
        archive = from_downloads
    else:
        tries = [href] + [h for h in (match.get("hrefs") or []) if h and h != href]
        last: Dict[str, Any] = {"needsManual": True, "url": href, "error": "download failed"}
        for h in tries:
            dl = download_crack(h, tmp)
            if dl.get("success"):
                archive = dl["path"]
                break
            last = dl
        if not archive:
            shutil.rmtree(tmp, ignore_errors=True)
            return {"success": False, "needsManual": last.get("needsManual", False),
                    "url": last.get("url", href),
                    "error": (last.get("error", "download failed")
                              + " — the host file may have expired. Download it in the "
                                "browser (saves to Downloads), then press Apply again."),
                    "buildid": buildid, "pinned": pinned}

    # 3) extract + copy game-files only (drop Windows-HV bits)
    staging = os.path.join(tmp, "x")
    if not _extract_archive(archive, staging):
        shutil.rmtree(tmp, ignore_errors=True)
        return {"success": False, "error": "could not extract the crack archive "
                "(needs 7z/unrar/bsdtar)", "buildid": buildid, "pinned": pinned}
    mir = _mirror_game_files(staging, install_path)
    shutil.rmtree(tmp, ignore_errors=True)

    # 4) ensure the Denuvo/HV Proton is installed; frontend sets it per-game + loads HV
    proton_tool = ""
    try:
        from . import proton
        proton.install_proton()
        proton_tool = getattr(proton, "TOOL_NAME", "")
    except Exception as exc:
        logger.warn(f"hvauto: proton ensure failed: {exc}")

    src = "from your Downloads " if from_downloads else ""
    return {"success": True, "buildid": buildid, "pinned": pinned,
            "buildStatus": res.get("status"), "currentBuildid": res.get("currentBuildid", ""),
            "installed": len(mir["extracted"]), "protonTool": proton_tool,
            "activateHv": True, "fromDownloads": bool(from_downloads),
            "note": (f"Crack installed {src}. Compatible build: {buildid}.".replace("  ", " ")
                     if res.get("status") == "current"
                     else f"Crack installed {src}. It targets build {buildid}; "
                          "select that build separately if the current build is incompatible.")}
