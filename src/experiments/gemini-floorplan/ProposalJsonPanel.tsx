import type { GeminiFloorProposal, VisionUsageMetrics } from "./proposalTypes";

type Props = {
  proposal: GeminiFloorProposal | null;
  rawText: string | null;
  error: string | null;
  validationErrors: string[];
  metrics: VisionUsageMetrics | null;
  busy: boolean;
  hasKey: boolean;
  hasImage: boolean;
  onRunVision: () => void;
  onUseSampleImage: () => void;
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
  hasImage,
  onRunVision,
  onUseSampleImage,
  onLoadFixture,
}: Props) {
  return (
    <section className="gfl-panel gfl-json" aria-label="Vision proposal JSON">
      <header className="gfl-panel__head">
        <h2>Proposal JSON</h2>
        <p>Upload an image, then run Vision. 3D shell updates from the reviewed JSON.</p>
      </header>
      <div className="gfl-json__actions">
        <button type="button" disabled={busy} onClick={onRunVision}>
          {busy ? "Running Vision…" : "Run Gemini Vision"}
        </button>
        <button type="button" disabled={busy} onClick={onUseSampleImage}>
          Use sample image
        </button>
        <button type="button" disabled={busy} onClick={() => onLoadFixture("rect-mm")}>
          Load offline kitchen
        </button>
        <button type="button" disabled={busy} onClick={() => onLoadFixture("l-cm")}>
          Load offline L-room
        </button>
      </div>
      <p className="gfl-json__hint">
        {!hasKey
          ? "Key not loaded in Vite yet — restart npm run dev after editing .env."
          : !hasImage
            ? "Key OK. Upload an image or click “Use sample image”, then Run Gemini Vision."
            : "Image ready — click Run Gemini Vision."}
      </p>
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
