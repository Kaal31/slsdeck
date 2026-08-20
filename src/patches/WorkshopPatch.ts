import { fetchNoCors } from "@decky/api";
import { findModuleExport } from "@decky/ui";
import { wsResolve, wsDownload, wsDownloadState } from "../api";

/**
 * Steam Workshop item-page injection.
 *
 * When a workshop item page is open in the in-client CEF browser
 * (steamcommunity.com/sharedfiles/filedetails/?id=… or /workshop/filedetails/…),
 * we attach to that tab's CDP WebSocket — exactly like StorePatch does for the
 * store — and inject a single floating "⬇ Download with SLSDeck" button. Clicking
 * it resolves the item's owning game and, if that game is SLSDeck-added (or a
 * non-Steam shortcut) and installed, downloads the mod straight into the game's
 * workshop folder via the Python backend. The button reports progress in place.
 *
 * A separate CDP socket from StorePatch: the store lives on
 * store.steampowered.com, workshop items on steamcommunity.com — different tabs.
 */

interface Tab {
  url: string;
  webSocketDebuggerUrl: string;
}

const HistoryModule: any = findModuleExport((e: any) => e?.m_history !== undefined);
const History: any = HistoryModule?.m_history;

let mounted = false;
let ws: WebSocket | null = null;
let msgId = 1;
let currentModId = "";
let wsReady = false;
let isConnecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let bgTimer: ReturnType<typeof setInterval> | null = null;
let histUnlisten: (() => void) | null = null;

const WORKSHOP_RE = /(?:sharedfiles|workshop)\/filedetails\/.*?[?&]id=(\d+)/;

function isWorkshopUrl(url: string): boolean {
  return !!url && WORKSHOP_RE.test(url);
}

function extractModId(url: string): string {
  const m = (url || "").match(WORKSHOP_RE);
  return m ? m[1] : "";
}

function cdp(method: string, params?: any): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify({ id: msgId++, method, params: params || {} }));
  } catch {
    /* ignore */
  }
}

function evaluate(expr: string): void {
  cdp("Runtime.evaluate", { expression: expr });
}

// Steam-native styling for the injected workshop button (matches StorePatch).
const STEAM_WS_CSS = `
#lt-ws-wrap{font-family:"Motiva Sans",Arial,sans-serif;}
#lt-ws-btn{appearance:none;-webkit-appearance:none;border:none;cursor:pointer;color:#fff;font-family:"Motiva Sans",Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.3px;padding:11px 18px;border-radius:2px;background:linear-gradient(to bottom,#8bc53f,#5a8f1e);box-shadow:0 2px 8px rgba(0,0,0,.4);transition:filter .12s ease-out,box-shadow .12s ease-out,transform .06s ease-out;}
#lt-ws-btn:hover{filter:brightness(1.13);}
#lt-ws-btn:active{filter:brightness(.9);transform:translateY(1px);}
#lt-ws-btn:focus{outline:none;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 12px 2px rgba(103,193,245,.75);}
#lt-ws-btn:disabled{opacity:.55;cursor:default;filter:none;}
#lt-ws-status{font-family:"Motiva Sans",Arial,sans-serif;background:linear-gradient(to bottom,rgba(42,71,94,.94),rgba(23,33,43,.95));color:#c7d5e0;padding:6px 12px;border-radius:2px;font-size:12px;max-width:280px;box-shadow:inset 0 0 0 1px rgba(103,193,245,.15);}
`;

/** Floating button + status line, injected into the workshop page's JS world. */
function buildButton(modid: string): string {
  return `(function(){
    try{
      var OLD=document.getElementById('lt-ws-wrap'); if(OLD) OLD.remove();
      if(!document.getElementById('lt-ws-style')){var stl=document.createElement('style');stl.id='lt-ws-style';stl.textContent=${JSON.stringify(STEAM_WS_CSS)};document.head.appendChild(stl);}
      var wrap=document.createElement('div'); wrap.id='lt-ws-wrap';
      wrap.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;flex-direction:column;align-items:flex-end;gap:8px;';
      var status=document.createElement('div'); status.id='lt-ws-status';
      status.style.cssText='display:none;';
      var btn=document.createElement('button'); btn.id='lt-ws-btn'; btn.textContent='⬇ Download with SLSDeck';
      btn.onclick=function(){
        try{ btn.disabled=true; status.style.display='block'; status.textContent='Resolving…';
          window.ltWsInvoke(JSON.stringify({action:'download',modid:${JSON.stringify(modid)}}));
        }catch(e){}
      };
      wrap.appendChild(status); wrap.appendChild(btn); document.body.appendChild(wrap);
    }catch(e){}
  })();`;
}

function setStatus(text: string, done?: boolean, failed?: boolean): string {
  const color = failed ? "#f5a623" : done ? "#58c578" : "#c7d5e0";
  return `(function(){try{
    var s=document.getElementById('lt-ws-status'); var b=document.getElementById('lt-ws-btn');
    if(s){s.style.display='block';s.style.color=${JSON.stringify(color)};s.textContent=${JSON.stringify(text)};}
    if(b && ${done || failed ? "true" : "false"}){b.disabled=false;b.style.opacity='1';}
  }catch(e){}})();`;
}

function removeButton(): void {
  evaluate(`(function(){try{var w=document.getElementById('lt-ws-wrap');if(w)w.remove();}catch(e){}})();`);
}

function injectFor(modid: string): void {
  if (!modid) {
    removeButton();
    return;
  }
  evaluate(buildButton(modid));
}

/** Handle a button click bridged back from the page's JS world. */
async function onAction(payloadStr: string): Promise<void> {
  let msg: any;
  try {
    msg = JSON.parse(payloadStr);
  } catch {
    return;
  }
  if (msg?.action !== "download") return;
  const modid = String(msg?.modid || "");
  if (!modid) return;

  try {
    const info = await wsResolve(modid);
    if (!info.success) {
      evaluate(setStatus(info.error || "Could not resolve this item", false, true));
      return;
    }
    if (!info.allowed) {
      evaluate(
        setStatus(
          `${info.title || "This game"} is a game you own — SLSDeck only mods SLSDeck-added or non-Steam games.`,
          false,
          true
        )
      );
      return;
    }
    if (!info.installed) {
      evaluate(setStatus(`Install ${info.title || "the game"} first, then retry.`, false, true));
      return;
    }
    const label = info.isCollection ? `collection (${info.children?.length || 0} items)` : "mod";
    evaluate(setStatus(`Downloading ${label}…`));

    const dl = await wsDownload(modid);
    if (!dl.success) {
      const why =
        dl.error === "owned_game"
          ? "That game is owned — not eligible."
          : dl.error === "not_installed"
          ? "Install the game first."
          : dl.error || "Download failed.";
      evaluate(setStatus(why, false, true));
      return;
    }
    const job = dl.job || modid;
    pollJob(job);
  } catch (e) {
    evaluate(setStatus("Error: " + String(e), false, true));
  }
}

let jobTimer: ReturnType<typeof setInterval> | null = null;

function pollJob(job: string): void {
  if (jobTimer) clearInterval(jobTimer);
  jobTimer = setInterval(async () => {
    try {
      const r = await wsDownloadState(job);
      const s = r.state || {};
      if (s.status === "done") {
        clearInterval(jobTimer!);
        jobTimer = null;
        evaluate(setStatus(`Installed ${s.done}/${s.total} item(s) ✓`, true));
      } else if (s.status === "failed") {
        clearInterval(jobTimer!);
        jobTimer = null;
        const failed = (s.failed || []).length;
        evaluate(setStatus(`Done — ${s.done}/${s.total} ok, ${failed} failed`, false, true));
      } else {
        const cur = s.current ? ` (item ${s.current})` : "";
        evaluate(setStatus(`${s.status || "working"} ${s.done || 0}/${s.total || 0}${cur}`));
      }
    } catch {
      /* ignore */
    }
  }, 1500);
}

// ── CDP connection to the workshop tab ──────────────────────────────────────
function scheduleReconnect(ms = 1000): void {
  if (!mounted || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (mounted && (!ws || ws.readyState === WebSocket.CLOSED)) connect();
  }, ms);
}

function updateFromUrl(url: string): void {
  const id = extractModId(url);
  if (!id) {
    if (currentModId) {
      currentModId = "";
      removeButton();
    }
    return;
  }
  currentModId = id;
  if (wsReady) injectFor(id);
}

async function connect(): Promise<void> {
  if (!mounted || isConnecting) return;
  isConnecting = true;
  setTimeout(() => {
    isConnecting = false;
  }, 5000);
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    isConnecting = false;
    return;
  }
  try {
    const res = await fetchNoCors("http://localhost:8080/json");
    const tabs: Tab[] = await res.json();
    const tab = tabs.find((t) => t.url && isWorkshopUrl(t.url));
    if (!tab || !tab.webSocketDebuggerUrl) {
      isConnecting = false;
      scheduleReconnect(1000);
      return;
    }
    currentModId = extractModId(tab.url);
    const sock = new WebSocket(tab.webSocketDebuggerUrl);
    ws = sock;
    let pendingUrlId: number | null = null;
    sock.onopen = () => {
      isConnecting = false;
      if (ws !== sock) {
        sock.close();
        return;
      }
      cdp("Page.enable");
      cdp("Runtime.enable");
      cdp("Runtime.addBinding", { name: "ltWsInvoke" });
      const uid = msgId++;
      pendingUrlId = uid;
      try {
        sock.send(
          JSON.stringify({ id: uid, method: "Runtime.evaluate", params: { expression: "window.location.href" } })
        );
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        if (ws !== sock) return;
        wsReady = true;
        if (currentModId) injectFor(currentModId);
      }, 300);
    };
    sock.onmessage = (ev) => {
      if (ws !== sock) return;
      let d: any;
      try {
        d = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (pendingUrlId !== null && d.id === pendingUrlId) {
        pendingUrlId = null;
        const u = d.result?.result?.value;
        if (typeof u === "string") updateFromUrl(u);
        return;
      }
      if (d.method === "Runtime.bindingCalled" && d.params?.name === "ltWsInvoke") {
        onAction(String(d.params.payload || ""));
      } else if (d.method === "Page.frameNavigated" && d.params?.frame?.url) {
        setTimeout(() => updateFromUrl(d.params.frame.url), 500);
      } else if (d.method === "Page.navigatedWithinDocument" && d.params?.frame?.url) {
        setTimeout(() => updateFromUrl(d.params.frame.url), 500);
      } else if (d.method === "Page.loadEventFired") {
        if (currentModId && wsReady) setTimeout(() => injectFor(currentModId), 300);
      }
    };
    sock.onerror = () => {
      isConnecting = false;
      scheduleReconnect(1000);
    };
    sock.onclose = () => {
      if (ws === sock) {
        ws = null;
        wsReady = false;
      }
      scheduleReconnect(1000);
    };
  } catch {
    isConnecting = false;
    scheduleReconnect(1000);
  }
}

export function initWorkshopPatch(): () => void {
  mounted = true;
  if (History) {
    try {
      histUnlisten = History.listen(() => connect());
    } catch {
      /* ignore */
    }
  }
  connect();
  bgTimer = setInterval(() => {
    if (!ws || ws.readyState === WebSocket.CLOSED) connect();
  }, 500);

  return () => {
    mounted = false;
    if (bgTimer) {
      clearInterval(bgTimer);
      bgTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (jobTimer) {
      clearInterval(jobTimer);
      jobTimer = null;
    }
    if (histUnlisten) {
      histUnlisten();
      histUnlisten = null;
    }
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
      wsReady = false;
    }
  };
}
