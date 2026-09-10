import type { ModelQualityIssue } from "../../domain/livingRoom/modelQualityFeedback";
import {
  modelQualityBlockingCount,
  modelQualitySeverityClass,
} from "../../domain/livingRoom/modelQualityFeedback";

type Props = {
  issues: ModelQualityIssue[];
  onSelect: (objectId: string | null) => void;
};

/** Review rows for adapter / assembly quality — Locate via object select. */
export function InspectorModelQualityChecks({ issues, onSelect }: Props) {
  const blocking = modelQualityBlockingCount(issues);
  return (
    <section className="lr-issues-panel lr-model-quality-panel" data-testid="interiors-model-quality">
      <h3>
        Model &amp; material quality <span>{issues.length}</span>
      </h3>
      {blocking > 0 ? (
        <p className="lr-model-quality-gate" data-testid="interiors-model-quality-blocking">
          {blocking} block{blocking === 1 ? "s" : ""} proposal / client export
        </p>
      ) : null}
      {issues.length === 0 ? (
        <p className="is-clear">No adapter or assembly issues in this room.</p>
      ) : (
        issues.slice(0, 12).map((issue) => (
          <button
            type="button"
            key={issue.id}
            data-model-quality={issue.code}
            data-quality-kind={issue.kind}
            className={modelQualitySeverityClass(issue)}
            aria-label={`${issue.severity}: ${issue.title}`}
            onClick={() => onSelect(issue.objectId)}
          >
            <b>{issue.severity === "error" ? "!" : issue.severity === "warning" ? "△" : "i"}</b>
            <span>
              <strong>{issue.title}</strong>
              <small>
                {issue.blocking ? "Blocks export · " : "Preview · "}
                {issue.detail}
              </small>
            </span>
          </button>
        ))
      )}
    </section>
  );
}
