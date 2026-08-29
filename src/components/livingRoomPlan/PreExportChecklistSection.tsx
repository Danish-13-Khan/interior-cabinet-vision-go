import type { LivingRoomPlanIssue, PreExportChecklist } from "../../domain/livingRoom";
import { isBlockingLivingRoomPlanIssue } from "../../domain/livingRoom";

const STATUS_LABEL: Record<"pass" | "fail" | "warn", string> = {
  pass: "Pass",
  fail: "Fail",
  warn: "Review",
};

/** L3 pre-export checklist rows with actionable fail/warn selections. */
export function PreExportChecklistSection({
  checklist,
  issues,
  onSelect,
}: {
  checklist: PreExportChecklist;
  issues: LivingRoomPlanIssue[];
  onSelect: (objectId: string | null) => void;
}) {
  const blockingIssues = issues.filter(isBlockingLivingRoomPlanIssue);
  return (
    <section
      className={checklist.ready ? "is-clear" : "has-warning"}
      data-testid="pre-export-checklist"
      aria-label="Pre-export checklist"
    >
      <strong>Pre-export checklist</strong>
      <small>
        {checklist.ready
          ? checklist.warnCount
            ? `Ready · ${checklist.warnCount} advisory item${checklist.warnCount === 1 ? "" : "s"}`
            : "Ready for client package and workshop export"
          : `${checklist.blockingFailCount} blocking · fix before export`}
      </small>
      <ul className="pre-export-checklist">
        {checklist.items.map((item) => {
          const selectable = item.objectIds[0] ?? null;
          const rowClass = `pre-export-check is-${item.status}`;
          if (selectable) {
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={rowClass}
                  data-check-id={item.id}
                  data-check-status={item.status}
                  aria-label={`${STATUS_LABEL[item.status]}: ${item.label}. ${item.detail}`}
                  onClick={() => onSelect(selectable)}
                >
                  <span>{STATUS_LABEL[item.status]}</span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </button>
              </li>
            );
          }
          return (
            <li key={item.id} className={rowClass} data-check-id={item.id} data-check-status={item.status}>
              <span>{STATUS_LABEL[item.status]}</span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </li>
          );
        })}
      </ul>
      {blockingIssues.length ? (
        <div className="pre-export-issue-list">
          {blockingIssues.slice(0, 4).map((issue, index) => (
            <button
              type="button"
              key={`${issue.code}-${index}`}
              data-layout-issue={issue.code}
              aria-label={`${issue.severity}: ${issue.message}`}
              onClick={() => onSelect(issue.objectIds[0] ?? null)}
            >
              {issue.message}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
