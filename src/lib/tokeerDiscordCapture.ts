import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
const TOKEER_CHANNEL = "/channels/1464130182364270696/1534460498446127175";
const TARGET_MESSAGE = "1535685399265935422";

interface CdpTab { url: string; title?: string; webSocketDebuggerUrl?: string }
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

async function listCdpTabs(): Promise<CdpTab[]> {
  try {
    const r = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await r.json();
    return Array.isArray(tabs) ? tabs : [];
  } catch {
    return [];
  }
}

/**
 * Discord is a SPA: during OAuth/login it may be /login or /channels/@me and
 * only later navigate to the Tokeer channel.  Match any debuggable Discord CEF
 * target instead of requiring the final channel URL up front.
 */
async function findDiscordTab(): Promise<CdpTab | null> {
  const tabs = await listCdpTabs();
  const discord = tabs.filter((t) =>
    !!t.webSocketDebuggerUrl && /(^|\.)discord\.com(?:\/|$)/i.test(String(t.url || "").replace(/^https?:\/\//i, "")),
  );
  if (!discord.length) return null;
  return discord.find((t) => t.url?.includes(TOKEER_CHANNEL)) || discord[0];
}

function evalJson(wsUrl: string, expression: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve) => {
    let done = false; let sock: WebSocket;
    const finish = (v: any) => { if (done) return; done = true; try { sock.close(); } catch {} resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(null); return; }
    const id = 1;
    sock.onopen = () => sock.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
    sock.onmessage = (ev) => {
      try { const m = JSON.parse(String(ev.data)); if (m?.id === id) finish(m?.result?.result?.value ?? null); } catch {}
    };
    sock.onerror = () => finish(null);
    setTimeout(() => finish(null), timeoutMs);
  });
}

async function navigateDiscordTabToTokeer(tab: CdpTab): Promise<boolean> {
  if (!tab.webSocketDebuggerUrl) return false;
  if (tab.url?.includes(TOKEER_CHANNEL)) return true;
  const expr = `(function(){try{location.href=${JSON.stringify(TOKEER_DISCORD_URL)};return true;}catch(e){return false;}})()`;
  return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}

const SNAPSHOT_EXPR = `(function(){try{
  var id=${JSON.stringify(TARGET_MESSAGE)};
  var article=document.querySelector('[data-list-item-id$="-'+id+'"]') || document.querySelector('#message-accessories-'+id)?.closest('[role="article"]') || document.querySelector('#message-reactions-'+id)?.closest('[role="article"]');
  if(!article) return JSON.stringify({found:false,error:'Discord CEF is connected, but the target Tokeer message is not rendered yet. Open the linked message (or wait for Discord to finish loading).'});
  var text=(article.innerText||'').replace(/\u00a0/g,' ');
  var n=function(re){var m=text.match(re);return m?Number(m[1]):undefined};
  var s=function(re){var m=text.match(re);return m?m[1].trim():undefined};
  var selects=[].slice.call(article.querySelectorAll('[aria-haspopup="listbox"]')).map(function(e,i){
    var label=(e.innerText||e.textContent||'').trim();
    return {index:i,label:label,disabled:e.getAttribute('aria-disabled')==='true'};
  });
  return JSON.stringify({found:true,steamStatus:s(/Steam\s*:\s*([^\n]+)/i),gamesListed:n(/Games listed:\s*(\d+)/i),steamGames:n(/Games listed:[\s\S]*?Steam[^\d]*(\d+)/i),keysRemaining:n(/Keys remaining:\s*(\d+)/i),highDemand:n(/High demand:\s*(\d+)/i),selectors:selects,rawText:text.slice(0,12000)});
}catch(e){return JSON.stringify({found:false,error:String(e),selectors:[]});}})()`;

export async function readTokeerDiscord(): Promise<TokeerDiscordState> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) {
    return { found: false, selectors: [], error: "No Discord page is visible to Steam CEF/CDP. Use ‘Open Tokeer Discord’ from this page (not the desktop/system browser)." };
  }
  if (!tab.url?.includes(TOKEER_CHANNEL)) {
    return { found: false, selectors: [], tabUrl: tab.url, error: "Discord is visible in Steam CEF, but it is on a different page. Press ‘Open Tokeer Discord’ to navigate this CEF tab to the activation panel." };
  }
  const raw = await evalJson(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
  try { return { ...JSON.parse(String(raw || "")), tabUrl: tab.url }; }
  catch { return { found: false, selectors: [], tabUrl: tab.url, error: "Could not parse Discord DOM snapshot." }; }
}

export async function openSelectorAndReadOptions(index: number): Promise<string[]> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return [];
  const clickExpr = `(function(){try{var id=${JSON.stringify(TARGET_MESSAGE)};var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]');var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"]')):[];var e=xs[${Number(index)}];if(!e)return false;e.click();return true;}catch(e){return false;}})()`;
  const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr);
  if (!ok) return [];
  await new Promise((r) => setTimeout(r, 450));
  const optionsExpr = `(function(){try{return JSON.stringify([].slice.call(document.querySelectorAll('[role="option"]')).map(function(e){return (e.innerText||e.textContent||'').trim();}).filter(Boolean));}catch(e){return '[]';}})()`;
  const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr);
  try { return JSON.parse(String(raw || "[]")); } catch { return []; }
}

export async function chooseSelectorOption(index: number, label: string): Promise<boolean> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl || !tab.url?.includes(TOKEER_CHANNEL)) return false;
  await openSelectorAndReadOptions(index);
  const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="option"]')).find(function(e){return (e.innerText||e.textContent||'').trim()===want;});if(!o)return false;o.click();return true;}catch(e){return false;}})()`;
  return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}

/**
 * Open Discord in Steam's own web surface. NavigateToExternalWeb is the Decky /
 * game-mode route and keeps the page inside Steam CEF, where localhost:8080 CDP
 * can see it. If a Discord CEF target already exists, re-use and navigate it.
 */
export async function openTokeerDiscord(): Promise<boolean> {
  try {
    const existing = await findDiscordTab();
    if (existing?.webSocketDebuggerUrl) {
      if (await navigateDiscordTabToTokeer(existing)) return true;
    }
  } catch {}

  try {
    const nav: any = Navigation as any;
    if (typeof nav?.NavigateToExternalWeb === "function") {
      nav.NavigateToExternalWeb(TOKEER_DISCORD_URL);
      return true;
    }
  } catch {}

  // window.open is still preferable to OpenInSystemBrowser: in game mode it can
  // create a Steam/CEF web target, while OpenInSystemBrowser escapes to desktop.
  try {
    const w = window.open(TOKEER_DISCORD_URL, "_blank");
    if (w) return true;
  } catch {}

  // Last-resort fallback. This is intentionally last because CDP cannot inspect
  // an external desktop browser; the UI will clearly report that condition.
  try {
    const SC: any = (window as any).SteamClient;
    if (SC?.System?.OpenInSystemBrowser) {
      SC.System.OpenInSystemBrowser(TOKEER_DISCORD_URL);
      return true;
    }
  } catch {}
  return false;
}
