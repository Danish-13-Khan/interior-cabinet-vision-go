import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Last line of defence: an uncaught render error shows a recoverable screen instead of a blank window. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled app error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="app-error-boundary" role="alert">
        <section>
          <h1>Something went wrong</h1>
          <p>The app hit an unexpected error. Your last autosaved or file-saved work is still available after reloading.</p>
          <pre>{error.message || error.name}</pre>
          <button type="button" onClick={() => window.location.reload()}>Reload</button>
        </section>
      </main>
    );
  }
}
