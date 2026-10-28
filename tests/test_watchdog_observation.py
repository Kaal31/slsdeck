import asyncio
import subprocess

from py_modules.lt import watchdog, audit, slssteam


def test_watchdog_observes_without_repair(monkeypatch):
    repairs = []
    def forbidden():
        repairs.append(True)
        raise AssertionError('background repair must never run')
    monkeypatch.setattr(audit, 'auto_repair_system', forbidden)
    monkeypatch.setattr(watchdog, 'system_health_audit', lambda: {
        'healthScore': 30, 'repairableCodes': ['ROOT_OWNERSHIP', 'INJECTION_OFF'],
        'gamescopeHookActive': False, 'injectionActive': False,
    })
    async def stop(_):
        watchdog._WATCHDOG_RUNNING = False
    monkeypatch.setattr(watchdog.asyncio, 'sleep', stop)
    asyncio.run(watchdog._watchdog_loop())
    assert watchdog._LAST_AUDIT_SCORE == 30
    assert repairs == []


def test_launch_evidence_reads_service_and_permissions(monkeypatch, tmp_path):
    wrapper = tmp_path / 'steam'
    wrapper.write_text('#!/bin/sh\n')
    wrapper.chmod(0o755)
    (tmp_path / '.inject_fails').write_text('2')
    monkeypatch.setattr(slssteam, '_path_wrapper', lambda: str(wrapper))
    monkeypatch.setattr(slssteam, 'lib_dir', lambda: str(tmp_path))
    monkeypatch.setattr(slssteam, '_steamos_dropin', lambda: str(tmp_path / 'missing.conf'))
    monkeypatch.setattr(slssteam, '_steamos_unit_present', lambda: True)
    monkeypatch.setattr(slssteam, '_wrap_as_user', lambda args: args)
    calls = []
    def run(args, **kwargs):
        calls.append(args)
        assert kwargs['timeout'] == 5
        return subprocess.CompletedProcess(args, 0, b'ExecStart=/test/launcher', b'')
    monkeypatch.setattr(slssteam.subprocess, 'run', run)
    result = slssteam._launch_environment_diagnostics()
    assert result['files'][0]['mode'] == '0o755'
    assert result['files'][3]['attempts'] == '2'
    assert result['files'][4]['error'] == 'FileNotFoundError'
    assert calls[0][2] == 'show' and calls[1][2] == 'cat'
    assert result['effective']['returncode'] == 0
