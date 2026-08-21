import { ButtonItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { useEffect, useState } from "react";
import { tokeerPrepare, tokeerRedeem, tokeerRuntimeStatus, tokeerVerify, TokeerVerifyResult } from "../api";
import {
  chooseSelectorOption,
  clickLatestTicketGate,
  openSelectorAndReadOptions,
  openTokeerDiscord,
  readLatestTicketGate,
  readTokeerDiscord,
  TokeerDiscordState,
  TokeerTicketGate,
  TokeerTicketContext,
  waitForTicketContext,
} from "../lib/tokeerDiscordCapture";

const inputStyle: any = { width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:4, border:"1px solid rgba(255,255,255,.25)", background:"rgba(0,0,0,.22)", color:"inherit" };
const checks = (v?: TokeerVerifyResult) => v?.checks || {installed:false,prefix:false,hook:false,launchOpt:false,proton:null};
const sleep = (ms:number)=>new Promise((r)=>setTimeout(r,ms));

export function TokeerSection() {
  const [discord,setDiscord]=useState<TokeerDiscordState|null>(null);
  const [runtime,setRuntime]=useState<any>(null);
  const [verify,setVerify]=useState<TokeerVerifyResult|null>(null);
  const [activation,setActivation]=useState("");
  const [busy,setBusy]=useState("");
  const [message,setMessage]=useState("");
  const [menu,setMenu]=useState<number|null>(null);
  const [options,setOptions]=useState<string[]>([]);
  const [selectedGame,setSelectedGame]=useState("");
  const [gate,setGate]=useState<TokeerTicketGate|null>(null);
  const [ticket,setTicket]=useState<TokeerTicketContext|null>(null);

  const refreshDiscord=async()=>{ try{setDiscord(await readTokeerDiscord());}catch{} };
  useEffect(()=>{ tokeerRuntimeStatus().then(setRuntime).catch(()=>{}); refreshDiscord(); const t=setInterval(refreshDiscord,15000); return()=>clearInterval(t); },[]);
  const appid=Number(ticket?.appid||0);

  const openMenu=async(i:number)=>{
    setBusy("Reading live game list…"); setMenu(i);
    try{setOptions(await openSelectorAndReadOptions(i));}
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

  const choose=async(label:string)=>{
    if(menu==null)return;
    setBusy(`Selecting ${label} in Discord…`);
    setSelectedGame(label); setGate(null); setTicket(null); setVerify(null);
    const ok=await chooseSelectorOption(menu,label);
    setOptions([]); setMenu(null);
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
    try{const r=await tokeerRedeem(activation.trim());setMessage(r.success?"Activation written successfully. Launch the game from Steam.":(r.error||r.output||"Activation failed."));}
    catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };
  const c=checks(verify||undefined);

  return <>
    <PanelSection title="1. Choose game in Tokeer">
      <PanelSectionRow><div style={{fontSize:11,opacity:.75,lineHeight:1.45}}>SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Pick a game here; Discord remains the source of truth for availability, remaining keys and the Steam AppID.</div></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={()=>{openTokeerDiscord();setTimeout(refreshDiscord,1600);}}>Open Tokeer Discord</ButtonItem></PanelSectionRow>
      {discord?.found&&<PanelSectionRow><div style={{fontSize:11,lineHeight:1.6}}>Steam: <b>{discord.steamStatus||"Unknown"}</b> · Games: <b>{discord.gamesListed??"?"}</b> · Keys: <b>{discord.keysRemaining??"?"}</b> · High demand: <b>{discord.highDemand??"?"}</b></div></PanelSectionRow>}
      {(discord?.selectors||[]).map(s=><PanelSectionRow key={s.index}><ButtonItem layout="below" disabled={s.disabled||!!busy} onClick={()=>openMenu(s.index)}>{s.label||`Game menu ${s.index+1}`}</ButtonItem></PanelSectionRow>)}
      {!discord?.found&&<PanelSectionRow><div style={{fontSize:11,opacity:.7}}>{discord?.error||"Open the Linux activation message once and leave the Discord tab alive."}</div></PanelSectionRow>}
    </PanelSection>

    {menu!=null&&options.length>0&&<PanelSection title="Live Discord games">{options.map(x=><PanelSectionRow key={x}><ButtonItem layout="below" onClick={()=>choose(x)}>{x}</ButtonItem></PanelSectionRow>)}</PanelSection>}

    {(selectedGame||gate)&&<PanelSection title="2. Open activation ticket">
      {selectedGame&&<PanelSectionRow><div style={{fontSize:12}}>Selected: <b>{selectedGame}</b></div></PanelSectionRow>}
      {gate?.found?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||gate.disabled} onClick={openTicket}>{gate.label||"✅ I've read this & watched the tutorial"}</ButtonItem></PanelSectionRow>:<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={waitForGate}>Refresh confirmation</ButtonItem></PanelSectionRow>}
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
      <PanelSectionRow><input style={inputStyle} placeholder="Activation code from Discord" value={activation} onChange={(e:any)=>setActivation(e.target.value.trim())}/></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy||!activation} onClick={redeem}>Activate / write ticket</ButtonItem></PanelSectionRow>
      <PanelSectionRow><div style={{fontSize:10,opacity:.7,lineHeight:1.45}}>Codes are single-use and expire in about 30 minutes. Cooldowns are shared with UbiTokeer: Free 48h · Donator 24h · Lua Basic 12h · Lua Pro 6h · Elite/no-cooldown role: no standard cooldown.</div></PanelSectionRow>
    </PanelSection>
  </>;
}
