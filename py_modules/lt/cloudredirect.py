"""CloudRedirect control surface.

CloudRedirect ("Steam Cloud" for lua/added games, redirecting saves to Google
Drive / OneDrive / a local folder) is installed by the h3adcr-b client fix when
the SLSsteam config has ``DisableCloud: no``. This module exposes two things the
plugin UI needs:

  * a toggle for that ``DisableCloud`` flag (on = cloud saves via CloudRedirect),
  * a launcher for the CloudRedirect flatpak app so the user can sign into a
    cloud provider (the one manual step).

Everything else (the flatpak app + cloud_redirect.so + the CR-patched Steam
client) is handled by the client fix; this is just visibility/control.
"""

from __future__ import annotations

import os
from .paths import defaults_path, runtime_path
import re
import subprocess

from .logger import logger
from .httpc import ensure_http_client
from .utils import chown_to_user
from . import slssteam, settings

CR_APP_ID = "org.cloudredirect.CloudRedirect"
CR_REPO = "https://raw.githubusercontent.com/Selectively11/CloudRedirect/refs/heads/gh-pages/cloudredirect.flatpakrepo"
FLATHUB_REPO = "https://dl.flathub.org/repo/flathub.flatpakrepo"
KDE_RUNTIME = "org.kde.Platform//6.10"
# The actual save-redirect library (we were only doing the flatpak app before —
# this .so is what makes redirection work).
#
# We ALWAYS install the patched moon hook, for BOTH build variants — this is the
# exact source luatools-moon/install.sh ships (CR_SO_URL). The old Selectively11
# ``linux-test`` release .so was the WRONG version for our moon engine and was
# why cloud redirect silently didn't work; the moon fork adds the cross-distro
# attach fixes, legacy save-layout healing, and worker-thread crash containment
# the moon steamclient needs. It's a committed 32-bit ELF on master (not LFS),
# loaded into Steam via LD_PRELOAD. The flatpak app below stays Selectively11
# (same app id — it's a fork, so the config/token layout is identical and the
# moon .so reads it fine); only the injected library changes here.
CR_LIB_URL_MOON = "https://raw.githubusercontent.com/swwayps/cloudredirect-moon/master/cloud_redirect.so"
# Back-compat alias (older call sites referenced CR_LIB_URL); both point at moon.
CR_LIB_URL = CR_LIB_URL_MOON


def _is_simple_variant() -> bool:
    """True on the v1 (slsdecksimple) package. That build ships without
    ``depotdl.py`` (excluded at package time), so its absence next to this module
    is our build-variant signal — no extra marker file needed."""
    return not os.path.isfile(os.path.join(os.path.dirname(__file__), "depotdl.py"))


def _cr_lib_url() -> str:
    """The CloudRedirect .so URL — the patched moon hook for every build variant
    (matches luatools-moon/install.sh, which always ships the moon .so)."""
    return CR_LIB_URL_MOON


def _cr_dirs() -> list:
    """CloudRedirect data dir(s) the .so must land in — native, plus the Flatpak
    Steam location when that's what's installed (mirrors headcrab)."""
    home = slssteam._home()
    dirs = [os.path.join(home, ".local", "share", "CloudRedirect")]
    try:
        if slssteam._is_flatpak_steam():
            dirs.append(os.path.join(home, ".var", "app", "com.valvesoftware.Steam",
                                     ".local", "share", "CloudRedirect"))
    except Exception:
        pass
    return dirs


def _uid() -> int:
    try:
        import pwd
        return pwd.getpwnam(slssteam._decky_user()).pw_uid
    except Exception:
        return 1000


def _wrap_cr(cmd: list) -> list:
    """Like slssteam._wrap_as_user, but also hands the user session's runtime dir
    + DBUS to flatpak — the piece headcrab has for free (it runs in the real
    session) and whose absence made our install flakier than headcrab's."""
    base = slssteam._wrap_as_user(cmd)
    if base is cmd:  # not root → already in the user session
        return cmd
    uid = _uid()
    extra = [f"XDG_RUNTIME_DIR=/run/user/{uid}",
             f"DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{uid}/bus"]
    try:
        i = base.index("env") + 1
        return base[:i] + extra + base[i:]
    except ValueError:
        return base


def provider_status() -> dict:
    """Has the user actually signed a cloud provider into CloudRedirect? Detected
    by tokens_<provider>.json files the app writes once sign-in completes (checked
    across the native and Flatpak config locations)."""
    home = slssteam._home()
    dirs = [
        os.path.join(home, ".config", "CloudRedirect"),
        os.path.join(home, ".var", "app", "org.cloudredirect.CloudRedirect", "config", "CloudRedirect"),
        os.path.join(home, ".var", "app", "org.cloudredirect.CloudRedirect", "config"),
        os.path.join(home, ".var", "app", "com.valvesoftware.Steam", ".config", "CloudRedirect"),
    ]
    providers = []
    for d in dirs:
        try:
            for fn in os.listdir(d):
                if fn.startswith("tokens_") and fn.endswith(".json"):
                    providers.append(fn[len("tokens_"):-len(".json")])
        except Exception:
            continue
    providers = sorted(set(providers))
    return {"success": True, "configured": bool(providers), "providers": providers}


def _download_cr_lib() -> str:
    """Download cloud_redirect.so into the CloudRedirect dir(s) (headcrab step)."""
    try:
        url = _cr_lib_url()
        src = "moon" if url == CR_LIB_URL_MOON else "selectively11"
        client = ensure_http_client("cloudredirect: cloud_redirect.so")
        r = client.get(url, follow_redirects=True, timeout=120)
        if r.status_code != 200 or not r.content:
            return f"cloud_redirect.so ({src}): HTTP {r.status_code}"
        data = r.content
        if data[:4] != b"\x7fELF":
            return f"cloud_redirect.so ({src}): download was not an ELF (got an error page?)"
        # Steam's client is 32-bit, so the hook MUST be a 32-bit ELF (EI_CLASS==1)
        # or the loader silently ignores the LD_PRELOAD — the exact "installed but
        # does nothing" failure. Refuse a 64-bit build rather than deploy a dud.
        if len(data) < 5 or data[4] != 1:
            return f"cloud_redirect.so ({src}): not a 32-bit ELF (EI_CLASS={data[4] if len(data) > 4 else '?'}) — wrong build, skipping"
        logger.log(f"CloudRedirect: fetching {src} cloud_redirect.so ({len(data)} bytes, 32-bit)")
        wrote = 0
        for d in _cr_dirs():
            try:
                os.makedirs(d, exist_ok=True)
                p = os.path.join(d, "cloud_redirect.so")
                with open(p, "wb") as fh:
                    fh.write(data)
                try:
                    chown_to_user(p, recursive=False)
                    chown_to_user(d, recursive=False)
                except Exception:
                    pass
                wrote += 1
            except Exception as exc:
                logger.warn(f"CloudRedirect: writing .so to {d} failed: {exc}")
        return f"cloud_redirect.so: {len(data)} bytes -> {wrote} dir(s)"
    except Exception as exc:
        return f"cloud_redirect.so download failed: {exc}"


def _config_path() -> str:
    return slssteam.config_path()


def _valid_cr_lib(path: str) -> bool:
    """A usable Moon hook is a nontrivial 32-bit ELF, not merely a leftover file."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(5)
        return head[:4] == b"\x7fELF" and len(head) == 5 and head[4] == 1 and os.path.getsize(path) > 4096
    except OSError:
        return False


def _install_healthy() -> bool:
    return _installed() and all(
        _valid_cr_lib(os.path.join(d, "cloud_redirect.so")) for d in _cr_dirs()
    )


def _clean_managed_leftovers() -> list:
    """Remove only SLSDeck/CloudRedirect hook payloads and partial artifacts.

    Provider tokens and app configuration are deliberately outside these data
    directories and are never touched, so reinstalling cannot sign the user out.
    """
    removed = []
    managed = (
        "cloud_redirect.so", "cloud_redirect.so.tmp", "cloud_redirect.so.part",
        "cloud_redirect.so.new", "cloud_redirect.so.old",
    )
    for directory in _cr_dirs():
        for name in managed:
            path = os.path.join(directory, name)
            try:
                if os.path.lexists(path):
                    os.remove(path)
                    removed.append(path)
            except OSError as exc:
                logger.warn(f"CloudRedirect: could not remove leftover {path}: {exc}")
    return removed


# ── install the CloudRedirect flatpak directly (same steps as headcrab's
#    crinstall, but not gated on DisableCloud and with errors surfaced) ────────
def install_app() -> dict:
    """Full CloudRedirect install, faithful to headcrab's crinstall: create the
    CloudRedirect data dir(s), add the flatpak remotes, refresh appstream, install
    the KDE runtime + the CloudRedirect app, and — the piece we were missing —
    download cloud_redirect.so into the data dir(s). Runs as the desktop user with
    a real session env (runtime dir + DBUS) so flatpak behaves like it does under
    headcrab."""
    log = []
    removed = _clean_managed_leftovers()
    if removed:
        log.append(f"cleaned {len(removed)} stale/partial managed CloudRedirect file(s)")
    # 0) ensure the CloudRedirect data dir(s) exist (headcrab mkdir -p step)
    for d in _cr_dirs():
        try:
            os.makedirs(d, exist_ok=True)
            chown_to_user(d, recursive=False)
        except Exception as exc:
            log.append(f"mkdir {d}: {exc}")
    steps = [
        ["flatpak", "remote-add", "--user", "--if-not-exists", "cloudredirect", CR_REPO],
        ["flatpak", "remote-add", "--user", "--if-not-exists", "flathub", FLATHUB_REPO],
        ["flatpak", "--user", "update", "--appstream", "--noninteractive"],
        ["flatpak", "install", "--user", "-y", "--noninteractive", "flathub", KDE_RUNTIME],
        ["flatpak", "install", "--user", "-y", "--noninteractive", "--reinstall", CR_APP_ID],
        ["update-desktop-database"],
    ]
    env = slssteam._rich_env()
    for cmd in steps:
        try:
            r = subprocess.run(_wrap_cr(cmd), env=env, capture_output=True, timeout=900)
            tail = (r.stdout.decode("utf-8", "replace") +
                    r.stderr.decode("utf-8", "replace")).strip()
            log.append(f"[rc={r.returncode}] {' '.join(cmd[:4])}\n{tail[-400:]}")
        except Exception as exc:
            log.append(f"{' '.join(cmd[:4])}: {exc}")
    # download cloud_redirect.so (headcrab's `wget -O cloud_redirect.so`)
    log.append(_download_cr_lib())
    have_lib = all(_valid_cr_lib(os.path.join(d, "cloud_redirect.so")) for d in _cr_dirs())
    ok = _installed() and have_lib
    logger.log(f"CloudRedirect install: app={_installed()} lib={have_lib} -> {'ok' if ok else 'incomplete'}")
    if ok:
        settings.reset_dep_fail("cloudredirect")
    else:
        settings.inc_dep_fail("cloudredirect")
    return {"success": ok, "installed": ok, "hasLib": have_lib, "log": "\n".join(log)[-1800:]}


def ensure_installed() -> dict:
    """Manual reinstall: replace managed files even when the Flatpak exists."""
    settings.reset_dep_fail("cloudredirect")
    return install_app()


def ensure_installed_auto() -> dict:
    """Skip a verified complete install; repair partial app/library leftovers."""
    if _install_healthy():
        settings.reset_dep_fail("cloudredirect")
        return {"success": True, "installed": True, "log": "existing app + Moon hook verified"}
    if settings.dep_fail_capped("cloudredirect"):
        return {"success": False, "installed": False, "capped": True,
                "log": f"auto-install disabled after {settings.get_dep_fail('cloudredirect')} failed attempts — use Reinstall CloudRedirect"}
    return install_app()


# ── DisableCloud flag (enabled == cloud saves on == DisableCloud: no) ─────────
#
# `[ \t]*`, never `\s*`. In a MULTILINE pattern `\s` matches the newline too, so
# `^\s*DisableCloud:\s*(\S+)` given a valueless key:
#
#     DisableCloud:
#     AdditionalApps:
#       - 480
#
# ate the newline and captured "AdditionalApps:" as the flag's value. Reading it
# back was merely wrong; set_enabled()'s re.sub then rewrote that captured text,
# turning the user's AdditionalApps key into a bare "no" and orphaning their
# whole added-games list. Restricting the class to spaces and tabs keeps every
# match on one line.
_DISABLE_CLOUD_RE = re.compile(r"^([ \t]*)DisableCloud:[ \t]*(.*)$", re.MULTILINE)

_TRUEISH = ("yes", "true", "1", "on")


def _scalar(raw: str) -> str:
    """The value from a `key: value` line: comment stripped, unquoted, trimmed.
    A '#' only opens a comment at the start of the value or after whitespace,
    so a value that merely contains '#' is left alone."""
    text = str(raw or "")
    cut = len(text)
    for i, ch in enumerate(text):
        if ch == "#" and (i == 0 or text[i - 1] in " \t"):
            cut = i
            break
    return text[:cut].strip().strip('"').strip("'").strip()


def get_enabled() -> dict:
    try:
        with open(_config_path(), "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
    except Exception:
        return {"success": True, "enabled": False, "present": False}
    m = _DISABLE_CLOUD_RE.search(content)
    if not m:
        return {"success": True, "enabled": False, "present": False}
    value = _scalar(m.group(2)).lower()
    if not value:
        # Key is there but carries no value. Report it present so set_enabled
        # rewrites this line instead of appending a duplicate key, but do not
        # claim cloud saves are on.
        return {"success": True, "enabled": False, "present": True}
    return {"success": True, "enabled": (value not in _TRUEISH), "present": True}


def set_enabled(enabled: bool) -> dict:
    path = _config_path()
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            content = fh.read()
    except Exception as exc:
        return {"success": False, "error": f"cannot read SLSsteam config: {exc}"}
    newval = "no" if enabled else "yes"
    if _DISABLE_CLOUD_RE.search(content):
        # Rebuild the line from the captured indent so a key written as
        # "DisableCloud:" with no space does not become "DisableCloud:no",
        # which YAML reads as a plain string rather than a mapping.
        new = _DISABLE_CLOUD_RE.sub(
            lambda m: "%sDisableCloud: %s" % (m.group(1), newval), content, count=1)
    else:
        new = content.rstrip("\n") + f"\nDisableCloud: {newval}\n"
    # Write through SLSsteam's atomic writer (temp + fsync + os.replace) rather
    # than open(path,"w"). Truncating this file in place risked losing
    # AdditionalApps -- every game the user has added -- if the write was cut
    # short.
    if not slssteam._atomic_write(new):
        return {"success": False, "error": "cannot write SLSsteam config"}
    logger.log(f"CloudRedirect: DisableCloud -> {newval}")
    return {"success": True, "enabled": bool(enabled)}


# ── launch the flatpak companion (for cloud-provider sign-in) ─────────────────
def _installed() -> bool:
    try:
        cmd = slssteam._wrap_as_user(["flatpak", "info", "--user", CR_APP_ID])
        r = subprocess.run(cmd, env=slssteam._rich_env(),
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
        return r.returncode == 0
    except Exception:
        return False


def open_app() -> dict:
    if not _installed():
        # Try to install it right here (first launch can take a few minutes for
        # the KDE runtime). Surface the real error if it fails.
        r = install_app()
        if not r.get("installed"):
            return {"success": False,
                    "error": "CloudRedirect install failed (see below). Needs network + flatpak.\n"
                             + (r.get("log") or "")}
    try:
        env = slssteam._rich_env()
        try:
            import pwd
            uid = pwd.getpwnam(slssteam._decky_user()).pw_uid
            env.setdefault("XDG_RUNTIME_DIR", f"/run/user/{uid}")
        except Exception:
            pass
        env.setdefault("DISPLAY", ":0")
        cmd = slssteam._wrap_as_user(["flatpak", "run", "--user", CR_APP_ID])
        subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, start_new_session=True)
        logger.log("CloudRedirect: launched companion app")
        return {"success": True}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def artwork() -> dict:
    """Return the bundled CloudRedirect library art as base64 (cover/capsule/hero)."""
    import base64
    out = {"success": True}
    for key, fn in (("cover", "cover.png"), ("capsule", "capsule.png"), ("hero", "hero.png"), ("logo", "logo.png")):
        try:
            p = defaults_path(os.path.join("cloudredirect", fn))
            with open(p, "rb") as fh:
                out[key] = base64.b64encode(fh.read()).decode("ascii")
        except Exception:
            out[key] = ""
    return out


def icon_path() -> dict:
    """Copy the bundled shortcut icon to a stable runtime path Steam can read,
    and return that absolute path (Steam stores the shortcut icon by path)."""
    import shutil
    try:
        src = defaults_path(os.path.join("cloudredirect", "icon.png"))
        dst = runtime_path("cloudredirect_icon.png")
        if not os.path.isfile(dst) or os.path.getsize(dst) != os.path.getsize(src):
            shutil.copy(src, dst)
        return {"success": True, "path": dst}
    except Exception as exc:
        return {"success": False, "error": str(exc), "path": ""}
