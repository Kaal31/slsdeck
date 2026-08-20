import { PanelSection, PanelSectionRow, ButtonItem, ToggleField, Spinner } from "@decky/ui";
import { ScrollableResult } from "../components/ScrollableResult";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import {
  HvStatus, HvModuleInfo, hvStatus,
  hvInstallDeps, hvDownload, hvBuild, hvBuildContainer,
  hvLoadAuto, hvUnloadAuto, hvTest,
  hvNativeNotice, hvDismissNative,
  hvUmipStart, hvUmipStop, hvDisableUmip, hvRestoreUmip, hvReboot, hvLog,
  hvSetGame, hvSetWatcherMode, hvGetAutoload, hvSetAutoload,
  hvProtonStatus, hvInstallProton, hvProtonInstallStatus,
} from "../api";
import { appDisplayName } from "../lib/fixRuntime";

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        marginRight: 6,
        marginBottom: 4,
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

function markedGames(st: HvStatus | null): string[] {
  const g: any = st?.games;
  if (!g) return [];
  if (Array.isArray(g)) return g.filter((x) => x?.enabled).map((x) => String(x.appid));
  return Object.keys(g).filter((k) => g[k]);
}

/**
 * Anti-Denuvo hypervisor (HV-Decky port): builds the cpuid_fault_emulation
 * kernel module against the RUNNING kernel (native pacman headers, or a podman
 * container), verifies it with a userspace cpuid self-test, and runs a
 * umipcompatd daemon so UMIP need not be disabled system-wide. Needs root.
 */
export function HypervisorSection() {
  const [st, setSt] = useState<HvStatus | null>(null);
  const [busy, setBusy] = useState("");
  const [autoload, setAutoload] = useState(false);
  const [proton, setProton] = useState<{ installed: boolean; tarballPresent: boolean } | null>(null);
  const [protonDl, setProtonDl] = useState<{ status: string; percent: number } | null>(null);
  const [nativeNote, setNativeNote] = useState<{ show: boolean; message: string } | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState("");

  const refresh = async () => {
    try {
      setSt(await hvStatus());
    } catch {
      /* ignore */
    }
    try {
      setAutoload(!!(await hvGetAutoload()).enabled);
    } catch {
      /* ignore */
    }
    try {
      const p = await hvProtonStatus();
      setProton({ installed: !!p.installed, tarballPresent: !!p.tarballPresent });
    } catch {
      setProton(null);
    }
    try {
      const n = await hvNativeNotice();
      setNativeNote(n.success ? { show: !!(n.show ?? n.native), message: n.message || "" } : null);
    } catch {
      setNativeNote(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Runs a long backend action, shows a spinner, then refreshes + surfaces the
  // operation log tail.
  const run = async (key: string, fn: () => Promise<{ success: boolean; message?: string; error?: string }>, okMsg: string) => {
    setBusy(key);
    try {
      const r = await fn();
      toaster.toast({ title: "Hypervisor", body: r.success ? (r.message || okMsg) : (r.error || "Failed") });
    } catch (e) {
      toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
    } finally {
      setBusy("");
      refresh();
    }
  };

  const doTest = async () => {
    setBusy("test");
    try {
      const r: any = await hvTest();
      toaster.toast({
        title: "Hypervisor self-test",
        body: r.success ? (r.message || "cpuid faulting works ✓") : (r.error || r.message || "Self-test failed"),
      });
    } catch (e) {
      toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
    } finally {
      setBusy("");
    }
  };

  const loadLog = async () => {
    setShowLog((v) => !v);
    try {
      const r = await hvLog();
      setLog(r.log || "(empty)");
    } catch {
      setLog("(could not read log)");
    }
  };

  const doInstallProton = async () => {
    setBusy("proton");
    setProtonDl({ status: "starting", percent: 0 });
    try {
      const r = await hvInstallProton();
      if (!r.success && r.error) {
        toaster.toast({ title: "Hypervisor", body: r.error });
        setProtonDl(null);
        return;
      }
      await new Promise<void>((resolve) => {
        const t = setInterval(async () => {
          try {
            const s = (await hvProtonInstallStatus()).state;
            setProtonDl({ status: s.status, percent: s.percent || 0 });
            if (["done", "failed", "needsSource"].includes(s.status)) {
              clearInterval(t);
              toaster.toast({
                title: "Hypervisor",
                body: s.status === "done" ? "Denuvo Proton installed" : (s.error || "Install failed"),
              });
              setProtonDl(null);
              resolve();
            }
          } catch {
            /* keep polling */
          }
        }, 1000);
      });
    } catch (e) {
      toaster.toast({ title: "Hypervisor", body: `Error: ${e}` });
      setProtonDl(null);
    } finally {
      setBusy("");
      refresh();
    }
  };

  const onAutoload = async (v: boolean) => {
    setAutoload(v);
    try {
      await hvSetAutoload(v);
    } catch {
      /* ignore */
    }
  };

  const onWatcher = async (v: boolean) => {
    try {
      await hvSetWatcherMode(v ? "steam_log" : "manual");
      refresh();
    } catch {
      /* ignore */
    }
  };

  const unmark = async (appid: string) => {
    try {
      await hvSetGame(Number(appid), false);
    } catch {
      /* ignore */
    }
    refresh();
  };

  const modules: HvModuleInfo[] = (st?.modules as HvModuleInfo[]) || [];
  const loaded = modules.some((m) => m.loaded);
  const built = modules.some((m) => m.kernel_compatible);
  const podman = !!st?.podman_path;
  const working = busy !== "";
  const games = markedGames(st);

  return (
    <PanelSection title="Anti-Denuvo (hypervisor)">
      <PanelSectionRow>
        <div style={{ padding: "2px 0" }}>
          <Chip ok={loaded} label={loaded ? "Active" : "Inactive"} />
          <Chip ok={built} label="Module built" />
          <Chip ok={!!st?.headers_ready} label="Headers" />
          <Chip ok={!!st?.root} label="Root" />
          <Chip ok={!!st?.umip_disabled} label="UMIP off" />
          <Chip ok={!!proton?.installed} label="Proton" />
        </div>
      </PanelSectionRow>

      {st && st.is_steamos === false && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, color: "#f5a623", padding: "2px 2px" }}>
            ⚠ Non-SteamOS detected. The kernel-module build targets SteamOS (holo repo / linux-neptune
            headers); on another distro the build may fail or need its own kernel headers. Proceed at your own risk.
          </div>
        </PanelSectionRow>
      )}

      {nativeNote?.show && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, color: "#58c578", padding: "2px 2px" }}>
            ✓ {nativeNote.message || "This kernel supports cpuid faulting natively — the module may not be needed."}
            <span
              style={{ marginLeft: 8, textDecoration: "underline", cursor: "pointer", opacity: 0.8 }}
              onClick={async () => { await hvDismissNative(); setNativeNote(null); }}
            >
              dismiss
            </span>
          </div>
        </PanelSectionRow>
      )}

      {!st?.root && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Backend is not running as root — reinstall the plugin so the root flag takes effect.
          </div>
        </PanelSectionRow>
      )}

      {working && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            <Spinner style={{ width: 14, height: 14, marginRight: 8 }} />
            {busy === "deps" ? "Installing kernel headers…"
              : busy === "build" ? "Building module (this can take a few minutes)…"
              : busy === "container" ? "Building module in container…"
              : "Working…"}
          </div>
        </PanelSectionRow>
      )}

      {/* Get the module — download the prebuilt .ko (recommended on SteamOS) or
          compile it against the running kernel. */}
      {!working && !built && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => run("download", hvDownload, "Prebuilt module downloaded")}>
              Download prebuilt module (recommended)
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Fetches the prebuilt cpuid_fault_emulation.ko for your kernel ({st?.kernel_release || "?"}) — no
              compiler, headers or source needed. Use this first; only build below if no prebuilt matches your kernel.
            </div>
          </PanelSectionRow>
          {!st?.headers_ready && (
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={() => run("deps", hvInstallDeps, "Kernel headers installed")}>
                Install kernel headers (for building)
              </ButtonItem>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => run("build", hvBuild, "Module built")}>
              Build module (native)
            </ButtonItem>
          </PanelSectionRow>
          {podman && (
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={() => run("container", hvBuildContainer, "Module built (container)")}>
                Build module in container (podman)
              </ButtonItem>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Building compiles the module for your kernel ({st?.kernel_release || "?"}) using{" "}
              {st?.compiler_name || "the kernel compiler"} — needs headers + source. Rebuild after a SteamOS kernel update.
            </div>
          </PanelSectionRow>
        </>
      )}

      {/* Load / unload the built module. */}
      {!working && built && !loaded && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("load", hvLoadAuto, "Hypervisor enabled")}>
            Enable hypervisor
          </ButtonItem>
        </PanelSectionRow>
      )}
      {!working && built && loaded && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("unload", hvUnloadAuto, "Hypervisor disabled")}>
            Disable hypervisor
          </ButtonItem>
        </PanelSectionRow>
      )}
      {!working && built && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={doTest} disabled={working}>
            Test cpuid faulting (self-test)
          </ButtonItem>
        </PanelSectionRow>
      )}
      {!working && built && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("build", hvBuild, "Module rebuilt")}>
            Rebuild for this kernel
          </ButtonItem>
        </PanelSectionRow>
      )}

      {/* UMIP — automatic via the umipcompatd daemon (starts with the module).
          Kernel disable only surfaces as a fallback if the daemon fails; a
          Restore button appears if UMIP was disabled at the kernel level. */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>UMIP compatibility</div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.7 }}>
          {st?.umip_disabled
            ? "UMIP is disabled at the kernel level — the daemon isn't needed here."
            : st?.umipcompat_running
            ? "Handled automatically ✓ — the umipcompatd daemon runs while the hypervisor is enabled (no reboot)."
            : st?.umipcompat_failed
            ? "⚠ The automatic UMIP daemon failed to start — use the kernel fallback below."
            : "Handled automatically by the umipcompatd daemon when the hypervisor is enabled (no reboot)."}
        </div>
      </PanelSectionRow>

      {/* Restore UMIP — only when it's currently kernel-disabled. */}
      {st?.umip_disabled && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("umiprestore", hvRestoreUmip, "UMIP restore staged — reboot to apply")} disabled={working}>
            Restore UMIP (reboot) — switch to the automatic daemon
          </ButtonItem>
        </PanelSectionRow>
      )}

      {/* Manual daemon controls (secondary) — only when UMIP is on. */}
      {!st?.umip_disabled && !st?.umipcompat_running && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("umipstart", hvUmipStart, "UMIP daemon started")} disabled={working}>
            Start UMIP daemon manually
          </ButtonItem>
        </PanelSectionRow>
      )}
      {!st?.umip_disabled && st?.umipcompat_running && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => run("umipstop", hvUmipStop, "UMIP daemon stopped")} disabled={working}>
            Stop UMIP daemon
          </ButtonItem>
        </PanelSectionRow>
      )}

      {/* Kernel-disable fallback — only when the daemon failed. */}
      {!st?.umip_disabled && st?.umipcompat_failed && (
        <>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Fallback: if the daemon won't run, disable UMIP at the kernel level (permanent, needs a reboot).
            </div>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => run("umip", hvDisableUmip, "UMIP disabled")} disabled={working}>
              Disable UMIP &amp; reboot (permanent)
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}

      {/* Automation */}
      <PanelSectionRow>
        <ToggleField
          label="Auto-manage per game"
          description="Watch Steam's game log and load the module while a flagged Denuvo game runs, then unload it. Off = manual only."
          checked={(st?.game_watcher_mode || "manual") === "steam_log"}
          onChange={onWatcher}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Start watcher at boot"
          description="Start the per-game HV watcher when the plugin loads."
          checked={autoload}
          onChange={onAutoload}
        />
      </PanelSectionRow>

      {/* Proton (kept from the existing flow) */}
      {proton && !proton.installed && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={doInstallProton} disabled={working || !!protonDl}>
              {protonDl ? "Working…" : proton.tarballPresent ? "Install Denuvo Proton" : "Download & install Denuvo Proton (~505 MB)"}
            </ButtonItem>
          </PanelSectionRow>
          {protonDl && (
            <PanelSectionRow>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <Spinner style={{ width: 16, height: 16 }} />
                <span>
                  {protonDl.status === "downloading" ? `Downloading… ${protonDl.percent}%`
                    : protonDl.status === "extracting" ? "Extracting…" : protonDl.status}
                </span>
              </div>
            </PanelSectionRow>
          )}
        </>
      )}

      {games.length > 0 && (
        <>
          <PanelSectionRow>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>Marked games</div>
          </PanelSectionRow>
          {games.map((aid) => (
            <PanelSectionRow key={aid}>
              <ButtonItem layout="below" onClick={() => unmark(aid)}>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontWeight: 600 }}>{appDisplayName(Number(aid)) || `AppID ${aid}`}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>tap to unmark</span>
                </div>
              </ButtonItem>
            </PanelSectionRow>
          ))}
        </>
      )}

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => run("reboot", hvReboot, "Rebooting…")} disabled={working}>
          Reboot Deck now
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem layout="below" onClick={loadLog}>
          {showLog ? "Hide build log ▾" : "Show build log ▸"}
        </ButtonItem>
      </PanelSectionRow>
      {showLog && (
        <PanelSectionRow>
          <ScrollableResult text={log} maxHeight={240} mono fontSize={10} />
        </PanelSectionRow>
      )}

      {st?.kernel_release && (
        <PanelSectionRow>
          <div style={{ fontSize: 10, opacity: 0.5 }}>
            kernel {st.kernel_release}{st?.compiler_name ? ` · ${st.compiler_name}` : ""}
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
