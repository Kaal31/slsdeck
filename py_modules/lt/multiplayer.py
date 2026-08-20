"""Per-game multiplayer feasibility check.

Answers one question honestly: *what kind of multiplayer, if any, can this game
actually do here* — before the user spends an evening on a game that cannot work.

There are three outcomes, and the distinction matters:

  * **peer**   — the game's multiplayer is player-hosted (co-op lobbies, direct
    connect, LAN). An emulator (OnlineFix / Goldberg) or the netsock patch can
    make it work between people running the same setup. This is what SLSDeck's
    online-fix and netsock features are for, and it is the only case they help.

  * **official** — the game authenticates against its publisher's own servers,
    and usually ships an anti-cheat that attests the client. Ownership is checked
    SERVER-side, so nothing installed locally changes the answer. Squad, and
    every other EAC/BattlEye title with official servers, is in this group. The
    tool deliberately offers nothing for it: there is no local change that makes
    someone else's server accept an unowned copy, and attempting it gets the
    account and the hardware banned rather than connected.

  * **single** — no multiplayer to fix.

Reporting "official" plainly is the useful behaviour. The alternative -- letting
someone apply an online fix to Squad and wonder for hours why every server
rejects them -- is worse than saying so up front.
"""

from __future__ import annotations

import os
from typing import Any, Dict, List

from .logger import logger
from .storage import get_storage_info
from .steam import get_install_dir_from_acf
from . import netsock

# Anti-cheat clients. Presence of any of these means the game attests itself to
# a server that decides whether to admit the client -- not something a local
# patch can satisfy.
_ANTICHEAT_MARKERS = {
    "EasyAntiCheat": "EasyAntiCheat (EAC)",
    "EasyAntiCheat_EOS": "EasyAntiCheat (EOS)",
    "easyanticheat": "EasyAntiCheat (EAC)",
    "BattlEye": "BattlEye",
    "BEService": "BattlEye",
    "BEClient": "BattlEye",
    "vgk.sys": "Vanguard",
    "mhyprot": "mhyprot",
    "denuvo_anticheat": "Denuvo Anti-Cheat",
}

# Emulator DLLs that provide player-hosted multiplayer without Steam.
_EMULATOR_MARKERS = {
    "OnlineFix64.dll": "OnlineFix",
    "OnlineFix.dll": "OnlineFix",
    "steam_api64.dll": "Steam API (may be Goldberg-replaced)",
    "SteamOverlay64.dll": "OnlineFix overlay",
}

_GOLDBERG_DIRS = ("steam_settings",)

# Titles known to need the SteamNetworkingSockets cert patch under FakeAppIds.
_NETSOCK_IDS = set(netsock.COMPATIBLE.keys())


def _find_install_dir(appid: int) -> str:
    for lib in (get_storage_info().get("libraries") or []):
        steamapps = lib.get("steamapps")
        if not steamapps:
            continue
        try:
            p = get_install_dir_from_acf(steamapps, appid)
        except Exception:
            continue
        if p and os.path.isdir(p):
            return p
    return ""


def _scan(install_dir: str) -> Dict[str, List[str]]:
    """One walk of the install tree, capped so a 100 GB game does not stall the
    RPC thread. Anti-cheat and emulator files live near the root or one level
    down, so a bounded walk is enough in practice."""
    found = {"anticheat": [], "emulator": [], "goldberg": []}
    seen_files = 0
    for root, dirs, files in os.walk(install_dir):
        depth = root[len(install_dir):].count(os.sep)
        if depth >= 3:
            dirs[:] = []
            continue
        for d in dirs:
            low = d.lower()
            for marker, label in _ANTICHEAT_MARKERS.items():
                if marker.lower() in low and label not in found["anticheat"]:
                    found["anticheat"].append(label)
            if low in _GOLDBERG_DIRS and "Goldberg (steam_settings)" not in found["goldberg"]:
                found["goldberg"].append("Goldberg (steam_settings)")
        for fn in files:
            seen_files += 1
            if seen_files > 60000:
                return found
            low = fn.lower()
            for marker, label in _ANTICHEAT_MARKERS.items():
                if marker.lower() in low and label not in found["anticheat"]:
                    found["anticheat"].append(label)
            for marker, label in _EMULATOR_MARKERS.items():
                if marker.lower() == low and label not in found["emulator"]:
                    found["emulator"].append(label)
    return found


def check_multiplayer(appid: int) -> Dict[str, Any]:
    """Report which multiplayer path (if any) applies to this game."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}

    install_dir = _find_install_dir(appid)
    if not install_dir:
        return {"success": False, "error": "Game is not installed — install it first."}

    try:
        found = _scan(install_dir)
    except Exception as exc:
        logger.warn(f"SLSDeck multiplayer: scan failed for {appid}: {exc}")
        return {"success": False, "error": f"Could not read the game folder: {exc}"}

    anticheat = found["anticheat"]
    emulator = found["emulator"]
    goldberg = found["goldberg"]
    netsock_known = appid in _NETSOCK_IDS
    netsock_ready = netsock.installed()

    # Anti-cheat is decisive. It exists to let a server refuse clients it cannot
    # attest, and it runs before any local shim gets a say.
    if anticheat:
        return {
            "success": True,
            "appid": appid,
            "verdict": "official",
            "anticheat": anticheat,
            "headline": f"Official servers only — {', '.join(anticheat)} present",
            "detail": (
                f"This game ships {', '.join(anticheat)} and authenticates against its "
                "publisher's servers. That check happens on their side, so no setting here "
                "can make an unowned copy join — and trying it bans the account rather than "
                "connecting it. If you want to play this online, buying it is the only route. "
                "Singleplayer, offline and LAN modes are unaffected."
            ),
            "canFix": False,
        }

    if netsock_known:
        return {
            "success": True,
            "appid": appid,
            "verdict": "peer",
            "headline": "Player-hosted multiplayer — needs the netsock patch",
            "detail": (
                f"{netsock.COMPATIBLE.get(appid, 'This game')} uses SteamNetworkingSockets, "
                "which rejects the certificate while FakeAppIds is active. The netsock patch "
                + ("is installed — enable it for this game, then host or join a friend's lobby."
                   if netsock_ready else
                   "is NOT installed yet. Reinstall SLSsteam to fetch it.")
                + " It rewrites game memory, so only ever use it on games without anti-cheat."
            ),
            "canFix": True,
            "fix": "netsock",
        }

    if emulator or goldberg:
        names = ", ".join(emulator + goldberg)
        return {
            "success": True,
            "appid": appid,
            "verdict": "peer",
            "headline": f"Player-hosted multiplayer — {names} found",
            "detail": (
                "This game carries an emulator that provides multiplayer without Steam. "
                "Use \"Get online-fix launch option\" to set the DLL overrides. You can play "
                "with other people running the same fix — you host or join each other "
                "directly. It does not connect to official matchmaking."
            ),
            "canFix": True,
            "fix": "onlinefix",
        }

    return {
        "success": True,
        "appid": appid,
        "verdict": "single",
        "headline": "No multiplayer components found",
        "detail": (
            "No anti-cheat, emulator or netsock-affected networking was detected. If this "
            "game is singleplayer that is expected. If it does have multiplayer, it likely "
            "needs an online fix that has not been applied yet — check the Fixes list."
        ),
        "canFix": False,
    }
