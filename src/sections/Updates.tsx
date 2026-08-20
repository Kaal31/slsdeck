import { PanelSection, PanelSectionRow, ToggleField, ButtonItem } from "@decky/ui";
import { ScrollableResult } from "../components/ScrollableResult";
import { useEffect, useState } from "react";
import { updatesCheck, updatesUpdateAll, getAutoUpdate, setAutoUpdate, UpdateItem,
  getCheckEngineUpdates, setCheckEngineUpdates, getCheckHeadcrabUpdates, setCheckHeadcrabUpdates } from "../api";

/**
 * Tool updates — keeps every GitHub-sourced tool/DLL (SmokeAPI, CreamAPI, Uplay
 * unlockers, OpenSave) on the latest release, checked on boot. Proton and the HV
 * module are large / system-specific, so they are only flagged here.
 */
export function UpdatesSection() {
  const [ups, setUps] = useState<UpdateItem[]>([]);
  const [autoUp, setAutoUp] = useState(true);
  const [engineUp, setEngineUp] = useState(false);
  const [headcrabUp, setHeadcrabUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try { setUps((await updatesCheck()).items || []); } catch { /* */ }
    try { setAutoUp(!!(await getAutoUpdate()).enabled); } catch { /* */ }
    try { setEngineUp(!!(await getCheckEngineUpdates()).enabled); } catch { /* */ }
    try { setHeadcrabUp(!!(await getCheckHeadcrabUpdates()).enabled); } catch { /* */ }
  };
  useEffect(() => { load(); }, []);

  const updatable = ups.filter((u) => u.updateAvailable);

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
    <PanelSection title="Tool updates">
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
          Check for updates
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
  );
}
