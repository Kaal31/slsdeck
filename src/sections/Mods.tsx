import {
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  TextField,
  Focusable,
  ToggleField,
  Spinner,
} from "@decky/ui";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@decky/api";
import {
  wsResolve,
  wsDownload,
  wsDownloadState,
  wsSearch,
  wsListGames,
  wsListMods,
  wsSetEnabled,
  wsRemove,
  WsResolve,
  WsMod,
  WsSearchItem,
  hubcapWorkshopManifest,
} from "../api";
import { appDisplayName } from "../lib/fixRuntime";

function fmtSize(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${u[i]}`;
}

function gameLabel(appid: number): string {
  const name = appDisplayName(appid);
  return name ? `${name} (${appid})` : `App ${appid}`;
}

/**
 * Steam Workshop mods: paste a mod or collection ID/URL, resolve the owning
 * game, and (if that game is installed) download via SteamCMD straight into the
 * game's own workshop content dir. Below, manage what's already installed
 * per-game: enable/disable (.disabled rename) or remove.
 */
export function ModsSection() {
  const [input, setInput] = useState("");
  const [resolved, setResolved] = useState<WsResolve | null>(null);
  const [resolving, setResolving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; status: string; current?: string } | null>(null);
  const pollRef = useRef<any>(null);

  const [results, setResults] = useState<WsSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState("");
  const debRef = useRef<any>(null);

  const [games, setGames] = useState<{ appid: number; modCount: number }[]>([]);
  const [openGame, setOpenGame] = useState<number | null>(null);
  const [mods, setMods] = useState<WsMod[]>([]);
  const [busy, setBusy] = useState(false);

  const loadGames = async () => {
    try {
      const r = await wsListGames();
      if (r.success) setGames(r.games || []);
    } catch {}
  };

  const [hubBusy, setHubBusy] = useState<number | null>(null);
  const getWsManifest = async (appid: number) => {
    setHubBusy(appid);
    try {
      const r = await hubcapWorkshopManifest(appid);
      toaster.toast({
        title: "Workshop manifest",
        body: r.success
          ? `Fetched & published (${Math.round((r.bytes || 0) / 1024)} KB). Restart Steam to use it.`
          : r.error || "Failed (needs a Hubcap key with workshop quota).",
      });
    } catch (e) {
      toaster.toast({ title: "Workshop manifest", body: String(e) });
    } finally {
      setHubBusy(null);
    }
  };

  const looksLikeId = (t: string) => /(?:[?&]id=\d+)|^\s*\d{6,}\s*$/.test(t.trim());

  const runSearch = async (q: string) => {
    setSearching(true);
    setResolved(null);
    try {
      const r = await wsSearch(q, 40);
      if (r.success) {
        setResults(r.results || []);
        setSearchNote(
          r.note === "no_installed_games"
            ? "No SLS-added games are installed yet — add and install a game first."
            : (r.results || []).length === 0
            ? "No matching Workshop items in your installed games."
            : ""
        );
      }
    } catch {
      /* ignore */
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    loadGames();
    runSearch(""); // initial browse: popular mods across your installed SLS games
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, []);

  const onInput = (v: string) => {
    setInput(v);
    if (debRef.current) clearTimeout(debRef.current);
    const q = v.trim();
    if (looksLikeId(q)) {
      setResults([]);
      debRef.current = setTimeout(() => doResolve(q), 400);
    } else {
      debRef.current = setTimeout(() => runSearch(q), 500);
    }
  };

  const doResolve = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setResolving(true);
    setResolved(null);
    try {
      const r = await wsResolve(q);
      setResolved(r);
      if (!r.success) toaster.toast({ title: "Workshop", body: r.error || "Could not resolve" });
    } catch (e) {
      toaster.toast({ title: "Workshop", body: String(e) });
    } finally {
      setResolving(false);
    }
  };

  const pollProgress = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await wsDownloadState(jobId);
        const s = r.state || {};
        setProgress({
          done: s.done || 0,
          total: s.total || 0,
          status: s.status || "",
          current: s.current,
        });
        if (s.status === "done" || s.status === "failed") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          const failed = (s.failed || []).length;
          toaster.toast({
            title: "Workshop",
            body:
              s.status === "done"
                ? `Installed ${s.done}/${s.total} item(s)`
                : `Finished with ${failed} failure(s)`,
          });
          loadGames();
        }
      } catch {}
    }, 1500);
  };

  const doDownload = () => runDownload(input.trim());

  const runDownload = async (q: string) => {
    if (!q) return;
    setBusy(true);
    try {
      const r = await wsDownload(q);
      if (!r.success) {
        if (r.error === "owned_game") {
          toaster.toast({
            title: "Workshop",
            body: `${r.title || gameLabel(r.appid || 0)} is a game you own — mods only install for SLSDeck-added or non-Steam games.`,
          });
        } else if (r.error === "not_installed") {
          toaster.toast({
            title: "Workshop",
            body: `Install ${r.title || gameLabel(r.appid || 0)} first — mods install into the game's folder.`,
          });
        } else {
          toaster.toast({ title: "Workshop", body: r.error || "Download failed" });
        }
        return;
      }
      setProgress({ done: 0, total: r.count || 1, status: "queued" });
      if (r.job) pollProgress(r.job);
    } catch (e) {
      toaster.toast({ title: "Workshop", body: String(e) });
    } finally {
      setBusy(false);
    }
  };

  const openManage = async (appid: number) => {
    if (openGame === appid) {
      setOpenGame(null);
      setMods([]);
      return;
    }
    setOpenGame(appid);
    setBusy(true);
    try {
      const r = await wsListMods(appid);
      if (r.success) setMods(r.mods || []);
    } finally {
      setBusy(false);
    }
  };

  const toggleMod = async (appid: number, mod: WsMod) => {
    setBusy(true);
    try {
      const r = await wsSetEnabled(appid, mod.modid, !mod.enabled);
      if (r.success) {
        setMods((prev) => prev.map((m) => (m.modid === mod.modid ? { ...m, enabled: !mod.enabled } : m)));
      } else {
        toaster.toast({ title: "Workshop", body: r.error || "Failed" });
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteMod = async (appid: number, mod: WsMod) => {
    setBusy(true);
    try {
      const r = await wsRemove(appid, mod.modid);
      if (r.success) {
        setMods((prev) => prev.filter((m) => m.modid !== mod.modid));
        loadGames();
      } else {
        toaster.toast({ title: "Workshop", body: r.error || "Failed" });
      }
    } finally {
      setBusy(false);
    }
  };

  const dl = progress;

  return (
    <>
      <PanelSection title="Find a Workshop mod">
        <PanelSectionRow>
          <Focusable style={{ display: "flex", flexDirection: "column" }}>
            <TextField
              label="Search your games' Workshop, or paste a mod/collection ID/URL"
              value={input}
              onChange={(e: any) => onInput(e.target.value)}
              disabled={busy}
            />
          </Focusable>
        </PanelSectionRow>

        {searching && (
          <PanelSectionRow>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
              <Spinner style={{ width: 16, height: 16 }} /> Searching Workshop…
            </div>
          </PanelSectionRow>
        )}

        {!!searchNote && !searching && (
          <PanelSectionRow>
            <div style={{ fontSize: 12, opacity: 0.7, padding: "2px 0" }}>{searchNote}</div>
          </PanelSectionRow>
        )}

        {!searching &&
          results.map((it) => (
            <PanelSectionRow key={it.modid}>
              <ButtonItem layout="below" onClick={() => runDownload(it.modid)} disabled={busy}>
                <Focusable style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {it.gameName || `App ${it.appid}`}
                    {it.subs ? ` · ${it.subs.toLocaleString()} subs` : ""}
                  </span>
                </Focusable>
              </ButtonItem>
            </PanelSectionRow>
          ))}

        {looksLikeId(input) && (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={() => doResolve()} disabled={resolving || busy || !input.trim()}>
              {resolving ? "Resolving…" : "Look up pasted ID"}
            </ButtonItem>
          </PanelSectionRow>
        )}

        {resolved?.success && (
          <>
            <PanelSectionRow>
              <div style={{ fontSize: 13, padding: "2px 0" }}>
                <div style={{ fontWeight: 600 }}>
                  {resolved.title}
                  {resolved.isCollection ? ` · collection (${resolved.children?.length || 0} items)` : ""}
                </div>
                <div style={{ opacity: 0.8 }}>
                  Game: {gameLabel(resolved.appid || 0)}
                </div>
                <div style={{ color: resolved.allowed ? "#58c578" : "#f5a623" }}>
                  {resolved.allowed
                    ? "✓ SLSDeck-added / non-Steam game"
                    : "• Owned Steam game — not eligible (SLSDeck-added or non-Steam only)"}
                </div>
                {resolved.allowed && (
                  <div style={{ color: resolved.installed ? "#58c578" : "#f5a623" }}>
                    {resolved.installed ? "✓ Game is installed" : "• Game not installed — install it first"}
                  </div>
                )}
              </div>
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={doDownload}
                disabled={busy || !resolved.allowed || !resolved.installed || (!!dl && dl.status !== "done" && dl.status !== "failed")}
              >
                {resolved.isCollection ? "Download collection" : "Download mod"}
              </ButtonItem>
            </PanelSectionRow>
          </>
        )}

        {dl && (
          <PanelSectionRow>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              {dl.status !== "done" && dl.status !== "failed" && <Spinner style={{ width: 16, height: 16 }} />}
              <span>
                {dl.status === "done"
                  ? `Done — ${dl.done}/${dl.total}`
                  : dl.status === "failed"
                  ? `Failed — ${dl.done}/${dl.total} ok`
                  : `${dl.status} ${dl.done}/${dl.total}${dl.current ? ` (item ${dl.current})` : ""}`}
              </span>
            </div>
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title="Installed mods">
        {games.length === 0 && (
          <PanelSectionRow>
            <div style={{ fontSize: 12, opacity: 0.7 }}>No workshop mods installed yet.</div>
          </PanelSectionRow>
        )}
        {games.map((g) => (
          <div key={g.appid}>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={() => openManage(g.appid)}>
                {gameLabel(g.appid)} — {g.modCount} mod{g.modCount === 1 ? "" : "s"}
                {openGame === g.appid ? " ▲" : " ▼"}
              </ButtonItem>
            </PanelSectionRow>
            {openGame === g.appid && (
              <>
                {busy && mods.length === 0 && (
                  <PanelSectionRow>
                    <Spinner style={{ width: 20, height: 20 }} />
                  </PanelSectionRow>
                )}
                {mods.map((m) => (
                  <div key={m.modid}>
                    <PanelSectionRow>
                      <ToggleField
                        label={m.title ? m.title : `Mod ${m.modid}`}
                        description={`${m.modid} · ${fmtSize(m.sizeBytes)}`}
                        checked={m.enabled}
                        disabled={busy}
                        onChange={() => toggleMod(g.appid, m)}
                      />
                    </PanelSectionRow>
                    <PanelSectionRow>
                      <ButtonItem layout="below" onClick={() => deleteMod(g.appid, m)} disabled={busy}>
                        Remove mod {m.modid}
                      </ButtonItem>
                    </PanelSectionRow>
                  </div>
                ))}
                {!busy && mods.length === 0 && (
                  <PanelSectionRow>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>No mods found.</div>
                  </PanelSectionRow>
                )}
                <PanelSectionRow>
                  <ButtonItem
                    layout="below"
                    disabled={hubBusy === g.appid}
                    onClick={() => getWsManifest(g.appid)}
                  >
                    {hubBusy === g.appid ? "Fetching…" : "Fetch Workshop manifest (Hubcap)"}
                  </ButtonItem>
                </PanelSectionRow>
                <PanelSectionRow>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    For account-gated workshop content: pulls this game's Workshop
                    manifest from Hubcap (needs a Hubcap key + workshop quota) and
                    publishes it so the engine can serve the workshop depot.
                  </div>
                </PanelSectionRow>
              </>
            )}
          </div>
        ))}
      </PanelSection>
    </>
  );
}
