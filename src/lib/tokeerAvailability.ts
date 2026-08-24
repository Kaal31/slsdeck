import { fetchNoCors } from "@decky/api";
import {
  connectTokeerDiscordHidden,
  openSelectorAndReadOptions,
  readTokeerDiscord,
  restoreTokeerTicketView,
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
    // Discord and Steam disagree on straight/curly apostrophes surprisingly
    // often ("Assassin’s", "Assassin's", "Assassins"). Apostrophes are part of
    // a word here, so removing them is more accurate than turning them into a
    // separator and producing the unmatchable "assassin s".
    .replace(/['’‘`´]/g, "")
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
let refreshGeneration = 0;

// Upper bound on one availability refresh. Generous enough for a slow Discord
// render, short enough that a stuck panel degrades to cached/unknown quickly
// instead of pinning the UI.
const REFRESH_BUDGET_MS = 25000;

function remaining(deadline: number, cap = 5000): number {
  return Math.max(1, Math.min(cap, deadline - Date.now()));
}

async function beforeDeadline<T>(work: Promise<T>, deadline: number, fallback: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), remaining(deadline, REFRESH_BUDGET_MS))),
  ]);
}

export function cancelTokeerAvailabilityRefresh(): void {
  refreshGeneration += 1;
  refreshPromise = null;
}

function activeTicketUrl(): string {
  try {
    const session = JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
    if (!session || (session.expiresAt && Number(session.expiresAt) <= Date.now())) return "";
    return String(session.ticket?.url || "");
  } catch { return ""; }
}

export async function refreshTokeerAvailabilityCache(force = false): Promise<TokeerAvailabilityCache | null> {
  const current = readTokeerAvailabilityCache();
  // Avoid hammering Discord within the short freshness window. After that,
  // callers still receive the cache immediately, but one background refresh is
  // started even though the six-hour cache remains usable as a fallback.
  if (!force && current && Date.now() - current.updatedAt < TOKEER_FIX_FRESH_MS) return current;
  const savedTicketUrl = activeTicketUrl();
  // No vault scrape, including a forced caller refresh, may navigate Discord
  // away from an active private ticket.
  if (savedTicketUrl) return current;
  if (refreshPromise) return refreshPromise;
  const generation = ++refreshGeneration;
  const run = (async () => {
    // Hard wall-clock budget for the WHOLE refresh. The old loop bounded only the
    // number of retries (20 x 500ms), but each readTokeerDiscord can itself take
    // seconds (target resolution + a 5s Runtime.evaluate), so a Discord page that
    // never renders the panel could hold this for minutes — which is what left
    // Fixes stuck on "checking" and starved every later call behind it.
    const deadline = Date.now() + REFRESH_BUDGET_MS;
    const outOfTime = () => Date.now() > deadline;
    const cancelled = () => generation !== refreshGeneration;
    try {
      if (!(await beforeDeadline(connectTokeerDiscordHidden(), deadline, false))) return force ? null : current;
      if (cancelled()) return current;
      let state = await beforeDeadline(readTokeerDiscord(true), deadline, { found: false, selectors: [], error: "Discord snapshot timed out." });
      while (!state.found && !outOfTime() && !cancelled()) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state = await beforeDeadline(readTokeerDiscord(true), deadline, { found: false, selectors: [], error: "Discord snapshot timed out." });
      }
      if (!state.found || cancelled()) return force ? null : current;
      const parsed: TokeerAvailableGame[] = [];
      for (const selector of state.selectors || []) {
        if (outOfTime() || cancelled()) break;
        const labels = await beforeDeadline(openSelectorAndReadOptions(selector.index, remaining(deadline)), deadline, [] as string[]);
        for (const label of labels) {
          const game = parseTokeerGameLabel(label);
          if (game && (game.remaining === undefined || game.remaining > 0)) parsed.push(game);
        }
      }
      // Do not replace a populated game cache with an empty scrape caused by a
      // temporarily unrendered Discord menu. Vault-only snapshots may still seed
      // a new cache on first use.
      if (cancelled()) return current;
      if (!parsed.length && current?.games.length) return force ? null : current;
      return writeCache(state, parsed);
    } catch {
      return force ? null : current;
    } finally {
      if (savedTicketUrl) {
        try { await restoreTokeerTicketView(savedTicketUrl); } catch {}
      }
      if (generation === refreshGeneration) refreshPromise = null;
    }
  })();
  refreshPromise = run;
  if (!force && current) {
    void run.catch(() => null);
    return current;
  }
  return run;
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
  const base = [
    normalizeTokeerGameName(raw),
    normalizeTokeerGameName(raw.replace(/[®™©]/g, "")),
    normalizeTokeerGameName(roman),
  ].filter(Boolean);
  const aliases: string[] = [];
  for (const name of base) {
    // Tokeer's Discord menus commonly abbreviate the series while Steam uses
    // its full store title. Keep both forms in the shared matcher.
    if (/^assassins? creed\s+/.test(name)) aliases.push(name.replace(/^assassins? creed\s+/, "ac "));
    if (/^ac\s+/.test(name)) aliases.push(name.replace(/^ac\s+/, "assassins creed "));
    // The vault currently appends availability/marketing qualifiers that are
    // not part of Steam's library title (for example "Assassin's Creed Shadows
    // Free" and "Avatar: Frontiers of Pandora Free"). Match only when such a
    // qualifier is trailing, so meaningful words inside a title stay intact.
    aliases.push(name.replace(/\s+(?:(?:standard|deluxe|ultimate|complete) edition|free(?: trial)?|trial)$/i, ""));
  }
  return Array.from(new Set([...base, ...aliases].filter(Boolean)));
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
  const wanted = new Set(nameVariants(gameName || ""));
  return wanted.size
    ? cache.games.find((game) => nameVariants(game.name).some((variant) => wanted.has(variant))) || null
    : null;
}

export function isTokeerGameAvailable(appid: number, gameName?: string): boolean {
  return !!getTokeerAvailabilityForGame(appid, gameName);
}
