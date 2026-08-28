import { DialogButton, Focusable, useParams } from "@decky/ui";
import { toaster } from "@decky/api";
import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  AddState,
  deleteLua,
  getAddStatus,
  hasLua,
  reloadSteam,
  startAdd,
  getHideOnOwned,
} from "../api";
import { shouldHideForOwned, isNonSteamShortcut } from "../lib/ownership";
import { markSlsAddPending, refreshBadges } from "../lib/badges";
import { FixPicker } from "./FixPicker";

type Busy = "" | "adding" | "removing" | "fixing";

/**
 * Inline game-page control bar. Injected into the library app page's React tree
 * (see lib/patchLibraryApp) so it lives *inside* the page rather than floating
 * over it — no focus trapping, no overlap with the Steam Deck button bar.
 *
 * Exactly three buttons: Add (⇄ Remove once the game is registered), Fix, and
 * Reload Steam. Everything else lives in the Quick Access sidebar.
 */
export function GameBar() {
  const params = useParams<{ appid: string }>();
  const appid =
    params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;

  const [installed, setInstalled] = useState(false);
  const [hiddenForOwned, setHiddenForOwned] = useState(false);
  const [busy, setBusy] = useState<Busy>("");
  const [progress, setProgress] = useState("");
  const [showFix, setShowFix] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  useEffect(() => {
    if (appid == null) return;
    setBusy("");
    setProgress("");
    setShowFix(false);
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
      if (!cancelled)
        setHiddenForOwned(
          shouldHideForOwned(appid, ours, pref) ||
            (pref && !ours && isNonSteamShortcut(appid)),
        );
    })();
    return () => {
      cancelled = true;
    };
  }, [appid]);

  const doAdd = async () => {
    if (appid == null) return;
    setBusy("adding");
    setProgress("Starting…");
    markSlsAddPending(appid);
    try {
      const res = await startAdd(appid);
      if (!res.success) {
        markSlsAddPending(appid, false);
        setBusy("");
        toaster.toast({ title: "SLSDeck", body: res.error || "Could not add" });
        return;
      }
    } catch {
      markSlsAddPending(appid, false);
      setBusy("");
      toaster.toast({ title: "SLSDeck", body: "Could not start" });
      return;
    }
    stop();
    poll.current = setInterval(async () => {
      try {
        const r = await getAddStatus(appid);
        const st: AddState = r.state || {};
        setProgress(st.status || "");
        if (["done", "failed", "cancelled"].includes(st.status || "")) {
          stop();
          setBusy("");
          if (st.status === "done") {
            setInstalled(true);
            void refreshBadges();
          } else {
            markSlsAddPending(appid, false);
            if (st.status === "failed") {
              toaster.toast({ title: "SLSDeck", body: st.error || "Failed" });
            }
          }
        }
      } catch {
        /* keep polling */
      }
    }, 700);
  };

  const doRemove = async () => {
    if (appid == null) return;
    setBusy("removing");
    try {
      await deleteLua(appid);
      setInstalled(false);
      toaster.toast({ title: "SLSDeck", body: "Removed — reload Steam" });
    } catch {
      toaster.toast({ title: "SLSDeck", body: "Remove failed" });
    } finally {
      setBusy("");
    }
  };

  // Always-on integrated bar on the library game page (default, not configurable).
  if (appid == null || hiddenForOwned) return null;

  const working = busy !== "";
  const btnStyle: CSSProperties = {
    minWidth: 0,
    flex: 1,
    padding: "6px 10px",
    fontSize: 13,
  };

  const primary = installed ? (
    <DialogButton style={btnStyle} disabled={working} onClick={doRemove}>
      {busy === "removing" ? "Removing…" : "🗑 Remove"}
    </DialogButton>
  ) : (
    <DialogButton style={btnStyle} disabled={working} onClick={doAdd}>
      {busy === "adding" ? progress || "Adding…" : "＋ Add"}
    </DialogButton>
  );

  const fixBtn = (
    <DialogButton style={btnStyle} disabled={working} onClick={() => setShowFix((v) => !v)}>
      {showFix ? "Hide fixes" : "Fixes"}
    </DialogButton>
  );

  const reloadBtn = (
    <DialogButton style={btnStyle} disabled={working} onClick={() => reloadSteam()}>
      ⟳ Reload
    </DialogButton>
  );

  const row = (
    <Focusable style={{ display: "flex", flexDirection: "row", gap: 8 }} flow-children="row">
      {primary}
      {fixBtn}
      {reloadBtn}
    </Focusable>
  );

  return (
    <div style={{ margin: "8px 24px" }}>
      {row}
      {showFix && <FixPicker appid={appid} />}
    </div>
  );
}
