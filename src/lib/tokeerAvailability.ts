import {
  connectTokeerDiscordHidden,
  openSelectorAndReadOptions,
  readTokeerDiscord,
  TokeerDiscordState,
} from "./tokeerDiscordCapture";

const CACHE_KEY = "slsdeck.tokeerAvailability.v1";
export const TOKEER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

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

export async function refreshTokeerAvailabilityCache(force = false): Promise<TokeerAvailabilityCache | null> {
  const current = readTokeerAvailabilityCache();
  if (!force && current && Date.now() - current.updatedAt < TOKEER_CACHE_TTL_MS) return current;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      if (!(await connectTokeerDiscordHidden())) return current;
      let state = await readTokeerDiscord();
      for (let i = 0; i < 20 && !state.found; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state = await readTokeerDiscord();
      }
      if (!state.found) return current;
      const parsed: TokeerAvailableGame[] = [];
      for (const selector of state.selectors || []) {
        const labels = await openSelectorAndReadOptions(selector.index);
        for (const label of labels) {
          const game = parseTokeerGameLabel(label);
          if (game && (game.remaining === undefined || game.remaining > 0)) parsed.push(game);
        }
      }
      // Do not replace a populated game cache with an empty scrape caused by a
      // temporarily unrendered Discord menu. Vault-only snapshots may still seed
      // a new cache on first use.
      if (!parsed.length && current?.games.length) return current;
      return writeCache(state, parsed);
    } catch {
      return current;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
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
