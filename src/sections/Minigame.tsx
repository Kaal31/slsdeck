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

function displayPrice(item: MinigameItem): string {
  if (!item.priceCents) return "Store price unavailable";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: item.currency || "USD",
    }).format(item.priceCents / 100);
  } catch {
    return `$${(item.priceCents / 100).toFixed(2)}`;
  }
}

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
    {winner && <PanelSectionRow><div style={{ width: "100%", padding: "18px 10px 15px", textAlign: "center", boxSizing: "border-box" }}>
      <style>{`@keyframes sls-game-unlocked { 0% { opacity: 0; transform: translateY(24px) scale(.9); filter: blur(5px); } 65% { transform: translateY(-5px) scale(1.025); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }`}</style>
      <img
        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${winner.appid}/library_600x900_2x.jpg`}
        alt=""
        onError={(event) => {
          if (event.currentTarget.dataset.fallback) return;
          event.currentTarget.dataset.fallback = "1";
          event.currentTarget.src = winner.image;
        }}
        style={{
          display: "block", maxWidth: "76%", maxHeight: 300, margin: "0 auto 14px", borderRadius: 10,
          objectFit: "contain", animation: "sls-game-unlocked 620ms cubic-bezier(.2,.8,.2,1) both",
          boxShadow: "0 18px 38px rgba(0,0,0,.58), 0 0 28px rgba(91,174,236,.2)",
        }}
      />
      <div style={{ fontSize: 10, color: "#77c9ff", fontWeight: 800, letterSpacing: 1.2 }}>GAME UNLOCKED</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{winner.name}</div>
      <div style={{ fontSize: 15, color: "#a7e7bb", fontWeight: 800, marginTop: 7 }}>{displayPrice(winner)}</div>
    </div></PanelSectionRow>}
    {error && <PanelSectionRow><div style={{ color: "#ff8b83", fontSize: 11 }}>{error}</div></PanelSectionRow>}
    <PanelSectionRow><ButtonItem layout="below" disabled={busy} onClick={roll}>{busy ? "Opening…" : winner ? "Open another" : "Open Store case"}</ButtonItem></PanelSectionRow>
    {winner && <PanelSectionRow><ButtonItem layout="below" onClick={openWinner}>View {winner.name} in Store</ButtonItem></PanelSectionRow>}
  </PanelSection>;
}
