import { crGetShortcut } from "../api";

/**
 * Native cloudredirect-moon reinstalls intentionally do not rebind a Steam
 * shortcut.  The authoritative runtime is ~/.local/share/CloudRedirect/
 * cloud_redirect.so loaded into Steam via LD_PRELOAD, not a Flatpak launcher.
 *
 * Keep this compatibility hook so existing callers do not need branching; the
 * explicit "Open CloudRedirect app" flow still repairs/creates the optional
 * companion shortcut when the user actually chooses to use that UI.
 */
export async function rebindExistingCloudRedirectShortcut(): Promise<boolean> {
  try {
    // Touch the stored value only to preserve the old RPC/cache behaviour; no
    // shortcut metadata is changed during a native moon reinstall.
    await crGetShortcut();
  } catch {
    /* ignore */
  }
  return false;
}
