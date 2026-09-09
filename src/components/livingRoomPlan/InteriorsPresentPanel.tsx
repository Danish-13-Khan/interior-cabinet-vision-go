import {
  interiorsPresentBlocking,
  interiorsPresentNeedsCapture,
  interiorsPresentStep,
} from "../../domain/desktopUx";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import { InspectorProposalGateChecks } from "./InspectorProposalGateChecks";
import { InteriorsPresentActions } from "./InteriorsPresentActions";
import { InteriorsPresentCommercial } from "./InteriorsPresentCommercial";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";
import { InteriorsProposalIdentity } from "./InteriorsProposalIdentity";

type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

export function interiorsPresentPanelState(proposal: Proposal, handoff: Handoff) {
  const live = proposal.live;
  const items = proposal.gate?.items ?? [];
  const needsCapture = interiorsPresentNeedsCapture(items);
  const step = interiorsPresentStep({
    frozen: Boolean(live?.frozen),
    stale: Boolean(live?.stale),
    needsCapture,
    proposalReleased: Boolean(proposal.released),
    approved: handoff.revisionApproved,
    handoffSent: Boolean(handoff.sent),
  });
  return {
    step,
    needsCapture,
    blocking: interiorsPresentBlocking(step, items, handoff.gate?.items ?? []),
  };
}

export function InteriorsPresentPanel({
  proposal,
  handoff,
  onCapture,
  onReturnToReview,
}: {
  proposal: Proposal;
  handoff: Handoff;
  onCapture: () => void;
  onReturnToReview: () => void;
}) {
  const live = proposal.live;
  if (!live || !proposal.gate) return null;
  const state = interiorsPresentPanelState(proposal, handoff);
  return (
    <aside className="planner-v2-review interiors-present-panel" data-testid="interiors-present-panel" data-step={state.step} aria-label="Present and Send">
      <div className="interiors-compact-close-heading">
        <span>Close the cabinet sale</span>
        <h1>Rev {live.quote.job.revision} is ready to present</h1>
        <p>The price, proposal, approval, and engineering model stay on this cabinet revision.</p>
      </div>
      <header>
        <span>Present and Send</span>
        <small>{state.blocking.length ? `${state.blocking.length} blocking` : "Ready for the next action"}</small>
      </header>
      <p className="interiors-present-scope-note" data-testid="interiors-present-scope-note">
        Client 3D hides selection marks and the edit toolbar. Live quote and commercial
        fields stay here until the commercial dialog design pass.
      </p>
      <button type="button" data-testid="interiors-present-return-review" onClick={onReturnToReview}>
        Return to Review
      </button>
      <InteriorsProposalIdentity job={live.quote.job} onJob={proposal.patchJob} />
      <InteriorsPresentQuote proposal={proposal} />
      <InteriorsPresentCommercial quote={live.quote.settings} onQuote={proposal.patchQuote} />
      <InspectorProposalGateChecks
        items={proposal.gate.items}
        blockingCount={proposal.gate.blockingCount}
        ready={proposal.gate.ready}
      />
      <InteriorsPresentActions
        proposal={proposal} handoff={handoff} blocking={state.blocking}
        needsCapture={state.needsCapture} onCapture={onCapture}
      />
    </aside>
  );
}
