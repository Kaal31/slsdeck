import { DialogButton } from "@decky/ui";
import { createPortal } from "react-dom";
import { toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import { deleteLua, hasLua, startAdd } from "../api";
import { markSlsAddPending } from "../lib/badges";
import { FixPicker } from "./FixPicker";

type Slice = { key: string; label: string; subtitle: string; symbol: string; angle: number };
const slices: Slice[] = [
  { key: "add", label: "Add / Remove", subtitle: "Manage this game", symbol: "▣", angle: -90 },
  { key: "cloud", label: "Cloud Saves", subtitle: "Manage saves", symbol: "▤", angle: -30 },
  { key: "tools", label: "Tools", subtitle: "Extra utilities", symbol: "▣", angle: 30 },
  { key: "cancel", label: "Cancel", subtitle: "Close menu", symbol: "✕", angle: 90 },
  { key: "tokeer", label: "Tokeer", subtitle: "DLC & depots", symbol: "▥", angle: 150 },
  { key: "fixes", label: "Fixes", subtitle: "Patches & tweaks", symbol: "⚒", angle: 210 },
];
const wheelRadius = 204;
export function RadialGameMenu({ appid, gameName, closeModal }: {
  appid: number; gameName?: string; closeModal?: () => void;
}) {
  const [view, setView] = useState("");
  const [selected, setSelected] = useState(-1);
  const selectedRef = useRef(-1);
  const runRef = useRef<(key: string) => void>(() => {});
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "b" || event.key === "B") { event.preventDefault(); closeModal?.(); }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault(); setSelected(old => (old + 1) % slices.length);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault(); setSelected(old => (old + slices.length - 1) % slices.length);
      }
      if (event.key === "Enter" && selectedRef.current >= 0) {
        event.preventDefault(); runRef.current(slices[selectedRef.current].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { let live = true; void hasLua(appid).then(v => { if (live) setInstalled(!!v.exists); }).catch(()=>{}); return () => { live = false; }; }, [appid]);
  const run = async (key: string) => {
    if (key === "cancel") { closeModal?.(); return; }
    if (key === "fixes") { setView(view === "fixes" ? "" : "fixes"); return; }
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
  runRef.current = (key) => { void run(key); };
  useEffect(() => {
    const onSelect = (event: Event) => { const i = (event as CustomEvent<number>).detail; selectedRef.current = i; setSelected(i); };
    const onRelease = () => { const i = selectedRef.current; if (i >= 0 && slices[i]) runRef.current(slices[i].key); else closeModal?.(); };
    const onCancel = () => closeModal?.();
    window.addEventListener("slsdeck-wheel-select", onSelect);
    window.addEventListener("slsdeck-wheel-release", onRelease);
    window.addEventListener("slsdeck-wheel-cancel", onCancel);
    return () => {window.removeEventListener("slsdeck-wheel-select", onSelect); window.removeEventListener("slsdeck-wheel-release", onRelease); window.removeEventListener("slsdeck-wheel-cancel", onCancel);};
  }, [closeModal]);
  return <div onClick={(e) => { if (e.target === e.currentTarget) closeModal?.(); }}
    style={{ position: "fixed", inset: 0, zIndex: 2147483640, display: "flex", alignItems: "center",
      justifyContent: "center", background: "rgba(3,9,17,.73)", backdropFilter: "blur(9px)",
      color: "#eff8ff", fontFamily: "'Motiva Sans', Arial, sans-serif" }}>
    <div style={{ position: "relative", width: "min(590px,92vw)", height: "min(590px,85vh)", maxHeight: 590,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 480 480" width="100%" height="100%" style={{ position: "absolute", inset: 0,
        filter: "drop-shadow(0 12px 32px rgba(0,0,0,.8))" }}>
        <defs>
          <radialGradient id="sls-radial-glass"><stop offset="0" stopColor="#294761" stopOpacity=".88"/><stop offset="1" stopColor="#0b192b" stopOpacity=".97"/></radialGradient>
          <linearGradient id="sls-radial-active" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#58b4ef"/><stop offset="1" stopColor="#125b99"/></linearGradient>
        </defs>
        <circle cx="240" cy="240" r="230" fill="none" stroke="#3e769b" strokeOpacity=".55" strokeWidth="1.5"/>
        {slices.map((slice, i) => {
          const a1 = (slice.angle - 30) * Math.PI / 180;
          const a2 = (slice.angle + 30) * Math.PI / 180;
          const polar = (r: number, a: number) => [240+r*Math.cos(a), 240+r*Math.sin(a)];
          const a=polar(91,a1), b=polar(223,a1), c=polar(223,a2), d=polar(91,a2);
          const shape = "M"+a.join(" ")+" L"+b.join(" ")+" A223 223 0 0 1 "+c.join(" ")+" L"+d.join(" ")+" A91 91 0 0 0 "+a.join(" ")+" Z";
          return <path key={slice.key} d={shape} fill={selected===i?"url(#sls-radial-active)":"url(#sls-radial-glass)"}
            stroke={selected===i?"#d9f4ff":"#6c97b6"} strokeWidth={selected===i?3:1.1}
            onMouseEnter={() => setSelected(i)} onClick={() => void run(slice.key)}
            style={{ cursor:"pointer", filter:selected===i?"drop-shadow(0 0 11px #4bc0ff)":"none" }}/>;
        })}
        <circle cx="240" cy="240" r="88" fill="#07121e" stroke="#a1c7e4" strokeWidth="2.5"/>
        <circle cx="240" cy="240" r="83" fill="#0c2338"/>
        <foreignObject x="173" y="171" width="134" height="134">
          <div style={{width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:"#132941",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <img src={"https://cdn.cloudflare.steamstatic.com/steam/apps/"+appid+"/library_600x900.jpg"}
              alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
        </foreignObject>
      </svg>
      {slices.map((slice, i) => {
        const a = slice.angle * Math.PI / 180;
        const x = 50 + Math.cos(a)*35, y = 50 + Math.sin(a)*35;
        return <button key={slice.key} disabled={busy} onMouseEnter={() => setSelected(i)}
          onFocus={() => setSelected(i)} onClick={() => void run(slice.key)}
          style={{ position:"absolute",left:x+"%",top:y+"%",transform:"translate(-50%,-50%)",
            width:"28%", minHeight:75,padding:2,border:0,background:"transparent",
            color:"#edf7ff",textAlign:"center",cursor:"pointer",outline:"none",
            textShadow:selected===i?"0 0 12px #9dddff":"0 1px 5px #000",
            display:"flex",alignItems:"center",flexDirection:"column",justifyContent:"center",gap:3 }}>
          <span style={{fontSize:22,lineHeight:1}}>{slice.symbol}</span>
          <span style={{fontSize:14,fontWeight:700}}>{slice.key==="add"&&installed?"Remove Game":slice.label}</span>
          <span style={{fontSize:10,color:"#b0c3d3"}}>{slice.subtitle}</span>
        </button>;
      })}
      <div style={{ position:"absolute", top:"62%",left:"50%",transform:"translateX(-50%)",
        fontWeight:700,fontSize:12,letterSpacing:1,color:"#f7ead7",textShadow:"0 2px 4px #000",pointerEvents:"none" }}>
        {gameName || "SLSDeck"}
      </div>
      {view==="fixes" && <div style={{ position:"absolute",left:"85%",top:"29%",width:270,zIndex:2,
        background:"rgba(9,24,39,.97)",border:"1px solid #78b9e2",borderRadius:12,
        padding:14,boxShadow:"0 12px 35px #000b" }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <strong>Fixes</strong><DialogButton onClick={() => setView("")}>✕</DialogButton>
        </div>
        <FixPicker appid={appid} onClose={closeModal}/>
      </div>}
      {view && view!=="fixes" && <div style={{ position:"absolute",left:"85%",top:"29%",width:245,zIndex:2,
        background:"rgba(9,24,39,.97)",border:"1px solid #78b9e2",borderRadius:12,padding:16 }}>
        <strong>{view==="cloud"?"Cloud Saves":view==="tokeer"?"Tokeer":"Tools"}</strong>
        <p style={{fontSize:12}}>Open the game's actions from SLSDeck Quick Access.</p>
        <DialogButton onClick={() => setView("")}>Back to wheel</DialogButton>
      </div>}
    </div>
    <div style={{position:"absolute",bottom:16,right:26,fontSize:12,color:"#c7d7e9",opacity:.85}}>
      ◀ ▶ Navigate　 A Select　 B Cancel
    </div>
  </div>;
}
export function openRadialGameMenu(appid: number, gameName?: string) {
  window.dispatchEvent(new CustomEvent("slsdeck-open-radial", { detail: { appid, gameName } }));
}

/** Mounted in the Library React tree; draws above Steam with no modal dialog. */
export function RadialOverlayHost() {
  const [game, setGame] = useState<{appid:number;gameName?:string}|null>(null);
  useEffect(() => {
    const open = (event: Event) => {
      const data = (event as CustomEvent<{appid:number;gameName?:string}>).detail;
      if (Number(data?.appid) > 0) setGame({appid:Number(data.appid),gameName:data.gameName});
    };
    window.addEventListener("slsdeck-open-radial", open);
    return () => window.removeEventListener("slsdeck-open-radial", open);
  }, []);
  if (!game) return null;
  const target = document.querySelector("#GamepadUI_Full_Root") || document.body;
  return createPortal(<RadialGameMenu appid={game.appid} gameName={game.gameName} closeModal={() => setGame(null)} />, target);
}
