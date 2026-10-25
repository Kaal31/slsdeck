from pathlib import Path

from py_modules.lt import slssteam


ROOT = Path(__file__).resolve().parents[1]


def test_gamescope_activation_restores_steam_sh_and_does_not_double_wrap(monkeypatch):
    monkeypatch.setattr(slssteam, "refresh_patterns_now", lambda: {"success": True})
    monkeypatch.setattr(slssteam, "install_gamescope_hook", lambda: {"success": True, "hook": "/hook"})
    monkeypatch.setattr(slssteam, "_restore_steam_sh", lambda: True)
    monkeypatch.setattr(slssteam, "_reset_inject_failsafe", lambda: None)
    monkeypatch.setattr(slssteam, "_path_wrapper", lambda: "/path/steam")
    monkeypatch.setattr(
        slssteam,
        "_activate_steam_sh_wrapper",
        lambda: (_ for _ in ()).throw(AssertionError("steam.sh must not also be wrapped")),
    )

    result = slssteam.activate_injection()

    assert result["success"] is True
    assert result["method"] == "gamescope"
    assert result["steamShRestored"] is True


def test_failed_preflight_disarms_existing_hooks(monkeypatch):
    calls = []
    monkeypatch.setattr(slssteam, "refresh_patterns_now", lambda: {"success": False, "message": "bad patterns"})
    monkeypatch.setattr(slssteam, "remove_gamescope_hook", lambda: calls.append("remove-hook"))
    monkeypatch.setattr(slssteam, "_restore_steam_sh", lambda: calls.append("restore-steam") or True)

    result = slssteam.activate_injection()

    assert result["success"] is False
    assert result["steamShRestored"] is True
    assert calls == ["remove-hook", "restore-steam"]


def test_boot_watchdog_never_restarts_or_repins(monkeypatch):
    events = []
    monkeypatch.setattr(slssteam, "find_installed_lib", lambda: "/moon/SLSsteam.so")
    monkeypatch.setattr(slssteam, "refresh_patterns", lambda: {"success": True})
    monkeypatch.setattr(slssteam, "_running_injected", lambda: False)
    monkeypatch.setattr(slssteam, "_injection_active", lambda: True)
    monkeypatch.setattr(slssteam, "_push_injection_event", lambda level, message: events.append((level, message)))
    monkeypatch.setattr(
        slssteam,
        "restart_steam_apply",
        lambda: (_ for _ in ()).throw(AssertionError("watchdog must not restart Steam")),
    )
    monkeypatch.setattr(
        slssteam,
        "start_client_fix",
        lambda: (_ for _ in ()).throw(AssertionError("watchdog must not run Headcrab")),
    )

    slssteam.boot_injection_watchdog()

    assert events and "boot loop" in events[0][1]


def test_frontend_boot_dependency_pass_is_read_only():
    source = (ROOT / "src/index.tsx").read_text(encoding="utf-8")
    start = source.index("async function checkDependenciesFromPluginLifecycle")
    end = source.index("// SLSsteam goes inactive", start)
    body = source[start:end]
    assert "Promise.allSettled" in body
    assert "installSlssteam(" not in body
    assert "runClientFix(" not in body
    assert "EnsureInstalled(" not in body
