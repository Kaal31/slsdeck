import asyncio
import json
import os
import re
import shutil
import signal
import urllib.parse
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

import decky


class Core:
    MODULE_FILE = "cpuid_fault_emulation.ko"
    MODULE_NAME = "cpuid_fault_emulation"
    RELEASE_API_URL = (
        "https://api.github.com/repos/PareidoliaDev/glowing-tribble/releases/latest"
    )
    ALT_RELEASE_API_URL = (
        "https://api.github.com/repos/2804u13j200-spec/glowing-tribble/releases/latest"
    )
    PROTON_RELEASE_API_URL = (
        "https://api.github.com/repos/xXJSONDeruloXx/proton-LinUwUx-patch/releases/latest"
    )
    ALT_PROTON_RELEASE_API_URL = (
        "https://api.github.com/repos/brcly/proton-LinUwUx-patch/releases/latest"
    )
    JUPITER_REPOSITORY_FALLBACK = (
        "https://steamdeck-packages.steamos.cloud/archlinux-mirror/jupiter-3.8/os/x86_64/"
    )
    CONTAINER_IMAGE = "deck-build-container"

    def __init__(self) -> None:
        self._operation_lock = asyncio.Lock()
        self._last_log = ""
        self._module_name_cache: dict[
            Path, tuple[tuple[int, int, int], str]
        ] = {}
        self._module_compatibility_cache: dict[
            Path, tuple[tuple[int, int, int], bool | None, str]
        ] = {}
        self._watcher_module_path: Path | None = None
        self._watcher_module_name: str | None = None
        self._running_game_ids: set[str] = set()
        self._running_game_instances: dict[str, set[int]] = {}
        self._game_log_processes: dict[tuple[int, int], str] = {}
        self._game_log_task: asyncio.Task[None] | None = None
        self._umipcompat_process: asyncio.subprocess.Process | None = None
        self._umipcompat_output_task: asyncio.Task[None] | None = None
        self._umipcompat_log = ""
        # True when the last attempt to bring UMIP compatibility up failed (and
        # UMIP is not kernel-disabled) — the UI uses this to reveal the manual
        # GRUB/reboot fallback only when the automatic daemon can't cover it.
        self._umipcompat_failed = False

    @property
    def plugin_dir(self) -> Path:
        configured = getattr(decky, "DECKY_PLUGIN_DIR", None)
        return (
            Path(configured)
            if configured
            else Path(__file__).resolve().parent.parent
        )

    @property
    def settings_path(self) -> Path:
        configured = getattr(decky, "DECKY_SETTINGS_DIR", None)
        root = Path(configured) if configured else self.plugin_dir
        return root / "hypervisor-manager.json"

    @property
    def session_log_path(self) -> Path:
        return self.settings_path.parent / "hypervisor-manager-session.log"

    @staticmethod
    def _log_timestamp() -> str:
        return datetime.now().astimezone().isoformat(timespec="seconds")

    def _reset_session_log(self) -> None:
        try:
            self.session_log_path.parent.mkdir(parents=True, exist_ok=True)
            self.session_log_path.write_text(
                f"[{self._log_timestamp()}] HV-Decky backend started\n",
                encoding="utf-8",
            )
        except OSError as error:
            decky.logger.warning("Could not reset session log: %s", error)

    def _append_session_log(self, content: str) -> None:
        try:
            with self.session_log_path.open("a", encoding="utf-8") as log_file:
                log_file.write(content)
        except OSError as error:
            decky.logger.warning("Could not append to session log: %s", error)

    async def get_operation_log(self) -> str:
        try:
            with self.session_log_path.open("rb") as log_file:
                log_file.seek(0, os.SEEK_END)
                size = log_file.tell()
                log_file.seek(max(0, size - 131072))
                content = log_file.read().decode("utf-8", errors="replace")
            if size > 131072:
                content = "[Showing the last 128 KiB of this session]\n" + content
            return content.strip() or "No operation logs are available yet."
        except FileNotFoundError:
            return "No operation logs are available yet."
        except OSError as error:
            return f"Could not read the operation log: {error}"

    @property
    def config(self) -> dict[str, Any]:
        default_home = getattr(decky, "DECKY_USER_HOME", "/home/deck")
        defaults = {
            "source_dir": str(default_home),
            "compiler": "auto",
            "make_args": [],
            "module_parameters": [],
            "game_hv": {},
            "game_module_source": "automatic",
            "game_watcher_mode": "steam_api",
            "native_cpuid_check_complete": False,
            "native_cpuid_supported": None,
            "native_cpuid_output": "",
            "native_cpuid_notice_dismissed": False,
            "container_build_enabled": True,
            "module_repository": "default",
            "custom_module_repository": "",
            "downloaded_module_repository": "",
            "proton_repository": "default",
            "custom_proton_repository": "",
            "setup_complete": False,
            "setup_mode": None,
        }
        try:
            value = json.loads(self.settings_path.read_text(encoding="utf-8"))
            return {**defaults, **value} if isinstance(value, dict) else defaults
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            return defaults

    @property
    def source_dir(self) -> Path:
        return Path(str(self.config["source_dir"])).expanduser().resolve()

    def _save_config(self, settings: dict[str, Any]) -> None:
        self.settings_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.settings_path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(settings, indent=2) + "\n", encoding="utf-8"
        )
        temporary.replace(self.settings_path)

    async def _probe_cpuid_faulting(self) -> dict[str, Any]:
        probe = self.plugin_dir / "py_modules" / "lt" / "hv" / "cpuid_fault_probe.py"
        if not probe.is_file():
            return {
                "working": False,
                "available": None,
                "message": "The CPUID faulting probe is missing.",
            }

        python = next(
            (
                str(candidate)
                for candidate in (Path("/usr/bin/python3"), Path("/usr/bin/python"))
                if candidate.is_file()
            ),
            None,
        )
        if python is None:
            return {
                "working": False,
                "available": None,
                "message": "A system Python interpreter is required for the CPUID probe.",
            }

        environment = os.environ.copy()
        environment.pop("LD_LIBRARY_PATH", None)
        environment.pop("LD_PRELOAD", None)
        process = await asyncio.create_subprocess_exec(
            python,
            str(probe),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=environment,
        )
        stdout, _ = await process.communicate()
        returncode = process.returncode
        output = stdout.decode("utf-8", errors="replace").strip()
        if returncode == 0:
            return {
                "working": True,
                "available": True,
                "output": output,
                "message": (
                    "CPUID faulting is working: leaf 0x336933 faulted and "
                    "the SIGSEGV handler resumed execution with EAX=0x1337."
                ),
            }
        if returncode == 2:
            return {
                "working": False,
                "available": False,
                "output": output,
                "message": "ARCH_SET_CPUID is not supported.",
            }
        if returncode == 3:
            return {
                "working": False,
                "available": True,
                "output": output,
                "message": (
                    "ARCH_SET_CPUID succeeded, but the diagnostic CPUID "
                    "instruction did not fault."
                ),
            }
        if returncode == 5:
            return {
                "working": False,
                "available": True,
                "output": output,
                "message": "The SIGSEGV handler received an unexpected fault.",
            }
        if returncode == 6:
            return {
                "working": False,
                "available": True,
                "output": output,
                "message": "The SIGSEGV handler could not be installed.",
            }
        if returncode in (1, 7):
            detail = output[-4000:] if output else "No traceback was produced."
            return {
                "working": False,
                "available": None,
                "output": output,
                "message": f"The CPUID faulting probe failed:\n{detail}",
            }
        if returncode == -signal.SIGSEGV:
            return {
                "working": False,
                "available": True,
                "output": output,
                "message": "CPUID faulted, but the SIGSEGV handler did not recover.",
            }
        if returncode == 4:
            return {
                "working": False,
                "available": False,
                "output": output,
                "message": "CPUID faulting can only be tested on x86-64.",
            }
        return {
            "working": False,
            "available": None,
            "output": output,
            "message": (
                f"The CPUID faulting probe exited unexpectedly ({returncode})."
                + (f"\n{output[-4000:]}" if output else "")
            ),
        }

    async def test_cpuid_faulting(self) -> dict[str, Any]:
        async with self._operation_lock:
            result = await self._probe_cpuid_faulting()
            self._last_log = result["message"]
            return await self._result(
                result["working"],
                result["message"],
                result.get("output", ""),
            )

    async def get_native_cpuid_notice(self) -> dict[str, Any]:
        settings = self.config
        if settings.get("native_cpuid_check_complete"):
            supported = settings.get("native_cpuid_supported") is True
            return {
                "show": (
                    supported
                    and not bool(settings.get("native_cpuid_notice_dismissed"))
                ),
                "message": (
                    "This CPU supports CPUID faulting natively. "
                    "The HV module is not required."
                ),
                "output": str(settings.get("native_cpuid_output", "")),
            }

        if self.MODULE_NAME in self._loaded_modules():
            return {"show": False, "message": "", "output": ""}

        async with self._operation_lock:
            result = await self._probe_cpuid_faulting()
        if result["available"] is not None:
            settings = self.config
            settings["native_cpuid_check_complete"] = True
            settings["native_cpuid_supported"] = result["working"]
            settings["native_cpuid_output"] = result.get("output", "")
            self._save_config(settings)

        supported = result["working"]
        return {
            "show": supported,
            "message": (
                "This CPU supports CPUID faulting natively. "
                "The emulation module is not required."
            ) if supported else result["message"],
            "output": result.get("output", ""),
        }

    async def dismiss_native_cpuid_notice(self) -> None:
        settings = self.config
        settings["native_cpuid_notice_dismissed"] = True
        self._save_config(settings)

    async def set_container_build_enabled(
        self, enabled: bool
    ) -> dict[str, Any]:
        settings = self.config
        settings["container_build_enabled"] = bool(enabled)
        self._save_config(settings)
        return await self.get_status()

    async def complete_setup(self, mode: str) -> dict[str, Any]:
        if mode not in ("automatic", "manual"):
            raise ValueError("Setup mode must be automatic or manual.")

        settings = self.config
        settings["setup_complete"] = True
        settings["setup_mode"] = mode
        settings["game_module_source"] = mode
        self._save_config(settings)
        return await self.get_status()

    @classmethod
    def _github_release_api_url(cls, repository: str) -> str:
        value = repository.strip()
        if not value:
            raise ValueError("Enter a GitHub repository URL.")

        if re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?", value):
            value = f"https://github.com/{value}"
        elif not re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", value):
            value = f"https://{value}"

        parsed = urllib.parse.urlparse(value)
        host = (parsed.hostname or "").lower()
        parts = [urllib.parse.unquote(part) for part in parsed.path.split("/") if part]
        if host in ("github.com", "www.github.com"):
            if len(parts) != 2:
                raise ValueError(
                    "Use a GitHub repository URL such as https://github.com/owner/repo."
                )
            owner, repo = parts
        elif host == "api.github.com":
            if len(parts) not in (3, 5) or parts[0] != "repos":
                raise ValueError(
                    "Use a GitHub repository or latest-release API URL."
                )
            if len(parts) == 5 and parts[3:] != ["releases", "latest"]:
                raise ValueError(
                    "Use a GitHub repository or latest-release API URL."
                )
            owner, repo = parts[1], parts[2]
        else:
            raise ValueError("The custom repository must be hosted on github.com.")

        repo = repo.removesuffix(".git")
        component = re.compile(r"^[A-Za-z0-9_.-]+$")
        if not owner or not repo or not component.fullmatch(owner) or not component.fullmatch(repo):
            raise ValueError("The GitHub owner or repository name is invalid.")
        if parsed.query or parsed.fragment:
            raise ValueError("The repository URL must not contain a query or fragment.")
        return f"https://api.github.com/repos/{owner}/{repo}/releases/latest"

    def _selected_release_api_url(self) -> str:
        settings = self.config
        selection = settings.get("module_repository", "default")
        if selection == "alternative":
            return self.ALT_RELEASE_API_URL
        if selection == "custom":
            return self._github_release_api_url(
                str(settings.get("custom_module_repository", ""))
            )
        return self.RELEASE_API_URL

    async def set_module_repository(
        self, repository: str, custom_repository: str = ""
    ) -> dict[str, Any]:
        if repository not in ("default", "alternative", "custom"):
            raise ValueError("Unknown module repository selection.")

        settings = self.config
        if repository == "custom":
            settings["custom_module_repository"] = self._github_release_api_url(
                custom_repository
            )
        settings["module_repository"] = repository
        self._save_config(settings)
        return await self.get_status()

    @classmethod
    def _github_proton_release_api_url(cls, repository: str) -> str:
        value = repository.strip()
        if not value:
            raise ValueError("Enter a GitHub repository or release URL.")

        if re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?", value):
            value = f"https://github.com/{value}"
        elif not re.match(r"^[A-Za-z][A-Za-z0-9+.-]*://", value):
            value = f"https://{value}"

        parsed = urllib.parse.urlparse(value)
        host = (parsed.hostname or "").lower()
        parts = [urllib.parse.unquote(part) for part in parsed.path.split("/") if part]
        if parsed.query or parsed.fragment:
            raise ValueError("The release URL must not contain a query or fragment.")

        tag = None
        if host in ("github.com", "www.github.com"):
            if len(parts) == 2:
                owner, repo = parts
            elif len(parts) == 3 and parts[2] == "releases":
                owner, repo = parts[:2]
            elif len(parts) == 5 and parts[2:4] == ["releases", "tag"]:
                owner, repo, tag = parts[0], parts[1], parts[4]
            else:
                raise ValueError(
                    "Use a GitHub repository or release tag URL such as "
                    "https://github.com/owner/repo/releases/tag/v1.0."
                )
        elif host == "api.github.com":
            if (
                len(parts) == 5
                and parts[:1] == ["repos"]
                and parts[3:] == ["releases", "latest"]
            ):
                owner, repo = parts[1], parts[2]
            elif (
                len(parts) == 6
                and parts[:1] == ["repos"]
                and parts[3:5] == ["releases", "tags"]
            ):
                owner, repo, tag = parts[1], parts[2], parts[5]
            else:
                raise ValueError(
                    "Use a GitHub repository, release tag, or release API URL."
                )
        else:
            raise ValueError("The custom repository must be hosted on github.com.")

        repo = repo.removesuffix(".git")
        component = re.compile(r"^[A-Za-z0-9_.-]+$")
        if not component.fullmatch(owner) or not component.fullmatch(repo):
            raise ValueError("The GitHub owner or repository name is invalid.")
        if tag is not None:
            if not tag or "/" in tag or tag in (".", ".."):
                raise ValueError("The GitHub release tag is invalid.")
            encoded_tag = urllib.parse.quote(tag, safe="")
            return (
                f"https://api.github.com/repos/{owner}/{repo}/releases/tags/"
                f"{encoded_tag}"
            )
        return f"https://api.github.com/repos/{owner}/{repo}/releases/latest"

    def _selected_proton_release_api_url(self) -> str:
        settings = self.config
        selection = settings.get("proton_repository", "default")
        if selection == "alternative":
            return self.ALT_PROTON_RELEASE_API_URL
        if selection == "custom":
            return self._github_proton_release_api_url(
                str(settings.get("custom_proton_repository", ""))
            )
        return self.PROTON_RELEASE_API_URL

    async def set_proton_repository(
        self, repository: str, custom_repository: str = ""
    ) -> dict[str, Any]:
        if repository not in ("default", "alternative", "custom"):
            raise ValueError("Unknown Proton repository selection.")

        settings = self.config
        if repository == "custom":
            settings["custom_proton_repository"] = (
                self._github_proton_release_api_url(custom_repository)
            )
        settings["proton_repository"] = repository
        self._save_config(settings)
        return await self.get_status()

    @property
    def proton_install_dir(self) -> Path:
        home = Path(str(getattr(decky, "DECKY_USER_HOME", "/home/deck")))
        return home / ".local" / "share" / "Steam" / "compatibilitytools.d"

    @property
    def automatic_module_dir(self) -> Path:
        return self.plugin_dir / "downloaded-modules"

    @property
    def automatic_module_path(self) -> Path:
        return self.automatic_module_dir / self.MODULE_FILE

    @property
    def container_dir(self) -> Path:
        packaged = self.plugin_dir / "dist" / "container"
        return packaged if packaged.is_dir() else self.plugin_dir / "container"

    async def set_source_directory(self, path: str) -> dict[str, Any]:
        candidate = Path(path).expanduser().resolve()
        if not candidate.is_dir():
            raise ValueError("The selected path is not a directory.")
        if not (candidate / "Makefile").is_file():
            raise ValueError("The selected directory does not contain a Makefile.")

        settings = self.config
        settings["source_dir"] = str(candidate)
        self._save_config(settings)
        self._last_log = f"Selected hypervisor directory: {candidate}"
        return await self.get_status()

    async def set_source_zip(self, path: str) -> dict[str, Any]:
        archive = Path(path).expanduser().resolve()
        if not archive.is_file() or archive.suffix.lower() != ".zip":
            raise ValueError("The selected path is not a ZIP file.")

        extraction_dir = self.settings_path.parent / "hypervisor-source"
        temporary_dir = extraction_dir.with_name(
            f".{extraction_dir.name}-extracting"
        )
        shutil.rmtree(temporary_dir, ignore_errors=True)
        temporary_dir.mkdir(parents=True)

        try:
            with zipfile.ZipFile(archive) as source_zip:
                for entry in source_zip.infolist():
                    entry_path = Path(entry.filename)
                    if (
                        entry_path.is_absolute()
                        or ".." in entry_path.parts
                        or (entry.external_attr >> 16) & 0o170000 == 0o120000
                    ):
                        raise ValueError(
                            "The ZIP file contains an unsafe path or symbolic link."
                        )
                source_zip.extractall(temporary_dir)

            candidates = [temporary_dir]
            candidates.extend(
                path
                for path in temporary_dir.iterdir()
                if path.is_dir()
            )
            source_root = next(
                (
                    candidate
                    for candidate in candidates
                    if (candidate / "Makefile").is_file()
                ),
                None,
            )
            if source_root is None:
                raise ValueError(
                    "The ZIP file does not contain a Makefile at its root "
                    "or in its top-level folder."
                )

            relative_source = source_root.relative_to(temporary_dir)
            if os.geteuid() == 0:
                owner = self._deck_user_identity()
                if owner is None:
                    raise OSError(
                        "Could not identify the Deck user who must own the "
                        "extracted source."
                    )
                uid, gid = owner
                for extracted_path in [temporary_dir, *temporary_dir.rglob("*")]:
                    os.chown(extracted_path, uid, gid)
                    mode = extracted_path.stat().st_mode
                    if extracted_path.is_dir():
                        extracted_path.chmod(mode | 0o700)
                    elif extracted_path.is_file():
                        extracted_path.chmod(mode | 0o600)

            shutil.rmtree(extraction_dir, ignore_errors=True)
            temporary_dir.replace(extraction_dir)
            candidate = (extraction_dir / relative_source).resolve()

            settings = self.config
            settings["source_dir"] = str(candidate)
            self._save_config(settings)
        except (OSError, zipfile.BadZipFile) as error:
            shutil.rmtree(temporary_dir, ignore_errors=True)
            raise ValueError(f"Could not extract the ZIP file: {error}") from error
        except Exception:
            shutil.rmtree(temporary_dir, ignore_errors=True)
            raise

        self._last_log = f"Extracted hypervisor ZIP to: {candidate}"
        return await self.get_status()
