"""Manual CloudRedirect reinstall policy.

Auto-ensure remains cheap/idempotent. The manual ensure endpoint is a true
replacement operation: remove any existing companion Flatpak regardless of its
origin, remove stale user-level/native CloudRedirect launchers and old redirect
hook binaries while preserving provider configuration/tokens, then install the
standard companion Flatpak plus the fresh cloudredirect-moon hook.
"""
from __future__ import annotations

import os
import shutil
import subprocess
from typing import Any

from .logger import logger


def _remove_path(path: str, log: list[str]) -> None:
    try:
        if os.path.islink(path) or os.path.isfile(path):
            os.remove(path)
            log.append(f"removed legacy CloudRedirect artifact: {path}")
        elif os.path.isdir(path):
            shutil.rmtree(path)
            log.append(f"removed legacy CloudRedirect directory: {path}")
    except FileNotFoundError:
        pass
    except Exception as exc:
        log.append(f"could not remove {path}: {exc}")


def _remove_legacy_native(cloudredirect: Any, log: list[str]) -> None:
    """Remove old user-level/native CloudRedirect executables and hook binaries.

    Provider auth/config is intentionally NOT touched. In particular we leave
    ~/.config/CloudRedirect and Flatpak's ~/.var/app/.../config directories
    alone so Google Drive/OneDrive tokens survive a reinstall.
    """
    home = cloudredirect.slssteam._home()

    # The injected redirect hook is the part that must never survive from an old
    # implementation. cloudredirect.install_app() writes a fresh moon build here.
    for d in cloudredirect._cr_dirs():
        _remove_path(os.path.join(d, "cloud_redirect.so"), log)

    # Known user-level/native companion locations from older/manual installs.
    # Do not remove the parent data directories; they may contain saves/config.
    for p in (
        os.path.join(home, ".local", "bin", "CloudRedirect"),
        os.path.join(home, ".local", "bin", "cloudredirect"),
        os.path.join(home, "Applications", "CloudRedirect.AppImage"),
        os.path.join(home, "Applications", "cloudredirect.AppImage"),
        os.path.join(home, ".local", "share", "CloudRedirect", "CloudRedirect"),
        os.path.join(home, ".local", "share", "CloudRedirect", "cloudredirect"),
        os.path.join(home, ".local", "share", "CloudRedirect", "CloudRedirect.AppImage"),
    ):
        _remove_path(p, log)

    # Remove native user desktop launchers only when their contents clearly point
    # at CloudRedirect. Flatpak exports are removed by `flatpak uninstall`; this
    # catches manual/native launchers with arbitrary filenames.
    appdir = os.path.join(home, ".local", "share", "applications")
    try:
        for name in os.listdir(appdir):
            if not name.endswith(".desktop"):
                continue
            path = os.path.join(appdir, name)
            try:
                text = open(path, "r", encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            low = text.lower()
            if "cloudredirect" in low or "cloud redirect" in low:
                _remove_path(path, log)
    except Exception:
        pass


def patch(cloudredirect: Any) -> None:
    if getattr(cloudredirect, "_slsdeck_force_reinstall_patched", False):
        return

    def reinstall() -> dict:
        log: list[str] = []

        # Always ask Flatpak to uninstall the canonical app ID. This removes it
        # regardless of which repo originally supplied it (Selectively11, a local
        # repo, etc.). A "not installed" return code is harmless if it is absent
        # afterwards.
        try:
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
            log.append(f"CloudRedirect Flatpak uninstall rc={r.returncode}\n{tail[-600:]}")
            if cloudredirect._installed():
                return {"success": False, "installed": True,
                        "log": "\n".join(log) + "\nExisting Flatpak could not be removed."}
        except Exception as exc:
            # If flatpak itself is unavailable but there is no Flatpak app, keep
            # going so a stale native install can still be replaced/cleaned.
            if cloudredirect._installed():
                return {"success": False, "installed": True,
                        "log": f"CloudRedirect Flatpak uninstall failed: {exc}"}
            log.append(f"Flatpak uninstall skipped/failed while app absent: {exc}")

        _remove_legacy_native(cloudredirect, log)

        # install_app() installs the normal companion Flatpak and then downloads
        # cloud_redirect.so specifically from swwayps/cloudredirect-moon.
        r = cloudredirect.install_app()
        r = dict(r)
        r["log"] = ("\n".join(log) + "\n" + str(r.get("log") or ""))[-3200:]
        r["replacedLegacy"] = True
        return r

    cloudredirect.ensure_installed = reinstall
    cloudredirect._slsdeck_force_reinstall_patched = True
    logger.log("SLSDeck: CloudRedirect manual reinstall now replaces Flatpak/native legacy installs")
