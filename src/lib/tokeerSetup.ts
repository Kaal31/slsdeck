import { tokeerEnsureProton, tokeerEnsureRuntime, tokeerVerify, TokeerVerifyResult } from "../api";
import { configureTokeerLaunch } from "./fixRuntime";
import { launchGame } from "./launchGame";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type TokeerSetupResult = TokeerVerifyResult & {
  runtimeUpdated?: boolean;
  runtimeVersion?: string;
  proton?: string;
  launchOptions?: string;
  error?: string;
};

/**
 * Restart-free Tokeer setup:
 *  1. update shared runtime only when its GitHub release changed;
 *  2. install upstream's exact GE-Proton requirement without editing VDF;
 *  3. select Proton and merge launch options through SteamClient live;
 *  4. launch only when the per-game prefix is still missing;
 *  5. run the official local verifier.
 */
export async function setupAndVerifyTokeer(
  appid: number,
  onStatus?: (message: string) => void
): Promise<TokeerSetupResult> {
  onStatus?.("Checking Tokeer runtime version…");
  const runtime = await tokeerEnsureRuntime();
  if (!runtime.success || !runtime.home) {
    return { success: false, error: runtime.error || "Could not install the Tokeer runtime." };
  }

  onStatus?.(
    runtime.updated
      ? `Tokeer ${runtime.version || "latest"} installed. Checking required Proton…`
      : `Tokeer ${runtime.version || "runtime"} is current; skipping download. Checking required Proton…`
  );
  const proton = await tokeerEnsureProton();
  if (!proton.success) {
    return {
      success: false,
      runtimeUpdated: !!runtime.updated,
      runtimeVersion: runtime.version,
      error: proton.error || `Could not install ${runtime.requiredProton || "GE-Proton10-34"}.`,
    };
  }

  const requiredProton = proton.name || runtime.requiredProton || "GE-Proton10-34";
  onStatus?.(`Configuring ${requiredProton} and merging Steam launch options live…`);
  const configured = configureTokeerLaunch(appid, runtime.home, requiredProton);
  if (!configured.success) {
    return {
      success: false,
      runtimeUpdated: !!runtime.updated,
      runtimeVersion: runtime.version,
      proton: requiredProton,
      error: configured.error || "Could not configure Tokeer launch options.",
    };
  }

  onStatus?.("Checking the game setup…");
  let verified = await tokeerVerify(appid);
  if (!verified.success && !verified.checks?.prefix) {
    onStatus?.("Creating the Proton prefix with one game launch—Steam will stay open…");
    launchGame(appid);
    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(2000);
      verified = await tokeerVerify(appid);
      if (verified.success || verified.checks?.prefix) break;
    }
  }

  return {
    ...verified,
    runtimeUpdated: !!runtime.updated,
    runtimeVersion: runtime.version,
    proton: requiredProton,
    launchOptions: configured.options,
  };
}
