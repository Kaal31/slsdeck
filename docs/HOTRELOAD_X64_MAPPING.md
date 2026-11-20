# Moon x64 — missing hot reload function map

Source-of-truth inspection: ogb4n/slsteam-moon-x64 main, 2026-11-20.
This is **a static source mapping, not proof of successful runtime operation on Steam Deck**.
Read the architecture-specific C++ files rather than treating the older status table
in docs/X86_64.md as authoritative on recent source.

## Mapped candidates (not confirmed on SLSDeck's current SteamRT64 binary)

| Function / member | Candidate locator in x64 fork | Source evidence | Runtime usage | Verification |
|---|---|---|---|---|
| `CUser::MarkLicenseAsChanged` | x64 byte signature (starts `41 57 48 8D 87`) | `src/patterns_x86_64.hpp:248-255` | `src/feats/packagepatch.cpp:931-935`; `processRuntimeRefresh()` calls `g_pMarkLicenseAsChanged(user,0,true)` at ~589 | Validate one unique entry, SysV ABI `(CUser*,uint32_t,bool)`, return type and state mutation on real steamrt64 |
| `CUser::ProcessPendingLicenseUpdates` | x64 byte signature (starts `41 54 49 89 FC`) | `src/patterns_x86_64.hpp:256-258` | `src/feats/packagepatch.cpp:936-940`; `processRuntimeRefresh()` invokes `g_pProcessPendingLicenseUpdates(user)` at ~595 | Confirm unique target and resulting license callback, no stale pending-state race |
| `CUser::NotifyLicensesUpdated` | string-xref to `17LicensesUpdated_t` + `SendAppLicenseUpdates` | `src/patterns_x86_64.hpp:259-261` | `src/sdk/CUser.cpp:45-60` calls resolved address; `src/feats/packagepatch.cpp:131-173` cold-cache reconcile | Verify xref identifies same `CUser` method and callback publication on target client |
| `CUser::m_CompatManager` | x64 constructor-relative LEA displacement (starts `48 8D 83`) | `src/patterns_x86_64.hpp:262-268` | Optional address in `src/patterns.cpp:995`; precise 64-bit layout cannot be inferred from 32-bit | Confirm member offset and owning CUser instance before enabling dependent features |

**Critical discovery:** These entries **already exist in the fork's source**. Older
`docs/X86_64.md` says the license-refresh locators do not exist and runtime hot
reload is disabled, but the newer code includes locators and explicit execution paths.
We must test real runtime behavior instead of claiming either that the functions
are entirely unmapped or that hot reload is now proven.

## Guarded runtime flow in fork

1. `src/feats/hotreload.cpp` publishes immutable membership snapshots on configuration change,
   with appinfo publication and metadata safety checks.
2. `src/feats/packagepatch.cpp::processRuntimeRefresh` uses
   `LicenseRefreshPolicy::decide(markReady,processReady,unresolvedStateSafe,changed)`.
3. If capability incomplete or appinfo unresolved, the fork defers; it does not
   call an unresolved function pointer.
4. With valid `CUser*`, mark changes (`MarkLicenseAsChanged(user,0,true)`),
   then `ProcessPendingLicenseUpdates(user)` and commit processed generation only
   on success. Concurrent refresh is guarded by atomics and thread-local reentrancy.
5. The separate `CUser::notifyLicensesUpdated()` path publishes a callback
   after package-0 injection; when locator missing it returns false.

## Verification needed

- Offline: access real `steamrt64/steamclient.so` of the exact Steam Deck build.
  Run the fork's `make test-patterns-x86_64` and compare unique candidate
  addresses with independent disassembly/RTTI/string xrefs; *never* use the
  32-bit `ubuntu12_32` or `linux64` library as the audit source.
- Unit: coverage for unresolved locators, missing AppInfo, concurrent changes,
  restart-required fallback, and no invocation when a callback address is bad.
- Live: add and remove one test game while Steam runs, check in-client library and
  license callbacks, check Proton mapping, verify no Steam or Decky frontend crash.
- Diagnostics: collect only high-level outcomes (bound / skipped / pending /
  processed), Steam client hash/build and plugin state; no account secrets.

## Risks

- A locator matching uniquely does **not** establish a correct ABI or object layout.
- `steamclient.so` can change without altering visible Steam version UI.
- Some UI overview hooks and library-removal code remain incomplete, so license
  refresh alone may not produce a visible new game tile.
- Upstream binary should not be patched in-place without reproducible build
  provenance; use an isolated fork/branch to modify C++ and produce a test ZIP.

Upstream sources:
- https://github.com/ogb4n/slsteam-moon-x64/blob/main/src/patterns_x86_64.hpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/main/src/feats/packagepatch.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/main/src/sdk/CUser.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/main/src/feats/hotreload.cpp
- https://github.com/ogb4n/slsteam-moon-x64/blob/main/docs/X86_64.md
