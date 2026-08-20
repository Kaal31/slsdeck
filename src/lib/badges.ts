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
} from "../api";
import { isInLibrary, isNonSteamShortcut } from "./ownership";

const BADGE_CLASS = "slsdeck-badge";
const STYLE_ID = "slsdeck-badge-style";
const POSITIONED_ATTR = "data-slsdeck-positioned";

/** fixType strings vary by call site ("Online Fix", "online"…). */
export const ONLINE_RE = /online/i;

export const BADGE_LABELS: Record<string, string> = {
  sls: "SLS",
  legit: "LEGIT",
  denuvo: "DENUVO",
  onlinefix: "ONLINE FIX",
  fixed: "FIXED",
  nonsteam: "NON-STEAM",
  nonsteamname: "", // dynamic — filled per-app from the shortcut's exe folder
};

export const BADGE_COLORS: Record<string, string> = {
  sls: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)",
  legit: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)",
  denuvo: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)",
  onlinefix: "linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%)",
  fixed: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)",
  // Non-Steam: solid black with white text, as requested.
  nonsteam: "#000000",
  // App-name badge: a neutral dark slate so it reads as secondary info.
  nonsteamname: "linear-gradient(135deg, #3a3f4b 0%, #555b68 100%)",
};

/* ── state ─────────────────────────────────────────────────────────────── */
let observer: MutationObserver | null = null;
let scanTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let rafHandle: number | null = null;
let cachedWindow: Window | null = null;

let slsIds = new Set<number>();
// LEGIT is only trustworthy once we know which games are ours. If the backend
// lookup ever fails, an SLSsteam game would otherwise fall through and be
// mislabelled as owned — so suppress LEGIT entirely until this is true.
let slsLoaded = false;
let everAddedIds = new Set<number>();
let denuvoIds = new Set<number>();
let onlineIds = new Set<number>();
let fixedIds = new Set<number>();
let opts = {
  sls: true, legit: true, denuvo: true, onlineFix: true, fixed: true,
  nonSteam: true, nonSteamName: true, library: true,
};
// appid -> derived app name (from the shortcut's target exe folder).
let nonSteamNames = new Map<number, string>();
const pendingDenuvo = new Set<number>();
let denuvoFlushTimer: ReturnType<typeof setTimeout> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/* ── the Big Picture / gamepad window that actually holds the grid ─────── */
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

/* ── styles ────────────────────────────────────────────────────────────── */
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
.${BADGE_CLASS}[data-kind="sls"] {
  background: linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%);
}
.${BADGE_CLASS}[data-kind="legit"] {
  background: linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%);
}
.${BADGE_CLASS}[data-kind="denuvo"] {
  background: linear-gradient(135deg, #a12a2a 0%, #e05252 100%);
}
.${BADGE_CLASS}[data-kind="onlinefix"] {
  background: linear-gradient(135deg, #7b5fd0 0%, #caa8ff 100%);
}
.${BADGE_CLASS}[data-kind="fixed"] {
  background: linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%);
}

`;
    win.document.head.appendChild(el);
  } catch {
    /* ignore */
  }
}

/* ── appid extraction (mirrors the reference plugin's fallbacks) ───────── */
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
    const anchor =
      capsule.tagName.toLowerCase() === "a" ? capsule : capsule.querySelector("a");
    const href = anchor?.getAttribute("href");
    if (href) {
      const m =
        href.match(/\/app\/(\d+)/i) ||
        href.match(/\/details\/(\d+)/i) ||
        href.match(/run\/(\d+)/i);
      if (m) return m[1];
    }
  } catch {
    /* ignore */
  }

  try {
    for (const el of [capsule, ...Array.from(capsule.children)]) {
      const key = Object.keys(el).find(
        (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")
      );
      if (!key) continue;
      let fiber = (el as any)[key];
      let depth = 0;
      while (fiber && depth < 5) {
        const p = fiber.memoizedProps || fiber.return?.memoizedProps;
        const id =
          p?.appid ?? p?.appId ?? p?.nAppID ?? p?.unAppID ?? p?.overview?.appid ??
          p?.appOverview?.appid ?? p?.app?.appid ?? p?.item?.appid;
        if (id) return String(id);
        fiber = fiber.return;
        depth++;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/* ── classification ────────────────────────────────────────────────────── */
type Kind = "sls" | "legit" | "denuvo" | "onlinefix" | "fixed" | "nonsteam" | "nonsteamname";

/** Non-Steam shortcuts: a NON-STEAM badge and/or an app-name badge, each
 *  independently toggleable. The name comes from the shortcut's exe folder. */
function classifyNonSteam(appid: number): Kind[] {
  if (!isNonSteamShortcut(appid)) return [];
  const out: Kind[] = [];
  if (opts.nonSteam) out.push("nonsteam");
  if (opts.nonSteamName && (nonSteamNames.get(appid) || "").trim()) out.push("nonsteamname");
  return out;
}

/** Primary badge: what the game IS in our terms. */
function classifyPrimary(appid: number): Kind | null {
  if (slsIds.has(appid)) return opts.sls ? "sls" : null;
  if (isNonSteamShortcut(appid)) return null; // shortcuts are neither
  // "Legit" means owned — it must never apply to store/search results for games
  // that merely appear in a list, so the library check is required here.
  if (!isInLibrary(appid)) return null;
  if (!slsLoaded) return null; // can't distinguish ours from owned yet
  // A game we ever added via SLSsteam isn't "owned" even if its manifest was
  // removed while it stays installed — so it must never badge as Legit.
  if (everAddedIds.has(appid)) return null;
  // A game we've applied a fix to is ours, not owned — never Legit.
  if (onlineIds.has(appid) || fixedIds.has(appid)) return null;
  return opts.legit ? "legit" : null;
}

/** Status badges: fixes we have actually installed for this game. */
function classifyApplied(appid: number): Kind[] {
  const out: Kind[] = [];
  if (opts.onlineFix && onlineIds.has(appid)) out.push("onlinefix");
  if (opts.fixed && fixedIds.has(appid)) out.push("fixed");
  return out;
}

/** Secondary badge (right): Denuvo, which can apply to SLS and owned alike. */
function classifyDenuvo(appid: number): boolean {
  if (!opts.denuvo) return false;
  if (isNonSteamShortcut(appid)) return false;
  if (denuvoIds.has(appid)) return true;
  // Not resolved yet — queue a throttled backend lookup for later passes.
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
    } catch {
      /* ignore */
    }
  }, 1200);
}

/* ── badge injection ───────────────────────────────────────────────────── */
function badgeCapsule(capsule: Element, win: Window) {
  const raw = getAppId(capsule);
  const box = capsule.querySelector(`.${BADGE_CLASS}-box`) as HTMLElement | null;
  const existing = Array.from(
    capsule.querySelectorAll(`.${BADGE_CLASS}`)
  ) as HTMLElement[];
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

  // Already correct — nothing to do.
  const current = existing
    .filter((b) => b.getAttribute("data-appid") === String(appid))
    .map((b) => b.getAttribute("data-kind"));
  if (
    current.length === wanted.length &&
    wanted.every((k) => current.includes(k))
  ) {
    return;
  }
  box?.remove();
  existing.forEach((b) => b.remove());

  const img = capsule.querySelector("img");
  const role = capsule.getAttribute("role");
  let target: HTMLElement | null = null;
  if (role === "gridcell") {
    target = img ? (capsule.querySelector("div") as HTMLElement) : (capsule as HTMLElement);
  } else if (role === "listitem") {
    target = img
      ? ((img.closest("div") as HTMLElement) ?? (capsule as HTMLElement))
      : (capsule as HTMLElement);
  }
  if (!target) target = capsule as HTMLElement;

  if (!target.hasAttribute(POSITIONED_ATTR)) {
    try {
      if (win.getComputedStyle(target).position === "static") {
        target.style.position = "relative";
      }
    } catch {
      /* ignore */
    }
    target.setAttribute(POSITIONED_ATTR, "true");
  }

  const container = win.document.createElement("div");
  container.className = `${BADGE_CLASS}-box`;
  // Inline styles so Steam's own capsule CSS can't override them (it strips the
  // text on some capsules when we rely on the injected stylesheet).
  container.style.cssText =
    "position:absolute;top:4px;left:4px;right:4px;z-index:9999;pointer-events:none;" +
    "display:flex;flex-wrap:wrap;gap:3px;";
  for (const kind of wanted) {
    const badge = win.document.createElement("div");
    badge.className = BADGE_CLASS;
    badge.setAttribute("data-appid", String(appid));
    badge.setAttribute("data-kind", kind);
    badge.textContent =
      kind === "nonsteamname" ? (nonSteamNames.get(appid) || "APP") : BADGE_LABELS[kind];
    badge.style.cssText =
      "flex:0 0 auto;white-space:nowrap;display:inline-block;overflow:visible;" +
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
      // Real game capsules nest role="link" below a panel layer; collection
      // tiles put it as the direct first child — skip those.
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

/* ── data refresh ──────────────────────────────────────────────────────── */
async function refreshData() {
  try {
    const r = await getBadgeOptions();
    if (r.success) {
      opts = {
        sls: !!r.sls,
        legit: !!r.legit,
        denuvo: !!r.denuvo,
        onlineFix: !!r.onlineFix,
        fixed: !!r.fixed,
        nonSteam: !!r.nonSteam,
        nonSteamName: !!r.nonSteamName,
        library: !!r.library,
      };
    }
  } catch {
    /* keep previous */
  }
  try {
    // Only pull the (backend-parsed) shortcut names when a name badge is on.
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
  } catch {
    /* keep previous names */
  }
  try {
    const r = await getInstalledApps();
    if (r.success) {
      slsIds = new Set((r.apps || []).map((a) => Number(a.appid)));
      slsLoaded = true;
    }
  } catch {
    /* keep previous set */
  }
  try {
    const r = await getEverAdded();
    if (r.success) everAddedIds = new Set((r.appids || []).map((a) => Number(a)));
  } catch {
    /* keep previous set; slsLoaded stays as-is so LEGIT is suppressed on a
       cold-start failure but survives a transient refresh error */
  }
  try {
    const r = await denuvoKnown();
    if (r.success) denuvoIds = new Set(r.denuvo || []);
  } catch {
    /* keep previous */
  }
  try {
    const r = await getInstalledFixes();
    if (r.success) {
      // One applied-fix badge per game: online fix → ONLINE FIX, else FIXED.
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
    }
  } catch {
    /* keep previous */
  }
}

/* ── public API ────────────────────────────────────────────────────────── */
export function removeAllBadges() {
  const win = getLibraryWindow();
  if (!win) return;
  try {
    win.document.querySelectorAll(`.${BADGE_CLASS}`).forEach((b) => b.remove());
  } catch {
    /* ignore */
  }
}

export async function startBadges() {
  stopBadges();
  await refreshData();

  // The library grid is its own surface — off means no capsule badges at all.
  if (!opts.library) {
    removeAllBadges();
    return;
  }
  if (!opts.sls && !opts.legit && !opts.denuvo && !opts.onlineFix && !opts.fixed) return;

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
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (rafHandle != null) {
    cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}

/** Re-read settings and repaint (call after toggling a badge option). */
export async function refreshBadges() {
  removeAllBadges();
  await startBadges();
}
