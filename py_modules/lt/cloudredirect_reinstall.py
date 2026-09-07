"""CloudRedirect install/reinstall policy for the moon runtime.

The authoritative runtime used by slsteam-moon is swwayps/cloudredirect-moon's
32-bit ``cloud_redirect.so`` loaded through LD_PRELOAD. Provider setup is done
through SLSDeck's native controls; the legacy Flatpak is never required.
"""
from __future__ import annotations

import os
import json
import shutil
from typing import Any

from .logger import logger


_CR_PRELOAD = '$HOME/.local/share/CloudRedirect/cloud_redirect.so'
_PRELOAD_MIGRATION = ".slsdeck-cloudredirect-preload-v1"


def _patch_steam_wrappers(cloudredirect: Any) -> None:
    """Teach SLSDeck's generated launchers to load cloudredirect-moon.

    Keep this integration outside the credential-bearing slssteam module. The
    Desktop launcher template is patched before it is rendered; the PATH
    launcher is patched atomically after SLSsteam regenerates it.
    """
    slssteam = cloudredirect.slssteam
    source_line = 'source "{client}" "$@"'
    preload_block = (
        '# Load cloudredirect-moon as a regular preload library.\n'
        f'_cr="{_CR_PRELOAD}"\n'
        '[ -f "$_cr" ] && export LD_PRELOAD="$_cr${{LD_PRELOAD:+:$LD_PRELOAD}}"\n'
    )
    if preload_block not in slssteam._WRAPPER_TEMPLATE:
        slssteam._WRAPPER_TEMPLATE = slssteam._WRAPPER_TEMPLATE.replace(
            source_line, preload_block + source_line
        )

    original = slssteam._ensure_path_wrapper
    if getattr(original, "_slsdeck_cloudredirect_preload", False):
        return

    def ensure_path_wrapper_with_cloudredirect() -> str:
        path = original()
        try:
            with open(path, "r", encoding="utf-8") as fh:
                content = fh.read()
            plain = '  LD_AUDIT="$AUD" exec "$REAL" "$@"'
            injected = (
                f'  CR="{_CR_PRELOAD}"\n'
                '  if [ -f "$CR" ]; then\n'
                '    LD_AUDIT="$AUD" LD_PRELOAD="$CR${LD_PRELOAD:+:$LD_PRELOAD}" exec "$REAL" "$@"\n'
                '  fi\n'
                + plain
            )
            if injected not in content and plain in content:
                content = content.replace(plain, injected, 1)
                staged = path + ".cloudredirect-new"
                with open(staged, "w", encoding="utf-8") as fh:
                    fh.write(content)
                    fh.flush()
                    os.fsync(fh.fileno())
                os.chmod(staged, 0o755)
                try:
                    slssteam._chown_file_to_user(staged)
                except Exception:
                    pass
                os.replace(staged, path)
        except Exception as exc:
            logger.warn(f"CloudRedirect: could not add LD_PRELOAD to Steam PATH wrapper: {exc}")
        return path

    ensure_path_wrapper_with_cloudredirect._slsdeck_cloudredirect_preload = True
    slssteam._ensure_path_wrapper = ensure_path_wrapper_with_cloudredirect


def _migrate_legacy_wrappers(cloudredirect: Any) -> None:
    """Upgrade only an installed pre-LD_PRELOAD CloudRedirect setup once."""
    if not _hook_present(cloudredirect):
        return
    marker = os.path.join(cloudredirect._native_config_dir(), _PRELOAD_MIGRATION)
    if os.path.isfile(marker):
        return

    slssteam = cloudredirect.slssteam
    legacy_desktop = False
    for path in slssteam._steam_sh_candidates():
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                content = fh.read()
            if slssteam._WRAPPER_MARK in content and "cloud_redirect.so" not in content:
                legacy_desktop = True
                break
        except OSError:
            continue

    path_wrapper = slssteam._path_wrapper()
    legacy_path = False
    try:
        with open(path_wrapper, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
        legacy_path = ("LD_AUDIT" in content and
                       "SLSsteam" in content and
                       "cloud_redirect.so" not in content)
    except OSError:
        pass

    # No legacy managed wrapper means this is either a fresh install or a
    # custom/unmanaged launcher. The already-patched generators handle the
    # former; this migration deliberately leaves the latter alone.
    if not legacy_desktop and not legacy_path:
        return

    success = True
    details: list[str] = []
    if legacy_path:
        try:
            slssteam._ensure_path_wrapper()
            with open(path_wrapper, "r", encoding="utf-8", errors="ignore") as fh:
                success = "cloud_redirect.so" in fh.read() and success
            details.append("Gaming Mode")
        except Exception as exc:
            success = False
            logger.warn(f"CloudRedirect preload migration (Gaming Mode) failed: {exc}")
    if legacy_desktop:
        try:
            result = slssteam._activate_steam_sh_wrapper()
            success = bool(result.get("success")) and success
            details.append("Desktop Mode")
        except Exception as exc:
            success = False
            logger.warn(f"CloudRedirect preload migration (Desktop Mode) failed: {exc}")

    if not success:
        return
    try:
        os.makedirs(os.path.dirname(marker), exist_ok=True)
        staged = marker + ".new"
        with open(staged, "w", encoding="utf-8") as fh:
            fh.write("cloudredirect LD_PRELOAD wrapper migration complete\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(staged, marker)
        cloudredirect.chown_to_user(marker, recursive=False)
        logger.log("CloudRedirect: migrated legacy wrappers: " + ", ".join(details))
    except Exception as exc:
        # Wrappers are already repaired. A missing marker merely permits a safe
        # structural recheck next boot; it does not undo the successful repair.
        logger.warn(f"CloudRedirect preload migration marker failed: {exc}")


def _sync_registered_games(cloudredirect: Any) -> dict:
    """Mirror the legacy fallback without inventing fake save directories."""
    appids = [int(x) for x in cloudredirect.slssteam.read_additional_apps() if int(x) > 0]
    mirrored = 0
    try:
        content = cloudredirect.slssteam._read() or ""
        legacy = cloudredirect.slssteam._read_additional_from(content)
        for appid in appids:
            if appid not in legacy:
                result = cloudredirect._slssteam_add_app(appid)
                if not result.get("success"):
                    return {"success": False, "error": result.get("error") or
                            f"could not mirror AppID {appid} into AdditionalApps"}
                mirrored += 1
                legacy.add(appid)
    except Exception as exc:
        return {"success": False, "error": f"could not synchronize AdditionalApps: {exc}"}

    config_root = cloudredirect._native_config_dir()
    seed_index = os.path.join(config_root, ".slsdeck_seeded_apps.json")
    try:
        with open(seed_index, "r", encoding="utf-8") as fh:
            seeded_ids = {int(x) for x in json.load(fh) if int(x) > 0}
    except Exception:
        seeded_ids = set()
    if seeded_ids:
        storage_root = os.path.join(config_root, "storage")
        try:
            for account in os.listdir(storage_root):
                if not account.isdigit():
                    continue
                for appid in seeded_ids:
                    candidate = os.path.join(storage_root, account, str(appid))
                    try:
                        if os.path.isdir(candidate) and not os.listdir(candidate):
                            os.rmdir(candidate)
                    except OSError:
                        pass
        except OSError:
            pass
        try:
            os.remove(seed_index)
        except OSError:
            pass
    logger.log(f"CloudRedirect: synchronized {len(appids)} game(s), mirrored={mirrored}")
    return {"success": True, "games": len(appids), "mirrored": mirrored, "seeded": 0}


def _download_cr_lib(cloudredirect: Any) -> str:
    """Install the hook through a fresh inode, matching upstream's staged move."""
    try:
        url = cloudredirect._cr_lib_url()
        src = "moon" if url == cloudredirect.CR_LIB_URL_MOON else "selectively11"
        client = cloudredirect.ensure_http_client("cloudredirect: cloud_redirect.so")
        response = client.get(url, follow_redirects=True, timeout=120)
        if response.status_code != 200 or not response.content:
            return f"cloud_redirect.so ({src}): HTTP {response.status_code}"
        data = response.content
        if data[:4] != b"\x7fELF":
            return f"cloud_redirect.so ({src}): download was not an ELF (got an error page?)"
        if len(data) < 5 or data[4] != 1:
            elf_class = data[4] if len(data) > 4 else "?"
            return f"cloud_redirect.so ({src}): not a 32-bit ELF (EI_CLASS={elf_class}) — wrong build, skipping"
        wrote = 0
        for directory in cloudredirect._cr_dirs():
            staged = ""
            try:
                os.makedirs(directory, exist_ok=True)
                target = os.path.join(directory, "cloud_redirect.so")
                staged = os.path.join(directory, f".cloud_redirect.so.new.{os.getpid()}")
                with open(staged, "wb") as fh:
                    fh.write(data)
                    fh.flush()
                    os.fsync(fh.fileno())
                os.chmod(staged, 0o755)
                try:
                    cloudredirect.chown_to_user(staged, recursive=False)
                    cloudredirect.chown_to_user(directory, recursive=False)
                except Exception:
                    pass
                os.replace(staged, target)
                wrote += 1
            except Exception as exc:
                logger.warn(f"CloudRedirect: writing .so to {directory} failed: {exc}")
                try:
                    if staged and os.path.exists(staged):
                        os.remove(staged)
                except OSError:
                    pass
        return f"cloud_redirect.so: {len(data)} bytes -> {wrote} dir(s)"
    except Exception as exc:
        return f"cloud_redirect.so download failed: {exc}"


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
        return all(cloudredirect._valid_cr_lib(os.path.join(d, "cloud_redirect.so"))
                   for d in cloudredirect._cr_dirs())
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
    out["legacyFlatpakInstalled"] = bool(cloudredirect._installed())
    if not configured:
        note = "Moon runtime ready; choose a provider in SLSDeck Cloud saves."
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
    synced = cloudredirect.sync_registered_games()
    if synced.get("success"):
        lines.append("registered games synchronized: %s" % synced.get("games", 0))
    else:
        lines.append("registered-game sync failed: %s" % synced.get("error", "unknown error"))
    try:
        (cloudredirect.settings.reset_dep_fail if have_lib else cloudredirect.settings.inc_dep_fail)("cloudredirect")
    except Exception:
        pass
    logger.log("CloudRedirect moon hook install: %s" % ("ok" if have_lib else "incomplete"))
    return _decorate(cloudredirect, {
        "success": have_lib and bool(synced.get("success")),
        "installed": have_lib,
        "hasLib": have_lib,
        "nativeMoon": True,
        "log": "\n".join(lines)[-3200:],
    })


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

    _patch_steam_wrappers(cloudredirect)
    cloudredirect.sync_registered_games = lambda: _sync_registered_games(cloudredirect)
    cloudredirect._download_cr_lib = lambda: _download_cr_lib(cloudredirect)
    _migrate_legacy_wrappers(cloudredirect)

    def ensure_native() -> dict:
        cloudredirect.migrate_provider_data()
        if _hook_present(cloudredirect):
            try:
                cloudredirect.settings.reset_dep_fail("cloudredirect")
            except Exception:
                pass
            base = {
                "success": True, "installed": True, "hasLib": True,
                "nativeMoon": True, "log": "",
            }
            synced = cloudredirect.sync_registered_games()
            if not synced.get("success"):
                base["success"] = False
                base["log"] = "registered-game sync failed: %s" % synced.get("error", "unknown error")
        else:
            base = _install_moon_hook(cloudredirect)
        return _decorate(cloudredirect, base)

    def reinstall() -> dict:
        log: list[str] = []
        _remove_legacy_native(cloudredirect, log)
        result = _install_moon_hook(cloudredirect, log)
        result["replacedLegacy"] = True
        cloudredirect.migrate_provider_data()
        return _decorate(cloudredirect, result)

    cloudredirect.ensure_installed_auto = ensure_native
    cloudredirect.ensure_installed = reinstall
    original_add_app = cloudredirect.slssteam.add_app
    if not getattr(original_add_app, "_slsdeck_cloudredirect_sync", False):
        def add_app_and_sync(*args, **kwargs):
            result = original_add_app(*args, **kwargs)
            if result.get("success"):
                synced = cloudredirect.sync_registered_games()
                if not synced.get("success"):
                    logger.warn("CloudRedirect game-list sync after add failed: %s" %
                                synced.get("error", "unknown error"))
            return result
        add_app_and_sync._slsdeck_cloudredirect_sync = True
        cloudredirect.slssteam.add_app = add_app_and_sync
    cloudredirect._slsdeck_force_reinstall_patched = True
    logger.log("SLSDeck: CloudRedirect moon runtime and native provider setup enabled")
