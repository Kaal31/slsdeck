import { crArtwork, crGetShortcut, crIconPath, crInstallStatus, crSetShortcut } from "../api";

const CR_FLATPAK = "org.cloudredirect.CloudRedirect";

async function applyArtwork(appId: number): Promise<void> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps) return;
  try {
    const a = await crArtwork();
    if (a?.success && SC.Apps.SetCustomArtworkForApp) {
      const jobs: Array<[string, number]> = [
        [a.cover, 0],
        [a.hero, 1],
        [a.capsule, 3],
        [a.logo, 2],
      ];
      for (const [b64, kind] of jobs) {
        if (!b64) continue;
        try { await SC.Apps.SetCustomArtworkForApp(appId, b64, "png", kind); } catch { /* best effort */ }
      }
    }
  } catch { /* best effort */ }

  try {
    const ic = await crIconPath();
    if (ic?.success && ic.path && SC.Apps.SetShortcutIcon) {
      await SC.Apps.SetShortcutIcon(appId, ic.path);
    }
  } catch { /* best effort */ }
}

/** Ensure the provider-login UI has a Steam shortcut and native-looking art.
 * Creates it when missing; otherwise rebinds the existing shortcut in place.
 */
export async function ensureCloudRedirectShortcut(launch = false): Promise<number> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps) throw new Error("SteamClient unavailable");

  let appId = 0;
  try {
    const g = await crGetShortcut();
    appId = Number(g?.appId || 0);
  } catch { /* create below */ }

  if (appId) {
    try {
      const ov = (window as any).appStore?.GetAppOverviewByAppID?.(appId);
      if (!ov) appId = 0;
    } catch {
      appId = 0;
    }
  }

  if (!appId) {
    if (!SC.Apps.AddShortcut) throw new Error("Steam shortcut API unavailable");
    const created = await SC.Apps.AddShortcut("CloudRedirect", "/usr/bin/flatpak", "", "");
    appId = Number(created);
    if (!appId || Number.isNaN(appId)) throw new Error("AddShortcut returned no appId");
  }

  try { await SC.Apps.SetShortcutLaunchOptions(appId, `run --user ${CR_FLATPAK}`); } catch { /* best effort */ }
  try { await SC.Apps.SetShortcutName(appId, "CloudRedirect"); } catch { /* best effort */ }
  try { await crSetShortcut(appId); } catch { /* best effort */ }
  await applyArtwork(appId);

  if (launch) {
    if (!SC.Apps.RunGame) throw new Error("Steam launch API unavailable");
    const gameId = ((BigInt(appId) << 32n) | 0x02000000n).toString();
    SC.Apps.RunGame(gameId, "", -1, 100);
  }

  return appId;
}

/** Historical name kept for callers. It now creates the login shortcut when it
 * does not exist, then rebinds artwork/launch metadata when it does.
 */
export async function rebindExistingCloudRedirectShortcut(): Promise<boolean> {
  try {
    await ensureCloudRedirectShortcut(false);
    return true;
  } catch {
    return false;
  }
}

/** Remove only the legacy shortcut whose AppID was recorded when SLSDeck
 * created it. The backend removes the Flatpak only after migrating its data;
 * appInstalled=false is therefore the hand-off signal for CEF cleanup. */
export async function cleanupLegacyCloudRedirectShortcut(): Promise<void> {
  try {
    const [{ appId }, status] = await Promise.all([crGetShortcut(), crInstallStatus()]);
    const id = Number(appId || 0);
    if (!id || status?.legacyFlatpakInstalled || status?.appInstalled) return;
    const SC: any = (window as any).SteamClient;
    if (!SC?.Apps?.RemoveShortcut) return;
    // The stored ID is authoritative: SLSDeck records it immediately after its
    // own AddShortcut call and never records arbitrary library applications.
    await SC.Apps.RemoveShortcut(id);
    await crSetShortcut(0);
    console.info("SLSDeck: removed legacy CloudRedirect Steam shortcut");
  } catch (e) {
    console.warn("SLSDeck: legacy CloudRedirect shortcut cleanup deferred", e);
  }
}
