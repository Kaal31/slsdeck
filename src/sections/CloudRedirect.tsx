import { ButtonItem, DialogButton, DropdownItem, Focusable, ModalRoot, Navigation, PanelSection, PanelSectionRow, TextField, ToggleField, showModal } from "@decky/ui";
import { FileSelectionType, openFilePicker } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import {
  CloudRedirectLocalApp, CloudRedirectProvider, CloudRedirectProviderStatus, crAuthCallback, crAuthPoll, crAuthStart,
  crEnsureInstalledAuto, crGameArtwork, crGetEnabled, crImportSave, crListLocalApps, crProviderStatus, getInstalledApps,
  crSetEnabled, crSetProvider, crSetProviderToggle, crSetSyncFolder, crSignOut,
} from "../api";

const PROVIDERS: Array<{ data: CloudRedirectProvider; label: string }> = [
  { data: "local", label: "Built-in local storage" },
  { data: "folder", label: "Custom folder" },
  { data: "gdrive", label: "Google Drive" },
  { data: "onedrive", label: "OneDrive" },
];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function SaveGamePickerModal({
  games, closeModal, onResult,
}: {
  games: Array<{ appid: number; name: string }>;
  closeModal?: () => void;
  onResult: (game: { appid: number; name: string } | null) => void;
}) {
  const settled = useRef(false);
  const close = () => {
    if (!settled.current) onResult(null);
    closeModal?.();
  };
  return <ModalRoot closeModal={close}>
    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Which game owns this save?</div>
    <div style={{ fontSize: 12, opacity: .7, marginBottom: 10 }}>
      The imported files will be placed in this game's CloudRedirect folder.
    </div>
    <Focusable style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "56vh", overflowY: "scroll" }}>
      {games.map((game) => <DialogButton key={game.appid} style={{ textAlign: "left", padding: "8px 10px" }}
        onClick={() => { settled.current = true; onResult(game); closeModal?.(); }}>
        <div style={{ fontSize: 14 }}>{game.name}</div>
        <div style={{ fontSize: 11, opacity: .6 }}>AppID {game.appid}</div>
      </DialogButton>)}
    </Focusable>
  </ModalRoot>;
}

function pickSaveGame(games: Array<{ appid: number; name: string }>): Promise<{ appid: number; name: string } | null> {
  return new Promise((resolve) => showModal(<SaveGamePickerModal games={games} onResult={resolve} />));
}

function migrationMessage(result: CloudRedirectProviderStatus, fallback: string): string {
  const migrations = result.migrations || (result.repairMigration ? [result.repairMigration] : []);
  if (!migrations.length) return fallback;
  const copied = migrations.reduce((n, item) => n + (item.copied || 0) + (item.updated || 0), 0);
  const conflicts = migrations.reduce((n, item) => n + (item.conflicts || 0), 0);
  const failed = migrations.reduce((n, item) => n + (item.failed || 0), 0);
  return `${fallback} Migration verified: ${copied} copied/updated${conflicts ? `, ${conflicts} conflicts preserved` : ""}${failed ? `, ${failed} failed` : ""}.`;
}

function formatSize(bytes: number, local = true): string {
  if (!local) return "Cloud only";
  if (!bytes) return "No local save files yet";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatRemoteSave(timestamp: number | undefined, provider: CloudRedirectProvider | undefined, remote = false): string {
  const providerName = provider === "gdrive" ? "Google Drive" : provider === "onedrive" ? "OneDrive" :
    provider === "folder" ? "custom folder" : "local storage";
  if (!timestamp) return provider === "local" ? "No stored save metadata yet" :
    remote ? `Stored in ${providerName}` : `Not synced to ${providerName} yet`;
  try {
    const date = new Date(timestamp * 1000).toLocaleString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    return provider === "local" ? `Latest local save ${date}` : `Last ${providerName} sync ${date}`;
  } catch {
    return `${providerName} save time unavailable`;
  }
}

function steamGame(appid: number, resolvedName = ""): { title: string; header: string; wideCapsule: string } {
  let title = resolvedName || `Steam App ${appid}`;
  try {
    const overview: any = (window as any).appStore?.GetAppOverviewByAppID?.(appid)
      || (window as any).appStore?.GetAppOverviewByGameID?.(appid);
    title = overview?.display_name || overview?.sort_as || title;
  } catch { /* use the AppID fallback */ }
  return {
    title,
    header: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    wideCapsule: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_616x353.jpg`,
  };
}

function CloudSaveCard({ app, provider }: { app: CloudRedirectLocalApp; provider?: CloudRedirectProvider }) {
  const game = steamGame(app.appid, app.name);
  const [artIndex, setArtIndex] = useState(0);
  const [localArtwork, setLocalArtwork] = useState("");
  const [localArtworkChecked, setLocalArtworkChecked] = useState(false);
  const artwork = localArtwork || [game.header, game.wideCapsule][artIndex];
  const advanceArtwork = async () => {
    if (localArtwork) { setLocalArtwork(""); setLocalArtworkChecked(true); return; }
    if (artIndex === 0) { setArtIndex(1); return; }
    if (!localArtworkChecked) {
      setLocalArtworkChecked(true);
      try {
        const result = await crGameArtwork(app.appid);
        if (result.success && result.image) setLocalArtwork(result.image);
      } catch { /* leave the card's gradient fallback */ }
      return;
    }
    setArtIndex(2);
  };
  const openGame = () => {
    try {
      Navigation.Navigate(`/library/app/${app.appid}`);
      (Navigation as any).CloseSideMenus?.();
    } catch { /* Steam may not have finished loading this app overview yet */ }
  };
  return <DialogButton onClick={openGame} style={{
    position: "relative", overflow: "hidden", minHeight: 112, borderRadius: 9,
    border: "1px solid rgba(103, 193, 245, .26)", marginBottom: 9,
    background: "linear-gradient(135deg, rgba(26, 45, 62, .98), rgba(13, 24, 35, .98))",
    boxShadow: "0 7px 18px rgba(0, 0, 0, .22)", padding: 0, textAlign: "left",
  }}>
    {artwork && <img src={artwork} alt="" onError={advanceArtwork} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
      opacity: .48,
    }} />}
    <div style={{
      position: "absolute", inset: 0,
      background: "linear-gradient(90deg, rgba(8, 16, 25, .96) 0%, rgba(8, 16, 25, .76) 54%, rgba(8, 16, 25, .28) 100%)",
    }} />
    <div style={{ position: "relative", padding: "13px 14px", textShadow: "0 1px 3px #000" }}>
      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.18 }}>{game.title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 13, fontSize: 11 }}>
        <span style={{ color: "#67c1f5", fontWeight: 650 }}>{formatSize(app.size, app.local !== false)}</span>
        <span style={{ opacity: .82 }}>{app.local === false ? "Files available remotely" : `${app.files} ${app.files === 1 ? "file" : "files"}`}</span>
        {app.remote && app.local !== false && <span style={{ color: "#5ee6c4", fontWeight: 650 }}>Local + cloud</span>}
        <span style={{ opacity: .82 }}>{formatRemoteSave(app.remoteTime, provider, !!app.remote)}</span>
      </div>
    </div>
  </DialogButton>;
}

/** Native control surface for cloudredirect-moon's config and OAuth contract. */
export function CloudRedirectSection() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<CloudRedirectProviderStatus>({ success: false });
  const [saves, setSaves] = useState<CloudRedirectLocalApp[]>([]);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [authWaiting, setAuthWaiting] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [folderDraft, setFolderDraft] = useState(false);
  const [folderError, setFolderError] = useState("");
  const folderDraftRef = useRef(false);
  const [importGames, setImportGames] = useState<Array<{ appid: number; name: string }>>([]);
  const alive = useRef(true);
  const authWatch = useRef(0);

  const load = async () => {
    try { setEnabled(!!(await crGetEnabled()).enabled); } catch { /* best effort */ }
    try {
      const provider = await crProviderStatus();
      setState(provider);
      if (!folderDraftRef.current) setFolderPath(provider.syncFolderPath || "");
      if (provider.repairMigration?.success) {
        setMsg(migrationMessage(provider, "Repaired the existing Custom Folder configuration. Restart Steam to finish."));
      }
      const auth = await crAuthPoll();
      if (auth.status === "done" && provider.authenticated) {
        setMsg("Cloud provider connected."); setAuthWaiting(false); setCallbackUrl("");
      } else if (auth.status && auth.status !== "idle" && auth.status !== "waiting") {
        setMsg(`Cloud provider sign-in failed${auth.error ? `: ${auth.error}` : "."}`);
      }
    } catch { /* best effort */ }
    try {
      const catalog = await crListLocalApps();
      setSaves(catalog.apps || []);
      if (catalog.remoteError) setMsg(`Local saves shown; cloud discovery unavailable: ${catalog.remoteError}`);
    } catch { /* best effort */ }
    try {
      const installed = await getInstalledApps();
      const games = (installed.apps || [])
        .map((app) => ({ appid: Number(app.appid), name: app.gameName || `AppID ${app.appid}` }))
        .filter((app) => app.appid > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
      setImportGames(games);
    } catch { /* best effort */ }
  };
  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; authWatch.current += 1; };
  }, []);

  const watchAutomaticCallback = async (watchId: number) => {
    for (let i = 0; alive.current && authWatch.current === watchId && i < 300; i++) {
      await sleep(1000);
      try {
        const poll = await crAuthPoll();
        if (poll.status === "waiting") continue;
        if (poll.status === "done") {
          setMsg("Cloud provider connected."); setAuthWaiting(false); setCallbackUrl(""); await load();
        } else if (poll.status !== "idle") {
          setMsg(`Automatic callback unavailable. Paste the complete localhost URL below${poll.error ? `: ${poll.error}` : "."}`);
        }
        break;
      } catch {
        // Manual completion remains available; a polling failure must not lock UI.
      }
    }
  };

  const changeEnabled = async (value: boolean) => {
    setBusy(true); setEnabled(value);
    try {
      const result = await crSetEnabled(value);
      if (!result.success) { setEnabled(!value); setMsg(result.error || "Could not update CloudRedirect"); }
      else setMsg(value ? "Cloud saves enabled for SLS-added games." : "Cloud saves disabled.");
    } catch (error) { setEnabled(!value); setMsg(`Error: ${error}`); }
    setBusy(false);
  };

  const selectProvider = async (value: CloudRedirectProvider) => {
    if (value === "folder") {
      // Choosing a folder is only an editor action. The active provider must
      // stay unchanged until Use this folder validates and migrates the data.
      folderDraftRef.current = true;
      setFolderDraft(true);
      setFolderError("");
      setMsg("Enter a path and press Use this folder. Your current provider stays active until then.");
      return;
    }
    folderDraftRef.current = false;
    setFolderDraft(false);
    setFolderError("");
    if (value === state.provider) return;
    setBusy(true);
    try {
      const result = await crSetProvider(value);
      if (!result.success) {
        throw new Error(result.error || "Provider transition failed");
      }
      setState(result);
      const base = value === "local" ? "Using CloudRedirect's built-in local storage. Restart Steam to finish." :
        result.authenticated ? "Existing sign-in restored. Restart Steam to finish." : "Provider selected. Connect it below.";
      setMsg(migrationMessage(result, base));
    } catch (error) { setMsg(`Error: ${error}`); }
    setBusy(false);
  };

  const saveFolder = async () => {
    setBusy(true);
    setFolderError("");
    setMsg("Checking the folder and safely moving saves…");
    try {
      const result = await crSetSyncFolder(folderPath.trim());
      if (!result.success) throw new Error(result.error || "Could not use that folder");
      folderDraftRef.current = false;
      setFolderDraft(false);
      setState(result);
      setFolderPath(result.syncFolderPath || folderPath.trim());
      setMsg(migrationMessage(result, "Custom folder activated. Restart Steam before using it."));
      await load();
    } catch (error) {
      const message = String(error);
      setFolderError(message);
      setMsg(`Folder setup failed: ${message}`);
    }
    if (alive.current) setBusy(false);
  };

  const pickFolder = async () => {
    try {
      const selected = await openFilePicker(FileSelectionType.FOLDER, "/home", false, true);
      const path = String(selected?.path || selected?.realpath || "").trim();
      if (!path) return;
      if (!path.startsWith("/")) throw new Error("Select an absolute folder path");
      setFolderPath(path);
      setFolderError("");
      setMsg("Folder selected. Press Use this folder to activate it.");
    } catch (error) {
      const message = String(error);
      setFolderError(message);
      setMsg(`Folder selection failed: ${message}`);
    }
  };

  const connect = async () => {
    const provider = state.provider;
    if (!provider || provider === "local") return;
    setBusy(true); setMsg("Preparing Moon CloudRedirect sign-in…");
    try {
      const installed = await crEnsureInstalledAuto();
      if (!installed.installed) throw new Error(installed.log || "Moon hook installation failed");
      const start = await crAuthStart(provider);
      if (!start.success || !start.authUrl) throw new Error(start.error || "Could not start sign-in");
      Navigation.NavigateToExternalWeb(start.authUrl);
      setAuthWaiting(true);
      setMsg("Finish sign-in in the browser; SLSDeck is capturing the localhost callback automatically.");
      const watchId = ++authWatch.current;
      void watchAutomaticCallback(watchId);
    } catch (error) { setMsg(`Sign-in failed: ${error}`); }
    if (alive.current) setBusy(false);
  };

  const finishCallback = async () => {
    if (!callbackUrl.trim()) return;
    setBusy(true); setMsg("Completing CloudRedirect sign-in…");
    try {
      const result = await crAuthCallback(callbackUrl.trim());
      if (!result.success || result.status !== "done") throw new Error(result.error || "Sign-in did not complete");
      authWatch.current += 1;
      setAuthWaiting(false); setCallbackUrl(""); setMsg("Cloud provider connected."); await load();
    } catch (error) { setMsg(`Sign-in failed: ${error}`); }
    if (alive.current) setBusy(false);
  };

  const toggleOption = async (key: "sync_achievements" | "sync_playtime", value: boolean) => {
    const field = key === "sync_achievements" ? "syncAchievements" : "syncPlaytime";
    setState((old) => ({ ...old, [field]: value }));
    try { setState(await crSetProviderToggle(key, value)); }
    catch (error) { setMsg(`Error: ${error}`); await load(); }
  };

  const disconnect = async () => {
    setBusy(true);
    try { setState(await crSignOut(state.provider)); setMsg("Provider credentials removed from this device."); }
    catch (error) { setMsg(`Error: ${error}`); }
    setBusy(false);
  };

  const importSave = async () => {
    const game = await pickSaveGame(importGames);
    if (!game) return;
    let path = "";
    try {
      const picked: any = await openFilePicker(
        FileSelectionType.FILE, "/home/deck/Downloads", true, true,
      );
      path = picked?.realpath || picked?.path || "";
    } catch { return; }
    if (!path) return;
    setBusy(true); setMsg("Importing save…");
    try {
      const result = await crImportSave(game.appid, path);
      if (!result.success) throw new Error(result.error || "Save import failed");
      const wrapper = result.wrapperRemoved ? " The archive's outer folder was removed." : "";
      const backup = result.backup ? " Existing saves were backed up first." : "";
      setMsg(`Imported ${result.files || 0} save file${result.files === 1 ? "" : "s"}.${wrapper}${backup}`);
      await load();
    } catch (error) { setMsg(`Save import failed: ${error}`); }
    if (alive.current) setBusy(false);
  };

  const displayProvider = folderDraft ? "folder" : state.provider;
  const selected = PROVIDERS.find((item) => item.data === (displayProvider || "local"));
  const saveCount = saves.length;
  const remoteOnlyCount = saves.filter((app) => app.remote && app.local === false).length;
  const sortedSaves = [...saves].sort((a, b) => {
    const aHasSaves = a.files > 0 || a.size > 0 || !!a.remote;
    const bHasSaves = b.files > 0 || b.size > 0 || !!b.remote;
    if (aHasSaves !== bHasSaves) return aHasSaves ? -1 : 1;
    if ((b.remoteTime || 0) !== (a.remoteTime || 0)) return (b.remoteTime || 0) - (a.remoteTime || 0);
    return steamGame(a.appid, a.name).title.localeCompare(steamGame(b.appid, b.name).title);
  });
  return <PanelSection title="Cloud saves (CloudRedirect)">
    <PanelSectionRow><ToggleField label="Cloud saves for added games"
      description="Uses the native cloudredirect-moon hook. No Flatpak companion is required."
      checked={enabled} onChange={changeEnabled} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><DropdownItem label="Storage provider"
      description="Configuration is read directly by cloudredirect-moon."
      rgOptions={PROVIDERS} selectedOption={selected?.data || "local"}
      strDefaultLabel={selected?.label || "Built-in local storage"}
      onChange={(option: any) => selectProvider(option.data)} disabled={busy} /></PanelSectionRow>
    {displayProvider === "folder" && <>
      {folderDraft && state.provider !== "folder" && <PanelSectionRow><div style={{ fontSize: 11, opacity: .78 }}>
        {PROVIDERS.find((item) => item.data === state.provider)?.label || "Current provider"} stays active until this folder is accepted.
      </div></PanelSectionRow>}
      <PanelSectionRow><ButtonItem layout="below" onClick={pickFolder} disabled={busy}
        description="Browse internal storage, SD cards, external drives, or network mounts.">
        Choose folder…
      </ButtonItem></PanelSectionRow>
      {!!folderPath.trim() && <PanelSectionRow><div style={{ fontSize: 11, overflowWrap: "anywhere" }}>
        Selected folder: {folderPath}
      </div></PanelSectionRow>}
      <PanelSectionRow><ButtonItem layout="below" onClick={saveFolder} disabled={busy || !folderPath.trim()}>
        Use this folder
      </ButtonItem></PanelSectionRow>
      {folderError && <PanelSectionRow><div style={{ fontSize: 11, color: "#ffcc66" }}>
        Folder setup failed: {folderError}
      </div></PanelSectionRow>}
    </>}
    {displayProvider !== "local" && displayProvider !== "folder" && !state.authenticated &&
      <PanelSectionRow><ButtonItem layout="below" onClick={connect} disabled={busy}>Connect provider</ButtonItem></PanelSectionRow>}
    {displayProvider !== "local" && displayProvider !== "folder" && !state.authenticated && authWaiting && <>
      <PanelSectionRow><div style={{ fontSize: 11, lineHeight: 1.45, opacity: .78 }}>
        Automatic capture is active. If the browser still ends on an unreachable localhost page, copy its complete address-bar URL and paste it below.
      </div></PanelSectionRow>
      <PanelSectionRow><TextField
        label="Callback URL"
        description="Includes both ?code= and &state=."
        value={callbackUrl}
        onChange={(event: any) => setCallbackUrl(event?.target?.value ?? String(event || ""))}
      /></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={finishCallback} disabled={busy || !callbackUrl.trim()}>
        Finish sign-in
      </ButtonItem></PanelSectionRow>
    </>}
    {displayProvider !== "local" && displayProvider !== "folder" && state.authenticated &&
      <PanelSectionRow><ButtonItem layout="below" onClick={disconnect} disabled={busy}>Sign out</ButtonItem></PanelSectionRow>}
    <PanelSectionRow><ToggleField label="Sync achievements" checked={!!state.syncAchievements}
      onChange={(v) => toggleOption("sync_achievements", v)} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><ToggleField label="Sync playtime" checked={!!state.syncPlaytime}
      onChange={(v) => toggleOption("sync_playtime", v)} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><ButtonItem layout="below" onClick={importSave} disabled={busy || !importGames.length}
      description="Choose an SLS game, then select a loose save file or ZIP/TAR archive from Downloads.">
      Add save file or archive
    </ButtonItem></PanelSectionRow>
    <PanelSectionRow><div style={{ fontSize: 11, color: state.authenticated || state.provider === "local" || state.configured ? "#5ee6c4" : "#f5a623" }}>
      {state.provider === "local" ? `Local provider ready · ${saveCount} game save ${saveCount === 1 ? "folder" : "folders"}` :
        state.provider === "folder" ? (state.configured ? `✓ Custom folder ready · ${state.syncFolderPath}` : "Custom folder needs a writable path.") :
        state.authenticated ? `✓ ${selected?.label} connected · ${saveCount} managed ${saveCount === 1 ? "game" : "games"}${remoteOnlyCount ? ` · ${remoteOnlyCount} cloud only` : ""}` :
        `${selected?.label || "Cloud provider"} needs sign-in.`}
    </div></PanelSectionRow>
    <PanelSectionRow><div style={{ width: "100%", marginTop: 5 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "0 2px 9px" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Cloud-managed games</span>
        <span style={{ fontSize: 10, opacity: .62 }}>{saveCount} {saveCount === 1 ? "game" : "games"}</span>
      </div>
      {sortedSaves.length ? sortedSaves.map((app) => <CloudSaveCard key={`${app.account}:${app.appid}`} app={app} provider={state.provider} />) :
        <div style={{ padding: "14px 12px", borderRadius: 8, background: "rgba(20, 33, 46, .72)", fontSize: 11, opacity: .72 }}>
          No CloudRedirect game folders have been created yet.
        </div>}
    </div></PanelSectionRow>
    <PanelSectionRow><div style={{ fontSize: 11, color: "#f5a623" }}>
      ⚠ Experimental — back up important saves. Existing Flatpak credentials are migrated without deleting the originals.
    </div></PanelSectionRow>
    {msg && <PanelSectionRow><div style={{ fontSize: 11, opacity: .78 }}>{msg}</div></PanelSectionRow>}
  </PanelSection>;
}
