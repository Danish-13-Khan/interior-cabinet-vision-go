import type { LivingRoomPlanIssue } from "../../domain/livingRoom";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { InspectorLayoutChecks } from "./InspectorLayoutChecks";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";

type Proposal = ReturnType<typeof useProposalWorkflow>;

type InteriorsReviewPanelProps = {
  issues: LivingRoomPlanIssue[];
  proposal: Proposal;
  onSelectIssue: (objectId: string | null) => void;
  onPresent: () => void;
};

/** Review area left panel — issues and live quote entry (step 4). */
export function InteriorsReviewPanel({
  issues,
  proposal,
  onSelectIssue,
  onPresent,
}: InteriorsReviewPanelProps) {
  return (
    <div className="interiors-review-panel" data-testid="interiors-review-panel">
      <div className="context-panel-heading">
        <strong>Review</strong>
        <span>Layout checks · live quote</span>
      </div>
      <InspectorLayoutChecks issues={issues} onSelect={onSelectIssue} />
      <InteriorsPresentQuote proposal={proposal} />
      <button type="button" className="is-primary" data-testid="interiors-review-present" onClick={onPresent}>
        Open Present
      </button>
    </div>
  );
}
