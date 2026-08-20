import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

// Fetch a game's build history from SteamDB's PatchnotesRSS THROUGH the Steam
// browser. The feed is public but Cloudflare-gated, so the plugin backend
// (bot User-Agent, no CF cookie) gets blocked — but a same-origin fetch inside a
// steamdb.info tab passes, because the browser holds the cf_clearance cookie (and
// the SteamDB login session, if signed in). We never read the cookie; the browser
// applies it. Result is cached per appid so re-opening the picker is instant.

export interface BuildRow { buildid: string; date: string }

interface CdpTab { url: string; webSocketDebuggerUrl?: string }

const _cache = new Map<number, BuildRow[]>();

async function findSteamdbTab(): Promise<CdpTab | null> {
  try {
    const res = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await res.json();
    return tabs.find((t) => t.url && t.url.includes("steamdb.info") && t.webSocketDebuggerUrl) || null;
  } catch { return null; }
}

// Same-origin fetch of the RSS inside the steamdb tab, returned as text.
function fetchRssInTab(wsUrl: string, appid: number, timeoutMs = 8000): Promise<string> {
  const expr = `fetch('/api/PatchnotesRSS/?appid=${appid}',{credentials:'include'}).then(function(r){return r.status===200?r.text():'';}).catch(function(){return '';})`;
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: string) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(""); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } })); }
      catch { finish(""); }
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m && m.id === 1) { const v = m?.result?.result?.value; finish(typeof v === "string" ? v : ""); }
      } catch { /* */ }
    };
    sock.onerror = () => finish("");
    setTimeout(() => finish(""), timeoutMs);
  });
}

function parseRss(xml: string): BuildRow[] {
  const out: BuildRow[] = [];
  const items = xml.split(/<item>/i).slice(1);
  for (const it of items) {
    const link = (it.match(/<link>([^<]*)<\/link>/i) || [])[1] || "";
    const title = (it.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    const pub = (it.match(/<pubDate>([^<]*)<\/pubDate>/i) || [])[1] || "";
    let bid = (link.match(/\/patchnotes\/(\d+)/) || [])[1] || "";
    if (!bid) bid = (title.match(/Build\s+(\d+)/i) || [])[1] || "";
    if (!bid) continue;
    let date = "";
    try { const d = new Date(pub); if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10); } catch { /* */ }
    out.push({ buildid: bid, date });
  }
  return out;
}

/** Full build history for a game via the browser RSS (cached). Opens/reuses a
 *  steamdb.info tab; returns [] if it can't be read (offline / hard block). */
export async function fetchSteamdbBuilds(
  appid: number, onStatus?: (s: string) => void,
): Promise<BuildRow[]> {
  if (_cache.has(appid)) return _cache.get(appid)!;
  // Ensure a steamdb.info tab exists (clears Cloudflare + carries cookies). Point
  // it at this app's page so the origin/session is warm.
  let tab = await findSteamdbTab();
  if (!tab) {
    onStatus?.("Opening SteamDB…");
    try { Navigation.NavigateToExternalWeb(`https://steamdb.info/app/${appid}/patchnotes/`); } catch { /* */ }
  }
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    tab = await findSteamdbTab();
    if (tab?.webSocketDebuggerUrl) {
      const xml = await fetchRssInTab(tab.webSocketDebuggerUrl, appid);
      if (xml && xml.includes("<item>")) {
        const rows = parseRss(xml);
        if (rows.length) { _cache.set(appid, rows); return rows; }
      }
      onStatus?.("Reading build history…");
    } else {
      onStatus?.("Waiting for SteamDB…");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}
