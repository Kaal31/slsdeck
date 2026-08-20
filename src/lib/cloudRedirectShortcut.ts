import { crArtwork, crGetShortcut, crIconPath, crSetShortcut } from "../api";

const CR_FLATPAK = "org.cloudredirect.CloudRedirect";

/** Reassert an existing CloudRedirect Steam shortcut after reinstall.
 *
 * This does not launch the app and does not create a new shortcut. It repairs
 * the already-stored shortcut so a reinstall cannot leave it pointing at stale
 * metadata. The shortcut intentionally launches the normal Flatpak companion;
 * the actual redirect hook is cloudredirect-moon's cloud_redirect.so.
 */
export async function rebindExistingCloudRedirectShortcut(): Promise<boolean> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps) return false;

  let appId = 0;
  try {
    const g = await crGetShortcut();
    appId = Number(g?.appId || 0);
  } catch {
    return false;
  }
  if (!appId || Number.isNaN(appId)) return false;

  try {
    const ov = (window as any).appStore?.GetAppOverviewByAppID?.(appId);
    if (!ov) return false;
  } catch {
    return false;
  }

  try { await SC.Apps.SetShortcutLaunchOptions(appId, `run --user ${CR_FLATPAK}`); } catch { /* best effort */ }
  try { await SC.Apps.SetShortcutName(appId, "CloudRedirect"); } catch { /* best effort */ }
  try { await crSetShortcut(appId); } catch { /* best effort */ }

  try {
    const a = await crArtwork();
    if (a?.success && SC.Apps.SetCustomArtworkForApp) {
      const jobs: Array<[string, number]> = [
        [a.cover, 0], [a.hero, 1], [a.capsule, 3], [a.logo, 2],
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

  return true;
}
