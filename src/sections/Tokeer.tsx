import { ButtonItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { useEffect, useState } from "react";
import { tokeerQuotaProbe, TokeerQuotaProbe } from "../api";

function pretty(value: any): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

/** Tokeer-backed Anti-Denuvo page. */
export function TokeerSection() {
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<TokeerQuotaProbe | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      setProbe(await tokeerQuotaProbe());
    } catch (e) {
      setProbe({ success: false, status: 0, raw: "", json: null, error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const body = probe?.json != null ? pretty(probe.json) : (probe?.raw || "");

  return (
    <>
      <PanelSection title="Tokeer availability probe">
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.72, lineHeight: 1.45 }}>
            Live diagnostic request to Tokeer's public <code>/quota</code> endpoint. This is intentionally
            shown raw until we know whether it exposes game inventory, per-user quota, or another schema.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={refresh} disabled={busy}>
            {busy ? "Checking quota…" : "Refresh quota"}
          </ButtonItem>
        </PanelSectionRow>
        {busy && (
          <PanelSectionRow>
            <div style={{ fontSize: 12 }}><Spinner style={{ width: 14, height: 14, marginRight: 8 }} />Contacting luastools.xyz…</div>
          </PanelSectionRow>
        )}
        {probe && !busy && (
          <PanelSectionRow>
            <div style={{ width: "100%", fontSize: 11 }}>
              <div style={{ marginBottom: 6 }}>
                HTTP: <b>{probe.status || "network error"}</b>{probe.contentType ? ` · ${probe.contentType}` : ""}
              </div>
              {probe.error && <div style={{ marginBottom: 8, color: "#f5a623" }}>{probe.error}</div>}
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 420, overflowY: "auto", margin: 0 }}>
                {body || "(empty response)"}
              </pre>
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>
    </>
  );
}
