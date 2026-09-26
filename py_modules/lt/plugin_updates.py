"""Decky-native plugin update/downgrade support.

The replacement marker is deliberately stored in Decky's settings directory,
outside the plugin directory that Decky replaces.  Decky invokes ``_uninstall``
while installing another version; a fresh, explicitly armed marker tells that
callback to stop live workers but preserve managed dependencies and user data.
"""

from __future__ import annotations

import json
import os
import posixpath
import re
import time
from urllib.parse import urlparse
from typing import Any, Dict, List

from .httpc import ensure_http_client
from .logger import logger
from .paths import get_plugin_dir, get_settings_dir

REPO = "Kaal31/slsdeck"
CHANNEL = "update-system"
MARKER_TTL_SECONDS = 5 * 60
_MARKER_NAME = "decky-replacement.json"
_RELEASES_API = f"https://api.github.com/repos/{REPO}/releases?per_page=100"
_RELEASES_ATOM = f"https://github.com/{REPO}/releases.atom"
_RELEASES_CACHE_NAME = "plugin-releases-cache.json"
_BUILD_TAG = re.compile(rf"^{re.escape(CHANNEL)}-build-(\d+)$")
_VERSION_TAG = re.compile(rf"^{re.escape(CHANNEL)}-v(\d+\.\d+\.\d+)$")
_ROLLING_TAG = re.compile(r"^([a-z0-9][a-z0-9._-]*)-latest$")
_SEMVER = re.compile(r"(?<!\d)(\d+)\.(\d+)\.(\d+)(?![\d.-])")


def _marker_path() -> str:
    return os.path.join(get_settings_dir(), _MARKER_NAME)


def _read_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            value = json.load(handle)
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}


def _current_version() -> str:
    return str(_read_json(os.path.join(get_plugin_dir(), "plugin.json")).get("version") or "")


def _current_build() -> int:
    build = _read_json(os.path.join(get_plugin_dir(), "build.json"))
    if str(build.get("channel") or "") == CHANNEL:
        try:
            return int(build.get("runNumber") or 0)
        except (TypeError, ValueError):
            pass
    match = re.search(rf"-{re.escape(CHANNEL)}\.(\d+)$", _current_version())
    return int(match.group(1)) if match else 0


def _current_channel() -> str:
    build = _read_json(os.path.join(get_plugin_dir(), "build.json"))
    channel = str(build.get("channel") or "").strip()
    if channel:
        return channel
    match = re.search(r"-([a-z0-9][a-z0-9._-]*)\.\d+$", _current_version())
    return match.group(1) if match else "unknown"


def prepare_replacement(target_version: str, asset_url: str) -> Dict[str, Any]:
    """Arm one imminent Decky replacement without trusting arbitrary URLs."""
    expected_prefix = f"https://github.com/{REPO}/releases/download/"
    parsed = urlparse(asset_url)
    asset_name = posixpath.basename(parsed.path)
    parts = parsed.path.split("/")
    try:
        tag = parts[parts.index("download") + 1]
    except (ValueError, IndexError):
        tag = ""
    build_match = _BUILD_TAG.match(tag)
    version_match = _VERSION_TAG.match(tag)
    rolling_match = _ROLLING_TAG.match(tag)
    allowed_tag = bool(build_match or version_match or rolling_match)
    expected_asset = (
        f"SLSDeckUniversal-{CHANNEL}-{build_match.group(1)}.zip" if build_match
        else f"SLSDeckUniversal-{CHANNEL}-{version_match.group(1)}.zip" if version_match
        else f"SLSDeckUniversal-{rolling_match.group(1)}.zip" if rolling_match
        else ""
    )
    if (not asset_url.startswith(expected_prefix)
            or not allowed_tag
            or asset_name != expected_asset):
        return {"success": False, "error": "Refusing an untrusted plugin package URL."}
    marker = {
        "schema": 1,
        "createdAt": time.time(),
        "targetVersion": str(target_version or ""),
        "assetUrl": asset_url,
    }
    path = _marker_path()
    tmp = path + ".tmp"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump(marker, handle, indent=2)
        os.chmod(tmp, 0o600)
        os.replace(tmp, path)
        return {"success": True, "expiresIn": MARKER_TTL_SECONDS}
    except Exception as exc:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass
        return {"success": False, "error": str(exc)}


def replacement_pending() -> bool:
    marker = _read_json(_marker_path())
    try:
        age = time.time() - float(marker.get("createdAt") or 0)
    except (TypeError, ValueError):
        age = MARKER_TTL_SECONDS + 1
    valid = marker.get("schema") == 1 and 0 <= age <= MARKER_TTL_SECONDS
    if not valid and marker:
        clear_replacement_marker("expired")
    return bool(valid)


def clear_replacement_marker(reason: str = "completed") -> None:
    path = _marker_path()
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.log(f"SLSDeck updater: cleared replacement marker ({reason})")
    except OSError as exc:
        logger.warn(f"SLSDeck updater: could not clear replacement marker: {exc}")


def _version_for(run_number: int, release_name: str = "") -> str:
    match = re.search(r"(\d+\.\d+\.\d+-update-system\.\d+)", release_name)
    if match:
        return match.group(1)
    base = _current_version().split("-", 1)[0] or "0.0.0"
    return f"{base}-{CHANNEL}.{run_number}"


def _rolling_version_for(channel: str, release_name: str) -> tuple[str, int]:
    match = re.search(
        rf"(\d+\.\d+\.\d+-{re.escape(channel)}\.(\d+))",
        release_name,
    )
    if match:
        return match.group(1), int(match.group(2))
    semver = _SEMVER.search(release_name)
    return (".".join(semver.groups()), 0) if semver else (f"{channel} (rolling latest)", 0)


def _version_key(version: str) -> tuple[int, int, int]:
    match = _SEMVER.search(str(version or ""))
    return tuple(map(int, match.groups())) if match else (0, 0, 0)


def _plain_changelog(value: str) -> str:
    text = str(value or "")
    text = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "- ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = (text.replace("&amp;", "&").replace("&quot;", '"')
            .replace("&apos;", "'").replace("&#39;", "'")
            .replace("&lt;", "<").replace("&gt;", ">"))
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _normalise_releases(raw: List[Dict[str, Any]]) -> Dict[str, Any]:
    releases: List[Dict[str, Any]] = []
    for release in raw:
        tag = str(release.get("tag_name") or "")
        build_match = _BUILD_TAG.match(tag)
        version_match = _VERSION_TAG.match(tag)
        rolling_match = _ROLLING_TAG.match(tag)
        if not build_match and not version_match and not rolling_match:
            continue
        channel = CHANNEL if (build_match or version_match) else str(rolling_match.group(1))
        release_name = str(release.get("name") or "")
        rolling_version, rolling_run = _rolling_version_for(channel, release_name)
        run_number = int(build_match.group(1)) if build_match else rolling_run
        expected_asset = (f"SLSDeckUniversal-{CHANNEL}-{version_match.group(1)}.zip" if version_match
                          else f"SLSDeckUniversal-{CHANNEL}-{run_number}.zip" if build_match
                          else f"SLSDeckUniversal-{channel}.zip")
        zip_asset = next(
            (asset for asset in (release.get("assets") or [])
             if str(asset.get("name") or "") == expected_asset),
            None,
        )
        if not zip_asset or not zip_asset.get("browser_download_url"):
            continue
        releases.append({
            "tag": tag,
            "channel": channel,
            "rolling": bool(rolling_match),
            "immutable": bool(build_match or version_match),
            "version": (version_match.group(1) if version_match else
                        _version_for(run_number, release_name) if build_match else rolling_version),
            "runNumber": run_number,
            "assetUrl": str(zip_asset["browser_download_url"]),
            "releaseUrl": str(release.get("html_url") or ""),
            "publishedAt": str(release.get("published_at") or ""),
            "size": int(zip_asset.get("size") or 0),
            "changelog": _plain_changelog(str(release.get("body") or "")),
        })
    releases.sort(key=lambda item: (
        item["channel"] != CHANNEL,
        not item["rolling"],
        tuple(-part for part in _version_key(item["version"])),
        -item["runNumber"],
        item["channel"],
    ))
    channels = sorted({str(item["channel"]) for item in releases},
                      key=lambda value: (value != CHANNEL, value))
    return {"success": True, "releases": releases, "channels": channels}


def _atom_releases(payload: str) -> List[Dict[str, Any]]:
    """Convert GitHub's public feed without XML modules blocked by Decky."""
    def value(block: str, tag: str) -> str:
        match = re.search(rf"<{tag}(?:\s[^>]*)?>(.*?)</{tag}>", block,
                          flags=re.IGNORECASE | re.DOTALL)
        if not match:
            return ""
        return (match.group(1).strip()
                .replace("&amp;", "&").replace("&quot;", '"')
                .replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">"))

    releases: List[Dict[str, Any]] = []
    entries = re.findall(r"<entry(?:\s[^>]*)?>(.*?)</entry>", payload,
                         flags=re.IGNORECASE | re.DOTALL)
    for entry in entries:
        link = re.search(
            r"<link\b(?=[^>]*\brel=[\"']alternate[\"'])[^>]*\bhref=[\"']([^\"']+)[\"'][^>]*/?>",
            entry, flags=re.IGNORECASE,
        )
        release_url = (link.group(1).replace("&amp;", "&") if link else "")
        tag = release_url.rstrip("/").rsplit("/", 1)[-1]
        build_match = _BUILD_TAG.match(tag)
        version_match = _VERSION_TAG.match(tag)
        rolling_match = _ROLLING_TAG.match(tag)
        if not build_match and not version_match and not rolling_match:
            continue
        channel = CHANNEL if (build_match or version_match) else str(rolling_match.group(1))
        run_number = int(build_match.group(1)) if build_match else 0
        asset_name = (f"SLSDeckUniversal-{CHANNEL}-{version_match.group(1)}.zip" if version_match
                      else f"SLSDeckUniversal-{CHANNEL}-{run_number}.zip" if build_match
                      else f"SLSDeckUniversal-{channel}.zip")
        asset_url = f"https://github.com/{REPO}/releases/download/{tag}/{asset_name}"
        releases.append({
            "tag_name": tag,
            "name": value(entry, "title"),
            "html_url": release_url,
            "published_at": value(entry, "updated"),
            "body": value(entry, "content"),
            "assets": [{"name": asset_name, "browser_download_url": asset_url, "size": 0}],
        })
    return releases


def _cache_path() -> str:
    return os.path.join(get_settings_dir(), _RELEASES_CACHE_NAME)


def _save_release_cache(result: Dict[str, Any]) -> None:
    path = _cache_path()
    tmp = path + ".tmp"
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(tmp, "w", encoding="utf-8") as handle:
            json.dump({**result, "cachedAt": time.time()}, handle)
        os.replace(tmp, path)
    except Exception as exc:
        logger.warn(f"SLSDeck updater: could not save release cache: {exc}")


def list_releases() -> Dict[str, Any]:
    """Return releases, bypassing REST rate limits via Atom and a local cache."""
    client = ensure_http_client("plugin-updates")
    api_error = ""
    try:
        response = client.get(
            _RELEASES_API,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "SLSDeck/updater"},
            timeout=20,
            follow_redirects=True,
        )
        if response.status_code == 200:
            raw = response.json()
            result = _normalise_releases(raw if isinstance(raw, list) else [])
            _save_release_cache(result)
            return result
        api_error = f"GitHub API HTTP {response.status_code}"
    except Exception as exc:
        api_error = str(exc)

    try:
        response = client.get(
            _RELEASES_ATOM,
            headers={"Accept": "application/atom+xml", "User-Agent": "SLSDeck/updater"},
            timeout=20,
            follow_redirects=True,
        )
        if response.status_code == 200:
            payload = response.text if isinstance(response.text, str) else response.content.decode("utf-8")
            result = _normalise_releases(_atom_releases(payload))
            result["source"] = "public-feed"
            _save_release_cache(result)
            return result
        feed_error = f"GitHub feed HTTP {response.status_code}"
    except Exception as exc:
        feed_error = str(exc)

    cached = _read_json(_cache_path())
    if isinstance(cached.get("releases"), list):
        cached.update({"success": True, "source": "cache", "warning": f"{api_error}; {feed_error}"})
        return cached
    return {"success": False, "error": f"{api_error}; {feed_error}", "releases": [], "channels": []}


def status() -> Dict[str, Any]:
    result = list_releases()
    releases = result.get("releases") or []
    current_build = _current_build()
    current_channel = _current_channel()
    current_rolling = [item for item in releases
                       if item.get("channel") == current_channel and item.get("rolling")]
    immutable = [item for item in releases
                 if item.get("channel") == CHANNEL and item.get("immutable")]
    latest = current_rolling[0] if current_rolling else (immutable[0] if immutable else None)
    return {
        **result,
        "channel": CHANNEL,
        "currentChannel": current_channel,
        "currentVersion": _current_version(),
        "currentBuild": current_build,
        "latest": latest,
        "updateAvailable": bool(latest and (
            _version_key(str(latest.get("version") or "")) > _version_key(_current_version())
            if _version_key(str(latest.get("version") or "")) != (0, 0, 0)
            else int(latest["runNumber"]) > current_build
        )),
    }
