import type { StillJobValidation, StillReviewSession } from "../../domain/livingRoom";
import type { StillReviewCompareMode } from "../../hooks/useStillReviewFlow";
import { StillTrustPanel } from "./StillTrustPanel";

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
  { id: "split", label: "Plate | Still | Diff" },
  { id: "overlay", label: "Overlay" },
  { id: "plate", label: "Plate" },
  { id: "still", label: "Still" },
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
  const pending = session.status === "pending_review";
  const solo = compareMode === "plate"
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
      {compareMode === "split" && plateDataUrl ? (
        <div className="lr-still-review-split">
          <figure><img src={plateDataUrl} alt="WebGL plate" /><figcaption>WebGL plate</figcaption></figure>
          <figure><img src={stillDataUrl ?? ""} alt="Hero still" /><figcaption>Hero still</figcaption></figure>
          <figure><img src={diffDataUrl ?? ""} alt="Diff" /><figcaption>Diff</figcaption></figure>
        </div>
      ) : compareMode === "split" ? (
        <div className="lr-render-empty">Generate a still from the locked camera to review plate vs output.</div>
      ) : (
        <figure className="lr-still-review-stage">
          {solo ? (
            <>
              <img src={solo} alt={compareMode} />
              {compareMode === "overlay" && plateDataUrl ? (
                <img className="is-overlay" src={plateDataUrl} alt="" />
              ) : null}
            </>
          ) : (
            <div className="lr-render-empty">Generate a still from the locked camera to review plate vs output.</div>
          )}
        </figure>
      )}
      <p className="lr-still-review-note">
        Hero still engine · faithful enhance (grade, contact, sharpen). Not AI. Does not edit the project.
      </p>
      <StillTrustPanel validation={validation} provenance={session.provenance} />
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
