import { ButtonItem, Navigation, PanelSection, PanelSectionRow } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { MinigameItem, minigameRoll } from "../api";
import { listLibraryAppIds } from "../lib/ownership";

const CARD_WIDTH = 154;
const CARD_GAP = 8;
const DURATION = 5700;

function tone(frequency: number, duration: number, gain = .035): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    volume.gain.setValueAtTime(gain, context.currentTime);
    volume.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    oscillator.connect(volume); volume.connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
    oscillator.onended = () => context.close();
  } catch { /* audio is ornamental */ }
}

export function MinigameSection() {
  const viewport = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const [items, setItems] = useState<MinigameItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<MinigameItem>();
  const [error, setError] = useState("");

  useEffect(() => () => cancelAnimationFrame(animation.current), []);

  const openWinner = () => {
    if (!winner) return;
    try { Navigation.NavigateToExternalWeb(`https://store.steampowered.com/app/${winner.appid}`); } catch { /* ignore */ }
  };

  const roll = async () => {
    if (busy) return;
    cancelAnimationFrame(animation.current);
    setBusy(true); setWinner(undefined); setError(""); setItems([]); setOffset(0);
    try {
      const result = await minigameRoll(listLibraryAppIds());
      if (!result.success || !result.items?.length || result.winnerIndex === undefined || !result.winner) {
        throw new Error(result.error || "The Steam Store did not return a game");
      }
      setItems(result.items);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const width = viewport.current?.clientWidth || 760;
      const target = Math.max(0, result.winnerIndex * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2 - width / 2);
      const started = performance.now();
      let previousCard = -1;
      const frame = (now: number) => {
        const progress = Math.min(1, (now - started) / DURATION);
        const eased = 1 - Math.pow(1 - progress, 4);
        const position = target * eased;
        setOffset(position);
        const card = Math.floor((position + width / 2) / (CARD_WIDTH + CARD_GAP));
        if (card !== previousCard) { previousCard = card; tone(260 + Math.min(card, 18) * 7, .035); }
        if (progress < 1) animation.current = requestAnimationFrame(frame);
        else {
          setWinner(result.winner);
          setBusy(false);
          tone(523, .12, .05); window.setTimeout(() => tone(784, .2, .045), 115);
        }
      };
      animation.current = requestAnimationFrame(frame);
    } catch (cause: any) {
      setError(String(cause?.message || cause)); setBusy(false);
    }
  };

  return <PanelSection title="Store Roulette">
    <PanelSectionRow><div style={{ fontSize: 11, opacity: .72, lineHeight: 1.45 }}>
      Crack open the entire Steam Store. The winning game is selected from live Store AppIDs and games already in your library are excluded.
    </div></PanelSectionRow>
    <PanelSectionRow><div ref={viewport} style={{
      position: "relative", width: "100%", height: 154, overflow: "hidden", borderRadius: 11,
      border: "1px solid rgba(115, 190, 255, .34)", background: "linear-gradient(180deg, #0b1420, #111d2b)",
      boxShadow: "inset 0 0 36px rgba(0,0,0,.65), 0 8px 24px rgba(0,0,0,.26)",
    }}>
      <div style={{ position: "absolute", zIndex: 4, left: "50%", top: 0, bottom: 0, width: 2, transform: "translateX(-1px)", background: "linear-gradient(#ffd86a, #ff9c32, #ffd86a)", boxShadow: "0 0 13px #ffb23f" }} />
      <div style={{ position: "absolute", zIndex: 5, left: "50%", top: 0, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "11px solid #ffd86a" }} />
      {!items.length && <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", opacity: .62, letterSpacing: .5 }}>
        {busy ? "LOADING THE STEAM STORE…" : "A RANDOM GAME AWAITS"}
      </div>}
      <div style={{ display: "flex", gap: CARD_GAP, height: "100%", padding: "9px 0", transform: `translate3d(${-offset}px,0,0)`, willChange: "transform" }}>
        {items.map((item, index) => <div key={`${item.appid}-${index}`} style={{
          position: "relative", flex: `0 0 ${CARD_WIDTH}px`, height: 134, overflow: "hidden", borderRadius: 7,
          border: "1px solid rgba(255,255,255,.14)", background: "linear-gradient(145deg,#23354a,#111c29)",
        }}>
          <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} style={{ width: "100%", height: 86, objectFit: "cover", opacity: .86 }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 48, padding: "7px 8px 5px", boxSizing: "border-box", background: "linear-gradient(180deg,rgba(12,20,31,.87),#0b121d)", borderTop: `3px solid ${index % 11 === 0 ? "#d96cff" : index % 5 === 0 ? "#8d7bff" : "#5db7e8"}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.16, maxHeight: 25, overflow: "hidden" }}>{item.name}</div>
          </div>
        </div>)}
      </div>
    </div></PanelSectionRow>
    {winner && <PanelSectionRow><div style={{ padding: "11px 12px", borderRadius: 9, border: "1px solid rgba(255,188,77,.42)", background: "linear-gradient(120deg,rgba(95,56,17,.72),rgba(38,27,47,.8))" }}>
      <div style={{ fontSize: 10, color: "#ffc765", fontWeight: 800, letterSpacing: 1 }}>UNLOCKED</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{winner.name}</div>
      {winner.shortDescription && <div style={{ fontSize: 10, opacity: .7, marginTop: 5, lineHeight: 1.35 }}>{winner.shortDescription}</div>}
      {winner.isFree && <div style={{ fontSize: 10, color: "#84e3a5", fontWeight: 700, marginTop: 5 }}>Free to play</div>}
    </div></PanelSectionRow>}
    {error && <PanelSectionRow><div style={{ color: "#ff8b83", fontSize: 11 }}>{error}</div></PanelSectionRow>}
    <PanelSectionRow><ButtonItem layout="below" disabled={busy} onClick={roll}>{busy ? "Opening…" : winner ? "Open another" : "Open Store case"}</ButtonItem></PanelSectionRow>
    {winner && <PanelSectionRow><ButtonItem layout="below" onClick={openWinner}>View {winner.name} in Store</ButtonItem></PanelSectionRow>}
  </PanelSection>;
}
