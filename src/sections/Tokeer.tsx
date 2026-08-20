import { PanelSection, PanelSectionRow } from "@decky/ui";

/**
 * Tokeer-backed Anti-Denuvo page.
 *
 * The actual Linux/Proton setup, verification and redemption controls will be
 * implemented here on the tokeer-implement branch. Keep the placeholder small
 * so the navigation split can land independently from the runtime work.
 */
export function TokeerSection() {
  return (
    <PanelSection title="Anti-Denuvo">
      <PanelSectionRow>
        <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.8, padding: "4px 2px" }}>
          Tokeer Linux / Proton integration will live here.
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}
