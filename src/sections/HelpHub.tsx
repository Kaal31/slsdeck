import { PanelSection, PanelSectionRow, ButtonItem, Focusable } from "@decky/ui";
import { useState, useRef } from "react";
import {
  FaBoxOpen, FaSlidersH, FaKey, FaDownload, FaWrench, FaCloud,
  FaShieldAlt, FaPuzzlePiece, FaGamepad, FaArrowLeft, FaQuestionCircle,
  FaArrowUp,
} from "react-icons/fa";

/** One help topic = a tab, with a plain-language explanation of each of its
 * controls. This is the About tab's content: a list of tabs → click one → a
 * detail page describing the current buttons/toggles in that area. */
interface HelpItem { name: string; desc: string }
interface HelpTopic { key: string; title: string; icon: any; blurb: string; items: HelpItem[] }

const TOPICS: HelpTopic[] = [
  {
    key: "dependencies", title: "Dependencies", icon: <FaBoxOpen />,
    blurb: "The engine and its helpers — install or repair them here.",
    items: [
      { name: "SLSsteam / slsteam-moon", desc: "Core steamclient hook that makes added games appear owned. First install is always offered when missing; Reinstall is a separate repair action once installed." },
      { name: "Steam client fix", desc: "Pins/downgrades the Steam client with h3adcr-b when a Steam update breaks the engine's supported patterns." },
      { name: "CloudRedirect runtime", desc: "The required cloudredirect-moon cloud_redirect.so hook. Reinstall refreshes the moon runtime without treating the optional setup UI as the runtime itself." },
      { name: "CloudRedirect setup UI", desc: "Optional Flatpak companion used when a provider still needs to be configured. Its Steam shortcut is created/rebound when needed and gets cover, hero, wide capsule, logo and icon artwork." },
      { name: "DepotDownloader / .NET", desc: "Direct downloader used for specific builds and content DLC. First use can prepare a local .NET runtime; status/progress is shown in the current game's QAM tools." },
      { name: "Activate / Deactivate injection", desc: "Turns the SLSsteam launch hook on or off. Deactivate returns the next Steam launch to vanilla Steam." },
      { name: "Run diagnostics", desc: "Shows engine type, injection state and config health when adds stop working or a Steam update changes something." },
    ],
  },
  {
    key: "options", title: "Options", icon: <FaSlidersH />,
    blurb: "All current behaviour toggles: buttons, fixes, DLC/cloud, QAM, recovery, library and badges.",
    items: [
      { name: "Store buttons", desc: "Show or hide the floating Add / Fix controls on Steam store game pages." },
      { name: "Library buttons on game pages", desc: "Show or hide the Add / Fixes bar injected into library game pages." },
      { name: "Hide actions on owned games", desc: "Hide SLS Add/Fixes actions on titles already owned legitimately." },

      { name: "No internet fix", desc: "Uses SLSDeck's pinned-build manifest/key recovery path when Steam reports no internet while downloading an older build." },
      { name: "Pin game version on fix", desc: "Version-lock a game when a fix is applied so a later Steam update cannot immediately break that fix. Un-fix removes the pin." },
      { name: "Auto-apply fix after update", desc: "For build-specific fixes, wait for the required build to finish downloading and then apply the fix automatically instead of asking again." },
      { name: "Auto-fix launch target", desc: "When appropriate, repoint Steam to the real/replacement game executable while preserving the rest of the launch options." },
      { name: "Auto-apply fixes after adding", desc: "After a successful Add Game, automatically apply an available online/Denuvo fix according to the normal fix rules." },

      { name: "Unlock DLC when adding a game", desc: "Registers DLC entitlement data and can install the appropriate in-process DLC unlocker. File-backed DLC still needs the actual depot files." },
      { name: "DLC unlockers on owned games only", desc: "Only expose CreamAPI/SmokeAPI/Uplay unlocker controls for legitimately owned games, where those tools are useful." },
      { name: "Add DLC automatically", desc: "During Add Game, also register advertised/content DLC data so supported DLC is included automatically. Best results use a Hubcap key." },
      { name: "Disable DLC unlock on owned games", desc: "Prevent moon from blanket-unlocking unowned DLC on games you genuinely own." },
      { name: "Disable Steam cloud on SLS games", desc: "Disable Valve Steam Cloud only for SLS-added games. Mutually exclusive with using CloudRedirect for those saves." },

      { name: "Hide tools & diagnostics in Quick Access", desc: "Keep the QAM compact by hiding general Tools/Diagnostics there; those controls remain in Advanced." },
      { name: "Show Actions & fixes in Quick Access", desc: "Show the per-game Actions & fixes block in QAM." },
      { name: "Show added games in Quick Access", desc: "Move the added-games list into QAM instead of showing it only on the Add a game page." },
      { name: "Show Reinstall SLSsteam in Quick Access", desc: "Controls the complete SLSsteam status and Reinstall section on store pages once SLSsteam already exists. First-time Install still appears when SLSsteam is missing regardless of this toggle; the section stays hidden on library game pages." },

      { name: "Achievements (slsteam-moon)", desc: "Allow moon to obtain/use achievement schema support for added games." },
      { name: "Group SLS games into a collection", desc: "Keep a Steam collection called SLSDeck synchronized with the games added through SLSsteam." },
      { name: "Backup custom manifests and fixes", desc: "Include imported/custom SLSDeck manifests and fixes in the user-created backup archive." },
      { name: "Auto restart after adding", desc: "Legacy/fallback behaviour for add paths that still require a Steam restart. Verified moon live-adds avoid the restart when runtime refresh succeeds." },

      { name: "Auto re-activate injection on boot", desc: "If a Steam update disables the launch hook, re-apply it automatically. Retry limiting prevents loops." },
      { name: "Auto re-pin Steam client on boot", desc: "Automatically run the heavier client pin/downgrade recovery when the installed Steam client is no longer supported." },

      { name: "Emoji Badges", desc: "Replace enabled text badges with emoji equivalents, including SLS 🏴‍☠️, Legit 💵, Fix 🔧, Online Fix 🌐, Denuvo 👺 and Non-Steam ❓." },
      { name: "Individual badge toggles", desc: "Enable or disable SLS, Legit, Denuvo, Online-fix, Fixed, Non-Steam and Non-Steam-name badges independently." },
      { name: "Badge placement toggles", desc: "Choose whether badges appear in the library grid/home carousel, game details pages and store pages." },
    ],
  },
  {
    key: "sources", title: "Sources & keys", icon: <FaKey />,
    blurb: "Manifest/fix sources, authentication and API/depot keys.",
    items: [
      { name: "lua.tools (Discord sign-in)", desc: "Authenticate to lua.tools for account-gated manifests and fixes." },
      { name: "Hubcap key / capture", desc: "Hubcap can provide richer manifests including depot information used by specific-build and direct-download flows." },
      { name: "Ryuu and other keys", desc: "Optional credentials for fix/manifest sources that require an account or API key." },
      { name: "Refresh sources", desc: "Reload the configured manifest-source list." },
    ],
  },
  {
    key: "addgame", title: "Add a game", icon: <FaDownload />,
    blurb: "Find a game, register it with moon and manage your added library.",
    items: [
      { name: "Search / AppID", desc: "Search by title or enter an AppID, then add through the configured manifest sources and SLSsteam." },
      { name: "Live add", desc: "On slsteam-moon, SLSDeck verifies the runtime package/appinfo refresh and avoids restarting Steam when the add became live successfully." },
      { name: "Your added games", desc: "Lists SLS registrations and lets you remove a registration without deleting the installed game files." },
      { name: "Survival restore", desc: "Plugin removal keeps an external recovery archive. Reinstall can restore missing AppID registrations, Lua registrations, exact manifest GIDs/files, pinned builds and fix history automatically." },
      { name: "Custom manifests / Lua", desc: "Import your own manifest/Lua material and bind it to an AppID." },
    ],
  },
  {
    key: "fixes", title: "Game fixes", icon: <FaWrench />,
    blurb: "Apply, track and undo per-game fixes.",
    items: [
      { name: "Apply fix", desc: "Apply the selected online fix, crack/bypass or other supported payload to the game folder." },
      { name: "Build-aware fixes", desc: "When a fix targets a specific manifest/build, SLSDeck can pin/download that build first and then apply the payload." },
      { name: "Fix history / Un-fix", desc: "SLSDeck records exactly what a fix wrote/replaced in luatools-fix-log-<appid>.log so Un-fix can restore originals. Those logs are also preserved by the external survival archive." },
      { name: "HV crack / CrakFiles", desc: "Alternative crack sources can require a particular build; mismatch indicators tell you when the installed build needs to change first." },
      { name: "Online-fix username", desc: "Player name written into supported online-fix emulator configs." },
    ],
  },
  {
    key: "cloud", title: "Cloud saves", icon: <FaCloud />,
    blurb: "Use cloudredirect-moon for SLS game save redirection.",
    items: [
      { name: "cloudredirect-moon runtime", desc: "The actual redirect engine is cloud_redirect.so loaded into Steam. It does not require the setup Flatpak to remain running." },
      { name: "Provider setup UI", desc: "If no provider is configured yet, the optional CloudRedirect UI/Flatpak is used to sign in and write provider configuration." },
      { name: "Reinstall CloudRedirect", desc: "Refreshes the moon runtime hook while preserving provider configuration. It does not blindly replace a working setup UI." },
      { name: "Steam shortcut", desc: "When the setup UI is needed, SLSDeck creates or repairs its Steam shortcut and reapplies cover, hero, wide capsule, logo and icon artwork." },
    ],
  },
  {
    key: "denuvo", title: "HV Module", icon: <FaShieldAlt />,
    blurb: "Hypervisor/custom-Proton tooling for supported Denuvo fixes.",
    items: [
      { name: "HV Module", desc: "Install/manage the anti-Denuvo hypervisor support used by compatible fixes. This is a heavy optional dependency and only applies to supported titles." },
    ],
  },
  {
    key: "mods", title: "Mods", icon: <FaPuzzlePiece />,
    blurb: "Install supported mods into an existing game installation.",
    items: [
      { name: "Install mod", desc: "Install a selected mod into the game's folder. The base game files must already exist." },
    ],
  },
  {
    key: "gametools", title: "Game tools (QAM)", icon: <FaGamepad />,
    blurb: "Per-game controls shown while a Steam library game page is open.",
    items: [
      { name: "Proton / saves / repair", desc: "Change Proton, back up or restore saves, and run per-game repair operations." },
      { name: "Steamless / DLC unlockers", desc: "Context-sensitive DRM/DLC tools appear only where the game/files support them." },
      { name: "Freeze / Unfreeze version", desc: "Pin the current version to prevent updates, or unpin it to track latest again." },
      { name: "Install a specific build", desc: "Pick a SteamDB build and resolve its depot manifest GIDs. Steam can download through moon, or DepotDownloader can place the exact build files directly when available." },
      { name: "Specific-build download status", desc: "DepotDownloader jobs are polled in the current game's QAM and show preparation/downloading state, percent progress, completion and errors. The old separate global status component was intentionally folded into this game-specific panel." },
      { name: "Download content DLC", desc: "Directly download file-backed content DLC through DepotDownloader without marking an otherwise legitimate base-game directory as a managed full-game install." },
      { name: "Steam uninstall cleanup", desc: "For full games installed/overwritten through the managed DepotDownloader build path, SLSDeck tracks the exact install directory and cleans leftover files after a real Steam UI uninstall transition." },
    ],
  },
];

export function HelpHub() {
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollTo = (r: { current: HTMLDivElement | null }) =>
    r.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (topic) {
    return (
      <PanelSection title={topic.title}>
        <div ref={topRef} />
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => setTopic(null)}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaArrowLeft /> Back to help
            </span>
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ fontSize: 12, opacity: 0.75, padding: "2px 2px 8px" }}>{topic.blurb}</div>
        </PanelSectionRow>
        {topic.items.map((it) => (
          <PanelSectionRow key={it.name}>
            <div style={{ padding: "4px 2px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{it.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>{it.desc}</div>
            </div>
          </PanelSectionRow>
        ))}
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => scrollTo(topRef)}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FaArrowUp /> Back to top
            </span>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  return (
    <PanelSection title="Help & About">
      <div ref={topRef} />
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.75, padding: "2px 2px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <FaQuestionCircle /> Pick a section to see what its current controls and toggles do.
        </div>
      </PanelSectionRow>
      {TOPICS.map((t) => (
        <PanelSectionRow key={t.key}>
          <ButtonItem layout="below" onClick={() => setTopic(t)}>
            <Focusable style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
              <span style={{ opacity: 0.85 }}>{t.icon}</span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>{t.blurb}</span>
              </span>
            </Focusable>
          </ButtonItem>
        </PanelSectionRow>
      ))}
      <PanelSectionRow>
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, padding: "8px 2px 2px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>About SLSDeck</div>
          <p>
            SLSDeck integrates <b>slsteam-moon</b> with SteamOS/Decky and adds
            manifest/build management, direct DepotDownloader downloads, game fixes,
            cloud-save redirection, recovery tools, badges and per-game utilities.
          </p>
          <p>
            <b>First install:</b> open <b>Dependencies</b> and install SLSsteam.
            Once installed, reinstall/repair controls are intentionally separate;
            the Quick Access reinstall button can be hidden without hiding first-time setup.
          </p>
          <p>
            Plugin removal keeps a recovery archive outside the plugin directory.
            On reinstall SLSDeck can restore missing game registrations, exact build
            GIDs/manifests, pinned-build state and fix history automatically.
          </p>
          <p style={{ color: "#f5a623" }}>
            Build rollback, cracks, hypervisor tooling and cloud redirection are advanced
            operations. Keep important saves backed up before modifying a game installation.
          </p>
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={() => scrollTo(topRef)}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaArrowUp /> Back to top
          </span>
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}
