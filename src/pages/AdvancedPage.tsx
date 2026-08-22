import { SidebarNavigation, PanelSection, PanelSectionRow, ToggleField, TextField, ButtonItem } from "@decky/ui";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import {
  FaBoxOpen, FaDownload, FaWrench,
  FaCloud, FaSlidersH, FaKey, FaInfoCircle, FaShieldAlt, FaPuzzlePiece,
} from "react-icons/fa";

import { AddGameSection } from "../sections/AddGame";
import { DependenciesSection } from "../sections/Dependencies";
import { HelpHub } from "../sections/HelpHub";
import { FixesSection } from "../sections/Fixes";
import { CloudRedirectSection } from "../sections/CloudRedirect";
import { UpdatesSection } from "../sections/Updates";
import { SettingsSection } from "../sections/Settings";
import { HypervisorSection } from "../sections/Hypervisor";
import { TokeerSection } from "../sections/Tokeer";
import { ModsSection } from "../sections/Mods";
import { BackupSection } from "../sections/Backup";
import {
  getDlcOption, setDlcOption,
  getDlcOwnedOnly, setDlcOwnedOnly,
  getGroupCollection, setGroupCollection,
  getBackupCustom, setBackupCustom,
  getStoreDisabled, setStoreDisabled,
  getPinOnFix, setPinOnFix,
  getNoInternetFix, setNoInternetFix,
  getAutoApply, setAutoApply,
  getAutoRepoint, setAutoRepoint,
  getAchievements, setAchievements,
  getHideToolsQam, setHideToolsQam,
  getOnlineUsername, setOnlineUsername,
  getHideOnOwned, setHideOnOwned,
  getBadgeOptions, setBadgeOption,
  getLibraryButtons, setLibraryButtons,
  getAutoFix, setAutoFix,
  getGamesInQam, setGamesInQam,
  getShowReinstallQam, setShowReinstallQam,
  getAutoReinject, setAutoReinject,
  getAutoClientRepin, setAutoClientRepin,
  getAutoDownload, setAutoDownload,
  getAutoAddDlc, setAutoAddDlc,
  getDisableCloud, setDisableCloud,
  getDisableDlcUnlockOwned, setDisableDlcUnlockOwned,
} from "../api";
import { listLibraryAppIds } from "../lib/ownership";
import { refreshBadges } from "../lib/badges";
import { syncSlsCollection } from "../lib/collection";
import { getEmojiBadgesEnabled, setEmojiBadgesEnabled } from "../lib/emojiBadges";

const ACTIONS_FIXES_QAM_KEY = "slsdeck.actionsFixesQam";
const ACTIONS_FIXES_QAM_EVENT = "slsdeck-actions-fixes-qam";
const DECKY_HV_VISIBLE_KEY = "slsdeck.showDeckyHv";
const TOKEER_SESSION_KEY = "slsdeck.tokeerSession.v1";

function hasActiveTokeerSession(): boolean {
  try {
    const session=JSON.parse(window.localStorage.getItem(TOKEER_SESSION_KEY)||"null");
    return !!session && Number(session.expiresAt)>Date.now() && !!(session.selectedGame||session.ticket||session.gate);
  } catch { return false; }
}

function readDeckyHvVisible(): boolean {
  try {
    return window.localStorage.getItem(DECKY_HV_VISIBLE_KEY) === "1";
  } catch {
    return false;
  }
}

/* ── Injection recovery (auto-heal after a Steam client update) ─────────── */
function AddDownloadToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    getAutoDownload().then((r) => setOn(!!r.enabled)).catch(() => {});
  }, []);
  return (
    <PanelSection title="Adding games">
      <PanelSectionRow>
        <ToggleField
          label="Auto restart after adding"
          description="Auto restart Steam after adding a game."
          checked={on}
          onChange={async (v) => { setOn(v); await setAutoDownload(v); }}
        />
      </PanelSectionRow>
    </PanelSection>
  );
}

function DlcCloudToggles() {
  const [autoDlc, setAutoDlc] = useState(false);
  const [noCloud, setNoCloud] = useState(false);
  const [noOwnedDlc, setNoOwnedDlc] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getAutoAddDlc().then((r) => setAutoDlc(!!r.enabled)).catch(() => {});
    getDisableCloud().then((r) => setNoCloud(!!r.enabled)).catch(() => {});
    getDisableDlcUnlockOwned().then((r) => setNoOwnedDlc(!!r.enabled)).catch(() => {});
  }, []);
  return (
    <PanelSection title="DLC & cloud">
      <PanelSectionRow>
        <ToggleField
          label="Add DLC automatically"
          description="When adding a game, also register all its DLC depot keys (from the full manifest) so the base install downloads content DLC too. Richer with a Hubcap key set. Off by default."
          checked={autoDlc}
          onChange={async (v) => { setAutoDlc(v); await setAutoAddDlc(v); }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Disable DLC unlock on owned games"
          description="Stop moon from auto-unlocking (unowned) DLC on games you legit own. Scans your library's owned games, resolves their DLC, and blacklists them in the engine. Can be slow on a big library. Off by default."
          checked={noOwnedDlc}
          onChange={async (v) => {
            setNoOwnedDlc(v); setBusy(true);
            try {
              const owned = v ? listLibraryAppIds() : [];
              const r = await setDisableDlcUnlockOwned(v, owned);
              toaster.toast({ title: "SLSDeck", body: v ? `Blacklisted ${r.blacklisted ?? 0} DLC — reload Steam` : "DLC unlock restored — reload Steam" });
            } catch (e) { toaster.toast({ title: "SLSDeck", body: `Error: ${e}` }); }
            setBusy(false);
          }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Disable Steam cloud on SLS games"
          description="Turn off Steam cloud saves for games added via SLSsteam (avoids Valve's rejected-sync errors). Only affects added games, not your legit ones. Mutually exclusive with CloudRedirect. Off by default."
          checked={noCloud}
          onChange={async (v) => { setNoCloud(v); await setDisableCloud(v); toaster.toast({ title: "SLSDeck", body: "Cloud setting written — reload Steam" }); }}
        />
      </PanelSectionRow>
      {busy ? <PanelSectionRow><div style={{ fontSize: 11, opacity: 0.7 }}>Scanning library…</div></PanelSectionRow> : null}
    </PanelSection>
  );
}

function InjectionRecovery() {
  const [reinject, setReinject] = useState(false);
  const [repin, setRepin] = useState(false);
  useEffect(() => {
    getAutoReinject().then((r) => setReinject(!!r.enabled)).catch(() => {});
    getAutoClientRepin().then((r) => setRepin(!!r.enabled)).catch(() => {});
  }, []);
  return (
    <PanelSection title="Injection recovery">
      <PanelSectionRow>
        <ToggleField
          label="Auto re-activate injection on boot"
          description="If a Steam update leaves injection off, re-patch steam.sh on startup and fully restart Steam (steam -shutdown + relaunch through steam.sh) to apply it. Capped so it can't loop."
          checked={reinject}
          onChange={async (v) => { setReinject(v); await setAutoReinject(v); }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ToggleField
          label="Auto re-pin Steam client on boot"
          description="If injection broke after a client update, automatically run the client fix (h3adcr-b) — this pins/downgrades the client and REBOOTS. Heavy; capped. Leave off unless you want it fully hands-off."
          checked={repin}
          onChange={async (v) => { setRepin(v); await setAutoClientRepin(v); }}
        />
      </PanelSectionRow>
    </PanelSection>
  );
}

/** Scrollable page body — SidebarNavigation panes don't scroll on their own. */
function Body({ children }: { children: any }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "6px 12px 40px 12px" }}>
      {children}
    </div>
  );
}

/* ── Online-fix username (lives on the Game fixes tab) ─────────────────── */
function OnlineFixUsername() {
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  const [auto, setAuto] = useState("");

  useEffect(() => {
    getOnlineUsername()
      .then((r) => {
        const u = r.success ? r.username || "" : "";
        setSaved(u);
        setDraft(u);
        setAuto(r.success ? r.auto || "" : "");
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    await setOnlineUsername(draft.trim());
    setSaved(draft.trim());
    toaster.toast({ title: "SLSDeck", body: "Online-fix username saved" });
  };

  return (
    <PanelSection title="Online-fix username">
      <PanelSectionRow>
        <TextField
          label="Username"
          value={draft}
          onChange={(e) => setDraft((e.target as HTMLInputElement).value)}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          Name used by online-fix emulators. Blank = your Steam name
          {auto ? ` ("${auto}")` : ""}. Applied when a fix is installed.
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={save} disabled={draft.trim() === (saved ?? "")}>
          Save username
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}

/* ── Options pane (the old Advanced toggles) ───────────────────────────── */
function OptionsPane({
  showDeckyHv,
  onShowDeckyHvChange,
}: {
  showDeckyHv: boolean;
  onShowDeckyHvChange: (enabled: boolean) => void;
}) {
  const [dlc, setDlc] = useState(false);
  const [dlcOwnedOnly, setDlcOwnedOnlyState] = useState(true);
  const [groupCollection, setGroupCollectionState] = useState(false);
  const [backupCustom, setBackupCustomState] = useState(false);
  const [storeOn, setStoreOn] = useState(true);
  const [pin, setPin] = useState(true);
  const [noNet, setNoNet] = useState(true);
  const [hideOwned, setHideOwned] = useState(true);
  const [actionsFixesQam, setActionsFixesQam] = useState(true);
  const [gamesQam, setGamesQam] = useState(false);
  const [reinstallQam, setReinstallQam] = useState(true);
  const [badgeSls, setBadgeSls] = useState(true);
  const [badgeLegit, setBadgeLegit] = useState(true);
  const [badgeDenuvo, setBadgeDenuvo] = useState(true);
  const [badgeGamePage, setBadgeGamePage] = useState(true);
  const [badgeStorePage, setBadgeStorePage] = useState(true);
  const [badgeOnlineFix, setBadgeOnlineFix] = useState(true);
  const [badgeFixed, setBadgeFixed] = useState(true);
  const [badgeNonSteam, setBadgeNonSteam] = useState(true);
  const [badgeNonSteamName, setBadgeNonSteamName] = useState(true);
  const [badgeLibrary, setBadgeLibrary] = useState(true);
  const [badgeEmoji, setBadgeEmoji] = useState(false);
  const [autoFix, setAutoFixState] = useState(false);
  const [libButtons, setLibButtons] = useState(true);
  const [autoApply, setAutoApplyState] = useState(false);
  const [autoRepoint, setAutoRepointState] = useState(true);
  const [hideToolsQam, setHideToolsQamState] = useState(true);
  const [achievements, setAchievementsState] = useState(true);
  const [achMoon, setAchMoon] = useState(true);

  useEffect(() => {
    getDlcOption().then((r) => setDlc(!!r.enabled)).catch(() => {});
    getDlcOwnedOnly().then((r) => setDlcOwnedOnlyState(!!r.enabled)).catch(() => {});
    getGroupCollection().then((r) => setGroupCollectionState(!!r.enabled)).catch(() => {});
    getBackupCustom().then((r) => setBackupCustomState(!!r.enabled)).catch(() => {});
    getStoreDisabled().then((r) => setStoreOn(!r.disabled)).catch(() => {});
    getPinOnFix().then((r) => setPin(!!r.enabled)).catch(() => {});
    getNoInternetFix().then((r) => setNoNet(!!r.enabled)).catch(() => {});
    getAutoApply().then((r) => setAutoApplyState(!!r.enabled)).catch(() => {});
    getAutoRepoint().then((r) => setAutoRepointState(!!r.enabled)).catch(() => {});
    getAchievements().then((r) => { setAchievementsState(!!r.enabled); setAchMoon(r.moon !== false); }).catch(() => {});
    getHideToolsQam().then((r) => setHideToolsQamState(!!r.enabled)).catch(() => {});
    getHideOnOwned().then((r) => setHideOwned(!!r.enabled)).catch(() => {});
    getGamesInQam().then((r) => setGamesQam(!!r.enabled)).catch(() => {});
    getShowReinstallQam().then((r) => setReinstallQam(!!r.enabled)).catch(() => {});
    try {
      const raw = window.localStorage.getItem(ACTIONS_FIXES_QAM_KEY);
      setActionsFixesQam(raw == null ? true : raw === "1");
    } catch {
      setActionsFixesQam(true);
    }
    setBadgeEmoji(getEmojiBadgesEnabled());
    getBadgeOptions()
      .then((r) => {
        if (!r.success) return;
        setBadgeSls(!!r.sls);
        setBadgeLegit(!!r.legit);
        setBadgeDenuvo(!!r.denuvo);
        setBadgeGamePage(!!r.gamePage);
        setBadgeStorePage(!!r.storePage);
        setBadgeOnlineFix(!!r.onlineFix);
        setBadgeFixed(!!r.fixed);
        setBadgeNonSteam(!!r.nonSteam);
        setBadgeNonSteamName(!!r.nonSteamName);
        setBadgeLibrary(!!r.library);
      })
      .catch(() => {});
    getLibraryButtons().then((r) => setLibButtons(!!r.enabled)).catch(() => {});
    getAutoFix().then((r) => setAutoFixState(!!r.enabled)).catch(() => {});
  }, []);

  return (
    <Body>
      <PanelSection title="On-screen buttons">
        <PanelSectionRow>
          <ToggleField
            label="Store buttons"
            description="Floating Add / Fix bar on store game pages."
            checked={storeOn}
            onChange={async (v) => {
              setStoreOn(v);
              await setStoreDisabled(!v);
              toaster.toast({ title: "SLSDeck", body: v ? "Store buttons on" : "Store buttons off" });
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Library buttons on game pages"
            description="The Add / Fixes bar injected into the game's library page. Turn off to use only the Quick Access panel."
            checked={libButtons}
            onChange={async (v) => { setLibButtons(v); await setLibraryButtons(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={libButtons ? "Hide actions on owned games" : "Hide actions on owned games (Quick Access)"}
            description="On game pages, hide Add with SLSsteam and Fixes for titles you already own (anything in your library that wasn't added by SLSsteam)."
            checked={hideOwned}
            onChange={async (v) => { setHideOwned(v); await setHideOnOwned(v); }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Fixes">
        <PanelSectionRow>
          <ToggleField
            label="No internet fix"
            description="When downloading a pinned build, Steam can fail with 'no internet connection' because the client fix's steam.cfg blocks its updater. This temporarily removes that block so the game downloads, then restores it once the download starts (so the Steam client can't self-update past the compatible build). On by default."
            checked={noNet}
            onChange={async (v) => { setNoNet(v); await setNoInternetFix(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Pin game version on fix"
            description="Locks a game to its current version when a fix is applied so an update can't break it. Cleared on un-fix."
            checked={pin}
            onChange={async (v) => { setPin(v); await setPinOnFix(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Auto-apply fix after update"
            description="When a fix targets a specific build, pin it and update the game, then apply automatically once the download finishes. Off = guided: you press Apply after the download completes."
            checked={autoApply}
            onChange={async (v) => { setAutoApplyState(v); await setAutoApply(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Auto-fix launch target"
            description="When a fix ships its own replacement exe, repoint Steam's launch to the game's real Binaries/Win64 exe so the fix actually runs (bypasses a broken launcher). Additive — your other launch options are kept. Per-game override lives under Quick Access → This game."
            checked={autoRepoint}
            onChange={async (v) => { setAutoRepointState(v); await setAutoRepoint(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Auto-apply fixes after adding"
            description="When an add finishes, download and apply the online fix and/or Denuvo fix if available. A Denuvo fix also marks the game and installs the custom Proton."
            checked={autoFix}
            onChange={async (v) => { setAutoFixState(v); await setAutoFix(v); }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="DLC unlocking">
        <PanelSectionRow>
          <ToggleField
            label="Unlock DLC when adding a game"
            description="Marks the game's DLC as owned and auto-installs the matching in-process DLC unlocker when the game is on disk — SmokeAPI for Steam titles, Uplay R1/R2 for Ubisoft Connect titles (each only applies to games that use it). SLSsteam already unlocks most Steam DLC on its own. In-game (entitlement) DLC unlocks right away; DLC that downloads as separate files still needs those files."
            checked={dlc}
            onChange={async (v) => { setDlc(v); await setDlcOption(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="DLC unlockers on owned games only"
            description="Only show the CreamAPI, SmokeAPI and Ubisoft (Uplay R1/R2) DLC-unlock buttons on games you actually own — hide them on SLS-added games, where they do nothing. On by default."
            checked={dlcOwnedOnly}
            onChange={async (v) => {
              setDlcOwnedOnlyState(v);
              await setDlcOwnedOnly(v);
              toaster.toast({ title: "SLSDeck", body: v ? "DLC unlockers: owned games only" : "DLC unlockers: all games" });
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Quick Access menu">
        <PanelSectionRow>
          <ToggleField
            label="Hide tools & diagnostics in Quick Access"
            description="Hide the Tools and Diagnostics sections from the Quick Access panel for a cleaner menu. They remain here in Advanced."
            checked={hideToolsQam}
            onChange={async (v) => { setHideToolsQamState(v); await setHideToolsQam(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Show Actions & fixes in Quick Access"
            description="Show the per-game Actions & fixes section in Quick Access, above the installed-games list. Applies immediately and when the panel is reopened."
            checked={actionsFixesQam}
            onChange={(v) => {
              setActionsFixesQam(v);
              try {
                window.localStorage.setItem(ACTIONS_FIXES_QAM_KEY, v ? "1" : "0");
                window.dispatchEvent(new CustomEvent(ACTIONS_FIXES_QAM_EVENT, { detail: v }));
              } catch { /* ignore */ }
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Show added games in Quick Access"
            description="Move the added-games list into the Quick Access panel, under Actions & fixes (removes the Installed tab here). Applies when the panel is reopened."
            checked={gamesQam}
            onChange={async (v) => { setGamesQam(v); await setGamesInQam(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Show Reinstall SLSsteam in Quick Access"
            description="When SLSsteam is installed, show its Reinstall button in the Quick Access panel. Install still shows when it isn't installed yet."
            checked={reinstallQam}
            onChange={async (v) => { setReinstallQam(v); await setShowReinstallQam(v); }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Games & library">
        <PanelSectionRow>
          <ToggleField
            label="Achievements (slsteam-moon)"
            description={
              achMoon
                ? "Let added games unlock achievements — moon fetches the real schema live from Steam by impersonating an owner. Restart Steam after changing."
                : "Needs the slsteam-moon engine. Stock SLSsteam ignores this setting (use SLScheevo to pre-generate achievements instead)."
            }
            checked={achievements}
            onChange={async (v) => { setAchievementsState(v); await setAchievements(v); }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Group SLS games into a collection"
            description="Keep a Steam collection named 'SLSDeck' auto-synced with every game you added through SLSsteam, so they're easy to find among your owned titles. Updates on boot and as you add/remove games. Off by default; turning it off leaves the collection as-is."
            checked={groupCollection}
            onChange={async (v) => {
              setGroupCollectionState(v);
              await setGroupCollection(v);
              if (v) {
                syncSlsCollection().catch(() => {});
                toaster.toast({ title: "SLSDeck", body: "Building the SLSDeck collection…" });
              } else {
                toaster.toast({ title: "SLSDeck", body: "Collection sync off (existing collection kept)" });
              }
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Backup custom manifests and fixes"
            description="Include imported custom fixes and manifests (~/.local/share/SLSDeck) in the backup archive. When restored, they reappear in the Fixes and Download tabs. Off by default."
            checked={backupCustom}
            onChange={async (v) => { setBackupCustomState(v); await setBackupCustom(v); }}
          />
        </PanelSectionRow>
      </PanelSection>

      <AddDownloadToggle />
      <DlcCloudToggles />

      <InjectionRecovery />

      <PanelSection title="Advanced tools">
        <PanelSectionRow>
          <ToggleField
            label="Show Hypervisor Bypass Module tab"
            description="Show the Hypervisor Bypass Module controls in Advanced. Hidden by default; Anti-Denuvo uses the Tokeer page."
            checked={showDeckyHv}
            onChange={(v) => onShowDeckyHvChange(v)}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Library badges">
        <PanelSectionRow>
          <ToggleField
            label="Emoji Badges"
            description="Replace each enabled badge with its emoji analogue: SLS 🏴‍☠️, Legit 💵, Fix 🔧, Online Fix 🌐, Denuvo 👺, Non-Steam ❓. Disabled badges stay hidden."
            checked={badgeEmoji}
            onChange={(v) => {
              setBadgeEmoji(v);
              setEmojiBadgesEnabled(v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="SLS badge"
            description="Marks games added through SLSsteam."
            checked={badgeSls}
            onChange={async (v) => {
              setBadgeSls(v);
              await setBadgeOption("sls", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Legit badge"
            description="Marks games you actually own — Steam library titles that aren't SLSsteam additions or non-Steam shortcuts."
            checked={badgeLegit}
            onChange={async (v) => {
              setBadgeLegit(v);
              await setBadgeOption("legit", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Denuvo badge"
            description="Marks Denuvo-protected games, from Steam's own DRM notice (seeded with ryuu's bypass list). Shown on the right, so it can sit alongside the SLS or Legit badge."
            checked={badgeDenuvo}
            onChange={async (v) => {
              setBadgeDenuvo(v);
              await setBadgeOption("denuvo", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Online-fix badge"
            description="Marks games that have an online fix installed."
            checked={badgeOnlineFix}
            onChange={async (v) => {
              setBadgeOnlineFix(v);
              await setBadgeOption("onlineFix", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Fix-applied badge (FIXED)"
            description="Marks games with a non-online fix installed (ryuu / crack / generic). Online fixes get the Online-fix badge instead."
            checked={badgeFixed}
            onChange={async (v) => {
              setBadgeFixed(v);
              await setBadgeOption("fixed", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Non-Steam badge"
            description="Black NON-STEAM badge on non-Steam shortcuts."
            checked={badgeNonSteam}
            onChange={async (v) => {
              setBadgeNonSteam(v);
              await setBadgeOption("nonSteam", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Non-Steam app-name badge"
            description="Extra badge on non-Steam shortcuts showing the app name, taken from the target executable's folder."
            checked={badgeNonSteamName}
            onChange={async (v) => {
              setBadgeNonSteamName(v);
              await setBadgeOption("nonSteamName", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Badges in library grid"
            description="Show badges on library capsules and the home carousel."
            checked={badgeLibrary}
            onChange={async (v) => {
              setBadgeLibrary(v);
              await setBadgeOption("library", v);
              refreshBadges();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Badges on game pages"
            description="Also show these badges on a game's details page, not just on library capsules."
            checked={badgeGamePage}
            onChange={async (v) => {
              setBadgeGamePage(v);
              await setBadgeOption("gamePage", v);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Badges on store pages"
            description="Show SLS / Denuvo / fix badges on the in-Steam store page (top-left). No Legit there — a store page isn't proof of ownership."
            checked={badgeStorePage}
            onChange={async (v) => {
              setBadgeStorePage(v);
              await setBadgeOption("storePage", v);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
            Non-Steam shortcuts are never badged — they're neither SLSsteam additions
            nor licensed Steam titles.
          </div>
        </PanelSectionRow>
      </PanelSection>

      <UpdatesSection />
      <BackupSection />
    </Body>
  );
}

/* ── About pane ────────────────────────────────────────────────────────── */
function AboutPane() {
  return (
    <Body>
      <HelpHub />
    </Body>
  );
}

/* ── the page ──────────────────────────────────────────────────────────── */
export function AdvancedPage() {
  const [tok, setTok] = useState(0);
  const bump = () => setTok((t) => t + 1);
  const [gamesInQam, setGamesInQam2] = useState(false);
  const [showDeckyHv, setShowDeckyHv] = useState(readDeckyHvVisible);
  const [resumeTokeer] = useState(hasActiveTokeerSession);

  useEffect(() => {
    getGamesInQam().then((r) => setGamesInQam2(!!r.enabled)).catch(() => {});
  }, []);

  const setDeckyHvVisible = (enabled: boolean) => {
    setShowDeckyHv(enabled);
    try {
      window.localStorage.setItem(DECKY_HV_VISIBLE_KEY, enabled ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  return (
    <SidebarNavigation
      title="SLSDeck"
      showTitle
      pages={[
        ...(resumeTokeer ? [{
          title: "Anti-Denuvo",
          icon: <FaShieldAlt />,
          content: <Body><TokeerSection /></Body>,
        }] : []),
        {
          title: "Dependencies",
          icon: <FaBoxOpen />,
          content: <Body><DependenciesSection /></Body>,
        },
        {
          title: "Options",
          icon: <FaSlidersH />,
          content: <OptionsPane showDeckyHv={showDeckyHv} onShowDeckyHvChange={setDeckyHvVisible} />,
        },
        {
          title: "Sources & keys",
          icon: <FaKey />,
          content: <Body><SettingsSection /></Body>,
        },
        {
          title: "Add a game",
          icon: <FaDownload />,
          content: <Body><AddGameSection onChanged={bump} refreshToken={tok} showInstalled={!gamesInQam} /></Body>,
        },
        {
          title: "Game fixes",
          icon: <FaWrench />,
          content: <Body><FixesSection /><OnlineFixUsername /></Body>,
        },
        {
          title: "Cloud saves",
          icon: <FaCloud />,
          content: <Body><CloudRedirectSection /></Body>,
        },
        ...(!resumeTokeer ? [{
          title: "Anti-Denuvo",
          icon: <FaShieldAlt />,
          content: <Body><TokeerSection /></Body>,
        }] : []),
        ...(showDeckyHv ? [{
          title: "Hypervisor Bypass Module",
          icon: <FaShieldAlt />,
          content: <Body><HypervisorSection /></Body>,
        }] : []),
        {
          title: "Mods",
          icon: <FaPuzzlePiece />,
          content: <Body><ModsSection /></Body>,
        },
        {
          title: "About",
          icon: <FaInfoCircle />,
          content: <AboutPane />,
        },
      ]}
    />
  );
}