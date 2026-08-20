import { PanelSection, PanelSectionRow, ButtonItem, Spinner } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@decky/api";
import {
  SlsInstallState,
  SlsStatus,
  getSlssteamStatus,
  installSlssteam,
  getSlssteamInstallStatus,
  reloadSteam,
  getShowReinstallQam,
  systemStatus,
  runClientFix,
  crEnsureInstalled,
  disableForeignEngines,
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

/**
 * Compact SLSsteam block for the quick-access panel: status chips + the single
 * install button. Everything else (injection, diagnostics, other dependencies)
 * lives on the Advanced page.
 */
export function SlsSteamCompact() {
  const [status, setStatus] = useState<SlsStatus | null>(null);
  const [inst, setInst] = useState<SlsInstallState | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReinstall, setShowReinstall] = useState(true);
  const [sys, setSys] = useState<{ engineInstalled: boolean; foreignEngine: boolean; foreignName: string; cloudredirect: boolean } | null>(null);
  const [qmsg, setQmsg] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async () => {
    try { setStatus(await getSlssteamStatus()); } catch { /* */ }
    try { const s = await systemStatus(); if (s.success) setSys(s); } catch { /* */ }
  };

  useEffect(() => {
    refresh();
    getShowReinstallQam().then((r) => setShowReinstall(!!r.enabled)).catch(() => {});
    return () => { if (poll.current) clearInterval(poll.current); };
  }, []);

  // Wait for a running SLSsteam install to finish (poll its status).
  const waitInstall = () => new Promise<boolean>((resolve) => {
    const iv = setInterval(async () => {
      try {
        const st = await getSlssteamInstallStatus();
        setInst(st.state || null);
        const s = st.state?.status;
        if (s === "done" || s === "failed") { clearInterval(iv); resolve(s === "done"); }
      } catch { /* keep polling */ }
    }, 1500);
  });

  // One-tap onboarding: install/verify the engine (deferring to a foreign engine
  // like lumalinux if one is already managing injection), run the client fix, and
  // install CloudRedirect — in order.
  const quickInstall = async () => {
    setBusy(true); setInst(null);
    try {
      const s = await systemStatus();
      // First-time install guard: if a different engine (stock SLSsteam / lumalinux)
      // is present, disable it first so it can't fight moon's injection.
      if (s.success && (s.foreignEngine || (s.engineInstalled && s.engine !== "slsteam-moon"))) {
        setQmsg(`Clearing conflicting engine (${s.foreignName || s.engine})…`);
        try {
          const d = await disableForeignEngines();
          if (d.success && (d.disabled || []).length) setQmsg(`Disabled ${d.foreignName || "engine"}. Installing slsteam-moon…`);
        } catch { /* best-effort */ }
      }
      if (!s.engineInstalled || (s.engineInstalled && s.engine !== "slsteam-moon")) {
        setQmsg("Installing slsteam-moon…");
        const r = await installSlssteam();
        if (!r.success) {
          const m = r.missingDeps?.length ? `Cannot unpack: ${r.missingDeps.join(", ")}` : (r.error || "SLSsteam install failed");
          setInst({ status: "failed", error: m }); setBusy(false); return;
        }
        const ok = await waitInstall();
        if (!ok) { setBusy(false); return; }
        setQmsg("Applying client fix…");
        try { await runClientFix(); } catch { /* best-effort */ }
      } else {
        setQmsg("slsteam-moon already installed.");
      }
      // CloudRedirect's first install pulls a ~1GB KDE flatpak runtime and can
      // take many minutes — do NOT block onboarding completion on it or the
      // button looks hung. Kick it off in the background; the Dependencies tab
      // shows its progress and it's only needed for cloud saves, not for adding
      // games.
      setQmsg("Installing CloudRedirect in the background (cloud saves)…");
      crEnsureInstalled().catch(() => {});
      setQmsg("SLSDeck is set up. Reload Steam to finish. (CloudRedirect finishes in the background.)");
      toaster.toast({ title: "SLSDeck", body: "SLSDeck set up" });
      refresh();
      setTimeout(() => reloadSteam().catch(() => {}), 3000);
    } catch (e) {
      setQmsg(`Setup error: ${e}`);
    }
    setBusy(false);
  };

  const watch = () => {
    if (poll.current) clearInterval(poll.current);
    poll.current = setInterval(async () => {
      try {
        const st = await getSlssteamInstallStatus();
        setInst(st.state || null);
        const s = st.state?.status;
        if (s === "done" || s === "failed") {
          if (poll.current) clearInterval(poll.current);
          setBusy(false);
          refresh();
          if (s === "done") {
            toaster.toast({ title: "SLSDeck", body: "SLSsteam installed" });
            if (st.state?.installed) setTimeout(() => reloadSteam(), 3000);
          } else {
            toaster.toast({ title: "SLSDeck", body: st.state?.error || "Failed" });
          }
        }
      } catch { /* keep polling */ }
    }, 1500);
  };

  const install = async () => {
    setBusy(true);
    setInst({ status: "queued" });
    try {
      const r = await installSlssteam();
      if (!r.success) {
        const msg = r.missingDeps?.length
          ? `Cannot unpack: ${r.missingDeps.join(", ")}`
          : r.error || "Could not start install";
        setBusy(false);
        setInst({ status: "failed", error: msg });
        toaster.toast({ title: "SLSDeck", body: msg });
        return;
      }
      toaster.toast({ title: "SLSDeck", body: "Installing… (a few min)" });
      watch();
    } catch (e) {
      const msg = String((e as any)?.message ?? e);
      setBusy(false);
      setInst({ status: "failed", error: `Install error: ${msg}` });
    }
  };

  const working = busy || inst?.status === "running" || inst?.status === "queued";

  return (
    <PanelSection title="SLSsteam">
      <PanelSectionRow>
        <div style={{ padding: "2px 0" }}>
          <Chip ok={!!status?.installed} label="Installed" />
          <Chip ok={!!status?.injected} label="Injected" />
        </div>
      </PanelSectionRow>

      {working && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.85, padding: "2px 0" }}>
            <Spinner style={{ width: 14, height: 14, marginRight: 8 }} />
            {inst?.status === "queued" ? "Starting…" : "Installing…"}
            {typeof inst?.percent === "number" && inst.percent > 0 ? ` ${inst.percent}%` : ""}
          </div>
        </PanelSectionRow>
      )}

      {inst?.status === "failed" && inst?.error && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, color: "#f5a623", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {inst.error}
          </div>
        </PanelSectionRow>
      )}

      {sys?.foreignEngine && !status?.installed && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, color: "#f5a623", padding: "0 2px" }}>
            Detected {sys.foreignName || "another engine"} — Install will disable it (reversibly) and set up slsteam-moon.
          </div>
        </PanelSectionRow>
      )}

      {!working && !status?.installed && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={quickInstall}>
            Install SLSDeck (one-tap setup)
          </ButtonItem>
        </PanelSectionRow>
      )}
      {!working && !status?.installed && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
            Installs slsteam-moon{sys?.foreignEngine ? " (disabling any other engine first)" : ""} + CloudRedirect and applies the client fix, in order.
          </div>
        </PanelSectionRow>
      )}

      {!working && status?.installed && showReinstall && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={install}>
            Reinstall SLSsteam
          </ButtonItem>
        </PanelSectionRow>
      )}

      {qmsg ? (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.8, padding: "0 2px", whiteSpace: "pre-wrap" }}>{qmsg}</div>
        </PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}
