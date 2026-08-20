import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Focusable,
  showModal,
  ConfirmModal,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import { InstalledApp, deleteLua, getInstalledApps, purgeAllAdded } from "../api";

interface Props {
  refreshToken: number;
  onChanged: () => void;
}

function sourceLabel(s: InstalledApp["source"]): string {
  if (s === "slssteam") return "SLSsteam";
  if (s === "both") return "SLSsteam + Lua";
  return "Lua";
}

export function InstalledSection({ refreshToken, onChanged }: Props) {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getInstalledApps();
      setApps(res.success ? res.apps : []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshToken]);

  const confirmPurge = () => {
    showModal(
      <ConfirmModal
        strTitle="Purge all added games?"
        strDescription={`This removes ALL ${apps.length} added game(s) from SLSsteam — every AdditionalApps registration and its lua manifest — and clears the added-games history. It does NOT delete installed game files. Restart Steam afterwards. This cannot be undone (restore a backup if you need them back).`}
        strOKButtonText="Purge all"
        onOK={async () => {
          try {
            const res = await purgeAllAdded();
            if (res.success) {
              toaster.toast({ title: "SLSDeck", body: `Purged ${res.removed} game(s)` });
              await load();
              onChanged();
            }
          } catch (e) {
            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
          }
        }}
      />
    );
  };

  const confirmDelete = (a: InstalledApp) => {
    showModal(
      <ConfirmModal
        strTitle={`Remove ${a.gameName}?`}
        strDescription={`This removes AppID ${a.appid} from SLSsteam and deletes any Lua script. Restart Steam afterwards for it to disappear.`}
        strOKButtonText="Remove"
        onOK={async () => {
          try {
            const res = await deleteLua(a.appid);
            if (res.success) {
              toaster.toast({ title: "SLSDeck", body: `Removed ${a.gameName}` });
              await load();
              onChanged();
            }
          } catch (e) {
            toaster.toast({ title: "SLSDeck", body: `Error: ${e}` });
          }
        }}
      />
    );
  };

  return (
    <PanelSection title={`Installed games${apps.length ? ` (${apps.length})` : ""}`}>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={load}>
          {loading ? "Refreshing…" : "Refresh list"}
        </ButtonItem>
      </PanelSectionRow>
      {apps.length > 0 && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={confirmPurge} disabled={loading}>
            Purge list (remove all added games)
          </ButtonItem>
        </PanelSectionRow>
      )}

      {!loading && apps.length === 0 && (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.6, padding: "4px 0" }}>
            No games added yet.
          </div>
        </PanelSectionRow>
      )}

      {apps.map((a) => (
        <PanelSectionRow key={`${a.appid}-${a.source}`}>
          <ButtonItem layout="below" onClick={() => confirmDelete(a)}>
            <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <span style={{ fontWeight: 600 }}>
                {a.gameName}
                {a.isDisabled ? " (disabled)" : ""}
              </span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>
                AppID {a.appid} · {sourceLabel(a.source)} · tap to remove
              </span>
            </Focusable>
          </ButtonItem>
        </PanelSectionRow>
      ))}

      {apps.length > 0 && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.6, padding: "2px 0" }}>
            Use "Reload Steam" in Game controls (top) to apply changes.
          </div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}
