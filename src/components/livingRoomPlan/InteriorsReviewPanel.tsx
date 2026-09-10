import type { InteriorProject } from "../../domain/interiorProject";
import { isBlockingLivingRoomPlanIssue, type LivingRoomPlanIssue } from "../../domain/livingRoom";
import { collectModelQualityIssues } from "../../domain/livingRoom/modelQualityFeedback";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";
import { InspectorModelQualityChecks } from "./InspectorModelQualityChecks";
import { InspectorProposalGateChecks } from "./InspectorProposalGateChecks";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";
import { InteriorsProposalIdentity } from "./InteriorsProposalIdentity";
import { InteriorsReviewJourney } from "./InteriorsReviewJourney";

type Proposal = ReturnType<typeof useProposalWorkflow>;

type InteriorsReviewPanelProps = {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  proposal: Proposal;
  onSelectIssue: (objectId: string | null) => void;
  onPresent: () => void;
};

/** Review — layout, model quality, proposal gates, quote, Present journey (steps 4–7). */
export function InteriorsReviewPanel({
  project,
  issues,
  proposal,
  onSelectIssue,
  onPresent,
}: InteriorsReviewPanelProps) {
  const modelIssues = collectModelQualityIssues(project);
  const gate = proposal.gate;
  const live = proposal.live;
  const blockingCount = issues.filter(isBlockingLivingRoomPlanIssue).length;

  return (
    <div className="interiors-review-panel" data-testid="interiors-review-panel">
      <div className="context-panel-heading">
        <strong>Review</strong>
        <span>Resolve the plan, confirm pricing, then prepare the client view.</span>
      </div>
      <div className="interiors-review-summary" aria-label="Review summary">
        <div><strong>{blockingCount}</strong><span>blocking</span></div>
        <div><strong>{Math.max(0, issues.length - blockingCount)}</strong><span>warnings</span></div>
        <div><strong>{modelIssues.length}</strong><span>model notes</span></div>
      </div>
      <details className="interiors-review-section" open>
        <summary>Plan &amp; model checks</summary>
        <InspectorLayoutChecks issues={issues} onSelect={onSelectIssue} />
        <InspectorModelQualityChecks issues={modelIssues} onSelect={onSelectIssue} />
        {gate ? (
          <InspectorProposalGateChecks
            items={gate.items}
            blockingCount={gate.blockingCount}
            ready={gate.ready}
          />
        ) : null}
      </details>
      <details className="interiors-review-section">
        <summary>Client &amp; job details</summary>
        {live ? <InteriorsProposalIdentity job={live.quote.job} onJob={proposal.patchJob} /> : null}
      </details>
      <details className="interiors-review-section" open>
        <summary>Quote &amp; approval</summary>
        <InteriorsPresentQuote proposal={proposal} />
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
