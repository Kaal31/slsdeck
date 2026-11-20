# SteamRT64 Moon integration roadmap (64client-support)

Status: started 2026-11-20. **Only this branch**. Never claim on-device SteamOS success from CI.
Upstream implementation: [ogb4n/slsteam-moon-x64](https://github.com/ogb4n/slsteam-moon-x64), based on
[swwayps/slsteam-moon](https://github.com/swwayps/slsteam-moon), ultimately AceSLS/SLSsteam.

## 1. SteamOS / Decky launch compatibility — IN PROGRESS
- Keep the upstream x64 engine installer disabled; SLSDeck installs its **pinned, SHA-256-verified library**.
- Detect actual running steamrt64/steam ELF64, not just a marker or helper.
- Reject ELF mismatch or ambiguous identity; **do not invoke Headcrab** to switch the client.
- Exactly one launcher injection path in Game Mode; keep clean-start / crash-loop recovery.
- Add tests for launch wrapper's ELF64 audit environment, SteamOS service drop-in, cleanup,
  restart and idempotent install. Live-test Desktop and Gaming modes, failure rollback and Decky
  frontend survival before checking this off.
- Do not automatically assume a successful .so copy or injection hook means Steam runs correctly.

## 2. Runtime hot reload and licensing updates — IN PROGRESS
- **Finding:** the x64 fork source *already maps* candidate 64-bit locators for
  CUser::MarkLicenseAsChanged, CUser::ProcessPendingLicenseUpdates,
  CUser::NotifyLicensesUpdated and CUser::m_CompatManager in src/patterns_x86_64.hpp
  lines 248–268. Its packagepatch.cpp also contains mark/process runtime paths
  and capability guards. The older docs/X86_64.md feature table says hot reload is disabled,
  so that document is not sufficient to establish the current implementation's runtime status.
- Check that those locator candidates resolve uniquely on the *installed*
  steamrt64/steamclient.so (not linux64/steamclient.so); evaluate calling conventions,
  CUser layout and the package-0 refresh state machine.
- Confirm live add -> ownership callback -> library availability, remove -> disappearance,
  multiple rapid updates, offline-to-online recovery, and no Decky crash.
- If an optional locator is missing, degrade to **restart-required** with diagnostic reason,
  not a blind function pointer invocation. No guessed fixed offsets.
- See HOTRELOAD_X64_MAPPING.md for specific source references and validation procedure.

## 3. AppInfo and library consistency — PLANNED
- Audit GetOrAddAppData / ThreadedReadFromDisk, 64-bit SteamUI protobuf
  and library removal. Verify add/remove with Steam open, clean restart and cache recovery.

## 4. Manifest/depot reliability — PLANNED
- Test pinned manifest decisions, provisioned depot keys, depot-plan synthesis,
  metadata fetch, invalid/manually missing manifests and quarantine paths.
- Confirm update and rollback behavior after Steam client changes.

## 5. Feature parity and release gate — PLANNED
- Assess SteamStub, CloudRedirect (32-bit hook must not be injected into RT64),
  parental / statistics hooks, achievements and UI.
- Publish a branch-specific ZIP only after static tests; require real SteamOS
  tests and restore-to-clean-start instructions before recommending deployment.
- Preserve original upstream licenses/credits and pin audited engine versions.

## Exit criteria
- Steps 1–2 require **actual Steam Deck Gaming Mode** evidence.
- Tests need deterministic fixtures for both ELF architectures and unknown process states.
- All disruptive operations must retain original launcher and permit clean startup.
- Never merge into experimental until user approves validated behavior.
