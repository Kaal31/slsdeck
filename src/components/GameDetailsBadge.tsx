import { useParams } from "@decky/ui";
import { useEffect, useState } from "react";
import {
  denuvoKnown, denuvoResolve, getBadgeOptions, getEverAdded, getInstalledFixes, hasLua,
} from "../api";
import { isInLibrary, isNonSteamShortcut } from "../lib/ownership";
import { ONLINE_RE } from "../lib/badges";

type Kind = "sls" | "legit" | "denuvo" | "onlinefix" | "fixed";

const STYLES: Record<Kind, { label: string; background: string }> = {
  sls: { label: "SLS", background: "linear-gradient(135deg, #7b4dd8 0%, #a855f7 100%)" },
  legit: { label: "LEGIT", background: "linear-gradient(135deg, #1f7a3f 0%, #2fa85c 100%)" },
  denuvo: { label: "DENUVO", background: "linear-gradient(135deg, #a12a2a 0%, #e05252 100%)" },
  onlinefix: { label: "ONLINE FIX", background: "linear-gradient(135deg, #1f5f9e 0%, #3d8fd8 100%)" },
  fixed: { label: "FIXED", background: "linear-gradient(135deg, #0d7d7d 0%, #17b3b3 100%)" },
};

/**
 * The same SLS / LEGIT / DENUVO badges as the library capsules, shown on the
 * game details page. Independent of the library-button and hide-on-owned
 * toggles — this is purely informational.
 */
export function GameDetailsBadge() {
  const params = useParams<{ appid: string }>();
  const appid =
    params?.appid && /^\d+$/.test(params.appid) ? parseInt(params.appid, 10) : null;

  const [kinds, setKinds] = useState<Kind[]>([]);

  useEffect(() => {
    if (appid == null) {
      setKinds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      let opts = {
        sls: true, legit: true, denuvo: true, gamePage: true, onlineFix: true, fixed: true,
      };
      try {
        const r = await getBadgeOptions();
        if (r.success) {
          opts = {
            sls: !!r.sls,
            legit: !!r.legit,
            denuvo: !!r.denuvo,
            gamePage: !!r.gamePage,
            onlineFix: !!r.onlineFix,
            fixed: !!r.fixed,
          };
        }
      } catch {
        /* defaults */
      }
      if (cancelled || !opts.gamePage) {
        if (!cancelled) setKinds([]);
        return;
      }

      let ours = false;
      let ownershipKnown = true;
      let everAdded = false;
      try {
        const ea = await getEverAdded();
        everAdded = !!(ea.appids || []).map(Number).includes(appid);
      } catch {
        /* ignore */
      }
      try {
        ours = !!(await hasLua(appid)).exists;
      } catch {
        // Unknown, not "not ours" — otherwise an SLS game gets badged LEGIT.
        ours = false;
        ownershipKnown = false;
      }
      if (cancelled) return;

      const shortcut = isNonSteamShortcut(appid);
      const out: Kind[] = [];
      if (ours && opts.sls) out.push("sls");
      else if (
        !ours && ownershipKnown && !everAdded && !shortcut && opts.legit && isInLibrary(appid)
      ) {
        out.push("legit");
      }

      if (opts.denuvo && !shortcut) {
        let isDenuvo = false;
        try {
          const known = await denuvoKnown();
          isDenuvo = (known.denuvo || []).includes(appid);
          if (!isDenuvo) {
            const r = await denuvoResolve([appid]);
            isDenuvo = (r.denuvo || []).includes(appid);
          }
        } catch {
          /* unknown */
        }
        if (!cancelled && isDenuvo) out.push("denuvo");
      }

      // Fixes we've actually installed for this game.
      if (opts.onlineFix || opts.fixed) {
        try {
          const r = await getInstalledFixes();
          const types = (r.fixes || [])
            .filter((fx) => Number(fx.appid) === appid)
            .map((fx) => String(fx.fixType || ""));
          if (types.length) {
            if (types.some((t) => ONLINE_RE.test(t))) {
              if (opts.onlineFix) out.push("onlinefix");
            } else if (opts.fixed) {
              out.push("fixed");
            }
          }
        } catch {
          /* ignore */
        }
      }
      // A fixed game is ours, not owned — never show Legit alongside a fix badge.
      // No "bypassed" here: Kind has no such member, so that comparison was
      // always false. Bypass/crack fixes are already classified as "fixed".
      const hasFix = out.some((k) => k === "onlinefix" || k === "fixed");
      const finalKinds = hasFix ? out.filter((k) => k !== "legit") : out;
      if (!cancelled) setKinds(finalKinds);
    })();
    return () => {
      cancelled = true;
    };
  }, [appid]);

  if (appid == null || !kinds.length) return null;

  return (
    <div style={{ display: "flex", gap: 8, margin: "12px 24px 0" }}>
      {kinds.map((k) => (
        <div
          key={k}
          style={{
            padding: "3px 10px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: "#fff",
            background: STYLES[k].background,
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}
        >
          {STYLES[k].label}
        </div>
      ))}
    </div>
  );
}
