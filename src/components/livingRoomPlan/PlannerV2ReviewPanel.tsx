import type { MillworkSchedule } from "../../domain/livingRoom/millworkSchedule";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import {
  isBlockingLivingRoomPlanIssue,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";

export function PlannerV2ReviewPanel({
  schedule,
  issues,
  millworkBusy,
  millworkStatus,
  clientPackageBusy,
  clientPackageStatus,
  readyToExport,
  acceptedStillCount,
  onSelect,
  onCsv,
  onPdf,
  onClientPackage,
}: {
  schedule: MillworkSchedule | null;
  issues: LivingRoomPlanIssue[];
  millworkBusy: boolean;
  millworkStatus: string;
  clientPackageBusy: boolean;
  clientPackageStatus: string;
  readyToExport: boolean;
  acceptedStillCount: number;
  onCsv: () => void;
  onPdf: () => void;
  onClientPackage: () => void;
  onSelect: (objectId: string | null) => void;
}) {
  const blockingIssueCount = issues.filter(isBlockingLivingRoomPlanIssue).length;
  const exportBlocked = isClientPackageExportBlocked(issues, readyToExport);
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
    <section><strong>Client package</strong>
      <small>{exportBlocked ? "Resolve layout conflicts and place millwork before export." : `Presentation PDF, JSON, ${acceptedStillCount} accepted still${acceptedStillCount === 1 ? "" : "s"}, and millwork schedule.`}</small>
      <button type="button" className="is-primary" onClick={onClientPackage} disabled={exportBlocked || clientPackageBusy || millworkBusy}>
        Export client package
      </button>
    </section>
    <section><strong>Workshop output</strong><small>{blockingIssueCount ? "Resolve blocking layout conflicts before export." : "Individual millwork schedule files."}</small>
      <button type="button" onClick={onCsv} disabled={millworkBusy || exportBlocked}>Schedule CSV</button>
      <button type="button" onClick={onPdf} disabled={millworkBusy || exportBlocked}>Schedule PDF</button>
    </section>
    {clientPackageStatus ? <p className="planner-v2-review-status">{clientPackageStatus}</p> : null}
    {millworkStatus ? <p className="planner-v2-review-status">{millworkStatus}</p> : null}
  </aside>;
}
