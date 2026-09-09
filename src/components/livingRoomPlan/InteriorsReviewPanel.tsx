import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
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

  return (
    <div className="interiors-review-panel" data-testid="interiors-review-panel">
      <div className="context-panel-heading">
        <strong>Review</strong>
        <span>Layout · quality · proposal readiness · not a full quote desk</span>
      </div>
      <InspectorLayoutChecks issues={issues} onSelect={onSelectIssue} />
      <InspectorModelQualityChecks issues={modelIssues} onSelect={onSelectIssue} />
      {gate ? (
        <InspectorProposalGateChecks
          items={gate.items}
          blockingCount={gate.blockingCount}
          ready={gate.ready}
        />
      ) : null}
      {live ? <InteriorsProposalIdentity job={live.quote.job} onJob={proposal.patchJob} /> : null}
      <InteriorsPresentQuote proposal={proposal} />
      <InteriorsReviewJourney
        ready={Boolean(gate?.ready)}
        blockingCount={gate?.blockingCount ?? 0}
        frozen={Boolean(live?.frozen)}
        onPresent={onPresent}
      />
    </div>
  );
}
