"""SLSDeck Decky backend package.

Deliberately does NOT eagerly import its submodules. A previous version listed
every module here, so merely touching ``lt`` pulled all of them in -- including
the httpx-backed network modules and the games database -- before the plugin had
been asked to do anything. ``from lt import steam`` resolves the submodule by
itself, so the eager list bought nothing and cost startup time and memory on
every load and every Decky hot-reload. It also silently went stale: it never
listed ``hypervisor`` or ``proton``.
"""

# main.py imports ``downloads`` during backend startup anyway. Import it once here
# so the slsteam-moon live-refresh wrapper is installed deterministically before
# the first Add Game request can start; this does not add a new module to the
# steady-state backend because main imports downloads immediately afterwards.
try:
    from . import downloads as _downloads
    from . import live_refresh as _live_refresh
    _live_refresh.patch_downloads(_downloads)
except Exception:
    # Never make package import fatal. The unchanged downloader remains the
    # restart-based fallback if a future module layout breaks this optional layer.
    pass
