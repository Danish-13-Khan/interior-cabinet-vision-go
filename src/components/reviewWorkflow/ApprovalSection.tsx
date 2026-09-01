import { useState } from "react";

type ApprovalSectionProps = {
  approvedBy: string;
  onApprovedByChange: (value: string) => void;
  onApprove: () => void;
  onRelease: (overrideReason?: string) => void;
  approvalBlockedReasons: string[];
  releaseBlockedReasons: string[];
  canOverrideRelease: boolean;
};

export function ApprovalSection({
  approvedBy,
  onApprovedByChange,
  onApprove,
  onRelease,
  approvalBlockedReasons,
  releaseBlockedReasons,
  canOverrideRelease,
}: ApprovalSectionProps) {
  const [overrideReason, setOverrideReason] = useState("");
  const releaseHardBlocked = releaseBlockedReasons.length > 0 && !canOverrideRelease;
  const releaseNeedsReason = canOverrideRelease && !overrideReason.trim();

  return (
    <section className="review-section">
      <h3>Approval & release</h3>
      <div className="review-form-row">
        <input
          type="text"
          value={approvedBy}
          placeholder="Approved by"
          onChange={(event) => onApprovedByChange(event.currentTarget.value)}
        />
        <button
          type="button"
          className="tb-btn"
          disabled={approvalBlockedReasons.length > 0}
          title={approvalBlockedReasons.join("; ") || "Mark approved"}
          onClick={onApprove}
        >
          Approve
        </button>
        <button
          type="button"
          className="tb-btn tb-accent"
          disabled={releaseHardBlocked || releaseNeedsReason}
          title={releaseBlockedReasons.join("; ") || "Release for production"}
          onClick={() => onRelease(canOverrideRelease ? overrideReason : undefined)}
        >
          Release for Production
        </button>
      </div>
      {approvalBlockedReasons.length > 0 ? (
        <p className="helper-note">Approval blocked: {approvalBlockedReasons.join("; ")}</p>
      ) : null}
      {releaseBlockedReasons.length > 0 ? (
        <p className="helper-note">
          {canOverrideRelease ? "Production gate needs an override reason: " : "Release blocked: "}
          {releaseBlockedReasons.join("; ")}
        </p>
      ) : null}
      {canOverrideRelease ? (
        <label className="review-override-reason">
          Production override reason
          <textarea
            data-testid="production-override-reason"
            value={overrideReason}
            rows={2}
            placeholder="Why this revision can be released"
            onChange={(event) => setOverrideReason(event.currentTarget.value)}
          />
        </label>
      ) : null}
    </section>
  );
}
