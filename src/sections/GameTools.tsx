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
  depotdlDownloadBuild,
  depotdlDownloadBuildGids,
  depotdlDownloadDlc,
  depotdlQueue,
  manifestAge,
  getPinStatus,
  pinGame,
  unpinGame,
  triggerSteamInstall,
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
        style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "56vh", overflowY: "auto" }}
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
            {it.sublabel ? <div style={{ fontSize: 11, opacity: 0.65 }}>{it.sublabel}</div> : null}
          </DialogButton>
        ))}
      </Focusable>
    </ModalRoot>
  );
}

export function GameToolsSection() {
  const appid = currentLibraryAppId();
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [proton, setProton] = useState<string | null>(null);
  const [mp, setMp] = useState<any>(null);
  const [repointed, setRepointed] = useState(false);
  const [smoke, setSmoke] = useState<{ installed: boolean; supported: boolean } | null>(null);
  const [dlcU, setDlcU] = useState<Partial<Record<UnlockerKind, { installed: boolean; supported: boolean }>>>({});
  const [allowUnlockers, setAllowUnlockers] = useState(true);
  const [creamy, setCreamy] = useState<{ supported: boolean; installed: boolean; haveToolchain: boolean } | null>(null);
  const [steamless, setSteamless] = useState<{ supported: boolean; hasStub: boolean; installed: boolean } | null>(null);
  const [pinned, setPinned] = useState<boolean | null>(null);
  const [ageSec, setAgeSec] = useState<number | null>(null);
  const [histCount, setHistCount] = useState(0);
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

  type DdlJob = { appid: number; status: string; percent: number; op?: string; error?: string };
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

  useEffect(() => {
    refreshProton();
    if (appid != null) {
      try { setRepointed(hasLaunchRepoint(appid)); } catch { setRepointed(false); }
      (async () => {
        let pref = true;
        try { pref = !!(await getDlcOwnedOnly()).enabled; } catch { pref = true; }
        let addedByUs = false;
        try { addedByUs = !!(await hasLua(appid)).exists; } catch { addedByUs = false; }
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
      getPinStatus(appid).then((r) => setPinned(!!r.pinned)).catch(() => setPinned(null));
      manifestAge(appid).then((r) => setAgeSec(r.success && r.installed ? (r.ageSec ?? null) : null)).catch(() => setAgeSec(null));
      buildHistoryList(appid).then((r) => setHistCount(r.success ? (r.items || []).length : 0)).catch(() => setHistCount(0));
    }
  }, [refreshProton, appid]);

  if (appid == null) return null;

  const run = async (id: string, fn: () => Promise<any>, describe: (r: any) => string) => {
    setBusy(id);
    setNote("");
    try { setNote(describe((await fn()) || {})); }
    catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const fixLaunchTarget = async () => {
    setBusy("repoint");
    setNote("");
    try {
      const r = await getMainExe(appid);
      if (!r.success || !r.exe) setNote(r.error || "Couldn't find the game's real executable.");
      else if ((await ensureProtonSelected(appid), setLaunchRepoint(appid, r.exe))) {
        setRepointed(true);
        const base = r.exe.split("/").pop() || r.exe;
        setNote(`Launch target set to ${base} (Proton ensured). Launch options were preserved.`);
      } else setNote("Could not set launch options.");
    } catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const resetLaunchTarget = () => {
    try {
      setLaunchRepoint(appid, null);
      setRepointed(false);
      setNote("Launch target reset (repoint removed; other options kept).");
    } catch (e) { setNote(`Failed: ${e}`); }
  };

  const UNLOCKER_LABEL: Record<UnlockerKind, string> = { cream: "CreamAPI", uplayr1: "Uplay DLC (R1)", uplayr2: "Uplay DLC (R2)" };

  const doSmoke = async (enable: boolean) => {
    setBusy("smoke"); setNote("");
    try {
      if (enable) {
        const r = await smokeapiInstall(appid);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides);
          setSmoke({ installed: true, supported: true });
          setNote(`DLC unlock (SmokeAPI ${r.tag || ""}) installed. Restart Steam.`);
        } else setNote(r.skippedLauncher ? "Skipped — Ubisoft/EA/Rockstar game (3rd-party DRM; SmokeAPI won't help)." : r.error || "Could not install SmokeAPI.");
      } else {
        const r = await smokeapiRemove(appid);
        setSmoke((s) => (s ? { ...s, installed: false } : s));
        setNote(r.success ? "SmokeAPI removed (original steam_api restored)." : r.error || "Remove failed.");
      }
    } catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const doUnlocker = async (kind: UnlockerKind, enable: boolean) => {
    setBusy(`unlock-${kind}`); setNote("");
    try {
      if (enable) {
        const r = await dlcUnlockerInstall(appid, kind);
        if (r.success) {
          if (r.overrides) applyFixRuntime(appid, r.overrides);
          setDlcU((s) => ({ ...s, [kind]: { installed: true, supported: true } }));
          const detail = kind === "cream" ? r.unlockAll ? " (unlock-all)" : r.dlcCount ? ` (${r.dlcCount} DLC)` : "" : "";
          setNote(`DLC unlock (${r.label || UNLOCKER_LABEL[kind]} ${r.tag || ""})${detail} installed. Restart Steam.`);
        } else setNote(r.notSupported ? `This game has no ${UNLOCKER_LABEL[kind]} target DLL.` : r.error || `Could not install ${UNLOCKER_LABEL[kind]}.`);
      } else {
        const r = await dlcUnlockerRemove(appid, kind);
        setDlcU((s) => ({ ...s, [kind]: { installed: false, supported: true } }));
        setNote(r.success ? `${UNLOCKER_LABEL[kind]} removed (original DLL restored).` : r.error || "Remove failed.");
      }
    } catch (e) { setNote(`Failed: ${e}`); }
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
      } else setNote(r.notSupported ? "This game has no native libsteam_api.so." : r.error || "CreamySteamy failed.");
    } catch (e) { setNote(`Failed: ${e}`); }
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
      } else setNote(r.notStub ? "This exe has no SteamStub — nothing to remove." : (r.error || "Steamless failed."));
    } catch (e) { setNote(`Failed: ${e}`); }
    setBusy("");
  };

  const toggleFreeze = async () => {
    setBusy("freeze");
    try {
      if (pinned) {
        await unpinGame(appid); setPinned(false); setNote("Version unfrozen — Steam can update this game again.");
      } else {
        const r = await pinGame(appid);
        if (r.success) { setPinned(true); setNote("Version frozen at the current build — Steam won't update it."); }
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
    const pitems: PickItem[] = items.map((e) => ({
      key: e.id,
      label: e.current ? "Current build" : "Roll back",
      sublabel: [e.buildid ? `build ${e.buildid}` : `${Object.keys(e.gids).length} depot(s)`, e.savedAt ? new Date(e.savedAt * 1000).toLocaleDateString() : "", e.source].filter(Boolean).join(" · ") + (e.current ? " · installed now" : ""),
    }));
    showModal(<PickerModal title="Roll back build" subtitle="Pick a build to pin. Steam will re-download the changed files." items={pitems} onPick={(it) => {
      const e = items.find((x) => x.id === it.key);
      if (!e || e.current) { setNote("Already on that build."); return; }
      showModal(<ConfirmModal strTitle="Roll back this game?" strDescription={`Pin ${e.buildid ? `build ${e.buildid}` : "this build"} and let Steam re-download the changed files. Reversible — pin the latest again anytime.`} strOKButtonText="Roll back" onOK={() => run("rollback", () => buildHistoryRollback(appid, e.id), (r) => {
        if (!r.success) return r.unsupported ? "Rollback needs the slsteam-moon engine." : (r.error || "Rollback failed");
        triggerSteamInstall(appid).catch(() => {});
        return `Pinned${r.buildid ? ` build ${r.buildid}` : ""} — Steam is updating to it.`;
      })} />);
    }} />);
  };

  const resolveGidsViaSteamdb = async (buildDate: string, onStatus?: (s: string) => void): Promise<{ [d: string]: string }> => {
    const out: { [d: string]: string } = {};
    if (!buildDate || steamdbCancelled.current) return out;
    let depots: string[] = [];
    try { const r = await bpListDepotManifests(appid); if (r.success) depots = r.depots.map((d) => String(d.depot)); } catch { /* */ }
    const target = new Date(buildDate).getTime();
    for (const depot of depots) {
      if (steamdbCancelled.current) break;
      let rows: { gid: string; date: string }[] = [];
      try { rows = await scrapeDepotManifests(depot, 12000, onStatus, () => steamdbCancelled.current); } catch { /* */ }
      if (steamdbCancelled.current) break;
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
    steamdbCancelled.current = false;
    setBusy("bp");
    setNote("Loading build history…");
    let builds: { buildid: string; date: string; isCurrent?: boolean }[] = [];
    try { const r = await bpListBuilds(appid); if (r.success) builds = r.builds; } catch { /* */ }
    const realBuilds = builds.filter((b) => !b.isCurrent && b.buildid && b.buildid !== "latest");
    if (!realBuilds.length && !steamdbCancelled.current) {
      try {
        const rows = await fetchSteamdbBuilds(appid, (s) => { if (!steamdbCancelled.current) setNote(s); });
        if (!steamdbCancelled.current && rows.length) {
          const latest = builds.find((b) => b.isCurrent) || { buildid: "latest", date: "current", isCurrent: true };
          builds = [latest, ...rows.map((r) => ({ buildid: r.buildid, date: r.date }))];
        }
      } catch { /* */ }
    }
    if (steamdbCancelled.current) { setBusy(""); return; }
    const compat = new Map<string, string>();
    try {
      const [hv, crak] = await Promise.all([hvAutoStatus(appid).catch(() => null), crakStatus(appid).catch(() => null)]);
      if (hv?.found && hv.buildid) compat.set(String(hv.buildid), "HV");
      if (crak?.found && crak.buildid) compat.set(String(crak.buildid), compat.has(String(crak.buildid)) ? "HV+Crack" : "Crack");
    } catch { /* */ }
    setBusy(""); setNote("");
    if (!builds.some((b) => b.buildid)) {
      setNote("Couldn't load build history — SteamDB did not respond in time. Open/sign in once, then retry.");
      return;
    }
    const dateOf: { [bid: string]: string } = {};
    builds.forEach((b) => { if (b.buildid) dateOf[b.buildid] = b.date; });
    const latestRows = builds.filter((b) => b.isCurrent || b.buildid === "latest");
    const rest = builds.filter((b) => !(b.isCurrent || b.buildid === "latest"));
    rest.sort((a, b) => (compat.has(b.buildid) ? 1 : 0) - (compat.has(a.buildid) ? 1 : 0));
    const ordered = [...latestRows, ...rest];
    const items: PickItem[] = ordered.map((b) => ({
      key: b.buildid,
      label: b.isCurrent || b.buildid === "latest" ? "Latest (unpin)" : `${compat.get(b.buildid) ? "✅ " : ""}Build ${b.buildid}`,
      sublabel: `${b.date && b.date !== "current" ? b.date : (b.isCurrent || b.buildid === "latest" ? "current" : "")}${compat.get(b.buildid) ? ` · ${compat.get(b.buildid)} fix targets this build` : ""}`,
    }));
    showModal(<PickerModal title="Install a specific build" subtitle="Build history from SteamDB. ✅ = a fix targets this exact build." items={items} onPick={(it) => {
      const dt = dateOf[it.key] || "";
      showModal(<ConfirmModal
        strTitle={it.key === "latest" ? "Back to latest?" : "Install this build?"}
        strDescription={it.key === "latest" ? "Unpin so the game tracks the current public build again." : `Pin build ${it.key}${dt && dt !== "current" ? ` (${dt})` : ""} and let Steam re-download the changed files.`}
        strOKButtonText={it.key === "latest" ? "Unpin" : "Install build"}
        onOK={() => run("bp", async () => {
          if (it.key === "latest") {
            const r = await bpApplyBuild(appid, "latest", "", "{}");
            return { msg: r.success ? "Unpinned — tracking latest." : (r.error || "Unpin failed") };
          }
          let primary = "{}";
          try {
            const map = await resolveGidsViaSteamdb(dt, (s) => { if (!steamdbCancelled.current) setNote(s); });
            if (Object.keys(map).length) primary = JSON.stringify(map);
          } catch { /* */ }
          if (steamdbCancelled.current) return { msg: "Build lookup cancelled." };
          if (depotdl && primary !== "{}") {
            setNote(".NET / DepotDownloader preparing… First use may download the local .NET runtime before the build starts.");
            const dr = await depotdlDownloadBuildGids(appid, it.key, primary);
            return { msg: dr.success ? `Downloading build ${it.key} directly via DepotDownloader — progress shows below.` : `DepotDownloader: ${dr.error || "failed"}` };
          }
          const r = await bpApplyBuild(appid, it.key, dt, primary);
          if (!r.success) return { msg: r.error || "Could not apply that build" };
          const v = await verifyBuildApply(appid, it.key);
          if (v.phantom || !v.ok) return { msg: v.text };
          await noInternetFixBegin(appid).catch(() => ({}));
          triggerSteamInstall(appid).catch(() => {});
          const launched = launchGame(appid);
          if (launched) { try { Navigation.CloseSideMenus?.(); } catch { /* */ } }
          return { msg: launched ? `Pinned build ${it.key} — launching to download it…` : v.text };
        }, (res) => {
          try { toaster.toast({ title: "SLSDeck — build", body: res.msg }); } catch { /* */ }
          return res.msg;
        })}
      />);
    }} />);
  };

  const pickProton = async () => {
    setBusy("proton"); setNote("");
    let tools: string[] = [];
    try { tools = (await listInstalledProtonTools())?.tools || []; }
    catch (e) { setNote(`Could not list Proton versions: ${e}`); setBusy(""); return; }
    setBusy("");
    if (!tools.length) { setNote("No Proton versions found."); return; }
    const items: PickItem[] = [
      { key: "__default__", label: "Steam default", sublabel: "Clear the override for this game" },
      ...tools.map((t) => ({ key: t, label: t, sublabel: t === proton ? "current" : undefined })),
      { key: "__ge__", label: "Install latest GE-Proton…", sublabel: "Downloads from GitHub, then pick it here" },
    ];
    showModal(<PickerModal title="Proton version" subtitle={`For AppID ${appid}. Takes effect next launch.`} items={items} onPick={(it) => {
      if (it.key === "__ge__") run("proton", () => installLatestGeProton(), (r) => r.success ? `${r.tag || "GE-Proton"} installed${r.message ? ` — ${r.message}` : ""}. Open this list again to select it.` : r.error || "Could not install GE-Proton");
      else if (it.key === "__default__") run("proton", () => removeProtonMapping(appid), (r) => { refreshProton(); return r.success ? "Using Steam's default Proton again." : r.error || "Could not clear it"; });
      else run("proton", () => setProtonMapping(appid, it.key, "250"), (r) => { refreshProton(); return r.success ? `Proton set to ${it.key}. Relaunch the game for it to apply.` : r.error || "Could not set it"; });
    }} />);
  };

  const restoreSaves = async () => {
    setBusy("listsaves"); setNote("");
    let backups: { path: string; when: string; sizeMB: number }[] = [];
    try { backups = (await listGameSaveBackups(appid, ""))?.backups || []; }
    catch (e) { setNote(`Could not read backups: ${e}`); setBusy(""); return; }
    setBusy("");
    if (!backups.length) { setNote("No save backups for this game yet — make one first."); return; }
    showModal(<PickerModal title="Restore saves" subtitle="Pick which backup to restore." items={backups.map((b) => ({ key: b.path, label: b.when, sublabel: `${b.sizeMB} MB` }))} onPick={(it) => {
      showModal(<ConfirmModal strTitle="Overwrite current saves?" strDescription={`This copies the backup from ${it.label} back into the game's Proton prefix, replacing files that are there now. This cannot be undone.`} strOKButtonText="Restore" onOK={() => run("restore", () => restoreGameSaves(appid, it.key), (r) => r.success ? `Restored ${(r.restoredFiles || []).length} file(s).` : r.error || "Restore failed")} />);
    }} />);
  };

  const protonLabel = proton == null ? "checking…" : proton || "Steam default";

  return (
    <PanelSection title="This game">
      <PanelSectionRow><div style={{ fontSize: 12, opacity: 0.85, padding: "2px 0" }}>Proton: <span style={{ fontWeight: 600 }}>{protonLabel}</span></div></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={pickProton}>{busy === "proton" ? "Working…" : "Change Proton version"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => run("backup", () => backupGameSaves(appid, ""), (r) => r.success ? `Backed up ${r.fileCount} save file(s) to ${r.zipPath}` : r.error || "Backup failed")}>{busy === "backup" ? "Backing up…" : "Back up this game's saves"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={restoreSaves}>{busy === "listsaves" || busy === "restore" ? "Working…" : "Restore saves from a backup"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => run("repair", () => repairGame(appid), (r) => r.success ? `Repaired: ${(r.steps || []).join(", ") || "nothing needed"}` : r.error || "Repair failed")}>{busy === "repair" ? "Repairing…" : "Repair this game"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => run("stuck", () => fixStuckUpdate(appid), (r) => r.success ? (r.note || "Depotcache refreshed — retry the update in Steam.") : (r.error || "Couldn't fix the update."))}>{busy === "stuck" ? "Working…" : "Fix stuck update"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>If an update won't finish, this re-deploys the game's manifests/keys so Steam can retry.</div></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={fixLaunchTarget}>{busy === "repoint" ? "Working…" : "Fix launch target (use game's real exe)"}</ButtonItem></PanelSectionRow>
      <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>If a fix doesn't take effect, point Steam at the game's real Binaries/Win64 executable. Preserves your other launch options.{repointed ? " · Currently repointed." : ""}</div></PanelSectionRow>
      {repointed && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={resetLaunchTarget}>Reset launch target</ButtonItem></PanelSectionRow>}

      {(ageSec != null || pinned != null || histCount > 0) && <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.7, padding: "2px 2px" }}>{ageSec != null ? `Manifest age: ${ageSec < 3600 ? Math.round(ageSec / 60) + "m" : ageSec < 86400 ? Math.round(ageSec / 3600) + "h" : Math.round(ageSec / 86400) + "d"}` : ""}{pinned != null ? `${ageSec != null ? " · " : ""}${pinned ? "version frozen" : "auto-updates"}` : ""}</div></PanelSectionRow>}
      {pinned != null && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={toggleFreeze}>{busy === "freeze" ? "Working…" : pinned ? "Unfreeze version (allow updates)" : "Freeze version (block updates)"}</ButtonItem></PanelSectionRow>}
      {histCount > 0 && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={openRollback}>{busy === "rollback" ? "Working…" : "Roll back build…"}</ButtonItem></PanelSectionRow>}
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={openBuildPicker}>{busy === "bp" ? "Working…" : "Install a specific build…"}</ButtonItem></PanelSectionRow>

      {depotdl && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy || ddlActive} onClick={async () => {
        setBusy("ddl");
        setNote(".NET / DepotDownloader preparing… First use may download the local .NET runtime before DLC download starts.");
        try {
          const r = await depotdlDownloadDlc(appid);
          setNote(r.success ? "Started — downloading content DLC in the background." : (r.error || "Could not start"));
        } catch (e) { setNote(`Failed: ${e}`); }
        setBusy("");
        await pollDdlOnce(); startDdl();
      }}>{ddlActive && ddl?.op === "dlc" ? "Downloading DLC…" : busy === "ddl" ? ".NET / DepotDownloader preparing…" : "Download content DLC (DepotDownloader)"}</ButtonItem></PanelSectionRow>}

      {depotdl && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={async () => {
        setBusy("bp");
        let builds: { buildid: string; date: string; isCurrent?: boolean }[] = [];
        try { const r = await bpListBuilds(appid); if (r.success) builds = r.builds.filter((b) => !b.isCurrent); } catch { /* */ }
        setBusy("");
        if (!builds.length) { setNote("No older builds on SteamDB for this game."); return; }
        showModal(<PickerModal title="Download a build (files)" subtitle="Fetches the build's depots via DepotDownloader into the game folder." items={builds.map((b) => ({ key: b.buildid, label: `Build ${b.buildid}`, sublabel: b.date }))} onPick={async (it) => {
          setBusy("ddl");
          setNote(".NET / DepotDownloader preparing… First use may download the local .NET runtime before the build starts.");
          try {
            const r = await depotdlDownloadBuild(appid, it.key);
            setNote(r.success ? `Started — downloading build ${it.key} in the background.` : (r.error || "Could not start"));
          } catch (e) { setNote(`Failed: ${e}`); }
          setBusy("");
          await pollDdlOnce(); startDdl();
        }} />);
      }}>{ddlActive && ddl?.op === "build" ? "Downloading build…" : busy === "ddl" ? ".NET / DepotDownloader preparing…" : "Download a build's files…"}</ButtonItem></PanelSectionRow>}

      {depotdl && ddl && <PanelSectionRow><div style={{ width: "100%", padding: "2px 0" }}>
        <div style={{ fontSize: 12, marginBottom: 4, display: "flex", justifyContent: "space-between" }}><span>{ddl.op === "dlc" ? "Content DLC" : "Build"} · {ddl.status}</span><span style={{ opacity: 0.8 }}>{ddl.status === "downloading" ? `${ddl.percent || 0}%` : ddl.status === "done" ? "100%" : ""}</span></div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${ddl.status === "done" ? 100 : ddl.status === "failed" ? 100 : (ddl.percent || 0)}%`, background: ddl.status === "failed" ? "#d9534f" : ddl.status === "done" ? "#5cb85c" : "#4a90d9", transition: "width 0.3s" }} /></div>
        {ddl.error && <div style={{ fontSize: 11, color: ddl.status === "failed" ? "#f0ad4e" : "#8fbf8f", marginTop: 4, lineHeight: 1.4 }}>{ddl.error}</div>}
        {ddl.status === "done" && !ddl.error && <div style={{ fontSize: 11, color: "#8fbf8f", marginTop: 4 }}>Done — files placed in the game folder. Restart Steam if needed.</div>}
      </div></PanelSectionRow>}

      {steamless?.supported && <><PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={doSteamless}>{busy === "steamless" ? "Working…" : steamless.installed && !steamless.hasStub ? "SteamStub already removed" : "Remove SteamStub DRM (Steamless)"}</ButtonItem></PanelSectionRow><PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>Strips Steam's DRM wrapper from the game exe. Reverted by Un-fix.</div></PanelSectionRow></>}
      {allowUnlockers && smoke?.supported && <><PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => doSmoke(!smoke.installed)}>{busy === "smoke" ? "Working…" : smoke.installed ? "Remove DLC unlock (SmokeAPI)" : "Unlock DLC (SmokeAPI)"}</ButtonItem></PanelSectionRow></>}
      {allowUnlockers && (["cream", "uplayr1", "uplayr2"] as UnlockerKind[]).map((kind) => dlcU[kind]?.supported ? <PanelSectionRow key={kind}><ButtonItem layout="below" disabled={!!busy} onClick={() => doUnlocker(kind, !dlcU[kind]?.installed)}>{busy === `unlock-${kind}` ? "Working…" : dlcU[kind]?.installed ? `Remove ${UNLOCKER_LABEL[kind]}` : `Unlock ${UNLOCKER_LABEL[kind]}`}</ButtonItem></PanelSectionRow> : null)}
      {allowUnlockers && creamy?.supported && <><PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={doCreamy}>{busy === "creamy" ? "Working…" : creamy.installed ? "Rebuild native DLC unlock (CreamySteamy)" : "Compile native DLC unlock (CreamySteamy)"}</ButtonItem></PanelSectionRow></>}
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => run("mp", () => checkMultiplayer(appid), (r) => { setMp(r); return r.success ? `${r.headline}\n\n${r.detail}` : r.error || "Could not check"; })}>{busy === "mp" ? "Checking…" : "Will multiplayer work?"}</ButtonItem></PanelSectionRow>
      {mp?.verdict === "peer" && mp?.fix === "onlinefix" && <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={() => run("onlinefix", () => patchGameOnlinefix(appid), (r) => { if (!r.success) return r.error || "Could not check this game"; const found = r.detectedFixes || []; if (!found.length) return r.message || "No online-fix DLLs found in this game."; return `Found ${found.join(", ")} — set launch options to: ${r.launchOption}`; })}>{busy === "onlinefix" ? "Working…" : "Set up online-fix multiplayer"}</ButtonItem></PanelSectionRow>}
      {note ? <PanelSectionRow><ScrollableResult text={note} copy={note.length > 120} /></PanelSectionRow> : null}
    </PanelSection>
  );
}