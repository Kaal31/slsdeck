# SLSDeckUniversal

[![vibecoded with claude | chatgpt](https://img.shields.io/badge/vibecoded%20with-claude%20%7C%20chatgpt-8A2BE2)](https://github.com/Kaal31/slsdeck)

A **Decky Loader plugin for SteamOS / Steam Deck** that brings the SLSDeck workflow to Linux and collects game-management, manifest, compatibility-fix, and related utilities in one interface.

This repository is the SteamOS/Decky version of the project. The current plugin package is named **SLSDeckUniversal**.

## What it does

SLSDeckUniversal integrates with Steam on SteamOS and provides tools for managing added games and their supporting data directly from Decky Loader.

Current functionality includes:

- Adding and removing games through **slsteam-moon** integration.
- Manifest/depot handling from configured sources.
- Multiple API-key support for sources that require authentication.
- Installed-game tracking and management.
- Manifest version selection/pinning.
- **AppToken** handling for games that require ProductInfo tokens.
- Optional DLC configuration.
- Game fixes, including fix sources/workflows based on **Ryuu** and **Perondepot**.
- Online/game compatibility fixes where supported.
- Denuvo-related tooling, including the optional hypervisor/custom-Proton workflow.
- Steam reload/restart helpers after configuration changes.

## Main components and dependencies

| Component | Purpose |
|---|---|
| **Decky Loader** | Plugin framework and Steam Deck UI integration |
| **slsteam-moon** | SteamOS-side game/ownership integration used by the current plugin |
| **Ryuu** | Source/workflow used by the game-fix system |
| **Perondepot** | Additional game-fix/depot-related source used by the plugin |
| **httpx** | Python HTTP client used by the backend |
| **py7zr** | Python 7z archive support |
| **@decky/api** | Decky frontend API |
| **@decky/ui** | Decky UI components used when building the frontend |
| **Rollup + TypeScript** | Frontend build toolchain |

Older SLSDeck documentation may refer to **SLSsteam**, **h3adcr-b/headcrab**, or **steamnetsock-patch** as the primary dependency stack. Those names describe earlier iterations of the SteamOS port and should not be treated as the best summary of the current SLSDeckUniversal build.

## Credits and upstream projects

SLSDeckUniversal is built around, integrates with, downloads from, or interoperates with the following projects and services. Their inclusion here is attribution, not an implication that their maintainers endorse SLSDeckUniversal.

### Core platform and Steam integration

- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) — plugin framework and Steam Deck UI runtime.
- [slsteam-moon](https://github.com/swwayps/slsteam-moon) — current SteamOS ownership and game-registration engine.
- [LuaTools Moon](https://github.com/swwayps/luatools-moon) — Linux LuaTools integration and an important foundation for the current workflow.
- [SLSsteam](https://github.com/AceSLS/SLSsteam) — original SLSsteam engine and technical lineage.
- [CloudRedirect](https://github.com/Selectively11/CloudRedirect) and [cloudredirect-moon](https://github.com/swwayps/cloudredirect-moon) — cloud-save redirection foundations.
- [h3adcr-b / Headcrab](https://github.com/Deadboy666/h3adcr-b), [h3adcr-b modules](https://github.com/Deadboy666/h3adcr-b-modul3s), and [Selectively11's h3adcr-b work](https://github.com/Selectively11/h3adcr-b) — Steam client configuration and supporting modules.
- [steamnetsock-patch](https://github.com/yesyes0649/steamnetsock-patch) — multiplayer compatibility support.
- [GameNetworkingSockets](https://github.com/ValveSoftware/GameNetworkingSockets) — upstream networking implementation referenced by the compatibility work.

### Sources, fixes, activation, and collections

- [lua.tools](https://lua.tools), its collections catalogue, and the LuaTools team — manifests, fixes, collections, authentication, and supporting services.
- [TokeerDRM-App](https://git.lua.tools/luatools-dedivision/TokeerDRM-App) and the Tokeer/LuaTools DeDevision team — Linux activation runtime and workflows.
- [Ryuu](https://generator.ryuu.lol) — manifest and game-fix source.
- [Perondepot](http://api.perondepot.xyz) — online-fix/depot source.
- **Hubcap** — manifest, depot, workshop, and build-history source used by optional authenticated workflows.
- [Nexus Mods](https://www.nexusmods.com) — mod and collection metadata/download API.
- [Unsteam payload releases](https://github.com/madoiscool/lt_api_links) — compatibility-fix payload source.
- [SteamDB browser-extension work](https://github.com/BossSloth/Steam-SteamDB-extension) — reference for Steam metadata requests.

### Compatibility tools and downloadable dependencies

- [SmokeAPI](https://github.com/acidicoala/SmokeAPI), [Uplay R1 Unlocker](https://github.com/acidicoala/UplayR1Unlocker), and [Uplay R2 Unlocker](https://github.com/acidicoala/UplayR2Unlocker) by acidicoala.
- **CreamAPI** — Steam DLC compatibility support used where applicable.
- [UC Online 2](https://github.com/UnionCrax-Team/uc-online2) and [EOS Proxy](https://github.com/yesyes0649/eos-proxy) — optional per-game multiplayer/API compatibility tools.
- [zapret](https://github.com/bol-van/zapret) — upstream Linux DPI/ISP-bypass engine. SLSDeck supplies its own Steam-oriented lists and integration around the upstream package.
- [GE-Proton](https://github.com/GloriousEggroll/proton-ge-custom) and the LinUwUx Proton work distributed through the SLSDeck release assets.
- [glowing-tribble](https://github.com/PareidoliaDev/glowing-tribble) and its maintained mirrors — optional hypervisor/CPUID module used by the Denuvo workflow.
- [Denuvo game information](https://github.com/PorcoDio00033/denuvo-game-info) — compatibility metadata reference.

### Libraries and build tooling

- [httpx](https://github.com/encode/httpx), [py7zr](https://github.com/miurahr/py7zr), [React](https://github.com/facebook/react), [TypeScript](https://github.com/microsoft/TypeScript), and [Rollup](https://github.com/rollup/rollup).
- [Decky API](https://www.npmjs.com/package/@decky/api) and [Decky UI](https://www.npmjs.com/package/@decky/ui).

## Shout-outs and inspiration

These projects were analyzed, tested as references, or inspired parts of SLSDeckUniversal's UX and architecture. Unless explicitly listed above as an integration, this does **not** mean their code is included in SLSDeckUniversal.

- **LumaDeck** — inspiration and a useful point of comparison during development.
- **Deck Tools plugin** — inspiration for Deck-focused tooling and UI organization.
- [LuaTools Moon](https://github.com/swwayps/luatools-moon) — special thanks for its Linux work, technical foundation, and continued influence on SLSDeck.
- [decky-proton-launch](https://github.com/moi952/decky-proton-launch) — reference for Decky-native self-update, release-channel, and Proton-oriented UX ideas.
- [ManifestHub](https://github.com/trionine/ManifestHub) — reference for manifest-source organization and provider behavior.
- [Decky Nexus](https://github.com/RedRanger14/decky-nexus) — inspiration for controller-friendly Nexus Mods and collection management.
- [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) — reference while improving Discord thread/message discovery and ticket-state handling.

Thank you to the maintainers, contributors, testers, service operators, and community members behind all of these projects. SLSDeckUniversal would not exist in its current form without their work.

## Requirements

- A Steam Deck or compatible SteamOS environment.
- **Decky Loader** installed.
- Network access for features that retrieve manifests, fixes, metadata, or other remote resources.
- Any API keys required by the manifest/fix sources you choose to use.

Python dependencies declared by the plugin are:

```text
httpx==0.27.2
py7zr==0.22.0
```

Decky handles the plugin's Python dependency installation.

## Installation

Install the plugin through the Decky Loader developer/plugin installation workflow, or place the plugin directory in your Decky plugins directory and restart/reload Decky as appropriate.

The repository includes a prebuilt frontend bundle in `dist/`, so rebuilding the TypeScript frontend is not required simply to use an existing build.

## Using the plugin

Open SLSDeckUniversal from Decky's Quick Access menu. From there you can configure sources/API keys, manage games, manifests and fixes, and use the plugin's Steam integration features.

Some operations require Steam to be reloaded before changes become visible. Use the plugin's reload controls when prompted.

## Build from source

The frontend source is included in the repository.

```bash
npm install
npm run build
```

The build produces the frontend bundle under `dist/`.

The main frontend/runtime dependencies are defined in `package.json`; Python backend dependencies are defined in `requirements.txt`.

## Development branch

The `dev` branch is intended for ongoing development and documentation updates before changes are promoted to `main`.

## Project status

SLSDeckUniversal is under active development. Features, source integrations, dependency names, and compatibility workflows may change between builds, so the current repository files and changelog should be treated as the authoritative reference for a particular version.
