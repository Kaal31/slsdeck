import threading
from types import SimpleNamespace

from py_modules.lt import fixes


def reset_mirror(monkeypatch):
    monkeypatch.setattr(fixes, '_pero_cache', None)
    monkeypatch.setattr(fixes, '_pero_ts', 0)
    monkeypatch.setattr(fixes, '_pero_ok', False)


def test_404_is_not_retried_and_failure_is_cached(monkeypatch):
    reset_mirror(monkeypatch)
    calls = []
    def get(*a, **k):
        calls.append(a)
        return SimpleNamespace(status_code=404, text='not found')
    monkeypatch.setattr(fixes, 'ensure_http_client', lambda _: SimpleNamespace(get=get))
    assert fixes._pero_fetch() == []
    assert fixes.resolve_online_fix('Some Game') is None
    assert fixes._pero_near_matches('Some Game') == []
    assert len(calls) == 1


def test_transient_failure_preserves_stale_data(monkeypatch):
    reset_mirror(monkeypatch)
    stale = [{'name': 'Some Game', 'href': 'some.rar'}]
    monkeypatch.setattr(fixes, '_pero_cache', stale)
    def get(*a, **k):
        raise OSError('offline')
    monkeypatch.setattr(fixes, 'ensure_http_client', lambda _: SimpleNamespace(get=get))
    assert fixes._pero_fetch() == stale
    assert not fixes._pero_ok


def test_deadline_returns_partial_and_coalesces_work(monkeypatch):
    monkeypatch.setattr(fixes, '_CHECK_JOBS', {})
    monkeypatch.setattr(fixes, '_CHECK_WAIT', 0.01)
    release = threading.Event()
    finished = threading.Event()
    calls = []
    def slow(appid, name, partial):
        calls.append(appid)
        partial['genericFix'] = {'available': True, 'status': 200, 'url': 'https://example.invalid/fix'}
        try:
            release.wait(2)
            return partial
        finally:
            finished.set()
    monkeypatch.setattr(fixes, '_check_for_fixes_impl', slow)
    try:
        first = fixes.check_for_fixes(99, 'Game')
        second = fixes.check_for_fixes(99, 'Game')
        assert first['partialResults'] and second['partialResults']
        assert first['genericFix']['available']
        assert calls == [99]
    finally:
        release.set()
        assert finished.wait(2)


def test_supplied_catalogue_does_not_refetch(monkeypatch):
    monkeypatch.setattr(fixes, '_pero_fetch', lambda: (_ for _ in ()).throw(AssertionError('duplicate fetch')))
    entries = [{'name': 'Example Game', 'href': 'game.rar'}]
    assert fixes.resolve_online_fix('Example Game', entries)['name'] == 'Example Game'
    assert fixes._pero_near_matches('Example', entries=entries) == ['Example Game']
