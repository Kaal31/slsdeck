"""SLSDeck Decky backend package.

Deliberately does NOT eagerly import its submodules. A previous version listed
every module here, so merely touching ``lt`` pulled all of them in -- including
the httpx-backed network modules and the games database -- before the plugin had
been asked to do anything. ``from lt import steam`` resolves the submodule by
itself, so the eager list bought nothing and cost startup time and memory on
every load and every Decky hot-reload. It also silently went stale: it never
listed ``hypervisor`` or ``proton``.
"""

# main.py imports these modules during backend startup anyway. Install the small
# compatibility/policy wrappers here so they are active before the first RPC.
try:
    from . import downloads as _downloads
    from . import live_refresh as _live_refresh
    _live_refresh.patch_downloads(_downloads)
except Exception:
    pass

try:
    from . import slssteam as _slssteam
    from . import survival_backup as _survival_backup
    _survival_backup.patch(_slssteam, _downloads)
except Exception:
    pass

try:
    from . import depotdl as _depotdl
    from . import watchdog as _watchdog
    from . import depot_cleanup as _depot_cleanup
    _depot_cleanup.patch_depotdl(_depotdl)
    _depot_cleanup.patch_watchdog(_watchdog)
except Exception:
    # v1/simple builds intentionally ship without depotdl.py.
    pass

try:
    from . import cloudredirect as _cloudredirect
    from . import cloudredirect_reinstall as _cloudredirect_reinstall
    _cloudredirect_reinstall.patch(_cloudredirect)
except Exception:
    pass

# QAM policy: first-time Install must always show when the engine is absent, but
# the optional Reinstall control on game pages is hidden by default. Existing
# users who explicitly enabled the old toggle keep their choice.
try:
    from . import settings as _settings
    def _get_show_reinstall_qam_default_hidden():
        return bool(_settings.get_value("showReinstallQam", False))
    _settings.get_show_reinstall_qam = _get_show_reinstall_qam_default_hidden
except Exception:
    pass
