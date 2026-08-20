import { Focusable, DialogButton } from "@decky/ui";
import { useState } from "react";

// Controller-scrollable text region.
//
// On a Steam Deck (or any controller-only device) the gamepad focus ring can
// only enter a container that has a *focusable* child — a plain <div> of log
// text can never take focus, so the panel won't scroll down to it and the
// content below the fold is unreachable. Wrapping the text in a <Focusable>
// scroll region fixes that: the D-pad/stick can move focus into it and Steam
// auto-scrolls. A Copy button (also focusable) both guarantees focus can reach
// the region and lets the user pull long logs off the device.
export function ScrollableResult({
  text,
  maxHeight = 180,
  mono = false,
  copy = true,
  fontSize = 11,
}: {
  text: string;
  maxHeight?: number;
  mono?: boolean;
  copy?: boolean;
  fontSize?: number;
}) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const doCopy = () => {
    try {
      (navigator as any)?.clipboard?.writeText?.(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  };

  return (
    <Focusable style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Focusable
        // Focusable scroll container: gamepad focus enters here and the stick
        // scrolls it. `overflowY: scroll` keeps the track present so long output
        // is always reachable.
        style={{
          maxHeight,
          overflowY: "scroll",
          padding: "6px 8px",
          borderRadius: 4,
          background: "rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize,
            lineHeight: 1.4,
            opacity: 0.9,
            fontFamily: mono ? "monospace" : undefined,
          }}
        >
          {text}
        </div>
      </Focusable>
      {copy && (
        <DialogButton
          style={{ fontSize: 12, padding: "4px 8px", alignSelf: "flex-start" }}
          onClick={doCopy}
        >
          {copied ? "Copied" : "Copy"}
        </DialogButton>
      )}
    </Focusable>
  );
}
