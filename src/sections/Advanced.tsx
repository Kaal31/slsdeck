import { PanelSection, PanelSectionRow, ToggleField, ButtonItem } from "@decky/ui";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import { getDlcOption, getStoreDisabled, setDlcOption, setStoreDisabled, getPinOnFix, setPinOnFix, getAutoApply, setAutoApply } from "../api";
import { FixesSection } from "./Fixes";
import { OpenSaveSection } from "./OpenSave";

let cachedDlc: boolean | null = null;
let cachedStoreOn: boolean | null = null;

/**
 * Advanced — always shown. Holds power-user bits: the store-button toggle, DLC
 * sync, and the manual "Game fixes" (look up fixes by AppID).
 */
export function AdvancedSection() {
  const [dlc, setDlc] = useState(cachedDlc ?? false);
  const [storeOn, setStoreOn] = useState(cachedStoreOn ?? true);
  const [pinOnFix, setPinOnFixState] = useState(true);
  const [autoApply, setAutoApplyState] = useState(false);
  const [showFixes, setShowFixes] = useState(false);
  const [showCloud, setShowCloud] = useState(false);

  const load = async () => {
    try {
      const r = await getDlcOption();
      cachedDlc = !!r.enabled;
      setDlc(cachedDlc);
    } catch {
      /* ignore */
    }
    try {
      const r = await getStoreDisabled();
      cachedStoreOn = !r.disabled;
      setStoreOn(cachedStoreOn);
    } catch {
      /* ignore */
    }
    try {
      const r = await getPinOnFix();
      setPinOnFixState(!!r.enabled);
    } catch {
      /* ignore */
    }
    try {
      const r = await getAutoApply();
      setAutoApplyState(!!r.enabled);
    } catch {
      /* ignore */
    }
  };

  const onPinOnFix = async (v: boolean) => {
    setPinOnFixState(v);
    try {
      await setPinOnFix(v);
    } catch {
      /* ignore */
    }
  };

  const onAutoApply = async (v: boolean) => {
    setAutoApplyState(v);
    try {
      await setAutoApply(v);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onStore = async (v: boolean) => {
    cachedStoreOn = v;
    setStoreOn(v);
    await setStoreDisabled(!v);
    toaster.toast({ title: "SLSDeck", body: v ? "Store buttons on" : "Store buttons off" });
  };

  const onDlc = async (v: boolean) => {
    cachedDlc = v;
    setDlc(v);
    await setDlcOption(v);
    toaster.toast({ title: "SLSDeck", body: v ? "DLC sync enabled" : "DLC sync disabled" });
  };

  return (
    <>
      <PanelSection title="Advanced">
        <PanelSectionRow>
          <ToggleField
            label="Store buttons"
            description="Floating Add / Fix bar on store game pages."
            checked={storeOn}
            onChange={onStore}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Unlock DLC when adding a game"
            description="Marks the game's DLC as owned and auto-installs the matching in-process DLC unlocker when the game is on disk — SmokeAPI for Steam titles, Uplay R1/R2 for Ubisoft Connect titles (each only applies to games that use it). SLSsteam already unlocks most Steam DLC on its own. In-game (entitlement) DLC unlocks right away; DLC that downloads as separate files still needs those files."
            checked={dlc}
            onChange={onDlc}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Pin game version on fix"
            description="Locks a game to its current version when a fix is applied so an update can't break the fix. Cleared on un-fix."
            checked={pinOnFix}
            onChange={onPinOnFix}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Auto-apply fix after update"
            description="When a fix targets a specific build, pin it and update the game, then apply automatically once the download finishes. Off = guided: you press Apply after the download completes."
            checked={autoApply}
            onChange={onAutoApply}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setShowFixes((v) => !v)}>
            {showFixes ? "Game fixes ▾" : "Game fixes ▸"}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setShowCloud((v) => !v)}>
            {showCloud ? "Cloud saves (OpenSave) ▾" : "Cloud saves (OpenSave) ▸"}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      {showFixes && <FixesSection />}
      {showCloud && <OpenSaveSection />}
    </>
  );
}
