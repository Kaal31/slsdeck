"""Manual CloudRedirect reinstall policy.

Auto-ensure remains cheap/idempotent. The manual ensure endpoint is treated as a
true reinstall: uninstall the existing user Flatpak (without --delete-data, so
provider tokens/config survive), then install the current app + moon hook again.
"""
from __future__ import annotations

import subprocess
from typing import Any

from .logger import logger


def patch(cloudredirect: Any) -> None:
    if getattr(cloudredirect, "_slsdeck_force_reinstall_patched", False):
        return

    def reinstall() -> dict:
        log = []
        try:
            if cloudredirect._installed():
                cmd = cloudredirect._wrap_cr([
                    "flatpak", "uninstall", "--user", "-y", "--noninteractive",
                    cloudredirect.CR_APP_ID,
                ])
                r = subprocess.run(
                    cmd, env=cloudredirect.slssteam._rich_env(), capture_output=True,
                    timeout=900,
                )
                tail = ((r.stdout or b"").decode("utf-8", "replace") +
                        (r.stderr or b"").decode("utf-8", "replace")).strip()
                log.append(f"CloudRedirect uninstall rc={r.returncode}\n{tail[-600:]}")
                if r.returncode != 0 and cloudredirect._installed():
                    return {"success": False, "installed": True,
                            "log": "\n".join(log) + "\nExisting Flatpak could not be removed."}
        except Exception as exc:
            return {"success": False, "installed": cloudredirect._installed(),
                    "log": f"CloudRedirect uninstall failed: {exc}"}

        r = cloudredirect.install_app()
        if log:
            r = dict(r)
            r["log"] = ("\n".join(log) + "\n" + str(r.get("log") or ""))[-2400:]
        return r

    cloudredirect.ensure_installed = reinstall
    cloudredirect._slsdeck_force_reinstall_patched = True
    logger.log("SLSDeck: CloudRedirect manual reinstall now replaces existing Flatpak")
