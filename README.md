# SLSDeckUniversal

**SLSDeckUniversal** is a Decky Loader plugin for SteamOS / Steam Deck that brings together game registration, manifest/depot management, compatibility fixes, Steam client integration, cloud-save helpers, Workshop tools, badges, recovery tools and anti-Denuvo/hypervisor utilities in one Game Mode-friendly interface.

The plugin is designed around the Steam Deck first: most day-to-day actions can be performed from Decky's Quick Access Menu or the full SLSDeck page without dropping to Desktop Mode.

> **Current stable branch:** `main`  
> **Rolling release:** `main-latest`  
> **Package name:** `SLSDeckUniversal`

---

## Features at a glance

- Add and remove games through **slsteam-moon / SLSsteam** integration.
- Manage manifests, depot keys, AppTokens and pinned Steam builds.
- Roll games back to older Steam builds and force Steam validation afterward.
- Search, download, enable, disable and remove Steam Workshop mods.
- Apply game fixes from supported sources and track installed fixes.
- Apply online/multiplayer compatibility fixes where supported.
- Manage DLC-unlocker options and per-game DLC helpers.
- Install and manage **CloudRedirect** for cloud saves on added games.
- Display SLS / Legit / Denuvo / Fix / Online Fix / Non-Steam badges across Steam UI.
- Optional standalone emoji badges.
- Automatically repair common SLSsteam/Steam-client breakage.
- Build/download and control the anti-Denuvo `cpuid_fault_emulation` hypervisor module.
- Install the matching custom Proton used by the hypervisor workflow.
- Back up and restore SLSDeck settings, data and custom fixes.
- Inspect diagnostics, dependency status and injection state.

---

# Installation

## Requirements

- Steam Deck or another compatible SteamOS-style environment.
- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).
- Network access for remote manifests, metadata, fixes and dependency downloads.
- Any API keys required by the optional sources you choose to use.

The plugin currently declares these Python packages:

```text
httpx==0.27.2
py7zr==0.22.0
```

The frontend is built as an ES module and the packaged plugin includes `package.json` with `"type": "module"`, which is required by current Decky Loader versions.

## Installing a release

Use the rolling `main-latest` release ZIP or install the plugin manually through Decky's developer/plugin installation workflow.

The release archive has a top-level directory named:

```text
SLSDeckUniversal/
```

and contains the compiled frontend, backend, plugin metadata and Python modules.

---

# Interface overview

SLSDeck has two main surfaces.

## Quick Access Menu

The Quick Access panel is intended for actions you need while browsing or playing games. Depending on settings and whether SLSsteam is installed, it can show:

- SLSsteam setup/repair status.
- **Actions & fixes** for the currently selected game.
- Added-game list.
- Per-game tools.
- Diagnostics/tools when enabled.

The panel remembers its scroll position between openings.

## Full SLSDeck page

Open the cog/advanced button from the plugin header to enter the full-page interface. Main pages include:

- Dependencies
- Options
- Sources & keys
- Add a game
- Game fixes
- Cloud saves
- Anti-Denuvo
- Mods
- About

---

# Options reference

Important options currently include:

- **Auto restart after adding** — reload/restart Steam after supported add flows.
- **Add DLC automatically** — include DLC registration/depot data when adding.
- **Disable DLC unlock on owned games** — protect legitimate titles from automatic DLC exposure.
- **Disable Steam cloud on SLS games** — avoid rejected Steam Cloud synchronization.
- **No internet fix** — temporary compatibility workaround for pinned-build downloads.
- **Pin game version on fix** — lock the current build when applying fixes.
- **Auto-apply fix after update** — complete a target-build fix automatically after Steam finishes downloading.
- **Auto-fix launch target** — repair/repoint launch executable for fixes that require it.
- **Auto-apply fixes after adding** — queue known fixes for newly added games.
- **Unlock DLC when adding a game** — enable supported DLC ownership/unlocker workflow.
- **DLC unlockers on owned games only** — hide irrelevant unlocker controls on SLS-added titles.
- **Hide tools & diagnostics in Quick Access** — compact QAM mode.
- **Show Actions & fixes in Quick Access** — toggle the current-game action block.
- **Show added games in Quick Access** — put the SLS game list in QAM.
- **Show Reinstall SLSsteam in Quick Access** — expose engine reinstall after initial setup.
- **Achievements (slsteam-moon)** — allow moon's achievements workflow when supported.
- **Group SLS games into a collection** — maintain the `SLSDeck` Steam collection.
- **Backup custom manifests and fixes** — include custom content in backup archives.
- **Emoji Badges** — replace text pills with standalone emoji.
- Individual badge visibility toggles for SLS, Legit, Denuvo, Online Fix, Fixed, Non-Steam, library grid, game pages and store pages.
- **Auto re-activate injection on boot** — repair injection after client updates.
- **Auto re-pin Steam client on boot** — heavier automatic client compatibility recovery.

---

# Build from source

```bash
npm ci
npm run build
python3 -m compileall -q main.py py_modules
```

The frontend bundle is written to:

```text
dist/index.js
```

The release package must contain `package.json` alongside `plugin.json` because current Decky Loader uses it to determine that this frontend is an ES module.

The `main` branch includes a rolling release workflow that builds and publishes:

```text
SLSDeckUniversal-main.zip
```

under the `main-latest` release tag.

---

# Project structure

```text
SLSDeckUniversal/
├── main.py                  # Decky backend RPC surface
├── plugin.json              # Decky plugin metadata
├── package.json             # frontend metadata / ESM marker
├── requirements.txt         # Python dependencies
├── src/
│   ├── components/          # reusable UI components
│   ├── lib/                 # frontend integration/helpers
│   ├── pages/               # full-page navigation
│   ├── patches/             # Steam UI patches
│   └── sections/            # feature pages/sections
├── py_modules/lt/           # backend feature modules
├── defaults/                # default configuration/data
└── dist/                    # compiled Decky frontend
```

---

# Credits, dependencies and prior art

SLSDeckUniversal is an integration project. A large part of what it can do exists because other developers documented, implemented or explored the underlying SteamOS/Steam behavior first.

## Core platform

- [SteamDeckHomebrew/decky-loader](https://github.com/SteamDeckHomebrew/decky-loader) — Decky Loader, plugin runtime and Game Mode integration.
- [SteamDeckHomebrew/decky-frontend-lib](https://github.com/SteamDeckHomebrew/decky-frontend-lib) — Decky frontend libraries/tooling used by the TypeScript UI ecosystem.

## SLSsteam / Steam integration

- [AceSLS/SLSsteam](https://github.com/AceSLS/SLSsteam) — original SLSsteam ownership/injection project.
- [swwayps/slsteam-moon](https://github.com/swwayps/slsteam-moon) — current moon engine and the basis for SLSDeck's modern ManifestPins/depot-key-capable integration.
- [Deadboy666/h3adcr-b](https://github.com/Deadboy666/h3adcr-b) — headcrab client-fix/installer workflow used by SLSDeck's Steam-client compatibility path.
- [yesyes0649/steamnetsock-patch](https://github.com/yesyes0649/steamnetsock-patch) — FakeAppId/multiplayer networking work and prior art.

## Downloads, depots and Proton

- [SteamRE/DepotDownloader](https://github.com/SteamRE/DepotDownloader) — upstream DepotDownloader project; SLSDeck integrates depot/download workflows around this ecosystem.
- [GloriousEggroll/proton-ge-custom](https://github.com/GloriousEggroll/proton-ge-custom) — GE-Proton upstream used by the compatibility-tool installation path.

## Cloud saves

- [Selectively11/CloudRedirect](https://github.com/Selectively11/CloudRedirect) — cloud-save redirection for added/nonstandard Steam games. SLSDeck provides setup, repair and shortcut integration around it.

## Fix/manifests ecosystem

- [Ryuu generator](https://generator.ryuu.lol) — Ryuu manifest/fix ecosystem used as one of SLSDeck's data/fix sources.
- **Unsteam project/community** — source and prior art for game-fix workflows used by the plugin. If a canonical public repository becomes available, it should be linked here.
- **Perondepot** — additional depot/fix source supported by the plugin. If a canonical public repository becomes available, it should be linked here.

## Steam data / build-history ecosystem

- [SteamDatabase/SteamTracking](https://github.com/SteamDatabase/SteamTracking) — Steam client/data reverse-engineering ecosystem and useful reference for Steam behavior.
- [SteamDB](https://steamdb.info/) — build-history/data reference used by SLSDeck's historical-build tooling.

## Badge/UI prior art

- [sebet/decky-nonsteam-badges](https://github.com/sebet/decky-nonsteam-badges) — important prior art for reliable badge placement on Steam Home/recent-game artwork wrappers. SLSDeck's Home badge anchor follows the same proven SteamUI surface strategy.

## Hypervisor / anti-Denuvo prior art

- [Pareidolia's original Decky hypervisor discussion](https://cs.rin.ru/forum/viewtopic.php?f=20&t=159990&hilit=plugin+Decky) — original Decky hypervisor work that inspired the current Anti-Denuvo page.
- **DenuvOwO** — research/tooling that made the Linux anti-Denuvo workflow possible.
- **LinUwUx and other contributors/researchers in the surrounding Linux Denuvo scene** — low-level research and compatibility work the project builds upon.

If a canonical public repository for any of the above hypervisor components is identified, please open an issue/PR so this section can link it directly.

## Python dependencies

- [encode/httpx](https://github.com/encode/httpx) — backend HTTP client.
- [miurahr/py7zr](https://github.com/miurahr/py7zr) — 7z archive support.

## Frontend/build dependencies

- [microsoft/TypeScript](https://github.com/microsoft/TypeScript) — TypeScript compiler/language.
- [rollup/rollup](https://github.com/rollup/rollup) — frontend bundler.
- [react-icons/react-icons](https://github.com/react-icons/react-icons) — icon library used throughout the interface.
- [microsoft/tslib](https://github.com/microsoft/tslib) — TypeScript runtime helpers.

---

# Attribution policy

A project appearing in Credits does **not** necessarily mean its source code is copied or bundled into SLSDeckUniversal. Entries may represent:

- a direct dependency;
- a runtime integration;
- an upstream tool downloaded separately;
- protocol/behavioral prior art;
- a UI implementation pattern that informed SLSDeck's own code.

Licenses and redistribution requirements of upstream projects remain their own. Where SLSDeck downloads or calls an upstream project at runtime, the upstream project remains independently maintained by its authors.

---

# Status

SLSDeckUniversal is under active development. Steam, Decky Loader and SteamOS are moving targets, so UI selectors, client integration and kernel compatibility may occasionally need updates after upstream changes.

For a specific build, the files on the corresponding Git commit/tag are the authoritative description of what is included.