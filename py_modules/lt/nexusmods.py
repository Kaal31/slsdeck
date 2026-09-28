"""Nexus Mods browsing and collection archive staging.

Nexus deliberately gates unattended download links behind Premium.  This
module supports that API as documented and the official free-user ``nxm://``
handoff (one Slow Download click per file); it never scrapes or forges links.
Archives are staged only.  Deploying them is game-specific and must not be
guessed by copying arbitrary collection contents into a game directory.
"""

from __future__ import annotations

import os
import re
import json
import shlex
import shutil
import subprocess
import threading
import time
import uuid
from typing import Any, Dict
from urllib.parse import parse_qs, urlparse

import httpx  # type: ignore

from . import settings
from .httpc import get_http_client
from .paths import get_user_home, runtime_path
from .utils import chown_to_user, decky_user

API = "https://api.nexusmods.com"
GQL = API + "/v2/graphql"
UA = "SLSDeck/0.9 Nexus integration"
_JOBS: Dict[str, Dict[str, Any]] = {}
_LOCK = threading.Lock()
_CACHE_LOCK = threading.Lock()


def _cache_index_path() -> str:
    return runtime_path("nexus", "archive-index.json")


def _cache_key(item: Dict[str, Any]) -> str:
    return f"{_domain(item.get('domain'))}:{int(item.get('modId') or 0)}:{int(item.get('fileId') or 0)}"


def _load_cache_index() -> Dict[str, Any]:
    try:
        with open(_cache_index_path(), "r", encoding="utf-8") as handle:
            value = json.load(handle)
        return value if isinstance(value, dict) else {}
    except (OSError, ValueError, TypeError):
        return {}


def _save_cache_index(value: Dict[str, Any]) -> None:
    path = _cache_index_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    temp = path + ".tmp"
    with open(temp, "w", encoding="utf-8") as handle:
        json.dump(value, handle, indent=2)
    os.replace(temp, path)
    chown_to_user(path, recursive=False)


def _cached_archive(item: Dict[str, Any]) -> str:
    """Return a verified cached archive, never just a stale index entry."""
    try:
        with _CACHE_LOCK:
            record = _load_cache_index().get(_cache_key(item)) or {}
        path = str(record.get("path") or "")
        actual = os.path.getsize(path) if path and os.path.isfile(path) else 0
        recorded = int(record.get("size") or 0)
        expected = int(item.get("size") or 0)
        indexed_expected = int(record.get("expectedSize") or 0)
        if actual > 0 and actual == recorded and (not expected or expected == indexed_expected):
            return path
    except (OSError, TypeError, ValueError):
        pass
    return ""


def _remember_archive(item: Dict[str, Any], path: str) -> None:
    actual = os.path.getsize(path)
    with _CACHE_LOCK:
        index = _load_cache_index()
        index[_cache_key(item)] = {"path": path, "size": actual,
                                   "expectedSize": int(item.get("size") or 0),
                                   "savedAt": int(time.time())}
        _save_cache_index(index)


def _nxm_paths() -> tuple[str, str, str]:
    root = runtime_path("nexus")
    return root, os.path.join(root, "nxm-queue"), os.path.join(root, "nxm-relay.sh")


def register_nxm_handler() -> Dict[str, Any]:
    """Register a user-level protocol relay for Nexus' official nxm:// links."""
    try:
        root, queue, script = _nxm_paths()
        os.makedirs(root, exist_ok=True)
        open(queue, "a", encoding="utf-8").close()
        with open(script, "w", encoding="utf-8", newline="\n") as handle:
            handle.write("#!/bin/sh\nprintf '%s %s\\n' \"$(date +%s)\" \"$1\" >> " + shlex.quote(queue) + "\n")
        os.chmod(script, 0o755)
        home = get_user_home()
        apps = os.path.join(home, ".local", "share", "applications")
        os.makedirs(apps, exist_ok=True)
        desktop_id = "slsdeck-nexus-nxm.desktop"
        desktop = os.path.join(apps, desktop_id)
        with open(desktop, "w", encoding="utf-8", newline="\n") as handle:
            handle.write("[Desktop Entry]\nType=Application\nName=SLSDeck Nexus NXM Relay\n"
                         f"Exec={script} %u\nMimeType=x-scheme-handler/nxm;\n"
                         "NoDisplay=true\nTerminal=false\n")
        chown_to_user(root, recursive=True)
        chown_to_user(desktop, recursive=False)
        env = os.environ.copy()
        env.update({"HOME": home, "USER": decky_user(), "LOGNAME": decky_user()})
        prefix = ["runuser", "-u", decky_user(), "--"] if os.geteuid() == 0 and shutil.which("runuser") else []
        results = {}
        for name, command in (
            ("desktopDatabase", ["update-desktop-database", apps]),
            ("mime", ["xdg-mime", "default", desktop_id, "x-scheme-handler/nxm"]),
        ):
            if not shutil.which(command[0]):
                results[name] = False
                continue
            results[name] = subprocess.run(prefix + command, env=env, timeout=15,
                                           stdout=subprocess.DEVNULL,
                                           stderr=subprocess.DEVNULL).returncode == 0
        return {"success": True, "registered": bool(results.get("mime")), "tools": results}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def nxm_handler_status() -> Dict[str, Any]:
    root, queue, script = _nxm_paths()
    desktop = os.path.join(get_user_home(), ".local", "share", "applications", "slsdeck-nexus-nxm.desktop")
    return {"success": True, "installed": os.path.isfile(script) and os.path.isfile(desktop),
            "queue": queue, "pendingLinks": _queue_count(queue)}


def _queue_count(path: str) -> int:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            return sum(1 for line in handle if line.strip())
    except OSError:
        return 0

COLLECTION_QUERY = """
query GetCollection($slug: String!, $domainName: String!) {
  collectionRevision(slug: $slug, domainName: $domainName) {
    revisionNumber modCount totalSize
    collection { id name summary user { name } }
    modFiles { fileId optional file { fileId modId name version sizeInBytes
      mod { name game { domainName } } } }
    externalResources { name resourceType resourceUrl optional }
  }
}
"""


def _key() -> str:
    return str(settings.get_value("nexusApiKey", "") or "").strip()


def get_api_key() -> Dict[str, Any]:
    return {"success": True, "key": _key()}


def set_api_key(value: str) -> Dict[str, Any]:
    settings.set_value("nexusApiKey", str(value or "").strip())
    return {"success": True}


def _headers() -> Dict[str, str]:
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if _key():
        headers["apikey"] = _key()
    return headers


def _json(method: str, url: str, **kwargs) -> Any:
    response = get_http_client().request(method, url, headers=_headers(), **kwargs)
    if response.status_code >= 400:
        detail = ""
        try:
            detail = str(response.json().get("message") or "")
        except Exception:
            pass
        raise RuntimeError(f"Nexus HTTP {response.status_code}{': ' + detail if detail else ''}")
    return response.json()


def validate() -> Dict[str, Any]:
    if not _key():
        return {"success": False, "error": "Enter a Nexus Mods API key"}
    try:
        user = _json("GET", API + "/v1/users/validate.json")
        return {"success": True, "user": user.get("name") or "Nexus user",
                "premium": bool(user.get("is_premium")), "supporter": bool(user.get("is_supporter"))}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def trending(domain: str) -> Dict[str, Any]:
    domain = _domain(domain)
    try:
        items = _json("GET", f"{API}/v1/games/{domain}/mods/trending.json")
        return {"success": True, "mods": [{
            "modId": int(x.get("mod_id") or 0), "name": x.get("name") or "Unnamed mod",
            "summary": x.get("summary") or "", "version": x.get("version") or "",
            "downloads": int(x.get("mod_downloads") or 0),
        } for x in (items or [])[:40]]}
    except Exception as exc:
        return {"success": False, "error": str(exc), "mods": []}


def mod_files(domain: str, mod_id: int) -> Dict[str, Any]:
    domain = _domain(domain)
    try:
        body = _json("GET", f"{API}/v1/games/{domain}/mods/{int(mod_id)}/files.json")
        files = body.get("files") or []
        return {"success": True, "files": [{"fileId": int(x.get("file_id") or 0),
                "name": x.get("name") or x.get("file_name") or "Archive",
                "version": x.get("version") or "", "size": int(x.get("size_in_bytes") or 0),
                "category": x.get("category_name") or ""} for x in files]}
    except Exception as exc:
        return {"success": False, "error": str(exc), "files": []}


def _domain(value: str) -> str:
    value = str(value or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_-]+", value):
        raise ValueError("Invalid Nexus game domain")
    return value


def _collection_ref(text: str, domain: str = "") -> tuple[str, str]:
    raw = str(text or "").strip()
    match = re.search(r"nexusmods\.com/([^/]+)/collections/([^/?#]+)", raw, re.I)
    if match:
        return _domain(match.group(1)), match.group(2)
    slug = raw.strip("/ ")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", slug) or not domain:
        raise ValueError("Paste a Nexus collection URL, or provide its game domain and slug")
    return _domain(domain), slug


def collection(text: str, domain: str = "") -> Dict[str, Any]:
    try:
        game, slug = _collection_ref(text, domain)
        body = _json("POST", GQL, json={"query": COLLECTION_QUERY,
                     "variables": {"slug": slug, "domainName": game}})
        if body.get("errors"):
            raise RuntimeError(body["errors"][0].get("message") or "Nexus GraphQL error")
        rev = (body.get("data") or {}).get("collectionRevision")
        if not rev:
            raise RuntimeError("Collection revision not found")
        files = []
        for pin in rev.get("modFiles") or []:
            item = pin.get("file") or {}
            mod = item.get("mod") or {}
            entry = {"fileId": int(item.get("fileId") or pin.get("fileId") or 0),
                          "modId": int(item.get("modId") or 0), "name": item.get("name") or "Archive",
                          "modName": mod.get("name") or "Mod", "version": item.get("version") or "",
                          "size": int(item.get("sizeInBytes") or 0), "optional": bool(pin.get("optional")),
                          "domain": ((mod.get("game") or {}).get("domainName") or game)}
            cached = _cached_archive(entry)
            entry["downloaded"] = bool(cached)
            if cached:
                entry["path"] = cached
            files.append(entry)
        meta = rev.get("collection") or {}
        return {"success": True, "domain": game, "slug": slug,
                "name": meta.get("name") or slug, "summary": meta.get("summary") or "",
                "author": (meta.get("user") or {}).get("name") or "", "revision": rev.get("revisionNumber"),
                "totalSize": int(rev.get("totalSize") or 0), "files": files,
                "external": rev.get("externalResources") or []}
    except Exception as exc:
        return {"success": False, "error": str(exc), "files": []}


def _safe_name(name: str, fallback: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9._ -]+", "_", str(name or "")).strip(" .")
    while ".." in clean:
        clean = clean.replace("..", "_")
    return (clean[:180] or fallback)


def _download(domain: str, mod_id: int, file_id: int, target_dir: str,
              key: str = "", expires: str = "") -> str:
    params = {"key": key, "expires": expires} if key and expires else None
    links = _json("GET", f"{API}/v1/games/{domain}/mods/{mod_id}/files/{file_id}/download_link.json", params=params)
    if not links:
        raise RuntimeError("Nexus returned no download mirror (Premium or a fresh Slow Download link is required)")
    uri = links[0].get("URI") or links[0].get("uri")
    if not uri:
        raise RuntimeError("Nexus download mirror did not include a URI")
    os.makedirs(target_dir, exist_ok=True)
    timeout = httpx.Timeout(connect=20.0, read=120.0, write=120.0, pool=20.0)
    with get_http_client().stream("GET", uri, headers={"User-Agent": UA},
                                  follow_redirects=True, timeout=timeout) as response:
        response.raise_for_status()
        disposition = response.headers.get("content-disposition") or ""
        match = re.search(r'filename\*?=(?:UTF-8\'\')?["\']?([^"\';]+)', disposition, re.I)
        filename = _safe_name(match.group(1) if match else os.path.basename(urlparse(str(response.url)).path), f"{mod_id}-{file_id}.archive")
        path = os.path.join(target_dir, filename)
        with open(path + ".part", "wb") as handle:
            for chunk in response.iter_bytes(1024 * 1024):
                handle.write(chunk)
    os.replace(path + ".part", path)
    chown_to_user(path, recursive=False)
    return path


def start_collection(text: str, domain: str = "") -> Dict[str, Any]:
    plan = collection(text, domain)
    if not plan.get("success"):
        return plan
    account = validate()
    if not account.get("success"):
        return account
    job = uuid.uuid4().hex
    cached = [item for item in plan["files"] if _cached_archive(item)]
    missing = [item for item in plan["files"] if not _cached_archive(item)]
    state = {"status": "queued", "done": len(cached), "cached": len(cached),
             "total": len(plan["files"]), "failed": [],
             "waiting": [], "domain": plan["domain"], "slug": plan["slug"], "name": plan["name"]}
    with _LOCK:
        _JOBS[job] = state

    if not account.get("premium"):
        handler = register_nxm_handler()
        state["handler"] = handler

    def run() -> None:
        root = runtime_path("nexus", "collections", plan["domain"], plan["slug"])
        if not account.get("premium"):
            # Free accounts require a short-lived key issued by Nexus after the
            # user presses Slow Download. Avoid knowingly generating a burst of
            # unauthorized API calls; queue every pinned file for that handoff.
            state["waiting"] = list(missing)
            state["status"] = "waiting_for_links" if missing else "staged"
            state["path"] = root
            return
        state["status"] = "downloading"
        for item in missing:
            state["current"] = item
            try:
                path = _download(_domain(item.get("domain") or plan["domain"]), item["modId"], item["fileId"], root)
                item["path"] = path
                item["downloaded"] = True
                _remember_archive(item, path)
                state["done"] += 1
            except Exception as exc:
                message = str(exc)
                if not account.get("premium") and ("Premium" in message or "HTTP 403" in message):
                    state["waiting"].append(item)
                else:
                    state["failed"].append({**item, "error": message})
        state["current"] = None
        state["status"] = "waiting_for_links" if state["waiting"] else ("failed" if state["failed"] else "staged")
        state["path"] = root
        state["finishedAt"] = int(time.time())

    threading.Thread(target=run, name=f"nexus-{job[:8]}", daemon=True).start()
    return {"success": True, "job": job, "premium": bool(account.get("premium")),
            "count": len(plan["files"]), "cached": len(cached), "missing": len(missing)}


def job_state(job: str) -> Dict[str, Any]:
    _consume_nxm_queue(str(job))
    with _LOCK:
        state = _JOBS.get(str(job))
        return {"success": bool(state), "state": dict(state) if state else {},
                **({} if state else {"error": "Nexus job not found"})}


def _consume_nxm_queue(job: str) -> None:
    """Match one captured link to the collection and download off the poll path."""
    with _LOCK:
        state = _JOBS.get(job)
        if not state or state.get("_nxmBusy") or not state.get("waiting"):
            return
    _, queue, _ = _nxm_paths()
    try:
        with open(queue, "r+", encoding="utf-8", errors="replace") as handle:
            lines = [line.strip() for line in handle if line.strip()]
            handle.seek(0); handle.truncate()
    except OSError:
        return
    selected = None
    leftovers = []
    for line in lines:
        uri = line.split(" ", 1)[1] if " " in line else line
        try:
            parsed = urlparse(uri)
            match = re.fullmatch(r"/mods/(\d+)/files/(\d+)", parsed.path)
            wanted = next((x for x in state.get("waiting", []) if match and
                           x["modId"] == int(match.group(1)) and x["fileId"] == int(match.group(2)) and
                           _domain(x.get("domain") or state.get("domain")) == _domain(parsed.netloc)), None)
            if selected is None and wanted:
                selected = uri
            else:
                leftovers.append(line)
        except Exception:
            leftovers.append(line)
    if leftovers:
        try:
            with open(queue, "a", encoding="utf-8") as handle:
                handle.write("\n".join(leftovers) + "\n")
            chown_to_user(queue, recursive=False)
        except OSError:
            pass
    if not selected:
        return
    state["_nxmBusy"] = True

    def run() -> None:
        result = submit_nxm(job, selected)
        state["lastNxm"] = result
        state["_nxmBusy"] = False

    threading.Thread(target=run, name=f"nexus-nxm-{job[:8]}", daemon=True).start()


def submit_nxm(job: str, uri: str) -> Dict[str, Any]:
    try:
        parsed = urlparse(str(uri or "").strip())
        if parsed.scheme.lower() != "nxm":
            raise ValueError("Paste the nxm:// link from Nexus Slow Download")
        domain = _domain(parsed.netloc)
        match = re.fullmatch(r"/mods/(\d+)/files/(\d+)", parsed.path)
        query = parse_qs(parsed.query)
        if not match or not query.get("key") or not query.get("expires"):
            raise ValueError("Incomplete Nexus download link")
        with _LOCK:
            state = _JOBS.get(str(job))
        if not state:
            raise ValueError("Collection job not found")
        mod_id, file_id = map(int, match.groups())
        wanted = next((x for x in state.get("waiting", []) if x["modId"] == mod_id and x["fileId"] == file_id), None)
        if not wanted or domain != _domain(wanted.get("domain") or state.get("domain")):
            raise ValueError("That link is not for a pending file in this collection")
        root = runtime_path("nexus", "collections", domain, state["slug"])
        wanted["path"] = _download(domain, mod_id, file_id, root, query["key"][0], query["expires"][0])
        wanted["downloaded"] = True
        _remember_archive(wanted, wanted["path"])
        state["waiting"].remove(wanted)
        state["done"] += 1
        if not state["waiting"]:
            state["status"] = "failed" if state["failed"] else "staged"
        return {"success": True, "state": dict(state)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
