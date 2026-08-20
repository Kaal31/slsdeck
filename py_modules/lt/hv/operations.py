import json
import os
import posixpath
import re
import shutil
import stat
import tarfile
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

import decky


class Operations:
    async def get_status(self) -> dict[str, Any]:
        loaded = self._loaded_modules()
        automatic_module_info = []
        for path in self._automatic_module_paths():
            name = await self._module_name(path)
            compatible, compatibility_message = (
                await self._module_kernel_compatibility(path)
            )
            automatic_module_info.append(
                {
                    "path": str(path),
                    "name": name,
                    "loaded": name in loaded,
                    "kernel_compatible": compatible,
                    "compatibility_message": compatibility_message,
                }
            )

        manual_module_info = []
        for path in self._manual_module_paths():
            name = await self._module_name(path)
            compatible, compatibility_message = (
                await self._module_kernel_compatibility(path)
            )
            manual_module_info.append(
                {
                    "path": str(path),
                    "name": name,
                    "loaded": name in loaded,
                    "kernel_compatible": compatible,
                    "compatibility_message": compatibility_message,
                }
            )

        configured_manual_module = None
        try:
            selected = self._configured_manual_module_path()
            configured_manual_module = str(selected) if selected else None
        except (RuntimeError, ValueError) as error:
            self._last_log = str(error)

        configured_automatic_module = None
        selected = self._configured_automatic_module_path()
        configured_automatic_module = str(selected) if selected else None

        try:
            compiler_name = self.compiler_name
            compiler_error = ""
        except ValueError as error:
            compiler_name = self.kernel_compiler
            compiler_error = str(error)
            self._last_log = compiler_error

        return {
            "root": os.geteuid() == 0,
            "kernel_release": self.kernel_release,
            "umip_disabled": self.umip_disabled(),
            "umipcompat_running": self._umipcompat_running(),
            "umipcompat_failed": bool(self._umipcompat_failed),
            "architecture": os.uname().machine,
            "headers_path": str(self.headers_dir),
            "headers_ready": (
                self.headers_dir.is_dir()
                and (self.headers_dir / "Makefile").is_file()
            ),
            "make_path": shutil.which("make"),
            "gcc_path": shutil.which("gcc"),
            "clang_path": shutil.which("clang"),
            "kernel_compiler": self.kernel_compiler,
            "compiler_name": compiler_name,
            "compiler_path": shutil.which(compiler_name),
            "compiler_error": compiler_error,
            "source_path": str(self.source_dir),
            "source_ready": (
                self.source_dir.is_dir()
                and (self.source_dir / "Makefile").is_file()
            ),
            "build_user": self.build_user,
            "podman_path": shutil.which("podman"),
            "container_files_ready": all(
                (self.container_dir / name).is_file()
                for name in ("Dockerfile", "entrypoint.sh", "build.sh")
            ),
            "container_image": self.CONTAINER_IMAGE,
            "container_build_enabled": bool(
                self.config.get("container_build_enabled", True)
            ),
            "setup_complete": bool(self.config.get("setup_complete", False)),
            "setup_mode": (
                str(self.config.get("setup_mode"))
                if self.config.get("setup_mode") in ("automatic", "manual")
                else None
            ),
            "module_repository": str(
                self.config.get("module_repository", "default")
            ),
            "module_repository_url": self._selected_release_api_url(),
            "proton_repository": str(
                self.config.get("proton_repository", "default")
            ),
            "proton_repository_url": self._selected_proton_release_api_url(),
            "proton_install_path": str(self.proton_install_dir),
            "expected_module": self.MODULE_FILE,
            "is_steamos": self._is_steamos(),
            "pacman_path": shutil.which("pacman"),
            "modinfo_path": shutil.which("modinfo"),
            "insmod_path": shutil.which("insmod"),
            "rmmod_path": shutil.which("rmmod"),
            "modules": [*automatic_module_info, *manual_module_info],
            "automatic_modules": automatic_module_info,
            "manual_modules": manual_module_info,
            "configured_module": configured_manual_module,
            "configured_automatic_module": configured_automatic_module,
            "automatic_module_path": str(self.automatic_module_path),
            "game_module_source": self.game_module_source,
            "game_watcher_mode": self.game_watcher_mode,
            "games": self._installed_games(),
            "last_log": self._last_log,
            "operation_log_path": str(self.session_log_path),
        }

    async def _result(
        self,
        ok: bool,
        message: str,
        output: str = "",
        reboot_required: bool = False,
    ) -> dict[str, Any]:
        final_log = message
        if output.strip():
            final_log += f"\n\n{output.strip()}"
        self._last_log = final_log[-12000:]
        self._append_session_log(
            f"[{self._log_timestamp()}] RESULT "
            f"{'OK' if ok else 'FAILED'}: {message}\n"
        )
        return {
            "ok": ok,
            "message": message,
            "output": output,
            "reboot_required": reboot_required,
            "status": await self.get_status(),
        }

    async def build_module(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            make = shutil.which("make")
            try:
                compiler_name = self.compiler_name
            except ValueError as error:
                return await self._result(False, str(error))
            compiler = shutil.which(compiler_name)
            if not make or not compiler:
                return await self._result(
                    False,
                    f"make and {compiler_name} must both be installed.",
                )
            if not self.headers_dir.is_dir() or not (
                self.headers_dir / "Makefile"
            ).is_file():
                return await self._result(
                    False,
                    f"Matching kernel headers are missing: {self.headers_dir}",
                )
            if not (self.source_dir / "Makefile").is_file():
                return await self._result(
                    False, f"No Makefile found in {self.source_dir}"
                )

            make_args = self.config.get("make_args", [])
            if not isinstance(make_args, list) or not all(
                isinstance(arg, str) for arg in make_args
            ):
                return await self._result(
                    False, "Saved make_args must be a list of strings."
                )

            toolchain_args = [f"CC={compiler}"]
            if compiler_name == "clang":
                toolchain_args.append("LLVM=1")

            build_user = self.build_user
            runuser = shutil.which("runuser")
            if os.geteuid() == 0:
                if not build_user or not runuser:
                    return await self._result(
                        False,
                        "Could not identify a non-root user for the build. "
                        "The plugin will not execute a selected Makefile as root.",
                    )
                command = [
                    runuser,
                    "--user",
                    build_user,
                    "--",
                    make,
                ]
            else:
                command = [make]

            code, output = await self._run(
                *command,
                "-C",
                str(self.source_dir),
                *toolchain_args,
                *make_args,
            )

            try:
                selected = self._configured_manual_module_path()
            except (RuntimeError, ValueError) as error:
                return await self._result(False, str(error), output)
            if selected is None:
                return await self._result(
                    False, "Build completed but produced no .ko file.", output
                )
            return await self._result(
                True, f"Built {selected.name} for {self.kernel_release}.", output
            )

    async def build_container_image(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            try:
                runtime = self._container_runtime_command()
                repository_suffix = self._steamos_repository_suffix()
            except RuntimeError as error:
                return await self._result(False, str(error))

            required_files = ("Dockerfile", "entrypoint.sh", "build.sh")
            missing = [
                name
                for name in required_files
                if not (self.container_dir / name).is_file()
            ]
            if missing:
                return await self._result(
                    False,
                    "Container build files are missing: " + ", ".join(missing),
                )

            code, output = await self._run(
                *runtime,
                "build",
                "--build-arg",
                f"STEAMOS_REPOSITORY_SUFFIX={repository_suffix}",
                "--tag",
                self.CONTAINER_IMAGE,
                str(self.container_dir),
            )
            if code != 0:
                return await self._result(
                    False, "Podman could not build the SteamOS image.", output
                )
            return await self._result(
                True,
                f"Built container image {self.CONTAINER_IMAGE}.",
                output,
            )

    async def build_module_container(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            try:
                runtime = self._container_runtime_command()
            except RuntimeError as error:
                return await self._result(False, str(error))

            if not (self.source_dir / "Makefile").is_file():
                return await self._result(
                    False, f"No Makefile found in {self.source_dir}"
                )

            code, _ = await self._run(
                *runtime,
                "image",
                "exists",
                self.CONTAINER_IMAGE,
                capture_log=False,
            )
            if code != 0:
                return await self._result(
                    False,
                    f"Container image {self.CONTAINER_IMAGE} is not built yet.",
                )

            make_args = self.config.get("make_args", [])
            if not isinstance(make_args, list) or not all(
                isinstance(arg, str) for arg in make_args
            ):
                return await self._result(
                    False, "Saved make_args must be a list of strings."
                )

            module_path = self.source_dir / self.MODULE_FILE
            previous_module = None
            if module_path.is_file():
                previous_module = module_path.with_name(
                    f".{module_path.name}.hv-decky-backup-"
                    f"{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
                )
                try:
                    module_path.replace(previous_module)
                except OSError as error:
                    return await self._result(
                        False,
                        f"Could not prepare the existing module for rebuild: {error}",
                    )

            def restore_previous_module() -> str | None:
                if previous_module is None:
                    return None
                try:
                    previous_module.replace(module_path)
                    return None
                except OSError as error:
                    return str(error)

            code, output = await self._run(
                *runtime,
                "run",
                "--rm",
                "--volume",
                "/:/host:ro",
                "--volume",
                f"{self.source_dir}:/work:rw",
                "--workdir",
                "/work",
                self.CONTAINER_IMAGE,
                "make",
                "-C",
                "/work",
                *make_args,
            )
            if code != 0:
                restore_error = restore_previous_module()
                message = "The containerized module build failed."
                if restore_error:
                    message += f" The previous module could not be restored: {restore_error}"
                return await self._result(
                    False, message, output
                )

            selected = self._configured_manual_module_path()
            if selected is None:
                restore_error = restore_previous_module()
                message = "Container build completed but produced no .ko file."
                if restore_error:
                    message += f" The previous module could not be restored: {restore_error}"
                return await self._result(
                    False,
                    message,
                    output,
                )
            if previous_module is not None:
                try:
                    previous_module.unlink()
                except OSError as error:
                    decky.logger.warning(
                        "Could not remove the previous module backup %s: %s",
                        previous_module,
                        error,
                    )
            return await self._result(
                True,
                f"Built {selected.name} for {self.kernel_release} in Podman.",
                output,
            )

    async def install_build_dependencies(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()

            pacman = shutil.which("pacman")
            pacman_key = shutil.which("pacman-key")
            readonly = shutil.which("steamos-readonly")
            if not pacman or not pacman_key:
                return await self._result(
                    False, "SteamOS pacman or pacman-key was not found."
                )

            packages = ["gcc", "make", "kmod"]
            if self.compiler_name == "clang":
                packages.append("clang")

            headers_url = None
            if not (
                self.headers_dir.is_dir()
                and (self.headers_dir / "Makefile").is_file()
            ):
                try:
                    headers_url = await self._headers_package_url()
                except ValueError as error:
                    return await self._result(False, str(error))
                if not headers_url:
                    kernel_release = await self._running_kernel_release()
                    kernel_package = (
                        await self._kernel_package(kernel_release)
                        if kernel_release
                        else None
                    )
                    detail = (
                        f"Kernel package: {kernel_package}."
                        if kernel_package
                        else "The running kernel package could not be identified."
                    )
                    return await self._result(
                        False,
                        "Could not find an exact headers archive for "
                        f"{self.kernel_release}. {detail} Update/reboot SteamOS "
                        "or install matching headers manually.",
                    )

            readonly_was_enabled = False
            output_parts: list[str] = []
            try:
                if readonly:
                    code, output = await self._run(
                        readonly, "status", capture_log=False
                    )
                    output_parts.append(output)
                    readonly_was_enabled = (
                        code == 0 and "enabled" in output.lower()
                    )
                    if readonly_was_enabled:
                        code, output = await self._run(readonly, "disable")
                        output_parts.append(output)

                code, output = await self._run(pacman_key, "--init")
                output_parts.append(output)

                code, output = await self._run(pacman_key, "--populate")
                output_parts.append(output)

                code, output = await self._run(
                    pacman,
                    "-S",
                    "--needed",
                    "--noconfirm",
                    *packages,
                )
                output_parts.append(output)

                if headers_url:
                    code, output = await self._run(
                        pacman,
                        "-U",
                        "--needed",
                        "--noconfirm",
                        headers_url,
                    )
                    output_parts.append(output)
                    if code != 0:
                        return await self._result(
                            False,
                            "pacman failed while installing kernel headers from "
                            f"{headers_url}",
                            "\n".join(output_parts),
                        )
            finally:
                if readonly and readonly_was_enabled:
                    code, output = await self._run(readonly, "enable")
                    output_parts.append(output)
                    if code != 0:
                        decky.logger.error(
                            "Failed to restore SteamOS read-only mode"
                        )

            return await self._result(
                True,
                f"Build dependencies are ready: {' '.join(packages)}",
                "\n".join(output_parts),
            )

    async def disable_umip(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            reboot_required = False
            if not self.umip_disabled():
                grub_config = Path("/etc/default/grub")
                if not grub_config.is_file():
                    return await self._result(
                        False,
                        "Grub configuration file not found.",
                    )
                grub_content = grub_config.read_text(encoding="utf-8")
                if "clearcpuid=514" not in grub_content:
                    # yay regex
                    grub_content = re.sub(
                        r'GRUB_CMDLINE_LINUX_DEFAULT="([^"]*)"',
                        r'GRUB_CMDLINE_LINUX_DEFAULT="\1 clearcpuid=514"',
                        grub_content,
                    )
                    grub_config.write_text(grub_content, encoding="utf-8")
                    update_grub = shutil.which("update-grub")
                    if not update_grub:
                        return await self._result(
                            False,
                            "Grub update command not found.",
                        )
                    code, output = await self._run(update_grub)
                    if code != 0:
                        return await self._result(
                            False,
                            "Failed to update Grub configuration.",
                            output,
                        )
                    reboot_required = True

            return await self._result(
                True,
                "UMIP is disabled.",
                reboot_required=reboot_required,
            )

    async def enable_umip(self) -> dict[str, Any]:
        """Undo a previous kernel-level UMIP disable (remove clearcpuid=514 from
        GRUB + update-grub). After a reboot UMIP is back on and the umipcompatd
        daemon covers it automatically — the reboot-free default path."""
        async with self._operation_lock:
            self._require_root()
            grub_config = Path("/etc/default/grub")
            if not grub_config.is_file():
                return await self._result(False, "Grub configuration file not found.")
            grub_content = grub_config.read_text(encoding="utf-8")
            if "clearcpuid=514" not in grub_content:
                return await self._result(
                    True, "UMIP is already enabled (no clearcpuid=514 in Grub)."
                )
            new_content = re.sub(r"\s*clearcpuid=514", "", grub_content)
            grub_config.write_text(new_content, encoding="utf-8")
            update_grub = shutil.which("update-grub")
            if not update_grub:
                return await self._result(False, "Grub update command not found.")
            code, output = await self._run(update_grub)
            if code != 0:
                return await self._result(
                    False, "Failed to update Grub configuration.", output
                )
            return await self._result(
                True,
                "UMIP restore staged — reboot to re-enable UMIP; the daemon then "
                "covers it automatically.",
                output,
                reboot_required=True,
            )

    async def reboot_system(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            systemctl = shutil.which("systemctl")
            if not systemctl:
                return await self._result(False, "systemctl was not found.")

            code, output = await self._run(systemctl, "reboot")
            if code != 0:
                return await self._result(
                    False,
                    "Failed to reboot the system.",
                    output,
                )
            return await self._result(True, "Rebooting now.", output)

    @staticmethod
    def _owner_repo_from_api(api_url: str) -> str:
        """`https://api.github.com/repos/<owner>/<repo>/releases/latest` -> `<owner>/<repo>`."""
        try:
            tail = api_url.split("/repos/", 1)[1]
            owner_repo = tail.split("/releases", 1)[0].strip("/")
            return owner_repo if owner_repo.count("/") == 1 else ""
        except Exception:
            return ""

    @staticmethod
    def _looks_like_ko(path: Path) -> bool:
        """A real kernel module is an ELF object; a 404/HTML error page is not."""
        try:
            with open(path, "rb") as handle:
                head = handle.read(4)
            return head == b"\x7fELF" and path.stat().st_size > 4096
        except Exception:
            return False

    async def _try_direct_ko_download(self, wget: str, expected_asset: str) -> bool:
        """Download the exact-kernel .ko via GitHub's API-less
        ``releases/latest/download/<asset>`` redirect. This bypasses the
        api.github.com rate limit (60 req/hr unauthenticated, which makes the
        metadata query fail) and always targets the newest release. Tries the
        selected repo then the built-in fallback repo. Returns True on a verified
        ELF module written to ``automatic_module_path``."""
        candidates: list[str] = []
        for api_url in (self._selected_release_api_url(), self.RELEASE_API_URL, self.ALT_RELEASE_API_URL):
            owner_repo = self._owner_repo_from_api(api_url)
            if owner_repo:
                url = f"https://github.com/{owner_repo}/releases/latest/download/{expected_asset}"
                if url not in candidates:
                    candidates.append(url)
        self.automatic_module_dir.mkdir(parents=True, exist_ok=True)
        temporary_path = self.automatic_module_path.with_suffix(".ko.tmp")
        for url in candidates:
            code, _ = await self._run(wget, "-q", "-O", str(temporary_path), url)
            if code == 0 and self._looks_like_ko(temporary_path):
                temporary_path.replace(self.automatic_module_path)
                config = self.config
                config["downloaded_module_repository"] = self._selected_release_api_url()
                self._save_config(config)
                return True
            try:
                temporary_path.unlink()
            except OSError:
                pass
        return False

    async def download_bin(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            release_api_url = self._selected_release_api_url()
            module_path = self._configured_automatic_module_path()
            if module_path is not None and module_path.is_file():
                compatible, _ = await self._module_kernel_compatibility(
                    module_path
                )
                downloaded_repository = str(
                    self.config.get("downloaded_module_repository", "")
                )
                repository_matches = (
                    downloaded_repository == release_api_url
                    or not downloaded_repository
                    and release_api_url == self.RELEASE_API_URL
                )
                if compatible is not False and repository_matches:
                    return await self._result(
                        True,
                        f"Module already exists at {module_path}.",
                    )

            curl = shutil.which("curl")
            wget = shutil.which("wget")
            if not curl:
                return await self._result(False, "curl was not found.")
            if not wget:
                return await self._result(False, "wget was not found.")

            expected_asset = f"cpuid_fault_emulation-{self.kernel_release}.ko"

            # Primary path: pull the exact-kernel module straight from the latest
            # release via GitHub's API-less download redirect. No api.github.com
            # call, so no rate limit, and it always resolves to the newest build.
            if await self._try_direct_ko_download(wget, expected_asset):
                return await self._result(
                    True,
                    f"Downloaded latest module to {self.automatic_module_path}.",
                )

            # Fallback: query the release API (rate-limited) only to give a useful
            # error — e.g. list the kernels that DO have a prebuilt module.
            code, release_json = await self._run(
                curl,
                "-fsSL",
                release_api_url,
                capture_log=False,
            )
            if code != 0:
                return await self._result(
                    False,
                    f"No prebuilt module for kernel {self.kernel_release} at the "
                    f"latest-release URL, and the release API query failed "
                    f"(rate-limited?). Try again shortly, or build the module locally.",
                    release_json,
                )
            try:
                release = json.loads(release_json)
                assets = release.get("assets", [])
                if not isinstance(assets, list):
                    raise ValueError("release assets were not a list")
                download_url = next(
                    (
                        str(asset["browser_download_url"])
                        for asset in assets
                        if isinstance(asset, dict)
                        and asset.get("name") == expected_asset
                        and isinstance(asset.get("browser_download_url"), str)
                    ),
                    None,
                )
            except (json.JSONDecodeError, KeyError, ValueError) as error:
                return await self._result(
                    False,
                    f"Could not parse GitHub release metadata: {error}",
                    release_json,
                )

            if not download_url:
                available = [
                    str(asset.get("name"))
                    for asset in assets
                    if isinstance(asset, dict)
                    and isinstance(asset.get("name"), str)
                    and str(asset.get("name")).endswith(".ko")
                ]
                detail = (
                    f" Available modules: {', '.join(available[:12])}."
                    if available
                    else ""
                )
                return await self._result(
                    False,
                    f"No prebuilt module named {expected_asset} was found in "
                    f"the latest release.{detail}",
                )

            self.automatic_module_dir.mkdir(parents=True, exist_ok=True)
            temporary_path = self.automatic_module_path.with_suffix(".ko.tmp")
            code, output = await self._run(
                wget,
                "-O",
                str(temporary_path),
                download_url,
            )
            if code != 0:
                try:
                    temporary_path.unlink()
                except FileNotFoundError:
                    pass
                except OSError as error:
                    decky.logger.warning(
                        "Failed to remove partial module download: %s", error
                    )
            if code != 0:
                return await self._result(
                    False,
                    f"Failed to download the module from {download_url}.",
                    output,
                )
            temporary_path.replace(self.automatic_module_path)
            settings = self.config
            settings["downloaded_module_repository"] = release_api_url
            self._save_config(settings)
            return await self._result(
                True,
                f"Downloaded module to {self.automatic_module_path}.",
                output,
            )

    @staticmethod
    def _is_proton_archive(name: str) -> bool:
        lowered = name.lower()
        return lowered.endswith((".tar.gz", ".tgz", ".tar.xz", ".txz", ".zip"))

    async def _fetch_proton_release(self) -> tuple[dict[str, Any] | None, str]:
        curl = shutil.which("curl")
        if not curl:
            return None, "curl was not found."

        release_api_url = self._selected_proton_release_api_url()
        code, release_json = await self._run(
            curl,
            "-fsSL",
            release_api_url,
            capture_log=False,
        )
        if code != 0:
            return None, f"Failed to query {release_api_url}.\n{release_json}".strip()

        try:
            release = json.loads(release_json)
            if not isinstance(release, dict) or not isinstance(
                release.get("assets"), list
            ):
                raise ValueError("release assets were not a list")
            return release, ""
        except (json.JSONDecodeError, ValueError) as error:
            return None, f"Could not parse GitHub release metadata: {error}"

    @staticmethod
    def _proton_release_assets(release: dict[str, Any]) -> list[dict[str, Any]]:
        return [
            asset
            for asset in release.get("assets", [])
            if isinstance(asset, dict)
            and isinstance(asset.get("id"), int)
            and isinstance(asset.get("name"), str)
            and Path(str(asset["name"])).name == asset["name"]
            and isinstance(asset.get("browser_download_url"), str)
            and Operations._is_proton_archive(str(asset["name"]))
        ]

    async def get_proton_release_assets(self) -> dict[str, Any]:
        async with self._operation_lock:
            release, error = await self._fetch_proton_release()
            if release is None:
                raise RuntimeError(error)

            assets = self._proton_release_assets(release)
            return {
                "name": str(
                    release.get("name") or release.get("tag_name") or "Release"
                ),
                "tag_name": str(release.get("tag_name") or ""),
                "repository_url": self._selected_proton_release_api_url(),
                "assets": [
                    {
                        "id": int(asset["id"]),
                        "name": str(asset["name"]),
                        "size": int(asset.get("size", 0)),
                    }
                    for asset in assets
                ],
            }

    @staticmethod
    def _safe_archive_path(value: str) -> bool:
        if not value or value.startswith("/"):
            return False
        normalized = posixpath.normpath(value)
        return normalized not in ("", ".", "..") and not normalized.startswith(
            "../"
        )

    def _extract_proton_archive(self, archive: Path, destination: Path) -> None:
        lowered = archive.name.lower()
        if lowered.endswith(".zip"):
            with zipfile.ZipFile(archive) as source_zip:
                for entry in source_zip.infolist():
                    file_type = (entry.external_attr >> 16) & 0o170000
                    if (
                        not self._safe_archive_path(entry.filename)
                        or file_type == stat.S_IFLNK
                    ):
                        raise ValueError(
                            "The Proton ZIP contains an unsafe path or symbolic link."
                        )
                source_zip.extractall(destination)
            return

        with tarfile.open(archive, mode="r:*") as source_tar:
            symlink_paths: set[str] = set()
            for member in source_tar.getmembers():
                normalized = posixpath.normpath(member.name)
                ancestors = normalized.split("/")[:-1]
                ancestor_paths = {
                    "/".join(ancestors[:index])
                    for index in range(1, len(ancestors) + 1)
                }
                if (
                    not self._safe_archive_path(member.name)
                    or member.isdev()
                    or member.isfifo()
                    or ancestor_paths.intersection(symlink_paths)
                ):
                    raise ValueError("The Proton archive contains an unsafe entry.")
                if member.issym() or member.islnk():
                    link_path = (
                        posixpath.join(posixpath.dirname(normalized), member.linkname)
                        if member.issym()
                        else member.linkname
                    )
                    if not self._safe_archive_path(link_path):
                        raise ValueError("The Proton archive contains an unsafe link.")
                    if member.issym():
                        symlink_paths.add(normalized)
            source_tar.extractall(destination)

    def _install_extracted_proton(self, extracted: Path) -> list[Path]:
        tool_roots = sorted(
            {marker.parent for marker in extracted.rglob("compatibilitytool.vdf")},
            key=lambda path: str(path),
        )
        if not tool_roots:
            raise ValueError(
                "The archive does not contain a Steam compatibilitytool.vdf file."
            )

        owner = self._deck_user_identity() if os.geteuid() == 0 else None
        if os.geteuid() == 0 and owner is None:
            raise OSError("Could not identify the Deck user who must own Proton.")
        missing_directories: list[Path] = []
        current = self.proton_install_dir
        while not current.exists():
            missing_directories.append(current)
            current = current.parent
        self.proton_install_dir.mkdir(parents=True, exist_ok=True)
        if owner is not None:
            uid, gid = owner
            for directory in reversed(missing_directories):
                os.chown(directory, uid, gid)

        installed: list[Path] = []

        for source in tool_roots:
            destination = self.proton_install_dir / source.name
            staging = self.proton_install_dir / f".{source.name}.hv-decky-installing"
            backup = self.proton_install_dir / f".{source.name}.hv-decky-backup"
            if destination.is_symlink() or (
                destination.exists() and not destination.is_dir()
            ):
                raise ValueError(
                    f"Cannot replace non-directory compatibility tool: {destination}"
                )
            shutil.rmtree(staging, ignore_errors=True)
            shutil.rmtree(backup, ignore_errors=True)
            shutil.copytree(source, staging, symlinks=True)

            if owner is not None:
                uid, gid = owner
                for path in [staging, *staging.rglob("*")]:
                    os.chown(path, uid, gid, follow_symlinks=False)

            had_previous = destination.exists()
            try:
                if had_previous:
                    destination.replace(backup)
                staging.replace(destination)
            except Exception:
                shutil.rmtree(staging, ignore_errors=True)
                if had_previous and backup.exists() and not destination.exists():
                    backup.replace(destination)
                raise
            shutil.rmtree(backup, ignore_errors=True)
            installed.append(destination)
        return installed

    async def download_proton_asset(self, asset_id: int) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            if not isinstance(asset_id, int) or isinstance(asset_id, bool):
                return await self._result(False, "The selected Proton asset is invalid.")
            wget = shutil.which("wget")
            if not wget:
                return await self._result(False, "wget was not found.")

            release, error = await self._fetch_proton_release()
            if release is None:
                return await self._result(False, error)
            asset = next(
                (
                    candidate
                    for candidate in self._proton_release_assets(release)
                    if candidate.get("id") == asset_id
                ),
                None,
            )
            if asset is None:
                return await self._result(
                    False,
                    "The selected archive is not available in this GitHub release.",
                )

            temporary_root = self.settings_path.parent
            temporary_root.mkdir(parents=True, exist_ok=True)
            try:
                with tempfile.TemporaryDirectory(
                    prefix="hv-decky-proton-", dir=temporary_root
                ) as temporary_name:
                    temporary = Path(temporary_name)
                    archive = temporary / str(asset["name"])
                    extracted = temporary / "extracted"
                    extracted.mkdir()
                    code, output = await self._run(
                        wget,
                        "-O",
                        str(archive),
                        str(asset["browser_download_url"]),
                    )
                    if code != 0:
                        return await self._result(
                            False,
                            f"Failed to download Proton asset {asset['name']}.",
                            output,
                        )
                    self._extract_proton_archive(archive, extracted)
                    installed = self._install_extracted_proton(extracted)
            except (OSError, tarfile.TarError, zipfile.BadZipFile, ValueError) as exc:
                return await self._result(
                    False,
                    f"Could not install Proton asset {asset['name']}: {exc}",
                )

            paths = ", ".join(str(path) for path in installed)
            return await self._result(
                True,
                f"Installed {asset['name']} to {paths}.",
            )

    async def _load_module_path(
        self,
        module_path: Path | None,
        missing_message: str,
    ) -> dict[str, Any]:
        if module_path is None:
            return await self._result(False, missing_message)

        name = await self._module_name(module_path)
        if name in self._loaded_modules():
            compat_ok, compat_message = await self.ensure_umip_active()
            return await self._result(
                compat_ok,
                f"{name} is already loaded.",
                self._umipcompat_log if not compat_ok else "",
            )

        modinfo = shutil.which("modinfo")
        if not modinfo:
            return await self._result(
                False,
                "modinfo is unavailable. Install the kmod package before loading.",
            )
        code, vermagic = await self._run(
            modinfo,
            "-F",
            "vermagic",
            str(module_path),
            capture_log=False,
        )
        if code != 0 or self.kernel_release not in vermagic:
            return await self._result(
                False,
                "The module was not built for the running kernel "
                f"{self.kernel_release}. Rebuild it before starting.",
            )

        insmod = shutil.which("insmod")
        if not insmod:
            return await self._result(False, "kmod is not installed.")
        
        modprobe = shutil.which("modprobe")

        if modprobe:
            code, output = await self._run(modprobe, "-r", "kvm_amd")
            code, output = await self._run(modprobe, "-r", "kvm")

        code, output = await self._run(insmod, str(module_path))
        if code != 0:
            return await self._result(
                False, f"insmod exited with code {code}", output
            )
        compat_ok, compat_message = await self.ensure_umip_active()
        return await self._result(
            compat_ok,
            f"Loaded {name}.",
            "\n".join(part for part in (output, self._umipcompat_log) if part),
        )

    async def load_module(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            try:
                module_path = self._configured_manual_module_path()
            except (RuntimeError, ValueError) as error:
                return await self._result(False, str(error))
            return await self._load_module_path(
                module_path,
                "Build the module before starting it.",
            )

    async def load_automatic_module(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            module_path = self._configured_automatic_module_path()
            return await self._load_module_path(
                module_path,
                "Download the module before starting it.",
            )

    async def _unload_module_path(
        self,
        module_path: Path | None,
        missing_message: str,
    ) -> dict[str, Any]:
        compat_ok, compat_message = await self._stop_umipcompat()
        if module_path is None:
            return await self._result(
                False,
                f"{missing_message}",
            )

        name = await self._module_name(module_path)
        if name not in self._loaded_modules():
            return await self._result(
                compat_ok,
                f"{name} is already stopped.",
            )

        rmmod = shutil.which("rmmod")
        if not rmmod:
            return await self._result(False, "kmod is not installed.")
        code, output = await self._run(rmmod, name)
        if code != 0:
            return await self._result(
                False,
                f"rmmod exited with code {code}; the module may still be in use.",
                output,
            )
        modprobe = shutil.which("modprobe")

        if modprobe:
            code, output = await self._run(modprobe, "kvm_amd")
            code, output = await self._run(modprobe, "kvm")

        return await self._result(
            compat_ok,
            f"Unloaded {name}.",
            output,
        )

    async def unload_module(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            try:
                module_path = self._configured_manual_module_path()
            except (RuntimeError, ValueError) as error:
                return await self._result(False, str(error))
            return await self._unload_module_path(
                module_path,
                "No built module was found.",
            )

    async def unload_automatic_module(self) -> dict[str, Any]:
        async with self._operation_lock:
            self._require_root()
            module_path = self._configured_automatic_module_path()
            return await self._unload_module_path(
                module_path,
                "No downloaded module was found.",
            )
