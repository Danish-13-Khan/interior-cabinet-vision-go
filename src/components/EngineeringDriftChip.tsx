import type { PostApprovalDrift } from "../domain/livingRoom/handoff";

export function EngineeringDriftChip({ drift }: { drift: PostApprovalDrift }) {
  if (!drift.handedOff) return null;
  return (
    <span
      className={`status-hud-chip ${drift.drifted ? "is-warning" : "is-static"}`}
      data-testid="post-approval-drift"
      title={drift.summary}
    >
      {drift.drifted ? "Post-approval drift" : `Rev ${drift.revision}`}
    </span>
  );
}
