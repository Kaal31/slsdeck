import os
import struct
import subprocess
from pathlib import Path

from py_modules.lt import steamstub, slssteam, fixes


def wrapped():
    data = bytearray(512)
    data[:2] = b'MZ'
    data[0x40:0x44] = b'VLV\0'
    return bytes(data)


def setup_game(monkeypatch, tmp_path):
    exe = tmp_path / 'game.exe'
    exe.write_bytes(wrapped())
    monkeypatch.setattr(fixes, 'find_main_exe', lambda _: {'success': True, 'exe': str(exe)})
    monkeypatch.setattr(fixes, 'chown_to_user', lambda *a, **k: None)
    monkeypatch.setattr(steamstub, 'chown_to_user', lambda *a, **k: None)
    monkeypatch.setattr(slssteam, '_wrap_as_user', lambda a: a)
    return exe


def test_v2_and_plain_detection(tmp_path):
    p = tmp_path / 'game.exe'
    p.write_bytes(wrapped())
    assert steamstub.has_steamstub(str(p))
    p.write_bytes(b'MZ' + b'\0' * 100 + b'.bind')
    assert not steamstub.has_steamstub(str(p))  # unrelated text is not a PE section


def test_native_processing_and_targeted_restore(monkeypatch, tmp_path):
    exe = setup_game(monkeypatch, tmp_path)
    original = exe.read_bytes()
    monkeypatch.setattr(steamstub, 'native_ready', lambda: True)
    def run(*args, **kwargs):
        assert (tmp_path / 'game.exe.slsdeck-orig').read_bytes() == original
        assert 'steamstub-managed' in (tmp_path / 'luatools-fix-log-74.log').read_text()
        exe.write_bytes(b'MZ' + b'\0' * 510)
        Path(str(exe) + '.original.exe').write_bytes(original)
        return subprocess.CompletedProcess(args, 0, '', '')
    monkeypatch.setattr(steamstub.subprocess, 'run', run)
    r = steamstub.unstub(74, str(tmp_path), 'Game')
    assert r['success'] and r['method'] == 'native'
    assert not Path(str(exe) + '.original.exe').exists()
    monkeypatch.setattr(slssteam, 'purge_pins_for_app', lambda _: None)
    fixes._unfix_worker(74, str(tmp_path), None, preserve_unlockers=True)
    assert fixes._get_unfix_state(74)['status'] == 'done'
    assert exe.read_bytes() == original
    assert not (tmp_path / 'luatools-fix-log-74.log').exists()


def test_native_failure_falls_back_only_when_unchanged(monkeypatch, tmp_path):
    exe = setup_game(monkeypatch, tmp_path)
    monkeypatch.setattr(steamstub, 'native_ready', lambda: True)
    monkeypatch.setattr(steamstub.subprocess, 'run', lambda *a, **k: subprocess.CompletedProcess(a, 3, '', 'No Wine'))
    calls = []
    monkeypatch.setattr(steamstub, '_legacy_unstub', lambda *a: calls.append(a) or {'success': True})
    assert steamstub.unstub(75, str(tmp_path))['success']
    assert len(calls) == 1
    def changed(*a, **k):
        exe.write_bytes(b'corrupted')
        return subprocess.CompletedProcess(a, 4, '', '')
    monkeypatch.setattr(steamstub.subprocess, 'run', changed)
    exe.write_bytes(wrapped())
    assert not steamstub.unstub(75, str(tmp_path))['success']
    assert len(calls) == 1


def test_no_processing_without_backup(monkeypatch, tmp_path):
    setup_game(monkeypatch, tmp_path)
    monkeypatch.setattr(fixes, '_stash_original', lambda *a: False)
    monkeypatch.setattr(steamstub, '_legacy_unstub', lambda *a: (_ for _ in ()).throw(AssertionError()))
    assert not steamstub.unstub(76, str(tmp_path))['success']


def test_helper_kit_deployment(monkeypatch, tmp_path):
    source = tmp_path / 'archive'
    script = source / 'tools/steamstub-bypass/run-steamless.sh'
    script.parent.mkdir(parents=True)
    script.write_text('#!/bin/sh\n')
    kit = source / 'tools/steamless-bin'
    kit.mkdir()
    (kit / 'Steamless.CLI.exe').write_bytes(b'kit')
    target = tmp_path / 'installed'
    monkeypatch.setattr(slssteam, 'lib_dir', lambda: str(target))
    monkeypatch.setattr(slssteam, '_chown_to_user', lambda _: None)
    assert slssteam._place_steamstub_tools(str(source))
    assert os.access(target / 'tools/steamstub-bypass/run-steamless.sh', os.X_OK)
    assert (target / 'tools/steamless-bin/Steamless.CLI.exe').read_bytes() == b'kit'


def test_isolation_status_is_read_only(monkeypatch, tmp_path):
    p = tmp_path / '123'
    p.mkdir()
    (p / 'comm').write_text('steam\n')
    (p / 'maps').write_text('/test/SLSsteam.so\n/test/libmillennium.so\n')
    (p / 'status').write_text('PPid:\t12\n')
    (p / 'cgroup').write_text('0::/app/steam-launcher.service')
    (p / 'environ').write_bytes(b'SECRET=do-not-log\0SLS_PASSIVE=1\0')
    monkeypatch.setattr(slssteam, '_home', lambda: str(tmp_path))
    r = slssteam._isolation_diagnostics(str(tmp_path))
    assert r['processes'][0]['passive'] is True
    assert r['processes'][0]['millenniumMapped'] is True
    assert 'SECRET' not in str(r)


def test_missing_original_keeps_restore_record(monkeypatch, tmp_path):
    setup_game(monkeypatch, tmp_path)
    fixes._write_fix_log(str(tmp_path), 77, 'Game', 'SteamStub removal',
                         'steamstub-managed', ['game.exe'], ['game.exe'])
    fixes._unfix_worker(77, str(tmp_path), None, preserve_unlockers=True)
    assert fixes._get_unfix_state(77)['status'] == 'failed'
    assert (tmp_path / 'luatools-fix-log-77.log').exists()


def test_archive_reapply_uses_helper_not_downloader(monkeypatch, tmp_path):
    from py_modules.lt import buildarchive
    calls = []
    monkeypatch.setattr(steamstub, 'unstub', lambda *a: calls.append(a) or {'success': True})
    monkeypatch.setattr(fixes, 'apply_game_fix', lambda *a, **k: (_ for _ in ()).throw(AssertionError('not a URL')))
    buildarchive._fix_reapply_worker(78, str(tmp_path), 'Game', [{'downloadUrl': 'steamstub-managed'}])
    assert calls == [(78, str(tmp_path), 'Game')]
