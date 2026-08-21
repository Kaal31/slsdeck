import {
  bpApplyBuild,
  bpListDepotManifests,
  depotdlDownloadBuildGids,
  depotdlQueue,
  depotdlStatus,
  getPinStatus,
  noInternetFixBegin,
  triggerSteamInstall,
} from "../api";
import { isDownloadComplete } from "./buildApply";
import { fetchSteamdbBuilds } from "./steamdbBuilds";
import { scrapeDepotManifests } from "./steamdbCapture";

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

async function resolveGidsViaSteamdb(
  appid: number,
  buildid: string,
  onProgress: (p: CatalogBuildProgress) => void,
): Promise<Record<string, string>> {
  onProgress({ phase: "resolving", message: `Loading SteamDB history for build ${buildid}…` });
  let builds: Array<{ buildid: string; date: string }> = [];
  try {
    builds = await fetchSteamdbBuilds(appid, (s) =>
      onProgress({ phase: "resolving", message: s || `Loading SteamDB history for build ${buildid}…` }),
    );
  } catch {
    return {};
  }
  const target = builds.find((b) => String(b.buildid) === String(buildid));
  const buildDate = String(target?.date || "").slice(0, 10);
  if (!buildDate) return {};

  let depots: string[] = [];
  try {
    const r = await bpListDepotManifests(appid);
    if (r.success) depots = (r.depots || []).map((d) => String(d.depot));
  } catch {
    return {};
  }
  if (!depots.length) return {};

  const targetTime = new Date(buildDate).getTime();
  const out: Record<string, string> = {};
  for (let i = 0; i < depots.length; i += 1) {
    const depot = depots[i];
    onProgress({
      phase: "resolving",
      message: `SteamDB: resolving depot ${depot} (${i + 1}/${depots.length}) for build ${buildid}…`,
    });
    let rows: Array<{ gid: string; date: string }> = [];
    try {
      rows = await scrapeDepotManifests(
        depot,
        25000,
        (s) => onProgress({ phase: "resolving", message: s || `SteamDB: resolving depot ${depot}…` }),
      );
    } catch {
      continue;
    }
    let best = "";
    let bestDelta = Number.POSITIVE_INFINITY;
    for (const row of rows) {
      if (String(row.date || "").slice(0, 10) === buildDate) {
        best = String(row.gid || "");
        break;
      }
      const t = row.date ? new Date(row.date).getTime() : NaN;
      if (!Number.isFinite(t) || !Number.isFinite(targetTime)) continue;
      const delta = Math.abs(t - targetTime);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = String(row.gid || "");
      }
    }
    if (/^\d+$/.test(best)) out[depot] = best;
  }
  return out;
}

/**
 * Prepare the exact Steam build required by an HVAuto / CrakFiles entry.
 *
 * Prefer the same direct DepotDownloader path used by the SteamDB build picker.
 * If the game is already pinned to this exact build and fully downloaded, skip
 * all build work. If HVAuto's backend resolver does not have GIDs for an older
 * build, resolve them through the same signed-in SteamDB depot-history scraper
 * used by "Install a specific build". When DepotDownloader is unavailable, pin
 * the exact GIDs through bpApplyBuild and trigger Steam so the caller can show
 * its normal "Start download / Apply now" guided prompt.
 */
export async function prepareCatalogFixBuild(
  appid: number,
  buildid: string,
  gidsInput: Record<string, string> | undefined,
  onProgress: (p: CatalogBuildProgress) => void,
): Promise<CatalogBuildResult> {
  if (!buildid) throw new Error("This fix does not specify a Steam build.");

  onProgress({ phase: "resolving", message: `Checking build ${buildid}…` });
  const pin = await getPinStatus(appid).catch(() => ({ success: false, pinned: false } as any));
  const completePinned = !!pin.pinned ? await isDownloadComplete(appid) : false;
  if (
    completePinned &&
    pin.buildid &&
    String(pin.buildid) === String(buildid)
  ) {
    onProgress({
      phase: "already_ready",
      percent: 100,
      message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
    });
    return { status: "ready", alreadyReady: true };
  }

  let gids = cleanGids(gidsInput);
  if (samePinnedGids(!!pin.pinned, pin.depots, gids) && completePinned) {
    onProgress({
      phase: "already_ready",
      percent: 100,
      message: `Correct build ${buildid} is already installed and pinned — skipping build download.`,
    });
    return { status: "ready", alreadyReady: true };
  }

  // Older-build catalog entries sometimes cannot be reconstructed by the
  // backend's keyless archive/date join. In that case use the exact same signed-
  // in SteamDB browser pipeline as the manual specific-build picker.
  if (!Object.keys(gids).length) {
    const steamdb = cleanGids(await resolveGidsViaSteamdb(appid, buildid, onProgress));
    if (Object.keys(steamdb).length) gids = steamdb;
  }
  if (!Object.keys(gids).length) {
    throw new Error(
      `Build ${buildid} is known, but its depot manifests could not be resolved. ` +
        "Open SteamDB once/sign in if prompted, then retry this fix.",
    );
  }

  // The SteamDB fallback may have discovered the exact same GIDs that are
  // already pinned. Re-check before starting an unnecessary build download.
  if (samePinnedGids(!!pin.pinned, pin.depots, gids) && completePinned) {
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
