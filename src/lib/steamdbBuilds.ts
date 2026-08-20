import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export interface BuildRow { buildid: string; date: string }
interface CdpTab { url: string; webSocketDebuggerUrl?: string }

const _cache = new Map<number, BuildRow[]>();
let _cancelToken = 0;

export function cancelSteamdbBuildFetch(): void {
  _cancelToken++;
}

async function findSteamdbTab(): Promise<CdpTab | null> {
  try {
    const res = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await res.json();
    return tabs.find((t) => t.url && t.url.includes("steamdb.info") && t.webSocketDebuggerUrl) || null;
  } catch { return null; }
}

function fetchRssInTab(wsUrl: string, appid: number, timeoutMs = 5000): Promise<string> {
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

export async function fetchSteamdbBuilds(
  appid: number, onStatus?: (s: string) => void,
): Promise<BuildRow[]> {
  if (_cache.has(appid)) return _cache.get(appid)!;
  const token = _cancelToken;
  let tab = await findSteamdbTab();
  if (!tab) {
    onStatus?.("Opening SteamDB once for build history…");
    try { Navigation.NavigateToExternalWeb(`https://steamdb.info/app/${appid}/patchnotes/`); } catch { /* */ }
  }
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline && token === _cancelToken) {
    tab = await findSteamdbTab();
    if (tab?.webSocketDebuggerUrl) {
      onStatus?.("Reading SteamDB build history…");
      const xml = await fetchRssInTab(tab.webSocketDebuggerUrl, appid);
      if (token !== _cancelToken) return [];
      if (xml && xml.includes("<item>")) {
        const rows = parseRss(xml);
        if (rows.length) { _cache.set(appid, rows); return rows; }
      }
      onStatus?.("SteamDB opened, but build history is not available yet. Sign in there for full history.");
    } else {
      onStatus?.("Waiting briefly for the SteamDB page…");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return [];
}
