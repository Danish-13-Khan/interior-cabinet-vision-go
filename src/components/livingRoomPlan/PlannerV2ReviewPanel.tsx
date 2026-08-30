import type { MillworkSchedule } from "../../domain/livingRoom/millworkSchedule";
import type { LivingRoomPlanIssue, PreExportChecklist } from "../../domain/livingRoom";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { PreExportChecklistSection } from "./PreExportChecklistSection";
import { ProposalReviewSection } from "./ProposalReviewSection";

export function PlannerV2ReviewPanel({
  schedule,
  issues,
  checklist,
  millworkBusy,
  millworkStatus,
  clientPackageBusy,
  clientPackageStatus,
  acceptedStillCount,
  proposal,
  onSelect,
  onCsv,
  onPdf,
  onClientPackage,
}: {
  schedule: MillworkSchedule | null;
  issues: LivingRoomPlanIssue[];
  checklist: PreExportChecklist;
  millworkBusy: boolean;
  millworkStatus: string;
  clientPackageBusy: boolean;
  clientPackageStatus: string;
  acceptedStillCount: number;
  proposal: ReturnType<typeof useProposalWorkflow>;
  onCsv: () => void;
  onPdf: () => void;
  onClientPackage: () => void;
  onSelect: (objectId: string | null) => void;
}) {
  const exportBlocked = !checklist.ready;
  return (
    <aside className="planner-v2-review" aria-label="Review and export">
      <header>
        <span>Review + export</span>
        <small>
          {checklist.ready
            ? checklist.warnCount
              ? `${checklist.warnCount} advisory`
              : "Checks clear"
            : `${checklist.blockingFailCount} blocking`}
        </small>
      </header>
      <ProposalReviewSection proposal={proposal} />
      <PreExportChecklistSection checklist={checklist} issues={issues} onSelect={onSelect} />
      <section>
        <strong>Millwork schedule</strong>
        <small>{schedule?.lines.length ?? 0} cabinet items</small>
        {schedule?.lines.slice(0, 4).map((line) => (
          <div key={line.objectId}>
            <span>{line.name}</span>
            <small>
              {line.widthMm} × {line.heightMm} × {line.depthMm}
              {line.sku ? ` · ${line.sku}` : ""}
            </small>
          </div>
        ))}
        {!schedule?.lines.length ? <p>No cabinet items placed yet.</p> : null}
      </section>
      <section>
        <strong>Client package</strong>
        <small>
          {exportBlocked
            ? "Complete blocking checklist items before export."
            : `Presentation PDF, JSON, ${acceptedStillCount} accepted still${acceptedStillCount === 1 ? "" : "s"}, and millwork schedule.`}
        </small>
        <button
          type="button"
          onClick={onClientPackage}
          disabled={exportBlocked || clientPackageBusy || millworkBusy}
        >
          Export client package
        </button>
      </section>
      <section>
        <strong>Workshop output</strong>
        <small>
          {exportBlocked
            ? "Complete blocking checklist items before export."
            : "Individual millwork schedule files."}
        </small>
        <button type="button" onClick={onCsv} disabled={millworkBusy || exportBlocked}>
          Schedule CSV
        </button>
        <button type="button" onClick={onPdf} disabled={millworkBusy || exportBlocked}>
          Schedule PDF
        </button>
      </section>
      {clientPackageStatus ? <p className="planner-v2-review-status">{clientPackageStatus}</p> : null}
      {millworkStatus ? <p className="planner-v2-review-status">{millworkStatus}</p> : null}
    </aside>
  );
}
