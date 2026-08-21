import { fetchNoCors } from "@decky/api";

export const TOKEER_DISCORD_URL = "https://discord.com/channels/1464130182364270696/1534460498446127175/1535685399265935422";
const TARGET_MESSAGE = "1535685399265935422";

interface CdpTab { url: string; webSocketDebuggerUrl?: string }
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
};

async function findDiscordTab(): Promise<CdpTab | null> {
  try {
    const r = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await r.json();
    return tabs.find((t) => !!t.webSocketDebuggerUrl && t.url?.includes("discord.com/channels/1464130182364270696/1534460498446127175")) || null;
  } catch { return null; }
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

const SNAPSHOT_EXPR = `(function(){try{
  var id=${JSON.stringify(TARGET_MESSAGE)};
  var article=document.querySelector('[data-list-item-id$="-'+id+'"]') || document.querySelector('#message-accessories-'+id)?.closest('[role="article"]') || document.querySelector('#message-reactions-'+id)?.closest('[role="article"]');
  if(!article) return JSON.stringify({found:false,error:'Target Tokeer message is not currently rendered. Open the linked message and keep the Discord tab alive.'});
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
  if (!tab?.webSocketDebuggerUrl) return { found: false, selectors: [], error: "Discord tab not found in Steam CEF. Open the Tokeer Discord message first." };
  const raw = await evalJson(tab.webSocketDebuggerUrl, SNAPSHOT_EXPR);
  try { return JSON.parse(String(raw || "")); } catch { return { found: false, selectors: [], error: "Could not parse Discord DOM snapshot." }; }
}

export async function openSelectorAndReadOptions(index: number): Promise<string[]> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) return [];
  const clickExpr = `(function(){try{var id=${JSON.stringify(TARGET_MESSAGE)};var a=document.querySelector('[data-list-item-id$="-'+id+'"]')||document.querySelector('#message-accessories-'+id)?.closest('[role="article"]');var xs=a?[].slice.call(a.querySelectorAll('[aria-haspopup="listbox"]')):[];var e=xs[${Number(index)}];if(!e)return false;e.click();return true;}catch(e){return false;}})()`;
  const ok = await evalJson(tab.webSocketDebuggerUrl, clickExpr);
  if (!ok) return [];
  await new Promise((r) => setTimeout(r, 350));
  const optionsExpr = `(function(){try{return JSON.stringify([].slice.call(document.querySelectorAll('[role="option"]')).map(function(e){return (e.innerText||e.textContent||'').trim();}).filter(Boolean));}catch(e){return '[]';}})()`;
  const raw = await evalJson(tab.webSocketDebuggerUrl, optionsExpr);
  try { return JSON.parse(String(raw || "[]")); } catch { return []; }
}

export async function chooseSelectorOption(index: number, label: string): Promise<boolean> {
  const tab = await findDiscordTab();
  if (!tab?.webSocketDebuggerUrl) return false;
  await openSelectorAndReadOptions(index);
  const expr = `(function(){try{var want=${JSON.stringify(label)};var o=[].slice.call(document.querySelectorAll('[role="option"]')).find(function(e){return (e.innerText||e.textContent||'').trim()===want;});if(!o)return false;o.click();return true;}catch(e){return false;}})()`;
  return !!(await evalJson(tab.webSocketDebuggerUrl, expr));
}

export function openTokeerDiscord(): boolean {
  try {
    const SC: any = (window as any).SteamClient;
    if (SC?.System?.OpenInSystemBrowser) { SC.System.OpenInSystemBrowser(TOKEER_DISCORD_URL); return true; }
  } catch {}
  try { window.open(TOKEER_DISCORD_URL, "_blank"); return true; } catch { return false; }
}
