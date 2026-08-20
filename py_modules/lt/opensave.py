"""OpenSave (Liquid-co/OpenSave) — cloud-save sync engine for added/SLS games.

Replaces CloudRedirect's inject-a-.so approach with a headless sync engine. We
drive it the way Liquid-co's own Decky plugin does: by talking to the OpenSave
**daemon's local HTTP API** (not the CLI text output), reading the address the
daemon actually bound from ``~/.opensave/daemon.addr`` (it can fall back to an
ephemeral port, so that file — not 127.0.0.1:8383 — is the source of truth).

  * install/update the headless ``opensave-cli`` binary  → ~/.local/bin
  * start the daemon with ``opensave-cli daemon``
  * status / games / sync / snapshot / conflicts  → daemon HTTP API
  * detect + track new saves ("Track & scan")      → CLI ``scan`` + ``add``
    (the HTTP API has no add endpoint), then verified against /api/games

Works for non-owned SLS titles because their saves live in the Proton
``compatdata/<appid>/pfx`` prefix on disk regardless of ownership; OpenSave
matches them and tags each tracked game with its Steam ``appId``.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home
from . import slssteam, settings, ghrel

OS_REPO = "Liquid-co/OpenSave"
_UA = "SLSDeck/opensave"
_CLI_ASSET_PATTERNS = [r"linux.*(amd64|x86[_-]?64).*\.tar\.gz$", r"opensave.*linux.*\.tar\.gz$"]
_MIN_CLI_BYTES = 1_000_000
_FALLBACK_URL = "http://127.0.0.1:8383"


# ── locations ────────────────────────────────────────────────────────────────
def _home() -> str:
    return get_user_home()


def _bin_dir() -> str:
    return os.path.join(_home(), ".local", "bin")


def _bin() -> str:
    # The HEADLESS binary is `opensave-cli` (no WebKitGTK). The plain `opensave`
    # name in the tarball is the Wails desktop GUI, which won't run on SteamOS.
    cli = os.path.join(_bin_dir(), "opensave-cli")
    if os.path.isfile(cli):
        return cli
    return os.path.join(_bin_dir(), "opensave")


def have_cli() -> bool:
    cli = os.path.join(_bin_dir(), "opensave-cli")
    return os.path.isfile(cli) and os.access(cli, os.X_OK)


# ── env / user wrapping (for CLI + daemon start; run as the desktop user) ─────
def _os_env() -> Dict[str, str]:
    env = slssteam._rich_env()
    try:
        import pwd
        uid = pwd.getpwnam(slssteam._decky_user()).pw_uid
        env.setdefault("XDG_RUNTIME_DIR", f"/run/user/{uid}")
        env.setdefault("DBUS_SESSION_BUS_ADDRESS", f"unix:path=/run/user/{uid}/bus")
    except Exception:
        pass
    return env


def _os_wrap(cmd: List[str]) -> List[str]:
    try:
        if not slssteam._is_root():
            return cmd
    except Exception:
        return cmd
    env = _os_env()
    prefix = ["sudo", "-u", slssteam._decky_user(), "env",
              f"HOME={env.get('HOME','')}", f"PATH={env.get('PATH','')}",
              f"XDG_DATA_HOME={env.get('XDG_DATA_HOME','')}",
              f"XDG_CONFIG_HOME={env.get('XDG_CONFIG_HOME','')}",
              f"XDG_RUNTIME_DIR={env.get('XDG_RUNTIME_DIR','')}",
              f"DBUS_SESSION_BUS_ADDRESS={env.get('DBUS_SESSION_BUS_ADDRESS','')}"]
    return prefix + cmd


# ── CLI runner (scan / add / version / config / relay) ───────────────────────
def _run(args: List[str], timeout: int = 60, want_json: bool = False) -> Dict[str, Any]:
    if not have_cli():
        return {"ok": False, "code": 127, "err": "opensave-cli not installed", "data": None, "raw": ""}
    cmd = [_bin()] + list(args)
    if want_json and "--json" not in args:
        cmd.append("--json")
    try:
        r = subprocess.run(_os_wrap(cmd), env=_os_env(), capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return {"ok": False, "code": -1, "err": "timed out", "data": None, "raw": ""}
    except Exception as exc:
        return {"ok": False, "code": -1, "err": str(exc), "data": None, "raw": ""}
    out = r.stdout.decode("utf-8", "replace")
    err = r.stderr.decode("utf-8", "replace")
    data = None
    if want_json and out.strip():
        try:
            data = json.loads(out)
        except Exception:
            data = None
    raw = out.strip() or err.strip()
    return {"ok": r.returncode == 0, "code": r.returncode,
            "err": (err or "").strip()[-400:], "data": data, "raw": raw[-4000:]}


def _first(d: Dict[str, Any], *keys, default=None):
    for k in keys:
        if isinstance(d, dict) and k in d and d[k] not in (None, ""):
            return d[k]
    return default


# ── daemon HTTP API ──────────────────────────────────────────────────────────
def _addr_file() -> str:
    return os.path.join(_home(), ".opensave", "daemon.addr")


def _daemon_url() -> str:
    try:
        with open(_addr_file(), "r", encoding="utf-8") as fh:
            addr = fh.read().strip()
        if addr:
            return f"http://{addr}" if not addr.startswith("http") else addr
    except OSError:
        pass
    return _FALLBACK_URL


def _api(path: str, method: str = "GET", body: Any = None, timeout: float = 8.0) -> Dict[str, Any]:
    """Call the daemon's local HTTP API. Localhost, so no proxy/sudo needed."""
    url = _daemon_url() + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, data=data,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return {"ok": True, "data": json.loads(raw) if raw else None}
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")[:300]
        except Exception:
            pass
        return {"ok": False, "error": f"HTTP {exc.code} {detail}".strip()}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


def daemon_running() -> bool:
    return _api("/api/status", timeout=3).get("ok", False)


def ensure_daemon() -> Dict[str, Any]:
    """Start a headless daemon (``opensave-cli daemon``) if it isn't answering.
    Runs as the desktop user so it uses ~deck/.opensave and survives reloads."""
    if not have_cli():
        return {"success": False, "error": "CLI not installed"}
    if daemon_running():
        return {"success": True, "running": True, "url": _daemon_url()}
    try:
        subprocess.Popen(_os_wrap([_bin(), "daemon"]), env=_os_env(),
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         stdin=subprocess.DEVNULL, start_new_session=True)
    except Exception as exc:
        return {"success": False, "error": f"could not start daemon: {exc}"}
    # enable app-id matching so compatdata saves link to their Steam appid
    try:
        subprocess.run(_os_wrap([_bin(), "config", "set", "match-by-app-id", "true"]),
                       env=_os_env(), capture_output=True, timeout=15)
    except Exception:
        pass
    for _ in range(40):  # up to ~20s
        time.sleep(0.5)
        if daemon_running():
            return {"success": True, "running": True, "url": _daemon_url()}
    return {"success": False, "running": False,
            "error": "the daemon didn't answer within 20s"}


# ── games (HTTP /api/games → dict keyed by id) ───────────────────────────────
def _normalize_game(g: Dict[str, Any]) -> Dict[str, Any]:
    gid = _first(g, "id", "gameId", "game_id", default="")
    name = _first(g, "name", "title", default="")
    appid = _first(g, "appId", "appid", "app_id", default="")
    path = _first(g, "path", "savePath", "save_path", default="")
    state = str(_first(g, "state", "status", "syncState", default="") or "").lower()
    snaps = _first(g, "snapshots", "snapshotCount", "snapshot_count", default=None)
    if not appid and path:
        m = re.search(r"/compatdata/(\d+)/", str(path))
        if m:
            appid = m.group(1)
    return {"id": str(gid), "name": str(name), "appid": str(appid or ""),
            "path": str(path or ""), "state": state,
            "snapshots": snaps if isinstance(snaps, int) else None,
            "raw": g}


def list_games() -> List[Dict[str, Any]]:
    r = _api("/api/games", timeout=6)
    if not r.get("ok"):
        return []
    data = r.get("data")
    if isinstance(data, dict):
        # dict keyed by id (official shape); values are the games
        vals = list(data.values())
    elif isinstance(data, list):
        vals = data
    else:
        vals = []
    return [_normalize_game(g) for g in vals if isinstance(g, dict)]


def _game_for_appid(appid: int) -> Optional[Dict[str, Any]]:
    a = str(appid)
    for g in list_games():
        if g["appid"] == a:
            return g
        if g["path"] and f"/compatdata/{a}/" in g["path"]:
            return g
    return None


# ── overall status (cloud tab header) ────────────────────────────────────────
def overall_status() -> Dict[str, Any]:
    installed = have_cli()
    latest_tag = ghrel.latest_tag(OS_REPO)
    cur = installed_version() if installed else ""
    running = daemon_running() if installed else False
    games = list_games() if running else []
    conflicts = [g for g in games if g["state"] in ("conflict", "diverged")]
    provider = ""
    connected = False
    email = ""
    if running:
        p = provider_status()
        provider, connected, email = p.get("provider", ""), p.get("connected", False), p.get("email", "")
    return {
        "providerEmail": email,
        "success": True,
        "installed": installed,
        "version": cur,
        "latestTag": latest_tag,
        "updateAvailable": bool(installed and latest_tag and settings.get_dep_version("opensave") and
                                settings.get_dep_version("opensave") != latest_tag),
        "daemonRunning": running,
        "provider": provider,
        "providerConnected": connected,
        "trackedGames": len(games),
        "conflicts": len(conflicts),
    }


# ── sync ─────────────────────────────────────────────────────────────────────
def sync(appid: Optional[int] = None) -> Dict[str, Any]:
    if not have_cli():
        return {"success": False, "error": "CLI not installed"}
    if not daemon_running():
        ensure_daemon()
    if appid is None:
        r = _api("/api/games/sync-all", method="POST", body={}, timeout=60)
        return {"success": r.get("ok", False), "error": r.get("error", "")}
    g = _game_for_appid(appid)
    if not g:
        et = ensure_tracked(appid)
        if not et.get("tracked"):
            return {"success": False, "error": et.get("error", "not tracked")}
        g = _game_for_appid(appid)
    gid = g["id"] if g else ""
    if not gid:
        return {"success": False, "error": "no tracked game for appid"}
    r = _api(f"/api/games/{gid}/sync", method="POST", body={}, timeout=60)
    return {"success": r.get("ok", False), "error": r.get("error", ""), "id": gid}


_STATE_MAP = {
    "synced": "synced", "insync": "synced", "up-to-date": "synced", "uptodate": "synced",
    "syncing": "syncing", "uploading": "syncing", "downloading": "syncing", "pending": "syncing",
    "conflict": "conflict", "diverged": "conflict",
    "idle": "idle", "": "idle",
}


def status_for_game(appid: int) -> Dict[str, Any]:
    if not have_cli():
        return {"success": True, "installed": False, "tracked": False, "state": "unavailable"}
    if not daemon_running():
        return {"success": True, "installed": True, "tracked": False, "state": "idle"}
    g = _game_for_appid(appid)
    if not g:
        return {"success": True, "installed": True, "tracked": False, "state": "untracked"}
    state = _STATE_MAP.get(g["state"], g["state"] or "idle")
    return {"success": True, "installed": True, "tracked": True, "state": state,
            "snapshots": g["snapshots"], "name": g["name"], "id": g["id"]}


# ── snapshots / conflicts (HTTP; best-effort) ────────────────────────────────
def snapshots(appid: int) -> Dict[str, Any]:
    g = _game_for_appid(appid)
    if not g:
        return {"success": True, "found": False, "snapshots": []}
    r = _api(f"/api/games/{g['id']}/snapshots", timeout=15)
    snaps = r.get("data") if r.get("ok") else None
    items = snaps if isinstance(snaps, list) else (list(snaps.values()) if isinstance(snaps, dict) else [])
    out = [{"id": str(_first(s, "id", "snapId", default="")),
            "date": str(_first(s, "date", "created", "timestamp", default="")),
            "comment": str(_first(s, "comment", "message", default=""))}
           for s in items if isinstance(s, dict)]
    return {"success": True, "found": True, "snapshots": out, "id": g["id"]}


def snapshot_create(appid: int, comment: str = "") -> Dict[str, Any]:
    g = _game_for_appid(appid)
    if not g:
        return {"success": False, "error": "not tracked"}
    r = _api(f"/api/games/{g['id']}/snapshot", method="POST",
             body={"comment": comment or "SLSDeck snapshot"}, timeout=60)
    return {"success": r.get("ok", False), "error": r.get("error", "")}


def rollback(appid: int, snap_id: str) -> Dict[str, Any]:
    g = _game_for_appid(appid)
    if not g:
        return {"success": False, "error": "not tracked"}
    r = _api(f"/api/games/{g['id']}/rollback", method="POST",
             body={"snapshotId": str(snap_id)}, timeout=120)
    return {"success": r.get("ok", False), "error": r.get("error", "")}


def conflicts() -> Dict[str, Any]:
    ids = [g["id"] for g in list_games() if g["state"] in ("conflict", "diverged") and g["id"]]
    return {"success": True, "conflicts": ids}


def resolve(appid: int, choice: str) -> Dict[str, Any]:
    g = _game_for_appid(appid)
    if not g:
        return {"success": False, "error": "not tracked"}
    # our UI uses keep-local/keep-remote/keep-both; the API wants merge-branch
    resolution = {"keep-both": "merge-branch"}.get(choice, choice)
    if resolution not in ("keep-local", "keep-remote", "merge-branch"):
        resolution = "merge-branch"
    peer = ""
    raw = g.get("raw") or {}
    conf = raw.get("conflict") if isinstance(raw.get("conflict"), dict) else raw
    peer = str(_first(conf, "peerId", "peer_id", "peer", default="") or "")
    r = _api(f"/api/games/{g['id']}/resolve-conflict", method="POST",
             body={"peerId": peer, "resolution": resolution}, timeout=30)
    return {"success": r.get("ok", False), "error": r.get("error", "")}


# ── track & scan (daemon HTTP API) ───────────────────────────────────────────
def scan() -> Dict[str, Any]:
    """Detect saves (GET /api/presets/scan) and track them (POST /api/games) —
    both over the daemon HTTP API. No CLI text-parsing or `add`, so this is
    reliable and returns the exact reason if a track is rejected."""
    if not have_cli():
        return {"success": False, "error": "CLI not installed"}
    dstart = ensure_daemon()
    if not dstart.get("success"):
        return {"success": False, "error": "daemon not running: " + (dstart.get("error") or "")}
    r = _api("/api/presets/scan", timeout=90)
    if not r.get("ok"):
        return {"success": False, "error": "scan failed: " + str(r.get("error", ""))}
    found = r.get("data")
    found = found if isinstance(found, list) else []
    if not found:
        return {"success": True, "found": 0, "added": 0, "tracked": len(list_games()),
                "note": "No saves detected. Launch a game once so it writes a save, then scan again."}
    before = {os.path.realpath(g["path"]) for g in list_games() if g.get("path")}
    seen = set()
    added = 0
    errs: List[str] = []
    for it in found:
        if not isinstance(it, dict):
            continue
        path = str(_first(it, "path", "savePath", "save_path", default="") or "")
        if not path:
            continue
        rp = os.path.realpath(path)
        if rp in seen or rp in before:
            continue
        seen.add(rp)
        name = str(_first(it, "name", "title", default="") or os.path.basename(path))
        appid = str(_first(it, "appId", "appid", "app_id", default="") or "")
        body = {"name": name, "savePath": path}
        if appid:
            body["appId"] = appid
        rr = _api("/api/games", method="POST", body=body, timeout=20)
        if rr.get("ok"):
            added += 1
        elif "409" in str(rr.get("error", "")) or "already" in str(rr.get("error", "")).lower():
            pass  # already tracked — not an error
        else:
            errs.append(f"{name}: {rr.get('error')}")
    # tell a running daemon to watch the newly-tracked games right away
    _api("/api/watch/reload", method="POST", body={}, timeout=15)
    tracked = len(list_games())
    note = f"Detected {len(found)}, added {added}, now tracking {tracked} game(s)."
    if errs and added == 0:
        note += "\n[track error] " + errs[0][:400]
    return {"success": True, "found": len(found), "added": added,
            "tracked": tracked, "errors": len(errs), "note": note}


def ensure_tracked(appid: int, install_path: str = "") -> Dict[str, Any]:
    if not have_cli():
        return {"success": False, "error": "CLI not installed"}
    if not daemon_running():
        ensure_daemon()
    g = _game_for_appid(appid)
    if not g:
        scan()
        g = _game_for_appid(appid)
    if not g:
        return {"success": False, "tracked": False,
                "error": "no save auto-detected for this game yet"}
    return {"success": True, "tracked": True, "id": g["id"], "name": g["name"]}


# ── providers (CLI config; no-login only) ────────────────────────────────────
def provider_status() -> Dict[str, Any]:
    # cloud config lives in GET /api/settings -> cloudSync (not /api/status)
    st = _api("/api/settings", timeout=5)
    d = st.get("data") if st.get("ok") else None
    prov, email, enabled = "", "", False
    if isinstance(d, dict):
        cs = d.get("cloudSync") if isinstance(d.get("cloudSync"), dict) else {}
        prov = str(cs.get("provider") or "")
        enabled = bool(cs.get("enabled"))
        toks = cs.get("tokens") if isinstance(cs.get("tokens"), dict) else {}
        email = str(toks.get("userEmail") or cs.get("username") or "")
    connected = bool(prov) and (enabled or bool(email))
    return {"success": True, "provider": prov, "connected": connected, "email": email}


def _safe_name(name: str) -> str:
    keep = "".join(c if (c.isalnum() or c in " -_.") else "_" for c in (name or "").strip())
    return keep.strip() or "game"


def export_all(folder: str) -> Dict[str, Any]:
    """Copy the current save of every tracked game into *folder* (one subfolder
    per game) via ``opensave export``. This is the real 'back up to a folder'
    the shipped CLI supports — there is no cloud-folder provider in the CLI, so
    this is how you get an off-device copy onto an SD card / NAS path."""
    if not have_cli():
        return {"success": False, "error": "CLI not installed"}
    folder = os.path.expanduser((folder or "").strip())
    if not folder:
        return {"success": False, "error": "no folder chosen"}
    try:
        os.makedirs(folder, exist_ok=True)
    except Exception as exc:
        return {"success": False, "error": f"cannot create folder: {exc}"}
    if not daemon_running():
        ensure_daemon()
    games = list_games()
    if not games:
        return {"success": True, "exported": 0, "total": 0,
                "note": "No tracked games to back up yet — run Track & scan first."}
    ok = 0
    errs: List[str] = []
    for g in games:
        gid = g["id"]
        if not gid:
            continue
        sub = os.path.join(folder, _safe_name(g["name"] or gid))
        try:
            os.makedirs(sub, exist_ok=True)
        except Exception:
            pass
        r = _run(["export", gid, sub], timeout=120)
        if r.get("ok"):
            ok += 1
        else:
            errs.append(f"{g['name'] or gid}: " + (r.get("raw") or r.get("err") or f"rc={r.get('code')}"))
    try:
        from .utils import chown_to_user
        chown_to_user(folder, recursive=True)
    except Exception:
        pass
    note = f"Backed up {ok}/{len(games)} game(s) to {folder}."
    if errs and ok == 0:
        note += "\n[export error] " + errs[0][:400]
    return {"success": True, "exported": ok, "total": len(games), "folder": folder, "note": note}


# ── cloud providers (native, via the daemon API) ─────────────────────────────
# OAuth: POST /api/auth/start returns an authUrl + autoCallback (the daemon
# listens on localhost/callback and finishes the flow itself). WebDAV/local
# providers are written straight to cloudSync (no browser).
# OpenSave keys Google Drive as "google_drive" (underscore) — sending
# "googledrive" makes the daemon return "no OAuth Client ID available".
# google_drive + dropbox ship built-in client IDs; onedrive needs a custom one.
_OAUTH_PROVIDERS = {
    "google_drive": "google_drive", "googledrive": "google_drive",
    "gdrive": "google_drive", "drive": "google_drive",
    "dropbox": "dropbox", "onedrive": "onedrive",
}


def cloud_auth_start(provider: str) -> Dict[str, Any]:
    prov = _OAUTH_PROVIDERS.get(str(provider or "").lower())
    if not prov:
        return {"success": False, "error": f"unknown provider '{provider}'"}
    if not daemon_running():
        ensure_daemon()
    r = _api("/api/auth/start", method="POST", body={"provider": prov}, timeout=20)
    if not r.get("ok"):
        return {"success": False, "error": str(r.get("error", ""))}
    d = r.get("data") or {}
    return {"success": True, "provider": prov,
            "authUrl": str(d.get("authUrl") or ""),
            "autoCallback": bool(d.get("autoCallback"))}


def cloud_auth_callback(code: str) -> Dict[str, Any]:
    code = (code or "").strip()
    if not code:
        return {"success": False, "error": "no code"}
    r = _api("/api/auth/callback", method="POST", body={"code": code}, timeout=30)
    if not r.get("ok"):
        return {"success": False, "error": str(r.get("error", ""))}
    d = r.get("data") or {}
    return {"success": True, "email": str(d.get("userEmail") or "")}


def cloud_disconnect() -> Dict[str, Any]:
    r = _api("/api/auth/disconnect", method="POST", body={}, timeout=15)
    return {"success": r.get("ok", False), "error": str(r.get("error", ""))}


def cloud_set_webdav(url: str, username: str = "", password: str = "") -> Dict[str, Any]:
    url = (url or "").strip()
    if not url:
        return {"success": False, "error": "WebDAV URL required"}
    if not daemon_running():
        ensure_daemon()
    body = {"cloudSync": {"provider": "webdav", "url": url,
                          "username": username or "", "password": password or "",
                          "enabled": True}}
    r = _api("/api/settings", method="POST", body=body, timeout=20)
    return {"success": r.get("ok", False), "error": str(r.get("error", ""))}


def cloud_set_enabled(enabled: bool) -> Dict[str, Any]:
    r = _api("/api/settings", method="POST",
             body={"cloudSync": {"enabled": bool(enabled)}}, timeout=15)
    return {"success": r.get("ok", False), "error": str(r.get("error", ""))}


def cloud_push_all() -> Dict[str, Any]:
    """Upload every tracked game's local snapshots to the connected provider."""
    if not daemon_running():
        ensure_daemon()
    p = provider_status()
    if not p.get("provider"):
        return {"success": False, "error": "no cloud provider connected"}
    # OAuth sets the provider + tokens but not the enabled flag; uploads refuse
    # with "not enabled" until it's on, so ensure it before pushing.
    _api("/api/settings", method="POST", body={"cloudSync": {"enabled": True}}, timeout=15)
    games = list_games()
    if not games:
        return {"success": True, "uploaded": 0, "note": "No tracked games to push."}
    uploaded = 0
    errs: List[str] = []
    for g in games:
        if not g["id"]:
            continue
        r = _api(f"/api/cloud/sync-local/{g['id']}", method="POST", body={}, timeout=600)
        if r.get("ok"):
            uploaded += int((r.get("data") or {}).get("uploaded") or 0)
        else:
            errs.append(f"{g['name']}: {r.get('error')}")
    note = f"Pushed {uploaded} snapshot(s) to {p.get('provider')}."
    if errs and uploaded == 0:
        note += "\n[cloud error] " + errs[0][:300]
    return {"success": True, "uploaded": uploaded, "note": note}


def relay_join(code: str) -> Dict[str, Any]:
    code = (code or "").strip()
    if not code:
        return {"success": False, "error": "no room code"}
    r = _run(["relay", "join", code], timeout=30)
    return {"success": r.get("ok", False), "error": r.get("err", "")}


def relay_status() -> Dict[str, Any]:
    r = _run(["relay", "status"], timeout=15)
    return {"success": r.get("ok", False), "raw": r.get("raw", "")}


def relay_leave() -> Dict[str, Any]:
    r = _run(["relay", "leave"], timeout=15)
    return {"success": r.get("ok", False), "error": r.get("err", "")}


# ── install / update the CLI binary ──────────────────────────────────────────
def installed_version() -> str:
    if not have_cli():
        return ""
    r = _run(["version"], timeout=15)
    m = re.search(r"v?\d+\.\d+\.\d+", r.get("raw", "") or "")
    return m.group(0) if m else (r.get("raw", "") or "").strip()[:40]


def ensure_cli(force: bool = False) -> Dict[str, Any]:
    rel = ghrel.latest(OS_REPO, force=force)
    latest_tag = rel.get("tag", "")
    if have_cli() and not force:
        cur = settings.get_dep_version("opensave")
        if cur and latest_tag and cur == latest_tag:
            return {"success": True, "installed": True, "updated": False,
                    "version": installed_version(), "tag": latest_tag}
    url = ghrel.pick_asset(rel.get("assets", []), _CLI_ASSET_PATTERNS) if rel.get("success") else None
    if not url:
        return {"success": False, "installed": have_cli(),
                "error": "no linux CLI tarball in the latest OpenSave release"}
    tmp = tempfile.mkdtemp(prefix="opensave_dl_")
    try:
        from .httpc import ensure_http_client
        client = ensure_http_client("opensave: cli download")
        tb = os.path.join(tmp, "opensave.tar.gz")
        with client.stream("GET", url, headers={"User-Agent": _UA}, follow_redirects=True, timeout=None) as resp:
            if resp.status_code != 200:
                return {"success": False, "error": f"download HTTP {resp.status_code}"}
            with open(tb, "wb") as fh:
                for chunk in resp.iter_bytes(524288):
                    fh.write(chunk)
        if os.path.getsize(tb) < _MIN_CLI_BYTES:
            return {"success": False, "error": "downloaded CLI is too small (not a real build)"}
        ex = os.path.join(tmp, "x")
        os.makedirs(ex, exist_ok=True)
        try:
            subprocess.run(["tar", "-xf", tb, "-C", ex], check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
        except Exception as exc:
            return {"success": False, "error": f"extract failed: {exc}"}
        cli_src = relay_src = ""
        for root, _dirs, files in os.walk(ex):
            if not cli_src and "opensave-cli" in files:
                cli_src = os.path.join(root, "opensave-cli")
            if not relay_src and "opensave-relay" in files:
                relay_src = os.path.join(root, "opensave-relay")
        if not cli_src:
            return {"success": False, "error": "opensave-cli not found in tarball (unexpected layout)"}
        os.makedirs(_bin_dir(), exist_ok=True)
        cli_dst = os.path.join(_bin_dir(), "opensave-cli")
        shutil.copy2(cli_src, cli_dst)
        os.chmod(cli_dst, 0o755)
        if relay_src:
            try:
                relay_dst = os.path.join(_bin_dir(), "opensave-relay")
                shutil.copy2(relay_src, relay_dst)
                os.chmod(relay_dst, 0o755)
            except Exception:
                pass
        alias = os.path.join(_bin_dir(), "opensave")
        try:
            if os.path.islink(alias) or os.path.isfile(alias):
                os.remove(alias)
            os.symlink("opensave-cli", alias)
        except Exception:
            try:
                shutil.copy2(cli_dst, alias)
                os.chmod(alias, 0o755)
            except Exception:
                pass
        try:
            from .utils import chown_to_user
            chown_to_user(_bin_dir(), recursive=False)
            chown_to_user(cli_dst)
        except Exception:
            pass
        settings.set_dep_version("opensave", latest_tag)
        settings.reset_dep_fail("opensave")
        ver = installed_version()
        logger.log(f"opensave: installed CLI {ver or latest_tag}")
        return {"success": True, "installed": True, "updated": True,
                "version": ver, "tag": latest_tag}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ── diagnostics ──────────────────────────────────────────────────────────────
def diagnostics() -> Dict[str, Any]:
    cli = os.path.join(_bin_dir(), "opensave-cli")
    info: Dict[str, Any] = {
        "success": True,
        "binPath": cli,
        "exists": os.path.isfile(cli),
        "executable": os.path.isfile(cli) and os.access(cli, os.X_OK),
        "user": "",
        "daemonUrl": _daemon_url(),
        "addrFile": _addr_file(),
        "addrExists": os.path.isfile(_addr_file()),
        "versionRc": None, "versionOut": "",
        "daemonRc": None, "daemonOut": "",
    }
    try:
        info["user"] = slssteam._decky_user()
    except Exception:
        pass
    if info["exists"]:
        try:
            r = subprocess.run(_os_wrap([cli, "version"]), env=_os_env(),
                               capture_output=True, timeout=15)
            info["versionRc"] = r.returncode
            info["versionOut"] = (r.stdout.decode("utf-8", "replace")
                                  + r.stderr.decode("utf-8", "replace")).strip()[-300:]
        except Exception as exc:
            info["versionOut"] = f"error: {exc}"
    api = _api("/api/status", timeout=4)
    info["daemonRc"] = 0 if api.get("ok") else 1
    if api.get("ok"):
        try:
            info["daemonOut"] = ("running; " + json.dumps(api.get("data"))[:300])
        except Exception:
            info["daemonOut"] = "running"
    else:
        info["daemonOut"] = "not reachable: " + str(api.get("error", ""))[:300]
    return info


# ── updater hook (used by updates.py) ────────────────────────────────────────
def installed_tag() -> str:
    return settings.get_dep_version("opensave")


def refresh(force: bool = True) -> Dict[str, Any]:
    return ensure_cli(force=force)
