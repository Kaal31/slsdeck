// Build-accurate apply orchestration.
//
// For a fix whose exact build is known (a manifest resolvable via lua.tools /
// Hubcap / ~/Downloads), the correct order is: pin the manifest to that build →
// let Steam update the game to it → apply the fix onto the matching build.
//
// Pin the fix's build, let Steam reconcile the installed depots with Moon's
// pinned target, and apply the fix only after the on-disk depot GIDs match.
import {
  appDownloadComplete,
  getGameInstallPath,
  getPinStatus,
  triggerSteamInstall,
  noInternetFixBegin,
  validateSteamApp,
} from "../api";

export type ApplyPhase =
  | "pinning"
  | "pin_failed"
  | "updating"
  | "awaiting_download"
  | "applying";

export interface BuildApplyHooks {
  appid: number;
  autoApply: boolean;
  onPhase: (phase: ApplyPhase, info?: { source?: string }) => void;
  // Starts the actual fix extraction (the existing applyFix / applyLuatoolsFix
  // + status watch). Called when the game is ready.
  doApply: () => Promise<void>;
  // Return true to abort the auto-poll loop (e.g. user cancelled / closed).
  shouldStop?: () => boolean;
  // Exact pin resolver — only source fixes with a paired manifest pass one.
  // Missing means universal/current-build apply, never generic manifest lookup.
  pinFn?: () => Promise<{ pinned: boolean; source?: string; changed?: boolean; error?: string }>;
}

export type BuildApplyResult = "applied" | "awaiting";

async function installed(appid: number): Promise<boolean> {
  try {
    const p = await getGameInstallPath(appid);
    return !!(p.success && p.installPath);
  } catch {
    return false;
  }
}

export async function isDownloadComplete(appid: number): Promise<boolean> {
  try {
    return !!(await appDownloadComplete(appid)).complete;
  } catch {
    return false;
  }
}

/** A pin is ready only when every pinned depot is installed at its exact GID. */
export function installedDepotsMatchPin(
  pinned: Record<string, string>, installed: Record<string, string>
): boolean {
  const entries = Object.entries(pinned);
  if (!entries.length) return false;
  return entries.every(([depot, gid]) =>
    depot in installed && String(installed[depot]) === String(gid)
  );
}

export async function isPinnedBuildReady(appid: number): Promise<boolean> {
  try {
    const [pin, download] = await Promise.all([getPinStatus(appid), appDownloadComplete(appid)]);
    return !!(pin.success && pin.pinned && download.success && download.complete &&
      installedDepotsMatchPin(pin.depots || {}, pin.installedDepots || {}));
  } catch {
    return false;
  }
}

export async function runBuildAccurateApply(h: BuildApplyHooks): Promise<BuildApplyResult> {
  // No paired manifest means this is a universal/local fix. Apply it to the
  // installed build; the backend may lock that current build after extraction.
  // Never run the generic game-manifest resolver from a fix apply path.
  if (!h.pinFn) {
    h.onPhase("applying");
    await h.doApply();
    return "applied";
  }
  // 1) Pin to the fix's build (lua.tools -> hubcap -> ~/Downloads). No-op if none.
  h.onPhase("pinning");
  let source = "none";
  let pinned = false;
  // Default true: if we can't tell, assume the build changed so we force an
  // update rather than silently applying onto a stale build.
  try {
    const pin = await h.pinFn();
    source = pin.source || "none";
    pinned = !!pin.pinned;
  } catch {
    /* pin is best-effort */
  }

  const isInstalled = await installed(h.appid);

  // A source advertised a paired manifest, so failure to pin it must stop the
  // operation. Applying anyway would put the fix on latest/the wrong build.
  if (source === "none" || !pinned) {
    h.onPhase("pin_failed", { source });
    throw new Error("The selected fix's paired manifest could not be pinned.");
  }

  // A pin file is not evidence that Steam has downloaded that build. Read
  // InstalledDepots from Steam's appmanifest, even when the pin did not change.
  if (isInstalled && await isPinnedBuildReady(h.appid)) {
    h.onPhase("applying");
    await h.doApply();
    return "applied";
  }

  // Trigger Steam to update/download the game to the pinned build. First apply
  //    the "no internet" fix (strip the steam.cfg update-block, restored once the
  //    download starts) so Steam doesn't fail the update with "no internet".
  h.onPhase("updating", { source });
  try {
    await noInternetFixBegin(h.appid);
  } catch {
    /* best-effort */
  }
  // Moon reloads config.yaml through its file watcher. Give that watcher one
  // turn before asking Steam to construct the install plan from the new pin.
  await new Promise((resolve) => setTimeout(resolve, 750));
  try {
    await triggerSteamInstall(h.appid);
  } catch {
    /* the user can still start the download manually */
  }
  if (isInstalled) {
    // Install IPC can be a no-op for an app Steam considers fully installed.
    // Steam's Verify action makes it reconcile Moon's newly pinned TARGET
    // against the actual ACTIVE depots; do not launch the stale game.
    try { await validateSteamApp(h.appid); } catch { /* user can retry */ }
  }

  if (!h.autoApply) {
    // Guided: stop here; the component shows an "Apply now" button and polls
    // completion to hint when it's ready.
    h.onPhase("awaiting_download");
    return "awaiting";
  }

  // 5) Auto: poll until the download completes, then apply.
  const started = Date.now();
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 min
  while (Date.now() - started < TIMEOUT_MS) {
    if (h.shouldStop?.()) return "awaiting";
    await new Promise((r) => setTimeout(r, 3000));
    if (h.shouldStop?.()) return "awaiting";
    if (await isPinnedBuildReady(h.appid)) {
      h.onPhase("applying");
      await h.doApply();
      return "applied";
    }
  }
  // Timed out -> fall back to guided so the user can apply manually.
  h.onPhase("awaiting_download");
  return "awaiting";
}
