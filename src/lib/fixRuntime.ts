// After a fix is applied, set a WINEDLLOVERRIDES launch option so Proton loads
// the fix's native DLLs — but ONLY if the game already has a Proton compat tool
// enabled. On native Linux (no compat layer) the fix's Windows DLLs do nothing,
// so an override is pointless and we skip it. We never force a compat tool.

import { getAutoRepoint } from "../api";

const configured = new Set<number>();

// Launch-target repoint: some fixes ship a replacement executable (e.g. a
// cracked *-Shipping.exe) but Steam still launches the game's original launcher
// exe, which can error (vcredist) or never load the crack. We rewrite the exe
// inside %command% to the fix's exe with a bash wrapper, keeping the app's own
// Proton prefix + env. Marked so we can find/remove it later.
const REPOINT_MARK = "SLSDECKREPOINT";
const REPOINT_RE = /\s*bash -c '[^']*SLSDECKREPOINT[^']*' _ %command%/;

function repointWrapper(exePath: string): string {
  // Double-quoted JS string so ${...} stays literal bash. Replaces any *.exe
  // argument in the expanded %command% with the fix's exe, then execs.
  return (
    "bash -c 'a=(\"$@\"); for i in \"${!a[@]}\"; do " +
    "[ \"${a[$i]: -4}\" = \".exe\" ] && a[$i]=\"" + exePath + "\"; done; " +
    REPOINT_MARK + "= exec \"${a[@]}\"' _ %command%"
  );
}

/** Repoint (exePath) or clear (null) the game's Steam launch target, preserving
 *  any env prefixes already present (WINEDLLOVERRIDES, LD_AUDIT, …). */
export function setLaunchRepoint(appid: number, exePath: string | null): boolean {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SetAppLaunchOptions) return false;
  try {
    let stripped = (currentLaunchOptions(appid) || "")
      .replace(REPOINT_RE, " %command%")
      .replace(/\s+/g, " ")
      .trim();
    if (!exePath) {
      if (stripped === "%command%") stripped = "";
      SC.Apps.SetAppLaunchOptions(appid, stripped);
      return true;
    }
    if (!stripped.includes("%command%")) {
      stripped = stripped ? `${stripped} %command%` : "%command%";
    }
    const next = stripped.replace("%command%", repointWrapper(exePath)).replace(/\s+/g, " ").trim();
    SC.Apps.SetAppLaunchOptions(appid, next);
    return true;
  } catch {
    return false;
  }
}

/** True if this game's launch options currently carry our repoint wrapper. */
export function hasLaunchRepoint(appid: number): boolean {
  return (currentLaunchOptions(appid) || "").includes(REPOINT_MARK);
}

/** Ensure the game runs under Proton so a repointed Windows exe can launch.
 *  Prefers Proton Experimental, else the newest GE-Proton, else any Proton. Does
 *  NOT override a Proton the game is already set to (won't stomp a GE choice).
 *  Returns the tool name it selected, or "" if left as-is / none available. */
export async function ensureProtonSelected(appid: number): Promise<string> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SpecifyCompatTool) return "";
  const cur = String(appDetails(appid)?.strCompatToolName || "").toLowerCase();
  if (cur && cur.includes("proton") && !cur.includes("steamlinuxruntime")) return cur;
  let tools: any[] = [];
  try {
    const res = SC.Apps.GetAvailableCompatTools?.(appid);
    tools = res && typeof res.then === "function" ? await res : res || [];
  } catch {
    tools = [];
  }
  const list = (tools || [])
    .map((t: any) => ({
      name: String(t.strToolName || t.strToolIdentifier || t.strDisplayName || ""),
      disp: String(t.strDisplayName || t.strToolName || ""),
    }))
    .filter((x: any) => x.name);
  const isProton = (x: any) => /proton/i.test(x.name) || /proton/i.test(x.disp);
  const bySemver = (a: any, b: any) =>
    b.name.localeCompare(a.name, undefined, { numeric: true });
  const pick =
    list.find((x: any) => x.name.toLowerCase() === "proton_experimental" || /experimental/i.test(x.disp)) ||
    list.filter((x: any) => /ge-?proton/i.test(x.name) || /ge-?proton/i.test(x.disp)).sort(bySemver)[0] ||
    list.filter(isProton).sort(bySemver)[0];
  const chosen = pick?.name || (list.length === 0 ? "proton_experimental" : "");
  if (chosen) {
    try {
      SC.Apps.SpecifyCompatTool(appid, chosen);
      return chosen;
    } catch {
      /* ignore */
    }
  }
  return "";
}

/** Auto-repoint after a fix — ONLY when the fix itself shipped a replacement exe
 *  (backend sets state.repointExe). Gated behind the auto-repoint setting.
 *  Runs after a short settle so it reads the launch string AFTER any
 *  WINEDLLOVERRIDES write, then preserves it (additive). */
export async function autoRepointFromState(appid: number, st: any): Promise<void> {
  try {
    const exe = st && typeof st.repointExe === "string" ? st.repointExe : "";
    if (!exe) return; // fix shipped no exe -> nothing to repoint
    if (!(await getAutoRepoint()).enabled) return;
    await ensureProtonSelected(appid);
    await new Promise((r) => setTimeout(r, 250));
    setLaunchRepoint(appid, exe);
  } catch {
    /* ignore */
  }
}

function mergeLaunchOptions(current: string, overrides: string): string {
  const existing: string[] = [];
  let rest = (current || "").replace(
    /WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi,
    (_all, dq, sq, bare) => {
      String(dq ?? sq ?? bare ?? "").split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => existing.push(x));
      return "";
    }
  ).replace(/\s+/g, " ").trim();

  const incoming: string[] = [];
  let extra = (overrides || "").replace(
    /WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi,
    (_all, dq, sq, bare) => {
      String(dq ?? sq ?? bare ?? "").split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => incoming.push(x));
      return "";
    }
  ).replace(/\s+/g, " ").trim();

  if (!overrides) return current || "";
  if (!incoming.length) {
    // Older backend responses sometimes already contain a complete env prefix.
    if (rest === "") return `${overrides} %command%`;
    return rest.includes("%command%")
      ? rest.replace("%command%", `${overrides} %command%`).replace(/\s+/g, " ").trim()
      : `${overrides} ${rest} %command%`;
  }

  const all = [...existing, ...incoming];
  if (/\/\.tokeer\/ost-run\.sh/.test(current || "")) {
    for (let i = all.length - 1; i >= 0; i--) {
      if (/^dinput8\s*=/i.test(all[i])) all.splice(i, 1);
    }
    all.push("dinput8=n,b");
  }
  const merged = all.filter((entry, i, values) => {
    const key = entry.split("=")[0].trim().toLowerCase();
    return values.map((x) => x.split("=")[0].trim().toLowerCase()).lastIndexOf(key) === i;
  });
  const prefix = `WINEDLLOVERRIDES="${merged.join(";")}"`;
  if (extra) rest = `${extra} ${rest}`.trim();
  if (rest === "") return `${prefix} %command%`;
  return rest.includes("%command%")
    ? rest.replace("%command%", `${prefix} %command%`).replace(/\s+/g, " ").trim()
    : `${prefix} ${rest} %command%`;
}

function appDetails(appid: number): any {
  try {
    return (window as any).appDetailsStore?.GetAppDetails?.(appid) || null;
  } catch {
    return null;
  }
}

function currentLaunchOptions(appid: number): string {
  const d = appDetails(appid);
  return d && typeof d.strLaunchOptions === "string" ? d.strLaunchOptions : "";
}

/** Read Steam's current live value, falling back to the app-details cache on
 * client builds that do not expose GetLaunchOptionsForApp. */
export function getCurrentLaunchOptions(appid: number): string {
  try {
    const live = (window as any).SteamClient?.Apps?.GetLaunchOptionsForApp?.(appid);
    if (typeof live === "string") return live;
  } catch { /* use the app-details cache below */ }
  return currentLaunchOptions(appid);
}

/** True only when the game has a Proton compatibility tool enabled (not a
 *  native Linux runtime shim, not empty). */
function hasProtonLayer(appid: number): boolean {
  const d = appDetails(appid);
  const name = String(
    (d && (d.strCompatToolName || d.strCompatToolDisplayName)) || ""
  ).toLowerCase();
  if (!name) return false;
  if (name.includes("steamlinuxruntime")) return false;
  return name.includes("proton");
}

/**
 * Set the fix's WINEDLLOVERRIDES launch option — only if a Proton layer is
 * enabled for this game and the fix actually shipped overridable DLLs. Runs at
 * most once per apply (reset via resetFixRuntime on a new apply). No compat tool
 * is ever forced.
 */
export async function applyFixRuntime(appid: number, overrides?: string): Promise<void> {
  if (!appid || configured.has(appid)) return;
  if (!overrides) return; // no DLLs to override
  if (!hasProtonLayer(appid)) return; // native / no compat layer -> nothing to do
  configured.add(appid);
  const SC: any = (window as any).SteamClient;
  try {
    const merged = mergeLaunchOptions(currentLaunchOptions(appid), overrides);
    if (SC?.Apps?.SetAppLaunchOptions) {
      SC.Apps.SetAppLaunchOptions(appid, merged);
    }
  } catch {
    /* ignore */
  }
}

export function configureTokeerLaunch(
  appid: number,
  tokeerHome: string,
  requiredProton = "GE-Proton10-34"
): { success: boolean; options?: string; proton?: string; error?: string } {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SetAppLaunchOptions || !SC?.Apps?.SpecifyCompatTool) {
    return { success: false, error: "Steam's live app-configuration API is unavailable." };
  }
  try {
    let rest = currentLaunchOptions(appid) || "%command%";
    const overrides: string[] = [];
    rest = rest.replace(
      /WINEDLLOVERRIDES=(?:"([^"]*)"|'([^']*)'|([^\s]+))\s*/gi,
      (_all, dq, sq, bare) => {
        const value = String(dq ?? sq ?? bare ?? "");
        value.split(";").map((x) => x.trim()).filter(Boolean).forEach((x) => overrides.push(x));
        return "";
      }
    );

    // Remove only an existing Tokeer wrapper. Other wrappers (SLSDECKREPOINT,
    // LD_AUDIT/netsock, user commands) remain in the command.
    const wrapper = `${tokeerHome.replace(/\/$/, "")}/ost-run.sh`;
    const escaped = wrapper.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    rest = rest
      .replace(new RegExp(`(?:'${escaped}'|"${escaped}"|${escaped})\\s*`, "g"), "")
      .replace(/\s+/g, " ")
      .trim();
    if (!rest) rest = "%command%";
    if (!rest.includes("%command%")) rest = `${rest} %command%`;

    const merged = overrides
      .filter((entry) => !/^dinput8\s*=/i.test(entry))
      .concat("dinput8=n,b");
    const deduped = merged.filter((entry, i, all) => {
      const key = entry.split("=")[0].trim().toLowerCase();
      return all.findIndex((x) => x.split("=")[0].trim().toLowerCase() === key) === i;
    });
    const quotedWrapper = `'${wrapper.replace(/'/g, "'\\''")}'`;
    const next = `WINEDLLOVERRIDES="${deduped.join(";")}" ${quotedWrapper} ${rest}`
      .replace(/\s+/g, " ")
      .trim();

    SC.Apps.SpecifyCompatTool(appid, requiredProton);
    SC.Apps.SetAppLaunchOptions(appid, next);
    return { success: true, options: next, proton: requiredProton };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/** Allow re-running when the user applies a fix to the same game again. */
export function resetFixRuntime(appid: number): void {
  configured.delete(appid);
}

/** Un-fix cleanup: strip the fix's launch-option additions — the repoint wrapper
 *  AND the WINEDLLOVERRIDES the fix added — in a single write, preserving
 *  everything else (netsock LD_AUDIT, user flags, %command%). */
export function clearFixLaunchOptions(appid: number): void {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SetAppLaunchOptions) return;
  try {
    const before = currentLaunchOptions(appid) || "";
    const keepTokeer = /\/\.tokeer\/ost-run\.sh/.test(before);
    let opts = before
      .replace(REPOINT_RE, " %command%")
      .replace(/WINEDLLOVERRIDES=".*?"\s*/g, "")
      .replace(/WINEDLLOVERRIDES=[^\s]+\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (keepTokeer) opts = `WINEDLLOVERRIDES="dinput8=n,b" ${opts || "%command%"}`;
    else if (opts === "%command%") opts = "";
    SC.Apps.SetAppLaunchOptions(appid, opts);
  } catch {
    /* ignore */
  }
  configured.delete(appid);
}

/** The exact Steam display name for an app, used for the perondepot name match. */
export function appDisplayName(appid: number): string {
  try {
    const store: any = (window as any).appStore;
    return (
      store?.GetAppOverviewByGameID?.(appid)?.display_name ||
      store?.GetAppOverviewByAppID?.(appid)?.display_name ||
      ""
    );
  } catch {
    return "";
  }
}


/** Point a game's Steam compatibility tool at `toolName` (or clear it with "").
 *  Used by the Denuvo fix to force GE-Proton11-1-LinUwUx per game. */
export function setGameCompat(appid: number, toolName: string): void {
  try {
    const SC: any = (window as any).SteamClient;
    SC?.Apps?.SpecifyCompatTool?.(appid, toolName || "");
  } catch {
    /* ignore */
  }
}

/**
 * Add or remove the netsock LD_AUDIT prefix in a game's launch options,
 * preserving whatever else is already there (WINEDLLOVERRIDES, %command%, …).
 */
export function setNetsockLaunchOption(
  appid: number,
  enabled: boolean,
  ldAudit: string
): boolean {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SetAppLaunchOptions) return false;
  try {
    let rest = (currentLaunchOptions(appid) || "")
      .replace(/LD_AUDIT=(".*?"|[^\s]+)\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();
    let next: string;
    if (enabled) {
      if (rest === "") next = `${ldAudit} %command%`;
      else if (rest.includes("%command%")) next = `${ldAudit} ${rest}`.replace(/\s+/g, " ").trim();
      else next = `${ldAudit} ${rest} %command%`;
    } else {
      next = rest;
      if (next === "%command%") next = "";
    }
    SC.Apps.SetAppLaunchOptions(appid, next);
    return true;
  } catch {
    return false;
  }
}
