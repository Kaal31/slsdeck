// Auto-maintained Steam collection for SLS-added games.
//
// Steam has no native filter for "added by SLSDeck" — to Steam these games look
// like normal owned titles (that's the whole point of the SLSsteam hook), so a
// truly dynamic (filter-based) collection can't target them. Instead we keep a
// *static* collection ("SLSDeck") reconciled to the SLS appid set: create it if
// missing, add appids that are ours and absent, drop ones that are no longer
// ours. Reconciled on boot, after an add, and on a slow timer — so to the user
// it behaves like an auto-updating collection.
//
// Everything here touches undocumented SteamUI internals (collectionStore /
// appStore), whose method names drift between client versions. So every call is
// feature-detected and wrapped: on anything unexpected we log once and no-op —
// this must never throw into the library UI.
import { getGroupCollection, getInstalledApps, getEverAdded } from "../api";

const COLLECTION_NAME = "SLSDeck";
let warned = false;
let syncing = false;

function warnOnce(msg: string, err?: unknown) {
  if (warned) return;
  warned = true;
  try {
    console.warn(`SLSDeck collection: ${msg}`, err ?? "");
  } catch {
    /* ignore */
  }
}

function cStore(): any {
  return (window as any).collectionStore;
}
function aStore(): any {
  return (window as any).appStore;
}

/** Best-effort: overview objects Steam's Add/RemoveApps expect for these ids. */
function overviews(ids: number[]): any[] {
  const app = aStore();
  const out: any[] = [];
  for (const id of ids) {
    try {
      const ov = app?.GetAppOverviewByAppID?.(id);
      if (ov) out.push(ov);
    } catch {
      /* skip */
    }
  }
  return out;
}

/** Is the collection store initialized enough to touch safely? Reading
 *  `userCollections` before the store loads throws — and because it's a MobX
 *  computed, that thrown exception gets CACHED, which then crashes Steam's own
 *  collection render (and Decky blames us). So we gate every access on a
 *  readiness probe that deliberately does NOT evaluate `userCollections`. */
function storeReady(cs: any): boolean {
  try {
    if (!cs) return false;
    if (typeof cs.BIsInitialized === "function" && !cs.BIsInitialized()) return false;
    // allAppsCollection is a plain, stable object present once the library store
    // has loaded — touching it doesn't evaluate the fragile userCollections
    // computed.
    if (!cs.allAppsCollection) return false;
    return typeof cs.GetUserCollectionsByName === "function";
  } catch {
    return false;
  }
}

/** Find the existing user collection with our name, or null. Prefers the store
 *  METHOD (which doesn't evaluate the throwing userCollections computed); only
 *  falls back to iterating userCollections if the method is missing. */
function findCollection(cs: any): any {
  try {
    const byName = cs?.GetUserCollectionsByName?.(COLLECTION_NAME);
    if (byName && byName.length) return byName[0];
    if (byName) return null; // method exists and returned empty → no collection
  } catch {
    /* fall through to the (guarded) computed */
  }
  try {
    const list = cs?.userCollections || [];
    for (const c of list) if (c && c.displayName === COLLECTION_NAME) return c;
  } catch {
    /* ignore */
  }
  return null;
}

/** Current member appids of a collection, as a Set<number>. */
function membersOf(col: any): Set<number> {
  const out = new Set<number>();
  try {
    const apps = col?.apps;
    const keys = apps?.keys ? Array.from(apps.keys()) : [];
    for (const k of keys) {
      const n = Number(k);
      if (!Number.isNaN(n)) out.add(n);
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** The set of SLS-added appids (installed ∪ ever-added). */
async function slsAppIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  try {
    const r = await getInstalledApps();
    if (r.success) (r.apps || []).forEach((a) => ids.add(Number(a.appid)));
  } catch {
    /* ignore */
  }
  try {
    const r = await getEverAdded();
    if (r.success) (r.appids || []).forEach((a) => ids.add(Number(a)));
  } catch {
    /* ignore */
  }
  ids.delete(NaN as unknown as number);
  return ids;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/**
 * Reconcile the SLSDeck collection to the current SLS set. No-ops when the pref
 * is off, when the store API is missing, or when the collection already matches
 * (so it's cheap to call often). Never throws.
 */
export async function syncSlsCollection(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    let on = false;
    try {
      on = !!(await getGroupCollection()).enabled;
    } catch {
      on = false;
    }
    if (!on) return;

    const cs = cStore();
    if (!cs) {
      warnOnce("collectionStore unavailable");
      return;
    }
    // Bail (and retry on the next interval tick) until the store is initialized.
    // Touching userCollections early throws and MobX caches the exception, which
    // then crashes Steam's own collection UI — the "updated from an older plugin
    // and it's crashing" report. This gate is the fix.
    if (!storeReady(cs)) {
      return;
    }

    const desired = await slsAppIds();
    let col = findCollection(cs);

    // Nothing to group and no collection yet → don't create an empty one.
    if (!col && desired.size === 0) return;

    // Already in sync → skip the write entirely.
    if (col && setsEqual(membersOf(col), desired)) return;

    const desiredIds = Array.from(desired);

    if (!col) {
      // Create a new collection seeded with the desired apps.
      try {
        const created =
          cs.NewUnsavedCollection?.(COLLECTION_NAME, undefined, desiredIds) ??
          cs.NewUnsavedCollection?.(COLLECTION_NAME);
        if (!created) {
          warnOnce("NewUnsavedCollection missing");
          return;
        }
        // If the seed arg was ignored, add explicitly before saving.
        if (membersOf(created).size === 0 && desiredIds.length) {
          created.AddApps?.(overviews(desiredIds));
        }
        await (created.Save?.() ?? Promise.resolve());
      } catch (e) {
        warnOnce("create failed", e);
      }
      return;
    }

    // Edit membership on the existing collection.
    try {
      const editable = col.AsDragDropCollection?.() ?? col;
      const current = membersOf(col);
      const toAdd = desiredIds.filter((id) => !current.has(id));
      const toRemove = Array.from(current).filter((id) => !desired.has(id));
      if (toAdd.length) editable.AddApps?.(overviews(toAdd));
      if (toRemove.length) editable.RemoveApps?.(overviews(toRemove));
      await (editable.Save?.() ?? col.Save?.() ?? Promise.resolve());
    } catch (e) {
      warnOnce("edit failed", e);
    }
  } catch (e) {
    warnOnce("sync failed", e);
  } finally {
    syncing = false;
  }
}
