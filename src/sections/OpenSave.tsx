import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  Navigation,
} from "@decky/ui";
import { toaster, openFilePicker, FileSelectionType } from "@decky/api";
import { useEffect, useState } from "react";
import {
  osStatus,
  osEnsureCli,
  osEnsureDaemon,
  osScan,
  osSyncAll,
  osExportAll,
  osCloudAuthStart,
  osCloudAuthCallback,
  osCloudDisconnect,
  osCloudWebdav,
  osCloudPushAll,
  osRelayJoin,
  osDiagnostics,
} from "../api";
import { ScrollableResult } from "../components/ScrollableResult";

interface Status {
  installed: boolean;
  version?: string;
  latestTag?: string;
  updateAvailable?: boolean;
  daemonRunning?: boolean;
  provider?: string;
  providerConnected?: boolean;
  providerEmail?: string;
  trackedGames?: number;
  conflicts?: number;
}

/**
 * OpenSave — cloud saves for added ("SLS") games. Headless CLI + daemon watch
 * each game's Proton prefix and sync it, driven over the daemon HTTP API.
 * Google Drive / Dropbox connect natively (built-in client IDs); WebDAV needs
 * no login. OneDrive (needs your own Azure client ID) and the snapshot browser
 * live in the OpenSave desktop app — install it from Dependencies.
 */
export function OpenSaveSection() {
  const [st, setSt] = useState<Status>({ installed: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [room, setRoom] = useState("");
  const [webdavUrl, setWebdavUrl] = useState("");
  const [webdavUser, setWebdavUser] = useState("");
  const [webdavPass, setWebdavPass] = useState("");
  const [showWebdav, setShowWebdav] = useState(false);
  const [authCode, setAuthCode] = useState("");

  const load = async () => {
    try { setSt(await osStatus() as Status); } catch { /* */ }
  };
  useEffect(() => { load(); }, []);

  const wrap = async (label: string, fn: () => Promise<any>) => {
    setBusy(true); setMsg(label);
    let out = "Done.";
    try {
      const r = await fn();
      if (r && r.success === false) out = (r.error || r.log || "Failed").toString();
      else if (r && typeof r.note === "string") out = r.note;
    } catch (e) { out = `Error: ${e}`; }
    setMsg(out);
    try { toaster.toast({ title: "OpenSave", body: out.slice(0, 600), duration: 12000 }); } catch { /* */ }
    await load();
    setBusy(false);
  };

  const installEngine = () => wrap("Installing / updating OpenSave engine…", async () => {
    const r = await osEnsureCli(true);
    if (r.success) await osEnsureDaemon();
    return r;
  });
  const startEngine = () => wrap("Starting engine…", () => osEnsureDaemon());
  const scanTrack = () => wrap("Scanning & tracking saves…", () => osScan());
  const syncNow = () => wrap("Syncing all games…", () => osSyncAll());
  const joinRoom = () => wrap("Joining sync room…", () => osRelayJoin(room));

  // Native OAuth: ask the daemon for the provider's auth URL, open it in the
  // Steam browser (like the Discord/Ryuu flow); the daemon auto-catches the
  // localhost redirect, so we poll status until the account connects.
  const connectProvider = (prov: string, label: string) => wrap(`Connecting ${label}…`, async () => {
    const r = await osCloudAuthStart(prov);
    if (!r.success || !r.authUrl) return { success: false, error: r.error || "couldn't start sign-in" };
    const target = r.provider || prov;
    try { Navigation.NavigateToExternalWeb(r.authUrl); } catch { /* */ }
    for (let i = 0; i < 30; i++) {
      await new Promise((res) => setTimeout(res, 2000));
      try {
        const s = await osStatus() as Status;
        if (s.provider === target && s.provider !== "local") {
          return { success: true, note: `Connected ${label}${s.providerEmail ? ` as ${s.providerEmail}` : ""}.` };
        }
      } catch { /* */ }
    }
    return { success: true, note:
      `Opened ${label} sign-in in the browser. If it connects automatically, done. ` +
      "If the browser instead shows an error page (the Deck browser can't reach " +
      "'localhost'), copy the whole address-bar URL — it contains ?code=… — paste it " +
      "in the \"Finish sign-in\" box below and press the button." };
  });
  // Fallback for the Deck: the daemon's localhost auto-catch fails because the
  // gaming-mode browser can't resolve 'localhost' (ERR_NAME_NOT_RESOLVED / 105).
  // The auth code is still in the redirected URL, so let the user paste it.
  const finishAuth = () => wrap("Finishing sign-in…", async () => {
    let code = authCode.trim();
    const m = code.match(/[?&]code=([^&\s]+)/);
    if (m) { try { code = decodeURIComponent(m[1]); } catch { code = m[1]; } }
    if (!code) return { success: false, error: "Paste the code (or the whole localhost/callback URL) first." };
    const r = await osCloudAuthCallback(code);
    if (!r.success) return { success: false, error: r.error || "Sign-in failed — the code may have expired; try Connect again." };
    setAuthCode("");
    return { success: true, note: `Connected${r.email ? ` as ${r.email}` : ""}.` };
  });
  const connectWebdav = () => wrap("Connecting WebDAV…", async () => {
    const r = await osCloudWebdav(webdavUrl, webdavUser, webdavPass);
    return r.success ? { success: true, note: "WebDAV connected." } : r;
  });
  const disconnectCloud = () => wrap("Disconnecting cloud…", () => osCloudDisconnect());
  const pushCloud = () => wrap("Pushing saves to cloud…", () => osCloudPushAll());
  const chooseBackupFolder = async () => {
    try {
      const res: any = await openFilePicker(FileSelectionType.FOLDER, "/home/deck", false, true);
      const path = res?.realpath || res?.path;
      if (!path) return;
      await wrap("Backing up saves to folder…", () => osExportAll(path));
    } catch (e) { setMsg(`Error: ${e}`); }
  };

  const diag = () => wrap("Collecting diagnostics…", async () => {
    const d = await osDiagnostics();
    return { success: true, note: [
      `bin: ${d.binPath}`,
      `exists: ${d.exists}  executable: ${d.executable}`,
      `user: ${d.user}  daemon: ${d.daemonUrl}`,
      `version rc=${d.versionRc}: ${d.versionOut || "(no output)"}`,
      `daemon rc=${d.daemonRc}: ${d.daemonOut || "(no output)"}`,
    ].join("\n") };
  });

  const engineTag = st.version || "?";
  const updBadge = st.updateAvailable ? ` (update → ${st.latestTag})` : "";

  return (
    <>
      <PanelSection title="Cloud saves (OpenSave)">
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.85, padding: "2px 2px", lineHeight: 1.5 }}>
            {st.installed
              ? <>Engine <b>{engineTag}</b>{updBadge} · daemon {st.daemonRunning ? "running" : "stopped"} · {st.trackedGames ?? 0} tracked
                  {st.conflicts ? ` · ${st.conflicts} conflict(s)` : ""}</>
              : "Engine not installed. Install it to sync saves for added games."}
          </div>
        </PanelSectionRow>

        {!st.installed && (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={installEngine} disabled={busy}>
              Install OpenSave engine
            </ButtonItem>
          </PanelSectionRow>
        )}
        {st.installed && (
          <>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={scanTrack} disabled={busy}>
                Scan &amp; track saves
              </ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={syncNow} disabled={busy}>
                Sync all now
              </ButtonItem>
            </PanelSectionRow>
            {!st.daemonRunning && (
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={startEngine} disabled={busy}>
                  Start background sync
                </ButtonItem>
              </PanelSectionRow>
            )}
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={installEngine} disabled={busy}>
                {st.updateAvailable ? `Update engine → ${st.latestTag}` : "Reinstall engine"}
              </ButtonItem>
            </PanelSectionRow>
          </>
        )}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={diag} disabled={busy}>
            Diagnostics
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {st.installed && (
        <PanelSection title="Back up / sync off-device">
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.7, padding: "2px 2px", lineHeight: 1.5 }}>
              Tracked saves are snapshotted locally automatically (no setup). The options below get a
              copy <b>off</b> this Deck.
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <ButtonItem layout="below" onClick={chooseBackupFolder} disabled={busy}>
              Choose backup folder
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.55, padding: "0 2px" }}>
              Pick a folder (SD card, USB, network share) — exports every tracked game's current save into it.
            </div>
          </PanelSectionRow>

          <PanelSectionRow>
            <TextField label="P2P room code (same on each device)" value={room}
              onChange={(e) => setRoom(e.target.value)} />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={joinRoom} disabled={busy || !room}>
              Join sync room (device-to-device, no login)
            </ButtonItem>
          </PanelSectionRow>

          <PanelSectionRow>
            <div style={{ fontSize: 12, fontWeight: 600, padding: "4px 2px 0" }}>Cloud provider</div>
          </PanelSectionRow>
          {(() => {
            const cloudConnected = !!st.provider && st.provider !== "local" && !!st.providerConnected;
            return (
              <>
                <PanelSectionRow>
                  <div style={{ fontSize: 11, padding: "0 2px", color: cloudConnected ? "#5ee6c4" : undefined, opacity: cloudConnected ? 1 : 0.7 }}>
                    {cloudConnected
                      ? `✓ Connected: ${st.provider}${st.providerEmail ? ` (${st.providerEmail})` : ""}`
                      : "No cloud connected — pick one below:"}
                  </div>
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => connectProvider("googledrive", "Google Drive")} disabled={busy}>
                    {cloudConnected ? "Switch to Google Drive" : "Connect Google Drive"}
                  </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => connectProvider("dropbox", "Dropbox")} disabled={busy}>
                    {cloudConnected ? "Switch to Dropbox" : "Connect Dropbox"}
                  </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                  <div style={{ fontSize: 11, opacity: 0.55, padding: "0 2px" }}>
                    Opens the provider's sign-in in the browser. It usually completes automatically; if the
                    browser shows an error page after you authorize (the Deck can't reach "localhost"), use
                    "Finish sign-in" below. For OneDrive, use your own Azure client ID via the OpenSave CLI.
                  </div>
                </PanelSectionRow>
                <PanelSectionRow>
                  <TextField
                    label="Finish sign-in (paste the code or the localhost/callback URL)"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                </PanelSectionRow>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={finishAuth} disabled={busy || !authCode.trim()}>
                    Finish sign-in
                  </ButtonItem>
                </PanelSectionRow>

                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => setShowWebdav((v) => !v)} disabled={busy}>
                    {showWebdav ? "WebDAV / self-hosted ▾" : "WebDAV / self-hosted ▸"}
                  </ButtonItem>
                </PanelSectionRow>
                {showWebdav && (
                  <>
                    <PanelSectionRow>
                      <TextField label="WebDAV URL" value={webdavUrl} onChange={(e) => setWebdavUrl(e.target.value)} />
                    </PanelSectionRow>
                    <PanelSectionRow>
                      <TextField label="Username" value={webdavUser} onChange={(e) => setWebdavUser(e.target.value)} />
                    </PanelSectionRow>
                    <PanelSectionRow>
                      <TextField label="Password" bIsPassword value={webdavPass} onChange={(e) => setWebdavPass(e.target.value)} />
                    </PanelSectionRow>
                    <PanelSectionRow>
                      <ButtonItem layout="below" onClick={connectWebdav} disabled={busy || !webdavUrl}>
                        Connect WebDAV
                      </ButtonItem>
                    </PanelSectionRow>
                  </>
                )}

                {cloudConnected && (
                  <>
                    <PanelSectionRow>
                      <ButtonItem layout="below" onClick={pushCloud} disabled={busy}>
                        Push all saves to cloud now
                      </ButtonItem>
                    </PanelSectionRow>
                    <PanelSectionRow>
                      <ButtonItem layout="below" onClick={disconnectCloud} disabled={busy}>
                        Disconnect cloud
                      </ButtonItem>
                    </PanelSectionRow>
                  </>
                )}
              </>
            );
          })()}

          <PanelSectionRow>
            <div style={{ fontSize: 11, color: "#f5a623", padding: "2px 2px" }}>
              ⚠ Experimental — it can affect save files.
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      {msg && (
        <PanelSection title="Result / log">
          <PanelSectionRow>
            <ScrollableResult text={msg} />
          </PanelSectionRow>
        </PanelSection>
      )}
    </>
  );
}
