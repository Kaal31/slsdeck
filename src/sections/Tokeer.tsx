import { ButtonItem, DropdownItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { tokeerPrepare, tokeerRedeem, tokeerRuntimeStatus, tokeerVerify, TokeerVerifyResult } from "../api";
import {
  chooseSelectorOption,
  clickLatestTicketGate,
  cancelTokeerTicket,
  connectTokeerDiscordHidden,
  hideTokeerDiscordEmbedded,
  openSelectorAndReadOptions,
  openTokeerDiscord,
  readLatestTicketGate,
  readTokeerDiscord,
  positionTokeerDiscordEmbedded,
  showTokeerDiscordEmbedded,
  TokeerDiscordState,
  TokeerTicketGate,
  TokeerTicketContext,
  waitForTicketContext,
} from "../lib/tokeerDiscordCapture";

const inputStyle: any = { width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:4, border:"1px solid rgba(255,255,255,.25)", background:"rgba(0,0,0,.22)", color:"inherit" };
const checks = (v?: TokeerVerifyResult) => v?.checks || {installed:false,prefix:false,hook:false,launchOpt:false,proton:null};
const sleep = (ms:number)=>new Promise((r)=>setTimeout(r,ms));
const TOKEER_SESSION_KEY = "slsdeck.tokeerSession.v1";
const TOKEER_SESSION_MS = 30 * 60 * 1000;

type SavedTokeerSession = {
  startedAt: number;
  codeReceivedAt?: number;
  expiresAt?: number;
  selectedGame?: string;
  selectedMenus?: Record<number,string>;
  ticket?: TokeerTicketContext|null;
  gate?: TokeerTicketGate|null;
  activation?: string;
  verify?: TokeerVerifyResult|null;
  message?: string;
};

function readSavedSession(): SavedTokeerSession|null {
  try {
    const parsed=JSON.parse(window.localStorage.getItem(TOKEER_SESSION_KEY)||"null");
    if(!parsed||(parsed.expiresAt&&Number(parsed.expiresAt)<=Date.now())){
      window.localStorage.removeItem(TOKEER_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

export function TokeerSection() {
  const savedRef=useRef<SavedTokeerSession|null>(readSavedSession());
  const sessionStartedRef=useRef(savedRef.current?.startedAt||Date.now());
  const codeReceivedAtRef=useRef<number|undefined>(savedRef.current?.codeReceivedAt);
  const [discord,setDiscord]=useState<TokeerDiscordState|null>(null);
  const [runtime,setRuntime]=useState<any>(null);
  const [verify,setVerify]=useState<TokeerVerifyResult|null>(savedRef.current?.verify||null);
  const [activation,setActivation]=useState(savedRef.current?.activation||"");
  const [codeExpiresAt,setCodeExpiresAt]=useState<number|undefined>(savedRef.current?.expiresAt);
  const [clockNow,setClockNow]=useState(Date.now());
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState(savedRef.current?.message||"");
  const [options,setOptions]=useState<Record<number,string[]>>({});
  const [selectedMenus,setSelectedMenus]=useState<Record<number,string>>(savedRef.current?.selectedMenus||{});
  const [selectedGame,setSelectedGame]=useState(savedRef.current?.selectedGame||"");
  const [gate,setGate]=useState<TokeerTicketGate|null>(savedRef.current?.gate||null);
  const [ticket,setTicket]=useState<TokeerTicketContext|null>(savedRef.current?.ticket||null);
  const [embedded,setEmbedded]=useState(false);
  const embeddedRef=useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    if(!selectedGame&&!ticket&&!gate)return;
    const startedAt=sessionStartedRef.current;
    // Tokeer's 30-minute validity begins only after Discord returns the final
    // activation code. Selecting a game, opening a ticket and generating TLX1
    // must not consume that window.
    const codeReceivedAt=codeReceivedAtRef.current;
    const data:SavedTokeerSession={
      startedAt,codeReceivedAt,
      expiresAt:codeExpiresAt,
      selectedGame,selectedMenus,ticket,gate,activation,verify,message,
    };
    try{window.localStorage.setItem(TOKEER_SESSION_KEY,JSON.stringify(data));}catch{}
  },[selectedGame,selectedMenus,ticket,gate,activation,verify,message,codeExpiresAt]);

  useEffect(()=>{
    if(!codeExpiresAt)return;
    const tick=()=>setClockNow(Date.now());
    tick();
    const timer=setInterval(tick,250);
    return()=>clearInterval(timer);
  },[codeExpiresAt]);

  const refreshDiscord=async()=>{ try{setDiscord(await readTokeerDiscord());}catch{} };
  useEffect(()=>{ tokeerRuntimeStatus().then(setRuntime).catch(()=>{}); refreshDiscord(); const t=setInterval(refreshDiscord,15000); return()=>clearInterval(t); },[]);
  useEffect(()=>{
    if(!embedded){hideTokeerDiscordEmbedded().catch(()=>{});return;}
    let stopped=false;
    const bounds=()=>{
      const el=embeddedRef.current;if(!el)return null;
      const r=el.getBoundingClientRect();
      const top=Math.max(0,r.top),bottom=Math.min(window.innerHeight,r.bottom);
      if(bottom-top<24||r.right<=0||r.left>=window.innerWidth)return null;
      return {x:Math.max(0,r.left),y:top,width:Math.min(window.innerWidth,r.right)-Math.max(0,r.left),height:bottom-top};
    };
    const place=async(first=false)=>{
      const b=bounds();
      if(!b){await hideTokeerDiscordEmbedded();return;}
      const ok=first?await showTokeerDiscordEmbedded(b):await positionTokeerDiscordEmbedded(b);
      if(first&&!ok&&!stopped)setMessage("Could not embed Discord. Use the visible login once, press B, then reconnect silently.");
    };
    let timer:ReturnType<typeof setTimeout>|null=null;
    const loop=async()=>{if(stopped)return;await place(false);if(!stopped)timer=setTimeout(loop,700);};
    const start=setTimeout(async()=>{await place(true);await loop();},60);
    return()=>{stopped=true;clearTimeout(start);if(timer)clearTimeout(timer);hideTokeerDiscordEmbedded().catch(()=>{});};
  },[embedded]);
  const appid=Number(ticket?.appid||0);
  const remainingMs=codeExpiresAt?Math.max(0,codeExpiresAt-clockNow):0;
  const remainingSeconds=Math.ceil(remainingMs/1000);
  const countdown=`${String(Math.floor(remainingSeconds/60)).padStart(2,"0")}:${String(remainingSeconds%60).padStart(2,"0")}`;
  const countdownPct=codeExpiresAt?Math.max(0,Math.min(100,remainingMs/TOKEER_SESSION_MS*100)):0;

  const updateActivation=(value:string)=>{
    const next=value.trim();
    if(next&&!codeReceivedAtRef.current){
      const issued=Date.now();
      codeReceivedAtRef.current=issued;
      setCodeExpiresAt(issued+TOKEER_SESSION_MS);
      setClockNow(issued);
    }
    setActivation(next);
  };

  const openMenu=async(i:number,showMenu?:()=>void)=>{
    setBusy("Reading live game list…");
    try{
      const items=await openSelectorAndReadOptions(i);
      setOptions((old)=>({...old,[i]:items}));
      setTimeout(()=>showMenu?.(),0);
    }finally{setBusy("");}
  };

  const connectHidden=async()=>{
    setBusy("Connecting hidden Tokeer panel…");
    setMessage("Connecting to Discord in the background. Discord will stay hidden.");
    try{
      const ok=await connectTokeerDiscordHidden();
      if(!ok){setMessage("Hidden Discord connection failed. Open Discord login once, sign in, press B, then retry.");return;}
      let state=await readTokeerDiscord();
      for(let i=0;i<30&&!state.found;i++){
        await sleep(500);
        state=await readTokeerDiscord();
      }
      setDiscord(state);
      setMessage(state.found?"Hidden Tokeer panel connected.":(state.error||"Discord connected, but the activation panel is still loading."));
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const waitForGate=async()=>{
    setGate(null);
    for(let i=0;i<20;i++){
      const g=await readLatestTicketGate();
      if(g.found){setGate(g);setMessage("Tokeer is ready to open your private activation ticket.");return;}
      await sleep(500);
    }
    setMessage("The game was selected, but the green Tokeer confirmation button did not appear yet. Keep the activation channel open and retry refresh.");
  };

  const choose=async(index:number,label:string)=>{
    setBusy(`Selecting ${label} in Discord…`);
    setSelectedGame(label); setGate(null); setTicket(null); setVerify(null);
    setSelectedMenus((old)=>({...old,[index]:label}));
    const ok=await chooseSelectorOption(index,label);
    if(!ok){setMessage("Discord selection failed. Keep the Tokeer message open and retry.");setBusy("");return;}
    setBusy("Waiting for Tokeer confirmation…");
    setMessage(`Selected ${label}. Waiting for the newest bot message…`);
    await waitForGate();
    setBusy("");
  };

  const openTicket=async()=>{
    setBusy("Opening Tokeer ticket…");
    setMessage("Pressing the real green Discord confirmation and waiting for the ticket/thread…");
    try{
      const r=await clickLatestTicketGate();
      if(!r.success){setMessage(r.error||"Could not press the Tokeer confirmation button.");return;}
      const ctx=await waitForTicketContext(r.fromUrl||"",25000);
      setTicket(ctx);
      if(ctx.found&&ctx.appid){
        setMessage(`Ticket opened for ${selectedGame||"selected game"}. Tokeer reported Steam AppID ${ctx.appid}. No manual AppID entry is needed.`);
      }else{
        setMessage(ctx.error||"Ticket opened, but the AppID commands were not found yet.");
      }
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const resumeTicket=async()=>{
    if(!ticket?.url)return setMessage("The saved ticket URL is missing; show embedded Discord and reopen the ticket.");
    setBusy("Resuming Tokeer ticket…");
    setMessage("Reopening the existing private ticket and scanning its generated commands…");
    try{
      const ctx=await waitForTicketContext(ticket.url,35000);
      setTicket((old)=>({...old,...ctx,url:ctx.url||old?.url,opened:true}));
      if(ctx.found&&ctx.appid)setMessage(`Commands detected. Tokeer reported Steam AppID ${ctx.appid}.`);
      else setMessage(ctx.error||"Ticket is open, but its AppID still was not found.");
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const cancelTicket=async()=>{
    if(!ticket?.url)return setMessage("No saved private ticket URL is available.");
    setBusy("Cancelling Tokeer ticket…");
    try{
      const r=await cancelTokeerTicket(ticket.url);
      if(!r.success){setMessage(r.error||"Could not press Discord's Cancel Ticket button.");return;}
      try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
      setSelectedGame("");setSelectedMenus({});setGate(null);setTicket(null);
      setVerify(null);setActivation("");setCodeExpiresAt(undefined);
      codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
      setMessage("Ticket cancelled in Discord. The saved Tokeer session was cleared.");
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const prepare=async()=>{
    if(!appid)return setMessage("Open the Tokeer ticket first so SLSDeck can read its AppID.");
    setBusy("Preparing Tokeer…");
    setMessage(`Preparing ${selectedGame||`AppID ${appid}`} using the AppID supplied by the Tokeer ticket. Steam may restart.`);
    try{
      const r=await tokeerPrepare(appid);
      setMessage(r.success?"Prepare complete. If Steam restarted, reopen SLSDeck/Discord and press Verify.":(r.error||r.output||"Prepare failed."));
      setRuntime(await tokeerRuntimeStatus());
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const runVerify=async()=>{
    if(!appid)return setMessage("Open the Tokeer ticket first so SLSDeck can read its AppID.");
    setBusy("Verifying setup…");
    try{
      const r=await tokeerVerify(appid); setVerify(r);
      setMessage(r.success?"Setup verified. Copy the TLX1 and paste it into the open Discord ticket.":(r.error||"Verification failed."));
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const copyTlx=async()=>{
    if(!verify?.code)return;
    try{await navigator.clipboard.writeText(verify.code);setMessage("TLX1 copied. Paste it into the open Tokeer ticket.");}
    catch{setMessage("Could not copy automatically; use the TLX1 shown below.");}
  };

  const redeem=async()=>{
    if(!activation.trim())return setMessage("Paste the activation code from Discord first.");
    setBusy("Writing activation ticket…");
    try{
      const r=await tokeerRedeem(activation.trim());
      setMessage(r.success?"Activation written successfully. Launch the game from Steam.":(r.error||r.output||"Activation failed."));
      if(r.success){
        try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
        setSelectedGame("");setSelectedMenus({});setGate(null);setTicket(null);
        setVerify(null);setActivation("");setCodeExpiresAt(undefined);
        sessionStartedRef.current=Date.now();
        codeReceivedAtRef.current=undefined;
      }
    }
    catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };
  const c=checks(verify||undefined);

  return <>
    <PanelSection title="1. Choose game in Tokeer">
      <PanelSectionRow><div style={{fontSize:11,opacity:.75,lineHeight:1.45}}>SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Pick a game here; Discord remains the source of truth for availability, remaining keys and the Steam AppID.</div></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={connectHidden}>Connect Tokeer silently</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={()=>openTokeerDiscord()}>Open Discord login / manual view</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={()=>setEmbedded(v=>!v)}>{embedded?"Hide embedded Discord":"Show embedded Discord"}</ButtonItem></PanelSectionRow>
      {embedded&&<PanelSectionRow><div ref={embeddedRef} style={{width:"100%",height:420,border:"1px solid rgba(255,255,255,.22)",borderRadius:6,background:"rgba(0,0,0,.35)",boxSizing:"border-box"}} /></PanelSectionRow>}
      {discord?.found&&<PanelSectionRow><div style={{fontSize:11,lineHeight:1.6}}>Steam: <b>{discord.steamStatus||"Unknown"}</b> · Games: <b>{discord.gamesListed??"?"}</b> · Keys: <b>{discord.keysRemaining??"?"}</b> · High demand: <b>{discord.highDemand??"?"}</b></div></PanelSectionRow>}
      {(discord?.selectors||[]).map(s=><PanelSectionRow key={s.index}><DropdownItem
        label={s.label||`Game menu ${s.index+1}`}
        description="Live game list from the Tokeer Discord panel"
        disabled={s.disabled||!!busy}
        rgOptions={(options[s.index]||[]).map(x=>({data:x,label:x}))}
        selectedOption={selectedMenus[s.index]||null}
        strDefaultLabel={s.label||"Choose a game"}
        onMenuWillOpen={(showMenu)=>openMenu(s.index,showMenu)}
        onChange={(o:any)=>choose(s.index,String(o.data))}
      /></PanelSectionRow>)}
      {!discord?.found&&<PanelSectionRow><div style={{fontSize:11,opacity:.7}}>{discord?.error||"Open the Linux activation message once and leave the Discord tab alive."}</div></PanelSectionRow>}
    </PanelSection>

    {(selectedGame||gate)&&<PanelSection title="2. Open activation ticket">
      {selectedGame&&<PanelSectionRow><div style={{fontSize:12}}>Selected: <b>{selectedGame}</b></div></PanelSectionRow>}
      {ticket?.opened&&!ticket.appid
        ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||!ticket.url} onClick={resumeTicket}>Resume existing ticket / detect commands</ButtonItem></PanelSectionRow>
        :gate?.found
          ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||gate.disabled} onClick={openTicket}>{gate.label||"✅ I've read this & watched the tutorial"}</ButtonItem></PanelSectionRow>
          :<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={waitForGate}>Refresh confirmation</ButtonItem></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><div style={{fontSize:10,opacity:.7}}>Private ticket saved. {codeExpiresAt?"Activation-code countdown is running.":"The 30-minute code timer has not started yet."}</div></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={cancelTicket}>Cancel ticket in Discord</ButtonItem></PanelSectionRow>}
      {ticket?.found&&ticket.appid&&<PanelSectionRow><div style={{fontSize:11}}>Ticket detected · Steam AppID <b>{ticket.appid}</b> (read automatically from Tokeer's commands)</div></PanelSectionRow>}
    </PanelSection>}

    {ticket?.found&&ticket.appid&&<PanelSection title="3. Prepare & verify">
      <PanelSectionRow><div style={{fontSize:11}}>Runtime: <b>{runtime?.installed?"Installed":"Not prepared"}</b> · Default/free cooldown: <b>48 hours</b></div></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={prepare} disabled={!!busy}>Prepare game</ButtonItem></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={runVerify} disabled={!!busy}>Verify setup / generate TLX1</ButtonItem></PanelSectionRow>
    </PanelSection>}

    {busy&&<PanelSection title="Working"><PanelSectionRow><div style={{fontSize:11}}><Spinner style={{width:14,height:14,marginRight:8}}/>{busy}</div></PanelSectionRow></PanelSection>}
    {message&&<PanelSection title="Status"><PanelSectionRow><div style={{fontSize:11,lineHeight:1.45}}>{message}</div></PanelSectionRow></PanelSection>}

    {verify&&<PanelSection title="Verify result">
      <PanelSectionRow><div style={{fontSize:12,lineHeight:1.7,width:"100%"}}>
        <div>{c.installed?"✓":"✗"} Game installed</div><div>{c.prefix?"✓":"✗"} Proton prefix</div><div>{c.hook?"✓":"✗"} Native hook</div><div>{c.launchOpt?"✓":"✗"} Launch option</div><div>Proton: <b>{c.proton||"unknown"}</b></div>
      </div></PanelSectionRow>
      {verify.code&&<><PanelSectionRow><ButtonItem layout="below" onClick={copyTlx}>Copy TLX1 verification code</ButtonItem></PanelSectionRow><PanelSectionRow><div style={{fontSize:9,wordBreak:"break-all",maxHeight:90,overflowY:"auto",opacity:.7}}>{verify.code}</div></PanelSectionRow></>}
    </PanelSection>}

    <PanelSection title="4. Redeem activation">
      <PanelSectionRow><input style={inputStyle} placeholder="Activation code from Discord" value={activation} onChange={(e:any)=>updateActivation(e.target.value)}/></PanelSectionRow>
      {codeExpiresAt&&<PanelSectionRow><div style={{width:"100%",padding:"4px 2px 8px"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,color:remainingMs>0?"#fff":"#ff5b5b"}}>
          <span>{remainingMs>0?"Activation window":"Activation code expired"}</span><span style={{fontVariantNumeric:"tabular-nums"}}>{countdown}</span>
        </div>
        <div style={{height:7,marginTop:6,borderRadius:6,overflow:"hidden",background:"rgba(255,255,255,.14)"}}>
          <div style={{height:"100%",width:`${countdownPct}%`,borderRadius:6,background:countdownPct>25?"#59bf40":countdownPct>10?"#e5a629":"#e34b4b",transition:"width .25s linear, background .3s ease"}}/>
        </div>
      </div></PanelSectionRow>}
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy||!activation} onClick={redeem}>Activate / write ticket</ButtonItem></PanelSectionRow>
      <PanelSectionRow><div style={{fontSize:10,opacity:.7,lineHeight:1.45}}>Codes are single-use and expire in about 30 minutes. Cooldowns are shared with UbiTokeer: Free 48h · Donator 24h · Lua Basic 12h · Lua Pro 6h · Elite/no-cooldown role: no standard cooldown.</div></PanelSectionRow>
    </PanelSection>
  </>;
}
