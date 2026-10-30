"""Regression coverage for read-only injection diagnostics."""
from py_modules.lt import slssteam


def _fake_steam(proc, pid, elf_class, mapped=False):
    p = proc / str(pid)
    p.mkdir()
    (p / "comm").write_text("steam\n")
    (p / "status").write_text("Name:\tsteam\nPPid:\t1\n")
    (p / "cgroup").write_text("0::/user.slice/steam-launcher.service\n")
    (p / "maps").write_text(
        "7f0000-7f1000 r-xp 0000 00:00 0 /tmp/SLSsteam.so\n" if mapped else ""
    )
    (p / "exe").write_bytes(b"\x7fELF" + bytes([elf_class]) + b"fake")
    (p / "environ").write_bytes(b"HOME=/home/deck\x00")


def test_isolation_reports_elf_class_and_mapping(monkeypatch, tmp_path):
    proc = tmp_path / "proc"
    proc.mkdir()
    _fake_steam(proc, 111, 1, mapped=True)
    _fake_steam(proc, 222, 2, mapped=False)
    monkeypatch.setattr(slssteam, "_home", lambda: str(tmp_path))
    result = slssteam._isolation_diagnostics(str(proc))
    by_pid = {p["pid"]: p for p in result["processes"]}
    assert by_pid[111]["elfClass"] == "ELF32"
    assert by_pid[222]["elfClass"] == "ELF64"
    assert by_pid[111]["moonMapped"] is True
    assert by_pid[222]["moonMapped"] is False
    assert result["moonMappedAnySteam"] is True
    assert result["mappingConclusion"] == "mapped-in-inspected-steam-process"


def test_isolation_negative_is_only_not_observed(monkeypatch, tmp_path):
    proc = tmp_path / "proc"
    proc.mkdir()
    _fake_steam(proc, 333, 2, mapped=False)
    monkeypatch.setattr(slssteam, "_home", lambda: str(tmp_path))
    result = slssteam._isolation_diagnostics(str(proc))
    assert result["steamProcessCount"] == 1
    assert result["moonMappedAnySteam"] is False
    assert result["mappingConclusion"] == "not-observed-in-inspected-steam-processes"


def test_elf_class_handles_inaccessible_process(tmp_path):
    assert slssteam._process_elf_class("999", str(tmp_path)) == "unknown"
