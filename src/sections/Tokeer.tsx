import { ButtonItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { useEffect, useState } from "react";
import {
  chooseSelectorOption,
  openSelectorAndReadOptions,
  openTokeerDiscord,
  readTokeerDiscord,
  TokeerDiscordState,
} from "../lib/tokeerDiscordCapture";

/** Tokeer Anti-Denuvo page backed by the user's authenticated Discord CEF tab. */
export function TokeerSection() {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<TokeerDiscordState | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [action, setAction] = useState("");

  const refresh = async () => {
    setBusy(true);
    try { setState(await readTokeerDiscord()); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const openMenu = async (index: number) => {
    setAction("Opening Discord selector…");
    setOpenIndex(index);
    const items = await openSelectorAndReadOptions(index);
    setOptions(items);
    setAction(items.length ? "" : "No options found. Keep the Discord message open and try again.");
  };

  const choose = async (index: number, label: string) => {
    setAction(`Selecting ${label} in Discord…`);
    const ok = await chooseSelectorOption(index, label);
    setAction(ok ? `Selected ${label}. Continue in the Discord flow if it opens a prompt.` : "Discord option click failed.");
    setOptions([]);
    setOpenIndex(null);
    setTimeout(refresh, 800);
  };

  return (
    <>
      <PanelSection title="Tokeer live panel">
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.72, lineHeight: 1.45 }}>
            Mirrors the Linux activation panel from your own logged-in Discord tab. SLSDeck reads the rendered message through Steam CEF/CDP; it does not store your Discord cookie or token.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => { openTokeerDiscord(); setTimeout(refresh, 1800); }}>
            Open Tokeer Discord
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={refresh} disabled={busy}>
            {busy ? "Reading Discord…" : "Refresh live info"}
          </ButtonItem>
        </PanelSectionRow>
        {busy && <PanelSectionRow><div style={{ fontSize: 12 }}><Spinner style={{ width: 14, height: 14, marginRight: 8 }} />Reading the Tokeer message…</div></PanelSectionRow>}
        {state && !state.found && (
          <PanelSectionRow>
            <div style={{ fontSize: 11, color: "#f5a623", lineHeight: 1.45 }}>{state.error || "Tokeer Discord message not found."}</div>
          </PanelSectionRow>
        )}
      </PanelSection>

      {state?.found && (
        <>
          <PanelSection title="Live status">
            <PanelSectionRow><div style={{ fontSize: 13 }}>Steam: <b>{state.steamStatus || "Unknown"}</b></div></PanelSectionRow>
            <PanelSectionRow>
              <div style={{ width: "100%", fontSize: 12, lineHeight: 1.7 }}>
                <div>Games listed: <b>{state.gamesListed ?? "?"}</b></div>
                <div>Keys remaining: <b>{state.keysRemaining ?? "?"}</b></div>
                <div>High demand: <b>{state.highDemand ?? "?"}</b></div>
              </div>
            </PanelSectionRow>
          </PanelSection>

          <PanelSection title="Request activation">
            {(state.selectors || []).map((s) => (
              <PanelSectionRow key={s.index}>
                <ButtonItem layout="below" disabled={s.disabled} onClick={() => openMenu(s.index)}>
                  {s.label || `Game menu ${s.index + 1}`}
                </ButtonItem>
              </PanelSectionRow>
            ))}
            {action && <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.8 }}>{action}</div></PanelSectionRow>}
          </PanelSection>
        </>
      )}

      {openIndex != null && options.length > 0 && (
        <PanelSection title="Games">
          {options.map((label) => (
            <PanelSectionRow key={label}>
              <ButtonItem layout="below" onClick={() => choose(openIndex, label)}>{label}</ButtonItem>
            </PanelSectionRow>
          ))}
        </PanelSection>
      )}
    </>
  );
}
