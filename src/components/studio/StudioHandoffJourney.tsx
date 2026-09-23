import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import { readPaymentLedger } from "../../domain/paymentLedger";
import { moveJourneyFocus, studioHandoffJourney, type JourneyStepId } from "../../domain/studio/handoffJourney";
import { paymentDashboard } from "../../domain/studio/paymentDashboard";
import type { ProjectWorkflow } from "../../domain/studio/navigation";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";

type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

const WORKFLOW: Record<JourneyStepId, ProjectWorkflow> = {
  design: "design",
  quote: "quote",
  approval: "approval",
  engineering: "engineering",
  production: "engineering",
};

export function StudioHandoffJourney(props: {
  project: InteriorProject;
  proposal: Proposal;
  handoff: Handoff;
  cutlistCount: number;
  onOpen: (workflow: ProjectWorkflow) => void;
}) {
  const job = readProposalCommercial(props.project).job;
  const payment = paymentDashboard(readPaymentLedger(), props.project.id);
  const paymentReady = Boolean(payment && payment.outstanding === 0 && payment.overdue === 0);
  const journey = studioHandoffJourney({
    designRevision: props.proposal.live?.quote.job.revision || job.revision || "A",
    hasDesign: props.project.rooms.length > 0,
    quoteRevision: props.proposal.live?.frozen?.revision ?? null,
    quoteFrozen: Boolean(props.proposal.live?.frozen),
    quoteStale: Boolean(props.proposal.live?.stale),
    clientApproved: props.handoff.revisionApproved || job.status === "approved" || job.status === "production",
    cutlistCount: props.cutlistCount,
    productionReleased: props.handoff.sent || job.status === "production",
    paymentReady,
    paymentDetail: payment
      ? `Outstanding ${payment.outstanding.toLocaleString()}, overdue ${payment.overdue.toLocaleString()}`
      : "No payment obligation yet",
  });
  const [focus, setFocus] = useState<JourneyStepId>("design");

  return (
    <section className="studio-card" data-testid="studio-handoff-journey">
      <h2>Design rev {journey.designRevision} · Quote rev {journey.quoteRevision ?? "not issued"}</h2>
      <div
        className="studio-journey"
        role="tablist"
        aria-label="Handoff"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const next = moveJourneyFocus(journey.steps.map((step) => step.id), focus, event.key);
          setFocus(next);
          document.getElementById(`studio-journey-${next}`)?.focus();
        }}
      >
        {journey.steps.map((step) => (
          <button
            key={step.id}
            id={`studio-journey-${step.id}`}
            type="button"
            role="tab"
            className={`studio-btn${step.state === "done" ? " is-primary" : ""}`}
            aria-selected={focus === step.id}
            onClick={() => { setFocus(step.id); props.onOpen(WORKFLOW[step.id]); }}
          >
            <strong>{step.label}</strong>
            <small>{step.state} · {step.detail}</small>
          </button>
        ))}
      </div>
      <p className={journey.paymentReady ? "studio-badge is-saved" : "studio-badge is-warn"}>
        Payment readiness is separate. {journey.paymentDetail}
      </p>
    </section>
  );
}
