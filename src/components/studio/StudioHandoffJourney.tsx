import { useState } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import { readProposalCommercial } from "../../domain/livingRoom/proposal/commercialState";
import { readPaymentLedger } from "../../domain/paymentLedger";
import { revisionHandoffRecords } from "../../domain/studio/handoffRecords";
import { moveJourneyFocus, studioHandoffJourney, type JourneyStepId } from "../../domain/studio/handoffJourney";
import { canViewPaymentRecords } from "../../domain/studio/paymentAccess";
import { paymentDashboard } from "../../domain/studio/paymentDashboard";
import type { ProjectWorkflow } from "../../domain/studio/navigation";
import { useAccountPlan } from "../../hooks/useAccountPlan";
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
  const account = useAccountPlan();
  const seat = account.account?.organization?.seats.find(
    (item) => item.email.toLowerCase() === account.account?.email.toLowerCase(),
  );
  const canViewPayments = canViewPaymentRecords({ entitlements: account.entitlements, seat });
  const job = readProposalCommercial(props.project).job;
  const designRevision = props.proposal.live?.quote.job.revision || job.revision || "A";
  const quoteRevision = props.proposal.live?.frozen?.revision ?? null;
  const records = revisionHandoffRecords({
    designRevision,
    quoteSnapshotId: props.proposal.live?.frozen?.id ?? null,
    projectId: props.project.id,
    jobRevision: job.revision,
    jobStatus: job.status,
    productionAt: job.productionAt,
    engineeringSent: props.handoff.sent,
    documents: readPaymentLedger().documents,
  });
  const payment = canViewPayments ? paymentDashboard(readPaymentLedger(), props.project.id) : null;
  const journey = studioHandoffJourney({
    designRevision,
    hasDesign: props.project.rooms.length > 0,
    quoteRevision,
    quoteFrozen: Boolean(props.proposal.live?.frozen),
    quoteStale: Boolean(props.proposal.live?.stale),
    clientAccepted: records.clientAccepted,
    engineeringSent: records.engineeringSent,
    cutlistCount: props.cutlistCount,
    productionReleased: records.productionReleased,
    paymentReady: Boolean(canViewPayments && payment && payment.outstanding === 0 && payment.overdue === 0),
    paymentDetail: !canViewPayments
      ? "Payment balances need payment access."
      : payment
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
