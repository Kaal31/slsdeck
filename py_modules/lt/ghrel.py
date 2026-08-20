"""Shared GitHub 'latest release' resolver (used by opensave + updates).

Small, cached wrapper around ``/repos/<owner>/<repo>/releases/latest`` so several
modules can ask "what's the newest tag / matching asset?" without each
re-implementing the HTTP + JSON + asset-picking dance.
"""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional

from .logger import logger
from .httpc import ensure_http_client

_API = "https://api.github.com/repos/{repo}/releases/latest"
_UA = "SLSDeck/ghrel"
_TTL = 900.0
_cache: Dict[str, Any] = {}   # repo -> {ts, data}


def _headers() -> Dict[str, str]:
    import os
    h = {"Accept": "application/vnd.github+json", "User-Agent": _UA}
    tok = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h


def latest(repo: str, force: bool = False) -> Dict[str, Any]:
    """Return {success, tag, name, publishedAt, assets:[{name,url,size}]}.

    ``repo`` is ``owner/name``. Cached for _TTL seconds per repo."""
    now = time.time()
    c = _cache.get(repo)
    if not force and c and (now - c["ts"]) < _TTL:
        return c["data"]
    client = ensure_http_client(f"ghrel: {repo}")
    try:
        r = client.get(_API.format(repo=repo), headers=_headers(),
                       timeout=20, follow_redirects=True)
        if r.status_code != 200:
            return {"success": False, "error": f"HTTP {r.status_code}", "tag": "", "assets": []}
        rel = r.json()
    except Exception as exc:
        logger.warn(f"ghrel: {repo} lookup failed: {exc}")
        return {"success": False, "error": str(exc), "tag": "", "assets": []}
    assets = [{"name": str(a.get("name") or ""),
               "url": a.get("browser_download_url") or "",
               "size": int(a.get("size") or 0)}
              for a in (rel.get("assets") or []) if isinstance(a, dict)]
    data = {"success": True, "tag": str(rel.get("tag_name") or ""),
            "name": str(rel.get("name") or ""),
            "publishedAt": str(rel.get("published_at") or ""),
            "assets": assets}
    _cache[repo] = {"ts": now, "data": data}
    return data


def latest_tag(repo: str, force: bool = False) -> str:
    return latest(repo, force).get("tag", "") or ""


def pick_asset(assets: List[Dict[str, Any]], patterns: List[str]) -> Optional[str]:
    """First asset URL whose name matches any regex in *patterns* (case-insensitive)."""
    for pat in patterns:
        rx = re.compile(pat, re.I)
        for a in assets:
            if rx.search(a.get("name", "")):
                u = a.get("url")
                if u:
                    return u
    return None
