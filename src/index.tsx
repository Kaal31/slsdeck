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
import { popAddEvents, getGamesInQam, getHideToolsQam, getAutoFix, addAutoFixPending, popInjectionEvents, reloadSteam, clientFixNeeded, runClientFix, getSlssteamStatus, tokeerEnsureRuntime, tokeerEnsureProton, crEnsureInstalledAuto } from "./api";
import { startBadges, stopBadges, removeAllBadges } from "./lib/badges";
import { runAutoFixSweep } from "./lib/autoFix";
import { syncSlsCollection } from "./lib/collection";
import { refreshTokeerAvailabilityCache, TOKEER_CACHE_TTL_MS } from "./lib/tokeerAvailability";

const LIBRARY_ROUTE = "/library/app/:appid";
const ADVANCED_ROUTE = "/slsdeck";
const ACTIONS_FIXES_QAM_KEY = "slsdeck.actionsFixesQam";
const ACTIONS_FIXES_QAM_EVENT = "slsdeck-actions-fixes-qam";

// Remembers where the panel was scrolled so reopening the QAM returns there.
let savedScroll = 0;
const PLUGIN_SESSION_STARTED = Date.now();
let heavyDepsStarted = false;

// SLSsteam goes inactive after a Steam client update whose steamclient.so hash
// isn't in SLSsteam's list (SafeMode aborts the load). We detect that and offer a
// one-tap client-fix (Headcrab re-pin), instead of leaving the user with a
// silently-dead injection.
function RepairBanner() {
  const [needed, setNeeded] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  useEffect(() => {
    (async () => {
      try {
        // Only relevant once SLSsteam is actually installed — a fresh setup isn't
        // "inactive", it's just not set up yet (the onboarding button handles that).
        const st = await getSlssteamStatus();
        if (!st?.installed) return;
        const r = await clientFixNeeded();
        if (r.success && r.needed) { setNeeded(true); setReason(r.reason || ""); }
      } catch { /* ignore */ }
    })();
  }, []);
  if (!needed) return null;
  return (
    <div style={{ margin: "6px 8px", padding: "8px 10px", borderRadius: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#f5a623" }}>SLSsteam looks inactive</div>
      <div style={{ fontSize: 11, opacity: 0.8, margin: "2px 0 6px" }}>
        {reason || "A Steam client update may have an unrecognised steamclient.so — added games won't load until it's repaired."}
      </div>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={busy}
          onClick={async () => {
            setBusy(true); setDone("Repairing… this can take a couple of minutes and may restart Steam.");
            try {
              const r = await runClientFix();
              setDone(r.success ? "Repair started — Steam will reconfigure and reload." : (r.error || "Repair failed."));
              if (r.success) { setTimeout(() => setNeeded(false), 4000); }
            } catch (e) { setDone(`Failed: ${e}`); }
            setBusy(false);
          }}
        >
          {busy ? "Repairing…" : "Repair SLSsteam"}
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
    if (!installed || heavyDepsStarted) return;
    let deferredAt = 0;
    try { deferredAt = Number(window.localStorage.getItem("slsdeck.heavyDepsAfterRestart") || "0"); } catch { /* */ }
    // The first SLSsteam installation marks this session before it restarts.
    // Do not start large downloads in that same session; a newly loaded plugin
    // has a later PLUGIN_SESSION_STARTED value and proceeds automatically.
    if (deferredAt >= PLUGIN_SESSION_STARTED) return;
    heavyDepsStarted = true;
    try { window.localStorage.removeItem("slsdeck.heavyDepsAfterRestart"); } catch { /* */ }
    (async () => {
      // A plugin-only reinstall may find SLSsteam already present and therefore
      // never pass through the first-install pre-restart path. The runtime is
      // tiny and version-aware, so ensure it here before the large dependencies.
      try {
        const runtime = await tokeerEnsureRuntime();
        if (!runtime.success) console.warn("SLSDeck: background Tokeer runtime install failed", runtime.error);
      } catch (e) {
        console.warn("SLSDeck: background Tokeer runtime install failed", e);
      }
      try {
        const proton = await tokeerEnsureProton();
        if (!proton.success) console.warn("SLSDeck: background GE-Proton install failed", proton.error);
      } catch (e) {
        console.warn("SLSDeck: background GE-Proton install failed", e);
      }
      try {
        const cloud = await crEnsureInstalledAuto();
        if (!cloud.installed) console.warn("SLSDeck: background CloudRedirect install incomplete", cloud.log);
      } catch (e) {
        console.warn("SLSDeck: background CloudRedirect install failed", e);
      }
    })();
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
      {installed && actionsFixesQam && <GameControlsSection onChanged={bump} />}
      {installed && gamesInQam && <InstalledSection refreshToken={refreshToken} onChanged={bump} />}
      {installed && <GameToolsSection />}
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