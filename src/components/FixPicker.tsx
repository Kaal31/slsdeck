import { DialogButton, Focusable, Navigation } from "@decky/ui";
import { openFilePicker, FileSelectionType } from "@decky/api";
import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  AddState,
  FixCheck,
  FixInfo,
  InstalledFix,
  applyFix,
  getAddStatus,
  getFixStatus,
  getGameInstallPath,
  getInstalledFixes,
  getUnfixStatus,
  startAdd,
  unfix,
  unpinGame,
  getPinStatus,
  pinGame,
  getInstalledApps,
  getRyuuKey,
  netsockStatus,
  netsockSet,
  NetsockStatus,
  LuatoolsCatalogFix,
  applyLuatoolsFix,
  getAutoApply,
  pinForLuatoolsFix,
  smokeapiStatus,
  smokeapiInstall,
  smokeapiRemove,
  dlcUnlockersStatus,
  dlcUnlockerInstall,
  dlcUnlockerRemove,
  UnlockerKind,
  hvAutoStatus,
  hvAutoApply,
  crakStatus,
  crakApply,
  crakApplyLocal,
  hvApplyLocal,
  customListFixes,
  customApplyFix,
  CustomItem,
  getDlcOwnedOnly,
  triggerSteamInstall,
} from "../api";
import { isInLibrary } from "../lib/ownership";
import { applyFixRuntime, resetFixRuntime, setNetsockLaunchOption, autoRepointFromState, clearFixLaunchOptions } from "../lib/fixRuntime";
import { checkFixesFull } from "../lib/fixIndex";
import { runBuildAccurateApply, isDownloadComplete } from "../lib/buildApply";
import { prepareCatalogFixBuild } from "../lib/catalogFixBuild";
import { launchGame } from "../lib/launchGame";
import { noInternetFixBegin } from "../api";
import { setupAndVerifyTokeer } from "../lib/tokeerSetup";

interface RowDef {
  key: string;
  label: string;
  fixType: string;
  info?: FixInfo;
}

// Colour a source badge (Ryuu / luatools ship Online / Bypass / Crack / Tested /
// Generic / Hypervisor). Shown as a small pill next to the fix name so the exact
// tag the source gave is visible instead of the collapsed row label.
// Colour a source tag. Uses substring matching so lua.tools' free-form tags
// ("voices38 (crack)", "SteamTools Achievements Fix", "Ubisoft", …) get a
// sensible colour, not just the exact Ryuu badges.
function badgeStyle(badge: string): { bg: string; fg: string } {
  const b = (badge || "").toLowerCase();
  // Colours mirror the Steam library capsule badges (see lib/badges.ts):
  //   online fix → lavender, denuvo & crack/bypass → red, legit → green.
  if (b.includes("online")) return { bg: "rgba(202,168,255,0.18)", fg: "#caa8ff" };      // lavender (matches onlinefix capsule)
  if (b.includes("denuvo") || b.includes("hypervisor")) return { bg: "rgba(224,82,82,0.18)", fg: "#f08a8a" }; // red
  if (b.includes("crack") || b.includes("bypass")) return { bg: "rgba(224,82,82,0.18)", fg: "#f08a8a" };      // red, like denuvo
  if (b.includes("legit")) return { bg: "rgba(47,168,92,0.18)", fg: "#5fd08a" };         // green
  if (b.includes("achiev")) return { bg: "rgba(240,168,208,0.16)", fg: "#f0a8d0" };      // rose (kept distinct from lavender)
  if (b.includes("test")) return { bg: "rgba(94,230,196,0.16)", fg: "#5ee6c4" };         // teal
  return { bg: "rgba(255,255,255,0.10)", fg: "#c8d2e0" }; // generic / unknown
}

function BadgeChip({ badge, inline }: { badge?: string; inline?: boolean }) {
  if (!badge) return null;
  const s = badgeStyle(badge);
  const label = badge.charAt(0).toUpperCase() + badge.slice(1);
  return (
    <span style={{
      display: "inline-block", marginLeft: inline ? 6 : 0, marginRight: inline ? 0 : 5, marginTop: inline ? 0 : 3,
      padding: "1px 7px", borderRadius: 999,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.3, verticalAlign: "middle",
      background: s.bg, color: s.fg,
    }}>
      {label}
    </span>
  );
}

export function FixPicker({ appid, onReload, onClose }: { appid: number; onReload?: () => void; onClose?: () => void }) {
  const [check, setCheck] = useState<FixCheck | null>(null);
  const [applied, setApplied] = useState<InstalledFix[]>([]);
  const [installPath, setInstallPath] = useState("");
  const [pinned, setPinned] = useState(false);
  const [pinInfo, setPinInfo] = useState<{ buildid?: string; depots?: { [d: string]: string } }>({});
  const [added, setAdded] = useState(false);
  // DLC unlockers (SmokeAPI / CreamAPI / Ubisoft) only make sense on games you
  // own. When this pref is on (default), hide them on SLS-added games.
  const [dlcOwnedOnly, setDlcOwnedOnly] = useState(true);
  const [smoke, setSmoke] = useState<{ installed: boolean; supported: boolean } | null>(null);
  const [dlcU, setDlcU] = useState<Partial<Record<UnlockerKind, { installed: boolean; supported: boolean }>>>({});
  // Set when a crack/HV host blocks auto-download and we hand off to the browser.
  // Surfaces an "Apply from Downloads" button so the user finishes with the file
  // they just downloaded.
  const [manualDl, setManualDl] = useState<{ url: string; kind: "crak" | "hv" } | null>(null);
  const [customFixes, setCustomFixes] = useState<CustomItem[]>([]);
  const [hv, setHv] = useState<{ found: boolean; buildid?: string; status?: string; href?: string; gids?: { [d: string]: string } } | null>(null);
  const [crak, setCrak] = useState<{ found: boolean; buildid?: string; status?: string; href?: string; badges?: string[]; gids?: { [d: string]: string } } | null>(null);
  const [hasRyuuKey, setHasRyuuKey] = useState(true);
  const [busy, setBusy] = useState("");
  const [ns, setNs] = useState<NetsockStatus | null>(null);
  const [msg, setMsg] = useState("");
  const [autoApply, setAutoApplyState] = useState(false);
  // Guided build-accurate apply: after pin+update we wait for the user to press
  // "Apply now". `awaiting` holds the deferred apply and the originating fix row.
  const [awaiting, setAwaiting] = useState<{ key: string; label: string; run: () => Promise<void> } | null>(null);
  const [activeFixKey, setActiveFixKey] = useState("");
  const [fixState, setFixState] = useState<AddState>({});
  const [dlComplete, setDlComplete] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const dlPoll = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFlag = useRef(false);

  const stop = () => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  };
  const stopDl = () => {
    if (dlPoll.current) {
      clearInterval(dlPoll.current);
      dlPoll.current = null;
    }
  };
  useEffect(() => () => {
    stop();
    stopDl();
    stopFlag.current = true;
  }, []);

  const refresh = async () => {
    try {
      setCheck(await checkFixesFull(appid));
    } catch {
      setCheck(null);
    }
    try {
      const r = await getInstalledFixes();
      setApplied((r.fixes || []).filter((f) => f.appid === appid));
    } catch {
      /* ignore */
    }
    try {
      const p = await getGameInstallPath(appid);
      setInstallPath(p.success ? p.installPath || "" : "");
    } catch {
      setInstallPath("");
    }
    try {
      const p = await getPinStatus(appid);
      setPinned(!!p.pinned);
      setPinInfo({ buildid: p.buildid, depots: p.depots });
    } catch {
      setPinned(false);
      setPinInfo({});
    }
    try {
      const r = await getInstalledApps();
      setAdded(!!r.success && (r.apps || []).some((a) => a.appid === appid));
    } catch {
      setAdded(false);
    }
    try {
      setDlcOwnedOnly(!!(await getDlcOwnedOnly()).enabled);
    } catch {
      setDlcOwnedOnly(true);
    }
    try {
      const r = await customListFixes(appid);
      setCustomFixes(r.success ? (r.items || []) : []);
    } catch {
      setCustomFixes([]);
    }
    try {
      const r = await getRyuuKey();
      setHasRyuuKey(r.success ? !!(r.key || "").trim() : false);
    } catch {
      setHasRyuuKey(false);
    }
    try {
      setNs(await netsockStatus(appid));
    } catch {
      setNs(null);
    }
    try {
      setAutoApplyState((await getAutoApply()).enabled);
    } catch {
      setAutoApplyState(false);
    }
    try {
      const r = await smokeapiStatus(appid);
      setSmoke(r.success ? { installed: !!r.installed, supported: !!r.supported } : null);
    } catch {
      setSmoke(null);
    }
    try {
      const r = await dlcUnlockersStatus(appid);
      const next: Partial<Record<UnlockerKind, { installed: boolean; supported: boolean }>> = {};
      if (r.success) {
        (["cream", "uplayr1", "uplayr2"] as UnlockerKind[]).forEach((k) => {
          const s = (r as any)[k];
          if (s && s.supported) next[k] = { installed: !!s.installed, supported: true };
        });
      }
      setDlcU(next);
    } catch {
      setDlcU({});
    }
    try {
      const r = await hvAutoStatus(appid);
      setHv(r.success && r.found
        ? { found: true, buildid: r.buildid, status: r.resolve?.status, href: r.hrefs?.[0], gids: (r.resolve as any)?.gids || {} }
        : { found: false });
    } catch {
      setHv({ found: false });
    }
    try {
      const r = await crakStatus(appid);
      setCrak(r.success && r.found
        ? { found: true, buildid: r.buildid, status: r.resolve?.status, href: r.hrefs?.[0], badges: r.badges, gids: (r.resolve as any)?.gids || {} }
        : { found: false });
    } catch {
      setCrak({ found: false });
    }
  };

  useEffect(() => {
    stop();
    stopDl();
    stopFlag.current = false;
    setBusy("");
    setMsg("");
    setCheck(null);
    setApplied([]);
    setAwaiting(null);
    setActiveFixKey("");
    setFixState({});
    setDlComplete(false);
    refresh();
  }, [appid]);

  const watch = (
    getState: () => Promise<{ state: AddState }>,
    okMsg: string,
    failMsg: string,
    onDone?: (st: AddState) => void
  ) => {
    stop();
    poll.current = setInterval(async () => {
      try {
        const st: AddState = (await getState()).state || {};
        setMsg(st.status || "");
        setFixState(st);
        if (["done", "failed", "cancelled"].includes(st.status || "")) {
          stop();
          setBusy("");
          setMsg(st.status === "done" ? okMsg : st.error || failMsg);
          if (st.status === "done") {
            onDone?.(st);
            onReload?.();
            refresh();
          }
        }
      } catch {
        /* keep polling */
      }
    }, 800);
  };

  // Pin this version. If the game's manifest isn't added yet, add it first
  // (that registers the game with SLSsteam) and then pin; if the manifest is
  // already added, this only pins the current version.
  const doPinVersion = async () => {
    if (pinned) return;
    // Manifest already present → just pin.
    if (added) {
      setBusy("game:pin");
      setMsg("Pinning current version…");
      try {
        const r = await pinGame(appid);
        if (r.success) {
          setPinned(true);
          setMsg("Version pinned");
        } else {
          setMsg(r.error || "Pin failed");
        }
      } catch {
        setMsg("Pin failed");
      } finally {
        setBusy("");
      }
      return;
    }
    // No manifest yet → add it, then pin on completion.
    setBusy("game:manifest");
    setMsg("Adding game…");
    try {
      await startAdd(appid);
    } catch {
      setBusy("");
      setMsg("Could not start");
      return;
    }
    watch(
      () => getAddStatus(appid),
      "Added & pinned — restart Steam",
      "Add failed",
      async () => {
        setAdded(true);
        try {
          const r = await pinGame(appid);
          if (r.success) setPinned(true);
        } catch {
          /* pin is best-effort; the add already succeeded */
        }
      }
    );
  };

  // Poll the game's download completion while we're waiting (guided mode) so the
  // "Apply now" card can hint when it's ready.
  const startDlPoll = () => {
    stopDl();
    setDlComplete(false);
    dlPoll.current = setInterval(async () => {
      const done = await isDownloadComplete(appid);
      setDlComplete(done);
    }, 3000);
  };

  // Shared build-accurate apply runner. `startExtract` kicks off the actual
  // extraction (applyFix / applyLuatoolsFix). The orchestration pins the fix's
  // build, triggers the Steam update, then applies — automatically (auto mode)
  // or after the user presses "Apply now" (guided). If the game is already
  // installed & downloaded, it skips straight to applying.
  const runApply = async (
    key: string,
    label: string,
    startExtract: () => Promise<{ success: boolean; error?: string }>,
    pinFn?: () => Promise<{ pinned: boolean; source?: string; changed?: boolean }>
  ) => {
    setAwaiting(null);
    setActiveFixKey(key);
    setFixState({});
    stopFlag.current = false;
    setBusy(key);
    resetFixRuntime(appid);
    const doApply = async () => {
      setAwaiting(null);
      stopDl();
      setBusy(`${key}:apply`);
      setMsg(`Applying ${label}…`);
      setFixState({ status: "starting" });
      const res = await startExtract();
      if (!res || !res.success) {
        setBusy("");
        setMsg(res?.error || "Fix failed");
        setFixState({ status: "failed", error: res?.error || "Fix failed" });
        throw new Error("apply-start-failed");
      }
      watch(
        () => getFixStatus(appid),
        `${label} applied — restart Steam`,
        "Fix failed",
        (st) => {
          applyFixRuntime(appid, st.overrides);
          autoRepointFromState(appid, st);
        }
      );
    };
    try {
      const result = await runBuildAccurateApply({
        appid,
        autoApply,
        doApply,
        pinFn,
        shouldStop: () => stopFlag.current,
        onPhase: (phase, info) => {
          if (phase === "pinning") setMsg("Finding & pinning the fix's build…");
          else if (phase === "updating")
            setMsg(
              `Pinned via ${info?.source || "source"} — updating the game in Steam to that build…`
            );
          else if (phase === "awaiting_download")
            setMsg("Steam is updating the game. When the download finishes, press “Apply now”.");
          else if (phase === "applying") setMsg(`Applying ${label}…`);
        },
      });
      if (result === "awaiting") {
        setBusy("");
        setAwaiting({ key, label, run: doApply });
        startDlPoll();
      }
    } catch {
      /* doApply already surfaced the failure */
    }
  };

  const doFix = async (row: RowDef) => {
    if (!row.info?.url) {
      setMsg("No fix available");
      return;
    }
    // Ryuu gates denuvo/fix downloads behind an account. Without the API key the
    // download would 401 — prompt for the key instead of attempting.
    if (row.info.url.includes("generator.ryuu.lol") && !hasRyuuKey) {
      setMsg("This fix needs a Ryuu API key. Add it in Decky Pirate → Settings (Sources & keys), then try again.");
      return;
    }
    if (!installPath) {
      setMsg("Game not installed — press “Pin this version” to add it, then download the game in Steam to install the fix.");
      return;
    }
    await runApply(`${row.key}:fix`, row.label, () =>
      applyFix(appid, row.info!.url!, installPath, row.fixType, check?.gameName || "")
    );
  };

  // Apply a fix chosen from the account-gated lua.tools catalog. The payload is
  // fetched with the Discord bearer token backend-side, then extracted + pinned
  // to the exact build the fix targets.
  const doLtFix = async (fix: LuatoolsCatalogFix) => {
    if (!installPath) {
      setMsg("Game not installed — press “Pin this version” to add it, then download the game in Steam to install the fix.");
      return;
    }
    await runApply(
      `lt:${fix.id}`,
      fix.name || "lua.tools fix",
      () =>
        applyLuatoolsFix(
          appid, fix.id, installPath, fix.manifest_id || "", fix.depot_id || "",
          "lua.tools fix", check?.gameName || ""
        ),
      () => pinForLuatoolsFix(appid, fix.id)
    );
  };

  const doSmoke = async (enable: boolean) => {
    setBusy("smoke");
    setMsg(enable ? "Installing SmokeAPI DLC unlock…" : "Removing SmokeAPI…");
    try {
      if (enable) {
        const r = await smokeapiInstall(appid);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides); // additive
          setSmoke({ installed: true, supported: true });
          setMsg(`DLC unlock installed (SmokeAPI ${r.tag || ""}) — restart Steam`);
        } else {
          setMsg(r.skippedLauncher
            ? "Skipped — Ubisoft/EA/Rockstar game (SmokeAPI won't help)."
            : r.error || "SmokeAPI install failed");
        }
      } else {
        const r = await smokeapiRemove(appid);
        setSmoke((s) => (s ? { ...s, installed: false } : s));
        setMsg(r.success ? "SmokeAPI removed" : r.error || "Remove failed");
      }
    } catch {
      setMsg("SmokeAPI failed");
    } finally {
      setBusy("");
    }
  };

  const UNLOCKER_LABEL: Record<UnlockerKind, string> = {
    cream: "CreamAPI",
    uplayr1: "Uplay DLC (R1)",
    uplayr2: "Uplay DLC (R2)",
  };

  const doUnlocker = async (kind: UnlockerKind, enable: boolean) => {
    setBusy(`unlock-${kind}`);
    setMsg(enable ? `Installing ${UNLOCKER_LABEL[kind]}…` : `Removing ${UNLOCKER_LABEL[kind]}…`);
    try {
      if (enable) {
        const r = await dlcUnlockerInstall(appid, kind);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides); // additive
          setDlcU((s) => ({ ...s, [kind]: { installed: true, supported: true } }));
          const detail = kind === "cream"
            ? r.unlockAll ? " (unlock-all)" : r.dlcCount ? ` (${r.dlcCount} DLC)` : ""
            : "";
          setMsg(`${r.label || UNLOCKER_LABEL[kind]} installed (${r.tag || ""})${detail} — restart Steam`);
        } else {
          setMsg(r.notSupported
            ? `No ${UNLOCKER_LABEL[kind]} target DLL in this game`
            : r.error || `${UNLOCKER_LABEL[kind]} install failed`);
        }
      } else {
        const r = await dlcUnlockerRemove(appid, kind);
        setDlcU((s) => ({ ...s, [kind]: { installed: false, supported: true } }));
        setMsg(r.success ? `${UNLOCKER_LABEL[kind]} removed` : r.error || "Remove failed");
      }
    } catch {
      setMsg(`${UNLOCKER_LABEL[kind]} failed`);
    } finally {
      setBusy("");
    }
  };

  const applyCatalogPayload = async (kind: "hv" | "crak", key: string) => {
    setAwaiting(null);
    stopDl();
    setBusy(key);
    setActiveFixKey(key);
    setFixState({ status: "fix_installing" } as any);
    setMsg(kind === "hv" ? "Downloading / extracting HV crack…" : "Downloading / extracting CrakFiles crack…");
    try {
      const r = kind === "hv"
        ? await hvAutoApply(appid, hv?.href || "")
        : await crakApply(appid, crak?.href || "");
      if (r.success) {
        setManualDl(null);
        setFixState({ status: "done" });
        if (kind === "hv") {
          setMsg(
            `HV crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}). ` +
              (r.protonTool ? `Set Proton to ${r.protonTool} for this game, then restart Steam. ` : "") +
              (r.note || ""),
          );
        } else {
          setMsg(
            `Crack installed (build ${r.buildid || "?"}${r.pinned ? ", pinned" : ""}) — ${r.installed || 0} file(s). ` +
              (r.note || "") + " Restart Steam.",
          );
        }
        onReload?.();
        refresh();
        return;
      }
      if (r.needsManual && r.url) {
        setFixState({ status: "failed", error: "Manual download required" });
        setManualDl({ url: r.url, kind });
        openManual(r.url);
        return;
      }
      const error = r.notFound
        ? kind === "hv" ? "No HV crack for this title." : "No CrakFiles crack for this title."
        : r.error || (kind === "hv" ? "HV apply failed" : "Crack apply failed");
      setFixState({ status: "failed", error });
      setMsg(error);
    } catch (e) {
      const error = `${kind === "hv" ? "HV" : "CrakFiles"} apply failed: ${e}`;
      setFixState({ status: "failed", error });
      setMsg(error);
    } finally {
      setBusy("");
    }
  };

  const runCatalogFix = async (kind: "hv" | "crak") => {
    const target = kind === "hv" ? hv : crak;
    const key = `catalog:${kind}`;
    const label = kind === "hv" ? "HV crack" : "CrakFiles crack";
    if (!target?.found) {
      setMsg(kind === "hv" ? "No HV crack for this title." : "No CrakFiles crack for this title.");
      return;
    }
    if (!installPath) {
      setMsg("Game is not installed yet — install the target build before applying this fix.");
      return;
    }
    setAwaiting(null);
    setActiveFixKey(key);
    setFixState({ status: "resolving" } as any);
    setBusy(key);
    setMsg(`Resolving required build ${target.buildid || "?"}…`);
    stopFlag.current = false;
    try {
      const prepared = await prepareCatalogFixBuild(
        appid,
        target.buildid || "",
        target.gids || {},
        (p) => {
          setMsg(p.message || "");
          setFixState({
            status: p.phase,
            ...((p.percent != null) ? { percent: p.percent } : {}),
          } as any);
        },
      );
      if (prepared.status === "ready") {
        await applyCatalogPayload(kind, key);
        return;
      }
      setBusy("");
      setAwaiting({ key, label, run: () => applyCatalogPayload(kind, key) });
      startDlPoll();
    } catch (e) {
      const error = `${e}`.replace(/^Error:\s*/, "");
      setBusy("");
      setFixState({ status: "failed", error });
      setMsg(error);
    }
  };

  const doCrak = async () => {
    await runCatalogFix("crak");
  };

  const doHv = async () => {
    await runCatalogFix("hv");
  };

  const doCustomFix = async (item: CustomItem) => {
    setBusy(`custom-${item.id}`);
    setMsg(`Applying custom fix "${item.label}"…`);
    try {
      const r = await customApplyFix(appid, item.id);
      if (r.success) {
        setMsg(`Custom fix installed — ${r.installed || 0} file(s). ${r.note || "Restart Steam."}`);
        onReload?.();
      } else {
        setMsg(r.error || "Custom fix failed.");
      }
    } catch {
      setMsg("Custom fix failed.");
    } finally {
      setBusy("");
    }
  };

  // Host blocked auto-download: open the page in the gaming-mode browser and get
  // this menu out of the way so the browser is visible. After downloading, the
  // user reopens Fixes and presses Apply again — the backend now checks
  // ~/Downloads first, so it picks the file up with no extra step.
  const openManual = (url: string) => {
    setMsg(
      "This host needs a manual download. Opening it in the browser — download the " +
      "file (it saves to Downloads), then reopen this menu and press Apply again; " +
      "it'll pick the file up automatically. The file may also have expired — if the " +
      "page is empty, there's nothing to download.",
    );
    try { Navigation.NavigateToExternalWeb(url); } catch { /* */ }
    try { Navigation.CloseSideMenus(); } catch { /* */ }
    try { onClose?.(); } catch { /* */ }
  };

  // Finish a manual-download crack: let the user pick the archive they just
  // downloaded (defaults to ~/Downloads) and extract it into the game.
  const applyFromDownloads = async () => {
    if (!manualDl) return;
    let path = "";
    try {
      const res: any = await openFilePicker(
        FileSelectionType.FILE,
        "/home/deck/Downloads",
        true,
        true,
      );
      path = res?.realpath || res?.path || "";
    } catch {
      return; // user cancelled the picker
    }
    if (!path) return;
    setBusy("manualdl");
    setMsg("Installing from your download…");
    try {
      const r =
        manualDl.kind === "hv"
          ? await hvApplyLocal(appid, path)
          : await crakApplyLocal(appid, path);
      if (r.success) {
        setManualDl(null);
        setMsg(
          `Installed from your download — ${r.installed || 0} file(s). ` +
            ((r as any).protonTool ? `Set Proton to ${(r as any).protonTool}. ` : "") +
            (r.note || "Restart Steam."),
        );
        onReload?.();
      } else {
        setMsg(r.error || "Could not install from that file — is it the right archive?");
      }
    } catch {
      setMsg("Install from download failed.");
    } finally {
      setBusy("");
    }
  };

  const doUnfix = async () => {
    setBusy("unfix");
    setMsg("Reverting fix & unpinning…");
    try {
      await unfix(appid, installPath, "");
    } catch {
      setBusy("");
      setMsg("Un-fix failed");
      return;
    }
    watch(
      () => getUnfixStatus(appid),
      "Fix reverted & unpinned — restart Steam",
      "Un-fix failed",
      () => {
        setPinned(false);
        clearFixLaunchOptions(appid); // strip repoint + WINEDLLOVERRIDES
      }
    );
  };

  // Unpin only — for when the game is pinned but no fix was actually applied
  // (e.g. the download never finished, so the fix step never ran). Without this
  // the sole unpin control was bundled into "Un-fix and unpin", which only shows
  // once a fix is detected — leaving a bare pin with no way to revert.
  const doUnpinOnly = async () => {
    setBusy("unpin");
    setMsg("Unpinning…");
    try {
      const r = await unpinGame(appid);
      if (r.success) {
        setPinned(false);
        setPinInfo({});
        setMsg("Unpinned — back to the latest build. Restart Steam.");
      } else {
        setMsg("Unpin failed");
      }
    } catch {
      setMsg("Unpin failed");
    } finally {
      setBusy("");
    }
  };

  if (!check) {
    return <div style={{ fontSize: 12, opacity: 0.6, padding: "4px 0" }}>Checking fixes…</div>;
  }

  // Show EVERY ryuu fix/variant/version for this game (not one best pick), so a
  // version-specific fix can be matched to the installed build.
  const ryuuList = ((check as any).ryuuFixes || []) as Array<{ file: string; badge: string; url: string }>;
  const rows: RowDef[] = ryuuList.map((e, i) => {
    const online = (e.badge || "").toLowerCase() === "online";
    return {
      key: `ryuu${i}`,
      label: online ? "Online Fix" : "Crack / Bypass Fix",
      fixType: online
        ? "Online Fix"
        : (e.badge || "").toLowerCase() === "hypervisor"
        ? "Denuvo/HV Fix"
        : "Generic Fix",
      info: { status: 200, available: true, url: e.url, file: e.file, badge: e.badge } as any,
    };
  });
  const peroUrl = (check.onlineFix as any).perondepot as string | undefined;
  if (peroUrl) {
    rows.push({
      key: "pero",
      label: "Online Fix (perondepot)",
      fixType: "Online Fix",
      info: { status: 200, available: true, url: peroUrl } as any,
    });
  }
  // luatools.work fallback fixes (probed directly, index-free). Shown with their
  // source + classification so it's clear where the fix comes from and its type.
  const luatoolsList = ((check as any).luatoolsFixes || []) as Array<{
    file: string; badge: string; type: string; source: string; url: string;
  }>;
  luatoolsList.forEach((e, i) => {
    const online = (e.type || "").toLowerCase() === "online";
    rows.push({
      key: `luatools${i}`,
      label: `${online ? "Online Fix" : "Crack / Bypass Fix"} (luatools)`,
      fixType: online ? "Online Fix" : "Generic Fix",
      info: { status: 200, available: true, url: e.url, file: e.file, badge: e.badge } as any,
    });
  });
  rows.push({
    key: "unsteam",
    label: "Online Fix (Unsteam) · Universal",
    fixType: "Online Fix (Unsteam)",
    info: check.unsteamFix,
  });
  /**
   * Netsock is a launch-option patch, not a downloadable fix: the .so ships with
   * the SLSsteam install, so enabling it writes the LD_AUDIT prefix into this
   * game's launch options (and removes it again when off).
   */
  const toggleNetsock = async (v: boolean) => {
    if (!ns) return;
    setBusy("netsock");
    try {
      const r = await netsockSet(appid, v);
      setNs(r);
      const ok = setNetsockLaunchOption(appid, v, r.launchOption);
      setMsg(
        ok
          ? v
            ? "Multiplayer patch on — launch option set."
            : "Multiplayer patch off — launch option removed."
          : `Saved, but the launch option couldn't be written. Set it manually: ${r.launchOption} %command%`
      );
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
    setBusy("");
  };

  const doTokeer = async () => {
    setBusy("tokeer");
    setMsg("Running official Tokeer setup, then local verification… Steam may restart.");
    try {
      const r = await setupAndVerifyTokeer(appid, setMsg);
      if (!r.success) {
        const phase = (r as any).phase === "prepare" ? "Setup" : "Verification";
        setMsg(`${phase} failed: ${r.error || r.output || "Unknown error"}`);
        return;
      }
      const c = r.checks;
      const summary = c
        ? `installed ${c.installed ? "✓" : "✗"} · prefix ${c.prefix ? "✓" : "✗"} · hook ${c.hook ? "✓" : "✗"} · launch option ${c.launchOpt ? "✓" : "✗"}`
        : "all checks passed";
      if (r.code) {
        try { await navigator.clipboard.writeText(r.code); } catch {}
      }
      setMsg(`Tokeer ready — ${summary}.${r.code ? " TLX1 copied to clipboard." : ""}`);
    } catch (e) {
      setMsg(`Tokeer failed: ${e}`);
    } finally {
      setBusy("");
    }
  };

  const isApplied = (fixType: string) =>
    applied.some((f) => (f.fixType || "").toLowerCase() === fixType.toLowerCase());
  const working = busy !== "";
  const bs: CSSProperties = { minWidth: 0, flex: 1, padding: "5px 8px", fontSize: 12 };

  const renderFixFlow = (key: string) => {
    const showProgress = activeFixKey === key && !!fixState.status;
    const total = Number(fixState.totalBytes || 0);
    const read = Number(fixState.bytesRead || 0);
    const phasePercent = Number((fixState as any).percent);
    const percent = Number.isFinite(phasePercent)
      ? Math.max(0, Math.min(100, Math.round(phasePercent)))
      : total > 0
      ? Math.max(0, Math.min(100, Math.round((read / total) * 100)))
      : fixState.status === "done"
      ? 100
      : undefined;
    return (
      <>
        {showProgress && (
          <div style={{ marginTop: 7, padding: 7, borderRadius: 6, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, marginBottom: 4 }}>
              <span>
                {fixState.status === "resolving"
                  ? "Resolving required build…"
                  : fixState.status === "already_ready"
                  ? "Correct build already installed"
                  : fixState.status === "build_downloading"
                  ? "Downloading required build…"
                  : fixState.status === "build_ready"
                  ? "Required build ready"
                  : fixState.status === "steam_downloading"
                  ? "Waiting for Steam build download…"
                  : fixState.status === "fix_installing"
                  ? "Downloading / extracting fix…"
                  : fixState.status === "downloading"
                  ? "Downloading fix…"
                  : fixState.status === "extracting"
                  ? "Extracting fix…"
                  : fixState.status === "done"
                  ? "Fix applied"
                  : fixState.status === "failed"
                  ? "Fix failed"
                  : "Applying fix…"}
              </span>
              <span style={{ opacity: 0.7 }}>
                {percent != null
                  ? `${percent}%`
                  : read > 0
                  ? `${(read / 1024 / 1024).toFixed(1)} MB`
                  : ""}
              </span>
            </div>
            <progress
              max={100}
              {...(percent != null ? { value: percent } : {})}
              style={{ width: "100%", height: 8 }}
            />
          </div>
        )}
        {awaiting?.key === key && (
          <div
            style={{
              border: "1px solid rgba(120,180,255,0.4)",
              borderRadius: 8,
              padding: 8,
              marginTop: 7,
              background: "rgba(80,130,220,0.08)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Pinned — waiting for Steam to update the game
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>
              {dlComplete
                ? "Download complete. Press Apply now to install the fix onto this build."
                : "Press Start download now to retry Steam's pinned-build update. The game is launched too, which helps Steam begin the download if it is still idle."}
            </div>
            {!dlComplete && (
              <DialogButton
                style={{ ...bs, marginBottom: 6 }}
                onClick={async () => {
                  await noInternetFixBegin(appid).catch(() => ({}));
                  await triggerSteamInstall(appid).catch(() => ({}));
                  launchGame(appid);
                }}
              >
                ▶ Start download now
              </DialogButton>
            )}
            <Focusable style={{ display: "flex", gap: 6 }} flow-children="row">
              <DialogButton
                style={bs}
                onClick={() => awaiting.run().catch(() => {})}
              >
                {dlComplete ? `Apply ${awaiting.label} now` : "Apply now (download not done)"}
              </DialogButton>
              <DialogButton
                style={bs}
                onClick={() => {
                  stopFlag.current = true;
                  stopDl();
                  setAwaiting(null);
                  setMsg("Cancelled — the pin is kept; you can apply later.");
                }}
              >
                Cancel
              </DialogButton>
            </Focusable>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
      {pinned && (
        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.5 }}>
          <div>
            🔒 Version pinned{pinInfo.buildid
              ? ` — Build ${pinInfo.buildid}`
              : (pinInfo.depots && Object.keys(pinInfo.depots).length
                  ? ` — ${Object.keys(pinInfo.depots).length} depot(s)`
                  : "")} — the game won't update past the pinned version.
          </div>
        </div>
      )}
      <DialogButton
        style={{ fontSize: 12, padding: "5px 8px" }}
        disabled={working || pinned || !!awaiting}
        onClick={doPinVersion}
      >
        {pinned
          ? "🔒 Already pinned"
          : busy === "game:manifest"
          ? msg || "Adding…"
          : busy === "game:pin"
          ? "Pinning…"
          : "Pin this version"}
      </DialogButton>
      <div style={{ border: "1px solid rgba(202,168,255,0.28)", borderRadius: 8, padding: 8, background: "rgba(202,168,255,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tokeer</div>
        <div style={{ fontSize: 11, opacity: 0.68, marginBottom: 6 }}>
          Checks/updates the shared runtime, configures GE-Proton10-34 and merges Tokeer into this game's live launch options, then validates AppID {appid}. Steam is not restarted.
        </div>
        <DialogButton style={bs} disabled={working || !!awaiting} onClick={doTokeer}>
          {busy === "tokeer" ? "Setting up and validating…" : "Tokeer"}
        </DialogButton>
      </div>
      {rows.length === 0 && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>No ryuu fixes indexed for this game.</div>
      )}
      {ns && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            padding: 8,
            opacity: ns.installed ? 1 : 0.55,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Multiplayer patch (netsock) · Manual only
            {ns.enabled ? " · ✓ On" : ns.installed ? " · Available" : " · Not installed"}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
            Fixes multiplayer in games using SteamNetworkingSockets while FakeAppIds is
            active. Sets a launch option — nothing is downloaded.
          </div>
          {ns.known && (
            <div style={{ fontSize: 11, color: "#8fd694", marginBottom: 4 }}>
              ✓ Confirmed working: {ns.knownName}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#ffcc66", marginBottom: 6 }}>
            ⚠ Never use on games with anti-cheat — it scans and rewrites game memory.
          </div>
          {!ns.installed ? (
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              netsock.so missing — reinstall SLSsteam (Dependencies) to fetch it.
            </div>
          ) : (
            <DialogButton style={bs} disabled={working} onClick={() => toggleNetsock(!ns.enabled)}>
              {busy === "netsock"
                ? "Working…"
                : ns.enabled
                ? "Turn multiplayer patch off"
                : "Turn multiplayer patch on"}
            </DialogButton>
          )}
        </div>
      )}
      {rows.map((row) => {
        const avail = !!row.info?.available;
        const done = isApplied(row.fixType);
        const flowKey = `${row.key}:fix`;
        return (
          <div
            key={row.key}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: 8,
              opacity: avail || done ? 1 : 0.55,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {row.label}
              <BadgeChip badge={row.info?.badge} inline />
              {done ? " · ✓ Applied" : avail ? " · Available" : " · Not available"}
            </div>
            {row.info?.file && (
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
                {row.info.file}
              </div>
            )}
            {(row.info?.url || "").includes("generator.ryuu.lol") && !hasRyuuKey && (
              <div style={{ fontSize: 11, color: "#ffcc66", marginBottom: 4 }}>
                🔑 Needs a Ryuu API key — add it in Settings to download this fix.
              </div>
            )}
            <Focusable style={{ display: "flex", gap: 6 }} flow-children="row">
              <DialogButton style={bs} disabled={working || !!awaiting || !avail} onClick={() => doFix(row)}>
                {busy.startsWith(flowKey) ? "Working…" : avail ? "Apply this fix" : "No fix"}
              </DialogButton>
            </Focusable>
            {renderFixFlow(flowKey)}
          </div>
        );
      })}

      {/* Full lua.tools fix catalog (account-gated). Shows EVERY release for the
          game, each pinning to its exact build. Requires Discord sign-in. */}
      {(() => {
        const cat = ((check as any).luatoolsCatalog || []) as LuatoolsCatalogFix[];
        const authed = (check as any).luatoolsAuthed as boolean | undefined;
        const catErr = (check as any).luatoolsCatalogError as string | undefined;
        const dbgAll = (check as any).luatoolsDebug;
        if (authed === false) {
          return (
            <div style={{ fontSize: 11, opacity: 0.7, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }}>
              🔓 Sign in with Discord (Settings → lua.tools account) to see the full lua.tools fix list for this game.
              {dbgAll && (
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, wordBreak: "break-all" }}>
                  debug: {JSON.stringify(dbgAll)}
                </div>
              )}
            </div>
          );
        }
        if (!cat.length) {
          const dbg = (check as any).luatoolsDebug;
          const dbgLine = dbg ? (
            <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, wordBreak: "break-all" }}>
              debug: {JSON.stringify(dbg)}
            </div>
          ) : null;
          if (catErr) {
            return (
              <div style={{ fontSize: 11, color: "#ffcc66", border: "1px solid rgba(255,204,102,0.35)", borderRadius: 8, padding: 8 }}>
                lua.tools fixes couldn't load: {catErr}
                {dbgLine}
              </div>
            );
          }
          return authed ? (
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              No lua.tools fixes listed for this game.
              {dbgLine}
            </div>
          ) : null;
        }
        return (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
              lua.tools fixes ({cat.length})
            </div>
            {cat.map((fix, i) => {
              const when = fix.release_date || fix.release_year || "";
              // Tags are the site's badges (voices38, (crack)Ubisoft, …). They
              // may arrive as objects, so coerce each to text defensively.
              const tags = (fix.tags || [])
                .map((t: any) =>
                  typeof t === "string"
                    ? t
                    : (t && (t.name || t.label || t.text || t.title || t.tag)) || ""
                )
                .filter(Boolean);
              const buildId = (fix as any).build || fix.manifest_id || "";
              // Title: a real name, else the build, else a fallback. Tags render
              // as coloured badge chips below (voices38, Achievements Fix, …).
              const title = fix.name && fix.name !== String(fix.appid)
                ? fix.name
                : buildId
                ? `Build ${buildId}`
                : `Fix${fix.id ? ` ${fix.id}` : ` ${i + 1}`}`;
              const whenShort = when ? String(when).slice(0, 10) : "";
              const meta = [
                whenShort ? `Released ${whenShort}` : "",
                buildId ? `build ${buildId}` : "",
              ]
                .filter(Boolean)
                .join(" · ");
              const flowKey = `lt:${fix.id}`;
              return (
                <div
                  key={`lt-${fix.id || i}`}
                  style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
                  {tags.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      {tags.map((t: string, ti: number) => <BadgeChip key={ti} badge={t} />)}
                    </div>
                  )}
                  {meta && (
                    <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>{meta}</div>
                  )}
                  <Focusable style={{ display: "flex", gap: 6 }} flow-children="row">
                    <DialogButton style={bs} disabled={working || !!awaiting} onClick={() => doLtFix(fix)}>
                      {busy.startsWith(flowKey) ? "Working…" : "Apply & pin to build"}
                    </DialogButton>
                  </Focusable>
                  {renderFixFlow(flowKey)}
                </div>
              );
            })}
          </>
        );
      })()}

      {(!dlcOwnedOnly || (!added && isInLibrary(appid))) && smoke?.supported && (
        <DialogButton
          style={{ fontSize: 12, padding: "5px 8px" }}
          disabled={working || !!awaiting}
          onClick={() => doSmoke(!smoke.installed)}
        >
          {busy === "smoke"
            ? "Working…"
            : smoke.installed
            ? "Remove DLC unlock (SmokeAPI)"
            : "Unlock DLC (SmokeAPI)"}
        </DialogButton>
      )}

      {(!dlcOwnedOnly || (!added && isInLibrary(appid))) && (["cream", "uplayr1", "uplayr2"] as UnlockerKind[]).map((kind) =>
        dlcU[kind]?.supported ? (
          <DialogButton
            key={kind}
            style={{ fontSize: 12, padding: "5px 8px" }}
            disabled={working || !!awaiting}
            onClick={() => doUnlocker(kind, !dlcU[kind]?.installed)}
          >
            {busy === `unlock-${kind}`
              ? "Working…"
              : dlcU[kind]?.installed
              ? `Remove ${UNLOCKER_LABEL[kind]}`
              : `Unlock ${UNLOCKER_LABEL[kind]}`}
          </DialogButton>
        ) : null
      )}

      {hv?.found && (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            HVAuto crack · build {hv.buildid || "?"}
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>
            Build-matched: installs the required Steam build first, then applies the HV fix.
          </div>
          <DialogButton
            style={{ fontSize: 12, padding: "5px 8px" }}
            disabled={working || !!awaiting}
            onClick={doHv}
          >
            {busy === "catalog:hv"
              ? "Preparing / applying HV crack…"
              : `Apply HV crack${hv.status === "older" ? " · older target build" : ""}`}
          </DialogButton>
          {renderFixFlow("catalog:hv")}
        </div>
      )}

      {crak?.found && (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            CrakFiles · build {crak.buildid || "?"}
          </div>
          {!!crak.badges?.length && (
            <div style={{ marginBottom: 4 }}>
              {crak.badges.map((b, i) => <BadgeChip key={i} badge={b} />)}
            </div>
          )}
          <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>
            Build-matched: installs the required Steam build first, then applies the crack.
          </div>
          <DialogButton
            style={{ fontSize: 12, padding: "5px 8px" }}
            disabled={working || !!awaiting}
            onClick={doCrak}
          >
            {busy === "catalog:crak"
              ? "Preparing / applying crack…"
              : `Apply CrakFiles crack${crak.status === "older" ? " · older target build" : ""}`}
          </DialogButton>
          {renderFixFlow("catalog:crak")}
        </div>
      )}

      {customFixes.map((item) => (
        <DialogButton
          key={item.id}
          style={{ fontSize: 12, padding: "5px 8px" }}
          disabled={working || !!awaiting}
          onClick={() => doCustomFix(item)}
        >
          {busy === `custom-${item.id}` ? "Applying…" : `Custom fix — ${item.label}`}
        </DialogButton>
      ))}

      {applied.length > 0 ? (
        <DialogButton style={{ fontSize: 12, padding: "5px 8px" }} disabled={working || !!awaiting} onClick={doUnfix}>
          {busy === "unfix" ? "Reverting & unpinning…" : "Un-fix and unpin"}
        </DialogButton>
      ) : pinned ? (
        <DialogButton style={{ fontSize: 12, padding: "5px 8px" }} disabled={working || !!awaiting} onClick={doUnpinOnly}>
          {busy === "unpin" ? "Unpinning…" : "Unpin (back to latest)"}
        </DialogButton>
      ) : null}

      {manualDl && (
        <Focusable style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <DialogButton
            style={{ fontSize: 12, padding: "5px 8px" }}
            disabled={working || !!awaiting}
            onClick={applyFromDownloads}
          >
            {busy === "manualdl" ? "Installing…" : "Apply from Downloads…"}
          </DialogButton>
          <DialogButton
            style={{ fontSize: 12, padding: "5px 8px" }}
            disabled={working || !!awaiting}
            onClick={() => { try { Navigation.NavigateToExternalWeb(manualDl.url); } catch { /* */ } }}
          >
            Re-open download page
          </DialogButton>
        </Focusable>
      )}

      {msg && <div style={{ fontSize: 11, opacity: 0.75, padding: "0 2px" }}>{msg}</div>}
    </div>
  );
}
