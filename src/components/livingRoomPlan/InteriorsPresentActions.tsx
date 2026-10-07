import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { InteriorsPresentStep } from "../../domain/desktopUx";
import { EngineeringHandoffSection } from "./EngineeringHandoffSection";

export type InteriorsPresentPhoto = {
  /** The render service the seat found; null hides the button. */
  serviceUrl: string | null;
  busy: boolean;
  status: string | null;
  error: string | null;
  onRender: () => void;
  onCancel: () => void;
};

type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

export function InteriorsPresentActions({
  proposal,
  handoff,
  blocking,
  step,
  needsCapture,
  onCapture,
  onExportPhotoJob,
  photo,
}: {
  proposal: Proposal;
  handoff: Handoff;
  blocking: readonly string[];
  step: InteriorsPresentStep;
  needsCapture: boolean;
  onCapture: () => void;
  /** Phase 3: write a Cycles photo job for `npm run cycles:render`. */
  onExportPhotoJob?: () => void;
  /** Phase 3 transport (a): render every selected client view on the Cycles service. */
  photo?: InteriorsPresentPhoto;
}) {
  const ready = Boolean(proposal.gate?.ready);
  const proposalCommitted = Boolean(proposal.released || handoff.revisionApproved || handoff.sent);
  const showProposalBlocking = !proposalCommitted && (step === "capture" || step === "proposal");
  return (
    <>
      {showProposalBlocking && blocking.length ? (
        <ul className="interiors-present-blocking" data-testid="interiors-present-blocking">
          {blocking.map((detail) => <li key={detail} className="is-blocking">{detail}</li>)}
        </ul>
      ) : null}
      {photo?.serviceUrl && !proposalCommitted ? (
        <button
          type="button"
          className="is-primary"
          data-testid="interiors-present-render-photo"
          title="Renders every selected client view with Cycles and binds the accepted stills to this proposal"
          onClick={photo.busy ? photo.onCancel : photo.onRender}
        >
          {photo.busy ? "Cancel photo render" : "Render photo stills"}
        </button>
      ) : null}
      {photo?.status ? <p className="planner-v2-review-status" data-testid="interiors-present-photo-status">{photo.status}</p> : null}
      {photo?.error ? <p className="interiors-present-photo-error" data-testid="interiors-present-photo-error">{photo.error}</p> : null}
      {needsCapture && !proposalCommitted ? (
        <button type="button" data-testid="interiors-present-capture" onClick={onCapture}>
          Capture client view
        </button>
      ) : null}
      {!proposalCommitted ? <button
        type="button"
        className="is-primary proposal-review-create"
        data-testid="create-proposal"
        onClick={() => void proposal.createProposal()}
        disabled={!ready || proposal.busy}
      >
        Create Proposal
      </button> : null}
      {onExportPhotoJob ? (
        <button
          type="button"
          data-testid="interiors-present-export-photo"
          title="Writes a Cycles job file; render it with npm run cycles:render and import the still in Still review"
          onClick={onExportPhotoJob}
        >
          Export photo job…
        </button>
      ) : null}
      {proposal.status ? <p className="planner-v2-review-status">{proposal.status}</p> : null}
        <EngineeringHandoffSection handoff={handoff} compact />
    </>
  );
}
