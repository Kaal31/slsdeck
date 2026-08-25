"""Custom Proton (GE-Proton11-1-LinUwUx) for the Denuvo/LinUwUx method.

The ~505 MB build is NOT bundled with the plugin. It is obtained on demand:

  1. if a matching tarball is already present locally (plugin bin/, ~/Downloads,
     ~/, or a user-supplied path) it is extracted;
  2. otherwise it is downloaded from a configurable GitHub location
     (a direct .tar.gz URL, a repo "owner/repo", or a releases API URL);
  3. if no URL is set or the download fails, the UI offers a manual fallback:
     point the plugin at a tarball you downloaded yourself.

Download + extract run in a background thread; the frontend polls
``get_install_status()`` for progress.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import threading
import time
from typing import Any, Dict, Optional

from .logger import logger
from .paths import get_plugin_dir, get_user_home, runtime_path
from .utils import chown_to_user
from . import settings

TOOL_NAME = "GE-Proton11-1-LinUwUx"
TARBALL_NAME = "GE-Proton11-1-LinUwUx.tar.gz"

# The full build is ~505 MB; accept a candidate only if it looks complete.
_MIN_TARBALL_BYTES = 400 * 1024 * 1024

_STATE_LOCK = threading.Lock()
_STATE: Dict[str, Any] = {"status": "idle", "percent": 0, "bytes": 0, "total": 0, "error": ""}
_WORKER: Optional[threading.Thread] = None


def _set(**kw) -> None:
    with _STATE_LOCK:
        _STATE.update(kw)


def get_install_status() -> Dict[str, Any]:
    with _STATE_LOCK:
        return {"success": True, "state": dict(_STATE)}


def compat_dir() -> str:
    return os.path.join(get_user_home(), ".local", "share", "Steam", "compatibilitytools.d")


# Accept the canonical tarball name and the GitHub-release asset name, so a
# manually-downloaded asset (named Proton-GE11-1-LinUwUx.tar.gz) is also found.
ALT_TARBALL_NAMES = [TARBALL_NAME, "Proton-GE11-1-LinUwUx.tar.gz"]


def _candidates() -> list:
    home = get_user_home()
    dirs = [
        os.path.join(get_plugin_dir(), "bin"),
        os.path.dirname(runtime_path(TARBALL_NAME)),
        os.path.join(home, "Downloads"),
        home,
    ]
    out = []
    for d in dirs:
        for name in ALT_TARBALL_NAMES:
            out.append(os.path.join(d, name))
    return out


def _tarball() -> Optional[str]:
    for p in _candidates():
        try:
            if os.path.isfile(p) and os.path.getsize(p) >= _MIN_TARBALL_BYTES:
                return p
        except Exception:
            pass
    return None


def is_installed() -> bool:
    d = os.path.join(compat_dir(), TOOL_NAME)
    return os.path.isdir(d) and os.path.isfile(os.path.join(d, "compatibilitytool.vdf"))


def status() -> Dict[str, Any]:
    return {
        "success": True,
        "installed": is_installed(),
        "toolName": TOOL_NAME,
        "tarballPresent": bool(_tarball()),
        "url": settings.get_proton_url(),
        "downloadStatus": get_install_status()["state"]["status"],
    }


# ── URL resolution ──────────────────────────────────────────────────────────
# Canonical rolling release. The exact asset URL is the normal default; the tag
# API is retained for repository/API-style resolution and the Hypervisor UI.
_PROTON_RELEASE_APIS = (
    "https://api.github.com/repos/Kaal31/slsdeck/releases/tags/main-latest",
)
_CANONICAL_PROTON_URL = (
    "https://github.com/Kaal31/slsdeck/releases/download/main-latest/"
    "Proton-GE11-1-LinUwUx.tar.gz"
)
# Dead/stale sources: if an existing install saved one, ignore it and migrate
# to the canonical SLSDeck rolling asset.
_DEAD_PROTON_HINTS = (
    "Kaal31/slsdeckhv",
    "xXJSONDeruloXx/proton-LinUwUx-patch",
    "brcly/proton-LinUwUx-patch",
)
# Match a LinUwUx Proton tarball asset regardless of its 11-x version / dashes
# (e.g. GE-Proton11-1-LinUwUx.tar.gz, GE-Proton-11-3-LinUwUx.tar.gz).
_ASSET_RE = re.compile(r"ge-?proton-?\d+.*linuwux.*\.tar\.gz$", re.I)


def _pick_asset_url(data: Any) -> Optional[str]:
    assets = data.get("assets", []) if isinstance(data, dict) else []
    # 1) a LinUwUx Proton tarball by name (any version); 2) the exact legacy
    # name; 3) any .tar.gz release asset (source tarballs aren't in `assets`).
    for match in (lambda n: bool(_ASSET_RE.search(n)),
                  lambda n: n == TARBALL_NAME,
                  lambda n: n.endswith(".tar.gz")):
        for a in assets:
            if isinstance(a, dict) and match(str(a.get("name", ""))):
                u = a.get("browser_download_url")
                if isinstance(u, str) and u:
                    return u
    return None


def _resolve_release_api(api_url: str) -> Optional[str]:
    try:
        from .httpc import ensure_http_client
        client = ensure_http_client("proton: resolve release")
        r = client.get(api_url, timeout=30, follow_redirects=True,
                       headers={"Accept": "application/vnd.github+json",
                                "User-Agent": "SLSDeck/proton"})
        if r.status_code != 200:
            logger.warn(f"proton: release API {api_url} -> HTTP {r.status_code}")
            return None
        return _pick_asset_url(r.json())
    except Exception as exc:
        logger.warn(f"proton: release resolve failed ({api_url}): {exc}")
        return None


def _resolve_download_url(cfg: str) -> Optional[str]:
    """Turn the configured value into a direct download URL.
    Accepts a direct .tar.gz / '/releases/download/' URL, an 'owner/repo'
    shorthand, or an api.github.com releases URL. When the configured value is
    empty or a known-dead source, resolve the canonical SLSDeck rolling release
    so a stale saved default keeps working."""
    cfg = (cfg or "").strip()
    dead = any(h in cfg for h in _DEAD_PROTON_HINTS)
    # An explicit, still-valid direct link wins.
    if cfg and not dead and (cfg.endswith(".tar.gz") or "/releases/download/" in cfg):
        return cfg
    # Build the ordered list of release-API URLs to try, then always append the
    # canonical release API as a fallback.
    apis: list = []
    if cfg and not dead:
        if cfg.startswith("http"):
            apis.append(cfg)
        elif "/" in cfg and " " not in cfg:
            apis.append(f"https://api.github.com/repos/{cfg}/releases/latest")
    apis.extend(_PROTON_RELEASE_APIS)
    seen = set()
    for api in apis:
        if api in seen:
            continue
        seen.add(api)
        u = _resolve_release_api(api)
        if u:
            return u
    # The tag API may be temporarily rate-limited while its stable direct asset
    # remains downloadable.
    return _CANONICAL_PROTON_URL


# ── download + extract (background) ─────────────────────────────────────────
def _download_to(path: str, url: str) -> bool:
    try:
        from .httpc import ensure_http_client
        client = ensure_http_client("proton: download")
        with client.stream("GET", url, timeout=None, follow_redirects=True) as r:
            if r.status_code != 200:
                _set(error=f"download HTTP {r.status_code}")
                return False
            total = int(r.headers.get("content-length") or 0)
            _set(total=total, bytes=0, percent=0)
            done = 0
            last = 0.0
            with open(path, "wb") as fh:
                for chunk in r.iter_bytes(1024 * 256):
                    if not chunk:
                        continue
                    fh.write(chunk)
                    done += len(chunk)
                    now = time.time()
                    if now - last > 0.5:
                        last = now
                        pct = int(done * 100 / total) if total else 0
                        _set(bytes=done, percent=pct)
        _set(bytes=done, percent=100 if not total else min(100, int(done * 100 / total)))
        return os.path.isfile(path) and os.path.getsize(path) >= _MIN_TARBALL_BYTES
    except Exception as exc:
        _set(error=f"download error: {exc}")
        return False


def _extract(tb: str) -> bool:
    dest = compat_dir()
    try:
        os.makedirs(dest, exist_ok=True)
    except Exception as exc:
        _set(error=f"cannot create compat dir: {exc}")
        return False
    try:
        _before = set(os.listdir(dest))
    except Exception:
        _before = set()
    # Sniff magic bytes: guard against an HTML/error page, and auto-detect the
    # archive format (gzip / xz / bzip2 / plain tar / zip) instead of forcing
    # gzip -- the release asset may be compressed differently than its name.
    try:
        with open(tb, "rb") as _fh:
            _head = _fh.read(8)
    except Exception:
        _head = b""
    if _head[:1] == b"<" or _head[:5].lower() == b"<!doc":
        _set(error="downloaded an HTML page, not an archive -- check the release is public and the asset name/tag are correct")
        return False
    tar = shutil.which("tar") or "tar"
    unzip = shutil.which("unzip")
    try:
        if _head[:2] == b"PK" and unzip:
            p = subprocess.run([unzip, "-oq", tb, "-d", dest], capture_output=True, timeout=1800)
        else:
            # GNU tar auto-detects gzip/xz/bzip2/plain tar with -xf
            p = subprocess.run([tar, "-xf", tb, "-C", dest], capture_output=True, timeout=1800)
    except Exception as exc:
        _set(error=f"extract error: {exc}")
        return False
    if p.returncode != 0:
        _set(error="extract failed: " + p.stderr.decode("utf-8", "replace")[:200])
        return False
    # The asset may unpack to a differently-named folder (e.g. it was renamed
    # to Proton-GE11-1-LinUwUx). If TOOL_NAME isn't present but exactly one new
    # directory appeared, rename it so Steam/the plugin can find the tool.
    target = os.path.join(dest, TOOL_NAME)
    if not os.path.isdir(target):
        try:
            _new = [d for d in os.listdir(dest)
                    if d not in _before and os.path.isdir(os.path.join(dest, d))]
        except Exception:
            _new = []
        if len(_new) == 1:
            try:
                os.rename(os.path.join(dest, _new[0]), target)
            except Exception as exc:
                _set(error=f"rename extracted dir failed: {exc}")
                return False
    chown_to_user(os.path.join(dest, TOOL_NAME))
    return is_installed()


def _worker() -> None:
    _set(status="checking", percent=0, error="")
    if is_installed():
        _set(status="done", percent=100)
        return
    tb = _tarball()
    if not tb:
        url = _resolve_download_url(settings.get_proton_url())
        if not url:
            _set(status="needsSource",
                 error="No Proton source. Set a GitHub URL or locate a downloaded tarball.")
            settings.inc_dep_fail("proton")
            return
        _set(status="downloading", percent=0)
        dst = runtime_path(TARBALL_NAME + ".part")
        if not _download_to(dst, url):
            with _STATE_LOCK:
                err = _STATE.get("error") or "download failed"
            _set(status="failed", error=err)
            settings.inc_dep_fail("proton")
            try:
                os.remove(dst)
            except Exception:
                pass
            return
        final = runtime_path(TARBALL_NAME)
        try:
            os.replace(dst, final)
        except Exception as exc:
            _set(status="failed", error=f"finalise error: {exc}")
            return
        tb = final
    _set(status="extracting")
    if _extract(tb):
        _set(status="done", percent=100)
        settings.reset_dep_fail("proton")
        logger.log(f"SLSDeckHV HV: installed {TOOL_NAME}")
    else:
        with _STATE_LOCK:
            err = _STATE.get("error") or "extract failed"
        _set(status="failed", error=err)
        settings.inc_dep_fail("proton")


def start_install(auto: bool = False) -> Dict[str, Any]:
    """Kick off (or report) the background download+extract.
    Auto callers (finalize / auto-fix) give up after DEP_FAIL_CAP failures so a
    broken Proton source doesn't re-download on every Denuvo game. A manual
    install (auto=False) clears the counter and always attempts."""
    global _WORKER
    if is_installed():
        _set(status="done", percent=100)
        settings.reset_dep_fail("proton")
        return {"success": True, "installed": True, "message": "already installed"}
    if auto and settings.dep_fail_capped("proton"):
        _set(status="capped",
             error=f"auto-install disabled after {settings.get_dep_fail('proton')} failed attempts — use Install Proton")
        return {"success": False, "capped": True}
    if not auto:
        settings.reset_dep_fail("proton")
    with _STATE_LOCK:
        running = _WORKER is not None and _WORKER.is_alive()
    if running:
        return {"success": True, "started": True, "message": "in progress"}
    _WORKER = threading.Thread(target=_worker, daemon=True)
    _WORKER.start()
    return {"success": True, "started": True}


def install_proton() -> Dict[str, Any]:
    """Back-compat AUTO entry used by install_finalize / auto-fix."""
    return start_install(auto=True)


def set_manual_tarball(path: str) -> Dict[str, Any]:
    """Use a tarball the user downloaded themselves, then install from it."""
    path = os.path.expanduser((path or "").strip())
    if not path or not os.path.isfile(path):
        return {"success": False, "error": "file not found"}
    try:
        if os.path.getsize(path) < _MIN_TARBALL_BYTES:
            return {"success": False, "error": "file too small to be the Proton build"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    # Copy into the runtime dir under the expected name so _tarball() finds it.
    dst = runtime_path(TARBALL_NAME)
    try:
        if os.path.realpath(path) != os.path.realpath(dst):
            shutil.copy(path, dst)
    except Exception as exc:
        return {"success": False, "error": f"copy error: {exc}"}
    return start_install()
