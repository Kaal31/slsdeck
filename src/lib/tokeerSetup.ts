import { tokeerEnsureProton, tokeerEnsureRuntime, tokeerPreflight, tokeerVerify, TokeerVerifyResult } from "../api";
import { configureTokeerLaunch } from "./fixRuntime";
import { launchGame } from "./launchGame";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type TokeerSetupResult = TokeerVerifyResult & {
  runtimeUpdated?: boolean;
  runtimeVersion?: string;
  proton?: string;
  protonSkipped?: boolean;
  launchOptions?: string;
  error?: string;
};

export function describeTokeerFailure(result: TokeerVerifyResult | TokeerSetupResult): string {
  const checks = result.checks;
  if (checks) {
    const failed: string[] = [];
    if (!checks.installed) failed.push("game installation");
    if (!checks.prefix) failed.push("Proton prefix");
    if (!checks.hook) failed.push("native hook");
    if (!checks.launchOpt) failed.push("launch option");
    if (failed.length) {
      const detected = checks.proton ? ` Detected compatibility layer: ${checks.proton}.` : "";
      return `Tokeer validation failed: ${failed.join(", ")}.${detected}`;
    }
    if (!result.code) return "Tokeer setup checks passed, but no TLX1 verification code was generated.";
  }
  return result.error || "Tokeer validation failed.";
}

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
  onStatus?.("Confirming that the game is installed…");
  const preflight = await tokeerPreflight(appid, "");
  if (!preflight.success || !preflight.installed) {
    return {
      success: false,
      checks: { installed: false, prefix: false, hook: false, launchOpt: false, proton: null },
      error: preflight.error || "Game is not installed. Install it completely before using Tokeer.",
    };
  }

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
  onStatus?.(
    proton.skipped
      ? `${requiredProton} is already installed and healthy; skipping download. Merging Steam launch options live…`
      : `${requiredProton} installed/repaired. Selecting it and merging Steam launch options live…`
  );
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

  const result: TokeerSetupResult = {
    ...verified,
    runtimeUpdated: !!runtime.updated,
    runtimeVersion: runtime.version,
    proton: requiredProton,
    protonSkipped: !!proton.skipped,
    launchOptions: configured.options,
  };
  if (!result.success && !result.error) result.error = describeTokeerFailure(result);
  return result;
}
