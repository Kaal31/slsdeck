import { fetchNoCors } from "@decky/api";
import { Navigation } from "@decky/ui";

// SteamDB depot-manifest capture. After choosing a historical BuildID we need
// the ManifestID for every depot. Steam/SteamOS may expose browser targets on
// 8080 or 8081 and BrowserView metadata is not always the live URL, so discovery
// probes both and verifies location.href over CDP.

interface CdpTab { id?: string; url?: string; webSocketDebuggerUrl?: string; _port?: number }
export interface ScrapedGid { gid: string; date: string }
export type SteamdbScrapeCancelled = () => boolean;

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

function evalOnTab(wsUrl: string, expr: string, timeoutMs = 6000): Promise<any> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: any) => { if (done) return; done = true; try { sock.close(); } catch { /* */ } resolve(v); };
    try { sock = new WebSocket(wsUrl); } catch { resolve(undefined); return; }
    sock.onopen = () => {
      try { sock.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } })); }
      catch { finish(undefined); }
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m?.id === 1) finish(m?.result?.result?.value);
      } catch { /* */ }
    };
    sock.onerror = () => finish(undefined);
    setTimeout(() => finish(undefined), timeoutMs);
  });
}

async function liveHref(t: CdpTab): Promise<string> {
  if (!t.webSocketDebuggerUrl) return "";
  const href = await evalOnTab(t.webSocketDebuggerUrl, "location.href", 1800);
  return typeof href === "string" ? href : "";
}

async function findAnySteamdbTab(): Promise<CdpTab | null> {
  const tabs = await listTargets();
  const direct = tabs.find((t) => (t.url || "").includes("steamdb.info"));
  if (direct) return direct;
  for (const t of tabs) {
    const href = await liveHref(t);
    if (href.includes("steamdb.info")) return { ...t, url: href };
  }
  return null;
}

async function findDepotTab(depot: string | number): Promise<CdpTab | null> {
  const needle = `/depot/${depot}`;
  const tabs = await listTargets();
  const direct = tabs.find((t) => (t.url || "").includes("steamdb.info") && (t.url || "").includes(needle));
  if (direct) return direct;
  for (const t of tabs) {
    const href = await liveHref(t);
    if (href.includes("steamdb.info") && href.includes(needle)) return { ...t, url: href };
  }
  return null;
}

async function navigateExistingSteamdbTab(tab: CdpTab, url: string): Promise<boolean> {
  if (!tab.webSocketDebuggerUrl) return false;
  const expr = `(()=>{try{location.href=${JSON.stringify(url)};return true}catch(e){return false}})()`;
  return (await evalOnTab(tab.webSocketDebuggerUrl, expr, 3000)) === true;
}

// Layout-tolerant parser. It targets semantic table content, not SteamDB CSS or
// viewport-specific classes, so it works with Deck and desktop/Steam Machine UI.
const SCRAPE_EXPR = `(()=>{try{
  const out=[], seen=new Set();
  const normDate=(raw)=>{raw=String(raw||'').trim();if(!raw)return '';let m=raw.match(/(20\\d{2})[-\\/.](\\d{1,2})[-\\/.](\\d{1,2})/);if(m)return m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0');try{const d=new Date(raw);if(!isNaN(d.getTime()))return d.toISOString().slice(0,10)}catch(e){}return ''};
  const add=(gid,date)=>{gid=String(gid||'').trim();if(!/^\\d{12,}$/.test(gid)||seen.has(gid))return;seen.add(gid);out.push({gid,date:normDate(date)})};
  const tables=Array.from(document.querySelectorAll('table'));
  let chosen=[];
  for(const table of tables){
    const heads=Array.from(table.querySelectorAll('th')).map(x=>(x.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase());
    if(heads.some(h=>/manifest\\s*id|manifestid/.test(h)) || heads.some(h=>/seen\\s*date|first\\s*seen|last\\s*seen/.test(h))) chosen.push(table);
  }
  if(!chosen.length) chosen=tables;
  for(const table of chosen){
    for(const tr of Array.from(table.querySelectorAll('tr'))){
      let gid=''; let date=''; const cells=Array.from(tr.querySelectorAll('td'));
      for(const td of cells){
        const txt=(td.textContent||'').replace(/\\s+/g,' ').trim();
        if(!gid){const exact=txt.match(/^\\d{12,}$/);if(exact)gid=exact[0];else{const a=td.querySelector('a[href]');const h=a&&a.getAttribute('href')||'';const hm=h.match(/(?:manifest|manifests)[^0-9]*(\\d{12,})/i);if(hm)gid=hm[1];}}
        if(!date){const tm=td.querySelector('time');const cand=(tm&&((tm.getAttribute('datetime')||tm.getAttribute('title')||tm.textContent)))||td.getAttribute('data-sort')||td.getAttribute('title')||txt;const nd=normDate(cand);if(nd)date=nd;}
      }
      if(!gid){const text=(tr.textContent||'').replace(/\\s+/g,' ').trim();const nums=text.match(/\\b\\d{12,}\\b/g);if(nums&&nums.length)gid=nums[nums.length-1];}
      add(gid,date);
    }
  }
  return out;
}catch(e){return []}})()`;

export async function scrapeDepotManifests(
  depot: string | number,
  maxMs = 30000,
  onStatus?: (s: string) => void,
  isCancelled?: SteamdbScrapeCancelled,
): Promise<ScrapedGid[]> {
  if (isCancelled?.()) return [];
  const targetUrl = `https://steamdb.info/depot/${depot}/manifests/`;

  // Prefer reusing the SteamDB tab opened by the build-history step. Navigating
  // it through CDP avoids NavigateToExternalWeb, which can unmount GameTools and
  // was falsely interpreted as user cancellation on Steam Machine/SteamOS.
  let existing = await findAnySteamdbTab();
  if (existing?.webSocketDebuggerUrl) {
    onStatus?.(`Opening SteamDB depot ${depot} in the existing SteamDB tab…`);
    await navigateExistingSteamdbTab(existing, targetUrl);
  } else {
    try { Navigation.NavigateToExternalWeb(targetUrl); } catch { /* */ }
  }

  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const tab = await findDepotTab(depot);
    if (tab?.webSocketDebuggerUrl) {
      onStatus?.(`Reading SteamDB manifest history for depot ${depot}…`);
      const value = await evalOnTab(tab.webSocketDebuggerUrl, SCRAPE_EXPR, 7000);
      if (Array.isArray(value)) {
        const rows = value
          .filter((r: any) => r && /^\d{12,}$/.test(String(r.gid || "")))
          .map((r: any) => ({ gid: String(r.gid), date: String(r.date || "") }));
        if (rows.length) return rows;
      }
      onStatus?.(`SteamDB depot ${depot} is visible, but no manifest rows were parsed yet…`);
    } else {
      onStatus?.(`Waiting for SteamDB depot ${depot}…`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return [];
}
