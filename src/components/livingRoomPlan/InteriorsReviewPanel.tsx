import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import { collectModelQualityIssues } from "../../domain/livingRoom/modelQualityFeedback";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";
import { InspectorModelQualityChecks } from "./InspectorModelQualityChecks";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";

type Proposal = ReturnType<typeof useProposalWorkflow>;

type InteriorsReviewPanelProps = {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  proposal: Proposal;
  onSelectIssue: (objectId: string | null) => void;
  onPresent: () => void;
};

/** Review area — layout checks, model/assembly quality, live quote (steps 4–6). */
export function InteriorsReviewPanel({
  project,
  issues,
  proposal,
  onSelectIssue,
  onPresent,
}: InteriorsReviewPanelProps) {
  const modelIssues = collectModelQualityIssues(project);

  return (
    <div className="interiors-review-panel" data-testid="interiors-review-panel">
      <div className="context-panel-heading">
        <strong>Review</strong>
        <span>Layout · model quality · live quote</span>
      </div>
      <InspectorLayoutChecks issues={issues} onSelect={onSelectIssue} />
      <InspectorModelQualityChecks issues={modelIssues} onSelect={onSelectIssue} />
      <InteriorsPresentQuote proposal={proposal} />
      <button type="button" className="is-primary" data-testid="interiors-review-present" onClick={onPresent}>
        Open Present
      </button>
    </div>
  );
}
