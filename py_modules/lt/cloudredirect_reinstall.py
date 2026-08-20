"""CloudRedirect install/reinstall policy for the moon runtime.

The authoritative runtime used by slsteam-moon is swwayps/cloudredirect-moon's
32-bit ``cloud_redirect.so`` loaded through LD_PRELOAD.  The fork also carries
Flatpak packaging for its UI, but its build script labels that path local-test
only and the bundled flatpakrepo still points at Selectively11's hosted remote.

Therefore SLSDeck's dependency install is native-first:
  * auto ensure installs/repairs only the moon hook;
  * manual Reinstall removes any legacy companion Flatpak/native hook first,
    preserves provider config/tokens, then installs a fresh moon hook;
  * the optional provider UI remains available through the explicit Open action,
    which may install/run the companion Flatpak on demand.
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


def _hook_present(cloudredirect: Any) -> bool:
    try:
        return any(
            os.path.isfile(os.path.join(d, "cloud_redirect.so"))
            for d in cloudredirect._cr_dirs()
        )
    except Exception:
        return False


def _install_moon_hook(cloudredirect: Any, log: list[str] | None = None) -> dict:
    """Install only the cloudredirect-moon LD_PRELOAD hook."""
    lines = list(log or [])
    for d in cloudredirect._cr_dirs():
        try:
            os.makedirs(d, exist_ok=True)
            cloudredirect.chown_to_user(d, recursive=False)
        except Exception as exc:
            lines.append(f"mkdir {d}: {exc}")

    result = cloudredirect._download_cr_lib()
    lines.append(result)
    have_lib = _hook_present(cloudredirect)
    if have_lib:
        try:
            cloudredirect.settings.reset_dep_fail("cloudredirect")
        except Exception:
            pass
    else:
        try:
            cloudredirect.settings.inc_dep_fail("cloudredirect")
        except Exception:
            pass
    logger.log(
        "CloudRedirect moon hook install: %s"
        % ("ok" if have_lib else "incomplete")
    )
    return {
        "success": have_lib,
        "installed": have_lib,
        "hasLib": have_lib,
        "nativeMoon": True,
        "log": "\n".join(lines)[-3200:],
    }


def _remove_legacy_native(cloudredirect: Any, log: list[str]) -> None:
    """Remove old user-level/native CloudRedirect executables and hook binaries.

    Provider auth/config is intentionally NOT touched. In particular we leave
    ~/.config/CloudRedirect and Flatpak's ~/.var/app/.../config directories
    alone so Google Drive/OneDrive tokens survive a reinstall.
    """
    home = cloudredirect.slssteam._home()

    # The injected redirect hook is the part that must never survive from an old
    # implementation. A fresh moon build is written after cleanup.
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
    # at CloudRedirect. Flatpak exports are removed by `flatpak uninstall`.
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

    def ensure_native() -> dict:
        """Cheap auto-ensure: never installs a Flatpak."""
        if _hook_present(cloudredirect):
            try:
                cloudredirect.settings.reset_dep_fail("cloudredirect")
            except Exception:
                pass
            return {
                "success": True,
                "installed": True,
                "hasLib": True,
                "nativeMoon": True,
                "log": "",
            }
        return _install_moon_hook(cloudredirect)

    def reinstall() -> dict:
        log: list[str] = []

        # Remove a legacy companion Flatpak regardless of which remote supplied
        # the canonical app id. Provider data is preserved because --delete-data
        # is deliberately NOT used.
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
                return {
                    "success": False,
                    "installed": False,
                    "log": "\n".join(log) + "\nExisting Flatpak could not be removed.",
                }
        except Exception as exc:
            if cloudredirect._installed():
                return {
                    "success": False,
                    "installed": False,
                    "log": f"CloudRedirect Flatpak uninstall failed: {exc}",
                }
            log.append(f"Flatpak uninstall skipped/failed while app absent: {exc}")

        _remove_legacy_native(cloudredirect, log)
        r = _install_moon_hook(cloudredirect, log)
        r["replacedLegacy"] = True
        return r

    # Dependency setup must never pull the Selectively11-hosted Flatpak anymore.
    # The optional Open CloudRedirect UI path remains explicit/on-demand.
    cloudredirect.ensure_installed_auto = ensure_native
    cloudredirect.ensure_installed = reinstall
    cloudredirect._slsdeck_force_reinstall_patched = True
    logger.log(
        "SLSDeck: CloudRedirect dependency install now manages native cloudredirect-moon only"
    )
