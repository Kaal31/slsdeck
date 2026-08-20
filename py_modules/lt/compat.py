"""Proton Compatibility & Launch Options Manager for SteamOS / Steam Deck.

Reads and manages per-game Proton version overrides (CompatToolMapping) in
Steam's config/config.vdf so users can force specific GE-Proton or Experimental
versions for SLSsteam-added games or game fixes.
"""

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

from .logger import logger
from .paths import get_user_home
from .steam import detect_steam_install_path, _match_brace
from .utils import chown_to_user, safe_extract


def _compat_block_bounds(content: str):
    """(start, end) character offsets of the CompatToolMapping block BODY, or None.

    Every edit here must be confined to these bounds. config.vdf also contains a
    "depots" map whose keys are numeric depot ids -- the same shape as the appid
    keys used here -- and it appears earlier in the file, so an unscoped regex
    substitution will hit a depot's DecryptionKey instead of a Proton mapping."""
    m = re.search(r'"CompatToolMapping"\s*\{', content)
    if not m:
        return None
    ob = content.rfind("{", m.start(), m.end())
    if ob < 0:
        return None
    cb = _match_brace(content, ob)
    if cb < 0:
        return None
    return ob + 1, cb


def get_config_vdf_path() -> Optional[str]:
    """Locate Steam's config/config.vdf file."""
    base = detect_steam_install_path()
    if base:
        p = os.path.join(base, "config", "config.vdf")
        if os.path.isfile(p):
            return p
    home = get_user_home()
    for cand in (
        os.path.join(home, ".steam", "steam", "config", "config.vdf"),
        os.path.join(home, ".local", "share", "Steam", "config", "config.vdf"),
    ):
        if os.path.isfile(cand):
            return cand
    return None


def list_installed_proton_tools() -> Dict[str, Any]:
    """List custom/community Proton versions (GE-Proton, etc.) installed on disk."""
    home = get_user_home()
    dirs = [
        os.path.join(home, ".steam", "root", "compatibilitytools.d"),
        os.path.join(home, ".steam", "steam", "compatibilitytools.d"),
        os.path.join(home, ".local", "share", "Steam", "compatibilitytools.d"),
        "/usr/share/steam/compatibilitytools.d",
    ]
    tools: List[str] = []
    seen = set()
    for d in dirs:
        if not os.path.isdir(d):
            continue
        try:
            for entry in os.listdir(d):
                p = os.path.join(d, entry)
                if os.path.isdir(p) and entry not in seen:
                    seen.add(entry)
                    tools.append(entry)
        except Exception:
            continue

    # Include built-in Valve defaults
    defaults = ["proton_experimental", "proton_9", "proton_80", "proton_70", "proton_hotfix"]
    for dft in defaults:
        if dft not in seen:
            seen.add(dft)
            tools.append(dft)

    tools.sort()
    return {"success": True, "tools": tools}


def get_proton_mapping(appid: int) -> Dict[str, Any]:
    """Get the active CompatToolMapping override for an appid from config.vdf."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    vdf_path = get_config_vdf_path()
    if not vdf_path or not os.path.isfile(vdf_path):
        return {"success": False, "error": "config.vdf not found"}

    try:
        with open(vdf_path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()

        # Find CompatToolMapping block
        m_block = re.search(r'"CompatToolMapping"\s*\{', content, re.IGNORECASE)
        if not m_block:
            return {"success": True, "appid": appid, "toolName": "", "priority": ""}

        # Find entry for this appid inside CompatToolMapping
        app_pattern = re.compile(
            rf'"' + str(appid) + r'"\s*\{([^}]+)\}', re.DOTALL | re.IGNORECASE
        )
        match = app_pattern.search(content, m_block.end())
        if not match:
            return {"success": True, "appid": appid, "toolName": "", "priority": ""}

        body = match.group(1)
        name_m = re.search(r'"name"\s*"([^"]+)"', body, re.IGNORECASE)
        prio_m = re.search(r'"priority"\s*"([^"]+)"', body, re.IGNORECASE)

        tool_name = name_m.group(1) if name_m else ""
        priority = prio_m.group(1) if prio_m else ""

        return {
            "success": True,
            "appid": appid,
            "toolName": tool_name,
            "priority": priority,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def set_proton_mapping(appid: int, tool_name: str, priority: str = "250") -> Dict[str, Any]:
    """Set or update a per-game Proton version override in config.vdf line-by-line."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    tool_name = str(tool_name or "").strip()
    vdf_path = get_config_vdf_path()
    if not vdf_path or not os.path.isfile(vdf_path):
        return {"success": False, "error": "config.vdf not found"}

    try:
        with open(vdf_path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()

        bounds = _compat_block_bounds(content)
        if not bounds:
            return {"success": False, "error": "CompatToolMapping block not found in config.vdf"}
        b_start, b_end = bounds
        block = content[b_start:b_end]

        # Note the shapes here: the pattern does NOT consume a trailing newline
        # and entry_block does NOT end with one -- it opens with "\n" and closes
        # right after "}". That makes set and remove exact inverses. When the
        # entry ended with "\n" but removal only ate the leading one, every
        # set-then-clear cycle left one more blank line behind in config.vdf,
        # which is Steam's own file and accumulates with each toggle.
        app_pattern = re.compile(
            rf'(\s*"' + str(appid) + r'"\s*\{[^}]*\})', re.DOTALL
        )

        entry_block = (
            f'\n\t\t"{appid}"\n'
            f'\t\t{{\n'
            f'\t\t\t"name"\t\t"{tool_name}"\n'
            f'\t\t\t"config"\t\t""\n'
            f'\t\t\t"priority"\t\t"{priority}"\n'
            f'\t\t}}'
        )

        # CRITICAL: operate ONLY inside the CompatToolMapping block. This used to
        # search from m_compat.end() but then call re.sub(..., content) on the
        # WHOLE file, which replaces the first match from position 0 -- and the
        # "depots" block (which holds depot DecryptionKeys, and whose keys are
        # numeric ids in the same space as appids) appears EARLIER in config.vdf.
        # So setting a Proton mapping could silently delete a depot key and break
        # that game's downloads.
        if app_pattern.search(block):
            new_block = app_pattern.sub(entry_block, block, count=1)
        else:
            new_block = entry_block + block
        new_content = content[:b_start] + new_block + content[b_end:]

        tmp = vdf_path + ".sltmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(new_content)
        os.replace(tmp, vdf_path)
        chown_to_user(vdf_path, recursive=False)

        logger.log(f"SLSDeck compat: set Proton mapping for {appid} -> {tool_name}")
        return {"success": True, "appid": appid, "toolName": tool_name}
    except Exception as exc:
        logger.warn(f"SLSDeck compat: set_proton_mapping failed for {appid}: {exc}")
        return {"success": False, "error": str(exc)}


def remove_proton_mapping(appid: int) -> Dict[str, Any]:
    """Remove a per-game Proton version override from config.vdf."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    vdf_path = get_config_vdf_path()
    if not vdf_path or not os.path.isfile(vdf_path):
        return {"success": True, "message": "config.vdf not found"}

    try:
        with open(vdf_path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()

        bounds = _compat_block_bounds(content)
        if not bounds:
            return {"success": True, "message": "No CompatToolMapping block"}
        b_start, b_end = bounds
        block = content[b_start:b_end]

        app_pattern = re.compile(
            rf'\n?\t*"' + str(appid) + r'"\s*\{[^}]*\}', re.DOTALL
        )
        if not app_pattern.search(block):
            return {"success": True, "message": "No override found for appid"}

        # Same whole-file re.sub hazard as set_proton_mapping: this previously
        # deleted the FIRST numeric block in config.vdf, which is a depot entry
        # holding a DecryptionKey, not the Proton mapping.
        new_content = content[:b_start] + app_pattern.sub("", block, count=1) + content[b_end:]
        tmp = vdf_path + ".sltmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(new_content)
        os.replace(tmp, vdf_path)
        chown_to_user(vdf_path, recursive=False)

        logger.log(f"SLSDeck compat: removed Proton mapping for {appid}")
        return {"success": True, "appid": appid}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def install_latest_ge_proton() -> Dict[str, Any]:
    """Fetch latest GE-Proton release tarball from GitHub and unpack into compatibilitytools.d."""
    import tarfile
    import tempfile
    from .httpc import ensure_http_client
    home = get_user_home()
    target_dir = os.path.join(home, ".steam", "root", "compatibilitytools.d")
    os.makedirs(target_dir, exist_ok=True)
    client = ensure_http_client("SLSDeck: GE-Proton installer")
    try:
        url = "https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases/latest"
        resp = client.get(url, timeout=15)
        if resp.status_code != 200:
            return {"success": False, "error": f"GitHub API error {resp.status_code}"}
        rel = resp.json()
        tag = rel.get("tag_name", "")
        if not tag:
            return {"success": False, "error": "No GE-Proton tag found"}
        dest_folder = os.path.join(target_dir, tag)
        if os.path.isdir(dest_folder):
            return {"success": True, "tag": tag, "installed": True, "message": f"{tag} already installed"}
        assets = rel.get("assets", [])
        tar_url = ""
        for a in assets:
            name = a.get("name", "")
            if name.endswith(".tar.gz"):
                tar_url = a.get("browser_download_url", "")
                break
        if not tar_url:
            return {"success": False, "error": "No tar.gz asset found in release"}
        tmp_tar = os.path.join(tempfile.gettempdir(), f"{tag}.tar.gz")
        with client.stream("GET", tar_url, follow_redirects=True) as r:
            r.raise_for_status()
            with open(tmp_tar, "wb") as fh:
                for chunk in r.iter_bytes():
                    fh.write(chunk)
        # safe_extract, not extractall: a tarball can carry "../.." members and
        # symlink members that redirect writes outside target_dir.
        with tarfile.open(tmp_tar, "r:gz") as tar:
            safe_extract(tar, target_dir, "tar")
        try:
            os.remove(tmp_tar)
        except Exception:
            pass
        chown_to_user(target_dir, recursive=True)
        logger.log(f"SLSDeck compat: installed {tag} to {target_dir}")
        return {"success": True, "tag": tag, "installed": True}
    except Exception as exc:
        logger.warn(f"SLSDeck compat: GE-Proton install failed: {exc}")
        return {"success": False, "error": str(exc)}
