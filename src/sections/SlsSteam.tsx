import { PanelSection, PanelSectionRow, ButtonItem, Spinner } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { ScrollableResult } from "../components/ScrollableResult";
import { toaster } from "@decky/api";
import {
  SlsInstallState,
  SlsStatus,
  getSlssteamStatus,
  installSlssteam,
  getSlssteamInstallStatus,
  activateInjection,
  deactivateInjection,
  getDiagnostics,
  runClientFix,
  reloadSteam,
} from "../api";

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        marginRight: 6,
        borderRadius: 10,
        fontSize: 11,
        background: ok ? "rgba(88,197,120,0.18)" : "rgba(245,166,35,0.18)",
        color: ok ? "#58c578" : "#f5a623",
      }}
    >
      {ok ? "✓ " : "• "}
      {label}
    </span>
  );
}

export function SlsSteamSection() {
  const [status, setStatus] = useState<SlsStatus | null>(null);
  const [inst, setInst] = useState<SlsInstallState | null>(null);
  const [busy, setBusy] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [diag, setDiag] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    try {
      setStatus(await getSlssteamStatus());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const watchInstall = (doneMsg: string, restart: boolean) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const st = await getSlssteamInstallStatus();
        setInst(st.state || null);
        const s = st.state?.status;
        if (s === "done" || s === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setBusy(false);
          refresh();
          if (s === "done") {
            toaster.toast({ title: "SLSsteam", body: doneMsg });
            if (restart && st.state?.installed) setTimeout(() => reloadSteam(), 3500);
          } else {
            toaster.toast({ title: "SLSsteam", body: st.state?.error || "Failed" });
          }
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
  };

  const startInstall = async () => {
    setBusy(true);
    setInst({ status: "queued" });
    try {
      const res = await installSlssteam();
      if (!res.success) {
        toaster.toast({
          title: "SLSsteam",
          body: res.missingDeps?.length
            ? `Cannot unpack: ${res.missingDeps.join(", ")}`
            : res.error || "Could not start install",
        });
        setBusy(false);
        return;
      }
      toaster.toast({ title: "SLSsteam", body: "Installing… (a few min)" });
      watchInstall("Install complete — restarting Steam…", true);
    } catch (e) {
      setBusy(false);
      toaster.toast({ title: "SLSsteam", body: `Error: ${e}` });
    }
  };

  const doActivate = async () => {
    try {
      const r = await activateInjection();
      toaster.toast({ title: "SLSsteam", body: r.success ? "Injection activated — reload Steam" : r.error || "Failed" });
      refresh();
    } catch (e) {
      toaster.toast({ title: "SLSsteam", body: `Error: ${e}` });
    }
  };

  const doDeactivate = async () => {
    try {
      const r = await deactivateInjection();
      toaster.toast({ title: "SLSsteam", body: r.success ? "Injection removed — reload Steam" : r.error || "Failed" });
      refresh();
    } catch (e) {
      toaster.toast({ title: "SLSsteam", body: `Error: ${e}` });
    }
  };

  const doClientFix = async () => {
    setBusy(true);
    setInst({ status: "queued" });
    try {
      // Manual client-fix action → force the full downgrade (bypass the skip gate).
      const res = await runClientFix(true);
      if (!res.success) {
        toaster.toast({ title: "SLSsteam", body: res.error || "Could not start" });
        setBusy(false);
        return;
      }
      toaster.toast({ title: "SLSsteam", body: "Running client fix…" });
      watchInstall("Client fix done — reboot the Deck", false);
    } catch (e) {
      setBusy(false);
      toaster.toast({ title: "SLSsteam", body: `Error: ${e}` });
    }
  };

  const runDiag = async () => {
    try {
      const d: any = await getDiagnostics();
      const lines = [
        `installed:      ${d.hasSLSsteamSo}`,
        `steam.sh:       ${d.steamShPath}`,
        `wrapped:        ${d.steamShWrapped}`,
        `AdditionalApps: ${(d.additionalApps || []).join(", ") || "(none)"}`,
        `SLSsteam.log:   ${d.slssteamLogExists ? `yes (${d.slssteamLogAgeSec}s ago)` : "MISSING - not loaded"}`,
        ...((d.slssteamLogTail || []).map((l: string) => `  | ${l}`)),
        `headcrab ran:   ${d.headcrabRunLogExists}`,
      ];
      setDiag(lines.join("\n"));
    } catch (e) {
      setDiag(`error: ${e}`);
    }
  };

  const installing = busy || inst?.status === "running" || inst?.status === "queued";

  return (
    <PanelSection title="SLSsteam">
      <PanelSectionRow>
        <div style={{ padding: "2px 0" }}>
          <Chip ok={!!status?.installed} label="Installed" />
          <Chip ok={!!status?.injectionActive} label="Injected" />
          {status?.flatpak && <Chip ok label="Flatpak" />}
        </div>
      </PanelSectionRow>

      {installing && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.85, padding: "2px 0" }}>
            <Spinner style={{ width: 14, height: 14, marginRight: 8 }} />
            {inst?.status === "queued" ? "Starting…" : (inst?.stage ? `Installing: ${inst.stage.replace(/-/g, " ")}…` : "Installing…")}
            {typeof inst?.percent === "number" && inst.percent > 0 ? ` ${inst.percent}%` : ""}
          </div>
        </PanelSectionRow>
      )}

      {!installing && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={startInstall}>
            {status?.installed ? "Reinstall SLSsteam" : "Install SLSsteam"}
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => setAdvanced((v) => !v)}>
          {advanced ? "Hide advanced" : "Advanced"}
        </ButtonItem>
      </PanelSectionRow>

      {advanced && (
        <div>
          {status?.installed && !status.injectionActive && (
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={doActivate}>
                Activate injection
              </ButtonItem>
            </PanelSectionRow>
          )}
          {status?.injectionActive && (
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={doDeactivate}>
                Deactivate injection
              </ButtonItem>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={doClientFix} disabled={installing}>
              Fix client compatibility (h3adcr-b)
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={runDiag}>
              Run diagnostics
            </ButtonItem>
          </PanelSectionRow>
          {diag && (
            <PanelSectionRow>
              <ScrollableResult text={diag} maxHeight={260} mono fontSize={10} />
            </PanelSectionRow>
          )}
        </div>
      )}
    </PanelSection>
  );
}
