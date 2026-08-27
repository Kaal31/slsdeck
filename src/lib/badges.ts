/**
 * Library capsule badges.
 *
 * Two independent badges, each toggleable in Advanced ▸ Options:
 *   • SLS   — games registered through SLSsteam / lua (ours)
 *   • LEGIT — real Steam library titles that are neither ours nor non-Steam
 *             shortcuts (i.e. genuinely licensed)
 *
 * Steam renders the library grid in a separate gamepad-navigation window, so
 * badges are injected into that window's DOM (the same approach the
 * decky-nonsteam-badges plugin uses) rather than through a React patch.
 */

import {
  getBadgeOptions, getInstalledApps, getEverAdded, getInstalledFixes, denuvoKnown, denuvoResolve,
  getNonSteamApps,
  tokeerAppliedStatus,
} from "../api";
import { isInLibrary, isNonSteamShortcut } from "./ownership";
import { badgeDisplayLabel, getEmojiBadgesEnabled } from "./emojiBadges";

const BADGE_CLASS = "slsdeck-badge";
const STYLE_ID = "slsdeck-badge-style";
const POSITIONED_ATTR = "data-slsdeck-positioned";
export const BADGE_STATE_EVENT = "slsdeck-badge-state-changed";

/** fixType strings vary by call site ("Online Fix", "online"…). */
export const ONLINE_RE = /online/i;

export const BADGE_LABELS: Record<string, string> = {
  sls: "SLS",
  legit: "LEGIT",
  denuvo: "DENUVO",
  onlinefix: "ONLINE FIX",
  fixed: "FIXED",
  tokeer: "TOKEER KEY",
  tokeercheck: "TOKEER CHECK",
  nonsteam: "NON-STEAM",
  nonsteamname: "", // dynamic — filled per-app from the shortcut's exe folder
};

export const BADGE_COLORS: Record<string, string> = {
  sls: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)",
  legit: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)",
  denuvo: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)",
  onlinefix: "linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%)",
  fixed: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)",
  tokeer: "linear-gradient(135deg, #9b6b16 0%, #d7a52b 100%)",
  tokeercheck: "linear-gradient(135deg, #8b4d16 0%, #d97706 100%)",
  nonsteam: "#000000",
  nonsteamname: "linear-gradient(135deg, #3a3f4b 0%, #555b68 100%)",
};

let observer: MutationObserver | null = null;
let scanTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let rafHandle: number | null = null;
let cachedWindow: Window | null = null;

let slsIds = new Set<number>();
let slsLoaded = false;
let everAddedIds = new Set<number>();
let denuvoIds = new Set<number>();
let onlineIds = new Set<number>();
let fixedIds = new Set<number>();
let tokeerIds = new Set<number>();
let tokeerCheckIds = new Set<number>();
let opts = {
  sls: true, legit: true, denuvo: true, onlineFix: true, fixed: true, tokeer: true,
  nonSteam: true, nonSteamName: true, library: true,
};
let nonSteamNames = new Map<number, string>();
const pendingDenuvo = new Set<number>();
let denuvoFlushTimer: ReturnType<typeof setTimeout> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

export function getLibraryWindow(): Window | null {
  if (cachedWindow && !cachedWindow.closed) return cachedWindow;
  try {
    const DFL = (window as any).DFL;
    if (!DFL?.getGamepadNavigationTrees) return null;
    for (const tree of DFL.getGamepadNavigationTrees()) {
      try {
        const doc = tree?.m_window?.document;
        if (!doc) continue;
        const n =
          doc.querySelectorAll('div[role="gridcell"]').length +
          doc.querySelectorAll('div[role="listitem"]').length;
        if (n > 0) {
          cachedWindow = tree.m_window;
          return cachedWindow;
        }
      } catch {
        continue;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function injectStyle(win: Window) {
  try {
    if (win.document.getElementById(STYLE_ID)) return;
    const el = win.document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
.${BADGE_CLASS}-box {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.${BADGE_CLASS} {
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
.${BADGE_CLASS}[data-kind="sls"] { background: linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%); }
.${BADGE_CLASS}[data-kind="legit"] { background: linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%); }
.${BADGE_CLASS}[data-kind="denuvo"] { background: linear-gradient(135deg, #a12a2a 0%, #e05252 100%); }
.${BADGE_CLASS}[data-kind="onlinefix"] { background: linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%); }
.${BADGE_CLASS}[data-kind="fixed"] { background: linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%); }
.${BADGE_CLASS}[data-kind="tokeer"] { background: linear-gradient(135deg, #9b6b16 0%, #d7a52b 100%); }
`;
    win.document.head.appendChild(el);
  } catch {
    /* ignore */
  }
}

function appIdFromImage(img: HTMLImageElement | null): string | null {
  if (!img?.src) return null;
  let m = img.src.match(/\/assets\/(\d+)\//);
  if (m) return m[1];
  m = img.src.match(/\/customimages\/(\d+)p?\.(jpg|jpeg|png|webp)/i);
  if (m) return m[1];
  m = img.src.match(/rungameid\/(\d+)/i);
  if (m) return m[1];
  m = img.src.match(/\/(\d{6,})([p._-]?[a-z]*\.(jpg|png|webp))?/i);
  if (m) return m[1];
  return null;
}

function getAppId(capsule: Element): string | null {
  const dataId = capsule.getAttribute("data-id");
  if (dataId && !dataId.startsWith("placeholder")) return dataId;
  const fromImg = appIdFromImage(capsule.querySelector("img"));
  if (fromImg) return fromImg;
  try {
    const anchor = capsule.tagName.toLowerCase() === "a" ? capsule : capsule.querySelector("a");
    const href = anchor?.getAttribute("href");
    if (href) {
      const m = href.match(/\/app\/(\d+)/i) || href.match(/\/details\/(\d+)/i) || href.match(/run\/(\d+)/i);
      if (m) return m[1];
    }
  } catch { /* ignore */ }
  try {
    for (const el of [capsule, ...Array.from(capsule.children)]) {
      const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
      if (!key) continue;
      let fiber = (el as any)[key];
      let depth = 0;
      while (fiber && depth < 5) {
        const p = fiber.memoizedProps || fiber.return?.memoizedProps;
        const id = p?.appid ?? p?.appId ?? p?.nAppID ?? p?.unAppID ?? p?.overview?.appid ?? p?.appOverview?.appid ?? p?.app?.appid ?? p?.item?.appid;
        if (id) return String(id);
        fiber = fiber.return;
        depth++;
      }
    }
  } catch { /* ignore */ }
  return null;
}

type Kind = "sls" | "legit" | "denuvo" | "onlinefix" | "fixed" | "tokeer" | "tokeercheck" | "nonsteam" | "nonsteamname";

function classifyNonSteam(appid: number): Kind[] {
  if (!isNonSteamShortcut(appid)) return [];
  const out: Kind[] = [];
  if (opts.nonSteam) out.push("nonsteam");
  if (opts.nonSteamName && (nonSteamNames.get(appid) || "").trim()) out.push("nonsteamname");
  return out;
}

function classifyPrimary(appid: number): Kind | null {
  if (slsIds.has(appid)) return opts.sls ? "sls" : null;
  if (isNonSteamShortcut(appid)) return null;
  if (!isInLibrary(appid)) return null;
  if (!slsLoaded) return null;
  if (everAddedIds.has(appid)) return null;
  if (onlineIds.has(appid) || fixedIds.has(appid)) return null;
  return opts.legit ? "legit" : null;
}

function classifyApplied(appid: number): Kind[] {
  const out: Kind[] = [];
  if (opts.onlineFix && onlineIds.has(appid)) out.push("onlinefix");
  if (opts.fixed && fixedIds.has(appid)) out.push("fixed");
  if (opts.tokeer && tokeerIds.has(appid)) out.push("tokeer");
  if (opts.tokeer && tokeerCheckIds.has(appid)) out.push("tokeercheck");
  return out;
}

function classifyDenuvo(appid: number): boolean {
  if (!opts.denuvo) return false;
  if (isNonSteamShortcut(appid)) return false;
  if (denuvoIds.has(appid)) return true;
  if (!pendingDenuvo.has(appid)) {
    pendingDenuvo.add(appid);
    scheduleDenuvoFlush();
  }
  return false;
}

function scheduleDenuvoFlush() {
  if (denuvoFlushTimer) return;
  denuvoFlushTimer = setTimeout(async () => {
    denuvoFlushTimer = null;
    const batch = Array.from(pendingDenuvo).slice(0, 40);
    if (!batch.length) return;
    batch.forEach((a) => pendingDenuvo.delete(a));
    try {
      const r = await denuvoResolve(batch);
      if (r.success) denuvoIds = new Set(r.denuvo || []);
    } catch { /* ignore */ }
  }, 1200);
}

function badgeCapsule(capsule: Element, win: Window) {
  const raw = getAppId(capsule);
  const box = capsule.querySelector(`.${BADGE_CLASS}-box`) as HTMLElement | null;
  const existing = Array.from(capsule.querySelectorAll(`.${BADGE_CLASS}`)) as HTMLElement[];
  if (!raw) {
    box?.remove();
    existing.forEach((b) => b.remove());
    return;
  }
  const appid = Number(raw);
  const primary = classifyPrimary(appid);
  const denuvo = classifyDenuvo(appid);
  const wanted: Kind[] = [];
  if (primary) wanted.push(primary);
  if (denuvo) wanted.push("denuvo");
  wanted.push(...classifyApplied(appid));
  wanted.push(...classifyNonSteam(appid));

  if (!wanted.length) {
    box?.remove();
    existing.forEach((b) => b.remove());
    return;
  }

  const emojiMode = getEmojiBadgesEnabled();
  const mode = emojiMode ? "emoji" : "text";
  const current = existing
    .filter((b) => b.getAttribute("data-appid") === String(appid))
    .map((b) => b.getAttribute("data-kind"));
  const currentMode = existing.every((b) => b.getAttribute("data-mode") === mode);
  if (current.length === wanted.length && wanted.every((k) => current.includes(k)) && currentMode) return;

  box?.remove();
  existing.forEach((b) => b.remove());

  const img = capsule.querySelector("img") as HTMLImageElement | null;
  const role = capsule.getAttribute("role");
  let target: HTMLElement | null = null;
  if (role === "gridcell") {
    // Keep badges out of Steam's overflow-clipped image layer. This is the
    // working anchor for the normal Library grid.
    target = img ? (capsule.querySelector("div") as HTMLElement | null) : (capsule as HTMLElement);
  } else if (role === "listitem") {
    // Steam Home uses a dedicated artwork wrapper. decky-nonsteam-badges uses
    // this same partial class match because the generic nearest div can be
    // Steam's native status/action overlay, while the whole listitem can clip
    // overlays outside the artwork box.
    target = img
      ? ((img.closest('div[class*="_1pwP4"]') as HTMLElement | null) ?? (capsule as HTMLElement))
      : (capsule as HTMLElement);
  }
  if (!target) target = capsule as HTMLElement;

  if (!target.hasAttribute(POSITIONED_ATTR)) {
    try {
      if (win.getComputedStyle(target).position === "static") target.style.position = "relative";
    } catch { /* ignore */ }
    target.setAttribute(POSITIONED_ATTR, "true");
  }

  const container = win.document.createElement("div");
  container.className = `${BADGE_CLASS}-box`;
  container.style.cssText =
    (emojiMode
      ? "position:absolute;top:6px;left:6px;z-index:9999;pointer-events:none;width:max-content;max-width:calc(100% - 12px);background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;"
      : "position:absolute;top:4px;left:4px;right:4px;z-index:9999;pointer-events:none;") +
    `display:flex;flex-wrap:wrap;gap:${emojiMode ? 7 : 3}px;align-items:center;`;
  for (const kind of wanted) {
    const badge = win.document.createElement("div");
    badge.className = BADGE_CLASS;
    badge.setAttribute("data-appid", String(appid));
    badge.setAttribute("data-kind", kind);
    badge.setAttribute("data-mode", mode);
    const normal = kind === "nonsteamname" ? (nonSteamNames.get(appid) || "APP") : BADGE_LABELS[kind];
    badge.textContent = kind === "nonsteamname" ? normal : badgeDisplayLabel(kind, normal);

    const standaloneEmoji = emojiMode && kind !== "nonsteamname";
    badge.style.cssText = standaloneEmoji
      ? "flex:0 0 auto;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;" +
        "box-sizing:border-box;width:auto;height:auto;max-width:none;min-width:0;" +
        "padding:0;margin:0;border:0;border-radius:0;font-size:24px;line-height:27px;" +
        "font-family:'Noto Color Emoji','Segoe UI Emoji','Apple Color Emoji',sans-serif;font-weight:400;letter-spacing:0;" +
        "color:inherit;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;" +
        "text-shadow:0 1px 3px rgba(0,0,0,0.75);overflow:visible;"
      : "flex:0 0 auto;white-space:nowrap;display:inline-block;overflow:visible;" +
        "box-sizing:border-box;width:auto;height:auto;max-width:none;min-width:0;" +
        "padding:2px 7px;border-radius:4px;font-size:11px;line-height:16px;" +
        "font-family:'Motiva Sans',Arial,sans-serif;font-weight:700;letter-spacing:0.4px;" +
        "color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.6);box-shadow:0 1px 4px rgba(0,0,0,0.4);" +
        "background:" + (BADGE_COLORS[kind] || "#555") + ";";
    container.appendChild(badge);
  }
  target.appendChild(container);
}

function scan() {
  const win = getLibraryWindow();
  if (!win) return;
  injectStyle(win);
  const selectors = [
    'div[role="tabpanel"] div[role="gridcell"]',
    '.ReactVirtualized__Grid__innerScrollContainer div[role="listitem"]',
  ];
  for (const sel of selectors) {
    win.document.querySelectorAll(sel).forEach((capsule) => {
      if (!capsule.querySelector('div[role="link"]')) return;
      if (capsule.firstElementChild?.getAttribute("role") === "link") return;
      badgeCapsule(capsule, win);
    });
  }
}

function debouncedScan() {
  if (rafHandle != null) return;
  rafHandle = requestAnimationFrame(() => {
    rafHandle = null;
    scan();
  });
}

async function refreshData() {
  const previousOnline = Array.from(onlineIds).sort((a, b) => a - b).join(",");
  const previousFixed = Array.from(fixedIds).sort((a, b) => a - b).join(",");
  const previousTokeer = Array.from(tokeerIds).sort((a, b) => a - b).join(",");
  const previousTokeerCheck = Array.from(tokeerCheckIds).sort((a, b) => a - b).join(",");
  try {
    const r = await getBadgeOptions();
    if (r.success) {
      opts = {
        sls: !!r.sls,
        legit: !!r.legit,
        denuvo: !!r.denuvo,
        onlineFix: !!r.onlineFix,
        fixed: !!r.fixed,
        tokeer: !!r.tokeer,
        nonSteam: !!r.nonSteam,
        nonSteamName: !!r.nonSteamName,
        library: !!r.library,
      };
    }
  } catch { /* keep previous */ }
  try {
    if (opts.nonSteamName) {
      const r = await getNonSteamApps();
      if (r.success) {
        const m = new Map<number, string>();
        for (const [id, name] of Object.entries(r.apps || {})) {
          const n = Number(id);
          if (!Number.isNaN(n) && name) m.set(n, String(name));
        }
        nonSteamNames = m;
      }
    }
  } catch { /* keep previous names */ }
  try {
    const r = await getInstalledApps();
    if (r.success) {
      slsIds = new Set((r.apps || []).map((a) => Number(a.appid)));
      slsLoaded = true;
    }
  } catch { /* keep previous set */ }
  try {
    const r = await getEverAdded();
    if (r.success) everAddedIds = new Set((r.appids || []).map((a) => Number(a)));
  } catch { /* keep previous */ }
  try {
    const r = await denuvoKnown();
    if (r.success) denuvoIds = new Set(r.denuvo || []);
  } catch { /* keep previous */ }
  try {
    const r = await getInstalledFixes();
    if (r.success) {
      const perApp = new Map<number, string[]>();
      for (const f of r.fixes || []) {
        const id = Number(f.appid);
        (perApp.get(id) ?? perApp.set(id, []).get(id)!).push(String(f.fixType || ""));
      }
      const on = new Set<number>();
      const fx = new Set<number>();
      for (const [id, types] of perApp) {
        if (types.some((t) => ONLINE_RE.test(t))) on.add(id);
        else fx.add(id);
      }
      onlineIds = on;
      fixedIds = fx;
      const nextOnline = Array.from(onlineIds).sort((a, b) => a - b).join(",");
      const nextFixed = Array.from(fixedIds).sort((a, b) => a - b).join(",");
      if (nextOnline !== previousOnline || nextFixed !== previousFixed) {
        try { window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT)); } catch { /* ignore */ }
      }
    }
  } catch { /* keep previous */ }
  try {
    const r = await tokeerAppliedStatus();
    if (r.success) {
      tokeerIds = new Set((r.records || [])
        .filter((record) => record.health === "valid" && record.pinned && record.pinMatchesActivation)
        .map((record) => Number(record.appid)));
      tokeerCheckIds = new Set((r.records || [])
        .filter((record) => record.health === "check" && record.pinned && record.pinMatchesActivation)
        .map((record) => Number(record.appid)));
      const nextTokeer = Array.from(tokeerIds).sort((a, b) => a - b).join(",");
      const nextTokeerCheck = Array.from(tokeerCheckIds).sort((a, b) => a - b).join(",");
      if (nextTokeer !== previousTokeer || nextTokeerCheck !== previousTokeerCheck) {
        try { window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT)); } catch { /* ignore */ }
      }
    }
  } catch { /* keep previous */ }
}

export function removeAllBadges() {
  const win = getLibraryWindow();
  if (!win) return;
  try {
    win.document.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove());
    win.document.querySelectorAll(`.${BADGE_CLASS}-box`).forEach((b) => b.remove());
  } catch { /* ignore */ }
}

export async function startBadges() {
  stopBadges();
  await refreshData();
  if (!opts.library) {
    removeAllBadges();
    return;
  }
  if (!opts.sls && !opts.legit && !opts.denuvo && !opts.onlineFix && !opts.fixed && !opts.tokeer && !opts.nonSteam) return;

  const win = getLibraryWindow();
  if (!win) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      startBadges();
    }, 1500);
    return;
  }

  scan();
  observer = new MutationObserver((muts) => {
    if (muts.some((m) => m.addedNodes.length > 0)) debouncedScan();
  });
  win.document
    .querySelectorAll('div[role="tabpanel"], div[class*="Panel"]')
    .forEach((c) => observer?.observe(c, { childList: true, subtree: true }));

  scanTimer = setInterval(scan, 2000);
  refreshTimer = setInterval(refreshData, 20000);
}

export function stopBadges() {
  if (observer) { observer.disconnect(); observer = null; }
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  if (rafHandle != null) { cancelAnimationFrame(rafHandle); rafHandle = null; }
}

export async function refreshBadges() {
  removeAllBadges();
  await startBadges();
  try { window.dispatchEvent(new CustomEvent(BADGE_STATE_EVENT)); } catch { /* ignore */ }
}
