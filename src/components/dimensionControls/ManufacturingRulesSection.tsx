import type { ManufacturingIssue } from "../../domain/manufacturingRules";

export function ManufacturingRulesSection({
  manufacturingIssues,
}: {
  manufacturingIssues: ManufacturingIssue[];
}) {
  if (manufacturingIssues.length === 0) return null;

  return (
    <div className="control-section manufacturing-rules-panel">
      <div className="section-heading">
        <h2>Manufacturing Rules</h2>
        <span>
          {manufacturingIssues.filter((issue) => issue.severity === "error").length} errors ·{" "}
          {manufacturingIssues.filter((issue) => issue.severity === "warning").length} warnings
        </span>
      </div>
      <ul className="manufacturing-issue-list">
        {manufacturingIssues.map((issue) => (
          <li
            key={`${issue.code}-${issue.message}`}
            className={`manufacturing-issue severity-${issue.severity}`}
          >
            <strong>{issue.severity === "error" ? "Error" : "Warning"}</strong>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
