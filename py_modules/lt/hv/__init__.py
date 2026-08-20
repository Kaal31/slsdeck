"""Vendored HV-Decky backend (cpuid_fault_emulation kernel-module manager).

HV-Decky (by "Pareidolia?") builds/loads/unloads the anti-Denuvo
``cpuid_fault_emulation`` kernel module, runs a userspace cpuid-faulting self
test, ships a ``umipcompatd`` daemon (UMIP compatibility without disabling it
system-wide), detects native kernel cpuid support, and watches Steam's game log
to toggle HV per-game. We vendor its class mixins verbatim and expose a single
facade instance so the plugin can call its async methods directly.
"""

from __future__ import annotations

import asyncio

from .core import Core
from .operations import Operations
from .system import System
from .games import Games
from .umip import Umip


class HV(Operations, Games, System, Umip, Core):
    """Composes the HV-Decky mixins into one standalone object. Only Core defines
    __init__, so HV() initialises all the shared instance state (locks, process
    handles, config) via Core.__init__."""

    async def start(self) -> None:
        """Replicates HV-Decky's Plugin._main: begin the per-game HV lifecycle
        (steam-log watcher, or one-shot reconcile) so the module is applied to
        flagged games automatically."""
        try:
            self._reset_session_log()
        except Exception:
            pass
        try:
            if self.game_watcher_mode == "steam_log":
                self._game_log_task = asyncio.create_task(self._watch_steam_game_log())
            else:
                self._running_game_ids = self._running_steam_games()
                await self._reconcile_game_hv()
        except Exception:
            pass

    async def stop(self) -> None:
        """Replicates HV-Decky's Plugin._unload: stop the watcher and unload the
        watcher-loaded module."""
        try:
            await self._stop_game_log_watcher()
        except Exception:
            pass
        try:
            if getattr(self, "_watcher_module_name", None) is not None:
                async with self._operation_lock:
                    await self._unload_module_path(
                        self._watcher_module_path, "The module path is not available.")
                self._watcher_module_path = None
                self._watcher_module_name = None
        except Exception:
            pass


# Process-wide singleton — the kernel module / daemon are global resources.
_instance: HV | None = None


def get_hv() -> HV:
    global _instance
    if _instance is None:
        _instance = HV()
    return _instance
