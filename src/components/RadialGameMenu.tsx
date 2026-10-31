import { DialogButton, Focusable, ModalRoot, showModal } from "@decky/ui";
import { Navigation, toaster } from "@decky/api";
import { useEffect, useState } from "react";
import { deleteLua, hasLua, startAdd } from "../api";
import { markSlsAddPending } from "../lib/badges";
import { FixPicker } from "./FixPicker";

type Slice = { key: string; label: string; symbol: string; angle: number };
const slices: Slice[] = [
  { key: "add", label: "Add Game", symbol: "+", angle: -54 },
  { key: "fixes", label: "Fixes", symbol: "⚒", angle: 18 },
  { key: "tokeer", label: "Tokeer", symbol: "◈", angle: 90 },
  { key: "cloud", label: "Cloud Saves", symbol: "☁", angle: 162 },
  { key: "tools", label: "Tools", symbol: "⚙", angle: 234 },
];
const radius = 145;
const baseButton = { position: "absolute" as const, width: 112, minWidth: 112, height: 76, padding: 4,
  border: "1px solid #557993", borderRadius: 16, color: "#f0f8ff", background: "rgba(24,39,54,.96)",
  display: "flex", flexDirection: "column" as const, alignItems: "center" as const,
  justifyContent: "center" as const, boxShadow: "0 5px 22px #0008" };
export function RadialGameMenu({ appid, gameName, closeModal }: {
  appid: number; gameName?: string; closeModal?: () => void;
}) {
  const [view, setView] = useState("");
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => { let live = true; void hasLua(appid).then(v => { if (live) setInstalled(!!v.exists); }).catch(()=>{}); return () => { live = false; }; }, [appid]);
  const run = async (key: string) => {
    if (key === "fixes") { setView("fixes"); return; }
    if (key === "tools" || key === "cloud" || key === "tokeer") { setView(key); return; }
    if (busy) return;
    setBusy(true);
    try {
      if (installed) {
        await deleteLua(appid);
        setInstalled(false);
        toaster.toast({ title: "SLSDeck", body: "Removed — restart Steam" });
      } else {
        markSlsAddPending(appid);
        const result = await startAdd(appid);
        if (!result.success) { markSlsAddPending(appid, false); throw Error(result.error || "Could not add game"); }
        toaster.toast({ title: "SLSDeck", body: "Game addition started; check SLSDeck for progress" });
      }
    } catch (e) { toaster.toast({ title: "SLSDeck", body: String(e) }); }
    finally { setBusy(false); }
  };
  return <ModalRoot closeModal={closeModal}>
    <div style={{ width: 540, maxWidth: "90vw", color: "#eff8ff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <strong>{gameName || `AppID ${appid}`}</strong>
        <span style={{ opacity: .65 }}>SLSDeck · radial menu test</span>
      </div>
      {view ? <div style={{ minHeight: 335, background: "#142435", borderRadius: 14, padding: 16 }}>
        <DialogButton onClick={() => setView("")}>← Back to wheel</DialogButton>
        {view === "fixes" ? <FixPicker appid={appid} onClose={closeModal} /> :
        <div style={{ marginTop: 24 }}>
          <h3>{view === "cloud" ? "Cloud Saves" : view === "tokeer" ? "Tokeer" : "Tools"}</h3>
          <p>Open this game's SLSDeck actions from the existing Quick Access panel.</p>
          <DialogButton onClick={() => { closeModal?.(); Navigation.CloseSideMenus(); }}>Close</DialogButton>
        </div>}
      </div> :
      <Focusable style={{ position: "relative", height: 405, width: "100%", borderRadius: 18,
        background: "radial-gradient(circle at 50% 51%,#243e58 0%,#0e1b2c 67%,#08121d 100%)" }} flow-children="grid">
        <svg viewBox="0 0 400 400" width="400" height="400" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
          {slices.map((slice, i) => {
            const start = (-90 + i*72) * Math.PI / 180, end = (-90 + (i+1)*72) * Math.PI / 180;
            const at = (r:number,a:number) => [200+r*Math.cos(a),200+r*Math.sin(a)];
            const a=at(79,start), b=at(190,start), c=at(190,end), d=at(79,end);
            return <path key={slice.key} d={`M${a} L${b} A190 190 0 0 1 ${c} L${d} A79 79 0 0 0 ${a} Z`}
              fill={i===1?"#184366":"#142536"} stroke="#7398b3" strokeWidth="1.6" opacity=".85"/>;
          })}
          <circle cx="200" cy="200" r="68" fill="#091725" stroke="#80b8ed" strokeWidth="2"/>
          <text x="200" y="192" textAnchor="middle" fontSize="22" fill="white">🎮</text>
          <text x="200" y="220" textAnchor="middle" fontSize="17" fill="white">SLSDeck</text>
        </svg>
        {slices.map((slice) => {
          const a=slice.angle*Math.PI/180;
          return <DialogButton key={slice.key} disabled={busy} onClick={() => void run(slice.key)}
            style={{ ...baseButton, left:`calc(50% + ${Math.cos(a)*radius}px - 56px)`,
              top:`calc(50% + ${Math.sin(a)*radius}px - 38px)` }}>
            <span style={{ fontSize: 26 }}>{slice.key==="add"&&installed?"−":slice.symbol}</span>
            <span>{slice.key==="add"&&installed?"Remove Game":slice.label}</span>
          </DialogButton>;
        })}
      </Focusable>}
      <p style={{ opacity: .65, fontSize: 12 }}>Choose a segment using touch, mouse, or controller focus. B closes the dialog.</p>
    </div>
  </ModalRoot>;
}
export function openRadialGameMenu(appid: number, gameName?: string) {
  showModal(<RadialGameMenu appid={appid} gameName={gameName} />);
}
