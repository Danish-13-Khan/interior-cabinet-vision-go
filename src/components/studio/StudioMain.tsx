import { useMemo, type ReactNode } from "react";
import { cabinetProjectFromInteriorProject, type InteriorProject } from "../../domain/interiorProject";
import { exportProjectMachineFile } from "../../domain/machineExport/io";
import type { ProductionCutlistLine } from "../../domain/productionCutlist";
import type { ProjectWorkflow, StudioSection, StudioSurface } from "../../domain/studio/navigation";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import { EngineeringHandoffSection } from "../livingRoomPlan/EngineeringHandoffSection";
import { InteriorProjectTools } from "../livingRoomPlan/InteriorProjectTools";
import { InteriorClientPanel } from "../livingRoomPlan/InteriorClientPanel";
import { InteriorPaymentsPanel } from "../livingRoomPlan/InteriorPaymentsPanel";
import { InteriorsPresentCommercial } from "../livingRoomPlan/InteriorsPresentCommercial";
import { InteriorsPresentQuote } from "../livingRoomPlan/InteriorsPresentQuote";
import { StudioHandoffJourney } from "./StudioHandoffJourney";
import { StudioQuoteComparison } from "./StudioQuoteComparison";
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
  selectedCutlistKey: string | null;
  onSelectCutlistLine: (key: string) => void;
  onWorkflow: (workflow: ProjectWorkflow) => void;
  home: ReactNode;
  design: ReactNode;
}) {
  const machine = useMemo(() => {
    if (!props.project) return { summary: "", json: null as string | null, error: null as string | null };
    try {
      const file = exportProjectMachineFile(cabinetProjectFromInteriorProject(props.project).project);
      const summary = file.document.summary;
      return {
        summary: `Machine file ${summary.partCount} parts, ${summary.operationCount} operations.`,
        json: file.contents,
        error: null,
      };
    } catch (error) {
      return { summary: "", json: null, error: error instanceof Error ? error.message : "Machine export failed." };
    }
  }, [props.project]);
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
      {props.surface === "project" && props.workflow === "quote" && props.project ? (
        <div className="studio-page" data-testid="studio-quote">
          <InteriorProjectTools
            project={props.project}
            onPatchDocument={props.onPatchDocument}
          />
          {props.proposal.live ? (
            <>
              <StudioQuoteComparison proposal={props.proposal} />
              <InteriorsPresentQuote proposal={props.proposal} />
              <InteriorsPresentCommercial quote={props.proposal.live.quote.settings} onQuote={props.proposal.patchQuote} />
            </>
          ) : (
            <p className="studio-state">Use Project tools for interior rates, exclusions, manual lines, and company controls before a quote can be issued.</p>
          )}
        </div>
      ) : null}
      {props.surface === "project" && props.workflow === "approval" && props.project ? (
        <div className="studio-page" data-testid="studio-approval">
          <StudioHandoffJourney
            project={props.project}
            proposal={props.proposal}
            handoff={props.handoff}
            cutlistCount={props.cutlistLines.length}
            onOpen={props.onWorkflow}
          />
          {props.proposal.gate ? (
            <InspectorProposalGateChecks items={props.proposal.gate.items} blockingCount={props.proposal.gate.blockingCount} ready={props.proposal.gate.ready} />
          ) : (
            <p className="studio-state">Approval checks appear when a quote can be estimated.</p>
          )}
          <EngineeringHandoffSection handoff={props.handoff} />
        </div>
      ) : null}
      {props.surface === "project" && props.workflow === "engineering" ? (
        <StudioEngineeringPage
          lines={props.cutlistLines}
          status={props.cutlistStatus}
          selectedKey={props.selectedCutlistKey}
          machineSummary={machine.summary}
          machineJson={machine.json}
          machineError={machine.error}
          onSelectLine={props.onSelectCutlistLine}
        />
      ) : null}
      {props.surface === "project" && props.workflow === "payments" && props.project ? (
        <div className="studio-page"><InteriorPaymentsPanel project={props.project} /></div>
      ) : null}
    </>
  );
}
