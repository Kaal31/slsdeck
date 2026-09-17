import { Component, ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  surface: string;
};

type State = {
  error: Error | null;
};

/**
 * Keep a Steam/Decky UI resolver regression on one SLSDeck surface from
 * unmounting the whole plugin (or, for injected controls, Steam's library
 * page). The fallback intentionally uses plain React/HTML and no @decky/ui
 * exports, since those exports may be the component that failed to resolve.
 */
export class SlsDeckErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`SLSDeck: ${this.props.surface} failed to render`, error, info);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 12, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>SLSDeck could not render this view</div>
        <div style={{ opacity: 0.8, marginBottom: 10 }}>
          Restart Steam after updating Decky Loader. The error was written to the Steam webhelper log.
        </div>
        <button type="button" onClick={() => this.setState({ error: null })}>Retry</button>
      </div>
    );
  }
}
