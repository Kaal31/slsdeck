import { tokeerEaVerify, tokeerEnsureProton, tokeerEnsureRuntime, tokeerPreflight, tokeerProtonChoice, tokeerVerify, TokeerVerifyResult } from "../api";
import { configureTokeerLaunch, getCurrentLaunchOptions } from "./fixRuntime";
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
  // Dependency/preflight failures sometimes carry an all-false placeholder
  // check object because no verifier ran. Keep their actionable error (for
  // example a missing appmanifest) instead of misreporting four check failures.
  if (result.error && !/^Tokeer setup checks failed:/i.test(result.error)) {
    return result.error;
  }
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
  if (result.error) return result.error;
  const output = (result.output || "").trim();
  if (output) {
    const exit = typeof result.returnCode === "number" ? ` (exit ${result.returnCode})` : "";
    return `Tokeer verifier failed${exit}.\n\nVerifier output:\n${output.slice(-12000)}`;
  }
  return "Tokeer validation failed without a structured report or diagnostic output.";
}

/**
 * Restart-free Tokeer setup:
 *  1. update Linux runtime when the Forgejo release asset changes;
 *  2. use upstream per-game Proton selection, installing GE only for legacy;
 *  3. select Proton and merge launch options through SteamClient live;
 *  4. launch only when the per-game prefix is still missing;
 *  5. run the official local verifier.
 */
export async function setupAndVerifyTokeer(
  appid: number,
  onStatus?: (message: string) => void,
  mode: boolean | "ea" = false
): Promise<TokeerSetupResult> {
  const ubisoft = mode === true;
  const ea = mode === "ea";
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
      ? `Tokeer ${runtime.version || "latest"} updated. Reading its Proton policy…`
      : `Tokeer ${runtime.version || "runtime"} current. Reading its Proton policy…`
  );
  const choice = await tokeerProtonChoice(appid);
  if (!choice.success || !choice.name) {
    return { success: false, runtimeUpdated: !!runtime.updated,
      runtimeVersion: runtime.version,
      error: choice.error || "Tokeer could not choose a compatible Proton." };
  }

  // Only legacy bundles need GE-Proton10-34. Current upstream chooses Valve
  // Proton per game and Steam itself installs those runtimes on first launch.
  let protonSkipped = !choice.requiresInstall;
  if (choice.requiresInstall) {
    onStatus?.(`Legacy Tokeer requires ${choice.name}; checking its installation…`);
    const proton = await tokeerEnsureProton();
    if (!proton.success) {
      return { success: false, runtimeUpdated: !!runtime.updated,
        runtimeVersion: runtime.version,
        error: proton.error || `Could not install ${choice.name}.` };
    }
    protonSkipped = !!proton.skipped;
  }
  onStatus?.(`Tokeer selected ${choice.name} for AppID ${appid}. Merging Steam launch options live…`);
  const configured = await configureTokeerLaunch(appid, runtime.home, choice.name);
  if (!configured.success) {
    return { success: false, runtimeUpdated: !!runtime.updated,
      runtimeVersion: runtime.version, proton: choice.name,
      error: configured.error || "Could not configure Tokeer launch options." };
  }
  if (configured.usedFallback) {
    onStatus?.(`${choice.name} is not registered with Steam yet; using ${configured.proton} instead.`);
  }

  onStatus?.("Checking the game setup…");
  // Steam's app-details/read-back cache can lag immediately after
  // SetAppLaunchOptions even though the write was accepted (and is already
  // visible in Settings). For this first verification, use the exact value we
  // just submitted. Subsequent/manual verification still reads Steam live.
  const justWrittenLaunchOptions = configured.options || getCurrentLaunchOptions(appid);
  let verified = ea
    ? await tokeerEaVerify(appid)
    : await tokeerVerify(appid, ubisoft, justWrittenLaunchOptions);
  if (!verified.success && !verified.checks?.prefix) {
    onStatus?.("Creating the Proton prefix with one game launch—Steam will stay open…");
    launchGame(appid);
    for (let attempt = 0; attempt < 30; attempt++) {
      await sleep(2000);
      const liveLaunchOptions = getCurrentLaunchOptions(appid);
      verified = ea
        ? await tokeerEaVerify(appid)
        : await tokeerVerify(appid, ubisoft, liveLaunchOptions || justWrittenLaunchOptions);
      if (verified.success || verified.checks?.prefix) break;
    }
  }

  const result: TokeerSetupResult = {
    ...verified,
    runtimeUpdated: !!runtime.updated,
    runtimeVersion: runtime.version,
    proton: configured.proton || choice.name,
    protonSkipped,
    launchOptions: configured.options,
  };
  if (!result.success && !result.error) result.error = describeTokeerFailure(result);
  return result;
}
