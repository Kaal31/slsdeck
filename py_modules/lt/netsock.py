"""SteamNetworkingSockets patch (yesyes0649/steamnetsock-patch).

Fixes multiplayer in games that use SteamNetworkingSockets while SLSsteam's
FakeAppIds is active — steamclient rejects the cert for the real appid ("Cert is
not authorized for appid X, only 480") and the patch makes that check return 1.

The .so is downloaded by h3adcr-b during the SLSsteam install, so there is
nothing to fetch here; this module only reports whether it's present and tracks
which games opted in.

It is deliberately MANUAL-ONLY: the patch scans and rewrites game memory, which
any anti-cheat will flag, so it must never be applied automatically.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

from . import settings
from .paths import get_user_home

# Confirmed working upstream (README "Compatible Games"). Any game that uses
# SteamNetworkingSockets and works via GBE / OnlineFix should also work.
COMPATIBLE: Dict[int, str] = {
    2868840: "Slay the Spire 2",
    1203620: "Enshrouded",
    3949040: "RV There Yet",
    1167630: "Teardown",
    1966720: "Lethal Company",
    286160: "Tabletop Simulator",
    3164500: "Schedule I",
    570940: "DARK SOULS REMASTERED (needs Seamless Co-op mod)",
}


def so_path() -> str:
    """Where netsock.so lives, resolved the same way as every other SLSsteam
    path. Hardcoding ~/.config/SLSsteam here missed the real directory whenever
    XDG_CONFIG_HOME was set or Steam was the Flatpak build -- so netsock read as
    "not installed" even when h3adcr-b had installed it, and the LD_AUDIT launch
    option this module hands the user pointed at a file that did not exist."""
    try:
        from . import slssteam
        base = slssteam.config_dir()
    except Exception:
        base = os.path.join(get_user_home(), ".config", "SLSsteam")
    return os.path.join(base, "tools", "netsock", "netsock.so")


def installed() -> bool:
    return os.path.isfile(so_path())


def launch_option() -> str:
    """The LD_AUDIT prefix the game's launch options need."""
    return f'LD_AUDIT="{so_path()}"'


def status(appid: int = 0) -> Dict[str, Any]:
    return {
        "success": True,
        "installed": installed(),
        "path": so_path(),
        "launchOption": launch_option(),
        "enabled": settings.get_netsock_game(int(appid)) if appid else False,
        "known": int(appid) in COMPATIBLE if appid else False,
        "knownName": COMPATIBLE.get(int(appid), ""),
    }


def set_enabled(appid: int, enabled: bool) -> Dict[str, Any]:
    settings.set_netsock_game(int(appid), bool(enabled))
    return status(appid)


def compatible_list() -> List[Dict[str, Any]]:
    return [{"appid": a, "name": n} for a, n in sorted(COMPATIBLE.items(), key=lambda kv: kv[1])]
