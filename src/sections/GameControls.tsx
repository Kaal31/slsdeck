import { PanelSection, PanelSectionRow, ButtonItem } from "@decky/ui";
import { toaster } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import {
  AddState,
  checkFixes,
  currentLibraryAppId,
  deleteLua,
  getAddStatus,
  hasLua,
  reloadSteam,
  startAdd,
  getHideOnOwned,
} from "../api";
import { shouldHideForOwned, isNonSteamShortcut } from "../lib/ownership";
import { markSlsAddPending, refreshBadges } from "../lib/badges";
import { FixPicker } from "../components/FixPicker";
import { appDisplayName } from "../lib/fixRuntime";
import { getStoreAppId } from "../patches/StorePatch";

type Busy = "" | "adding" | "removing";

interface Props {
  onChanged?: () => void;
}

/**
 * Actions & fixes for whichever game page is currently open (library app page
 * or Steam store page). This is the reliable, default way to drive the plugin.
 * Restart Steam lives here — the single restart button.
 */
export function GameControlsSection({ onChanged }: Props) {
  const [appid, setAppid] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [installed, setInstalled] = useState(false);
  const [ownedElsewhere, setOwnedElsewhere] = useState(false);
  const [showFixes, setShowFixes] = useState(false);
  const [busy, setBusy] = useState<Busy>("");
  const [status, setStatus] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  };

  useEffect(() => {
    const detect = () => currentLibraryAppId() ?? getStoreAppId();
    setAppid(detect());
    const t = setInterval(() => {
      const id = detect();
      setAppid((prev) => (prev === id ? prev : id));
    }, 1000);
    return () => {
      clearInterval(t);
      stop();
    };
  }, []);

  useEffect(() => {
    setBusy("");
    setStatus("");
    setShowFixes(false);
    setOwnedElsewhere(false);
    if (appid == null) {
      setInstalled(false);
      setName("");
      return;
    }
    let cancelled = false;
    (async () => {
      let ours = false;
      try {
        ours = !!(await hasLua(appid)).exists;
      } catch {
        ours = false;
      }
      if (cancelled) return;
      setInstalled(ours);
      let pref = true;
      try {
        pref = !!(await getHideOnOwned()).enabled;
      } catch {
        pref = true;
      }
      if (!cancelled) setOwnedElsewhere(shouldHideForOwned(appid, ours, pref));
    })();
    checkFixes(appid, appDisplayName(appid))
      .then((r) => setName(r?.gameName || ""))
      .catch(() => setName(""));
  }, [appid]);

  const doAdd = async () => {
    if (appid == null) return;
    setBusy("adding");
    setStatus("Starting…");
    markSlsAddPending(appid);
    try {
      const res = await startAdd(appid);
      if (!res.success) {
        markSlsAddPending(appid, false);
        setBusy("");
        setStatus(res.error || "Could not add");
        toaster.toast({ title: "SLSDeck", body: res.error || "Could not add" });
        return;
      }
    } catch {
      markSlsAddPending(appid, false);
      setBusy("");
      setStatus("Could not start");
      return;
    }
    stop();
    poll.current = setInterval(async () => {
      try {
        const r = await getAddStatus(appid);
        const st: AddState = r.state || {};
        setStatus(st.status || "");
        if (["done", "failed", "cancelled"].includes(st.status || "")) {
          stop();
          setBusy("");
          if (st.status === "done") {
            setInstalled(true);
            void refreshBadges();
            setStatus("Added — reload Steam");
            onChanged?.();
          } else {
            markSlsAddPending(appid, false);
            if (st.status === "failed") {
              setStatus(st.error || "Failed");
            }
          }
        }
      } catch {
        /* keep polling */
      }
    }, 800);
  };

  const doRemove = async () => {
    if (appid == null) return;
    setBusy("removing");
    setStatus("Removing…");
    try {
      await deleteLua(appid);
      setInstalled(false);
      setStatus("Removed — reload Steam");
      toaster.toast({ title: "SLSDeck", body: "Removed — reload Steam" });
      onChanged?.();
    } catch {
      setStatus("Remove failed");
    } finally {
      setBusy("");
    }
  };

  const noGame = appid == null;
  const working = busy !== "";

  return (
    <PanelSection title="This game">
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.75, padding: "2px 0" }}>
          {noGame
            ? "Open a game's library or store page to enable these."
            : `${name || `AppID ${appid}`} (AppID ${appid})`}
          {status ? ` · ${status}` : ""}
        </div>
      </PanelSectionRow>

      {ownedElsewhere && (
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.65, padding: "0 2px 4px" }}>
            {appid != null && isNonSteamShortcut(appid)
              ? "Non-Steam shortcut — SLSsteam can't add this. Fixes remain available below when compatible."
              : "You already own this game — Add/Remove is hidden, but Fixes remain available below."}
          </div>
        </PanelSectionRow>
      )}

      {!ownedElsewhere && (
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={noGame || working}
          onClick={installed ? doRemove : doAdd}
        >
          {installed
            ? busy === "removing"
              ? "Removing…"
              : "Remove from SLSsteam"
            : busy === "adding"
            ? status || "Adding…"
            : "Add with SLSsteam"}
        </ButtonItem>
      </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={noGame || working}
          onClick={() => setShowFixes((v) => !v)}
        >
          {showFixes ? "Hide fixes" : "Fixes…"}
        </ButtonItem>
      </PanelSectionRow>

      {showFixes && appid != null && (
        <PanelSectionRow>
          <FixPicker appid={appid} onReload={onChanged} />
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem layout="below" disabled={working} onClick={() => reloadSteam()}>
          Reload Steam
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}
