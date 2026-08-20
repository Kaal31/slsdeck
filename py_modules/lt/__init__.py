"""SLSDeck Decky backend package.

Deliberately does NOT eagerly import its submodules. A previous version listed
every module here, so merely touching ``lt`` pulled all of them in -- including
the httpx-backed network modules and the games database -- before the plugin had
been asked to do anything. ``from lt import steam`` resolves the submodule by
itself, so the eager list bought nothing and cost startup time and memory on
every load and every Decky hot-reload. It also silently went stale: it never
listed ``hypervisor`` or ``proton``.
"""
