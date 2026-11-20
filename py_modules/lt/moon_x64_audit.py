"""Read-only, offline candidate locator audit for SteamRT64.

Does not inject, modify Steam, or call any Steam functions. Byte-pattern matches
are *candidates*, not validated function starts or compatible calling conventions.
The NotifyLicensesUpdated string-xref locator cannot be resolved with a byte scan.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import struct
from typing import Any, Dict, Optional

# Exact byte patterns from ogb4n/slsteam-moon-x64 v20261116145432,
# src/patterns_x86_64.hpp:248-268. No address is hardcoded.
PATTERNS = {
    "CUser::MarkLicenseAsChanged":
        "41 57 48 8D 87 ? ? 00 00 41 89 F7 41 56 41 55 41 54 55 53 48 83 EC ? 88 54 24 ? 8B 97 ? ? 00 00",
    "CUser::ProcessPendingLicenseUpdates":
        "41 54 49 89 FC 55 53 8B 9F ? ? 00 00 83 EB 01 78 ? 48 63 C3 48 8D 2C 80 48 C1 E5 04",
    "CUser::m_CompatManager":
        "48 8D 83 ? ? 00 00 48 89 DE 48 89 C7 48 89 84 24 ? ? 00 00 E8 ? ? ? ? 66 0F 6F 1D ? ? ? ? 48 89 DE 48 C7 83 ? ? 00 00 FF FF FF FF",
}

XREF_STRINGS = ("17LicensesUpdated_t", "SendAppLicenseUpdates")
MAX_CLIENT_BYTES = 512 * 1024 * 1024


def _parse_pattern(pattern: str):
    tokens = pattern.split()
    return bytes(0 if x == "?" else int(x, 16) for x in tokens), bytes(0 if x == "?" else 255 for x in tokens)


def _scan(data: bytes, pattern: str, limit: int = 16):
    needle, mask = _parse_pattern(pattern)
    if not needle:
        return []
    # Anchor on the longest contiguous fixed-byte region, avoiding byte-by-byte
    # scans over large binaries and rejecting ambiguous matches.
    runs = list(re.finditer(b"\xff+", mask))
    if not runs:
        return []
    anchor = max(runs, key=lambda r: r.end() - r.start())
    fixed = needle[anchor.start():anchor.end()]
    positions = []
    at = 0
    while True:
        found = data.find(fixed, at)
        if found < 0:
            break
        at = found + 1
        offset = found - anchor.start()
        if offset < 0 or offset + len(needle) > len(data):
            continue
        window = data[offset:offset + len(needle)]
        if all((byte & flag) == expected for byte, flag, expected in zip(window, mask, needle)):
            positions.append(offset)
            if len(positions) >= limit:
                break
    return positions


def _elf_text_region(data: bytes):
    """Identify .text in an ELF64 LE x86-64 shared library; never scan unrelated data."""
    if len(data) < 64 or data[:4] != b"\x7fELF" or data[4:6] != b"\x02\x01":
        raise ValueError("expected ELF64 little-endian SteamRT64 binary")
    machine = struct.unpack_from("<H", data, 18)[0]
    if machine != 62:
        raise ValueError("expected ELF machine x86_64")
    section_offset = struct.unpack_from("<Q", data, 40)[0]
    entry_size, count, names_index = struct.unpack_from("<HHH", data, 58)
    if not count or entry_size < 64 or count > 65535:
        raise ValueError("ELF section table unavailable")
    if section_offset > len(data) or section_offset + count * entry_size > len(data):
        raise ValueError("ELF section table outside file")
    if names_index >= count:
        raise ValueError("ELF section-name index outside table")

    def section(i):
        base = section_offset + i * entry_size
        name = struct.unpack_from("<I", data, base)[0]
        offset = struct.unpack_from("<Q", data, base + 24)[0]
        size = struct.unpack_from("<Q", data, base + 32)[0]
        if offset > len(data) or size > len(data) - offset:
            raise ValueError("ELF section outside file")
        return name, offset, size

    _, str_off, str_size = section(names_index)
    names = data[str_off:str_off + str_size]
    for i in range(count):
        idx, offset, size = section(i)
        if idx < len(names) and names[idx:].split(b"\x00", 1)[0] == b".text":
            return offset, data[offset:offset + size]
    raise ValueError("ELF .text section not found")


def find_client() -> Optional[str]:
    home = os.path.expanduser("~")
    roots = [
        os.path.join(home, ".steam", "steam"),
        os.path.join(home, ".local", "share", "Steam"),
        "/home/deck/.steam/steam",
        "/home/deck/.local/share/Steam",
    ]
    for root in roots:
        path = os.path.join(root, "steamrt64", "steamclient.so")
        if os.path.isfile(path):
            return path
    return None


def audit(path: Optional[str] = None) -> Dict[str, Any]:
    target = path or find_client()
    if not target:
        return {"success": False, "error": "steamrt64/steamclient.so not found",
                "requiresDeviceBinary": True}
    # Do not accept a same-named library from linux64/ or ubuntu12_32.
    normalized = os.path.realpath(target).replace("\\", "/")
    if not normalized.endswith("/steamrt64/steamclient.so"):
        return {"success": False, "error": "target must be steamrt64/steamclient.so"}
    try:
        size = os.path.getsize(target)
        if size > MAX_CLIENT_BYTES or size < 64:
            raise ValueError("unexpected SteamRT64 binary size")
        with open(target, "rb") as fh:
            data = fh.read(MAX_CLIENT_BYTES + 1)
        if len(data) > MAX_CLIENT_BYTES:
            raise ValueError("SteamRT64 binary exceeds audit size limit")
        text_offset, text = _elf_text_region(data)
        result = {
            "success": True, "readOnly": True, "verification": "candidate-patterns-only",
            "path": normalized, "size": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "textSize": len(text), "patterns": {},
        }
        for name, pattern in PATTERNS.items():
            matches = _scan(text, pattern)
            result["patterns"][name] = {
                "count": len(matches), "offsets": [hex(text_offset + offset) for offset in matches],
                "uniqueCandidate": len(matches) == 1,
                "truncated": len(matches) == 16,
            }
        result["patterns"]["CUser::NotifyLicensesUpdated"] = {
            "count": None, "uniqueCandidate": False,
            "status": "requires-string-xref-disassembly",
            "stringsPresent": {s: s.encode() in data for s in XREF_STRINGS},
        }
        result["allBytePatternsUnique"] = all(
            result["patterns"][name]["uniqueCandidate"] for name in PATTERNS)
        result["hotReloadValidated"] = False
        return result
    except (OSError, ValueError, struct.error) as exc:
        return {"success": False, "error": str(exc), "path": normalized}



def audit_and_log() -> Dict[str, Any]:
    """Run automatically at plugin startup; log results without touching Steam."""
    from .logger import logger
    from .paths import get_user_home
    from datetime import datetime, timezone

    result = audit()
    stamp = datetime.now(timezone.utc).isoformat()
    logger.log(f"Moon x64 locator audit: started {stamp}; readOnly=true")
    if result.get("success"):
        logger.log(f"Moon x64 locator audit: client={result['path']} sha256={result['sha256']} size={result['size']}")
        for name, entry in result["patterns"].items():
            logger.log(f"Moon x64 locator audit: {name}: count={entry['count']} "
                       f"offsets={entry.get('offsets', [])} status={entry.get('status', 'candidate-only')}")
        logger.log("Moon x64 locator audit: hotReloadValidated=false; runtime verification required")
    else:
        logger.warn(f"Moon x64 locator audit: skipped/failed: {result.get('error', 'unknown')}")
    try:
        log_dir = os.path.join(get_user_home(), ".config", "SLSsteam", "logs")
        os.makedirs(log_dir, exist_ok=True)
        destination = os.path.join(log_dir, "steamrt64-locator-audit.json")
        import tempfile
        fd, temp_path = tempfile.mkstemp(prefix=".steamrt64-locator-", dir=log_dir)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump({"timestamp": stamp, **result}, fh, indent=2, sort_keys=True)
                fh.write("\n")
            os.replace(temp_path, destination)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        logger.log(f"Moon x64 locator audit: report saved to {destination}")
    except OSError as exc:
        logger.warn(f"Moon x64 locator audit: could not persist report: {exc}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only SteamRT64 Moon locator candidate audit")
    parser.add_argument("--steamclient", help="path ending with steamrt64/steamclient.so")
    args = parser.parse_args()
    report = audit(args.steamclient)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
