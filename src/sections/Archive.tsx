import { PanelSection, PanelSectionRow, ButtonItem, DialogButton, Focusable, ConfirmModal, showModal } from "@decky/ui";
import { useEffect, useState } from "react";
import {
  ArchiveEntry,
  ArchivedFix,
  archiveEntries,
  archiveSetFixWanted,
  archiveForgetFix,
  archiveSnapshotGame,
  buildArchiveRemove,
  dlcDepotRemove,
  archiveActivate,
  archiveActivateGame,
  archiveRemoveGame,
  archiveDeactivate,
  archiveReconcile,
  triggerSteamInstall,
  validateSteamApp,
} from "../api";

/**
 * The Archive: one entry per game holding everything SLSDeck knows it should
 * be — kept builds, the fixes it wants, its launch arguments and Proton tool.
 *
 * Modelled on LumaDeck's list → detail layout (GameList → GameDetail) rather
 * than a flat table; it rejected tabs only because the QAM is cramped, and this
 * lives in the Options sidebar where there is room.
 *
 * Deliberately declarative. Every fix is a FLAG plus the metadata needed to
 * fetch it again — never a stored copy of its files. So the toggles here decide
 * what a restore should try to re-apply; they never touch the game themselves.
 * The only destructive controls are the explicit remove buttons.
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

  const toggleFix = async (f: ArchivedFix) => {
    setBusy(f.key);
    try {
      const r = await archiveSetFixWanted(entry.appid, f.key, !f.wanted);
      setNote(r.success
        ? `${f.fixType || "fix"} ${r.wanted ? "will be re-applied" : "will not be re-applied"} after a restore.`
        : (r.error || "Could not change that flag"));
      onChanged();
    } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
  };

  const forgetFix = async (f: ArchivedFix) => {
    setBusy(f.key);
    try {
      const r = await archiveForgetFix(entry.appid, f.key);
      setNote(r.success ? "Removed from the archive (the game is untouched)." : (r.error || "Failed"));
      onChanged();
    } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
  };

  /**
   * Activate = make this build the template the game must match, then close
   * the gaps immediately (pin, fixes, DLC). Deactivate = stop trailing and put
   * things back: unpin, clear launch args, then Steam's own file reset.
   *
   * Launch options and the reset trigger are done HERE rather than in the
   * backend because Steam owns both — SetAppLaunchOptions and the install/
   * validate calls only exist on the client side.
   */
  const toggleActive = (buildid: string) => {
    const isActive = entry.activeBuild === buildid;
    if (!isActive) {
      showModal(
        <ConfirmModal
          strTitle={`Activate build ${buildid}?`}
          strDescription={
            "This game will be held to this build: it gets pinned and downloaded, the recorded launch arguments are applied, flagged fixes are re-applied, and any archived DLC content is fetched once. Reversible."
          }
          strOKButtonText="Activate"
          onOK={async () => {
            setBusy(`act-${buildid}`);
            try {
              const a = await archiveActivate(entry.appid, buildid, readLaunchArgs());
              if (!a.success) { setNote(a.error || "Could not activate"); return; }
              const r = await archiveReconcile(entry.appid, true);
              // Steam-side pieces the backend deliberately does not touch.
              if (r.success) {
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
                ? `Activated. ${r.waiting || "The template applies once the game is installed."}`
                : did ? `Activated — ${did}.` : "Activated — the game already matches this build.");
              onChanged();
            } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
          }}
        />,
      );
      return;
    }
    showModal(
      <ConfirmModal
        strTitle={`Deactivate build ${buildid}?`}
        strDescription={
          "Stops holding the game to this build: unpins the manifest, clears the launch arguments, and asks Steam to reset the game's files. The archive entry and its fix flags are kept."
        }
        strOKButtonText="Deactivate"
        onOK={async () => {
          setBusy(`act-${buildid}`);
          try {
            const r = await archiveDeactivate(entry.appid, true);
            if (!r.success) { setNote(r.error || "Could not deactivate"); return; }
            runSteamSideCleanup(r);
            setNote(`Deactivated${r.unpinned ? " and unpinned" : ""} — Steam is resetting the game's files.`);
            onChanged();
          } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
        }}
      />,
    );
  };

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
    if (entry.activeBuild) { toggleActive(entry.activeBuild); return; }
    showModal(
      <ConfirmModal
        strTitle="Activate this game's template?"
        strDescription={
          (entry.buildCount > 1
            ? `This game has ${entry.buildCount} archived builds; the most recently archived one is used. Pick a specific build from the list below instead if you want an older one. `
            : "") +
          "The game gets pinned to the archived build and downloaded, its recorded launch arguments are applied, flagged fixes are re-applied and any archived DLC content is fetched once. Re-checked on every boot."
        }
        strOKButtonText="Activate"
        onOK={async () => {
          setBusy("game-active");
          try {
            const a = await archiveActivateGame(entry.appid, readLaunchArgs());
            if (!a.success) { setNote(a.error || "Could not activate"); return; }
            const r = await archiveReconcile(entry.appid, true);
            if (r.success) {
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
              ? `Activated build ${a.chosen}. ${r.waiting || "It applies once the game is installed."}`
              : did ? `Activated build ${a.chosen} — ${did}.` : `Activated build ${a.chosen} — already matching.`);
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

  const isActive = (buildid: string) => entry.activeBuild === buildid;

  const dropBuild = (buildid: string) => showModal(
    <ConfirmModal
      strTitle="Unarchive this build?"
      strDescription={
        (isActive(buildid)
          ? "This build is currently ACTIVE. It will be deactivated first — unpinned, launch arguments cleared and the game's files reset — and then removed from the archive. "
          : "") +
        `Forgets build ${buildid} and deletes the manifests no other archived build needs. The installed game's files are otherwise untouched.`
      }
      strOKButtonText="Unarchive"
      onOK={async () => {
        setBusy(buildid);
        try {
          const r = await buildArchiveRemove(entry.appid, buildid);
          if (!r.success) { setNote(r.error || "Failed"); return; }
          // The backend deactivates an active build before removing it, but the
          // Steam-side half (launch args, file reset) is only reachable here.
          const d = r.deactivated;
          runSteamSideCleanup(d);
          setNote(
            (d?.was ? `Deactivated and unarchived build ${buildid} — Steam is resetting the game's files. ` : `Unarchived build ${buildid}. `) +
            `${r.removedManifests ?? 0} manifest(s) freed.`,
          );
          onChanged();
        } catch (e) { setNote(`Failed: ${e}`); } finally { setBusy(""); }
      }}
    />,
  );

  const dropDlc = () => showModal(
    <ConfirmModal
      strTitle="Remove downloaded DLC files?"
      strDescription="Deletes only the files the DLC download created (never files it overwrote) and removes the DLC unlock."
      strOKButtonText="Remove"
      onOK={async () => {
        setBusy("dlc");
        try {
          const r = await dlcDepotRemove(entry.appid, true);
          setNote(r.success ? `Removed ${r.removed ?? 0} DLC file(s).` : (r.error || "Failed"));
          onChanged();
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
            ? `Deactivate (build ${entry.activeBuild})`
            : "Activate"}
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
          {entry.compatTool ? <> · Proton <b>{entry.compatTool}</b></> : <> · Proton <i>default</i></>}
          {entry.dlcFiles ? <> · <b>{entry.dlcFiles}</b> DLC file(s)</> : null}
          {entry.updatedOn ? <> · updated {entry.updatedOn}</> : null}
          {entry.launchOptions
            ? <div style={{ marginTop: 3, wordBreak: "break-all" }}>Launch args: <code>{entry.launchOptions}</code></div>
            : null}
        </div>
      </PanelSectionRow>

      {/* Builds */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, paddingTop: 4 }}>Archived builds ({entry.buildCount})</div>
      </PanelSectionRow>
      {entry.builds.length === 0 && (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6 }}>None kept for this game.</div></PanelSectionRow>
      )}
      {entry.builds.map((b) => {
        const incomplete = !buildIsComplete(b);
        return (
          <PanelSectionRow key={b.buildid}>
            <Focusable style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
              <div style={{ flex: 1, fontSize: 11 }}>
                <div>Build <b>{b.buildid}</b> {b.date ? `· ${b.date}` : ""}</div>
                <div style={{ opacity: 0.65 }}>
                  {incomplete
                    ? <Pill text={`${b.missingManifests!.length} manifest(s) missing`} tone="warn" />
                    : <Pill text="complete" tone="on" />}
                  {Object.keys(b.gids || {}).length} depot(s)
                  {b.archivedOn ? ` · archived ${b.archivedOn}` : ""}
                </div>
              </div>
              <DialogButton
                style={{ width: 104, minWidth: 104, fontSize: 11, padding: "4px 6px" }}
                disabled={!!busy || incomplete}
                onClick={() => toggleActive(b.buildid)}
              >
                {busy === `act-${b.buildid}` ? "…"
                  : entry.activeBuild === b.buildid ? "Deactivate" : "Activate"}
              </DialogButton>
              <DialogButton
                style={{ width: 90, minWidth: 90, fontSize: 11, padding: "4px 6px" }}
                disabled={!!busy}
                onClick={() => dropBuild(b.buildid)}
              >{busy === b.buildid ? "…" : "Unarchive"}</DialogButton>
            </Focusable>
          </PanelSectionRow>
        );
      })}

      {/* Fixes */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}>
          Fixes ({entry.wantedFixes}/{entry.fixCount} flagged)
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 10, opacity: 0.6, lineHeight: 1.45 }}>
          Flagged fixes are re-applied after a build restore. Toggling here changes
          nothing on disk — it only records what this game should have.
        </div>
      </PanelSectionRow>
      {entry.fixes.length === 0 && (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.6 }}>No fixes recorded.</div></PanelSectionRow>
      )}
      {entry.fixes.map((f) => (
        <PanelSectionRow key={f.key}>
          <Focusable style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
            <div style={{ flex: 1, fontSize: 11 }}>
              <div><b>{f.fixType || "fix"}</b> {f.files ? `· ${f.files} file(s)` : ""}</div>
              <div style={{ opacity: 0.65 }}>
                {f.wanted ? <Pill text="re-apply" tone="on" /> : <Pill text="ignored" />}
                {f.missing ? <Pill text="not applied now" tone="warn" /> : null}
                {f.appliedAt || f.date || ""}
              </div>
            </div>
            <DialogButton
              style={{ width: 76, minWidth: 76, fontSize: 11, padding: "4px 6px" }}
              disabled={!!busy}
              onClick={() => toggleFix(f)}
            >{busy === f.key ? "…" : f.wanted ? "Unflag" : "Flag"}</DialogButton>
            <DialogButton
              style={{ width: 76, minWidth: 76, fontSize: 11, padding: "4px 6px" }}
              disabled={!!busy}
              onClick={() => forgetFix(f)}
            >Forget</DialogButton>
          </Focusable>
        </PanelSectionRow>
      ))}

      {entry.dlcFiles > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!!busy} onClick={dropDlc}>
            {busy === "dlc" ? "Working…" : `Remove ${entry.dlcFiles} downloaded DLC file(s)`}
          </ButtonItem>
        </PanelSectionRow>
      )}

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

  const snapshotCurrent = async () => {
    // Launch options live in Steam, not in our backend, so read them here and
    // hand them over — otherwise the entry would silently lose them.
    setNote("Recording current state…");
    try {
      let saved = 0;
      for (const e of entries) {
        let opts: string | null = null;
        try {
          const SC: any = (window as any).SteamClient;
          const details = SC?.Apps?.GetLaunchOptionsForApp?.(e.appid);
          if (typeof details === "string") opts = details;
        } catch { /* Steam may not expose it; the backend keeps the prior value */ }
        const r = await archiveSnapshotGame(e.appid, opts, "", e.name);
        if (r.success) saved += 1;
      }
      setNote(`Updated ${saved} entr${saved === 1 ? "y" : "ies"}.`);
      await load();
    } catch (e) { setNote(`Failed: ${e}`); }
  };

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
          What SLSDeck keeps for each game: archived builds (gids, manifests and depot
          keys), which fixes it should have, its launch arguments and Proton tool.
          All of it rides along in the uninstall archive, so it survives removing the plugin.
        </div>
      </PanelSectionRow>

      {entries.length === 0 && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.65 }}>
            Nothing archived yet. Use “Add this build to archive…” on a game's page to keep a build.
          </div>
        </PanelSectionRow>
      )}

      {entries.map((e) => (
        <PanelSectionRow key={e.appid}>
          <ButtonItem layout="below" onClick={() => setSel(e.appid)}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13 }}>{e.name || `App ${e.appid}`}</div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>
                {e.buildCount ? <Pill text={`${e.buildCount} build${e.buildCount === 1 ? "" : "s"}`} /> : null}
                {e.fixCount ? <Pill text={`${e.wantedFixes}/${e.fixCount} fixes`} tone={e.wantedFixes ? "on" : "dim"} /> : null}
                {e.dlcFiles ? <Pill text={`${e.dlcFiles} DLC files`} /> : null}
                {e.compatTool ? <Pill text={e.compatTool} /> : null}
              </div>
            </div>
          </ButtonItem>
        </PanelSectionRow>
      ))}

      {entries.length > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={snapshotCurrent}>
            Refresh recorded fixes / launch args
          </ButtonItem>
        </PanelSectionRow>
      )}

      {note ? (
        <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.8 }}>{note}</div></PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}
