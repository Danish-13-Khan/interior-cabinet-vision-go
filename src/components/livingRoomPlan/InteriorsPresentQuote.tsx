import { formatQuoteMoney } from "../../domain/quoteSettings";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;

export function InteriorsPresentQuote({ proposal }: { proposal: Proposal }) {
  const live = proposal.live;
  if (!live) return null;
  const quote = live.quote;
  const total = formatQuoteMoney(quote.sellTotal, quote.settings.currencyLabel);
  const frozenLabel = live.frozen
    ? live.stale
      ? `Stale · frozen Rev ${live.frozen.revision}`
      : `Frozen Rev ${live.frozen.revision} · matches live`
    : "Live estimate · not yet frozen";
  return (
    <section className="proposal-review" aria-label="Live quote">
      <strong>Selling total</strong>
      <p className="proposal-review-total" data-testid="proposal-live-total" data-sell-total={quote.sellTotal}>{total}</p>
      <small data-testid="proposal-quote-status">{frozenLabel}</small>
      {live.missingRate ? <small className="is-warning">Missing rate — total is zero.</small> : null}
      {quote.validUntil ? (
        <small>Valid until {new Date(quote.validUntil).toLocaleDateString()}</small>
      ) : (
        <small>No validity date disclosed</small>
      )}
      <button type="button" onClick={proposal.freezeQuote}>Freeze quote</button>
      {live.stale && live.staleReason ? (
        <small className="is-warning" data-testid="proposal-stale">{live.staleReason}</small>
      ) : null}
    </section>
  );
}
