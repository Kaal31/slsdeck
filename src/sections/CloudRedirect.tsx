import { ButtonItem, DropdownItem, Navigation, PanelSection, PanelSectionRow, ToggleField } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import {
  CloudRedirectProvider, CloudRedirectProviderStatus, crAuthPoll, crAuthStart,
  crEnsureInstalledAuto, crGetEnabled, crListLocalApps, crProviderStatus,
  crSetEnabled, crSetProvider, crSetProviderToggle, crSignOut,
} from "../api";

const PROVIDERS: Array<{ data: CloudRedirectProvider; label: string }> = [
  { data: "local", label: "Local folder" },
  { data: "gdrive", label: "Google Drive" },
  { data: "onedrive", label: "OneDrive" },
];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Native control surface for cloudredirect-moon's config and OAuth contract. */
export function CloudRedirectSection() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<CloudRedirectProviderStatus>({ success: false });
  const [saveCount, setSaveCount] = useState(0);
  const alive = useRef(true);

  const load = async () => {
    try { setEnabled(!!(await crGetEnabled()).enabled); } catch { /* best effort */ }
    try { setState(await crProviderStatus()); } catch { /* best effort */ }
    try { setSaveCount((await crListLocalApps()).apps?.length || 0); } catch { /* best effort */ }
  };
  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, []);

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
      setMsg("Finish sign-in in the browser; SLSDeck is waiting for the callback…");
      for (let i = 0; alive.current && i < 300; i++) {
        await sleep(1000);
        const poll = await crAuthPoll();
        if (poll.status === "waiting") continue;
        if (poll.status === "done") { setMsg("Cloud provider connected."); await load(); break; }
        if (poll.status === "idle") break;
        throw new Error(poll.error || "Sign-in failed");
      }
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
    <PanelSectionRow><div style={{ fontSize: 11, color: "#f5a623" }}>
      ⚠ Experimental — back up important saves. Existing Flatpak credentials are migrated without deleting the originals.
    </div></PanelSectionRow>
    {msg && <PanelSectionRow><div style={{ fontSize: 11, opacity: .78 }}>{msg}</div></PanelSectionRow>}
  </PanelSection>;
}
