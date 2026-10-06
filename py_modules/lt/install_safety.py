"""User-visible dependency inventory and append-only install receipts."""

from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List

from . import paths


DEPENDENCIES: List[Dict[str, Any]] = [
    {"id": "slssteam", "name": "SLSsteam Moon", "kind": "core", "source": "GitHub release", "changes": ["Installs steamclient.so", "Wraps Steam startup", "Writes SLSsteam config and Gamescope hook", "Restarts Steam"], "risk": "high", "optional": False},
    {"id": "client-fix", "name": "h3adcr-b client fix", "kind": "compatibility", "source": "GitHub release", "changes": ["Pins/replaces Steam client files", "Creates recovery backups", "Requires a Deck restart"], "risk": "high", "optional": True},
    {"id": "tokeer", "name": "Tokeer runtime", "kind": "activation", "source": "Tokeer upstream", "changes": ["Installs a user-scoped command runtime"], "risk": "medium", "optional": True},
    {"id": "proton", "name": "GE-Proton10-34", "kind": "compatibility", "source": "GitHub release", "changes": ["Downloads and extracts a large compatibility-tool archive"], "risk": "medium", "optional": True},
    {"id": "ubisoft", "name": "Ubisoft activation packages", "kind": "activation", "source": "SLSDeck rolling release", "changes": ["Installs hosted AppID-keyed activation data"], "risk": "medium", "optional": True},
    {"id": "zapret", "name": "Zapret ISP bypass", "kind": "network", "source": "bol-van/zapret upstream", "changes": ["Downloads native binaries", "Can install NFQUEUE rules while enabled", "Uses bundled SteaMidra host list"], "risk": "high", "optional": True},
    {"id": "cloudredirect", "name": "CloudRedirect", "kind": "cloud saves", "source": "Moon/CloudRedirect upstream", "changes": ["Installs a Steam hook", "Creates provider cache and credential files"], "risk": "medium", "optional": True},
    {"id": "hypervisor", "name": "Hypervisor tools", "kind": "game fix", "source": "Per-game fix sources", "changes": ["Can reload KVM kernel modules", "Can modify UMIP/boot configuration"], "risk": "high", "optional": True},
]


def manifest() -> Dict[str, Any]:
    return {
        "success": True,
        "policy": "Optional components are never required for the core SLSsteam install.",
        "hostTools": ["bash", "curl or HTTPX", "tar/bsdtar", "7zz or py7zr"],
        "python": ["httpx==0.27.2", "py7zr==0.22.0"],
        "never": ["apt", "pacman", "dnf", "system package installation"],
        "dependencies": DEPENDENCIES,
    }


def _receipt_path() -> str:
    return paths.settings_path("install-receipts.jsonl")


def record(component: str, action: str, result: Dict[str, Any] | None = None) -> Dict[str, Any]:
    known = next((item for item in DEPENDENCIES if item["id"] == component), None)
    if known is None:
        return {"success": False, "error": "unknown component"}
    entry = {
        "timestamp": int(time.time()),
        "component": component,
        "name": known["name"],
        "action": action,
        "success": bool((result or {}).get("success", True)),
        "version": (result or {}).get("version") or (result or {}).get("latest") or "",
        "path": (result or {}).get("path") or (result or {}).get("home") or "",
        "declaredChanges": known["changes"],
    }
    path = _receipt_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
    return {"success": True, "receipt": entry, "path": path}


def receipts(limit: int = 50) -> Dict[str, Any]:
    path = _receipt_path()
    entries: List[Dict[str, Any]] = []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for line in handle:
                try:
                    entries.append(json.loads(line))
                except (TypeError, ValueError):
                    continue
    except FileNotFoundError:
        pass
    return {"success": True, "path": path, "receipts": entries[-max(1, int(limit)):][::-1]}
