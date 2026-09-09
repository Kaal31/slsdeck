import { ButtonItem, DialogButton, DialogCheckbox, ModalRoot, Navigation, PanelSection, PanelSectionRow } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { getAddStatus, MinigameItem, minigameRoll, startAdd } from "../api";
import { listLibraryAppIds } from "../lib/ownership";
import { readRoulettePrice, writeRoulettePrice } from "../lib/storeRoulettePrefs";

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

async function addWinnerToSlsSteam(item: MinigameItem): Promise<void> {
  const started = await startAdd(item.appid);
  if (!started.success) throw new Error(started.error || "SLS Steam could not start adding the winner");
  for (let attempt = 0; attempt < 240; attempt++) {
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    const result = await getAddStatus(item.appid);
    if (!result.success) continue;
    const status = result.state?.status || "";
    if (status === "done") return;
    if (status === "failed" || status === "cancelled") {
      throw new Error(result.state?.error || `SLS Steam add ${status}`);
    }
  }
  throw new Error("Timed out waiting for SLS Steam to add the winning game");
}

export function MinigameSection({ modalClose, onBusyChange, quickAccess = false }: { modalClose?: () => void; onBusyChange?: (busy: boolean) => void; quickAccess?: boolean } = {}) {
  const viewport = useRef<HTMLDivElement>(null);
  const animation = useRef(0);
  const gamepadWatch = useRef(0);
  const caseSounds = useRef<HTMLAudioElement[]>([]);
  const [items, setItems] = useState<MinigameItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState<MinigameItem>();
  const [winnerAdded, setWinnerAdded] = useState(false);
  const [error, setError] = useState("");
  const [minPrice, setMinPrice] = useState(readRoulettePrice);
  const [priceExpanded, setPriceExpanded] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const activePriceLabel = PRICE_MODES.find((mode) => mode.cents === minPrice)?.label || "Random";

  useEffect(() => {
    caseSounds.current = [new Audio(CASE_SOUND_URL), new Audio(CASE_SOUND_URL)];
    caseSounds.current.forEach((sound) => {
      sound.preload = "auto";
      sound.volume = 1;
    });
    return () => {
      cancelAnimationFrame(animation.current);
      cancelAnimationFrame(gamepadWatch.current);
      caseSounds.current.forEach((sound) => sound.pause());
      caseSounds.current = [];
    };
  }, []);

  useEffect(() => {
    if (!revealVisible) return;
    const dismiss = () => {
      setRevealVisible(false);
      modalClose?.();
    };
    const watchedEvents: (keyof DocumentEventMap)[] = ["keydown", "pointerdown", "mousedown", "click", "touchstart", "touchend"];
    watchedEvents.forEach((name) => document.addEventListener(name, dismiss, true));

    let previousButtons = Array.from(navigator.getGamepads?.() || []).map((pad) =>
      pad ? pad.buttons.map((button) => button.pressed) : [],
    );
    const watchGamepad = () => {
      const pads = Array.from(navigator.getGamepads?.() || []);
      const newlyPressed = pads.some((pad, padIndex) => pad?.buttons.some(
        (button, buttonIndex) => button.pressed && !previousButtons[padIndex]?.[buttonIndex],
      ));
      if (newlyPressed) dismiss();
      else {
        previousButtons = pads.map((pad) => pad ? pad.buttons.map((button) => button.pressed) : []);
        gamepadWatch.current = requestAnimationFrame(watchGamepad);
      }
    };
    gamepadWatch.current = requestAnimationFrame(watchGamepad);
    return () => {
      watchedEvents.forEach((name) => document.removeEventListener(name, dismiss, true));
      cancelAnimationFrame(gamepadWatch.current);
    };
  }, [revealVisible, modalClose]);

  const openWinner = () => {
    if (!winner) return;
    try {
      if (winnerAdded) Navigation.Navigate(`/library/app/${winner.appid}`);
      else Navigation.NavigateToExternalWeb(`https://store.steampowered.com/app/${winner.appid}`);
    } catch { /* ignore */ }
  };

  const roll = async () => {
    if (busy) return;
    cancelAnimationFrame(animation.current);
    setRevealVisible(false);
    setBusy(true); setWinner(undefined); setWinnerAdded(false); setError(""); setItems([]); setOffset(0);
    onBusyChange?.(true);
    try {
      const result = await minigameRoll(listLibraryAppIds(), minPrice);
      if (!result.success || !result.items?.length || result.winnerIndex === undefined || !result.winner) {
        throw new Error(result.error || "The Steam Store did not return a game");
      }
      const addResult = addWinnerToSlsSteam(result.winner).then(
        () => ({ success: true as const }),
        (cause: any) => ({ success: false as const, error: String(cause?.message || cause) }),
      );
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
          setRevealVisible(true);
          setBusy(false);
          onBusyChange?.(false);
          void addResult.then((added) => {
            if (!added.success) {
              setWinnerAdded(false);
              setError(`Winner selected, but it was not added: ${added.error}`);
              return;
            }
            setWinnerAdded(true);
          });
        }
      };
      animation.current = requestAnimationFrame(frame);
    } catch (cause: any) {
      setError(String(cause?.message || cause)); setBusy(false);
      onBusyChange?.(false);
    }
  };

  const rouletteWindow = <div ref={viewport} style={{
    position: "relative", width: "100%", height: quickAccess ? 210 : 160, overflow: "hidden", borderRadius: 11,
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
        position: "relative", flex: `0 0 ${CARD_WIDTH}px`, height: quickAccess ? 190 : 140, overflow: "hidden", borderRadius: 8,
        border: "1px solid rgba(255,255,255,.14)", borderBottom: `4px solid ${index % 11 === 0 ? "#d96cff" : index % 5 === 0 ? "#8d7bff" : "#5db7e8"}`,
        background: "linear-gradient(145deg,#23354a,#111c29)", boxSizing: "border-box",
      }}>
        <img src={item.image} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "contain", opacity: .92 }} />
      </div>)}
    </div>
  </div>;

  return <>{winner && revealVisible && <div style={{
    position: "fixed", zIndex: 999999, inset: 0, display: "grid", placeItems: "center",
    pointerEvents: "auto", background: "radial-gradient(circle,rgba(20,33,48,.68),rgba(0,0,0,.7) 58%,rgba(0,0,0,.78))",
    backdropFilter: "blur(2px)",
  }} onPointerDown={() => setRevealVisible(false)} onTouchStart={() => setRevealVisible(false)} onClick={() => setRevealVisible(false)}><div style={{ width: "min(72vw, 430px)", textAlign: "center", position: "relative" }}>
      <style>{`
        @keyframes sls-game-unlocked { 0% { opacity: 0; transform: translateY(28px) scale(.78); filter: blur(7px); } 58% { opacity: 1; transform: translateY(-9px) scale(1.065); filter: blur(0); } 78% { transform: translateY(3px) scale(.985); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes sls-unlock-burst { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.25) rotate(0); } 38% { opacity: .85; } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5) rotate(25deg); } }
        @keyframes sls-unlock-flash { 0%,100% { opacity: 0; } 18% { opacity: .9; } 45% { opacity: 0; } }
        @keyframes sls-unlock-particle { 0% { opacity: 0; transform: translateY(0) scale(.3); } 18% { opacity: 1; } 100% { opacity: 0; transform: translateY(-125px) scale(1); } }
        @keyframes sls-cover-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes sls-cover-shine { 0% { transform: translateX(-170%) skewX(-22deg); } 48%,100% { transform: translateX(260%) skewX(-22deg); } }
        @keyframes sls-unlock-title { 0% { opacity: 0; transform: scale(.75); text-shadow: 0 0 0 transparent; } 55% { opacity: 1; transform: scale(1.13); text-shadow: 0 0 18px #ffc95c; } 100% { transform: scale(1); text-shadow: 0 0 7px rgba(255,201,92,.45); } }
      `}</style>
      <div>
        <div style={{ position: "relative", width: "100%", minHeight: 240, display: "grid", placeItems: "center" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 310, height: 310, borderRadius: "50%", animation: "sls-unlock-burst 1.15s ease-out both", background: "repeating-conic-gradient(from 0deg, rgba(255,202,87,.75) 0deg 5deg, transparent 5deg 17deg)", filter: "blur(1px)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", animation: "sls-unlock-flash 900ms ease-out both", background: "radial-gradient(circle,rgba(255,246,202,.85),rgba(255,193,73,.24) 35%,transparent 68%)" }} />
          {Array.from({ length: 12 }, (_, index) => <span key={index} style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: 4, transform: `rotate(${index * 30}deg)`, transformOrigin: "0 0" }}><span style={{ display: "block", width: index % 3 === 0 ? 7 : 4, height: index % 3 === 0 ? 7 : 4, borderRadius: index % 2 ? "50%" : 1, background: index % 2 ? "#fff1a4" : "#ffad3d", boxShadow: "0 0 8px #ffc45d", animation: `sls-unlock-particle ${760 + (index % 4) * 90}ms ease-out ${index * 24}ms both` }} /></span>)}
          <div style={{ position: "relative", zIndex: 2, display: "inline-block", maxWidth: "76%", borderRadius: 10, overflow: "hidden", animation: "sls-game-unlocked 820ms cubic-bezier(.18,.82,.2,1) both", boxShadow: "0 22px 48px rgba(0,0,0,.72), 0 0 40px rgba(255,190,75,.38)" }}>
            <div style={{ position: "relative", animation: "sls-cover-float 3s ease-in-out 1.15s infinite" }}>
              <img src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${winner.appid}/library_600x900_2x.jpg`} alt="" onError={(event) => { if (event.currentTarget.dataset.fallback) return; event.currentTarget.dataset.fallback = "1"; event.currentTarget.src = winner.image; }} style={{ display: "block", width: "100%", maxHeight: 330, objectFit: "contain" }} />
              <div style={{ position: "absolute", zIndex: 3, top: 0, bottom: 0, left: 0, width: "38%", animation: "sls-cover-shine 1.8s ease-in-out 700ms both", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent)", filter: "blur(2px)" }} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#ffc95c", fontWeight: 900, letterSpacing: 1.5, animation: "sls-unlock-title 850ms ease-out 250ms both" }}>GAME UNLOCKED</div>
        <div style={{ fontSize: 23, fontWeight: 900, marginTop: 5, textShadow: "0 3px 12px #000" }}>{winner.name}</div>
        <div style={{ fontSize: 17, color: "#a7e7bb", fontWeight: 900, marginTop: 8, textShadow: "0 2px 9px #000" }}>SAVED {displayPrice(winner)}</div>
      </div>
    </div></div>}{quickAccess ? <div style={{
      position: "fixed", zIndex: 10000, left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      width: "min(76vw, 820px)", margin: 0,
    }}>
      {rouletteWindow}
      {error && <div style={{ color: "#ff8b83", fontSize: 11, marginTop: 8 }}>{error}</div>}
      <DialogButton disabled={busy} onClick={roll} style={{ width: "100%", marginTop: 10 }}>
        {busy ? "Rolling…" : "Roll a game"}
      </DialogButton>
    </div> : <PanelSection title="Store Roulette">
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
          onChange={() => { setMinPrice(mode.cents); writeRoulettePrice(mode.cents); setError(""); }} /></div>)}
      </div>
    </div></PanelSectionRow>}
    <PanelSectionRow><div style={{ fontSize: 11, opacity: .72, lineHeight: 1.45 }}>
      Crack open the entire Steam Store. Games already in your library are excluded, and the winner is automatically added with SLS Steam.
    </div></PanelSectionRow>
    <PanelSectionRow>{rouletteWindow}</PanelSectionRow>
    {error && <PanelSectionRow><div style={{ color: "#ff8b83", fontSize: 11 }}>{error}</div></PanelSectionRow>}
    <PanelSectionRow><ButtonItem layout="below" disabled={busy} onClick={roll}>{busy ? "Rolling…" : "Roll a game"}</ButtonItem></PanelSectionRow>
    {winner && <PanelSectionRow><ButtonItem layout="below" onClick={openWinner}>
      View {winner.name} in {winnerAdded ? "Library" : "Store"}
    </ButtonItem></PanelSectionRow>}
  </PanelSection>}</>;
}

export function StoreRouletteModal({ closeModal }: { closeModal?: () => void }) {
  const [busy, setBusy] = useState(false);
  const close = () => { if (!busy) closeModal?.(); };
  return (
    <ModalRoot
      closeModal={close}
      onCancel={close}
      onEscKeypress={close}
      bDisableBackgroundDismiss={busy}
      bHideCloseIcon
      bAllowFullSize
      className="sls-roulette-modal"
      modalClassName="sls-roulette-modal"
    >
      <style>{`
        .sls-roulette-modal { background: transparent !important; box-shadow: none !important; border: 0 !important; }
      `}</style>
      <MinigameSection modalClose={closeModal} onBusyChange={setBusy} quickAccess />
    </ModalRoot>
  );
}
