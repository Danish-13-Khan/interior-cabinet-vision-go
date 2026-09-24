import { formatQuoteMoney } from "../../domain/quoteSettings";
import { createLivingRoomPlanThumbnail } from "../../domain/livingRoom";
import { readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import type { InteriorProject } from "../../domain/interiorProject";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;

export function StudioProposalPreview(props: {
  project: InteriorProject;
  proposal: Proposal;
  lineCount: number;
}) {
  const live = props.proposal.live;
  if (!live) return null;
  const quote = live.quote;
  const client = readProposalCommercial(props.project).job.customerName.trim() || "Client";
  const money = (amount: number) => formatQuoteMoney(amount, quote.settings.currencyLabel);
  const plan = createLivingRoomPlanThumbnail(props.project);
  return (
    <aside className="studio-proposal-sheet" data-testid="studio-proposal-preview" aria-label="Proposal preview">
      <p className="studio-proposal-brand">Proposal preview</p>
      <h3>{props.project.name}</h3>
      {plan ? <img className="studio-proposal-plan" src={plan} alt="" /> : null}
      <p>Prepared for {client}</p>
      <p>Design rev {quote.job.revision}</p>
      <dl>
        <div><dt>Cabinetry & installation</dt><dd>{money(quote.workshopSubtotal)}</dd></div>
        <div><dt>Design markup · {quote.settings.markupPercent}%</dt><dd>{money(quote.markupAmount)}</dd></div>
        <div><dt>{quote.settings.taxLabel} · {quote.settings.taxPercent}%</dt><dd>{money(quote.taxAmount)}</dd></div>
      </dl>
      <p className="studio-kicker">Total investment</p>
      <p className="studio-proposal-total">{money(quote.sellTotal)}</p>
      <p>{props.lineCount} takeoff lines · valid {quote.settings.validityDays} days</p>
      {live.frozen ? (
        <p>Issued rev {live.frozen.revision} · {money(live.frozen.sellTotal)}</p>
      ) : (
        <p>Not issued. Freeze locks this proposal total.</p>
      )}
      {live.staleReason ? <p className="studio-state is-error">{live.staleReason}</p> : null}
      <small>This total includes saved quantity edits. Freeze issues this amount.</small>
    </aside>
  );
}
