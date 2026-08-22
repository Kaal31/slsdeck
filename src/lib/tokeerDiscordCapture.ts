import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
const GUILD_ID = "1464130182364270696";
const TOKEER_CHANNEL = `/channels/${GUILD_ID}/1534460498446127175`;
const TARGET_MESSAGE = "1535685399265935422";
const CDP_PORTS = [8080, 8081];
const TOKEER_VIEW_NAME = "slsdeck_tokeer";

interface CdpTab { url: string; title?: string; type?: string; webSocketDebuggerUrl?: string; resolvedUrl?: string; cdpPort?: number }
export type TokeerDiscordState = {
  found: boolean;
  steamStatus?: string;
  gamesListed?: number;
  steamGames?: number;
  eaGames?: number;
  ubisoftGames?: number;
  keysRemaining?: number;
  highDemand?: number;
  selectors: Array<{ index: number; label: string; disabled: boolean }>;
  rawText?: string;
  error?: string;
  tabUrl?: string;
};

export type TokeerTicketGate = {
  found: boolean;
  label?: string;
  disabled?: boolean;
  messageText?: string;
  error?: string;
};

export type TokeerTicketContext = {
  found: boolean;
  appid?: number;
  url?: string;
  rawText?: string;
  error?: string;
};

async function listCdpTabs(): Promise<CdpTab[]> {
  const merged: CdpTab[] = [];
  const seen = new Set<string>();
  for (const port of CDP_PORTS) {
    try {
      const r = await fetchNoCors(`http://localhost:${port}/json`);
      const tabs: CdpTab[] = await r.json();
      if (!Array.isArray(tabs)) continue;
      for (const tab of tabs) {
        const key = String(tab.webSocketDebuggerUrl || `${tab.type || ""}|${tab.title || ""}|${tab.url || ""}`);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push({ ...tab, cdpPort: port });
      }
    } catch {
      /* this debugger port is not active */
    }
  }
  return merged;
}

function cdpCommand(wsUrl: string, method: string, params: Record<string, any> = {}, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: any) => {
      if (done) return;
      done = true;
      try { sock.close(); } catch {}
      resolve(v);
    };
    try { sock = new WebSocket(wsUrl); } catch { resolve(null); return; }
    const id = 1;
    sock.onopen = () => sock.send(JSON.stringify({ id, method, params }));
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(String(ev.data));
        if (m?.id === id) finish(m?.result ?? null);
      } catch {}
    };
    sock.onerror = () => finish(null);
    setTimeout(() => finish(null), timeoutMs);
  });
}

async function evalJson(wsUrl: string, expression: string, timeoutMs = 5000): Promise<any> {
  const result = await cdpCommand(wsUrl, "Runtime.evaluate", { expression, returnByValue: true }, timeoutMs);
  return result?.result?.value ?? null;
}

async function evalDetailed(wsUrl: string, expression: string, timeoutMs = 5000): Promise<{ value?: any; error?: string }> {
  const result = await cdpCommand(wsUrl, "Runtime.evaluate", { expression, returnByValue: true }, timeoutMs);
  const error = result?.exceptionDetails?.exception?.description || result?.exceptionDetails?.text;
  if (error) return { error: String(error) };
  return { value: result?.result?.value };
}

function looksLikeDiscordUrl(url: string): boolean {
  return /(^|\.)discord\.com(?:\/|$)/i.test(String(url || "").replace(/^https?:\/\//i, ""));
}

/** Steam external-web surfaces sometimes report a wrapper URL in /json. Ask the
 * actual JS execution context what it is rendering instead of trusting metadata. */
async function resolveTabUrl(t: CdpTab): Promise<string> {
  if (!t.webSocketDebuggerUrl) return String(t.url || "");
  const expr = `(function(){try{
    var here=String(location.href||document.URL||'');
    var frames=[].slice.call(document.querySelectorAll('iframe')).map(function(f){return String(f.src||'');});
    return JSON.stringify({here:here,frames:frames});
  }catch(e){return JSON.stringify({here:'',frames:[]});}})()`;
  const raw = await evalJson(t.webSocketDebuggerUrl, expr, 1800);
  try {
    const parsed = JSON.parse(String(raw || ""));
    const urls = [parsed?.here, ...(Array.isArray(parsed?.frames) ? parsed.frames : [])].filter(Boolean);
    return urls.find((u: string) => looksLikeDiscordUrl(u)) || String(parsed?.here || t.url || "");
  } catch {
    return String(t.url || "");
  }
}

async function findDiscordTab(): Promise<CdpTab | null> {
  const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
  let fallback: CdpTab | null = null;
  for (const tab of tabs) {
    const resolvedUrl = await resolveTabUrl(tab);
    if (!looksLikeDiscordUrl(resolvedUrl)) continue;
    const resolved = { ...tab, resolvedUrl, url: resolvedUrl };
    if (resolvedUrl.includes(TOKEER_CHANNEL)) return resolved;
    if (!fallback) fallback = resolved;
  }
  return fallback;
}

async function findSharedJsContext(): Promise<CdpTab | null> {
  const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
  return tabs.find((t) => String(t.title || "") === "SharedJSContext")
    || tabs.find((t) => /SharedJSContext/i.test(String(t.title || "")))
    || null;
}

async function hasTokeerBrowserView(): Promise<boolean> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return false;
  return !!(await evalJson(shared.webSocketDebuggerUrl,
    `(function(){try{return !!(window.SLSDECK_TOKEER_VIEW&&window.SLSDECK_TOKEER_VIEW.m_browserView);}catch(e){return false;}})()`, 2000));
}

async function hideTokeerBrowserView(): Promise<void> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return;
  await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;
    if(!v||!v.m_browserView)return false;
    v.m_browserView.SetVisible(false);return true;
  }catch(e){return false;}})()`, 2000);
}

async function parkTokeerBrowserView(): Promise<void> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return;
  await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;
    if(!v||!v.m_browserView)return false;
    // A truly hidden Chromium view is suspended. Keep a normal-sized surface
    // rendered far outside the Steam viewport so Discord stays live without
    // being visible or receiving gamepad input.
    v.m_browserView.SetBounds(-10000,-10000,1280,720);
    v.m_browserView.SetVisible(true);return true;
  }catch(e){return false;}})()`, 2000);
}

export type TokeerViewBounds = { x: number; y: number; width: number; height: number };

export async function positionTokeerDiscordEmbedded(bounds: TokeerViewBounds): Promise<boolean> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return false;
  const b = {
    x: Math.max(0, Math.round(bounds.x)), y: Math.max(0, Math.round(bounds.y)),
    width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)),
  };
  return !!(await evalJson(shared.webSocketDebuggerUrl, `(function(){try{
    var v=window.SLSDECK_TOKEER_VIEW;if(!v||!v.m_browserView)return false;
    v.m_browserView.SetBounds(${b.x},${b.y},${b.width},${b.height});
    v.m_browserView.SetVisible(true);return true;
  }catch(e){return false;}})()`, 2000));
}

export async function hideTokeerDiscordEmbedded(): Promise<void> {
  await parkTokeerBrowserView();
}

export async function showTokeerDiscordEmbedded(bounds: TokeerViewBounds): Promise<boolean> {
  if (!(await connectTokeerDiscordHidden())) return false;
  return positionTokeerDiscordEmbedded(bounds);
}

async function waitForExactUrl(url: string, timeoutMs = 6500): Promise<CdpTab | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const tabs = await listCdpTabs();
    const tab = tabs.find((t) => !!t.webSocketDebuggerUrl && String(t.url || "") === url);
    if (tab) return tab;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

/**
 * Steamcord-style creation path: create a BrowserView from Steam's debuggable
 * SharedJSContext, tag it with a unique data: URL, discover that exact CDP target,
 * then navigate the target to Discord. This avoids NavigateToExternalWeb, whose
 * BrowserView is not exposed in CDP on some Steam Deck builds.
 */
async function createTokeerDiscordBrowserView(): Promise<CdpTab | null> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return null;

  const placeholder = `data:text/plain,slsdeck_tokeer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const expr = `(function(){try{
    if(window.SLSDECK_TOKEER_VIEW!==undefined){
      try{window.SLSDECK_TOKEER_VIEW.m_browserView.SetVisible(false);}catch(e){}
      try{window.SLSDECK_TOKEER_VIEW.Destroy();}catch(e){}
      window.SLSDECK_TOKEER_VIEW=undefined;
    }
    var main=window.DFL&&window.DFL.Router&&window.DFL.Router.WindowStore&&window.DFL.Router.WindowStore.GamepadUIMainWindowInstance;
    if(!main||typeof main.CreateBrowserView!=='function') return JSON.stringify({ok:false,error:'CreateBrowserView unavailable'});
    var view=main.CreateBrowserView(${JSON.stringify(TOKEER_VIEW_NAME)});
    window.SLSDECK_TOKEER_VIEW=view;
    try{view.WIDTH=1280;view.HEIGHT=720;view.m_browserView.SetBounds(-10000,-10000,1280,720);}catch(e){}
    // Visible to Chromium (so it renders), parked outside Steam's viewport.
    try{view.m_browserView.SetVisible(true);}catch(e){}
    view.m_browserView.LoadURL(${JSON.stringify(placeholder)});
    return JSON.stringify({ok:true});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;

  const raw = await evalJson(shared.webSocketDebuggerUrl, expr, 4000);
  try {
    const created = JSON.parse(String(raw || ""));
    if (!created?.ok) return null;
  } catch {
    return null;
  }

  const target = await waitForExactUrl(placeholder);
  if (!target?.webSocketDebuggerUrl) return null;

  // Keep Discord's SPA active while the Deck/QAM focus changes.
  await cdpCommand(target.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
  await cdpCommand(target.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
  const nav = await cdpCommand(target.webSocketDebuggerUrl, "Page.navigate", {
    url: TOKEER_DISCORD_URL,
    transitionType: "address_bar",
  }, 4000);
  if (!nav) return null;

  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const tab = await findDiscordTab();
    if (tab?.webSocketDebuggerUrl) return tab;
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

async function cdpDiagnostic(): Promise<string> {
  const tabs = await listCdpTabs();
  if (!tabs.length) return "CDP 8080/8081 returned no targets.";
  const ports = Array.from(new Set(tabs.map((t) => t.cdpPort).filter(Boolean))).join("/");
  const shared = tabs.some((t) => /SharedJSContext/i.test(String(t.title || "")));
  return `Steam CDP is active on ${ports || "an unknown port"} (${tabs.length} targets; SharedJSContext ${shared ? "found" : "missing"}).`;
}

async function navigateDiscordTabToTokeer(tab: CdpTab): Promise<boolean> {
  if (!tab.webSocketDebuggerUrl) return false;
  const liveUrl = await resolveTabUrl(tab);
  if (liveUrl.includes(TOKEER_CHANNEL)) return true;
  const nav = await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
    url: TOKEER_DISCORD_URL,
    transitionType: "address_bar",
  }, 4000);
  return !!nav;
}

const SNAPSHOT_EXPR = `(function(){try{
  var id=${JSON.stringify(TARGET_MESSAGE)};
  var exact=document.querySelector('[data-list-item-id$="-'+id+'"]') || (document.querySelector('#message-accessories-'+id) && document.querySelector('#message-accessories-'+id).closest('[role="article"]')) || (document.querySelector('#message-reactions-'+id) && document.querySelector('#message-reactions-'+id).closest('[role="article"]'));
  var arts=[].slice.call(document.querySelectorAll('[role="article"]'));
  var controls=function(a){return [].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"],button[aria-expanded]'));};
  var article=exact || arts.reverse().find(function(a){var t=(a.innerText||'');return controls(a).length>0 && /steam|games? listed|keys? remaining|high demand|tokeer/i.test(t);});
  if(!article) return {found:false,selectors:[],error:'Discord is open, but the Tokeer activation panel is not rendered. Sign in if needed, open the Linux activation channel, and press Refresh.'};
  var text=(article.innerText||'').replace(/\u00a0/g,' ');
  var n=function(re){var m=text.match(re);return m?Number(m[1]):undefined};
  var sv=function(re){var m=text.match(re);return m?m[1].trim():undefined};
  var selects=controls(article).filter(function(e){return e.getAttribute('aria-haspopup')==='listbox'||e.getAttribute('role')==='combobox';}).map(function(e,i){
    var label=(e.innerText||e.textContent||'').trim();
    return {index:i,label:label,disabled:e.getAttribute('aria-disabled')==='true'};
  });
  return {found:true,steamStatus:sv(/Steam\\s*:\\s*([^\\n]+)/i),gamesListed:n(/Games listed:\\s*(\\d+)/i),steamGames:n(/Games listed:[\\s\\S]*?Steam[^\\d]*(\\d+)/i),keysRemaining:n(/Keys remaining:\\s*(\\d+)/i),highDemand:n(/High demand:\\s*(\\d+)/i),selectors:selects,rawText:text.slice(0,12000)};
}catch(e){return {found:false,selectors:[],error:String(e)};}})()`;

export async function readTokeerDiscord(): Promise<TokeerDiscordState> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) {
    const diag = await cdpDiagnostic();
    return { found: false, selectors: [], error: `No Discord page found in Steam CDP. ${diag}` };
  }
  if (!tab.url?.includes(TOKEER_CHANNEL)) {
    return { found: false, selectors: [], tabUrl: tab.url, error: "Discord is visible in Steam CEF, but it is on a different page. Press ‘Open Tokeer Discord’ to return to the activation panel." };
  }
  const snap = await evalDetailed(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
  if (snap.error) return { found: false, selectors: [], tabUrl: tab.url, error: `Discord DOM evaluation failed: ${snap.error}` };
  if (!snap.value || typeof snap.value !== "object") return { found: false, selectors: [], tabUrl: tab.url, error: "Discord DOM snapshot returned no object." };
  return { ...snap.value, selectors: Array.isArray(snap.value.selectors) ? snap.value.selectors : [], tabUrl: tab.url };
}

export async function openSelectorAndReadOptions(index: number): Promise<string[]> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return [];
  const clickExpr = `(function(){try{var id=${JSON.stringify(TARGET_MESSAGE)};var arts=[].slice.call(document.querySelectorAll('[role="article"]'));var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]')||arts.reverse().find(function(x){return x.querySelector('[aria-haspopup="listbox"],[role="combobox"]')&&/steam|games?|keys?|tokeer/i.test(x.innerText||'');});var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(x){return x.getAttribute('aria-haspopup')==='listbox'||x.getAttribute('role')==='combobox';}):[];var e=xs[${Number(index)}];if(!e)return false;var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,o));});return true;}catch(e){return false;}})()`;
  const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr);
  if (!ok) return [];
  await new Promise((r) => setTimeout(r, 450));
  const optionsExpr = `(function(){try{return JSON.stringify([].slice.call(document.querySelectorAll('[role="option"],[role="menuitem"],[aria-selected]')).filter(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).map(function(e){return (e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();}).filter(Boolean));}catch(e){return '[]';}})()`;
  const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr);
  try { return JSON.parse(String(raw || "[]")); } catch { return []; }
}

export async function chooseSelectorOption(index: number, label: string): Promise<boolean> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return false;
  const visibleExpr = `(function(){try{var want=${JSON.stringify(label)};return [].slice.call(document.querySelectorAll('[role="option"],[role="menuitem"],[aria-selected]')).some(function(e){var r=e.getBoundingClientRect(),t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();return r.width>0&&r.height>0&&t===want;});}catch(e){return false;}})()`;
  const alreadyOpen = !!(await evalJson(tab.webSocketDebuggerUrl, visibleExpr));
  if (!alreadyOpen) await openSelectorAndReadOptions(index);
  const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="option"],[role="menuitem"],[aria-selected]')).find(function(e){return (e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim()===want;});if(!o)return false;var r=o.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;o.dispatchEvent(new C(n,p));});return true;}catch(e){return false;}})()`;
  return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}

const TICKET_GATE_EXPR = `(function(){try{
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<arts.length;i++){
    var a=arts[i], bs=[].slice.call(a.querySelectorAll('button'));
    for(var j=0;j<bs.length;j++){
      var b=bs[j], label=(b.innerText||b.textContent||b.getAttribute('aria-label')||'').trim();
      if(/(?:read|agree|watched|tutorial|continue|confirm)/i.test(label) && /(?:tokeer|activation|ticket|tutorial)/i.test((a.innerText||'')+' '+label)){
        return JSON.stringify({found:true,label:label,disabled:b.disabled||b.getAttribute('aria-disabled')==='true',messageText:(a.innerText||'').slice(0,5000)});
      }
    }
  }
  return JSON.stringify({found:false,error:'Waiting for the newest Tokeer confirmation message…'});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

export async function readLatestTicketGate(): Promise<TokeerTicketGate> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return { found: false, error: "Tokeer activation channel is not open." };
  const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_GATE_EXPR);
  try { return JSON.parse(String(raw || "")); } catch { return { found: false, error: "Could not read the ticket confirmation button." }; }
}

export async function clickLatestTicketGate(): Promise<{ success: boolean; fromUrl?: string; error?: string }> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return { success: false, error: "Tokeer activation channel is not open." };
  const expr = `(function(){try{
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
    for(var i=0;i<arts.length;i++){
      var bs=[].slice.call(arts[i].querySelectorAll('button'));
      for(var j=0;j<bs.length;j++){
        var b=bs[j], label=(b.innerText||b.textContent||b.getAttribute('aria-label')||'').trim();
        if(/(?:read|agree|watched|tutorial|continue|confirm)/i.test(label) && /(?:tokeer|activation|ticket|tutorial)/i.test((arts[i].innerText||'')+' '+label) && !b.disabled && b.getAttribute('aria-disabled')!=='true'){var r=b.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;b.dispatchEvent(new C(n,p));});return true;}
      }
    }
    return false;
  }catch(e){return false;}})()`;
  const ok = !!(await evalJson(tab.webSocketDebuggerUrl, expr));
  return ok ? { success: true, fromUrl: tab.url } : { success: false, error: "The green ticket confirmation button is not ready yet." };
}

const TICKET_CONTEXT_EXPR = `(function(){try{
  var text=(document.body.innerText||'').replace(/\u00a0/g,' ');
  var m=text.match(/tokeer\\s+verify\\s+(\\d{3,})/i)||text.match(/bash\\s+-s\\s+--\\s+(\\d{3,})/i)||text.match(/(?:steam\\s*)?app\\s*id\\D{0,12}(\\d{3,})/i)||location.href.match(/[?&]appid=(\\d{3,})/i);
  return JSON.stringify(m?{found:true,appid:Number(m[1]),rawText:text.slice(0,16000)}:{found:false,error:'Ticket opened, waiting for the setup commands…'});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

const TICKET_LINK_EXPR = `(function(){try{
  var channel=${JSON.stringify(TOKEER_CHANNEL)};
  var guild=${JSON.stringify(`/channels/${GUILD_ID}/`)};
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<Math.min(arts.length,30);i++){
    var a=arts[i], text=(a.innerText||'').replace(/\u00a0/g,' ');
    if(!/(?:ticket|activation|private|continue|created|opened)/i.test(text))continue;
    var links=[].slice.call(a.querySelectorAll('a[href*="/channels/"]'));
    for(var j=0;j<links.length;j++){
      var href=String(links[j].href||links[j].getAttribute('href')||'');
      if(href.indexOf(guild)>=0 && href.indexOf(channel)<0)return JSON.stringify({found:true,url:href,text:text.slice(0,3000)});
    }
  }
  return JSON.stringify({found:false});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

export async function waitForTicketContext(fromUrl = "", timeoutMs = 20000): Promise<TokeerTicketContext> {
  void fromUrl; // retained for callers from older builds; same-tab tickets are now inspected
  const deadline = Date.now() + timeoutMs;
  let lastError = "Waiting for Tokeer ticket…";
  while (Date.now() < deadline) {
    const tabs = await listCdpTabs();
    const candidates: CdpTab[] = [];
    for (const rawTab of tabs.filter((t) => !!t.webSocketDebuggerUrl)) {
      const resolvedUrl = await resolveTabUrl(rawTab);
      if (!looksLikeDiscordUrl(resolvedUrl)) continue;
      const tab = { ...rawTab, resolvedUrl, url: resolvedUrl };
      const u = String(tab.url || "");
      // Discord can open a private thread in the same target, a modal without
      // changing the URL, or a new target. Inspect all guild tabs, including
      // the activation target that initiated the interaction.
      if (u.includes(`/channels/${GUILD_ID}/`)) candidates.push(tab);
    }
    for (const tab of candidates) {
      if (!tab.webSocketDebuggerUrl) continue;
      const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_CONTEXT_EXPR);
      try {
        const parsed = JSON.parse(String(raw || ""));
        if (parsed?.found && parsed?.appid) return { ...parsed, url: tab.url };
        if (parsed?.error) lastError = parsed.error;
      } catch {}

      // Ticket bots often post a private-channel link instead of changing the
      // current SPA route. Discover that link from recent messages and move the
      // same hidden target into it.
      try {
        const linkRaw = await evalJson(tab.webSocketDebuggerUrl, TICKET_LINK_EXPR);
        const link = JSON.parse(String(linkRaw || ""));
        if (link?.found && looksLikeDiscordUrl(link.url || "")) {
          await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
            url: String(link.url), transitionType: "link",
          }, 4000);
          lastError = "Ticket found; waiting for its setup commands…";
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return { found: false, error: lastError || "Timed out waiting for the Tokeer ticket/thread." };
}

/** Connect the automation surface without putting Discord on screen. The
 * BrowserView shares Steam CEF's Discord session, so a prior visible login is
 * reused. */
export async function connectTokeerDiscordHidden(): Promise<boolean> {
  // Reuse only our managed BrowserView. A normal Steam external-web tab may be
  // readable through CDP but cannot be repositioned inside the plugin page.
  if (await hasTokeerBrowserView()) {
    try {
      const existing = await findDiscordTab();
      if (existing?.webSocketDebuggerUrl && await navigateDiscordTabToTokeer(existing)) {
        try { await parkTokeerBrowserView(); } catch {}
        try { await cdpCommand(existing.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000); } catch {}
        return true;
      }
    } catch {}
  }
  try {
    const created = await createTokeerDiscordBrowserView();
    try { await parkTokeerBrowserView(); } catch {}
    return !!created?.webSocketDebuggerUrl;
  } catch {
    return false;
  }
}

export async function openTokeerDiscord(): Promise<boolean> {
  // Hide a raw fallback view left by an older SLSDeck build. A visible raw
  // BrowserView has no Steam navigation chrome and traps the B button.
  try { await hideTokeerBrowserView(); } catch {}

  // Visible login/manual path: Steam owns this page and supplies its normal
  // Back action. Silent automation uses connectTokeerDiscordHidden instead.
  try {
    const nav: any = Navigation as any;
    if (typeof nav?.NavigateToExternalWeb === "function") {
      nav.NavigateToExternalWeb(TOKEER_DISCORD_URL);
      return true;
    }
  } catch {}

  try {
    const SC: any = (window as any).SteamClient;
    if (SC?.System?.OpenInSystemBrowser) {
      SC.System.OpenInSystemBrowser(TOKEER_DISCORD_URL);
      return true;
    }
  } catch {}
  return false;
}
