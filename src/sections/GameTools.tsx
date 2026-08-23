import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Focusable,
  DialogButton,
  ModalRoot,
  ConfirmModal,
  showModal,
  Navigation,
} from "@decky/ui";
import { toaster } from "@decky/api";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  currentLibraryAppId,
  listInstalledProtonTools,
  getProtonMapping,
  setProtonMapping,
  removeProtonMapping,
  backupGameSaves,
  restoreGameSaves,
  listGameSaveBackups,
  repairGame,
  patchGameOnlinefix,
  installLatestGeProton,
  checkMultiplayer,
  getMainExe,
  smokeapiStatus,
  smokeapiInstall,
  smokeapiRemove,
  dlcUnlockersStatus,
  dlcUnlockerInstall,
  dlcUnlockerRemove,
  UnlockerKind,
  hasLua,
  getDlcOwnedOnly,
  creamyStatus,
  creamyDeploy,
  creamyEnsureToolchain,
  steamlessStatus,
  steamlessUnstub,
  fixStuckUpdate,
  buildHistoryList,
  buildHistoryRollback,
  bpListBuilds,
  bpApplyBuild,
  bpListDepotManifests,
  hvAutoStatus,
  crakStatus,
  depotdlStatus,
  buildArchiveAdd,
  archiveSnapshotGame,
  depotdlDownloadBuildGids,
  depotdlDownloadDlc,
  depotdlQueue,
  manifestAge,
  getPinStatus,
  pinGame,
  unpinGame,
  triggerSteamInstall,
  validateSteamApp,
  BuildEntry,
} from "../api";
import { isInLibrary } from "../lib/ownership";
import { fetchSteamdbBuilds, cancelSteamdbBuildFetch } from "../lib/steamdbBuilds";
import { scrapeDepotManifests } from "../lib/steamdbCapture";
import { setLaunchRepoint, hasLaunchRepoint, ensureProtonSelected, applyFixRuntime } from "../lib/fixRuntime";
import { launchGame } from "../lib/launchGame";
import { verifyBuildApply } from "../lib/verifyBuildApply";
import { noInternetFixBegin } from "../api";
import { ScrollableResult } from "../components/ScrollableResult";

interface PickItem {
  key: string;
  label: string;
  sublabel?: string;
}

/**
 * A scrollable pick-one list. Decky's UI kit has no dropdown that works well
 * with a controller in the QAM, so selection is a modal with a focusable column.
 */
function PickerModal({
  closeModal,
  title,
  subtitle,
  items,
  onPick,
}: {
  closeModal?: () => void;
  title: string;
  subtitle?: string;
  items: PickItem[];
  onPick: (it: PickItem) => void;
}) {
  return (
    <ModalRoot closeModal={closeModal}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>{title}</div>
      {subtitle ? (
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>{subtitle}</div>
      ) : null}
      <Focusable
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: "56vh",
          overflowY: "auto",
        }}
      >
        {items.map((it) => (
          <DialogButton
            key={it.key}
            style={{ textAlign: "left", padding: "10px 12px" }}
            onClick={() => {
              onPick(it);
              closeModal?.();
            }}
          >
            <div style={{ fontSize: 14 }}>{it.label}</div>
            {it.sublabel ? (
              <div style={{ fontSize: 11, opacity: 0.65 }}>{it.sublabel}</div>
            ) : null}
          </DialogButton>
        ))}
      </Focusable>
    </ModalRoot>
  );
}

/**
 * Per-game tools, scoped to whichever game's library page is open. The whole
 * section hides itself when there is no such game, so it never shows controls
 * that would act on nothing.
 */
export function GameToolsSection() {
  const appid = currentLibraryAppId();
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [proton, setProton] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);
  const [repointed, setRepointed] = useState(false);
  const [smoke, setSmoke] = useState<{ installed: boolean; supported: boolean } | null>(null);
  const [dlcU, setDlcU] = useState<Partial<Record<UnlockerKind, { installed: boolean; supported: boolean }>>>({});
  // DLC unlockers (SmokeAPI / CreamAPI / Ubisoft) are meant for games you own —
  // they emulate DLC entitlements on a legitimately-owned base game. On an
  // SLS-added game they're pointless, so by default they only surface for owned
  // titles. `allowUnlockers` gates all three groups.
  const [allowUnlockers, setAllowUnlockers] = useState(true);
  // CreamySteamy: compile a version-matched proxy for native-Linux games.
  const [creamy, setCreamy] = useState<{ supported: boolean; installed: boolean; haveToolchain: boolean } | null>(null);
  // ASSella-inspired: SteamStub removal, version freeze, build rollback, manifest age.
  const [steamless, setSteamless] = useState<{ supported: boolean; hasStub: boolean; installed: boolean } | null>(null);
  const [pinned, setPinned] = useState<boolean | null>(null);
  const [pinnedBuild, setPinnedBuild] = useState("");
  const [pinnedDepotCount, setPinnedDepotCount] = useState(0);
  const [ageSec, setAgeSec] = useState<number | null>(null);
  const [histCount, setHistCount] = useState(0);
  // v2 (slsdeckdlc) only: DepotDownloader present → show download buttons.
  const [depotdl, setDepotdl] = useState(false);
  const steamdbCancelled = useRef(false);
  useEffect(() => {
    steamdbCancelled.current = false;
    return () => {
      steamdbCancelled.current = true;
      cancelSteamdbBuildFetch();
    };
  }, [appid]);
  useEffect(() => { depotdlStatus().then((r) => setDepotdl(!!r.available)).catch(() => {}); }, []);

  // DepotDownloader job progress for THIS game. The download runs in a backend
  // thread and its state lives in DL_STATE; we poll depotdl_queue so the user
  // sees percent / completion / errors instead of a fire-and-forget toast.
  type DdlJob = { appid: number; status: string; percent: number; op?: string; error?: string; plannedDepots?: { depot: string; manifest: string; kind: string }[]; currentDepot?: string; currentManifest?: string; completedDepots?: string[]; failedDepots?: string[]; depotDone?: number; depotTotal?: number; enrichmentStatus?: string; depotMetadata?: Record<string,{kind:string;confidence:string;source:string;dlcAppid?:number;fromAppid?:number;name?:string;os?:string;language?:string}> };
  const [ddl, setDdl] = useState<DdlJob | null>(null);
  const ddlTimer = useRef<any>(null);
  const stopDdl = () => { if (ddlTimer.current) { clearInterval(ddlTimer.current); ddlTimer.current = null; } };
  const pollDdlOnce = useCallback(async (): Promise<string> => {
    try {
      const q = await depotdlQueue();
      const it = (q.items || []).find((x) => x.appid === appid) || null;
      setDdl(it as DdlJob | null);
      return it ? it.status : "";
    } catch { return ""; }
  }, [appid]);
  const startDdl = useCallback(() => {
    if (ddlTimer.current) return;
    ddlTimer.current = setInterval(async () => {
      const s = await pollDdlOnce();
      if (s === "done" || s === "failed") stopDdl();
    }, 2000);
  }, [pollDdlOnce]);
  useEffect(() => {
    let active = true;
    if (depotdl) pollDdlOnce().then((s) => { if (active && (s === "downloading" || s === "resolving")) startDdl(); });
    return () => { active = false; stopDdl(); };
  }, [depotdl, appid, pollDdlOnce, startDdl]);
  const ddlActive = ddl?.status === "downloading" || ddl?.status === "resolving";

  const refreshProton = useCallback(() => {
    if (appid == null) return;
    getProtonMapping(appid)
      .then((r) => setProton(r && r.success ? r.toolName || "" : ""))
      .catch(() => setProton(""));
  }, [appid]);

  const refreshPinStatus = useCallback(() => {
    if (appid == null) return;
    getPinStatus(appid)
      .then((r) => {
        setPinned(!!r.pinned);
        setPinnedBuild(r.pinned ? String(r.buildid || "") : "");
        setPinnedDepotCount(r.pinned ? Object.keys(r.depots || {}).length : 0);
      })
      .catch(() => {
        setPinned(null);
        setPinnedBuild("");
        setPinnedDepotCount(0);
      });
  }, [appid]);

  useEffect(() => {
    refreshProton();
    if (appid != null) {
      try {
        setRepointed(hasLaunchRepoint(appid));
      } catch {
        setRepointed(false);
      }
      // Owned = in the Steam library but not added through SLSsteam. When the
      // "owned games only" pref is on, hide the DLC unlockers on SLS-added games.
      (async () => {
        let pref = true;
        try {
          pref = !!(await getDlcOwnedOnly()).enabled;
        } catch {
          pref = true;
        }
        let addedByUs = false;
        try {
          addedByUs = !!(await hasLua(appid)).exists;
        } catch {
          addedByUs = false;
        }
        const owned = !addedByUs && isInLibrary(appid);
        setAllowUnlockers(!pref || owned);
      })();
      smokeapiStatus(appid)
        .then((r) => setSmoke(r.success ? { installed: !!r.installed, supported: !!r.supported } : null))
        .catch(() => setSmoke(null));
      dlcUnlockersStatus(appid)
        .then((r) => {
          if (!r.success) return;
          const next: Partial<Record<UnlockerKind, { installed: boolean; supported: boolean }>> = {};
          (["cream", "uplayr1", "uplayr2"] as UnlockerKind[]).forEach((k) => {
            const s = (r as any)[k];
            if (s && s.supported) next[k] = { installed: !!s.installed, supported: true };
          });
          setDlcU(next);
        })
        .catch(() => setDlcU({}));
      creamyStatus(appid)
        .then((r) => setCreamy(r.success && r.supported
          ? { supported: true, installed: !!r.installed, haveToolchain: !!r.haveToolchain }
          : null))
        .catch(() => setCreamy(null));
      steamlessStatus(appid)
        .then((r) => setSteamless(r.success && r.supported
          ? { supported: true, hasStub: !!r.hasStub, installed: !!r.installed }
          : null))
        .catch(() => setSteamless(null));
      refreshPinStatus();
      manifestAge(appid).then((r) => setAgeSec(r.success && r.installed ? (r.ageSec ?? null) : null)).catch(() => setAgeSec(null));
      buildHistoryList(appid).then((r) => setHistCount(r.success ? (r.items || []).length : 0)).catch(() => setHistCount(0));
    }
  }, [refreshProton, refreshPinStatus, appid]);

  if (appid == null) return null;

  const fixLaunchTarget = async () => {
    setBusy("repoint");
    setNote("");
    try {
      const r = await getMainExe(appid);
      if (!r.success || !r.exe) {
        setNote(r.error || "Couldn't find the game's real executable.");
      } else if ((await ensureProtonSelected(appid), setLaunchRepoint(appid, r.exe))) {
        setRepointed(true);
        const base = r.exe.split("/").pop() || r.exe;
        setNote(`Launch target set to ${base} (Proton ensured). Launch options were preserved.`);
      } else {
        setNote("Could not set launch options.");
      }
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const doSmoke = async (enable: boolean) => {
    setBusy("smoke");
    setNote("");
    try {
      if (enable) {
        const r = await smokeapiInstall(appid);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides); // additive launch option
          setSmoke({ installed: true, supported: true });
          setNote(`DLC unlock (SmokeAPI ${r.tag || ""}) installed. Restart Steam.`);
        } else {
          setNote(r.skippedLauncher
            ? "Skipped — Ubisoft/EA/Rockstar game (3rd-party DRM; SmokeAPI won't help)."
            : r.error || "Could not install SmokeAPI.");
        }
      } else {
        const r = await smokeapiRemove(appid);
        setSmoke((s) => (s ? { ...s, installed: false } : s));
        setNote(r.success ? "SmokeAPI removed (original steam_api restored)." : r.error || "Remove failed.");
      }
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const UNLOCKER_LABEL: Record<UnlockerKind, string> = {
    cream: "CreamAPI",
    uplayr1: "Uplay DLC (R1)",
    uplayr2: "Uplay DLC (R2)",
  };

  const doUnlocker = async (kind: UnlockerKind, enable: boolean) => {
    setBusy(`unlock-${kind}`);
    setNote("");
    try {
      if (enable) {
        const r = await dlcUnlockerInstall(appid, kind);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides); // additive launch option
          setDlcU((s) => ({ ...s, [kind]: { installed: true, supported: true } }));
          const detail = kind === "cream"
            ? r.unlockAll ? " (unlock-all)" : r.dlcCount ? ` (${r.dlcCount} DLC)` : ""
            : "";
          setNote(`DLC unlock (${r.label || UNLOCKER_LABEL[kind]} ${r.tag || ""})${detail} installed. Restart Steam.`);
        } else {
          setNote(r.notSupported
            ? `This game has no ${UNLOCKER_LABEL[kind]} target DLL.`
            : r.error || `Could not install ${UNLOCKER_LABEL[kind]}.`);
        }
      } else {
        const r = await dlcUnlockerRemove(appid, kind);
        setDlcU((s) => ({ ...s, [kind]: { installed: false, supported: true } }));
        setNote(r.success ? `${UNLOCKER_LABEL[kind]} removed (original DLL restored).` : r.error || "Remove failed.");
      }
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const doCreamy = async () => {
    setBusy("creamy");
    try {
      if (creamy && !creamy.haveToolchain) {
        setNote("First run: downloading the compiler (~45MB, one time)…");
        const t = await creamyEnsureToolchain();
        if (!t.success) { setNote(t.error || "Could not set up the compiler."); setBusy(""); return; }
      }
      setNote("Compiling a version-matched proxy for this game…");
      const r = await creamyDeploy(appid);
      if (r.success) {
        setCreamy((c) => (c ? { ...c, installed: true, haveToolchain: true } : c));
        setNote(r.note || `CreamySteamy proxy installed (${r.installed || 0} symbols).`);
      } else {
        setNote(r.notSupported ? "This game has no native libsteam_api.so." : r.error || "CreamySteamy failed.");
      }
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const doSteamless = async () => {
    setBusy("steamless");
    setNote("Removing SteamStub DRM… (first run fetches Steamless + a small toolchain)");
    try {
      const r = await steamlessUnstub(appid);
      if (r.success) {
        setSteamless((s) => (s ? { ...s, installed: true, hasStub: false } : s));
        setNote(r.note || "SteamStub removed.");
      } else {
        setNote(r.notStub ? "This exe has no SteamStub — nothing to remove." : (r.error || "Steamless failed."));
      }
    } catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const toggleFreeze = async () => {
    setBusy("freeze");
    try {
      if (pinned) {
        await unpinGame(appid);
        refreshPinStatus();
        setNote("Version unfrozen — Steam can update this game again.");
      } else {
        const r = await pinGame(appid);
        if (r.success) { refreshPinStatus(); setNote("Version frozen at the current build — Steam won't update it."); }
        else setNote(r.error || "Couldn't freeze (needs the slsteam-moon engine).");
      }
    } catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const openRollback = async () => {
    setBusy("rollback");
    let items: BuildEntry[] = [];
    try { items = (await buildHistoryList(appid)).items || []; } catch { /* */ }
    setBusy("");
    if (!items.length) { setNote("No saved build history for this game yet."); return; }
    const fmt = (e: BuildEntry) => {
      const when = e.savedAt ? new Date(e.savedAt * 1000).toLocaleDateString() : "";
      const bits = [e.buildid ? `build ${e.buildid}` : `${Object.keys(e.gids).length} depot(s)`, when, e.source].filter(Boolean);
      return bits.join(" · ");
    };
    const pitems: PickItem[] = items.map((e) => ({
      key: e.id,
      label: e.current ? "Current build" : "Reset to this build",
      sublabel: fmt(e) + (e.current ? " · installed now" : ""),
    }));
    showModal(
      <PickerModal
        title="Reset files"
        subtitle="Pick a build. Steam re-downloads the files that differ, resetting them to that build."
        items={pitems}
        onPick={(it) => {
          const e = items.find((x) => x.id === it.key);
          if (!e || e.current) { setNote("Already on that build."); return; }
          showModal(
            <ConfirmModal
              strTitle="Reset this game's files?"
              strDescription={`Pin ${e.buildid ? `build ${e.buildid}` : "this build"} and let Steam re-download the changed files. Reversible — pin the latest again anytime.`}
              strOKButtonText="Reset files"
              onOK={() =>
                run("rollback", () => buildHistoryRollback(appid, e.id), (r) => {
                  if (!r.success) return r.unsupported ? "Rollback needs the slsteam-moon engine." : (r.error || "Rollback failed");
                  triggerSteamInstall(appid).catch(() => {});
                  validateSteamApp(appid).catch(() => {});
                  return `Pinned${r.buildid ? ` build ${r.buildid}` : ""} — Steam validation started; changed files will be downloaded automatically.`;
                })
              }
            />,
          );
        }}
      />,
    );
  };


  // PRIMARY gid resolution: scrape SteamDB's signed-in (full) depot history and
  // date-match each depot's gid to the build's date. Returns {depot: gid}; the
  // backend fills any depot this missed from the GitHub archive (fallback).
  const resolveGidsViaSteamdb = async (buildDate: string, onStatus?: (s: string) => void): Promise<{ [d: string]: string }> => {
    const out: { [d: string]: string } = {};
    if (!buildDate) return out;
    let depots: string[] = [];
    try { const r = await bpListDepotManifests(appid); if (r.success) depots = r.depots.map((d) => String(d.depot)); } catch { /* */ }
    const target = new Date(buildDate).getTime();
    for (const depot of depots) {
      if (steamdbCancelled.current) break;
      let rows: { gid: string; date: string }[] = [];
      try { rows = await scrapeDepotManifests(depot, 25000, onStatus, () => steamdbCancelled.current); } catch { /* */ }
      let best = ""; let bestDelta = Infinity;
      for (const r of rows) {
        if (r.date === buildDate) { best = r.gid; bestDelta = 0; break; }
        const t = r.date ? new Date(r.date).getTime() : NaN;
        if (isNaN(t)) continue;
        const delta = Math.abs(t - target);
        if (delta < bestDelta) { bestDelta = delta; best = r.gid; }
      }
      if (best) out[depot] = best;
    }
    return out;
  };

  const openBuildPicker = async () => {
    setBusy("bp");
    setNote("Loading build history…");
    let builds: { buildid: string; date: string; isCurrent?: boolean }[] = [];
    try { const r = await bpListBuilds(appid); if (r.success) builds = r.builds; } catch { /* */ }
    // The backend can't reach SteamDB's RSS past Cloudflare, so it usually returns
    // only the "latest" pseudo-entry. Fetch the full history through the Steam
    // browser instead (cached per game; needs SteamDB open once to clear Cloudflare).
    const realBuilds = builds.filter((b) => !b.isCurrent && b.buildid && b.buildid !== "latest");
    let historyFailed = false;
    if (!realBuilds.length) {
      try {
        const rows = await fetchSteamdbBuilds(appid, (s) => setNote(s));
        if (rows.length) {
          const latest = builds.find((b) => b.isCurrent) || { buildid: "latest", date: "current", isCurrent: true };
          builds = [latest, ...rows.map((r) => ({ buildid: r.buildid, date: r.date }))];
        } else historyFailed = true;
      } catch { historyFailed = true; }
    }
    // Which builds a crack actually targets — exact buildids from the HV / CrakFiles
    // catalogs, so we can highlight the builds that are known-good with a fix.
    const compat = new Map<string, string>(); // buildid -> label (HV / Crack)
    try {
      const [hv, crak] = await Promise.all([
        hvAutoStatus(appid).catch(() => null),
        crakStatus(appid).catch(() => null),
      ]);
      if (hv?.found && hv.buildid) compat.set(String(hv.buildid), "HV");
      if (crak?.found && crak.buildid) compat.set(String(crak.buildid), compat.has(String(crak.buildid)) ? "HV+Crack" : "Crack");
    } catch { /* */ }
    setBusy(""); setNote("");
    if (historyFailed && !builds.some((b) => !b.isCurrent && b.buildid && b.buildid !== "latest")) {
      setNote("SteamDB opened, but SLSDeck could not read any public BuildIDs. Check that the page finished loading, then retry; Latest remains unchanged.");
      return;
    }
    if (!builds.some((b) => b.buildid)) {
      setNote("Couldn't load build history — open SteamDB once (and sign in for full history), then retry.");
      return;
    }
    const dateOf: { [bid: string]: string } = {};
    builds.forEach((b) => { if (b.buildid) dateOf[b.buildid] = b.date; });
    // Surface crack-compatible builds first (after Latest), then the rest.
    const latestRows = builds.filter((b) => b.isCurrent || b.buildid === "latest");
    const rest = builds.filter((b) => !(b.isCurrent || b.buildid === "latest"));
    rest.sort((a, b) => (compat.has(b.buildid) ? 1 : 0) - (compat.has(a.buildid) ? 1 : 0));
    const ordered = [...latestRows, ...rest];
    const items: PickItem[] = ordered.map((b) => {
      const tag = compat.get(b.buildid);
      const isLatest = b.isCurrent || b.buildid === "latest";
      return {
        key: b.buildid,
        label: isLatest ? "Latest (unpin)" : `${tag ? "✅ " : ""}Build ${b.buildid}`,
        sublabel: `${b.date && b.date !== "current" ? b.date : (isLatest ? "current" : "")}${tag ? ` · ${tag} fix targets this build` : ""}`,
      };
    });
    showModal(
      <PickerModal
        title="Install a specific build"
        subtitle="Full build history from SteamDB. ✅ = a crack (HV/CrakFiles) targets this exact build. Pins via the engine; Steam re-downloads the changed files."
        items={items}
        onPick={(it) => {
          const dt = dateOf[it.key] || "";
          showModal(
            <ConfirmModal
              strTitle={it.key === "latest" ? "Back to latest?" : "Install this build?"}
              strDescription={it.key === "latest"
                ? "Unpin so the game tracks the current public build again."
                : `Pin build ${it.key}${dt && dt !== "current" ? ` (${dt})` : ""} and let Steam re-download the changed files. Reversible — pick latest anytime.`}
              strOKButtonText={it.key === "latest" ? "Unpin" : "Install build"}
              onOK={() => run("bp", async () => {
                if (it.key === "latest") {
                  const r = await bpApplyBuild(appid, "latest", "", "{}");
                  return { msg: r.success ? "Unpinned — tracking latest." : (r.error || "Unpin failed") };
                }
                // Resolve the exact {depot: gid} map from SteamDB's signed-in history.
                let primary = "{}";
                try {
                  const map = await resolveGidsViaSteamdb(dt, (s) => setNote(s));
                  if (Object.keys(map).length) primary = JSON.stringify(map);
                } catch { /* */ }

                // slsdeckdlc + resolved gids → download the build's files DIRECTLY
                // via DepotDownloader (Hubcap). This bypasses moon's on-demand
                // manifest fetch — the path that fails with "no internet connection"
                // — and DepotDownloader's own resolver (which wrongly says "no older
                // builds"). The worker pins the build in moon afterwards too.
                if (depotdl && primary !== "{}") {
                  setNote(".NET / DepotDownloader preparing… first run may download the local .NET runtime.");
                  const dr = await depotdlDownloadBuildGids(appid, it.key, primary);
                  if (dr.success) {
                    await pollDdlOnce();
                    startDdl();
                  }
                  return { msg: dr.success
                    ? `Downloading build ${it.key} directly via DepotDownloader — progress shows below (needs a Hubcap key).`
                    : `DepotDownloader: ${dr.error || "failed"}` };
                }

                // Otherwise (simple build, or gids couldn't be resolved): pin via
                // moon and let Steam download.
                const r = await bpApplyBuild(appid, it.key, dt, primary);
                if (!r.success) return { msg: r.error || "Could not apply that build" };
                const v = await verifyBuildApply(appid, it.key);
                if (v.phantom || !v.ok) return { msg: v.text };
                await noInternetFixBegin(appid).catch(() => ({}));
                triggerSteamInstall(appid).catch(() => {});
                const validated = await validateSteamApp(appid).catch(() => ({ success: false }));
                // Declared OUTSIDE the block: it is read by the return below, and
                // a block-scoped `const` here left that read referring to nothing
                // (TS2304), which threw ReferenceError on every pass down this
                // path -- unconditionally, since the return is not inside the if.
                let launched = false;
                if (!validated.success) {
                  // Compatibility fallback for unusual Steam setups where the
                  // protocol handler cannot be invoked from the backend.
                  launched = launchGame(appid);
                  if (launched) { try { Navigation.CloseSideMenus?.(); } catch { /* */ } }
                }
                return { msg: launched ? `Pinned build ${it.key} — launching to download it…` : v.text };
              }, (res) => {
                // Toast the result too — the panel note isn't visible while you're
                // on the SteamDB browser page, which is why this felt like "nothing
                // happened". The toast shows the real outcome (pinned / phantom /
                // "sign into SteamDB") wherever you are.
                try { toaster.toast({ title: "SLSDeck — build", body: res.msg }); } catch { /* */ }
                return res.msg;
              })}
            />,
          );
        }}
      />,
    );
  };

  const resetLaunchTarget = () => {
    try {
      setLaunchRepoint(appid, null);
      setRepointed(false);
      setNote("Launch target reset (repoint removed; other options kept).");
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
  };

  const run = async (id: string, fn: () => Promise<any>, describe: (r: any) => string) => {
    setBusy(id);
    setNote("");
    try {
      setNote(describe((await fn()) || {}));
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const pickProton = async () => {
    setBusy("proton");
    setNote("");
    let tools: string[] = [];
    try {
      tools = (await listInstalledProtonTools())?.tools || [];
    } catch (e) {
      setNote(`Could not list Proton versions: ${e}`);
      setBusy("");
      return;
    }
    setBusy("");
    if (!tools.length) {
      setNote("No Proton versions found.");
      return;
    }
    // Offer to fetch GE-Proton from here: without it the list is just Valve's
    // built-ins, and GE-Proton is exactly what most fixed/added games need. The
    // backend call existed with no caller, so there was no way to get one.
    const items: PickItem[] = [
      { key: "__default__", label: "Steam default", sublabel: "Clear the override for this game" },
      ...tools.map((t) => ({ key: t, label: t, sublabel: t === proton ? "current" : undefined })),
      { key: "__ge__", label: "Install latest GE-Proton…", sublabel: "Downloads from GitHub, then pick it here" },
    ];
    showModal(
      <PickerModal
        title="Proton version"
        subtitle={`For AppID ${appid}. Takes effect next launch.`}
        items={items}
        onPick={(it) => {
          if (it.key === "__ge__") {
            run("proton", () => installLatestGeProton(), (r) =>
              r.success
                ? `${r.tag || "GE-Proton"} installed${r.message ? ` — ${r.message}` : ""}. Open this list again to select it.`
                : r.error || "Could not install GE-Proton",
            );
          } else if (it.key === "__default__") {
            run("proton", () => removeProtonMapping(appid), (r) => {
              refreshProton();
              return r.success ? "Using Steam's default Proton again." : r.error || "Could not clear it";
            });
          } else {
            run("proton", () => setProtonMapping(appid, it.key, "250"), (r) => {
              refreshProton();
              return r.success
                ? `Proton set to ${it.key}. Relaunch the game for it to apply.`
                : r.error || "Could not set it";
            });
          }
        }}
      />,
    );
  };

  const restoreSaves = async () => {
    setBusy("listsaves");
    setNote("");
    let backups: { path: string; when: string; sizeMB: number }[] = [];
    try {
      backups = (await listGameSaveBackups(appid, ""))?.backups || [];
    } catch (e) {
      setNote(`Could not read backups: ${e}`);
      setBusy("");
      return;
    }
    setBusy("");
    if (!backups.length) {
      setNote("No save backups for this game yet — make one first.");
      return;
    }
    showModal(
      <PickerModal
        title="Restore saves"
        subtitle="Pick which backup to restore."
        items={backups.map((b) => ({ key: b.path, label: b.when, sublabel: `${b.sizeMB} MB` }))}
        onPick={(it) => {
          // Restoring writes over whatever is in the prefix now, so it is
          // confirmed rather than done on a single tap.
          showModal(
            <ConfirmModal
              strTitle="Overwrite current saves?"
              strDescription={`This copies the backup from ${it.label} back into the game's Proton prefix, replacing files that are there now. This cannot be undone.`}
              strOKButtonText="Restore"
              onOK={() =>
                run("restore", () => restoreGameSaves(appid, it.key), (r) =>
                  r.success
                    ? `Restored ${(r.restoredFiles || []).length} file(s).`
                    : r.error || "Restore failed",
                )
              }
            />,
          );
        }}
      />,
    );
  };

  const protonLabel = proton == null ? "checking…" : proton || "Steam default";

  return (
    <PanelSection title="Actions & fixes">
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.85, padding: "2px 0" }}>
          Proton: <span style={{ fontWeight: 600 }}>{protonLabel}</span>
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy} onClick={pickProton}>
          {busy === "proton" ? "Working…" : "Change Proton version"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("backup", () => backupGameSaves(appid, ""), (r) =>
              r.success
                ? `Backed up ${r.fileCount} save file(s) to ${r.zipPath}`
                : r.error || "Backup failed",
            )
          }
        >
          {busy === "backup" ? "Backing up…" : "Back up this game's saves"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy} onClick={restoreSaves}>
          {busy === "listsaves" || busy === "restore" ? "Working…" : "Restore saves from a backup"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("repair", () => repairGame(appid), (r) =>
              r.success
                ? `Repaired: ${(r.steps || []).join(", ") || "nothing needed"}`
                : r.error || "Repair failed",
            )
          }
        >
          {busy === "repair" ? "Repairing…" : "Repair this game"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("stuck", () => fixStuckUpdate(appid), (r) =>
              r.success ? (r.note || "Depotcache refreshed — retry the update in Steam.") : (r.error || "Couldn't fix the update."),
            )
          }
        >
          {busy === "stuck" ? "Working…" : "Fix stuck update"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          If an update won't finish (a new depot needs a key it doesn't have), this re-deploys the game's manifests/keys so Steam can retry.
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy} onClick={fixLaunchTarget}>
          {busy === "repoint" ? "Working…" : "Fix launch target (use game's real exe)"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          If a fix doesn't take effect, point Steam at the game's real
          Binaries/Win64 executable. Preserves your other launch options.
          {repointed ? " · Currently repointed." : ""}
        </div>
      </PanelSectionRow>
      {repointed && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} onClick={resetLaunchTarget}>
            Reset launch target
          </ButtonItem>
        </PanelSectionRow>
      )}

      {(ageSec != null || pinned != null || histCount > 0) && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.7, padding: "2px 2px" }}>
            {ageSec != null ? `Manifest age: ${ageSec < 3600 ? Math.round(ageSec / 60) + "m" : ageSec < 86400 ? Math.round(ageSec / 3600) + "h" : Math.round(ageSec / 86400) + "d"}` : ""}
            {pinned != null ? `${ageSec != null ? " · " : ""}${pinned ? `Pinned build: ${pinnedBuild || "current"}${pinnedDepotCount ? ` · ${pinnedDepotCount} depot${pinnedDepotCount === 1 ? "" : "s"}` : ""}` : "auto-updates"}` : ""}
          </div>
        </PanelSectionRow>
      )}

      {pinned != null && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} onClick={toggleFreeze}>
            {busy === "freeze" ? "Working…" : pinned ? "Unfreeze version (allow updates)" : "Freeze version (block updates)"}
          </ButtonItem>
        </PanelSectionRow>
      )}

      {histCount > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} onClick={openRollback}>
            {busy === "rollback" ? "Working…" : "Reset files…"}
          </ButtonItem>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy} onClick={openBuildPicker}>
          {busy === "bp" ? "Working…" : "Install a specific build…"}
        </ButtonItem>
      </PanelSectionRow>
      {depotdl && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy || ddlActive}
            onClick={async () => {
              await run("ddl", async () => {
                setNote(".NET / DepotDownloader preparing… first run may download the local .NET runtime.");
                return depotdlDownloadDlc(appid);
              }, (r) =>
                r.success ? "Started — downloading content DLC in the background." : (r.error || "Could not start"));
              await pollDdlOnce();
              startDdl();
            }}
          >
            {ddlActive && ddl?.op === "dlc" ? "Downloading DLC…" : "Blind download content DLC (DepotDownloader)"}
          </ButtonItem>
        </PanelSectionRow>
      )}
      {depotdl && (
        <PanelSectionRow>
          {/* Named "blind" because this path applies no checks at all: it takes
              every depot in the manifest bundle it holds a key for, without
              asking whether the depot is DLC, whether it matches this install's
              platform, or whether you already have it. The Fixes tab's
              "Get DLC files + unlock" is the filtered equivalent. */}
          <div style={{ fontSize: 11, opacity: 0.65, padding: "0 2px 4px", lineHeight: 1.4 }}>
            Downloads every keyed depot with no checks — it does not verify that a depot is
            DLC (language packs and base depots can be included), does not match your
            platform, and does not skip files you already have. For the filtered version use
            “Get DLC files + unlock” in Fixes.
          </div>
        </PanelSectionRow>
      )}
      {depotdl && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy}
            onClick={async () => {
              setBusy("bp");
              let builds: { buildid: string; date: string; isCurrent?: boolean }[] = [];
              try { const r = await bpListBuilds(appid); if (r.success) builds = r.builds.filter((b) => !b.isCurrent); } catch { /* */ }
              setBusy("");
              if (!builds.length) { setNote("No older builds on SteamDB for this game."); return; }
              showModal(
                <PickerModal
                  title="Archive a game snapshot"
                  subtitle="Choose the required build. Its gids, manifests and keys are stored with every optional game setting SLSDeck can capture."
                  items={builds.map((b) => ({ key: b.buildid, label: `Build ${b.buildid}`, sublabel: b.date }))}
                  onPick={async (it) => {
                    const dt = builds.find((b) => b.buildid === it.key)?.date || "";
                    await run("archive", async () => {
                      // Resolve the exact per-depot gids the same way the
                      // build picker does — SteamDB's signed-in history,
                      // date-matched — because that is the only source with a
                      // depot's full history. Without gids there is nothing
                      // worth archiving.
                      setNote(`Resolving depot manifests for build ${it.key}…`);
                      const map = await resolveGidsViaSteamdb(dt, (s) => setNote(s));
                      if (!Object.keys(map).length) {
                        return { success: false, error: "Could not resolve this build's depot manifests (SteamDB sign-in needed)." };
                      }
                      setNote(`Archiving build ${it.key} (${Object.keys(map).length} depots)…`);
                      const archived = await buildArchiveAdd(appid, it.key, JSON.stringify(map), dt, "");
                      if (!archived.success) return archived;
                      let opts: string | null = null;
                      try {
                        const v = (window as any).SteamClient?.Apps?.GetLaunchOptionsForApp?.(appid);
                        if (typeof v === "string") opts = v;
                      } catch { /* optional field stays unset */ }
                      // The complete build is the snapshot's only mandatory
                      // component. Capture fixes, launch args, Proton and DLC
                      // opportunistically; an unavailable optional source must
                      // not turn a valid archive into a reported failure.
                      await archiveSnapshotGame(appid, opts, "", "", it.key).catch(() => null);
                      return archived;
                    }, (r) => {
                      if (!r.success) return r.error || "Could not archive that build";
                      const miss = r.missingManifests?.length || 0;
                      return r.complete
                        ? `Archived game snapshot on build ${it.key} — ${r.depots} depot(s), ${r.manifests} manifest(s), ${r.keys} key(s).`
                        : `Archived build ${it.key} incomplete — ${miss} manifest(s) unavailable${r.keys !== r.depots ? ` and ${(r.depots || 0) - (r.keys || 0)} depot key(s) missing` : ""}. A Hubcap key usually fixes this.`;
                    });
                  }}
                />,
              );
            }}
          >
            {busy === "archive" ? "Archiving…" : "Archive game snapshot…"}
          </ButtonItem>
        </PanelSectionRow>
      )}
      {depotdl && ddl && (
        <PanelSectionRow>
          <div style={{ width: "100%", padding: "2px 0" }}>
            <div style={{ fontSize: 12, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{ddl.op === "dlc" ? "DLC-candidate depots" : "Build depots"} · {ddl.status}</span>
              <span style={{ opacity: 0.8 }}>
                {ddl.status === "downloading" || ddl.status === "resolving" ? `${Math.max(1, Math.min(99, Math.round(ddl.percent || 1)))}%` : ddl.status === "done" ? "100%" : ""}
              </span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${ddl.status === "done" ? 100 : Math.max(1, Math.min(99, Math.round(ddl.percent || 1)))}%`,
                background: ddl.status === "failed" ? "#d9534f" : ddl.status === "done" ? "#5cb85c" : "#4a90d9",
                transition: "width 0.3s",
              }} />
            </div>
            {ddl.error && (
              <div style={{ fontSize: 11, color: ddl.status === "failed" ? "#f0ad4e" : "#8fbf8f", marginTop: 4, lineHeight: 1.4 }}>
                {ddl.error}
              </div>
            )}
            {!!ddl.plannedDepots?.length && <div style={{marginTop:7,padding:7,borderRadius:6,background:"rgba(0,0,0,.18)",fontSize:10,lineHeight:1.5}}>
              <div style={{fontWeight:700,marginBottom:3}}>Depots {ddl.depotDone||0}/{ddl.depotTotal||ddl.plannedDepots.length}</div>
              {ddl.plannedDepots.map((d)=>{const m=ddl.depotMetadata?.[d.depot];const label=m?.kind==="dlc"?`DLC ${m.dlcAppid||""}`:m?.kind==="shared"?`shared from ${m.fromAppid||"app"}`:m?.kind==="base-or-shared"?"base/shared":d.kind==="dlc-candidate"?"DLC candidate":"build";return <div key={d.depot} style={{display:"flex",justifyContent:"space-between",gap:8,color:ddl.failedDepots?.includes(d.depot)?"#f0ad4e":ddl.completedDepots?.includes(d.depot)?"#8fd49a":ddl.currentDepot===d.depot?"#72c7ff":"rgba(255,255,255,.72)"}}>
                <span>{ddl.currentDepot===d.depot?"▶ ":ddl.completedDepots?.includes(d.depot)?"✓ ":ddl.failedDepots?.includes(d.depot)?"! ":""}Depot {d.depot}{m?.name?` · ${m.name}`:""}</span>
                <span style={{opacity:.65}}>{label}{m?.os?` · ${m.os}`:""}{m?.language?` · ${m.language}`:""} · GID {d.manifest}</span>
              </div>})}
              {ddl.enrichmentStatus==="running"&&<div style={{marginTop:5,opacity:.65}}>Enriching depot relationships in the background…</div>}
              {ddl.op==="dlc"&&<div style={{marginTop:5,color:"#d7b7ff",opacity:.85}}>Candidate means the depot came from the full game bundle; Steam app-info is still required to prove that it belongs to a DLC.</div>}
            </div>}
            {ddl.status === "done" && !ddl.error && (
              <div style={{ fontSize: 11, color: "#8fbf8f", marginTop: 4 }}>Done — files placed in the game folder. Restart Steam if needed.</div>
            )}
          </div>
        </PanelSectionRow>
      )}

      {steamless?.supported && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={!!busy} onClick={doSteamless}>
              {busy === "steamless"
                ? "Working…"
                : steamless.installed && !steamless.hasStub
                ? "SteamStub already removed"
                : "Remove SteamStub DRM (Steamless)"}
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
              Strips Steam's DRM wrapper from the game exe (fixes some SteamStub launch failures / achievement tools).
              Windows/Proton exes only. Reverted by Un-fix.
            </div>
          </PanelSectionRow>
        </>
      )}

      {allowUnlockers && smoke?.supported && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={!!busy} onClick={() => doSmoke(!smoke.installed)}>
              {busy === "smoke"
                ? "Working…"
                : smoke.installed
                ? "Remove DLC unlock (SmokeAPI)"
                : "Unlock DLC (SmokeAPI)"}
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
              Emulates DLC ownership in-process for an owned game. Won't work on
              Ubisoft/EA/Rockstar/Denuvo-SecureDLC/anti-cheat titles. Reverted by Un-fix.
            </div>
          </PanelSectionRow>
        </>
      )}

      {allowUnlockers && (["cream", "uplayr1", "uplayr2"] as UnlockerKind[]).map((kind) =>
        dlcU[kind]?.supported ? (
          <PanelSectionRow key={kind}>
            <ButtonItem
              layout="below"
              disabled={!!busy}
              onClick={() => doUnlocker(kind, !dlcU[kind]?.installed)}
            >
              {busy === `unlock-${kind}`
                ? "Working…"
                : dlcU[kind]?.installed
                ? `Remove ${UNLOCKER_LABEL[kind]}`
                : `Unlock ${UNLOCKER_LABEL[kind]}`}
            </ButtonItem>
          </PanelSectionRow>
        ) : null
      )}

      {allowUnlockers && creamy?.supported && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" disabled={!!busy} onClick={doCreamy}>
              {busy === "creamy"
                ? "Working…"
                : creamy.installed
                ? "Rebuild native DLC unlock (CreamySteamy)"
                : "Compile native DLC unlock (CreamySteamy)"}
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
              For native-Linux games (libsteam_api.so). Compiles a version-matched
              DLC-unlock proxy on-device{creamy.haveToolchain ? "" : " — first run downloads a ~45MB compiler"}.
              Reverted by Un-fix. Experimental.
            </div>
          </PanelSectionRow>
        </>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("mp", () => checkMultiplayer(appid), (r) => {
              setMp(r);
              return r.success ? `${r.headline}\n\n${r.detail}` : r.error || "Could not check";
            })
          }
        >
          {busy === "mp" ? "Checking…" : "Will multiplayer work?"}
        </ButtonItem>
      </PanelSectionRow>

      {mp?.verdict === "peer" && mp?.fix === "onlinefix" && (
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("onlinefix", () => patchGameOnlinefix(appid), (r) => {
              if (!r.success) return r.error || "Could not check this game";
              const found = r.detectedFixes || [];
              if (!found.length) return r.message || "No online-fix DLLs found in this game.";
              return `Found ${found.join(", ")} — set launch options to: ${r.launchOption}`;
            })
          }
        >
          {busy === "onlinefix" ? "Working…" : "Set up online-fix multiplayer"}
        </ButtonItem>
      </PanelSectionRow>
      )}

      {note ? (
        <PanelSectionRow>
          <ScrollableResult text={note} copy={note.length > 120} />
        </PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}
