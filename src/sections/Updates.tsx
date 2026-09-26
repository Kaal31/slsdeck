import { PanelSection, PanelSectionRow, ToggleField, ButtonItem, DropdownItem, ProgressBarWithInfo } from "@decky/ui";
import { toaster } from "@decky/api";
import { ScrollableResult } from "../components/ScrollableResult";
import { useEffect, useRef, useState } from "react";
import { updatesCheck, updatesUpdateAll, getAutoUpdate, setAutoUpdate, UpdateItem,
  getCheckEngineUpdates, setCheckEngineUpdates, getCheckHeadcrabUpdates, setCheckHeadcrabUpdates,
  pluginUpdateStatus, pluginUpdateReleases, pluginPrepareReplacement, PluginRelease, PluginUpdateStatus,
  getUiSettings, setUiSetting } from "../api";

const UPDATE_BANNERS_EVENT = "slsdeck-update-banners";

enum PluginInstallType { REINSTALL = 1, UPDATE = 2, DOWNGRADE = 3 }

const semverCompare = (left: string, right: string): number => {
  const parse = (value: string) => (value.match(/\d+\.\d+\.\d+/)?.[0] || "0.0.0").split(".").map(Number);
  const a = parse(left), b = parse(right);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
};

function deckyBackend(): any {
  return (window as any).DeckyBackend ?? (window.opener as any)?.DeckyBackend ?? null;
}

/**
 * Tool updates — keeps every GitHub-sourced tool/DLL (SmokeAPI, CreamAPI, Uplay
 * unlockers) on the latest release, checked on boot. Proton and the HV
 * module are large / system-specific, so they are only flagged here.
 */
export function UpdatesSection() {
  const [ups, setUps] = useState<UpdateItem[]>([]);
  const [plugin, setPlugin] = useState<PluginUpdateStatus | null>(null);
  const [releases, setReleases] = useState<PluginRelease[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("update-system");
  const [selectedTag, setSelectedTag] = useState("");
  const [pluginBusy, setPluginBusy] = useState(false);
  const [pluginProgress, setPluginProgress] = useState(0);
  const [pluginMsg, setPluginMsg] = useState("");
  const [updateBanners, setUpdateBanners] = useState(true);
  const pluginDownloadStarted = useRef(false);
  const [autoUp, setAutoUp] = useState(true);
  const [engineUp, setEngineUp] = useState(false);
  const [headcrabUp, setHeadcrabUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try { setUps((await updatesCheck()).items || []); } catch { /* */ }
    try {
      const status = await pluginUpdateStatus();
      setPlugin(status);
      const list = status.releases || (await pluginUpdateReleases()).releases || [];
      setReleases(list);
      const availableChannels = Array.from(new Set(list.map((item) => item.channel)));
      const defaultChannel = availableChannels.includes(status.currentChannel)
        ? status.currentChannel : availableChannels.includes("update-system") ? "update-system" : (availableChannels[0] || "");
      setSelectedChannel((previous) => availableChannels.includes(previous) ? previous : defaultChannel);
    } catch (error) { setPluginMsg(`Plugin update check failed: ${error}`); }
    try { setAutoUp(!!(await getAutoUpdate()).enabled); } catch { /* */ }
    try { setEngineUp(!!(await getCheckEngineUpdates()).enabled); } catch { /* */ }
    try { setHeadcrabUp(!!(await getCheckHeadcrabUpdates()).enabled); } catch { /* */ }
    try {
      const value = (await getUiSettings()).settings?.pluginUpdateBanners;
      setUpdateBanners(value !== false);
    } catch { /* default on */ }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const backend = deckyBackend();
    if (!backend?.addEventListener) return;
    const start = (name: string) => {
      if (name !== "SLSDeckUniversal") return;
      pluginDownloadStarted.current = true;
      setPluginBusy(true); setPluginProgress(0); setPluginMsg("Downloading plugin…");
    };
    const progress = (percent: number) => {
      setPluginProgress(Number(percent) || 0);
    };
    const finish = (name: string) => {
      if (name !== "SLSDeckUniversal") return;
      pluginDownloadStarted.current = false;
      setPluginProgress(100); setPluginMsg("Plugin installed. Reloading…");
      setPluginBusy(false);
      backend.call("loader/reload_plugin", name).catch(() => {});
    };
    backend.addEventListener("loader/plugin_download_start", start);
    backend.addEventListener("loader/plugin_download_info", progress);
    backend.addEventListener("loader/plugin_download_finish", finish);
    return () => {
      backend.removeEventListener?.("loader/plugin_download_start", start);
      backend.removeEventListener?.("loader/plugin_download_info", progress);
      backend.removeEventListener?.("loader/plugin_download_finish", finish);
    };
  }, []);

  const updatable = ups.filter((u) => u.updateAvailable);
  const channels = Array.from(new Set(releases.map((item) => item.channel)));
  const channelReleases = releases.filter((item) => item.channel === selectedChannel);
  const selectedRelease = channelReleases.find((item) => item.tag === selectedTag) || channelReleases[0] || null;

  useEffect(() => {
    if (!channelReleases.some((item) => item.tag === selectedTag)) {
      setSelectedTag(channelReleases[0]?.tag || "");
    }
  }, [selectedChannel, releases]);

  const installSelected = async () => {
    if (!plugin || !selectedRelease) return;
    const backend = deckyBackend();
    if (!backend?.call) {
      toaster.toast({ title: "SLSDeck update", body: "Decky installer is unavailable in this window." });
      return;
    }
    const sameChannel = selectedRelease.channel === plugin.currentChannel;
    const versionOrder = semverCompare(selectedRelease.version, plugin.currentVersion);
    const installType = !sameChannel || selectedRelease.rolling
      ? PluginInstallType.REINSTALL
      : versionOrder > 0
        ? PluginInstallType.UPDATE
        : versionOrder < 0
          ? PluginInstallType.DOWNGRADE : PluginInstallType.REINSTALL;
    setPluginBusy(true);
    setPluginMsg("Preparing Decky installer…");
    try {
      const armed = await pluginPrepareReplacement(selectedRelease.version, selectedRelease.assetUrl);
      if (!armed.success) throw new Error(armed.error || "Could not arm safe replacement");
      await backend.call(
        "utilities/install_plugin",
        selectedRelease.assetUrl,
        "SLSDeckUniversal",
        selectedRelease.version,
        "",
        installType,
      );
      setPluginMsg("Confirm the installation in Decky Loader.");
      // Decky's call registers the request and returns before the user confirms.
      // Keep the button usable if confirmation is cancelled; the backend marker
      // also expires automatically and is cleared by the next successful build.
      window.setTimeout(() => {
        if (!pluginDownloadStarted.current) setPluginBusy(false);
      }, 5000);
    } catch (error) {
      setPluginBusy(false);
      setPluginMsg(`Install failed: ${error}`);
    }
  };

  const updateAll = async () => {
    setBusy(true); setMsg("Updating tools…");
    try {
      // includeHeavy=true so the opted-in SLSsteam engine actually reinstalls to
      // the latest (Proton/HV are flag-only and just no-op here). Fully restart
      // Steam afterwards to load a new engine.
      const r = await updatesUpdateAll(true);
      const done = (r.updated || []).join(", ");
      const failed = (r.failed || []).join(", ");
      const skipped = (r.skipped || []).join(", ");
      setMsg([done && `Updated: ${done}`, skipped && `Manual: ${skipped}`, failed && `Failed: ${failed}`]
        .filter(Boolean).join(" · ") || "Up to date.");
    } catch (e) { setMsg(`Error: ${e}`); }
    await load();
    setBusy(false);
  };

  return (
    <>
    <PanelSection title="SLSDeck plugin updates">
      <PanelSectionRow>
        <div style={{ fontSize: 12, lineHeight: 1.5, width: "100%" }}>
          <div>Installed: <b>{plugin?.currentVersion || "checking…"}</b></div>
          <div>Channel: <b>{plugin?.currentChannel || "unknown"}</b></div>
          <div style={{ opacity: 0.72 }}>
            {plugin?.updateAvailable
              ? `Update available: ${plugin.latest?.version}`
              : plugin?.success ? "This update channel is current." : (plugin?.error || "Checking GitHub releases…")}
          </div>
        </div>
      </PanelSectionRow>
      {channels.length > 0 && <PanelSectionRow>
        <DropdownItem
          label="Release channel"
          description="Switch to a prebuilt rolling release from another branch. Branches without this updater may require manually reinstalling update-system to return."
          rgOptions={channels.map((channel) => ({ data: channel, label: channel }))}
          selectedOption={selectedChannel}
          strDefaultLabel={selectedChannel || "Choose a channel"}
          onChange={(option: any) => setSelectedChannel(String(option.data || ""))}
          disabled={pluginBusy}
        />
      </PanelSectionRow>}
      {releases.length > 0 && <PanelSectionRow>
        <DropdownItem
          label="Install version"
          description={selectedChannel === "update-system"
            ? "Choose rolling latest or an immutable historical build. Managed dependencies and user data are preserved."
            : "This channel currently publishes only its prebuilt rolling latest release."}
          rgOptions={channelReleases.map((item) => ({ data: item.tag, label: item.version }))}
          selectedOption={selectedRelease?.tag || ""}
          strDefaultLabel={selectedRelease?.version || "Choose a build"}
          onChange={(option: any) => setSelectedTag(String(option.data || ""))}
          disabled={pluginBusy}
        />
      </PanelSectionRow>}
      {!!selectedRelease?.changelog && <PanelSectionRow>
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>What's new in {selectedRelease.version}</div>
          <ScrollableResult text={selectedRelease.changelog} maxHeight={130} copy={false} />
        </div>
      </PanelSectionRow>}
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={installSelected} disabled={pluginBusy || !selectedRelease}>
          {selectedRelease
            ? selectedRelease.channel !== plugin?.currentChannel ? `Switch to ${selectedRelease.version}`
              : semverCompare(selectedRelease.version, plugin?.currentVersion || "0.0.0") < 0 ? `Downgrade to ${selectedRelease.version}`
                : semverCompare(selectedRelease.version, plugin?.currentVersion || "0.0.0") === 0 ? `Reinstall ${selectedRelease.version}`
                  : `Update to ${selectedRelease.version}`
            : "No installable builds found"}
        </ButtonItem>
      </PanelSectionRow>
      {pluginBusy && <PanelSectionRow>
        <ProgressBarWithInfo layout="inline" bottomSeparator="none" nProgress={pluginProgress} sOperationText={pluginMsg || "Working…"} />
      </PanelSectionRow>}
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={load} disabled={pluginBusy || busy}>Check plugin and dependencies</ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Update banners in Quick Access"
          description="Show the green banner at the top of SLSDeck when a newer build is available for the installed channel. On by default."
          checked={updateBanners}
          onChange={(enabled) => {
            setUpdateBanners(enabled);
            setUiSetting("pluginUpdateBanners", enabled).then(() => {
              window.dispatchEvent(new CustomEvent(UPDATE_BANNERS_EVENT, { detail: enabled }));
            }).catch(() => setUpdateBanners(!enabled));
          }}
        />
      </PanelSectionRow>
      {pluginMsg && !pluginBusy && <PanelSectionRow><ScrollableResult text={pluginMsg} /></PanelSectionRow>}
    </PanelSection>

    <PanelSection title="Dependency updates">
      <PanelSectionRow>
        <ToggleField
          label="Auto-update tools on boot"
          description="Keeps SmokeAPI, CreamAPI and the Uplay unlockers on the latest release. Proton & the HV module are only flagged."
          checked={autoUp}
          onChange={(v) => { setAutoUp(v); setAutoUpdate(v).catch(() => {}); }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Check engine (slsteam-moon) updates"
          description="Adds the engine to this list so it's version-checked (swwayps/slsteam-moon). Update by reinstalling from Dependencies. Off by default — engine updates are risky."
          checked={engineUp}
          onChange={(v) => { setEngineUp(v); setCheckEngineUpdates(v).then(load).catch(() => {}); }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Check headcrab (client fix) updates"
          description="Adds headcrab to this list. It's a rolling script (no versions), so 'update' = re-run the Steam client fix in Dependencies. Off by default."
          checked={headcrabUp}
          onChange={(v) => { setHeadcrabUp(v); setCheckHeadcrabUpdates(v).then(load).catch(() => {}); }}
        />
      </PanelSectionRow>
      {updatable.length > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={updateAll} disabled={busy}>
            Update {updatable.length} tool(s) now
          </ButtonItem>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={load} disabled={busy}>
          Check dependencies
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.7, padding: "2px 2px", lineHeight: 1.5 }}>
          {ups.length === 0
            ? "Checking…"
            : ups.map((u) => `${u.name}: ${u.updateAvailable ? `update → ${u.latest}` : (u.current || "ok")}`).join("  ·  ")}
        </div>
      </PanelSectionRow>
      {msg && (
        <PanelSectionRow>
          <ScrollableResult text={msg} copy={msg.length > 120} />
        </PanelSectionRow>
      )}
    </PanelSection>
    </>
  );
}
