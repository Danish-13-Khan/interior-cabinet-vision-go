import type { GeminiFloorProposal, VisionUsageMetrics } from "./proposalTypes";

type Props = {
  proposal: GeminiFloorProposal | null;
  rawText: string | null;
  error: string | null;
  validationErrors: string[];
  metrics: VisionUsageMetrics | null;
  busy: boolean;
  hasKey: boolean;
  canRunVision: boolean;
  onRunVision: () => void;
  onLoadFixture: (id: string) => void;
};

function formatMetrics(m: VisionUsageMetrics): string {
  const tokens =
    m.totalTokens !== undefined
      ? `${m.totalTokens} tokens`
      : [m.promptTokens, m.candidatesTokens].filter((n) => n !== undefined).join("+") ||
        "tokens n/a";
  return `${m.latencyMs} ms · ${tokens} · ${m.model}`;
}

export function ProposalJsonPanel({
  proposal,
  rawText,
  error,
  validationErrors,
  metrics,
  busy,
  hasKey,
  canRunVision,
  onRunVision,
  onLoadFixture,
}: Props) {
  return (
    <section className="gfl-panel gfl-json" aria-label="Vision proposal JSON">
      <header className="gfl-panel__head">
        <h2>Proposal JSON</h2>
        <p>Phase 1 — validate + normalize to mm. 3D arrives in Phase 3.</p>
      </header>
      <div className="gfl-json__actions">
        <button type="button" disabled={!canRunVision || busy} onClick={onRunVision}>
          {busy ? "Running Vision…" : "Run Gemini Vision"}
        </button>
        <button type="button" disabled={busy} onClick={() => onLoadFixture("rect-mm")}>
          Load offline kitchen
        </button>
        <button type="button" disabled={busy} onClick={() => onLoadFixture("l-cm")}>
          Load offline L-room
        </button>
      </div>
      {!hasKey ? (
        <p className="gfl-json__hint">
          No API key yet — offline fixtures still work. Add <code>VITE_GEMINI_API_KEY</code> later
          and restart Vite to enable Vision.
        </p>
      ) : null}
      {metrics ? <p className="gfl-json__metrics">{formatMetrics(metrics)}</p> : null}
      {error ? <p className="gfl-json__error">{error}</p> : null}
      {validationErrors.length ? (
        <ul className="gfl-json__errors">
          {validationErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      <pre className="gfl-json__pre">
        {proposal
          ? JSON.stringify(proposal, null, 2)
          : rawText
            ? rawText
            : "// Upload an image and run Vision, or load an offline fixture."}
      </pre>
    </section>
  );
}
