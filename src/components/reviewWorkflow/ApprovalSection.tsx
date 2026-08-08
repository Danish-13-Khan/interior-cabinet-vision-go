type ApprovalSectionProps = {
  approvedBy: string;
  onApprovedByChange: (value: string) => void;
  onApprove: () => void;
  onRelease: () => void;
  approvalBlockedReasons: string[];
  releaseBlockedReasons: string[];
};

export function ApprovalSection({
  approvedBy,
  onApprovedByChange,
  onApprove,
  onRelease,
  approvalBlockedReasons,
  releaseBlockedReasons,
}: ApprovalSectionProps) {
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
          disabled={releaseBlockedReasons.length > 0}
          title={releaseBlockedReasons.join("; ") || "Release for production"}
          onClick={onRelease}
        >
          Release for Production
        </button>
      </div>
      {approvalBlockedReasons.length > 0 ? (
        <p className="helper-note">Approval blocked: {approvalBlockedReasons.join("; ")}</p>
      ) : null}
      {releaseBlockedReasons.length > 0 ? (
        <p className="helper-note">Release blocked: {releaseBlockedReasons.join("; ")}</p>
      ) : null}
    </section>
  );
}
