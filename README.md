# SLSDeck for Decky Loader (SteamOS / Steam Deck)

A SteamOS / Steam Deck port of the **SLSDeck** Millennium plugin, rebuilt as a
[Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin.

The original plugin relied on **SteamTools** — a Windows-only `st` Lua loader
that reads `config/stplug-in/<appid>.lua` scripts. That does not exist on
SteamOS, so this port swaps it for the Linux-native stack:

| Windows dependency | Linux / SteamOS replacement |
|---|---|
| SteamTools (`st` Lua loader) | **SLSsteam** — an `LD_AUDIT` `steamclient.so` hook driven by `~/.config/SLSsteam/config.yaml` |
| Manual installer | **h3adcr-b** (headcrab) — installs SLSsteam and patches Steam's launch scripts |
| — | **steamnetsock-patch** (`netsock.so`) — optional multiplayer fix for FakeAppIds |

## How adding a game works now

SLSsteam injects *ownership* rather than depot keys: adding an AppId under
`AdditionalApps:` in `config.yaml` makes Steam treat the game as owned, and Steam
then fetches the depot decryption keys from its own servers. No `.lua` script or
manually supplied depot key is required.

> **Why `AdditionalApps` and not `AppIds`?** Reading SLSsteam's source
> (`src/config.cpp`, `src/feats/apps.cpp`): `AppIds:` is a black/whitelist
> *filter* over apps you already own — with the default `UseWhitelist: no` an
> entry there would *exclude* the app. `AdditionalApps:` is the list that is
> actually injected (`getSubscribedApps` appends it; `checkAppOwnership` only
> unlocks apps found there). This matches the reference `yaml_config_manager`.

When you add a game the plugin:

1. Registers the AppId under `AdditionalApps:` in `config.yaml` (primary path),
   editing the file with line-targeted, comment-preserving, **atomic** writes.
2. Still downloads the manifest `.lua`/depot files from your configured sources
   as a fallback (kept for parity with the Windows plugin).
3. Falls back to a SLSsteam-only add when no manifest source has the game —
   which alone is enough on SteamOS.

## Features

- **SLSsteam panel (Quick Access)** — detects whether SLSsteam is installed and
  injected; a one-tap **Install SLSsteam (h3adcr-b)** button runs the bundled
  headcrab installer with live status, plus a **Reload Steam** button.
- **Injected game-page UI** — a floating status window (like the Millennium
  overlay) that shows API-source / key availability and, on a game page, an
  **Add with SLSsteam** button and a **Reload Steam** button.
- **Multiple API keys** — one saved field per key-gated source (e.g. Hubcap /
  Morrenus), entered manually and kept in the plugin's settings.
- **Installed list** — every added game with its source (SLSsteam / Lua / both)
  and one-tap removal (deregisters from `config.yaml` and deletes any `.lua`).
- **Game fixes** — Generic and Online (Unsteam) fixes, applied and cleanly
  undone.
- **AppTokens** — `addtoken(...)` values in the manifest `.lua` are extracted
  into `AppTokens:` automatically (needed for some games' ProductInfo), exactly
  like the reference app.
- **DLC (optional)** — a Settings toggle (off by default) writes each game's
  DLCs into `DlcData:`. Only needed for games past Steam's 64-DLC limit;
  SLSsteam handles DLC automatically otherwise.

## Requirements

- Decky Loader on SteamOS / Steam Deck.
- SLSsteam (install it from the plugin's SLSsteam panel, or beforehand). The
  headcrab installer needs `wget`, `curl`, `grep`, `awk`, `sed`, and `7zip`.
- After installing SLSsteam or adding/removing games, **reload Steam** so the
  `LD_AUDIT` hook and updated config take effect.

## Install

1. Copy the `SLSDeck` folder to your Deck at `~/homebrew/plugins/SLSDeck`
   (or install the zip via Decky's *Developer → Install from ZIP*).
2. Restart Decky Loader. The panel appears in the Quick Access Menu.

`httpx` (see `requirements.txt`) is installed automatically by Decky. The
SLSsteam logic uses only the Python standard library.

## Bundled dependency assets

`defaults/slssteam/` ships `headcrab.sh` (the installer), `config.default.yaml`
(seed config), and `netsock/` (the multiplayer patch source) so the plugin can
install and configure everything on-device.

## Build from source

The repo ships a prebuilt `dist/index.js`. To rebuild the frontend:

```bash
cd SLSDeck
pnpm install      # or: npm install
pnpm run build    # produces dist/index.js
```
