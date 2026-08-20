import {
  bpApplyBuild,
  depotdlDownloadBuildGids,
  depotdlQueue,
  depotdlStatus,
  getPinStatus,
  noInternetFixBegin,
  triggerSteamInstall,
} from "../api";
import { isDownloadComplete } from "./buildApply";

export type CatalogBuildPhase =
  | "resolving"
  | "already_ready"
  | "build_downloading"
  | "build_ready"
  | "steam_downloading";

export interface CatalogBuildProgress {
  phase: CatalogBuildPhase;
  percent?: number;
  message?: string;
}

export type CatalogBuildResult =
  | { status: "ready"; alreadyReady: boolean }
  | { status: "awaiting_steam" };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanGids(gids?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [depot, gid] of Object.entries(gids || {})) {
    if (/^\d+$/.test(String(depot)) && /^\d+$/.test(String(gid))) out[String(depot)] = String(gid);
  }
  return out;
}

function samePinnedGids(
  pinned: boolean,
  current: Record<string, string> | undefined,
  target: Record<string, string>,
): boolean {
  if (!pinned) return false;
  const keys = Object.keys(target);
  if (!keys.length) return false;
  const cur = current || {};
  return keys.every((depot) => String(cur[depot] || "") === String(target[depot]));
}

/**
 * Prepare the exact Steam build required by an HVAuto / CrakFiles entry.
 *
 * Prefer the same direct DepotDownloader path used by the SteamDB build picker.
 * If the game is already pinned to these exact depot GIDs and fully downloaded,
 * skip all build work. When DepotDownloader is unavailable, pin the exact GIDs
 * through bpApplyBuild and trigger Steam; the caller can then show its normal
 * "Start download / Apply now" guided prompt.
 */
export async function prepareCatalogFixBuild(
  appid: number,
  buildid: string,
  gidsInput: Record<string, string> | undefined,
  onProgress: (p: CatalogBuildProgress) => void,
): Promise<CatalogBuildResult> {
  const gids = cleanGids(gidsInput);
  if (!buildid) throw new Error("This fix does not specify a Steam build.");
  if (!Object.keys(gids).length) {
    throw new Error(
      `Build ${buildid} is known, but its depot manifests could not be resolved. ` +
        "Open Install a specific build once so SteamDB can resolve that build, then retry the fix.",
    );
  }

  onProgress({ phase: "resolving", message: `Checking build ${buildid}…` });
  const pin = await getPinStatus(appid).catch(() => ({ success: false, pinned: false } as any));
  const alreadyPinned = samePinnedGids(!!pin.pinned, pin.depots, gids);
  const complete = alreadyPinned ? await isDownloadComplete(appid) : false;
  if (alreadyPinned && complete) {
    onProgress({
      phase: "already_ready",
      percent: 100,
      message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
    });
    return { status: "ready", alreadyReady: true };
  }

  const ddl = await depotdlStatus().catch(() => ({ success: false, available: false } as any));
  if (ddl.available) {
    onProgress({ phase: "build_downloading", percent: 0, message: `Preparing build ${buildid}…` });
    const started = await depotdlDownloadBuildGids(appid, buildid, JSON.stringify(gids));
    if (!started.success) throw new Error(started.error || "Could not start the build download.");

    const deadline = Date.now() + 30 * 60 * 1000;
    while (Date.now() < deadline) {
      const q = await depotdlQueue();
      const job = (q.items || []).find((x) => x.appid === appid);
      if (job) {
        const pct = Number.isFinite(Number(job.percent)) ? Math.max(0, Math.min(100, Number(job.percent))) : 0;
        onProgress({
          phase: "build_downloading",
          percent: pct,
          message: job.status === "resolving" ? `Resolving build ${buildid}…` : `Downloading build ${buildid}…`,
        });
        if (job.status === "done") {
          onProgress({ phase: "build_ready", percent: 100, message: `Build ${buildid} installed and pinned.` });
          return { status: "ready", alreadyReady: false };
        }
        if (job.status === "failed") throw new Error(job.error || "Build download failed.");
      }
      await sleep(1000);
    }
    throw new Error("Build download timed out after 30 minutes.");
  }

  // Same exact-GID fallback as the SteamDB picker when direct DepotDownloader is
  // not available: pin first, then ask the live Steam client to install/update.
  const pinned = await bpApplyBuild(appid, buildid, "", JSON.stringify(gids));
  if (!pinned.success) throw new Error(pinned.error || `Could not pin build ${buildid}.`);
  await noInternetFixBegin(appid).catch(() => ({}));
  await triggerSteamInstall(appid).catch(() => ({}));
  onProgress({
    phase: "steam_downloading",
    message: `Build ${buildid} pinned — Steam is downloading it.`,
  });
  return { status: "awaiting_steam" };
}
