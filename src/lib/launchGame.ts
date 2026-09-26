// Force Steam to download/update a game to its pinned build by launching it.
//
// Pinning a build only changes the *target* manifest; Steam won't fetch the new
// files until something makes it re-check. API "install|appid" reaches
// SLSsteam-added games through Moon's private per-user runtime socket. For an
// owned game it can still be a no-op, so "pinned, waiting for download" can sit
// forever. Launching makes Steam run its normal update-before-play check; when
// the installed manifest differs from the pinned target, the target build
// downloads first. Works for owned and added games alike.
//
// For a Steam app the RunGame gameId is just the appid (non-Steam shortcuts use a
// 64-bit gameID; we only pin real Steam apps here).
export function launchGame(appid: number): boolean {
  try {
    const SC: any = (window as any).SteamClient;
    if (!SC?.Apps?.RunGame) return false;
    SC.Apps.RunGame(String(appid), "", -1, 100);
    return true;
  } catch {
    return false;
  }
}
