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

# Detailed feature documentation

## 1. Dependencies and first-time setup

The **Dependencies** page manages the components SLSDeck depends on at runtime.

### Install SLSsteam

Installs the SLSsteam/slsteam-moon engine used to register additional games with Steam and handle the Steam-side ownership/injection workflow.

The installer runs asynchronously and reports progress back to Decky. When installation finishes, SLSDeck can restart/reload Steam when necessary.

### Injection state

SLSDeck reports whether the engine is:

- installed;
- currently injected;
- compatible with the current Steam client;
- using the moon engine with manifest/depot support.

### Activate injection

Re-enables the SLSsteam injection path and reloads Steam so the change is active.

### Deactivate injection

Disables the injection path without deleting the SLSDeck configuration or added-game data. Steam is reloaded afterward when required.

### Client fix / h3adcr-b

Runs the Steam-client compatibility workflow used when a Steam update breaks the expected SLSsteam environment.

The manual button intentionally forces the full compatibility operation rather than relying on the automatic "already OK" shortcut.

### Pattern refresh

Refreshes SLSsteam pattern data against the installed Steam client and reports:

- current Steam client build;
- supported client build;
- whether they match;
- helper presence;
- command output and errors.

### Foreign-engine detection

If another Steam ownership/injection engine is detected, SLSDeck can disable it reversibly so two engines do not fight over Steam startup/injection.

### CloudRedirect installation

CloudRedirect can be installed automatically after SLSsteam is set up, or reinstalled manually from Dependencies.

SLSDeck preserves the user's CloudRedirect configuration/login data while repairing or replacing the native hook.

### Diagnostics

The dependency diagnostics view exposes useful troubleshooting data including:

- active engine;
- injection state;
- Steam root;
- SteamOS/client information;
- whether the plugin is running as root;
- `steam.sh` wrapper state;
- added AppIDs;
- recent SLSsteam log lines;
- client-fix logs;
- pinning capability.

---

## 2. Adding games

The **Add a game** page is the main registration workflow.

### Search / select a game

SLSDeck resolves game metadata through configured manifest/data sources and prepares the information required to register it with Steam.

### Add with SLSsteam

Adds the selected AppID into the SLSsteam/slsteam-moon configuration and provisions the supporting Steam data used by the game.

Where available this can include:

- AppID registration;
- depot keys;
- depot manifests;
- AppToken/ProductInfo token data;
- DLC information;
- artwork/metadata;
- install/download hints.

### Live add behavior

When slsteam-moon can hot-reload the game into the current Steam session, SLSDeck avoids an unnecessary full Steam restart.

If a particular path still requires restart/provisioning, the UI reports that explicitly.

### Auto restart after adding

Optional setting that restarts/reloads Steam automatically after an add operation when that workflow requires it.

### Auto-add DLC

When enabled, SLSDeck also registers supported DLC/depot-key data while adding the base game.

### Installed-game list

Added games can be shown either on the full page or directly inside Quick Access.

From this list SLSDeck can refresh state and remove games it previously registered.

---

## 3. Removing games

Removing an SLS-added game reverses SLSDeck's registration for that AppID and cleans the matching SLSsteam state.

SLSDeck distinguishes plugin removal from game removal: uninstalling the Decky plugin itself does **not** aggressively wipe the user's added games while Steam is live, because doing so can conflict with SLSsteam's file watchers and Steam's in-memory state.

---

## 4. Manifest and depot management

SLSDeck supports Steam manifest/depot workflows for registered games.

### Depot keys

Depot decryption keys are provisioned into Steam's configuration when available.

Because Steam can overwrite `config.vdf` from its in-memory state during shutdown, SLSDeck includes a controlled "provision and restart" flow that stops Steam, writes the required information while Steam is closed, and starts it again.

### Depot manifests

Manifest files can be provisioned to Steam's depot cache when supplied by the configured source.

### AppTokens

Games that require ProductInfo access can use stored AppToken data where the selected source provides it.

### Preflight diagnostics

Before attempting certain downloads, SLSDeck can check the required conditions and report exactly what is missing rather than failing silently.

### Download diagnosis

SLSDeck can inspect Steam's content log and surface the reason for a failed install/download attempt.

---

## 5. Build history and version rollback

SLSDeck can work with historical Steam builds for games that need an older executable or data set.

### Build history

The game-tools UI can retrieve and display known build IDs and associated timestamps/metadata.

### Pin current version

Stores the currently installed depot manifest IDs as a slsteam-moon ManifestPin so Steam keeps the selected build instead of automatically moving to the newest one.

### Select an older build

When supported, SLSDeck can resolve the historical depot manifests for a selected build and pin them for the game.

### Apply rollback

After the manifests are pinned, SLSDeck asks Steam to reconcile the installed files.

The current implementation deliberately triggers:

```text
steam://validate/<appid>
```

so Steam performs the equivalent of **Properties → Installed Files → Verify integrity** and downloads files that differ from the newly pinned build.

This is more reliable than only asking Steam to "install" an already-installed game.

### Unpin

Removes the game's ManifestPins so Steam can return to its normal update path.

### No-internet workaround

For old-build downloads affected by a Steam client configuration that blocks updates, SLSDeck can temporarily relax that block long enough for the game download to start and then restore it.

---

## 6. Game fixes

The **Game fixes** system finds and applies compatibility/crack/fix packages from supported sources.

### Fix discovery

SLSDeck maintains a fix index and can associate available fixes with a Steam AppID.

Supported workflows currently include Ryuu/Unsteam-style data and other configured fix sources such as Perondepot.

### Apply fix

Downloads and applies a selected fix into the detected game installation directory.

The operation has background state/progress reporting so large downloads do not block Decky's UI.

### Installed-fix tracking

Applied fixes are recorded so SLSDeck can:

- show a FIX badge;
- show the fix in installed-fix lists;
- avoid blindly reapplying it;
- support removal/unfix operations.

### Unfix

Attempts to reverse a previously applied fix and restore the appropriate files/state.

### Pin game version when applying a fix

Optional behavior that locks the game to its current Steam build when a fix is installed, preventing a later game update from immediately replacing files the fix depends on.

### Auto-apply after update

For fixes tied to a specific build, SLSDeck can guide or automate the sequence:

1. pin/select the target build;
2. let Steam update/validate to it;
3. wait for the download to complete;
4. apply the fix.

### Auto-fix launch target

If a fix requires launching a different executable, SLSDeck can adjust the game's launch target/options while preserving unrelated user launch arguments.

### Auto-apply fixes after adding

When enabled, a newly added game can automatically be queued for known supported fixes after installation becomes ready.

---

## 7. Online / multiplayer fixes

SLSDeck can detect and apply supported online-fix/multiplayer compatibility paths.

### Multiplayer check

Reports which multiplayer path, if any, is available for a game.

### Online-fix username

Lets the user set the player name used by compatible online-fix emulators. Leaving it blank falls back to the detected Steam name where supported.

### Online Fix badge

Games with an online fix installed can receive a separate `ONLINE FIX` or 🌐 badge.

---

## 8. DLC tools

SLSDeck contains both SLSsteam-level DLC behavior and optional per-game unlocker helpers.

### Unlock DLC when adding

Registers supported DLC ownership/depot data while adding a game.

### DLC unlockers on owned games only

Optional setting that hides redundant per-game unlocker buttons on SLS-added games and only presents them for legitimately owned titles where they are useful.

### Disable DLC unlock on owned games

Can blacklist DLC for legitimately owned games so slsteam-moon does not automatically expose unowned DLC on those titles.

### Per-game helpers

The backend includes status/install/remove flows for supported Steam and Ubisoft DLC-unlocker methods, including SmokeAPI and Uplay-style helpers where applicable.

---

## 9. Cloud saves and CloudRedirect

SLSDeck integrates [CloudRedirect](https://github.com/Selectively11/CloudRedirect) to provide real cloud-save behavior for added games.

### Install / repair CloudRedirect

Installs the Flatpak/runtime and the native hook used by CloudRedirect.

Repair logic is intentionally conservative: replacing the native hook does not wipe the Flatpak application, user configuration, tokens or login state.

### Rebind shortcut

After a reinstall, SLSDeck can repair the existing Steam shortcut so it points at the correct CloudRedirect installation.

### Disable Steam Cloud on SLS games

As an alternative to CloudRedirect, SLSDeck can disable Steam Cloud for SLS-added games to avoid failed/rejected Steam sync attempts.

### Local save backup

The backend also includes save-backup and restore helpers for Proton prefixes, independent of the live CloudRedirect service.

---

## 10. Steam Workshop mods

The **Mods** page provides a Game Mode-oriented Steam Workshop manager.

### Browse/search Workshop content

Searches Workshop items associated with installed SLS-added games.

### Paste a Workshop URL or ID

A Workshop item or collection ID/URL can be resolved to:

- title;
- owning game/AppID;
- collection children;
- install eligibility.

### Download mod / collection

Downloads Workshop content through Steam tooling directly into the game's Workshop content path.

The UI tracks queued/running/completed state.

### Eligibility checks

The mod manager is focused on SLS-added/non-Steam games. It warns when the target is a legitimately owned Steam game or when the game is not installed.

### Installed-mod manager

For each game, SLSDeck can:

- list installed mods;
- enable/disable them;
- remove them;
- display mod sizes and IDs.

Disable/enable is implemented without permanently deleting the mod data.

### Workshop manifest via Hubcap

For supported configurations, SLSDeck can obtain/publish a Workshop manifest using the configured Hubcap source/key and tell the user when a Steam restart is required.

---

## 11. Library and game-page badges

SLSDeck injects badges into Steam's library UI.

Available badge types include:

| Badge | Meaning |
|---|---|
| **SLS** / 🏴‍☠️ | Game was added through SLSDeck/SLSsteam |
| **LEGIT** / 💵 | Legitimately owned Steam title |
| **FIXED** / 🔧 | Non-online fix is installed |
| **ONLINE FIX** / 🌐 | Online fix is installed |
| **DENUVO** / 👺 | Game is identified as Denuvo-protected |
| **NON-STEAM** / ❓ | Non-Steam shortcut |

### Surfaces

Badges can appear on:

- normal Library grid capsules;
- Steam Home/recent-game capsules;
- individual game-detail pages;
- supported store-page surfaces.

The Home-screen renderer uses the artwork wrapper rather than Steam's bottom-right status/control overlay so badges remain visible and do not collide with native icons.

### Emoji Badges

`Emoji Badges` replaces normal colored pills with standalone emoji while preserving the individual enable/disable settings for each badge type.

Emoji mode deliberately removes background, border, shadow and blur styling from the badge element.

### Non-Steam app-name badge

An optional extra badge can display a best-effort application name for a non-Steam shortcut.

---

## 12. Quick Access configuration

The Options page controls how much of SLSDeck appears in Quick Access.

### Show Actions & fixes in Quick Access

Shows/hides the per-game action block without requiring a Steam restart.

### Show added games in Quick Access

Moves the added-game list into the QAM instead of keeping it only on the full Add page.

### Show Reinstall SLSsteam in Quick Access

Controls whether the reinstall action is shown after SLSsteam is already installed. First-time installation remains available when the engine is absent.

### Hide tools & diagnostics in Quick Access

Keeps the everyday panel compact while leaving the same diagnostic functions available on the full page.

---

## 13. Game-page actions

SLSDeck patches Steam's app-details page to add context-aware controls.

Depending on ownership, installation state and settings, these can include:

- add/register game;
- fixes;
- build/version tools;
- per-game actions;
- status badges.

Owned-game hiding options prevent SLS-specific controls from cluttering legitimate Steam titles when desired.

---

## 14. SLSsteam repair and self-healing

Steam client updates can invalidate injection assumptions. SLSDeck includes several recovery paths.

### Repair banner

When SLSsteam is installed but appears inactive, Quick Access can display a repair banner explaining the detected condition and offering one-tap repair.

### Background watchdog

A lightweight backend watchdog periodically checks important plugin/engine state and can repair selected known breakages.

### Injection event notifications

Background repair/injection events can be surfaced as Decky toast notifications.

### Auto re-activate injection on boot

If enabled, SLSDeck can restore its injection wrapper after a Steam update and restart Steam into the repaired environment.

### Auto re-pin Steam client on boot

Optional heavier recovery path that invokes the client compatibility workflow automatically when required.

---

## 15. Anti-Denuvo hypervisor

The `main` branch currently keeps the original hypervisor-based Anti-Denuvo tooling.

The implementation manages a `cpuid_fault_emulation` kernel module and its related compatibility environment.

### Status

Displays whether:

- the module is built;
- a compatible module is loaded;
- kernel headers are ready;
- the backend has root privileges;
- UMIP compatibility is active;
- the custom Proton is installed.

### Download prebuilt module

Attempts to fetch a module already built for the currently running kernel. This is the recommended path when a matching build exists.

### Install kernel headers

Installs the headers required to compile the module against the active SteamOS kernel.

### Build module natively

Compiles `cpuid_fault_emulation` against the running kernel.

### Build in Podman

When Podman is available, SLSDeck can use a containerized build path instead of compiling directly in the host environment.

### Enable / disable hypervisor

Loads or unloads the compatible module.

### Self-test

Runs a userspace test to verify that CPUID faulting behaves as expected.

### Rebuild for current kernel

Recompiles after a SteamOS kernel update or when the existing module no longer matches the running kernel.

### UMIP compatibility daemon

SLSDeck can use `umipcompatd` while the module is enabled, avoiding a system-wide permanent UMIP disable in the normal case.

### UMIP fallback

If the daemon path fails, the UI exposes the kernel-level UMIP fallback and the corresponding restore/reboot path.

### Per-game marking / watcher

Games can be marked for hypervisor handling and optionally managed by an automatic watcher rather than manually enabling/disabling the module every time.

### Custom Proton

The Anti-Denuvo page can download/install the custom Proton environment expected by this workflow and report download/install progress.

---

## 16. Settings and source management

The **Sources & keys** page manages remote providers and API credentials used by optional features.

SLSDeck supports multiple source keys rather than assuming a single global provider.

Settings are stored locally and are not intentionally included in public release artifacts beyond defaults.

---

## 17. Artwork and Steam library metadata

SLSDeck can synchronize artwork for added games and refresh it when requested.

The backend keeps artwork handling separate from game registration so artwork can be repaired/re-synced without re-adding the game.

---

## 18. Collections

### SLSDeck collection

Optional setting that maintains a Steam collection containing games registered through SLSDeck.

The collection is refreshed after add/remove activity and periodically reconciled in the background.

Turning the option off stops future synchronization but intentionally does not destroy the user's existing collection.

---

## 19. Backup and restore

The backup system can archive SLSDeck state for migration/recovery.

Depending on options, a backup can include:

- plugin settings;
- added-game state;
- source configuration;
- game-save backups;
- custom manifests/fixes.

API keys can be excluded when creating a backup intended to be shared.

### Restore

Restores a previously created SLSDeck backup and its supported configuration/data.

### Survival backup

The backend maintains additional recovery-oriented state so important SLSsteam configuration can survive plugin reinstalls or accidental frontend/backend changes.

---

## 20. Updates and dependency maintenance

SLSDeck can check selected GitHub-sourced tools/components for newer versions during background initialization.

Lightweight dependencies may be updated automatically when the relevant option allows it; heavier kernel/Proton/client operations remain explicit because they can restart Steam, alter kernel state or take significant time.

---

## 21. Store and Workshop browser integration

Some Steam pages are Chromium/CEF surfaces rather than normal Decky React trees.

SLSDeck uses Steam CEF debugging where appropriate to:

- inject supported store-page UI;
- inspect/capture page metadata;
- support Workshop/Hubcap workflows.

This is performed against the user's local Steam session rather than by storing external browser credentials in SLSDeck.

---

## 22. Background tasks

The plugin backend deliberately moves long-running network/download/subprocess work away from the main asyncio/UI path.

Examples include:

- dependency installation;
- game/fix downloads;
- update checks;
- watchdog work;
- manifest/index initialization.

A separate warm-up executor is used so background cache initialization does not consume every worker and make the first UI action appear frozen.

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
