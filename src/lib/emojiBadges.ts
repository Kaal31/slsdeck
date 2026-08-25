export const EMOJI_BADGE_STORAGE_KEY = "slsdeck.emojiBadges";

export const EMOJI_BADGE_LABELS: Record<string, string> = {
  sls: "🏴‍☠️",
  legit: "💵",
  fixed: "🔧",
  tokeer: "🔑",
  onlinefix: "🌐",
  denuvo: "👺",
  nonsteam: "❓",
};

export function getEmojiBadgesEnabled(): boolean {
  try {
    return window.localStorage.getItem(EMOJI_BADGE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setEmojiBadgesEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(EMOJI_BADGE_STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent("slsdeck-emoji-badges", { detail: enabled }));
  } catch {
    /* ignore */
  }
}

export function badgeDisplayLabel(kind: string, fallback: string): string {
  return getEmojiBadgesEnabled() ? (EMOJI_BADGE_LABELS[kind] || fallback) : fallback;
}
