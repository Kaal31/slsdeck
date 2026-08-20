# SLSDeckUniversal — changes in this build

Merged from the creator's `sls_deck_source` (v0.01, full TypeScript source) and
`slsdeckAIO` (v0.0.2), on top of the previously merged build, plus a correctness
pass over both.

Verification for everything below: **280 assertions across 10 suites**, zero
TypeScript diagnostics in authored code, all 27 backend modules import, and the
built bundle loads/initializes/renders/unloads in a stubbed Decky harness.

---

## Critical — silent wrong behaviour or data loss

**Installed game version was nondeterministic.** `smart_merge.select_preferred()`
ran over an unsorted `os.walk` result with no final tiebreak, so when exactness,
timestamp and priority all tied, whichever entry readdir happened to yield first
won — and that choice is what `.preferred_<depot>` feeds into Steam's depotcache.
The same pack could install a different build on two runs. Now a total ordering
(exact-match → newest → most-trusted source → source index → numeric gid). The
test shows the old code producing 4 different outcomes from one input, the new
code producing 1.

**Un-fixing could leave a game unlaunchable.** Fix extraction overwrote game
files with no backup, and un-fix then deleted every path in the log — so removing
a fix that had *replaced* `steam_api64.dll` left the game with none. Originals are
now stashed as `<name>.slsdeck-orig` and restored; only files the fix actually
created are deleted. Layered fixes resolve correctly (remove one of two and the
earlier fix's file returns; remove both and a file the game never shipped goes).

**A cancelled fix was unremovable.** The fix log was only written on success, so
cancelling mid-extraction left files on disk that un-fix reported "No fix log
found" for, permanently. The log is now written on cancel and failure too.

**Workshop mod removal could delete every installed game.** In the merged
SteamCMD engine, `remove_mod()`/`set_mod_enabled()` took `modid` straight from an
RPC, joined it onto the workshop path and `shutil.rmtree()`'d it — so
`modid="../../.."` resolved to `<library>/steamapps`. Now digits-only validation
plus a realpath containment check before any delete or move.

**Config corruption from newline-crossing regexes.** In a `re.MULTILINE` pattern
`\s` matches the newline, so `^Key:\s*(\S+)` given a valueless key captured the
*next line*. Fixed across 11 sites. Two were write paths:
- `cloudredirect.set_enabled()` rewrote the captured text, turning the user's
  `AdditionalApps` key into a bare `no` and orphaning their whole game list.
- `slssteam.add_app_token()` swallowed the following line, silently deleting
  another game's AppToken.

**Duplicate YAML key made AppTokens inert.** Fixing the above exposed a second
bug: a valueless `480:` wasn't recognised as existing, so a duplicate was
appended — and YAML takes the *last* key, the empty one, so the token did nothing.

**"Purge all added games" didn't stick.** `clear_ever_added()` emptied only the
new store; the next read re-ran the legacy migration and merged the old list back
from `settings.json`. Both stores are now cleared.

**Denuvo detection was entirely dead.** `import queue as _queue` rebound the
module-global `_queue` list, so `is_denuvo()` raised `TypeError` for every
uncached appid and a bare `except` swallowed it. (This one was my own regression
from earlier in the session.)

**Non-atomic writes to `config.yaml`.** The file holding `AdditionalApps` was
written with `open(path,"w")`. Now routed through the atomic writer, which also
gained per-call unique temp names (two RPC threads shared one `.tmp`) and
fsync-before-rename.

---

## Correctness

- `priority: 0` — the natural "most trusted" value — ranked *last* because of
  `(x or inf)`. Same shape scored `creation_time == 0` as `-1`. Now `is None`.
- Manifest gids sorted as strings, so `"9"` came after `"10"`. Now numeric.
- App/depot ids outside the 32-bit range are rejected (a 20-digit appid was
  accepted and written into merged luas and ManifestStore filenames).
- `pin_app_current()`'s failure was discarded: the user asked for a version lock,
  didn't get one, and Steam was free to update the game and break the fix. Now
  surfaced as a warning.
- `netsock.so_path()` hardcoded `~/.config/SLSsteam`, missing the real directory
  under XDG or Flatpak Steam — netsock read as "not installed" when it was.
- `apis.get_api_list()` handed out positional indices into a list re-sorted by
  live health on every call. Sources are addressed by name; key-gated sources are
  now reported rather than silently hidden.
- Ryuu's refresh spawned a detached `bash` per call when the cache couldn't be
  written. Now one child at a time, rate-limited, with capped backoff — 32
  concurrent callers spawn exactly one.
- Archive extraction rejects symlink, hardlink and absolute-path members
  (`safe_extract`). Workshop item ids are validated on the download path too.
- Bounded the four caches that grew unbounded (`APP_NAME_CACHE`,
  `APP_INFO_CACHE`, `FIX_STATE`, `UNFIX_STATE`). Fix state evicts only *finished*
  entries, so an in-flight fix stays readable and cancellable.
- Proton mapping set/clear are now exact inverses — config.vdf is byte-identical
  after 5 cycles, where each toggle previously left a blank line behind.

## Frontend (found once the TypeScript source was available)

- **A supported fix type was unreachable.** `buildFixModal()` accepted
  `genericAvail` and never used it, so an available crack/bypass fix had no
  button — while its Online and Unsteam siblings both did, and the handler
  already supported `fix:'generic'`.
- **Fix types were mislabelled.** A two-branch ternary over three values recorded
  the perondepot online fix as "Online Fix (Unsteam)". Not cosmetic: `fixes.py`
  keys off that exact string to patch `unsteam.ini`.
- Dead always-false badge comparison; an implicit-undefined return.

## Merged from the creator

- **SteamCMD Workshop engine** — replaces the third-party mirror with
  `+workshop_download_item`, collection/URL resolution, per-game enable/disable,
  and a manifest of only the mods this plugin installed (so Steam-subscribed
  items are never touched). 11 new `ws_*` RPCs; the old `workshop_*` RPCs remain
  as adapters.
- **Backup** — API-key redaction and Proton-prefix save capture/restore, plus
  `list_backups`. The creator's restore had none of this build's hardening, so it
  was taken for its features with the allowed-roots whitelist, link rejection and
  settings-cache reset re-applied on top.
- `everAdded` moved to `~/.local/share/slsdeck/ever_added.json` so the
  added-games history survives a plugin reinstall.
- `purge_all_added`, `detect_gaming_os`/`is_steamos`.

## Features wired up

Backend that worked but nothing could reach:

- **Per-game section** — Proton version picker (with "Install latest GE-Proton"),
  save backup/restore (restore behind a confirm), repair, online-fix launch option.
- **Tools & Diagnostics** — engine identity, why-won't-this-download, re-apply
  depot keys, phantom-install fix, drive space, temp cleanup, artwork sync,
  health check, and **Repair what the check found** (the audit previously listed
  fixable items and offered no way to fix them).
- Key-gated sources are now named in Settings instead of vanishing.

Reachability went from 154/177 RPCs to 156/177. The remaining 21 are unreachable
*deliberately* — back-compat adapters, superseded aliases, and the watchdog trio
started at init.

**Deliberately not wired:** `get_available_builds`/`install_game_build`. They look
like a build picker but `get_available_builds` only ever returns one entry and
`install_game_build` ignores its `build_id` argument entirely — it just calls
`pin_app_current()`. Version locking is already properly exposed via
`pin_game`/`unpin_game`/`get_pin_status`.

## Build

The frontend is now built from TypeScript (`npm run build`, rollup). **Do not
hand-edit `dist/index.js`** — it is generated. `node_modules` is build-time only
and excluded from the shipped zip.
