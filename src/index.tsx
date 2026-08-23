import { staticClasses, DialogButton, Navigation, ButtonItem, PanelSectionRow } from "@decky/ui";
import { definePlugin, routerHook, toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import { FaPuzzlePiece, FaCog } from "react-icons/fa";

import { GameControlsSection } from "./sections/GameControls";
import { InstalledSection } from "./sections/Installed";
import { GameToolsSection } from "./sections/GameTools";
import { ToolsSection } from "./sections/Tools";
import { SlsSteamCompact } from "./sections/SlsSteamCompact";
import { AdvancedPage } from "./pages/AdvancedPage";
import { patchLibraryApp } from "./lib/patchLibraryApp";
import { initStorePatch } from "./patches/StorePatch";
import { initWorkshopPatch } from "./patches/WorkshopPatch";
import { popAddEvents, getGamesInQam, getHideToolsQam, getAutoFix, addAutoFixPending, popInjectionEvents, reloadSteam, clientFixNeeded, runClientFix, slsConfigHealth, healSlsConfig, getSlssteamStatus, installSlssteam, getCheckDependenciesOnBoot, tokeerEnsureRuntime, tokeerProtonStatus, tokeerEnsureProton, crInstallStatus, crEnsureInstalled } from "./api";
import { startBadges, stopBadges, removeAllBadges } from "./lib/badges";
import { runAutoFixSweep } from "./lib/autoFix";
import { syncSlsCollection } from "./lib/collection";
import { refreshTokeerAvailabilityCache, TOKEER_CACHE_TTL_MS } from "./lib/tokeerAvailability";
import { archiveReconcileAll } from "./api";

const LIBRARY_ROUTE = "/library/app/:appid";
const ADVANCED_ROUTE = "/slsdeck";
const ACTIONS_FIXES_QAM_KEY = "slsdeck.actionsFixesQam";
const ACTIONS_FIXES_QAM_EVENT = "slsdeck-actions-fixes-qam";

// Remembers where the panel was scrolled so reopening the QAM returns there.
let savedScroll = 0;
const PLUGIN_SESSION_STARTED = Date.now();
// Decky counts three rapid Steam webhelper disconnects as a crash loop.
const DEPENDENCY_INITIAL_DELAY_MS = 2 * 60 * 1000;
const DEPENDENCY_STABLE_WINDOW_MS = 45 * 1000;
const DEPENDENCY_STEP_GAP_MS = 20 * 1000;
const DEPENDENCY_RETRY_MS = 30 * 60 * 1000;
const DEPENDENCY_LOCK_KEY = "__slsdeckDependencyRepairPromise";

type DependencyLifecycleToken = { active: boolean; stableSince: number };

function lifecyclePause(ms: number, token: DependencyLifecycleToken): Promise<void> {
  return new Promise((resolve) => {
    if (!token.active) return resolve();
    window.setTimeout(resolve, ms);
  });
}

function cefLooksStable(token: DependencyLifecycleToken): boolean {
  if (!token.active) return false;
  if (document.visibilityState !== "visible") return false;
  if (!(window as any).SteamClient) return false;
  return Date.now() - token.stableSince >= DEPENDENCY_STABLE_WINDOW_MS;
}

/**
 * Re-assert activated build templates on boot.
 *
 * The backend already reconciles the parts it owns (pin, fixes, DLC) during its
 * own warmup. This pass exists for the one piece it CANNOT touch: launch
 * arguments live in Steam (SetAppLaunchOptions) and are only reachable from
 * here. Reporting-only on the backend side, so it does no work twice.
 */
async function applyArchiveTemplatesOnBoot(): Promise<void> {
  try {
    const r = await archiveReconcileAll(false);
    for (const t of r.results || []) {
      if (!t.success || !t.installed) continue;
      try {
        const SC: any = (window as any).SteamClient;
        const current = SC?.Apps?.GetLaunchOptionsForApp?.(t.appid);
        const wanted = t.wantLaunchOptions ?? "";
        if (typeof current === "string" && current === wanted) continue;
        SC?.Apps?.SetAppLaunchOptions?.(t.appid, wanted);
        console.info(`SLSDeck: restored launch args for ${t.appid} from its active build template`);
      } catch { /* Steam may not expose it on this build */ }
    }
  } catch (e) {
    console.warn("SLSDeck: archive template boot pass failed", e);
  }
}

async function repairMissingDependenciesFromPluginLifecycle(token: DependencyLifecycleToken): Promise<void> {
  if (!cefLooksStable(token)) {
    console.info("SLSDeck: dependency repair deferred until Steam CEF is stable");
    return;
  }

  const shared = window as any;
  if (shared[DEPENDENCY_LOCK_KEY]) {
    console.info("SLSDeck: dependency repair already running; coalescing request");
    await shared[DEPENDENCY_LOCK_KEY].catch(() => {});
    return;
  }

  const run = (async () => {
    const enabled = await getCheckDependenciesOnBoot().catch(() => ({ enabled: true }));
    if (!enabled.enabled || !token.active || !cefLooksStable(token)) return;

    const sls = await getSlssteamStatus().catch(() => null);
    if (!token.active || !cefLooksStable(token)) return;
    if (!sls?.installed) {
      await installSlssteam().catch((e) => {
        console.warn("SLSDeck: lifecycle SLSsteam install failed", e);
      });
      // Installation is asynchronous and may lead into the normal Steam/client
      // recovery flow. Re-check the remaining chain on the next lifecycle pass.
      return;
    }

    try {
      const fix = await clientFixNeeded();
      if (token.active && fix.success && fix.needed) {
        await runClientFix(false);
        // The client fix can restart Steam. Do not begin another heavy install
        // in the same CEF session; the next boot resumes the chain.
        return;
      }
    } catch (e) {
      console.warn("SLSDeck: lifecycle client-fix check failed", e);
    }

    try {
      // Always ask the version-aware installer to reconcile the runtime. It
      // skips an already-current bundle, updates an older one and repairs an
      // incomplete one, so an existing dependency is not mistaken for current.
      if (token.active) {
        await tokeerEnsureRuntime();
        await lifecyclePause(DEPENDENCY_STEP_GAP_MS, token);
      }
    } catch (e) {
      console.warn("SLSDeck: lifecycle Tokeer runtime repair failed", e);
    }
    if (!token.active || !cefLooksStable(token)) return;

    let deferredAt = 0;
    try { deferredAt = Number(window.localStorage.getItem("slsdeck.heavyDepsAfterRestart") || "0"); } catch { /* */ }
    if (deferredAt >= PLUGIN_SESSION_STARTED) {
      window.dispatchEvent(new Event("slsdeck-dependencies-changed"));
      return;
    }
    try { window.localStorage.removeItem("slsdeck.heavyDepsAfterRestart"); } catch { /* */ }

    try {
      const status = await tokeerProtonStatus();
      const healthy = !!status.installed && status.healthy !== false && !status.partial;
      if (token.active && !healthy) {
        await tokeerEnsureProton();
        await lifecyclePause(DEPENDENCY_STEP_GAP_MS, token);
      }
    } catch (e) {
      console.warn("SLSDeck: lifecycle GE-Proton repair failed", e);
    }
    if (!token.active || !cefLooksStable(token)) return;

    try {
      const status: any = await crInstallStatus();
      // Never reinstall a healthy CloudRedirect. Accept both the aggregate flag
      // and the detailed Moon/UI flags returned by newer backends.
      const healthy = !!status.installed ||
        (!!status.uiInstalled && !!(status.nativeMoon || status.hasLib));
      if (token.active && !healthy) await crEnsureInstalled();
    } catch (e) {
      console.warn("SLSDeck: lifecycle CloudRedirect repair failed", e);
    }
    if (token.active) window.dispatchEvent(new Event("slsdeck-dependencies-changed"));
  })();

  shared[DEPENDENCY_LOCK_KEY] = run;
  try {
    await run;
  } finally {
    if (shared[DEPENDENCY_LOCK_KEY] === run) delete shared[DEPENDENCY_LOCK_KEY];
  }
}

// SLSsteam goes inactive after a Steam client update whose steamclient.so hash
// isn't in SLSsteam's list (SafeMode aborts the load). We detect that and offer a
// one-tap client-fix (Headcrab re-pin), instead of leaving the user with a
// silently-dead injection.
function RepairBanner() {
  const [needed, setNeeded] = useState(false);
  const [reason, setReason] = useState("");
  // A broken config.yaml is the OTHER way the engine goes silently dead:
  // injection can be perfectly healthy while a malformed/missing key makes
  // SLSsteam fall back to its own defaults (DisableUpdates: yes hands added
  // games zero depots). Both faults surface through this one banner.
  const [cfgIssues, setCfgIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  useEffect(() => {
    (async () => {
      try {
        // Only relevant once SLSsteam is actually installed — a fresh setup isn't
        // "inactive", it's just not set up yet (the onboarding button handles that).
        const st = await getSlssteamStatus();
        if (!st?.installed) return;
        const [fix, cfg] = await Promise.all([
          clientFixNeeded().catch(() => ({ success: false } as any)),
          slsConfigHealth().catch(() => ({ success: false } as any)),
        ]);
        const clientBad = !!(fix?.success && fix.needed);
        const issues = (cfg?.success && cfg.changed ? cfg.issues : []) || [];
        if (clientBad) { setNeeded(true); setReason(fix.reason || ""); }
        if (issues.length) { setNeeded(true); setCfgIssues(issues); }
      } catch { /* ignore */ }
    })();
  }, []);
  if (!needed) return null;
  const configOnly = cfgIssues.length > 0 && !reason;
  return (
    <div style={{ margin: "6px 8px", padding: "8px 10px", borderRadius: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#f5a623" }}>
        {configOnly ? "SLSsteam config needs repair" : "SLSsteam looks inactive"}
      </div>
      <div style={{ fontSize: 11, opacity: 0.8, margin: "2px 0 6px" }}>
        {configOnly
          ? `${cfgIssues.length} problem${cfgIssues.length === 1 ? "" : "s"} in config.yaml — SLSsteam falls back to its own defaults for anything malformed, which stops added games downloading.`
          : (reason || "A Steam client update may have an unrecognised steamclient.so — added games won't load until it's repaired.")}
      </div>
      {cfgIssues.length > 0 && (
        <div style={{ fontSize: 10, opacity: 0.7, margin: "0 0 6px", whiteSpace: "pre-wrap" }}>
          {cfgIssues.slice(0, 4).map((s) => `• ${s}`).join("\n")}
          {cfgIssues.length > 4 ? `\n• …and ${cfgIssues.length - 4} more` : ""}
        </div>
      )}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              // Heal the config FIRST: it's seconds of work, and a client fix
              // run against a broken config would re-download ~170 MB of Steam
              // client and still leave the engine reading bad defaults.
              let healed = 0;
              if (cfgIssues.length) {
                setDone("Repairing config.yaml…");
                const h = await healSlsConfig();
                if (!h.success) { setDone(h.error || "Config repair failed."); setBusy(false); return; }
                healed = h.count || 0;
                setCfgIssues([]);
              }
              if (reason) {
                setDone("Repairing client… this can take a couple of minutes and may restart Steam.");
                const r = await runClientFix(true);
                setDone(r.success
                  ? `Repair started${healed ? ` (fixed ${healed} config issue${healed === 1 ? "" : "s"})` : ""} — Steam will reconfigure and reload.`
                  : (r.error || "Repair failed."));
                if (r.success) setTimeout(() => setNeeded(false), 4000);
              } else {
                setDone(`Fixed ${healed} config issue${healed === 1 ? "" : "s"} — fully restart Steam to apply.`);
                setTimeout(() => setNeeded(false), 4000);
              }
            } catch (e) { setDone(`Failed: ${e}`); }
            setBusy(false);
          }}
        >
          {busy ? "Repairing…" : configOnly ? "Repair config" : "Repair SLSsteam"}
        </ButtonItem>
      </PanelSectionRow>
      {done ? <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{done}</div> : null}
    </div>
  );
}

function Content() {
  const [refreshToken, setRefreshToken] = useState(0);
  const bump = () => setRefreshToken((t) => t + 1);
  const [actionsFixesQam, setActionsFixesQam] = useState(true);
  const [gamesInQam, setGamesInQam] = useState(true);
  const [hideToolsQam, setHideToolsQam] = useState(true);
  // Until SLSsteam is installed, the QAM shows only the setup block — no game
  // actions, game list or tools (there's nothing for them to act on yet).
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (!installed) return;
    // Refresh Discord-backed vault/game availability independently of the
    // Anti-Denuvo page. The cache itself coalesces callers and preserves the
    // last good result when Discord is logged out or temporarily unrendered.
    const refresh = () => refreshTokeerAvailabilityCache(false).catch(() => {});
    const first = setTimeout(refresh, 12000);
    const interval = setInterval(refresh, TOKEER_CACHE_TTL_MS);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [installed]);



  useEffect(() => {
    const readActionsFixes = () => {
      try {
        const raw = window.localStorage.getItem(ACTIONS_FIXES_QAM_KEY);
        setActionsFixesQam(raw == null ? true : raw === "1");
      } catch {
        setActionsFixesQam(true);
      }
    };
    readActionsFixes();
    const onActionsFixes = () => readActionsFixes();
    window.addEventListener(ACTIONS_FIXES_QAM_EVENT, onActionsFixes as EventListener);
    getGamesInQam().then((r) => setGamesInQam(!!r.enabled)).catch(() => {});
    getHideToolsQam().then((r) => setHideToolsQam(!!r.enabled)).catch(() => {});
    const checkInstalled = () =>
      getSlssteamStatus().then((s) => setInstalled(!!s?.installed)).catch(() => {});
    checkInstalled();
    // Re-check so the sections appear right after a first-time install completes.
    const iv = setInterval(checkInstalled, 4000);
    return () => {
      clearInterval(iv);
      window.removeEventListener(ACTIONS_FIXES_QAM_EVENT, onActionsFixes as EventListener);
    };
  }, []);

  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    let node: HTMLElement | null = el.parentElement;
    let scroller: HTMLElement | null = null;
    while (node) {
      const oy = getComputedStyle(node).overflowY;
      if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
        scroller = node;
        break;
      }
      node = node.parentElement;
    }
    if (!scroller) return;
    if (savedScroll > 0) {
      requestAnimationFrame(() => {
        try { scroller!.scrollTop = savedScroll; } catch { /* ignore */ }
      });
    }
    const onScroll = () => { savedScroll = scroller!.scrollTop; };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller!.removeEventListener("scroll", onScroll);
  }, []);


  return (
    <>
      <div ref={anchor} style={{ height: 0 }} />
      <RepairBanner />
      <SlsSteamCompact />
      {/* Per-game surfaces first: "This game" and "Actions & fixes" both act on
          whatever library page you came from, so they belong above the whole-
          library list rather than under it. */}
      {installed && actionsFixesQam && <GameControlsSection onChanged={bump} />}
      {installed && <GameToolsSection />}
      {installed && gamesInQam && <InstalledSection refreshToken={refreshToken} onChanged={bump} />}
      {installed && !hideToolsQam && <ToolsSection />}
    </>
  );
}

export default definePlugin(() => {
  console.log("SLSDeck (Decky) initializing");

  // Two button surfaces: (1) the library app-details bar, injected via a React
  // tree patch (always on while the plugin runs); and (2) the store-page button,
  // injected into the CEF store tab over CDP and configurable in Settings.
  let libraryPatch: ReturnType<typeof patchLibraryApp> | null = null;
  let stopStorePatch: (() => void) | null = null;
  let stopWorkshopPatch: (() => void) | null = null;
  try {
    libraryPatch = patchLibraryApp();
  } catch (e) {
    console.error("SLSDeck: failed to patch library app page", e);
  }
  try {
    stopStorePatch = initStorePatch();
  } catch (e) {
    console.error("SLSDeck: failed to init store patch", e);
  }
  try {
    stopWorkshopPatch = initWorkshopPatch();
  } catch (e) {
    console.error("SLSDeck: failed to init workshop patch", e);
  }

  // Library capsule badges (SLS / LEGIT) — injected into the gamepad window.
  let libraryBadgePatch: any = null;
  try {
    startBadges();
    libraryBadgePatch = routerHook.addPatch("/library", (tree: any) => {
      startBadges();
      return tree;
    });
  } catch (e) {
    console.error("SLSDeck: failed to start library badges", e);
  }

  // Full-page "Advanced" surface (junkstore-style sidebar page).
  try {
    routerHook.addRoute(ADVANCED_ROUTE, () => <AdvancedPage />, { exact: true });
  } catch (e) {
    console.error("SLSDeck: failed to register Advanced route", e);
  }

  // Dependency repair belongs to plugin initialization, not a page component.
  // Do not start it while Steam/CEF is still recovering from a plugin install or
  // client restart: repeated webhelper disconnects make Decky stop itself after
  // the third crash. A shared lock serializes hot-reload/duplicate invocations.
  const dependencyLifecycleToken: DependencyLifecycleToken = {
    active: true,
    stableSince: Date.now(),
  };
  const noteCefTransition = () => {
    dependencyLifecycleToken.stableSince = Date.now();
  };
  document.addEventListener("visibilitychange", noteCefTransition);
  window.addEventListener("pageshow", noteCefTransition);

  const dependencyRepairFirst = setTimeout(() => {
    repairMissingDependenciesFromPluginLifecycle(dependencyLifecycleToken).catch(() => {});
  }, DEPENDENCY_INITIAL_DELAY_MS);
  const dependencyRepairRetry = setInterval(() => {
    repairMissingDependenciesFromPluginLifecycle(dependencyLifecycleToken).catch(() => {});
  }, DEPENDENCY_RETRY_MS);

  // Persistent background notifier: adds run in the backend even if the UI that
  // started them is closed, so this always-running poller fires the toast.
  const addNotifier = setInterval(async () => {
    try {
      const r = await popAddEvents();
      (r.events || []).forEach((e) => {
        const dl = (e as any).autoDownload;
        const isAssella = (e as any).assella;
        const liveReady = !!(e as any).liveReady;
        toaster.toast({
          title: "SLSDeck",
          body:
            e.status === "done" && e.success
              ? (isAssella
                  ? `Installed ${e.name}${dl ? " — reloading Steam…" : " — restart Steam to see it"}`
                  : liveReady
                    ? (dl ? `Added ${e.name} — downloading in Steam…` : `Added ${e.name} — available in Steam`)
                    : `Added ${e.name} — restart Steam to finish provisioning`)
              : `${isAssella ? "Install" : "Add"} failed: ${e.name}${e.error ? " — " + e.error : ""}`,
        });
        if (e.status === "done" && e.success) {
          // slsteam-moon's verified HotReload path updates package/license/appinfo
          // in the current Steam session, so normal SLS adds must NOT restart.
          // Keep ASSella's existing reload behavior separate from this live path.
          if (isAssella && dl) { reloadSteam().catch(() => {}); }
          getAutoFix()
            .then((r) => (r.enabled ? addAutoFixPending(e.appid) : undefined))
            .catch(() => {});
          // Keep the optional "SLSDeck" collection in sync as games are added.
          syncSlsCollection().catch(() => {});
        }
      });
    } catch {
      /* ignore */
    }
    // Injection watchdog notifications (Steam client update broke the hook).
    try {
      const ir = await popInjectionEvents();
      (ir.events || []).forEach((e) => {
        toaster.toast({ title: "SLSDeck", body: e.message });
      });
    } catch {
      /* ignore */
    }
  }, 2500);

  // Background auto-fix sweep: applies queued fixes once games finish installing.
  const autoFixSweep = setInterval(() => { runAutoFixSweep().catch(() => {}); }, 20000);
  setTimeout(() => { runAutoFixSweep().catch(() => {}); }, 4000);

  // Keep the optional "SLSDeck" collection reconciled (self-no-ops when the pref
  // is off or nothing changed). Boot once, then slowly to catch removals/purges
  // that don't go through the add-notifier above.
  setTimeout(() => { syncSlsCollection().catch(() => {}); }, 6000);
  // Re-assert activated build templates once Steam has settled. Deliberately
  // late: SetAppLaunchOptions needs a live SteamClient, and the backend has
  // already done its half during warmup.
  setTimeout(() => { applyArchiveTemplatesOnBoot().catch(() => {}); }, 12000);
  const collectionSync = setInterval(() => { syncSlsCollection().catch(() => {}); }, 60000);

  return {
    name: "SLSDeck",
    titleView: (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div className={staticClasses.Title}>SLSDeck</div>
        <DialogButton
          onClick={() => {
            try {
              Navigation.CloseSideMenus();
              Navigation.Navigate(ADVANCED_ROUTE);
            } catch (e) {
              console.error("SLSDeck: could not open Advanced page", e);
            }
          }}
          style={{
            height: "28px",
            width: "28px",
            minWidth: "28px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
          aria-label="Advanced settings"
        >
          <FaCog />
        </DialogButton>
      </div>
    ),
    content: <Content />,
    icon: <FaPuzzlePiece />,
    onDismount() {
      console.log("SLSDeck unloading");
      dependencyLifecycleToken.active = false;
      try { clearTimeout(dependencyRepairFirst); } catch { /* ignore */ }
      try { clearInterval(dependencyRepairRetry); } catch { /* ignore */ }
      try { document.removeEventListener("visibilitychange", noteCefTransition); } catch { /* ignore */ }
      try { window.removeEventListener("pageshow", noteCefTransition); } catch { /* ignore */ }
      try { clearInterval(addNotifier); } catch { /* ignore */ }
      try { clearInterval(autoFixSweep); } catch { /* ignore */ }
      try { clearInterval(collectionSync); } catch { /* ignore */ }
      try { if (libraryPatch) routerHook.removePatch(LIBRARY_ROUTE, libraryPatch); } catch { /* ignore */ }
      try { routerHook.removeRoute(ADVANCED_ROUTE); } catch { /* ignore */ }
      try { stopBadges(); removeAllBadges(); } catch { /* ignore */ }
      try { if (libraryBadgePatch) routerHook.removePatch("/library", libraryBadgePatch); } catch { /* ignore */ }
      try { if (stopStorePatch) stopStorePatch(); } catch { /* ignore */ }
      try { if (stopWorkshopPatch) stopWorkshopPatch(); } catch { /* ignore */ }
    },
  };
});
