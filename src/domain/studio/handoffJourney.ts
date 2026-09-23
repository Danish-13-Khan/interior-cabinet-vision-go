export type JourneyStepId = "design" | "quote" | "approval" | "engineering" | "production";
export type JourneyStepState = "done" | "current" | "blocked";

export type JourneyStep = {
  id: JourneyStepId;
  label: string;
  state: JourneyStepState;
  detail: string;
};

export type HandoffJourney = {
  designRevision: string;
  quoteRevision: string | null;
  paymentReady: boolean;
  paymentDetail: string;
  steps: JourneyStep[];
};

const LABELS: Record<JourneyStepId, string> = {
  design: "Design",
  quote: "Quote",
  approval: "Client approval",
  engineering: "Engineering",
  production: "Production release",
};

export function studioHandoffJourney(input: {
  designRevision: string;
  hasDesign: boolean;
  quoteRevision: string | null;
  quoteFrozen: boolean;
  quoteStale: boolean;
  clientApproved: boolean;
  cutlistCount: number;
  productionReleased: boolean;
  paymentReady: boolean;
  paymentDetail: string;
}): HandoffJourney {
  const quoteReady = input.quoteFrozen && !input.quoteStale;
  const engineeringReady = quoteReady && input.clientApproved && input.cutlistCount > 0;
  const states: Record<JourneyStepId, JourneyStepState> = {
    design: input.hasDesign ? "done" : "current",
    quote: !input.hasDesign ? "blocked" : quoteReady ? "done" : "current",
    approval: !quoteReady ? "blocked" : input.clientApproved ? "done" : "current",
    engineering: !quoteReady || !input.clientApproved ? "blocked" : engineeringReady ? "done" : "current",
    production: !engineeringReady ? "blocked" : input.productionReleased ? "done" : "current",
  };
  const details: Record<JourneyStepId, string> = {
    design: `Design rev ${input.designRevision}`,
    quote: input.quoteStale
      ? `Quote rev ${input.quoteRevision ?? "—"} is stale`
      : input.quoteFrozen
        ? `Issued quote rev ${input.quoteRevision}`
        : "Estimate is live and not issued",
    approval: input.clientApproved ? "Client approved this revision" : "Waiting for client approval",
    engineering: input.cutlistCount > 0 ? `${input.cutlistCount} cut-list parts` : "No manufactured parts yet",
    production: input.productionReleased ? "Released to production" : "Release after engineering is ready",
  };
  return {
    designRevision: input.designRevision,
    quoteRevision: input.quoteRevision,
    paymentReady: input.paymentReady,
    paymentDetail: input.paymentDetail,
    steps: (Object.keys(LABELS) as JourneyStepId[]).map((id) => ({
      id,
      label: LABELS[id],
      state: states[id],
      detail: details[id],
    })),
  };
}

export function moveJourneyFocus(ids: readonly JourneyStepId[], current: JourneyStepId, key: "ArrowLeft" | "ArrowRight") {
  const index = ids.indexOf(current);
  if (index < 0) return current;
  const next = key === "ArrowRight" ? index + 1 : index - 1;
  return ids[Math.min(ids.length - 1, Math.max(0, next))] ?? current;
}
