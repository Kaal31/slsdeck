import { ButtonItem, DropdownItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import { tokeerPreflight, tokeerRedeem, tokeerRuntimeStatus, tokeerVerify, TokeerVerifyResult } from "../api";
import { describeTokeerFailure, setupAndVerifyTokeer } from "../lib/tokeerSetup";
import {
  chooseSelectorOption,
  clickLatestTicketGate,
  cancelTokeerTicket,
  checkTokeerTicketState,
  probeTokeerTicketState,
  connectTokeerDiscordHidden,
  getDiscordSignInState,
  waitForDiscordSignIn,
  openDedevisionDiscordLogin,
  openSelectorAndReadOptions,
  openTokeerDiscord,
  readLatestTicketGate,
  readTokeerDiscord,
  restoreTokeerTicketView,
  sendTokeerTicketMessage,
  TokeerDiscordState,
  TokeerTicketGate,
  TokeerTicketContext,
  waitForTicketContext,
  waitForTokeerActivationCode,
} from "../lib/tokeerDiscordCapture";
import { cancelTokeerAvailabilityRefresh, normalizeTokeerGameName, parseTokeerGameLabel, readTokeerAvailabilityCache, refreshTokeerAvailabilityCache, TokeerAvailabilityCache } from "../lib/tokeerAvailability";

const inputStyle: any = { width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:4, border:"1px solid rgba(255,255,255,.25)", background:"rgba(0,0,0,.22)", color:"inherit" };
const checks = (v?: TokeerVerifyResult) => v?.checks || {installed:false,prefix:false,hook:false,launchOpt:false,proton:null};
const sleep = (ms:number)=>new Promise((r)=>setTimeout(r,ms));
const TOKEER_SESSION_KEY = "slsdeck.tokeerSession.v1";
const TOKEER_AUTO_CONNECT_KEY = "slsdeck.tokeerAutoConnect.v1";
const TOKEER_VAULT_REFRESH_MS = 10 * 60 * 1000;
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
  automationStage?: AutomationStage;
  tlxSubmitted?: boolean;
  submittedTlx?: string;
  automationError?: string;
};

type AutomationStage = "idle"|"preparing"|"submitting"|"waiting-code"|"redeeming"|"done"|"failed"|"aborted";

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

function readAutoConnect(): boolean {
  try { return window.localStorage.getItem(TOKEER_AUTO_CONNECT_KEY) === "1"; }
  catch { return false; }
}

export function TokeerSection() {
  useEffect(() => () => cancelTokeerAvailabilityRefresh(), []);
  const savedRef=useRef<SavedTokeerSession|null>(readSavedSession());
  const sessionStartedRef=useRef(savedRef.current?.startedAt||Date.now());
  const codeReceivedAtRef=useRef<number|undefined>(savedRef.current?.codeReceivedAt);
  const [discord,setDiscord]=useState<TokeerDiscordState|null>(null);
  const [availability,setAvailability]=useState<TokeerAvailabilityCache|null>(readTokeerAvailabilityCache());
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
  const [discordSignedIn,setDiscordSignedIn]=useState(false);
  const [discordAuthChecked,setDiscordAuthChecked]=useState(false);
  const [autoConnect,setAutoConnect]=useState(readAutoConnect);
  const [automationStage,setAutomationStage]=useState<AutomationStage>(savedRef.current?.automationStage||"idle");
  const [tlxSubmitted,setTlxSubmitted]=useState(!!savedRef.current?.tlxSubmitted);
  const [submittedTlx,setSubmittedTlx]=useState(savedRef.current?.submittedTlx||"");
  const [automationError,setAutomationError]=useState(savedRef.current?.automationError||"");
  const automationRunningRef=useRef(false);
  const ticketAbortedRef=useRef(false);
  const loginPendingRef=useRef(false);

  const checkpoint=(patch:Partial<SavedTokeerSession>)=>{
    try{
      const current=readSavedSession()||{startedAt:sessionStartedRef.current};
      window.localStorage.setItem(TOKEER_SESSION_KEY,JSON.stringify({...current,...patch}));
    }catch{}
  };

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
      automationStage,tlxSubmitted,submittedTlx,automationError,
    };
    try{window.localStorage.setItem(TOKEER_SESSION_KEY,JSON.stringify(data));}catch{}
  },[selectedGame,selectedMenus,ticket,gate,activation,verify,message,codeExpiresAt,automationStage,tlxSubmitted,submittedTlx,automationError]);

  useEffect(()=>{
    if(!codeExpiresAt)return;
    const tick=()=>setClockNow(Date.now());
    tick();
    const timer=setInterval(tick,250);
    return()=>clearInterval(timer);
  },[codeExpiresAt]);

  const refreshDiscord=async()=>{ try{
    const [state,auth]=await Promise.all([readTokeerDiscord(),getDiscordSignInState()]);
    // A successfully parsed activation panel is stronger evidence than the
    // users/@me probe: Steam's Discord webview can block that API request even
    // while its authenticated channel DOM is fully available.
    const signedIn=auth.signedIn||state.found;
    setDiscord(state);setDiscordSignedIn(signedIn);
    return {state,signedIn,authFound:auth.found};
  }catch{return null;} };
  const ticketChainActive=()=>!!(ticket?.opened||ticket?.url||gate?.found);
  const refreshAvailability=async(force=false,announce=force)=>{
    if(announce)setMessage(ticketChainActive()?"Refreshing the live vault, then restoring your private ticket…":"Refreshing live vault and game availability…");
    const value=await refreshTokeerAvailabilityCache(force);
    if(value){
      setAvailability(value);
      // A selected dropdown label contains the availability count. Replace
      // that copied label from the same newly-written cache so the ticket card,
      // vault panel and Fixes surfaces no longer disagree.
      if(selectedGame){
        const selectedName=parseTokeerGameLabel(selectedGame)?.name||selectedGame;
        const fresh=value.games.find((game)=>normalizeTokeerGameName(game.name)===normalizeTokeerGameName(selectedName));
        if(fresh){
          const oldLabel=selectedGame;
          setSelectedGame(fresh.label);
          setSelectedMenus((menus)=>Object.fromEntries(Object.entries(menus).map(([key,label])=>[
            key, label===oldLabel||normalizeTokeerGameName(parseTokeerGameLabel(label)?.name||label)===normalizeTokeerGameName(selectedName)?fresh.label:label,
          ])));
        }
      }
      if(announce)setMessage(`Vault refreshed from Discord at ${new Date(value.updatedAt).toLocaleTimeString()}.`);
    }else if(announce)setMessage("Live Discord refresh failed; the previous cached values were left unchanged.");
    return value;
  };
  // Any sign-in transition detected anywhere (this panel, a background poll)
  // updates the button state, so it can never be left stale.
  useEffect(()=>{
    // Positive transitions can be trusted immediately. A negative users/@me
    // probe is reconciled by refreshDiscord with the live panel DOM before the
    // button is shown again.
    const onSignIn=(e:any)=>{if(e?.detail){setDiscordSignedIn(true);setDiscordAuthChecked(true);}};
    window.addEventListener("slsdeck-tokeer-signin",onSignIn as EventListener);
    return ()=>window.removeEventListener("slsdeck-tokeer-signin",onSignIn as EventListener);
  },[]);
  useEffect(()=>{
    tokeerRuntimeStatus().then(setRuntime).catch(()=>{});
    const openInBackground=async()=>{
      // Preserve the managed target when resuming an unfinished ticket.
      if(savedRef.current?.ticket?.opened||savedRef.current?.ticket?.url||savedRef.current?.gate){
        let observed=await refreshDiscord();
        // Decky/plugin updates can destroy the managed BrowserView without
        // clearing Discord's shared login cookies. "No CDP target" is not a
        // signed-out result: recreate the hidden view, then return it to the
        // exact saved ticket before the ticket probe runs.
        if(!observed?.authFound){
          const ok=await connectTokeerDiscordHidden();
          if(ok&&savedRef.current?.ticket?.url){
            try{await restoreTokeerTicketView(savedRef.current.ticket.url);}catch{}
          }
          observed=await refreshDiscord();
        }
        return;
      }
      if(readAutoConnect()){
        const ok=await connectTokeerDiscordHidden();
        const observed=await refreshDiscord();
        if(ok){
          if(observed?.signedIn){
            const cached=await refreshTokeerAvailabilityCache(true);
            if(cached){setAvailability(cached);setDiscordSignedIn(true);}
            else setMessage("Background Discord refresh failed. The previous vault cache was preserved; game Fixes will hide Tokeer until their own live check succeeds.");
          }
        }
      }else{
        const observed=await refreshDiscord();
        if(observed?.signedIn)await refreshAvailability(true,false);
      }
    };
    openInBackground().catch(()=>{}).finally(()=>setDiscordAuthChecked(true));
    const onCache=(event:any)=>setAvailability(event?.detail||readTokeerAvailabilityCache());
    window.addEventListener("slsdeck-tokeer-cache",onCache as EventListener);
    const t=setInterval(refreshDiscord,15000);
    return()=>{clearInterval(t);window.removeEventListener("slsdeck-tokeer-cache",onCache as EventListener);};
  },[]);
  useEffect(()=>{
    // The mount path above performs the first live refresh. Continue only while
    // this Tokeer page is mounted, Discord is confirmed authenticated, and no
    // private ticket can be disrupted by a vault navigation.
    if(!discordAuthChecked||!discordSignedIn||ticketChainActive())return;
    let stopped=false,running=false;
    const refresh=async()=>{
      if(stopped||running||ticketChainActive())return;
      running=true;
      try{
        const cached=await refreshTokeerAvailabilityCache(true);
        if(!stopped&&cached)setAvailability(cached);
      }finally{running=false;}
    };
    const timer=setInterval(()=>{void refresh();},TOKEER_VAULT_REFRESH_MS);
    return()=>{stopped=true;clearInterval(timer);};
  },[discordAuthChecked,discordSignedIn,ticket?.opened,ticket?.url,gate?.found]);
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
    if(ticketChainActive()){
      setMessage("The private ticket is still open. Background vault connection is paused to preserve its command chain.");
      return;
    }
    setBusy("Connecting hidden Tokeer panel…");
    setMessage("Connecting to Discord in the background. Discord will stay hidden.");
    try{
      const ok=await connectTokeerDiscordHidden();
      if(!ok){setMessage("Hidden Discord connection failed. Open Discord login once, sign in, press B, then retry.");return;}
      // Bound by wall clock, not iteration count: each scrape can itself take
      // seconds, so "30 tries" was really "up to several minutes of blocking",
      // and the panel had no way out of it.
      const deadline=Date.now()+25000;
      let state=await readTokeerDiscord(true);
      while(!state.found&&Date.now()<deadline){
        await sleep(500);
        state=await readTokeerDiscord(true);
      }
      setDiscord(state);
      if(state.found){
        const auth=await getDiscordSignInState();
        const signedIn=auth.signedIn||state.found;
        setDiscordSignedIn(signedIn);
        if(!signedIn){
          setMessage("Discord is not signed in yet. Use the DeDevision sign-in button, return here, then connect again.");
          return;
        }
        try{window.localStorage.setItem(TOKEER_AUTO_CONNECT_KEY,"1");}catch{}
        setAutoConnect(true);
        setMessage("Hidden Tokeer panel connected. Refreshing vault and availability cache…");
        const cached=await refreshTokeerAvailabilityCache(true);
        if(cached)setAvailability(cached);
        setMessage(cached?`Vault cache updated: ${cached.games.length} available games.`:"Panel connected, but the game menus were not ready; the previous cache was preserved.");
      }else{
        setMessage(state.error||"Discord connected, but the activation panel is still loading.");
      }
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
    setBusy(`Checking whether ${label} is installed…`);
    const installed=await tokeerPreflight(0,label).catch(()=>null);
    if(!installed?.success||!installed.installed){
      const failure=installed?.error||"Could not verify that this game is installed.";
      setMessage(failure);
      toaster.toast({title:"SLSDeck · Tokeer",body:failure.slice(0,220)});
      setBusy("");
      return;
    }
    setBusy(`Selecting ${label} in Discord…`);
    setSelectedGame(label); setGate(null); setTicket(null); setVerify(null);
    setAutomationStage("idle");setTlxSubmitted(false);setSubmittedTlx("");setAutomationError("");
    setSelectedMenus((old)=>({...old,[index]:label}));
    const ok=await chooseSelectorOption(index,label);
    if(!ok){setMessage("Discord selection failed. Keep the Tokeer message open and retry.");setBusy("");return;}
    setBusy("Waiting for Tokeer confirmation…");
    setMessage(`Selected ${label}. Waiting for the newest bot message…`);
    await waitForGate();
    setBusy("");
  };

  const abortTicketChain=(reason:string)=>{
    ticketAbortedRef.current=true;
    automationRunningRef.current=false;
    try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
    setTicket(null);setGate(null);setVerify(null);setActivation("");
    setCodeExpiresAt(undefined);setTlxSubmitted(false);setSubmittedTlx("");
    setAutomationStage("aborted");setAutomationError(reason);setMessage(reason);
    codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
    setBusy("");
    toaster.toast({title:"SLSDeck · Tokeer",body:reason.slice(0,220)});
  };

  useEffect(()=>{
    if(!ticket?.url||automationStage==="done"||automationStage==="aborted")return;
    let stopped=false,checking=false;
    const inspect=async()=>{
      if(stopped||checking)return;
      checking=true;
      try{
        const state=await checkTokeerTicketState(ticket.url!);
        if(!stopped&&state.closed)abortTicketChain(`${state.reason||"The Discord ticket was closed."} Tokeer automation was aborted and its saved ticket state was cleared.`);
      }catch{}
      finally{checking=false;}
    };
    void inspect();
    const timer=setInterval(inspect,3000);
    return()=>{stopped=true;clearInterval(timer);};
  },[ticket?.url,automationStage]);

  // On opening/restoring this tab, actively validate the saved private channel
  // once. Passive polling cannot classify a deleted ticket after Discord has
  // redirected its tab elsewhere.
  useEffect(()=>{
    if(!ticket?.url||automationStage==="done"||automationStage==="aborted")return;
    let stopped=false;
    const timer=setTimeout(async()=>{
      try{
        const state=await probeTokeerTicketState(ticket.url!);
        if(!stopped&&state.closed)abortTicketChain(`${state.reason||"The saved Discord ticket no longer exists."} Its stale Tokeer session was cleared.`);
      }catch{}
    },600);
    return()=>{stopped=true;clearTimeout(timer);};
  },[ticket?.url]);

  const runAutomation=async(ctx:TokeerTicketContext,resume?:SavedTokeerSession)=>{
    if(automationRunningRef.current||!ctx.appid||!ctx.url)return;
    automationRunningRef.current=true;
    ticketAbortedRef.current=false;
    const fail=(body:string)=>{
      setAutomationStage("failed");setAutomationError(body);setMessage(body);
      checkpoint({automationStage:"failed",automationError:body,ticket:ctx});
      toaster.toast({title:"SLSDeck · Tokeer automation",body:body.slice(0,220)});
    };
    try{
      // Defence in depth for restored sessions: never run a Discord-derived
      // AppID when it disagrees with the installed game the user selected.
      if(selectedGame){
        const expected=await tokeerPreflight(0,selectedGame);
        if(ticketAbortedRef.current)return;
        if(expected.success&&expected.installed&&expected.appid&&Number(expected.appid)!==Number(ctx.appid)){
          fail(`Ignored mismatched ticket AppID ${ctx.appid}; ${selectedGame} is installed as Steam AppID ${expected.appid}. Re-scan the ticket commands.`);
          return;
        }
      }
      let stage=resume?.automationStage||"preparing";
      let tlx=resume?.submittedTlx||"";
      let wasSubmitted=!!resume?.tlxSubmitted;

      if(stage==="redeeming"&&resume?.activation){
        updateActivation(resume.activation);
        setBusy("Redeeming saved Tokeer activation…");
        const redeemed=await tokeerRedeem(resume.activation);
        if(ticketAbortedRef.current)return;
        if(!redeemed.success){fail(redeemed.error||redeemed.output||"Activation redemption failed.");return;}
        setAutomationStage("done");setMessage("Tokeer activation was redeemed successfully. Launch the game from Steam.");
        try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
        return;
      }

      if(stage!=="waiting-code"||!wasSubmitted){
        setAutomationStage("preparing");setAutomationError("");setBusy("Preparing and verifying Tokeer locally…");
        checkpoint({automationStage:"preparing",automationError:"",ticket:ctx});
        const preflight=await tokeerPreflight(ctx.appid,"");
        if(ticketAbortedRef.current)return;
        if(!preflight.success||!preflight.installed){fail(preflight.error||"Game is not installed; Discord was not sent a verification result.");return;}
        const prepared=await setupAndVerifyTokeer(ctx.appid,setMessage);
        if(ticketAbortedRef.current)return;
        if(!prepared.success||!prepared.code){fail(describeTokeerFailure(prepared));return;}
        tlx=prepared.code;setVerify(prepared);setSubmittedTlx(tlx);
        checkpoint({automationStage:"submitting",verify:prepared,submittedTlx:tlx,ticket:ctx});

        setAutomationStage("submitting");setBusy("Submitting verified TLX1 to the Discord ticket…");
        const sent=await sendTokeerTicketMessage(ctx.url,tlx);
        if(ticketAbortedRef.current)return;
        if(sent.cancelled){abortTicketChain(`${sent.error||"The Discord ticket was cancelled."} Tokeer automation was aborted.`);return;}
        if(!sent.success){fail(sent.error||"Could not submit TLX1 to Discord.");return;}
        wasSubmitted=true;setTlxSubmitted(true);setAutomationStage("waiting-code");
        checkpoint({automationStage:"waiting-code",tlxSubmitted:true,submittedTlx:tlx,verify:prepared,ticket:ctx});
      }

      setAutomationStage("waiting-code");setBusy("Waiting for Discord activation code…");
      setMessage("Local verification passed and TLX1 was submitted. Waiting for Tokeer's six-character activation code…");
      const received=await waitForTokeerActivationCode(ctx.url,15*60*1000,ctx.lastMessageId||"");
      if(ticketAbortedRef.current)return;
      if(received.cancelled){abortTicketChain(`${received.error||"The Discord ticket was cancelled."} Tokeer automation was aborted.`);return;}
      if(!received.success||!received.code){fail(received.error||"No activation code was detected.");return;}
      const trackedTicket={...ctx,lastMessageId:received.lastMessageId||ctx.lastMessageId};
      setTicket((old)=>({...old,...trackedTicket}));
      updateActivation(received.code);setAutomationStage("redeeming");setBusy("Redeeming Tokeer activation locally…");
      checkpoint({automationStage:"redeeming",activation:received.code,codeReceivedAt:Date.now(),expiresAt:Date.now()+TOKEER_SESSION_MS,ticket:trackedTicket,tlxSubmitted:true,submittedTlx:tlx});
      const redeemed=await tokeerRedeem(received.code);
      if(ticketAbortedRef.current)return;
      if(!redeemed.success){fail(redeemed.error||redeemed.output||"Activation redemption failed. The received code is preserved for manual retry.");return;}
      setAutomationStage("done");setMessage("Tokeer activation was received and redeemed automatically. Launch the game from Steam.");
      toaster.toast({title:"SLSDeck · Tokeer",body:"Activation received and redeemed successfully."});
      try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
      setSelectedGame("");setSelectedMenus({});setGate(null);setTicket(null);setVerify(null);setActivation("");setCodeExpiresAt(undefined);
      codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
    }catch(e){if(!ticketAbortedRef.current)fail(String(e));}
    finally{automationRunningRef.current=false;setBusy("");}
  };

  const openTicket=async()=>{
    cancelTokeerAvailabilityRefresh();
    setBusy("Opening Tokeer ticket…");
    setMessage("Pressing the real green Discord confirmation and waiting for the ticket/thread…");
    try{
      const installed=selectedGame?await tokeerPreflight(0,selectedGame):null;
      if(selectedGame&&(!installed?.success||!installed.installed||!installed.appid)){
        setMessage(installed?.error||"Could not resolve the selected installed game's Steam AppID.");
        return;
      }
      const expectedAppid=Number(installed?.appid||0);
      const r=await clickLatestTicketGate();
      if(!r.success){setMessage(r.error||"Could not press the Tokeer confirmation button.");return;}
      const expectedName=parseTokeerGameLabel(selectedGame)?.name||selectedGame;
      const ctx=await waitForTicketContext(r.fromUrl||"",25000,expectedAppid,r.existingChannelIds||[],(discovered)=>{
        // Cancellation should become available as soon as the thread exists;
        // Tokeer's AppID/setup commands can arrive a little later.
        setTicket(discovered);
        checkpoint({ticket:discovered});
      },expectedName);
      setTicket(ctx);
      if(ctx.found&&ctx.appid){
        setMessage(`Ticket opened for ${selectedGame||"selected game"}. Starting local preparation and automatic verification.`);
        await runAutomation(ctx);
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
      const state=await probeTokeerTicketState(ticket.url);
      if(state.closed){abortTicketChain(`${state.reason||"The saved Discord ticket no longer exists."} Its stale Tokeer session was cleared.`);return;}
      const installed=selectedGame?await tokeerPreflight(0,selectedGame):null;
      const expectedAppid=Number(installed?.success&&installed.installed?installed.appid||0:0);
      const expectedName=parseTokeerGameLabel(selectedGame)?.name||selectedGame;
      const ctx=await waitForTicketContext(ticket.url,35000,expectedAppid,[],undefined,expectedName);
      setTicket((old)=>({...old,...ctx,url:ctx.url||old?.url,opened:true}));
      if(ctx.found&&ctx.appid){setMessage(`Commands detected. Resuming Tokeer automation for Steam AppID ${ctx.appid}.`);await runAutomation({...ticket,...ctx,url:ctx.url||ticket.url,opened:true},savedRef.current||undefined);}
      else setMessage(ctx.error||"Ticket is open, but its AppID still was not found.");
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  useEffect(()=>{
    const saved=savedRef.current;
    if(!saved?.ticket?.found||!saved.ticket.appid||!saved.ticket.url)return;
    if(!["preparing","submitting","waiting-code","redeeming"].includes(saved.automationStage||""))return;
    const timer=setTimeout(()=>runAutomation(saved.ticket!,saved),500);
    return()=>clearTimeout(timer);
  },[]);

  const cancelTicket=async()=>{
    if(!ticket?.url)return setMessage("No saved private ticket URL is available.");
    setBusy("Cancelling Tokeer ticket…");
    try{
      const r=await cancelTokeerTicket(ticket.url);
      if(!r.success){
        const state=await probeTokeerTicketState(ticket.url);
        if(state.closed){abortTicketChain(`${state.reason||"The Discord ticket was already closed."} Its stale Tokeer session was cleared.`);return;}
        setMessage(r.error||"Could not press Discord's Close Ticket button.");return;
      }
      try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
      setSelectedGame("");setSelectedMenus({});setGate(null);setTicket(null);
      setVerify(null);setActivation("");setCodeExpiresAt(undefined);
      codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
      setMessage("Ticket cancelled in Discord. The saved Tokeer session was cleared.");
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const resolveTicketAppid=async():Promise<number>=>{
    const current=Number(ticket?.appid||0);
    let expected=0;
    if(selectedGame){
      const installed=await tokeerPreflight(0,selectedGame).catch(()=>null);
      if(!installed?.success||!installed.installed||!installed.appid){
        setMessage(installed?.error||"Could not resolve the selected installed game's Steam AppID.");
        return 0;
      }
      expected=Number(installed.appid);
    }
    if(current&&(!expected||current===expected))return current;

    // Repair sessions saved by the old broad parser (for example a year such
    // as 2026 mistaken for an AppID) before either manual action can touch it.
    if(ticket?.url&&expected){
      setMessage(`Saved ticket AppID ${current||"is missing"}; re-scanning its setup commands for AppID ${expected}…`);
      const expectedName=parseTokeerGameLabel(selectedGame)?.name||selectedGame;
      const rescanned=await waitForTicketContext(ticket.url,20000,expected,[],undefined,expectedName);
      if(rescanned.found&&Number(rescanned.appid)===expected){
        setTicket(old=>({...old,...rescanned,appid:expected,url:rescanned.url||old?.url,opened:true}));
        return expected;
      }
      setMessage(rescanned.error||`The ticket does not contain setup commands for ${selectedGame} (Steam AppID ${expected}). Cancel it and open a new ticket.`);
      return 0;
    }
    setMessage("Open or resume the Tokeer ticket so SLSDeck can read and validate its Steam AppID.");
    return 0;
  };

  const prepare=async()=>{
    const resolvedAppid=await resolveTicketAppid();
    if(!resolvedAppid)return;
    setBusy("Preparing Tokeer…");
    setMessage(`Preparing ${selectedGame||`AppID ${resolvedAppid}`} using the validated AppID supplied by the Tokeer ticket. Steam will stay open.`);
    try{
      const r=await setupAndVerifyTokeer(resolvedAppid,setMessage);
      if(r.success){
        setVerify(r);
        setMessage(`Tokeer prepared without restarting Steam. ${r.runtimeUpdated?"Runtime updated; ":"Runtime already current; "}GE-Proton10-34 selected, launch options merged, and TLX1 generated.`);
      }else{
        const failure=describeTokeerFailure(r);
        setVerify(null);
        setMessage(failure);
        toaster.toast({title:"SLSDeck · Tokeer",body:failure.slice(0,220)});
      }
      setRuntime(await tokeerRuntimeStatus());
    }catch(e){setMessage(String(e));}
    finally{setBusy("");}
  };

  const runVerify=async()=>{
    const resolvedAppid=await resolveTicketAppid();
    if(!resolvedAppid)return;
    setBusy("Verifying setup…");
    try{
      const preflight=await tokeerPreflight(resolvedAppid,"");
      if(!preflight.success||!preflight.installed){
        const failure=preflight.error||"Game is not installed.";
        setVerify(null);setMessage(failure);
        toaster.toast({title:"SLSDeck · Tokeer",body:failure.slice(0,220)});
        return;
      }
      const r=await tokeerVerify(resolvedAppid);
      if(r.success){
        setVerify(r);
        setMessage("Setup verified. Copy the TLX1 and paste it into the open Discord ticket.");
      }else{
        const failure=describeTokeerFailure(r);
        setVerify(null);setMessage(failure);
        toaster.toast({title:"SLSDeck · Tokeer",body:failure.slice(0,220)});
      }
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
    <PanelSection title="Choose game in Tokeer">
      {!discordAuthChecked&&<PanelSectionRow><div style={{fontSize:11,opacity:.7}}>Checking Discord connection…</div></PanelSectionRow>}
      {discordAuthChecked&&!discordSignedIn&&<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={async()=>{
        if(loginPendingRef.current)return;
        loginPendingRef.current=true;setBusy("Waiting for Discord sign-in…");
        setMessage("Opening DeDevision Discord. Sign in and accept the server invite, then press B to return.");
        try{
          await openDedevisionDiscordLogin();
          if(await waitForDiscordSignIn()){
            setDiscordSignedIn(true);setDiscordAuthChecked(true);
            setMessage("Discord signed in. You can connect Tokeer silently now.");
          }else setMessage("Discord sign-in was not detected. You can retry without opening duplicate login pages.");
        }finally{loginPendingRef.current=false;setBusy("");}
      }}>Sign in to DeDevision Discord</ButtonItem></PanelSectionRow>}
      {discordAuthChecked&&discordSignedIn&&!autoConnect&&<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={connectHidden}>Connect Tokeer silently</ButtonItem></PanelSectionRow>}
      {availability&&<PanelSectionRow><div style={{width:"100%",padding:10,borderRadius:9,background:"linear-gradient(145deg,rgba(28,43,66,.96),rgba(38,25,58,.92))",border:"1px solid rgba(157,198,255,.28)",boxShadow:"0 5px 18px rgba(0,0,0,.22)",fontSize:11,lineHeight:1.55,color:"#f7f9ff"}}>
        <div style={{fontSize:14,fontWeight:800,letterSpacing:.4,marginBottom:8,color:"#fff"}}>Tokeer Vault</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:7}}>
          {[
            ["Games listed",availability.vault.gamesListed??"?","#72c7ff"],
            ["Keys remaining",availability.vault.keysRemaining??"?","#74e6a2"],
            ["High demand",availability.vault.highDemand??"?","#ff9b8f"],
            ["Available now",availability.games.length,"#d2a6ff"],
          ].map(([label,value,color])=><div key={String(label)} style={{padding:"8px 9px",borderRadius:7,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.09)"}}>
            <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:.7,opacity:.72}}>{label}</div>
            <div style={{fontSize:19,fontWeight:900,lineHeight:1.2,color:String(color),textShadow:`0 0 12px ${String(color)}55`,fontVariantNumeric:"tabular-nums"}}>{value}</div>
          </div>)}
        </div>
        <div style={{marginTop:8,fontSize:10,opacity:.7}}>Updated {new Date(availability.updatedAt).toLocaleString()}</div>
        <div style={{marginTop:7,maxHeight:150,overflowY:"auto",padding:"6px 7px",borderRadius:6,background:"rgba(0,0,0,.18)"}}>
          {availability.games.map(game=><div key={game.appid||game.name} style={{padding:"2px 0",color:"#f2f5ff"}}>{game.name}{game.remaining!==undefined?<span style={{color:"#74e6a2",fontWeight:700}}>{` — ${game.remaining}/${game.total??"?"} keys`}</span>:""}</div>)}
        </div>
      </div></PanelSectionRow>}
      {availability&&<PanelSectionRow><div style={{width:"100%",padding:"10px 11px",borderRadius:7,border:"1px solid rgba(255,70,70,.55)",background:"rgba(145,20,20,.2)",color:"#ff6666",fontSize:11,fontWeight:750,lineHeight:1.5}}><div style={{fontSize:12,fontWeight:850,marginBottom:3}}>Account safety</div>Warning: attempts to abuse activation limits or share access may be detected through HWID and IP information and can result in account restrictions. Use only your own account and device.</div></PanelSectionRow>}
      <PanelSectionRow><div style={{fontSize:11,opacity:.75,lineHeight:1.45}}>SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Pick a game here; Discord remains the source of truth for availability, remaining keys and the Steam AppID.</div></PanelSectionRow>
      {discord?.found&&<PanelSectionRow><div style={{width:"100%",padding:"9px 11px",borderRadius:8,background:"linear-gradient(135deg,rgba(71,184,255,.18),rgba(88,220,143,.09))",border:"1px solid rgba(104,205,255,.35)",fontSize:12,lineHeight:1.6,color:"#f4fbff"}}><span style={{color:"#65e69b",fontWeight:800}}>● LIVE</span> · Steam: <b style={{color:"#fff"}}>{discord.steamStatus||"Unknown"}</b></div></PanelSectionRow>}
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

    {(selectedGame||gate)&&<PanelSection title="Open activation ticket">
      {selectedGame&&<PanelSectionRow><div style={{fontSize:12}}>Selected: <b>{selectedGame}</b></div></PanelSectionRow>}
      {ticket?.opened&&!ticket.appid
        ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||!ticket.url} onClick={resumeTicket}>Resume existing ticket / detect commands</ButtonItem></PanelSectionRow>
        :gate?.found
          ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||gate.disabled} onClick={openTicket}>{gate.label||"✅ I've read this & watched the tutorial"}</ButtonItem></PanelSectionRow>
          :<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={waitForGate}>Refresh confirmation</ButtonItem></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><div style={{fontSize:10,opacity:.7}}>Private ticket saved. {codeExpiresAt?"Activation-code countdown is running.":"The 30-minute code timer has not started yet."}</div></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={cancelTicket}>Cancel ticket in Discord</ButtonItem></PanelSectionRow>}
      {ticket?.found&&ticket.appid&&<PanelSectionRow><div style={{fontSize:11}}>Ticket detected · Steam AppID <b>{ticket.appid}</b> (read automatically from Tokeer's commands)</div></PanelSectionRow>}
      {automationStage!=="idle"&&<PanelSectionRow><div style={{fontSize:11,lineHeight:1.45}}>Automation: <b>{automationStage.replace("-"," ")}</b>{tlxSubmitted?" · TLX1 submitted":""}{automationError?<div style={{color:"#ff7b72",marginTop:3}}>{automationError}</div>:null}</div></PanelSectionRow>}
    </PanelSection>}

    {ticket?.found&&ticket.appid&&<PanelSection title="Prepare & verify">
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

    <PanelSection title="Discord">
      <PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={()=>openTokeerDiscord()}>Manual view</ButtonItem></PanelSectionRow>
    </PanelSection>

    <PanelSection title="Redeem activation">
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
