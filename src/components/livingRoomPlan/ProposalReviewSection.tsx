import { formatQuoteMoney } from "../../domain/quoteSettings";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { ProposalCommercialFields } from "./ProposalCommercialFields";
import { ProposalGateList } from "./ProposalGateList";

type Proposal = ReturnType<typeof useProposalWorkflow>;

export function ProposalReviewSection({
  proposal,
}: {
  proposal: Proposal;
}) {
  const live = proposal.live;
  if (!live || !proposal.gate) return null;
  const quote = live.quote;
  const total = formatQuoteMoney(quote.sellTotal, quote.settings.currencyLabel);
  const frozenLabel = live.frozen
    ? live.stale
      ? `Stale · frozen Rev ${live.frozen.revision}`
      : `Frozen Rev ${live.frozen.revision} · matches live`
    : "Live estimate · not yet frozen";

  return (
    <section className="proposal-review" aria-label="Proposal">
      <strong>Proposal</strong>
      <p className="proposal-review-total" data-testid="proposal-live-total" data-sell-total={quote.sellTotal}>{total}</p>
      <small data-testid="proposal-quote-status">{frozenLabel}</small>
      {live.missingRate ? <small className="is-warning">Missing rate — total is zero.</small> : null}
      {quote.validUntil ? (
        <small>Valid until {new Date(quote.validUntil).toLocaleDateString()}</small>
      ) : (
        <small>No validity date disclosed</small>
      )}
      <ProposalCommercialFields
        quote={quote.settings}
        job={quote.job}
        onQuote={proposal.patchQuote}
        onJob={proposal.patchJob}
      />
      <button type="button" onClick={proposal.freezeQuote}>
        Freeze quote
      </button>
      {live.stale && live.staleReason ? (
        <small className="is-warning" data-testid="proposal-stale">{live.staleReason}</small>
      ) : null}
      {proposal.gate.canOverrideStale ? (
        <div className="proposal-review-override-block">
          <label className="proposal-review-override">
            <input
              type="checkbox"
              checked={proposal.staleOverride}
              onChange={(event) => proposal.setStaleOverride(event.currentTarget.checked)}
            />
            Disclose stale quote on the proposal
          </label>
          {proposal.staleOverride ? (
            <label className="proposal-review-fields">
              Override reason
              <textarea
                data-testid="proposal-override-reason"
                value={proposal.overrideReason}
                rows={2}
                placeholder="Why this frozen quote is still valid to send"
                onChange={(event) => proposal.setOverrideReason(event.currentTarget.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}
      <div className="proposal-review-views">
        <small>Named views</small>
        {proposal.views.length === 0 ? <small>Bookmark a client view first.</small> : null}
        {proposal.views.map((view) => (
          <label key={view.cameraId}>
            <input
              type="checkbox"
              checked={view.selected}
              onChange={() => proposal.toggleView(view.cameraId)}
            />
            {view.viewName}
          </label>
        ))}
      </div>
      <ProposalGateList gate={proposal.gate} />
      <button
        type="button"
        className="is-primary proposal-review-create"
        data-testid="create-proposal"
        onClick={() => void proposal.createProposal()}
        disabled={!proposal.gate.ready || proposal.busy}
      >
        Create Proposal
      </button>
      {proposal.status ? <p className="planner-v2-review-status">{proposal.status}</p> : null}
    </section>
  );
}
