import { ButtonItem, DialogButton, DropdownItem, Navigation, PanelSection, PanelSectionRow, TextField, ToggleField } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import {
  CloudRedirectLocalApp, CloudRedirectProvider, CloudRedirectProviderStatus, crAuthCallback, crAuthPoll, crAuthStart,
  crEnsureInstalledAuto, crGameArtwork, crGetEnabled, crListLocalApps, crProviderStatus,
  crSetEnabled, crSetProvider, crSetProviderToggle, crSignOut,
} from "../api";

const PROVIDERS: Array<{ data: CloudRedirectProvider; label: string }> = [
  { data: "local", label: "Local folder" },
  { data: "gdrive", label: "Google Drive" },
  { data: "onedrive", label: "OneDrive" },
];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatSize(bytes: number): string {
  if (!bytes) return "No local save files yet";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatRemoteSave(timestamp: number | undefined, provider: CloudRedirectProvider | undefined): string {
  const providerName = provider === "gdrive" ? "Google Drive" : provider === "onedrive" ? "OneDrive" : "local storage";
  if (!timestamp) return provider === "local" ? "No stored save metadata yet" : `Not synced to ${providerName} yet`;
  try {
    const date = new Date(timestamp * 1000).toLocaleString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    return provider === "local" ? `Latest local save ${date}` : `Last ${providerName} sync ${date}`;
  } catch {
    return `${providerName} save time unavailable`;
  }
}

function steamGame(appid: number): { title: string; header: string; wideCapsule: string } {
  let title = `Steam App ${appid}`;
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
  const game = steamGame(app.appid);
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
        <span style={{ color: "#67c1f5", fontWeight: 650 }}>{formatSize(app.size)}</span>
        <span style={{ opacity: .82 }}>{app.files} {app.files === 1 ? "file" : "files"}</span>
        <span style={{ opacity: .82 }}>{formatRemoteSave(app.remoteTime, provider)}</span>
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
  const alive = useRef(true);
  const authWatch = useRef(0);

  const load = async () => {
    try { setEnabled(!!(await crGetEnabled()).enabled); } catch { /* best effort */ }
    try {
      const provider = await crProviderStatus();
      setState(provider);
      const auth = await crAuthPoll();
      if (auth.status === "done" && provider.authenticated) {
        setMsg("Cloud provider connected."); setAuthWaiting(false); setCallbackUrl("");
      } else if (auth.status && auth.status !== "idle" && auth.status !== "waiting") {
        setMsg(`Cloud provider sign-in failed${auth.error ? `: ${auth.error}` : "."}`);
      }
    } catch { /* best effort */ }
    try { setSaves((await crListLocalApps()).apps || []); } catch { /* best effort */ }
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
    setBusy(true);
    try {
      const result = await crSetProvider(value);
      setState(result);
      setMsg(value === "local" ? "Using CloudRedirect's local storage folder." :
        result.authenticated ? "Existing sign-in restored." : "Provider selected. Connect it below.");
    } catch (error) { setMsg(`Error: ${error}`); }
    setBusy(false);
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

  const selected = PROVIDERS.find((item) => item.data === (state.provider || "local"));
  const saveCount = saves.length;
  const sortedSaves = [...saves].sort((a, b) => {
    const aHasSaves = a.files > 0 || a.size > 0;
    const bHasSaves = b.files > 0 || b.size > 0;
    if (aHasSaves !== bHasSaves) return aHasSaves ? -1 : 1;
    if ((b.remoteTime || 0) !== (a.remoteTime || 0)) return (b.remoteTime || 0) - (a.remoteTime || 0);
    return steamGame(a.appid).title.localeCompare(steamGame(b.appid).title);
  });
  return <PanelSection title="Cloud saves (CloudRedirect)">
    <PanelSectionRow><ToggleField label="Cloud saves for added games"
      description="Uses the native cloudredirect-moon hook. No Flatpak companion is required."
      checked={enabled} onChange={changeEnabled} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><DropdownItem label="Storage provider"
      description="Configuration is read directly by cloudredirect-moon."
      rgOptions={PROVIDERS} selectedOption={selected?.data || "local"}
      strDefaultLabel={selected?.label || "Local folder"}
      onChange={(option: any) => selectProvider(option.data)} disabled={busy} /></PanelSectionRow>
    {state.provider !== "local" && !state.authenticated &&
      <PanelSectionRow><ButtonItem layout="below" onClick={connect} disabled={busy}>Connect provider</ButtonItem></PanelSectionRow>}
    {state.provider !== "local" && !state.authenticated && authWaiting && <>
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
    {state.provider !== "local" && state.authenticated &&
      <PanelSectionRow><ButtonItem layout="below" onClick={disconnect} disabled={busy}>Sign out</ButtonItem></PanelSectionRow>}
    <PanelSectionRow><ToggleField label="Sync achievements" checked={!!state.syncAchievements}
      onChange={(v) => toggleOption("sync_achievements", v)} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><ToggleField label="Sync playtime" checked={!!state.syncPlaytime}
      onChange={(v) => toggleOption("sync_playtime", v)} disabled={busy} /></PanelSectionRow>
    <PanelSectionRow><div style={{ fontSize: 11, color: state.authenticated || state.provider === "local" ? "#5ee6c4" : "#f5a623" }}>
      {state.provider === "local" ? `Local provider ready · ${saveCount} game save ${saveCount === 1 ? "folder" : "folders"}` :
        state.authenticated ? `✓ ${selected?.label} connected · ${saveCount} local game save ${saveCount === 1 ? "folder" : "folders"}` :
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
