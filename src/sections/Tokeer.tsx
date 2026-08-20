import { ButtonItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { useEffect, useState } from "react";
import { tokeerQuotaProbe } from "../api";

function pretty(value: any): string {
  try {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

type ProbeResult = {
  method: string;
  path: string;
  success: boolean;
  status: number;
  url?: string;
  json: any;
  raw: string;
  contentType?: string;
  parseError?: string;
  error?: string;
};

type ProbeMatrix = {
  success: boolean;
  base?: string;
  results?: ProbeResult[];
  error?: string;
};

/** Tokeer-backed Anti-Denuvo page. */
export function TokeerSection() {
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<ProbeMatrix | null>(null);

  const refresh = async () => {
    setBusy(true);
    try {
      setProbe((await tokeerQuotaProbe()) as any);
    } catch (e) {
      setProbe({ success: false, results: [], error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <>
      <PanelSection title="Tokeer availability probe">
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.72, lineHeight: 1.45 }}>
            Read-only diagnostic probe of Tokeer's public quota routes. No activation code is redeemed or generated.
            Responses stay raw until we identify the live inventory schema.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={refresh} disabled={busy}>
            {busy ? "Checking routes…" : "Refresh quota routes"}
          </ButtonItem>
        </PanelSectionRow>
        {busy && (
          <PanelSectionRow>
            <div style={{ fontSize: 12 }}>
              <Spinner style={{ width: 14, height: 14, marginRight: 8 }} />
              Probing luastools.xyz…
            </div>
          </PanelSectionRow>
        )}
        {probe?.error && !busy && (
          <PanelSectionRow>
            <div style={{ fontSize: 11, color: "#f5a623" }}>{probe.error}</div>
          </PanelSectionRow>
        )}
        {!busy && (probe?.results || []).map((r, idx) => {
          const body = r.json != null ? pretty(r.json) : (r.raw || "");
          return (
            <PanelSectionRow key={`${r.method}-${r.path}-${idx}`}>
              <div style={{ width: "100%", fontSize: 11 }}>
                <div style={{ marginBottom: 5, fontWeight: 600 }}>
                  {r.method} {r.path}
                </div>
                <div style={{ marginBottom: 6 }}>
                  HTTP: <b>{r.status || "network error"}</b>{r.contentType ? ` · ${r.contentType}` : ""}
                </div>
                {r.error && <div style={{ marginBottom: 8, color: "#f5a623" }}>{r.error}</div>}
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 220, overflowY: "auto", margin: 0 }}>
                  {body || "(empty response)"}
                </pre>
              </div>
            </PanelSectionRow>
          );
        })}
      </PanelSection>
    </>
  );
}
