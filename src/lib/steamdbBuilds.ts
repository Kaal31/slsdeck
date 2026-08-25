import { fetchNoCors } from "@decky/api";

export interface BuildRow { buildid: string; date: string }
interface CdpTab { id?: string; url: string; title?: string; webSocketDebuggerUrl?: string; cdpPort?: number }

const _cache = new Map<number, BuildRow[]>();
let _cancelToken = 0;

export function cancelSteamdbBuildFetch(): void {
  _cancelToken++;
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

async function cdpCommand(
  wsUrl: string, method: string, params: Record<string, any> = {}, timeoutMs = 4000,
): Promise<any> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (value: any) => {
      if (done) return;
      done = true;
      try { sock.close(); } catch { /* */ }
      resolve(value);
    };
    try { sock = new WebSocket(wsUrl); } catch { resolve(null); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 92, method, params })); } catch { finish(null); }
    };
    sock.onmessage = (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (msg?.id === 92) finish(msg?.result ?? null);
      } catch { /* */ }
    };
    sock.onerror = () => finish(null);
    setTimeout(() => finish(null), timeoutMs);
  });
}

async function listCdpTabs(): Promise<CdpTab[]> {
  const candidates: CdpTab[] = [];
  await Promise.all([8080, 8081].map(async (port) => {
    try {
      const res = await fetchNoCors(`http://localhost:${port}/json`);
      const tabs: CdpTab[] = await res.json();
      tabs.filter((tab) => !!tab.webSocketDebuggerUrl).forEach((tab) => candidates.push({ ...tab, cdpPort: port }));
    } catch { /* port is optional */ }
  }));
  return candidates;
}

async function findSteamdbTab(appid: number): Promise<CdpTab | null> {
  const candidates = await listCdpTabs();
  for (const tab of candidates) {
    const listed = tab.url || "";
    const live = await evalString(tab.webSocketDebuggerUrl!, "String(location.href||'')");
    const href = live || listed;
    if (href.includes(`steamdb.info/app/${appid}/patchnotes`)) return { ...tab, url: href };
  }
  return null;
}

async function findSharedJsContext(): Promise<CdpTab | null> {
  const tabs = await listCdpTabs();
  return tabs.find((tab) => String(tab.title || "") === "SharedJSContext")
    || tabs.find((tab) => /SharedJSContext/i.test(String(tab.title || "")))
    || null;
}

async function waitForExactUrl(url: string, timeoutMs = 6500): Promise<CdpTab | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const tab = (await listCdpTabs()).find((item) => String(item.url || "") === url);
    if (tab?.webSocketDebuggerUrl) return tab;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

/** Create an off-screen Steam BrowserView so opening SteamDB never replaces the
 *  game page (which would unmount GameTools and discard its pending picker). */
async function createHiddenSteamdbTab(appid: number): Promise<CdpTab | null> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return null;
  const placeholder = `data:text/plain,slsdeck_steamdb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const created = await evalString(shared.webSocketDebuggerUrl, `(function(){try{
    if(window.SLSDECK_STEAMDB_VIEW!==undefined){
      try{window.SLSDECK_STEAMDB_VIEW.Destroy();}catch(e){}
      window.SLSDECK_STEAMDB_VIEW=undefined;
    }
    var main=window.DFL&&window.DFL.Router&&window.DFL.Router.WindowStore&&window.DFL.Router.WindowStore.GamepadUIMainWindowInstance;
    if(!main||typeof main.CreateBrowserView!=='function')return 'unavailable';
    var view=main.CreateBrowserView('slsdeck_steamdb_builds');
    window.SLSDECK_STEAMDB_VIEW=view;
    try{view.WIDTH=1280;view.HEIGHT=720;view.m_browserView.SetBounds(-10000,-10000,1280,720);view.m_browserView.SetVisible(true);}catch(e){}
    view.m_browserView.LoadURL(${JSON.stringify(placeholder)});
    return 'ok';
  }catch(e){return String(e);}})()`, 4000);
  if (created !== "ok") return null;
  const tab = await waitForExactUrl(placeholder);
  if (!tab?.webSocketDebuggerUrl) {
    await destroyHiddenSteamdbTab();
    return null;
  }
  await cdpCommand(tab.webSocketDebuggerUrl, "Page.setWebLifecycleState", { state: "active" }, 2000);
  const nav = await cdpCommand(tab.webSocketDebuggerUrl, "Page.navigate", {
    url: `https://steamdb.info/app/${appid}/patchnotes/`, transitionType: "address_bar",
  }, 4000);
  if (!nav) {
    await destroyHiddenSteamdbTab();
    return null;
  }
  return tab;
}

async function destroyHiddenSteamdbTab(): Promise<void> {
  const shared = await findSharedJsContext();
  if (!shared?.webSocketDebuggerUrl) return;
  await evalString(shared.webSocketDebuggerUrl, `(function(){try{
    var view=window.SLSDECK_STEAMDB_VIEW;
    if(!view)return 'none';
    try{view.Destroy();}catch(e){}
    window.SLSDECK_STEAMDB_VIEW=undefined;
    return 'ok';
  }catch(e){return String(e);}})()`, 3000);
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
  if (!tab) {
    onStatus?.("Loading SteamDB build history in the background…");
    tab = await createHiddenSteamdbTab(appid);
    if (!tab) return [];
  }
  const deadline = Date.now() + 12000;
  try {
    while (Date.now() < deadline && token === _cancelToken) {
      tab = await findSteamdbTab(appid);
      if (tab?.webSocketDebuggerUrl) {
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
      await destroyHiddenSteamdbTab();
    }
  }
}
