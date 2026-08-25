"""SLSDeck-managed Ubisoft care packages for Tokeer's second activation step."""
from __future__ import annotations

import hashlib
import json
import os
import pwd
import shutil
import tempfile
import time
import zipfile
from typing import Any, Dict, List

from .httpc import ensure_http_client
from .paths import get_user_home
from . import steam


ASSET_NAME = "ubisoft-packages.zip"
ASSET_URL = "https://github.com/Kaal31/slsdeck/releases/download/tokeer-automation-latest/ubisoft-packages.zip"
RELEASE_API = "https://api.github.com/repos/Kaal31/slsdeck/releases/tags/tokeer-automation-latest"
VERSION_FILE = ".asset-version"


def _home() -> str:
    return get_user_home()


def _install_root() -> str:
    return os.path.join(_home(), ".tokeer", "ubisoft-packages")


def _bundled_manifest() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets",
                                        "ubisoft-packages", "hostedgames.json"))


def _manifest_path() -> str:
    installed = os.path.join(_install_root(), "hostedgames.json")
    return installed if os.path.isfile(installed) else _bundled_manifest()


def _load_manifest() -> Dict[str, Any]:
    with open(_manifest_path(), "r", encoding="utf-8") as handle:
        value = json.load(handle)
    if int(value.get("schemaVersion") or 0) != 1 or not isinstance(value.get("games"), list):
        raise RuntimeError("The Ubisoft hosted-games manifest is invalid.")
    return value


def hosted_games() -> Dict[str, Any]:
    try:
        manifest = _load_manifest()
        return {"success": True, "schemaVersion": manifest["schemaVersion"],
                "games": manifest["games"], "installed": package_status().get("installed", False)}
    except Exception as exc:
        return {"success": False, "games": [], "error": str(exc)}


def _game(appid: int) -> Dict[str, Any] | None:
    wanted = int(appid or 0)
    for game in _load_manifest()["games"]:
        if int(game.get("steamAppId") or 0) == wanted:
            return game
    return None


def _release_asset() -> tuple[str, str]:
    try:
        client = ensure_http_client("ubisoft-packages: release")
        response = client.get(RELEASE_API, headers={"Accept": "application/vnd.github+json",
                                                    "User-Agent": "SLSDeck-Ubisoft-Packages/1.0"},
                              follow_redirects=True, timeout=60)
        response.raise_for_status()
        for asset in response.json().get("assets") or []:
            if str(asset.get("name") or "") == ASSET_NAME:
                version = f"{asset.get('updated_at') or ''}:{asset.get('size') or 0}"
                return version, str(asset.get("browser_download_url") or ASSET_URL)
    except Exception:
        pass
    return "", ASSET_URL


def _installed_version() -> str:
    try:
        with open(os.path.join(_install_root(), VERSION_FILE), "r", encoding="utf-8") as handle:
            return handle.read().strip()
    except OSError:
        return ""


def _complete(root: str | None = None) -> bool:
    base = root or _install_root()
    try:
        manifest_path = os.path.join(base, "hostedgames.json")
        with open(manifest_path, "r", encoding="utf-8") as handle:
            manifest = json.load(handle)
        return bool(manifest.get("games")) and all(
            os.path.isdir(os.path.join(base, str(game["steamAppId"])))
            and any(os.path.isfile(os.path.join(path, filename))
                    for path, _dirs, files in os.walk(os.path.join(base, str(game["steamAppId"])))
                    for filename in files)
            for game in manifest["games"]
        )
    except Exception:
        return False


def package_status() -> Dict[str, Any]:
    root = _install_root()
    complete = _complete(root)
    return {"success": True, "installed": complete, "healthy": complete,
            "path": root, "version": _installed_version(), "asset": ASSET_NAME}


def _safe_extract(archive: zipfile.ZipFile, destination: str) -> None:
    base = os.path.abspath(destination)
    for member in archive.infolist():
        target = os.path.abspath(os.path.join(base, member.filename))
        if not (target == base or target.startswith(base + os.sep)):
            raise RuntimeError("Unsafe path in Ubisoft package dependency.")
    archive.extractall(destination)


def _chown_tree(path: str) -> None:
    try:
        owner = os.stat(_home()).st_uid
        group = pwd.getpwuid(owner).pw_gid
        for root, dirs, files in os.walk(path):
            os.chown(root, owner, group)
            for name in dirs + files:
                os.chown(os.path.join(root, name), owner, group)
    except Exception:
        pass


def ensure_packages(force: bool = False) -> Dict[str, Any]:
    root = _install_root()
    version, url = _release_asset()
    installed_version = _installed_version()
    if not force and _complete(root) and (not version or version == installed_version):
        return {**package_status(), "updated": False, "skipped": True,
                "latest": version or None}
    try:
        client = ensure_http_client("ubisoft-packages: asset")
        with tempfile.TemporaryDirectory(prefix="slsdeck-ubisoft-dependency-") as temporary:
            archive_path = os.path.join(temporary, ASSET_NAME)
            with client.stream("GET", url, follow_redirects=True, timeout=None) as response:
                response.raise_for_status()
                with open(archive_path, "wb") as output:
                    for chunk in response.iter_bytes(1 << 20):
                        if chunk:
                            output.write(chunk)
            expanded = os.path.join(temporary, "expanded")
            os.makedirs(expanded)
            with zipfile.ZipFile(archive_path) as archive:
                _safe_extract(archive, expanded)
            staged = os.path.join(expanded, "ubisoft-packages")
            if not _complete(staged):
                raise RuntimeError("The Ubisoft package dependency is incomplete.")
            with open(os.path.join(staged, VERSION_FILE), "w", encoding="utf-8") as handle:
                handle.write((version or hashlib.sha256(open(archive_path, "rb").read()).hexdigest()) + "\n")
            os.makedirs(os.path.dirname(root), exist_ok=True)
            previous = root + ".old"
            if os.path.lexists(previous):
                shutil.rmtree(previous)
            if os.path.lexists(root):
                os.replace(root, previous)
            os.replace(staged, root)
            _chown_tree(root)
            if os.path.isdir(previous):
                shutil.rmtree(previous)
        return {**package_status(), "updated": True, "skipped": False,
                "latest": version or None}
    except Exception as exc:
        previous = root + ".old"
        try:
            if not os.path.lexists(root) and os.path.isdir(previous):
                os.replace(previous, root)
        except OSError:
            pass
        return {"success": False, "installed": _complete(root), "path": root,
                "asset": ASSET_NAME, "error": str(exc)}


def apply_package(appid: int) -> Dict[str, Any]:
    try:
        appid = int(appid)
        game = _game(appid)
        if not game:
            return {"success": False, "error": "This Ubisoft game is not in hostedgames.json."}
        ensured = ensure_packages()
        if not ensured.get("success"):
            return ensured
        found = steam.get_game_install_path_response(appid)
        install_path = os.path.realpath(str(found.get("installPath") or ""))
        if not found.get("success") or not os.path.isdir(install_path):
            return {"success": False, "error": "The selected Ubisoft game is not installed."}
        source = os.path.join(_install_root(), str(appid))
        copied = []
        for root, _dirs, files in os.walk(source):
            for name in files:
                src = os.path.join(root, name)
                relative = os.path.relpath(src, source)
                dst = os.path.realpath(os.path.join(install_path, relative))
                if not (dst == install_path or dst.startswith(install_path + os.sep)):
                    raise RuntimeError("Unsafe care-package destination.")
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                staged = dst + ".slsdeck-new"
                shutil.copy2(src, staged)
                os.replace(staged, dst)
                copied.append(relative)
        applied_at = int(time.time() * 1000)
        for relative in copied:
            try:
                path = os.path.join(install_path, relative)
                owner = os.stat(_home()).st_uid
                os.chown(path, owner, pwd.getpwuid(owner).pw_gid)
            except Exception:
                pass
        token_dir = os.path.realpath(os.path.join(install_path, game.get("tokenDirectory") or "."))
        return {"success": True, "appid": appid, "name": game["name"],
                "installPath": install_path, "tokenDirectory": token_dir,
                "tokenRequestIds": game["tokenRequestIds"], "copied": copied,
                "appliedAt": applied_at}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _token_search_roots(appid: int, game: Dict[str, Any], install_path: str,
                        library_path: str = "") -> List[str]:
    roots = [os.path.join(install_path, game.get("tokenDirectory") or ".")]
    home = _home()
    steam_roots = [library_path, os.path.join(home, ".local", "share", "Steam"),
                   os.path.join(home, ".steam", "steam")]
    for steam_root in steam_roots:
        if not steam_root:
            continue
        prefix = os.path.join(steam_root, "steamapps", "compatdata", str(appid), "pfx", "drive_c", "users")
        if not os.path.isdir(prefix):
            continue
        for user in os.listdir(prefix):
            profile = os.path.join(prefix, user)
            roots.extend([profile, os.path.join(profile, "Desktop"),
                          os.path.join(profile, "OneDrive", "Desktop"),
                          os.path.join(profile, "AppData", "Local", "Temp")])
    result, seen = [], set()
    for root in roots:
        real = os.path.realpath(root)
        if real not in seen and os.path.isdir(real):
            seen.add(real)
            result.append(real)
    return result


def find_token_request(appid: int, since_ms: int = 0) -> Dict[str, Any]:
    try:
        appid = int(appid)
        game = _game(appid)
        if not game:
            return {"success": False, "error": "This Ubisoft game is not hosted."}
        found = steam.get_game_install_path_response(appid)
        install_path = os.path.realpath(str(found.get("installPath") or ""))
        candidates = []
        names = {f"token_req_{int(value)}.txt" for value in game["tokenRequestIds"]}
        for root in _token_search_roots(appid, game, install_path,
                                        str(found.get("libraryPath") or "")):
            for name in names:
                path = os.path.join(root, name)
                try:
                    stat = os.stat(path)
                    if stat.st_mtime * 1000 >= int(since_ms or 0) and 16 <= stat.st_size <= 10 * 1024 * 1024:
                        candidates.append((stat.st_mtime, path, stat.st_size))
                except OSError:
                    pass
        if not candidates:
            return {"success": False, "found": False, "tokenRequestIds": game["tokenRequestIds"],
                    "error": "No fresh Ubisoft token request file was found yet."}
        _mtime, path, size = max(candidates)
        return {"success": True, "found": True, "path": path,
                "filename": os.path.basename(path), "directory": os.path.dirname(path),
                "size": size, "tokenRequestIds": game["tokenRequestIds"]}
    except Exception as exc:
        return {"success": False, "found": False, "error": str(exc)}


def install_dbdata(appid: int, token_path: str, url: str) -> Dict[str, Any]:
    try:
        appid = int(appid)
        game = _game(appid)
        if not game:
            return {"success": False, "error": "This Ubisoft game is not hosted."}
        if not (url.startswith("https://cdn.discordapp.com/attachments/") or
                url.startswith("https://media.discordapp.net/attachments/")):
            return {"success": False, "error": "Discord returned an untrusted dbdata URL."}
        token = os.path.realpath(token_path)
        found = find_token_request(appid, 0)
        if not found.get("success") or os.path.realpath(str(found.get("path") or "")) != token:
            return {"success": False, "error": "The token request path no longer matches this hosted game."}
        client = ensure_http_client("ubisoft-packages: dbdata.json")
        response = client.get(url, follow_redirects=True, timeout=120)
        response.raise_for_status()
        if len(response.content) > 10 * 1024 * 1024:
            raise RuntimeError("Discord dbdata response is unexpectedly large.")
        payload = json.loads(response.content.decode("utf-8-sig"))
        if not isinstance(payload, dict) or not str(payload.get("DenuvoToken") or "").strip():
            raise RuntimeError("Discord response is not a valid dbdata.json with a DenuvoToken.")
        destination = os.path.join(os.path.dirname(token), "dbdata.json")
        staged = destination + ".slsdeck-new"
        with open(staged, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
        os.replace(staged, destination)
        try:
            owner = os.stat(_home()).st_uid
            os.chown(destination, owner, pwd.getpwuid(owner).pw_gid)
        except Exception:
            pass
        return {"success": True, "path": destination, "directory": os.path.dirname(token)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}
