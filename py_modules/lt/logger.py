"""Logging shim that routes to decky.logger when available."""

from __future__ import annotations

try:
    import decky  # type: ignore

    _dl = decky.logger
except Exception:  # pragma: no cover - fallback when running outside decky
    import logging

    _dl = logging.getLogger("luatools")
    if not _dl.handlers:
        logging.basicConfig(level=logging.INFO)


class _Logger:
    def log(self, message: str) -> None:
        try:
            _dl.info(message)
        except Exception:
            print(f"[SLSDeck] {message}")

    def info(self, message: str) -> None:
        self.log(message)

    def debug(self, message: str) -> None:
        # decky.logger exposes debug(); the logging fallback does too. Route
        # through whichever exists, else fall back to info so a missing debug
        # level can never raise (an AttributeError here previously crashed the
        # lua.tools catalog fetch).
        try:
            fn = getattr(_dl, "debug", None)
            if callable(fn):
                fn(message)
            else:
                _dl.info(message)
        except Exception:
            print(f"[SLSDeck][DEBUG] {message}")

    def warn(self, message: str) -> None:
        try:
            _dl.warning(message)
        except Exception:
            print(f"[SLSDeck][WARN] {message}")

    def warning(self, message: str) -> None:  # alias — some callers use warning()
        self.warn(message)

    def error(self, message: str) -> None:
        try:
            _dl.error(message)
        except Exception:
            print(f"[SLSDeck][ERROR] {message}")


logger = _Logger()
