// Force Steam to download/update a game to its pinned build by launching it.
//
// Pinning a build only changes the *target* manifest; Steam won't fetch the new
// files until something makes it re-check. Our IPC trigger (/tmp/SLSsteam.API
// "install|appid") only reaches SLSsteam-added games — for a game the account
// actually owns it's a no-op, which is why "pinned, waiting for download" can sit
// forever. Launching the game makes Steam run its normal update-before-play
// check, so a build whose installed manifest differs from the pinned target
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
