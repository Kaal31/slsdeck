# Moon x64 hot reload and future feature-parity audit

Date: 2026-11-20
Target branch: `64client-support`
Pinned engine audited: `ogb4n/slsteam-moon-x64` `v20261116145432`
Upstream source commit: `b65086eb958a478a4c03406ca6b21f2f68371299`
Status: **source audit only**. Steam Deck/SteamRT64 live-function validation not yet performed.

## Key finding: documentation is behind the pinned release source

The upstream `docs/X86_64.md` table (lines 129–143) describes license-refresh
helpers, library removal and some AppInfo hooks as disabled/stubbed. However,
the **exact release currently pinned by SLSDeck** already implements:
- x64 locators for `CUser::MarkLicenseAsChanged`,
  `CUser::ProcessPendingLicenseUpdates`, `CUser::NotifyLicensesUpdated`,
  and `CUser::m_CompatManager` (`src/patterns_x86_64.hpp:248-268`).
- A runtime refresh decision and guarded invocation path
  (`src/feats/packagepatch.cpp:530-618`, `931-946`).
- Managed app-state snapshots, metadata publication and a watcher
  (`src/feats/hotreload.cpp`), including restart fallback if AppInfo is not ready.
- Optional x64 SteamUI removal hooks
  (`src/feats/libraryremoval.cpp:193-287`), rather than a pure no-op stub.

This is a **candidate implementation**, not evidence that the functions resolve
uniquely against the current SteamOS client or that the call chain succeeds
in practice. Do not repeat the older README/docs claim of “no locator yet”
as if it describes this tagged source.

## Hot-reload state machine in the tagged source

| Stage | Source | Result / unresolved verification |
|---|---|---|
| Watch managed registrations | `src/feats/hotreload.cpp::publish` | Publishes immutable generations; confirm watcher receives SLSDeck-produced Lua/YAML/config writes |
| Prepare app metadata | `src/feats/appinfo_provision.cpp`, `src/feats/appinfostate.cpp` | Uses cache and Steam AppInfo; check which added games must wait for network / metadata |
| Publish package-0 snapshot | `src/feats/packagepatch.cpp` | Updates managed package entries; confirm no native-app regression and correct lock/thread |
| Mark Steam licenses changed | `MarkLicenseAsChanged(CUser*, 0, true)` in `packagepatch.cpp:589` | Locator and ABI must match actual `steamrt64/steamclient.so`; no assumption of success from a nonnull pointer |
| Process pending updates | `ProcessPendingLicenseUpdates(CUser*)` in `packagepatch.cpp:595` | Process must return true and result in a Steam-owned license publication |
| Notify cold-cache consumers | `CUser::notifyLicensesUpdated`, `packagepatch.cpp:131-173` | Optional callback path; check actual `LicensesUpdated_t` delivery |
| Steam library/UI refresh and removal | `libraryremoval.cpp:193-287`, `patterns_x86_64.hpp:229-247` | Optional UI locators may be absent, resulting in visual changes only after natural refresh or restart |

The runtime function `LicenseRefreshPolicy::decide` can return NoChange, Defer
or Process. A missing Mark/Process locator or unresolved AppInfo leads to Defer,
and successful generation processing is recorded only after the Steam function
returns success. Concurrent execution has atomic and thread-local guards.

## Independent validation gate before claiming hot reload works

1. Acquire `steamrt64/steamclient.so` from the **target Steam Deck build**
   along with build manifest and SHA-256. The fork's documented Debian build
   `1794424036` is not necessarily the Deck's exact build.
2. Run the upstream offline locator audit (`make test-patterns-x86_64`)
   against that binary, record number of matches per locator, and independently
   check CUser functions with disassembly/call graph/string xrefs. Scan only
   `steamrt64/steamclient.so`, not `linux64/steamclient.so`.
3. Validate x64 ABI, CUser object layout, `m_CompatManager` offset and return
   values; a unique signature is not sufficient evidence for safe invocation.
4. Exercise offline tests for generation/coalescing, missing appinfo, repeat adds,
   remove/re-add, interrupted provisioning, and concurrent config changes.
5. On Steam Deck, observe **without restart**: add game -> license change ->
   client library tile + download plan; remove game -> title disappears; repeat
   with offline/online transition. Collect engine log *outcome* markers, not
   private Steam credentials.
6. If a needed locator or UI capability is absent, report that hot reload is
   unverified / deferred, not successful.

## Future parity audit — tagged x64 engine vs 32-bit Moon

| Feature | Tagged x64 source observation | Follow-up |
|---|---|---|
| Ownership checks, ticket hooks and package 0 | Implemented; upstream reports successful real Steam-client download | Verify Steam Deck with licensed test fixtures and offline positive/negative cases |
| Runtime live add | Snapshot + Mark/Process source implementation present | Locator and runtime verification above |
| Runtime removal | Optional x64 SteamUI function locators and removal queue present | Validate `RunFrame`, `GetAppByID`, `MarkAppChange`, ownership field offset and UI synchronization |
| AppInfo cache refresh | x64 candidate methods and AppInfo provisions present | Validate cache SHA/flag layouts, actual SteamOS client and metadata response handling |
| Manifest pinning and depot plan | Source contains `manifestpins`, `manifestbind`, `manifeststore`, package/depot planning | Run representative depots, pinned manifests, missing/invalid cache and progress events |
| Reconcile-pin and depot quarantine | x64 candidate locators exist for EvaluateConfigChanges, OnChunkUnpacked | Verify on actual callback paths and corrupted-depot scenario; signature alone is insufficient |
| SteamStub | `steamstub.cpp` present, but helper installation and downstream compatibility not established for our branch | Test only after a supported external helper build exists; do not call feature complete |
| Steam Cloud / CloudRedirect | x64 upstream README says legacy CloudRedirect is 32-bit and skipped; `DisableCloud: yes` | Requires genuinely x64-capable integration or a compatible alternate method |
| SteamUI overview | Older docs say BuildCompleteAppOverviewChange not ported; candidate SteamUI overview/removal locators exist | Audit modern UI path separately from license processing; do not conflate library tile with ownership |
| Parental/stats and achievements | Optional x64 patterns and hooks present; upstream documentation notes limited runtime exercise | Functional test matrix required |
| Steam Deck/Desktop/Game Mode | Upstream README says unsupported, not tested | Independent Decky/SteamOS startup and process-scoped injection tests still necessary |

## Release/maintenance plan

- Maintain existing `64client-support` pin while tests are inconclusive.
- If a required fix is in upstream C++, build an isolated x64 engine fork or
  audited source revision and supply it to CI; changing SLSDeck Python will not
  patch instructions embedded in `SLSsteam.so`.
- Create versioned SteamRT64 fixture hashes + patterns-audit results for each
  supported Steam client revision. Treat future updates as unverified until
  matching locator/ABI evidence exists.
- Keep the five-stage roadmap in `docs/STEAMRT64_ROADMAP.md`; stages 1–2 are
  ongoing, 3–5 are still open.

## References

- https://github.com/ogb4n/slsteam-moon-x64/tree/v20261116145432
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/src/feats/hotreload.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/src/feats/packagepatch.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/src/patterns_x86_64.hpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/src/feats/libraryremoval.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/docs/X86_64.md
- https://github.com/ogb4n/slsteam-moon-x64/blob/v20261116145432/README.md

Note: this investigation made **no modifications to launcher/recovery/safety logic**.
