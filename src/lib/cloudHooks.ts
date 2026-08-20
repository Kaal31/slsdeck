import { osSyncGame, osEnsureTracked, osStatus } from "../api";

/**
 * Steam-Cloud-style auto-sync: sync a game's saves when it launches and again
 * when it exits — reproducing the Steam Cloud "sync before play / sync after"
 * behavior on the OpenSave engine, without patching Steam. Works for non-owned
 * SLS titles.
 *
 * Registers for SteamClient app lifetime notifications; returns an unregister fn.
 */
export function startCloudHooks(): () => void {
  const SC: any = (window as any).SteamClient;
  const reg = SC?.GameSessions?.RegisterForAppLifetimeNotifications;
  if (typeof reg !== "function") {
    console.log("SLSDeck: app lifetime notifications unavailable; cloud auto-sync off");
    return () => {};
  }

  // Only bother if the engine is installed; re-checked lazily so enabling it
  // later doesn't require a plugin reload.
  let engineReady = false;
  osStatus().then((s) => { engineReady = !!s.installed; }).catch(() => {});

  const inFlight = new Set<number>();

  const handle = async (appid: number, running: boolean) => {
    if (!appid) return;
    if (!engineReady) {
      try { engineReady = !!(await osStatus()).installed; } catch { /* */ }
      if (!engineReady) return;
    }
    const key = appid * 2 + (running ? 1 : 0);
    if (inFlight.has(key)) return;
    inFlight.add(key);
    try {
      if (running) {
        // pre-play: make sure it's tracked, then pull the newest save
        await osEnsureTracked(appid).catch(() => {});
      }
      await osSyncGame(appid).catch(() => {});
    } finally {
      inFlight.delete(key);
    }
  };

  let sub: any = null;
  try {
    sub = reg.call(SC.GameSessions, (n: any) => {
      try {
        const appid = Number(n?.unAppID ?? n?.appid ?? 0);
        handle(appid, !!n?.bRunning);
      } catch { /* */ }
    });
  } catch (e) {
    console.error("SLSDeck: failed to register cloud hooks", e);
  }

  return () => {
    try { sub?.unregister?.(); } catch { /* */ }
  };
}
