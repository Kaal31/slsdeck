import { fetchNoCors } from "@decky/api";

// Generic API-key capture over the gaming-mode CEF debugger — the same transport
// Hubcap/StorePatch use (localhost:8080/json to list tabs, then Runtime.evaluate
// over a tab's debugger WebSocket). Two flavours:
//   * DOM scrape  — read a key that's rendered on the page (Steam Web API key).
//   * Network hook — inject a fetch/XHR wrapper that captures the key from any
//     JSON response body, optionally clicking a button (Ryuu "Reset") to force a
//     fresh key, with a DOM fallback. Used for Ryuu, whose key has no expiry so
//     regenerating on capture is harmless.

interface CdpTab {
  url: string;
  webSocketDebuggerUrl?: string;
}

async function findTab(domain: string): Promise<CdpTab | null> {
  try {
    const res = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await res.json();
    return tabs.find((t) => t.url && t.url.includes(domain) && t.webSocketDebuggerUrl) || null;
  } catch {
    return null;
  }
}

/** One-shot Runtime.evaluate over a tab's CDP WebSocket; resolves the string
 *  result, or "" on error/timeout. */
function evalOnTab(wsUrl: string, expr: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve) => {
    let done = false;
    let sock: WebSocket;
    const finish = (v: string) => {
      if (done) return;
      done = true;
      try { sock.close(); } catch { /* ignore */ }
      resolve(v);
    };
    try {
      sock = new WebSocket(wsUrl);
    } catch {
      resolve("");
      return;
    }
    const id = 1;
    sock.onopen = () => {
      try {
        sock.send(JSON.stringify({
          id, method: "Runtime.evaluate",
          params: { expression: expr, returnByValue: true, awaitPromise: true },
        }));
      } catch { finish(""); }
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m && m.id === id) {
          const val = m?.result?.result?.value;
          finish(typeof val === "string" ? val : "");
        }
      } catch { /* ignore */ }
    };
    sock.onerror = () => finish("");
    setTimeout(() => finish(""), timeoutMs);
  });
}

async function pollTab(
  domain: string, expr: string, valid: (k: string) => boolean,
  maxMs: number, onStatus?: (s: string) => void,
): Promise<string> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const tab = await findTab(domain);
    if (tab && tab.webSocketDebuggerUrl) {
      const key = await evalOnTab(tab.webSocketDebuggerUrl, expr);
      if (valid(key)) return key;
      onStatus?.("Working on the page — sign in if asked…");
    } else {
      onStatus?.(`Waiting for the ${domain} page…`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return "";
}

// ── Ryuu ──────────────────────────────────────────────────────────────────────
// Idempotent per-poll expression. Installs a fetch/XHR interceptor that grabs an
// auth_key-shaped field out of ANY response body (so we don't depend on the exact
// JSON shape). If a key was already produced by the first-login auto-generation,
// returns it immediately. Otherwise triggers Ryuu's OAuth login if needed, then
// clicks "Reset" once to regenerate — the interceptor catches that response, and
// a DOM read of the displayed key backs it up.
const RYUU_KEY_RE = /^[A-Za-z0-9]{12,40}$/;
// Verified live: POST /api/refresh_my_auth_key (session-cookie auth) returns
// {"auth_key":"<16 alnum>","success":true}. So rather than click the page's Reset
// button and try to intercept its pre-bound fetch (which a post-load override
// can't see), we make the authenticated request ourselves from the page context
// and read the key straight out of the JSON response — deterministic network
// capture. Only fires when a session exists (a "Log out" control is present);
// otherwise it clicks Log in to start Ryuu's Discord OAuth. Each success rotates
// the key by design, which is the intended "reset to regenerate" behaviour.
const RYUU_EXPR = `(async function(){try{
  var q=function(s){return [].slice.call(document.querySelectorAll(s));};
  var txt=function(e){return (e.innerText||e.textContent||"").trim();};
  var href=function(e){return (e.getAttribute&&e.getAttribute("href"))||"";};
  var loggedIn=q("a,button").some(function(e){return /log ?out|sign ?out/i.test(txt(e))||/\\/logout/i.test(href(e));});
  if(!loggedIn){
    var login=q("a,button").filter(function(e){return /log ?in|sign ?in/i.test(txt(e))||/\\/login/i.test(href(e));})[0];
    if(login&&!window.__slsRyuuLogin){window.__slsRyuuLogin=1;login.click();}
    return "";
  }
  var r=await fetch("/api/refresh_my_auth_key",{method:"POST",headers:{"Accept":"application/json"},credentials:"include"});
  if(r.status===200){var j=await r.json().catch(function(){return null;});if(j&&j.auth_key)return String(j.auth_key);}
  return "";
}catch(e){return "";}})()`;

export async function captureRyuuKey(maxMs = 180000, onStatus?: (s: string) => void): Promise<string> {
  return pollTab("generator.ryuu.lol", RYUU_EXPR, (k) => RYUU_KEY_RE.test(k), maxMs, onStatus);
}

// ── Steam Web API key ─────────────────────────────────────────────────────────
// steamcommunity.com/dev/apikey renders the key in full (32 hex) once registered.
const STEAM_KEY_RE = /^[0-9A-Fa-f]{32}$/;
const STEAM_EXPR = `(function(){try{
  var t=document.body.innerText||"";
  var m=t.match(/Key:\\\\s*([0-9A-Fa-f]{32})/)||t.match(/\\\\b([0-9A-Fa-f]{32})\\\\b/);
  return m?m[1]:"";
}catch(e){return "";}})()`;

export async function captureSteamKey(maxMs = 180000, onStatus?: (s: string) => void): Promise<string> {
  return pollTab("steamcommunity.com/dev/apikey", STEAM_EXPR, (k) => STEAM_KEY_RE.test(k), maxMs, onStatus);
}
