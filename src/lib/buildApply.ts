// Build-accurate apply orchestration.
//
// For a fix whose exact build is known (a manifest resolvable via lua.tools /
// Hubcap / ~/Downloads), the correct order is: pin the manifest to that build →
// let Steam update the game to it → apply the fix onto the matching build.
//
// Flow:
//   1. Pin the fix's build (pinForFix). Harmless no-op if no build source.
//   2. If the game is already installed AND its download is complete, skip the
//      update entirely and go straight to applying (covers "installed with the
//      pinned manifest but no fix applied yet").
//   3. If no build could be pinned, just apply now (legacy behaviour).
//   4. Otherwise trigger the Steam update to the pinned build, then:
//        - guided (default): stop and let the user press Apply once the download
//          bar completes;
//        - auto: poll for completion and apply automatically.
import {
  appDownloadComplete,
  getGameInstallPath,
  pinForFix,
  triggerSteamInstall,
  noInternetFixBegin,
} from "../api";

export type ApplyPhase =
  | "pinning"
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
  // Custom pin resolver — lua.tools fixes pass one that pins to THIS fix's exact
  // build (its own manifest). Defaults to the generic pinForFix resolver.
  pinFn?: () => Promise<{ pinned: boolean; source?: string; changed?: boolean }>;
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

export async function runBuildAccurateApply(h: BuildApplyHooks): Promise<BuildApplyResult> {
  // 1) Pin to the fix's build (lua.tools -> hubcap -> ~/Downloads). No-op if none.
  h.onPhase("pinning");
  let source = "none";
  let pinned = false;
  // Default true: if we can't tell, assume the build changed so we force an
  // update rather than silently applying onto a stale build.
  let pinChanged = true;
  try {
    const pin = h.pinFn ? await h.pinFn() : await pinForFix(h.appid);
    source = pin.source || "none";
    pinned = !!pin.pinned;
    pinChanged = pin.changed !== false;
  } catch {
    /* pin is best-effort */
  }

  const isInstalled = await installed(h.appid);
  const downloadComplete = isInstalled ? await isDownloadComplete(h.appid) : false;

  // 2) No build could be pinned -> nothing to update toward; apply what we have
  //    (legacy behaviour: apply now, pin-after happens inside the apply).
  if (source === "none" || !pinned) {
    h.onPhase("applying");
    await h.doApply();
    return "applied";
  }

  // 3) Skip the update ONLY when the game is already pinned to *this exact build*
  //    (the pin didn't change) and is installed & fully downloaded. That's the
  //    "installed with the pinned manifest, fix not yet applied" case. If the pin
  //    changed (a different/newer build), we must NOT skip — otherwise the
  //    manifest upgrade would never download and the fix would land on the old
  //    build.
  if (!pinChanged && isInstalled && downloadComplete) {
    h.onPhase("applying");
    await h.doApply();
    return "applied";
  }

  // 4) Trigger Steam to update/download the game to the pinned build. First apply
  //    the "no internet" fix (strip the steam.cfg update-block, restored once the
  //    download starts) so Steam doesn't fail the update with "no internet".
  h.onPhase("updating", { source });
  try {
    await noInternetFixBegin(h.appid);
  } catch {
    /* best-effort */
  }
  try {
    await triggerSteamInstall(h.appid);
  } catch {
    /* the user can still start the download manually */
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
    if (await isDownloadComplete(h.appid)) {
      h.onPhase("applying");
      await h.doApply();
      return "applied";
    }
  }
  // Timed out -> fall back to guided so the user can apply manually.
  h.onPhase("awaiting_download");
  return "awaiting";
}
