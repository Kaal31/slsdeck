import { PanelSection, PanelSectionRow } from "@decky/ui";
import { useEffect, useState } from "react";
import { currentLibraryAppId, depotdlQueue } from "../api";

type BuildJob = {
  appid: number;
  status: string;
  percent: number;
  op?: string;
  error?: string;
};

/**
 * Persistent QAM progress for DepotDownloader build jobs, including the
 * SteamDB-specific-build path. GameTools' local poller used to miss that path
 * because the job can start from inside the build-picker modal without starting
 * its interval. This watcher reads the backend queue directly, so progress is
 * visible immediately and survives closing/reopening the modal.
 */
export function SpecificBuildDownloadStatus() {
  const [job, setJob] = useState<BuildJob | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const appid = currentLibraryAppId();
      if (appid == null) {
        if (alive) setJob(null);
        return;
      }
      try {
        const q = await depotdlQueue();
        const next = (q.items || []).find((x) => x.appid === appid && x.op === "build") || null;
        if (alive) setJob(next as BuildJob | null);
      } catch {
        if (alive) setJob(null);
      }
    };
    poll();
    const iv = setInterval(poll, 1000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  if (!job || !["resolving", "downloading", "done", "failed"].includes(job.status)) return null;
  const pct = job.status === "done" ? 100 : Math.max(0, Math.min(100, job.percent || 0));
  const label = job.status === "resolving"
    ? ".NET / DepotDownloader preparing…"
    : job.status === "downloading"
      ? `Downloading specific build · ${pct}%`
      : job.status === "done"
        ? "Specific build download complete"
        : "Specific build download failed";

  return (
    <PanelSection title="Specific build download">
      <PanelSectionRow>
        <div style={{ width: "100%", padding: "2px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span>{label}</span>
            {job.status === "downloading" || job.status === "done" ? <span>{pct}%</span> : null}
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${job.status === "failed" ? 100 : pct}%`,
              background: job.status === "failed" ? "#d9534f" : job.status === "done" ? "#5cb85c" : "#4a90d9",
              transition: "width 0.25s",
            }} />
          </div>
          {job.error ? <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>{job.error}</div> : null}
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}