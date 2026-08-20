"""CloudRedirect install/reinstall policy for the moon runtime.

The authoritative runtime used by slsteam-moon is swwayps/cloudredirect-moon's
32-bit ``cloud_redirect.so`` loaded through LD_PRELOAD. The provider UI is a
separate concern: preserve it when present, and only install it when provider
setup is actually needed.
"""
from __future__ import annotations

import os
import shutil
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
        return any(os.path.isfile(os.path.join(d, "cloud_redirect.so")) for d in cloudredirect._cr_dirs())
    except Exception:
        return False


def _provider_state(cloudredirect: Any) -> tuple[bool, list[str]]:
    try:
        state = cloudredirect.provider_status() or {}
        return bool(state.get("configured")), list(state.get("providers") or [])
    except Exception:
        return False, []


def _decorate(cloudredirect: Any, result: dict) -> dict:
    configured, providers = _provider_state(cloudredirect)
    out = dict(result)
    out["providerConfigured"] = configured
    out["providers"] = providers
    out["setupRequired"] = not configured
    out["uiInstalled"] = bool(cloudredirect._installed())
    if not configured:
        note = "Moon runtime ready; CloudRedirect login/provider setup is still required."
        out["note"] = note
        out["log"] = ((str(out.get("log") or "") + "\n" + note).strip())[-3200:]
    return out


def _install_moon_hook(cloudredirect: Any, log: list[str] | None = None) -> dict:
    lines = list(log or [])
    for d in cloudredirect._cr_dirs():
        try:
            os.makedirs(d, exist_ok=True)
            cloudredirect.chown_to_user(d, recursive=False)
        except Exception as exc:
            lines.append(f"mkdir {d}: {exc}")
    lines.append(cloudredirect._download_cr_lib())
    have_lib = _hook_present(cloudredirect)
    try:
        (cloudredirect.settings.reset_dep_fail if have_lib else cloudredirect.settings.inc_dep_fail)("cloudredirect")
    except Exception:
        pass
    logger.log("CloudRedirect moon hook install: %s" % ("ok" if have_lib else "incomplete"))
    return _decorate(cloudredirect, {
        "success": have_lib,
        "installed": have_lib,
        "hasLib": have_lib,
        "nativeMoon": True,
        "log": "\n".join(lines)[-3200:],
    })


def _ensure_ui_if_needed(cloudredirect: Any, result: dict) -> dict:
    """When provider setup is missing, make sure the companion login UI exists."""
    out = _decorate(cloudredirect, result)
    if not out.get("setupRequired") or out.get("uiInstalled"):
        return out
    ui = dict(cloudredirect.install_app())
    merged = dict(out)
    merged["uiInstalled"] = bool(cloudredirect._installed())
    merged["uiInstallAttempted"] = True
    if not merged["uiInstalled"]:
        merged["success"] = False
        merged["installed"] = bool(out.get("installed"))
    if ui.get("log"):
        merged["log"] = (str(out.get("log") or "") + "\n" + str(ui.get("log") or ""))[-3200:]
    return _decorate(cloudredirect, merged)


def _remove_legacy_native(cloudredirect: Any, log: list[str]) -> None:
    """Replace old native hook/binaries but preserve UI, config and provider tokens."""
    home = cloudredirect.slssteam._home()
    for d in cloudredirect._cr_dirs():
        _remove_path(os.path.join(d, "cloud_redirect.so"), log)
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


def patch(cloudredirect: Any) -> None:
    if getattr(cloudredirect, "_slsdeck_force_reinstall_patched", False):
        return

    def ensure_native() -> dict:
        if _hook_present(cloudredirect):
            try:
                cloudredirect.settings.reset_dep_fail("cloudredirect")
            except Exception:
                pass
            base = {
                "success": True, "installed": True, "hasLib": True,
                "nativeMoon": True, "log": "",
            }
        else:
            base = _install_moon_hook(cloudredirect)
        if not base.get("success"):
            return base
        return _ensure_ui_if_needed(cloudredirect, base)

    def reinstall() -> dict:
        log: list[str] = []
        _remove_legacy_native(cloudredirect, log)
        result = _install_moon_hook(cloudredirect, log)
        result["replacedLegacy"] = True
        if not result.get("success"):
            return result
        return _ensure_ui_if_needed(cloudredirect, result)

    def ensure_ui() -> dict:
        if cloudredirect._installed():
            return _decorate(cloudredirect, {
                "success": True, "installed": True, "uiInstalled": True,
                "nativeMoon": _hook_present(cloudredirect), "log": "",
            })
        result = dict(cloudredirect.install_app())
        result["uiInstalled"] = bool(cloudredirect._installed())
        return _decorate(cloudredirect, result)

    cloudredirect.ensure_installed_auto = ensure_native
    cloudredirect.ensure_installed = reinstall
    cloudredirect.ensure_ui = ensure_ui
    cloudredirect._slsdeck_force_reinstall_patched = True
    logger.log("SLSDeck: CloudRedirect moon runtime is primary; login UI is setup-only")
