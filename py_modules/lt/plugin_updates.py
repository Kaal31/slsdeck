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
_RELEASES_API = f"https://api.github.com/repos/{REPO}/releases?per_page=50"
_BUILD_TAG = re.compile(rf"^{re.escape(CHANNEL)}-build-(\d+)$")


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


def prepare_replacement(target_version: str, asset_url: str) -> Dict[str, Any]:
    """Arm one imminent Decky replacement without trusting arbitrary URLs."""
    expected_prefix = f"https://github.com/{REPO}/releases/download/"
    asset_name = posixpath.basename(urlparse(asset_url).path)
    if (not asset_url.startswith(expected_prefix)
            or not asset_name.startswith("SLSDeckUniversal-")
            or not asset_name.endswith(".zip")):
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


def list_releases() -> Dict[str, Any]:
    """Return immutable update-system builds, newest first."""
    client = ensure_http_client("plugin-updates")
    try:
        response = client.get(
            _RELEASES_API,
            headers={"Accept": "application/vnd.github+json", "User-Agent": "SLSDeck/updater"},
            timeout=20,
            follow_redirects=True,
        )
        if response.status_code != 200:
            return {"success": False, "error": f"GitHub HTTP {response.status_code}", "releases": []}
        raw = response.json()
    except Exception as exc:
        return {"success": False, "error": str(exc), "releases": []}

    releases: List[Dict[str, Any]] = []
    for release in raw if isinstance(raw, list) else []:
        tag = str(release.get("tag_name") or "")
        match = _BUILD_TAG.match(tag)
        if not match:
            continue
        run_number = int(match.group(1))
        zip_asset = next(
            (asset for asset in (release.get("assets") or [])
             if str(asset.get("name") or "").endswith(".zip")
             and "ubisoft-packages" not in str(asset.get("name") or "")),
            None,
        )
        if not zip_asset or not zip_asset.get("browser_download_url"):
            continue
        releases.append({
            "tag": tag,
            "version": _version_for(run_number, str(release.get("name") or "")),
            "runNumber": run_number,
            "assetUrl": str(zip_asset["browser_download_url"]),
            "releaseUrl": str(release.get("html_url") or ""),
            "publishedAt": str(release.get("published_at") or ""),
            "size": int(zip_asset.get("size") or 0),
        })
    releases.sort(key=lambda item: item["runNumber"], reverse=True)
    return {"success": True, "releases": releases}


def status() -> Dict[str, Any]:
    result = list_releases()
    releases = result.get("releases") or []
    current_build = _current_build()
    latest = releases[0] if releases else None
    return {
        **result,
        "channel": CHANNEL,
        "currentVersion": _current_version(),
        "currentBuild": current_build,
        "latest": latest,
        "updateAvailable": bool(latest and int(latest["runNumber"]) > current_build),
    }
