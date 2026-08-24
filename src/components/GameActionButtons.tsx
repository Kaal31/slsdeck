import { DialogButton, Focusable, ModalRoot, showModal, useParams } from "@decky/ui";
import { toaster } from "@decky/api";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { AddState, deleteLua, getAddStatus, getHideOnOwned, getLibraryButtons, hasLua, startAdd } from "../api";
import { shouldHideForOwned, isNonSteamShortcut } from "../lib/ownership";
import { FixPicker } from "./FixPicker";

function FixModal({ appid, closeModal }: { appid: number; closeModal?: () => void }) {
  return (
    <ModalRoot closeModal={closeModal}>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Fixes</div>
      <FixPicker appid={appid} onClose={closeModal} />
    </ModalRoot>
  );
}

/**
 * SLSDeck controls for the app-details page — a spaced bar (Add / Remove +
 * Fixes) spliced into the page's own React tree. Restart Steam lives only in the
 * Quick Access panel (next to "Add with SLSsteam"), so it's not repeated here.
 */
export function GameActionButtons() {
  const params = useParams<{ appid: string }>();
  const appid =
    params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;

  const [installed, setInstalled] = useState(false);
  const [hiddenForOwned, setHiddenForOwned] = useState(false);
  const [barEnabled, setBarEnabled] = useState(true);
  const [busy, setBusy] = useState<"" | "adding" | "removing">("");
  const [progress, setProgress] = useState("");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  };
  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (appid == null) return;
    setBusy("");
    setProgress("");
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
      if (cancelled) return;
      setHiddenForOwned(
        shouldHideForOwned(appid, ours, pref) ||
          (pref && !ours && isNonSteamShortcut(appid)),
      );
      try {
        const b = await getLibraryButtons();
        if (!cancelled) setBarEnabled(!!b.enabled);
      } catch {
        /* default on */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appid]);

  const doAdd = async () => {
    if (appid == null) return;
    setBusy("adding");
    setProgress("Starting…");
    try {
      const res = await startAdd(appid);
      if (!res.success) {
        setBusy("");
        toaster.toast({ title: "SLSDeck", body: res.error || "Could not add" });
        return;
      }
    } catch {
      setBusy("");
      toaster.toast({ title: "SLSDeck", body: "Could not start" });
      return;
    }
    stop();
    poll.current = setInterval(async () => {
      try {
        const st: AddState = (await getAddStatus(appid)).state || {};
        setProgress(st.status || "");
        if (["done", "failed", "cancelled"].includes(st.status || "")) {
          stop();
          setBusy("");
          if (st.status === "done") setInstalled(true);
          else if (st.status === "failed")
            toaster.toast({ title: "SLSDeck", body: st.error || "Failed" });
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
      toaster.toast({ title: "SLSDeck", body: "Removed — restart Steam" });
    } catch {
      toaster.toast({ title: "SLSDeck", body: "Remove failed" });
    } finally {
      setBusy("");
    }
  };

  // The injected Library-page bar obeys "Hide Add/Remove on owned games" as
  // one surface, including its Fixes button. Fixes remain available separately
  // from SLSDeck's Quick Access GameControlsSection.
  if (appid == null || hiddenForOwned || !barEnabled) return null;

  const working = busy !== "";
  const big: CSSProperties = { flex: 1, minWidth: 0, padding: "10px 16px", fontSize: 15 };

  return (
    <div style={{ margin: "20px 24px 8px" }}>
      <Focusable style={{ display: "flex", gap: 12 }} flow-children="row">
        {installed ? (
          <DialogButton style={big} disabled={working} onClick={doRemove}>
            {busy === "removing" ? "Removing…" : "🗑 Remove"}
          </DialogButton>
        ) : (
          <DialogButton style={big} disabled={working} onClick={doAdd}>
            {busy === "adding" ? progress || "Adding…" : "＋ Add with SLSsteam"}
          </DialogButton>
        )}
        <DialogButton
          style={big}
          disabled={working}
          onClick={() => appid != null && showModal(<FixModal appid={appid} />)}
        >
          Fixes
        </DialogButton>
      </Focusable>
    </div>
  );
}
