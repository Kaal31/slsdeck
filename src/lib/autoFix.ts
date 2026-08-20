/**
 * Auto-apply fixes — background sweep model (non-hypervisor build).
 *
 * Auto-fix ONLY applies real per-game fixes from named sources (ryuu generic /
 * crack, and the perondepot / ryuu online fix). The universal "Unsteam" AIO fix
 * is NEVER auto-applied — it's opt-in from the UI only. If no per-game fix
 * exists, the sweep does nothing and shows no notification.
 *
 * It also waits for the game to FINISH downloading (real bytes on disk, not just
 * a created folder) before applying, so a fix never lands on a partial install.
 *
 * Denuvo games are skipped entirely (no hypervisor here → no working fix).
 */

import { toaster } from "@decky/api";
import {
  applyFix,
  appDownloadComplete,
  checkFixes,
  denuvoKnown,
  denuvoResolve,
  getAutoFix,
  getAutoFixPending,
  getFixStatus,
  getGameInstallPath,
  getInstalledApps,
  getInstalledFixes,
  removeAutoFixPending,
  IN_PROGRESS,
} from "../api";

const TITLE = "SLSDeck";
const running = new Set<number>();
let sweeping = false;
let seededExisting = false;

async function waitForFix(appid: number, timeoutMs = 20 * 60 * 1000): Promise<boolean> {
  const started = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, 1500));
    if (Date.now() - started > timeoutMs) return false;
    try {
      const s = ((await getFixStatus(appid)).state || {}).status || "";
      if (s === "done") return true;
      if (s === "failed" || s === "cancelled") return false;
      if (!s || IN_PROGRESS.has(s)) continue;
    } catch {
      /* keep polling */
    }
  }
}

async function alreadyFixed(appid: number): Promise<boolean> {
  try {
    const r = await getInstalledFixes();
    return (r.fixes || []).some((f) => Number(f.appid) === appid);
  } catch {
    return false;
  }
}

async function isDenuvo(appid: number): Promise<boolean> {
  try {
    const known = await denuvoKnown();
    if ((known.denuvo || []).includes(appid)) return true;
    const r = await denuvoResolve([appid]);
    return (r.denuvo || []).includes(appid);
  } catch {
    return false;
  }
}

async function apply(appid: number, url: string, path: string, type: string, name: string, label: string): Promise<boolean> {
  toaster.toast({ title: TITLE, body: `${name}: applying ${label}…` });
  try {
    await applyFix(appid, url, path, type, name);
    const ok = await waitForFix(appid);
    toaster.toast({ title: TITLE, body: ok ? `${name}: ${label} applied` : `${name}: ${label} failed` });
    return ok;
  } catch (e) {
    toaster.toast({ title: TITLE, body: `${name}: ${label} error — ${e}` });
    return false;
  }
}

async function processOne(appid: number): Promise<boolean> {
  if (running.has(appid)) return false;
  running.add(appid);
  try {
    if (await alreadyFixed(appid)) return true;
    if (await isDenuvo(appid)) return true; // no working fix without a hypervisor

    const path = await getGameInstallPath(appid);
    if (!path?.success || !path.installPath) return false; // not installed yet

    // Wait for the download to actually finish (real bytes on disk) — never
    // apply a fix to a partial/empty install. Returns false so the game stays
    // queued and the next sweep retries once it's done.
    try {
      const dl = await appDownloadComplete(appid);
      if (!dl?.complete) return false;
    } catch {
      return false;
    }

    const check: any = await checkFixes(appid, "");
    const name = check?.gameName || `AppID ${appid}`;
    const online = check?.onlineFix?.available ? check.onlineFix : null;
    const generic = check?.genericFix?.available ? check.genericFix : null;

    // Only real per-game fixes, in priority order: ryuu fix (generic/crack) →
    // online (perondepot / ryuu online). The universal Unsteam AIO is NEVER
    // auto-applied. No fix found → do nothing, no notification.
    if (generic?.url) {
      // ryuu is highest priority. If it applies, done. If it FAILS (e.g. the
      // ryuu key is missing or your account lacks access to this specific fix),
      // fall back to the online fix instead of getting stuck on it.
      if (await apply(appid, generic.url, path.installPath, "generic", name, "ryuu fix")) return true;
    }
    if (online?.url) return apply(appid, online.url, path.installPath, "online", name, "online fix");
    // Download is complete and no per-game fix applied — nothing more to do, so
    // return true to clear it from the pending queue (don't re-check forever).
    return true;
  } finally {
    running.delete(appid);
  }
}

export async function runAutoFixSweep(): Promise<void> {
  if (sweeping) return;
  sweeping = true;
  try {
    if (!(await getAutoFix()).enabled) return;

    const pending = (await getAutoFixPending()).appids || [];
    for (const appid of pending) {
      try {
        // Only clear from the queue once a fix actually applied. If the game is
        // still downloading or has no per-game fix, it stays queued for retry.
        if (await processOne(appid)) await removeAutoFixPending(appid);
      } catch {
        /* keep going */
      }
    }

    if (!seededExisting) {
      seededExisting = true;
      try {
        const apps = (await getInstalledApps()).apps || [];
        const pset = new Set(pending);
        for (const a of apps) {
          const id = Number(a.appid);
          if (pset.has(id)) continue;
          try { await processOne(id); } catch { /* keep going */ }
        }
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  } finally {
    sweeping = false;
  }
}
