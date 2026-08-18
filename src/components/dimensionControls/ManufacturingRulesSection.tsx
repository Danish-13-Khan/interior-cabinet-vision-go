import type { ManufacturingIssue } from "../../domain/manufacturingRules";

export function ManufacturingRulesSection({
  manufacturingIssues,
  autoFixCount = 0,
  onApplyAutoFixes,
}: {
  manufacturingIssues: ManufacturingIssue[];
  autoFixCount?: number;
  onApplyAutoFixes?: () => void;
}) {
  const visible = manufacturingIssues.filter(
    (issue) => issue.severity === "error" || issue.severity === "warning",
  );
  if (visible.length === 0) return null;

  const errors = visible.filter((issue) => issue.severity === "error").length;
  const warnings = visible.filter((issue) => issue.severity === "warning").length;

  return (
    <div className="control-section manufacturing-rules-panel engineering-issue-strip">
      <div className="section-heading">
        <h2>Validation</h2>
        <span>
          {errors} error{errors === 1 ? "" : "s"} · {warnings} warning
          {warnings === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="manufacturing-issue-list">
        {visible.map((issue) => (
          <li
            key={`${issue.code}-${issue.field ?? ""}-${issue.message}`}
            className={`manufacturing-issue severity-${issue.severity}`}
          >
            <strong>{issue.severity === "error" ? "Error" : "Warning"}</strong>
            <span>
              {issue.field ? `${issue.field}: ` : ""}
              {issue.message}
            </span>
          </li>
        ))}
      </ul>
      {autoFixCount > 0 && onApplyAutoFixes ? (
        <button
          type="button"
          className="property-grid-action"
          onClick={onApplyAutoFixes}
        >
          Apply {autoFixCount} safe fix{autoFixCount === 1 ? "" : "es"}
        </button>
      ) : null}
    </div>
  );
}
