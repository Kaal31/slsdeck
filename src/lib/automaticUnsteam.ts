import { toaster } from "@decky/api";
import {
  automaticUnsteamCandidates,
  automaticUnsteamInspect,
  automaticUnsteamSetManaged,
  getProtonMapping,
  getFixStatus,
  getUiSettings,
} from "../api";
import { applyFixRuntime, resetFixRuntime } from "./fixRuntime";

export const AUTOMATIC_UNSTEAM_EVENT = "slsdeck-automatic-unsteam";

const MARK_RE = /SLSDECK_AUTO_UNSTEAM=(\d+)\s*/gi;
const LOG_RE = /PROTON_LOG=(?:"[^"]*"|'[^']*'|[^\s]+)\s*/gi;
const DIR_RE = /PROTON_LOG_DIR=(?:"[^"]*"|'[^']*'|[^\s]+)\s*/gi;
const SHORT_LAUNCH_MS = 45_000;
const starts = new Map<number, number>();

function details(appid: number): any {
  try { return (window as any).appDetailsStore?.GetAppDetails?.(appid); }
  catch { return null; }
}

function currentOptions(appid: number): string {
  try {
    const live = (window as any).SteamClient?.Apps?.GetLaunchOptionsForApp?.(appid);
    if (typeof live === "string") return live;
  } catch { /* cache fallback */ }
  return String(details(appid)?.strLaunchOptions || "");
}

async function isProton(appid: number): Promise<boolean> {
  const d = details(appid);
  const tool = String(d?.strCompatToolName || d?.strCompatToolDisplayName || "").toLowerCase();
  if (tool) return tool.includes("proton") && !tool.includes("steamlinuxruntime");
  try {
    const mapped = await getProtonMapping(appid);
    const name = String(mapped.toolName || "").toLowerCase();
    return name.includes("proton") && !name.includes("steamlinuxruntime");
  } catch { return false; }
}

function setLogging(appid: number, enabled: boolean, logDir: string): boolean {
  const set = (window as any).SteamClient?.Apps?.SetAppLaunchOptions;
  if (typeof set !== "function") return false;
  let options = currentOptions(appid);
  if (enabled) {
    if (MARK_RE.test(options)) { MARK_RE.lastIndex = 0; return true; }
    MARK_RE.lastIndex = 0;
    const hadLog = LOG_RE.test(options); LOG_RE.lastIndex = 0;
    const hadDir = DIR_RE.test(options); DIR_RE.lastIndex = 0;
    // Bits record precisely which values belong to us, so disabling never
    // removes logging variables the user had configured independently.
    const owned = (hadLog ? 0 : 1) | (hadDir ? 0 : 2);
    const prefix = [
      `SLSDECK_AUTO_UNSTEAM=${owned}`,
      hadLog ? "" : "PROTON_LOG=1",
      hadDir ? "" : `PROTON_LOG_DIR=\"${logDir}\"`,
    ].filter(Boolean).join(" ");
    options = options.trim();
    options = options
      ? (options.includes("%command%") ? `${prefix} ${options}` : `${prefix} ${options} %command%`)
      : `${prefix} %command%`;
  } else {
    let owned = 0;
    options = options.replace(MARK_RE, (_all, bits) => { owned = Number(bits) || 0; return ""; });
    MARK_RE.lastIndex = 0;
    if (owned & 1) options = options.replace(LOG_RE, "");
    if (owned & 2) options = options.replace(DIR_RE, "");
    options = options.replace(/\s+/g, " ").trim();
    if (options === "%command%") options = "";
  }
  try { set.call((window as any).SteamClient.Apps, appid, options); return true; }
  catch { return false; }
}

async function syncLogging(enabled: boolean): Promise<void> {
  const response = await automaticUnsteamCandidates();
  if (!response.success) return;
  const managed: number[] = [];
  for (const app of response.apps || []) {
    // Disable is intentionally unconditional: if Proton was deselected after
    // we added the marker, our exact additions must still be removable.
    if (!enabled) {
      if (!setLogging(app.appid, false, response.logDir || "")) managed.push(app.appid);
    } else if (app.registered && app.installed && await isProton(app.appid)) {
      if (setLogging(app.appid, true, response.logDir || "")) managed.push(app.appid);
    }
  }
  await automaticUnsteamSetManaged(managed);
}

async function waitForFix(appid: number, name: string): Promise<void> {
  resetFixRuntime(appid);
  for (let i = 0; i < 180; i++) {
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    const response = await getFixStatus(appid);
    const state = response.state || {};
    if (state.status === "done" && state.success) {
      await applyFixRuntime(appid, state.overrides);
      toaster.toast({ title: "Automatic Unsteam", body: `${name}: Steam load error detected and Unsteam applied.` });
      return;
    }
    if (state.status === "failed" || state.status === "cancelled") {
      toaster.toast({ title: "Automatic Unsteam", body: `${name}: ${state.error || "Unsteam could not be applied."}` });
      return;
    }
  }
}

async function inspect(appid: number, started: number, duration: number): Promise<void> {
  // Let Proton finish closing and flushing steam-<appid>.log.
  await new Promise((resolve) => window.setTimeout(resolve, 2000));
  const result = await automaticUnsteamInspect(appid, started, duration);
  if (result.queued) {
    toaster.toast({ title: "Automatic Unsteam", body: `${result.gameName || `AppID ${appid}`}: Steam load error detected; applying Unsteam…` });
    void waitForFix(appid, result.gameName || `AppID ${appid}`);
  }
}

export function startAutomaticUnsteam(): () => void {
  let active = true;
  let enabled = false;
  let subscription: any = null;
  let timer = 0;

  const configure = async (next?: boolean) => {
    if (!active) return;
    if (typeof next === "boolean") enabled = next;
    else enabled = (await getUiSettings()).settings?.automaticUnsteam === true;
    await syncLogging(enabled);
  };
  const changed = (event: Event) => { void configure(!!(event as CustomEvent).detail); };
  window.addEventListener(AUTOMATIC_UNSTEAM_EVENT, changed);
  void configure();
  timer = window.setInterval(() => { void syncLogging(enabled); }, 60_000);

  const sessions: any = (window as any).SteamClient?.GameSessions;
  try {
    subscription = sessions?.RegisterForAppLifetimeNotifications?.((event: any) => {
      if (!enabled) return;
      const appid = Number(event?.unAppID ?? event?.appid ?? 0);
      if (!appid) return;
      if (event?.bRunning) {
        starts.set(appid, Date.now());
        return;
      }
      const started = starts.get(appid);
      starts.delete(appid);
      if (!started) return;
      const duration = Date.now() - started;
      if (duration <= SHORT_LAUNCH_MS) void inspect(appid, started, duration);
    });
  } catch (error) {
    console.warn("SLSDeck: Automatic Unsteam lifetime watcher unavailable", error);
  }

  return () => {
    active = false;
    window.removeEventListener(AUTOMATIC_UNSTEAM_EVENT, changed);
    if (timer) window.clearInterval(timer);
    try { subscription?.unregister?.(); } catch { /* ignore */ }
    try { subscription?.Unregister?.(); } catch { /* ignore */ }
    starts.clear();
  };
}
