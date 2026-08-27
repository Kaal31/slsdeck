import { ButtonItem, DropdownItem, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import { tokeerApplyUbisoftPackage, tokeerFindUbisoftToken, tokeerInstallUbisoftDbdata, tokeerUbisoftDbdataStatus, tokeerMarkApplied, tokeerPreflight, tokeerRedeem, tokeerRuntimeStatus, tokeerUbisoftHostedGames, tokeerVerify, TokeerVerifyResult, UbisoftHostedGame } from "../api";
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
  uploadTokeerTicketFile,
  findPostedTokeerTicketFile,
  TokeerDiscordState,
  TokeerTicketGate,
  TokeerTicketContext,
  waitForTicketContext,
  waitForTokeerActivationCode,
  waitForUbisoftVerificationConfirmation,
  waitForUbisoftDbdataLink,
  clickTokeerGameWorked,
} from "../lib/tokeerDiscordCapture";
import { cancelTokeerAvailabilityRefresh, normalizeTokeerGameName, parseTokeerGameLabel, readTokeerAvailabilityCache, refreshTokeerAvailabilityCache, TokeerAvailabilityCache } from "../lib/tokeerAvailability";
import { launchGame } from "../lib/launchGame";
import { hasLaunchRepoint, setLaunchRepoint } from "../lib/fixRuntime";
import { refreshBadges } from "../lib/badges";

const inputStyle: any = { width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:4, border:"1px solid rgba(255,255,255,.25)", background:"rgba(0,0,0,.22)", color:"inherit" };
const checks = (v?: TokeerVerifyResult) => v?.checks || {installed:false,prefix:false,hook:false,launchOpt:false,proton:null};
const sleep = (ms:number)=>new Promise((r)=>setTimeout(r,ms));
const TOKEER_SESSION_KEY = "slsdeck.tokeerSession.v1";
const TOKEER_AUTO_CONNECT_KEY = "slsdeck.tokeerAutoConnect.v1";
const TOKEER_SELECTOR_CACHE_KEY = "slsdeck.tokeerSelectorLayout.v1";
const TOKEER_VAULT_REFRESH_MS = 10 * 60 * 1000;
const TOKEER_SESSION_MS = 30 * 60 * 1000;

type SavedTokeerSession = {
  startedAt: number;
  codeReceivedAt?: number;
  expiresAt?: number;
  selectedGame?: string;
  selectedUbisoft?: boolean;
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
  ubisoftAppliedAt?: number;
  ubisoftTokenPath?: string;
  ubisoftTokenMessageId?: string;
};

type AutomationStage = "idle"|"preparing"|"submitting"|"waiting-code"|"redeeming"|"patching-ubisoft"|"waiting-token"|"uploading-token"|"waiting-dbdata"|"installing-dbdata"|"done"|"failed"|"aborted";

function readSavedSession(): SavedTokeerSession|null {
  try {
    const parsed=JSON.parse(window.localStorage.getItem(TOKEER_SESSION_KEY)||"null");
    // Older builds could clear the selected game while a late ticket scan
    // persisted the old ticket again. That orphan has no trustworthy game
    // identity and must not resurrect Prepare/Verify after an update.
    const orphanedTicket=!!parsed?.ticket&&(parsed.ticket.found||parsed.ticket.opened||parsed.ticket.url)&&!String(parsed.selectedGame||"").trim();
    if(!parsed||orphanedTicket||(parsed.expiresAt&&Number(parsed.expiresAt)<=Date.now())){
      window.localStorage.removeItem(TOKEER_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function readAutoConnect(): boolean {
  try {
    // Existing vault data could only have been obtained through a successful
    // Discord connection. Older builds did not always persist the separate
    // auto-connect flag, so migrate that established state after an update.
    return window.localStorage.getItem(TOKEER_AUTO_CONNECT_KEY) === "1" || !!readTokeerAvailabilityCache();
  }
  catch { return false; }
}

function readSelectorLayout(): TokeerDiscordState|null {
  try {
    const parsed=JSON.parse(window.localStorage.getItem(TOKEER_SELECTOR_CACHE_KEY)||"null");
    return parsed?.found&&Array.isArray(parsed.selectors)&&parsed.selectors.length?parsed:null;
  } catch { return null; }
}

export function TokeerSection() {
  useEffect(() => () => cancelTokeerAvailabilityRefresh(), []);
  const savedRef=useRef<SavedTokeerSession|null>(readSavedSession());
  const selectorLayoutRef=useRef<TokeerDiscordState|null>(readSelectorLayout());
  const sessionStartedRef=useRef(savedRef.current?.startedAt||Date.now());
  const codeReceivedAtRef=useRef<number|undefined>(savedRef.current?.codeReceivedAt);
  const [discord,setDiscord]=useState<TokeerDiscordState|null>(selectorLayoutRef.current);
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
  const [selectedUbisoft,setSelectedUbisoft]=useState(!!savedRef.current?.selectedUbisoft);
  const [gate,setGate]=useState<TokeerTicketGate|null>(savedRef.current?.gate||null);
  const [ticket,setTicket]=useState<TokeerTicketContext|null>(savedRef.current?.ticket||null);
  const [discordSignedIn,setDiscordSignedIn]=useState(false);
  const [discordAuthChecked,setDiscordAuthChecked]=useState(false);
  const [autoConnect,setAutoConnect]=useState(readAutoConnect);
  const [automationStage,setAutomationStage]=useState<AutomationStage>(savedRef.current?.automationStage||"idle");
  const [tlxSubmitted,setTlxSubmitted]=useState(!!savedRef.current?.tlxSubmitted);
  const [submittedTlx,setSubmittedTlx]=useState(savedRef.current?.submittedTlx||"");
  const [automationError,setAutomationError]=useState(savedRef.current?.automationError||"");
  const [hostedGames,setHostedGames]=useState<UbisoftHostedGame[]>([]);
  const [ubisoftAppliedAt,setUbisoftAppliedAt]=useState(Number(savedRef.current?.ubisoftAppliedAt||0));
  const [ubisoftTokenPath,setUbisoftTokenPath]=useState(savedRef.current?.ubisoftTokenPath||"");
  const [ubisoftTokenMessageId,setUbisoftTokenMessageId]=useState(savedRef.current?.ubisoftTokenMessageId||"");
  const [restoringSelectors,setRestoringSelectors]=useState(!!selectorLayoutRef.current);
  const [ubisoftContinuationRunning,setUbisoftContinuationRunning]=useState(false);
  const automationRunningRef=useRef(false);
  const ubisoftCompletionPausedRef=useRef(false);
  const ticketAbortedRef=useRef(false);
  const ticketGenerationRef=useRef(0);
  const selectedUbisoftRef=useRef(!!savedRef.current?.selectedUbisoft);
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
      selectedGame,selectedUbisoft,selectedMenus,ticket,gate,activation,verify,message,
      automationStage,tlxSubmitted,submittedTlx,automationError,
      ubisoftAppliedAt,ubisoftTokenPath,ubisoftTokenMessageId,
    };
    try{window.localStorage.setItem(TOKEER_SESSION_KEY,JSON.stringify(data));}catch{}
  },[selectedGame,selectedUbisoft,selectedMenus,ticket,gate,activation,verify,message,codeExpiresAt,automationStage,tlxSubmitted,submittedTlx,automationError,ubisoftAppliedAt,ubisoftTokenPath,ubisoftTokenMessageId]);

  useEffect(()=>{
    tokeerUbisoftHostedGames().then((result)=>setHostedGames(result.success?result.games||[]:[])).catch(()=>setHostedGames([]));
  },[]);

  useEffect(()=>{
    if(!codeExpiresAt)return;
    const tick=()=>setClockNow(Date.now());
    tick();
    const timer=setInterval(tick,250);
    return()=>clearInterval(timer);
  },[codeExpiresAt]);

  const rememberDiscord=(state:TokeerDiscordState,markRestoringOnMiss=false)=>{
    if(state.found&&(state.selectors||[]).length){
      selectorLayoutRef.current=state;
      try{window.localStorage.setItem(TOKEER_SELECTOR_CACHE_KEY,JSON.stringify(state));}catch{}
      setDiscord(state);
      setRestoringSelectors(false);
      return;
    }
    // A ticket route or temporarily unmounted Discord message must not erase
    // the last confirmed selector layout. Explicit restoration callers may
    // keep it disabled; passive health checks leave working buttons enabled.
    if(selectorLayoutRef.current){
      setDiscord(selectorLayoutRef.current);
      // Passive 15-second health checks frequently miss Discord's virtualized
      // message for one frame. Such a miss must not disable working buttons.
      if(markRestoringOnMiss)setRestoringSelectors(true);
    }
    else setDiscord(state);
  };
  const refreshDiscord=async()=>{ try{
    const [state,auth]=await Promise.all([readTokeerDiscord(),getDiscordSignInState()]);
    // A successfully parsed activation panel is stronger evidence than the
    // users/@me probe: Steam's Discord webview can block that API request even
    // while its authenticated channel DOM is fully available.
    // A network-blocked users/@me probe is "unknown", not "logged out".
    // Preserve a previously enabled silent connection unless Discord renders
    // an actual login route/form or returns an authentication rejection.
    const signedIn=auth.signedIn||state.found||(!auth.signedOut&&readAutoConnect());
    if(auth.signedOut){
      selectorLayoutRef.current=null;
      try{window.localStorage.removeItem(TOKEER_SELECTOR_CACHE_KEY);}catch{}
      setDiscord(state);setRestoringSelectors(false);
    }else rememberDiscord(state);
    setDiscordSignedIn(signedIn);
    return {state,signedIn,authFound:auth.found};
  }catch{return null;} };
  const ticketChainActive=()=>!!(ticket?.opened||ticket?.url||gate?.found);
  const ticketUsesUbisoftVerifier=(ctx?:TokeerTicketContext|null)=>
    selectedUbisoftRef.current||selectedUbisoft||!!ctx?.ubisoft||/(?:tokeer\s+verify-ubi\b|(?:^|\s)--ubi\b|\bUbiTokeer\b)/i.test(String(ctx?.rawText||""));
  // Tokeer appends the access tier to some Ubisoft dropdown options (for
  // example "Assassin's Creed Shadows Free • 6 of 10 remaining"). Keep the
  // original value as the Discord click target, but do not present the tier as
  // though it were part of the game's name.
  const displayGameLabel=(label:string)=>String(label||"")
    .replace(/\s+Free(?=\s*[•·|/\-]*\s*\d+\s+of\s+\d+\s+remaining)/i,"")
    .trim();
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
    if(readAutoConnect()){
      try{window.localStorage.setItem(TOKEER_AUTO_CONNECT_KEY,"1");}catch{}
    }
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
        let observed=await refreshDiscord();
        const deadline=Date.now()+20000;
        while(ok&&(!observed?.state.found||!(observed.state.selectors||[]).length)&&Date.now()<deadline){
          await sleep(500);
          observed=await refreshDiscord();
        }
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
      let items=await openSelectorAndReadOptions(i);
      const selector=(discord?.selectors||[]).find((entry)=>entry.index===i);
      if(/ubi(?:soft)?/i.test(String(selector?.label||""))){
        let catalog=hostedGames;
        if(!catalog.length){
          const result=await tokeerUbisoftHostedGames().catch(()=>null);
          catalog=result?.success?result.games||[]:[];
          if(catalog.length)setHostedGames(catalog);
        }
        const allowed=new Set(catalog.flatMap((game)=>[game.name,...(game.aliases||[])]).map(normalizeTokeerGameName));
        items=items.filter((label)=>allowed.has(normalizeTokeerGameName(parseTokeerGameLabel(label)?.name||label)));
        if(!items.length)setMessage(catalog.length?"No currently hosted Ubisoft games were present in Discord's live selector.":"The hosted Ubisoft package catalog could not be loaded.");
      }
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
      while((!state.found||!(state.selectors||[]).length)&&Date.now()<deadline){
        await sleep(500);
        state=await readTokeerDiscord(true);
      }
      rememberDiscord(state,true);
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
    const installedAppid=Number(installed.appid||0);
    if(installedAppid&&hasLaunchRepoint(installedAppid)){
      const removed=setLaunchRepoint(installedAppid,null);
      const warning=removed
        ? "SLSDeck removed the redirect-target fix from this game's launch options. Select the game again to continue; your other launch arguments were preserved."
        : "This game's launch options still contain the SLSDeck redirect-target fix. Remove it before selecting this game for Tokeer; other launch arguments may remain.";
      setMessage(warning);
      toaster.toast({title:"SLSDeck · Tokeer",body:warning});
      setBusy("");
      return;
    }
    setBusy(`Selecting ${label} in Discord…`);
    const selectorLabel=discord?.selectors.find((selector)=>selector.index===index)?.label||"";
    const fromUbisoftList=/\bubi(?:soft)?\b/i.test(selectorLabel);
    if(fromUbisoftList){
      const normalized=normalizeTokeerGameName(parseTokeerGameLabel(label)?.name||label);
      const hosted=hostedGames.some((game)=>[game.name,...(game.aliases||[])].some((name)=>normalizeTokeerGameName(name)===normalized));
      if(!hosted){setMessage("This Ubisoft title is not in the hosted package catalog, so SLSDeck did not select it or open a ticket.");setBusy("");return;}
    }
    selectedUbisoftRef.current=fromUbisoftList;
    setSelectedUbisoft(fromUbisoftList);
    setSelectedGame(label); setGate(null); setTicket(null); setVerify(null);
    setAutomationStage("idle");setTlxSubmitted(false);setSubmittedTlx("");setAutomationError("");setUbisoftAppliedAt(0);setUbisoftTokenPath("");setUbisoftTokenMessageId("");
    setSelectedMenus((old)=>({...old,[index]:label}));
    const ok=await chooseSelectorOption(index,label);
    if(!ok){setMessage("Discord selection failed. Keep the Tokeer message open and retry.");setBusy("");return;}
    setBusy("Waiting for Tokeer confirmation…");
    setMessage(`Selected ${label}. Waiting for the newest bot message…`);
    await waitForGate();
    setBusy("");
  };

  const restoreActivationPanel=async(generation=ticketGenerationRef.current)=>{
    setRestoringSelectors(true);
    let restored=false;
    try{
      if(!(await connectTokeerDiscordHidden()))return;
      const deadline=Date.now()+20000;
      let state=await readTokeerDiscord(true);
      while((!state.found||!(state.selectors||[]).length)&&Date.now()<deadline){
        await sleep(500);
        state=await readTokeerDiscord(true);
      }
      if(generation!==ticketGenerationRef.current)return;
      if(state.found&&(state.selectors||[]).length){
        rememberDiscord(state);
        restored=true;
        setDiscordSignedIn(true);
        setDiscordAuthChecked(true);
      }
    }catch{}
    finally{
      if(generation===ticketGenerationRef.current)setRestoringSelectors(!restored&&!!selectorLayoutRef.current);
    }
  };

  const abortTicketChain=(reason:string)=>{
    ticketGenerationRef.current+=1;
    ticketAbortedRef.current=true;
    automationRunningRef.current=false;
    ubisoftCompletionPausedRef.current=true;
    setUbisoftContinuationRunning(false);
    try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
    selectedUbisoftRef.current=false;
    setSelectedGame("");setSelectedUbisoft(false);setSelectedMenus({});setOptions({});setTicket(null);setGate(null);setVerify(null);setActivation("");
    setCodeExpiresAt(undefined);setTlxSubmitted(false);setSubmittedTlx("");setUbisoftAppliedAt(0);setUbisoftTokenPath("");setUbisoftTokenMessageId("");
    // The chain is gone, so do not leave the old game/gate or an "aborted"
    // workflow card on screen. Keep only a concise Status explanation.
    setAutomationStage("idle");setAutomationError("");setMessage(reason);
    codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
    setBusy("");
    toaster.toast({title:"SLSDeck · Tokeer",body:reason.slice(0,220)});
    // A deleted ticket leaves Discord parked on a dead child route. Reopen the
    // real Linux activation panel so its live selector buttons return without
    // requiring the user to leave and reopen SLSDeck.
    void restoreActivationPanel(ticketGenerationRef.current);
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

  const runAutomation=async(ctx:TokeerTicketContext,resume?:SavedTokeerSession,generation=ticketGenerationRef.current)=>{
    if(automationRunningRef.current||!ctx.appid||!ctx.url)return;
    if(ticketAbortedRef.current||generation!==ticketGenerationRef.current)return;
    automationRunningRef.current=true;
    const stale=()=>ticketAbortedRef.current||generation!==ticketGenerationRef.current;
    const fail=(body:string)=>{
      if(stale())return;
      setAutomationStage("failed");setAutomationError(body);setMessage(body);
      checkpoint({automationStage:"failed",automationError:body,ticket:ctx});
      toaster.toast({title:"SLSDeck · Tokeer automation",body:body.slice(0,220)});
    };
    try{
      // Defence in depth for restored sessions: never run a Discord-derived
      // AppID when it disagrees with the installed game the user selected.
      if(selectedGame){
        const expected=await tokeerPreflight(0,selectedGame);
        if(stale())return;
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
        if(stale())return;
        if(!redeemed.success){fail(redeemed.error||redeemed.output||"Activation redemption failed.");return;}
        await tokeerMarkApplied(ctx.appid,parseTokeerGameLabel(selectedGame)?.name||selectedGame||`AppID ${ctx.appid}`,"steam",false);
        void refreshBadges();
        setAutomationStage("done");setMessage("Tokeer activation was redeemed successfully. Launch the game from Steam.");
        try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
        return;
      }

      if(stage!=="waiting-code"||!wasSubmitted){
        setAutomationStage("preparing");setAutomationError("");setBusy("Preparing and verifying Tokeer locally…");
        checkpoint({automationStage:"preparing",automationError:"",ticket:ctx});
        const preflight=await tokeerPreflight(ctx.appid,"");
        if(stale())return;
        if(!preflight.success||!preflight.installed){fail(preflight.error||"Game is not installed; Discord was not sent a verification result.");return;}
        const prepared=await setupAndVerifyTokeer(ctx.appid,setMessage,ticketUsesUbisoftVerifier(ctx));
        if(stale())return;
        if(!prepared.success||!prepared.code){fail(describeTokeerFailure(prepared));return;}
        tlx=prepared.code;setVerify(prepared);setSubmittedTlx(tlx);
        checkpoint({automationStage:"submitting",verify:prepared,submittedTlx:tlx,ticket:ctx});

        setAutomationStage("submitting");setBusy("Submitting verified TLX1 to the Discord ticket…");
        const sent=await sendTokeerTicketMessage(ctx.url,tlx);
        if(stale())return;
        if(sent.cancelled){abortTicketChain(`${sent.error||"The Discord ticket was cancelled."} Tokeer automation was aborted.`);return;}
        if(!sent.success){fail(sent.error||"Could not submit TLX1 to Discord.");return;}
        wasSubmitted=true;setTlxSubmitted(true);
        if(ticketUsesUbisoftVerifier(ctx)){
          let catalog=hostedGames;
          let hosted=catalog.find((game)=>Number(game.steamAppId)===Number(ctx.appid));
          if(!hosted){
            const result=await tokeerUbisoftHostedGames().catch(()=>null);
            catalog=result?.success?result.games||[]:[];
            if(catalog.length)setHostedGames(catalog);
            hosted=catalog.find((game)=>Number(game.steamAppId)===Number(ctx.appid));
          }
          if(!hosted){fail(`Steam AppID ${ctx.appid} is not in the hosted Ubisoft package catalog; no game files were changed.`);return;}
          setBusy("Waiting for Ubisoft verification confirmation…");
          setMessage("TLX1 was submitted. Waiting for Tokeer to confirm that Ubisoft verification passed before changing game files…");
          const confirmation=await waitForUbisoftVerificationConfirmation(ctx.url,sent.lastMessageId||ctx.lastMessageId||"",2*60*1000,stale);
          if(stale())return;
          if(confirmation.cancelled){abortTicketChain(confirmation.error||"The Discord ticket was closed.");return;}
          if(!confirmation.success||!confirmation.confirmed){fail(confirmation.error||"Ubisoft verification was not accepted; no game files were changed.");return;}
          const confirmedTicket={...ctx,lastMessageId:confirmation.lastMessageId||sent.lastMessageId||ctx.lastMessageId};
          setTicket((old)=>({...old,...confirmedTicket}));
          setAutomationStage("patching-ubisoft");setBusy("Applying the hosted Ubisoft package…");
          checkpoint({automationStage:"patching-ubisoft",tlxSubmitted:true,submittedTlx:tlx,verify:prepared,ticket:confirmedTicket});
          const applied=await tokeerApplyUbisoftPackage(ctx.appid);
          if(stale())return;
          if(!applied.success||!applied.appliedAt){fail(applied.error||"The hosted Ubisoft package could not be applied.");return;}
          const appliedAt=Number(applied.appliedAt);setUbisoftAppliedAt(appliedAt);setAutomationStage("waiting-token");
          checkpoint({automationStage:"waiting-token",tlxSubmitted:true,submittedTlx:tlx,verify:prepared,ticket:confirmedTicket,ubisoftAppliedAt:appliedAt,ubisoftTokenPath:"",ubisoftTokenMessageId:""});
          const launched=launchGame(ctx.appid);
          setMessage(launched
            ? `Verification was accepted locally, the hosted package was applied, and ${hosted.name} was launched. Return after it generates a token request, then press Continue Ubisoft ticket.`
            : `Verification was accepted locally and the hosted package was applied. Launch ${hosted.name}, return after it generates a token request, then press Continue Ubisoft ticket.`);
          return;
        }
        setAutomationStage("waiting-code");
        checkpoint({automationStage:"waiting-code",tlxSubmitted:true,submittedTlx:tlx,verify:prepared,ticket:ctx});
      }

      setAutomationStage("waiting-code");setBusy("Waiting for Discord activation code…");
      setMessage("Local verification passed and TLX1 was submitted. Waiting for Tokeer's six-character activation code…");
      const received=await waitForTokeerActivationCode(ctx.url,15*60*1000,ctx.lastMessageId||"",stale);
      if(stale())return;
      if(received.cancelled){abortTicketChain(`${received.error||"The Discord ticket was cancelled."} Tokeer automation was aborted.`);return;}
      if(!received.success||!received.code){fail(received.error||"No activation code was detected.");return;}
      const trackedTicket={...ctx,lastMessageId:received.lastMessageId||ctx.lastMessageId};
      setTicket((old)=>({...old,...trackedTicket}));
      updateActivation(received.code);setAutomationStage("redeeming");setBusy("Redeeming Tokeer activation locally…");
      checkpoint({automationStage:"redeeming",activation:received.code,codeReceivedAt:Date.now(),expiresAt:Date.now()+TOKEER_SESSION_MS,ticket:trackedTicket,tlxSubmitted:true,submittedTlx:tlx});
      const redeemed=await tokeerRedeem(received.code);
      if(stale())return;
      if(!redeemed.success){fail(redeemed.error||redeemed.output||"Activation redemption failed. The received code is preserved for manual retry.");return;}
      await tokeerMarkApplied(ctx.appid,parseTokeerGameLabel(selectedGame)?.name||selectedGame||`AppID ${ctx.appid}`,"steam",false);
      void refreshBadges();
      setAutomationStage("done");setMessage("Tokeer activation was received and redeemed automatically. Launch the game from Steam.");
      toaster.toast({title:"SLSDeck · Tokeer",body:"Activation received and redeemed successfully."});
      try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
      selectedUbisoftRef.current=false;
      setSelectedGame("");setSelectedUbisoft(false);setSelectedMenus({});setGate(null);setTicket(null);setVerify(null);setActivation("");setCodeExpiresAt(undefined);
      codeReceivedAtRef.current=undefined;sessionStartedRef.current=Date.now();
    }catch(e){if(!stale())fail(String(e));}
    finally{
      if(generation===ticketGenerationRef.current){automationRunningRef.current=false;setBusy("");}
    }
  };

  const continueUbisoftTicket=async()=>{
    if(!ticket?.url||!ticket.appid||!ubisoftAppliedAt)return setMessage("The saved Ubisoft activation state is incomplete; reopen the ticket flow.");
    const generation=ticketGenerationRef.current;
    ubisoftCompletionPausedRef.current=false;
    setUbisoftContinuationRunning(true);
    const stale=()=>ticketAbortedRef.current||ubisoftCompletionPausedRef.current||generation!==ticketGenerationRef.current;
    automationRunningRef.current=true;
    try{
      let tokenPath=ubisoftTokenPath,tokenMessageId=ubisoftTokenMessageId,tracked={...ticket};
      if(!tokenMessageId){
        setBusy("Finding the Ubisoft token request…");setAutomationStage("uploading-token");
        const token=await tokeerFindUbisoftToken(ticket.appid,ubisoftAppliedAt);
        if(stale())return;
        if(!token.success||!token.found||!token.path||!token.filename){
          setAutomationStage("waiting-token");setMessage(token.error||"No fresh Ubisoft token request was found yet. Run the game and retry Continue.");return;
        }
        tokenPath=token.path;setUbisoftTokenPath(tokenPath);
        checkpoint({automationStage:"uploading-token",ubisoftAppliedAt,ubisoftTokenPath:tokenPath,ubisoftTokenMessageId:"",ticket});
        setBusy("Checking the saved ticket for the Ubisoft token request…");
        const alreadyPosted=await findPostedTokeerTicketFile(ticket.url,token.filename);
        if(stale())return;
        if(alreadyPosted.success&&alreadyPosted.found){
          tokenMessageId=alreadyPosted.lastMessageId||ticket.lastMessageId||"";
        }else{
          setBusy("Uploading the Ubisoft token request to Discord…");
          const uploaded=await uploadTokeerTicketFile(ticket.url,tokenPath,token.filename);
          if(stale())return;
          if(uploaded.cancelled){abortTicketChain(uploaded.error||"The Discord ticket was closed.");return;}
          if(!uploaded.success){setAutomationStage("waiting-token");setMessage(uploaded.error||"The Ubisoft token request could not be uploaded.");return;}
          tokenMessageId=uploaded.lastMessageId||ticket.lastMessageId||"";
        }
        setUbisoftTokenMessageId(tokenMessageId);
        tracked={...ticket,lastMessageId:tokenMessageId||ticket.lastMessageId};setTicket(tracked);
      }
      setBusy("Checking for already-installed Ubisoft activation data…");
      let installed:any=await tokeerUbisoftDbdataStatus(ticket.appid,tokenPath);
      if(stale())return;
      let received:{lastMessageId?:string}={};
      if(!installed.success||!installed.installed){
        setAutomationStage("waiting-dbdata");setBusy("Waiting for Discord dbdata.json…");
        setMessage("The Ubisoft token request was uploaded. Waiting for Discord's Download dbdata.json response…");
        checkpoint({automationStage:"waiting-dbdata",ubisoftAppliedAt,ubisoftTokenPath:tokenPath,ubisoftTokenMessageId:tokenMessageId,ticket:tracked});
        const response=await waitForUbisoftDbdataLink(ticket.url,tokenMessageId,15*60*1000,stale);
        if(stale())return;
        if(response.cancelled){abortTicketChain(response.error||"The Discord ticket was closed.");return;}
        if(!response.success||!response.url){setAutomationStage("failed");setAutomationError(response.error||"Discord did not return dbdata.json.");setMessage(response.error||"Discord did not return dbdata.json.");return;}
        received=response;
        setAutomationStage("installing-dbdata");setBusy("Installing dbdata.json beside the token request…");
        installed=await tokeerInstallUbisoftDbdata(ticket.appid,tokenPath,response.url);
        if(stale())return;
        if(!installed.success){setAutomationStage("failed");setAutomationError(installed.error||"dbdata.json installation failed.");setMessage(installed.error||"dbdata.json installation failed.");return;}
      }
      const applied=await tokeerMarkApplied(ticket.appid,parseTokeerGameLabel(selectedGame)?.name||selectedGame||`AppID ${ticket.appid}`,"ubisoft",true);
      void refreshBadges();
      const pinNote=applied.pin?.success
        ? " The installed build was pinned."
        : ` The key is applied, but version pinning failed${applied.pin?.error?`: ${applied.pin.error}`:"."}`;
      setBusy("Confirming that the game worked in Discord…");
      const vouched=await clickTokeerGameWorked(ticket.url,received.lastMessageId||tracked.lastMessageId||"");
      if(stale())return;
      const vouchNote=vouched.success
        ? " The latest Game worked! button was pressed in Discord."
        : ` Discord could not press Game worked! automatically: ${vouched.error||"button not found"}`;
      setAutomationStage("done");setAutomationError("");setMessage(`Ubisoft activation data was installed in ${installed.directory||"the token-request folder"}.${pinNote}${vouchNote} Launch the game again.`);
      checkpoint({automationStage:"done",automationError:"",ubisoftAppliedAt,ubisoftTokenPath:tokenPath,ubisoftTokenMessageId:tokenMessageId,ticket:{...tracked,lastMessageId:received.lastMessageId||tracked.lastMessageId}});
      toaster.toast({title:"SLSDeck · Tokeer",body:vouched.success?"Ubisoft dbdata.json installed and Game worked! confirmed.":"Ubisoft dbdata.json installed successfully; Discord confirmation needs a manual press."});
    }catch(e){if(!stale()){setAutomationStage("failed");setAutomationError(String(e));setMessage(String(e));}}
    finally{
      if(generation===ticketGenerationRef.current){
        automationRunningRef.current=false;
        setUbisoftContinuationRunning(false);
        setBusy("");
      }
    }
  };

  const pauseUbisoftTicketCompletion=()=>{
    ubisoftCompletionPausedRef.current=true;
    automationRunningRef.current=false;
    setUbisoftContinuationRunning(false);
    setBusy("");
    const resumeStage=ubisoftTokenMessageId?"waiting-dbdata":"waiting-token";
    setAutomationStage(resumeStage);
    setAutomationError("");
    const pausedMessage=ubisoftTokenMessageId
      ? "Ubisoft ticket completion paused. Press Continue Ubisoft ticket to resume searching for dbdata.json."
      : "Ubisoft ticket completion paused. Press Continue Ubisoft ticket to resume finding and uploading the token request.";
    setMessage(pausedMessage);
    checkpoint({automationStage:resumeStage,automationError:"",ubisoftTokenPath,ubisoftTokenMessageId,ticket});
  };

  const openTicket=async()=>{
    const generation=++ticketGenerationRef.current;
    ticketAbortedRef.current=false;
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
        if(generation===ticketGenerationRef.current&&!ticketAbortedRef.current){
          const classified={...discovered,ubisoft:selectedUbisoftRef.current||discovered.ubisoft};
          setTicket(classified);
          checkpoint({ticket:classified,selectedUbisoft:selectedUbisoftRef.current});
        }
      },expectedName);
      if(generation!==ticketGenerationRef.current||ticketAbortedRef.current)return;
      const classifiedCtx={...ctx,ubisoft:selectedUbisoftRef.current||ctx.ubisoft};
      setTicket(classifiedCtx);
      if(classifiedCtx.found&&classifiedCtx.appid){
        setMessage(`Ticket opened for ${selectedGame||"selected game"}. Starting local preparation and automatic verification.`);
        await runAutomation(classifiedCtx,undefined,generation);
      }else{
        setMessage(classifiedCtx.error||"Ticket opened, but the AppID commands were not found yet.");
      }
    }catch(e){if(generation===ticketGenerationRef.current&&!ticketAbortedRef.current)setMessage(String(e));}
    finally{if(generation===ticketGenerationRef.current)setBusy("");}
  };

  const resumeTicket=async()=>{
    if(!ticket?.url)return setMessage("The saved ticket URL is missing; show embedded Discord and reopen the ticket.");
    const generation=++ticketGenerationRef.current;
    ticketAbortedRef.current=false;
    setBusy("Resuming Tokeer ticket…");
    setMessage("Reopening the existing private ticket and scanning its generated commands…");
    try{
      const state=await probeTokeerTicketState(ticket.url);
      if(generation!==ticketGenerationRef.current||ticketAbortedRef.current)return;
      if(state.closed){abortTicketChain(`${state.reason||"The saved Discord ticket no longer exists."} Its stale Tokeer session was cleared.`);return;}
      const installed=selectedGame?await tokeerPreflight(0,selectedGame):null;
      const expectedAppid=Number(installed?.success&&installed.installed?installed.appid||0:0);
      const expectedName=parseTokeerGameLabel(selectedGame)?.name||selectedGame;
      const ctx=await waitForTicketContext(ticket.url,35000,expectedAppid,[],undefined,expectedName);
      if(generation!==ticketGenerationRef.current||ticketAbortedRef.current)return;
      const classifiedCtx={...ctx,ubisoft:selectedUbisoftRef.current||ctx.ubisoft};
      setTicket((old)=>({...old,...classifiedCtx,url:classifiedCtx.url||old?.url,opened:true}));
      if(classifiedCtx.found&&classifiedCtx.appid){setMessage(`Commands detected. Resuming Tokeer automation for Steam AppID ${classifiedCtx.appid}.`);await runAutomation({...ticket,...classifiedCtx,url:classifiedCtx.url||ticket.url,opened:true},savedRef.current||undefined,generation);}
      else setMessage(classifiedCtx.error||"Ticket is open, but its AppID still was not found.");
    }catch(e){if(generation===ticketGenerationRef.current&&!ticketAbortedRef.current)setMessage(String(e));}
    finally{if(generation===ticketGenerationRef.current)setBusy("");}
  };

  useEffect(()=>{
    const saved=savedRef.current;
    if(!saved?.ticket?.found||!saved.ticket.appid||!saved.ticket.url)return;
    if(!["preparing","submitting","waiting-code","redeeming"].includes(saved.automationStage||""))return;
    const generation=++ticketGenerationRef.current;
    ticketAbortedRef.current=false;
    const timer=setTimeout(()=>runAutomation(saved.ticket!,saved,generation),500);
    return()=>clearTimeout(timer);
  },[]);

  const cancelTicket=async()=>{
    if(!ticket?.url)return setMessage("No saved private ticket URL is available.");
    // Stop the long-running activation-code poll before it can navigate the
    // managed Discord view back to this ticket during cleanup.
    ticketAbortedRef.current=true;
    automationRunningRef.current=false;
    setBusy("Cancelling Tokeer ticket…");
    try{
      const r=await cancelTokeerTicket(ticket.url);
      if(!r.success){
        const state=await probeTokeerTicketState(ticket.url);
        if(state.closed){abortTicketChain(`${state.reason||"The Discord ticket was already closed."} Its stale Tokeer session was cleared.`);return;}
        if(r.unavailable){
          abortTicketChain("The exact saved Discord ticket no longer opens. The stale local Tokeer chain was cleared; no other Discord channel was touched. If the ticket still exists in Discord, close it there manually.");
          return;
        }
        abortTicketChain(state.open
          ? "The Discord ticket is still open, but no cancellation button was found after scanning the thread. Close it manually in Discord. The local Tokeer chain and cache were cleared."
          : "SLSDeck could not find a cancellation button or confirm that the Discord ticket closed. Check Discord and close it manually if it remains. The local Tokeer chain and cache were cleared.");
        return;
      }
      abortTicketChain("Ticket cancelled in Discord. The saved Tokeer session was cleared.");
    }catch(e){
      abortTicketChain(`Discord cancellation failed unexpectedly (${String(e)}). Check the ticket and close it manually if it remains. The local Tokeer chain and cache were cleared.`);
    }
    finally{setBusy("");}
  };

  const resolveTicketAppid=async():Promise<number>=>{
    const generation=ticketGenerationRef.current;
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
      if(generation!==ticketGenerationRef.current||ticketAbortedRef.current)return 0;
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
      const r=await setupAndVerifyTokeer(resolvedAppid,setMessage,ticketUsesUbisoftVerifier(ticket));
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
      const r=await tokeerVerify(resolvedAppid,ticketUsesUbisoftVerifier(ticket));
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
    const resolvedAppid=await resolveTicketAppid();
    if(!resolvedAppid)return;
    setBusy("Writing activation ticket…");
    try{
      const r=await tokeerRedeem(activation.trim());
      setMessage(r.success?"Activation written successfully. Launch the game from Steam.":(r.error||r.output||"Activation failed."));
      if(r.success){
        await tokeerMarkApplied(resolvedAppid,parseTokeerGameLabel(selectedGame)?.name||selectedGame||`AppID ${resolvedAppid}`,"steam",false);
        void refreshBadges();
        try{window.localStorage.removeItem(TOKEER_SESSION_KEY);}catch{}
        selectedUbisoftRef.current=false;
        setSelectedGame("");setSelectedUbisoft(false);setSelectedMenus({});setGate(null);setTicket(null);
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
      <PanelSectionRow><div style={{width:"100%",marginTop:8,padding:"11px 12px",borderRadius:8,background:"linear-gradient(135deg,rgba(255,183,77,.13),rgba(96,125,139,.12))",border:"1px solid rgba(255,193,94,.32)",boxShadow:"0 4px 14px rgba(0,0,0,.16)",fontSize:11,lineHeight:1.55,color:"#f4f6fa"}}>
        <div style={{fontSize:12,fontWeight:850,marginBottom:5,color:"#ffd180",letterSpacing:.15}}>Before activation</div>
        <div>Finish preparing the game before redeeming it. Install any mods, texture packs, fixes, or other changes that modify the game files first.</div>
        <div style={{marginTop:5,opacity:.82}}>Changing game files after activation is not advised, because it may invalidate the activated setup and require you to verify or recover the files again.</div>
        <div style={{marginTop:7,paddingTop:7,borderTop:"1px solid rgba(255,255,255,.1)",fontSize:10,opacity:.68}}>SLSDeck mirrors the real Linux activation panel in your logged-in Discord Steam-CEF tab. Discord remains the source of truth for availability, remaining keys, and the Steam AppID.</div>
      </div></PanelSectionRow>
      {discord?.found&&<PanelSectionRow><div style={{width:"100%",padding:"9px 11px",borderRadius:8,background:"linear-gradient(135deg,rgba(71,184,255,.18),rgba(88,220,143,.09))",border:"1px solid rgba(104,205,255,.35)",fontSize:12,lineHeight:1.6,color:"#f4fbff"}}><span style={{color:restoringSelectors?"#ffd166":"#65e69b",fontWeight:800}}>● {restoringSelectors?"RESTORING GAME LIST…":"LIVE"}</span> · Steam: <b style={{color:"#fff"}}>{discord.steamStatus||"Unknown"}</b></div></PanelSectionRow>}
      {(discord?.selectors||[]).map(s=><PanelSectionRow key={s.index}><DropdownItem
        label={s.label||`Game menu ${s.index+1}`}
        description={restoringSelectors?"Returning to the Linux activation panel…":"Live game list from the Tokeer Discord panel"}
        disabled={s.disabled||!!busy||restoringSelectors||ticketChainActive()}
        rgOptions={(options[s.index]||[]).map(x=>({data:x,label:displayGameLabel(x)}))}
        selectedOption={selectedMenus[s.index]||null}
        strDefaultLabel={s.label||"Choose a game"}
        onMenuWillOpen={(showMenu)=>openMenu(s.index,showMenu)}
        onChange={(o:any)=>choose(s.index,String(o.data))}
      /></PanelSectionRow>)}
      {!discord?.found&&<PanelSectionRow><div style={{fontSize:11,opacity:.7}}>{discord?.error||"Open the Linux activation message once and leave the Discord tab alive."}</div></PanelSectionRow>}
    </PanelSection>

    {(selectedGame||gate)&&<PanelSection title="Open activation ticket">
      {selectedGame&&<PanelSectionRow><div style={{fontSize:12}}>Selected: <b>{displayGameLabel(selectedGame)}</b> · Verifier: <b>{selectedUbisoft?"Ubisoft":"Steam"}</b></div></PanelSectionRow>}
      {ticket?.opened&&!ticket.appid
        ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||!ticket.url} onClick={resumeTicket}>Resume existing ticket / detect commands</ButtonItem></PanelSectionRow>
        :gate?.found
          ?<PanelSectionRow><ButtonItem layout="below" disabled={!!busy||gate.disabled} onClick={openTicket}>Create a ticket</ButtonItem></PanelSectionRow>
          :<PanelSectionRow><ButtonItem layout="below" disabled={!!busy} onClick={waitForGate}>Refresh confirmation</ButtonItem></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><div style={{fontSize:10,opacity:.7}}>Private ticket saved. {codeExpiresAt?"Activation-code countdown is running.":"The 30-minute code timer has not started yet."}</div></PanelSectionRow>}
      {selectedUbisoft&&ticket?.opened&&ticket.url&&ubisoftAppliedAt>0&&(ubisoftContinuationRunning||["waiting-token","uploading-token","waiting-dbdata","installing-dbdata","failed"].includes(automationStage))&&<PanelSectionRow><ButtonItem layout="below" disabled={!ubisoftContinuationRunning&&!!busy} onClick={ubisoftContinuationRunning?pauseUbisoftTicketCompletion:continueUbisoftTicket}>{ubisoftContinuationRunning?"Pause ticket completion":"Continue Ubisoft ticket"}</ButtonItem></PanelSectionRow>}
      {ticket?.opened&&ticket.url&&<PanelSectionRow><ButtonItem layout="below" disabled={!!busy&&!["Waiting for Discord activation code…","Waiting for Ubisoft verification confirmation…","Waiting for Discord dbdata.json…"].includes(busy)} onClick={cancelTicket}>Cancel ticket in Discord</ButtonItem></PanelSectionRow>}
      {ticket?.found&&ticket.appid&&<PanelSectionRow><div style={{fontSize:11}}>Ticket detected · Steam AppID <b>{ticket.appid}</b> (read automatically from Tokeer's commands)</div></PanelSectionRow>}
      {automationStage!=="idle"&&<PanelSectionRow><div style={{fontSize:11,lineHeight:1.45}}>Automation: <b>{automationStage.replace("-"," ")}</b>{tlxSubmitted?" · TLX1 submitted":""}{automationError?<div style={{color:"#ff7b72",marginTop:3}}>{automationError}</div>:null}</div></PanelSectionRow>}
    </PanelSection>}

    {selectedGame&&ticket?.found&&ticket.appid&&!selectedUbisoft&&<PanelSection title="Prepare & verify">
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

    {(ticket?.opened||!!activation||!!verify||automationStage!=="idle")&&<PanelSection title="Redeem activation">
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
    </PanelSection>}
  </>;
}
