export const ROULETTE_QAM_KEY = "slsdeck.storeRoulette.quickAccess";
export const ROULETTE_TAB_DISABLED_KEY = "slsdeck.storeRoulette.tabDisabled";
export const ROULETTE_PRICE_KEY = "slsdeck.storeRoulette.minPrice";
export const ROULETTE_FILTERS_KEY = "slsdeck.storeRoulette.filters";
export const ROULETTE_PREFS_EVENT = "slsdeck-store-roulette-prefs";

export interface StoreRouletteFilters {
  genre: string;
  players: string;
  deck: string;
  minRating: number;
  minReviews: number;
  releaseFrom: number;
  releaseTo: number;
}

export const DEFAULT_ROULETTE_FILTERS: StoreRouletteFilters = {
  genre: "",
  players: "",
  deck: "",
  minRating: 0,
  minReviews: 0,
  releaseFrom: 0,
  releaseTo: 0,
};

export function readRouletteBool(key: string): boolean {
  try { return window.localStorage.getItem(key) === "1"; } catch { return false; }
}

export function writeRouletteBool(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
    window.dispatchEvent(new CustomEvent(ROULETTE_PREFS_EVENT, { detail: { key, value } }));
  } catch { /* ignore */ }
}

export function readRoulettePrice(): number {
  try {
    const value = Number(window.localStorage.getItem(ROULETTE_PRICE_KEY) || 0);
    return [0, 6000, 10000, 100000].includes(value) ? value : 0;
  } catch { return 0; }
}

export function writeRoulettePrice(value: number): void {
  try { window.localStorage.setItem(ROULETTE_PRICE_KEY, String(value)); } catch { /* ignore */ }
}

export function readRouletteFilters(): StoreRouletteFilters {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ROULETTE_FILTERS_KEY) || "{}");
    return {
      genre: typeof parsed.genre === "string" ? parsed.genre : "",
      players: typeof parsed.players === "string" ? parsed.players : "",
      deck: typeof parsed.deck === "string" ? parsed.deck : "",
      minRating: Math.max(0, Math.min(100, Number(parsed.minRating) || 0)),
      minReviews: Math.max(0, Number(parsed.minReviews) || 0),
      releaseFrom: Math.max(0, Number(parsed.releaseFrom) || 0),
      releaseTo: Math.max(0, Number(parsed.releaseTo) || 0),
    };
  } catch { return { ...DEFAULT_ROULETTE_FILTERS }; }
}

export function writeRouletteFilters(value: StoreRouletteFilters): void {
  try {
    window.localStorage.setItem(ROULETTE_FILTERS_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(ROULETTE_PREFS_EVENT, { detail: { key: ROULETTE_FILTERS_KEY, value } }));
  } catch { /* ignore */ }
}
