import { useMemo, useState } from "react";
import { buildBoqFromReport, buildBoqViews, csvFromBoqViews } from "../../domain/boq";
import type { InteriorProject } from "../../domain/interiorProject";
import { patchBoqQuantities, readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import { createInteriorQuoteReport } from "../../domain/livingRoom/proposal/interiorQuoteReport";
import { readPersonalPriceBook } from "../../domain/priceBook";
import { formatQuoteMoney } from "../../domain/quoteSettings";
import { applyBoqQuantities, boqQuantityLimitMessage } from "../../domain/studio/boqWorksheet";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { StudioBoqGroups } from "./StudioBoqGroups";
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

export function StudioBoqWorkspace(props: {
  project: InteriorProject;
  proposal: Proposal;
  onPatchDocument: (update: (project: InteriorProject) => InteriorProject) => void;
}) {
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
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
  const baseLines = built.views.lines;
  const quantities = readProposalCommercial(props.project).surface.boqQuantities;
  const lines = applyBoqQuantities(baseLines, quantities);
  const groups = buildBoqViews(lines).byCabinet;
  const currency = props.proposal.live?.quote.settings.currencyLabel;
  const money = (amount: number) => (currency ? formatQuoteMoney(amount, currency) : String(amount));

  function setQuantity(key: string, base: number, raw: string) {
    const quantity = Math.round(Number(raw));
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 9999) return;
    const next = { ...readProposalCommercial(props.project).surface.boqQuantities };
    if (quantity === base) delete next[key];
    else next[key] = quantity;
    setLimitMessage(boqQuantityLimitMessage(next));
    props.onPatchDocument((project) => patchBoqQuantities(project, next));
  }

  return (
    <div className="studio-quote-split" data-testid="studio-boq">
      <section className="studio-card">
        <header className="studio-cutlist-toolbar">
          <div>
            <p className="studio-kicker">Estimate workspace</p>
            <h2>Bill of quantities</h2>
            <p>Quantity edits stay on this project and are included when the quote is frozen.</p>
            {limitMessage ? <p role="status">{limitMessage}</p> : null}
          </div>
          <button type="button" className="studio-btn" onClick={() => download("boq.csv", csvFromBoqViews({ ...built.views!, lines }), "text/csv")}>BOQ CSV</button>
        </header>
        <StudioBoqGroups groups={groups} baseLines={baseLines} money={money} onQuantity={setQuantity} />
      </section>
      <StudioProposalPreview project={props.project} proposal={props.proposal} lineCount={lines.length} />
    </div>
  );
}
