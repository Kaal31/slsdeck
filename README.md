# SLSDeckUniversal

**SLSDeckUniversal** is a Decky Loader plugin for SteamOS that brings game setup, manifests, fixes, compatibility tools, cloud saves, and supported Denuvo activation helpers into one controller-friendly interface.

The plugin is designed primarily for Steam Deck, with support for compatible SteamOS handhelds where the required Steam and Decky interfaces are available.

## Features

- Add and remove games through **slsteam-moon**.
- Retrieve manifests and depot data from configured sources.
- Select, downgrade, restore, and pin installed game builds.
- Manage ProductInfo **AppTokens**, optional DLC configuration, and source credentials.
- Install supported game fixes from **Ryuu**, **Perondepot**, and other configured sources.
- Access the same fixes and statuses from Quick Access and injected Steam library controls.
- Back up and restore supported game data through Archive.
- Redirect supported cloud saves with **CloudRedirect**.
- Display configurable library, game-page, and store-page badges, including **TOKEER KEY** (🔑 in emoji mode).
- Use **Tokeer Helper** for supported Steam and Ubisoft activation workflows.
- Use the optional **HV Module** and LinUwUx Proton workflow for supported titles.
- Run diagnostics and reload or restart Steam when required.

## Main components

| Component | Purpose |
|---|---|
| **Decky Loader** | Hosts the plugin and SteamOS interface |
| **slsteam-moon** | Steam integration, ownership handling, manifests, and pinning |
| **Ryuu / Perondepot** | Supported game-fix sources |
| **Tokeer Helper** | Guided activation support for compatible games |
| **Ubisoft packages** | Care-package files for supported Ubisoft titles |
| **HV Module** | Optional hypervisor and custom-Proton compatibility workflow |
| **CloudRedirect** | Optional cloud-save redirection |

## Requirements

- SteamOS on a Steam Deck or compatible handheld.
- **Decky Loader** installed.
- Network access for dependencies, manifests, metadata, fixes, and activation services.
- Credentials or API keys for any optional sources you enable.

Decky installs the Python dependencies declared in `requirements.txt`. The compiled frontend bundle is included under `dist/`.

## Installation

Download the current plugin ZIP from [GitHub Releases](https://github.com/Kaal31/slsdeck/releases), then install it through Decky Loader's developer/plugin installation flow. Restart or reload Decky when prompted.

Dependencies used by optional features can be installed and repaired from the plugin's **Dependencies** page.

## Basic use

Open SLSDeckUniversal from Decky's Quick Access menu:

1. Configure required accounts or keys under **Sources & keys**.
2. Add or select a game.
3. Open **Game fixes**, the per-game Fixes panel, or the injected library Fixes button.
4. Follow the displayed restart, Proton, build-pinning, or verification instructions.

### Tokeer Helper

Install its listed dependencies, enable **Tokeer Helper** in Options, and open it from the Advanced page. Sign in to the DeDevision Discord session, select a supported game, press **Create a ticket**, and follow the prompts in the panel.

Apply any mods, textures, or other intended game-file changes before activation. Changing protected game files afterward is not advised and may require another activation. Use only your own account and device.

After a confirmed activation, SLSDeckUniversal records the game as **TOKEER KEY**. This records a successful application; it is not a continuous DRM-validity check.

## Building from source

```bash
npm install
npm run build
```

The build writes the Decky frontend bundle to `dist/`. Python backend modules live under `py_modules/lt/`.

## Branches

- `main` — current production source.
- `tokeer-automation` — active Tokeer automation development and rolling builds.

## Project status

SLSDeckUniversal is under active development. Steam, Discord, external sources, and SteamOS updates can require compatibility changes, so use the latest release and consult the in-plugin diagnostics when a workflow stops working.
