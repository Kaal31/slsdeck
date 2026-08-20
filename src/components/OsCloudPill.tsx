import { PanelSectionRow, ButtonItem, Focusable } from "@decky/ui";
import { useCallback, useEffect, useState } from "react";
import { FaCloud, FaCloudUploadAlt, FaExclamationTriangle, FaCloudDownloadAlt } from "react-icons/fa";
import {
  osStatusGame,
  osSyncGame,
  osEnsureTracked,
  osResolve,
  OsState,
} from "../api";

const COLOR: Record<string, string> = {
  synced: "#5ee6c4",
  syncing: "#4fa8ff",
  conflict: "#f5a623",
  idle: "#9fb0c8",
  untracked: "#6b7688",
  unavailable: "#6b7688",
  unknown: "#6b7688",
};

const LABEL: Record<string, string> = {
  synced: "Cloud: synced",
  syncing: "Cloud: syncing…",
  conflict: "Cloud: conflict",
  idle: "Cloud saves on",
  untracked: "Cloud saves off",
  unavailable: "Cloud engine not installed",
  unknown: "Cloud: unknown",
};

function Icon({ state }: { state: OsState }) {
  const c = COLOR[state] || COLOR.unknown;
  if (state === "conflict") return <FaExclamationTriangle color={c} />;
  if (state === "syncing") return <FaCloudUploadAlt color={c} />;
  if (state === "synced") return <FaCloud color={c} />;
  return <FaCloudDownloadAlt color={c} />;
}

/**
 * A Steam-Cloud-styled status pill for the "This game" section, driven by the
 * OpenSave engine. Mimics Steam's own cloud indicator (icon + state) without
 * patching Steam — works for non-owned SLS titles.
 */
export function OsCloudPill({ appid }: { appid: number | null }) {
  const [state, setState] = useState<OsState>("unknown");
  const [installed, setInstalled] = useState(true);
  const [tracked, setTracked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (appid == null) return;
    try {
      const r = await osStatusGame(appid);
      setInstalled(!!r.installed);
      setTracked(!!r.tracked);
      setState((r.state as OsState) || "unknown");
    } catch { setState("unknown"); }
  }, [appid]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [refresh]);

  if (appid == null) return null;
  // Engine not installed: stay quiet here (the Cloud tab prompts to install).
  if (!installed || state === "unavailable") return null;

  const doSync = async () => {
    setBusy(true);
    try {
      if (!tracked) await osEnsureTracked(appid);
      await osSyncGame(appid);
    } catch { /* */ }
    await refresh();
    setBusy(false);
  };

  const doResolve = async (choice: string) => {
    setBusy(true);
    try { await osResolve(appid, choice); } catch { /* */ }
    await refresh();
    setBusy(false);
  };

  return (
    <>
      <PanelSectionRow>
        <Focusable style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px", fontSize: 13 }}>
          <Icon state={state} />
          <span style={{ color: COLOR[state] || COLOR.unknown }}>{LABEL[state] || LABEL.unknown}</span>
        </Focusable>
      </PanelSectionRow>
      {state === "conflict" ? (
        <PanelSectionRow>
          <Focusable style={{ display: "flex", gap: 6 }}>
            <ButtonItem layout="below" onClick={() => doResolve("keep-local")} disabled={busy}>Keep local</ButtonItem>
            <ButtonItem layout="below" onClick={() => doResolve("keep-remote")} disabled={busy}>Keep remote</ButtonItem>
            <ButtonItem layout="below" onClick={() => doResolve("keep-both")} disabled={busy}>Keep both</ButtonItem>
          </Focusable>
        </PanelSectionRow>
      ) : (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={doSync} disabled={busy}>
            {tracked ? "Sync cloud save now" : "Enable cloud saves for this game"}
          </ButtonItem>
        </PanelSectionRow>
      )}
    </>
  );
}
