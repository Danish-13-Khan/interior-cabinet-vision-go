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
  clientAccepted: boolean;
  engineeringSent: boolean;
  cutlistCount: number;
  productionReleased: boolean;
  paymentReady: boolean;
  paymentDetail: string;
}): HandoffJourney {
  const quoteReady = input.quoteFrozen && !input.quoteStale;
  const accepted = quoteReady && input.clientAccepted;
  const engineeringDone = accepted && input.engineeringSent && input.cutlistCount > 0;
  const states: Record<JourneyStepId, JourneyStepState> = {
    design: input.hasDesign ? "done" : "current",
    quote: !input.hasDesign ? "blocked" : quoteReady ? "done" : "current",
    approval: !quoteReady ? "blocked" : input.clientAccepted ? "done" : "current",
    engineering: !accepted ? "blocked" : engineeringDone ? "done" : "current",
    production: !engineeringDone ? "blocked" : input.productionReleased ? "done" : "current",
  };
  const details: Record<JourneyStepId, string> = {
    design: `Design rev ${input.designRevision}`,
    quote: input.quoteStale
      ? `Quote rev ${input.quoteRevision ?? "—"} is stale`
      : input.quoteFrozen
        ? `Issued quote rev ${input.quoteRevision}`
        : "Estimate is live and not issued",
    approval: input.clientAccepted
      ? `Client accepted quote rev ${input.quoteRevision}`
      : "Waiting for client acceptance of this quote revision",
    engineering: input.engineeringSent
      ? `Sent to engineering · design rev ${input.designRevision}`
      : input.cutlistCount > 0
        ? `${input.cutlistCount} parts · not sent to engineering`
        : "No manufactured parts yet",
    production: input.productionReleased
      ? `Released to production · rev ${input.designRevision}`
      : "Not released to production",
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
