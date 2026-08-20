"""CreamySteamyLinux per-game proxy — compile a version-matched libsteam_api.so
proxy for a NATIVE-LINUX game so its DLC report as owned.

Unlike the bundled CreamAPI .so (a fixed prebuilt that forwards a fixed export
set), this reads the game's *own* libsteam_api.so exports and compiles a proxy
that forwards exactly those symbols, overriding just the 9 DLC functions. That
makes it robust across Steam API versions.

SteamOS ships no C compiler, so we use a self-contained `zig cc` (downloaded
once on first use, cached under ~/.local/share/SLSDeck/toolchain). The MIT proxy
source is vendored in defaults/creamysteamy/proxy.c.

Layout after deploy (matches the upstream tool so proxy.c finds its backup):
    libsteam_api.so            <- our compiled proxy
    steam_api_o.so             <- the original (proxy dlopens this)
    cream_api.ini              <- [dlc] list the proxy reports as owned
    libsteam_api.so.slsdeck-orig <- stash so Un-fix restores cleanly

EXPERIMENTAL: compiled on-device; needs validation on a real Deck (glibc/Steam
Linux Runtime compatibility). Fails safe — on any error nothing is changed.
"""
from __future__ import annotations

import os
import shutil
import struct
import subprocess
import tarfile
import tempfile
from typing import Any, Dict, List

from .logger import logger
from .paths import get_user_home, plugin_path
from .httpc import ensure_http_client
from .utils import chown_to_user
from . import fixes as _fixes

_UA = "SLSDeck/creamysteamy"

# Pinned self-contained Zig (bundles clang + lld + libc headers). Targeting an
# older glibc keeps the proxy loadable inside the Steam Linux Runtime container.
_ZIG_VER = "0.13.0"
_ZIG_TARBALL = f"zig-linux-x86_64-{_ZIG_VER}.tar.xz"
_ZIG_URL = f"https://ziglang.org/download/{_ZIG_VER}/{_ZIG_TARBALL}"
_GLIBC_TARGET = "x86_64-linux-gnu.2.31"

_LIB = "libsteam_api.so"
_BACKUP = "steam_api_o.so"            # proxy.c REAL_LIB_NAME for Linux
_CONFIG = "cream_api.ini"

# The 9 DLC functions proxy.c implements itself — never forward these.
_OVERRIDES = {
    "SteamAPI_ISteamApps_BIsDlcInstalled",
    "SteamAPI_ISteamApps_BIsSubscribedApp",
    "SteamAPI_ISteamApps_BIsSubscribed",
    "SteamAPI_ISteamApps_GetDLCCount",
    "SteamAPI_ISteamApps_BGetDLCDataByIndex",
    "SteamAPI_ISteamApps_BIsAppInstalled",
    "SteamAPI_ISteamUser_UserHasLicenseForApp",
    "SteamAPI_ISteamApps_GetEarliestPurchaseUnixTime",
    "SteamInternal_FindOrCreateUserInterface",
}


# ── toolchain (zig) ──────────────────────────────────────────────────────────
def _toolchain_dir() -> str:
    d = os.path.join(get_user_home(), ".local", "share", "SLSDeck", "toolchain")
    os.makedirs(d, exist_ok=True)
    return d


def zig_path() -> str:
    p = os.path.join(_toolchain_dir(), f"zig-linux-x86_64-{_ZIG_VER}", "zig")
    return p if os.path.isfile(p) else ""


def have_toolchain() -> bool:
    z = zig_path()
    if not z:
        return False
    try:
        r = subprocess.run([z, "version"], capture_output=True, text=True, timeout=20)
        return r.returncode == 0
    except Exception:
        return False


def ensure_toolchain() -> Dict[str, Any]:
    """Download + extract the self-contained zig compiler (once). ~45MB."""
    if have_toolchain():
        return {"success": True, "zig": zig_path(), "cached": True}
    dest_dir = _toolchain_dir()
    tar_path = os.path.join(dest_dir, _ZIG_TARBALL)
    try:
        client = ensure_http_client("creamysteamy: zig download")
        with client.stream("GET", _ZIG_URL, headers={"User-Agent": _UA},
                           follow_redirects=True, timeout=None) as resp:
            resp.raise_for_status()
            with open(tar_path, "wb") as fh:
                for chunk in resp.iter_bytes(chunk_size=1048576):
                    fh.write(chunk)
    except Exception as exc:
        return {"success": False, "error": f"zig download failed: {exc}"}
    try:
        with tarfile.open(tar_path, "r:xz") as tf:
            tf.extractall(dest_dir)
    except Exception as exc:
        return {"success": False, "error": f"zig extract failed: {exc}"}
    finally:
        try:
            os.remove(tar_path)
        except Exception:
            pass
    z = zig_path()
    if not z:
        return {"success": False, "error": "zig binary missing after extract"}
    try:
        os.chmod(z, 0o755)
        chown_to_user(os.path.dirname(z), recursive=True)
    except Exception:
        pass
    if not have_toolchain():
        return {"success": False, "error": "zig did not run after install"}
    return {"success": True, "zig": z, "cached": False}


# ── pure-Python ELF export parsing (no binutils/nm) ──────────────────────────
def _elf_exports(path: str) -> List[str]:
    """Exported global FUNC symbols from an ELF64 .so's .dynsym (like `nm -D`)."""
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except Exception:
        return []
    if data[:4] != b"\x7fELF" or len(data) < 64 or data[4] != 2:  # ELF64 only
        return []
    little = data[5] == 1
    en = "<" if little else ">"
    e_shoff = struct.unpack_from(en + "Q", data, 0x28)[0]
    e_shentsize = struct.unpack_from(en + "H", data, 0x3A)[0]
    e_shnum = struct.unpack_from(en + "H", data, 0x3C)[0]
    dynsym = dynstr_idx = None
    sections = []
    for i in range(e_shnum):
        base = e_shoff + i * e_shentsize
        if base + 64 > len(data):
            break
        sh_type = struct.unpack_from(en + "I", data, base + 4)[0]
        sh_offset = struct.unpack_from(en + "Q", data, base + 0x18)[0]
        sh_size = struct.unpack_from(en + "Q", data, base + 0x20)[0]
        sh_link = struct.unpack_from(en + "I", data, base + 0x28)[0]
        sh_entsize = struct.unpack_from(en + "Q", data, base + 0x38)[0]
        sections.append((sh_type, sh_offset, sh_size, sh_link, sh_entsize))
        if sh_type == 11:  # SHT_DYNSYM
            dynsym = (sh_offset, sh_size, sh_link, sh_entsize)
    if not dynsym:
        return []
    off, size, link, entsize = dynsym
    if link >= len(sections):
        return []
    str_off = sections[link][1]
    str_size = sections[link][2]
    strtab = data[str_off:str_off + str_size]
    entsize = entsize or 24
    names: List[str] = []
    for so in range(off, off + size, entsize):
        if so + 24 > len(data):
            break
        st_name = struct.unpack_from(en + "I", data, so)[0]
        st_info = data[so + 4]
        st_shndx = struct.unpack_from(en + "H", data, so + 6)[0]
        bind = st_info >> 4
        typ = st_info & 0xF
        if typ != 2:            # STT_FUNC
            continue
        if st_shndx == 0:       # SHN_UNDEF (imported, not exported)
            continue
        if bind not in (1, 2):  # GLOBAL or WEAK
            continue
        end = strtab.find(b"\x00", st_name)
        nm = strtab[st_name:end].decode("utf-8", "ignore")
        if not nm or nm.startswith("__") or nm in ("_init", "_fini"):
            continue
        names.append(nm)
    return sorted(set(names))


def _gen_header(forward: List[str]) -> str:
    """Port of deploy.py generate_include (x86_64 naked-asm trampolines)."""
    out = ["/* auto-generated forwarding stubs (SLSDeck) */", ""]
    for i, fn in enumerate(forward):
        out.append(f"#define _FWD_IDX_{fn} {i}")
    out.append(f"#define _FWD_IDX_COUNT {len(forward)}")
    out.append("")
    out.append("static const char *_fwd_name[_FWD_IDX_COUNT] = {")
    for fn in forward:
        out.append(f'"{fn}",')
    out.append("};")
    out.append("")
    out.append(f"__attribute__((used)) static void *_fwd_ptr[{len(forward)}];")
    out.append("")
    for i, fn in enumerate(forward):
        out.append(f"/* {fn} */")
        out.append(f"LIB_EXPORT __attribute__((naked)) void {fn}(void) {{")
        out.append("    __asm__ volatile (")
        out.append(f'        "movq _fwd_ptr+{i*8}(%%rip), %%r11\\n"')
        out.append('        "jmp *%%r11\\n"')
        out.append("        :::")
        out.append("    );")
        out.append("}")
        out.append("")
    return "\n".join(out) + "\n"


# ── detection ────────────────────────────────────────────────────────────────
def _is_our_proxy(path: str) -> bool:
    try:
        with open(path, "rb") as fh:
            return b"CreamySteamy" in fh.read()
    except Exception:
        return False


def _find_native_lib(install_path: str) -> str:
    """First libsteam_api.so in the game tree (that isn't our proxy already)."""
    for root, _dirs, files in os.walk(install_path):
        if _LIB in files:
            return os.path.join(root, _LIB)
    return ""


def status(install_path: str) -> Dict[str, Any]:
    if not install_path or not os.path.isdir(install_path):
        return {"success": True, "supported": False, "installed": False}
    full = _find_native_lib(install_path)
    supported = bool(full)
    installed = bool(full and _is_our_proxy(full)
                     and os.path.isfile(os.path.join(os.path.dirname(full), _BACKUP)))
    return {"success": True, "supported": supported, "installed": installed,
            "haveToolchain": have_toolchain()}


# ── deploy (compile a proxy) ─────────────────────────────────────────────────
def deploy(appid: int, install_path: str, game_name: str = "") -> Dict[str, Any]:
    if not install_path or not os.path.isdir(install_path):
        return {"success": False, "error": "game is not installed on disk"}
    full = _find_native_lib(install_path)
    if not full:
        return {"success": False, "notSupported": True,
                "error": "no native libsteam_api.so in this game (Windows/Proton game?)"}
    ez = ensure_toolchain()
    if not ez.get("success"):
        return {"success": False, "error": ez.get("error", "compiler unavailable")}
    zig = ez["zig"]

    d = os.path.dirname(full)
    backup = os.path.join(d, _BACKUP)
    rel_lib = os.path.relpath(full, install_path).replace("\\", "/")
    rel_backup = os.path.relpath(backup, install_path).replace("\\", "/")
    rel_cfg = os.path.relpath(os.path.join(d, _CONFIG), install_path).replace("\\", "/")

    # Preserve the original. If we're re-deploying over our own proxy, the real
    # library is already at steam_api_o.so — don't clobber it.
    replaced: List[str] = []
    if _is_our_proxy(full):
        if not os.path.isfile(backup):
            return {"success": False, "error": "proxy present but original backup missing — verify game files"}
    else:
        try:
            shutil.copy2(full, backup)          # original -> steam_api_o.so
        except Exception as exc:
            return {"success": False, "error": f"backup failed: {exc}"}
        try:
            _fixes._stash_original(install_path, rel_lib)   # .slsdeck-orig for Un-fix
            replaced.append(rel_lib)
        except Exception:
            pass

    exports = _elf_exports(backup)
    if not exports:
        return {"success": False, "error": "could not read exports from libsteam_api.so"}
    forward = [s for s in exports if s not in _OVERRIDES]

    tmp = tempfile.mkdtemp(prefix=f"creamy_{appid}_")
    try:
        gen_h = os.path.join(tmp, "generate.h")
        with open(gen_h, "w", encoding="utf-8") as fh:
            fh.write(_gen_header(forward))
        proxy_c = plugin_path("defaults", "creamysteamy", "proxy.c")
        cmd = [zig, "cc", "-shared", "-fPIC", "-O2", "-Wno-unused-parameter",
               "-target", _GLIBC_TARGET,
               "-o", full, proxy_c,
               f'-DAUTOMATICALLY_GENERATED_STUFF="{gen_h}"', "-ldl"]
        env = dict(os.environ)
        env["ZIG_GLOBAL_CACHE_DIR"] = os.path.join(tmp, "zig-cache")
        env["ZIG_LOCAL_CACHE_DIR"] = os.path.join(tmp, "zig-cache")
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300, env=env)
        if r.returncode != 0 or not _is_our_proxy(full):
            # compile failed — restore the original so the game still runs
            try:
                shutil.copy2(backup, full)
            except Exception:
                pass
            return {"success": False,
                    "error": f"proxy compile failed: {(r.stderr or r.stdout or '')[-400:]}"}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    # DLC list the proxy will report as owned.
    dlc_ids: List[str] = []
    try:
        from .dlcunlockers import _resolve_dlc_ids
        dlc_ids = _resolve_dlc_ids(int(appid or 0))
    except Exception:
        dlc_ids = []
    cfg_lines = ["[config]", "# issubscribedapp_on_false_use_real = true", "", "[dlc]"]
    for did in dlc_ids:
        cfg_lines.append(f"{did} = DLC_{did}")
    try:
        with open(os.path.join(d, _CONFIG), "w", encoding="utf-8") as fh:
            fh.write("\n".join(cfg_lines) + "\n")
    except Exception as exc:
        return {"success": False, "error": f"config write failed: {exc}"}

    # Record via the fix-log so Un-fix / tap restores it. The backup + config are
    # 'extracted' (deleted on un-fix); the proxied lib is 'replaced' (restored
    # from its .slsdeck-orig stash).
    try:
        _fixes._write_fix_log(install_path, int(appid), game_name,
                              "Custom fix (CreamySteamy)", "creamysteamy",
                              [rel_backup, rel_cfg], replaced)
    except Exception as exc:
        logger.warn(f"creamysteamy: fix-log write failed: {exc}")

    try:
        for rel in (rel_lib, rel_backup, rel_cfg):
            chown_to_user(os.path.join(install_path, rel.replace("/", os.sep)), recursive=False)
        chown_to_user(_fixes._fix_log_path(install_path, int(appid)), recursive=False)
    except Exception:
        pass

    return {"success": True, "installed": len(forward), "dlcCount": len(dlc_ids),
            "note": ("Compiled a version-matched proxy for this game. "
                     + (f"{len(dlc_ids)} DLC marked owned. " if dlc_ids
                        else "No DLC list resolved — set one in cream_api.ini if needed. ")
                     + "Launch the game (no launch options needed).")}
