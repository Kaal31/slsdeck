// Shared by QAM, library and store: coalesce lookups and bound the loading UI.
import { FixCheck, checkFixes } from "../api";
import { appDisplayName } from "./fixRuntime";

const pending = new Map<number, Promise<FixCheck>>();
const cached = new Map<number, { value: FixCheck; time: number }>();
let sourceGeneration = 0;
window.addEventListener("slsdeck-fix-sources-changed", () => {
  sourceGeneration++;
  cached.clear();
  pending.clear();
});

export function checkFixesFull(appid: number): Promise<FixCheck> {
  const existing = pending.get(appid);
  if (existing) return existing;
  const generation = sourceGeneration;
  const previous = cached.get(appid);
  if (previous && Date.now() - previous.time < 15000) return Promise.resolve(previous.value);
  const fallback = (warning: string): FixCheck => ({
    ...(previous?.value || {
      success: true, appid, gameName: appDisplayName(appid),
      genericFix: { status: 0, available: false },
      onlineFix: { status: 0, available: false },
    }), partialResults: true, warning,
  });
  const work = new Promise<FixCheck>((resolve) => {
    let done = false;
    const finish = (result: FixCheck) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (result.partialResults && previous) {
        // An incomplete refresh must not erase known positive matches.
        const old = previous.value;
        result = {
          ...old, ...result,
          genericFix: result.genericFix?.available ? result.genericFix : old.genericFix,
          onlineFix: result.onlineFix?.available ? result.onlineFix : old.onlineFix,
          ryuuFixes: result.ryuuFixes?.length ? result.ryuuFixes : old.ryuuFixes,
          neraiFixes: result.neraiFixes?.length ? result.neraiFixes : old.neraiFixes,
          luatoolsFixes: result.luatoolsFixes?.length ? result.luatoolsFixes : old.luatoolsFixes,
          luatoolsCatalog: result.luatoolsCatalog,
          warning: `${result.warning || "Incomplete fix lookup."} Some results may be cached.`,
        };
      }
      if (generation === sourceGeneration && !result.partialResults && result.success) {
        if (cached.size >= 100) cached.delete(cached.keys().next().value!);
        cached.set(appid, { value: result, time: Date.now() });
      }
      resolve(result);
    };
    const timer = setTimeout(() => finish(fallback("Fix lookup timed out. Showing cached results where available; retry shortly.")), 22000);
    Promise.resolve().then(() => checkFixes(appid, appDisplayName(appid)))
      .then(finish, () => finish(fallback("Fix providers could not be reached. Retry shortly.")));
  }).finally(() => { if (generation === sourceGeneration) pending.delete(appid); });
  pending.set(appid, work);
  return work;
}
