import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  Focusable,
  Spinner,
  showModal,
  ConfirmModal,
} from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@decky/api";
import {
  AddState,
  FixCheck,
  IN_PROGRESS,
  InstalledFix,
  TokeerAppliedRecord,
  LuatoolsCatalogFix,
  SearchResult,
  applyFix,
  applyLuatoolsFix,
  getAutoApply,
  pinForLuatoolsFix,
  getFixStatus,
  getGameInstallPath,
  getInstalledFixes,
  getUnfixStatus,
  searchGames,
  unfix,
  customDeleteFixes,
  tokeerAppliedStatus,
} from "../api";
import { importCustomFlow } from "../components/CustomImport";
import { applyFixRuntime, resetFixRuntime, autoRepointFromState, clearFixLaunchOptions } from "../lib/fixRuntime";
import { checkFixesFull } from "../lib/fixIndex";
import { runBuildAccurateApply, isDownloadComplete } from "../lib/buildApply";
import { refreshBadges } from "../lib/badges";

export function FixesSection() {
  const [appidText, setAppidText] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [check, setCheck] = useState<FixCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [applyState, setApplyState] = useState<AddState | null>(null);
  const [installed, setInstalled] = useState<InstalledFix[]>([]);
  const [tokeerApplied, setTokeerApplied] = useState<TokeerAppliedRecord[]>([]);
  const [openDesc, setOpenDesc] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState<{ label: string; run: () => Promise<void> } | null>(null);
  const [dlComplete, setDlComplete] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dlRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopFlag = useRef(false);

  const loadInstalled = async () => {
    try {
      const [res, tokeer] = await Promise.all([getInstalledFixes(), tokeerAppliedStatus()]);
      setInstalled(res.success ? res.fixes : []);
      setTokeerApplied(tokeer.success ? tokeer.records || [] : []);
    } catch {
      setInstalled([]);
      setTokeerApplied([]);
    }
  };

  useEffect(() => {
    loadInstalled();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (dlRef.current) clearInterval(dlRef.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      stopFlag.current = true;
    };
  }, []);

  const startDlPoll = (appid: number) => {
    if (dlRef.current) clearInterval(dlRef.current);
    setDlComplete(false);
    dlRef.current = setInterval(async () => {
      setDlComplete(await isDownloadComplete(appid));
    }, 3000);
  };

  // Build-accurate apply: pin the fix's build, update the game, then apply
  // (auto) or wait for the user to press Apply (guided). Skips the update if the
  // game is already installed & downloaded.
  const runApply = async (
    appid: number,
    label: string,
    startExtract: () => Promise<{ success: boolean; error?: string }>,
    pinFn?: () => Promise<{ pinned: boolean; source?: string; changed?: boolean }>
  ) => {
    setAwaiting(null);
    stopFlag.current = false;
    let autoApply = false;
    try {
      autoApply = (await getAutoApply()).enabled;
    } catch {
      /* default guided */
    }
    const doApply = async () => {
      setAwaiting(null);
      if (dlRef.current) clearInterval(dlRef.current);
      setApplyState({ status: "queued" });
      const res = await startExtract();
      if (!res || !res.success) {
        toaster.toast({ title: "SLSDeck", body: res?.error || "Could not start fix" });
        setApplyState(null);
        throw new Error("apply-start-failed");
      }
      resetFixRuntime(appid);
      pollApply(appid, label);
    };
    try {
      const result = await runBuildAccurateApply({
        appid,
        autoApply,
        doApply,
        pinFn,
        shouldStop: () => stopFlag.current,
        onPhase: (phase) => {
          if (phase === "pinning") setApplyState({ status: "pinning" } as AddState);
          else if (phase === "updating") setApplyState({ status: "updating" } as AddState);
          else if (phase === "awaiting_download")
            setApplyState({ status: "awaiting download" } as AddState);
          else if (phase === "applying") setApplyState({ status: "queued" });
        },
      });
      if (result === "awaiting") {
        setAwaiting({ label, run: doApply });
        startDlPoll(appid);
      }
    } catch {
      /* surfaced already */
    }
  };

  // Search by game NAME or AppID. Pure digits = a direct AppID; otherwise
  // debounce a name search (same store search the Add-game tab uses).
  const runSearch = (value: string) => {
    setAppidText(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      setResults([{ appid: parseInt(trimmed, 10), name: `AppID ${trimmed}` }]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchGames(trimmed, 15);
        setResults(res.success ? res.results : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const checkAppid = async (appid: number) => {
    if (!appid) return;
    setChecking(true);
    setCheck(null);
    setApplyState(null);
    setResults([]);
    try {
      const res = await checkFixesFull(appid);
      setCheck(res);
    } catch (e) {
      toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
    } finally {
      setChecking(false);
    }
  };

  const pollApply = (appid: number, name: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await getFixStatus(appid);
        if (!res.success) return;
        setApplyState(res.state);
        if (res.state.status === "done") {
          clearInterval(pollRef.current!);
          applyFixRuntime(appid, res.state.overrides);
          autoRepointFromState(appid, res.state);
          toaster.toast({ title: "SLSDeck", body: `Fix applied to ${name}` });
          loadInstalled();
          void refreshBadges();
        } else if (["failed", "cancelled"].includes(res.state.status || "")) {
          clearInterval(pollRef.current!);
          if (res.state.status === "failed")
            toaster.toast({ title: "SLSDeck", body: res.state.error || "Fix failed" });
        }
      } catch {
        /* keep polling */
      }
    }, 800);
  };

  const onApply = async (appid: number, url: string, fixType: string, gameName: string) => {
    const pathRes = await getGameInstallPath(appid);
    if (!pathRes.success || !pathRes.installPath) {
      toaster.toast({ title: "SLSDeck", body: "Game must be installed to apply a fix." });
      return;
    }
    await runApply(appid, gameName, () =>
      applyFix(appid, url, pathRes.installPath!, fixType, gameName)
    );
  };

  const onApplyLuatools = async (fix: LuatoolsCatalogFix, gameName: string) => {
    const pathRes = await getGameInstallPath(fix.appid);
    if (!pathRes.success || !pathRes.installPath) {
      toaster.toast({ title: "SLSDeck", body: "Game must be installed to apply a fix." });
      return;
    }
    await runApply(
      fix.appid,
      gameName,
      () =>
        applyLuatoolsFix(
          fix.appid, fix.id, pathRes.installPath!, fix.manifest_id || "", fix.depot_id || "",
          "lua.tools fix", gameName
        ),
      () => pinForLuatoolsFix(fix.appid, fix.id)
    );
  };

  const confirmUnfix = (fix: InstalledFix) => {
    showModal(
      <ConfirmModal
        strTitle={`Un-fix and unpin ${fix.gameName}?`}
        strDescription={`Deletes ${fix.filesCount} file(s) added by "${fix.fixType}" on ${fix.date}, and removes the game's version pin so Steam can update it again.`}
        strOKButtonText="Un-fix and unpin"
        onOK={async () => {
          const res = await unfix(fix.appid, fix.installPath, fix.date);
          if (!res.success) {
            toaster.toast({ title: "SLSDeck", body: res.error || "Failed" });
            return;
          }
          const timer = setInterval(async () => {
            const st = await getUnfixStatus(fix.appid);
            if (st.success && ["done", "failed"].includes(st.state.status || "")) {
              clearInterval(timer);
              if (st.state.status === "done") {
                clearFixLaunchOptions(fix.appid);
                void refreshBadges();
              }
              toaster.toast({
                title: "SLSDeck",
                body: st.state.status === "done" ? "Fix removed" : st.state.error || "Failed",
              });
              loadInstalled();
            }
          }, 700);
        }}
      />
    );
  };

  const applyBusy = !!applyState && IN_PROGRESS.has(applyState.status || "");

  return (
    <PanelSection title="Game fixes">
      <PanelSectionRow>
        <TextField
          label="Search by name or AppID"
          value={appidText}
          onChange={(e) => runSearch((e.target as HTMLInputElement).value)}
        />
      </PanelSectionRow>

      {searching && (
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <Spinner style={{ width: 16, height: 16 }} /> Searching…
          </div>
        </PanelSectionRow>
      )}

      {!checking && !check && results.slice(0, 15).map((r) => (
        <PanelSectionRow key={r.appid}>
          <ButtonItem layout="below" onClick={() => checkAppid(r.appid)}>
            <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontWeight: 600 }}>{r.name}</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>AppID {r.appid}</span>
            </Focusable>
          </ButtonItem>
        </PanelSectionRow>
      ))}

      {checking && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Checking fixes…</div>
        </PanelSectionRow>
      )}

      {check && check.success && (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => { setCheck(null); setResults([]); }}>
              ← New search
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontWeight: 600, padding: "2px 0" }}>{check.gameName}</div>
          </PanelSectionRow>
          {check.genericFix.available && check.genericFix.url && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                disabled={applyBusy || !!awaiting}
                onClick={() =>
                  onApply(check.appid, check.genericFix.url!, "Generic Fix", check.gameName)
                }
              >
                Apply generic fix
              </ButtonItem>
            </PanelSectionRow>
          )}
          {check.onlineFix.available && check.onlineFix.url && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                disabled={applyBusy || !!awaiting}
                onClick={() =>
                  onApply(check.appid, check.onlineFix.url!, "Online Fix (Unsteam)", check.gameName)
                }
              >
                Apply online fix (Unsteam)
              </ButtonItem>
            </PanelSectionRow>
          )}
          {!check.genericFix.available && !check.onlineFix.available && (
            <PanelSectionRow>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                No fixes available for this game.
                {` (perondepot: ${(check.onlineFix as any).mirrorEntries ?? 0} entries${((check.onlineFix as any).nearMatches || []).length ? `; near: ${((check.onlineFix as any).nearMatches || []).join(", ")}` : ""})`}
              </div>
            </PanelSectionRow>
          )}

          {/* lua.tools catalog — full list WITH descriptions (Settings-only). */}
          {(() => {
            const cat = ((check as any).luatoolsCatalog || []) as LuatoolsCatalogFix[];
            const authed = (check as any).luatoolsAuthed as boolean | undefined;
            const catErr = (check as any).luatoolsCatalogError as string | undefined;
            if (authed === false) {
              return (
                <PanelSectionRow>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    🔓 Sign in with Discord (lua.tools account, above) to list lua.tools fixes.
                  </div>
                </PanelSectionRow>
              );
            }
            if (!cat.length) {
              return catErr ? (
                <PanelSectionRow>
                  <div style={{ fontSize: 11, color: "#ffcc66" }}>lua.tools: {catErr}</div>
                </PanelSectionRow>
              ) : null;
            }
            return (
              <>
                <PanelSectionRow>
                  <div style={{ fontWeight: 600, marginTop: 6 }}>lua.tools fixes ({cat.length})</div>
                </PanelSectionRow>
                {cat.map((fix, i) => {
                  const tags = (fix.tags || [])
                    .map((t: any) =>
                      typeof t === "string" ? t : (t && (t.name || t.label || t.text)) || ""
                    )
                    .filter(Boolean);
                  const title = tags.length ? tags.join(" · ") : fix.name || `Fix ${fix.id || i + 1}`;
                  const buildId = (fix as any).build || fix.manifest_id || "";
                  const when = (fix.release_date || "").slice(0, 10);
                  const meta = [when ? `Released ${when}` : "", buildId ? `build ${buildId}` : ""]
                    .filter(Boolean)
                    .join(" · ");
                  const key = fix.id || String(i);
                  const desc = (fix as any).description as string | undefined;
                  return (
                    <div key={`lt-${key}`}>
                      <PanelSectionRow>
                        <div style={{ padding: "4px 0" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                          {meta && <div style={{ fontSize: 11, opacity: 0.6 }}>{meta}</div>}
                        </div>
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <ButtonItem
                          layout="below"
                          disabled={applyBusy || !!awaiting}
                          onClick={() => onApplyLuatools(fix, check.gameName)}
                        >
                          Apply & pin to build
                        </ButtonItem>
                      </PanelSectionRow>
                      {desc && (
                        <>
                          <PanelSectionRow>
                            <ButtonItem
                              layout="below"
                              onClick={() => setOpenDesc(openDesc === key ? null : key)}
                            >
                              {openDesc === key ? "Hide details ▾" : "Show details ▸"}
                            </ButtonItem>
                          </PanelSectionRow>
                          {openDesc === key && (
                            <PanelSectionRow>
                              <div
                                style={{
                                  fontSize: 11,
                                  opacity: 0.8,
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  padding: "2px 4px 6px",
                                  maxHeight: 260,
                                  overflowY: "auto",
                                }}
                              >
                                {desc}
                              </div>
                            </PanelSectionRow>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </>
      )}

      {awaiting && (
        <>
          <PanelSectionRow>
            <div style={{ fontSize: 12, opacity: 0.85, padding: "4px 0" }}>
              Pinned — waiting for Steam to update the game.{" "}
              {dlComplete ? "Download complete — press Apply now." : "Let the download finish, then Apply."}
            </div>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => awaiting.run().catch(() => {})}>
              {dlComplete ? `Apply ${awaiting.label} now` : "Apply now (download not done)"}
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => {
                stopFlag.current = true;
                if (dlRef.current) clearInterval(dlRef.current);
                setAwaiting(null);
                setApplyState(null);
              }}
            >
              Cancel (keep pin)
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}

      {applyState && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.8, padding: "4px 0" }}>
            Fix status: {applyState.status}
            {applyState.error ? ` — ${applyState.error}` : ""}
          </div>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <div style={{ fontWeight: 600, marginTop: 6 }}>Custom fixes</div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={async () => {
            const msg = await importCustomFlow("fix");
            if (msg) toaster.toast({ title: "SLSDeck", body: msg });
          }}
        >
          Apply external fix…
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          Pick a fix file (.zip/.rar/.7z or a loose .dll/.exe) and the game it's for.
          It shows as a "Custom fix" button in that game's Fixes menu and, once applied,
          in Applied fixes below (removable by tapping / Un-fix).
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() =>
            showModal(
              <ConfirmModal
                strTitle="Delete all custom fixes?"
                strDescription="Removes every imported custom-fix file from ~/.local/share/SLSDeck/custom_fixes. Already-applied fixes stay on their games until you Un-fix them."
                strOKButtonText="Delete"
                onOK={async () => {
                  const r = await customDeleteFixes(0);
                  toaster.toast({ title: "SLSDeck", body: r.success ? "Custom fixes cleared" : r.error || "Failed" });
                }}
              />,
            )
          }
        >
          Delete custom fixes
        </ButtonItem>
      </PanelSectionRow>

      {installed.length > 0 && (
        <>
          <PanelSectionRow>
            <div style={{ fontWeight: 600, marginTop: 6 }}>Applied fixes</div>
          </PanelSectionRow>
          {installed.map((fix, i) => (
            <PanelSectionRow key={`${fix.appid}-${fix.date}-${i}`}>
              <ButtonItem layout="below" onClick={() => confirmUnfix(fix)}>
                <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontWeight: 600 }}>{fix.gameName}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {fix.fixType} · {fix.date} · tap to undo
                  </span>
                </Focusable>
              </ButtonItem>
            </PanelSectionRow>
          ))}
        </>
      )}
      {tokeerApplied.length > 0 && (
        <>
          <PanelSectionRow>
            <div style={{ fontWeight: 600, marginTop: 6 }}>Tokeer status</div>
          </PanelSectionRow>
          {tokeerApplied.map((record) => (
            <PanelSectionRow key={`tokeer-${record.appid}`}>
              <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left", padding: "7px 10px" }}>
                <span style={{ fontWeight: 600 }}>{record.health === "valid" ? "🔑" : "⚠️"} {record.gameName || `AppID ${record.appid}`}</span>
                <span style={{ fontSize: 11, opacity: 0.68 }}>
                  {record.health === "valid" ? "Key applied" : (record.healthReason || "Verification needed")} · {record.pinned ? "🔒 Version pinned" : "Version not pinned"}
                </span>
              </Focusable>
            </PanelSectionRow>
          ))}
        </>
      )}
    </PanelSection>
  );
}
