import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;

export function StudioQuoteToolbar(props: { proposal: Proposal }) {
  const live = props.proposal.live;
  return (
    <header className="studio-quote-bar">
      <div>
        <h2>Quote & proposal</h2>
        {live?.stale ? <span className="studio-badge is-warn">Needs update</span> : <span className="studio-badge is-saved">Current</span>}
      </div>
      <div className="studio-actions">
        <button type="button" className="studio-btn" onClick={() => void props.proposal.createProposal()} disabled={!live || props.proposal.busy}>
          Export quote
        </button>
        <button type="button" className="studio-btn is-primary" onClick={props.proposal.freezeQuote} disabled={!live || live.missingRate || props.proposal.canFreezeQuotes === false}>
          Freeze quote
        </button>
      </div>
    </header>
  );
}
