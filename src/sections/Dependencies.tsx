import { PanelSection, PanelSectionRow, ButtonItem, Spinner } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@decky/api";
import { ScrollableResult } from "../components/ScrollableResult";
import { rebindExistingCloudRedirectShortcut } from "../lib/cloudRedirectShortcut";
import {
  SlsStatus,
  SlsInstallState,
  getSlssteamStatus,
  installSlssteam,
  getSlssteamInstallStatus,
  runClientFix,
  reloadSteam,
  activateInjection,
  deactivateInjection,
  getDiagnostics,
  refreshPatterns,
  crEnsureInstalled,
  systemStatus,
  disableForeignEngines,
  tokeerEnsureRuntime,
  tokeerRuntimeStatus,
  tokeerProtonStatus,
  tokeerEnsureProton,
  tokeerUbisoftPackagesStatus,
  tokeerEnsureUbisoftPackages,
  crInstallStatus,
} from "../api";

type Health = "ok" | "warn" | "off" | "unknown";

function Dot({ health }: { health: Health }) {
  const color =
    health === "ok" ? "#58c578" : health === "warn" ? "#f5a623" : health === "off" ? "#c85c5c" : "#8b929a";
  return (
    <span
      style={{
        display: "inline-block", width: 9, height: 9, borderRadius: 9,
        marginRight: 8, flex: "0 0 auto", background: color,
      }}
    />
  );
}

function DepRow({
  label, hint, health, statusText, busy = false, actionLabel, onAction,
}: {
  label: string; hint?: string; health: Health; statusText: string;
  busy?: boolean; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div style={{ padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dot health={busy ? "unknown" : health} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            {busy ? (<><Spinner style={{ width: 11, height: 11, marginRight: 6 }} />working…</>) : statusText}
          </div>
        </div>
      </div>
      {hint && <div style={{ fontSize: 10.5, opacity: 0.55, margin: "2px 0 4px 17px" }}>{hint}</div>}
      {actionLabel && onAction && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={onAction} disabled={busy}>{actionLabel}</ButtonItem>
        </PanelSectionRow>
      )}
    </div>
  );
}

/**
 * Setup & Dependencies. First run installs SLSsteam; afterwards each component
 * shows its own health and can be reinstalled individually.
 */
export function DependenciesSection() {
  const [sls, setSls] = useState<SlsStatus | null>(null);
  const [sysSt, setSysSt] = useState<{ foreignEngine: boolean; foreignName: string; engine: string } | null>(null);
  const [tokeerInstalled, setTokeerInstalled] = useState(false);
  const [protonStatus, setProtonStatus] = useState<{ installed: boolean; partial?: boolean } | null>(null);
  const [ubisoftPackages, setUbisoftPackages] = useState<{ installed: boolean; healthy?: boolean; version?: string } | null>(null);
  const [cloudStatus, setCloudStatus] = useState<{ installed: boolean; partial?: boolean; appInstalled?: boolean; moonHookInstalled?: boolean } | null>(null);
  const [diag, setDiag] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preRestartInstall = useRef(false);

  const setB = (id: string, v: boolean) => setBusy((b) => ({ ...b, [id]: v }));
  const setN = (id: string, v: string) => setNote((n) => ({ ...n, [id]: v }));

  const refresh = async () => {
    try { setSls(await getSlssteamStatus()); } catch { /* */ }
    try {
      const runtime = await tokeerRuntimeStatus();
      setTokeerInstalled(!!runtime.installed);
      if (runtime.installed) setN("tokeer", "runtime installed");
    } catch { /* */ }
    try {
      const proton = await tokeerProtonStatus();
      setProtonStatus(proton);
      if (proton.installed) setN("tokeerProton", "GE-Proton10-34 installed");
      else if (proton.partial) setN("tokeerProton", "partial installation detected — repair required");
    } catch { /* */ }
    try {
      const packages = await tokeerUbisoftPackagesStatus();
      setUbisoftPackages(packages);
      if (packages.installed) setN("ubisoftPackages", "hosted packages installed");
    } catch { /* */ }
    try {
      const cloud = await crInstallStatus();
      setCloudStatus(cloud);
      if (cloud.installed) setN("cr", "installed · Moon hook verified");
      else if (cloud.partial) setN("cr", "partial installation detected — repair required");
    } catch { /* */ }
    try { const s = await systemStatus(); if (s.success) setSysSt(s); } catch { /* */ }
  };

  const disableForeign = async () => {
    setB("foreign", true); setN("foreign", "Disabling other engine…");
    try {
      const d = await disableForeignEngines();
      setN("foreign", d.success ? `Disabled ${(d.disabled || []).join(", ") || "engine"}. Reload Steam.` : "Nothing to disable.");
      if (d.success && (d.disabled || []).length) { toaster.toast({ title: "SLSDeck", body: "Other engine disabled" }); setTimeout(() => reloadSteam().catch(() => {}), 1500); }
    } catch (e) { setN("foreign", `Error: ${e}`); }
    setB("foreign", false); refresh();
  };

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    window.addEventListener("slsdeck-dependencies-changed", onChanged);
    // Installers run outside this page after plugin updates. Poll lightweight
    // read-only health so colors change without reopening Dependencies.
    const healthPoll = setInterval(refresh, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(healthPoll);
      window.removeEventListener("slsdeck-dependencies-changed", onChanged);
    };
  }, []);

  // The post-restart GE-Proton + CloudRedirect jobs are started by the
  // plugin root, so they run even when this Dependencies page is never opened.


  const watch = (id: string, doneMsg: string, restart: boolean) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await getSlssteamInstallStatus();
        const state: SlsInstallState = st.state || {};
        const s = state.status;
        setN(id, s === "running"
          ? `installing${state.stage ? `: ${state.stage.replace(/-/g, " ")}` : ""}… ${state.percent ? state.percent + "%" : ""}`
          : (s || ""));
        if (s === "done" || s === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (s === "done") {
            setN(id, "done");
            toaster.toast({ title: "SLSDeck", body: doneMsg });
            if (restart && state.installed) {
              preRestartInstall.current = true;
              try { window.localStorage.setItem("slsdeck.heavyDepsAfterRestart", String(Date.now())); } catch { /* */ }
              setB("tokeer", true);
              // Tokeer's shared runtime is small and belongs in the normal
              // dependency order before the SLSsteam restart. GE-Proton and
              // CloudRedirect are intentionally deferred until Steam returns.
              setN("tokeer", "installing/updating Tokeer runtime before restart…");
              try {
                const runtime = await tokeerEnsureRuntime();
                setTokeerInstalled(!!runtime.success);
                setN("tokeer", runtime.success ? `runtime ready (${runtime.version || "latest"})` : `runtime failed: ${runtime.error || "unknown error"}`);
              } catch (e) {
                setN("tokeer", `runtime failed: ${e}`);
              }
              setB("tokeer", false);
              setTimeout(() => reloadSteam(), 1200);
            }
          } else {
            setN(id, state.error || "failed");
            toaster.toast({ title: "SLSDeck", body: state.error || "Failed" });
          }
          setB(id, false);
          refresh();
        }
      } catch { /* keep polling */ }
    }, 1500);
  };

  const installSls = async () => {
    setB("sls", true); setN("sls", "starting…");
    try {
      const r = await installSlssteam();
      if (!r.success) {
        const msg = r.missingDeps?.length ? `Missing: ${r.missingDeps.join(", ")}` : r.error || "Could not start";
        setN("sls", msg); setB("sls", false);
        toaster.toast({ title: "SLSDeck", body: msg });
        return;
      }
      toaster.toast({ title: "SLSDeck", body: "Installing… (a few minutes)" });
      watch("sls", "SLSsteam installed — restarting Steam…", true);
    } catch (e) { setN("sls", `error: ${e}`); setB("sls", false); }
  };

  const runFix = async () => {
    setB("fix", true); setN("fix", "starting…");
    try {
      // Manual button = always FORCE the full headcrab downgrade, bypassing the
      // "already fine?" skip gate (which can wrongly skip and make the button
      // look like it does nothing). The cheap auto-skip stays on the boot path.
      const r = await runClientFix(true);
      if (!r.success) { setN("fix", r.error || "failed"); setB("fix", false); return; }
      watch("fix", "Client fix done — reboot the Deck", false);
    } catch (e) { setN("fix", `error: ${e}`); setB("fix", false); }
  };

  const installTokeerRuntime = async () => {
    setB("tokeer", true);
    setN("tokeer", tokeerInstalled ? "checking/updating Tokeer runtime…" : "installing Tokeer runtime…");
    try {
      const r = await tokeerEnsureRuntime();
      setTokeerInstalled(!!r.success);
      setN("tokeer", r.success ? `runtime ready (${r.version || "latest"})` : `failed: ${r.error || "unknown error"}`);
      toaster.toast({ title: "SLSDeck", body: r.success ? "Tokeer runtime ready" : "Tokeer runtime installation failed" });
    } catch (e) {
      setN("tokeer", `error: ${e}`);
    }
    setB("tokeer", false);
    refresh();
  };

  const installProton = async () => {
    setB("tokeerProton", true);
    setN("tokeerProton", protonStatus?.installed ? "reinstalling GE-Proton10-34…" : "installing GE-Proton10-34…");
    try {
      const r = await tokeerEnsureProton(true);
      setN("tokeerProton", r.success ? "GE-Proton10-34 installed" : `failed: ${r.error || "unknown error"}`);
      toaster.toast({ title: "SLSDeck", body: r.success ? "GE-Proton10-34 ready" : "GE-Proton installation failed" });
    } catch (e) {
      setN("tokeerProton", `error: ${e}`);
    }
    setB("tokeerProton", false);
    refresh();
  };

  const installUbisoftPackages = async () => {
    setB("ubisoftPackages", true);
    setN("ubisoftPackages", ubisoftPackages?.installed ? "updating hosted packages…" : "installing hosted packages…");
    try {
      const r = await tokeerEnsureUbisoftPackages(true);
      setN("ubisoftPackages", r.success ? "hosted packages installed" : `failed: ${r.error || "unknown error"}`);
      toaster.toast({ title: "SLSDeck", body: r.success ? "Ubisoft packages ready" : "Ubisoft package installation failed" });
    } catch (e) {
      setN("ubisoftPackages", `error: ${e}`);
    }
    setB("ubisoftPackages", false);
    refresh();
  };

  const installCloud = async () => {
    setB("cr", true); setN("cr", "replacing CloudRedirect…");
    try {
      const r = await crEnsureInstalled();
      if (r.installed) {
        const rebound = await rebindExistingCloudRedirectShortcut();
        setN("cr", rebound ? "installed · shortcut rebound" : "installed");
      } else {
        setN("cr", "failed — " + (r.log || "check network"));
      }
      toaster.toast({ title: "SLSDeck", body: r.installed ? "CloudRedirect replaced" : "CloudRedirect install failed" });
    } catch (e) { setN("cr", `error: ${e}`); }
    setB("cr", false);
  };

  const doActivate = async () => {
    try { const r = await activateInjection(); toaster.toast({ title: "SLSDeck", body: r.success ? "Injection on — reload Steam" : r.error || "Failed" }); refresh();  if (r.success) setTimeout(() => reloadSteam(), 1500); }
    catch (e) { toaster.toast({ title: "SLSDeck", body: `Error: ${e}` }); }
  };
  const doDeactivate = async () => {
    try { const r = await deactivateInjection(); toaster.toast({ title: "SLSDeck", body: r.success ? "Injection off — reload Steam" : r.error || "Failed" }); refresh();  if (r.success) setTimeout(() => reloadSteam(), 1500); }
    catch (e) { toaster.toast({ title: "SLSDeck", body: `Error: ${e}` }); }
  };
  const runRefreshPatterns = async () => {
    setDiag("Refreshing engine patterns against the current Steam client…");
    try {
      const r = await refreshPatterns();
      const lines = [
        `pattern-refresh: ${r.present ? "installed" : "NOT INSTALLED"}`,
        r.present ? `helper:          ${r.helperPath}` : "",
        `client build:    ${r.clientVersion}`,
        `supported build: ${r.supportedClient}${r.clientMatches === false ? "  ← MISMATCH (downgrade didn't hold)" : r.clientMatches === true ? "  (match)" : ""}`,
        r.returncode !== undefined ? `exit code:       ${r.returncode}` : "",
        ``,
        r.message || "",
        ...(r.output && r.output.length ? ["", "— pattern-refresh output —", ...r.output] : []),
      ].filter((x) => x !== "");
      setDiag(lines.join("\n"));
      toaster.toast({ title: "SLSDeck", body: r.success ? "Patterns refreshed — restart Steam" : (r.present ? "Refresh ran with issues — see details" : "pattern-refresh not installed") });
    } catch (e) { setDiag(`Error: ${e}`); }
  };
  const runDiag = async () => {
    try {
      const d: any = await getDiagnostics();
      const live = d.injectionLive === true ? "yes (live this session)"
        : d.injectionLive === false ? "no (not loaded this boot)" : "unknown";
      const osName = d.osRelease?.PRETTY_NAME || d.steamOSChannel || "unknown";
      setDiag([
        `Engine:         ${d.engine || "?"}${d.engineMoon ? "" : "  (no version-pin / depot-key support)"}`,
        `Injection live: ${live}`,
        `Pinning:        ${d.pinSupported ? "supported (moon)" : "unsupported (stock SLSsteam)"}`,
        `Achievements:   see Options — live only on moon`,
        ``,
        `SLSsteam.so:    ${d.hasSLSsteamSo ? "installed" : "MISSING"}`,
        `steam.sh wrap:  ${d.steamShWrapped ? "yes" : "no"}`,
        `gamescope hook: ${d.gamescopeHookActive ? "active" : "inactive"}`,
        `flatpak Steam:  ${d.flatpak ? "yes" : "no"}`,
        `Steam root:     ${d.steamRoot || "?"}`,
        `OS:             ${osName}`,
        `user / root:    ${d.user || "?"}${d.runningAsRoot ? " (running as root)" : ""}`,
        `AdditionalApps: ${(d.additionalApps || []).length} added${(d.additionalApps || []).length ? ` — ${(d.additionalApps || []).join(", ")}` : ""}`,
        `SLSsteam.log:   ${d.slssteamLogExists ? `yes (${d.slssteamLogAgeSec}s ago, ${d.slssteamLogModified || "?"})` : "MISSING — not loaded"}`,
        `h3adcr-b log:   ${d.headcrabRunLogExists ? "present" : "none"}`,
        ``,
        `— recent SLSsteam.log —`,
        ...((d.slssteamLogTail || []).map((l: string) => `  | ${l}`)),
      ].join("\n"));
    } catch (e) { setDiag(`error: ${e}`); }
  };

  const setupDone = !!sls?.installed && !!sls?.injected;
  const slsHealth: Health = sls?.installed ? (sls.injected ? "ok" : "warn") : "off";
  const slsBusy = !!busy.sls;

  return (
    <PanelSection title="Setup">
      {sysSt?.foreignEngine && (
        <PanelSectionRow>
          <div style={{ margin: "2px 0 6px", padding: "8px 10px", borderRadius: 6, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f5a623" }}>Another engine detected</div>
            <div style={{ fontSize: 11, opacity: 0.8, margin: "2px 0 6px" }}>
              {sysSt.foreignName || "A different engine"} is present alongside slsteam-moon and can fight over injection.
              Disable it (reversibly) so SLSDeck's engine runs cleanly.
            </div>
            <ButtonItem layout="below" disabled={!!busy.foreign} onClick={disableForeign}>
              {busy.foreign ? "Disabling…" : `Disable ${sysSt.foreignName || "other engine"}`}
            </ButtonItem>
            {note.foreign ? <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{note.foreign}</div> : null}
          </div>
        </PanelSectionRow>
      )}
      {!setupDone && !slsBusy && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={installSls}>Install SLSsteam</ButtonItem>
        </PanelSectionRow>
      )}
      {slsBusy && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            <Spinner style={{ width: 13, height: 13, marginRight: 8 }} />
            {note.sls || "installing…"}
          </div>
        </PanelSectionRow>
      )}

      <>
        <DepRow
          label="SLSsteam"
          hint="Core steamclient hook that adds games to your library."
          health={slsHealth}
          statusText={sls?.installed ? (sls.injected ? "installed · injected" : "installed · not injected") : "not installed"}
          busy={slsBusy}
          actionLabel={sls?.installed ? "Reinstall SLSsteam" : "Install SLSsteam"}
          onAction={installSls}
        />
        <DepRow
          label="Steam client fix"
          hint="Pins the Steam client to a version SLSsteam supports (h3adcr-b)."
          health={busy.fix ? "unknown" : sls?.clientFixRan ? "ok" : "warn"}
          statusText={note.fix || (sls?.clientFixRan ? "applied" : "not run yet — run if games don't appear")}
          busy={!!busy.fix}
          actionLabel="Run client fix"
          onAction={runFix}
        />
        <DepRow
          label="Tokeer runtime"
          hint="Small shared verifier/hook runtime; updated before the normal SLSsteam restart."
          health={tokeerInstalled ? "ok" : "off"}
          statusText={note.tokeer || (tokeerInstalled ? "runtime installed" : "not installed yet")}
          busy={!!busy.tokeer}
          actionLabel={tokeerInstalled ? "Check / reinstall Tokeer runtime" : "Install Tokeer runtime"}
          onAction={installTokeerRuntime}
        />
        <DepRow
          label="GE-Proton10-34"
          hint="Exact compatibility layer required by Tokeer; installed after restart in the background."
          health={protonStatus?.installed ? "ok" : protonStatus?.partial ? "warn" : "off"}
          statusText={note.tokeerProton || (protonStatus?.installed ? "installed · verified" : protonStatus?.partial ? "partial installation · repair required" : "not installed")}
          busy={!!busy.tokeerProton}
          actionLabel={protonStatus?.installed ? "Reinstall GE-Proton10-34" : protonStatus?.partial ? "Repair GE-Proton10-34" : "Install GE-Proton10-34"}
          onAction={installProton}
        />
        <DepRow
          label="Ubisoft packages"
          hint="AppID-keyed care packages for the hosted Ubisoft activation list."
          health={ubisoftPackages?.installed && ubisoftPackages.healthy !== false ? "ok" : "off"}
          statusText={note.ubisoftPackages || (ubisoftPackages?.installed ? "hosted packages installed" : "not installed")}
          busy={!!busy.ubisoftPackages}
          actionLabel={ubisoftPackages?.installed ? "Check / reinstall Ubisoft packages" : "Install Ubisoft packages"}
          onAction={installUbisoftPackages}
        />
        <DepRow
          label="CloudRedirect"
          hint="Cloud saves for added games — installs automatically after setup. Off by default; enable in Advanced ▸ Cloud saves."
          health={busy.cr ? "unknown" : cloudStatus?.installed ? "ok" : cloudStatus?.partial ? "warn" : "off"}
          statusText={note.cr || (cloudStatus?.installed ? "installed · Moon hook verified" : cloudStatus?.partial ? "partial installation · repair required" : "not installed")}
          busy={!!busy.cr}
          actionLabel={cloudStatus?.installed ? "Reinstall CloudRedirect" : cloudStatus?.partial ? "Repair CloudRedirect" : "Install CloudRedirect"}
          onAction={installCloud}
        />

        <div style={{ padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, margin: "2px 0 4px" }}>
            Injection &amp; diagnostics
          </div>
          {sls?.installed && (
            <>
              <div style={{ fontSize: 11, opacity: 0.7, margin: "0 0 4px 2px" }}>
                Injection is {sls.injectionActive ? "active" : "inactive"}.
              </div>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={sls.injectionActive ? doDeactivate : doActivate}>
                  {sls.injectionActive ? "Deactivate injection" : "Activate injection"}
                </ButtonItem>
              </PanelSectionRow>
            </>
          )}
          <PanelSectionRow><ButtonItem layout="below" onClick={runDiag}>Run diagnostics</ButtonItem></PanelSectionRow>
          <PanelSectionRow><ButtonItem layout="below" onClick={runRefreshPatterns}>Refresh engine patterns (fix “can’t match patterns”)</ButtonItem></PanelSectionRow>
          {diag && (
            <PanelSectionRow>
              <ScrollableResult text={diag} maxHeight={300} mono fontSize={10} />
            </PanelSectionRow>
          )}
        </div>
      </>
    </PanelSection>
  );
}
