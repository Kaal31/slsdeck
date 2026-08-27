import { fetchNoCors } from "@decky/api";
import { findModuleExport } from "@decky/ui";
import {
  applyFix,
  deleteLua,
  getAddStatus,
  getFixStatus,
  getGameInstallPath,
  getStoreDisabled,
  getUnfixStatus,
  hasLua,
  reloadSteam,
  startAdd,
  unfix,
  getBadgeOptions,
  getInstalledFixes,
  denuvoKnown,
  denuvoResolve,
  applyLuatoolsFix,
  tokeerPreflight,
  tokeerAppliedStatus,
} from "../api";
import { applyFixRuntime } from "../lib/fixRuntime";
import { checkFixesFull } from "../lib/fixIndex";
import { BADGE_LABELS, BADGE_COLORS, BADGE_STATE_EVENT, ONLINE_RE, refreshBadges } from "../lib/badges";
import { hasFreshTokeerFixCache, readTokeerAvailabilityCache, refreshTokeerAvailabilityCache, resolveTokeerAvailabilityForGame } from "../lib/tokeerAvailability";
import { describeTokeerFailure, setupAndVerifyTokeer } from "../lib/tokeerSetup";

/**
 * Steam Store page injection.
 *
 * The in-Steam store (store.steampowered.com) renders in its own CEF browser
 * context that React tree patches cannot reach, so — like ProtonDB Badges and
 * DeckyPirate — we attach to that tab's Chrome DevTools Protocol WebSocket
 * (exposed on localhost:8080) and inject a floating button bar with
 * ``Runtime.evaluate``. Button clicks call a ``Runtime.addBinding`` bridge
 * (``window.ltInvoke``) which surfaces back here as ``Runtime.bindingCalled``
 * events, so the buttons can drive the plugin's Python backend even though they
 * live in a different JS world.
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
let currentAppId = "";
let wsReady = false;
let isConnecting = false;
let storeDisabled = false;

/** The appid of the store app page currently open, if any (for the sidebar). */
export function getStoreAppId(): number | null {
  const n = Number(currentAppId);
  return n > 0 ? n : null;
}
let poll: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let bgTimer: ReturnType<typeof setInterval> | null = null;
let histUnlisten: (() => void) | null = null;
let badgeListener: (() => void) | null = null;

// ── CDP helpers ─────────────────────────────────────────────────────────────
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

function setStatus(text: string): void {
  evaluate(`window.__ltStatus&&window.__ltStatus(${JSON.stringify(text)})`);
}

function removeBar(): void {
  evaluate(
    "(function(){" +
      "try{if(window.__ltObs){window.__ltObs.disconnect();window.__ltObs=null;}}catch(e){}" +
      "var b=document.getElementById('lt-store-bar');if(b)b.remove();" +
      "var m=document.getElementById('lt-fix-modal');if(m)m.remove();" +
      "var n=document.querySelectorAll('.lt-sls-btn');for(var i=0;i<n.length;i++)n[i].remove();" +
      "var tb=document.querySelectorAll('[data-lt-btn]');for(var k=0;k<tb.length;k++){var el=tb[k];var s=el.querySelector('span')||el;var o=el.getAttribute('data-lt-orig');if(o!=null)s.textContent=o;var hh=el.getAttribute('data-lt-href');if(hh)el.setAttribute('href',hh);el.removeAttribute('data-lt-btn');}" +
      // un-hide Steam's own Add-to-Cart buttons we replaced
      "var h=document.querySelectorAll('[data-lt-hidden]');for(var j=0;j<h.length;j++){h[j].style.display='';h[j].removeAttribute('data-lt-hidden');}" +
    "})();"
  );
}

function clearPoll(): void {
  if (poll) {
    clearInterval(poll);
    poll = null;
  }
}

function extractAppId(url: string): string {
  const m = (url || "").match(/\/app\/(\d+)/);
  return m ? m[1] : "";
}

// Steam-native styling for the injected floating bar. Matches the Steam client
// look: Motiva Sans, the #67c1f5 store accent, green/blue action gradients, a
// controller focus glow, and translucent "ghost" secondary buttons.
const STEAM_BAR_CSS = `
#lt-store-bar{font-family:"Motiva Sans",Arial,Helvetica,sans-serif;}
#lt-store-bar .lt-btn{appearance:none;-webkit-appearance:none;border:none;cursor:pointer;white-space:nowrap;color:#fff;font-family:"Motiva Sans",Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:.3px;padding:9px 14px;border-radius:2px;transition:filter .12s ease-out,box-shadow .12s ease-out,transform .06s ease-out;box-shadow:0 1px 3px rgba(0,0,0,.45);}
#lt-store-bar .lt-btn:hover{filter:brightness(1.13);}
#lt-store-bar .lt-btn:active{filter:brightness(.9);transform:translateY(1px);}
#lt-store-bar .lt-btn:focus{outline:none;box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 12px 2px rgba(103,193,245,.75);}
#lt-store-bar .lt-btn--add{background:linear-gradient(to bottom,#8bc53f,#5a8f1e);}
#lt-store-bar .lt-btn--remove{background:linear-gradient(to bottom,#e0604f,#a12a1b);}
#lt-store-bar .lt-btn--fix{background:linear-gradient(to bottom,#47a7e5,#1a5fb4);}
#lt-store-bar .lt-btn--ghost{background:rgba(103,193,245,.12);color:#67c1f5;box-shadow:inset 0 0 0 1px rgba(103,193,245,.4);}
#lt-store-bar .lt-btn--ghost:hover{background:rgba(103,193,245,.22);color:#bfe3ff;filter:none;}
#lt-store-bar .lt-btn:disabled{opacity:.45;cursor:default;filter:none;box-shadow:none;}
#lt-store-status{font-family:"Motiva Sans",Arial,sans-serif;font-size:11px;color:#c6d4df;background:linear-gradient(to bottom,rgba(42,71,94,.92),rgba(23,33,43,.94));border-radius:2px;padding:4px 8px;text-align:center;box-shadow:inset 0 0 0 1px rgba(103,193,245,.15);}
`;

function buildBar(appid: number, installed: boolean, fixAvailable: boolean): string {
  const primaryLabel = installed ? "\uD83D\uDDD1 Remove" : "\uFF0B Add";
  const primaryAction = installed ? "remove" : "add";
  const primaryVariant = installed ? "remove" : "add";
  const fixDisable = fixAvailable ? "" : "fixBtn.disabled=true;";
  return `(function(){
    var old=document.getElementById('lt-store-bar'); if(old) old.remove();
    if(!document.getElementById('lt-store-style')){var stl=document.createElement('style');stl.id='lt-store-style';stl.textContent=${JSON.stringify(STEAM_BAR_CSS)};document.head.appendChild(stl);}
    var bar=document.createElement('div'); bar.id='lt-store-bar';
    bar.style.cssText='position:fixed;top:64px;right:16px;z-index:2147483000;display:flex;flex-direction:column;gap:8px;align-items:stretch;';
    var row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;';
    function mk(label,action,variant){
      var b=document.createElement('button'); b.textContent=label;
      b.className='lt-btn lt-btn--'+variant;
      b.onclick=function(){ try{ window.ltInvoke(JSON.stringify({action:action,appid:${appid}})); }catch(e){} };
      return b;
    }
    row.appendChild(mk(${JSON.stringify(primaryLabel)},${JSON.stringify(primaryAction)},${JSON.stringify(primaryVariant)}));
    var fixBtn=mk('Fix','fix','fix'); ${fixDisable} row.appendChild(fixBtn);
    row.appendChild(mk('\\u27F3 Reload','reload','ghost'));
    var st=document.createElement('div'); st.id='lt-store-status';
    st.textContent='SLSDeck';
    window.__ltStatus=function(t){ var e=document.getElementById('lt-store-status'); if(e) e.textContent=t; };
    bar.appendChild(row); bar.appendChild(st); document.body.appendChild(bar);
  })();`;
}

// ── fix picker modal (store page context) ───────────────────────────────────
// Mirrors the desktop SLSDeck "Fixes" modal: one row per fix (Online /
// Generic) with a Manifest button (add the game) and a Fix button (apply that
// fix), plus Un-Fix and Close.
function buildFixModal(
  appid: number,
  name: string,
  onlineAvail: boolean,
  genericAvail: boolean,
  unsteamAvail: boolean,
  ryuuJson: string,
  catalogJson: string,
  tokeerJson: string
): string {
  return `(function(){
    var APPID=${appid};
    var old=document.getElementById('lt-fix-modal'); if(old) old.remove();
    var ov=document.createElement('div'); ov.id='lt-fix-modal';
    ov.style.cssText='position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);font-family:Arial,Helvetica,sans-serif;';
    var card=document.createElement('div');
    card.style.cssText='background:#1b2838;color:#e6edf3;border:1px solid #2a3f5a;border-radius:12px;padding:18px 18px 14px;min-width:340px;max-width:90vw;box-shadow:0 10px 40px rgba(0,0,0,0.6);';
    var h=document.createElement('div'); h.textContent='Fixes — '+${JSON.stringify(name || `AppID ${appid}`)};
    h.style.cssText='font-size:18px;font-weight:600;margin-bottom:12px;text-align:center;';
    card.appendChild(h);
    function inv(o){ try{ window.ltInvoke(JSON.stringify(o)); }catch(e){} }
    function row(label,avail,fixKey){
      var box=document.createElement('div');
      box.style.cssText='border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:8px;opacity:'+(avail?'1':'0.6')+';';
      var t=document.createElement('div'); t.textContent=label+(avail?' · Available':' · Not available');
      t.style.cssText='font-size:14px;font-weight:600;margin-bottom:6px;'; box.appendChild(t);
      var r=document.createElement('div'); r.style.cssText='display:flex;gap:8px;';
      function mk(txt,bg,dis,fn){ var b=document.createElement('button'); b.textContent=txt;
        b.style.cssText='flex:1;background:'+bg+';color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:'+(dis?'default':'pointer')+';opacity:'+(dis?'0.5':'1')+';';
        if(!dis) b.onclick=fn; return b; }
      r.appendChild(mk('Manifest','#2a6bb0',false,function(){ inv({action:'manifest',appid:APPID}); }));
      r.appendChild(mk('Fix','#5ba32b',!avail,function(){ inv({action:'fixApply',appid:APPID,fix:fixKey}); }));
      box.appendChild(r); return box;
    }
    var RYUU=${ryuuJson};
    RYUU.forEach(function(e){
      var online=(e.badge||'').toLowerCase()==='online';
      var lbl=online?'Online Fix':'Crack / Bypass Fix';
      var box=document.createElement('div');
      box.style.cssText='border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:8px;';
      var t=document.createElement('div'); t.textContent=lbl; t.style.cssText='font-size:14px;font-weight:600;'; box.appendChild(t);
      var sub=document.createElement('div'); sub.textContent=e.file+(e.badge?(' · '+e.badge):''); sub.style.cssText='font-size:11px;opacity:0.6;margin:2px 0 6px;'; box.appendChild(sub);
      if(e.description){var d=document.createElement('div');d.textContent=e.description;d.style.cssText='font-size:11px;opacity:.78;white-space:pre-wrap;line-height:1.4;margin:0 0 7px;max-height:120px;overflow:auto;';box.appendChild(d);}
      var b=document.createElement('button'); b.textContent='Apply this fix';
      b.style.cssText='width:100%;background:#5ba32b;color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;';
      b.onclick=function(){ inv({action:'fixApplyUrl',appid:APPID,url:e.url,fixType:(online?'Online Fix':'Generic Fix'),file:e.file}); };
      box.appendChild(b); card.appendChild(box);
    });
    var TOKEER=${tokeerJson};
    if(TOKEER&&TOKEER.name){
      var tb=document.createElement('div');tb.style.cssText='border:1px solid rgba(202,168,255,.35);background:rgba(202,168,255,.07);border-radius:8px;padding:10px;margin-bottom:8px;';
      var tt=document.createElement('div');tt.textContent='Tokeer · '+(TOKEER.remaining==null?'?':TOKEER.remaining)+(TOKEER.total==null?'':(' / '+TOKEER.total))+' keys available';tt.style.cssText='font-size:14px;font-weight:600;margin-bottom:4px;';tb.appendChild(tt);
      var td=document.createElement('div');td.textContent='Live Discord availability matched for this game. Uses the same Tokeer setup and validation as the library Fixes menu.';td.style.cssText='font-size:11px;opacity:.75;line-height:1.4;margin-bottom:7px;';tb.appendChild(td);
      var tx=document.createElement('button');tx.textContent='Tokeer · '+(TOKEER.remaining==null?'?':TOKEER.remaining)+' keys';tx.style.cssText='width:100%;background:#7655a8;color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;';tx.onclick=function(){inv({action:'tokeer',appid:APPID});};tb.appendChild(tx);card.appendChild(tb);
    }
    var CATALOG=${catalogJson};
    CATALOG.forEach(function(e,i){
      var box=document.createElement('div');box.style.cssText='border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:10px;margin-bottom:8px;';
      var tags=(e.tags||[]).map(function(t){return typeof t==='string'?t:(t&&(t.name||t.label||t.text||t.title||t.tag))||'';}).filter(Boolean);
      var title=document.createElement('div');title.textContent=(e.name&&e.name!==String(APPID)?e.name:(e.build?('Build '+e.build):('lua.tools fix '+(i+1))));title.style.cssText='font-size:14px;font-weight:600;margin-bottom:3px;';box.appendChild(title);
      if(tags.length){var tg=document.createElement('div');tg.textContent=tags.join(' · ');tg.style.cssText='font-size:11px;color:#caa8ff;margin-bottom:4px;';box.appendChild(tg);}
      var meta=[e.release_date?('Released '+String(e.release_date).slice(0,10)):'',e.build?('build '+e.build):''].filter(Boolean).join(' · ');if(meta){var m=document.createElement('div');m.textContent=meta;m.style.cssText='font-size:11px;opacity:.6;margin-bottom:4px;';box.appendChild(m);}
      if(e.description){var d=document.createElement('div');d.textContent=e.description;d.style.cssText='font-size:11px;opacity:.78;white-space:pre-wrap;line-height:1.4;margin-bottom:7px;max-height:150px;overflow:auto;';box.appendChild(d);}
      var b=document.createElement('button');b.textContent='Apply lua.tools fix';b.style.cssText='width:100%;background:#5ba32b;color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;';b.onclick=function(){inv({action:'ltApply',appid:APPID,fix:e});};box.appendChild(b);card.appendChild(box);
    });
    if(${onlineAvail ? "true" : "false"}) card.appendChild(row('Online Fix (perondepot)', true, 'online'));
    // The generic/crack fix had no row at all: genericAvail was accepted as a
    // parameter and then never used, so a fix the backend was perfectly able to
    // apply (fixApply already handles fix:'generic') was unreachable from the
    // store page, while its Online and Unsteam siblings both had buttons.
    if(${genericAvail ? "true" : "false"}) card.appendChild(row('Crack / Bypass Fix (generic)', true, 'generic'));
    card.appendChild(row('Online Fix (Unsteam) · Universal', ${unsteamAvail ? "true" : "false"}, 'unsteam'));
    var st=document.createElement('div'); st.id='lt-store-status';
    st.style.cssText='font-size:12px;color:#c6d4df;text-align:center;min-height:15px;margin:4px 0 10px;';
    window.__ltStatus=function(t){ var e=document.getElementById('lt-store-status'); if(e) e.textContent=t; };
    card.appendChild(st);
    var foot=document.createElement('div'); foot.style.cssText='display:flex;gap:8px;';
    function fbtn(txt,bg,fn){ var b=document.createElement('button'); b.textContent=txt;
      b.style.cssText='flex:1;background:'+bg+';color:#fff;border:none;border-radius:4px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;'; b.onclick=fn; return b; }
    foot.appendChild(fbtn('Un-Fix (verify game)','#8a5a1a',function(){ inv({action:'unfix',appid:APPID}); }));
    foot.appendChild(fbtn('Close','#556',function(){ ov.remove(); }));
    card.appendChild(foot);
    ov.appendChild(card);
    ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
    document.body.appendChild(ov);
  })();`;
}

// Store-page badges — same pill style as the library badges, bottom-left.
// No LEGIT (a store page is not proof of ownership) and no BYPASSED (non-HV).
function buildBadges(badges: Array<{ label: string; bg: string }>): string {
  return `(function(){
    var old=document.getElementById('lt-store-badges'); if(old) old.remove();
    var b=${JSON.stringify(badges)};
    if(!b.length) return;
    var box=document.createElement('div'); box.id='lt-store-badges';
    box.style.cssText='position:fixed;left:16px;top:64px;z-index:2147483000;display:flex;flex-wrap:wrap;gap:4px;font-family:Arial,Helvetica,sans-serif;pointer-events:none;';
    b.forEach(function(x){
      var p=document.createElement('div'); p.textContent=x.label;
      p.style.cssText='white-space:nowrap;padding:2px 7px;border-radius:4px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.4px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.4);background:'+x.bg+';';
      box.appendChild(p);
    });
    document.body.appendChild(box);
  })();`;
}

function removeBadges(): void {
  evaluate("var b=document.getElementById('lt-store-badges');if(b)b.remove();");
}

async function storeBadges(
  appid: number,
  installed: boolean
): Promise<Array<{ label: string; bg: string }>> {
  const kinds: string[] = [];
  try {
    const o = await getBadgeOptions();
    if (!o.success || !o.storePage) return [];
    if (installed && o.sls) kinds.push("sls");
    if (o.denuvo) {
      try {
        const known = await denuvoKnown();
        let d = (known.denuvo || []).includes(appid);
        if (!d) { const r = await denuvoResolve([appid]); d = (r.denuvo || []).includes(appid); }
        if (d) kinds.push("denuvo");
      } catch { /* */ }
    }
    if (o.onlineFix || o.fixed) {
      try {
        const r = await getInstalledFixes();
        const types = (r.fixes || [])
          .filter((fx) => Number(fx.appid) === appid)
          .map((fx) => String(fx.fixType || ""));
        if (types.length) {
          if (types.some((t) => ONLINE_RE.test(t))) { if (o.onlineFix) kinds.push("onlinefix"); }
          else if (o.fixed) kinds.push("fixed");
        }
      } catch { /* */ }
    }
    if (o.tokeer) {
      try {
        const status = await tokeerAppliedStatus(appid);
        const record = status.record;
        if (status.success && status.applied && record?.pinned && record.pinMatchesActivation && record.health !== "changed") {
          kinds.push(status.record?.health === "valid" ? "tokeer" : "tokeercheck");
        }
      } catch { /* */ }
    }
  } catch { /* */ }
  return kinds.map((k) => ({ label: BADGE_LABELS[k] || k, bg: BADGE_COLORS[k] || "#555" }));
}

// Overlap guard so rapid navigation can't stack async reinjects.
let reinjectBusy = false;
let reinjectPending: number | null = null;

async function reinject(appid: number): Promise<void> {
  if (reinjectBusy) { reinjectPending = appid; return; }
  reinjectBusy = true;
  try {
    await reinjectNow(appid);
  } finally {
    reinjectBusy = false;
    const next = reinjectPending;
    reinjectPending = null;
    if (next != null && next !== appid) void reinject(next);
  }
}

async function reinjectNow(appid: number): Promise<void> {
  let installed = false;
  try {
    installed = !!(await hasLua(appid)).exists;
  } catch {
    /* ignore */
  }
  if (storeDisabled) {
    removeBar();
  } else {
    let fixAvail = false;
    try {
      const f = await checkFixesFull(appid);
      fixAvail = !!(f?.genericFix?.available || f?.onlineFix?.available);
    } catch {
      /* ignore */
    }
    evaluate(buildBar(appid, installed, fixAvail));
  }
  try {
    evaluate(buildBadges(await storeBadges(appid, installed)));
  } catch {
    /* ignore */
  }
}

// ── action bridge (Runtime.bindingCalled → backend) ─────────────────────────
async function onAction(payloadStr: string): Promise<void> {
  let msg: any;
  try {
    msg = JSON.parse(payloadStr);
  } catch {
    return;
  }
  const appid = Number(msg?.appid);
  const action = msg?.action;
  if (!appid) return;

  if (action === "reload") {
    setStatus("Reloading Steam…");
    try {
      await reloadSteam();
    } catch {
      /* ignore */
    }
    return;
  }
  if (action === "remove") {
    setStatus("Removing…");
    try {
      await deleteLua(appid);
    } catch {
      /* ignore */
    }
    await reinject(appid);
    setStatus("Removed — reload Steam");
    return;
  }
  if (action === "add" || action === "manifest") {
    setStatus("Adding…");
    try {
      const res = await startAdd(appid);
      if (!res.success) {
        setStatus(res.error || "Could not add");
        return;
      }
    } catch {
      setStatus("Could not start");
      return;
    }
    clearPoll();
    poll = setInterval(async () => {
      try {
        const r = await getAddStatus(appid);
        const st: any = r.state || {};
        setStatus("Add: " + (st.status || ""));
        if (["done", "failed", "cancelled"].includes(st.status || "")) {
          clearPoll();
          if (st.status === "done") {
            if (action === "add") await reinject(appid);
            setStatus("Added — restart Steam");
          } else {
            setStatus(st.error || "Failed");
          }
        }
      } catch {
        /* keep polling */
      }
    }, 800);
    return;
  }
  // The Fix button opens the picker modal (Manifest + Fix per fix type).
  if (action === "fix") {
    setStatus("Checking fixes…");
    try {
      const f = await checkFixesFull(appid);
      const cached = readTokeerAvailabilityCache();
      let tokeer: any = null;
      try {
        const live = hasFreshTokeerFixCache(cached) ? cached : await refreshTokeerAvailabilityCache(true);
        if (live) tokeer = await resolveTokeerAvailabilityForGame(appid, f?.gameName || "");
      } catch { tokeer = null; }
      evaluate(
        buildFixModal(
          appid,
          f?.gameName || "",
          !!f?.onlineFix?.available,
          !!f?.genericFix?.available,
          f?.unsteamFix?.available !== false,
          JSON.stringify((f as any)?.ryuuFixes || []),
          JSON.stringify((f as any)?.luatoolsCatalog || []),
          JSON.stringify(tokeer)
        )
      );
      setStatus("");
    } catch {
      setStatus("Could not check fixes");
    }
    return;
  }

  if (action === "tokeer") {
    setStatus("Checking Tokeer prerequisites…");
    try {
      const preflight = await tokeerPreflight(appid, "");
      if (!preflight.success || !preflight.installed) { setStatus(preflight.error || "Game is not installed"); return; }
      const r = await setupAndVerifyTokeer(appid, setStatus);
      if (!r.success) { setStatus(describeTokeerFailure(r)); return; }
      if (r.code) { try { await navigator.clipboard.writeText(r.code); } catch {} }
      setStatus(`Tokeer ready${r.code ? " — TLX1 copied" : ""}`);
    } catch (e) { setStatus(`Tokeer failed: ${e}`); }
    return;
  }

  if (action === "ltApply") {
    setStatus("Locating game…");
    try {
      const p = await getGameInstallPath(appid);
      if (!p.success || !p.installPath) { setStatus("Game not installed — add it first, then install"); return; }
      const f = msg.fix || {};
      const started = await applyLuatoolsFix(appid, String(f.id || ""), p.installPath, String(f.manifest_id || f.build || ""), String(f.depot_id || ""), "lua.tools fix", "");
      if (!started.success) { setStatus(started.error || "Could not start lua.tools fix"); return; }
      clearPoll();
      poll = setInterval(async () => {
        const r = await getFixStatus(appid); const st: any = r.state || {}; setStatus("Fix: " + (st.status || ""));
        if (["done","failed","cancelled"].includes(st.status || "")) { clearPoll(); if (st.status === "done") applyFixRuntime(appid, st.overrides); setStatus(st.status === "done" ? "lua.tools fix applied — restart Steam" : st.error || "Fix failed"); }
      }, 800);
    } catch (e) { setStatus(`lua.tools fix failed: ${e}`); }
    return;
  }

  if (action === "fixApplyUrl") {
    setStatus("Locating game…");
    try {
      const p = await getGameInstallPath(appid);
      if (!p.success || !p.installPath) {
        setStatus("Game not installed — add it first, then install");
        return;
      }
      const url = String(msg?.url || "");
      const fixType = String(msg?.fixType || "Generic Fix");
      if (!url) { setStatus("No fix url"); return; }
      await applyFix(appid, url, p.installPath, fixType, "");
      clearPoll();
      poll = setInterval(async () => {
        try {
          const r = await getFixStatus(appid);
          const st: any = r.state || {};
          setStatus("Fix: " + (st.status || ""));
          if (["done", "failed", "cancelled"].includes(st.status || "")) {
            clearPoll();
            if (st.status === "done") applyFixRuntime(appid, st.overrides);
            setStatus(st.status === "done" ? "Fix applied — restart Steam" : st.error || "Fix failed");
          }
        } catch { /* keep polling */ }
      }, 800);
    } catch {
      setStatus("Fix failed");
    }
    return;
  }
  if (action === "fixApply") {
    const which =
      msg?.fix === "generic" ? "generic" : msg?.fix === "unsteam" ? "unsteam" : "online";
    setStatus("Locating game…");
    try {
      const p = await getGameInstallPath(appid);
      if (!p.success || !p.installPath) {
        setStatus("Game not installed — add it first, then install");
        return;
      }
      const f = await checkFixesFull(appid);
      const pick =
        which === "generic" ? f?.genericFix : which === "unsteam" ? f?.unsteamFix : f?.onlineFix;
      if (!pick?.available || !pick?.url) {
        setStatus("That fix is not available");
        return;
      }
      // Three-way, not a two-branch ternary. `which` has three values, and the
      // old form labelled BOTH "unsteam" and "online" as "Online Fix (Unsteam)".
      // fixType is not cosmetic: it is recorded in the fix log, and fixes.py
      // keys off exactly "online fix (unsteam)" to patch the <appid> placeholder
      // in unsteam.ini -- so the perondepot online fix was being sent down the
      // wrong post-extract path and shown under the wrong name in Un-fix.
      const fixType =
        which === "generic"
          ? "Generic Fix"
          : which === "unsteam"
            ? "Online Fix (Unsteam)"
            : "Online Fix";
      await applyFix(appid, pick.url, p.installPath, fixType, f.gameName || "");
      clearPoll();
      poll = setInterval(async () => {
        try {
          const r = await getFixStatus(appid);
          const st: any = r.state || {};
          setStatus("Fix: " + (st.status || ""));
          if (["done", "failed", "cancelled"].includes(st.status || "")) {
            clearPoll();
            if (st.status === "done") applyFixRuntime(appid, st.overrides);
            setStatus(st.status === "done" ? "Fix applied — restart Steam" : st.error || "Fix failed");
          }
        } catch {
          /* keep polling */
        }
      }, 800);
    } catch {
      setStatus("Fix failed");
    }
    return;
  }
  if (action === "unfix") {
    setStatus("Locating game…");
    try {
      const p = await getGameInstallPath(appid);
      const path = p.success ? p.installPath || "" : "";
      await unfix(appid, path, "");
      clearPoll();
      poll = setInterval(async () => {
        try {
          const r = await getUnfixStatus(appid);
          const st: any = r.state || {};
          setStatus("Un-fix: " + (st.status || ""));
          if (["done", "failed", "cancelled"].includes(st.status || "")) {
            clearPoll();
            if (st.status === "done") await refreshBadges();
            setStatus(st.status === "done" ? "Fix reverted — restart Steam" : st.error || "Un-fix failed");
          }
        } catch {
          /* keep polling */
        }
      }, 800);
    } catch {
      setStatus("Un-fix failed");
    }
  }
}

// ── WebSocket connection to the store tab's CDP endpoint ────────────────────
// Mirrors the approach isitcracked uses (proven on-device): an aggressive 500ms
// background poll that connects whenever a store tab exists — regardless of the
// active route — plus CDP navigation events (frameNavigated,
// navigatedWithinDocument, loadEventFired) and an on-open location.href query so
// SPA store navigation reliably re-injects.
function scheduleReconnect(ms = 1000): void {
  if (!mounted || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (mounted && (!ws || ws.readyState === WebSocket.CLOSED)) connect();
  }, ms);
}

function updateAppIdFromUrl(url: string): void {
  const a = extractAppId(url);
  console.log("===LT=== url→appid:", (url || "").substring(0, 70), "=>", a);
  if (!a) {
    if (currentAppId) {
      currentAppId = "";
      clearPoll();
      removeBar();
      removeBadges();
    }
    return;
  }
  currentAppId = a;
  if (wsReady) reinject(Number(a));
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
    const tab = tabs.find((t) => t.url && t.url.includes("store.steampowered.com"));
    console.log("===LT=== connect: store tab", tab ? tab.url.substring(0, 70) : "NOT FOUND", "of", tabs.length, "tabs");
    if (!tab || !tab.webSocketDebuggerUrl) {
      isConnecting = false;
      scheduleReconnect(1000);
      return;
    }
    currentAppId = extractAppId(tab.url);
    const sock = new WebSocket(tab.webSocketDebuggerUrl);
    ws = sock;
    let pendingUrlId: number | null = null;
    sock.onopen = () => {
      isConnecting = false;
      if (ws !== sock) {
        sock.close();
        return;
      }
      console.log("===LT=== ws open; currentAppId=", currentAppId);
      cdp("Page.enable");
      cdp("Runtime.enable");
      cdp("Runtime.addBinding", { name: "ltInvoke" });
      const uid = msgId++;
      pendingUrlId = uid;
      try {
        sock.send(
          JSON.stringify({
            id: uid,
            method: "Runtime.evaluate",
            params: { expression: "window.location.href" },
          })
        );
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        if (ws !== sock) return;
        wsReady = true;
        if (currentAppId) reinject(Number(currentAppId));
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
        if (typeof u === "string") updateAppIdFromUrl(u);
        return;
      }
      if (d.method === "Runtime.bindingCalled" && d.params?.name === "ltInvoke") {
        onAction(String(d.params.payload || ""));
      } else if (d.method === "Page.frameNavigated" && d.params?.frame?.url) {
        clearPoll();
        setTimeout(() => updateAppIdFromUrl(d.params.frame.url), 500);
      } else if (d.method === "Page.navigatedWithinDocument" && d.params?.frame?.url) {
        clearPoll();
        setTimeout(() => updateAppIdFromUrl(d.params.frame.url), 500);
      } else if (d.method === "Page.loadEventFired") {
        if (currentAppId && wsReady) setTimeout(() => reinject(Number(currentAppId)), 300);
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
  } catch (e) {
    console.log("===LT=== connect error:", e);
    isConnecting = false;
    scheduleReconnect(1000);
  }
}

function handleLocation(pathname: string): void {
  if (pathname === "/steamweb") connect();
}

export function initStorePatch(): () => void {
  mounted = true;
  badgeListener = () => {
    if (currentAppId && wsReady) void reinject(Number(currentAppId));
  };
  window.addEventListener(BADGE_STATE_EVENT, badgeListener as EventListener);
  console.log("===LT=== initStorePatch: store injection starting");
  getStoreDisabled()
    .then((r) => {
      storeDisabled = !!r.disabled;
    })
    .catch(() => {});
  if (History) {
    try {
      handleLocation(History.location?.pathname || "");
      histUnlisten = History.listen((info: { pathname: string }) =>
        handleLocation(info?.pathname || "")
      );
    } catch {
      /* ignore */
    }
  }
  connect();
  // Aggressive background poll (isitcracked style): connect whenever a store tab
  // exists, regardless of route, and pick up live floating-toggle changes.
  bgTimer = setInterval(async () => {
    try {
      const dr = await getStoreDisabled();
      const dis = !!dr.disabled;
      if (dis !== storeDisabled) {
        storeDisabled = dis;
        if (currentAppId && wsReady) reinject(Number(currentAppId));
        else if (dis) removeBar();
      }
    } catch {
      /* ignore */
    }
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
    clearPoll();
    if (histUnlisten) {
      histUnlisten();
      histUnlisten = null;
    }
    if (badgeListener) {
      window.removeEventListener(BADGE_STATE_EVENT, badgeListener as EventListener);
      badgeListener = null;
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
