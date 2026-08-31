import { isBlockingLivingRoomPlanIssue, type LivingRoomPlanIssue } from "../../domain/livingRoom";

type Props = {
  issues: LivingRoomPlanIssue[];
  onSelect: (objectId: string | null) => void;
};

export function InspectorLayoutChecks({ issues, onSelect }: Props) {
  return (
    <section className="lr-issues-panel">
      <h3>Layout Checks <span>{issues.length}</span></h3>
      {issues.length === 0 ? (
        <p className="is-clear">No conflicts detected.</p>
      ) : (
        issues.slice(0, 10).map((issue, index) => (
          <button
            type="button"
            key={`${issue.code}-${index}`}
            data-layout-issue={issue.code}
            className={isBlockingLivingRoomPlanIssue(issue) ? "is-error" : "is-warning"}
            aria-label={`${issue.severity}: ${issue.message}`}
            onClick={() => onSelect(issue.objectIds[0] ?? null)}
          >
            <b>{issue.severity === "error" ? "!" : "△"}</b>
            <span>{issue.message}</span>
          </button>
        ))
      )}
    </section>
  );
}
