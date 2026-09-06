"""lua.tools account (Discord) — browserless bot-code sign-in for Game mode.

The lua.tools desktop app authenticates against a Supabase backend
(https://db.lua.tools) using a Discord identity. On the Deck we can't run the
localhost-redirect OAuth flow in Game mode, so we use lua.tools's own
**bot-code** path instead (the app's "Settings_BotCode_Redeem"): the user links
their account with the lua.tools Discord bot, the bot hands them a short code,
and we redeem it here for a Supabase session.

Endpoints (extracted from the LuaTools desktop client):
  * redeem   POST https://lua.tools/api/auth/code/redeem        {code}
  * refresh  POST https://db.lua.tools/auth/v1/token?grant_type=refresh_token
  * verify   GET  https://db.lua.tools/auth/v1/verify
  * status   GET  https://lua.tools/api/me/supporter-status      (Bearer)
  * manifest GET  https://lua.tools/api/manifest/download?appid= (Bearer)

The Supabase anon key is public by design (role "anon", shipped in every client)
and required to talk to the backend at all. All calls send `apikey: <anon>` and,
once signed in, `Authorization: Bearer <access_token>`.

The session is stored in the STABLE per-user dir (survives plugin reinstalls) and
treated as a secret: it is never included in backups/exports.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlparse, parse_qs

from .logger import logger
from .paths import get_user_home
from .httpc import ensure_http_client
from .utils import chown_to_user
from .config import GENERIC_FIX_URL, ONLINE_FIX_URL

# The desktop client talks to the API with a browser User-Agent; some routes
# (the fix download in particular) reject non-browser requests.
BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
              "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Public Supabase anon JWT (role: anon) — shipped in the lua.tools client.
SUPABASE_ANON = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
                 "eyJpYXQiOjE3NzYwMzkzNzYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9."
                 "f_-K38u3odjltP-g_67FVmG32Vg-_-k-lNBvIaVUVBM")

API = "https://lua.tools"
DB = "https://db.lua.tools"
REDEEM_URL = f"{API}/api/auth/code/redeem"
REFRESH_URL = f"{DB}/auth/v1/token?grant_type=refresh_token"
PKCE_TOKEN_URL = f"{DB}/auth/v1/token?grant_type=pkce"
AUTHORIZE_URL = f"{DB}/auth/v1/authorize"
STATUS_URL = f"{API}/api/me/supporter-status"
MANIFEST_URL = f"{API}/api/manifest/download?appid={{appid}}"
# Fix catalog (the desktop app's FixesViewModel). `/api/denuvo/fixes?appid=`
# returns every fix release for a game (each with an id, name, release date and
# the manifest/build to pin); `/api/denuvo/listings` is the master catalog of all
# games that have a fix; `/api/denuvo/download?fix=` pulls one fix's payload.
FIXES_URL = f"{API}/api/denuvo/fixes?appid={{appid}}"
LISTINGS_URL = f"{API}/api/denuvo/listings"
FIX_DOWNLOAD_URL = f"{API}/api/denuvo/download?fix={{fix}}"

# The lua.tools desktop app runs its OAuth callback listener here, so this exact
# redirect is already allow-listed in their Supabase project — we must reuse it.
OAUTH_PORT = 6767
OAUTH_REDIRECT = f"http://127.0.0.1:{OAUTH_PORT}/"

_UA = "SLSDeck/lua.tools"

# ── Discord OAuth (PKCE) state ───────────────────────────────────────────────
_oauth_lock = threading.Lock()
_oauth_verifier: Optional[str] = None
_oauth_server: Optional[HTTPServer] = None
_oauth_result: Dict[str, Any] = {"done": False, "success": False, "error": ""}


def _state_dir() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "slsdeck")
    os.makedirs(d, exist_ok=True)
    return d


def _session_path() -> str:
    return os.path.join(_state_dir(), "luatools_session.json")


def _load() -> Dict[str, Any]:
    try:
        with open(_session_path(), "r", encoding="utf-8") as fh:
            d = json.load(fh)
            return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def _save(sess: Dict[str, Any]) -> None:
    try:
        tmp = _session_path() + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(sess, fh, indent=2)
        os.chmod(tmp, 0o600)
        os.replace(tmp, _session_path())
        chown_to_user(_session_path(), recursive=False)
    except Exception as exc:
        logger.warn(f"lua.tools: session save failed: {exc}")


def _apply_session_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """Normalise a Supabase/redeem response into our stored session."""
    # Supabase returns {access_token, refresh_token, expires_in, user}. Some
    # wrappers nest it under "session".
    src = data.get("session") if isinstance(data.get("session"), dict) else data
    access = src.get("access_token") or src.get("accessToken")
    refresh = src.get("refresh_token") or src.get("refreshToken")
    # A token *refresh* response may renew only the access token and omit a new
    # refresh token. Rejecting that (the old behaviour) discarded a perfectly
    # good renewal and killed auth once the ~1h access token expired. Keep the
    # existing refresh token when the response doesn't carry a new one.
    prev = _load()
    if not refresh:
        refresh = prev.get("refresh_token")
    if not access:
        return {}
    expires_in = int(src.get("expires_in") or src.get("expiresIn") or 3600)
    user = src.get("user") or data.get("user") or prev.get("user") or {}
    if not isinstance(user, dict):
        user = {}
    sess = {
        "access_token": access,
        "refresh_token": refresh or "",
        "expires_at": int(time.time()) + expires_in - 60,  # refresh a minute early
        "user": {
            "id": user.get("id", "") or prev.get("user", {}).get("id", ""),
            "email": user.get("email", "") or prev.get("user", {}).get("email", ""),
            "name": user.get("name")  # already-normalised (from a prior save)
                    or (user.get("user_metadata", {}) or {}).get("full_name")
                    or (user.get("user_metadata", {}) or {}).get("name")
                    or (user.get("user_metadata", {}) or {}).get("global_name")
                    or user.get("email", "")
                    or prev.get("user", {}).get("name")
                    or "lua.tools user",
        },
    }
    _save(sess)
    return sess


def redeem_code(code: str) -> Dict[str, Any]:
    """Fallback sign-in: redeem a lua.tools Discord bot code for a session."""
    code = str(code or "").strip()
    if not code:
        return {"success": False, "error": "Enter the code from the lua.tools Discord bot"}
    client = ensure_http_client("lua.tools: redeem")
    headers = {"apikey": SUPABASE_ANON, "Content-Type": "application/json", "User-Agent": _UA}
    body = {"code": code, "bot_code": code}
    try:
        r = client.post(REDEEM_URL, headers=headers, json=body, timeout=30)
    except Exception as exc:
        return {"success": False, "error": f"redeem request failed: {exc}"}
    if r.status_code not in (200, 201):
        logger.debug(f"lua.tools redeem HTTP {r.status_code}: {r.text[:200]}")
        return {"success": False, "error": f"redeem failed (HTTP {r.status_code})"}
    try:
        data = r.json()
    except Exception:
        return {"success": False, "error": "redeem returned a non-JSON response"}
    sess = _apply_session_payload(data)
    if not sess:
        logger.debug(f"lua.tools redeem: unexpected payload {json.dumps(data)[:300]}")
        return {"success": False, "error": "redeem returned no session"}
    return {"success": True, "user": sess["user"]}


# ── Discord OAuth (PKCE) — browser button flow, Game-mode compatible ─────────
def _gen_pkce() -> Tuple[str, str]:
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(48)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    return verifier, challenge


def _stop_oauth_server() -> None:
    global _oauth_server
    srv = _oauth_server
    _oauth_server = None
    if srv is not None:
        try:
            srv.shutdown()
        except Exception:
            pass
        try:
            srv.server_close()
        except Exception:
            pass


def _exchange_pkce(code: str) -> bool:
    client = ensure_http_client("lua.tools: pkce")
    headers = {"apikey": SUPABASE_ANON, "Content-Type": "application/json", "User-Agent": _UA}
    body = {"auth_code": code, "code_verifier": _oauth_verifier}
    try:
        r = client.post(PKCE_TOKEN_URL, headers=headers, json=body, timeout=30)
        if r.status_code != 200:
            logger.debug(f"lua.tools pkce HTTP {r.status_code}: {r.text[:200]}")
            return False
        return bool(_apply_session_payload(r.json()))
    except Exception as exc:
        logger.warn(f"lua.tools: pkce exchange failed: {exc}")
        return False


def _oauth_handler_factory():
    _CLOSE_HTML = (
        b"<!doctype html><html><head><meta charset='utf-8'>"
        b"<title>SLSDeck</title></head>"
        b"<body style='font-family:sans-serif;background:#0a0a0f;color:#eee;"
        b"display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>"
        b"<div style='text-align:center'><h2>SLSDeck</h2>"
        b"<p>Signed in \xe2\x9c\x93 &mdash; you can close this and return to Steam.</p>"
        b"</div></body></html>")

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):  # silence
            pass

        def do_GET(self):
            q = parse_qs(urlparse(self.path).query)
            code = (q.get("code") or [None])[0]
            err = (q.get("error_description") or q.get("error") or [None])[0]
            try:
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(_CLOSE_HTML)
            except Exception:
                pass
            if code:
                ok = _exchange_pkce(code)
                with _oauth_lock:
                    _oauth_result.update({"done": True, "success": ok,
                                          "error": "" if ok else "token exchange failed"})
            else:
                with _oauth_lock:
                    _oauth_result.update({"done": True, "success": False,
                                          "error": err or "no authorization code returned"})
            threading.Thread(target=_stop_oauth_server, daemon=True).start()

    return Handler


def oauth_start() -> Dict[str, Any]:
    """Begin Discord OAuth: start the localhost callback listener and return the
    authorize URL for the frontend to open in Steam's browser (Game mode)."""
    global _oauth_verifier, _oauth_server, _oauth_result
    _stop_oauth_server()
    with _oauth_lock:
        _oauth_result = {"done": False, "success": False, "error": ""}
    verifier, challenge = _gen_pkce()
    _oauth_verifier = verifier
    try:
        server = HTTPServer(("127.0.0.1", OAUTH_PORT), _oauth_handler_factory())
    except OSError as exc:
        return {"success": False, "error": f"could not open callback port {OAUTH_PORT}: {exc}"}
    _oauth_server = server
    threading.Thread(target=server.serve_forever, daemon=True).start()
    # Supabase PKCE authorize → Discord consent → back to the localhost callback.
    from urllib.parse import urlencode
    url = AUTHORIZE_URL + "?" + urlencode({
        "provider": "discord",
        "redirect_to": OAUTH_REDIRECT,
        "code_challenge": challenge,
        "code_challenge_method": "s256",
    })
    return {"success": True, "url": url}


def oauth_status() -> Dict[str, Any]:
    with _oauth_lock:
        res = dict(_oauth_result)
    res["success"] = True
    res["authed"] = is_authed()
    return res


def oauth_cancel() -> Dict[str, Any]:
    _stop_oauth_server()
    with _oauth_lock:
        _oauth_result.update({"done": True, "success": False, "error": "cancelled"})
    return {"success": True}


def _refresh() -> bool:
    sess = _load()
    refresh = sess.get("refresh_token")
    if not refresh:
        return False
    client = ensure_http_client("lua.tools: refresh")
    headers = {"apikey": SUPABASE_ANON, "Content-Type": "application/json", "User-Agent": _UA}
    try:
        r = client.post(REFRESH_URL, headers=headers, json={"refresh_token": refresh}, timeout=30)
        if r.status_code != 200:
            logger.debug(f"lua.tools refresh HTTP {r.status_code}")
            return False
        return bool(_apply_session_payload(r.json()))
    except Exception as exc:
        logger.warn(f"lua.tools: refresh failed: {exc}")
        return False


def _access_token() -> Optional[str]:
    sess = _load()
    if not sess.get("access_token"):
        return None
    if int(sess.get("expires_at", 0)) <= int(time.time()):
        if not _refresh():
            return None
        sess = _load()
    return sess.get("access_token")


def is_authed() -> bool:
    return bool(_access_token())


def signout() -> Dict[str, Any]:
    try:
        if os.path.isfile(_session_path()):
            os.remove(_session_path())
    except Exception as exc:
        return {"success": False, "error": str(exc)}
    return {"success": True}


def get_status() -> Dict[str, Any]:
    sess = _load()
    has_refresh = bool(sess.get("refresh_token"))
    token = _access_token()
    if not token:
        return {"success": True, "authed": False,
                "debug": {"hasStoredSession": bool(sess), "hasRefreshToken": has_refresh,
                          "reason": "no valid access token / refresh failed"}}
    sess = _load()
    out = {"success": True, "authed": True, "user": sess.get("user", {}), "supporter": "",
           "debug": {"hasRefreshToken": bool(sess.get("refresh_token")),
                     "expiresAt": sess.get("expires_at", 0)}}
    # Actually verify the token against the server so Settings reflects reality
    # (previously it reported "logged in" from local state alone, which could
    # disagree with the fix menu that really uses the token).
    try:
        client = ensure_http_client("lua.tools: status")
        def _hit(tok):
            return client.get(STATUS_URL, headers={
                "apikey": SUPABASE_ANON, "Authorization": f"Bearer {tok}", "User-Agent": _UA,
            }, timeout=20)
        r = _hit(token)
        if r.status_code == 401 and _refresh():
            token = _access_token()
            if token:
                r = _hit(token)
        out["debug"]["statusHttp"] = r.status_code
        if r.status_code == 200:
            d = r.json()
            out["supporter"] = str(d.get("tier") or d.get("supporter") or
                                   ("supporter" if d.get("is_supporter") else "free"))
            if isinstance(d.get("usage"), dict):
                out["usage"] = d["usage"]
        elif r.status_code in (401, 403):
            # token is dead and couldn't be refreshed → report signed out so the
            # UI is consistent with the fix menu.
            out["authed"] = False
            out["supporter"] = ""
    except Exception as exc:
        out["debug"]["statusError"] = str(exc)
    return out


def _first(d: Dict[str, Any], *keys: str) -> Any:
    """Return the first present, non-empty value among the given keys."""
    for k in keys:
        if k in d and d[k] not in (None, ""):
            return d[k]
    return None


def _scan(d: Dict[str, Any], *substrings: str) -> Any:
    """Find the first scalar value whose key contains any of the substrings
    (case-insensitive). Robust to unknown exact key names / casing."""
    if not isinstance(d, dict):
        return None
    subs = [s.lower() for s in substrings]
    for k, v in d.items():
        kl = str(k).lower()
        if any(s in kl for s in subs) and isinstance(v, (str, int, float)) and v not in ("", None):
            return v
    return None


def _tag_text(t: Any) -> str:
    """Reduce a tag/badge (string OR object) to display text. lua.tools badges
    like 'voices38' / '(crack)Ubisoft' arrive as objects; pull the label out."""
    if isinstance(t, str):
        return t.strip()
    if isinstance(t, (int, float)):
        return str(t)
    if isinstance(t, dict):
        for k in ("name", "label", "text", "title", "tag", "value", "badge", "type", "display"):
            v = t.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
        # fall back to the first string value in the object
        for v in t.values():
            if isinstance(v, str) and v.strip():
                return v.strip()
    return ""


def _norm_fix(raw: Dict[str, Any], appid: int = 0) -> Dict[str, Any]:
    """Normalise one fix record from /api/denuvo/fixes into a stable shape.

    Real schema (per game): the endpoint returns
      {appid, name, header_image, fixes: [ {id, title, description, tags:[{id,
       name, slug, color}], hasManifest, hasFix, manifestFilename, fixFilename,
       createdAt} ]}
    - ``id``    → the fix UUID used for /api/denuvo/download?fix=<id>
    - ``title`` → the Steam build id the fix targets (shown as the build)
    - ``tags``  → badges (voices38 (crack), SteamTools Achievements Fix, …)
    - ``createdAt`` → release date
    Extra keys are tolerated via a fallback scan so a schema change degrades
    gracefully rather than dropping the record.
    """
    fid = _first(raw, "id", "fix", "fix_id", "fixId") or ""
    build = _first(raw, "title", "build", "buildid", "build_id", "manifest_id", "manifestId")
    depot = _first(raw, "depot_id", "depotId", "depot")  # usually absent → resolved from the .lua
    rdate = _first(raw, "createdAt", "created_at", "release_date", "releaseDate", "date", "updatedAt")

    raw_tags = _first(raw, "tags", "labels", "badges")
    if isinstance(raw_tags, str):
        tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
    elif isinstance(raw_tags, list):
        tags = [tt for tt in (_tag_text(x) for x in raw_tags) if tt]
    elif isinstance(raw_tags, dict):
        tags = [tt for tt in (_tag_text(v) for v in raw_tags.values()) if tt]
    else:
        tags = []

    return {
        "id": str(fid),
        "appid": int(appid) if appid else 0,
        "name": str(_first(raw, "name", "Name") or ""),
        "build": str(build) if build is not None else "",
        # `title` is a Steam BuildID, not a depot manifest GID. Exact GIDs are
        # read only from this fix's paired manifest .lua.
        "manifest_id": "",
        "depot_id": str(depot) if depot is not None else "",
        "release_date": str(rdate) if rdate is not None else "",
        "release_year": "",
        # Full markdown description/instructions. Shown only in the Settings
        # "Game fixes" tab (not the compact QAM fix list).
        "description": str(_first(raw, "description", "desc") or ""),
        "has_manifest": bool(_first(raw, "hasManifest", "has_manifest")),
        "has_fix": bool(_first(raw, "hasFix", "has_fix")),
        "manifest_filename": str(_first(raw, "manifestFilename", "manifest_filename") or ""),
        "fix_filename": str(_first(raw, "fixFilename", "fix_filename") or ""),
        "size": _first(raw, "size", "bytes") or 0,
        "url": _first(raw, "url", "download_url", "downloadUrl") or "",
        "tags": tags,
    }


def _extract_list(data: Any) -> list:
    """Pull the array of records out of a variety of response envelopes."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("fixes", "data", "results", "items", "releases", "listings", "games"):
            v = data.get(key)
            if isinstance(v, list):
                return v
    return []


def list_fixes(appid: int, _retried: bool = False) -> Dict[str, Any]:
    """Return the full list of fix releases for a game.

    Each entry carries the manifest/build id to pin so the caller can apply the
    fix AND pin the game to the exact build the fix was made for. A valid stored
    token means we are signed in (authed=True) even if the endpoint then rejects
    the request — so a 401/403 here is reported as an endpoint error, not as
    "signed out" (which previously sent the UI back to the sign-in prompt).
    """
    token = _access_token()
    if not token:
        _sess = _load()
        return {"success": False, "authed": False,
                "error": "Sign in with Discord to see lua.tools fixes",
                "debug": {"noToken": True, "hasSession": bool(_sess),
                          "hasRefreshToken": bool(_sess.get("refresh_token")),
                          "expiresAt": _sess.get("expires_at", 0)}}
    client = ensure_http_client("lua.tools: fixes")
    headers = {"apikey": SUPABASE_ANON, "Authorization": f"Bearer {token}", "User-Agent": _UA}
    try:
        r = client.get(FIXES_URL.format(appid=int(appid)), headers=headers,
                       timeout=30, follow_redirects=True)
    except Exception as exc:
        return {"success": False, "authed": True, "error": f"fixes request failed: {exc}"}
    if r.status_code == 401 and not _retried:
        # Try one refresh in case the access token just expired, then retry ONCE
        # (guarded, so a persistent 401 can't recurse forever).
        if _refresh():
            return list_fixes(appid, _retried=True)
    if r.status_code in (401, 403):
        logger.debug(f"lua.tools fixes HTTP {r.status_code} for {appid}: {r.text[:200]}")
        return {"success": False, "authed": True,
                "error": (f"lua.tools rejected the fix request (HTTP {r.status_code}). "
                          "Your account may not have access to the fix catalog, or the "
                          "session needs a fresh sign-in."),
                "debug": {"status": r.status_code, "body": r.text[:160]}}
    if r.status_code == 404:
        return {"success": True, "authed": True, "fixes": [], "debug": {"status": 404}}
    if r.status_code != 200:
        logger.debug(f"lua.tools fixes HTTP {r.status_code} for {appid}: {r.text[:200]}")
        return {"success": False, "authed": True, "error": f"fixes failed (HTTP {r.status_code})",
                "debug": {"status": r.status_code, "body": r.text[:200]}}
    try:
        data = r.json()
    except Exception:
        return {"success": False, "authed": True, "error": "fixes returned a non-JSON response",
                "debug": {"status": 200, "body": r.text[:200]}}
    # Persist the raw response so we can confirm the exact schema when a field
    # doesn't map. Written to the stable dir (never included in backups/exports).
    try:
        raw_path = os.path.join(_state_dir(), f"fixes_raw_{int(appid)}.json")
        with open(raw_path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        chown_to_user(raw_path, recursive=False)
    except Exception:
        pass
    logger.debug(f"lua.tools fixes raw for {appid}: {json.dumps(data)[:1200]}")
    lst = _extract_list(data)
    fixes = [_norm_fix(x, appid) for x in lst if isinstance(x, dict)]
    dbg = {
        "status": 200,
        "rawType": type(data).__name__,
        "rawKeys": (list(data.keys())[:10] if isinstance(data, dict) else None),
        "listLen": len(lst),
        "parsed": len(fixes),
    }
    return {"success": True, "authed": True, "fixes": fixes, "debug": dbg}


def list_all_fixes() -> Dict[str, Any]:
    """Signed-in only: the master catalog of every game that has a fix
    (`/api/denuvo/listings`). Useful for a browse/search view."""
    token = _access_token()
    if not token:
        return {"success": False, "authed": False, "error": "Sign in with Discord to browse lua.tools fixes"}
    client = ensure_http_client("lua.tools: listings")
    headers = {"apikey": SUPABASE_ANON, "Authorization": f"Bearer {token}", "User-Agent": _UA}
    try:
        r = client.get(LISTINGS_URL, headers=headers, timeout=45, follow_redirects=True)
    except Exception as exc:
        return {"success": False, "authed": True, "error": f"listings request failed: {exc}"}
    if r.status_code == 401 and _refresh():
        return list_all_fixes()
    if r.status_code != 200:
        logger.debug(f"lua.tools listings HTTP {r.status_code}: {r.text[:200]}")
        return {"success": False, "authed": True, "error": f"listings failed (HTTP {r.status_code})"}
    try:
        data = r.json()
    except Exception:
        return {"success": False, "authed": True, "error": "listings returned a non-JSON response"}
    return {"success": True, "authed": True, "listings": _extract_list(data)}


def _as_bytes_or_json_url(client, r, hdrs) -> Optional[bytes]:
    """A 200 response is either the archive bytes or JSON pointing at one."""
    ctype = (r.headers.get("content-type") or "").lower()
    if "application/json" in ctype:
        try:
            data = r.json()
        except Exception:
            return None
        link = (data.get("url") or data.get("download_url") or data.get("link")
                or data.get("signedUrl"))
        if not link:
            return None
        r2 = client.get(link, headers={"User-Agent": BROWSER_UA}, timeout=120, follow_redirects=True)
        return r2.content if r2.status_code == 200 else None
    return r.content


def _fetch_slot(fix_id: str, appid: int, slot: str, _retried: bool = False) -> Dict[str, Any]:
    """Resolve one artifact of a fix (slot='fix' or 'manifest') via
    /api/denuvo/download?fix=<id>&slot=<slot>, which returns JSON {url:<presigned
    R2 link>}, then fetch the bytes from R2. Returns {ok, data, status, error}."""
    token = _access_token()
    if not token:
        return {"ok": False, "data": None, "status": 0, "error": "not signed in"}
    fix_id = str(fix_id or "").strip()
    if not fix_id:
        return {"ok": False, "data": None, "status": 0, "error": "missing fix id"}
    client = ensure_http_client("lua.tools: fix download")
    headers = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "User-Agent": BROWSER_UA,
        "Accept": "*/*",
        "Referer": f"{API}/fixes/{int(appid)}" if appid else f"{API}/",
    }
    url = f"{API}/api/denuvo/download?fix={fix_id}&slot={slot}"
    try:
        r = client.get(url, headers=headers, timeout=60, follow_redirects=True)
    except Exception as exc:
        return {"ok": False, "data": None, "status": 0, "error": f"request failed: {exc}"}
    if r.status_code == 401 and not _retried and _refresh():
        return _fetch_slot(fix_id, appid, slot, _retried=True)
    if r.status_code != 200:
        body = ""
        try:
            body = r.text[:200]
        except Exception:
            body = ""
        logger.debug(f"lua.tools download slot={slot} HTTP {r.status_code} for {fix_id}: {body}")
        return {"ok": False, "data": None, "status": r.status_code,
                "error": f"HTTP {r.status_code} · {body}"[:200]}
    # Response is JSON {url: <presigned R2 url>}; the R2 link is self-authorized.
    link = None
    try:
        data = r.json()
        link = data.get("url") or data.get("download_url") or data.get("link")
    except Exception:
        # Some slots may return the bytes directly.
        if r.content[:2] == b"PK" or b"addappid" in r.content[:64]:
            return {"ok": True, "data": r.content, "status": 200}
        link = None
    if not link:
        return {"ok": False, "data": None, "status": 200,
                "error": "download returned no url", "body": (r.text[:160] if hasattr(r, "text") else "")}
    try:
        r2 = client.get(link, headers={"User-Agent": BROWSER_UA}, timeout=180, follow_redirects=True)
        if r2.status_code == 200:
            return {"ok": True, "data": r2.content, "status": 200, "url": link.split("?")[0]}
        return {"ok": False, "data": None, "status": r2.status_code,
                "error": f"R2 fetch HTTP {r2.status_code}"}
    except Exception as exc:
        return {"ok": False, "data": None, "status": 0, "error": f"R2 fetch failed: {exc}"}


def download_fix(fix_id: str, appid: int = 0, build: str = "",
                 fix_filename: str = "") -> Dict[str, Any]:
    """Download a fix archive (slot=fix)."""
    return _fetch_slot(fix_id, appid, "fix")


def download_fix_manifest(fix_id: str, appid: int = 0) -> Optional[str]:
    """Fetch a fix's paired manifest .lua (slot=manifest) so we can pin to the
    exact build this fix targets. Returns the lua text or None."""
    res = _fetch_slot(fix_id, appid, "manifest")
    if res.get("ok") and res.get("data"):
        try:
            text = res["data"].decode("utf-8", "ignore")
            return text if "setManifestid" in text or "addappid" in text else text
        except Exception:
            return None
    return None


def fetch_manifest_lua(appid: int) -> Optional[str]:
    """Signed-in only: download the game's manifest .lua (carries the depot keys
    and setManifestid gid) from lua.tools. The API returns either the .lua text
    directly or a JSON body with a download link."""
    token = _access_token()
    if not token:
        return None
    client = ensure_http_client("lua.tools: manifest")
    headers = {"apikey": SUPABASE_ANON, "Authorization": f"Bearer {token}", "User-Agent": _UA}
    try:
        r = client.get(MANIFEST_URL.format(appid=int(appid)), headers=headers,
                       timeout=30, follow_redirects=True)
        if r.status_code != 200:
            logger.debug(f"lua.tools manifest HTTP {r.status_code} for {appid}")
            return None
        ctype = (r.headers.get("content-type") or "").lower()
        if "application/json" in ctype:
            data = r.json()
            url = data.get("url") or data.get("download_url") or data.get("link")
            if not url:
                # some responses embed the lua text under a key
                lua = data.get("lua") or data.get("manifest") or data.get("content")
                return lua if isinstance(lua, str) and "addappid" in lua else None
            r2 = client.get(url, headers={"User-Agent": _UA}, timeout=60, follow_redirects=True)
            return r2.text if r2.status_code == 200 else None
        text = r.text
        return text if "addappid" in text else None
    except Exception as exc:
        logger.warn(f"lua.tools: manifest fetch failed for {appid}: {exc}")
        return None
