import subprocess
import pytest

from py_modules.lt import slssteam


def test_steamos_dropin_install_remove(monkeypatch, tmp_path):
    dropin = tmp_path / "steam-launcher.service.d/50-slsdeck.conf"
    calls = []
    monkeypatch.setattr(slssteam, "_steamos_unit_present", lambda: True)
    monkeypatch.setattr(slssteam, "_steamos_dropin", lambda: str(dropin))
    monkeypatch.setattr(slssteam, "_ensure_path_wrapper", lambda: calls.append("wrapper"))
    monkeypatch.setattr(slssteam, "_reload_user_units", lambda: calls.append("reload"))
    monkeypatch.setattr(slssteam, "_chown_file_to_user", lambda _: None)
    monkeypatch.setattr(slssteam, "_gamescope_hook_files", lambda: [])
    monkeypatch.setattr(slssteam, "_log_injection_action", lambda _: None)

    result = slssteam.install_gamescope_hook()
    assert result["method"] == "steamos-service"
    content = dropin.read_text()
    assert "ExecStart=\nExecStart=/bin/sh" in content
    assert '$$PATH' in content
    assert "/usr/lib/steamos/steam-launcher" in content
    assert slssteam.gamescope_hook_active()
    slssteam.remove_gamescope_hook()
    assert not dropin.exists()
    assert calls == ["wrapper", "reload", "reload"]

    dropin.write_text("# someone else's configuration\n")
    with pytest.raises(RuntimeError, match="unmanaged"):
        slssteam.install_gamescope_hook()
    slssteam.remove_gamescope_hook()
    assert dropin.exists()


@pytest.mark.parametrize("attempts,library,mode", [(0, True, "inject"), (2, True, "clean"), (0, False, "clean")])
def test_wrapper_execution_record_and_failsafe(monkeypatch, tmp_path, attempts, library, mode):
    real = tmp_path / "real-steam"
    real.write_text('#!/bin/sh\nprintf "audit=%s arg=%s\\n" "$LD_AUDIT" "$1"\n')
    real.chmod(0o755)
    monkeypatch.setattr(slssteam, "lib_dir", lambda: str(tmp_path))
    monkeypatch.setattr(slssteam, "_path_wrapper", lambda: str(tmp_path / "path/steam"))
    monkeypatch.setattr(slssteam, "_real_steam_binary", lambda: str(real))
    monkeypatch.setattr(slssteam, "_chown_file_to_user", lambda _: None)
    boot_id = slssteam.Path("/proc/sys/kernel/random/boot_id").read_text().strip() if hasattr(slssteam, "Path") else __import__("pathlib").Path("/proc/sys/kernel/random/boot_id").read_text().strip()
    (tmp_path / ".inject_fails").write_text(f"{boot_id}:{attempts}")
    if library:
        (tmp_path / "SLSsteam.so").touch()
    wrapper = slssteam._ensure_path_wrapper()
    subprocess.run(["sh", "-n", wrapper], check=True)
    result = subprocess.run([wrapper, "test-argument"], capture_output=True, text=True, check=True)
    assert "arg=test-argument" in result.stdout
    trace = (tmp_path / ".launch_trace").read_text()
    assert f"mode={mode}" in trace
    assert "boot=" in trace and "pid=" in trace and "time=" in trace
    assert "moonClass=" in trace and "auditClass=" in trace
    assert "realClass=" in trace
    if mode == "clean":
        assert "audit= arg=" in result.stdout
        assert (tmp_path / ".inject_fails").read_text() == f"{boot_id}:{attempts}"
    else:
        assert str(tmp_path / "SLSsteam.so") in result.stdout
        assert (tmp_path / ".inject_fails").read_text().strip() == f"{boot_id}:1"


def test_restart_is_blocked_on_steamos(monkeypatch):
    monkeypatch.setattr(slssteam, "_steamos_unit_present", lambda: True)
    def forbidden(*args, **kwargs):
        raise AssertionError("SteamOS must not spawn shutdown commands")
    monkeypatch.setattr(slssteam.subprocess, "run", forbidden)
    monkeypatch.setattr(slssteam.subprocess, "Popen", forbidden)
    result = slssteam.restart_steam_apply()
    assert result["success"] is False
    assert result["requiresManualRestart"] is True


def test_activation_guard_rejects_parallel_request(monkeypatch):
    assert slssteam._ACTIVATION_LOCK.acquire(blocking=False)
    try:
        result = slssteam.activate_injection()
        assert result["success"] is False
        assert "already in progress" in result["error"]
    finally:
        slssteam._ACTIVATION_LOCK.release()


def test_wrapper_records_actual_pid_and_validated_elf_classes(monkeypatch, tmp_path):
    """The launcher may be a shell script; ASCII byte 5 is not an ELF class."""
    real = tmp_path / "real-steam"
    real.write_text('#!/bin/sh\\nprintf "pid=%s\\n" "$$"\\n')
    real.chmod(0o755)
    monkeypatch.setattr(slssteam, "lib_dir", lambda: str(tmp_path))
    monkeypatch.setattr(slssteam, "_path_wrapper", lambda: str(tmp_path / "path/steam"))
    monkeypatch.setattr(slssteam, "_real_steam_binary", lambda: str(real))
    monkeypatch.setattr(slssteam, "_chown_file_to_user", lambda _: None)
    # Synthetic ELF header, 32-bit.
    (tmp_path / "SLSsteam.so").write_bytes(b"\\x7fELF\\x01" + bytes(16))
    (tmp_path / "library-inject.so").write_bytes(b"\\x7fELF\\x01" + bytes(16))
    wrapper = slssteam._ensure_path_wrapper()
    subprocess.run(["sh", "-n", wrapper], check=True)
    result = subprocess.run([wrapper], capture_output=True, text=True, check=True)
    trace = (tmp_path / ".launch_trace").read_text()
    assert "realClass=non-ELF" in trace
    assert "moonClass=ELF32" in trace
    assert "auditClass=ELF32" in trace
    assert "pid=$ " not in trace
    assert "pid=" + result.stdout.strip().split("pid=")[-1] in trace
