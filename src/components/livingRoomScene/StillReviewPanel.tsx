import type { StillJobValidation, StillReviewSession } from "../../domain/livingRoom";
import type { StillReviewCompareMode } from "../../hooks/useStillReviewFlow";

type StillReviewPanelProps = {
  session: StillReviewSession;
  plateDataUrl: string | null;
  stillDataUrl: string | null;
  diffDataUrl: string | null;
  validation: StillJobValidation | null;
  compareMode: StillReviewCompareMode;
  acceptedCount: number;
  busy: boolean;
  error: string | null;
  onCompareMode: (mode: StillReviewCompareMode) => void;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
};

const MODES: { id: StillReviewCompareMode; label: string }[] = [
  { id: "plate", label: "WebGL plate" },
  { id: "still", label: "Still" },
  { id: "overlay", label: "Overlay" },
  { id: "diff", label: "Diff" },
];

export function StillReviewPanel({
  session,
  plateDataUrl,
  stillDataUrl,
  diffDataUrl,
  validation,
  compareMode,
  acceptedCount,
  busy,
  error,
  onCompareMode,
  onAccept,
  onReject,
  onRetry,
}: StillReviewPanelProps) {
  const failedGates = validation?.gates.filter((gate) => !gate.pass) ?? [];
  const pending = session.status === "pending_review";
  const imageSrc = compareMode === "plate"
    ? plateDataUrl
    : compareMode === "still"
      ? stillDataUrl
      : compareMode === "diff"
        ? diffDataUrl
        : stillDataUrl;

  return (
    <div className="lr-still-review" data-testid="still-review-panel">
      <header>
        <strong>Still review</strong>
        <span>{String(session.status).replace(/_/g, " ")}</span>
        <small>{acceptedCount} accepted for package</small>
      </header>
      <nav aria-label="Still comparison">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={compareMode === mode.id ? "is-active" : ""}
            onClick={() => onCompareMode(mode.id)}
            disabled={!plateDataUrl}
          >
            {mode.label}
          </button>
        ))}
      </nav>
      <figure className="lr-still-review-stage">
        {imageSrc ? (
          <>
            <img src={imageSrc} alt={compareMode} />
            {compareMode === "overlay" && plateDataUrl ? (
              <img className="is-overlay" src={plateDataUrl} alt="" />
            ) : null}
          </>
        ) : (
          <div className="lr-render-empty">Generate a still from the locked camera to review plate vs output.</div>
        )}
      </figure>
      <p className="lr-still-review-note">
        Handoff still · exposure grade only. This is not AI and does not edit the project.
      </p>
      {validation ? (
        <p className={validation.ok ? "is-ok" : "is-fail"} data-testid="still-review-trust">
          {validation.ok
            ? `Trust gates passed (${validation.gates.length})`
            : `Trust mismatch: ${failedGates.map((gate) => gate.id).join(", ")}`}
        </p>
      ) : null}
      {error ? <p className="is-fail">{error}</p> : null}
      <div className="lr-still-review-actions">
        <button type="button" className="is-primary" onClick={onAccept} disabled={!pending || busy || validation?.ok === false}>
          Accept
        </button>
        <button type="button" onClick={onReject} disabled={!pending || busy}>Reject</button>
        <button type="button" onClick={onRetry} disabled={!session.job || busy}>Retry</button>
      </div>
    </div>
  );
}
