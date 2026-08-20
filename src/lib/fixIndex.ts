// Online fixes come only from the perondepot mirror (resolved by the backend,
// matched by game name). The rate-limited luatools catalog index has been
// removed, so this is just a thin wrapper that passes the Steam display name to
// the backend for the perondepot name match.

import { FixCheck, checkFixes } from "../api";
import { appDisplayName } from "./fixRuntime";

export async function checkFixesFull(appid: number): Promise<FixCheck> {
  return checkFixes(appid, appDisplayName(appid));
}
