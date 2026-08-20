import { fetchNoCors } from "@decky/api";

// Auto-capture a freshly generated Hubcap API key by reading it straight out of
// the gaming-mode browser's DOM over CDP — the same mechanism StorePatch uses to
// reach Steam's CEF tabs (localhost:8080/json + a Runtime.evaluate over the tab's
// debugger WebSocket).
//
// Hubcap auth is an httpOnly session cookie, so the key can't be fetched from the
// plugin's backend. But the generated key is rendered on the page in full
// (format `smm_` + 96 hex), so we just scrape it from the DOM the user's own
// logged-in session produced. No cookies, no copy-paste.

interface CdpTab {
  url: string;
  webSocketDebuggerUrl?: string;
}

const KEY_RE = /smm_[0-9a-f]{96}/;
// Expression evaluated in the Hubcap tab each poll. Mirrors the Ryuu flow so the
// key "just appears" after Discord auth instead of needing manual clicks:
//   1. if a key is already rendered, return it;
//   2. if not signed in, click the Discord login once (starts OAuth);
//   3. once signed in with no key visible, click the Regenerate/New-key control
//      once — the key renders a moment later and the next poll scrapes it.
// Every click is guarded by a window flag so it fires at most once. The manual
// path still works: if the auto-click misses the button, the user can click it
// and the scrape still catches the result. Matching is deliberately narrow
// ("regenerate"/"…key") so it can't hit an unrelated "Generate manifest" button.
const SCRAPE_EXPR = `(function(){try{
  var m=(document.body.innerText.match(/smm_[0-9a-f]{96}/)||[""])[0];
  if(m) return m;
  var q=function(s){return [].slice.call(document.querySelectorAll(s));};
  var txt=function(e){return (e.innerText||e.textContent||"").trim();};
  var href=function(e){return (e.getAttribute&&e.getAttribute("href"))||"";};
  var loggedIn=q("a,button").some(function(e){return /log ?out|sign ?out/i.test(txt(e))||/logout/i.test(href(e));});
  if(!loggedIn){
    var login=q("a,button").filter(function(e){return /log ?in|sign ?in|discord/i.test(txt(e))||/login|discord/i.test(href(e));})[0];
    if(login&&!window.__slsHubLogin){window.__slsHubLogin=1;login.click();}
    return "";
  }
  var gen=q("button,a").filter(function(e){return /regenerate|reset.*key|new.*key|create.*key/i.test(txt(e));})[0];
  if(gen&&!window.__slsHubGen){window.__slsHubGen=1;gen.click();}
  return "";
}catch(e){return "";}})()`;

/** Find a live CEF tab pointed at hubcapmanifest.com, if any. */
async function findHubcapTab(): Promise<CdpTab | null> {
  try {
    const res = await fetchNoCors("http://localhost:8080/json");
    const tabs: CdpTab[] = await res.json();
    return (
      tabs.find(
        (t) => t.url && t.url.includes("hubcapmanifest.com") && t.webSocketDebuggerUrl,
      ) || null
    );
  } catch {
    return null;
  }
}

/** One-shot Runtime.evaluate over a tab's CDP WebSocket; resolves the string
 *  result, or "" on error/timeout. */
function evalOnTab(wsUrl: string, expr: string, timeoutMs = 4000): Promise<string> {
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
        sock.send(
          JSON.stringify({
            id,
            method: "Runtime.evaluate",
            params: { expression: expr, returnByValue: true },
          }),
        );
      } catch {
        finish("");
      }
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (m && m.id === id) {
          const val = m?.result?.result?.value;
          finish(typeof val === "string" ? val : "");
        }
      } catch {
        /* ignore */
      }
    };
    sock.onerror = () => finish("");
    setTimeout(() => finish(""), timeoutMs);
  });
}

/**
 * Poll the Hubcap browser tab's DOM until a generated key appears (or timeout).
 * Resolves the `smm_…` key, or "" if not found in time.
 */
export async function captureHubcapKey(
  maxMs = 180000,
  onStatus?: (s: string) => void,
): Promise<string> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const tab = await findHubcapTab();
    if (tab && tab.webSocketDebuggerUrl) {
      const key = await evalOnTab(tab.webSocketDebuggerUrl, SCRAPE_EXPR);
      if (KEY_RE.test(key)) return key;
      onStatus?.("Generate a key on the page — I'll grab it automatically…");
    } else {
      onStatus?.("Waiting for the Hubcap page (log in with Discord)…");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return "";
}
