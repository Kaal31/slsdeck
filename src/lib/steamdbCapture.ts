import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

// Scrape a depot's full manifest history from SteamDB's signed-in page, using the
// same CEF-debugger transport as the Hubcap/Ryuu key capture (localhost:8080/json
// + Runtime.evaluate over the tab's WebSocket). SteamDB renders the "Previously
// seen manifests" table (Seen Date · ManifestID) into the DOM; anonymously only
// the most recent rows show, the full history needs a one-time SteamDB sign-in.
//
// This is the authoritative gid list (the archive is only what people uploaded),
// so it's the PRIMARY source for the per-depot picker with the archive as
// fallback. Kept user-triggered + one depot at a time to be gentle on SteamDB.

interface CdpTab { id?: string; url: string; webSocketDebuggerUrl?: string; cdpPort?: number }
export interface ScrapedGid { gid: string; date: string }
export type SteamdbScrapeCancelled = () => boolean;

/** Close a CEF tab by its target id (so we don't leave a SteamDB page open per
 *  depot). Best-effort over the same debugger endpoint we list tabs from. */
async function closeTab(id?: string, port = 8080): Promise<void> {
  if (!id) return;
  try { await fetchNoCors(`http://localhost:${port}/json/close/` + id); } catch { /* */ }
}

// Table has headers Seen Date / Relative Date / ManifestID. Pull gid (19-ish
// digits) + normalise the date to YYYY-MM-DD so the backend can build-label it.
const SCRAPE_EXPR = `(function(){try{
  var tables=[].slice.call(document.querySelectorAll('table'));
  var mt=null;
  for(var i=0;i<tables.length;i++){
    var hs=[].slice.call(tables[i].querySelectorAll('th')).map(function(x){return (x.textContent||'').trim().toLowerCase();});
    if(hs.indexOf('manifestid')>=0 || hs.some(function(h){return /manifest\\s*id/.test(h);})){ mt=tables[i]; break; }
  }
  if(!mt) return '';
  var out=[];
  [].slice.call(mt.querySelectorAll('tbody tr')).forEach(function(tr){
    var tds=[].slice.call(tr.querySelectorAll('td')).map(function(td){return (td.textContent||'').trim();});
    var gid=''; var date='';
    tds.forEach(function(c){
      if(/^\\d{15,}$/.test(c)) gid=c;
      else if(!date && /\\d{4}/.test(c) && /UTC|[A-Za-z]{3,}/.test(c)){
        try{ var dd=new Date(c.replace(/[\\u2013\\u2014-].*$/,'').trim()); if(!isNaN(dd.getTime())) date=dd.toISOString().slice(0,10); }catch(e){}
      }
    });
    if(gid) out.push({gid:gid,date:date});
  });
  return JSON.stringify(out);
}catch(e){return '';}})()`;

async function findTab(urlPart: string): Promise<CdpTab | null> {
  const candidates: CdpTab[] = [];
  await Promise.all([8080, 8081].map(async (port) => {
    try {
      const res = await fetchNoCors(`http://localhost:${port}/json`);
      const tabs: CdpTab[] = await res.json();
      tabs.filter((tab) => !!tab.webSocketDebuggerUrl).forEach((tab) => candidates.push({ ...tab, cdpPort: port }));
    } catch { /* port is optional */ }
  }));
  for (const tab of candidates) {
    const live = await evalOnTab(tab.webSocketDebuggerUrl!, "String(location.href||'')", 2500);
    if ((live || tab.url || "").includes(urlPart)) return { ...tab, url: live || tab.url };
  }
  return null;
}

function evalOnTab(wsUrl: string, expr: string, timeoutMs = 6000): Promise<string> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: string) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(""); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } })); }
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

/** Open a depot's SteamDB manifests page and scrape its gid history. Returns []
 *  if the page never yields a table in time (e.g. not signed in / blocked).
 *  `isCancelled` lets the caller stop the work immediately when its UI closes. */
export async function scrapeDepotManifests(
  depot: string | number,
  maxMs = 25000,
  onStatus?: (s: string) => void,
  isCancelled?: SteamdbScrapeCancelled,
): Promise<ScrapedGid[]> {
  if (isCancelled?.()) return [];
  const urlPart = `steamdb.info/depot/${depot}`;
  try { Navigation.NavigateToExternalWeb(`https://${urlPart}/manifests/`); } catch { /* */ }
  const deadline = Date.now() + maxMs;
  let lastId: string | undefined;
  let lastPort = 8080;
  try {
    while (Date.now() < deadline) {
      if (isCancelled?.()) return [];
      const tab = await findTab(urlPart);
      if (isCancelled?.()) return [];
      if (tab?.webSocketDebuggerUrl) {
        lastId = tab.id;
        lastPort = tab.cdpPort || 8080;
        const raw = await evalOnTab(tab.webSocketDebuggerUrl, SCRAPE_EXPR);
        if (isCancelled?.()) return [];
        if (raw) {
          try {
            const arr = JSON.parse(raw) as ScrapedGid[];
            if (Array.isArray(arr) && arr.length) return arr;
          } catch { /* */ }
        }
        onStatus?.("Reading SteamDB — sign in there for full history…");
      } else {
        onStatus?.(`Opening SteamDB depot ${depot}…`);
      }
      for (let waited = 0; waited < 1500; waited += 100) {
        if (isCancelled?.()) return [];
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    return [];
  } finally {
    // Always close the depot page we opened — success, timeout, or cancellation —
    // so a multi-depot game doesn't leave a stack of SteamDB tabs behind.
    await closeTab(lastId, lastPort);
  }
}
