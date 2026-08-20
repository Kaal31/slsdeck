import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  ToggleField,
  Focusable,
  Spinner,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import { createBackup, restoreBackup, listBackups } from "../api";

function fmtSize(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function fmtDate(mtime: number): string {
  try {
    return new Date(mtime * 1000).toLocaleString();
  } catch {
    return "";
  }
}

/**
 * Export / import an SLSDeck setup — the SLSsteam config (added games), the
 * ManifestStore, depot keys, stplug-in luas, and plugin settings — as a single
 * .tar.gz in ~/Downloads. Restore lands them back in place but does NOT
 * re-activate injection (do that manually after, in case the client drifted).
 */
export function BackupSection() {
  const [includeKeys, setIncludeKeys] = useState(false);
  const [includeSaves, setIncludeSaves] = useState(true);
  const [busy, setBusy] = useState(false);
  const [backups, setBackups] = useState<{ path: string; name: string; sizeBytes: number; mtime: number }[]>([]);
  const [confirmPath, setConfirmPath] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await listBackups();
      if (r.success) setBackups(r.backups || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const doExport = async () => {
    setBusy(true);
    try {
      const r = await createBackup("", includeKeys, includeSaves);
      if (r.success) {
        toaster.toast({
          title: "SLSDeck backup",
          body: `Saved ${r.fileCount ?? 0} files${r.saveCount ? ` (incl. ${r.saveCount} save files)` : ""} (${fmtSize(r.sizeBytes ?? 0)}) to Downloads${includeKeys ? "" : " — keys excluded"}`,
        });
        refresh();
      } else {
        toaster.toast({ title: "SLSDeck backup", body: r.error || "Export failed" });
      }
    } catch (e) {
      toaster.toast({ title: "SLSDeck backup", body: String(e) });
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (path: string) => {
    setBusy(true);
    setConfirmPath(null);
    try {
      const r = await restoreBackup(path);
      if (r.success) {
        toaster.toast({
          title: "SLSDeck restore",
          body: `Restored ${r.restoredCount ?? 0} files. Re-activate injection + restart Steam to apply.`,
        });
      } else {
        toaster.toast({ title: "SLSDeck restore", body: r.error || "Restore failed" });
      }
    } catch (e) {
      toaster.toast({ title: "SLSDeck restore", body: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelSection title="Backup & restore">
      <PanelSectionRow>
        <ToggleField
          label="Include API keys"
          description="Off (default): your saved API keys are stripped from the export. On: keys are included — keep the file private."
          checked={includeKeys}
          disabled={busy}
          onChange={setIncludeKeys}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Include game saves"
          description="On (default): also back up each installed SLSDeck game's Proton-prefix saves (AppData, Saved Games, Documents). Can make the archive large."
          checked={includeSaves}
          disabled={busy}
          onChange={setIncludeSaves}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={doExport} disabled={busy}>
          {busy ? "Working…" : "Export backup to Downloads"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          Backs up added games, manifests, depot keys, luas, and settings to
          ~/Downloads/slsdeck_backup_&lt;time&gt;.tar.gz.
        </div>
      </PanelSectionRow>

      {busy && (
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <Spinner style={{ width: 16, height: 16 }} /> Working…
          </div>
        </PanelSectionRow>
      )}

      {backups.length === 0 ? (
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.7 }}>No backups found in Downloads.</div>
        </PanelSectionRow>
      ) : (
        backups.map((b) => (
          <div key={b.path}>
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => (confirmPath === b.path ? doRestore(b.path) : setConfirmPath(b.path))}
                disabled={busy}
              >
                <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontWeight: 600, color: confirmPath === b.path ? "#f5a623" : undefined }}>
                    {confirmPath === b.path ? "Tap again to confirm restore" : `Restore ${b.name}`}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {fmtSize(b.sizeBytes)} · {fmtDate(b.mtime)}
                  </span>
                </Focusable>
              </ButtonItem>
            </PanelSectionRow>
          </div>
        ))
      )}

      <PanelSectionRow>
        <div style={{ fontSize: 11, color: "#f5a623", padding: "2px 2px" }}>
          ⚠ Restore overwrites current config, manifests, and settings, then hands
          them back to you — but does NOT re-activate injection. After restoring,
          run the client fix if needed, then Activate injection and restart Steam.
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
