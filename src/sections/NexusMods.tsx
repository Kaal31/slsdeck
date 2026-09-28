import { ButtonItem, Focusable, Navigation, PanelSection, PanelSectionRow, Spinner, TextField } from "@decky/ui";
import { toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import {
  NexusCollection, NexusJobState, nexusCollection, nexusGetApiKey, nexusJobState,
  nexusRegisterNxmHandler, nexusSetApiKey, nexusStartCollection, nexusSubmitNxm, nexusValidate,
} from "../api";

function size(bytes = 0): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes, unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value.toFixed(unit && value < 10 ? 1 : 0)} ${units[unit]}`;
}

export function NexusModsSection() {
  const [apiKey, setApiKey] = useState("");
  const [account, setAccount] = useState<{ user?: string; premium?: boolean } | null>(null);
  const [collectionUrl, setCollectionUrl] = useState("");
  const [plan, setPlan] = useState<NexusCollection | null>(null);
  const [job, setJob] = useState("");
  const [state, setState] = useState<NexusJobState | null>(null);
  const [nxm, setNxm] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    nexusGetApiKey().then((r) => { if (r.success) setApiKey(r.key || ""); }).catch(() => {});
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const validate = async () => {
    setBusy(true);
    try {
      await nexusSetApiKey(apiKey.trim());
      const r = await nexusValidate();
      if (r.success) setAccount({ user: r.user, premium: !!r.premium });
      else toaster.toast({ title: "Nexus Mods", body: r.error || "API key validation failed" });
    } finally { setBusy(false); }
  };

  const inspect = async () => {
    if (!collectionUrl.trim()) return;
    setBusy(true); setPlan(null);
    try {
      const r = await nexusCollection(collectionUrl.trim(), "");
      setPlan(r);
      if (!r.success) toaster.toast({ title: "Nexus collection", body: r.error || "Could not load collection" });
    } finally { setBusy(false); }
  };

  const poll = (id: string) => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const r = await nexusJobState(id);
      if (!r.success) return;
      setState(r.state);
      // Keep polling while a free account waits: job_state consumes links
      // captured by the system nxm:// handler and advances the collection.
      if (["staged", "failed"].includes(r.state.status || "")) {
        clearInterval(timer.current); timer.current = null;
      }
    }, 1200);
  };

  const download = async () => {
    setBusy(true);
    try {
      const r = await nexusStartCollection(collectionUrl.trim(), "");
      if (!r.success || !r.job) {
        toaster.toast({ title: "Nexus collection", body: r.error || "Could not start download" });
        return;
      }
      setJob(r.job); setState({ status: "queued", done: 0, total: r.count || 0 }); poll(r.job);
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!job || !nxm.trim()) return;
    setBusy(true);
    try {
      const r = await nexusSubmitNxm(job, nxm.trim());
      if (r.success) { setState(r.state || null); setNxm(""); if (r.state?.status === "waiting_for_links") poll(job); }
      else toaster.toast({ title: "Nexus Slow Download", body: r.error || "Link was not accepted" });
    } finally { setBusy(false); }
  };

  const enableHandler = async () => {
    const r = await nexusRegisterNxmHandler();
    toaster.toast({ title: "Nexus link handler", body: r.success
      ? (r.registered ? "Enabled. Nexus Mod Manager links will return to this collection queue." : "Handler files installed, but SteamOS did not confirm the MIME association.")
      : (r.error || "Could not enable handler") });
  };

  const pending = state?.waiting?.[0];
  return <>
    <PanelSection title="Nexus Mods account">
      <PanelSectionRow><Focusable style={{ display: "flex", flexDirection: "column" }}>
        <TextField label="Personal Nexus Mods API key" value={apiKey} onChange={(e: any) => setApiKey(e.target.value)} />
      </Focusable></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={validate} disabled={busy || !apiKey.trim()}>
        {busy ? "Checking…" : "Save and validate account"}
      </ButtonItem></PanelSectionRow>
      {account && <PanelSectionRow><div style={{ fontSize: 12 }}>
        Signed in as {account.user} · {account.premium ? "Premium (automatic downloads)" : "Free (Slow Download links required)"}
      </div></PanelSectionRow>}
    </PanelSection>

    <PanelSection title="Nexus collections">
      <PanelSectionRow><Focusable style={{ display: "flex", flexDirection: "column" }}>
        <TextField label="Collection URL" value={collectionUrl} onChange={(e: any) => setCollectionUrl(e.target.value)} />
      </Focusable></PanelSectionRow>
      <PanelSectionRow><ButtonItem layout="below" onClick={inspect} disabled={busy || !collectionUrl.trim()}>
        Inspect collection
      </ButtonItem></PanelSectionRow>
      {plan?.success && <>
        <PanelSectionRow><div style={{ fontSize: 12 }}>
          <b>{plan.name}</b>{plan.author ? ` by ${plan.author}` : ""}<br />
          Revision {plan.revision} · {plan.files.length} archives · {size(plan.totalSize)}
          <br />{plan.files.filter((file) => file.downloaded).length} already downloaded · {plan.files.filter((file) => !file.downloaded).length} remaining
          {!!plan.external?.length && <><br /><span style={{ color: "#f5a623" }}>{plan.external.length} external/manual resource(s)</span></>}
        </div></PanelSectionRow>
        <PanelSectionRow><ButtonItem layout="below" onClick={download} disabled={busy || !!job}>
          Stage collection archives
        </ButtonItem></PanelSectionRow>
        <PanelSectionRow><div style={{ fontSize: 11, opacity: .7 }}>
          Archives are downloaded to managed storage. Automatic deployment is intentionally disabled until a safe game-specific installer/FOMOD plan is available.
        </div></PanelSectionRow>
      </>}
      {state && <PanelSectionRow><div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
        {["queued", "downloading"].includes(state.status || "") && <Spinner style={{ width: 16, height: 16 }} />}
        {state.status}: {state.done || 0}/{state.total || 0}{state.current ? ` · ${state.current.modName}` : ""}
      </div></PanelSectionRow>}
      {state?.status === "waiting_for_links" && pending && <>
        <PanelSectionRow><div style={{ fontSize: 12, color: "#f5a623" }}>
          Free account: authorize {pending.modName} on Nexus. Press “Mod Manager Download”, then “Slow Download”; the registered nxm:// handler will capture it and advance this queue. One authorization is required per file.
        </div></PanelSectionRow>
        <PanelSectionRow><ButtonItem layout="below" onClick={enableHandler}>Enable Nexus link handler</ButtonItem></PanelSectionRow>
        <PanelSectionRow><ButtonItem layout="below" onClick={() => Navigation.NavigateToExternalWeb(
          `https://www.nexusmods.com/${pending.domain || plan?.domain}/mods/${pending.modId}?tab=files&file_id=${pending.fileId}`
        )}>Open pending file on Nexus</ButtonItem></PanelSectionRow>
        <PanelSectionRow><Focusable style={{ display: "flex", flexDirection: "column" }}>
          <TextField label="Fallback: paste official nxm:// link" value={nxm} onChange={(e: any) => setNxm(e.target.value)} />
        </Focusable></PanelSectionRow>
        <PanelSectionRow><ButtonItem layout="below" onClick={submit} disabled={busy || !nxm.trim()}>Download authorized file</ButtonItem></PanelSectionRow>
      </>}
      {state?.status === "staged" && <PanelSectionRow><div style={{ fontSize: 12, color: "#58c578" }}>
        Collection archives staged successfully{state.path ? ` in ${state.path}` : ""}.
      </div></PanelSectionRow>}
    </PanelSection>
  </>;
}
