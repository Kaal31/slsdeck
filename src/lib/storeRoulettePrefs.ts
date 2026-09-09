export const ROULETTE_QAM_KEY = "slsdeck.storeRoulette.quickAccess";
export const ROULETTE_TAB_DISABLED_KEY = "slsdeck.storeRoulette.tabDisabled";
export const ROULETTE_PRICE_KEY = "slsdeck.storeRoulette.minPrice";
export const ROULETTE_PREFS_EVENT = "slsdeck-store-roulette-prefs";

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
