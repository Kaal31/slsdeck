import { PanelSection, PanelSectionRow, ButtonItem, ToggleField } from "@decky/ui";
import { useEffect, useState } from "react";
import { crGetEnabled, crSetEnabled, crOpenApp, crEnsureInstalled, crGetShortcut, crSetShortcut, crArtwork, crIconPath, crProviderStatus } from "../api";

const CR_FLATPAK = "org.cloudredirect.CloudRedirect";

// Launch CloudRedirect inside Game Mode by registering it as a non-Steam
// shortcut and running it through Steam (gamescope has no desktop compositor,
// so `flatpak run` alone can't draw a window). Returns the shortcut appId.

// Apply the bundled CloudRedirect library art to the non-Steam shortcut so it
// looks native in the library. assetType: 0 grid/cover, 1 hero, 3 wide capsule.
async function applyCrArtwork(appId: number): Promise<void> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.SetCustomArtworkForApp) return;
  try {
    const a = await crArtwork();
    if (!a?.success) return;
    const jobs: Array<[string, number]> = [
      [a.cover, 0],
      [a.hero, 1],
      [a.capsule, 3],
      [a.logo, 2],
    ];
    for (const [b64, kind] of jobs) {
      if (b64) {
        try { await SC.Apps.SetCustomArtworkForApp(appId, b64, "png", kind); } catch { /* */ }
      }
    }
    // Shortcut icon is stored by file path, not artwork asset.
    try {
      const ic = await crIconPath();
      if (ic?.success && ic.path && SC?.Apps?.SetShortcutIcon) {
        await SC.Apps.SetShortcutIcon(appId, ic.path);
      }
    } catch { /* */ }
  } catch {
    /* best-effort */
  }
}

async function launchInGameMode(): Promise<string> {
  const SC: any = (window as any).SteamClient;
  if (!SC?.Apps?.RunGame) throw new Error("SteamClient unavailable");

  let appId = 0;
  try {
    const g = await crGetShortcut();
    appId = g?.appId || 0;
  } catch {
    /* ignore */
  }
  // Drop a stale id if the shortcut no longer exists.
  if (appId) {
    const ov = (window as any).appStore?.GetAppOverviewByAppID?.(appId);
    if (!ov) appId = 0;
  }
  if (!appId) {
    // AddShortcut signatures vary across Steam builds; pass name+exe, then set
    // the flatpak launch options separately.
    const created = await SC.Apps.AddShortcut("CloudRedirect", "/usr/bin/flatpak", "", "");
    appId = Number(created);
    if (!appId || Number.isNaN(appId)) throw new Error("AddShortcut returned no appId");
    try { await SC.Apps.SetShortcutLaunchOptions(appId, `run --user ${CR_FLATPAK}`); } catch { /* */ }
    try { await SC.Apps.SetShortcutName(appId, "CloudRedirect"); } catch { /* */ }
    try { await crSetShortcut(appId); } catch { /* */ }
    try { await applyCrArtwork(appId); } catch { /* */ }
  }
  // Non-Steam shortcuts launch by their 64-bit gameID, not the 32-bit appid.
  const gameId = ((BigInt(appId) << 32n) | 0x02000000n).toString();
  SC.Apps.RunGame(gameId, "", -1, 100);
  return String(appId);
}

/**
 * CloudRedirect — real Steam Cloud for added ("lua") games, redirected to a
 * cloud provider or local folder. Installed by the client fix; this surface
 * exposes the DisableCloud toggle and a launcher for the sign-in app.
 */
export function CloudRedirectSection() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [provider, setProvider] = useState<{ configured: boolean; providers: string[] } | null>(null);

  const load = async () => {
    try {
      const r = await crGetEnabled();
      setEnabled(!!r.enabled);
    } catch {
      /* ignore */
    }
    try {
      const p = await crProviderStatus();
      setProvider(p.success ? { configured: !!p.configured, providers: p.providers || [] } : null);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    load();
  }, []);

  const onToggle = async (v: boolean) => {
    setEnabled(v);
    setBusy(true);
    try {
      const r = await crSetEnabled(v);
      if (!r.success) {
        setEnabled(!v);
        setMsg(r.error || "Failed to update config");
      } else {
        setMsg(
          v
            ? "Cloud saves on. Re-run the client fix to fully apply the CR client."
            : "Cloud saves off."
        );
      }
    } catch (e) {
      setEnabled(!v);
      setMsg(`Error: ${e}`);
    }
    setBusy(false);
  };

  const onOpen = async () => {
    setBusy(true);
    setMsg("Checking / installing CloudRedirect… (first run can take a few minutes)");
    try {
      const ins = await crEnsureInstalled();
      if (!ins.installed) {
        setMsg("Install failed:\n" + (ins.log || "check network + flatpak"));
        setBusy(false);
        return;
      }
      setMsg("Launching CloudRedirect in Game Mode…");
      try {
        const appId = await launchInGameMode();
        setMsg(
          `Launched (as a Steam shortcut, id ${appId}). If it didn't appear, open "CloudRedirect" from your Library. ` +
          `Pick a provider — the Local-folder option needs no login and works fully in Game Mode.`
        );
      } catch (e) {
        // Fall back to a direct flatpak launch (works in Desktop Mode).
        const o = await crOpenApp();
        setMsg(
          o.success
            ? "Opened (Desktop Mode). Game-Mode launch unavailable: " + String(e)
            : "Could not launch: " + String(e)
        );
      }
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
    setBusy(false);
  };

  return (
    <PanelSection title="Cloud saves (CloudRedirect)">
      <PanelSectionRow>
        <ToggleField
          label="Cloud saves for added games"
          description="Redirects Steam Cloud for added games to your provider. Switching fully on/off needs a client-fix re-run."
          checked={enabled}
          onChange={onToggle}
          disabled={busy}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={onOpen} disabled={busy}>
          Open CloudRedirect app (sign in)
        </ButtonItem>
      </PanelSectionRow>
      {provider && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, padding: "0 2px", color: provider.configured ? "#5ee6c4" : "#f5a623" }}>
            {provider.configured
              ? `✓ Provider configured: ${provider.providers.join(", ")}`
              : "No provider signed in yet — open the app and sign in."}
          </div>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <div style={{ fontSize: 11, color: "#f5a623", padding: "2px 2px" }}>
          ⚠ Experimental — it can affect save files. Back up saves you care about.
          Open the app once to sign into Google Drive / OneDrive / a local folder.
        </div>
      </PanelSectionRow>
      {msg && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.75, padding: "0 2px" }}>{msg}</div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
