"""SLSDeck for Decky Loader — SteamOS / Steam Deck port.

Adds and removes games from the Steam library on SteamOS. The Windows-only
SteamTools ``.lua`` loader is replaced by **SLSsteam** (an ``LD_AUDIT``
steamclient hook driven by ``~/.config/SLSsteam/config.yaml``); games are added
by registering their AppId under ``AdditionalApps``. Manifest ``.lua`` downloads
are kept as a fallback. The plugin also manages a guided SLSsteam install via
h3adcr-b, multiple per-source API keys, and game fixes.

The heavy lifting lives in the ``lt`` package under ``py_modules``. Each public
method here is callable from the frontend through @decky/api. Blocking network
work is dispatched to a thread pool so the plugin's asyncio loop stays
responsive; long downloads run in their own daemon threads and are polled by the
frontend via the ``*_status`` methods.
"""

import asyncio
import functools
import os
from typing import Any, Dict, List

import decky

from lt import (apis, art, audit, backup, buildhistory, buildpicker, cloudredirect, cloudsave, compat, crakfiles, creamysteamy, custom_fixes, denuvo, dlc,
                dlcunlockers, downloads, fixes, hvauto, hypervisor, luatools, netsock, online_patch,
                opensave, pinsource, proton, ryuu, settings, slssteam, smokeapi, steam, steamstub, storage,
                updates, watchdog, workshop, multiplayer, tokeer,
)
from lt.httpc import close_http_client
from lt.hv import get_hv

# v2 (slsdeckdlc) only: the trimmed DepotDownloader path for older-build /
# content-DLC downloads. Excluded from the v1 (slsdecksimple) package, so import
# it guarded — the plugin runs fine without it and the UI hides the v2 buttons.
try:
    from lt import depotdl as _depotdl
except Exception:
    _depotdl = None


def _hv_norm(r: Dict[str, Any]) -> Dict[str, Any]:
    """The HV module returns {'ok': bool, 'message': str, ...} but the frontend
    reads {success, error/message}. Without this every HV op (build/deps/load)
    shows a generic 'Failed' even on success, and the real reason is dropped."""
    if isinstance(r, dict) and "success" not in r:
        ok = bool(r.get("ok"))
        r = {**r, "success": ok}
        if not ok and not r.get("error"):
            r["error"] = r.get("message") or "Failed"
    return r


class Plugin:
    # ── Tokeer / Anti-Denuvo ────────────────────────────────────────────────
    async def tokeer_quota_probe(self) -> Dict[str, Any]:
        # Kept for compatibility with older frontends.
        return await self._run(tokeer.runtime_status)

    async def tokeer_runtime_status(self) -> Dict[str, Any]:
        return await self._run(tokeer.runtime_status)

    async def tokeer_prepare(self, appid: int) -> Dict[str, Any]:
        return await self._run(tokeer.prepare, appid)

    async def tokeer_verify(self, appid: int) -> Dict[str, Any]:
        return await self._run(tokeer.verify, appid)

    async def tokeer_redeem(self, code: str) -> Dict[str, Any]:
        return await self._run(tokeer.redeem, code)

    # ── Grid Artwork Sync ──────────────────────────────────────────────────
    async def sync_game_art(self, appid: int, overwrite: bool = False) -> Dict[str, Any]:
        return await self._run(art.sync_game_art, appid, overwrite)

    async def sync_all_added_art(self, overwrite: bool = False) -> Dict[str, Any]:
        return await self._run(art.sync_all_added_art, overwrite)

    # ── System Audit & Auto-Repair ──────────────────────────────────────────
    async def run_system_audit(self) -> Dict[str, Any]:
        return await self._run(audit.system_health_audit)

    async def auto_repair_system(self) -> Dict[str, Any]:
        return await self._run(audit.auto_repair_system)

    async def repair_game(self, appid: int) -> Dict[str, Any]:
        return await self._run(audit.repair_game, appid)

    # ── Proton Compatibility & Mapping ─────────────────────────────────────
    async def get_proton_mapping(self, appid: int) -> Dict[str, Any]:
        return await self._run(compat.get_proton_mapping, appid)

    async def set_proton_mapping(self, appid: int, tool_name: str, priority: str = "250") -> Dict[str, Any]:
        return await self._run(compat.set_proton_mapping, appid, tool_name, priority)

    async def remove_proton_mapping(self, appid: int) -> Dict[str, Any]:
        return await self._run(compat.remove_proton_mapping, appid)

    async def list_installed_proton_tools(self) -> Dict[str, Any]:
        return await self._run(compat.list_installed_proton_tools)

    # ── Backup & Restore ────────────────────────────────────────────────────
    async def create_backup(self, dest_path: str = "", include_keys: bool = True,
                            include_saves: bool = True) -> Dict[str, Any]:
        # include_keys=False strips API keys from the archived settings.json --
        # worth defaulting off in the UI for a backup the user intends to share.
        return await self._run(backup.create_backup, dest_path, include_keys, include_saves)

    async def restore_backup(self, archive_path: str) -> Dict[str, Any]:
        return await self._run(backup.restore_backup, archive_path)

    async def list_backups(self) -> Dict[str, Any]:
        return await self._run(backup.list_backups)

    async def purge_all_added(self) -> Dict[str, Any]:
        return await self._run(downloads.purge_all_added)

    # ── Multi-Storage & Drive Management ────────────────────────────────────
    async def get_storage_info(self) -> Dict[str, Any]:
        return await self._run(storage.get_storage_info)

    async def clean_temp_downloads(self) -> Dict[str, Any]:
        return await self._run(storage.clean_temp_downloads)

    # ── OnlineFix Auto-Patch Engine ─────────────────────────────────────────
    async def check_multiplayer(self, appid: int) -> Dict[str, Any]:
        """Which multiplayer path (if any) this game can actually use."""
        return await self._run(multiplayer.check_multiplayer, appid)

    async def patch_game_onlinefix(self, appid: int) -> Dict[str, Any]:
        return await self._run(online_patch.patch_game_onlinefix, appid)

    async def auto_patch_all_onlinefix(self) -> Dict[str, Any]:
        return await self._run(online_patch.auto_patch_all_onlinefix)

    # ── Proton Savegame Backup Manager ──────────────────────────────────────
    async def backup_game_saves(self, appid: int, dest_dir: str = "") -> Dict[str, Any]:
        return await self._run(cloudsave.backup_game_saves, appid, dest_dir)

    async def restore_game_saves(self, appid: int, zip_path: str) -> Dict[str, Any]:
        return await self._run(cloudsave.restore_game_saves, appid, zip_path)

    async def list_game_save_backups(self, appid: int, dest_dir: str = "") -> Dict[str, Any]:
        return await self._run(cloudsave.list_game_save_backups, appid, dest_dir)

    # ── Background Self-Healing Watchdog ────────────────────────────────────
    async def start_watchdog(self) -> Dict[str, Any]:
        return watchdog.start_watchdog(self.loop)

    async def stop_watchdog(self) -> Dict[str, Any]:
        return watchdog.stop_watchdog()

    async def get_watchdog_status(self) -> Dict[str, Any]:
        return watchdog.get_watchdog_status()
    # ── lifecycle ─────────────────────────────────────────────────────────
    async def _main(self):
        self.loop = asyncio.get_event_loop()
        decky.logger.info("SLSDeck: bootstrapping")
        try:
            path = steam.detect_steam_install_path()
            decky.logger.info(f"SLSDeck: Steam path = {path or 'NOT FOUND'}")
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: steam detection failed: {exc}")

        # Depot keys live in Steam's config.vdf, which Steam rewrites from memory
        # on exit -- so any key written while Steam is up is discarded. Decky
        # usually starts before Steam on a cold boot, and that gap is the one
        # reliable window to (re-)apply them. Network-free and idempotent.
        def _provision_if_steam_down():
            try:
                if steam.steam_is_running():
                    return  # would just be discarded; the UI offers a restart flow
                res = steam.provision_all_added_depots()
                keys = (res.get("keys") or {}).get("written", 0)
                if keys:
                    decky.logger.info(f"SLSDeck: re-applied {keys} depot key(s) at boot")
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: boot provisioning failed: {exc}")

        # Boot: keep the OpenSave engine running (survives Game-Mode switches)
        # and check every GitHub-sourced tool/DLL for a newer release. Lightweight
        # deps auto-update if the user has it on; heavy ones (Proton, HV module)
        # are only flagged. All network/subprocess, so it lives in the warm-up
        # pool, not the RPC executor.
        def _boot_cloud_and_updates():
            try:
                if opensave.have_cli():
                    opensave.ensure_daemon()
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: opensave daemon boot failed: {exc}")
            try:
                res = updates.boot_check()
                if res.get("available"):
                    decky.logger.info("SLSDeck: dependency updates available: "
                                      + ", ".join(res["available"]))
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: update boot-check failed: {exc}")
            # On a PLUGIN update (version changed since last boot), force a fresh
            # check of the engine + headcrab regardless of their toggles, and toast
            # the result — so a new plugin build doesn't leave the user on a stale
            # slsteam-moon / headcrab. Runs once per version bump.
            try:
                cur_v = ""
                try:
                    import json as _json
                    pj = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plugin.json")
                    with open(pj, "r", encoding="utf-8") as _fh:
                        cur_v = str(_json.load(_fh).get("version", "")).strip()
                except Exception:
                    cur_v = ""
                last_v = settings.get_last_plugin_version()
                if cur_v and cur_v != last_v:
                    # Record the new plugin version silently. We deliberately do NOT
                    # toast the user to reinstall the engine / re-run the client fix
                    # on a plugin update — engine + headcrab updates stay opt-in via
                    # the Updates tab and Dependencies, never nagged on every bump.
                    if last_v:
                        decky.logger.info(f"SLSDeck: plugin updated {last_v} -> {cur_v}")
                    settings.set_last_plugin_version(cur_v)
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: plugin-update recheck failed: {exc}")

        # Warm up caches / indexes in the background so the UI is snappy.
        #
        # These MUST NOT share the default executor with _run(). asyncio's default
        # pool is min(32, cpu+4) = 12 threads on a Deck and there are 11 warm-ups,
        # several of which do network I/O or spawn subprocesses and can sit for many
        # seconds. Dispatching them all to the default pool leaves almost no worker
        # for real RPCs, so the first thing the user taps after opening the panel
        # queues behind cache warming and the UI appears frozen. Give them their own
        # small pool, and run them sequentially inside it so they cannot pile up.
        import concurrent.futures
        self._warmup_pool = concurrent.futures.ThreadPoolExecutor(
            max_workers=1, thread_name_prefix="slsdeck-warmup")

        warmups = (apis.init_apis, downloads.init_applist, downloads.init_games_db,
                   fixes.init_fixes_index, ryuu.init, slssteam.ensure_launch_wrapper,
                   slssteam.boot_desktop_icon_guard, slssteam.boot_injection_watchdog,
                   _provision_if_steam_down, _boot_cloud_and_updates)

        # HV (cpuid_fault_emulation) per-game lifecycle: start the HV-Decky
        # watcher so flagged games get the module automatically.
        try:
            if settings.get_hv_autoload():
                asyncio.create_task(get_hv().start())
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: HV watcher start failed: {exc}")

        def _warm_all():
            for fn in warmups:
                try:
                    fn()
                except Exception as exc:
                    decky.logger.warning(
                        f"SLSDeck: warm-up {getattr(fn, '__name__', fn)} failed: {exc}")

        try:
            self._warmup_pool.submit(_warm_all)
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: could not start warm-up: {exc}")

        # Proactively resolve Denuvo status for the games we've added so their
        # DENUVO badge shows without browsing to each. Cached under
        # ~/.config/slsdeck; survives reinstalls.
        def _warm_denuvo():
            try:
                apps = downloads.get_installed_apps().get("apps", [])
                ids = [int(a["appid"]) for a in apps if a.get("appid")]
                if ids:
                    denuvo.resolve(ids)
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: denuvo warm-up failed: {exc}")
        # Start the background self-healing watchdog daemon (checks health & auto-repairs OS updates every 5 min)
        try:
            watchdog.start_watchdog(self.loop)
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: failed to start watchdog: {exc}")

        # Reconcile manifest pins: a game in the applied-fixes list should stay
        # version-pinned, but the pin (config.yaml) is only written at fix-apply
        # time — so after a reinstall (fix list inherited from the game folder)
        # or a failed original pin, re-pin any installed fixed-but-unpinned game.
        def _repin_fixed_games():
            try:
                if not settings.get_pin_on_fix():
                    return
                for fx in (fixes.get_installed_fixes().get("fixes", []) or []):
                    try:
                        appid = int(fx.get("appid", 0))
                    except Exception:
                        continue
                    if not appid:
                        continue
                    try:
                        if not slssteam.is_pinned(appid):
                            slssteam.pin_app_current(appid)  # no-op if not installed
                    except Exception:
                        pass
                    try:
                        steam.set_only_update_on_launch(appid)
                    except Exception:
                        continue
            except Exception as exc:
                decky.logger.warning(f"SLSDeck: re-pin reconcile failed: {exc}")
        try:
            self.loop.run_in_executor(None, _repin_fixed_games)
        except Exception:
            pass

    async def _unload(self):
        decky.logger.info("SLSDeck: unloading")
        # Decky reloads plugins in place (file watcher, update, manual reload). If
        # the background daemons and pools are not stopped here they survive the
        # reload, so each cycle leaves another watchdog loop and another thread
        # pool running -- which is why memory crept up over a session.
        try:
            watchdog.stop_watchdog()
        except Exception:
            pass
        try:
            await get_hv().stop()
        except Exception:
            pass
        try:
            pool = getattr(self, "_warmup_pool", None)
            if pool is not None:
                pool.shutdown(wait=False, cancel_futures=True)
        except Exception:
            pass
        try:
            close_http_client("unload")
        except Exception:
            pass

    async def _uninstall(self):
        decky.logger.info("SLSDeck: uninstalled — live-safe deactivate only")
        # IMPORTANT: Decky runs this while Steam is LIVE with moon injected. moon
        # keeps a CFileWatcher on ~/.config/SLSsteam/config.yaml inside the Steam
        # process, so rmtree-ing the moon data / stplug-in / added-game
        # appmanifests out from under the running client crashes Steam (and would
        # also wipe the user's added games unexpectedly on a mere plugin removal).
        #
        # So uninstall now does only the reversible, live-safe part: restore
        # steam.sh (next launch is vanilla, no injection) + drop the update block
        # + stop our daemons. Leftover moon files are inert once injection is off.
        # A deliberate, Steam-restarting "remove everything" flow is the place for
        # the destructive nuke — never an in-session plugin uninstall.
        try:
            slssteam.deactivate_injection()
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: uninstall deactivate failed: {exc}")
        # Cleanly remove the slsteam-moon ENGINE binaries + headcrab artifacts. This
        # is live-safe: the mapped .so keeps working this session (Linux keeps the
        # inode) and next launch is vanilla. It deliberately leaves ~/.config/SLSsteam
        # (moon's watched config — deleting it live can crash Steam) and the user's
        # added-game luas; the "Remove everything" flow nukes those with a restart.
        try:
            slssteam.remove_engine_and_headcrab_livesafe()
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: uninstall engine/headcrab removal failed: {exc}")
        # Stop background daemons/pools so nothing survives the removal.
        try:
            watchdog.stop_watchdog()
        except Exception:
            pass
        try:
            await get_hv().stop()
        except Exception:
            pass
        try:
            pool = getattr(self, "_warmup_pool", None)
            if pool is not None:
                pool.shutdown(wait=False, cancel_futures=True)
        except Exception:
            pass
        try:
            close_http_client("uninstall")
        except Exception:
            pass

    async def full_uninstall_cleanup(self) -> Dict[str, Any]:
        """Manual 'Remove SLSsteam completely' — same as the uninstall nuke."""
        return await self._run(slssteam.full_uninstall_cleanup)

    # ── helper ────────────────────────────────────────────────────────────
    async def _run(self, fn, *args):
        """Run a blocking backend callable in the executor with safe error handling."""
        try:
            return await self.loop.run_in_executor(None, functools.partial(fn, *args))
        except Exception as exc:
            decky.logger.warning(f"SLSDeck: RPC {getattr(fn, '__name__', str(fn))} failed: {exc}")
            return {"success": False, "error": str(exc)}

    # ── environment / status ──────────────────────────────────────────────
    async def get_steam_status(self) -> Dict[str, Any]:
        try:
            path = steam.detect_steam_install_path()
            stplug = steam.stplugin_dir()
            import os
            return {
                "success": bool(path),
                "steamPath": path,
                "stplugInDir": stplug,
                "stplugInExists": bool(stplug) and os.path.exists(stplug),
            }
        except Exception as exc:
            return {"success": False, "error": str(exc), "steamPath": "", "stplugInDir": "", "stplugInExists": False}

    async def has_lua(self, appid: int) -> Dict[str, Any]:
        try:
            return downloads.has_luatools_for_app(int(appid))
        except Exception as exc:
            return {"success": False, "exists": False, "slssteam": False, "error": str(exc)}

    # ── SLSsteam (SteamOS replacement for SteamTools) ─────────────────────
    async def get_slssteam_status(self) -> Dict[str, Any]:
        return await self._run(slssteam.get_status)

    async def system_status(self) -> Dict[str, Any]:
        return await self._run(slssteam.system_status)

    async def disable_foreign_engines(self) -> Dict[str, Any]:
        return await self._run(slssteam.disable_foreign_engines)

    async def install_slssteam(self) -> Dict[str, Any]:
        return slssteam.start_install()

    async def get_slssteam_install_status(self) -> Dict[str, Any]:
        return slssteam.get_install_status()

    async def reload_steam(self) -> Dict[str, Any]:
        """Best-effort backend Steam restart (frontend prefers SteamClient)."""
        return await self._run(steam.restart_steam)

    async def activate_injection(self) -> Dict[str, Any]:
        """Patch steam.sh with the scoped LD_AUDIT wrapper (rootless)."""
        return await self._run(slssteam.activate_injection)

    async def deactivate_injection(self) -> Dict[str, Any]:
        """Restore the original steam.sh (removes the LD_AUDIT wrapper)."""
        return await self._run(slssteam.deactivate_injection)

    async def get_wrapper_option(self) -> Dict[str, Any]:
        return {"success": True, "skip": settings.get_skip_wrapper()}

    async def set_wrapper_option(self, skip: bool) -> Dict[str, Any]:
        settings.set_skip_wrapper(skip)
        return {"success": True}

    async def get_diagnostics(self) -> Dict[str, Any]:
        """Report the exact install/injection state to debug why games don't show."""
        return await self._run(slssteam.get_diagnostics)

    async def injection_health(self) -> Dict[str, Any]:
        return await self._run(slssteam.injection_health)

    async def refresh_patterns(self) -> Dict[str, Any]:
        """Manually re-resolve the engine's Steam-binary patterns against the
        current client (fixes 'Failed to find all patterns' after a Steam update),
        capturing output + current-vs-supported client build for the UI."""
        return await self._run(slssteam.refresh_patterns_now)

    async def restart_steam_apply(self) -> Dict[str, Any]:
        """Full Steam restart that re-execs steam.sh (applies an injection change)."""
        return await self._run(slssteam.restart_steam_apply)

    async def pop_injection_events(self) -> Dict[str, Any]:
        return slssteam.pop_injection_events()

    async def get_auto_reinject(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_reinject()}

    async def set_auto_reinject(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_reinject(bool(enabled))
        return {"success": True}

    async def get_auto_client_repin(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_client_repin()}

    async def set_auto_client_repin(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_client_repin(bool(enabled))
        return {"success": True}

    async def run_client_fix(self, force: bool = False) -> Dict[str, Any]:
        """Run the real h3adcr-b (shimmed for SteamOS) to pin/downgrade the Steam
        client to a version SLSsteam's patterns support (auto-reboot on install
        is handled by headcrab / the SLSsteam flow).

        Skips itself when SLSsteam already loads cleanly against the installed
        client -- running it needlessly costs a ~170 MB Steam client re-download.
        Pass force=True to override."""
        try:
            return slssteam.start_client_fix(force=bool(force))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def client_fix_needed(self) -> Dict[str, Any]:
        """Report whether a client pin/downgrade is actually required."""
        try:
            return {"success": True, **slssteam.client_fix_needed()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_ever_added(self) -> Dict[str, Any]:
        return {"success": True, "appids": settings.get_ever_added()}

    async def get_installed_apps(self) -> Dict[str, Any]:
        return await self._run(downloads.get_installed_apps)

    # ── add / remove lua ──────────────────────────────────────────────────
    async def start_add(self, appid: int) -> Dict[str, Any]:
        try:
            return downloads.start_add(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_add_status(self, appid: int) -> Dict[str, Any]:
        try:
            return downloads.get_add_status(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc), "state": {}}

    async def cancel_add(self, appid: int) -> Dict[str, Any]:
        try:
            return downloads.cancel_add(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def pop_add_events(self) -> Dict[str, Any]:
        """Drain completed-add events for the persistent notifier."""
        return downloads.pop_add_events()

    async def delete_lua(self, appid: int) -> Dict[str, Any]:
        return await self._run(downloads.delete_luatools_for_app, appid)

    async def get_installed_lua(self) -> Dict[str, Any]:
        return await self._run(downloads.get_installed_lua_scripts)

    async def read_loaded_apps(self) -> Dict[str, Any]:
        return await self._run(downloads.read_loaded_apps)

    async def check_apis(self, appid: int) -> Dict[str, Any]:
        return await self._run(downloads.check_apis_for_app, appid)

    # ── search ────────────────────────────────────────────────────────────
    async def search_games(self, query: str, limit: int = 25) -> Dict[str, Any]:
        try:
            results = await self._run(downloads.search_games, query, limit)
            return {"success": True, "results": results}
        except Exception as exc:
            return {"success": False, "error": str(exc), "results": []}

    # ── manifest sources / api key ────────────────────────────────────────
    async def get_api_list(self) -> Dict[str, Any]:
        return await self._run(apis.get_api_list)

    async def fetch_free_apis(self) -> Dict[str, Any]:
        return await self._run(apis.fetch_free_apis_now)

    async def get_api_key(self) -> Dict[str, Any]:
        return {"success": True, "apiKey": settings.get_morrenus_api_key()}

    async def set_api_key(self, api_key: str) -> Dict[str, Any]:
        settings.set_morrenus_api_key(api_key)
        return {"success": True}

    # ── multiple API keys (one per manifest source) ───────────────────────
    async def get_api_key_fields(self) -> Dict[str, Any]:
        return await self._run(apis.get_required_key_fields)

    async def get_api_keys(self) -> Dict[str, Any]:
        return {"success": True, "keys": settings.get_api_keys()}

    async def set_api_key_for(self, placeholder: str, api_key: str) -> Dict[str, Any]:
        settings.set_api_key_for(placeholder, api_key)
        return {"success": True}

    # ── optional DLC (SLSsteam DlcData) ───────────────────────────────────
    async def get_dlc_option(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_slssteam_dlc_enabled()}

    async def set_dlc_option(self, enabled: bool) -> Dict[str, Any]:
        settings.set_slssteam_dlc_enabled(enabled)
        return {"success": True}

    # ── game-page bar style (row vs panel) ────────────────────────────────
    async def get_gamebar_style(self) -> Dict[str, Any]:
        return {"success": True, "style": settings.get_game_bar_style()}

    async def set_gamebar_style(self, style: str) -> Dict[str, Any]:
        settings.set_game_bar_style(style)
        return {"success": True}

    # ── floating buttons toggle (library overlay + store injection) ───────
    async def get_floating_option(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_floating_enabled()}

    async def set_floating_option(self, enabled: bool) -> Dict[str, Any]:
        settings.set_floating_enabled(enabled)
        return {"success": True}

    async def get_store_disabled(self) -> Dict[str, Any]:
        return {"success": True, "disabled": settings.get_store_disabled()}

    async def set_store_disabled(self, disabled: bool) -> Dict[str, Any]:
        settings.set_store_disabled(disabled)
        return {"success": True}

    # ── fixes ─────────────────────────────────────────────────────────────
    async def check_fixes(self, appid: int, game_name: str = "") -> Dict[str, Any]:
        return await self._run(fixes.check_for_fixes, appid, game_name)

    async def set_only_update_on_launch(self, appid: int) -> Dict[str, Any]:
        return await self._run(steam.set_only_update_on_launch, appid)

    async def get_game_install_path(self, appid: int) -> Dict[str, Any]:
        return await self._run(steam.get_game_install_path_response, appid)

    # ── backup / restore (config, manifests, depot keys, settings) ─────────

    # ── anti-Denuvo hypervisor (HV-Decky: local cpuid_fault_emulation build) ──
    async def hv_status(self) -> Dict[str, Any]:
        try:
            return {"success": True, **(await get_hv().get_status())}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_setup(self, mode: str = "native") -> Dict[str, Any]:
        """One-shot: install headers/deps + build the module (native or container)."""
        try:
            return _hv_norm(await get_hv().complete_setup(mode))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_build(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().build_module())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_build_container(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().build_module_container())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_install_deps(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().install_build_dependencies())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_download(self) -> Dict[str, Any]:
        """Download the PREBUILT cpuid_fault_emulation.ko matching the running
        kernel (the SteamOS-friendly path — no compiler/headers/source needed)."""
        try:
            return _hv_norm(await get_hv().download_bin())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_load(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().load_module())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_unload(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().unload_module())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_load_auto(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().load_automatic_module())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_unload_auto(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().unload_automatic_module())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_test(self) -> Dict[str, Any]:
        """Run the userspace cpuid-faulting self-test to verify the bypass works."""
        try:
            return _hv_norm(await get_hv().test_cpuid_faulting())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_native_notice(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().get_native_cpuid_notice())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_dismiss_native(self) -> Dict[str, Any]:
        try:
            await get_hv().dismiss_native_cpuid_notice()
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_umip_start(self) -> Dict[str, Any]:
        try:
            hv = get_hv()
            # Decky install / zip extraction can drop the exec bit on the shipped
            # umipcompatd binary — restore it before launching.
            try:
                p = hv.umipcompat_path
                if p.is_file():
                    os.chmod(p, 0o755)
            except Exception:
                pass
            ok, msg = await hv.ensure_umip_active()
            return {"success": ok, "message": msg, "error": (None if ok else msg)}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_umip_stop(self) -> Dict[str, Any]:
        try:
            ok, msg = await get_hv()._stop_umipcompat()
            return {"success": ok, "message": msg}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_disable_umip(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().disable_umip())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_restore_umip(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().enable_umip())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_reboot(self) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().reboot_system())
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_log(self) -> Dict[str, Any]:
        try:
            return {"success": True, "log": await get_hv().get_operation_log()}
        except Exception as exc:
            return {"success": False, "error": str(exc), "log": ""}

    async def hv_set_game(self, appid: int, enabled: bool) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().set_game_hv(str(appid), bool(enabled)))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_set_watcher_mode(self, mode: str) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().set_game_watcher_mode(mode))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_set_game_source(self, source: str) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().set_game_module_source(source))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_set_source_dir(self, path: str) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().set_source_directory(path))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_set_source_zip(self, path: str) -> Dict[str, Any]:
        try:
            return _hv_norm(await get_hv().set_source_zip(path))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_get_autoload(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_hv_autoload()}

    async def hv_set_autoload(self, enabled: bool) -> Dict[str, Any]:
        settings.set_hv_autoload(bool(enabled))
        try:
            if enabled:
                asyncio.create_task(get_hv().start())
        except Exception:
            pass
        return {"success": True}

    async def hv_proton_status(self) -> Dict[str, Any]:
        return await self._run(proton.status)

    async def hv_install_proton(self) -> Dict[str, Any]:
        return await self._run(proton.start_install, False)

    async def hv_install_proton_auto(self) -> Dict[str, Any]:
        return await self._run(proton.start_install, True)

    async def hv_proton_install_status(self) -> Dict[str, Any]:
        return await self._run(proton.get_install_status)

    async def hv_proton_get_url(self) -> Dict[str, Any]:
        return {"success": True, "url": settings.get_proton_url()}

    async def hv_proton_set_url(self, url: str) -> Dict[str, Any]:
        settings.set_proton_url(url)
        return {"success": True}

    async def hv_proton_locate(self, path: str) -> Dict[str, Any]:
        return await self._run(proton.set_manual_tarball, path)

    async def app_download_complete(self, appid: int) -> Dict[str, Any]:
        return await self._run(steam.app_download_complete, appid)

    async def is_phantom_install(self, appid: int) -> Dict[str, Any]:
        """Is the game stuck as "installed" with nothing actually downloaded?"""
        return await self._run(steam.is_phantom_install, appid)

    async def clear_phantom_install(self, appid: int) -> Dict[str, Any]:
        """Drop a phantom appmanifest so Steam offers to install the game again."""
        return await self._run(steam.clear_phantom_install, appid)

    async def provision_depots(self) -> Dict[str, Any]:
        """Re-apply depot decryption keys + depotcache manifests for all added
        games. Steam discards config.vdf edits made while it is running, so this
        is safe to re-run and is best run with Steam closed."""
        return await self._run(steam.provision_all_added_depots)

    async def provision_and_restart(self) -> Dict[str, Any]:
        """The reliable path: stop Steam, provision depot keys while it is closed
        (Steam overwrites config.vdf on exit, so this is the only window that
        sticks), then start Steam again."""
        return await self._run(steam.provision_and_restart)

    async def steam_is_running(self) -> Dict[str, Any]:
        return {"success": True, "running": await self._run(steam.steam_is_running)}

    async def download_preflight(self, appid: int) -> Dict[str, Any]:
        """Check every precondition for downloading an added game, so a failure
        names which one is missing instead of failing silently."""
        return await self._run(steam.download_preflight, appid)

    async def download_diagnosis(self, appid: int) -> Dict[str, Any]:
        """Report what Steam's own content_log said about the last attempt."""
        return await self._run(steam.download_diagnosis, appid)

    async def engine_is_moon(self) -> Dict[str, Any]:
        """Is the installed engine slsteam-moon (depot-key capable) or stock
        SLSsteam (ownership only, added games can never decrypt)?"""
        try:
            return {"success": True, **slssteam.installed_lib_is_moon()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def ensure_moon_engine(self) -> Dict[str, Any]:
        """Re-install slsteam-moon if the client fix replaced it with stock."""
        return await self._run(slssteam.ensure_moon_engine)

    async def apply_fix(self, appid: int, download_url: str, install_path: str,
                        fix_type: str = "", game_name: str = "") -> Dict[str, Any]:
        try:
            return fixes.apply_game_fix(int(appid), download_url, install_path, fix_type, game_name)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_fix_status(self, appid: int) -> Dict[str, Any]:
        try:
            return fixes.get_apply_fix_status(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc), "state": {}}

    async def cancel_fix(self, appid: int) -> Dict[str, Any]:
        try:
            return fixes.cancel_apply_fix(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_installed_fixes(self) -> Dict[str, Any]:
        return await self._run(fixes.get_installed_fixes)

    async def install_latest_ge_proton(self) -> Dict[str, Any]:
        return await self._run(compat.install_latest_ge_proton)

    async def unfix(self, appid: int, install_path: str = "", fix_date: str = "") -> Dict[str, Any]:
        try:
            return fixes.unfix_game(int(appid), install_path, fix_date)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_unfix_status(self, appid: int) -> Dict[str, Any]:
        try:
            return fixes.get_unfix_status(int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc), "state": {}}

    # ── manifest pinning (slsteam-moon ManifestPins) ──────────────────────
    async def get_pin_status(self, appid: int) -> Dict[str, Any]:
        try:
            pinned = await self._run(slssteam.is_pinned, int(appid))
            depots: Dict[str, str] = {}
            buildid = ""
            if pinned:
                try:
                    raw = await self._run(slssteam._read_pin_gids, int(appid))
                    depots = {str(d): str(g) for d, g in (raw or {}).items()}
                except Exception:
                    depots = {}
                try:
                    buildid = settings.get_pinned_build(int(appid))
                except Exception:
                    buildid = ""
            return {"success": True, "pinned": bool(pinned), "buildid": buildid, "depots": depots}
        except Exception as exc:
            return {"success": False, "pinned": False, "error": str(exc)}

    async def pin_game(self, appid: int) -> Dict[str, Any]:
        return await self._run(slssteam.pin_app_current, appid)

    async def unpin_game(self, appid: int) -> Dict[str, Any]:
        return await self._run(slssteam.purge_pins_for_app, appid)

    async def get_pin_on_fix(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_pin_on_fix()}

    async def set_pin_on_fix(self, enabled: bool) -> Dict[str, Any]:
        settings.set_pin_on_fix(bool(enabled))
        return {"success": True}

    async def get_achievements(self) -> Dict[str, Any]:
        """slsteam-moon live achievements toggle (config.yaml Achievements)."""
        return await self._run(slssteam.get_achievements)

    async def set_achievements(self, enabled: bool) -> Dict[str, Any]:
        return await self._run(slssteam.set_achievements, bool(enabled))

    # ── SmokeAPI DLC unlocker (steam_api proxy) ────────────────────────────
    async def smokeapi_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": True, "installed": False, "supported": False,
                        "notInstalled": True}
            return await self._run(smokeapi.status, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def smokeapi_install(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(smokeapi.install, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def smokeapi_remove(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(smokeapi.remove, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── extra DLC unlockers (CreamAPI / Uplay R1 / Uplay R2), manual per game ──
    async def dlc_unlockers_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": True, "notInstalled": True}
            return await self._run(dlcunlockers.status_all, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def dlc_unlocker_install(self, appid: int, kind: str) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(dlcunlockers.install, kind, res["installPath"], int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def dlc_unlocker_remove(self, appid: int, kind: str) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(dlcunlockers.remove, kind, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── HVAuto (hypervisor crack) — build-first pipeline ──────────────────────
    async def hv_auto_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            name = res.get("name", "") if res.get("success") else ""
            return await self._run(hvauto.status_for_game, int(appid), name)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_auto_apply(self, appid: int, href: str = "") -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(hvauto.apply_hv, int(appid), res["installPath"],
                                   res.get("name", ""), href)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hv_apply_local(self, appid: int, archive_path: str) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(hvauto.apply_hv_local, int(appid), res["installPath"],
                                   archive_path, res.get("name", ""))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── CrakFiles (general DRM crack) — build-matched ─────────────────────────
    async def crak_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            name = res.get("name", "") if res.get("success") else ""
            return await self._run(crakfiles.status_for_game, int(appid), name)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def crak_apply(self, appid: int, href: str = "") -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(crakfiles.apply, int(appid), res["installPath"],
                                   res.get("name", ""), href)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def crak_apply_local(self, appid: int, archive_path: str) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(crakfiles.apply_local, int(appid), res["installPath"],
                                   archive_path, res.get("name", ""))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── user-imported custom fixes / manifests ────────────────────────────────
    async def custom_classify(self, path: str) -> Dict[str, Any]:
        try:
            return {"success": True, "kind": await self._run(custom_fixes.classify, path)}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_import(self, appid: int, path: str, forced_kind: str = "",
                            label: str = "") -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.import_file, int(appid), path, forced_kind, label)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_list_fixes(self, appid: int) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.list_custom_fixes, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_list_manifests(self, appid: int) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.list_custom_manifests, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_list_all_fixes(self) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.list_all_custom_fixes)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_list_all_manifests(self) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.list_all_custom_manifests)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_apply_fix(self, appid: int, fix_id: str) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(custom_fixes.apply_custom_fix, int(appid), fix_id,
                                   res["installPath"], res.get("name", ""))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_delete_fixes(self, appid: int = 0) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.delete_custom_fixes, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def custom_delete_manifests(self, appid: int = 0) -> Dict[str, Any]:
        try:
            return await self._run(custom_fixes.delete_custom_manifests, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── CreamySteamy per-game compiled proxy (native-Linux DLC unlock) ────────
    async def creamy_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": True, "supported": False, "installed": False, "notInstalled": True}
            return await self._run(creamysteamy.status, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def creamy_have_toolchain(self) -> Dict[str, Any]:
        try:
            return {"success": True, "have": creamysteamy.have_toolchain()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def creamy_ensure_toolchain(self) -> Dict[str, Any]:
        try:
            return await self._run(creamysteamy.ensure_toolchain)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def creamy_deploy(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(creamysteamy.deploy, int(appid),
                                   res["installPath"], res.get("name", ""))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── SteamStub DRM removal (Steamless AIO) ─────────────────────────────────
    async def steamless_status(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": True, "supported": False, "notInstalled": True}
            return await self._run(steamstub.status, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def steamless_unstub(self, appid: int) -> Dict[str, Any]:
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(steamstub.unstub, int(appid), res["installPath"], res.get("name", ""))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── build history / rollback ──────────────────────────────────────────────
    async def build_history_list(self, appid: int) -> Dict[str, Any]:
        try:
            return await self._run(buildhistory.list_for, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def build_history_rollback(self, appid: int, entry_id: str) -> Dict[str, Any]:
        try:
            return await self._run(buildhistory.rollback, int(appid), str(entry_id))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def build_history_clear(self, appid: int) -> Dict[str, Any]:
        try:
            return await self._run(buildhistory.clear, int(appid))
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── manifest age + Hubcap usage dashboard ─────────────────────────────────
    async def manifest_age(self, appid: int) -> Dict[str, Any]:
        try:
            import os as _os, time as _time
            res = steam.get_game_install_path_response(int(appid))
            lib = res.get("libraryPath", "") if res.get("success") else ""
            acf = _os.path.join(lib, "steamapps", f"appmanifest_{int(appid)}.acf") if lib else ""
            if acf and _os.path.isfile(acf):
                age = int(_time.time() - _os.path.getmtime(acf))
                return {"success": True, "ageSec": age, "installed": True}
            return {"success": True, "installed": False}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_backup_custom(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_backup_custom()}

    async def set_backup_custom(self, enabled: bool) -> Dict[str, Any]:
        settings.set_backup_custom(enabled)
        return {"success": True}


    async def get_main_exe(self, appid: int) -> Dict[str, Any]:
        """Locate the game's real executable (for the launch-target repoint)."""
        try:
            res = steam.get_game_install_path_response(int(appid))
            if not res.get("success") or not res.get("installPath"):
                return {"success": False, "error": "game not installed"}
            return await self._run(fixes.find_main_exe, res["installPath"])
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_auto_repoint(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_repoint()}

    async def set_auto_repoint(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_repoint(bool(enabled))
        return {"success": True}

    async def get_auto_apply(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_apply()}

    async def set_auto_apply(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_apply(bool(enabled))
        return {"success": True}

    async def pin_for_fix(self, appid: int) -> Dict[str, Any]:
        """Resolve a manifest build (lua.tools -> hubcap -> ~/Downloads) and pin
        the game to it WITHOUT applying the fix. Used by the build-accurate apply
        flow: pin first, let Steam update to the build, then apply. Returns
        pinned/source so the UI can decide whether to trigger an update."""
        try:
            return await self._run(pinsource.auto_pin_from_source, int(appid))
        except Exception as exc:
            return {"success": False, "pinned": False, "error": str(exc)}

    async def pin_for_luatools_fix(self, appid: int, fix_id: str) -> Dict[str, Any]:
        """Pin to the exact build a specific lua.tools fix targets (its own
        manifest), so the update-vs-skip decision is accurate per-fix."""
        try:
            return await self._run(pinsource.auto_pin_from_luatools_fix, int(appid), str(fix_id))
        except Exception as exc:
            return {"success": False, "pinned": False, "error": str(exc)}

    # ── lua.tools account (Discord bot-code sign-in) + pin-source diagnostics ──
    async def luatools_status(self) -> Dict[str, Any]:
        return await self._run(luatools.get_status)

    async def luatools_redeem(self, code: str) -> Dict[str, Any]:
        return await self._run(luatools.redeem_code, code)

    async def luatools_oauth_start(self) -> Dict[str, Any]:
        return await self._run(luatools.oauth_start)

    async def luatools_oauth_status(self) -> Dict[str, Any]:
        return luatools.oauth_status()

    async def luatools_oauth_cancel(self) -> Dict[str, Any]:
        return await self._run(luatools.oauth_cancel)

    async def luatools_signout(self) -> Dict[str, Any]:
        return await self._run(luatools.signout)

    async def luatools_list_fixes(self, appid: int) -> Dict[str, Any]:
        """Full lua.tools fix list for a game (account-gated catalog)."""
        return await self._run(luatools.list_fixes, int(appid))

    async def luatools_list_all_fixes(self) -> Dict[str, Any]:
        """Master lua.tools fix catalog (all games with a fix)."""
        return await self._run(luatools.list_all_fixes)

    async def apply_luatools_fix(self, appid: int, fix_id: str, install_path: str,
                                 manifest_id: str = "", depot_id: str = "",
                                 fix_type: str = "lua.tools fix",
                                 game_name: str = "") -> Dict[str, Any]:
        try:
            return fixes.apply_luatools_fix(
                int(appid), fix_id, install_path, manifest_id, depot_id, fix_type, game_name)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def hubcap_usage(self) -> Dict[str, Any]:
        """Live Hubcap manifest-generation quota for the configured key."""
        return await self._run(pinsource.hubcap_usage)

    async def hubcap_workshop_manifest(self, appid: int) -> Dict[str, Any]:
        """Fetch + publish the Hubcap Workshop manifest for a game."""
        return await self._run(pinsource.hubcap_workshop_manifest, int(appid))

    async def pin_source(self, appid: int) -> Dict[str, Any]:
        """Which pin source would be used for this game (lua.tools/hubcap/downloads/none)."""
        def _probe():
            _t, src = pinsource.resolve_pin_lua(int(appid))
            return {"success": True, "source": src}
        return await self._run(_probe)

    # ── ryuu API key (X-Auth-Key for gated fix downloads) ──────────────────
    async def get_ryuu_key(self) -> Dict[str, Any]:
        return {"success": True, "key": settings.get_ryuu_key()}

    async def set_ryuu_key(self, key: str) -> Dict[str, Any]:
        settings.set_ryuu_key(key)
        return {"success": True}

    # ── online-fix username (blank = auto: use the Steam display name) ──────
    async def get_online_username(self) -> Dict[str, Any]:
        auto = ""
        try:
            auto = await self._run(steam.resolve_persona_name)
        except Exception:
            auto = ""
        return {"success": True, "username": settings.get_online_username(), "auto": auto or ""}

    async def set_online_username(self, username: str) -> Dict[str, Any]:
        settings.set_online_username(username)
        return {"success": True}

    # ── owned-game handling / library buttons ──────────────────────────────
    async def get_games_in_qam(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_games_in_qam()}

    async def set_games_in_qam(self, enabled: bool) -> Dict[str, Any]:
        settings.set_games_in_qam(enabled)
        return {"success": True}

    async def get_hide_tools_qam(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_hide_tools_qam()}

    async def set_hide_tools_qam(self, enabled: bool) -> Dict[str, Any]:
        settings.set_hide_tools_qam(bool(enabled))
        return {"success": True}

    async def get_show_reinstall_qam(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_show_reinstall_qam()}

    async def set_show_reinstall_qam(self, enabled: bool) -> Dict[str, Any]:
        settings.set_show_reinstall_qam(enabled)
        return {"success": True}

    async def get_hide_on_owned(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_hide_on_owned()}

    async def set_hide_on_owned(self, enabled: bool) -> Dict[str, Any]:
        settings.set_hide_on_owned(enabled)
        return {"success": True}

    async def get_dlc_owned_only(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_dlc_owned_only()}

    async def set_dlc_owned_only(self, enabled: bool) -> Dict[str, Any]:
        settings.set_dlc_owned_only(enabled)
        return {"success": True}

    async def get_group_collection(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_group_collection()}

    async def set_group_collection(self, enabled: bool) -> Dict[str, Any]:
        settings.set_group_collection(enabled)
        return {"success": True}

    async def get_library_buttons(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_library_buttons()}

    async def set_library_buttons(self, enabled: bool) -> Dict[str, Any]:
        settings.set_library_buttons(enabled)
        return {"success": True}

    # ── badges ─────────────────────────────────────────────────────────────
    async def get_badge_options(self) -> Dict[str, Any]:
        return {
            "success": True,
            "sls": settings.get_badge_sls(),
            "legit": settings.get_badge_legit(),
            "denuvo": settings.get_badge_denuvo(),
            "onlineFix": settings.get_badge_online_fix(),
            "fixed": settings.get_badge_fixed(),
            "nonSteam": settings.get_badge_nonsteam(),
            "nonSteamName": settings.get_badge_nonsteam_name(),
            "storePage": settings.get_badge_store_page(),
            "gamePage": settings.get_badge_game_page(),
            "library": settings.get_badge_library(),
        }

    async def get_nonsteam_apps(self) -> Dict[str, Any]:
        return await self._run(steam.get_nonsteam_apps)

    async def set_badge_option(self, which: str, enabled: bool) -> Dict[str, Any]:
        if which == "sls":
            settings.set_badge_sls(enabled)
        elif which == "legit":
            settings.set_badge_legit(enabled)
        elif which == "denuvo":
            settings.set_badge_denuvo(enabled)
        elif which == "onlineFix":
            settings.set_badge_online_fix(enabled)
        elif which == "fixed":
            settings.set_badge_fixed(enabled)
        elif which == "nonSteam":
            settings.set_badge_nonsteam(enabled)
        elif which == "nonSteamName":
            settings.set_badge_nonsteam_name(enabled)
        elif which == "storePage":
            settings.set_badge_store_page(enabled)
        elif which == "gamePage":
            settings.set_badge_game_page(enabled)
        elif which == "library":
            settings.set_badge_library(enabled)
        else:
            return {"success": False, "error": f"unknown badge '{which}'"}
        return {"success": True}

    # ── Denuvo detection (informational: this build can't bypass Denuvo) ────
    async def denuvo_known(self) -> Dict[str, Any]:
        ids = await self._run(denuvo.known_denuvo)
        return {"success": True, "denuvo": sorted(ids)}

    async def denuvo_resolve(self, appids: List[int]) -> Dict[str, Any]:
        return await self._run(denuvo.resolve, appids)

    # ── CloudRedirect provider-configured readout ─────────────────────────────
    async def cr_provider_status(self) -> Dict[str, Any]:
        try:
            return await self._run(cloudredirect.provider_status)
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── Fix stuck update (re-deploy manifests/keys to depotcache) ─────────────
    async def fix_stuck_update(self, appid: int) -> Dict[str, Any]:
        try:
            r = await self._run(steam.restore_manifests_to_depotcache, int(appid))
            copied = int((r or {}).get("copied", 0)) if isinstance(r, dict) else 0
            return {"success": bool(r and r.get("success", True)), "copied": copied,
                    "note": (f"Re-deployed {copied} manifest(s) to depotcache. "
                             "Retry the update in Steam." if copied
                             else "Refreshed depotcache. Retry the update in Steam."),
                    "error": (r or {}).get("error", "") if isinstance(r, dict) else ""}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    # ── auto-apply fixes ───────────────────────────────────────────────────
    async def auto_fix_pending_get(self) -> Dict[str, Any]:
        return {"success": True, "appids": settings.get_auto_fix_pending()}

    async def auto_fix_pending_add(self, appid: int) -> Dict[str, Any]:
        try:
            settings.add_auto_fix_pending(int(appid))
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def auto_fix_pending_remove(self, appid: int) -> Dict[str, Any]:
        try:
            settings.remove_auto_fix_pending(int(appid))
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def get_auto_fix(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_fix()}

    async def set_auto_fix(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_fix(enabled)
        return {"success": True}

    async def get_auto_download(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_download()}

    async def set_auto_download(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_download(enabled)
        return {"success": True}

    # ── DLC toggles (A: auto-add DLC content; B: disable unlock on owned) ────
    async def get_auto_add_dlc(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_add_dlc()}

    async def set_auto_add_dlc(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_add_dlc(enabled)
        # Native path on newer engines: flip InjectAllAdvertisedDlc so ALL
        # advertised DLC show owned in the store/library view (not just in-game).
        # Harmless no-op on older engines, where per-add DlcData is the fallback.
        try:
            await self._run(slssteam.set_inject_all_advertised_dlc, bool(enabled))
        except Exception:
            pass
        return {"success": True}

    async def get_disable_cloud(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_disable_cloud()}

    async def set_disable_cloud(self, enabled: bool) -> Dict[str, Any]:
        # Mirror flag + write the real moon config switch.
        settings.set_disable_cloud(enabled)
        return await self._run(slssteam.set_disable_cloud, enabled)

    async def get_disable_dlc_unlock_owned(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_disable_dlc_unlock_owned()}

    async def set_disable_dlc_unlock_owned(self, enabled: bool, owned_appids: List[int] = None) -> Dict[str, Any]:
        settings.set_disable_dlc_unlock_owned(enabled)
        return await self._run(dlc.set_dlc_unlock_owned, bool(enabled), owned_appids or [])

    # ── Build-picker (install a specific build / select manifest per depot) ──
    async def bp_list_builds(self, appid: int) -> Dict[str, Any]:
        return await self._run(buildpicker.list_builds, appid)

    async def bp_list_depot_manifests(self, appid: int) -> Dict[str, Any]:
        return await self._run(buildpicker.list_depot_manifests, appid)

    async def bp_list_depot_manifests_merged(self, appid: int, scraped: str = "") -> Dict[str, Any]:
        return await self._run(buildpicker.list_depot_manifests_merged, appid, scraped)

    async def bp_apply_build(self, appid: int, buildid: str = "latest", date: str = "", primary_gids: str = "") -> Dict[str, Any]:
        return await self._run(buildpicker.apply_build, appid, buildid, date, primary_gids)

    async def bp_apply_manifests(self, appid: int, depot_gids: Dict[str, str] = None) -> Dict[str, Any]:
        return await self._run(buildpicker.apply_manifests, appid, depot_gids or {})

    # ── v2 DepotDownloader (older-build / content-DLC download) ──────────────
    async def depotdl_status(self) -> Dict[str, Any]:
        """Whether the v2 DepotDownloader path is present in this build."""
        return {"success": True, "available": _depotdl is not None}

    async def depotdl_download_build(self, appid: int, buildid: str) -> Dict[str, Any]:
        if _depotdl is None:
            return {"success": False, "error": "This build has no DepotDownloader (use slsdeckdlc)."}
        return await self._run(_depotdl.download_build, appid, buildid)

    async def depotdl_download_build_gids(self, appid: int, buildid: str, gids: str = "{}") -> Dict[str, Any]:
        """Download a build via DepotDownloader using an explicit {depot: gid} map
        (JSON) the frontend already resolved from SteamDB — bypasses the resolver
        that wrongly says 'no older builds', and moon's failing on-demand fetch."""
        if _depotdl is None:
            return {"success": False, "error": "This build has no DepotDownloader (use slsdeckdlc)."}
        try:
            import json as _json
            gmap = _json.loads(gids or "{}")
        except Exception:
            gmap = {}
        return await self._run(_depotdl.download_build_with_gids, appid, buildid, gmap)

    async def depotdl_download_dlc(self, appid: int) -> Dict[str, Any]:
        if _depotdl is None:
            return {"success": False, "error": "This build has no DepotDownloader (use slsdeckdlc)."}
        return await self._run(_depotdl.download_dlc, appid)

    async def depotdl_queue(self) -> Dict[str, Any]:
        if _depotdl is None:
            return {"success": True, "items": []}
        def _q():
            return {"success": True, "items": _depotdl.all_states()}
        return await self._run(_q)

    # ── Optional update toggles (engine / headcrab in the update registry) ──
    async def get_check_engine_updates(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_check_engine_updates()}

    async def set_check_engine_updates(self, enabled: bool) -> Dict[str, Any]:
        settings.set_check_engine_updates(enabled)
        return {"success": True}

    async def get_check_headcrab_updates(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_check_headcrab_updates()}

    async def set_check_headcrab_updates(self, enabled: bool) -> Dict[str, Any]:
        settings.set_check_headcrab_updates(enabled)
        return {"success": True}

    async def resolve_dlc(self, appid: int) -> Dict[str, Any]:
        return await self._run(dlc.resolve_dlc, appid)

    async def ensure_all_dlc_keys(self, appid: int) -> Dict[str, Any]:
        return await self._run(dlc.ensure_all_dlc_keys, appid)

    async def trigger_steam_install(self, appid: int, library: int = 0) -> Dict[str, Any]:
        return await self._run(slssteam.trigger_steam_install, appid, library)

    async def validate_steam_app(self, appid: int) -> Dict[str, Any]:
        return await self._run(slssteam.validate_steam_app, appid)

    async def get_available_builds(self, appid: int) -> Dict[str, Any]:
        return await self._run(downloads.get_available_builds, appid)

    async def install_game_build(self, appid: int, build_id: str = "latest") -> Dict[str, Any]:
        return await self._run(downloads.install_game_build, appid, build_id)

    # ── netsock multiplayer patch (manual-only, per game) ──────────────────
    async def netsock_status(self, appid: int = 0) -> Dict[str, Any]:
        return await self._run(netsock.status, appid)

    async def netsock_set(self, appid: int, enabled: bool) -> Dict[str, Any]:
        return await self._run(netsock.set_enabled, appid, bool(enabled))

    async def netsock_compatible(self) -> Dict[str, Any]:
        return {"success": True, "games": await self._run(netsock.compatible_list)}

    # ── CloudRedirect (cloud saves for added games) ────────────────────────
    async def cr_get_enabled(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.get_enabled)

    async def cr_set_enabled(self, enabled: bool) -> Dict[str, Any]:
        return await self._run(cloudredirect.set_enabled, bool(enabled))

    async def cr_open_app(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.open_app)

    async def cr_ensure_installed_auto(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.ensure_installed_auto)

    async def cr_ensure_installed(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.ensure_installed)

    async def cr_icon_path(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.icon_path)

    async def cr_artwork(self) -> Dict[str, Any]:
        return await self._run(cloudredirect.artwork)

    # ── "No internet" fix (steam.cfg update-block during pinned downloads) ─────
    async def get_no_internet_fix(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_no_internet_fix()}

    async def set_no_internet_fix(self, enabled: bool) -> Dict[str, Any]:
        settings.set_no_internet_fix(bool(enabled))
        return {"success": True}

    async def no_internet_fix_begin(self, appid: int) -> Dict[str, Any]:
        return await self._run(slssteam.no_internet_fix_begin, appid)

    # ── Conflict repair ────────────────────────────────────────────────────────
    async def repair_conflicts(self) -> Dict[str, Any]:
        """Manual pre-install repair: clear Millennium + Arch system slssteam."""
        return await self._run(slssteam.repair_engine_conflicts)

    async def cr_get_shortcut(self) -> Dict[str, Any]:
        return {"success": True, "appId": settings.get_cr_shortcut()}

    async def cr_set_shortcut(self, appId: int) -> Dict[str, Any]:
        settings.set_cr_shortcut(int(appId or 0))
        return {"success": True}

    # ── OpenSave (cloud saves engine) ──────────────────────────────────────
    async def os_status(self) -> Dict[str, Any]:
        return await self._run(opensave.overall_status)

    async def os_ensure_cli(self, force: bool = False) -> Dict[str, Any]:
        return await self._run(opensave.ensure_cli, bool(force))

    async def os_ensure_daemon(self) -> Dict[str, Any]:
        return await self._run(opensave.ensure_daemon)

    async def os_scan(self) -> Dict[str, Any]:
        return await self._run(opensave.scan)

    async def os_sync_all(self) -> Dict[str, Any]:
        return await self._run(opensave.sync, None)

    async def os_sync_game(self, appid: int) -> Dict[str, Any]:
        return await self._run(opensave.sync, int(appid))

    async def os_status_game(self, appid: int) -> Dict[str, Any]:
        return await self._run(opensave.status_for_game, int(appid))

    async def os_ensure_tracked(self, appid: int) -> Dict[str, Any]:
        return await self._run(opensave.ensure_tracked, int(appid))

    async def os_snapshots(self, appid: int) -> Dict[str, Any]:
        return await self._run(opensave.snapshots, int(appid))

    async def os_rollback(self, appid: int, snapId: str) -> Dict[str, Any]:
        return await self._run(opensave.rollback, int(appid), str(snapId))

    async def os_conflicts(self) -> Dict[str, Any]:
        return await self._run(opensave.conflicts)

    async def os_resolve(self, appid: int, choice: str) -> Dict[str, Any]:
        return await self._run(opensave.resolve, int(appid), str(choice))

    async def os_export_all(self, folder: str) -> Dict[str, Any]:
        return await self._run(opensave.export_all, str(folder))

    # ── OpenSave cloud providers (native, via daemon API) ──────────────────
    async def os_cloud_auth_start(self, provider: str) -> Dict[str, Any]:
        return await self._run(opensave.cloud_auth_start, str(provider))

    async def os_cloud_auth_callback(self, code: str) -> Dict[str, Any]:
        return await self._run(opensave.cloud_auth_callback, str(code))

    async def os_cloud_disconnect(self) -> Dict[str, Any]:
        return await self._run(opensave.cloud_disconnect)

    async def os_cloud_webdav(self, url: str, username: str = "", password: str = "") -> Dict[str, Any]:
        return await self._run(opensave.cloud_set_webdav, str(url), str(username), str(password))

    async def os_cloud_enabled(self, enabled: bool) -> Dict[str, Any]:
        return await self._run(opensave.cloud_set_enabled, bool(enabled))

    async def os_cloud_push_all(self) -> Dict[str, Any]:
        return await self._run(opensave.cloud_push_all)

    async def os_relay_join(self, code: str) -> Dict[str, Any]:
        return await self._run(opensave.relay_join, str(code))

    async def os_relay_status(self) -> Dict[str, Any]:
        return await self._run(opensave.relay_status)

    async def os_relay_leave(self) -> Dict[str, Any]:
        return await self._run(opensave.relay_leave)

    async def os_diagnostics(self) -> Dict[str, Any]:
        return await self._run(opensave.diagnostics)

    # ── dependency updates (latest-version + boot check) ───────────────────
    async def updates_check(self) -> Dict[str, Any]:
        return await self._run(updates.check_all)

    async def updates_update_all(self, includeHeavy: bool = False) -> Dict[str, Any]:
        return await self._run(updates.update_all, bool(includeHeavy))

    async def updates_update_one(self, name: str, includeHeavy: bool = True) -> Dict[str, Any]:
        return await self._run(updates.update_one, str(name), bool(includeHeavy))

    async def get_auto_update(self) -> Dict[str, Any]:
        return {"success": True, "enabled": settings.get_auto_update()}

    async def set_auto_update(self, enabled: bool) -> Dict[str, Any]:
        settings.set_auto_update(bool(enabled))
        return {"success": True, "enabled": bool(enabled)}


    async def open_game_folder(self, path: str) -> Dict[str, Any]:
        ok = await self._run(steam.open_game_folder, path)
        return {"success": ok}

    # ── UI Customization & Maintenance ──────────────────────────────────
    async def get_ui_settings(self) -> Dict[str, Any]:
        return {"success": True, "settings": settings.get_ui_settings()}

    async def set_ui_setting(self, key: str, value: Any) -> Dict[str, Any]:
        return settings.set_ui_setting(key, value)

    async def run_full_system_maintenance(self) -> Dict[str, Any]:
        """One-touch QoL utility: runs audit, auto-repairs system, cleans temp downloads, and syncs artwork."""
        def _maint():
            repair_res = audit.auto_repair_system()
            clean_res = storage.clean_temp_downloads()
            art_res = art.sync_all_added_art(overwrite=False)
            return {
                "success": True,
                "autoRepair": repair_res,
                "tempClean": clean_res,
                "artSync": art_res,
            }
        return await self._run(_maint)

    # ── Steam Workshop Mod Engine (SteamCMD) ────────────────────────────
    # The engine is now SteamCMD-based (+workshop_download_item) rather than the
    # old third-party mirror, and it tracks a manifest of the mods WE installed
    # so it never disturbs items Steam is managing. The ws_* methods are the new
    # surface; the workshop_* methods below stay as adapters so the existing UI
    # keeps working.
    async def ws_resolve(self, text: str) -> Dict[str, Any]:
        return await self._run(workshop.resolve_mod, text)

    async def ws_download(self, text: str) -> Dict[str, Any]:
        return await self._run(workshop.start_download, text)

    async def ws_download_state(self, job: str) -> Dict[str, Any]:
        return await self._run(workshop.get_download_state, job)

    async def ws_search(self, text: str, limit: int = 40) -> Dict[str, Any]:
        return await self._run(workshop.search_workshop, text, limit)

    async def ws_list_mods(self, appid: int) -> Dict[str, Any]:
        return await self._run(workshop.list_mods, appid)

    async def ws_list_games(self) -> Dict[str, Any]:
        return await self._run(workshop.list_mod_games)

    async def ws_set_enabled(self, appid: int, modid: str, enabled: bool) -> Dict[str, Any]:
        return await self._run(workshop.set_mod_enabled, appid, modid, enabled)

    async def ws_remove(self, appid: int, modid: str) -> Dict[str, Any]:
        return await self._run(workshop.remove_mod, appid, modid)

    async def ws_ensure_steamcmd(self) -> Dict[str, Any]:
        return await self._run(workshop.ensure_steamcmd)

    async def ws_get_steam_key(self) -> Dict[str, Any]:
        try:
            return {"success": True, "key": settings.get_steam_web_key()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def ws_set_steam_key(self, key: str = "") -> Dict[str, Any]:
        try:
            settings.set_steam_web_key(key)
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def workshop_search(self, appid: int, query: str = "", limit: int = 15) -> Dict[str, Any]:
        # Adapter: the new engine searches across the whole installed SLS pool
        # rather than one appid, and returns "results" instead of "items".
        r = await self._run(workshop.search_workshop, query, limit)
        if isinstance(r, dict) and "items" not in r:
            r = dict(r)
            r["items"] = r.get("results", [])
        return r

    async def get_steam_web_api_key(self) -> Dict[str, Any]:
        """Workshop search needs the user's own Steam Web API key."""
        try:
            return {"success": True, "key": settings.get_steam_web_api_key()}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def set_steam_web_api_key(self, key: str = "") -> Dict[str, Any]:
        try:
            settings.set_steam_web_api_key(key)
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    async def workshop_download(self, appid: int, published_file_id: str) -> Dict[str, Any]:
        # The engine resolves the owning game from the mod id itself, so the
        # appid argument is no longer needed -- kept for call compatibility.
        return await self._run(workshop.start_download, str(published_file_id))

    async def workshop_list(self, appid: int) -> Dict[str, Any]:
        r = await self._run(workshop.list_mods, appid)
        if isinstance(r, dict) and "items" not in r:
            r = dict(r)
            r["items"] = r.get("mods", [])
        return r

    async def workshop_remove(self, appid: int, published_file_id: str) -> Dict[str, Any]:
        return await self._run(workshop.remove_mod, appid, published_file_id)
