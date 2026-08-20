import asyncio
import os
import pwd
import re
import shutil
import urllib.parse
from pathlib import Path
from typing import Any

import decky


class System:
    @property
    def kernel_release(self) -> str:
        return os.uname().release

    @property
    def headers_dir(self) -> Path:
        return Path("/lib/modules") / self.kernel_release / "build"

    @property
    def kernel_compiler(self) -> str:
        try:
            version = Path("/proc/version").read_text(encoding="utf-8").lower()
        except OSError:
            version = ""
        return "clang" if "clang" in version else "gcc"

    @property
    def compiler_name(self) -> str:
        configured = self.config.get("compiler", "auto")
        if configured not in ("auto", "gcc", "clang"):
            raise ValueError("compiler must be auto, gcc, or clang")
        return self.kernel_compiler if configured == "auto" else configured

    def _require_root(self) -> None:
        if os.geteuid() != 0:
            raise PermissionError(
                "The backend is not running as root."
            )

    def _manual_module_paths(self) -> list[Path]:
        module = self.source_dir / self.MODULE_FILE
        return [module] if module.is_file() else []

    def _automatic_module_paths(self) -> list[Path]:
        module = self.automatic_module_path
        return [module] if module.is_file() else []

    def _module_paths(self) -> list[Path]:
        return [*self._automatic_module_paths(), *self._manual_module_paths()]

    def _configured_manual_module_path(self) -> Path | None:
        module = self.source_dir / self.MODULE_FILE
        return module if module.is_file() else None

    def _configured_automatic_module_path(self) -> Path | None:
        module = self.automatic_module_path
        return module if module.is_file() else None

    @staticmethod
    def _jupiter_repository() -> str:
        try:
            pacman_conf = Path("/etc/pacman.conf").read_text(encoding="utf-8")
        except OSError:
            raise ValueError(
                "Could not read /etc/pacman.conf to determine the Jupiter repository."
            )

        for raw_line in pacman_conf.splitlines():
            line = raw_line.strip().lower()
            match = re.fullmatch(r"\[(jupiter-[^\]]+)\]", line)
            if match:
                repo_name = match.group(1)
                return (
                    "https://steamdeck-packages.steamos.cloud/"
                    f"archlinux-mirror/{repo_name}/os/x86_64/"
                )

        raise ValueError(
            "Could not find a Jupiter repository entry in /etc/pacman.conf."
        )

    @property
    def build_user(self) -> str | None:
        try:
            uid = self.source_dir.stat().st_uid
            if uid == 0:
                user_home = getattr(decky, "DECKY_USER_HOME", None)
                if user_home:
                    uid = Path(user_home).stat().st_uid
            if uid == 0:
                return None
            return pwd.getpwuid(uid).pw_name
        except (KeyError, OSError):
            return None

    @staticmethod
    def _deck_user_identity() -> tuple[int, int] | None:
        configured_user = getattr(decky, "DECKY_USER", None)
        if isinstance(configured_user, str) and configured_user:
            try:
                user = pwd.getpwnam(configured_user)
                return user.pw_uid, user.pw_gid
            except KeyError:
                pass

        user_home = getattr(decky, "DECKY_USER_HOME", None)
        if user_home:
            try:
                owner = Path(user_home).stat()
                if owner.st_uid != 0:
                    return owner.st_uid, owner.st_gid
            except OSError:
                pass

        try:
            user = pwd.getpwnam("deck")
            return user.pw_uid, user.pw_gid
        except KeyError:
            return None

    def _container_runtime_command(self) -> list[str]:
        podman = shutil.which("podman")
        if not podman:
            raise RuntimeError("Podman is not installed or is not on PATH.")

        if os.geteuid() != 0:
            return [podman]

        build_user = self.build_user
        runuser = shutil.which("runuser")
        if not build_user or not runuser:
            raise RuntimeError(
                "no user for podman"
            )
        return [runuser, "--user", build_user, "--", podman]

    @staticmethod
    def _steamos_repository_suffix() -> str:
        try:
            pacman_conf = Path("/etc/pacman.conf").read_text(encoding="utf-8")
        except OSError as error:
            raise RuntimeError(
                "Could not read /etc/pacman.conf"
            ) from error

        match = re.search(
            r"^\s*\[jupiter-([A-Za-z0-9][A-Za-z0-9._-]*)\]\s*$",
            pacman_conf,
            re.MULTILINE,
        )
        if not match:
            raise RuntimeError(
                "Could not find a valid jupiter-* repository in pacman.conf"
            )
        return match.group(1)

    def umip_disabled(self) -> bool:
        try:
            with open("/proc/cpuinfo", "r", encoding="utf-8") as cpuinfo:
                return not any(
                    "umip" in line.lower() for line in cpuinfo if line.strip()
                )
        except OSError:
            pass
        return False

    async def _run(
        self,
        *command: str,
        cwd: Path | None = None,
        capture_log: bool = True,
        log_command: bool = True,
    ) -> tuple[int, str]:
        if log_command:
            decky.logger.info(
                "Running privileged command: %s", " ".join(command)
            )
            self._append_session_log(
                f"\n[{self._log_timestamp()}] COMMAND: {' '.join(command)}\n"
            )
        environment = os.environ.copy()
        environment.pop("LD_LIBRARY_PATH", None)
        environment.pop("LD_PRELOAD", None)
        environment["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/sbin"
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(cwd) if cwd else None,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=environment,
        )
        output_parts: list[str] = []
        stream_log = ""
        assert process.stdout is not None
        while True:
            chunk = await process.stdout.read(4096)
            if not chunk:
                break
            decoded = chunk.decode("utf-8", errors="replace")
            output_parts.append(decoded)
            if capture_log:
                stream_log = (stream_log + decoded)[-12000:]
                self._last_log = stream_log
            if log_command:
                self._append_session_log(decoded)
        await process.wait()
        output = "".join(output_parts).strip()
        if log_command:
            self._append_session_log(
                f"\n[{self._log_timestamp()}] EXIT: {process.returncode}\n"
            )
        return process.returncode, output

    async def _module_name(self, module_path: Path) -> str:
        try:
            module_stat = module_path.stat()
            signature = (
                module_stat.st_ino,
                module_stat.st_size,
                module_stat.st_mtime_ns,
            )
        except OSError:
            signature = None

        cached = self._module_name_cache.get(module_path)
        if signature is not None and cached and cached[0] == signature:
            return cached[1]

        modinfo = shutil.which("modinfo")
        if modinfo:
            code, output = await self._run(
                modinfo,
                "-F",
                "name",
                str(module_path),
                capture_log=False,
                log_command=False,
            )
            if code == 0 and output.strip():
                module_name = output.strip().splitlines()[-1]
                if signature is not None:
                    self._module_name_cache[module_path] = (
                        signature,
                        module_name,
                    )
                return module_name

        configured = self.config.get("module_name")
        module_name = str(configured) if configured else self.MODULE_NAME
        if signature is not None:
            self._module_name_cache[module_path] = (signature, module_name)
        return module_name

    async def _module_kernel_compatibility(
        self, module_path: Path
    ) -> tuple[bool | None, str]:
        try:
            module_stat = module_path.stat()
            signature = (
                module_stat.st_ino,
                module_stat.st_size,
                module_stat.st_mtime_ns,
            )
        except OSError as error:
            return None, f"Could not inspect the module: {error}"

        cached = self._module_compatibility_cache.get(module_path)
        if cached and cached[0] == signature:
            return cached[1], cached[2]

        modinfo = shutil.which("modinfo")
        if not modinfo:
            result = (None, "modinfo is unavailable, so compatibility cannot be checked.")
        else:
            code, output = await self._run(
                modinfo,
                "-F",
                "vermagic",
                str(module_path),
                capture_log=False,
                log_command=False,
            )
            vermagic = output.strip().splitlines()[-1] if output.strip() else ""
            built_for = vermagic.split()[0] if vermagic else ""
            if code != 0 or not built_for:
                result = (None, "The module's kernel version could not be read.")
            elif built_for == self.kernel_release:
                result = (True, f"Built for the running kernel {self.kernel_release}.")
            else:
                result = (
                    False,
                    f"Built for kernel {built_for}, but the running kernel is "
                    f"{self.kernel_release}.",
                )

        self._module_compatibility_cache[module_path] = (
            signature,
            result[0],
            result[1],
        )
        return result

    async def _module_update_notice(self) -> dict[str, Any]:
        try:
            module_paths = self._module_candidates()
        except (RuntimeError, ValueError) as error:
            return {"show": False, "message": str(error)}

        for module_path in module_paths:
            compatible, detail = await self._module_kernel_compatibility(module_path)
            if compatible is False:
                return {
                    "show": True,
                    "message": (
                        "The HV module does not match the current kernel. "
                        "Please download or rebuild the module before using an "
                        f"HV-enabled game. {detail}"
                    ),
                }
        return {"show": False, "message": ""}

    async def _running_kernel_release(self) -> str | None:
        uname = shutil.which("uname") or "/usr/bin/uname"
        code, output = await self._run(
            uname, "-r", capture_log=False
        )
        if code != 0:
            decky.logger.error("uname -r failed: %s", output)
            return None

        release = output.strip().splitlines()[-1] if output.strip() else ""
        if not release or not re.fullmatch(r"[a-zA-Z0-9._+:-]+", release):
            decky.logger.error("uname -r returned an invalid kernel release: %r", release)
            return None
        return release

    async def _kernel_package(self, kernel_release: str) -> str | None:
        pacman = shutil.which("pacman")
        if not pacman:
            return None
        candidates = [
            Path("/usr/lib/modules") / kernel_release / "vmlinuz",
            Path("/usr/lib/modules") / kernel_release,
        ]
        for candidate in candidates:
            code, output = await self._run(
                pacman, "-Qqo", str(candidate), capture_log=False
            )
            if code == 0 and output.strip():
                package = output.strip().splitlines()[0]
                if re.fullmatch(r"[a-zA-Z0-9@._+:-]+", package):
                    return package
        return None

    @staticmethod
    def _headers_filename(
        repository_index: str,
        kernel_package: str,
        kernel_release: str,
    ) -> str | None:
        release_suffix = kernel_package.removeprefix("linux-")
        release_match = re.fullmatch(
            rf"(?P<version>.+)-(?P<pkgrel>\d+(?:\.\d+)?)-"
            rf"{re.escape(release_suffix)}(?:-g[0-9a-fA-F]+)?",
            kernel_release,
        )
        if not release_match:
            return None

        package_version = release_match.group("version").replace(
            "-valve", ".valve", 1
        )
        package_release = release_match.group("pkgrel")
        expected_filename = (
            f"{kernel_package}-headers-{package_version}-"
            f"{package_release}-x86_64.pkg.tar.zst"
        )
        filenames = {
            urllib.parse.unquote(match)
            for match in re.findall(
                r"""href=["']([^"'?#]+)["']""",
                repository_index,
                flags=re.IGNORECASE,
            )
        }
        if expected_filename in filenames:
            return expected_filename

        xz_filename = expected_filename.removesuffix(".zst") + ".xz"
        return xz_filename if xz_filename in filenames else None

    async def _headers_package_url(self) -> str | None:
        kernel_release = await self._running_kernel_release()
        if not kernel_release:
            return None

        kernel_package = await self._kernel_package(kernel_release)
        if not kernel_package:
            return None

        curl = shutil.which("curl")
        if not curl:
            decky.logger.error("curl is required to read the SteamOS package repo")
            return None

        repository = self._jupiter_repository()

        code, repository_index = await self._run(
            curl,
            "-fsSL",
            "--max-time",
            "20",
            repository,
            capture_log=False,
        )

        filename = self._headers_filename(
            repository_index,
            kernel_package,
            kernel_release,
        )
        if not filename:
            return None
        return urllib.parse.urljoin(repository, filename)

    @staticmethod
    def _is_steamos() -> bool:
        try:
            values = Path("/etc/os-release").read_text(
                encoding="utf-8"
            ).lower()
        except OSError:
            return False
        return "steamos" in values
