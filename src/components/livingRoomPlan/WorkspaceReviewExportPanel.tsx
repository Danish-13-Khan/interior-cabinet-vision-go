import {
  acceptedStillExportPayload,
  selectPackageAcceptedStillAssets,
} from "../../hooks/selectPackageAcceptedStillAssets";
import type { InteriorProject } from "../../domain/interiorProject";
import type { LivingRoomPlanIssue, LivingRoomRenderResult } from "../../domain/livingRoom";
import type { useClientPresentationExport } from "../../hooks/useClientPresentationExport";
import type { useMillworkSchedule } from "../../hooks/useMillworkSchedule";
import type { AcceptedStillAsset } from "../../hooks/selectPackageAcceptedStillAssets";
import { PlannerV2ReviewPanel } from "./PlannerV2ReviewPanel";

type Millwork = ReturnType<typeof useMillworkSchedule>;
type ClientExport = ReturnType<typeof useClientPresentationExport>;

/** Review-step export panel wired to shared millwork + client package controllers. */
export function WorkspaceReviewExportPanel({
  project,
  issues,
  millwork,
  clientExport,
  readyToExport,
  acceptedStillAssets,
  latestRender,
  onSelect,
}: {
  project: InteriorProject;
  issues: LivingRoomPlanIssue[];
  millwork: Millwork;
  clientExport: ClientExport;
  readyToExport: boolean;
  acceptedStillAssets: AcceptedStillAsset[];
  latestRender: LivingRoomRenderResult | null;
  onSelect: (objectId: string | null) => void;
}) {
  return (
    <PlannerV2ReviewPanel
      schedule={millwork.schedule}
      issues={issues}
      millworkBusy={millwork.busy}
      millworkStatus={millwork.status}
      clientPackageBusy={clientExport.busy}
      clientPackageStatus={clientExport.status}
      readyToExport={readyToExport}
      acceptedStillCount={selectPackageAcceptedStillAssets(project, acceptedStillAssets).length}
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
