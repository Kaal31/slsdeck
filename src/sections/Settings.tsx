import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  Navigation,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { toaster } from "@decky/api";
import {
  ApiKeyField,
  ApiListItem,
  fetchFreeApis,
  getApiKeyFields,
  getApiList,
  getRyuuKey,
  setApiKeyFor,
  setRyuuKey,
  wsGetSteamKey,
  wsSetSteamKey,
  luatoolsStatus,
  luatoolsRedeem,
  luatoolsOauthStart,
  luatoolsOauthStatus,
  luatoolsOauthCancel,
  luatoolsSignout,
  LuatoolsStatus,
  hubcapUsage,
  HubcapUsage,
} from "../api";
import { captureHubcapKey } from "../lib/hubcapCapture";
import { captureRyuuKey, captureSteamKey } from "../lib/keyCapture";

export function SettingsSection() {
  const [fields, setFields] = useState<ApiKeyField[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [apis, setApis] = useState<ApiListItem[]>([]);
  const [ryuuKey, setRyuuKeyState] = useState("");
  const [ryuuDraft, setRyuuDraft] = useState("");
  const [steamKey, setSteamKeyState] = useState("");
  const [steamDraft, setSteamDraft] = useState("");
  const [lt, setLt] = useState<LuatoolsStatus | null>(null);
  const [ltCode, setLtCode] = useState("");
  const [ltBusy, setLtBusy] = useState(false);
  const [hub, setHub] = useState<HubcapUsage | null>(null);
  const [hubBusy, setHubBusy] = useState(false);
  const [hubCapturing, setHubCapturing] = useState(false);
  const [ryuuCapturing, setRyuuCapturing] = useState(false);
  const [steamCapturing, setSteamCapturing] = useState(false);

  const loadHub = async () => {
    setHubBusy(true);
    try {
      const r = await hubcapUsage();
      setHub(r.success && r.usage ? r.usage : null);
    } catch {
      setHub(null);
    } finally {
      setHubBusy(false);
    }
  };

  const load = async () => {
    try {
      const res = await getApiKeyFields();
      const f = res.success ? res.fields : [];
      setFields(f);
      const d: Record<string, string> = {};
      f.forEach((x) => (d[x.placeholder] = x.value || ""));
      setDrafts(d);
    } catch {
      setFields([]);
    }
    try {
      const res = await getRyuuKey();
      const k = res.success ? res.key || "" : "";
      setRyuuKeyState(k);
      setRyuuDraft(k);
    } catch {
      /* ignore */
    }
    try {
      const res = await wsGetSteamKey();
      const k = res.success ? res.key || "" : "";
      setSteamKeyState(k);
      setSteamDraft(k);
    } catch {
      /* ignore */
    }
    try {
      setLt(await luatoolsStatus());
    } catch {
      setLt(null);
    }
    try {
      const res = await getApiList();
      setApis(res.success ? res.apis : []);
    } catch {
      setApis([]);
    }
    // Live Hubcap quota, only when a Hubcap/Morrenus key is configured.
    try {
      const f = (await getApiKeyFields());
      const has = f.success && (f.fields || []).some((x) => x.placeholder === "<moapikey>" && x.hasKey);
      if (has) loadHub();
      else setHub(null);
    } catch {
      /* ignore */
    }
  };

  const doRedeem = async () => {
    const code = ltCode.trim();
    if (!code) return;
    setLtBusy(true);
    try {
      const r = await luatoolsRedeem(code);
      if (r.success) {
        toaster.toast({ title: "lua.tools", body: `Signed in as ${r.user?.name || "you"}` });
        setLtCode("");
        setLt(await luatoolsStatus());
      } else {
        toaster.toast({ title: "lua.tools", body: r.error || "Redeem failed" });
      }
    } catch (e) {
      toaster.toast({ title: "lua.tools", body: String(e) });
    } finally {
      setLtBusy(false);
    }
  };

  const doOauth = async () => {
    setLtBusy(true);
    try {
      const r = await luatoolsOauthStart();
      if (!r.success || !r.url) {
        toaster.toast({ title: "lua.tools", body: r.error || "Could not start sign-in" });
        setLtBusy(false);
        return;
      }
      // Open Discord OAuth in Steam's in-app browser (works in Game mode). The
      // consent flow redirects back to the plugin's localhost callback.
      try {
        Navigation.NavigateToExternalWeb(r.url);
      } catch {
        Navigation.NavigateToExternalWeb(r.url);
      }
      toaster.toast({ title: "lua.tools", body: "Sign in with Discord in the browser, then return here." });
      // Poll for completion (up to ~3 min).
      let tries = 0;
      const t = setInterval(async () => {
        tries += 1;
        try {
          const s = await luatoolsOauthStatus();
          if (s.done || tries > 120) {
            clearInterval(t);
            if (!s.done) {
              await luatoolsOauthCancel();
              toaster.toast({ title: "lua.tools", body: "Sign-in timed out" });
            } else {
              toaster.toast({
                title: "lua.tools",
                body: s.authed ? "Signed in ✓" : (s.error || "Sign-in failed"),
              });
            }
            setLt(await luatoolsStatus());
            setLtBusy(false);
          }
        } catch {
          /* keep polling */
        }
      }, 1500);
    } catch (e) {
      toaster.toast({ title: "lua.tools", body: String(e) });
      setLtBusy(false);
    }
  };

  const doSignout = async () => {
    setLtBusy(true);
    try {
      await luatoolsSignout();
      setLt(await luatoolsStatus());
      toaster.toast({ title: "lua.tools", body: "Signed out" });
    } finally {
      setLtBusy(false);
    }
  };

  const saveSteamKey = async () => {
    await wsSetSteamKey(steamDraft.trim());
    setSteamKeyState(steamDraft.trim());
    toaster.toast({ title: "SLSDeck", body: "Steam Web API key saved" });
  };

  const saveRyuuKey = async () => {
    await setRyuuKey(ryuuDraft.trim());
    setRyuuKeyState(ryuuDraft.trim());
    toaster.toast({ title: "SLSDeck", body: "Ryuu API key saved" });
  };

  useEffect(() => {
    load();
  }, []);

  const saveKey = async (placeholder: string) => {
    await setApiKeyFor(placeholder, drafts[placeholder] ?? "");
    toaster.toast({ title: "SLSDeck", body: "API key saved" });
    load();
  };

  const onRefreshApis = async () => {
    const res = await fetchFreeApis();
    if (res.success) {
      toaster.toast({ title: "SLSDeck", body: `Loaded ${res.count ?? 0} manifest sources` });
      load();
    } else {
      toaster.toast({ title: "SLSDeck", body: res.error || "Failed" });
    }
  };

  return (
    <PanelSection title="Sources & keys">
      {/* lua.tools account — Discord bot-code sign-in (browserless, Game-mode). */}
      <PanelSectionRow>
        <div style={{ fontSize: 12, fontWeight: 600, padding: "2px 0" }}>lua.tools account</div>
      </PanelSectionRow>
      {lt?.authed ? (
        <>
          <PanelSectionRow>
            <div style={{ fontSize: 12, color: "#8fd694" }}>
              ✓ Signed in as {lt.user?.name || "you"}
              {lt.supporter ? ` · ${lt.supporter}` : ""}
            </div>
          </PanelSectionRow>
          {lt?.debug && (
            <PanelSectionRow>
              <div style={{ fontSize: 10, opacity: 0.5, wordBreak: "break-all" }}>
                auth: {JSON.stringify(lt.debug)}
              </div>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={doSignout} disabled={ltBusy}>
              Sign out
            </ButtonItem>
          </PanelSectionRow>
        </>
      ) : (
        <>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={doOauth} disabled={ltBusy}>
              {ltBusy ? "Waiting for Discord…" : "Sign in with Discord"}
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.7, padding: "0 2px 6px" }}>
              Opens Discord in Steam's browser — sign in and authorize, then return here. Signing in
              lets the plugin add games and pin fixes to the right build from lua.tools.
            </div>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ fontSize: 11, opacity: 0.55, padding: "0 2px 2px" }}>
              Fallback: paste a bot code from the lua.tools Discord bot instead.
            </div>
          </PanelSectionRow>
          <PanelSectionRow>
            <TextField
              label="Bot code (optional)"
              value={ltCode}
              onChange={(e) => setLtCode((e.target as HTMLInputElement).value)}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={doRedeem} disabled={ltBusy || !ltCode.trim()}>
              {ltBusy ? "Redeeming…" : "Redeem code"}
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.55, padding: "0 2px 6px" }}>
          Pin source order: lua.tools (signed in) → Hubcap key → ~/Downloads/&lt;appid&gt;.lua → none.
        </div>
      </PanelSectionRow>

      {fields.map((f) => (
        <div key={f.placeholder}>
          <PanelSectionRow>
            <TextField
              label={`${f.label} (optional)${f.hasKey ? " ✓" : ""}`}
              value={drafts[f.placeholder] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [f.placeholder]: (e.target as HTMLInputElement).value }))
              }
            />
          </PanelSectionRow>
          {/* Hubcap Discord login + auto-capture. Opens the key page in the
              in-app browser; you log in with Discord and hit "Regenerate Key",
              and the plugin reads the generated key straight from the page's DOM
              (over CDP, like the store patch) and saves it — no copy-paste.
              Hubcap auth is an httpOnly cookie so the key can't be fetched from
              the backend, but it's rendered on the page, so we scrape it. */}
          {f.placeholder === "<moapikey>" && (
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                disabled={hubCapturing}
                onClick={async () => {
                  try {
                    Navigation.NavigateToExternalWeb("https://hubcapmanifest.com/api-keys/stats");
                  } catch { /* ignore */ }
                  setHubCapturing(true);
                  toaster.toast({ title: "Hubcap", body: "Sign in with Discord — I'll generate and grab your key automatically." });
                  try {
                    const key = await captureHubcapKey(180000, () => {});
                    if (key) {
                      await setApiKeyFor("<moapikey>", key);
                      toaster.toast({ title: "Hubcap", body: "Key captured and saved ✓" });
                      load();
                    } else {
                      toaster.toast({ title: "Hubcap", body: "Didn't see a key in time. Generate it, then tap again — or paste it above." });
                    }
                  } catch (e) {
                    toaster.toast({ title: "Hubcap", body: `Capture error: ${e}` });
                  }
                  setHubCapturing(false);
                }}
              >
                {hubCapturing ? "Waiting for key… (sign in with Discord)" : "Sign in to Hubcap & capture key"}
              </ButtonItem>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => saveKey(f.placeholder)}
              disabled={(drafts[f.placeholder] ?? "") === (f.value ?? "")}
            >
              Save {f.label}
            </ButtonItem>
          </PanelSectionRow>
          {/* Live Hubcap quota under the Hubcap/Morrenus key field. */}
          {f.placeholder === "<moapikey>" && f.hasKey && (
            <PanelSectionRow>
              <div style={{ width: "100%", fontSize: 11, opacity: 0.9, padding: "2px 2px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>Hubcap quota</span>
                  <span
                    style={{ textDecoration: "underline", cursor: "pointer", opacity: 0.7 }}
                    onClick={loadHub}
                  >
                    {hubBusy ? "refreshing…" : "refresh"}
                  </span>
                </div>
                {hub ? (
                  <div style={{ marginTop: 4 }}>
                    {(["single", "bundle", "workshop"] as const).map((k) => {
                      const q = hub[k];
                      if (!q) return null;
                      const usedPct = q.limit > 0 ? Math.max(0, Math.min(100, Math.round((q.usage / q.limit) * 100))) : 0;
                      const low = q.limit > 0 && q.remaining <= Math.max(1, Math.ceil(q.limit * 0.1));
                      return (
                        <div key={k} style={{ marginBottom: 7 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ textTransform: "capitalize" }}>{k}</span>
                            <span style={{ fontWeight: 600 }}>{q.remaining}/{q.limit} left · {usedPct}% used</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${usedPct}%`, background: low ? "#d99035" : "#4a90d9", transition: "width 0.25s" }} />
                          </div>
                          {low ? <div style={{ marginTop: 2, opacity: 0.8 }}>Low quota — {q.remaining} request{q.remaining === 1 ? "" : "s"} remaining.</div> : null}
                        </div>
                      );
                    })}
                    <div style={{ opacity: 0.65, marginTop: 2 }}>
                      Steam service: {hub.steam_service_ready ? "ready ✓" : "not ready"}
                    </div>
                  </div>
                ) : (
                  <div style={{ opacity: 0.6, marginTop: 2 }}>
                    {hubBusy ? "Loading…" : "Quota unavailable (check the key)."}
                  </div>
                )}
              </div>
            </PanelSectionRow>
          )}
        </div>
      ))}
      <PanelSectionRow>
        <TextField
          label={`Ryuu API key (manifests + gated fixes)${ryuuKey ? " ✓" : ""}`}
          value={ryuuDraft}
          onChange={(e) => setRyuuDraft((e.target as HTMLInputElement).value)}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ width: "100%", fontSize: 11, opacity: 0.75, padding: "2px 2px 6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Ryuu quota</span>
            <span>{ryuuKey ? "API key ready ✓" : "API key not set"}</span>
          </div>
          <div style={{ marginTop: 3 }}>Free accounts: 50 manifest downloads per 24 hours.</div>
          <div style={{ marginTop: 2, opacity: 0.65 }}>
            Ryuu's documented API does not expose a live remaining-count endpoint, so SLSDeck shows the published limit rather than guessing your balance.
          </div>
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          From generator.ryuu.lol/api. The same X-Auth-Key is used for Ryuu manifest downloads and gated fixes.
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={saveRyuuKey}
          disabled={ryuuDraft.trim() === (ryuuKey ?? "")}
        >
          Save Ryuu API key
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        {/* Opens Ryuu's dashboard (triggers Discord OAuth if needed), then makes
            the authenticated POST /api/refresh_my_auth_key request itself and reads
            the fresh key from the JSON response ({"auth_key":"…"}). No copy-paste. */}
        <ButtonItem
          layout="below"
          disabled={ryuuCapturing}
          onClick={async () => {
            try { Navigation.NavigateToExternalWeb("https://generator.ryuu.lol/api"); } catch { /* ignore */ }
            setRyuuCapturing(true);
            toaster.toast({ title: "Ryuu", body: "Sign in with Discord — I'll grab your API key automatically." });
            try {
              const key = await captureRyuuKey(180000, () => {});
              if (key) {
                await setRyuuKey(key);
                setRyuuKeyState(key);
                setRyuuDraft(key);
                toaster.toast({ title: "Ryuu", body: "Key captured and saved ✓" });
              } else {
                toaster.toast({ title: "Ryuu", body: "Didn't see a key in time. Log in on the page, then tap again — or paste it above." });
              }
            } catch (e) {
              toaster.toast({ title: "Ryuu", body: `Capture error: ${e}` });
            }
            setRyuuCapturing(false);
          }}
        >
          {ryuuCapturing ? "Waiting for key… (sign in on the page)" : "Log in to Ryuu & capture key"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <TextField
          label={`Steam Web API key (for Workshop mod search)${steamKey ? " ✓" : ""}`}
          value={steamDraft}
          onChange={(e) => setSteamDraft((e.target as HTMLInputElement).value)}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 11, opacity: 0.6, padding: "0 2px 4px" }}>
          Optional. Get a free key at steamcommunity.com/dev/apikey for richer
          Workshop search (thumbnails, ranking). Without it, search still works
          via the public browse page.
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={saveSteamKey}
          disabled={steamDraft.trim() === (steamKey ?? "")}
        >
          Save Steam Web API key
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        {/* Opens Steam's Web API key page and reads the 32-hex key straight off
            the DOM (you're already signed into Steam in the in-app browser). */}
        <ButtonItem
          layout="below"
          disabled={steamCapturing}
          onClick={async () => {
            try { Navigation.NavigateToExternalWeb("https://steamcommunity.com/dev/apikey"); } catch { /* ignore */ }
            setSteamCapturing(true);
            toaster.toast({ title: "Steam", body: "Grabbing your Web API key — register one on the page if prompted." });
            try {
              const key = await captureSteamKey(120000, () => {});
              if (key) {
                await wsSetSteamKey(key);
                setSteamKeyState(key);
                setSteamDraft(key);
                toaster.toast({ title: "Steam", body: "Web API key captured and saved ✓" });
              } else {
                toaster.toast({ title: "Steam", body: "No key found. Register a key on the page (any domain), then tap again." });
              }
            } catch (e) {
              toaster.toast({ title: "Steam", body: `Capture error: ${e}` });
            }
            setSteamCapturing(false);
          }}
        >
          {steamCapturing ? "Waiting for key…" : "Open Steam key page & capture"}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <div style={{ fontSize: 12, opacity: 0.7, padding: "2px 0" }}>
          Sources: {apis.length ? apis.map((a) => a.name).join(", ") : "none"}
        </div>
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={onRefreshApis}>
          Refresh sources
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
}