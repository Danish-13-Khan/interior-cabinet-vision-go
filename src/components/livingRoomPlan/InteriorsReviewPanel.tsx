import { useMemo } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import { collectModelQualityIssues } from "../../domain/livingRoom/modelQualityFeedback";
import { groupReviewIssues, reviewIssueCounts } from "../../domain/livingRoom/reviewIssueGroups";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { InspectorProposalGateChecks } from "./InspectorProposalGateChecks";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";
import { InteriorsProposalIdentity } from "./InteriorsProposalIdentity";
import { InteriorsReviewJourney } from "./InteriorsReviewJourney";
import { ReviewIssueList } from "./ReviewIssueList";
import { ReviewSceneExport } from "./ReviewSceneExport";
import { ReviewSummaryBar } from "./ReviewSummaryBar";

type Proposal = ReturnType<typeof useProposalWorkflow>;

type InteriorsReviewPanelProps = {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  proposal: Proposal;
  onSelectIssue: (objectIds: string[]) => void;
  onPresent: () => void;
};

/** Review — grouped issues, proposal checklist, quote, Present journey (steps 4–7). */
export function InteriorsReviewPanel({
  project,
  issues,
  proposal,
  onSelectIssue,
  onPresent,
}: InteriorsReviewPanelProps) {
  const groups = useMemo(
    () => groupReviewIssues(project, issues, collectModelQualityIssues(project)),
    [project, issues],
  );
  const counts = reviewIssueCounts(groups);
  const gate = proposal.gate;
  const live = proposal.live;

  return (
    <div className="interiors-review-panel" data-testid="interiors-review-panel">
      <div className="context-panel-heading">
        <strong>Review</strong>
        <span>Resolve the plan, confirm pricing, then prepare the client view.</span>
      </div>
      <ReviewSummaryBar blocking={counts.blocking} warnings={counts.warnings} ready={Boolean(gate?.ready)} />
      <details className="interiors-review-section" open>
        <summary>Issues · {groups.length}</summary>
        <ReviewIssueList groups={groups} onSelect={onSelectIssue} />
      </details>
      {gate ? (
        <details className="interiors-review-section" open={!gate.ready}>
          <summary>Proposal checklist</summary>
          <InspectorProposalGateChecks items={gate.items} blockingCount={gate.blockingCount} ready={gate.ready} />
        </details>
      ) : null}
      <details className="interiors-review-section">
        <summary>Client &amp; job details</summary>
        {live ? <InteriorsProposalIdentity job={live.quote.job} onJob={proposal.patchJob} /> : null}
      </details>
      <details className="interiors-review-section" open>
        <summary>Quote &amp; approval</summary>
        <InteriorsPresentQuote proposal={proposal} />
      </details>
      <details className="interiors-review-section">
        <summary>Export 3D model</summary>
        <ReviewSceneExport projectName={project.name} />
      </details>
      <div className="interiors-review-next">
        <InteriorsReviewJourney
          ready={Boolean(gate?.ready)}
          blockingCount={gate?.blockingCount ?? 0}
          frozen={Boolean(live?.frozen)}
          onPresent={onPresent}
        />
      </div>
    </div>
  );
}
