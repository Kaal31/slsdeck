# Tokeer Linux integration plan

Source reviewed: `Tesla697/TokeerDRM-App` Linux/Proton implementation.

## Goal

Integrate the Linux Tokeer flow into SLSDeck without embedding the standalone desktop UI and without running the upstream installer verbatim.

The SLSDeck flow should be:

1. Select/open a Denuvo game.
2. Install/update the Tokeer Linux runtime.
3. Set up this game.
4. Verify setup and display/copy the `TLX1...` code.
5. Enter the 6-character activation code.
6. Redeem into the game's Proton prefix and launch through Steam.

## Upstream Linux model

The upstream Linux version consists of:

- `ost_native_hook.so` — native hook loaded through the game's launch wrapper.
- `ost-run.sh` — appends the hook to `LD_PRELOAD` while preserving Steam's existing preload state.
- `tokeer_redeem_linux.py` — POSTs the 6-char code to `/drm/redeem`, receives `app_id`, `appticket`, and `eticket`, then imports those values into the game's Proton-prefix registry and optionally launches the game.
- `tokeer_validate_linux.py` — checks install folder, Proton prefix, native hook, launch option and Proton mapping, then emits the signed `TLX1` setup report.
- `tokeer_steam_config.py` — edits Steam configuration for standalone CLI setup.
- `install_linux.sh` — downloads the bundle, installs CLI files, builds or uses the hook, rewrites Steam launch options, restarts Steam, and launches once to create the prefix.

For SLSDeck, `install_linux.sh` and `tokeer_steam_config.py` should not be the primary control path because SLSDeck already has safer SteamClient and Steam-library helpers.

## Important upstream behavior

### Steam/Proton games

Expected launch wrapper:

```text
WINEDLLOVERRIDES="dinput8=n,b" ~/.local/share/SLSDeck/tokeer/ost-run.sh %command%
```

The wrapper appends `ost_native_hook.so` to `LD_PRELOAD` instead of replacing Steam's existing `LD_PRELOAD`.

The redeemer writes:

```text
HKCU\Software\Valve\Steam\Apps\<appid>
  AppTicket = REG_BINARY
  ETicket   = REG_BINARY
```

inside `steamapps/compatdata/<appid>/pfx`, using Proton/Wine's `reg import`.

### Ubisoft mode

Upstream deliberately does **not** install/use the native hook and does **not** rewrite Steam launch options for Ubisoft mode. That flow is folder-based under Proton (`upc_r2` + `dbdata`) and must remain separate.

## Licensing / vendoring

The upstream repository currently exposes no repository license. Avoid copying/vendoring its Python/C source into SLSDeck unless the upstream author supplies compatible licensing/permission.

Recommended initial integration: download upstream Linux runtime/release artifacts at install/update time and invoke them from SLSDeck. SLSDeck-owned code should only be the integration/orchestration layer.

## Recommended SLSDeck architecture

### Backend module

Add `py_modules/lt/tokeer.py` with RPC-facing operations:

- `status(appid)`
- `install_runtime(force=False)`
- `setup_game(appid)`
- `remove_game_setup(appid)`
- `verify(appid, mode="steam")`
- `redeem(code, appid=0, launch=True)`
- `log_tail()`

Runtime location:

```text
~/.local/share/SLSDeck/tokeer/
```

Keep Tokeer's state outside the Decky plugin directory so a plugin update does not remove the hook/runtime.

### Runtime install

Prefer the upstream prebuilt `linux/ost_native_hook.so` / release bundle. Do not require `gcc`, pacman, or `steamos-readonly disable` on Steam Deck.

Download the required upstream artifacts and mark scripts executable. Track source SHA/version in a small SLSDeck metadata file for updates.

### Per-game setup

SLSDeck should do the setup itself:

1. Verify the app is installed.
2. Ensure a Proton compatibility tool is selected when necessary using the existing `ensureProtonSelected()` / compat APIs.
3. Ensure the Tokeer runtime is installed.
4. Add the Tokeer launch wrapper using `SteamClient.Apps.SetAppLaunchOptions`, preserving existing launch options.
5. Preserve existing SLSDeck `WINEDLLOVERRIDES`, repoint wrappers, `LD_AUDIT`, and user flags.
6. Launch once if the Proton prefix does not exist.
7. Report readiness without forcing a full Steam restart unless Steam actually requires it.

Use a unique marker such as `SLSDECK_TOKEER` in the generated launch option so removal can strip only SLSDeck's Tokeer addition.

### Verify

Initially invoke upstream `tokeer_validate_linux.py` and capture stdout. Parse the final `TLX1.` line and return it to the frontend.

Longer-term, if upstream licensing allows or the protocol is documented independently, validation checks could be implemented natively in SLSDeck.

### Redeem

Initially invoke upstream `tokeer_redeem_linux.py` with:

```text
<CODE> --appid <APPID>
```

Capture stdout/stderr and surface errors directly in QAM. The upstream script already:

- resolves Steam libraries;
- finds the Proton prefix;
- finds a Proton/Wine binary;
- POSTs to `/drm/redeem`;
- writes AppTicket + ETicket into the prefix registry;
- launches through `steam://rungameid/<appid>`.

SLSDeck can pass `--no-launch` and launch through SteamClient itself if we want consistent UI behavior.

### Frontend

Add a Tokeer subsection to the existing Anti-Denuvo page and per-game tools when applicable:

```text
Tokeer activation
  Runtime: Installed / Missing
  Game setup: Ready / Needs setup

  [Install / Update Tokeer]
  [Set up this game]
  [Verify setup]

  TLX1....
  [Copy verification code]

  Activation code: [______]
  [Redeem & launch]

  [Remove Tokeer setup from this game]
```

Do not replace the existing Hypervisor/CrakFiles paths; Tokeer should be another Anti-Denuvo option.

## Interaction with existing SLSDeck launch options

Current SLSDeck already uses `SteamClient.Apps.SetAppLaunchOptions` and preserves/merges:

- `WINEDLLOVERRIDES`
- launch repoint wrappers
- `LD_AUDIT`
- `%command%`

Tokeer setup should reuse that model rather than directly editing `localconfig.vdf`.

The Tokeer wrapper should be inserted immediately before `%command%`, while keeping any environment prefixes before it.

## Persistence / uninstall

The Tokeer runtime should live outside the plugin directory. Plugin uninstall should not silently remove an activation setup from games.

SLSDeck's survival backup should eventually remember which AppIDs have the Tokeer launch wrapper enabled so a reinstall can recognize/rebind them, but should not store activation codes or ticket values.

## Safety / failure handling

- Never modify Steam launch options without preserving the existing string.
- Never require disabling SteamOS read-only mode.
- Prefer the upstream prebuilt hook; fail cleanly if unavailable.
- Do not store 6-character activation codes.
- Do not log AppTicket/ETicket values.
- Keep Ubisoft mode separate from Steam native-hook mode.
- Detect missing Proton prefix and offer/perform a one-time launch instead of treating it as a generic failure.
- Provide a one-click removal that removes only the SLSDeck Tokeer launch wrapper.

## Proposed implementation order

1. Backend runtime installer/status.
2. Frontend Tokeer status + Install/Update button.
3. Per-game setup/removal with additive Steam launch-option handling.
4. Verify (`TLX1`) UI.
5. Redeem + launch UI.
6. Ubisoft-specific mode after the Steam/Proton path is working.
7. Add Tokeer setup state to SLSDeck survival metadata.
