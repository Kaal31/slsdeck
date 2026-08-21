import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export interface BuildRow { buildid: string; date: string }
interface CdpTab { url?: string; title?: string; type?: string; webSocketDebuggerUrl?: string; _port?: number }

const _cache = new Map<number, BuildRow[]>();

// Kept for API compatibility. Do NOT cancel merely because the game-tools
// component unmounted: opening SteamDB itself navigates away from that
// component, which used to cancel the very request we had just started.
export function cancelSteamdbBuildFetch(): void { /* intentionally no-op */ }

async function listTargets(): Promise<CdpTab[]> {
  const out: CdpTab[] = [];
  for (const port of [8080, 8081]) {
    try {
      const res = await fetchNoCors(`http://localhost:${port}/json`);
      const tabs: CdpTab[] = await res.json();
      for (const t of tabs || []) if (t?.webSocketDebuggerUrl) out.push({ ...t, _port: port });
    } catch { /* try next port */ }
  }
  return out;
}

function evalInTab(wsUrl: string, expression: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: any) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(undefined); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); }
      catch { finish(undefined); }
    };
    sock.onmessage = (ev) => {
      try { const m = JSON.parse(typeof ev.data === "string" ? ev.data : ""); if (m?.id === 1) finish(m?.result?.result?.value); }
      catch { /* */ }
    };
    sock.onerror = () => finish(undefined);
    setTimeout(() => finish(undefined), timeoutMs);
  });
}

async function findSteamdbTab(): Promise<CdpTab | null> {
  const tabs = await listTargets();
  const direct = tabs.find((t) => (t.url || "").includes("steamdb.info"));
  if (direct) return direct;
  for (const t of tabs) {
    if (!t.webSocketDebuggerUrl) continue;
    const href = await evalInTab(t.webSocketDebuggerUrl, "location.href", 1800);
    if (typeof href === "string" && href.includes("steamdb.info")) return { ...t, url: href };
  }
  return null;
}

interface RssResult { status: number; text: string; error?: string }

function fetchRssInTab(wsUrl: string, appid: number, timeoutMs = 10000): Promise<RssResult> {
  const expr = `(async()=>{try{const r=await fetch('/api/PatchnotesRSS/?appid=${appid}',{credentials:'include'});return {status:r.status,text:await r.text()};}catch(e){return {status:0,text:'',error:String(e)}}})()`;
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: RssResult) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve({ status: 0, text: "", error: "Could not attach to SteamDB tab" }); return; }
    sock.onopen = () => { try { sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } })); } catch { finish({ status: 0, text: "", error: "Could not query SteamDB tab" }); } };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m?.id === 1) {
          const v = m?.result?.result?.value;
          if (v && typeof v === "object") finish({ status: Number(v.status || 0), text: String(v.text || ""), error: v.error ? String(v.error) : undefined });
          else finish({ status: 0, text: "", error: "SteamDB returned no RSS result" });
        }
      } catch { /* */ }
    };
    sock.onerror = () => finish({ status: 0, text: "", error: "SteamDB CDP connection failed" });
    setTimeout(() => finish({ status: 0, text: "", error: "SteamDB RSS request timed out" }), timeoutMs);
  });
}

function parseRss(xml: string): BuildRow[] {
  const out: BuildRow[] = [];
  const seen = new Set<string>();
  const items = xml.split(/<item>/i).slice(1);
  for (const it of items) {
    const link = (it.match(/<link>([^<]*)<\/link>/i) || [])[1] || "";
    const title = (it.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    const pub = (it.match(/<pubDate>([^<]*)<\/pubDate>/i) || [])[1] || "";
    let bid = (link.match(/\/patchnotes\/(\d+)/) || [])[1] || "";
    if (!bid) bid = (title.match(/Build\s+(\d+)/i) || [])[1] || "";
    if (!bid || seen.has(bid)) continue;
    seen.add(bid);
    let date = "";
    try { const d = new Date(pub); if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10); } catch { /* */ }
    out.push({ buildid: bid, date });
  }
  return out;
}

// Fallback for Steam Machine/desktop-width SteamDB layouts and for cases where
// the RSS endpoint fails or changes. Read the rendered Builds table itself.
async function parseBuildsFromDom(wsUrl: string): Promise<BuildRow[]> {
  const expr = `(()=>{try{
    const seen=new Set(), out=[];
    const add=(bid,date)=>{bid=String(bid||'').trim();if(!/^\\d{6,}$/.test(bid)||seen.has(bid))return;seen.add(bid);out.push({buildid:bid,date:String(date||'').trim()});};
    for(const tr of Array.from(document.querySelectorAll('table tr'))){
      const text=(tr.textContent||'').replace(/\\s+/g,' ').trim();
      let bid='';
      for(const a of Array.from(tr.querySelectorAll('a[href]'))){const h=a.getAttribute('href')||'';const m=h.match(/\\/patchnotes\\/(\\d+)/);if(m){bid=m[1];break;}}
      if(!bid){const cells=Array.from(tr.querySelectorAll('td')).map(x=>(x.textContent||'').trim());for(let i=cells.length-1;i>=0;i--){if(/^\\d{6,}$/.test(cells[i])){bid=cells[i];break;}}}
      if(!bid){const m=text.match(/(?:^|\\s)(\\d{6,})(?:\\s|$)/g);if(m){const n=m[m.length-1].match(/\\d+/);if(n)bid=n[0];}}
      let date='';const first=tr.querySelector('td');if(first)date=(first.textContent||'').trim();add(bid,date);
    }
    return out;
  }catch(e){return []}})()`;
  const v = await evalInTab(wsUrl, expr, 5000);
  if (!Array.isArray(v)) return [];
  return v.filter((r: any) => r && /^\d{6,}$/.test(String(r.buildid || ""))).map((r: any) => ({ buildid: String(r.buildid), date: String(r.date || "") }));
}

export async function fetchSteamdbBuilds(appid: number, onStatus?: (s: string) => void): Promise<BuildRow[]> {
  if (_cache.has(appid)) return _cache.get(appid)!;
  let tab = await findSteamdbTab();
  if (!tab) {
    onStatus?.("Opening SteamDB for build history… leave it open, then return to SLSDeck.");
    try { Navigation.NavigateToExternalWeb(`https://steamdb.info/app/${appid}/patchnotes/`); } catch { /* */ }
  }
  const deadline = Date.now() + 30000;
  let lastError = "";
  while (Date.now() < deadline) {
    tab = await findSteamdbTab();
    if (tab?.webSocketDebuggerUrl) {
      onStatus?.("Reading SteamDB build history…");
      const rss = await fetchRssInTab(tab.webSocketDebuggerUrl, appid);
      if (rss.status === 200 && rss.text) {
        const rows = parseRss(rss.text);
        if (rows.length) { _cache.set(appid, rows); return rows; }
        lastError = "SteamDB RSS returned no build rows; trying the visible Builds table…";
      } else if (rss.status) lastError = `SteamDB history request returned HTTP ${rss.status}; trying the visible Builds table…`;
      else if (rss.error) lastError = `${rss.error}; trying the visible Builds table…`;

      onStatus?.(lastError || "Trying SteamDB's visible Builds table…");
      const domRows = await parseBuildsFromDom(tab.webSocketDebuggerUrl);
      if (domRows.length) { _cache.set(appid, domRows); return domRows; }
      onStatus?.("SteamDB is open, but neither RSS nor the visible Builds table returned history yet.");
    } else onStatus?.("Waiting for SteamDB to become visible to Steam CEF…");
    await new Promise((r) => setTimeout(r, 1000));
  }
  onStatus?.(lastError || "Could not retrieve SteamDB build history. Leave SteamDB open and retry.");
  return [];
}
