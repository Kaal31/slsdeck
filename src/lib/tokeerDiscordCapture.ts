import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
export const DEDEVISION_INVITE_URL = "https://discord.gg/denuvo";
const GUILD_ID = "1464130182364270696";
const TOKEER_CHANNEL = `/channels/${GUILD_ID}/1534460498446127175`;
const TARGET_MESSAGE = "1535685399265935422";
const CDP_PORTS = [8080, 8081];
const TOKEER_VIEW_NAME = "slsdeck_tokeer";

interface CdpTab { url: string; title?: string; type?: string; webSocketDebuggerUrl?: string; resolvedUrl?: string; cdpPort?: number }

function settleWithin<T>(work: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), Math.max(1, timeoutMs))),
  ]);
}
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
  opened?: boolean;
  appid?: number;
  url?: string;
  rawText?: string;
  error?: string;
};

export type TokeerTicketState = {
  open: boolean;
  closed: boolean;
  reason?: string;
};

async function listCdpTabs(): Promise<CdpTab[]> {
  const merged: CdpTab[] = [];
  const seen = new Set<string>();
  for (const port of CDP_PORTS) {
    try {
      const r = await settleWithin(fetchNoCors(`http://localhost:${port}/json`), 1800, null as any);
      if (!r) continue;
      const tabs: CdpTab[] = await settleWithin(r.json(), 1200, []);
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (v: any) => {
      if (done) return;
      done = true;
      if (timer !== undefined) clearTimeout(timer);
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
    sock.onclose = () => finish(null);
    timer = setTimeout(() => finish(null), timeoutMs);
  });
}

async function evalJson(wsUrl: string, expression: string, timeoutMs = 5000): Promise<any> {
  const result = await cdpCommand(wsUrl, "Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true,
  }, timeoutMs);
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
async function resolveTabUrl(t: CdpTab, timeoutMs = 1800): Promise<string> {
  if (!t.webSocketDebuggerUrl) return String(t.url || "");
  const expr = `(function(){try{
    var here=String(location.href||document.URL||'');
    var frames=[].slice.call(document.querySelectorAll('iframe')).map(function(f){return String(f.src||'');});
    return JSON.stringify({here:here,frames:frames});
  }catch(e){return JSON.stringify({here:'',frames:[]});}})()`;
  const raw = await evalJson(t.webSocketDebuggerUrl, expr, timeoutMs);
  try {
    const parsed = JSON.parse(String(raw || ""));
    const urls = [parsed?.here, ...(Array.isArray(parsed?.frames) ? parsed.frames : [])].filter(Boolean);
    return urls.find((u: string) => looksLikeDiscordUrl(u)) || String(parsed?.here || t.url || "");
  } catch {
    return String(t.url || "");
  }
}

async function findDiscordTabUncached(): Promise<CdpTab | null> {
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

// Resolving the Discord target is the single most expensive thing in this file:
// it opens a CDP socket to EVERY Steam target and runs a Runtime.evaluate on each
// (resolveTabUrl, ~1.8s worst case apiece) because Steam's /json metadata lies
// about wrapper URLs. Every exported helper below used to pay that in full, and
// the availability refresh calls them in a loop — which is how "checking" could
// run for minutes. The target does not move between those calls, so memoize it
// briefly and coalesce concurrent lookups onto one resolution.
const TAB_CACHE_MS = 5000;
let tabCache: { at: number; tab: CdpTab | null } | null = null;
let tabInFlight: Promise<CdpTab | null> | null = null;

/** Drop the memoized target. Call after anything that can move or replace it
 * (navigation, BrowserView create/park) so we never act on a dead socket. */
export function invalidateDiscordTabCache(): void {
  tabCache = null;
}

/** Drop both target and DOM-derived state after navigation or target creation. */
export function invalidateDiscordCaptureCaches(): void {
  tabCache = null;
  snapshotCache = null;
  lastSignedIn = null;
}

async function findDiscordTab(): Promise<CdpTab | null> {
  if (tabCache && Date.now() - tabCache.at < TAB_CACHE_MS) return tabCache.tab;
  if (tabInFlight) return tabInFlight;
  tabInFlight = (async () => {
    try {
      const tab = await findDiscordTabUncached();
      tabCache = { at: Date.now(), tab };
      return tab;
    } finally {
      tabInFlight = null;
    }
  })();
  return tabInFlight;
}

/** Whether Steam CEF currently holds an authenticated Discord web session.
 *
 * Coalesced like the snapshot: the sign-in button polls this, and without
 * de-duplication each poll paid a full target resolution. Transitions are
 * broadcast so UI showing a "sign in" affordance can drop it the moment the
 * session actually becomes authenticated, rather than waiting for whatever
 * long-running check happens to finish next. */
let signInInFlight: Promise<{ signedIn: boolean; found: boolean }> | null = null;
let lastSignedIn: boolean | null = null;

export async function getDiscordSignInState(): Promise<{ signedIn: boolean; found: boolean }> {
  if (signInInFlight) return signInInFlight;
  signInInFlight = (async () => {
    try {
      const tab = await findDiscordTab();
      if (!tab?.webSocketDebuggerUrl) return { signedIn: false, found: false };
      const expression = `(async function(){try{
        var u=String(location.href||document.URL||'');
        if(/\\/(?:login|register)(?:[/?#]|$)/i.test(u))return false;
        if(document.querySelector('input[name="email"],input[name="password"],form[class*="authBox"]'))return false;
        var response=await fetch('/api/v9/users/@me',{credentials:'include',cache:'no-store'});
        return response.status===200;
      }catch(e){return false;}})()`;
      const signedIn = !!(await evalJson(tab.webSocketDebuggerUrl, expression, 2500));
      if (signedIn !== lastSignedIn) {
        lastSignedIn = signedIn;
        try {
          window.dispatchEvent(new CustomEvent("slsdeck-tokeer-signin", { detail: signedIn }));
        } catch { /* ignore */ }
      }
      return { signedIn, found: true };
    } finally {
      signInInFlight = null;
    }
  })();
  return signInInFlight;
}

/** Poll sign-in state until it flips to signed-in (or the budget runs out).
 * Used right after opening the Discord login so the button reacts immediately
 * instead of on the next unrelated refresh. */
export async function waitForDiscordSignIn(budgetMs = 120000): Promise<boolean> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    const { signedIn } = await getDiscordSignInState();
    if (signedIn) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
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

async function findManagedTokeerTab(): Promise<CdpTab | null> {
  const tabs = (await listCdpTabs()).filter((t) => !!t.webSocketDebuggerUrl);
  for (const tab of tabs) {
    const managed = await evalJson(tab.webSocketDebuggerUrl!,
      `(function(){try{return window.__SLSDECK_TOKEER_MANAGED===true;}catch(e){return false;}})()`, 1200);
    if (!managed) continue;
    const resolvedUrl = await resolveTabUrl(tab);
    return { ...tab, resolvedUrl, url: resolvedUrl };
  }
  return null;
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

export async function captureTokeerDiscordFrame(): Promise<string> {
  if (!(await connectTokeerDiscordHidden())) return "";
  const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
  if (!tab?.webSocketDebuggerUrl) return "";
  try {
    await cdpCommand(tab.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 1500);
    const shot = await cdpCommand(tab.webSocketDebuggerUrl, "Page.captureScreenshot", {
      format: "jpeg", quality: 72, fromSurface: true, captureBeyondViewport: false,
    }, 6000);
    return shot?.data ? `data:image/jpeg;base64,${shot.data}` : "";
  } catch {
    return "";
  }
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
  invalidateDiscordCaptureCaches();

  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    // The websocket belongs to the exact BrowserView we created. Do not call
    // findDiscordTab() here: a separately opened manual Discord tab may win
    // that search and leave the managed embedded surface on its placeholder.
    const liveUrl = await resolveTabUrl(target);
    if (looksLikeDiscordUrl(liveUrl)) {
      await evalJson(target.webSocketDebuggerUrl,
        `(function(){try{window.__SLSDECK_TOKEER_MANAGED=true;return true;}catch(e){return false;}})()`, 2000);
      return { ...target, resolvedUrl: liveUrl, url: liveUrl };
    }
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
  if (nav) invalidateDiscordCaptureCaches();
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

// Several surfaces (the Tokeer page, the availability cache, Fixes) can each
// independently ask for the same expensive scrape, and they stack. Coalesce
// concurrent reads onto one in-flight scrape and let a just-finished result be
// reused for a moment, so N callers cost one Discord round trip instead of N.
const SNAPSHOT_TTL_MS = 2500;
let snapshotCache: { at: number; state: TokeerDiscordState } | null = null;
let snapshotInFlight: Promise<TokeerDiscordState> | null = null;

/** Coalesced/short-cached snapshot. `force` bypasses the reuse window but still
 * shares any scrape already running. */
export async function readTokeerDiscord(force = false): Promise<TokeerDiscordState> {
  if (!force && snapshotCache && Date.now() - snapshotCache.at < SNAPSHOT_TTL_MS) {
    return snapshotCache.state;
  }
  if (snapshotInFlight) return snapshotInFlight;
  snapshotInFlight = (async () => {
    try {
      const state = await readTokeerDiscordUncached();
      // Only cache a decisive answer; caching "not found" would make a genuine
      // retry loop spin on a stale negative.
      if (state.found) snapshotCache = { at: Date.now(), state };
      else snapshotCache = null;
      return state;
    } finally {
      snapshotInFlight = null;
    }
  })();
  return snapshotInFlight;
}

async function readTokeerDiscordUncached(): Promise<TokeerDiscordState> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) {
    const diag = await cdpDiagnostic();
    return { found: false, selectors: [], error: `No Discord page found in Steam CDP. ${diag}` };
  }
  if (!tab.url?.includes(TOKEER_CHANNEL)) {
    return { found: false, selectors: [], tabUrl: tab.url, error: "Discord is visible in Steam CEF, but it is on a different page. Press ‘Open Tokeer Discord’ to return to the activation panel." };
  }
  const snap = await evalDetailed(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
  if (snap.error) {
    // The memoized target may be a socket that died under us (Steam replaced the
    // view, or the page navigated). Drop it so the next attempt re-resolves
    // instead of failing forever against a dead handle.
    invalidateDiscordTabCache();
    return { found: false, selectors: [], tabUrl: tab.url, error: `Discord DOM evaluation failed: ${snap.error}` };
  }
  if (!snap.value || typeof snap.value !== "object") {
    invalidateDiscordTabCache();
    return { found: false, selectors: [], tabUrl: tab.url, error: "Discord DOM snapshot returned no object — the page was not ready or the target went away." };
  }
  return { ...snap.value, selectors: Array.isArray(snap.value.selectors) ? snap.value.selectors : [], tabUrl: tab.url };
}

export async function openSelectorAndReadOptions(index: number, timeoutMs = 5000): Promise<string[]> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return [];
  const clickExpr = `(function(){try{var id=${JSON.stringify(TARGET_MESSAGE)};var arts=[].slice.call(document.querySelectorAll('[role="article"]'));var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]')||arts.reverse().find(function(x){return x.querySelector('[aria-haspopup="listbox"],[role="combobox"]')&&/steam|games?|keys?|tokeer/i.test(x.innerText||'');});var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(x){return x.getAttribute('aria-haspopup')==='listbox'||x.getAttribute('role')==='combobox';}):[];var e=xs[${Number(index)}];if(!e)return false;var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,o));});return true;}catch(e){return false;}})()`;
  const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr, Math.min(timeoutMs, 3000));
  if (!ok) return [];
  await new Promise((r) => setTimeout(r, 450));
  const optionsExpr = `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
    var boxes=[].slice.call(document.querySelectorAll('[role="listbox"]')).filter(visible);
    var root=boxes.length?boxes[boxes.length-1]:document;
    var rows=[].slice.call(root.querySelectorAll('[role="option"]')).filter(visible);
    if(!rows.length)rows=[].slice.call(document.querySelectorAll('[role="option"]')).filter(visible);
    var labels=rows.map(function(e){return (e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();}).filter(Boolean);
    // Tokeer's game rows carry availability text. If those are present, keep
    // only them and discard Discord navigation/notification menu entries.
    var games=labels.filter(function(t){return /\\b\\d+\\s+of\\s+\\d+\\s+remaining\\s*\\(\\d+%\\)/i.test(t);});
    return JSON.stringify(games.length?games:labels);
  }catch(e){return '[]';}})()`;
  const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr, Math.min(timeoutMs, 3000));
  try { return JSON.parse(String(raw || "[]")); } catch { return []; }
}

export async function chooseSelectorOption(index: number, label: string): Promise<boolean> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return false;
  const visibleExpr = `(function(){try{var want=${JSON.stringify(label)};return [].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).some(function(e){var r=e.getBoundingClientRect(),t=(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim();return r.width>0&&r.height>0&&t===want;});}catch(e){return false;}})()`;
  const alreadyOpen = !!(await evalJson(tab.webSocketDebuggerUrl, visibleExpr));
  if (!alreadyOpen) await openSelectorAndReadOptions(index);
  const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).find(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(e.innerText||e.textContent||e.getAttribute('aria-label')||'').trim()===want;});if(!o)return false;var r=o.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;o.dispatchEvent(new C(n,p));});return true;}catch(e){return false;}})()`;
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
  if (ok) invalidateDiscordCaptureCaches();
  return ok ? { success: true, fromUrl: tab.url } : { success: false, error: "The green ticket confirmation button is not ready yet." };
}

const TICKET_CONTEXT_EXPR = `(function(){try{
  var articles=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40);
  var recent=articles.map(function(a){return String(a.innerText||a.textContent||'');}).join('\\n');
  var code=articles.reduce(function(all,a){return all.concat([].slice.call(a.querySelectorAll('pre,code,[class*="codeBlock"]')).map(function(e){return e.innerText||e.textContent||'';}));},[]).join('\\n');
  var body=(document.body.innerText||'').replace(/\\u00a0/g,' ');
  // Discord is a long-lived SPA. Prefer code blocks and newest messages, and
  // use the end of the page as fallback because new ticket content is last.
  var text=(recent||body.slice(-50000)).replace(/\\u00a0/g,' ');
  var hay=(code+'\\n'+text).slice(-70000);
  var patterns=[
    /tokeer\\s+verify(?:-[a-z][a-z0-9_-]*)?(?:\\s+--?appid(?:=|\\s+)|\\s+)(\\d{3,10})/i,
    /install_linux\\.sh[^\\n\\r|]*\\|\\s*(?:bash|sh)\\s+-s\\s+--\\s*(\\d{3,10})(?:\\s+[a-z][a-z0-9_-]*)?/i,
    /bash\\s+-s\\s+--\\s*(\\d{3,10})(?:\\s+(?:ubisoft|steam|linux))?/i,
    /(?:--?appid|app[_ -]?id)(?:=|:|\\s+|["']+)(\\d{3,10})/i,
    /(?:store\\.steampowered\\.com\\/app|steam:\\/\\/(?:run|install)|steamdb\\.info\\/app)\\/(\\d{3,10})/i,
    /\\/app\\/(\\d{3,10})(?:\\/|\\b)/i
  ];
  var ids=[];
  for(var i=0;i<patterns.length;i++){
    var m=hay.match(patterns[i]);
    if(m&&ids.indexOf(Number(m[1]))<0)ids.push(Number(m[1]));
  }
  var opened=/ticket|activation|tokeer|tlx1|setup command/i.test(text)||/\\/channels\\//i.test(location.href);
  return JSON.stringify(ids.length?{found:true,opened:true,appid:ids[0],appids:ids,rawText:text.slice(0,20000)}:{found:false,opened:opened,rawText:text.slice(0,12000),error:'Ticket opened, waiting for the setup commands…'});
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

export async function waitForTicketContext(fromUrl = "", timeoutMs = 20000, expectedAppid = 0): Promise<TokeerTicketContext> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "Waiting for Tokeer ticket…";
  let lastTicketUrl = looksLikeDiscordUrl(fromUrl) && fromUrl.includes(`/channels/${GUILD_ID}/`) ? fromUrl : "";

  if (lastTicketUrl) {
    try {
      const managed = await findManagedTokeerTab();
      if (managed?.webSocketDebuggerUrl && String(managed.url || "") !== lastTicketUrl) {
        await cdpCommand(managed.webSocketDebuggerUrl, "Page.navigate", {
          url: lastTicketUrl, transitionType: "address_bar",
        }, 4000);
        invalidateDiscordCaptureCaches();
      }
    } catch {}
  }
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
        if (parsed?.found && parsed?.appid) {
          const candidates = (Array.isArray(parsed.appids) ? parsed.appids : [parsed.appid])
            .map(Number).filter((value: number) => Number.isFinite(value) && value > 0);
          if (!expectedAppid || candidates.includes(expectedAppid)) {
            return { ...parsed, appid: expectedAppid || parsed.appid, opened: true, url: tab.url };
          }
          lastError = `Ticket commands contained AppID ${candidates.join(", ")}, but the selected installed game is AppID ${expectedAppid}. Waiting for the correct setup command…`;
        }
        if (parsed?.opened && !String(tab.url || "").includes(TOKEER_CHANNEL)) lastTicketUrl = String(tab.url || "");
        if (parsed?.error) lastError = parsed.error;
      } catch {}

      // Ticket bots often post a private-channel link instead of changing the
      // current SPA route. Discover that link from recent messages and move the
      // same hidden target into it.
      try {
        const linkRaw = await evalJson(tab.webSocketDebuggerUrl, TICKET_LINK_EXPR);
        const link = JSON.parse(String(linkRaw || ""));
        if (link?.found && looksLikeDiscordUrl(link.url || "")) {
          lastTicketUrl = String(link.url);
          if (String(tab.url || "") !== lastTicketUrl) {
            await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
              url: lastTicketUrl, transitionType: "link",
            }, 4000);
            invalidateDiscordCaptureCaches();
          }
          lastError = "Ticket found; waiting for its setup commands…";
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return { found: false, opened: !!lastTicketUrl, url: lastTicketUrl || undefined, error: lastError || "Timed out waiting for the Tokeer ticket/thread." };
}

async function ticketTab(ticketUrl: string): Promise<CdpTab | null> {
  let tab = await findManagedTokeerTab();
  if (!tab?.webSocketDebuggerUrl) tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) return null;
  if (ticketUrl && looksLikeDiscordUrl(ticketUrl) && String(tab.url || "") !== ticketUrl) {
    await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", { url: ticketUrl, transitionType: "address_bar" }, 4000);
    invalidateDiscordCaptureCaches();
    await new Promise((r) => setTimeout(r, 1000));
  }
  return tab;
}

/** Inspect an already-visible private ticket without navigating Discord.
 * Returning closed=false/open=false means the user merely navigated elsewhere;
 * only explicit Discord/Tokeer closure evidence aborts the saved chain. */
export async function checkTokeerTicketState(ticketUrl: string): Promise<TokeerTicketState> {
  if (!looksLikeDiscordUrl(ticketUrl)) return { open: false, closed: false };
  const wanted = String(ticketUrl).split(/[?#]/)[0];
  const tabs = await listCdpTabs();
  for (const raw of tabs.filter((item) => !!item.webSocketDebuggerUrl)) {
    const resolved = await resolveTabUrl(raw);
    if (String(resolved || "").split(/[?#]/)[0] !== wanted || !raw.webSocketDebuggerUrl) continue;
    const expr = `(function(){try{
      var body=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
      var explicit=/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent);
      var unavailable=/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(body);
      var composer=!!document.querySelector('[role="textbox"][contenteditable="true"],div[contenteditable="true"][data-slate-editor="true"]');
      return JSON.stringify({open:composer&&!explicit&&!unavailable,closed:explicit||unavailable,reason:explicit?'Tokeer reports that the ticket was cancelled or closed.':unavailable?'The Discord ticket channel no longer exists or is inaccessible.':''});
    }catch(e){return JSON.stringify({open:false,closed:false,reason:String(e)});}})()`;
    const result = await evalJson(raw.webSocketDebuggerUrl, expr, 3500);
    try { return JSON.parse(String(result || "")); } catch { return { open: false, closed: false }; }
  }
  return { open: false, closed: false };
}

export async function sendTokeerTicketMessage(ticketUrl: string, message: string): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
  const text = String(message || "").trim();
  if (!/^TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) {
    return { success: false, error: "The generated verification value is not a valid TLX1 code; nothing was sent to Discord." };
  }
  const tab = await ticketTab(ticketUrl);
  if (!tab?.webSocketDebuggerUrl) return { success: false, error: "The Discord ticket view is not connected." };

  const focusExpr = `(function(){try{
    var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
    var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
    if(/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent)||/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(page))return JSON.stringify({ok:false,cancelled:true,error:'The Discord ticket was cancelled, closed, or deleted.'});
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"][contenteditable="true"],div[contenteditable="true"][data-slate-editor="true"],div[contenteditable="true"]')).filter(visible);
    var box=boxes[boxes.length-1];
    if(!box)return JSON.stringify({ok:false,error:'Discord message box was not found in the ticket.'});
    box.focus();return JSON.stringify({ok:true});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
  const focusedRaw = await evalJson(tab.webSocketDebuggerUrl, focusExpr, 4000);
  let focused: any;
  try { focused = JSON.parse(String(focusedRaw || "")); } catch { focused = null; }
  if (!focused?.ok) return { success: false, cancelled: !!focused?.cancelled, error: focused?.error || "Could not focus the Discord ticket message box." };

  await cdpCommand(tab.webSocketDebuggerUrl, "Input.insertText", { text }, 3000);
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  await new Promise((r) => setTimeout(r, 700));
  const verifyExpr = `(function(){try{
    var expected=${JSON.stringify(text)};
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12);
    return arts.some(function(a){return String(a.innerText||'').indexOf(expected)>=0;});
  }catch(e){return false;}})()`;
  const appeared = await evalJson(tab.webSocketDebuggerUrl, verifyExpr, 3000);
  return appeared ? { success: true } : { success: false, error: "Discord did not confirm that the TLX1 message was posted. It remains available for manual copy." };
}

export async function waitForTokeerActivationCode(ticketUrl: string, timeoutMs = 15 * 60 * 1000): Promise<{ success: boolean; code?: string; cancelled?: boolean; error?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl) return { success: false, error: "The Discord ticket view disconnected while waiting for the activation code." };
    const expr = `(function(){try{
      var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30).reverse();
      var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=arts.slice(0,12).map(function(a){return String(a.innerText||'');}).join('\n');
      if(/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket was cancelled or closed.'});
      if(/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(page))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket channel no longer exists or is inaccessible.'});
      var common=/^(?:verify|setup|ticket|cancel|close|valid|code|redeem|tokeer|linux|steam|proton)$/i;
      for(var i=0;i<arts.length;i++){
        var a=arts[i], text=String(a.innerText||'').replace(/\u00a0/g,' ').trim();
        if(/TLX1\./i.test(text))continue;
        var nodes=[].slice.call(a.querySelectorAll('code,pre')).map(function(n){return String(n.textContent||'').trim();});
        var contextual=/(?:activation|redeem|single[- ]use|expires|30\s*minutes?|verification\s+(?:succeeded|complete))/i.test(text);
        var matches=nodes.filter(function(v){return /^[A-Za-z0-9_-]{6}$/.test(v)&&!common.test(v);});
        if(!matches.length&&contextual){
          matches=(text.match(/(?:^|\s|[:#])([A-Za-z0-9_-]{6})(?=$|\s|[.,!])/g)||[]).map(function(v){var m=v.match(/([A-Za-z0-9_-]{6})/);return m?m[1]:'';}).filter(function(v){return v&&!common.test(v);});
        }
        if(matches.length&&contextual)return JSON.stringify({found:true,code:matches[0]});
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
    const raw = await evalJson(tab.webSocketDebuggerUrl, expr, 4000);
    try {
      const found = JSON.parse(String(raw || ""));
      if (found?.found && /^[A-Za-z0-9_-]{6}$/.test(String(found.code || ""))) return { success: true, code: String(found.code) };
      if (found?.cancelled) return { success: false, cancelled: true, error: found.error || "The Discord ticket was cancelled." };
      if (found?.error) return { success: false, error: found.error };
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { success: false, error: "Timed out waiting for the six-character activation code. The ticket is still saved and can be resumed." };
}

export async function cancelTokeerTicket(ticketUrl = ""): Promise<{ success: boolean; error?: string }> {
  let tab = await findManagedTokeerTab();
  if (!tab?.webSocketDebuggerUrl) tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) return { success: false, error: "The Discord ticket view is not connected." };

  if (ticketUrl && looksLikeDiscordUrl(ticketUrl) && String(tab.url || "") !== ticketUrl) {
    await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
      url: ticketUrl, transitionType: "address_bar",
    }, 4000);
    invalidateDiscordCaptureCaches();
    await new Promise((r) => setTimeout(r, 900));
  }

  const clickCancel = `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var label=function(e){return String(e.innerText||e.textContent||e.getAttribute('aria-label')||e.getAttribute('title')||'').replace(/\\s+/g,' ').trim();};
    var danger=function(e){
      var meta=String(e.className||'')+' '+String(e.getAttribute('data-look')||'')+' '+String(e.getAttribute('data-variant')||'')+' '+String(e.getAttribute('aria-label')||'');
      if(/danger|red|negative|critical|destructive/i.test(meta))return true;
      var s=getComputedStyle(e), colors=[s.color,s.backgroundColor,s.borderColor].join(' '), nums=colors.match(/\\d+/g)||[];
      for(var i=0;i+2<nums.length;i+=3){var r=+nums[i],g=+nums[i+1],b=+nums[i+2];if(r>140&&r>g*1.35&&r>b*1.25)return true;}
      return false;
    };
    var click=function(e){var r=e.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,p));});};
    var buttons=[].slice.call(document.querySelectorAll('button,[role="button"]')).filter(visible);
    var strong=buttons.filter(function(b){var t=label(b);return /(?:^|\\b)(?:(?:cancel|close|delete|abort)\\s+(?:this\\s+)?ticket|ticket\\s+(?:cancel|close|delete|abort))(?:\\b|$)/i.test(t);});
    var short=buttons.filter(function(b){
      var t=label(b);if(!/^(?:cancel|close|delete|abort)$/i.test(t)||!danger(b))return false;
      var a=b.closest('[role="article"]'),p=b.parentElement&&b.parentElement.parentElement;
      var context=String(a&&a.innerText||p&&p.innerText||'');
      return /ticket|activation|tokeer/i.test(context);
    });
    var target=strong.find(danger)||strong[strong.length-1]||short[short.length-1];
    if(!target)return JSON.stringify({ok:false,error:'The red Cancel Ticket button was not found in the open ticket.'});
    click(target);
    return JSON.stringify({ok:true,label:label(target)});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
  const raw = await evalJson(tab.webSocketDebuggerUrl, clickCancel, 4000);
  let first: any;
  try { first = JSON.parse(String(raw || "")); } catch { first = null; }
  if (!first?.ok) return { success: false, error: first?.error || "Could not press Cancel Ticket." };

  // Some ticket bots ask for a second confirmation in a modal.
  await new Promise((r) => setTimeout(r, 650));
  const confirmExpr = `(function(){try{
    var d=[].slice.call(document.querySelectorAll('[role="dialog"]')).find(function(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0;});
    if(!d)return false;
    var bs=[].slice.call(d.querySelectorAll('button,[role="button"]'));
    var danger=function(e){var m=String(e.className||'')+' '+String(e.getAttribute('data-look')||'')+' '+String(e.getAttribute('data-variant')||'');return /danger|red|negative|critical|destructive/i.test(m);};
    var b=bs.find(function(e){var t=String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();return /^(?:confirm|yes)$/i.test(t)||/(?:^|\\b)(?:(?:cancel|close|delete|abort)\\s+(?:this\\s+)?ticket|ticket\\s+(?:cancel|close|delete|abort))(?:\\b|$)/i.test(t)||(danger(e)&&/^(?:close|delete|abort)$/i.test(t));});
    if(!b)return false;
    var r=b.getBoundingClientRect(),p={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;b.dispatchEvent(new C(n,p));});
    return true;
  }catch(e){return false;}})()`;
  await evalJson(tab.webSocketDebuggerUrl, confirmExpr, 3000);
  return { success: true };
}

/** Connect the automation surface without putting Discord on screen. The
 * BrowserView shares Steam CEF's Discord session, so a prior visible login is
 * reused. */
export async function connectTokeerDiscordHidden(): Promise<boolean> {
  // Reuse only our managed BrowserView. A normal Steam external-web tab may be
  // readable through CDP but cannot be repositioned inside the plugin page.
  if (await hasTokeerBrowserView()) {
    try {
      // Reuse only the CDP target tagged by createTokeerDiscordBrowserView.
      // A user's manual/login Discord tab is readable too, but it is not the
      // BrowserView that positionTokeerDiscordEmbedded() can move.
      const existing = await findManagedTokeerTab();
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

/** Open DeDevision's invite. Discord itself asks for login when the shared
 * Steam-CEF Discord session is unauthenticated, then continues to the server. */
export async function openDedevisionDiscordLogin(): Promise<boolean> {
  try { await hideTokeerBrowserView(); } catch {}
  try {
    const nav: any = Navigation as any;
    if (typeof nav?.NavigateToExternalWeb === "function") {
      nav.NavigateToExternalWeb(DEDEVISION_INVITE_URL);
      return true;
    }
  } catch {}
  try {
    const SC: any = (window as any).SteamClient;
    if (SC?.System?.OpenInSystemBrowser) {
      SC.System.OpenInSystemBrowser(DEDEVISION_INVITE_URL);
      return true;
    }
  } catch {}
  return false;
}
