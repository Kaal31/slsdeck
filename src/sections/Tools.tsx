import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { useEffect, useState } from "react";
import {
  engineIsMoon,
  ensureMoonEngine,
  provisionDepots,
  downloadPreflight,
  downloadDiagnosis,
  clearPhantomInstall,
  getStorageInfo,
  cleanTempDownloads,
  syncAllAddedArt,
  runSystemAudit,
  autoRepairSystem,
  createBackup,
  currentLibraryAppId,
  repairConflicts,
} from "../api";

/**
 * Diagnostics and whole-library maintenance.
 *
 * Engine identity is shown first and deliberately: on stock SLSsteam an added
 * game can never decrypt its depots, and the only symptom is a silent failure
 * to download. Everything else here is a one-tap action that reports what it
 * actually did rather than just toasting "done".
 */
export function ToolsSection() {
  const [busy, setBusy] = useState("");
  const [engine, setEngine] = useState<{ installed: boolean; moon: boolean } | null>(null);
  const [note, setNote] = useState("");
  // The health check used to report "fixable: a, b, c" and then offer no way to
  // fix any of it. auto_repair_system existed the whole time with no caller.
  const [repairable, setRepairable] = useState<string[]>([]);

  useEffect(() => {
    engineIsMoon().then((r) => setEngine(r || null)).catch(() => {});
  }, []);

  const run = async (id: string, fn: () => Promise<any>, describe: (r: any) => string) => {
    setBusy(id);
    setNote("");
    try {
      setNote(describe((await fn()) || {}));
    } catch (e) {
      setNote(`Failed: ${e}`);
    }
    setBusy("");
  };

  const appid = currentLibraryAppId();
  const engineOk = engine && engine.moon;
  const engineText =
    engine == null
      ? "checking…"
      : engine.installed
        ? engineOk
          ? "slsteam-moon (correct)"
          : "stock SLSsteam — added games cannot download"
        : "not installed";

  return (
    <PanelSection title="Tools & Diagnostics">
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.85, padding: "2px 0" }}>
          Engine:{" "}
          <span
            style={{
              color: engine == null ? "inherit" : engineOk ? "#47c87c" : "#e5533c",
              fontWeight: 600,
            }}
          >
            {engineText}
          </span>
        </div>
      </PanelSectionRow>

      {!engineOk && engine != null && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy}
            onClick={() =>
              run("engine", () => ensureMoonEngine(), (r) =>
                r.changed ? "Reinstalled slsteam-moon — restart Steam." : r.error || "No change",
              )
            }
          >
            {busy === "engine" ? "Installing engine…" : "Install the correct engine"}
          </ButtonItem>
        </PanelSectionRow>
      )}

      {appid != null && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy}
            onClick={() =>
              run(
                "check",
                async () => {
                  const p = await downloadPreflight(appid);
                  if (p && p.ready === false) return { kind: "pre", p };
                  return { kind: "diag", d: await downloadDiagnosis(appid) };
                },
                (r) =>
                  r.kind === "pre"
                    ? `Not ready: ${(r.p.failed || []).join(", ")}`
                    : (r.d && r.d.summary) || "No install attempt recorded yet",
              )
            }
          >
            {busy === "check" ? "Checking…" : "Why won't this game download?"}
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("prov", () => provisionDepots(), (r) =>
              `Re-applied ${(r.keys || {}).written || 0} depot key(s), ${r.manifestsCopied || 0} manifest(s)`,
            )
          }
        >
          {busy === "prov" ? "Re-applying…" : "Re-apply depot keys"}
        </ButtonItem>
      </PanelSectionRow>

      {appid != null && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy}
            onClick={() =>
              run("phantom", () => clearPhantomInstall(appid), (r) =>
                r.cleared ? "Cleared — Steam will offer to install again." : "Nothing to clear.",
              )
            }
          >
            {busy === "phantom" ? "Clearing…" : 'Fix "installed" but empty'}
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("storage", () => getStorageInfo(), (r) => {
              const l = r.libraries || r.drives || [];
              return l.length
                ? l.map((d: any) => `${d.label || d.path}: ${d.freeGB ?? "?"} GB free`).join(" · ")
                : "No libraries found";
            })
          }
        >
          {busy === "storage" ? "Reading…" : "Show drive space"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("clean", () => cleanTempDownloads(), (r) =>
              `Freed ${r.cleanedMB ?? 0} MB from ${r.cleanedFiles ?? 0} temp file(s)`,
            )
          }
        >
          {busy === "clean" ? "Cleaning…" : "Clean temporary download files"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("art", () => syncAllAddedArt(false), (r) =>
              `Artwork synced for ${r.synced ?? r.count ?? 0} game(s)`,
            )
          }
        >
          {busy === "art" ? "Fetching artwork…" : "Fetch missing library artwork"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("audit", () => runSystemAudit(), (r) => {
              const codes = r.repairableCodes || [];
              setRepairable(codes);
              return `Health ${r.healthScore ?? "?"}%${
                codes.length ? " — fixable: " + codes.join(", ") : " — nothing to repair"
              }`;
            })
          }
        >
          {busy === "audit" ? "Checking…" : "Run health check"}
        </ButtonItem>
      </PanelSectionRow>

      {repairable.length > 0 && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={!!busy}
            onClick={() =>
              run("repair", () => autoRepairSystem(), (r) => {
                const done = r.repairsDone || r.repairs || [];
                const errs = r.errors || [];
                if (done.length) setRepairable([]);
                return done.length
                  ? `Repaired ${done.length} item(s): ${done.join("; ")}${
                      errs.length ? ` — ${errs.length} still failing` : ""
                    }`
                  : errs.length
                    ? `Could not repair: ${errs.join("; ")}`
                    : "Nothing needed repairing.";
              })
            }
          >
            {busy === "repair" ? "Repairing…" : `Repair what the check found (${repairable.length})`}
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("conflicts", () => repairConflicts(), (r) => {
              const rm = r.removed || [];
              const notes = r.notes || [];
              if (!rm.length && !notes.length)
                return "No conflicts found (Millennium / system slssteam).";
              return [rm.length ? `Removed: ${rm.join(", ")}` : "", ...notes]
                .filter(Boolean)
                .join(" · ");
            })
          }
        >
          {busy === "conflicts" ? "Repairing…" : "Repair engine conflicts (Millennium / system slssteam)"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={!!busy}
          onClick={() =>
            run("backup", () => createBackup("", false, true), (r) =>
              r.success ? `Backup saved to ${r.path}` : r.error || "Backup failed",
            )
          }
        >
          {busy === "backup" ? "Backing up…" : "Back up my added games"}
        </ButtonItem>
      </PanelSectionRow>

      {note ? (
        <PanelSectionRow>
          <div
            style={{
              fontSize: 11,
              opacity: 0.8,
              lineHeight: 1.4,
              padding: "2px 0",
              wordBreak: "break-word",
            }}
          >
            {note}
          </div>
        </PanelSectionRow>
      ) : null}
    </PanelSection>
  );
}
