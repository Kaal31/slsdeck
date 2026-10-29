import { DialogButton } from "@decky/ui";
import { useEffect, useState } from "react";
import { steamlessStatus, steamlessUnstub } from "../api";
import { refreshBadges } from "../lib/badges";

export function SteamStubFix({ appid, disabled = false, onChanged }: {
  appid: number; disabled?: boolean; onChanged?: () => void;
}) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof steamlessStatus>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setStatus(null); setMessage("");
    steamlessStatus(appid).then(r => { if (active) setStatus(r); }).catch(() => {});
    return () => { active = false; };
  }, [appid]);
  if (!status?.success || !status.supported) return null;
  const applied = status.installed && !status.hasStub;
  return <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: 10 }}>
    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>SteamStub fix</div>
    <div style={{ fontSize: 11, opacity: .7, marginBottom: 8 }}>
      {status.nativeReady ? "Moon native helper ready." : "Native kit installs on demand; legacy method remains the fallback."}
      {" "}Manual, Windows executable only. Original saved for Un-fix and snapshot cleanup.
    </div>
    <DialogButton disabled={disabled || busy || !!applied} onClick={async () => {
      setBusy(true); setMessage("Applying SteamStub fix…");
      try {
        const result = await steamlessUnstub(appid);
        setMessage(result.success ? result.note || "SteamStub fix applied." : result.error || "SteamStub fix failed.");
        const current = await steamlessStatus(appid);
        setStatus(current);
        void refreshBadges();
        onChanged?.();
      } catch (error) { setMessage(String(error)); }
      finally { setBusy(false); }
    }}>{busy ? "Working…" : applied ? "SteamStub fix applied" : "Apply SteamStub fix (native preferred)"}</DialogButton>
    {message && <div role="status" style={{ fontSize: 12, marginTop: 6 }}>{message}</div>}
  </div>;
}
