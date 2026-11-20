"""Read-only SteamRT64 locator candidate audit tests (no Steam required)."""
import hashlib
import struct
from pathlib import Path

from py_modules.lt import moon_x64_audit as audit


def _elf_with_text(code: bytes) -> bytes:
    data = bytearray(512 + len(code))
    data[:6] = b"\x7fELF\x02\x01"
    struct.pack_into("<H", data, 18, 62)
    struct.pack_into("<Q", data, 40, 64)
    struct.pack_into("<HHH", data, 58, 64, 3, 1)
    names = b"\x00.shstrtab\x00.text\x00"
    data[256:256 + len(names)] = names
    struct.pack_into("<IQQ", data, 64 + 64, 1, 256, len(names))  # unused type/address overwritten below
    struct.pack_into("<QQ", data, 64 + 64 + 24, 256, len(names))
    struct.pack_into("<I", data, 64 + 2 * 64, 11)
    struct.pack_into("<QQ", data, 64 + 2 * 64 + 24, 512, len(code))
    data[512:] = code
    return bytes(data)


def test_unique_pattern_in_elf_text():
    name, pattern = next(iter(audit.PATTERNS.items()))
    needle, mask = audit._parse_pattern(pattern)
    assert len(needle) == len(mask)
    content = b"\x90" * 40 + needle + b"\x90" * 30
    off, text = audit._elf_text_region(_elf_with_text(content))
    assert off == 512
    assert audit._scan(text, pattern) == [40]


def test_ambiguous_pattern_not_unique():
    pattern = audit.PATTERNS["CUser::ProcessPendingLicenseUpdates"]
    needle, _ = audit._parse_pattern(pattern)
    content = needle + b"\x90" * 8 + needle
    assert audit._scan(content, pattern) == [0, len(needle) + 8]


def test_invalid_binary_rejected():
    try:
        audit._elf_text_region(b"not an ELF")
    except ValueError as exc:
        assert "ELF64" in str(exc)
    else:
        raise AssertionError("invalid ELF accepted")


def test_readonly_audit_with_synthetic_client(tmp_path):
    dest = tmp_path / "steamrt64" / "steamclient.so"
    dest.parent.mkdir(parents=True)
    name, pattern = next(iter(audit.PATTERNS.items()))
    needle, _ = audit._parse_pattern(pattern)
    payload = _elf_with_text(b"\x90" * 20 + needle + b"\x90" * 10)
    dest.write_bytes(payload)
    before = dest.stat().st_mtime_ns
    result = audit.audit(str(dest))
    assert result["success"] is True
    assert result["readOnly"] is True
    assert result["verification"] == "candidate-patterns-only"
    assert result["sha256"] == hashlib.sha256(payload).hexdigest()
    assert result["patterns"][name]["count"] == 1
    assert result["patterns"]["CUser::NotifyLicensesUpdated"]["count"] is None
    assert result["hotReloadValidated"] is False
    assert dest.read_bytes() == payload
    assert dest.stat().st_mtime_ns == before


def test_reject_other_steamclient(tmp_path):
    dest = tmp_path / "linux64" / "steamclient.so"
    dest.parent.mkdir()
    dest.write_bytes(b"bad")
    assert audit.audit(str(dest))["success"] is False


def test_automatic_audit_writes_report_and_decky_log(tmp_path, monkeypatch):
    from py_modules.lt import logger as log_module
    from py_modules.lt import paths as paths_module
    class FakeLog:
        def __init__(self):
            self.messages = []
        def log(self, msg):
            self.messages.append(msg)
        def warn(self, msg):
            self.messages.append(msg)
    logs = FakeLog()
    monkeypatch.setattr(log_module, "logger", logs)
    monkeypatch.setattr(paths_module, "get_user_home", lambda: str(tmp_path))
    monkeypatch.setattr(audit, "audit", lambda: {
        "success": True, "readOnly": True, "path": "/mock/steamrt64/steamclient.so",
        "sha256": "a" * 64, "size": 64, "patterns": {
            "CUser::MarkLicenseAsChanged": {
                "count": 1, "offsets": ["0x123"], "uniqueCandidate": True
            }
        }, "hotReloadValidated": False
    })
    result = audit.audit_and_log()
    report = tmp_path / ".config" / "SLSsteam" / "logs" / "steamrt64-locator-audit.json"
    import json
    stored = json.loads(report.read_text(encoding="utf-8"))
    assert stored["sha256"] == result["sha256"]
    assert stored["patterns"]["CUser::MarkLicenseAsChanged"]["count"] == 1
    assert stored["hotReloadValidated"] is False
    assert any("Moon x64 locator audit: report saved" in m for m in logs.messages)
