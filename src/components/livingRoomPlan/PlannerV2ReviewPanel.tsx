import type { MillworkSchedule } from "../../domain/livingRoom/millworkSchedule";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";

export function PlannerV2ReviewPanel({
  schedule,
  issues,
  busy,
  status,
  onCsv,
  onPdf,
}: {
  schedule: MillworkSchedule | null;
  issues: LivingRoomPlanIssue[];
  busy: boolean;
  status: string;
  onCsv: () => void;
  onPdf: () => void;
}) {
  return <aside className="planner-v2-review" aria-label="Review and export">
    <header><span>Review + export</span><small>{issues.length ? `${issues.length} layout warnings` : "Layout checks clear"}</small></header>
    <section className={issues.length ? "has-warning" : "is-clear"}>
      <strong>{issues.length ? "Review warnings before output" : "Ready for output"}</strong>
      {issues.length ? issues.slice(0, 3).map((issue, index) => <p key={`${issue.code}-${index}`}>{issue.message}</p>) : <small>Plan dimensions and placed cabinet data are ready for review.</small>}
    </section>
    <section><strong>Millwork schedule</strong><small>{schedule?.lines.length ?? 0} cabinet items</small>
      {schedule?.lines.slice(0, 4).map((line) => <div key={line.objectId}><span>{line.name}</span><small>{line.widthMm} × {line.heightMm} × {line.depthMm}</small></div>)}
      {!schedule?.lines.length ? <p>No cabinet items placed yet.</p> : null}
    </section>
    <section><strong>Workshop files</strong><small>Generated from the current project dimensions.</small>
      <button type="button" onClick={onCsv} disabled={busy}>Export CSV</button>
      <button type="button" className="is-primary" onClick={onPdf} disabled={busy}>Export PDF</button>
    </section>
    <section><strong>Client preview</strong><small>Choose a camera and capture a Draft or Client Preview image in the Render Studio beside this review panel.</small></section>
    {status ? <p className="planner-v2-review-status">{status}</p> : null}
  </aside>;
}
