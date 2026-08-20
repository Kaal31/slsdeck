import asyncio
import os
import shutil
import signal
from pathlib import Path


class Umip:
    @property
    def umipcompat_path(self) -> Path:
        packaged = self.plugin_dir / "dist" / "umipcompatd"
        if packaged.is_file():
            return packaged
        return self.plugin_dir / "umipcompat" / "umipcompatd"

    def _umipcompat_running(self) -> bool:
        return (
            self._umipcompat_process is not None
            and self._umipcompat_process.returncode is None
        )

    async def ensure_umip_active(self) -> tuple[bool, str]:
        """Bring UMIP compatibility up the automatic way, tracking failure.

        If UMIP is already disabled at the kernel level, the daemon isn't needed
        — report success so a module load doesn't look failed. Otherwise start
        umipcompatd and record whether it worked, so the UI can reveal the manual
        GRUB/reboot fallback only when the daemon can't cover UMIP."""
        try:
            if self.umip_disabled():
                self._umipcompat_failed = False
                return True, "UMIP is disabled at the kernel level; daemon not needed."
        except Exception:
            pass
        ok, message = await self._start_umipcompat()
        self._umipcompat_failed = not ok
        return ok, message

    async def _drain_umipcompat_output(
        self, process: asyncio.subprocess.Process
    ) -> None:
        if process.stdout is None:
            return
        while True:
            chunk = await process.stdout.read(4096)
            if not chunk:
                return
            decoded = chunk.decode("utf-8", errors="replace")
            self._umipcompat_log = (self._umipcompat_log + decoded)[-12000:]
            self._append_session_log(decoded)

    async def _start_umipcompat(self) -> tuple[bool, str]:
        if self._umipcompat_running():
            return True, "UMIP compatibility is already running."

        self._umipcompat_log = ""
        if self._umipcompat_process is not None:
            await self._umipcompat_process.wait()
            self._umipcompat_process = None

        binary = self.umipcompat_path
        if not binary.is_file():
            return False, f"The UMIP compatibility binary is missing: {binary}"
        if not os.access(binary, os.X_OK):
            return False, f"The UMIP compatibility binary is not executable: {binary}"

        sudo = shutil.which("sudo")
        if not sudo:
            return False, "sudo is required to start UMIP compatibility."

        environment = os.environ.copy()
        environment.pop("LD_LIBRARY_PATH", None)
        environment.pop("LD_PRELOAD", None)
        environment["PATH"] = "/usr/local/sbin:/usr/local/bin:/usr/bin:/usr/sbin"
        self._append_session_log(
            f"\n[{self._log_timestamp()}] STARTING: sudo ./{binary.name}\n"
        )
        try:
            process = await asyncio.create_subprocess_exec(
                sudo,
                f"./{binary.name}",
                cwd=str(binary.parent),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env=environment,
                start_new_session=True,
            )
        except OSError as error:
            return False, f"Could not start UMIP compatibility: {error}"

        self._umipcompat_process = process
        self._umipcompat_output_task = asyncio.create_task(
            self._drain_umipcompat_output(process)
        )
        await asyncio.sleep(0.1)
        if process.returncode is not None:
            if self._umipcompat_output_task is not None:
                await self._umipcompat_output_task
            self._umipcompat_process = None
            self._umipcompat_output_task = None
            return False, (
                "UMIP compatibility exited during startup."
                + (
                    f"\n{self._umipcompat_log.strip()}"
                    if self._umipcompat_log.strip()
                    else ""
                )
            )

        return True, "UMIP compatibility started."

    async def _stop_umipcompat(self) -> tuple[bool, str]:
        process = self._umipcompat_process
        if process is None:
            return True, "UMIP compatibility is already stopped."
        if process.returncode is not None:
            await process.wait()
            self._umipcompat_process = None
            self._umipcompat_output_task = None
            return True, "UMIP compatibility is already stopped."

        self._append_session_log(
            f"\n[{self._log_timestamp()}] STOPPING: umipcompatd (SIGINT)\n"
        )
        try:
            os.killpg(process.pid, signal.SIGINT)
        except ProcessLookupError:
            pass
        try:
            await asyncio.wait_for(process.wait(), timeout=5)
        except asyncio.TimeoutError:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                await asyncio.wait_for(process.wait(), timeout=2)
            except asyncio.TimeoutError:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                await process.wait()

        output_task = self._umipcompat_output_task
        if output_task is not None:
            await output_task
        self._umipcompat_process = None
        self._umipcompat_output_task = None
        return True, "UMIP compatibility stopped."
