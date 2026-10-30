# Bundled Python Steamless

Upstream: https://github.com/niwia/ASSella
File: src/deps/steamless.py
Pinned commit: cfc49ef91323c07aa913bceda283c23f347225c8
Source: https://github.com/niwia/ASSella/blob/cfc49ef91323c07aa913bceda283c23f347225c8/src/deps/steamless.py

The Python source is bundled unchanged. SLSDeck runs it as a standalone tool,
not inside Decky's frozen Python process. Dependencies are pycryptodome 3.23.0
and capstone 5.0.6, installed into the desktop user's dedicated virtual
environment on first fallback use. Moon's bundled helper remains first choice.

SLSDeck passes --output to write into a temporary directory, validates the
result, then replaces the executable. Existing SLSDeck originals and fix logs
provide Un-fix recovery. The retired upstream steamless-aio.sh is not downloaded
or executed, including any old cached copy.
