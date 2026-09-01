import {
  acceptedStillExportPayload,
  selectPackageAcceptedStillAssets,
} from "../../hooks/selectPackageAcceptedStillAssets";
import type { InteriorProject } from "../../domain/interiorProject";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import {
  buildPreExportChecklist,
  countResolvedPackageDeckViews,
  type LivingRoomPlanIssue,
  type LivingRoomRenderResult,
} from "../../domain/livingRoom";
import type { useClientPresentationExport } from "../../hooks/useClientPresentationExport";
import type { useMillworkSchedule } from "../../hooks/useMillworkSchedule";
import type { useProposalWorkflow } from "../../hooks/useProposalWorkflow";
import type { useEngineeringHandoff } from "../../hooks/useEngineeringHandoff";
import type { AcceptedStillAsset } from "../../hooks/selectPackageAcceptedStillAssets";
import { PlannerV2ReviewPanel } from "./PlannerV2ReviewPanel";

type Millwork = ReturnType<typeof useMillworkSchedule>;
type ClientExport = ReturnType<typeof useClientPresentationExport>;
type Proposal = ReturnType<typeof useProposalWorkflow>;
type Handoff = ReturnType<typeof useEngineeringHandoff>;

/** Review-step export panel wired to shared millwork + client package controllers. */
export function WorkspaceReviewExportPanel({
  project,
  issues,
  millwork,
  clientExport,
  proposal,
  handoff,
  acceptedStillAssets,
  latestRender,
  onSelect,
}: {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  millwork: Millwork;
  clientExport: ClientExport;
  proposal: Proposal;
  handoff: Handoff;
  acceptedStillAssets: AcceptedStillAsset[];
  latestRender: LivingRoomRenderResult | null;
  onSelect: (objectId: string | null) => void;
}) {
  const acceptedStillCount = selectPackageAcceptedStillAssets(project, acceptedStillAssets).length;
  const checklist = buildPreExportChecklist({
    issues,
    millworkCount: millwork.workflow?.millworkCount ?? 0,
    packageDeckCount: countResolvedPackageDeckViews(project),
    acceptedStillCount,
    geometryFallbackIds: activeRoomGeometryFallbackIds(project),
  });
  return (
    <PlannerV2ReviewPanel
      schedule={millwork.schedule}
      issues={issues}
      checklist={checklist}
      millworkBusy={millwork.busy}
      millworkStatus={millwork.status}
      clientPackageBusy={clientExport.busy}
      clientPackageStatus={clientExport.status}
      acceptedStillCount={acceptedStillCount}
      proposal={proposal}
      handoff={handoff}
      onCsv={() => void millwork.exportSchedule("schedule-csv")}
      onPdf={() => void millwork.exportSchedule("schedule-pdf")}
      onClientPackage={() => {
        const stills = acceptedStillExportPayload(
          selectPackageAcceptedStillAssets(project, acceptedStillAssets),
        );
        void clientExport.exportClientPreview(
          project,
          latestRender,
          stills.provenance,
          stills.pngs,
        );
      }}
      onSelect={onSelect}
    />
  );
}
