import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

export interface BuildRow { buildid: string; date: string }
interface CdpTab { id?: string; url: string; webSocketDebuggerUrl?: string; cdpPort?: number }

const _cache = new Map<number, BuildRow[]>();
let _cancelToken = 0;

export function cancelSteamdbBuildFetch(): void {
  _cancelToken++;
}

/** Close only a SteamDB tab opened by this build-history request. Without this,
 *  the picker is mounted after NavigateToExternalWeb has replaced the visible
 *  game page, leaving the modal hidden behind SteamDB. */
async function closeTab(id?: string, port = 8080): Promise<void> {
  if (!id) return;
  try { await fetchNoCors(`http://localhost:${port}/json/close/` + id); } catch { /* best effort */ }
}

async function evalString(wsUrl: string, expression: string, timeoutMs = 2500): Promise<string> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (value: string) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(value); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(""); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 91, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); }
      catch { finish(""); }
    };
    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (msg?.id === 91) finish(typeof msg?.result?.result?.value === "string" ? msg.result.result.value : "");
      } catch { /* */ }
    };
    sock.onerror = () => finish("");
    setTimeout(() => finish(""), timeoutMs);
  });
}

async function findSteamdbTab(appid: number): Promise<CdpTab | null> {
  const candidates: CdpTab[] = [];
  await Promise.all([8080, 8081].map(async (port) => {
    try {
      const res = await fetchNoCors(`http://localhost:${port}/json`);
      const tabs: CdpTab[] = await res.json();
      tabs.filter((tab) => !!tab.webSocketDebuggerUrl).forEach((tab) => candidates.push({ ...tab, cdpPort: port }));
    } catch { /* port is optional */ }
  }));
  for (const tab of candidates) {
    const listed = tab.url || "";
    const live = await evalString(tab.webSocketDebuggerUrl!, "String(location.href||'')");
    const href = live || listed;
    if (href.includes(`steamdb.info/app/${appid}/patchnotes`)) return { ...tab, url: href };
  }
  return null;
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

const DOM_BUILD_EXPR = `(function(){try{
  var seen={};var out=[];
  [].slice.call(document.querySelectorAll('a[href*="/patchnotes/"]')).forEach(function(a){
    var m=String(a.getAttribute('href')||a.href||'').match(/\\/patchnotes\\/(\\d+)/);if(!m||seen[m[1]])return;
    var host=a.closest('tr,article,li,div');var time=host&&host.querySelector&&host.querySelector('time');var raw=time?(time.getAttribute('datetime')||time.textContent||''):(host?host.textContent||'':'');
    var date='';try{var d=new Date(raw);if(!isNaN(d.getTime()))date=d.toISOString().slice(0,10);}catch(e){}
    seen[m[1]]=1;out.push({buildid:m[1],date:date});
  });
  return JSON.stringify(out);
}catch(e){return '';}})()`;

async function readBuildsFromDom(wsUrl: string): Promise<BuildRow[]> {
  const raw = await evalString(wsUrl, DOM_BUILD_EXPR, 5000);
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as BuildRow[];
    return Array.isArray(rows) ? rows.filter((row) => /^\d+$/.test(row.buildid)) : [];
  } catch { return []; }
}

export async function fetchSteamdbBuilds(
  appid: number, onStatus?: (s: string) => void,
): Promise<BuildRow[]> {
  if (_cache.has(appid)) return _cache.get(appid)!;
  const token = _cancelToken;
  let tab = await findSteamdbTab(appid);
  const openedHere = !tab;
  let openedTabId: string | undefined;
  let openedTabPort = 8080;
  if (!tab) {
    onStatus?.("Opening SteamDB once for build history…");
    try { Navigation.NavigateToExternalWeb(`https://steamdb.info/app/${appid}/patchnotes/`); } catch { /* */ }
  }
  const deadline = Date.now() + 12000;
  try {
    while (Date.now() < deadline && token === _cancelToken) {
      tab = await findSteamdbTab(appid);
      if (tab?.webSocketDebuggerUrl) {
        if (openedHere) {
          openedTabId = tab.id;
          openedTabPort = tab.cdpPort || 8080;
        }
        onStatus?.("Reading SteamDB build history…");
        const xml = await fetchRssInTab(tab.webSocketDebuggerUrl, appid);
        if (token !== _cancelToken) return [];
        if (xml && xml.includes("<item>")) {
          const rows = parseRss(xml);
          if (rows.length) { _cache.set(appid, rows); return rows; }
        }
        const visibleRows = await readBuildsFromDom(tab.webSocketDebuggerUrl);
        if (visibleRows.length) { _cache.set(appid, visibleRows); return visibleRows; }
        onStatus?.("SteamDB opened, but no public build rows are rendered yet…");
      } else {
        onStatus?.("Waiting briefly for the SteamDB page…");
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    return [];
  } finally {
    if (openedHere) {
      await closeTab(openedTabId, openedTabPort);
      // Give Steam's browser stack one frame to reveal the game/QAM surface
      // before GameTools mounts the picker modal.
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}
