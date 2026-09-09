import { ButtonItem, DialogCheckbox, Navigation, PanelSection, PanelSectionRow } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { MinigameItem, minigameRoll } from "../api";
import { listLibraryAppIds } from "../lib/ownership";

const CARD_WIDTH = 300;
const CARD_GAP = 10;
const DURATION = 5700;
const CASE_SOUND_URL = "https://raw.githubusercontent.com/buzacristian/Case-Simulator/main/Audio/CSGO%20Case%20Opening%20Sound%20Effect.mp3";
const PRICE_MODES = [
  { label: "Random", cents: 0 },
  { label: "$60+", cents: 6000 },
  { label: "$100+", cents: 10000 },
  { label: "$1000+", cents: 100000 },
];

export function MinigameSection() {
  const viewport = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const caseSounds = useRef<HTMLAudioElement[]>([]);
  const [items, setItems] = useState<MinigameItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<MinigameItem>();
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const activePriceLabel = PRICE_MODES.find((mode) => mode.cents === minPrice)?.label || "Random";

  useEffect(() => {
    caseSounds.current = [new Audio(CASE_SOUND_URL), new Audio(CASE_SOUND_URL)];
    caseSounds.current.forEach((sound) => {
      sound.preload = "auto";
      sound.volume = 1;
    });
    return () => {
      cancelAnimationFrame(animation.current);
      caseSounds.current.forEach((sound) => sound.pause());
      caseSounds.current = [];
    };
  }, []);

  const openWinner = () => {
    if (!winner) return;
    try { Navigation.NavigateToExternalWeb(`https://store.steampowered.com/app/${winner.appid}`); } catch { /* ignore */ }
  };

  const roll = async () => {
    if (busy) return;
    cancelAnimationFrame(animation.current);
    setBusy(true); setWinner(undefined); setError(""); setItems([]); setOffset(0);
    try {
      const result = await minigameRoll(listLibraryAppIds(), minPrice);
      if (!result.success || !result.items?.length || result.winnerIndex === undefined || !result.winner) {
        throw new Error(result.error || "The Steam Store did not return a game");
      }
      setItems(result.items);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      try {
        caseSounds.current.forEach((sound) => {
          sound.currentTime = 0;
          void sound.play();
        });
      } catch { /* visual opening still works if remote audio is unavailable */ }
      const width = viewport.current?.clientWidth || 760;
      const target = Math.max(0, result.winnerIndex * (CARD_WIDTH + CARD_GAP) + CARD_WIDTH / 2 - width / 2);
      const started = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - started) / DURATION);
        const eased = 1 - Math.pow(1 - progress, 4);
        const position = target * eased;
        setOffset(position);
        if (progress < 1) animation.current = requestAnimationFrame(frame);
        else {
          setWinner(result.winner);
          setBusy(false);
        }
      };
      animation.current = requestAnimationFrame(frame);
    } catch (cause: any) {
      setError(String(cause?.message || cause)); setBusy(false);
    }
  };

  return <PanelSection title="Store Roulette">
    <PanelSectionRow><ButtonItem layout="below" onClick={() => setPriceExpanded((expanded) => !expanded)}>
      Price mode · {activePriceLabel} {priceExpanded ? "▲" : "▼"}
    </ButtonItem></PanelSectionRow>
    {priceExpanded && <PanelSectionRow><div style={{ width: "100%" }}>
      <div style={{ display: "grid", width: "100%", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {PRICE_MODES.map((mode) => <div key={mode.cents} style={{
          minWidth: 0, minHeight: 42, borderRadius: 6, overflow: "hidden",
          background: minPrice === mode.cents ? "rgba(83,168,230,.18)" : "rgba(255,255,255,.035)",
          border: minPrice === mode.cents ? "1px solid rgba(111,195,255,.5)" : "1px solid rgba(255,255,255,.08)",
        }}><DialogCheckbox label={mode.label}
          controlled checked={minPrice === mode.cents}
          onChange={() => { setMinPrice(mode.cents); setError(""); }} /></div>)}
      </div>
    </div></PanelSectionRow>}
    <PanelSectionRow><div style={{ fontSize: 11, opacity: .72, lineHeight: 1.45 }}>
      Crack open the entire Steam Store. The winning game is selected from live Store AppIDs and games already in your library are excluded.
    </div></PanelSectionRow>
    <PanelSectionRow><div ref={viewport} style={{
      position: "relative", width: "100%", height: 160, overflow: "hidden", borderRadius: 11,
      border: "1px solid rgba(115, 190, 255, .34)", background: "linear-gradient(180deg, #0b1420, #111d2b)",
      boxShadow: "inset 0 0 36px rgba(0,0,0,.65), 0 8px 24px rgba(0,0,0,.26)",
    }}>
      <div style={{ position: "absolute", zIndex: 4, left: "50%", top: 0, bottom: 0, width: 2, transform: "translateX(-1px)", background: "linear-gradient(#ffd86a, #ff9c32, #ffd86a)", boxShadow: "0 0 13px #ffb23f" }} />
      <div style={{ position: "absolute", zIndex: 5, left: "50%", top: 0, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "11px solid #ffd86a" }} />
      {!items.length && <div style={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", opacity: .62, letterSpacing: .5 }}>
        {busy ? "LOADING THE STEAM STORE…" : "A RANDOM GAME AWAITS"}
      </div>}
      <div style={{ display: "flex", gap: CARD_GAP, height: "100%", padding: "10px 0", transform: `translate3d(${-offset}px,0,0)`, willChange: "transform" }}>
        {items.map((item, index) => <div key={`${item.appid}-${index}`} style={{
          position: "relative", flex: `0 0 ${CARD_WIDTH}px`, height: 140, overflow: "hidden", borderRadius: 8,
          border: "1px solid rgba(255,255,255,.14)", borderBottom: `4px solid ${index % 11 === 0 ? "#d96cff" : index % 5 === 0 ? "#8d7bff" : "#5db7e8"}`,
          background: "linear-gradient(145deg,#23354a,#111c29)", boxSizing: "border-box",
        }}>
          <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "contain", opacity: .92 }} />
        </div>)}
      </div>
    </div></PanelSectionRow>
    {winner && <PanelSectionRow><div style={{ padding: "11px 12px", borderRadius: 9, border: "1px solid rgba(255,188,77,.42)", background: "linear-gradient(120deg,rgba(95,56,17,.72),rgba(38,27,47,.8))" }}>
      <div style={{ fontSize: 10, color: "#ffc765", fontWeight: 800, letterSpacing: 1 }}>UNLOCKED</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{winner.name}</div>
      {winner.shortDescription && <div style={{ fontSize: 10, opacity: .7, marginTop: 5, lineHeight: 1.35 }}>{winner.shortDescription}</div>}
    </div></PanelSectionRow>}
    {error && <PanelSectionRow><div style={{ color: "#ff8b83", fontSize: 11 }}>{error}</div></PanelSectionRow>}
    <PanelSectionRow><ButtonItem layout="below" disabled={busy} onClick={roll}>{busy ? "Opening…" : winner ? "Open another" : "Open Store case"}</ButtonItem></PanelSectionRow>
    {winner && <PanelSectionRow><ButtonItem layout="below" onClick={openWinner}>View {winner.name} in Store</ButtonItem></PanelSectionRow>}
  </PanelSection>;
}
