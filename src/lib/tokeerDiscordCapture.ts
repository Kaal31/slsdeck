import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
export const DEDEVISION_INVITE_URL = "https://discord.gg/denuvo";
const GUILD_ID = "1464130182364270696";
// Tokeer's Linux game picker lives in this channel, but tickets are created as
// private threads beneath the separate, general #activation-point channel.
const TOKEER_PANEL_CHANNEL_ID = "1534460498446127175";
const TOKEER_TICKET_PARENT_CHANNEL_ID = "1465275824075833477";
const TOKEER_CHANNEL = `/channels/${GUILD_ID}/${TOKEER_PANEL_CHANNEL_ID}`;
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
  x?: number;
  y?: number;
  error?: string;
};

export type TokeerTicketContext = {
  found: boolean;
  opened?: boolean;
  appid?: number;
  ubisoft?: boolean;
  gameName?: string;
  incompatiblePlatform?: boolean;
  url?: string;
  guildId?: string;
  parentChannelId?: string;
  ticketChannelId?: string;
  lastMessageId?: string;
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

/** CDP DOM node ids belong to the debugger session that created them. Keep
 * discovery and assignment on one socket so Discord's hidden file input does
 * not become invalid between DOM.requestNode and DOM.setFileInputFiles. */
function cdpSetDiscordFileInput(wsUrl: string, filePath: string, timeoutMs = 7000): Promise<{ found: boolean; accepted: boolean }> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    let nextId = 0;
    const pending = new Map<number, (value: any) => void>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (value: { found: boolean; accepted: boolean }) => {
      if (done) return;
      done = true;
      if (timer !== undefined) clearTimeout(timer);
      pending.clear();
      try { sock.close(); } catch {}
      resolve(value);
    };
    const send = (method: string, params: Record<string, any> = {}): Promise<any> => new Promise((resolveCommand) => {
      if (done || sock.readyState !== WebSocket.OPEN) { resolveCommand(null); return; }
      const id = ++nextId;
      pending.set(id, resolveCommand);
      try { sock.send(JSON.stringify({ id, method, params })); } catch {
        pending.delete(id);
        resolveCommand(null);
      }
    });
    try { sock = new WebSocket(wsUrl); } catch { resolve({ found: false, accepted: false }); return; }
    sock.onmessage = (ev) => {
      try {
        const message = JSON.parse(String(ev.data));
        const resolveCommand = pending.get(Number(message?.id));
        if (!resolveCommand) return;
        pending.delete(Number(message.id));
        resolveCommand(message?.error ? null : (message?.result ?? null));
      } catch {}
    };
    sock.onopen = async () => {
      await send("DOM.enable");
      await send("DOM.getDocument", { depth: 1, pierce: true });
      const evaluated = await send("Runtime.evaluate", {
        expression: `(function(){try{
          var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
          var composer=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
          var form=composer&&composer.closest('form');
          return (form&&form.querySelector('input[type="file"]'))||document.querySelector('input[type="file"]')||null;
        }catch(e){return null;}})()`,
        returnByValue: false,
      });
      const objectId = String(evaluated?.result?.objectId || "");
      if (!objectId || evaluated?.result?.subtype === "null") { finish({ found: false, accepted: false }); return; }
      const requested = await send("DOM.requestNode", { objectId });
      const nodeId = Number(requested?.nodeId || 0);
      if (!nodeId) { finish({ found: true, accepted: false }); return; }
      const assigned = await send("DOM.setFileInputFiles", { nodeId, files: [filePath] });
      finish({ found: true, accepted: assigned !== null });
    };
    sock.onerror = () => finish({ found: false, accepted: false });
    sock.onclose = () => finish({ found: false, accepted: false });
    timer = setTimeout(() => finish({ found: false, accepted: false }), timeoutMs);
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

type DiscordRouteIdentity = { guildId?: string; channelId?: string; messageId?: string };

function discordRouteIdentity(url: string): DiscordRouteIdentity {
  const match = String(url || "").match(/\/channels\/(\d+)\/(\d+)(?:\/(\d+))?/i);
  return match ? { guildId: match[1], channelId: match[2], messageId: match[3] } : {};
}

/** Message links append a message snowflake while Discord's live SPA often
 * reports only /guild/channel. The child channel snowflake is the ticket. */
function canonicalDiscordChannelUrl(url: string): string {
  const identity = discordRouteIdentity(url);
  if (!identity.guildId || !identity.channelId) return String(url || "").split(/[?#]/)[0];
  return `https://discord.com/channels/${identity.guildId}/${identity.channelId}`;
}

function ticketIdentity(url: string, lastMessageId?: string): Partial<TokeerTicketContext> {
  const identity = discordRouteIdentity(url);
  if (!identity.guildId || !identity.channelId) return {};
  if (identity.channelId === TOKEER_PANEL_CHANNEL_ID || identity.channelId === TOKEER_TICKET_PARENT_CHANNEL_ID) {
    return { guildId: identity.guildId, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID };
  }
  return {
    guildId: identity.guildId,
    parentChannelId: identity.channelId === TOKEER_TICKET_PARENT_CHANNEL_ID ? undefined : TOKEER_TICKET_PARENT_CHANNEL_ID,
    ticketChannelId: identity.channelId,
    lastMessageId: lastMessageId || identity.messageId,
    url: canonicalDiscordChannelUrl(url),
  };
}

type DiscordSidebarChannel = { id: string; label: string; role: string; thread: boolean };

const SIDEBAR_CHANNELS_EXPR = `(function(){try{
  var seen={},rows=[];
  [].slice.call(document.querySelectorAll('[data-list-item-id^="channels___"]')).forEach(function(e){
    var raw=String(e.getAttribute('data-list-item-id')||'');
    var m=raw.match(/^channels___(\\d+)$/);if(!m||seen[m[1]])return;
    seen[m[1]]=true;
    rows.push({id:m[1],label:String(e.getAttribute('aria-label')||e.innerText||e.textContent||'').trim(),role:String(e.getAttribute('role')||''),thread:!!e.closest('[class*="typeThread"]')});
  });
  return JSON.stringify(rows);
}catch(e){return '[]';}})()`;

async function readSidebarChannels(tab: CdpTab): Promise<DiscordSidebarChannel[]> {
  if (!tab.webSocketDebuggerUrl) return [];
  try {
    const raw = await evalJson(tab.webSocketDebuggerUrl, SIDEBAR_CHANNELS_EXPR, 2500);
    const parsed = JSON.parse(String(raw || "[]"));
    return Array.isArray(parsed) ? parsed.filter((item) => /^\d+$/.test(String(item?.id || ""))) : [];
  } catch {
    return [];
  }
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
let signInInFlight: Promise<{ signedIn: boolean; signedOut: boolean; found: boolean }> | null = null;
let lastSignedIn: boolean | null = null;

export async function getDiscordSignInState(): Promise<{ signedIn: boolean; signedOut: boolean; found: boolean }> {
  if (signInInFlight) return signInInFlight;
  signInInFlight = (async () => {
    try {
      const tab = await findDiscordTab();
      if (!tab?.webSocketDebuggerUrl) return { signedIn: false, signedOut: false, found: false };
      const expression = `(async function(){try{
        var u=String(location.href||document.URL||'');
        if(/\\/(?:login|register)(?:[/?#]|$)/i.test(u))return 'signed-out';
        if(document.querySelector('input[name="email"],input[name="password"],form[class*="authBox"]'))return 'signed-out';
        var response=await fetch('/api/v9/users/@me',{credentials:'include',cache:'no-store'});
        if(response.status===200)return 'signed-in';
        var shell=/\\/channels\\//i.test(u)&&!!document.querySelector('[data-list-item-id^="channels___"],nav,[class*="sidebar"]');
        return shell?'signed-in':'unknown';
      }catch(e){
        var u=String(location.href||document.URL||'');
        var shell=/\\/channels\\//i.test(u)&&!!document.querySelector('[data-list-item-id^="channels___"],nav,[class*="sidebar"]');
        return shell?'signed-in':'unknown';
      }})()`;
      const result = String(await evalJson(tab.webSocketDebuggerUrl, expression, 2500) || "unknown");
      const signedIn = result === "signed-in";
      const signedOut = result === "signed-out";
      if (signedIn !== lastSignedIn) {
        lastSignedIn = signedIn;
        try {
          window.dispatchEvent(new CustomEvent("slsdeck-tokeer-signin", { detail: signedIn }));
        } catch { /* ignore */ }
      }
      return { signedIn, signedOut, found: true };
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

/** Full Discord navigations replace the document and its page globals. Re-tag
 * the same target after its requested channel is live so cleanup can always
 * find SLSDeck's parked BrowserView and return it to the Linux panel. */
async function retainManagedTokeerTab(tab: CdpTab, wantedUrl: string, timeoutMs = 10000): Promise<boolean> {
  if (!tab.webSocketDebuggerUrl) return false;
  const wanted = canonicalDiscordChannelUrl(wantedUrl);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const liveUrl = await resolveTabUrl(tab);
    if (canonicalDiscordChannelUrl(liveUrl) === wanted) {
      const tagged = await evalJson(tab.webSocketDebuggerUrl,
        `(function(){try{if(document.readyState==='loading')return false;window.__SLSDECK_TOKEER_MANAGED=true;return true;}catch(e){return false;}})()`, 2000);
      if (tagged) return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
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
  if (liveUrl.includes(TOKEER_CHANNEL)) return retainManagedTokeerTab(tab, TOKEER_DISCORD_URL, 2500);
  const nav = await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
    url: TOKEER_DISCORD_URL,
    transitionType: "address_bar",
  }, 4000);
  if (!nav) return false;
  invalidateDiscordCaptureCaches();
  return retainManagedTokeerTab(tab, TOKEER_DISCORD_URL);
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
  // Availability refresh deliberately navigates the managed hidden view. A
  // separately-open manual ticket may also be a Discord CDP target; choosing
  // that target here returns ticket text instead of the live vault panel.
  const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
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
  const tab = (await findManagedTokeerTab()) || (await findDiscordTab());
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return [];
  const clickExpr = `(function(){try{
    var id=${JSON.stringify(TARGET_MESSAGE)},arts=[].slice.call(document.querySelectorAll('[role="article"]'));
    var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]')||arts.reverse().find(function(x){return x.querySelector('[aria-haspopup="listbox"],[role="combobox"]')&&/steam|games?|keys?|tokeer/i.test(x.innerText||'');});
    var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"],[role="combobox"]')).filter(function(x){return x.getAttribute('aria-haspopup')==='listbox'||x.getAttribute('role')==='combobox';}):[];
    var e=xs[${Number(index)}];if(!e)return false;
    var visible=function(x){var r=x.getBoundingClientRect();return r.width>0&&r.height>0;};
    var open=e.getAttribute('aria-expanded')==='true';
    var visibleOptions=[].slice.call(document.querySelectorAll('[role="listbox"] [role="option"],[role="option"]')).filter(visible);
    // Closing SLSDeck's copied menu does not close Discord's hidden popup.
    // Reuse that matching open popup; clicking the combobox again would toggle
    // it shut and make every second SLSDeck opening appear empty.
    if(open&&visibleOptions.length)return true;
    var r=e.getBoundingClientRect(),o={bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2,view:window};
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(n){var C=n.indexOf('pointer')===0&&window.PointerEvent?window.PointerEvent:MouseEvent;e.dispatchEvent(new C(n,o));});return true;
  }catch(e){return false;}})()`;
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

// Discord may render the interaction component in a sibling row rather than
// inside the message article, and some builds expose it as role=button instead
// of a literal <button>. Match the distinctive acknowledgement/tutorial label
// globally in the exact activation channel; do not match generic Confirm or
// Continue controls elsewhere in Discord.
const TICKET_GATE_EXPR = `(function(){try{
  var text=function(e){return String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();};
  var rendered=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  var all=[].slice.call(document.querySelectorAll('button,[role="button"]'));
  var seen=[],matches=[];
  for(var i=0;i<all.length;i++){
    var b=all[i];if(seen.indexOf(b)>=0||!rendered(b))continue;seen.push(b);
    var label=text(b);
    if(/(?:tutorial|instruction(?:s)?|video)/i.test(label)&&/(?:read|agree|acknowledge|understand|watch(?:ed)?)/i.test(label))matches.push({button:b,label:label});
  }
  if(!matches.length)return JSON.stringify({found:false,error:'Waiting for the agreement and tutorial confirmation button…'});
  matches.sort(function(a,b){return a.button.getBoundingClientRect().top-b.button.getBoundingClientRect().top;});
  var item=matches[matches.length-1],button=item.button;
  try{button.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}
  var r=button.getBoundingClientRect(),article=button.closest('[role="article"]'),context=article||(button.parentElement&&button.parentElement.parentElement)||button.parentElement;
  return JSON.stringify({found:true,label:item.label,disabled:!!button.disabled||button.getAttribute('aria-disabled')==='true',x:r.left+r.width/2,y:r.top+r.height/2,messageText:String(context&&context.innerText||'').slice(0,5000)});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

export async function readLatestTicketGate(): Promise<TokeerTicketGate> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return { found: false, error: "Tokeer activation channel is not open." };
  const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_GATE_EXPR);
  try { return JSON.parse(String(raw || "")); } catch { return { found: false, error: "Could not read the ticket confirmation button." }; }
}

async function readTokeerTicketRejection(tab: CdpTab, afterMessageId = ""): Promise<{ found: boolean; maintenance?: boolean; waitText?: string; waitSeconds?: number }> {
  if (!tab.webSocketDebuggerUrl) return { found: false };
  const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-20).reverse();
    for(var i=0;i<arts.length;i++){
      var identity=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=identity&&identity[2]||'';
      if(after&&id&&BigInt(id)<=BigInt(after))continue;
      var text=String(arts[i].innerText||arts[i].textContent||'').replace(/\\u00a0/g,' ').replace(/\\s+/g,' ').trim();
      if(/activation\\s+system\\s+is\\s+currently\\s+under\\s+maintenance/i.test(text)||/currently\\s+under\\s+maintenance[\\s\\S]{0,120}?no\\s+token\\s+has\\s+been\\s+used/i.test(text)){
        return JSON.stringify({found:true,maintenance:true});
      }
      var match=text.match(/(?:cooldown\\s+active|quota\\s+(?:was\\s+)?depleted)[\\s\\S]{0,160}?(?:try\\s+again\\s+(?:in|after))\\s+((?:\\d+\\s*[dhms]\\s*)+)/i);
      if(!match)continue;
      var token=String(match[1]||'').trim(),seconds=0,re=/(\\d+)\\s*([dhms])/ig,m;
      while((m=re.exec(token))){var n=Number(m[1]);seconds+=n*(m[2].toLowerCase()==='d'?86400:m[2].toLowerCase()==='h'?3600:m[2].toLowerCase()==='m'?60:1);}
      return JSON.stringify({found:true,waitText:token,waitSeconds:seconds});
    }
    return JSON.stringify({found:false});
  }catch(e){return JSON.stringify({found:false});}})()`, 3000);
  try { return JSON.parse(String(raw || "")); } catch { return { found: false }; }
}

export async function clickLatestTicketGate(): Promise<{ success: boolean; fromUrl?: string; existingChannelIds?: string[]; maintenance?: boolean; quota?: boolean; quotaWaitText?: string; quotaWaitSeconds?: number; error?: string }> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return { success: false, error: "Tokeer activation channel is not open." };
  // Snapshot the sidebar before Discord inserts the private ticket thread.
  const existingChannelIds = (await readSidebarChannels(tab)).map((item) => item.id);
  const beforeMessageId = String(await evalJson(tab.webSocketDebuggerUrl, `(function(){try{var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();for(var i=0;i<arts.length;i++){var m=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);if(m)return m[2];}return '';}catch(e){return '';}})()`, 2500) || "");
  const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_GATE_EXPR);
  let gate: TokeerTicketGate | null = null;
  try { gate = JSON.parse(String(raw || "")); } catch {}
  if (!gate?.found) return { success: false, error: gate?.error || "The agreement and tutorial confirmation button is not ready yet." };
  if (gate.disabled) {
    const rejection = await readTokeerTicketRejection(tab);
    if (rejection.maintenance) return { success: false, maintenance: true };
    if (rejection.found) return { success: false, quota: true, quotaWaitText: rejection.waitText, quotaWaitSeconds: rejection.waitSeconds };
    return { success: false, error: "Discord currently rejects the ticket action, but did not expose a cooldown time." };
  }
  const x = Number(gate.x), y = Number(gate.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { success: false, error: "The agreement and tutorial confirmation button could not be positioned." };
  await cdpCommand(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
  await cdpCommand(tab.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, 2000);
  const down = await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount: 1 }, 2000);
  const up = await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount: 1 }, 2000);
  const ok = down !== null && up !== null;
  if (ok) invalidateDiscordCaptureCaches();
  if (!ok) return { success: false, error: "Discord did not accept the agreement and tutorial confirmation click." };
  // Quota responses are ephemeral and appear in the activation channel instead
  // of creating a thread. Give the bot a short window to render that response
  // before the caller begins waiting for a new private channel.
  for (let attempt = 0; attempt < 12; attempt++) {
    const rejection = await readTokeerTicketRejection(tab, beforeMessageId);
    if (rejection.maintenance) return { success: false, maintenance: true };
    if (rejection.found) return { success: false, quota: true, quotaWaitText: rejection.waitText, quotaWaitSeconds: rejection.waitSeconds };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return { success: true, fromUrl: tab.url, existingChannelIds };
}

const TICKET_CONTEXT_EXPR = `(function(){try{
  var articles=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40);
  var opening=articles.slice(0,6).map(function(a){return String(a.innerText||a.textContent||'');}).join('\\n').replace(/\\u00a0/g,' ');
  var recent=articles.map(function(a){return String(a.innerText||a.textContent||'');}).join('\\n');
  var code=articles.reduce(function(all,a){return all.concat([].slice.call(a.querySelectorAll('pre,code,[class*="codeBlock"]')).map(function(e){return e.innerText||e.textContent||'';}));},[]).join('\\n');
  var body=(document.body.innerText||'').replace(/\\u00a0/g,' ');
  var route=String(location.href||'').match(/\\/channels\\/(\\d+)\\/(\\d+)(?:\\/(\\d+))?/i)||[];
  var messageIds=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).map(function(e){
    var value=String(e.id||e.getAttribute('data-list-item-id')||'');
    var match=value.match(/chat-messages-(\\d+)-(\\d+)/);return match?{channelId:match[1],messageId:match[2]}:null;
  }).filter(Boolean);
  var newest=messageIds.length?messageIds[messageIds.length-1]:null;
  // Discord is a long-lived SPA. Prefer code blocks and newest messages, and
  // use the end of the page as fallback because new ticket content is last.
  var text=(recent||body.slice(-50000)).replace(/\\u00a0/g,' ');
  var hay=(code+'\\n'+text).slice(-70000);
  var ubisoft=/(?:tokeer\\s+verify-ubi\\b|(?:^|\\s)--ubi\\b|\\bUbiTokeer\\b)/i.test(hay);
  var gameMatch=opening.match(/(?:Ubi|Steam|EA)?Tokeer\\s*[-–—:]\\s*([^\\n\\r]+)/i)||opening.match(/(?:Game|Title)\\s*:\\s*([^\\n\\r]+)/i);
  var gameName=gameMatch?String(gameMatch[1]||'').replace(/\\s+(?:Ticket|User|Payment|Status)\\s*:.*$/i,'').trim():'';
  var incompatiblePlatform=/(?:\\bPowerShell\\b|LuaTools\\s+Validator)/i.test(body);
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
  var identity={guildId:route[1]||'',ticketChannelId:(newest&&newest.channelId)||route[2]||'',lastMessageId:(newest&&newest.messageId)||route[3]||''};
  var common={opened:true,gameName:gameName,ubisoft:ubisoft,incompatiblePlatform:incompatiblePlatform,rawText:hay.slice(-20000)};
  if(incompatiblePlatform)return JSON.stringify(Object.assign({found:false,error:'This is a Windows activation ticket (PowerShell/LuaTools Validator instructions); Linux automation ignored it.'},common,identity));
  return JSON.stringify(ids.length?Object.assign({found:true,appid:ids[0],appids:ids},common,identity):Object.assign({found:false,error:'Ticket opened, waiting for the setup commands…'},common,identity));
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

const TICKET_LINK_EXPR = `(function(){try{
  var panel=${JSON.stringify(TOKEER_CHANNEL)};
  var parent=${JSON.stringify(`/channels/${GUILD_ID}/${TOKEER_TICKET_PARENT_CHANNEL_ID}`)};
  var guild=${JSON.stringify(`/channels/${GUILD_ID}/`)};
  var arts=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
  for(var i=0;i<Math.min(arts.length,30);i++){
    var a=arts[i], text=(a.innerText||'').replace(/\u00a0/g,' ');
    if(!/(?:ticket|activation|private|continue|created|opened)/i.test(text))continue;
    var links=[].slice.call(a.querySelectorAll('a[href*="/channels/"]'));
    for(var j=0;j<links.length;j++){
      var href=String(links[j].href||links[j].getAttribute('href')||'');
      if(href.indexOf(guild)>=0 && href.indexOf(panel)<0 && href.indexOf(parent)<0)return JSON.stringify({found:true,url:href,text:text.slice(0,3000)});
    }
  }
  return JSON.stringify({found:false});
}catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;

export async function waitForTicketContext(
  fromUrl = "",
  timeoutMs = 20000,
  expectedAppid = 0,
  existingChannelIds: string[] = [],
  onTicketDiscovered?: (ticket: TokeerTicketContext) => void,
  expectedGameName = "",
): Promise<TokeerTicketContext> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "Waiting for Tokeer ticket…";
  const startingIdentity = discordRouteIdentity(fromUrl);
  const excludedChannels = new Set([TOKEER_PANEL_CHANNEL_ID, TOKEER_TICKET_PARENT_CHANNEL_ID]);
  const sidebarBefore = new Set(existingChannelIds);
  const normalizeGame = (value: string) => String(value || "").normalize("NFKD").replace(/[®™©'’‘`´]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
  const wantedGame = normalizeGame(expectedGameName);
  let lastTicketUrl = looksLikeDiscordUrl(fromUrl) && startingIdentity.guildId === GUILD_ID && !!startingIdentity.channelId && !excludedChannels.has(startingIdentity.channelId)
    ? canonicalDiscordChannelUrl(fromUrl) : "";

  if (lastTicketUrl) {
    try {
      const managed = await findManagedTokeerTab();
      if (managed?.webSocketDebuggerUrl && canonicalDiscordChannelUrl(String(managed.url || "")) !== lastTicketUrl) {
        await cdpCommand(managed.webSocketDebuggerUrl, "Page.navigate", {
          url: lastTicketUrl, transitionType: "address_bar",
        }, 4000);
        invalidateDiscordCaptureCaches();
        await retainManagedTokeerTab(managed, lastTicketUrl);
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
    const wantedChannel = discordRouteIdentity(lastTicketUrl).channelId;
    candidates.sort((a, b) => {
      const score = (url: string) => {
        const channel = discordRouteIdentity(url).channelId;
        return Number(!!wantedChannel && channel === wantedChannel) * 4 + Number(!!channel && !excludedChannels.has(String(channel))) * 2;
      };
      return score(String(b.url || "")) - score(String(a.url || ""));
    });
    for (const tab of candidates) {
      if (!tab.webSocketDebuggerUrl) continue;
      const isManagedTarget = !!(await evalJson(tab.webSocketDebuggerUrl,
        `(function(){try{return window.__SLSDECK_TOKEER_MANAGED===true;}catch(e){return false;}})()`, 1200));
      const sidebarNow = await readSidebarChannels(tab).catch(() => [] as DiscordSidebarChannel[]);
      const knownThreads = new Set(sidebarNow.filter((item) => item.thread).map((item) => item.id));
      const raw = await evalJson(tab.webSocketDebuggerUrl, TICKET_CONTEXT_EXPR);
      try {
        const parsed = JSON.parse(String(raw || ""));
        const currentIdentity = ticketIdentity(String(tab.url || ""), parsed?.lastMessageId);
        const currentChannel = parsed?.ticketChannelId || currentIdentity.ticketChannelId;
        const isPrivateTicket = !!currentChannel && !excludedChannels.has(currentChannel) && (currentChannel === wantedChannel || knownThreads.has(currentChannel));
        const foundGame = normalizeGame(String(parsed?.gameName || ""));
        const gameMatches = !wantedGame || !foundGame || wantedGame === foundGame;
        if (parsed?.found && parsed?.appid) {
          const candidates = (Array.isArray(parsed.appids) ? parsed.appids : [parsed.appid])
            .map(Number).filter((value: number) => Number.isFinite(value) && value > 0);
          if ((!expectedAppid || candidates.includes(expectedAppid)) && gameMatches && isPrivateTicket) {
            return { ...parsed, ...currentIdentity, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: currentChannel, appid: expectedAppid || parsed.appid, opened: true };
          }
          lastError = !gameMatches
            ? `Ignored ticket for ${parsed.gameName}; the selected Linux game is ${expectedGameName}. Waiting for the correct ticket…`
            : `Ticket commands contained AppID ${candidates.join(", ")}, but the selected installed game is AppID ${expectedAppid}. Waiting for the correct setup command…`;
        }
        // Discord changes its message wrappers frequently. If the structured
        // parser cannot see code blocks, recover only the already locally
        // verified AppID from the rendered ticket text. Requiring both the
        // exact numeric token and Tokeer command vocabulary prevents an old
        // unrelated channel message from starting automation.
        if (expectedAppid && !parsed?.found) {
          const expectedExpr = `(function(){try{
            var want=${JSON.stringify(String(expectedAppid))};
            var roots=[document.body].concat([].slice.call(document.querySelectorAll('[role="article"],[data-list-item-id*="chat-messages"],pre,code')));
            var text=roots.map(function(e){return String(e&&(e.innerText||e.textContent)||'');}).join('\\n').replace(/\\u00a0/g,' ');
            var exact=new RegExp('(?:^|\\\\D)'+want+'(?:$|\\\\D)').test(text);
            var command=/(?:tokeer\\s+verify(?:-[a-z0-9_-]+)?|install_linux\\.sh|bash\\s+-s\\s+--|setup\\s+code)/i.test(text);
            return JSON.stringify({match:exact&&command,hasId:exact,hasCommand:command});
          }catch(e){return JSON.stringify({match:false,error:String(e)});}})()`;
          const expectedRaw = await evalJson(tab.webSocketDebuggerUrl, expectedExpr, 3500);
          try {
            const recovered = JSON.parse(String(expectedRaw || ""));
            if (recovered?.match && gameMatches && !parsed?.incompatiblePlatform) {
              if (!isPrivateTicket) continue;
              return { found: true, opened: true, appid: expectedAppid, appids: [expectedAppid], ubisoft: !!parsed?.ubisoft, rawText: parsed?.rawText || "", ...currentIdentity, parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: currentChannel } as TokeerTicketContext;
            }
          } catch {}
        }
        if (parsed?.opened && isPrivateTicket) lastTicketUrl = canonicalDiscordChannelUrl(String(tab.url || ""));
        if (parsed?.error) lastError = parsed.error;
      } catch {}

      // #linux-activation-point stays open while Discord adds the ticket as a
      // sidebar thread beneath #activation-point. Detect the new snowflake ID
      // without depending on navigation or localized "thread" labels.
      if (!lastTicketUrl && sidebarBefore.size) {
        try {
          const created = sidebarNow
            .filter((item) => item.thread && !sidebarBefore.has(item.id) && !excludedChannels.has(item.id))
            .sort((a, b) => b.id.localeCompare(a.id))[0];
          if (created) {
            lastTicketUrl = `https://discord.com/channels/${GUILD_ID}/${created.id}`;
            const discovered = { found: false, opened: true, ...ticketIdentity(lastTicketUrl), parentChannelId: TOKEER_TICKET_PARENT_CHANNEL_ID, ticketChannelId: created.id, error: "Ticket thread found; waiting for its setup commands…" } as TokeerTicketContext;
            try { onTicketDiscovered?.(discovered); } catch {}
            await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
              url: lastTicketUrl, transitionType: "link",
            }, 4000);
            invalidateDiscordCaptureCaches();
            if (isManagedTarget) await retainManagedTokeerTab(tab, lastTicketUrl);
            lastError = "Ticket thread found; waiting for its setup commands…";
          }
        } catch {}
      }

      // Ticket bots often post a private-channel link instead of changing the
      // current SPA route. Discover that link from recent messages and move the
      // same hidden target into it.
      try {
        const linkRaw = await evalJson(tab.webSocketDebuggerUrl, TICKET_LINK_EXPR);
        const link = JSON.parse(String(linkRaw || ""));
        if (link?.found && looksLikeDiscordUrl(link.url || "")) {
          lastTicketUrl = canonicalDiscordChannelUrl(String(link.url));
          if (canonicalDiscordChannelUrl(String(tab.url || "")) !== lastTicketUrl) {
            await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
              url: lastTicketUrl, transitionType: "link",
            }, 4000);
            invalidateDiscordCaptureCaches();
            if (isManagedTarget) await retainManagedTokeerTab(tab, lastTicketUrl);
          }
          lastError = "Ticket found; waiting for its setup commands…";
        }
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return { found: false, opened: !!lastTicketUrl, ...(lastTicketUrl ? ticketIdentity(lastTicketUrl) : {}), error: lastError || "Timed out waiting for the Tokeer ticket/thread." };
}

async function navigateTicketTab(ticketUrl: string): Promise<CdpTab | null> {
  const wanted = canonicalDiscordChannelUrl(ticketUrl);
  // Steam suspends its external-web Discord page when the user returns from
  // Manual view. That target can retain the ticket messages while unmounting
  // the composer, so it is safe for reading but not for keyboard automation.
  // Always prefer SLSDeck's rendered, parked BrowserView for ticket actions.
  let tab: CdpTab | null = await findManagedTokeerTab();
  const managedTarget = !!tab;
  // Older sessions may not have a managed view yet. Only then reuse an exact
  // Discord target, preserving compatibility without stealing a manual tab
  // whenever the managed automation surface is available.
  if (!tab?.webSocketDebuggerUrl) {
    for (const raw of (await listCdpTabs()).filter((item) => !!item.webSocketDebuggerUrl)) {
      const resolved = await resolveTabUrl(raw);
      if (canonicalDiscordChannelUrl(resolved) === wanted) {
        tab = { ...raw, url: resolved, resolvedUrl: resolved };
        break;
      }
    }
  }
  if (!tab?.webSocketDebuggerUrl) tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) return null;
  if (ticketUrl && looksLikeDiscordUrl(ticketUrl) && canonicalDiscordChannelUrl(String(tab.url || "")) !== wanted) {
    await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", { url: wanted, transitionType: "address_bar" }, 4000);
    invalidateDiscordCaptureCaches();
    if (managedTarget) await retainManagedTokeerTab(tab, wanted);
    else await new Promise((r) => setTimeout(r, 1000));
  }
  return tab;
}

async function ticketTab(ticketUrl: string): Promise<CdpTab | null> {
  const wanted = canonicalDiscordChannelUrl(ticketUrl);
  const wantedId = discordRouteIdentity(wanted).channelId;
  if (!wantedId || wantedId === TOKEER_PANEL_CHANNEL_ID || wantedId === TOKEER_TICKET_PARENT_CHANNEL_ID) return null;
  const tab = await navigateTicketTab(ticketUrl);
  if (!tab?.webSocketDebuggerUrl) return null;
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const resolved = await resolveTabUrl(tab);
    if (canonicalDiscordChannelUrl(resolved) === wanted) {
      const rendered = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
        var want=${JSON.stringify(wantedId)};
        var nodes=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]'));
        return nodes.some(function(e){return new RegExp('chat-messages-'+want+'-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      }catch(e){return false;}})()`, 2500);
      if (rendered) return { ...tab, url: resolved, resolvedUrl: resolved };
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

async function forceTicketToNewest(tab: CdpTab): Promise<void> {
  if (!tab?.webSocketDebuggerUrl) return;
  // Discord virtualizes old and new messages. A parked BrowserView can remain
  // at the verification article forever, so a bot response exists on Discord
  // but is not mounted in the DOM. Prefer Discord's own jump-to-present control,
  // then force the article scroller to its newest edge as a structural fallback.
  await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var jump=[].slice.call(document.querySelectorAll('[class*="jumpToPresent"],button,[role="button"]')).filter(visible).filter(function(e){var t=String(e.innerText||e.textContent||e.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();return /jump\\s+to\\s+present|new\\s+messages?/i.test(t)||String(e.className||'').indexOf('jumpToPresent')>=0;})[0];
    if(jump){try{jump.click();}catch(e){}}
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')),last=arts[arts.length-1];
    if(last){var s=last.parentElement;while(s&&!(s.scrollHeight>s.clientHeight+20))s=s.parentElement;if(s)s.scrollTop=s.scrollHeight;try{last.scrollIntoView({block:'end',inline:'nearest'});}catch(e){}}
    return true;
  }catch(e){return false;}})()`, 3000);
  await new Promise((r) => setTimeout(r, 450));
}

function cdpClickAndCaptureDbdata(wsUrl: string, x: number, y: number, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    let done = false, sock: WebSocket, nextId = 0;
    const pending = new Map<number, (value: any) => void>();
    const trusted = (url: any, filename = "") => {
      try {
        const value = String(url || "");
        return /^https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/attachments\//i.test(value)
          && (/db(?:ata|data)\.json/i.test(decodeURIComponent(value)) || /db(?:ata|data)\.json/i.test(String(filename || "")));
      } catch { return false; }
    };
    const finish = (value = "") => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      pending.clear();
      try { sock.close(); } catch {}
      resolve(value);
    };
    const send = (method: string, params: Record<string, any> = {}) => new Promise<any>((resolveCommand) => {
      if (done || sock.readyState !== WebSocket.OPEN) { resolveCommand(null); return; }
      const id = ++nextId;
      pending.set(id, resolveCommand);
      try { sock.send(JSON.stringify({ id, method, params })); } catch { pending.delete(id); resolveCommand(null); }
    });
    const timer = setTimeout(() => finish(""), timeoutMs);
    try { sock = new WebSocket(wsUrl); } catch { finish(""); return; }
    sock.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg?.id && pending.has(msg.id)) {
          const cb = pending.get(msg.id)!; pending.delete(msg.id); cb(msg.result ?? null); return;
        }
        const p = msg?.params || {};
        const url = p?.response?.url || p?.request?.url || p?.url || "";
        const filename = p?.suggestedFilename || "";
        if (trusted(url, filename)) finish(String(url));
      } catch {}
    };
    sock.onerror = () => finish("");
    sock.onclose = () => finish("");
    sock.onopen = async () => {
      await send("Network.enable");
      await send("Page.enable");
      await send("Input.dispatchMouseEvent", { type:"mousePressed", x, y, button:"left", buttons:1, clickCount:1 });
      await send("Input.dispatchMouseEvent", { type:"mouseReleased", x, y, button:"left", buttons:0, clickCount:1 });
    };
  });
}

export async function findPostedTokeerTicketFile(ticketUrl: string, expectedFilename: string): Promise<{ success: boolean; found: boolean; lastMessageId?: string; error?: string }> {
  const filename = String(expectedFilename || "").trim();
  if (!/^token_req_\d+\.txt$/i.test(filename)) return { success:false, found:false, error:"Invalid Ubisoft token request name." };
  const tab = await ticketTab(ticketUrl);
  if (!tab?.webSocketDebuggerUrl) return { success:false, found:false, error:"The exact saved Discord ticket could not be opened." };
  await forceTicketToNewest(tab);
  const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var expected=${JSON.stringify(filename)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-80).reverse();
    for(var i=0;i<arts.length;i++){if(String(arts[i].innerText||'').indexOf(expected)<0)continue;var m=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
    return JSON.stringify({found:false});
  }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 3500);
  try {
    const value = JSON.parse(String(raw || ""));
    if (value?.found) return { success:true, found:true, lastMessageId:String(value.id || "") || undefined };
    return { success:!value?.error, found:false, error:value?.error ? String(value.error) : undefined };
  } catch { return { success:false, found:false, error:"Could not inspect the saved Discord ticket." }; }
}

/** Return the managed Discord view to a saved private ticket after a temporary
 * background vault scrape. */
export async function restoreTokeerTicketView(ticketUrl: string): Promise<boolean> {
  const tab = await ticketTab(ticketUrl);
  if (!tab?.webSocketDebuggerUrl) return false;
  const live = await resolveTabUrl(tab);
  return canonicalDiscordChannelUrl(String(live || "")) === canonicalDiscordChannelUrl(ticketUrl);
}

/** Inspect an already-visible private ticket without navigating Discord.
 * Returning closed=false/open=false means the user merely navigated elsewhere;
 * only explicit Discord/Tokeer closure evidence aborts the saved chain. */
export async function checkTokeerTicketState(ticketUrl: string): Promise<TokeerTicketState> {
  if (!looksLikeDiscordUrl(ticketUrl)) return { open: false, closed: false };
  const wanted = canonicalDiscordChannelUrl(ticketUrl);
  const wantedId = discordRouteIdentity(wanted).channelId;
  const tabs = await listCdpTabs();
  for (const raw of tabs.filter((item) => !!item.webSocketDebuggerUrl)) {
    const resolved = await resolveTabUrl(raw);
    if (canonicalDiscordChannelUrl(String(resolved || "")) !== wanted || !raw.webSocketDebuggerUrl) continue;
    const expr = `(function(){try{
      var want=${JSON.stringify(wantedId)};
      var body=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
      var explicit=/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent);
      var unavailable=/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(body);
      var composer=!!document.querySelector('[role="textbox"][contenteditable]:not([contenteditable="false"]),[data-slate-editor="true"],textarea');
      var exact=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).some(function(e){return new RegExp('chat-messages-'+want+'-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      return JSON.stringify({open:exact&&composer&&!explicit&&!unavailable,closed:exact&&(explicit||unavailable),reason:explicit?'Tokeer reports that the ticket was cancelled or closed.':unavailable?'The Discord ticket channel no longer exists or is inaccessible.':''});
    }catch(e){return JSON.stringify({open:false,closed:false,reason:String(e)});}})()`;
    const result = await evalJson(raw.webSocketDebuggerUrl, expr, 3500);
    try { return JSON.parse(String(result || "")); } catch { return { open: false, closed: false }; }
  }
  return { open: false, closed: false };
}

/** Actively reopen a saved ticket once and distinguish a deleted channel from
 * a temporarily absent CDP target. This is intentionally not used by the
 * frequent passive poller because navigation would disrupt Manual view. */
export async function probeTokeerTicketState(ticketUrl: string): Promise<TokeerTicketState> {
  if (!looksLikeDiscordUrl(ticketUrl)) return { open: false, closed: false };
  const wanted = canonicalDiscordChannelUrl(ticketUrl);
  const wantedId = discordRouteIdentity(wanted).channelId;
  const tab = await navigateTicketTab(ticketUrl);
  if (!tab?.webSocketDebuggerUrl) return { open: false, closed: false, reason: "Discord is not connected." };
  let stableMissing = 0;
  for (let attempt = 0; attempt < 12; attempt++) {
    const expr = `(function(){try{
      var route=String(location.href||'').match(/\\/channels\\/(\\d+)\\/(\\d+)/i)||[];
      var href=route[1]&&route[2]?'https://discord.com/channels/'+route[1]+'/'+route[2]:String(location.href||'').split(/[?#]/)[0];
      var body=String(document.body&&document.body.innerText||'').replace(/\\u00a0/g,' ');
      var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\\n');
      var explicit=/(?:ticket\\s+(?:has\\s+been|was|is(?:\\s+now)?)?\\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\\s+(?:this\\s+)?ticket)/i.test(recent);
      var unavailable=/(?:unknown\\s+channel|channel\\s+(?:is\\s+)?unavailable|you\\s+(?:do\\s+not|don't)\\s+have\\s+access|no\\s+access\\s+to\\s+this\\s+channel)/i.test(body);
      var active=/(?:tokeer\\s+verify(?:-[a-z0-9_-]+)?|install_linux\\.sh|close\\s+ticket|paste\\s+that\\s+whole\\s+TLX1|TLX1\\.[A-Za-z0-9_-]+|activation\\s+(?:code|token|window)|private\\s+ticket\\s+saved)/i.test(body);
      var composer=!!document.querySelector('[role="textbox"][contenteditable]:not([contenteditable="false"]),[data-slate-editor="true"],textarea');
      var loaded=document.readyState==='complete'&&!!document.querySelector('[role="main"],[data-list-id="chat-messages"],ol[class*="scrollerInner"]');
      var exact=[].slice.call(document.querySelectorAll('[id*="chat-messages-"],[data-list-item-id*="chat-messages-"]')).some(function(e){return new RegExp('chat-messages-${wantedId}-\\\\d+').test(String(e.id||e.getAttribute('data-list-item-id')||''));});
      var sidebarReady=!!document.querySelector('[data-list-item-id="channels___${TOKEER_TICKET_PARENT_CHANNEL_ID}"],[data-list-item-id^="channels___"]');
      var sidebarHasTicket=!!document.querySelector('[data-list-item-id="channels___${wantedId}"]');
      return JSON.stringify({href:href,explicit:explicit,unavailable:unavailable,active:active,composer:composer,exact:exact,loaded:loaded,sidebarReady:sidebarReady,sidebarHasTicket:sidebarHasTicket});
    }catch(e){return JSON.stringify({error:String(e)});}})()`;
    const raw = await evalJson(tab.webSocketDebuggerUrl, expr, 3500);
    try {
      const state = JSON.parse(String(raw || ""));
      // Discord renders the previous route and a partially virtualized message
      // list while navigating. Never erase a saved chain from content observed
      // on another channel; closure evidence is authoritative only on the
      // exact child-channel identity we persisted.
      if (String(state?.href || "") === wanted && state?.exact && (state?.explicit || state?.unavailable)) {
        return { open: false, closed: true, reason: state.explicit ? "Tokeer reports that the ticket was closed." : "The Discord ticket channel no longer exists or is inaccessible." };
      }
      if (String(state?.href || "") === wanted && state?.exact && (state?.active || state?.composer)) return { open: true, closed: false };
      const parent = `https://discord.com/channels/${GUILD_ID}/${TOKEER_TICKET_PARENT_CHANNEL_ID}`;
      const panel = `https://discord.com/channels/${GUILD_ID}/${TOKEER_PANEL_CHANNEL_ID}`;
      const settledRoute = [wanted, parent, panel].includes(String(state?.href || ""));
      if (settledRoute && state?.loaded && state?.sidebarReady && !state?.sidebarHasTicket && !state?.exact) stableMissing += 1;
      else stableMissing = 0;
      if (stableMissing >= 6) return { open: false, closed: true, reason: "The exact saved ticket thread is no longer present in Discord." };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return { open: false, closed: false, reason: "Discord did not provide authoritative evidence that the saved ticket was closed; its session was preserved." };
}

export async function sendTokeerTicketMessage(ticketUrl: string, message: string): Promise<{ success: boolean; lastMessageId?: string; cancelled?: boolean; error?: string }> {
  const text = String(message || "").trim();
  if (!/^TLX1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) {
    return { success: false, error: "The generated verification value is not a valid TLX1 code; nothing was sent to Discord." };
  }
  const focusExpr = `(function(){try{
    var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
    var recent=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-12).map(function(a){return String(a.innerText||'');}).join('\n');
    if(/(?:ticket\s+(?:has\s+been|was|is(?:\s+now)?)?\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\s+(?:this\s+)?ticket)/i.test(recent)||/(?:unknown\s+channel|channel\s+(?:is\s+)?unavailable|you\s+(?:do\s+not|don't)\s+have\s+access|no\s+access\s+to\s+this\s+channel)/i.test(page))return JSON.stringify({ok:false,cancelled:true,error:'The Discord ticket was cancelled, closed, or deleted.'});
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    // Discord also has a search textbox in the header. The ticket composer is
    // the lowest visible editable control in the channel viewport.
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0];
    if(!box)return JSON.stringify({ok:false,error:'Discord message box was not found in the ticket.'});
    try{box.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}
    try{box.click();}catch(e){}
    box.focus();
    var r=box.getBoundingClientRect(),active=document.activeElement===box;
    return JSON.stringify({ok:active,found:true,x:r.left+r.width/2,y:r.top+r.height/2,error:active?'':'Discord rendered the message box but did not focus it yet.'});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;
  // Page.navigate returns before Discord's SPA has mounted the child thread's
  // Slate editor. Re-resolve the CDP target and retry instead of treating that
  // normal transition window as a permanent inability to type.
  const focusDeadline = Date.now() + 15000;
  let tab: CdpTab | null = null;
  let focused: any = null;
  let axTextboxCount = 0;
  while (Date.now() < focusDeadline && !focused?.ok) {
    tab = await ticketTab(ticketUrl);
    if (tab?.webSocketDebuggerUrl) {
      const focusedRaw = await evalJson(tab.webSocketDebuggerUrl, focusExpr, 4000);
      try { focused = JSON.parse(String(focusedRaw || "")); } catch { focused = null; }
      if (focused?.cancelled) break;
      if (focused?.found && Number.isFinite(Number(focused.x)) && Number.isFinite(Number(focused.y))) {
        // A synthetic HTMLElement.focus()/click() does not grant keyboard focus
        // inside Steam's parked BrowserView. Send trusted browser-level input at
        // the exact Slate editor coordinates, with focus emulation enabled.
        await cdpCommand(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
        await cdpCommand(tab.webSocketDebuggerUrl, "Page.bringToFront", {}, 2000);
        const point = { x: Number(focused.x), y: Number(focused.y) };
        await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", ...point }, 2000);
        await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 }, 2000);
        await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 }, 2000);
        const trustedRaw = await evalJson(tab.webSocketDebuggerUrl, focusExpr, 2500);
        try { focused = JSON.parse(String(trustedRaw || "")); } catch { /* retry */ }
      }
    }
    if (!focused?.ok) {
      // Steam CEF can expose Discord's Slate composer to accessibility and
      // controller input without exposing a matching contenteditable element
      // to Runtime.evaluate. Focus the lowest/current textbox by its backing
      // DOM node in that case. This also works with localized names such as
      // Russian "Написать…".
      if (tab?.webSocketDebuggerUrl) {
        const ax = await cdpCommand(tab.webSocketDebuggerUrl, "Accessibility.getFullAXTree", {}, 3500);
        const boxes = (Array.isArray(ax?.nodes) ? ax.nodes : []).filter((node: any) =>
          !node?.ignored && String(node?.role?.value || "").toLowerCase() === "textbox" && Number(node?.backendDOMNodeId) > 0,
        );
        axTextboxCount = boxes.length;
        const named = boxes.filter((node: any) => /(?:message|write|send|нап(?:исать|ишите)|nachricht|mensaje|écrire|scrivi|escrever|wiadomo)/i.test(String(node?.name?.value || "")));
        const composer = named[named.length - 1] || boxes[boxes.length - 1];
        if (composer?.backendDOMNodeId) {
          const didFocus = await cdpCommand(tab.webSocketDebuggerUrl, "DOM.focus", { backendNodeId: composer.backendDOMNodeId }, 2500);
          if (didFocus !== null) focused = { ok: true, found: true, accessibility: true };
        }
      }
    }
    if (!focused?.ok) {
      invalidateDiscordTabCache();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (!focused?.ok && !focused?.found) return { success: false, cancelled: !!focused?.cancelled, error: focused?.error || `Discord ticket loaded, but exposed no editable composer (accessibility textboxes: ${axTextboxCount}).` };
  if (!tab?.webSocketDebuggerUrl) return { success: false, error: "The Discord ticket view disconnected before TLX1 could be entered." };

  // Steam's parked BrowserView can keep document.activeElement on the page
  // shell even though Chromium routes Input.insertText to Discord's visible
  // Slate editor. Treat the actual draft contents as authoritative instead of
  // rejecting a usable composer solely because activeElement is stale.
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.insertText", { text }, 3000);
  const draftExpr = `(function(){try{
    var expected=${JSON.stringify(text)};
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0];
    return !!box&&String(box.value||box.innerText||box.textContent||'').indexOf(expected)>=0;
  }catch(e){return false;}})()`;
  let draftEntered = !!(await evalJson(tab.webSocketDebuggerUrl, draftExpr, 2500));
  if (!draftEntered) {
    const ax = await cdpCommand(tab.webSocketDebuggerUrl, "Accessibility.getFullAXTree", {}, 3000);
    draftEntered = (Array.isArray(ax?.nodes) ? ax.nodes : []).some((node: any) =>
      String(node?.role?.value || "").toLowerCase() === "textbox" && String(node?.value?.value || "").indexOf(text) >= 0,
    );
  }
  if (!draftEntered) {
    // execCommand fires the beforeinput/input path used by Discord's Slate
    // editor and is a safe fallback when the parked view ignores insertText.
    await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
      boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
      var box=boxes[0];if(!box)return false;box.focus();
      if('value' in box){var set=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(box),'value');if(set&&set.set)set.set.call(box,${JSON.stringify(text)});else box.value=${JSON.stringify(text)};box.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:${JSON.stringify(text)}}));return true;}
      return document.execCommand('insertText',false,${JSON.stringify(text)});
    }catch(e){return false;}})()`, 2500);
    draftEntered = !!(await evalJson(tab.webSocketDebuggerUrl, draftExpr, 2500));
  }
  if (!draftEntered) return { success: false, error: "Discord displayed the ticket message box, but did not accept the TLX1 text. It remains available for manual copy." };
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  const verifyExpr = `(function(){try{
    var expected=${JSON.stringify(text)};
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30);
    for(var i=arts.length-1;i>=0;i--){var a=arts[i];if(String(a.innerText||'').indexOf(expected)<0)continue;var m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
    var boxes=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],textarea,[contenteditable]')).filter(function(e){return visible(e)&&e.getAttribute('contenteditable')!=='false'&&!e.disabled&&!e.readOnly;});
    boxes.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;});
    var box=boxes[0],rect=box&&box.getBoundingClientRect(),composer=!!box&&!!rect&&(rect.top>innerHeight*.45||!!box.closest('form,[class*="channelTextArea"],[class*="textArea"]'));
    var draft=String(composer&&(box.value||box.innerText||box.textContent)||'');
    return JSON.stringify({found:false,composer:composer,draftContains:draft.indexOf(expected)>=0});
  }catch(e){return JSON.stringify({found:false});}})()`;
  // Discord clears the Slate composer as soon as it accepts a message, but its
  // virtualized article list can mount that message several seconds later. A
  // single immediate DOM read therefore produced intermittent false failures.
  // Poll the exact saved ticket and never press Enter again: either the TLX1
  // article appears, or a persistently cleared composer proves that Discord
  // accepted the already-entered draft and the response waiter may take over.
  const verifyDeadline = Date.now() + 15000;
  let composerClearedAt = 0;
  while (Date.now() < verifyDeadline) {
    const verifyTab = await ticketTab(ticketUrl);
    if (verifyTab?.webSocketDebuggerUrl) {
      const appearedRaw = await evalJson(verifyTab.webSocketDebuggerUrl, verifyExpr, 3000);
      try {
        const appeared = JSON.parse(String(appearedRaw || ""));
        if (appeared?.found) return { success: true, lastMessageId: String(appeared.id || "") || undefined };
        if (appeared?.composer && !appeared?.draftContains) {
          if (!composerClearedAt) composerClearedAt = Date.now();
          if (Date.now() - composerClearedAt >= 1500) return { success: true };
        } else composerClearedAt = 0;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return { success: false, error: "Discord did not confirm that the TLX1 message was posted. It remains available for manual copy." };
}

export async function waitForUbisoftVerificationConfirmation(ticketUrl: string, afterMessageId = "", timeoutMs = 2 * 60 * 1000, shouldAbort?: () => boolean): Promise<{ success: boolean; confirmed?: boolean; lastMessageId?: string; cancelled?: boolean; error?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (shouldAbort?.()) return { success: false, cancelled: true, error: "Waiting for Ubisoft verification was cancelled locally." };
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl) {
      const state = await probeTokeerTicketState(ticketUrl);
      if (state.closed) return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30);
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        // The bot's immediate reply quotes the submitted TLX1. The send
        // verifier can therefore save this Verification Passed article itself
        // as the boundary message. Re-read the boundary and skip only messages
        // strictly older than it.
        if(after&&id&&BigInt(id)<BigInt(after))continue;
        var text=String(a.innerText||'').replace(/\\s+/g,' ').trim();
        if(/verification\\s+passed|game\\s+files\\s+checked\\s+out|follow\\s+the\\s+next\\s+steps/i.test(text))return JSON.stringify({state:'passed',id:id});
        if(/verification\\s+failed|didn['’]?t\\s+pass\\s+validation|steam\\s+setup\\s+code|run\\s+tokeer\\s+verify-ubi/i.test(text))return JSON.stringify({state:'failed',id:id,error:text.slice(0,500)});
      }
      return JSON.stringify({state:'waiting'});
    }catch(e){return JSON.stringify({state:'error',error:String(e)});}})()`, 4000);
    try {
      const value = JSON.parse(String(raw || ""));
      if (value?.state === "passed") return { success: true, confirmed: true, lastMessageId: String(value.id || "") || undefined };
      if (value?.state === "failed") return { success: false, confirmed: false, lastMessageId: String(value.id || "") || undefined, error: String(value.error || "Ubisoft verification failed.") };
      if (value?.state === "error") return { success: false, error: String(value.error || "Could not read Ubisoft verification response.") };
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { success: false, error: "Timed out waiting for Ubisoft verification confirmation; no game files were changed." };
}

export async function uploadTokeerTicketFile(ticketUrl: string, filePath: string, expectedFilename: string): Promise<{ success: boolean; lastMessageId?: string; cancelled?: boolean; error?: string }> {
  const filename = String(expectedFilename || "").trim();
  if (!/^token_req_\d+\.txt$/i.test(filename) || !String(filePath || "").endsWith(`/${filename}`)) {
    return { success: false, error: "The selected file is not a recognized Ubisoft token request." };
  }
  const deadline = Date.now() + 20000;
  let tab: CdpTab | null = null;
  let fileInputFound = false;
  let fileAccepted = false;
  while (Date.now() < deadline && !fileAccepted) {
    tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    const closed = await checkTokeerTicketState(ticketUrl);
    if (closed.closed) return { success: false, cancelled: true, error: closed.reason || "The Discord ticket was closed." };
    const assigned = await cdpSetDiscordFileInput(tab.webSocketDebuggerUrl, filePath);
    fileInputFound = fileInputFound || assigned.found;
    fileAccepted = assigned.accepted;
    if (!fileAccepted) {
      // Discord may mount its hidden file input only after the attachment
      // control is opened. Prefer structural classes so localized aria-labels
      // and composer placeholders do not affect attachment discovery.
      await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
        var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
        var composer=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
        if(!composer)return false;var cr=composer.getBoundingClientRect();
        var structural=[].slice.call(document.querySelectorAll('[class*="attachButton"][role="button"],[class*="attachWrapper"] [role="button"]')).filter(visible);
        var buttons=structural.length?structural:[].slice.call(document.querySelectorAll('button,[role="button"]')).filter(visible).filter(function(b){var r=b.getBoundingClientRect();return r.bottom>=cr.top-24&&r.top<=cr.bottom+24&&r.right<=cr.left+24;});
        var b=buttons[buttons.length-1];if(!b)return false;b.click();return true;
      }catch(e){return false;}})()`, 2500);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  if (!tab?.webSocketDebuggerUrl || !fileInputFound) return { success: false, error: "Discord did not expose its attachment input in the saved ticket." };
  if (!fileAccepted) return { success: false, error: "Chromium did not accept the Ubisoft token request attachment." };

  const attachedDeadline = Date.now() + 10000;
  let attached = false;
  while (Date.now() < attachedDeadline && !attached) {
    attached = !!(await evalJson(tab.webSocketDebuggerUrl, `(function(){try{return String(document.body&&document.body.innerText||'').indexOf(${JSON.stringify(filename)})>=0;}catch(e){return false;}})()`, 2500));
    if (!attached) await new Promise((r) => setTimeout(r, 350));
  }
  if (!attached) return { success: false, error: "Discord did not show the token request in its attachment draft." };
  const composerPointRaw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
    var visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    var box=[].slice.call(document.querySelectorAll('[role="textbox"],[data-slate-editor="true"],[contenteditable]')).filter(visible).sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;})[0];
    if(!box)return '';var r=box.getBoundingClientRect();return JSON.stringify({x:r.left+r.width/2,y:r.top+r.height/2});
  }catch(e){return '';}})()`, 2500);
  try {
    const point = JSON.parse(String(composerPointRaw || ""));
    if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
      await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", buttons: 1, clickCount: 1 }, 2000);
      await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", buttons: 0, clickCount: 1 }, 2000);
    }
  } catch {}
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, 2500);
  const sentDeadline = Date.now() + 12000;
  while (Date.now() < sentDeadline) {
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var expected=${JSON.stringify(filename)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-15).reverse();
      for(var i=0;i<arts.length;i++){if(String(arts[i].innerText||'').indexOf(expected)<0)continue;var m=String(arts[i].id||arts[i].getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/);return JSON.stringify({found:true,id:m&&m[2]||''});}
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false});}})()`, 3000);
    try { const value = JSON.parse(String(raw || "")); if (value?.found) return { success: true, lastMessageId: String(value.id || "") || undefined }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return { success: false, error: "Discord did not confirm that the Ubisoft token request was posted." };
}

export async function waitForUbisoftDbdataLink(ticketUrl: string, afterMessageId = "", timeoutMs = 15 * 60 * 1000, shouldAbort?: () => boolean): Promise<{ success: boolean; url?: string; lastMessageId?: string; cancelled?: boolean; error?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (shouldAbort?.()) return { success: false, cancelled: true, error: "Waiting for dbdata.json was cancelled locally." };
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl) {
      const state = await probeTokeerTicketState(ticketUrl);
      if (state.closed) return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    await forceTicketToNewest(tab);
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40).reverse();
      var trusted=function(value){try{var url=String(value||'');return /^https:\\/\\/(?:cdn\\.discordapp\\.com|media\\.discordapp\\.net)\\/attachments\\//i.test(url)&&/db(?:ata|data)\\.json/i.test(decodeURIComponent(url));}catch(e){return false;}};
      var reactUrl=function(node){
        try{
          var queue=[],seen=[],checked=0,put=function(value,depth){if(value==null||depth>7)return;if(typeof value==='string'){if(trusted(value))queue.unshift({url:value,depth:99});return;}if((typeof value!=='object'&&typeof value!=='function')||seen.indexOf(value)>=0)return;seen.push(value);queue.push({value:value,depth:depth});};
          for(var el=node,up=0;el&&up<6;el=el.parentElement,up++)Object.getOwnPropertyNames(el).filter(function(key){return /^__react(?:Props|Fiber)\\$/i.test(key);}).forEach(function(key){put(el[key],0);});
          while(queue.length&&checked++<900){var item=queue.shift();if(item.url)return item.url;var value=item.value,depth=item.depth,keys=[];try{keys=Object.keys(value);}catch(e){}for(var k=0;k<keys.length;k++){var key=keys[k],child;try{child=value[key];}catch(e){continue;}if(typeof child==='string'&&trusted(child))return child;if(depth<7&&/(?:url|href|link|component|data|item|props|memoizedProps|pendingProps|return|child|sibling)/i.test(key))put(child,depth+1);}}
        }catch(e){}
        return '';
      };
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        // This is the exact saved private ticket. Search its mounted messages
        // idempotently instead of trusting one race-prone upload boundary: a
        // retry must recover dbdata that arrived before SLSDeck confirmed send.
        // Discord renders link-style message components beside the article in
        // the same list item, not as ordinary anchors inside the article.
        var scope=a.closest('li')||a.parentElement||a;
        var nodes=[].slice.call(scope.querySelectorAll('a[href],button,[role="button"],[role="link"]'));
        for(var j=0;j<nodes.length;j++){
          var n=nodes[j],label=String(n.innerText||n.textContent||n.getAttribute('aria-label')||n.getAttribute('title')||'').replace(/\\s+/g,' ').trim();
          if(!/(?:download\\s+)?db(?:ata|data)\\.json/i.test(label))continue;
          var link=n.closest('a[href]')||n.querySelector&&n.querySelector('a[href]')||null,href=String(link&&link.href||n.getAttribute&&n.getAttribute('href')||'');
          if(!trusted(href))href=reactUrl(n);
          if(trusted(href))return JSON.stringify({found:true,url:href,id:id});
          if(n.getBoundingClientRect){var rr=n.getBoundingClientRect();if(rr.width>0&&rr.height>0)return JSON.stringify({found:false,click:{x:rr.left+rr.width/2,y:rr.top+rr.height/2},id:id});}
        }
        var links=[].slice.call(scope.querySelectorAll('a[href]'));
        for(var l=0;l<links.length;l++){var direct=String(links[l].href||'');if(trusted(direct))return JSON.stringify({found:true,url:direct,id:id});}
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 4000);
    try {
      const value = JSON.parse(String(raw || ""));
      if (value?.found && value.url) return { success: true, url: String(value.url), lastMessageId: String(value.id || "") || undefined };
      if (value?.click && Number.isFinite(value.click.x) && Number.isFinite(value.click.y)) {
        const captured = await cdpClickAndCaptureDbdata(tab.webSocketDebuggerUrl, Number(value.click.x), Number(value.click.y));
        if (captured) return { success:true, url:captured, lastMessageId:String(value.id || "") || undefined };
      }
      if (value?.error) return { success: false, error: String(value.error) };
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { success: false, error: "Timed out waiting for Discord's dbdata.json download." };
}

export async function clickTokeerGameWorked(ticketUrl: string, afterMessageId = ""): Promise<{ success: boolean; error?: string }> {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const tab = await ticketTab(ticketUrl);
    if (!tab?.webSocketDebuggerUrl) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    const raw = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var after=${JSON.stringify(afterMessageId)},visible=function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
      var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-40).reverse();
      for(var i=0;i<arts.length;i++){
        var a=arts[i],m=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/),id=m&&m[2]||'';
        if(after&&id&&BigInt(id)<BigInt(after))continue;
        var scope=a.closest('li')||a.parentElement||a,buttons=[].slice.call(scope.querySelectorAll('button,[role="button"]')).filter(visible);
        for(var j=buttons.length-1;j>=0;j--){var b=buttons[j],label=String(b.innerText||b.textContent||b.getAttribute('aria-label')||'').replace(/\\s+/g,' ').trim();if(!/^game\\s+worked!?$/i.test(label))continue;if(b.disabled||b.getAttribute('aria-disabled')==='true')return JSON.stringify({found:true,disabled:true});try{b.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}var r=b.getBoundingClientRect();return JSON.stringify({found:true,x:r.left+r.width/2,y:r.top+r.height/2});}
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`, 3500);
    try {
      const target = JSON.parse(String(raw || ""));
      if (target?.disabled) return { success: true };
      if (target?.found && Number.isFinite(Number(target.x)) && Number.isFinite(Number(target.y))) {
        await cdpCommand(tab.webSocketDebuggerUrl, "Emulation.setFocusEmulationEnabled", { enabled: true }, 2000);
        await cdpCommand(tab.webSocketDebuggerUrl, "Page.bringToFront", {}, 2000);
        const point = { x: Number(target.x), y: Number(target.y) };
        await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseMoved", ...point }, 2000);
        const down = await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 }, 2000);
        const up = await cdpCommand(tab.webSocketDebuggerUrl, "Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 }, 2000);
        if (down !== null && up !== null) return { success: true };
      }
      if (target?.error) return { success: false, error: String(target.error) };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return { success: false, error: "The latest Game worked! button was not found in the saved Discord ticket." };
}

export async function waitForTokeerActivationCode(ticketUrl: string, timeoutMs = 15 * 60 * 1000, afterMessageId = "", shouldAbort?: () => boolean): Promise<{ success: boolean; code?: string; lastMessageId?: string; cancelled?: boolean; error?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (shouldAbort?.()) return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
    const tab = await ticketTab(ticketUrl);
    if (shouldAbort?.()) return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
    if (!tab?.webSocketDebuggerUrl) {
      const state = await probeTokeerTicketState(ticketUrl);
      if (state.closed) return { success: false, cancelled: true, error: state.reason || "The Discord ticket was closed." };
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    // A parked Steam BrowserView often remains virtualized at the submitted
    // TLX1 article. The bot response then exists in Discord but is not mounted
    // for querySelector until we jump/scroll to the newest edge.
    await forceTicketToNewest(tab);
    const expr = `(function(){try{
      var after=${JSON.stringify(afterMessageId)};
      var arts=[].slice.call(document.querySelectorAll('[role="article"]')).slice(-30).reverse();
      var page=String(document.body&&document.body.innerText||'').replace(/\u00a0/g,' ');
      var recent=arts.slice(0,12).map(function(a){return String(a.innerText||'');}).join('\\n');
      if(/(?:ticket\\s+(?:has\\s+been|was|is(?:\\s+now)?)?\\s*(?:closed|cancelled|canceled|deleted)|(?:closing|deleting|cancelling|canceling)\\s+(?:this\\s+)?ticket)/i.test(recent))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket was cancelled or closed.'});
      if(/(?:unknown\\s+channel|channel\\s+(?:is\\s+)?unavailable|you\\s+(?:do\\s+not|don't)\\s+have\\s+access|no\\s+access\\s+to\\s+this\\s+channel)/i.test(page))return JSON.stringify({found:false,cancelled:true,error:'The Discord ticket channel no longer exists or is inaccessible.'});
      var common=/^(?:verify|setup|ticket|cancel|close|valid|code|redeem|tokeer|linux|steam|proton)$/i;
      for(var i=0;i<arts.length;i++){
        var a=arts[i], identity=String(a.id||a.getAttribute('data-list-item-id')||'').match(/chat-messages-(\\d+)-(\\d+)/), messageId=identity&&identity[2]||'';
        var text=String(a.innerText||'').replace(/\u00a0/g,' ').trim();
        var strongContext=/(?:here['’]?s\\s+your\\s+activation|your\\s+code)/i.test(text);
        // Normal responses must be newer than the submitted TLX1. On resume,
        // allow the unmistakable activation embed even if stale bookkeeping
        // accidentally saved its own ID as the boundary.
        if(after&&messageId&&BigInt(messageId)<=BigInt(after)&&!strongContext)continue;
        if(/TLX1\\./i.test(text))continue;
        var nodes=[].slice.call(a.querySelectorAll('code,pre')).map(function(n){return String(n.textContent||'').trim();});
        var contextual=strongContext||/(?:activation|redeem|single[- ]use|expires|30\\s*minutes?|verification\\s+(?:succeeded|complete))/i.test(text);
        var matches=nodes.filter(function(v){return /^[A-Za-z0-9_-]{6}$/.test(v)&&!common.test(v);});
        if(!matches.length&&contextual){
          matches=(text.match(/(?:^|\\s|[:#])([A-Za-z0-9_-]{6})(?=$|\\s|[.,!])/g)||[]).map(function(v){var m=v.match(/([A-Za-z0-9_-]{6})/);return m?m[1]:'';}).filter(function(v){return v&&!common.test(v);});
        }
        if(matches.length&&contextual)return JSON.stringify({found:true,code:matches[0],lastMessageId:messageId});
      }
      return JSON.stringify({found:false});
    }catch(e){return JSON.stringify({found:false,error:String(e)});}})()`;
    const raw = await evalJson(tab.webSocketDebuggerUrl, expr, 4000);
    try {
      const found = JSON.parse(String(raw || ""));
      if (found?.found && /^[A-Za-z0-9_-]{6}$/.test(String(found.code || ""))) return { success: true, code: String(found.code), lastMessageId: String(found.lastMessageId || "") || undefined };
      if (found?.cancelled) return { success: false, cancelled: true, error: found.error || "The Discord ticket was cancelled." };
      if (found?.error) return { success: false, error: found.error };
    } catch {}
    if (shouldAbort?.()) return { success: false, cancelled: true, error: "Activation-code waiting was cancelled locally." };
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { success: false, error: "Timed out waiting for the six-character activation code. The ticket is still saved and can be resumed." };
}

export async function cancelTokeerTicket(ticketUrl = ""): Promise<{ success: boolean; unavailable?: boolean; error?: string }> {
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
    var match=function(b){var t=label(b);return /(?:^|\\b)(?:(?:cancel|close|delete|abort)\\s+(?:this\\s+)?ticket|ticket\\s+(?:cancel|close|delete|abort))(?:\\b|$)/i.test(t);};
    var articles=[].slice.call(document.querySelectorAll('[role="article"]')).reverse();
    var target=null;
    for(var i=0;i<articles.length&&!target;i++){
      var inMessage=[].slice.call(articles[i].querySelectorAll('button,[role="button"]')).filter(visible);
      var strong=inMessage.filter(match), short=inMessage.filter(function(b){
      var t=label(b);if(!/^(?:cancel|close|delete|abort)$/i.test(t)||!danger(b))return false;
      var context=String(articles[i].innerText||'');
      return /ticket|activation|tokeer/i.test(context);
      });
      target=strong.filter(danger).slice(-1)[0]||strong.slice(-1)[0]||short.slice(-1)[0]||null;
    }
    if(!target)return JSON.stringify({ok:false,error:'The red Cancel Ticket button was not found in the open ticket.'});
    click(target);
    return JSON.stringify({ok:true,label:label(target)});
  }catch(e){return JSON.stringify({ok:false,error:String(e)});}})()`;

  const tab = await ticketTab(ticketUrl);
  let first: any = null;
  if (!tab?.webSocketDebuggerUrl) return { success: false, unavailable: true, error: "The exact saved Discord ticket thread could not be opened; no other channel was touched." };
  let raw = await evalJson(tab.webSocketDebuggerUrl, clickCancel, 4000);
  try { first = JSON.parse(String(raw || "")); } catch { first = null; }
  // Discord virtualizes older thread messages. Start at the newest rendered
  // messages, then walk upward until the newest available Cancel Ticket control
  // is found or the full thread has been checked.
  for (let attempt = 0; !first?.ok && attempt < 18; attempt++) {
    const moved = await evalJson(tab.webSocketDebuggerUrl, `(function(){try{
      var a=document.querySelector('[role="article"]'),s=a;
      while(s&&!(s.scrollHeight>s.clientHeight+20))s=s.parentElement;
      if(!s)return false;var before=s.scrollTop;
      s.scrollTop=Math.max(0,before-Math.max(280,Math.floor(s.clientHeight*.8)));
      return s.scrollTop!==before;
    }catch(e){return false;}})()`, 2000);
    if (!moved) break;
    await new Promise((r) => setTimeout(r, 350));
    raw = await evalJson(tab.webSocketDebuggerUrl, clickCancel, 4000);
    try { first = JSON.parse(String(raw || "")); } catch { first = null; }
  }
  if (!first?.ok || !tab?.webSocketDebuggerUrl) return { success: false, error: first?.error || "Could not press Cancel Ticket." };

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
