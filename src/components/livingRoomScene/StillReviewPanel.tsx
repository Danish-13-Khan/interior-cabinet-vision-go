import type { StillJobValidation, StillReviewSession } from "../../domain/livingRoom";
import { CYCLES_STILL_ENGINE, describeStillHonesty, stillReviewPanelStatusLabel } from "../../domain/livingRoom";
import type { StillReviewCompareMode } from "../../hooks/useStillReviewFlow";
import { StillTrustPanel } from "./StillTrustPanel";
import { RenderPresetHonestyBadge } from "./RenderPresetHonestyBadge";

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
  /** Phase 3: write a Cycles job folder for `npm run cycles:render`. */
  onExportCyclesJob?: () => void;
  /** Phase 3: pick provenance.json and still.png rendered by Cycles. */
  onImportCyclesStill?: () => void;
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
  onExportCyclesJob,
  onImportCyclesStill,
}: StillReviewPanelProps) {
  const pending = session.status === "pending_review";
  const cycles = session.job?.engine.id === CYCLES_STILL_ENGINE.id;
  const stillHonesty = describeStillHonesty();
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
        <RenderPresetHonestyBadge honesty={stillHonesty} tierId="hybrid-still" compact />
        <span data-testid="still-review-status">{stillReviewPanelStatusLabel(session, acceptedCount)}</span>
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
          <figure><img src={stillDataUrl ?? ""} alt={cycles ? "Cycles still" : "Hero still"} /><figcaption>{cycles ? "Cycles still" : "Hero still"}</figcaption></figure>
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
        {cycles
          ? "Cycles photo still · path-traced from the authored project (bounce light, area shadows, fixture glow). Not AI. Does not edit the project."
          : "Hero still engine · faithful enhance (grade, contact, sharpen). Not AI. Does not edit the project."}
      </p>
      <StillTrustPanel validation={validation} provenance={session.provenance} />
      {error ? <p className="is-fail">{error}</p> : null}
      <div className="lr-still-review-actions">
        <button type="button" className="is-primary" onClick={onAccept} disabled={!pending || busy || validation?.ok === false}>
          Accept
        </button>
        <button type="button" onClick={onReject} disabled={!pending || busy}>Reject</button>
        <button type="button" onClick={onRetry} disabled={!session.job || busy}>Retry</button>
        {onExportCyclesJob ? (
          <button type="button" data-testid="still-export-cycles-job" onClick={onExportCyclesJob} disabled={busy} title="Write a Cycles job for npm run cycles:render">
            Export photo job…
          </button>
        ) : null}
        {onImportCyclesStill ? (
          <button type="button" data-testid="still-import-cycles" onClick={onImportCyclesStill} disabled={busy} title="Pick provenance.json, then still.png">
            Import photo still…
          </button>
        ) : null}
      </div>
    </div>
  );
}
