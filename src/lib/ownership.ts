/**
 * Ownership detection for game pages.
 *
 * A game added through SLSsteam looks "owned" to Steam by design — that's the
 * whole point of the hook — so Steam's own ownership fields (owner_account_id,
 * licenses) can't tell the two apart. The only reliable discriminator is our own
 * record: if the backend has no lua / AdditionalApps entry for the AppID but
 * Steam has it in the library, the user genuinely owns it.
 */

/** True when Steam lists this AppID in the user's library collection. */
export function isInLibrary(appid: number): boolean {
  try {
    const cs: any = (window as any).collectionStore;
    const apps = cs?.allAppsCollection?.apps;
    if (apps?.has) return !!apps.has(appid);
    if (apps?.get) return !!apps.get(appid);
  } catch {
    /* fall through */
  }
  try {
    const ov: any = (window as any).appStore?.GetAppOverviewByAppID?.(appid);
    // Library entries carry install state / an owner; store-only pages usually don't.
    if (ov && (ov.installed === true || ov.owner_account_id)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** All appids in the user's library collection (owned + SLS-added). Used by the
 *  "disable DLC unlock on owned" toggle to hand the backend candidate appids. */
export function listLibraryAppIds(): number[] {
  try {
    const cs: any = (window as any).collectionStore;
    const apps = cs?.allAppsCollection?.apps;
    let ids: any[] = [];
    if (apps?.keys) ids = Array.from(apps.keys());
    else if (Array.isArray(apps)) ids = apps.map((a: any) => a?.appid ?? a);
    return ids.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

/**
 * True when the plugin's controls should be hidden for this AppID:
 * the game is in the library but wasn't added by us.
 *
 * @param addedByUs result of hasLua(appid).exists
 * @param prefEnabled the user's "hide on owned games" setting
 */
export function shouldHideForOwned(
  appid: number,
  addedByUs: boolean,
  prefEnabled: boolean
): boolean {
  if (!prefEnabled) return false;
  if (addedByUs) return false;
  return isInLibrary(appid);
}

/**
 * Non-Steam shortcuts get CRC32-derived ids far above the real AppID range.
 * They live in the library but can never be added through SLSsteam, and they
 * are not "legit" Steam titles either — they're their own category.
 */
export function isNonSteamShortcut(appid: number | string): boolean {
  const id = Number(appid);
  return !isNaN(id) && (id > 10000000 || id < -1000000);
}
