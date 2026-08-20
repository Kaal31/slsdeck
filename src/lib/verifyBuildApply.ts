// Post-pin verification: prove the pin landed AND that a download will actually
// happen — the two things that silently fail when "Install build" seems to do
// nothing.
//
// The classic failure is a "phantom install": Steam is told to install/pin an
// app whose depots it can't resolve (injection off, or the build's manifests
// never resolved), so it writes the appmanifest as FullyInstalled with 0 bytes
// and then never downloads. Play does nothing. We detect that from the ACF
// StateFlags + SizeOnDisk (via appDownloadComplete) and point the user at the
// existing "Fix installed-but-empty" repair instead of leaving them stuck.
import { getPinStatus, appDownloadComplete, injectionHealth } from "../api";

// Steam AppState StateFlags bits we care about.
const ST_UPDATE_REQUIRED = 2;
const ST_FULLY_INSTALLED = 4;
const ST_UPDATE_RUNNING = 0x100;   // 256
const ST_UPDATE_STARTED = 0x200;   // 512
const ST_DOWNLOADING = 0x100000;   // 1048576
const ST_STAGING = 0x200000;       // 2097152

export interface BuildVerdict {
  ok: boolean;
  phantom: boolean;
  text: string;
}

export async function verifyBuildApply(appid: number, wantBuild: string): Promise<BuildVerdict> {
  // 1) Did the pin actually get written? If not, resolution failed — almost
  //    always "SteamDB history not available" (sign in) or no manifest source.
  let pinned = false;
  let pinBuild = "";
  try {
    const p = await getPinStatus(appid);
    pinned = !!p.pinned;
    pinBuild = p.buildid || "";
  } catch { /* treat as not pinned */ }
  if (!pinned) {
    return {
      ok: false, phantom: false,
      text: "Pin didn't take — couldn't resolve that build's manifests. Sign into SteamDB (top-right → through Steam) so the full depot history loads, then retry.",
    };
  }

  // 2) Injection must be active or Steam can't resolve the pinned depots.
  let injected = true;
  try {
    const h = await injectionHealth();
    injected = !!h.active;
  } catch { /* assume on */ }

  // 3) Read Steam's own appmanifest state.
  let flags = 0;
  let size = 0;
  try {
    const d = await appDownloadComplete(appid);
    flags = d.stateFlags || 0;
    size = d.sizeOnDisk || 0;
  } catch { /* no manifest yet */ }

  const installedFlag = !!(flags & ST_FULLY_INSTALLED);
  const updating = !!(flags & (ST_UPDATE_REQUIRED | ST_UPDATE_RUNNING | ST_UPDATE_STARTED | ST_DOWNLOADING | ST_STAGING));
  const phantom = installedFlag && size === 0;

  const build = pinBuild || wantBuild;

  if (phantom) {
    return {
      ok: false, phantom: true,
      text: injected
        ? `Pinned build ${build}, but Steam marked it installed with 0 bytes — a phantom install, which is why nothing downloads. Run Tools → "Fix installed-but-empty", then launch the game to download.`
        : `Pinned build ${build}, but injection is OFF, so Steam can't resolve the depots (phantom install). Turn injection on in Dependencies, then retry.`,
    };
  }
  if (updating) {
    return { ok: true, phantom: false, text: `Pinned build ${build} ✓ — Steam has the update queued/downloading.` };
  }
  // Installed with real bytes and no update flag: either already on this build,
  // or Steam hasn't noticed the manifest change yet — a launch makes it check.
  return {
    ok: true, phantom: false,
    text: `Pinned build ${build} ✓ — if the download doesn't start, launch the game to make Steam update to it.`,
  };
}
