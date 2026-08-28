import type {
  MillworkSchedule,
  MillworkWorkflowSnapshot,
} from "../../../domain/livingRoom/millworkSchedule";
import type { ProjectReport } from "../../../domain/projectReport";
import { formatMaterialLabels, formatWhdMm } from "../../../domain/livingRoom/millworkSchedule";

type MillworkSchedulePreviewProps = {
  schedule: MillworkSchedule;
  workflow: MillworkWorkflowSnapshot;
  productionReport: ProjectReport | null;
  exportedAt: string | null;
  onSelect: (objectId: string | null) => void;
};

/** Live takeoff preview — same rows CSV/PDF will export. */
export function MillworkSchedulePreview({
  schedule,
  workflow,
  productionReport,
  exportedAt,
  onSelect,
}: MillworkSchedulePreviewProps) {
  return (
    <section className="lr-millwork-preview" aria-label="Millwork schedule preview">
      <h3>
        Millwork Schedule
        <span>{workflow.millworkCount}</span>
      </h3>
      <ol className="lr-millwork-steps">
        {workflow.steps.map((step) => (
          <li key={step.id} className={step.done || (step.id === "export" && exportedAt) ? "is-done" : undefined}>
            <b>{step.label}</b>
            <span>{step.detail}</span>
          </li>
        ))}
      </ol>
      {productionReport ? (
        <div className="lr-production-summary" aria-label="Advanced production output summary">
          <strong>Advanced · Production packet</strong>
          <span>
            {productionReport.cabinetSchedule.length} cabinet marks · {productionReport.productionCutlist.length} cut parts
          </span>
          <span>
            Workshop estimate ₹{productionReport.projectCost.grandTotal.toLocaleString()} · {productionReport.summary.runCount} technical run{productionReport.summary.runCount === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}
      {schedule.lines.length === 0 ? (
        <p className="lr-millwork-empty">No millwork yet. Soft goods stay off the schedule.</p>
      ) : (
        <ul className="lr-millwork-lines">
          {schedule.lines.map((line) => (
            <li key={line.objectId}>
              <button type="button" onClick={() => onSelect(line.objectId)}>
                <strong>{line.name}</strong>
                <span>{formatWhdMm(line.widthMm, line.heightMm, line.depthMm)} mm</span>
                <small>{formatMaterialLabels(line.materialLabels)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="lr-millwork-honesty">{schedule.honestyNote}</p>
    </section>
  );
}
