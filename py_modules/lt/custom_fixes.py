"""User-imported custom fixes and manifests, bound to a specific game.

Storage (persistent — under $HOME, survives plugin updates/reinstalls):
  ~/.local/share/SLSDeck/custom_fixes/<appid>/<file>      crack / online-fix
      archives, loose .dll/.exe
  ~/.local/share/SLSDeck/custom_manifests/<appid>/<file>  .lua / .manifest
      ownership + build files

A custom FIX is applied through the normal fix pipeline (extract → stash
originals → fix-log), so it shows in the game's Applied-fixes list and is
removable via Un-fix / tap, exactly like a Ryuu/luatools fix. A custom MANIFEST
(.lua) is also copied into SLSsteam's stplug-in dir so the engine reads it.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import time
import zipfile
from typing import Any, Dict, List

from .logger import logger
from .paths import get_user_home
from . import hvauto
from . import fixes as _fixes

_ARCHIVE_EXTS = (".zip", ".rar", ".7z", ".7z.001")
_BIN_EXTS = (".dll", ".exe")
_MANIFEST_EXTS = (".lua", ".manifest")


# ── storage roots ────────────────────────────────────────────────────────────
def _root() -> str:
    return os.path.join(get_user_home(), ".local", "share", "SLSDeck")


def custom_fixes_root() -> str:
    return os.path.join(_root(), "custom_fixes")


def custom_manifests_root() -> str:
    return os.path.join(_root(), "custom_manifests")


def _base_for(kind: str) -> str:
    return custom_manifests_root() if kind == "manifest" else custom_fixes_root()


def _dir_for(kind: str, appid: int) -> str:
    d = os.path.join(_base_for(kind), str(int(appid)))
    os.makedirs(d, exist_ok=True)
    return d


# ── type detection (fix vs manifest/lua) ─────────────────────────────────────
def _list_archive_names(path: str) -> List[str]:
    low = path.lower()
    if low.endswith(".zip"):
        try:
            with zipfile.ZipFile(path) as z:
                return z.namelist()
        except Exception:
            return []
    for exe in ("7zz", "7z", "7za"):
        if shutil.which(exe):
            try:
                r = subprocess.run([exe, "l", "-slt", path], capture_output=True,
                                   text=True, timeout=60)
                return [ln[7:] for ln in r.stdout.splitlines() if ln.startswith("Path = ")]
            except Exception:
                pass
    return []


def classify(path: str) -> str:
    """'fix' or 'manifest' (best-effort). Loose .lua/.manifest → manifest; loose
    .dll/.exe → fix; archives are peeked — a lua/manifest inside and no exe/dll
    → manifest, otherwise fix. Unknown → fix."""
    low = os.path.basename(path).lower()
    if low.endswith(_MANIFEST_EXTS):
        return "manifest"
    if low.endswith(_BIN_EXTS) or low.endswith(".bin"):
        return "fix"
    if low.endswith(_ARCHIVE_EXTS):
        names = [n.lower() for n in _list_archive_names(path)]
        has_bin = any(n.endswith(_BIN_EXTS) for n in names)
        has_manifest = any(n.endswith(_MANIFEST_EXTS) for n in names)
        if has_manifest and not has_bin:
            return "manifest"
        return "fix"
    return "fix"


# ── import ───────────────────────────────────────────────────────────────────
def import_file(appid, src_path: str, forced_kind: str = "", label: str = "") -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    if not src_path or not os.path.isfile(src_path):
        return {"success": False, "error": "file not found"}
    kind = forced_kind or classify(src_path)
    kind = "manifest" if kind == "manifest" else "fix"
    dest_dir = _dir_for(kind, appid)
    base = os.path.basename(src_path)
    dest = os.path.join(dest_dir, base)
    if os.path.exists(dest):
        stem, ext = os.path.splitext(base)
        dest = os.path.join(dest_dir, f"{stem}_{int(time.time())}{ext}")
    try:
        shutil.copyfile(src_path, dest)
    except Exception as exc:
        return {"success": False, "error": f"copy failed: {exc}"}
    meta = {"label": label or base, "importedAt": int(time.time()), "kind": kind}
    try:
        with open(dest + ".meta.json", "w", encoding="utf-8") as fh:
            json.dump(meta, fh)
    except Exception:
        pass
    activated = False
    if kind == "manifest" and dest.lower().endswith(".lua"):
        activated = _activate_lua(appid, dest)
    return {"success": True, "kind": kind, "id": os.path.basename(dest),
            "label": meta["label"], "activated": activated}


def _activate_lua(appid, lua_path: str) -> bool:
    """Copy an imported .lua into SLSsteam's stplug-in dir (named <appid>.lua) so
    the engine loads it for ownership + depot keys on next Steam start."""
    try:
        from .steam import stplugin_dir
        from .utils import chown_to_user
        d = stplugin_dir()
        if not d:
            return False
        os.makedirs(d, exist_ok=True)
        target = os.path.join(d, f"{int(appid)}.lua")
        shutil.copyfile(lua_path, target)
        try:
            chown_to_user(target, recursive=False)
        except Exception:
            pass
        return True
    except Exception as exc:
        logger.warn(f"custom_fixes: lua activate failed: {exc}")
        return False


# ── listing ──────────────────────────────────────────────────────────────────
def _list(kind: str, appid) -> List[Dict[str, Any]]:
    d = os.path.join(_base_for(kind), str(int(appid)))
    out: List[Dict[str, Any]] = []
    try:
        for fn in sorted(os.listdir(d)):
            if fn.endswith(".meta.json"):
                continue
            p = os.path.join(d, fn)
            if not os.path.isfile(p):
                continue
            label = fn
            try:
                with open(p + ".meta.json", encoding="utf-8") as fh:
                    label = json.load(fh).get("label", fn)
            except Exception:
                pass
            out.append({"id": fn, "label": label,
                        "sizeMB": round(os.path.getsize(p) / 1048576, 2)})
    except Exception:
        pass
    return out


def list_custom_fixes(appid) -> Dict[str, Any]:
    return {"success": True, "items": _list("fix", appid)}


def list_custom_manifests(appid) -> Dict[str, Any]:
    return {"success": True, "items": _list("manifest", appid)}


def _list_all(kind: str) -> List[Dict[str, Any]]:
    base = _base_for(kind)
    out: List[Dict[str, Any]] = []
    try:
        for ap in sorted(os.listdir(base)):
            if not ap.isdigit():
                continue
            items = _list(kind, int(ap))
            if items:
                name = ""
                try:
                    from .steam import get_game_install_path_response
                    name = (get_game_install_path_response(int(ap)) or {}).get("name", "")
                except Exception:
                    name = ""
                out.append({"appid": int(ap), "name": name, "count": len(items), "items": items})
    except Exception:
        pass
    return out


def list_all_custom_fixes() -> Dict[str, Any]:
    return {"success": True, "games": _list_all("fix")}


def list_all_custom_manifests() -> Dict[str, Any]:
    return {"success": True, "games": _list_all("manifest")}


# ── apply a custom fix through the normal fix pipeline ────────────────────────
def apply_custom_fix(appid, fix_id: str, install_path: str, game_name: str = "") -> Dict[str, Any]:
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "invalid appid"}
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    src = os.path.join(custom_fixes_root(), str(appid), fix_id)
    if not os.path.isfile(src):
        return {"success": False, "error": "custom fix not found"}
    return _install_fix_file(appid, src, install_path, game_name, label=fix_id)


def _install_fix_file(appid, src: str, install_path: str, game_name: str, label: str = "") -> Dict[str, Any]:
    extracted: List[str] = []
    replaced: List[str] = []
    staging = ""
    try:
        if src.lower().endswith(_ARCHIVE_EXTS):
            staging = tempfile.mkdtemp(prefix=f"cfix_{appid}_")
            if not hvauto._extract_archive(src, staging):
                return {"success": False,
                        "error": "could not extract that archive (needs 7z/unrar/bsdtar)"}
            for root, _dirs, files in os.walk(staging):
                for fn in files:
                    full = os.path.join(root, fn)
                    rel = os.path.relpath(full, staging).replace("\\", "/")
                    if not _fixes._is_safe_path(install_path, rel):
                        continue
                    target = os.path.join(install_path, rel.replace("/", os.sep))
                    os.makedirs(os.path.dirname(target), exist_ok=True)
                    if _fixes._stash_original(install_path, rel):
                        replaced.append(rel)
                    shutil.copyfile(full, target)
                    extracted.append(rel)
        else:
            # loose .dll/.exe → drop it into the install root
            fn = os.path.basename(src)
            if _fixes._stash_original(install_path, fn):
                replaced.append(fn)
            shutil.copyfile(src, os.path.join(install_path, fn))
            extracted.append(fn)

        if not extracted:
            return {"success": False, "error": "nothing usable in that file"}

        try:
            _fixes._mirror_fix_to_exe_dir(install_path, extracted, replaced)
        except Exception:
            pass
        _fixes._write_fix_log(install_path, appid, game_name, "Custom fix",
                              f"custom:{label}", extracted, replaced)
        try:
            from .utils import chown_to_user
            for rel in extracted:
                chown_to_user(os.path.join(install_path, rel.replace("/", os.sep)), recursive=False)
            chown_to_user(_fixes._fix_log_path(install_path, appid), recursive=False)
        except Exception:
            pass
        return {"success": True, "installed": len(extracted),
                "note": "Custom fix installed. Restart Steam."}
    finally:
        if staging:
            shutil.rmtree(staging, ignore_errors=True)


# ── delete ───────────────────────────────────────────────────────────────────
def _delete(kind: str, appid) -> Dict[str, Any]:
    base = _base_for(kind)
    try:
        if appid and int(appid) > 0:
            shutil.rmtree(os.path.join(base, str(int(appid))), ignore_errors=True)
        else:
            shutil.rmtree(base, ignore_errors=True)
        return {"success": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def delete_custom_fixes(appid=0) -> Dict[str, Any]:
    return _delete("fix", appid)


def delete_custom_manifests(appid=0) -> Dict[str, Any]:
    return _delete("manifest", appid)
