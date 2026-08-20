import asyncio
import re
import struct
from pathlib import Path
from typing import Any

import decky


class Games:
    GAME_LOG_START_RE = re.compile(
        r"AppID\s+([0-9]+)\s+adding\s+PID\s+([0-9]+)\s+as\s+a\s+tracked\s+process"
    )
    GAME_LOG_STOP_RE = re.compile(
        r"AppID\s+([0-9]+)\s+no\s+longer\s+tracking\s+PID\s+([0-9]+)"
    )

    @staticmethod
    def _loaded_modules() -> set[str]:
        try:
            return {
                line.split()[0]
                for line in Path("/proc/modules").read_text(encoding="utf-8").splitlines()
                if line.strip()
            }
        except OSError:
            return set()

    @staticmethod
    def _vdf_value(contents: str, key: str) -> str | None:
        match = re.search(
            rf'"{re.escape(key)}"\s+"((?:\\.|[^"\\])*)"',
            contents,
            flags=re.IGNORECASE,
        )
        if not match:
            return None
        return re.sub(r"\\([\\\"])", r"\1", match.group(1))

    def _steam_library_paths(self) -> list[Path]:
        home = Path(str(getattr(decky, "DECKY_USER_HOME", "/home/deck")))
        roots = [
            home / ".steam" / "root",
            home / ".steam" / "steam",
            home / ".local" / "share" / "Steam",
        ]
        libraries: list[Path] = []
        seen: set[str] = set()

        def add_library(path: Path) -> None:
            steamapps = path if path.name == "steamapps" else path / "steamapps"
            key = str(steamapps.resolve())
            if steamapps.is_dir() and key not in seen:
                seen.add(key)
                libraries.append(steamapps)

        for root in roots:
            add_library(root)
            library_file = root / "steamapps" / "libraryfolders.vdf"
            try:
                contents = library_file.read_text(encoding="utf-8")
            except OSError:
                continue
            pairs = re.findall(
                r'"([^"\\]+)"\s+"((?:\\.|[^"\\])*)"', contents
            )
            for key, raw_path in pairs:
                if key.lower() != "path" and not key.isdigit():
                    continue
                value = re.sub(r"\\([\\\"])", r"\1", raw_path)
                if "/" in value or "\\" in value:
                    add_library(Path(value))
        return libraries

    def _installed_games(
        self, shortcut_parse_log: list[str] | None = None
    ) -> list[dict[str, Any]]:
        enabled_values = self.config.get("game_hv", {})
        enabled = enabled_values if isinstance(enabled_values, dict) else {}
        games: dict[str, dict[str, Any]] = {}
        for steamapps in self._steam_library_paths():
            for manifest in steamapps.glob("appmanifest_*.acf"):
                try:
                    contents = manifest.read_text(encoding="utf-8")
                except OSError:
                    continue
                app_id = self._vdf_value(contents, "appid")
                name = self._vdf_value(contents, "name")
                if not app_id or not app_id.isdigit() or not name:
                    continue
                games[app_id] = {
                    "app_id": app_id,
                    "name": name,
                    "hv_enabled": enabled.get(app_id) is True,
                    "running": app_id in self._running_game_ids,
                    "non_steam": False,
                }
        for shortcut in self._steam_shortcuts(shortcut_parse_log):
            app_id = shortcut["app_id"]
            games[app_id] = {
                **shortcut,
                "hv_enabled": enabled.get(app_id) is True,
                "running": app_id in self._running_game_ids,
                "non_steam": True,
            }
        return sorted(games.values(), key=lambda game: game["name"].casefold())

    @staticmethod
    def _binary_vdf_string(data: bytes, position: int) -> tuple[str, int]:
        end = data.find(b"\0", position)
        if end < 0:
            raise ValueError("Unterminated string in binary VDF file")
        return data[position:end].decode("utf-8", errors="replace"), end + 1

    @classmethod
    def _binary_vdf_object(
        cls, data: bytes, position: int = 0
    ) -> tuple[dict[str, Any], int]:
        result: dict[str, Any] = {}
        while position < len(data):
            value_type = data[position]
            position += 1
            if value_type in (8, 10):
                return result, position
            key, position = cls._binary_vdf_string(data, position)
            if value_type == 0:
                value, position = cls._binary_vdf_object(data, position)
            elif value_type == 1:
                value, position = cls._binary_vdf_string(data, position)
            elif value_type in (2, 3, 4, 6):
                if position + 4 > len(data):
                    raise ValueError("Truncated binary VDF value")
                value = struct.unpack_from("<I", data, position)[0]
                position += 4
            elif value_type in (7, 9):
                if position + 8 > len(data):
                    raise ValueError("Truncated binary VDF value")
                value = struct.unpack_from("<Q", data, position)[0]
                position += 8
            elif value_type == 5:
                end = data.find(b"\0\0", position)
                if end < 0:
                    raise ValueError("Unterminated wide string in binary VDF file")
                if (end - position) % 2:
                    end += 1
                value = data[position:end].decode("utf-16-le", errors="replace")
                position = end + 2
            else:
                raise ValueError(f"Unsupported binary VDF type {value_type}")
            result[key] = value
        return result, position

    def _steam_shortcuts(
        self, parse_log: list[str] | None = None
    ) -> list[dict[str, str]]:
        home = Path(str(getattr(decky, "DECKY_USER_HOME", "/home/deck")))
        steam_roots = {
            home / ".steam" / "root",
            home / ".steam" / "steam",
            home / ".local" / "share" / "Steam",
        }
        shortcuts: dict[str, dict[str, str]] = {}
        files: set[Path] = set()
        for root in steam_roots:
            userdata = root / "userdata"
            if userdata.is_dir():
                files.update(
                    shortcut_file.resolve()
                    for shortcut_file in userdata.glob("*/config/shortcuts.vdf")
                )
        for shortcut_file in sorted(files):
            try:
                parsed, _ = self._binary_vdf_object(shortcut_file.read_bytes())
                entries = parsed.get("shortcuts", {})
                if not isinstance(entries, dict):
                    if parse_log is not None:
                        parse_log.extend(
                            [f"File parsed: {shortcut_file}", "Found apps: 0"]
                        )
                    continue
                found_names: list[str] = []
                for entry in entries.values():
                    if not isinstance(entry, dict):
                        continue
                    normalized_entry = {
                        key.casefold(): value
                        for key, value in entry.items()
                        if isinstance(key, str)
                    }
                    app_id = normalized_entry.get("appid")
                    name = normalized_entry.get("appname")
                    if isinstance(app_id, int) and isinstance(name, str) and name:
                        shortcuts[str(app_id)] = {
                            "app_id": str(app_id),
                            "name": name,
                        }
                        found_names.append(name)
                if parse_log is not None:
                    parse_log.extend(
                        [
                            f"File parsed: {shortcut_file}",
                            f"Found apps: {len(found_names)}"
                            + (f" ({', '.join(found_names)})" if found_names else ""),
                        ]
                    )
            except (OSError, ValueError, struct.error) as error:
                decky.logger.warning(
                    "Could not read Steam shortcuts from %s: %s",
                    shortcut_file,
                    error,
                )
                if parse_log is not None:
                    parse_log.append(
                        f"Could not parse file: {shortcut_file}\nReason: {error}"
                    )
        return list(shortcuts.values())

    @staticmethod
    def _running_steam_games() -> set[str]:
        running: set[str] = set()
        try:
            processes = Path("/proc").iterdir()
        except OSError:
            return running

        for process in processes:
            if not process.name.isdigit():
                continue
            try:
                environment = (process / "environ").read_bytes().split(b"\0")
            except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
                continue
            for entry in environment:
                key, separator, value = entry.partition(b"=")
                if not separator or key not in {
                    b"SteamAppId",
                    b"SteamGameId",
                    b"PRESSURE_VESSEL_APP_ID",
                }:
                    continue
                app_id = value.decode("ascii", errors="ignore")
                if app_id.isdigit() and app_id != "0":
                    numeric_id = int(app_id)
                    shortcut_id = numeric_id >> 32
                    if shortcut_id & 0x80000000:
                        running.add(str(shortcut_id))
                    else:
                        running.add(app_id)
        return running

    @property
    def _steam_game_process_log(self) -> Path:
        home = Path(str(getattr(decky, "DECKY_USER_HOME", "/home/deck")))
        candidates = (
            home / ".local" / "share" / "Steam" / "logs" / "gameprocess_log.txt",
            home / ".steam" / "steam" / "logs" / "gameprocess_log.txt",
        )
        return next((path for path in candidates if path.is_file()), candidates[0])

    @classmethod
    def _game_log_event(cls, line: str) -> tuple[int, int, str, bool] | None:
        match = cls.GAME_LOG_START_RE.search(line)
        adding = match is not None
        if match is None:
            match = cls.GAME_LOG_STOP_RE.search(line)
        if match is None:
            return None

        game_id = int(match.group(1))
        pid = int(match.group(2))
        shortcut_app_id = (game_id >> 32) & 0xFFFFFFFF
        app_id = shortcut_app_id or (game_id & 0xFFFFFFFF)
        if app_id == 0:
            return None
        return game_id, pid, str(app_id), adding

    def _handle_game_log_line(self, line: str) -> bool:
        event = self._game_log_event(line)
        if event is None:
            return False
        game_id, pid, app_id, adding = event
        key = (game_id, pid)
        previous = self._game_log_processes.get(key)
        if adding:
            self._game_log_processes[key] = app_id
            return previous != app_id
        return self._game_log_processes.pop(key, None) is not None

    def _prune_game_log_processes(self) -> bool:
        stale = [
            key
            for key in self._game_log_processes
            if not Path(f"/proc/{key[1]}").is_dir()
        ]
        for key in stale:
            self._game_log_processes.pop(key, None)
        return bool(stale)

    async def _publish_game_log_state(self) -> None:
        running = set(self._game_log_processes.values())
        if running == self._running_game_ids:
            return
        self._running_game_ids = running
        await self._reconcile_game_hv()

    async def _follow_steam_game_log(self) -> None:
        tail_process: asyncio.subprocess.Process | None = None
        try:
            while True:
                log_path = self._steam_game_process_log
                while not log_path.is_file():
                    await asyncio.sleep(1)
                    log_path = self._steam_game_process_log

                snapshot = await asyncio.to_thread(log_path.read_bytes)
                self._game_log_processes.clear()
                for raw_line in snapshot.splitlines():
                    self._handle_game_log_line(
                        raw_line.decode("utf-8", errors="replace")
                    )
                self._prune_game_log_processes()
                await self._publish_game_log_state()
                decky.logger.info("Watching Steam game events in %s", log_path)

                tail_process = await asyncio.create_subprocess_exec(
                    "tail",
                    "-c",
                    f"+{len(snapshot) + 1}",
                    "-F",
                    "--",
                    str(log_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                if tail_process.stdout is None:
                    raise RuntimeError("Steam game log watcher has no output stream.")

                while tail_process.returncode is None:
                    try:
                        raw_line = await asyncio.wait_for(
                            tail_process.stdout.readline(), timeout=2
                        )
                    except asyncio.TimeoutError:
                        if self._prune_game_log_processes():
                            await self._publish_game_log_state()
                        continue
                    if not raw_line:
                        break
                    if self._handle_game_log_line(
                        raw_line.decode("utf-8", errors="replace")
                    ):
                        await self._publish_game_log_state()

                await tail_process.wait()
                tail_process = None
                decky.logger.warning("Steam game log watcher stopped; restarting.")
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            decky.logger.exception("Steam game log watcher failed: %s", error)
        finally:
            if tail_process is not None and tail_process.returncode is None:
                try:
                    tail_process.terminate()
                except ProcessLookupError:
                    pass
                if tail_process.returncode is None:
                    try:
                        await asyncio.wait_for(tail_process.wait(), timeout=2)
                    except asyncio.TimeoutError:
                        tail_process.kill()
                        await tail_process.wait()

    async def _watch_steam_game_log(self) -> None:
        while True:
            await self._follow_steam_game_log()
            decky.logger.warning("Restarting the Steam game log watcher.")
            await asyncio.sleep(1)

    def _game_hv_ids(self) -> set[str]:
        values = self.config.get("game_hv", {})
        if not isinstance(values, dict):
            return set()
        return {
            str(app_id)
            for app_id, enabled in values.items()
            if enabled is True and str(app_id).isdigit()
        }

    def _module_candidates(self) -> list[Path]:
        if self.game_module_source == "manual":
            module = self._configured_manual_module_path()
        else:
            module = self._configured_automatic_module_path()
        return [module] if module is not None else []

    @property
    def game_module_source(self) -> str:
        configured = str(self.config.get("game_module_source", "automatic"))
        return "manual" if configured == "manual" else "automatic"

    @property
    def game_watcher_mode(self) -> str:
        configured = str(self.config.get("game_watcher_mode", "steam_api"))
        return "steam_log" if configured == "steam_log" else "steam_api"

    async def _stop_game_log_watcher(self) -> None:
        if self._game_log_task is None:
            return
        self._game_log_task.cancel()
        try:
            await self._game_log_task
        except asyncio.CancelledError:
            pass
        self._game_log_task = None

    async def set_game_watcher_mode(self, mode: str) -> dict[str, Any]:
        if mode not in {"steam_api", "steam_log"}:
            raise ValueError("Game watcher mode must be steam_api or steam_log.")

        settings = self.config
        settings["game_watcher_mode"] = mode
        self._save_config(settings)

        await self._stop_game_log_watcher()
        self._game_log_processes.clear()
        self._running_game_instances.clear()
        if mode == "steam_log":
            self._running_game_ids.clear()
            self._game_log_task = asyncio.create_task(
                self._watch_steam_game_log()
            )
        else:
            self._running_game_ids = self._running_steam_games()
        await self._reconcile_game_hv()
        return await self.get_status()

    async def set_game_module_source(self, source: str) -> dict[str, Any]:
        if source not in {"automatic", "manual"}:
            raise ValueError("Game module source must be automatic or manual.")

        settings = self.config
        settings["game_module_source"] = source
        self._save_config(settings)

        if self._watcher_module_name is not None:
            async with self._operation_lock:
                path = self._watcher_module_path
                name = self._watcher_module_name
                result = await self._unload_module_path(
                    path,
                    "The game-managed module path is no longer available.",
                )
                if result["ok"] or name not in self._loaded_modules():
                    self._watcher_module_path = None
                    self._watcher_module_name = None
                else:
                    self._last_log = (
                        f"Could not switch the game module: {result['message']}"
                    )

        await self._reconcile_game_hv()
        return await self.get_status()

    async def set_game_hv(self, app_id: str, enabled: bool) -> dict[str, Any]:
        if not str(app_id).isdigit():
            raise ValueError("The Steam app ID is invalid.")
        settings = self.config
        values = settings.get("game_hv", {})
        game_hv = dict(values) if isinstance(values, dict) else {}
        if enabled:
            game_hv[str(app_id)] = True
        else:
            game_hv.pop(str(app_id), None)
        settings["game_hv"] = game_hv
        self._save_config(settings)
        await self._reconcile_game_hv()
        return await self.get_status()

    async def update_game_lifetime(
        self, app_id: str, instance_id: int, running: bool
    ) -> dict[str, Any]:
        if self.game_watcher_mode != "steam_api":
            return {"show": False, "message": ""}
        app_id = str(app_id)
        if not app_id.isdigit():
            return {"show": False, "message": ""}
        if app_id == "0":
            shortcut_ids = {
                shortcut["app_id"] for shortcut in self._steam_shortcuts()
            }
            previous = self._running_game_ids & shortcut_ids
            attempts = 4 if running else 1
            detected: set[str] = set()
            for attempt in range(attempts):
                detected = self._running_steam_games() & shortcut_ids
                if not running or detected != previous or attempt == attempts - 1:
                    break
                await asyncio.sleep(0.5)
            self._running_game_ids.difference_update(shortcut_ids)
            self._running_game_ids.update(detected)
            await self._reconcile_game_hv()
            launched_hv_game = bool(
                running and (detected - previous) & self._game_hv_ids()
            )
            return (
                await self._module_update_notice()
                if launched_hv_game
                else {"show": False, "message": ""}
            )
        was_running = app_id in self._running_game_ids
        if running:
            self._running_game_instances.setdefault(app_id, set()).add(instance_id)
            self._running_game_ids.add(app_id)
        else:
            instances = self._running_game_instances.get(app_id)
            if instances is not None:
                instances.discard(instance_id)
                if instances:
                    return {"show": False, "message": ""}
                self._running_game_instances.pop(app_id, None)
            self._running_game_ids.discard(app_id)
        await self._reconcile_game_hv()
        launched_hv_game = (
            running and not was_running and app_id in self._game_hv_ids()
        )
        return (
            await self._module_update_notice()
            if launched_hv_game
            else {"show": False, "message": ""}
        )

    async def _reconcile_game_hv(self) -> None:
        async with self._operation_lock:
            should_load = bool(self._running_game_ids & self._game_hv_ids())
            if (
                self._watcher_module_name is not None
                and self._watcher_module_name not in self._loaded_modules()
            ):
                self._watcher_module_path = None
                self._watcher_module_name = None
            if should_load and self._watcher_module_name is None:
                try:
                    module_paths = self._module_candidates()
                except (RuntimeError, ValueError) as error:
                    self._last_log = str(error)
                    return
                if not module_paths:
                    self._last_log = (
                        "An HV-enabled game is running, but no downloaded or "
                        "built module is available."
                    )
                    return
                for module_path in module_paths:
                    name = await self._module_name(module_path)
                    if name in self._loaded_modules():
                        return
                    result = await self._load_module_path(
                        module_path,
                        "Download or build the module before launching this game.",
                    )
                    if result["ok"] and name in self._loaded_modules():
                        self._watcher_module_path = module_path
                        self._watcher_module_name = name
                        decky.logger.info("Loaded %s for an HV-enabled game", name)
                        break
                else:
                    decky.logger.error(
                        "Could not load HV module for a game: %s", result["message"]
                    )
            elif not should_load and self._watcher_module_name is not None:
                path = self._watcher_module_path
                name = self._watcher_module_name
                result = await self._unload_module_path(
                    path,
                    "The game-managed module path is no longer available.",
                )
                if result["ok"] or name not in self._loaded_modules():
                    self._watcher_module_path = None
                    self._watcher_module_name = None
                    decky.logger.info("Stopped %s after the game exited", name)
                else:
                    decky.logger.error(
                        "Could not stop game-managed HV module: %s", result["message"]
                    )
