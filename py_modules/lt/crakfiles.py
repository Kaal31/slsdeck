"""CrakFiles (KoriaPolis/CrakFiles) — general DRM-crack source with build hints.

crackfiles.json entries: ``{name, buildid, source_crack[], original_download[],
fixes:[{href, filename, badges}]}``. Each crack targets a specific ``buildid``
(cs.rin.ru "voices38"/0xZeOn cracks), but that BuildID is a compatibility hint:

  1. match by title -> get the crack's buildid + fix href
  2. report whether the independently selected/installed build matches it
  3. download the crack (pixeldrain / buzzheavier / vikingfile)
  4. extract (plain, else pwd="cs.rin.ru") and drop the game-folder files in

The manifest/lua (ownership + depot keys) comes from any lua source; we just
report the crack's compatible build without overriding the user's selected pin.
Reuses hvauto's resolver, downloader and game-files mirror.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import runtime_path
from .httpc import ensure_http_client
from . import hvauto

CRAK_JSON_URL = "https://raw.githubusercontent.com/KoriaPolis/CrakFiles/main/crackfiles.json"
_UA = "SLSDeck/crakfiles"
_PW = "cs.rin.ru"          # cs.rin.ru archive password (used only if plain extract fails)
_TTL = 3600

_cache: Dict[str, Any] = {"ts": 0.0, "list": None, "byname": {}}


def _norm(name: str) -> str:
    try:
        from .fixes import _pero_normalize
        return _pero_normalize(name or "")
    except Exception:
        return "".join(c for c in (name or "").lower() if c.isalnum())


# ── crackfiles.json fetch (cached + disk fallback) ───────────────────────────
def fetch_list(force: bool = False) -> List[Dict[str, Any]]:
    now = time.time()
    if not force and _cache["list"] is not None and (now - _cache["ts"]) < _TTL:
        return _cache["list"]
    disk = runtime_path("crakfiles_cache.json")
    client = ensure_http_client("crakfiles: json")
    data: Optional[List[Dict[str, Any]]] = None
    try:
        r = client.get(CRAK_JSON_URL, headers={"User-Agent": _UA}, timeout=20, follow_redirects=True)
        if r.status_code == 200:
            data = r.json()
    except Exception as exc:
        logger.warn(f"crakfiles: json fetch failed: {exc}")
    if data is None and os.path.isfile(disk):
        try:
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
    logger.log(f"crakfiles: loaded {len(data)} entries")
    return data


# ── match a game to a crack (by title) ───────────────────────────────────────
def find_for_game(appid: int, name: str = "") -> Dict[str, Any]:
    fetch_list()
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
        for k, e in byname.items():
            if q and (q in k or k in q) and abs(len(q) - len(k)) <= 6:
                hit = e
                break
    if not hit:
        return {"success": True, "found": False}
    fixes = hit.get("fixes") or []
    hrefs = [f.get("href") for f in fixes if f.get("href")]
    files = [f.get("filename") for f in fixes if f.get("filename")]
    badges = sorted({b for f in fixes for b in (f.get("badges") or [])})
    return {"success": True, "found": True, "name": hit.get("name"),
            "buildid": str(hit.get("buildid") or ""), "hrefs": hrefs, "files": files, "badges": badges}


# ── download (pixeldrain API / buzzheavier / vikingfile / direct) ────────────
def _download_pixeldrain(file_id: str, dest_dir: str) -> Dict[str, Any]:
    # pixeldrain's file API returns the raw bytes with no captcha/token.
    url = f"https://pixeldrain.com/api/file/{file_id}?download"
    client = ensure_http_client("crakfiles: pixeldrain")
    dest = os.path.join(dest_dir, f"{file_id}.bin")
    try:
        with client.stream("GET", url, headers={"User-Agent": _UA}, follow_redirects=True, timeout=None) as resp:
            if resp.status_code != 200:
                return {"success": False, "needsManual": True,
                        "url": f"https://pixeldrain.com/u/{file_id}",
                        "error": f"pixeldrain HTTP {resp.status_code}"}
            with open(dest, "wb") as f:
                for chunk in resp.iter_bytes(chunk_size=524288):
                    f.write(chunk)
    except Exception as exc:
        return {"success": False, "error": f"pixeldrain download failed: {exc}"}
    ext = hvauto._valid_archive(dest)
    if not ext:
        return {"success": False, "needsManual": True,
                "url": f"https://pixeldrain.com/u/{file_id}",
                "error": "pixeldrain returned a non-archive"}
    fixed = dest[:-4] + ext
    if fixed != dest:
        os.rename(dest, fixed)
    return {"success": True, "path": fixed}


def download(href: str, dest_dir: str) -> Dict[str, Any]:
    os.makedirs(dest_dir, exist_ok=True)
    if "pixeldrain.com/" in href:
        fid = href.rstrip("/").split("/")[-1]
        return _download_pixeldrain(fid, dest_dir)
    # buzzheavier / vikingfile / direct — reuse the HVAuto downloader.
    return hvauto.download_crack(href, dest_dir)


# ── extract (plain, then cs.rin.ru password) ─────────────────────────────────
def _extract(archive: str, out_dir: str) -> bool:
    if hvauto._extract_archive(archive, out_dir):
        return True
    # retry with the cs.rin.ru password via bundled 7zz
    try:
        from .fixes import _bundled_7zz
        bz = _bundled_7zz()
    except Exception:
        bz = ""
    cmds = []
    if bz:
        cmds.append([bz, "x", "-y", f"-p{_PW}", f"-o{out_dir}", archive])
    for exe in ("7zz", "7z", "7za"):
        if shutil.which(exe):
            cmds.append([exe, "x", "-y", f"-p{_PW}", f"-o{out_dir}", archive])
    for cmd in cmds:
        try:
            r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=600)
            if r.returncode == 0 and any(True for _ in os.scandir(out_dir)):
                return True
        except Exception:
            continue
    return False


# ── apply: pin build -> download -> extract -> mirror game files ─────────────
def apply(appid: int, install_path: str, name: str = "", href: str = "") -> Dict[str, Any]:
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    match = find_for_game(appid, name)
    if not match.get("found"):
        return {"success": False, "notFound": True, "error": "no CrakFiles crack for this title"}
    buildid = match["buildid"]
    href = href or (match["hrefs"][0] if match["hrefs"] else "")
    if not href:
        return {"success": False, "error": "CrakFiles entry has no download link"}

    # BuildID is a compatibility hint. Do not replace a pin selected in the
    # specific-build menu and do not invent manifest GIDs from this crack entry.
    pinned = False
    build_status = ""
    if buildid:
        res = hvauto.resolve_build(appid, buildid)
        build_status = res.get("status", "")

    # 2) get the crack archive. Check ~/Downloads first (so pressing Apply again
    #    after a manual download just works), then try every mirror in the entry.
    tmp = tempfile.mkdtemp(prefix=f"crak_{appid}_")
    archive = ""
    hints = list(match.get("files") or []) + [match.get("name") or "", name]
    from_downloads = hvauto.find_in_downloads(names=hints)
    if from_downloads:
        archive = from_downloads
    else:
        tries = [href] + [h for h in (match.get("hrefs") or []) if h and h != href]
        last: Dict[str, Any] = {"needsManual": True, "url": href, "error": "download failed"}
        for h in tries:
            dl = download(h, tmp)
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

    # 3) extract + copy the crack's game-folder files in
    staging = os.path.join(tmp, "x")
    if not _extract(archive, staging):
        shutil.rmtree(tmp, ignore_errors=True)
        return {"success": False, "error": "could not extract the crack archive "
                "(needs 7z/unrar; may be password-protected)", "buildid": buildid, "pinned": pinned}
    mir = hvauto._mirror_game_files(staging, install_path)
    shutil.rmtree(tmp, ignore_errors=True)

    src = "from your Downloads " if from_downloads else ""
    return {"success": True, "buildid": buildid, "pinned": pinned, "buildStatus": build_status,
            "installed": len(mir["extracted"]), "badges": match["badges"], "fromDownloads": bool(from_downloads),
            "note": (f"Crack installed {src}. Compatible build: {buildid}.".replace("  ", " ")
                     if build_status == "current"
                     else f"Crack installed {src}; it targets build {buildid}. "
                          "Select that build separately if needed.")}


def apply_local(appid: int, install_path: str, archive_path: str, name: str = "") -> Dict[str, Any]:
    """Apply a crack the user downloaded by hand (host blocked auto-download).

    Build selection is independent; this only extracts the local archive into
    the game folder using the same mirror path as apply()."""
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    if not archive_path or not os.path.isfile(archive_path):
        return {"success": False, "error": "that file no longer exists — download it again"}
    tmp = tempfile.mkdtemp(prefix=f"crak_local_{appid}_")
    staging = os.path.join(tmp, "x")
    if not _extract(archive_path, staging):
        shutil.rmtree(tmp, ignore_errors=True)
        return {"success": False, "error": "could not extract that archive "
                "(needs 7z/unrar; may be password-protected or not the crack file)"}
    mir = hvauto._mirror_game_files(staging, install_path)
    shutil.rmtree(tmp, ignore_errors=True)
    return {"success": True, "installed": len(mir["extracted"]),
            "note": "Crack installed from your download. Restart Steam."}


def status_for_game(appid: int, name: str = "") -> Dict[str, Any]:
    match = find_for_game(appid, name)
    if not match.get("found"):
        return {"success": True, "found": False}
    res = hvauto.resolve_build(appid, match["buildid"]) if match["buildid"] else {"status": ""}
    return {"success": True, "found": True, "name": match["name"], "buildid": match["buildid"],
            "hrefs": match["hrefs"], "badges": match["badges"], "resolve": res}
