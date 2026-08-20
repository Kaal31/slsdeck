"""Central configuration constants for the SLSDeck Decky backend."""

DEFAULT_HEADERS = {
    "Accept": "application/json",
    "X-Requested-With": "SteamDB",
    "User-Agent": "https://github.com/BossSloth/Steam-SteamDB-extension",
    "Origin": "https://github.com/BossSloth/Steam-SteamDB-extension",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
}

API_MANIFEST_URL = "https://raw.githubusercontent.com/madoiscool/lt_api_links/refs/heads/main/load_free_manifest_apis"
API_MANIFEST_PROXY_URL = "https://luatools.vercel.app/load_free_manifest_apis"
API_JSON_FILE = "api.json"

HTTP_TIMEOUT_SECONDS = 15
HTTP_PROXY_TIMEOUT_SECONDS = 15

USER_AGENT = "discord(dot)gg/luatools"

LOADED_APPS_FILE = "loadedappids.txt"
APPID_LOG_FILE = "appidlogs.txt"

# Games database (name -> appid search) and applist (appid -> name)
GAMES_DB_FILE_NAME = "games.json"
GAMES_DB_URL = "https://toolsdb.piqseu.cc/games.json"
GAMES_DB_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60

APPLIST_FILE_NAME = "all-appids.json"
APPLIST_URL = "https://applist.morrenus.xyz/"
APPLIST_DOWNLOAD_TIMEOUT = 300

# Game fixes
# luatools.work fix FILES (per-appid). We probe these directly as a fallback when
# ryuu/perondepot have nothing — the fix *files* are not rate-limited, only the
# index.luatools.work availability index is (HTTP 429), so we skip the index.
GENERIC_FIX_URL = "https://files.luatools.work/GameBypasses/{appid}.zip"
ONLINE_FIX_URL = "https://files.luatools.work/OnlineFix1/{appid}.zip"
# Universal Unsteam emulator (same package the desktop app's "All-In-One" button
# uses) — always available, applied like an online fix and unsteam.ini is patched
# with the game's AppId on extract.
UNSTEAM_AIO_URL = "https://github.com/madoiscool/lt_api_links/releases/download/unsteam/Win64.zip"
# Online-fix source the plugin uses (nginx autoindex of .rar files matched by
# game NAME) — the only online-fix source, same as the official Linux app.
PERONDEPOT_INDEX_URL = "http://api.perondepot.xyz/all/"

