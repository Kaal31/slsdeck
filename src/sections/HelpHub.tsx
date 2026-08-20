import { PanelSection, PanelSectionRow, ButtonItem, Focusable } from "@decky/ui";
import { useState, useRef } from "react";
import {
  FaBoxOpen, FaSlidersH, FaKey, FaDownload, FaWrench, FaCloud,
  FaShieldAlt, FaPuzzlePiece, FaGamepad, FaArrowLeft, FaQuestionCircle,
  FaArrowUp,
} from "react-icons/fa";

/** One help topic = a tab, with a plain-language explanation of each of its
 *  controls. This is the About tab's content: a list of tabs (Steam-help-wizard
 *  style) → click one → a detail page describing every toggle/button in it. */
interface HelpItem { name: string; desc: string }
interface HelpTopic { key: string; title: string; icon: any; blurb: string; items: HelpItem[] }

const TOPICS: HelpTopic[] = [
  {
    key: "dependencies", title: "Dependencies", icon: <FaBoxOpen />,
    blurb: "The engine and its helpers — install/repair here first.",
    items: [
      { name: "SLSsteam", desc: "The core steamclient hook (slsteam-moon) that makes added games appear owned. 'Install' sets it up; 'Reinstall' repairs it." },
      { name: "Steam client fix", desc: "Pins the Steam client to a version the engine supports (h3adcr-b). Run it if added games don't appear after a Steam update." },
      { name: "CloudRedirect", desc: "Redirects cloud saves for added games to your own provider. Installs automatically after setup; only needed if you use cloud saves." },
      { name: "ASSella (direct download)", desc: "Only in the slsdeckdlc build: the DepotDownloader backend (bundled DLL + .NET 9) used for content-DLC and older-build downloads." },
      { name: "Activate / Deactivate injection", desc: "Turns the engine hook on/off by patching steam.sh. Off = plain Steam." },
      { name: "Run diagnostics", desc: "Reports engine type (moon vs stock), injection state, and config health so you can see why something isn't working." },
    ],
  },
  {
    key: "options", title: "Options", icon: <FaSlidersH />,
    blurb: "Every behaviour toggle: buttons, DLC, cloud, recovery, Quick Access, and badges.",
    items: [
      { name: "Store buttons", desc: "Floating Add / Fix bar on store game pages." },
      { name: "Unlock DLC when adding a game", desc: "Marks a game's DLC owned and auto-installs the matching in-process unlocker when the game is on disk (SmokeAPI for Steam, Uplay R1/R2 for Ubisoft). In-game DLC unlocks immediately; DLC delivered as separate files still needs those files." },
      { name: "DLC unlockers on owned games only", desc: "Only show the CreamAPI/SmokeAPI/Uplay unlock buttons on games you actually own — hidden on SLS-added games where they'd do nothing. On by default." },
      { name: "Pin game version on fix", desc: "Locks a game to its current build when a fix is applied so an update can't break it. Cleared on un-fix." },
      { name: "Auto-apply fix after update", desc: "When a fix targets a specific build, pin it, update the game, then apply automatically once the download finishes. Off = you press Apply yourself." },
      { name: "Auto-fix launch target", desc: "When a fix ships a replacement exe, repoints Steam's launch to the game's real Binaries/Win64 exe so the fix runs. Your other launch options are kept; per-game override lives under Quick Access → This game." },
      { name: "Achievements (slsteam-moon)", desc: "Enables the engine's achievement handling (moon only)." },
      { name: "Hide tools & diagnostics in Quick Access", desc: "Hides the Tools and Diagnostics sections from the Quick Access panel for a cleaner menu — they stay here in Advanced." },
      { name: "Show added games in Quick Access", desc: "Moves the added-games list into Quick Access under Game controls (removes the Installed tab here). Applies when the panel is reopened." },
      { name: "Show Reinstall SLSsteam in Quick Access", desc: "When SLSsteam is installed, shows its Reinstall button in Quick Access. Install still shows when it isn't installed yet." },
      { name: "Hide actions on owned games", desc: "On game pages, hides Add with SLSsteam and Fixes for titles already in your library that weren't added by SLSsteam." },
      { name: "Backup custom manifests and fixes", desc: "Includes imported custom fixes and manifests (~/.local/share/SLSDeck) in the backup archive. Restored ones reappear in Fixes and Download. Off by default." },
      { name: "Group SLS games into a collection", desc: "Keeps a Steam collection named 'SLSDeck' auto-synced with everything you added, so they're easy to find. Updates on boot and as you add/remove. Off by default." },
      { name: "Auto-apply fixes after adding", desc: "When an add finishes, downloads and applies the online and/or Denuvo fix if available. A Denuvo fix also marks the game and installs the custom Proton." },
      { name: "Library buttons on game pages", desc: "The Add / Fixes bar injected into a game's library page. Turn off to use only the Quick Access panel." },
      { name: "Auto restart after adding", desc: "Auto restart Steam after adding a game. Off by default — restart when you're ready." },
      { name: "Add DLC automatically", desc: "On add, registers all the game's DLC depot keys (and, on newer engines, flips InjectAllAdvertisedDlc) so DLC show owned and content DLC pulls with the base. Best with a Hubcap key set." },
      { name: "Disable DLC unlock on owned games", desc: "Stops the engine auto-unlocking (unowned) DLC on games you legit own — scans your library and blacklists their DLC in the engine." },
      { name: "Disable Steam cloud on SLS games", desc: "Turns off Steam cloud for added games only (avoids Valve's rejected-sync errors). Mutually exclusive with CloudRedirect." },
      { name: "Auto re-activate injection on boot", desc: "If a Steam update leaves injection off, re-patch steam.sh on startup and fully restart Steam to apply it. Capped so it can't loop." },
      { name: "Auto re-pin Steam client on boot", desc: "If a client update broke injection, auto-run the client fix (h3adcr-b) — pins/downgrades the client and reboots. Heavy; capped. Leave off unless you want it fully hands-off." },
      { name: "Library badges (SLS / Legit / Denuvo / Online-fix / Fixed / Non-Steam + placement)", desc: "Toggle each capsule badge (SLS-added, legit, Denuvo, online-fix, fix-applied, non-Steam, non-Steam app-name) and where they show — library grid, game pages, and store pages." },
    ],
  },
  {
    key: "sources", title: "Sources & keys", icon: <FaKey />,
    blurb: "Where manifests and depot keys come from, and your logins.",
    items: [
      { name: "lua.tools (Discord sign-in)", desc: "Sign in with Discord to use your lua.tools account as a manifest source. Some games only resolve when signed in." },
      { name: "Hubcap key + 'Log in & capture key'", desc: "Hubcap is a manifest generator (full manifests incl. DLC + older builds). The button opens their site; you generate a key and it's captured straight from the page." },
      { name: "Ryuu / Steam key fields", desc: "Optional API keys for extra fix/manifest sources. Paste and Save." },
      { name: "Refresh sources", desc: "Reloads the list of free manifest sources (api.json)." },
    ],
  },
  {
    key: "addgame", title: "Add a game", icon: <FaDownload />,
    blurb: "Search for a game and add it; manage what you've added.",
    items: [
      { name: "Search (autocomplete dropdown)", desc: "Type a name or AppID; matches appear in a dropdown. Pick one to add it via the engine." },
      { name: "Your added games", desc: "The list below search: every game you've added, with a tap-to-remove. Tagged by how it was added." },
      { name: "Custom manifests / lua", desc: "Import a .lua/.manifest you got elsewhere and bind it to a game." },
    ],
  },
  {
    key: "fixes", title: "Game fixes", icon: <FaWrench />,
    blurb: "Apply per-game fixes (online play, DRM, cracks).",
    items: [
      { name: "Apply fix", desc: "Applies the matching fix for the open game — online-fix, a crack, or a DLC unlocker — into the game's folder." },
      { name: "HV crack / CrakFiles", desc: "Anti-Denuvo/crack options. '· build mismatch' or '· outdated crack' means the crack targets a different build than installed — freeze/roll back to match." },
      { name: "Online-fix username", desc: "The handle emulators use for online play. Set once here." },
    ],
  },
  {
    key: "cloud", title: "Cloud saves", icon: <FaCloud />,
    blurb: "Redirect cloud saves to your own provider.",
    items: [
      { name: "CloudRedirect provider", desc: "Sign into Google Drive / OneDrive / a local folder so added games' cloud saves sync to you instead of Valve (which rejects them)." },
      { name: "Reinstall CloudRedirect", desc: "Re-runs the flatpak install if it broke. First install pulls a large runtime, so it can take a few minutes." },
    ],
  },
  {
    key: "denuvo", title: "Anti-Denuvo", icon: <FaShieldAlt />,
    blurb: "Hypervisor-based bypass for Denuvo titles.",
    items: [
      { name: "Hypervisor", desc: "Sets up the anti-Denuvo hypervisor + custom Proton for supported games. Heavy; only for Denuvo titles." },
    ],
  },
  {
    key: "mods", title: "Mods", icon: <FaPuzzlePiece />,
    blurb: "Install mods into a game's folder.",
    items: [
      { name: "Install mod", desc: "Drops a mod into the selected game's install folder. Add the game first — mods need the game's files present." },
    ],
  },
  {
    key: "gametools", title: "Game tools (QAM)", icon: <FaGamepad />,
    blurb: "Per-game tools on the Quick Access panel while a game page is open.",
    items: [
      { name: "Steamless", desc: "Removes a SteamStub DRM wrapper from the game's exe. Only shows when the exe actually has one." },
      { name: "Freeze / Unfreeze version", desc: "Pins the game at the current build so Steam won't update it (keeps a crack matching). Unfreeze to allow updates again." },
      { name: "Roll back build", desc: "Pin to one of the builds SLSDeck has saved for this game. Steam re-downloads the changed files." },
      { name: "Install a specific build", desc: "Pick any build from SteamDB's full history (with dates) and pin it; the engine fetches the manifests and Steam re-downloads the changed files. 'Latest' unpins. Build history loads via the Steam browser (open SteamDB once to clear its bot-check; sign in for the fullest history)." },
      { name: "Download content DLC / Download a build's files", desc: "Only in slsdeckdlc: fetch DLC depots (works on legit-owned games) or an older build's files directly via DepotDownloader into the game folder." },
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
    <PanelSection title="Help">
      <div ref={topRef} />
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.75, padding: "2px 2px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <FaQuestionCircle /> Pick a section to see what each toggle and button does.
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
      {/* About lives only here on the main help page — not repeated on every
          sub-page (which is what pushed it to the bottom of each detail view). */}
      <PanelSectionRow>
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, padding: "8px 2px 2px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>About SLSDeck</div>
          <p>
            SLSDeck adds games to your Steam library on SteamOS. It replaces the
            Windows-only SteamTools loader with <b>SLSsteam</b>, an LD_AUDIT hook into
            the Steam client, and layers on game fixes and manifest sources.
          </p>
          <p>
            <b>First time here?</b> Open the <b>Dependencies</b> tab and run
            “Install SLSsteam”. Afterwards each component can be reinstalled on its
            own from the same tab.
          </p>
          <p style={{ color: "#f5a623" }}>
            CloudRedirect is experimental. Back up saves you care about.
            This build has no hypervisor — Denuvo-protected games are not supported.
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
