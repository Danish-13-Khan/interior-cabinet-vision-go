import { formatQuoteMoney } from "../../domain/quoteSettings";
import { quoteComparisonView, quoteIssuedMatchesCurrent } from "../../domain/studio/quoteComparison";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;

export function StudioQuoteComparison({ proposal }: { proposal: Proposal }) {
  const live = proposal.live;
  if (!live) return <p className="studio-state">Open a project to estimate a quote.</p>;
  const view = quoteComparisonView({
    designRevision: live.quote.job.revision,
    currency: live.quote.settings.currencyLabel,
    workshop: live.quote.workshopSubtotal,
    markupPercent: live.quote.settings.markupPercent,
    markup: live.quote.markupAmount,
    taxLabel: live.quote.settings.taxLabel,
    taxPercent: live.quote.settings.taxPercent,
    tax: live.quote.taxAmount,
    validityDays: live.quote.settings.validityDays,
    validUntil: live.quote.validUntil,
    currentSell: live.quote.sellTotal,
    issued: live.frozen
      ? { revision: live.frozen.revision, sellTotal: live.frozen.sellTotal, quotedAt: live.frozen.quotedAt }
      : null,
    stale: live.stale,
    staleReason: live.staleReason,
  });
  const money = (amount: number) => formatQuoteMoney(amount, view.currency);
  return (
    <section className="studio-card" data-testid="studio-quote-comparison">
      <h2>Current estimate · Rev {view.designRevision}</h2>
      <p>Workshop {money(view.workshop)} · Markup {view.markupPercent}% ({money(view.markup)}) · {view.taxLabel} {view.taxPercent}% ({money(view.tax)})</p>
      <p>Sell {money(view.currentSell)} · Valid {view.validityDays} days{view.validUntil ? ` until ${view.validUntil.slice(0, 10)}` : ""}</p>
      <h3>Issued quote</h3>
      {view.issued ? (
        <p>Rev {view.issued.revision} · {money(view.issued.sellTotal)} · {view.issued.quotedAt.slice(0, 10)}</p>
      ) : (
        <p>No issued quote yet. Freeze the current estimate to issue one.</p>
      )}
      {quoteIssuedMatchesCurrent(view) ? (
        <p className="studio-badge is-saved">Issued quote matches the current design.</p>
      ) : view.staleReason ? (
        <p className="studio-state is-error">{view.staleReason}</p>
      ) : null}
    </section>
  );
}
