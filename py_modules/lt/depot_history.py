"""Depot manifest version history — the older-build resolver for HVAuto/CrakFiles.

Given an appid + a target buildid (older than the current public build), produce
the ``{depot: gid}`` map to pin so the installed build matches the crack.

Ported/adapted from SteaMidra's depot_history.py, KEYLESS layers only. SFF's own
source disables the SteamDB 3-layer scraper (curl_cffi/cookie/headless-Chrome) as
unreliable + resource-heavy, so we do the same: use the sources that actually work
and degrade gracefully.

Chain, per depot:
  1. Steam CM (steamcmd.net) — current build's gid + date.
  2. GitHub manifest-archive mirrors — historical ``<depot>_<gid>.manifest`` files,
     dated by their commit (GitHub API). This is where older gids come from.
  3. (optional) SteamDB depot page via a user-supplied cf_clearance cookie — no
     browser; skipped if no cookie is configured.
Then buildid<->date from SteamDB PatchnotesRSS (keyless XML) joins a build to the
depot gids of that date (±3 days).
"""

from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import runtime_path
from .httpc import ensure_http_client
from . import hvauto

_UA = "SLSDeck/depot-history"
_GH_API = "https://api.github.com"
# Manifest-archive mirrors (same repos the Charon/GitHub cascade uses); each holds
# <depot>_<gid>.manifest files. Tried in order until one has the depot.
_MIRRORS = (("qwe213312", "k25FCdfEOoEJ42S6"),
            ("mejikuhibiniu1", "k25FCdfEOoEJ42S6"),
            ("Sainan", "k25FCdfEOoEJ42S6"))
_TREE_TTL = 3600
_RESULT_TTL = 300
_DATE_TOLERANCE_DAYS = 3

_tree_cache: Dict[str, Any] = {}      # "owner/repo" -> {ts, map:{depot:[gid]}}
_date_cache: Dict[str, str] = {}      # "<depot>_<gid>.manifest" -> "YYYY-MM-DD"
_build_ids_cache: Dict[str, Dict[str, str]] = {}  # appid -> {date: buildid}


@dataclass
class _Entry:
    gid: str
    date: str          # YYYY-MM-DD or "N/A"
    source: str = ""


def _gh_headers() -> Dict[str, str]:
    h = {"Accept": "application/vnd.github+json", "User-Agent": _UA}
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h


# ── GitHub mirror tree: depot -> [gid] ───────────────────────────────────────
def _mirror_tree(owner: str, repo: str) -> Dict[str, List[str]]:
    key = f"{owner}/{repo}"
    now = time.time()
    c = _tree_cache.get(key)
    if c and (now - c["ts"]) < _TREE_TTL:
        return c["map"]
    disk = runtime_path(f"mirror_tree_{owner}_{repo}.json")
    if os.path.isfile(disk):
        try:
            d = json.loads(open(disk, encoding="utf-8").read())
            if (now - d.get("ts", 0)) < _TREE_TTL:
                _tree_cache[key] = {"ts": d["ts"], "map": d["map"]}
                return d["map"]
        except Exception:
            pass
    client = ensure_http_client("depot_history: tree")
    mp: Dict[str, List[str]] = {}
    for branch in ("main", "master"):
        try:
            r = client.get(f"{_GH_API}/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
                           headers=_gh_headers(), timeout=30, follow_redirects=True)
            if r.status_code != 200:
                continue
            for item in r.json().get("tree", []):
                m = re.match(r"^(\d+)_(\d+)\.manifest$", item.get("path", ""))
                if m:
                    mp.setdefault(m.group(1), []).append(m.group(2))
            break
        except Exception as exc:
            logger.warn(f"depot_history: tree fetch {key} failed: {exc}")
    if mp:
        _tree_cache[key] = {"ts": now, "map": mp}
        try:
            with open(disk, "w", encoding="utf-8") as fh:
                json.dump({"ts": now, "map": mp}, fh)
        except Exception:
            pass
    return mp


def _file_commit_date(owner: str, repo: str, filename: str) -> str:
    if filename in _date_cache:
        return _date_cache[filename]
    client = ensure_http_client("depot_history: date")
    try:
        r = client.get(f"{_GH_API}/repos/{owner}/{repo}/commits",
                       params={"path": filename, "per_page": 1},
                       headers=_gh_headers(), timeout=12, follow_redirects=True)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and data:
                date = data[0]["commit"]["committer"]["date"][:10]
                _date_cache[filename] = date
                return date
    except Exception:
        pass
    return ""


# ── SteamDB PatchnotesRSS: {date: buildid} (keyless XML) ─────────────────────
def _build_ids(appid: str) -> Dict[str, str]:
    appid = str(appid)
    if appid in _build_ids_cache:
        return _build_ids_cache[appid]
    client = ensure_http_client("depot_history: patchnotes")
    out: Dict[str, str] = {}
    try:
        r = client.get(f"https://steamdb.info/api/PatchnotesRSS/?appid={appid}",
                       headers={"User-Agent": "SLSDeck/5"}, timeout=15, follow_redirects=True)
        if r.status_code == 200:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(r.text)
            for item in root.iter("item"):
                link = (item.findtext("link") or "").strip()
                pub = (item.findtext("pubDate") or "").strip()
                bm = re.search(r"/patchnotes/(\d+)", link)
                if not bm:
                    tm = item.findtext("title") or ""
                    bm = re.search(r"Build\s+(\d+)", tm)
                if not bm:
                    continue
                try:
                    from email.utils import parsedate_to_datetime
                    ds = parsedate_to_datetime(pub).strftime("%Y-%m-%d")
                except Exception:
                    continue
                out.setdefault(ds, bm.group(1))
    except Exception as exc:
        logger.warn(f"depot_history: patchnotes fetch failed for {appid}: {exc}")
    _build_ids_cache[appid] = out
    return out


# ── per-depot manifest history (Steam CM current + GitHub mirror) ────────────
def _depot_entries(depot_id: str, current_gid: str = "", current_date: str = "",
                   fetch_dates: bool = True) -> List[_Entry]:
    depot_id = str(depot_id)
    out: List[_Entry] = []
    seen = set()

    def _add(e: _Entry):
        if e.gid not in seen:
            seen.add(e.gid)
            out.append(e)

    if current_gid:
        _add(_Entry(current_gid, current_date or "N/A", "Steam CM"))
    for owner, repo in _MIRRORS:
        gids = _mirror_tree(owner, repo).get(depot_id, [])
        for gid in gids:
            date = ""
            if fetch_dates:
                date = _file_commit_date(owner, repo, f"{depot_id}_{gid}.manifest")
            _add(_Entry(gid, date or "N/A", f"GitHub mirror ({owner})"))
        if gids:
            break  # first mirror that has the depot wins
    return out


# ── the resolver: buildid -> {depot: gid} ────────────────────────────────────
def _nearest_build_date(build_ids: Dict[str, str], target_buildid: str) -> str:
    for date, bid in build_ids.items():
        if str(bid) == str(target_buildid):
            return date
    return ""


def build_for_date(build_ids: Dict[str, str], date: str, tol_days: int = 4) -> str:
    """Reverse of _nearest_build_date: given a manifest's date, return the buildid
    that shipped nearest that date (same date-bridge the resolver uses, just the
    other way). Returns "" if nothing is within tolerance or the date is unknown.
    Approximate by nature — a depot's gid can span several builds, and the archive
    date is the file's commit date, so callers should present it as a best guess."""
    if not date or date == "N/A" or not build_ids:
        return ""
    from datetime import datetime
    try:
        d0 = datetime.strptime(str(date)[:10], "%Y-%m-%d")
    except Exception:
        return ""
    best = ""
    best_diff = None
    for bd, bid in build_ids.items():
        try:
            d1 = datetime.strptime(str(bd)[:10], "%Y-%m-%d")
        except Exception:
            continue
        diff = abs((d0 - d1).days)
        if best_diff is None or diff < best_diff:
            best_diff = diff
            best = str(bid)
    if best_diff is None or best_diff > tol_days:
        return ""
    return best


def resolve(appid: int, target_buildid: str, target_date: str = "",
            primary_gids=None) -> Dict[str, Any]:
    """Resolve an older target buildid to a pinnable {depot: gid} map.
    Returns {success, status, gids?, message}."""
    appid = str(appid)
    target = str(target_buildid or "")
    if not target:
        return {"success": False, "status": "no-build", "gids": {}}

    # current build (steamcmd.net) — gives depot list + current gids + a date anchor
    cur = hvauto.get_current_build(int(appid))
    if not cur.get("success"):
        return {"success": False, "status": "unknown", "gids": {},
                "message": cur.get("error", "steamcmd unreachable")}
    cur_gids: Dict[int, str] = cur.get("gids", {})
    if str(cur.get("buildid")) == target:  # not actually older
        return {"success": True, "status": "current", "gids": cur_gids}

    # buildid -> date. Prefer a caller-supplied date (the frontend already has it
    # from the browser-fetched RSS, which the backend can't reach past Cloudflare).
    target_date = (target_date or "").strip()[:10]
    if not target_date:
        build_ids = _build_ids(appid)
        target_date = _nearest_build_date(build_ids, target)
    if not target_date:
        return {"success": False, "status": "no-date", "gids": {},
                "message": "No date for this build (pass it from the browser RSS, "
                           "or the backend is Cloudflare-blocked from SteamDB)"}
    try:
        tdt = datetime.strptime(target_date, "%Y-%m-%d")
    except Exception:
        return {"success": False, "status": "bad-date", "gids": {}}

    # PRIMARY: caller-supplied {depot: gid} scraped from SteamDB's signed-in
    # (authoritative, full) history — used per depot when present. The archive
    # date-join below is only the FALLBACK for depots the scrape didn't cover.
    if isinstance(primary_gids, str):
        try:
            import json as _json
            primary_gids = _json.loads(primary_gids or "{}")
        except Exception:
            primary_gids = {}
    prim: Dict[int, str] = {}
    for d, g in (primary_gids or {}).items():
        try:
            if str(d).isdigit() and str(g).isdigit():
                prim[int(d)] = str(g)
        except Exception:
            continue

    # per depot, pick the gid whose commit date is closest to the build date (±tol)
    resolved: Dict[int, str] = {}
    for depot in cur_gids.keys():
        if int(depot) in prim:
            resolved[int(depot)] = prim[int(depot)]
            continue
        entries = _depot_entries(str(depot), current_gid=cur_gids.get(depot, ""),
                                 current_date="", fetch_dates=True)
        best_gid = ""
        best_delta = _DATE_TOLERANCE_DAYS + 1
        for e in entries:
            if not re.match(r"\d{4}-\d{2}-\d{2}", e.date):
                continue
            try:
                d = datetime.strptime(e.date, "%Y-%m-%d")
            except Exception:
                continue
            delta = abs((tdt - d).days)
            if delta < best_delta:
                best_delta = delta
                best_gid = e.gid
        if not best_gid:
            # no dated match within tolerance: fall back to the newest dated gid
            # that is <= the build date (closest older snapshot for this depot)
            older = [e for e in entries
                     if re.match(r"\d{4}-\d{2}-\d{2}", e.date) and e.date <= target_date]
            if older:
                best_gid = max(older, key=lambda e: e.date).gid
        if best_gid:
            resolved[int(depot)] = best_gid

    if not resolved:
        return {"success": False, "status": "unresolved", "gids": {},
                "message": "no archived manifests matched this build's date"}
    matched = sum(1 for d, g in resolved.items() if g != cur_gids.get(d))
    return {"success": True, "status": "resolved", "gids": resolved,
            "buildDate": target_date, "changedDepots": matched,
            "message": f"resolved {len(resolved)} depot(s) for build {target} ({target_date})"}
