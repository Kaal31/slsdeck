import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  Focusable,
  Spinner,
  showModal,
  ConfirmModal,
} from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@decky/api";
import {
  AddState,
  IN_PROGRESS,
  SearchResult,
  cancelAdd,
  formatBytes,
  getAddStatus,
  searchGames,
  startAdd,
  customListAllManifests,
  customDeleteManifests,
  CustomGameGroup,
} from "../api";
import { importCustomFlow } from "../components/CustomImport";
import { InstalledSection } from "./Installed";

// Imported custom manifests / lua files, grouped by game — mirrors the
// "Applied fixes" list style in the Fixes tab.
export function CustomManifestsPanel() {
  const [games, setGames] = useState<CustomGameGroup[]>([]);
  const load = () =>
    customListAllManifests().then((r) => setGames(r.success ? (r.games || []) : [])).catch(() => {});
  useEffect(() => { load(); }, []);
  return (
    <PanelSection title="Custom manifests / lua">
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={async () => {
            const msg = await importCustomFlow("manifest");
            if (msg) toaster.toast({ title: "SLSDeck", body: msg });
            load();
          }}
        >
          Import manifest / lua…
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          Pick a .lua or .manifest and the game it's for. A .lua is copied into
          SLSsteam's stplug-in so the engine loads it. If the file is actually a
          fix, you'll be offered to import it as a custom fix instead.
        </div>
      </PanelSectionRow>
      {games.map((g) => (
        <PanelSectionRow key={g.appid}>
          <div style={{ display: "flex", flexDirection: "column", padding: "2px 2px" }}>
            <span style={{ fontWeight: 600 }}>{g.name || `AppID ${g.appid}`}</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              {g.count} file{g.count === 1 ? "" : "s"} · {g.items.map((i) => i.label).join(", ")}
            </span>
          </div>
        </PanelSectionRow>
      ))}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={() =>
            showModal(
              <ConfirmModal
                strTitle="Delete all custom manifests?"
                strDescription="Removes every imported .lua/.manifest from ~/.local/share/SLSDeck/custom_manifests. Luas already copied into stplug-in stay active until you remove the game."
                strOKButtonText="Delete"
                onOK={async () => {
                  const r = await customDeleteManifests(0);
                  toaster.toast({ title: "SLSDeck", body: r.success ? "Custom manifests cleared" : r.error || "Failed" });
                  load();
                }}
              />,
            )
          }
        >
          Delete custom manifests
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

interface Props {
  onChanged: () => void;
  refreshToken?: number;
  showInstalled?: boolean;
}

export function AddGameSection({ onChanged, refreshToken = 0, showInstalled = true }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);
  const [activeName, setActiveName] = useState<string>("");
  const [state, setState] = useState<AddState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const runSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    // Pure numeric input is treated as a direct AppID.
    if (/^\d+$/.test(trimmed)) {
      setResults([{ appid: parseInt(trimmed, 10), name: `AppID ${trimmed}` }]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchGames(trimmed, 15);
        setResults(res.success ? res.results : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const beginAdd = async (appid: number, name: string) => {
    setActiveAppId(appid);
    setActiveName(name);
    setState({ status: "queued" });
    try {
      const res = await startAdd(appid);
      if (!res.success) {
        toaster.toast({ title: "SLSDeck", body: res.error || "Failed to start" });
        setState({ status: "failed", error: res.error });
        return;
      }
    } catch (e) {
      setState({ status: "failed", error: String(e) });
      return;
    }
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getAddStatus(appid);
        if (!res.success) return;
        setState(res.state);
        const status = res.state.status;
        if (status === "done") {
          stopPolling();
          const live = !!(res.state as any).liveReady;
          toaster.toast({
            title: "SLSDeck",
            body: live
              ? `Added ${name} — available in Steam without restart`
              : `Added ${name} — restart Steam to finish provisioning`,
          });
          onChanged();
        } else if (status === "failed") {
          stopPolling();
          toaster.toast({ title: "SLSDeck", body: res.state.error || "Failed" });
        } else if (status === "cancelled") {
          stopPolling();
        }
      } catch {
        /* keep polling */
      }
    }, 800);
  };

  const onCancel = async () => {
    if (activeAppId != null) await cancelAdd(activeAppId);
    stopPolling();
    setState((s) => ({ ...(s || {}), status: "cancelled" }));
  };

  const busy = !!state && (IN_PROGRESS.has(state.status || "") || state.status === "reconciling");

  const statusLabel = () => {
    if (!state) return "";
    switch (state.status) {
      case "queued":
        return "Queued…";
      case "checking":
        return `Checking source${state.currentApi ? ` (${state.currentApi})` : ""}…`;
      case "downloading":
        return `Downloading ${formatBytes(state.bytesRead)}${
          state.totalBytes ? ` / ${formatBytes(state.totalBytes)}` : ""
        }`;
      case "processing":
        return "Processing archive…";
      case "installing":
        return "Installing Lua script…";
      case "reconciling":
        return "Refreshing Steam ownership and app info…";
      case "done":
        return state.api
          ? `Installed ✓ · source: ${state.api}${state.manifest === false ? " (no manifest found)" : ""}`
          : "Installed ✓";
      case "failed":
        return `Failed: ${state.error || "unknown"}`;
      case "cancelled":
        return "Cancelled";
      default:
        return state.status || "";
    }
  };

  return (
   <>
    <PanelSection title="Add a game">
      <PanelSectionRow>
        <TextField
          label="Search by name or AppID"
          value={query}
          onChange={(e) => runSearch((e.target as HTMLInputElement).value)}
        />
      </PanelSectionRow>

      {searching && (
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <Spinner style={{ width: 16, height: 16 }} /> Searching…
          </div>
        </PanelSectionRow>
      )}

      {!busy && !searching && results.length > 0 && (
        <PanelSectionRow>
          {/* Autocomplete dropdown: matching games appear under the search box;
              select one to add. */}
          <Focusable
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "46vh",
              overflowY: "auto",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 6,
              background: "rgba(0,0,0,0.22)",
              marginTop: 2,
            }}
          >
            {results.slice(0, 20).map((r, i) => (
              <ButtonItem
                key={r.appid}
                layout="below"
                bottomSeparator={i === Math.min(results.length, 20) - 1 ? "none" : "standard"}
                onClick={() => beginAdd(r.appid, r.name)}
              >
                <Focusable style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.55, marginLeft: 8, flex: "0 0 auto" }}>{r.appid}</span>
                </Focusable>
              </ButtonItem>
            ))}
          </Focusable>
        </PanelSectionRow>
      )}

      {state && (
        <PanelSectionRow>
          <div style={{ padding: "6px 0", fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{activeName || activeAppId}</div>
            <div style={{ opacity: 0.8 }}>{statusLabel()}</div>
            {state.status === "done" && (state as any).liveReady && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Steam live refresh confirmed{(state as any).liveGeneration ? ` · generation ${(state as any).liveGeneration}` : ""}
              </div>
            )}
            {state.status === "done" && !(state as any).liveReady && (state as any).liveReason && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Restart fallback: {(state as any).liveReason}
              </div>
            )}
            {state.contentCheckResult && state.status === "done" && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                Workshop: {state.contentCheckResult.workshop}
                {state.contentCheckResult.dlc &&
                  ` · DLC included: ${state.contentCheckResult.dlc.included.length}, missing: ${state.contentCheckResult.dlc.missing.length}`}
              </div>
            )}
          </div>
        </PanelSectionRow>
      )}

      {busy && (
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={onCancel}>
            Cancel
          </ButtonItem>
        </PanelSectionRow>
      )}
    </PanelSection>
    {showInstalled && <InstalledSection refreshToken={refreshToken} onChanged={onChanged} />}
    <CustomManifestsPanel />
   </>
  );
}
