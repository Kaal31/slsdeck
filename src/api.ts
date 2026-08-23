import { callable } from "@decky/api";

// ── Types ──────────────────────────────────────────────────────────────────
export interface SteamStatus {
  success: boolean;
  steamPath: string;
  stplugInDir: string;
  stplugInExists: boolean;
}

export interface ContentCheck {
  workshop: string;
  dlc: { included: number[]; missing: number[] };
}

export interface AddState {
  status?: string; // queued | checking | downloading | processing | installing | done | failed | cancelled
  currentApi?: string | null;
  bytesRead?: number;
  totalBytes?: number;
  api?: string;
  error?: string;
  success?: boolean;
  slssteam?: boolean;
  manifest?: boolean;
  overrides?: string;
  repointExe?: string; // set when a fix shipped a replacement exe (launch repoint)
  warning?: string;
  note?: string;
  contentCheckResult?: ContentCheck;
  apiErrors?: Record<string, { type: string; code?: number }>;
}

export interface InstalledScript {
  appid: number;
  gameName: string;
  filename: string;
  isDisabled: boolean;
  fileSize: number;
  modifiedDate: string;
  path: string;
}

export interface InstalledApp extends InstalledScript {
  source: "slssteam" | "lua" | "both";
}

export interface SearchResult {
  appid: number;
  name: string;
}

export interface ApiListItem {
  name: string;
  index: number;
}

export interface ApiKeyField {
  placeholder: string;
  label: string;
  sources: string[];
  hasKey: boolean;
  value: string;
}

// ── SLSsteam ────────────────────────────────────────────────────────────────
export interface SlsInstallState {
  status?: string; // queued | running | done | failed
  error?: string;
  log?: string;
  success?: boolean;
  installed?: boolean;
  injected?: boolean;
  needsDesktopMode?: boolean;
  percent?: number;
  returnCode?: number;
}

export interface SlsStatus {
  success: boolean;
  installed: boolean;
  libPath: string;
  injected: boolean;
  flatpak: boolean;
  configPath: string;
  configExists: boolean;
  additionalApps: number[];
  missingDeps: string[];
  clientFixRan?: boolean;
  injectionActive?: boolean;
  install: SlsInstallState;
}

export interface FixInfo {
  status: number;
  available: boolean;
  url?: string;
  mirrorEntries?: number;
  namesTried?: string[];
  nearMatches?: string[];
  file?: string;
  badge?: string;
  description?: string;
}

export interface LuatoolsFix { file: string; badge: string; type: string; source: string; url: string; description?: string }

// A record from the account-gated lua.tools fix catalog (/api/denuvo/fixes).
export interface LuatoolsCatalogFix {
  id: string;
  appid: number;
  name: string;
  build: string;
  manifest_id: string;
  depot_id: string;
  release_date: string;
  release_year: string;
  description?: string;
  has_manifest: boolean;
  has_fix: boolean;
  manifest_filename: string;
  fix_filename: string;
  size: number;
  url: string;
  tags: Array<string | Record<string, any>>;
}

export interface FixCheck {
  success: boolean;
  appid: number;
  gameName: string;
  genericFix: FixInfo;
  onlineFix: FixInfo;
  unsteamFix?: FixInfo;
  hypervisorFix?: FixInfo;
  ryuuFixes?: Array<{ file: string; badge: string; url: string; description?: string }>;
  luatoolsFixes?: LuatoolsFix[];
  luatoolsCatalog?: LuatoolsCatalogFix[];
  luatoolsAuthed?: boolean;
  luatoolsCatalogError?: string;
  error?: string;
}

export interface InstallPathResult {
  success: boolean;
  installPath?: string;
  installDir?: string;
  name?: string;
  error?: string;
}

export interface InstalledFix {
  appid: number;
  gameName: string;
  installPath: string;
  date: string;
  fixType: string;
  downloadUrl: string;
  filesCount: number;
  files: string[];
}


// ── Tokeer / Anti-Denuvo ──────────────────────────────────────────────────
export type TokeerChecks = { installed: boolean; prefix: boolean; hook: boolean; launchOpt: boolean; proton?: string | null };
export type TokeerVerifyResult = { success: boolean; code?: string; checks?: TokeerChecks; report?: any; output?: string; needsPrepare?: boolean; error?: string };
export const tokeerRuntimeStatus = callable<[], { success: boolean; installed: boolean; home?: string; missing?: string[]; defaultCooldownHours?: number }>("tokeer_runtime_status");
export type TokeerPreflightResult = { success: boolean; installed: boolean; appid?: number; gameName?: string; installPath?: string; failedCheck?: string; ambiguous?: boolean; candidates?: Array<{ appid: number; name: string }>; error?: string };
export const tokeerPreflight = callable<[appid?: number, gameName?: string], TokeerPreflightResult>("tokeer_preflight");
export const tokeerEnsureRuntime = callable<[], { success: boolean; installed?: boolean; updated?: boolean; skipped?: boolean; version?: string; latest?: string; home?: string; requiredProton?: string; error?: string }>("tokeer_ensure_runtime");
export const tokeerProtonStatus = callable<[], { success: boolean; installed: boolean; healthy?: boolean; partial?: boolean; name?: string; path?: string }>("tokeer_proton_status");
export const tokeerEnsureProton = callable<[force?: boolean], { success: boolean; installed?: boolean; healthy?: boolean; updated?: boolean; skipped?: boolean; name?: string; path?: string; requiredProton?: string; error?: string }>("tokeer_ensure_proton");
export const tokeerPrepare = callable<[appid: number], { success: boolean; output?: string; steamMayRestart?: boolean; error?: string }>("tokeer_prepare");
export const tokeerPrepareVerify = callable<[appid: number], TokeerVerifyResult & { phase?: string; prepare?: any; steamMayRestart?: boolean }>("tokeer_prepare_verify");
export const tokeerVerify = callable<[appid: number], TokeerVerifyResult>("tokeer_verify");
export const tokeerRedeem = callable<[code: string], { success: boolean; output?: string; needsPrepare?: boolean; error?: string }>("tokeer_redeem");

// ── Callables ──────────────────────────────────────────────────────────────
export const getSteamStatus = callable<[], SteamStatus>("get_steam_status");
export const hasLua = callable<[appid: number], { success: boolean; exists: boolean; slssteam?: boolean }>("has_lua");

export const startAdd = callable<[appid: number], { success: boolean; error?: string }>("start_add");
export const getAddStatus = callable<[appid: number], { success: boolean; state: AddState }>("get_add_status");
export const cancelAdd = callable<[appid: number], { success: boolean }>("cancel_add");
export const popAddEvents = callable<[], { success: boolean; events: Array<{ appid: number; name: string; status: string; success: boolean; autoDownload?: boolean; error?: string }> }>("pop_add_events");

export const deleteLua = callable<[appid: number], { success: boolean; count: number; slssteamRemoved?: boolean }>("delete_lua");
export const purgeAllAdded = callable<[], { success: boolean; removed: number; total: number }>("purge_all_added");
export const getInstalledLua = callable<[], { success: boolean; scripts: InstalledScript[]; error?: string }>("get_installed_lua");
export const getEverAdded = callable<[], { success: boolean; appids: number[] }>("get_ever_added");
export const getInstalledApps = callable<[], { success: boolean; apps: InstalledApp[]; error?: string }>("get_installed_apps");

export const searchGames = callable<[query: string, limit: number], { success: boolean; results: SearchResult[] }>("search_games");

export const getApiList = callable<[], { success: boolean; apis: ApiListItem[] }>("get_api_list");
export const fetchFreeApis = callable<[], { success: boolean; count?: number; error?: string }>("fetch_free_apis");
export const getApiKey = callable<[], { success: boolean; apiKey: string }>("get_api_key");
export const setApiKey = callable<[apiKey: string], { success: boolean }>("set_api_key");

// multiple keys (one per source)
export const getApiKeyFields = callable<[], { success: boolean; fields: ApiKeyField[]; error?: string }>("get_api_key_fields");
export const getApiKeys = callable<[], { success: boolean; keys: Record<string, string> }>("get_api_keys");
export const setApiKeyFor = callable<[placeholder: string, apiKey: string], { success: boolean }>("set_api_key_for");

// ryuu API key (X-Auth-Key for gated denuvo/fix downloads)
export const getRyuuKey = callable<[], { success: boolean; key: string }>("get_ryuu_key");
export const setRyuuKey = callable<[key: string], { success: boolean }>("set_ryuu_key");

// online-fix username (blank = auto: the Steam display name)
export const getOnlineUsername = callable<[], { success: boolean; username: string; auto: string }>("get_online_username");
export const setOnlineUsername = callable<[username: string], { success: boolean }>("set_online_username");

// CloudRedirect (cloud saves for added games)
export const crGetEnabled = callable<[], { success: boolean; enabled: boolean; present: boolean }>("cr_get_enabled");
export const crSetEnabled = callable<[enabled: boolean], { success: boolean; enabled?: boolean; error?: string }>("cr_set_enabled");
export const crOpenApp = callable<[], { success: boolean; error?: string }>("cr_open_app");
export const crEnsureInstalledAuto = callable<[], { success: boolean; installed: boolean; capped?: boolean; log?: string }>("cr_ensure_installed_auto");
export const crEnsureInstalled = callable<[], { success: boolean; installed: boolean; log?: string }>("cr_ensure_installed");
export const crIconPath = callable<[], { success: boolean; path: string }>("cr_icon_path");
export const crArtwork = callable<[], { success: boolean; cover: string; capsule: string; hero: string; logo: string }>("cr_artwork");
export const crGetShortcut = callable<[], { success: boolean; appId: number }>("cr_get_shortcut");
export const crSetShortcut = callable<[appId: number], { success: boolean }>("cr_set_shortcut");

// ── OpenSave (cloud saves engine) ───────────────────────────────────────────
export type OsState = "synced" | "syncing" | "conflict" | "idle" | "untracked" | "unavailable" | "unknown";
export const osStatus = callable<
  [],
  { success: boolean; installed: boolean; version?: string; latestTag?: string; updateAvailable?: boolean;
    daemonRunning?: boolean; provider?: string; providerConnected?: boolean; trackedGames?: number;
    conflicts?: number; flatpakInstalled?: boolean }
>("os_status");
export const osEnsureCli = callable<[force?: boolean], { success: boolean; installed?: boolean; updated?: boolean; version?: string; tag?: string; error?: string }>("os_ensure_cli");
export const osEnsureDaemon = callable<[], { success: boolean; running?: boolean; log?: string }>("os_ensure_daemon");
export const osScan = callable<[], { success: boolean; found?: number; error?: string }>("os_scan");
export const osSyncAll = callable<[], { success: boolean; error?: string }>("os_sync_all");
export const osSyncGame = callable<[appid: number], { success: boolean; error?: string; id?: string }>("os_sync_game");
export const osStatusGame = callable<
  [appid: number],
  { success: boolean; installed: boolean; tracked: boolean; state: OsState; snapshots?: number | null; name?: string; id?: string }
>("os_status_game");
export const osEnsureTracked = callable<[appid: number], { success: boolean; tracked?: boolean; id?: string; name?: string; error?: string }>("os_ensure_tracked");
export const osSnapshots = callable<
  [appid: number],
  { success: boolean; found?: boolean; snapshots?: Array<{ id: string; date: string; comment: string }>; id?: string }
>("os_snapshots");
export const osRollback = callable<[appid: number, snapId: string], { success: boolean; error?: string }>("os_rollback");
export const osConflicts = callable<[], { success: boolean; conflicts?: string[] }>("os_conflicts");
export const osResolve = callable<[appid: number, choice: string], { success: boolean; error?: string }>("os_resolve");
export const osExportAll = callable<[folder: string], { success: boolean; exported?: number; total?: number; folder?: string; note?: string; error?: string }>("os_export_all");
export const osCloudAuthStart = callable<[provider: string], { success: boolean; provider?: string; authUrl?: string; autoCallback?: boolean; error?: string }>("os_cloud_auth_start");
export const osCloudAuthCallback = callable<[code: string], { success: boolean; email?: string; error?: string }>("os_cloud_auth_callback");
export const osCloudDisconnect = callable<[], { success: boolean; error?: string }>("os_cloud_disconnect");
export const osCloudWebdav = callable<[url: string, username: string, password: string], { success: boolean; error?: string }>("os_cloud_webdav");
export const osCloudEnabled = callable<[enabled: boolean], { success: boolean; error?: string }>("os_cloud_enabled");
export const osCloudPushAll = callable<[], { success: boolean; uploaded?: number; note?: string; error?: string }>("os_cloud_push_all");
export const osRelayJoin = callable<[code: string], { success: boolean; error?: string }>("os_relay_join");
export const osRelayStatus = callable<[], { success: boolean; raw?: string }>("os_relay_status");
export const osRelayLeave = callable<[], { success: boolean; error?: string }>("os_relay_leave");
export const osDiagnostics = callable<
  [],
  { success: boolean; binPath: string; exists: boolean; executable: boolean; user: string;
    daemonUrl?: string; addrFile?: string; addrExists?: boolean;
    versionRc: number | null; versionOut: string; daemonRc: number | null; daemonOut: string; [k: string]: any }
>("os_diagnostics");

// ── dependency updates (latest-version + boot check) ────────────────────────
export type UpdateItem = { name: string; repo: string; heavy: boolean; current: string; latest: string; updateAvailable: boolean };
export const updatesCheck = callable<[], { success: boolean; items?: UpdateItem[]; updates?: UpdateItem[] }>("updates_check");
export const updatesUpdateAll = callable<[includeHeavy?: boolean], { success: boolean; updated?: string[]; skipped?: string[]; failed?: string[] }>("updates_update_all");
export const updatesUpdateOne = callable<[name: string, includeHeavy?: boolean], { success: boolean; name?: string; error?: string; flagOnly?: boolean }>("updates_update_one");
export const getAutoUpdate = callable<[], { success: boolean; enabled: boolean }>("get_auto_update");
export const setAutoUpdate = callable<[enabled: boolean], { success: boolean; enabled: boolean }>("set_auto_update");

// optional DLC (SLSsteam DlcData)
// hide Add/Fixes on games that are genuinely owned (not added by SLSsteam)
export const getGamesInQam = callable<[], { success: boolean; enabled: boolean }>("get_games_in_qam");
export const setGamesInQam = callable<[enabled: boolean], { success: boolean }>("set_games_in_qam");
export const getHideToolsQam = callable<[], { success: boolean; enabled: boolean }>("get_hide_tools_qam");
export const setHideToolsQam = callable<[enabled: boolean], { success: boolean }>("set_hide_tools_qam");
export const getShowReinstallQam = callable<[], { success: boolean; enabled: boolean }>("get_show_reinstall_qam");
export const setShowReinstallQam = callable<[enabled: boolean], { success: boolean }>("set_show_reinstall_qam");
export const getHideOnOwned = callable<[], { success: boolean; enabled: boolean }>("get_hide_on_owned");
export const setHideOnOwned = callable<[enabled: boolean], { success: boolean }>("set_hide_on_owned");
export const getDlcOwnedOnly = callable<[], { success: boolean; enabled: boolean }>("get_dlc_owned_only");
export const setDlcOwnedOnly = callable<[enabled: boolean], { success: boolean }>("set_dlc_owned_only");
export const getGroupCollection = callable<[], { success: boolean; enabled: boolean }>("get_group_collection");
export const setGroupCollection = callable<[enabled: boolean], { success: boolean }>("set_group_collection");

// library capsule badges + the injected library button bar
export const getBadgeOptions = callable<[], {
  success: boolean; sls: boolean; legit: boolean; denuvo: boolean;
  gamePage: boolean; onlineFix: boolean; fixed: boolean; library: boolean; storePage: boolean;
  nonSteam: boolean; nonSteamName: boolean;
}>("get_badge_options");
export const setBadgeOption = callable<[which: string, enabled: boolean], { success: boolean }>("set_badge_option");
// Non-Steam shortcut app names, derived from the target exe folder in shortcuts.vdf.
export const getNonSteamApps = callable<[], { success: boolean; apps: Record<string, string> }>("get_nonsteam_apps");
export const getLibraryButtons = callable<[], { success: boolean; enabled: boolean }>("get_library_buttons");
export const setLibraryButtons = callable<[enabled: boolean], { success: boolean }>("set_library_buttons");

// Denuvo detection (Steam store drm_notice, cached; seeded from ryuu bypass fixes).
// This build can't bypass Denuvo — the badge is a warning that a game won't work.
export const denuvoKnown = callable<[], { success: boolean; denuvo: number[] }>("denuvo_known");
export const denuvoResolve = callable<[appids: number[]], { success: boolean; denuvo: number[] }>("denuvo_resolve");

// auto-apply fixes after an add completes
export const getAutoFixPending = callable<[], { success: boolean; appids: number[] }>("auto_fix_pending_get");
export const addAutoFixPending = callable<[appid: number], { success: boolean }>("auto_fix_pending_add");
export const removeAutoFixPending = callable<[appid: number], { success: boolean }>("auto_fix_pending_remove");
export const getAutoFix = callable<[], { success: boolean; enabled: boolean }>("get_auto_fix");
export const setAutoFix = callable<[enabled: boolean], { success: boolean }>("set_auto_fix");

// netsock multiplayer patch (manual-only; never auto-applied)
export interface NetsockStatus {
  success: boolean;
  installed: boolean;
  path: string;
  launchOption: string;
  enabled: boolean;
  known: boolean;
  knownName: string;
}
export const netsockStatus = callable<[appid: number], NetsockStatus>("netsock_status");
export const netsockSet = callable<[appid: number, enabled: boolean], NetsockStatus>("netsock_set");
export const netsockCompatible = callable<[], { success: boolean; games: Array<{ appid: number; name: string }> }>("netsock_compatible");

export const getDlcOption = callable<[], { success: boolean; enabled: boolean }>("get_dlc_option");

export const getPinStatus = callable<[appid: number], { success: boolean; pinned: boolean; buildid?: string; depots?: { [depot: string]: string } }>("get_pin_status");
export const pinGame = callable<[appid: number], { success: boolean; depots?: number; error?: string }>("pin_game");
export const unpinGame = callable<[appid: number], { success: boolean; changed?: boolean }>("unpin_game");
export const getPinOnFix = callable<[], { success: boolean; enabled: boolean }>("get_pin_on_fix");
export const setPinOnFix = callable<[enabled: boolean], { success: boolean }>("set_pin_on_fix");
export const getAutoApply = callable<[], { success: boolean; enabled: boolean }>("get_auto_apply");
export const setAutoApply = callable<[enabled: boolean], { success: boolean }>("set_auto_apply");
// Launch-target repoint: point Steam at the game's real (often nested) exe.
export const getMainExe = callable<
  [appid: number],
  { success: boolean; exe?: string; dir?: string; isShipping?: boolean; error?: string }
>("get_main_exe");
// SmokeAPI DLC unlocker (steam_api proxy).
export const smokeapiStatus = callable<
  [appid: number],
  { success: boolean; installed?: boolean; supported?: boolean; notInstalled?: boolean; error?: string }
>("smokeapi_status");
export const smokeapiInstall = callable<
  [appid: number],
  { success: boolean; installed?: string[]; overrides?: string; tag?: string; skippedLauncher?: boolean; error?: string }
>("smokeapi_install");
export const smokeapiRemove = callable<[appid: number], { success: boolean; restored?: number; error?: string }>("smokeapi_remove");
// Extra DLC unlockers: CreamAPI (Steam DLC fallback) + Uplay R1/R2 (Ubisoft DLC).
export type UnlockerKind = "cream" | "uplayr1" | "uplayr2";
type UnlockerState = { success: boolean; installed?: boolean; supported?: boolean; error?: string };
export const dlcUnlockersStatus = callable<
  [appid: number],
  { success: boolean; notInstalled?: boolean; cream?: UnlockerState; uplayr1?: UnlockerState; uplayr2?: UnlockerState; error?: string }
>("dlc_unlockers_status");
export const dlcUnlockerInstall = callable<
  [appid: number, kind: UnlockerKind],
  { success: boolean; installed?: string[]; overrides?: string; tag?: string; label?: string; dlcCount?: number; unlockAll?: boolean; notSupported?: boolean; error?: string }
>("dlc_unlocker_install");
// ── DLC content via DepotDownloader ────────────────────────────────────────
// plan() detects the installed platform/unlocker from disk and reports what it
// would fetch AND what it is excluding, so "nothing happened" is never silent.
export interface DlcDepotRec { depot: string; gid: string; oslist?: string; size?: number; hasKey?: boolean; gidSource?: string }
export interface DlcDepotPlan {
  success: boolean;
  appid?: number;
  name?: string;
  // Why the result is what it is: something to fetch, no DLC at all, already
  // up to date, entitlement-only (no files exist), or blocked (files exist but
  // we lack the key / they are for another platform).
  outcome?: "fetch" | "no-dlc" | "up-to-date" | "entitlement-only" | "blocked";
  target?: {
    installed?: boolean; installPath?: string; platform?: string; unlocker?: string;
    libraries?: Array<{ file: string; platform: string; family: string }>;
    conflict?: string; note?: string;
  };
  fetch?: Array<{ appid: number; depots: DlcDepotRec[]; bytes: number }>;
  skipped?: Array<{ dlc: number; depot: string; reason: string }>;
  entitlement?: Array<{ appid: number; reason: string }>;
  bytes?: number;
  warnings?: string[];
  error?: string;
}
export const dlcDepotPlan = callable<[appid: number], DlcDepotPlan>("dlc_depot_plan");
export const dlcDepotStart = callable<[appid: number, dlcAppids?: number[]], { success: boolean; error?: string }>("dlc_depot_start");
// A keepable library of builds: gids + manifest binaries + depot keys, stored
// so a build stays rebuildable after Hubcap/mirrors stop serving it. Rides along
// in the survival archive, so it survives plugin removal.
export const buildArchiveAdd = callable<[appid: number, buildid: string, gidsJson?: string, date?: string, name?: string], { success: boolean; depots?: number; manifests?: number; keys?: number; missingManifests?: string[]; complete?: boolean; error?: string }>("build_archive_add");
export const buildArchiveList = callable<[appid?: number], { success: boolean; builds?: any[]; count?: number; error?: string }>("build_archive_list");
export const buildArchiveRemove = callable<[appid: number, buildid: string], { success: boolean; removedManifests?: number; deactivated?: { was?: string; unpinned?: boolean; clearLaunchOptions?: boolean; restoreLaunchOptions?: string; resetFiles?: boolean }; error?: string }>("build_archive_remove");

// Per-game archive entry. Declarative: it records what a game is SUPPOSED to
// look like (which builds are kept, which fixes it wants, its launch args and
// Proton tool) — never copies of the payloads. Toggling a fix flag here changes
// no files; it decides what a restore should try to re-apply.
export interface ArchivedBuild {
  buildid: string; date?: string; gids?: Record<string, string>; keys?: Record<string, string>;
  manifests?: string[]; missingManifests?: string[]; archivedOn?: string; archivedAt?: number;
}
export interface ArchivedFix {
  key: string; fixType: string; downloadUrl: string; date?: string;
  files?: number; wanted?: boolean; missing?: boolean; appliedAt?: string;
}
export interface ArchiveEntry {
  appid: number; name: string;
  builds: ArchivedBuild[]; buildCount: number;
  fixes: ArchivedFix[]; fixCount: number; wantedFixes: number;
  launchOptions: string; compatTool: string; dlcFiles: number; updatedOn: string;
  // Which archived build this game is currently held to ("" = none).
  activeBuild: string;
}
export const archiveIsBuild = callable<[appid: number, buildid: string], { success: boolean; archived?: boolean; active?: boolean; activeBuild?: string }>("archive_is_build");
export const archiveActivate = callable<[appid: number, buildid: string, launchOptionsBefore?: string | null], { success: boolean; activeBuild?: string; error?: string }>("archive_activate");
export const archiveDeactivate = callable<[appid: number, reset?: boolean], { success: boolean; was?: string; unpinned?: boolean; clearLaunchOptions?: boolean; restoreLaunchOptions?: string; restoredCompatTool?: string; resetFiles?: boolean; error?: string }>("archive_deactivate");
export const archiveReconcile = callable<[appid: number, apply?: boolean], { success: boolean; active?: string; installed?: boolean; waiting?: string; skipped?: string; actions?: string[]; todo?: string[]; wantLaunchOptions?: string; wantCompatTool?: string; pinnedOk?: boolean; dlcPending?: boolean; error?: string }>("archive_reconcile");
export const archiveRemoveGame = callable<[appid: number], { success: boolean; builds?: number; removedManifests?: number; deactivated?: { was?: string; unpinned?: boolean; clearLaunchOptions?: boolean; restoreLaunchOptions?: string; resetFiles?: boolean }; error?: string }>("archive_remove_game");
export const archiveActivateGame = callable<[appid: number, launchOptionsBefore?: string | null], { success: boolean; activeBuild?: string; chosen?: string; ofBuilds?: number; replaced?: string; error?: string }>("archive_activate_game");
export const archiveReconcileAll = callable<[apply?: boolean], { success: boolean; checked?: number; results?: Array<{ success?: boolean; appid: number; active?: string; installed?: boolean; waiting?: string; actions?: string[]; todo?: string[]; wantLaunchOptions?: string }>; error?: string }>("archive_reconcile_all");
export const archiveEntries = callable<[], { success: boolean; entries?: ArchiveEntry[]; count?: number; error?: string }>("archive_entries");
export const archiveSnapshotGame = callable<[appid: number, launchOptions?: string | null, compatTool?: string, name?: string], { success: boolean; fixes?: number; dlcFiles?: number; error?: string }>("archive_snapshot_game");
export const archiveSetFixWanted = callable<[appid: number, key: string, wanted: boolean], { success: boolean; wanted?: boolean; error?: string }>("archive_set_fix_wanted");
export const archiveForgetFix = callable<[appid: number, key: string], { success: boolean; removed?: number; error?: string }>("archive_forget_fix");
export const archivePendingReapply = callable<[appid: number], { success: boolean; pending?: ArchivedFix[]; count?: number; error?: string }>("archive_pending_reapply");
export const dlcDepotRemove = callable<[appid: number, alsoUnlock?: boolean], { success: boolean; removed?: number; failed?: string[]; noLog?: boolean; error?: string }>("dlc_depot_remove");

export const dlcUnlockerRemove = callable<
  [appid: number, kind: UnlockerKind],
  { success: boolean; restored?: number; error?: string }
>("dlc_unlocker_remove");
// HVAuto (hypervisor crack) — build-first pipeline.
export const hvAutoStatus = callable<
  [appid: number],
  { success: boolean; found?: boolean; name?: string; buildid?: string; hrefs?: string[]; badges?: string[]; resolve?: { status?: string; buildid?: string; currentBuildid?: string; message?: string }; error?: string }
>("hv_auto_status");
export const hvAutoApply = callable<
  [appid: number, href?: string],
  { success: boolean; buildid?: string; pinned?: boolean; buildStatus?: string; currentBuildid?: string; installed?: number; protonTool?: string; activateHv?: boolean; note?: string; needsManual?: boolean; url?: string; notFound?: boolean; error?: string }
>("hv_auto_apply");
// CrakFiles (general DRM crack) — build-matched.
export const crakStatus = callable<
  [appid: number],
  { success: boolean; found?: boolean; name?: string; buildid?: string; hrefs?: string[]; badges?: string[]; resolve?: { status?: string }; error?: string }
>("crak_status");
export const crakApply = callable<
  [appid: number, href?: string],
  { success: boolean; buildid?: string; pinned?: boolean; buildStatus?: string; installed?: number; badges?: string[]; note?: string; needsManual?: boolean; url?: string; notFound?: boolean; error?: string }
>("crak_apply");
// Apply a crack the user downloaded by hand (host blocked auto-download).
export const crakApplyLocal = callable<
  [appid: number, archivePath: string],
  { success: boolean; installed?: number; note?: string; error?: string }
>("crak_apply_local");
export const hvApplyLocal = callable<
  [appid: number, archivePath: string],
  { success: boolean; installed?: number; protonTool?: string; activateHv?: boolean; note?: string; error?: string }
>("hv_apply_local");

// User-imported custom fixes / manifests (bound to a specific game).
export interface CustomItem { id: string; label: string; sizeMB?: number }
export interface CustomGameGroup { appid: number; name?: string; count: number; items: CustomItem[] }
export const customClassify = callable<[path: string], { success: boolean; kind?: "fix" | "manifest"; error?: string }>("custom_classify");
export const customImport = callable<
  [appid: number, path: string, forcedKind?: string, label?: string],
  { success: boolean; kind?: "fix" | "manifest"; id?: string; label?: string; activated?: boolean; error?: string }
>("custom_import");
export const customListFixes = callable<[appid: number], { success: boolean; items?: CustomItem[]; error?: string }>("custom_list_fixes");
export const customListManifests = callable<[appid: number], { success: boolean; items?: CustomItem[]; error?: string }>("custom_list_manifests");
export const customListAllFixes = callable<[], { success: boolean; games?: CustomGameGroup[]; error?: string }>("custom_list_all_fixes");
export const customListAllManifests = callable<[], { success: boolean; games?: CustomGameGroup[]; error?: string }>("custom_list_all_manifests");
export const customApplyFix = callable<[appid: number, fixId: string], { success: boolean; installed?: number; note?: string; error?: string }>("custom_apply_fix");
export const customDeleteFixes = callable<[appid?: number], { success: boolean; error?: string }>("custom_delete_fixes");
export const customDeleteManifests = callable<[appid?: number], { success: boolean; error?: string }>("custom_delete_manifests");
export const getBackupCustom = callable<[], { success: boolean; enabled: boolean }>("get_backup_custom");
export const setBackupCustom = callable<[enabled: boolean], { success: boolean }>("set_backup_custom");

// CreamySteamy — compile a version-matched libsteam_api.so proxy for native-Linux games.
export const creamyStatus = callable<[appid: number], { success: boolean; supported?: boolean; installed?: boolean; haveToolchain?: boolean; notInstalled?: boolean; error?: string }>("creamy_status");
export const creamyHaveToolchain = callable<[], { success: boolean; have?: boolean }>("creamy_have_toolchain");
export const creamyEnsureToolchain = callable<[], { success: boolean; zig?: string; cached?: boolean; error?: string }>("creamy_ensure_toolchain");
export const creamyDeploy = callable<[appid: number], { success: boolean; installed?: number; dlcCount?: number; note?: string; notSupported?: boolean; error?: string }>("creamy_deploy");

// SteamStub DRM removal (Steamless AIO).
export const steamlessStatus = callable<[appid: number], { success: boolean; supported?: boolean; hasStub?: boolean; installed?: boolean; exe?: string; notInstalled?: boolean; error?: string }>("steamless_status");
export const steamlessUnstub = callable<[appid: number], { success: boolean; exe?: string; note?: string; notStub?: boolean; log?: string; error?: string }>("steamless_unstub");

// Build history / rollback.
export interface BuildEntry { id: string; gids: Record<string, string>; buildid?: string; source?: string; savedAt?: number; current?: boolean }
export const buildHistoryList = callable<[appid: number], { success: boolean; items?: BuildEntry[]; error?: string }>("build_history_list");
export const buildHistoryRollback = callable<[appid: number, entryId: string], { success: boolean; changed?: boolean; unsupported?: boolean; buildid?: string; error?: string }>("build_history_rollback");
export const buildHistoryClear = callable<[appid: number], { success: boolean; error?: string }>("build_history_clear");

// Manifest age (Hubcap usage dashboard already exists in Settings).
export const manifestAge = callable<[appid: number], { success: boolean; ageSec?: number; installed?: boolean }>("manifest_age");
export const getAutoRepoint = callable<[], { success: boolean; enabled: boolean }>("get_auto_repoint");
export const setAutoRepoint = callable<[enabled: boolean], { success: boolean }>("set_auto_repoint");
// slsteam-moon live achievements (config.yaml Achievements). `moon` = engine supports it.
export const getAchievements = callable<[], { success: boolean; enabled: boolean; present?: boolean; moon?: boolean }>("get_achievements");
export const setAchievements = callable<[enabled: boolean], { success: boolean; enabled?: boolean }>("set_achievements");
// Pin the game to a fix's manifest build without applying (build-accurate flow).
export interface PinResult {
  success: boolean;
  pinned: boolean;
  source?: string;
  changed?: boolean; // did the pin actually change (build is different/new)?
  wasPinned?: boolean;
  error?: string;
  unsupported?: boolean;
}
export const pinForFix = callable<[appid: number], PinResult>("pin_for_fix");
// Pin to a SPECIFIC lua.tools fix's build (its own manifest) — accurate per-fix.
export const pinForLuatoolsFix = callable<[appid: number, fixId: string], PinResult>(
  "pin_for_luatools_fix"
);

// lua.tools account (Discord bot-code sign-in) — enables pulling a game's
// manifest .lua (build to pin) directly. Falls back to Hubcap key → ~/Downloads.
export interface LuatoolsStatus { success: boolean; authed: boolean; user?: { name?: string; email?: string }; supporter?: string; usage?: Record<string, number>; debug?: Record<string, any> }
export const luatoolsStatus = callable<[], LuatoolsStatus>("luatools_status");
export const luatoolsRedeem = callable<[code: string], { success: boolean; user?: { name?: string }; error?: string }>("luatools_redeem");
export const luatoolsOauthStart = callable<[], { success: boolean; url?: string; error?: string }>("luatools_oauth_start");
export const luatoolsOauthStatus = callable<[], { success: boolean; done: boolean; authed: boolean; error?: string }>("luatools_oauth_status");
export const luatoolsOauthCancel = callable<[], { success: boolean }>("luatools_oauth_cancel");
export const luatoolsSignout = callable<[], { success: boolean }>("luatools_signout");
export const luatoolsListFixes = callable<
  [appid: number],
  { success: boolean; authed?: boolean; fixes?: LuatoolsCatalogFix[]; error?: string }
>("luatools_list_fixes");
export const luatoolsListAllFixes = callable<
  [],
  { success: boolean; authed?: boolean; listings?: any[]; error?: string }
>("luatools_list_all_fixes");
export const applyLuatoolsFix = callable<
  [appid: number, fixId: string, installPath: string, manifestId: string, depotId: string, fixType: string, gameName: string],
  { success: boolean; error?: string }
>("apply_luatools_fix");
export const pinSource = callable<[appid: number], { success: boolean; source: string }>("pin_source");
// Live Hubcap manifest-generation quota (single / bundle / workshop).
export interface HubcapQuota { usage: number; limit: number; remaining: number }
export interface HubcapUsage {
  single?: HubcapQuota;
  bundle?: HubcapQuota;
  workshop?: HubcapQuota;
  custom_limits?: any;
  steam_service_ready?: boolean;
}
export const hubcapUsage = callable<
  [],
  { success: boolean; usage?: HubcapUsage; error?: string; status?: number }
>("hubcap_usage");
export const hubcapWorkshopManifest = callable<
  [appid: number],
  { success: boolean; path?: string; bytes?: number; error?: string; status?: number }
>("hubcap_workshop_manifest");
export const getWrapperOption = callable<[], { success: boolean; skip: boolean }>("get_wrapper_option");
export const setWrapperOption = callable<[skip: boolean], { success: boolean }>("set_wrapper_option");
export const setDlcOption = callable<[enabled: boolean], { success: boolean }>("set_dlc_option");

// game-page bar style: "row" (compact button row) or "panel" (titled box)
export type GameBarStyle = "row" | "panel";
export const getGameBarStyle = callable<[], { success: boolean; style: GameBarStyle }>("get_gamebar_style");
export const setGameBarStyle = callable<[style: GameBarStyle], { success: boolean }>("set_gamebar_style");

// floating buttons on game/store pages (off by default; sidebar is primary)
export const getFloatingOption = callable<[], { success: boolean; enabled: boolean }>("get_floating_option");
export const setFloatingOption = callable<[enabled: boolean], { success: boolean }>("set_floating_option");
export const getStoreDisabled = callable<[], { success: boolean; disabled: boolean }>("get_store_disabled");
export const setStoreDisabled = callable<[disabled: boolean], { success: boolean }>("set_store_disabled");

// SLSsteam management
export const getSlssteamStatus = callable<[], SlsStatus>("get_slssteam_status");
export const systemStatus = callable<[], { success: boolean; engine: string; engineInstalled: boolean; foreignEngine: boolean; foreignName: string; cloudredirect: boolean; injected: boolean }>("system_status");
export const disableForeignEngines = callable<[], { success: boolean; foreign?: boolean; foreignName?: string; disabled?: string[]; notes?: string[] }>("disable_foreign_engines");
export const installSlssteam = callable<[], { success: boolean; error?: string; missingDeps?: string[] }>("install_slssteam");
export const getSlssteamInstallStatus = callable<[], { success: boolean; state: SlsInstallState }>("get_slssteam_install_status");
export const reloadSteamBackend = callable<[], { success: boolean; error?: string }>("reload_steam");
export const activateInjection = callable<[], { success: boolean; error?: string; steamSh?: string; backup?: string }>("activate_injection");
export const deactivateInjection = callable<[], { success: boolean; error?: string }>("deactivate_injection");
export const getDiagnostics = callable<[], any>("get_diagnostics");
export const runClientFix = callable<[force?: boolean], { success: boolean; error?: string; skipped?: boolean; reason?: string }>("run_client_fix");
export const clientFixNeeded = callable<[], { success: boolean; needed?: boolean; reason?: string }>("client_fix_needed");
// SLSsteam config.yaml validator/healer. `analyze` writes nothing; `heal`
// repairs in place after backing the file up.
export const slsConfigHealth = callable<[], { success: boolean; present?: boolean; issues?: string[]; count?: number; changed?: boolean; error?: string }>("sls_config_health");
export const healSlsConfig = callable<[], { success: boolean; issues?: string[]; count?: number; changed?: boolean; backup?: string; error?: string }>("heal_sls_config");
export const crProviderStatus = callable<[], { success: boolean; configured?: boolean; providers?: string[] }>("cr_provider_status");
export const crInstallStatus = callable<[], { success: boolean; installed: boolean; healthy?: boolean; appInstalled?: boolean; moonHookInstalled?: boolean; allHookLocationsValid?: boolean; partial?: boolean }>("cr_install_status");
export const fixStuckUpdate = callable<[appid: number], { success: boolean; copied?: number; note?: string; error?: string }>("fix_stuck_update");
export const injectionHealth = callable<[], { success: boolean; installed: boolean; active: boolean }>("injection_health");
export const refreshPatterns = callable<[], {
  success?: boolean; present: boolean; helperPath: string; clientVersion: string;
  supportedClient: string; clientMatches: boolean | null; returncode?: number;
  output?: string[]; message?: string;
}>("refresh_patterns");
export const getAutoDownload = callable<[], { success: boolean; enabled: boolean }>("get_auto_download");
export const setAutoDownload = callable<[enabled: boolean], { success: boolean }>("set_auto_download");

// ── DLC + cloud toggles ─────────────────────────────────────────────────────
export const getAutoAddDlc = callable<[], { success: boolean; enabled: boolean }>("get_auto_add_dlc");
export const setAutoAddDlc = callable<[enabled: boolean], { success: boolean; enabled?: boolean; settingSaved?: boolean; error?: string }>("set_auto_add_dlc");
export const getDisableCloud = callable<[], { success: boolean; enabled: boolean }>("get_disable_cloud");
export const setDisableCloud = callable<[enabled: boolean], { success: boolean }>("set_disable_cloud");
export const getDisableDlcUnlockOwned = callable<[], { success: boolean; enabled: boolean }>("get_disable_dlc_unlock_owned");
export const setDisableDlcUnlockOwned = callable<[enabled: boolean, ownedAppids?: number[]], { success: boolean; blacklisted?: number; error?: string }>("set_disable_dlc_unlock_owned");
export const resolveDlc = callable<[appid: number], { appid: number; isDlc: boolean; base: number; dlcs: number[] }>("resolve_dlc");
export const getCheckEngineUpdates = callable<[], { success: boolean; enabled: boolean }>("get_check_engine_updates");
export const setCheckEngineUpdates = callable<[enabled: boolean], { success: boolean }>("set_check_engine_updates");
export const getCheckHeadcrabUpdates = callable<[], { success: boolean; enabled: boolean }>("get_check_headcrab_updates");
export const setCheckHeadcrabUpdates = callable<[enabled: boolean], { success: boolean }>("set_check_headcrab_updates");

// ── Build-picker ────────────────────────────────────────────────────────────
export interface BuildItem { buildid: string; date: string; isCurrent?: boolean }
export interface DepotManifests { depot: string; gids: { gid: string; date: string; source: string; buildid?: string }[] }
export const bpListBuilds = callable<[appid: number], { success: boolean; appid: number; builds: BuildItem[]; pinned: boolean; error?: string }>("bp_list_builds");
export const bpListDepotManifests = callable<[appid: number], { success: boolean; appid: number; depots: DepotManifests[]; note?: string; error?: string }>("bp_list_depot_manifests");
export const bpListDepotManifestsMerged = callable<[appid: number, scraped: string], { success: boolean; appid: number; depots: DepotManifests[]; note?: string; error?: string }>("bp_list_depot_manifests_merged");
export const bpApplyBuild = callable<[appid: number, buildid: string, date?: string, primaryGids?: string], { success: boolean; status?: string; error?: string }>("bp_apply_build");
export const bpApplyManifests = callable<[appid: number, depotGids: Record<string, string>], { success: boolean; error?: string }>("bp_apply_manifests");

// ── v2 DepotDownloader (older-build / content-DLC download) ──────────────────
export const depotdlStatus = callable<[], { success: boolean; available: boolean }>("depotdl_status");
export const depotdlDownloadBuild = callable<[appid: number, buildid: string], { success: boolean; error?: string }>("depotdl_download_build");
export const depotdlDownloadBuildGids = callable<[appid: number, buildid: string, gids: string], { success: boolean; error?: string }>("depotdl_download_build_gids");
export const depotdlDownloadDlc = callable<[appid: number], { success: boolean; error?: string }>("depotdl_download_dlc");
export type DepotDownloadItem = { depot: string; manifest: string; kind: "build" | "dlc-candidate" };
export type DepotDownloadJob = {
  appid: number; status: string; percent: number; op?: string; error?: string;
  plannedDepots?: DepotDownloadItem[]; currentDepot?: string; currentManifest?: string;
  completedDepots?: string[]; failedDepots?: string[]; depotDone?: number; depotTotal?: number;
  enrichmentStatus?: "running" | "done" | "unavailable";
  depotMetadata?: Record<string, { kind: string; confidence: string; source: string; dlcAppid?: number; fromAppid?: number; name?: string; os?: string; language?: string }>;
  dlcAppids?: number[];
};
export const depotdlQueue = callable<[], { success: boolean; items: DepotDownloadJob[] }>("depotdl_queue");
export const ensureAllDlcKeys = callable<[appid: number], { success: boolean; keys: number; source: string }>("ensure_all_dlc_keys");

export const triggerSteamInstall = callable<[appid: number, library?: number], { success: boolean; error?: string }>("trigger_steam_install");
export const validateSteamApp = callable<[appid: number], { success: boolean; error?: string }>("validate_steam_app");
export const popInjectionEvents = callable<[], { success: boolean; events: { kind: string; message: string }[] }>("pop_injection_events");
export const getAutoReinject = callable<[], { success: boolean; enabled: boolean }>("get_auto_reinject");
export const setAutoReinject = callable<[enabled: boolean], { success: boolean }>("set_auto_reinject");
export const getAutoClientRepin = callable<[], { success: boolean; enabled: boolean }>("get_auto_client_repin");
export const setAutoClientRepin = callable<[enabled: boolean], { success: boolean }>("set_auto_client_repin");
export const getCheckDependenciesOnBoot = callable<[], { success: boolean; enabled: boolean }>("get_check_dependencies_on_boot");
export const setCheckDependenciesOnBoot = callable<[enabled: boolean], { success: boolean }>("set_check_dependencies_on_boot");

export const checkFixes = callable<[appid: number, gameName?: string], FixCheck>("check_fixes");
export const setOnlyUpdateOnLaunch = callable<[appid: number], { success: boolean; changed?: boolean; error?: string }>("set_only_update_on_launch");
export const getGameInstallPath = callable<[appid: number], InstallPathResult>("get_game_install_path");
export const appDownloadComplete = callable<[appid: number], { success: boolean; complete: boolean; stateFlags?: number; sizeOnDisk?: number }>("app_download_complete");
export const applyFix = callable<
  [appid: number, downloadUrl: string, installPath: string, fixType: string, gameName: string],
  { success: boolean; error?: string }
>("apply_fix");
export const getFixStatus = callable<[appid: number], { success: boolean; state: AddState }>("get_fix_status");
export const cancelFix = callable<[appid: number], { success: boolean }>("cancel_fix");
export const getInstalledFixes = callable<[], { success: boolean; fixes: InstalledFix[]; error?: string }>("get_installed_fixes");
export const unfix = callable<[appid: number, installPath: string, fixDate: string], { success: boolean; error?: string }>("unfix");
export const getUnfixStatus = callable<[appid: number], { success: boolean; state: AddState }>("get_unfix_status");

// ── Helpers ────────────────────────────────────────────────────────────────
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const IN_PROGRESS = new Set([
  "queued",
  "checking",
  "downloading",
  "processing",
  "installing",
  "extracting",
  "removing",
]);

/**
 * Restart the Steam client. Prefers the in-process SteamClient API (reliable in
 * gamemode); falls back to the backend best-effort restart.
 */
export async function reloadSteam(): Promise<void> {
  try {
    const sc: any = (window as any).SteamClient;
    if (sc?.User?.StartRestart) {
      sc.User.StartRestart(false);
      return;
    }
  } catch {
    /* fall through to backend */
  }
  try {
    await reloadSteamBackend();
  } catch {
    /* ignore */
  }
}

/** Detect the AppID of the game page currently shown in the library, if any. */
export function currentLibraryAppId(): number | null {
  try {
    const href = (window as any)?.location?.href || "";
    const m = String(href).match(/\/library\/app\/(\d+)/);
    if (m) return parseInt(m[1], 10);
  } catch {
    /* ignore */
  }
  return null;
}

// ── anti-Denuvo hypervisor (HV-Decky: local cpuid_fault_emulation build) ─────
// Rich status from the vendored HV-Decky backend. Fields are permissive since
// the backend returns a large object; the UI reads what it needs.
export interface HvModuleInfo {
  path: string;
  name: string;
  loaded: boolean;
  kernel_compatible: boolean;
  compatibility_message?: string;
}
export interface HvStatus {
  success: boolean;
  kernel_release?: string;
  is_steamos?: boolean;
  root?: boolean;
  setup_complete?: boolean;
  setup_mode?: string;
  headers_ready?: boolean;
  source_ready?: boolean;
  container_files_ready?: boolean;
  container_build_enabled?: boolean;
  compiler_name?: string;
  kernel_compiler?: string;
  expected_module?: string;
  modules?: HvModuleInfo[];
  automatic_modules?: HvModuleInfo[];
  manual_modules?: HvModuleInfo[];
  configured_module?: string;
  configured_automatic_module?: string;
  game_module_source?: string;
  game_watcher_mode?: string;
  games?: Record<string, boolean> | Array<{ appid: string; enabled: boolean }>;
  umip_disabled?: boolean;
  last_log?: string;
  podman_path?: string;
  pacman_path?: string;
  error?: string;
  [k: string]: any;
}
export type HvResult = { success: boolean; message?: string; error?: string; [k: string]: any };

export const hvStatus = callable<[], HvStatus>("hv_status");
export const hvSetup = callable<[mode: string], HvResult>("hv_setup");
export const hvBuild = callable<[], HvResult>("hv_build");
export const hvBuildContainer = callable<[], HvResult>("hv_build_container");
export const hvInstallDeps = callable<[], HvResult>("hv_install_deps");
export const hvDownload = callable<[], HvResult>("hv_download");
export const hvLoad = callable<[], HvResult>("hv_load");
export const hvUnload = callable<[], HvResult>("hv_unload");
export const hvLoadAuto = callable<[], HvResult>("hv_load_auto");
export const hvUnloadAuto = callable<[], HvResult>("hv_unload_auto");
export const hvTest = callable<[], HvResult>("hv_test");
export const hvNativeNotice = callable<[], { success: boolean; native?: boolean; show?: boolean; message?: string; [k: string]: any }>("hv_native_notice");
export const hvDismissNative = callable<[], { success: boolean }>("hv_dismiss_native");
export const hvUmipStart = callable<[], HvResult>("hv_umip_start");
export const hvUmipStop = callable<[], HvResult>("hv_umip_stop");
export const hvDisableUmip = callable<[], HvResult>("hv_disable_umip");
export const hvRestoreUmip = callable<[], HvResult>("hv_restore_umip");
export const hvReboot = callable<[], HvResult>("hv_reboot");
export const hvLog = callable<[], { success: boolean; log: string; error?: string }>("hv_log");
export const hvSetGame = callable<[appid: number, enabled: boolean], HvResult>("hv_set_game");
export const hvSetWatcherMode = callable<[mode: string], HvResult>("hv_set_watcher_mode");
export const hvSetGameSource = callable<[source: string], HvResult>("hv_set_game_source");
export const hvSetSourceDir = callable<[path: string], HvResult>("hv_set_source_dir");
export const hvSetSourceZip = callable<[path: string], HvResult>("hv_set_source_zip");
export const hvGetAutoload = callable<[], { success: boolean; enabled: boolean }>("hv_get_autoload");
export const hvSetAutoload = callable<[enabled: boolean], { success: boolean }>("hv_set_autoload");
export const hvProtonStatus = callable<[], { success: boolean; installed: boolean; toolName: string; tarballPresent: boolean; url: string; downloadStatus: string }>("hv_proton_status");
export interface ProtonDlState { status: string; percent: number; bytes: number; total: number; error: string }
export const hvProtonInstallStatus = callable<[], { success: boolean; state: ProtonDlState }>("hv_proton_install_status");
export const hvProtonGetUrl = callable<[], { success: boolean; url: string }>("hv_proton_get_url");
export const hvProtonSetUrl = callable<[url: string], { success: boolean }>("hv_proton_set_url");
export const hvProtonLocate = callable<[path: string], { success: boolean; started?: boolean; error?: string; installed?: boolean }>("hv_proton_locate");
export const hvInstallProton = callable<[], { success: boolean; toolName?: string; message?: string; error?: string; started?: boolean }>("hv_install_proton");
export const hvInstallProtonAuto = callable<[], { success: boolean; capped?: boolean; started?: boolean }>("hv_install_proton_auto");

// ── Steam Workshop mods (SteamCMD; installs to the game's workshop dir) ──────
export interface WsResolve { success: boolean; modid?: string; appid?: number; title?: string; isCollection?: boolean; children?: string[]; installed?: boolean; allowed?: boolean; error?: string }
export const wsResolve = callable<[text: string], WsResolve>("ws_resolve");
export const wsDownload = callable<[text: string], { success: boolean; job?: string; appid?: number; count?: number; title?: string; isCollection?: boolean; error?: string }>("ws_download");
export interface WsSearchItem { modid: string; title: string; appid: number; gameName?: string; preview?: string; subs?: number }
export const wsSearch = callable<[text: string, limit: number], { success: boolean; results: WsSearchItem[]; pool?: number; usedScrape?: boolean; hasKey?: boolean; note?: string }>("ws_search");
export const wsGetSteamKey = callable<[], { success: boolean; key: string }>("ws_get_steam_key");
export const wsSetSteamKey = callable<[key: string], { success: boolean }>("ws_set_steam_key");
export interface WsDlState { status?: string; current?: string; done?: number; total?: number; failed?: { modid: string; error: string }[]; success?: boolean; appid?: number; title?: string }
export const wsDownloadState = callable<[job: string], { success: boolean; state: WsDlState }>("ws_download_state");
export interface WsMod { modid: string; title?: string; enabled: boolean; sizeBytes: number; path: string }
export const wsListMods = callable<[appid: number], { success: boolean; appid: number; mods: WsMod[] }>("ws_list_mods");
export const wsListGames = callable<[], { success: boolean; games: { appid: number; modCount: number }[] }>("ws_list_games");
export const wsSetEnabled = callable<[appid: number, modid: string, enabled: boolean], { success: boolean; enabled?: boolean; error?: string }>("ws_set_enabled");
export const wsRemove = callable<[appid: number, modid: string], { success: boolean; removed?: boolean; error?: string }>("ws_remove");
export const wsEnsureSteamcmd = callable<[], { success: boolean; present?: boolean; error?: string }>("ws_ensure_steamcmd");

// ── Backup & restore (config, manifests, depot keys, luas, settings) ─────────
export const createBackup = callable<[destPath: string, includeKeys: boolean, includeSaves: boolean], { success: boolean; path?: string; fileCount?: number; saveCount?: number; sizeBytes?: number; files?: string[]; error?: string }>("create_backup");
export const restoreBackup = callable<[archivePath: string], { success: boolean; restoredCount?: number; skipped?: string[]; archivePath?: string; error?: string }>("restore_backup");
export interface BackupFile { path: string; name: string; sizeBytes: number; mtime: number }
export const listBackups = callable<[], { success: boolean; backups: { path: string; name: string; sizeBytes: number; mtime: number }[] }>("list_backups");

// ── Tools & per-game utilities ─────────────────────────────────────────────
// These backends all existed and worked but had no frontend reference, so
// nothing could reach them. Declared here so the Tools/GameTools sections can.
export const engineIsMoon = callable<[], { installed: boolean; moon: boolean }>("engine_is_moon");
export const ensureMoonEngine = callable<[], { success: boolean; changed?: boolean; error?: string }>("ensure_moon_engine");
export const provisionDepots = callable<[], { success: boolean; keys?: { written?: number }; manifestsCopied?: number }>("provision_depots");
export const provisionAndRestart = callable<[], { success: boolean; restarted?: boolean; error?: string }>("provision_and_restart");
export const downloadPreflight = callable<[appid: number], { success: boolean; ready?: boolean; failed?: string[] }>("download_preflight");
export const downloadDiagnosis = callable<[appid: number], { success: boolean; summary?: string }>("download_diagnosis");
export const clearPhantomInstall = callable<[appid: number], { success: boolean; cleared?: boolean }>("clear_phantom_install");
export const getStorageInfo = callable<[], { success: boolean; libraries?: any[]; drives?: any[] }>("get_storage_info");
export const cleanTempDownloads = callable<[], { success: boolean; cleanedMB?: number; cleanedFiles?: number }>("clean_temp_downloads");
export const syncAllAddedArt = callable<[overwrite: boolean], { success: boolean; synced?: number; count?: number }>("sync_all_added_art");
export const runSystemAudit = callable<[], { success: boolean; healthScore?: number; repairableCodes?: string[] }>("run_system_audit");
export const runFullSystemMaintenance = callable<[], { success: boolean; steps?: string[] }>("run_full_system_maintenance");
export const getUiSettings = callable<[], { success: boolean; settings?: Record<string, any> }>("get_ui_settings");
export const setUiSetting = callable<[key: string, value: any], { success: boolean }>("set_ui_setting");

// Per-game
export const listInstalledProtonTools = callable<[], { success: boolean; tools: string[] }>("list_installed_proton_tools");
export const getProtonMapping = callable<[appid: number], { success: boolean; toolName?: string; priority?: string; error?: string }>("get_proton_mapping");
export const setProtonMapping = callable<[appid: number, toolName: string, priority: string], { success: boolean; error?: string }>("set_proton_mapping");
export const removeProtonMapping = callable<[appid: number], { success: boolean; error?: string }>("remove_proton_mapping");
export const backupGameSaves = callable<[appid: number, destDir: string], { success: boolean; zipPath?: string; fileCount?: number; error?: string }>("backup_game_saves");
export const restoreGameSaves = callable<[appid: number, zipPath: string], { success: boolean; restoredFiles?: string[]; error?: string }>("restore_game_saves");
export const listGameSaveBackups = callable<[appid: number, destDir: string], { success: boolean; backups: { path: string; name: string; sizeMB: number; when: string }[] }>("list_game_save_backups");
export const repairGame = callable<[appid: number], { success: boolean; steps?: string[]; error?: string }>("repair_game");
export const patchGameOnlinefix = callable<[appid: number], { success: boolean; detectedFixes?: string[]; launchOption?: string; message?: string; error?: string }>("patch_game_onlinefix");
export const autoRepairSystem = callable<[], { success: boolean; repairs?: string[]; repairsDone?: string[]; errors?: string[] }>("auto_repair_system");
export const repairConflicts = callable<[], { success: boolean; removed?: string[]; notes?: string[]; changed?: boolean }>("repair_conflicts");
export const getNoInternetFix = callable<[], { success: boolean; enabled: boolean }>("get_no_internet_fix");
export const setNoInternetFix = callable<[enabled: boolean], { success: boolean }>("set_no_internet_fix");
export const noInternetFixBegin = callable<[appid: number], { success: boolean; stripped?: boolean; reason?: string }>("no_internet_fix_begin");
export const installLatestGeProton = callable<[], { success: boolean; tag?: string; installed?: boolean; message?: string; error?: string }>("install_latest_ge_proton");
export const checkMultiplayer = callable<[appid: number], {
  success: boolean;
  verdict?: "peer" | "official" | "single";
  headline?: string;
  detail?: string;
  anticheat?: string[];
  canFix?: boolean;
  fix?: "netsock" | "onlinefix";
  error?: string;
}>("check_multiplayer");
