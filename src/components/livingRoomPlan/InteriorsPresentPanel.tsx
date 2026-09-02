import {
  interiorsPresentBlocking,
  interiorsPresentNeedsCapture,
  interiorsPresentStep,
} from "../../domain/desktopUx";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import { InteriorsPresentActions } from "./InteriorsPresentActions";
import { InteriorsPresentCommercial } from "./InteriorsPresentCommercial";
import { InteriorsPresentQuote } from "./InteriorsPresentQuote";

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
}: {
  proposal: Proposal;
  handoff: Handoff;
  onCapture: () => void;
}) {
  const live = proposal.live;
  if (!live || !proposal.gate) return null;
  const state = interiorsPresentPanelState(proposal, handoff);
  return (
    <aside className="planner-v2-review interiors-present-panel" data-testid="interiors-present-panel" data-step={state.step} aria-label="Present and Send">
      <header>
        <span>Present and Send</span>
        <small>{state.blocking.length ? `${state.blocking.length} blocking` : "Ready for the next action"}</small>
      </header>
      <InteriorsPresentQuote proposal={proposal} />
      <InteriorsPresentCommercial quote={live.quote.settings} onQuote={proposal.patchQuote} />
      <InteriorsPresentActions
        proposal={proposal} handoff={handoff} blocking={state.blocking}
        needsCapture={state.needsCapture} onCapture={onCapture}
      />
    </aside>
  );
}
