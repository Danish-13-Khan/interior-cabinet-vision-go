import type { MillworkSchedule } from "../../domain/livingRoom/millworkSchedule";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import { isBlockingLivingRoomPlanIssue } from "../../domain/livingRoom";

export function PlannerV2ReviewPanel({
  schedule,
  issues,
  busy,
  status,
  onSelect,
  onCsv,
  onPdf,
}: {
  schedule: MillworkSchedule | null;
  issues: LivingRoomPlanIssue[];
  busy: boolean;
  status: string;
  onCsv: () => void;
  onPdf: () => void;
  onSelect: (objectId: string | null) => void;
}) {
  const blockingIssueCount = issues.filter(isBlockingLivingRoomPlanIssue).length;
  return <aside className="planner-v2-review" aria-label="Review and export">
    <header><span>Review + export</span><small>{issues.length ? `${blockingIssueCount} blocking · ${issues.length - blockingIssueCount} advisory` : "Layout checks clear"}</small></header>
    <section className={issues.length ? "has-warning" : "is-clear"}>
      <strong>{blockingIssueCount ? "Resolve blocking layout conflicts" : issues.length ? "Review layout advisories" : "Ready for output"}</strong>
      {issues.length ? issues.slice(0, 3).map((issue, index) => <button type="button" key={`${issue.code}-${index}`}
        data-layout-issue={issue.code} aria-label={`${issue.severity}: ${issue.message}`}
        onClick={() => onSelect(issue.objectIds[0] ?? null)}>{issue.message}</button>) : <small>Plan dimensions and placed cabinet data are ready for review.</small>}
    </section>
    <section><strong>Millwork schedule</strong><small>{schedule?.lines.length ?? 0} cabinet items</small>
      {schedule?.lines.slice(0, 4).map((line) => <div key={line.objectId}><span>{line.name}</span><small>{line.widthMm} × {line.heightMm} × {line.depthMm}{line.sku ? ` · ${line.sku}` : ""}</small></div>)}
      {!schedule?.lines.length ? <p>No cabinet items placed yet.</p> : null}
    </section>
    <section><strong>Workshop output</strong><small>{blockingIssueCount ? "Resolve blocking layout conflicts before export." : "Millwork Schedule v1 — same millimetres as Plan/Model."}</small>
      <button type="button" onClick={onCsv} disabled={busy || blockingIssueCount > 0}>Schedule CSV</button>
      <button type="button" className="is-primary" onClick={onPdf} disabled={busy || blockingIssueCount > 0}>Schedule PDF</button>
    </section>
    <section><strong>Client preview</strong><small>Choose a camera and capture a Draft or Client Preview image in the Render Studio beside this review panel.</small></section>
    {status ? <p className="planner-v2-review-status">{status}</p> : null}
  </aside>;
}
