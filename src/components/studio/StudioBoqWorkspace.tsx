import { useMemo } from "react";
import { buildBoqFromReport, csvFromBoqViews } from "../../domain/boq";
import type { InteriorProject } from "../../domain/interiorProject";
import { readPersonalPriceBook } from "../../domain/priceBook";
import { createInteriorQuoteReport } from "../../domain/livingRoom/proposal/interiorQuoteReport";
import { formatQuoteMoney } from "../../domain/quoteSettings";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { StudioProposalPreview } from "./StudioProposalPreview";

type Proposal = ReturnType<typeof useProposalWorkflow>;

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function StudioBoqWorkspace(props: { project: InteriorProject; proposal: Proposal }) {
  const priceBookKey = JSON.stringify(readPersonalPriceBook());
  const built = useMemo(() => {
    try {
      const report = createInteriorQuoteReport(props.project, undefined, { priceBook: readPersonalPriceBook() });
      return { views: buildBoqFromReport(report), error: null as string | null };
    } catch (error) {
      return { views: null, error: error instanceof Error ? error.message : "BOQ could not be built." };
    }
  }, [priceBookKey, props.project]);
  if (!built.views) return <p className="studio-state is-error">{built.error}</p>;
  const currency = props.proposal.live?.quote.settings.currencyLabel;
  const money = (amount: number) => (currency ? formatQuoteMoney(amount, currency) : String(amount));
  return (
    <div className="studio-quote-split" data-testid="studio-boq">
      <section className="studio-card">
        <header className="studio-cutlist-toolbar">
          <div>
            <h2>Bill of quantities</h2>
            <p>Takeoff from the current estimate. Freeze uses the proposal total, not the sum of these lines.</p>
          </div>
          <button type="button" className="studio-btn" onClick={() => download("boq.csv", csvFromBoqViews(built.views!), "text/csv")}>BOQ CSV</button>
        </header>
        <table className="studio-table">
          <thead>
            <tr><th>Cabinet</th><th>Part</th><th>Material</th><th>Qty</th><th>Sell share</th></tr>
          </thead>
          <tbody>
            {built.views.lines.map((line) => (
              <tr key={line.key}>
                <td>{line.cabinetName}</td>
                <td>{line.partLabel}</td>
                <td>{line.material}</td>
                <td>{line.quantity}</td>
                <td>{money(line.sellPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <StudioProposalPreview project={props.project} proposal={props.proposal} lineCount={built.views.lines.length} />
    </div>
  );
}
