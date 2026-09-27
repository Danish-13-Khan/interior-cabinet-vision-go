import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { InteriorsPresentStep } from "../../domain/desktopUx";
import { EngineeringHandoffSection } from "./EngineeringHandoffSection";

type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

export function InteriorsPresentActions({
  proposal,
  handoff,
  blocking,
  step,
  needsCapture,
  onCapture,
}: {
  proposal: Proposal;
  handoff: Handoff;
  blocking: readonly string[];
  step: InteriorsPresentStep;
  needsCapture: boolean;
  onCapture: () => void;
}) {
  const ready = Boolean(proposal.gate?.ready);
  const showProposalBlocking = step === "capture" || step === "proposal";
  return (
    <>
      {showProposalBlocking && blocking.length ? (
        <ul className="interiors-present-blocking" data-testid="interiors-present-blocking">
          {blocking.map((detail) => <li key={detail} className="is-blocking">{detail}</li>)}
        </ul>
      ) : null}
      {needsCapture ? (
        <button type="button" data-testid="interiors-present-capture" onClick={onCapture}>
          Capture client view
        </button>
      ) : null}
      <button
        type="button"
        className="is-primary proposal-review-create"
        data-testid="create-proposal"
        onClick={() => void proposal.createProposal()}
        disabled={!ready || proposal.busy}
      >
        Create Proposal
      </button>
      {proposal.status ? <p className="planner-v2-review-status">{proposal.status}</p> : null}
        <EngineeringHandoffSection handoff={handoff} compact />
    </>
  );
}
