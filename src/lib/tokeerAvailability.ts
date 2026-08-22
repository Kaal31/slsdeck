import { fetchNoCors } from "@decky/api";
import {
  connectTokeerDiscordHidden,
  openSelectorAndReadOptions,
  readTokeerDiscord,
  TokeerDiscordState,
} from "./tokeerDiscordCapture";

const CACHE_KEY = "slsdeck.tokeerAvailability.v1";
const SESSION_KEY = "slsdeck.tokeerSession.v1";
export const TOKEER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const TOKEER_FIX_FRESH_MS = 2 * 60 * 1000;

export function hasFreshTokeerFixCache(cache = readTokeerAvailabilityCache()): boolean {
  return !!cache && Date.now() - cache.updatedAt < TOKEER_FIX_FRESH_MS;
}

export type TokeerAvailableGame = {
  label: string;
  name: string;
  remaining?: number;
  total?: number;
  percent?: number;
  appid?: number;
};

export type TokeerAvailabilityCache = {
  version: 1;
  updatedAt: number;
  vault: {
    steamStatus?: string;
    gamesListed?: number;
    steamGames?: number;
    eaGames?: number;
    ubisoftGames?: number;
    keysRemaining?: number;
    highDemand?: number;
  };
  games: TokeerAvailableGame[];
};

function finite(value: any): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeTokeerGameName(value: string): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[®™©]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function parseTokeerGameLabel(label: string): TokeerAvailableGame | null {
  const text = String(label || "").replace(/\s+/g, " ").trim();
  const availability = text.match(/^(.*?)\s+(\d+)\s+of\s+(\d+)\s+remaining(?:\s*\((\d+)%\))?/i);
  if (!availability) return null;
  const rawName = availability[1].trim();
  const appidMatch = text.match(/(?:app\s*id|appid)\s*[:#-]?\s*(\d{3,10})/i);
  const name = rawName.replace(/\s*[-–—(]*\s*(?:app\s*id|appid)\s*[:#-]?\s*\d{3,10}\)?\s*$/i, "").trim();
  return {
    label: text,
    name,
    remaining: finite(availability[2]),
    total: finite(availability[3]),
    percent: finite(availability[4]),
    appid: appidMatch ? finite(appidMatch[1]) : undefined,
  };
}

export function readTokeerAvailabilityCache(): TokeerAvailabilityCache | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
    if (!value || value.version !== 1 || !Array.isArray(value.games)) return null;
    return value;
  } catch {
    return null;
  }
}

function writeCache(state: TokeerDiscordState, games: TokeerAvailableGame[]): TokeerAvailabilityCache {
  const deduped = new Map<string, TokeerAvailableGame>();
  for (const game of games) {
    const key = game.appid ? `appid:${game.appid}` : `name:${normalizeTokeerGameName(game.name)}`;
    if (!key.endsWith(":") && !deduped.has(key)) deduped.set(key, game);
  }
  const cache: TokeerAvailabilityCache = {
    version: 1,
    updatedAt: Date.now(),
    vault: {
      steamStatus: state.steamStatus,
      gamesListed: state.gamesListed,
      steamGames: state.steamGames,
      eaGames: state.eaGames,
      ubisoftGames: state.ubisoftGames,
      keysRemaining: state.keysRemaining,
      highDemand: state.highDemand,
    },
    games: Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new CustomEvent("slsdeck-tokeer-cache", { detail: cache }));
  } catch {}
  return cache;
}

let refreshPromise: Promise<TokeerAvailabilityCache | null> | null = null;

// Upper bound on one availability refresh. Generous enough for a slow Discord
// render, short enough that a stuck panel degrades to cached/unknown quickly
// instead of pinning the UI.
const REFRESH_BUDGET_MS = 25000;

function hasActiveTicketSession(): boolean {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    return !!session && (!session.expiresAt || Number(session.expiresAt) > Date.now()) &&
      !!(session.ticket?.opened || session.ticket?.url || session.gate);
  } catch { return false; }
}

export async function refreshTokeerAvailabilityCache(force = false): Promise<TokeerAvailabilityCache | null> {
  const current = readTokeerAvailabilityCache();
  if (!force && current && Date.now() - current.updatedAt < TOKEER_CACHE_TTL_MS) return current;
  // Never navigate the managed Discord target away from a live private ticket.
  // A forced caller gets null so it cannot mistake stale cache for a live check.
  if (hasActiveTicketSession()) return force ? null : current;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    // Hard wall-clock budget for the WHOLE refresh. The old loop bounded only the
    // number of retries (20 x 500ms), but each readTokeerDiscord can itself take
    // seconds (target resolution + a 5s Runtime.evaluate), so a Discord page that
    // never renders the panel could hold this for minutes — which is what left
    // Fixes stuck on "checking" and starved every later call behind it.
    const deadline = Date.now() + REFRESH_BUDGET_MS;
    const outOfTime = () => Date.now() > deadline;
    try {
      if (!(await connectTokeerDiscordHidden())) return force ? null : current;
      let state = await readTokeerDiscord(true);
      while (!state.found && !outOfTime()) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state = await readTokeerDiscord(true);
      }
      if (!state.found) return force ? null : current;
      const parsed: TokeerAvailableGame[] = [];
      for (const selector of state.selectors || []) {
        if (outOfTime()) break;
        const labels = await openSelectorAndReadOptions(selector.index);
        for (const label of labels) {
          const game = parseTokeerGameLabel(label);
          if (game && (game.remaining === undefined || game.remaining > 0)) parsed.push(game);
        }
      }
      // Do not replace a populated game cache with an empty scrape caused by a
      // temporarily unrendered Discord menu. Vault-only snapshots may still seed
      // a new cache on first use.
      if (!parsed.length && current?.games.length) return force ? null : current;
      return writeCache(state, parsed);
    } catch {
      return force ? null : current;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

const ROMAN_TO_ARABIC: Record<string, string> = {
  I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6", VII: "7",
  VIII: "8", IX: "9", X: "10", XI: "11", XII: "12", XIII: "13",
  XIV: "14", XV: "15", XVI: "16", XVII: "17", XVIII: "18", XIX: "19", XX: "20",
};

function decodeHtmlTitle(value: string): string {
  return String(value || "")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&colon;/gi, ":").replace(/\s+on Steam$/i, "").trim();
}

function nameVariants(value: string): string[] {
  const raw = String(value || "").replace(/_/g, " ").trim();
  if (!raw) return [];
  const roman = raw.split(/\s+/).map((word) => ROMAN_TO_ARABIC[word.toUpperCase()] || word).join(" ");
  return Array.from(new Set([
    normalizeTokeerGameName(raw),
    normalizeTokeerGameName(raw.replace(/[®™©]/g, "")),
    normalizeTokeerGameName(roman),
  ].filter(Boolean)));
}

async function steamNameCandidates(appid: number, hint?: string): Promise<string[]> {
  const values = new Set<string>();
  if (hint) values.add(hint);
  try {
    const store: any = (window as any).appStore;
    const overview =
      store?.GetAppOverviewByGameID?.(appid) ||
      store?.GetAppOverviewByAppID?.(appid);
    if (overview?.display_name) values.add(String(overview.display_name));
  } catch {}
  try {
    const response = await fetchNoCors(`https://store.steampowered.com/app/${encodeURIComponent(appid)}`, { method: "GET" } as any);
    const html = await response.text();
    const title = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)/i)?.[1];
    if (title) values.add(decodeHtmlTitle(title));
    const slug =
      response.url?.match(/\/app\/\d+\/([^/?#]+)/i)?.[1] ||
      html.match(/<meta\s+property=["']og:url["']\s+content=["'][^"']*\/app\/\d+\/([^/"']+)/i)?.[1];
    if (slug) values.add(decodeURIComponent(slug).replace(/_/g, " "));
  } catch {}
  return Array.from(values);
}

export async function resolveTokeerAvailabilityForGame(appid: number, gameName?: string): Promise<TokeerAvailableGame | null> {
  const cache = readTokeerAvailabilityCache();
  if (!cache) return null;
  const byAppid = cache.games.find((game) => game.appid === appid);
  if (byAppid) return byAppid;
  const candidates = new Set<string>();
  for (const name of await steamNameCandidates(appid, gameName)) {
    for (const variant of nameVariants(name)) candidates.add(variant);
  }
  return cache.games.find((game) =>
    nameVariants(game.name).some((variant) => candidates.has(variant))
  ) || null;
}

export function getTokeerAvailabilityForGame(appid: number, gameName?: string): TokeerAvailableGame | null {
  const cache = readTokeerAvailabilityCache();
  if (!cache) return null;
  const byAppid = cache.games.find((game) => game.appid === appid);
  if (byAppid) return byAppid;
  const wanted = normalizeTokeerGameName(gameName || "");
  return wanted
    ? cache.games.find((game) => normalizeTokeerGameName(game.name) === wanted) || null
    : null;
}

export function isTokeerGameAvailable(appid: number, gameName?: string): boolean {
  return !!getTokeerAvailabilityForGame(appid, gameName);
}
