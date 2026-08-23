import { PanelSection, PanelSectionRow, ButtonItem, ConfirmModal, showModal } from "@decky/ui";
import { useEffect, useState } from "react";
import {
  ArchiveEntry,
  archiveEntries,
  archiveActivateGame,
  archiveRemoveGame,
  archiveDeactivate,
  archiveReconcile,
  triggerSteamInstall,
  validateSteamApp,
} from "../api";

/**
 * The Archive: one entry per game holding everything SLSDeck knows it should
 * be — one mandatory kept build plus the fixes, launch arguments, Proton tool
 * and DLC state that were present when the game record was captured.
 *
 * Modelled on LumaDeck's list → detail layout (GameList → GameDetail) rather
 * than a flat table; it rejected tabs only because the QAM is cramped, and this
 * lives in the Options sidebar where there is room.
 *
 * Components are not independently archived or removed. Restore and Unarchive
 * always operate on the complete game record.
 */

function Pill({ text, tone = "dim" }: { text: string; tone?: "dim" | "on" | "warn" }) {
  const c = tone === "on" ? { bg: "rgba(47,168,92,0.18)", fg: "#5fd08a" }
    : tone === "warn" ? { bg: "rgba(245,166,35,0.18)", fg: "#f5a623" }
    : { bg: "rgba(255,255,255,0.10)", fg: "#c8d2e0" };
  return (
    <span style={{
      display: "inline-block", marginRight: 5, padding: "1px 7px", borderRadius: 999,
      fontSize: 10, fontWeight: 700, background: c.bg, color: c.fg,
    }}>{text}</span>
  );
}

function GameDetail({ entry, onBack, onChanged }: {
  entry: ArchiveEntry; onBack: () => void; onChanged: () => void;
}) {
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const buildIsComplete = (b: ArchiveEntry["builds"][number]) =>
    (b.missingManifests?.length || 0) === 0
    && Object.keys(b.gids || {}).length > 0
    && Object.keys(b.keys || {}).length === Object.keys(b.gids || {}).length;
  const hasActivatableBuild = entry.builds.some(buildIsComplete);

  // Steam owns launch arguments, so read them here and hand them to the backend
  // as the "before" state. Deactivate then RESTORES this instead of blanking —
  // which is what keeps Proton and native-Linux games symmetric: each is put
  // back exactly as it was, rather than into a state the template invented.
  const readLaunchArgs = (): string | null => {
    try {
      const SC: any = (window as any).SteamClient;
      const v = SC?.Apps?.GetLaunchOptionsForApp?.(entry.appid);
      return typeof v === "string" ? v : null;
    } catch { return null; }
  };

  // Shared Steam-side cleanup: the backend deactivates and reports what it
  // could not do itself (launch args + file reset are SteamClient-only).
  const runSteamSideCleanup = (d?: { clearLaunchOptions?: boolean; restoreLaunchOptions?: string; resetFiles?: boolean }) => {
    if (d?.clearLaunchOptions) {
      try {
        const SC: any = (window as any).SteamClient;
        // "" legitimately means "it had none before", so always write the
        // reported value rather than treating empty as "skip".
        SC?.Apps?.SetAppLaunchOptions?.(entry.appid, d.restoreLaunchOptions ?? "");
      } catch { /* ignore */ }
    }
    if (d?.resetFiles) {
      triggerSteamInstall(entry.appid).catch(() => {});
      validateSteamApp(entry.appid).catch(() => {});
    }
  };

  const toggleGameActive = () => {
    if (entry.activeBuild) {
      showModal(
        <ConfirmModal
          strTitle="Deactivate this game snapshot?"
          strDescription="Stops restoring the archived configuration, unpins its build, restores the pre-activation launch arguments and asks Steam to reset the game files. The archived game record is kept."
          strOKButtonText="Deactivate"
          onOK={async () => {
            setBusy("game-active");
            try {
              const r = await archiveDeactivate(entry.appid, true);
              if (!r.success) { setNote(r.error || "Could not deactivate"); return; }
              runSteamSideCleanup(r);
              setNote(`Snapshot deactivated${r.unpinned ? " and unpinned" : ""}.`);
              onChanged();
            } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
          }}
        />,
      );
      return;
    }
    showModal(
      <ConfirmModal
        strTitle="Activate this game snapshot?"
        strDescription="Restores the archived build and every optional component captured with it: fixes, launch arguments, Proton selection and DLC state when present. The configuration is re-checked on every boot."
        strOKButtonText="Activate"
        onOK={async () => {
          setBusy("game-active");
          try {
            const a = await archiveActivateGame(entry.appid, readLaunchArgs());
            if (!a.success) { setNote(a.error || "Could not activate"); return; }
            const r = await archiveReconcile(entry.appid, true);
            if (r.success && r.hasLaunchOptions) {
              try {
                const SC: any = (window as any).SteamClient;
                SC?.Apps?.SetAppLaunchOptions?.(entry.appid, r.wantLaunchOptions);
              } catch { /* ignore */ }
            }
            if (r.success && r.installed) {
              triggerSteamInstall(entry.appid).catch(() => {});
              validateSteamApp(entry.appid).catch(() => {});
            }
            const did = (r.actions || []).join(", ");
            setNote(!r.installed
              ? `Snapshot activated. ${r.waiting || "It applies once the game is installed."}`
              : did ? `Snapshot restored — ${did}.` : "Snapshot restored — the game already matches.");
            onChanged();
          } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
        }}
      />,
    );
  };

  const unarchiveGame = () => showModal(
    <ConfirmModal
      strTitle="Unarchive this game?"
      strDescription={
        (entry.activeBuild
          ? "This game is ACTIVE. It will be deactivated first — unpinned, launch arguments cleared and its files reset — and then removed. "
          : "") +
        `Deletes the whole snapshot: ${entry.buildCount} archived build(s), ${entry.fixCount} fix record(s), the launch arguments and the Proton tool. The installed game's files are otherwise untouched.`
      }
      strOKButtonText="Unarchive"
      onOK={async () => {
        setBusy("game-remove");
        try {
          const r = await archiveRemoveGame(entry.appid);
          if (!r.success) { setNote(r.error || "Failed"); return; }
          runSteamSideCleanup(r.deactivated);
          setNote(`Unarchived — ${r.builds ?? 0} build(s) dropped, ${r.removedManifests ?? 0} manifest(s) freed.`);
          onChanged();
          onBack();
        } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
      }}
    />,
  );

  return (
    <PanelSection title={entry.name || `App ${entry.appid}`}>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={onBack}>← Back to archive</ButtonItem>
      </PanelSectionRow>

      {/* Game-level controls. Activate/Deactivate holds the whole game to its
          archived template; Unarchive drops the entire snapshot and runs the
          same deactivate cleanup on the way out, so nothing is left applied to
          a template that no longer exists. */}
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy || (!entry.activeBuild && !hasActivatableBuild)} onClick={toggleGameActive}>
          {busy === "game-active"
            ? "Working…"
            : entry.activeBuild
            ? "Deactivate snapshot"
            : "Activate snapshot"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" disabled={!!busy} onClick={unarchiveGame}>
          {busy === "game-remove" ? "Working…" : "Unarchive this game"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.6 }}>
          AppID <b>{entry.appid}</b>
          {entry.hasCompatTool
            ? entry.compatTool ? <> · Proton <b>{entry.compatTool}</b></> : <> · Proton <i>default</i></>
            : <> · Proton <i>not captured</i></>}
          {entry.hasDlcState
            ? <> · <b>{entry.dlcFiles}</b> DLC file(s)</>
            : <> · DLC <i>not captured</i></>}
          {entry.updatedOn ? <> · updated {entry.updatedOn}</> : null}
          {entry.hasLaunchOptions
            ? <div style={{ marginTop: 3, wordBreak: "break-all" }}>Launch args: {entry.launchOptions ? <code>{entry.launchOptions}</code> : <i>none</i>}</div>
            : <div style={{ marginTop: 3 }}>Launch args: <i>not captured</i></div>}
        </div>
      </PanelSectionRow>

      {/* Mandatory build component — informational only. The archive record is
          restored or removed as one game snapshot. */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, paddingTop: 4 }}>Archived build</div>
      </PanelSectionRow>
      {entry.builds.length === 0 && (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6 }}>None kept for this game.</div></PanelSectionRow>
      )}
      {entry.builds.map((b) => {
        const incomplete = !buildIsComplete(b);
        const missingMaterial = (b.missingManifests?.length || 0)
          + Math.max(0, Object.keys(b.gids || {}).length - Object.keys(b.keys || {}).length);
        return (
          <PanelSectionRow key={b.buildid}>
            <div style={{ width: "100%" }}>
              <div style={{ flex: 1, fontSize: 11 }}>
                <div>Build <b>{b.buildid}</b> {b.date ? `· ${b.date}` : ""}</div>
                <div style={{ opacity: 0.65 }}>
                  {incomplete
                    ? <Pill text={`${missingMaterial} required item(s) missing`} tone="warn" />
                    : <Pill text="complete" tone="on" />}
                  {Object.keys(b.gids || {}).length} depot(s)
                  {b.archivedOn ? ` · archived ${b.archivedOn}` : ""}
                </div>
              </div>
            </div>
          </PanelSectionRow>
        );
      })}

      {/* Fixes */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}>
          Captured fixes ({entry.hasFixState ? entry.fixCount : "not captured"})
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1.45 }}>
          These fix records belong to this game snapshot and are restored with it.
        </div>
      </PanelSectionRow>
      {entry.hasFixState && entry.fixes.length === 0 && (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6 }}>No fixes recorded.</div></PanelSectionRow>
      )}
      {!entry.hasFixState && (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6 }}>Fix state was not available when this snapshot was captured.</div></PanelSectionRow>
      )}
      {entry.fixes.map((f) => (
        <PanelSectionRow key={f.key}>
          <div style={{ width: "100%" }}>
            <div style={{ flex: 1, fontSize: 11 }}>
              <div><b>{f.fixType || "fix"}</b> {f.files ? `· ${f.files} file(s)` : ""}</div>
              <div style={{ opacity: 0.65 }}>
                {f.wanted ? <Pill text="re-apply" tone="on" /> : <Pill text="ignored" />}
                {f.missing ? <Pill text="not applied now" tone="warn" /> : null}
                {f.appliedAt || f.date || ""}
              </div>
            </div>
          </div>
        </PanelSectionRow>
      ))}

      {note ? (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.8 }}>{note}</div></PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}

export function ArchiveSection() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      const r = await archiveEntries();
      setEntries(r.success ? (r.entries || []) : []);
      if (!r.success) setNote(r.error || "Could not read the archive");
    } catch (e) { setNote(`Failed: ${e}`); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) {
    return <PanelSection title="Archive"><PanelSectionRow>
      <div style={{ fontSize: 11, opacity: 0.7 }}>Reading the archive…</div>
    </PanelSectionRow></PanelSection>;
  }

  const current = entries.find((e) => e.appid === sel) || null;
  if (current) {
    return <GameDetail entry={current} onBack={() => setSel(null)} onChanged={load} />;
  }

  return (
    <PanelSection title="Archive">
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>
          One game record per title: a required complete build (gids, manifests and depot
          keys) plus fixes, launch arguments, Proton tool and DLC state when available.
          All of it rides along in the uninstall archive, so it survives removing the plugin.
        </div>
      </PanelSectionRow>

      {entries.length === 0 && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.65 }}>
            Nothing archived yet. Use “Archive game snapshot…” on a game's page to capture one.
          </div>
        </PanelSectionRow>
      )}

      {entries.map((e) => (
        <PanelSectionRow key={e.appid}>
          <ButtonItem layout="below" onClick={() => setSel(e.appid)}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13 }}>{e.name || `App ${e.appid}`}</div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>
                {e.buildCount ? <Pill text="build captured" /> : null}
                {e.fixCount ? <Pill text={`${e.fixCount} fixes`} tone="on" /> : null}
                {e.dlcFiles ? <Pill text={`${e.dlcFiles} DLC files`} /> : null}
                {e.compatTool ? <Pill text={e.compatTool} /> : null}
              </div>
            </div>
          </ButtonItem>
        </PanelSectionRow>
      ))}

      {note ? (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.8 }}>{note}</div></PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}
