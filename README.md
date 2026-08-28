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
