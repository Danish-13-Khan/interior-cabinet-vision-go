import type { ReactNode } from "react";
import type { InteriorProject } from "../../domain/interiorProject";
import type { ProductionCutlistLine } from "../../domain/productionCutlist";
import type { ProjectWorkflow, StudioSection, StudioSurface } from "../../domain/studio/navigation";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { EngineeringHandoffSection } from "../livingRoomPlan/EngineeringHandoffSection";
import { InteriorClientPanel } from "../livingRoomPlan/InteriorClientPanel";
import { InteriorPaymentsPanel } from "../livingRoomPlan/InteriorPaymentsPanel";
import { InteriorsPresentCommercial } from "../livingRoomPlan/InteriorsPresentCommercial";
import { InteriorsPresentQuote } from "../livingRoomPlan/InteriorsPresentQuote";
import { InspectorProposalGateChecks } from "../livingRoomPlan/InspectorProposalGateChecks";
import { StudioDocumentsPage } from "./StudioDocumentsPage";
import { StudioEngineeringPage } from "./StudioEngineeringPage";
import { StudioPriceBookPage } from "./StudioPriceBookPage";
import { StudioSettingsPage } from "./StudioSettingsPage";

type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

export function StudioMain(props: {
  surface: StudioSurface;
  section: StudioSection;
  workflow: ProjectWorkflow;
  project: InteriorProject | null;
  onPatchDocument: (update: (project: InteriorProject) => InteriorProject) => void;
  proposal: Proposal;
  handoff: Handoff;
  cutlistLines: ProductionCutlistLine[];
  cutlistStatus: string;
  home: ReactNode;
  design: ReactNode;
}) {
  const showDesign = Boolean(props.project) && props.surface === "project" && props.workflow === "design";
  return (
    <>
      <div hidden={!showDesign}>{props.design}</div>
      {props.surface === "studio" && props.section === "projects" ? props.home : null}
      {props.surface === "studio" && props.section === "price-book" ? <StudioPriceBookPage /> : null}
      {props.surface === "studio" && props.section === "clients" ? (
        props.project ? <InteriorClientPanel project={props.project} onPatchDocument={props.onPatchDocument} /> : <p className="studio-state">Open a project to link a client.</p>
      ) : null}
      {props.surface === "studio" && props.section === "documents" ? <StudioDocumentsPage project={props.project} /> : null}
      {props.surface === "studio" && props.section === "settings" ? (
        <StudioSettingsPage project={props.project} quote={props.proposal.live?.quote.settings ?? null} onQuote={props.proposal.patchQuote} />
      ) : null}
      {props.surface === "project" && props.workflow === "quote" && props.proposal.live ? (
        <div className="studio-page" data-testid="studio-quote">
          <InteriorsPresentQuote proposal={props.proposal} />
          <InteriorsPresentCommercial quote={props.proposal.live.quote.settings} onQuote={props.proposal.patchQuote} />
        </div>
      ) : null}
      {props.surface === "project" && props.workflow === "approval" && props.proposal.gate ? (
        <div className="studio-page" data-testid="studio-approval">
          <InspectorProposalGateChecks items={props.proposal.gate.items} blockingCount={props.proposal.gate.blockingCount} ready={props.proposal.gate.ready} />
          <EngineeringHandoffSection handoff={props.handoff} />
        </div>
      ) : null}
      {props.surface === "project" && props.workflow === "engineering" ? (
        <StudioEngineeringPage lines={props.cutlistLines} status={props.cutlistStatus} />
      ) : null}
      {props.surface === "project" && props.workflow === "payments" && props.project ? (
        <div className="studio-page"><InteriorPaymentsPanel project={props.project} /></div>
      ) : null}
    </>
  );
}
