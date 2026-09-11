"""Keyless community manifest aggregation for SLSDeck.

The providers are queried independently and their usable material is merged into
one validated ZIP for the existing install pipeline.  This is intentionally an
SLSDeck-native implementation: no provider can end collection merely by
returning a partial Lua file.
"""

from __future__ import annotations

import io
import json
import re
import zipfile
from typing import Any, Callable, Dict, List, Set, Tuple

from . import smart_merge
from .config import USER_AGENT
from .logger import logger

_KEYS_URL = "https://raw.githubusercontent.com/fylsdy/ManifestHub/main/depotkeys.json"
_APPINFO_URL = "https://api.steamcmd.net/v1/info/{appid}"
_TRIONINE_MANIFEST = (
    "https://raw.githubusercontent.com/qwe213312/k25FCdfEOoEJ42S6/"
    "main/{depot}_{gid}.manifest"
)
_REVOBD_BUNDLE = "https://api.luagen.revobd.club/{appid}.zip"
_GITHUB_PROVIDERS = (
    ("ManifestHub", "steamtoolsapp/ManifestHub"),
    ("ManifestHub3", "steamtools-games/ManifestHub3"),
)

_MAX_RESPONSE_BYTES = 256 * 1024 * 1024
_MAX_ARCHIVE_MEMBERS = 4096
_MAX_MEMBER_BYTES = 64 * 1024 * 1024
_MAX_ARCHIVE_OUTPUT = 512 * 1024 * 1024
_LUA_NAME_RE = re.compile(r"(?:^|/)(\d+)\.lua$", re.IGNORECASE)
_MANIFEST_NAME_RE = re.compile(r"(?:^|/)(\d+)_(\d+)\.manifest$", re.IGNORECASE)


def _request(client, url: str, timeout: float):
    try:
        response = client.get(
            url,
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
            timeout=timeout,
        )
    except Exception as exc:
        return None, str(exc) or "request failed"
    if response.status_code != 200:
        return None, f"HTTP {response.status_code}"
    content = bytes(response.content or b"")
    if not content:
        return None, "empty response"
    if len(content) > _MAX_RESPONSE_BYTES:
        return None, "response exceeded safety limit"
    return content, ""


def _appinfo(client, appid: int) -> Dict[str, Any]:
    content, _ = _request(client, _APPINFO_URL.format(appid=appid), 20)
    if not content:
        return {}
    try:
        body = json.loads(content.decode("utf-8"))
        if body.get("status") != "success":
            return {}
        value = (body.get("data") or {}).get(str(appid))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def _depot_keys(client) -> Tuple[Dict[int, str], str]:
    content, error = _request(client, _KEYS_URL, 45)
    if not content:
        return {}, error
    try:
        value = json.loads(content.decode("utf-8"))
    except Exception as exc:
        return {}, f"invalid key database: {exc}"
    if not isinstance(value, dict):
        return {}, "invalid key database"
    result: Dict[int, str] = {}
    for depot, key in value.items():
        depot_id = smart_merge.positive_integer(depot)
        key_text = str(key or "").lower()
        if depot_id and re.fullmatch(r"[0-9a-f]{64}", key_text):
            result[depot_id] = key_text
    return result, "" if result else "key database contained no usable keys"


def _current_depots(info: Dict[str, Any]) -> Dict[int, str]:
    result: Dict[int, str] = {}
    depots = info.get("depots") if isinstance(info, dict) else None
    if not isinstance(depots, dict):
        return result
    for depot, entry in depots.items():
        depot_id = smart_merge.positive_integer(depot)
        manifests = entry.get("manifests") if isinstance(entry, dict) else None
        public = manifests.get("public") if isinstance(manifests, dict) else None
        gid = smart_merge.normalize_decimal(public.get("gid")) if isinstance(public, dict) else None
        if depot_id and gid:
            result[depot_id] = gid
    return result


def _lua_from_trionine(appid: int, current: Dict[int, str], keys: Dict[int, str],
                        info: Dict[str, Any]) -> str:
    lines = [f"addappid({appid})"]
    for depot in sorted(current):
        key = keys.get(depot)
        if not key:
            continue
        lines.append(f'addappid({depot}, 1, "{key}")')
        lines.append(f'setManifestid({depot}, "{current[depot]}")')
    extended = info.get("extended") if isinstance(info, dict) else None
    for value in re.split(r"[,;\s]+", str((extended or {}).get("listofdlc") or "")):
        dlc = smart_merge.positive_integer(value)
        if dlc and dlc != appid and dlc not in current:
            lines.append(f"addappid({dlc})")
    return "\n".join(lines) + "\n"


def _safe_zip_material(data: bytes, appid: int) -> Tuple[List[str], List[Tuple[str, bytes]], str]:
    luas: List[str] = []
    manifests: List[Tuple[str, bytes]] = []
    expanded = 0
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            members = archive.infolist()
            if len(members) > _MAX_ARCHIVE_MEMBERS:
                return [], [], "archive contained too many files"
            for member in members:
                if member.is_dir():
                    continue
                expanded += int(member.file_size or 0)
                if member.file_size > _MAX_MEMBER_BYTES or expanded > _MAX_ARCHIVE_OUTPUT:
                    return [], [], "archive exceeded extraction safety limit"
                lua_match = _LUA_NAME_RE.search(member.filename.replace("\\", "/"))
                manifest_match = _MANIFEST_NAME_RE.search(member.filename.replace("\\", "/"))
                if not lua_match and not manifest_match:
                    continue
                content = archive.read(member)
                if lua_match and int(lua_match.group(1)) == appid:
                    text = content.decode("utf-8", errors="ignore")
                    parsed = smart_merge.parse_lua(text)
                    if appid in parsed["bare"] or appid in parsed["keys"]:
                        luas.append(text)
                elif manifest_match:
                    depot, gid = int(manifest_match.group(1)), manifest_match.group(2)
                    metadata, _ = smart_merge.parse_manifest(content, depot, gid)
                    if metadata:
                        manifests.append((f"{depot}_{gid}.manifest", content))
    except (zipfile.BadZipFile, OSError, RuntimeError) as exc:
        return [], [], f"invalid ZIP: {exc}"
    return luas, manifests, "" if luas else "bundle contained no usable game Lua"


def _fetch_manifest(client, url: str, depot: int, gid: str) -> Tuple[bytes | None, str]:
    content, error = _request(client, url, 20)
    if not content:
        return None, error
    metadata, validation_error = smart_merge.parse_manifest(content, depot, gid)
    if not metadata:
        return None, f"invalid manifest: {validation_error}"
    return content, ""


def build_bundle(appid: int, destination: str, client,
                 cancelled: Callable[[], bool] | None = None) -> Dict[str, Any]:
    """Collect every free provider and write one validated smart-merge bundle."""
    appid = int(appid)
    is_cancelled = cancelled or (lambda: False)
    sources: List[Dict[str, Any]] = []
    manifests: Dict[str, bytes] = {}
    failures: Dict[str, str] = {}
    info = _appinfo(client, appid)
    current = _current_depots(info)

    if is_cancelled():
        return {"success": False, "cancelled": True, "failures": failures}

    keys, key_error = _depot_keys(client)
    trionine_lua = _lua_from_trionine(appid, current, keys, info)
    trionine_parsed = smart_merge.parse_lua(trionine_lua)
    if trionine_parsed["keys"]:
        sources.append({"name": "trionine ManifestHub", "priority": 0, "index": 0,
                        "lua_text": trionine_lua, "parsed": trionine_parsed,
                        "exact_current": {depot: True for depot in trionine_parsed["keys"]
                                          if depot in current}})
        for depot, gid in current.items():
            if depot not in trionine_parsed["keys"] or is_cancelled():
                continue
            url = _TRIONINE_MANIFEST.format(depot=depot, gid=gid)
            content, _ = _fetch_manifest(client, url, depot, gid)
            if content:
                manifests[f"{depot}_{gid}.manifest"] = content
    else:
        failures["trionine ManifestHub"] = key_error or "no matching depot keys"

    if is_cancelled():
        return {"success": False, "cancelled": True, "failures": failures}

    revobd, revobd_error = _request(client, _REVOBD_BUNDLE.format(appid=appid), 45)
    if revobd:
        luas, bundled_manifests, archive_error = _safe_zip_material(revobd, appid)
        for text in luas:
            parsed = smart_merge.parse_lua(text)
            sources.append({"name": "revobd", "priority": 1, "index": len(sources),
                            "lua_text": text, "parsed": parsed,
                            "exact_current": {depot: True for depot, gid in parsed["manifests"].items()
                                              if current.get(depot) == gid}})
        for name, content in bundled_manifests:
            manifests.setdefault(name, content)
        if archive_error:
            failures["revobd"] = archive_error
    else:
        failures["revobd"] = revobd_error

    for priority, (label, repository) in enumerate(_GITHUB_PROVIDERS, start=2):
        if is_cancelled():
            return {"success": False, "cancelled": True, "failures": failures}
        lua_url = f"https://raw.githubusercontent.com/{repository}/{appid}/{appid}.lua"
        lua_bytes, lua_error = _request(client, lua_url, 25)
        if not lua_bytes:
            failures[label] = lua_error
            continue
        text = lua_bytes.decode("utf-8", errors="ignore")
        parsed = smart_merge.parse_lua(text)
        if appid not in parsed["bare"] and appid not in parsed["keys"]:
            failures[label] = "Lua did not declare the requested app"
            continue
        if not parsed["keys"]:
            failures[label] = "Lua contained no depot keys"
            continue
        sources.append({"name": label, "priority": priority, "index": len(sources),
                        "lua_text": text, "parsed": parsed,
                        "exact_current": {depot: True for depot, gid in parsed["manifests"].items()
                                          if current.get(depot) == gid}})
        for depot, gid in parsed["manifests"].items():
            name = f"{depot}_{gid}.manifest"
            if name in manifests or is_cancelled():
                continue
            url = f"https://raw.githubusercontent.com/{repository}/{appid}/{name}"
            content, _ = _fetch_manifest(client, url, depot, gid)
            if content:
                manifests[name] = content

    merged, merge_error = smart_merge.merge_sources(appid, sources, current)
    if not merged or not merged.get("keys"):
        return {"success": False, "failures": failures,
                "error": merge_error or "free providers returned no depot keys"}

    # Preserve validated manifest pins in the aggregate Lua. smart_merge uses
    # these as references while the matching binary files determine what is
    # actually published.
    lua_text = smart_merge.emit_lua(appid, merged).rstrip("\n")
    pins: Dict[int, str] = {}
    for source in sources:
        for depot, gid in source["parsed"]["manifests"].items():
            if f"{depot}_{gid}.manifest" in manifests and depot not in pins:
                pins[depot] = gid
    for depot in sorted(pins):
        lua_text += f'\nsetManifestid({depot}, "{pins[depot]}")'
    lua_text += "\n"

    try:
        with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(f"{appid}.lua", lua_text)
            for name in sorted(manifests):
                archive.writestr(name, manifests[name])
    except Exception as exc:
        return {"success": False, "failures": failures, "error": str(exc)}

    contributors = [str(source["name"]) for source in sources]
    logger.log(
        f"SLSDeck: free providers collected {len(merged['keys'])} key(s) and "
        f"{len(manifests)} manifest(s) for {appid} from {', '.join(contributors)}")
    return {"success": True, "failures": failures, "contributors": contributors,
            "keys": len(merged["keys"]), "manifests": len(manifests)}
