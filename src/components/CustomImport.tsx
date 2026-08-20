import { showModal, ModalRoot, ConfirmModal, DialogButton, Focusable } from "@decky/ui";
import { openFilePicker, FileSelectionType } from "@decky/api";
import { useEffect, useState } from "react";
import { getInstalledApps, customClassify, customImport } from "../api";

// Pick one of the user's added games. Resolves the chosen {appid,name} or null
// if the modal is dismissed without a pick.
function GamePickerModal({
  closeModal,
  onResult,
}: {
  closeModal?: () => void;
  onResult: (app: { appid: number; name: string } | null) => void;
}) {
  const [apps, setApps] = useState<{ appid: number; name: string }[]>([]);
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    getInstalledApps()
      .then((r) => r.success && setApps((r.apps || []).map((a: any) => ({ appid: Number(a.appid), name: a.name || String(a.appid) }))))
      .catch(() => {});
  }, []);
  const close = () => { if (!picked) onResult(null); closeModal?.(); };
  return (
    <ModalRoot closeModal={close}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Which game is this for?</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
        Pick the game this file should be bound to.
      </div>
      <Focusable style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "56vh", overflowY: "scroll" }}>
        {apps.length === 0 && <div style={{ opacity: 0.6, fontSize: 12 }}>No added games found.</div>}
        {apps.map((a) => (
          <DialogButton
            key={a.appid}
            style={{ textAlign: "left", padding: "8px 10px" }}
            onClick={() => { setPicked(true); onResult(a); closeModal?.(); }}
          >
            <div style={{ fontSize: 14 }}>{a.name}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>AppID {a.appid}</div>
          </DialogButton>
        ))}
      </Focusable>
    </ModalRoot>
  );
}

function pickGame(): Promise<{ appid: number; name: string } | null> {
  return new Promise((resolve) => {
    showModal(<GamePickerModal onResult={resolve} />);
  });
}

function confirmRoute(actualKind: "fix" | "manifest"): Promise<boolean> {
  const asWhat = actualKind === "manifest" ? "custom manifest / lua" : "custom fix";
  return new Promise((resolve) => {
    showModal(
      <ConfirmModal
        strTitle="Different file type detected"
        strDescription={`This looks like a ${actualKind === "manifest" ? "manifest / lua file" : "game fix (exe/dll)"}. Import it as a ${asWhat} instead?`}
        strOKButtonText="Import correctly"
        strCancelButtonText="Cancel"
        onOK={() => resolve(true)}
        onCancel={() => resolve(false)}
      />,
    );
  });
}

/**
 * Full import flow: pick a file, auto-detect fix vs manifest (confirm if it
 * differs from the tab it was launched from), pick the target game, import.
 * Returns a human-readable result string ("" if the user cancelled).
 */
export async function importCustomFlow(expected: "fix" | "manifest"): Promise<string> {
  let path = "";
  try {
    const res: any = await openFilePicker(FileSelectionType.FILE, "/home/deck/Downloads", true, true);
    path = res?.realpath || res?.path || "";
  } catch {
    return "";
  }
  if (!path) return "";

  let kind: "fix" | "manifest" = expected;
  try {
    const c = await customClassify(path);
    if (c.success && c.kind) kind = c.kind;
  } catch {
    /* keep expected */
  }
  if (kind !== expected) {
    const ok = await confirmRoute(kind);
    if (!ok) return "";
  }

  const app = await pickGame();
  if (!app) return "";

  try {
    const r = await customImport(app.appid, path, kind);
    if (!r.success) return r.error || "Import failed.";
    if (kind === "manifest") {
      return `Imported manifest for ${app.name}${r.activated ? " (activated)" : ""}. It'll show in the Download tab list.`;
    }
    return `Imported custom fix for ${app.name}. It'll show as a "Custom fix" button in that game's Fixes menu.`;
  } catch (e) {
    return `Import failed: ${e}`;
  }
}
