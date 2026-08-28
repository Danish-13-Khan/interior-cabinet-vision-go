import type { InteriorProject } from "../../domain/interiorProject";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { MillworkScheduleActions } from "./millworkSchedule";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";

type PlanStageTitlebarProps = {
  project: InteriorProject;
  workspaceView: LivingRoomWorkspaceView;
  selectedCount: number;
  v2BuildMode?: boolean;
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
  exportBusy: boolean;
  exportStatus: string;
  millworkCount: number;
  millworkReady: boolean;
  exportBlocked: boolean;
  onExportScheduleCsv: () => void;
  onExportSchedulePdf: () => void;
  onExportCutlistCsv: () => void;
  onExportProductionPdf: () => void;
};

export function PlanStageTitlebar(props: PlanStageTitlebarProps) {
  return (
    <div className={`lr-plan-titlebar${props.workspaceView === "model" ? " is-model-presence" : ""}${props.v2BuildMode && props.workspaceView === "plan" ? " has-readability" : ""}`}>
      <strong>
        {props.workspaceView === "model"
          ? "3D model"
          : props.workspaceView === "render"
            ? "Render studio"
            : "2D plan"}
      </strong>
      <span>
        {props.workspaceView === "model"
          ? `${props.project.name} · staged concept`
          : `${props.project.name} · ${props.project.objects.length} furniture objects · ${props.project.openings.length} openings · ${props.selectedCount} selected`}
      </span>
      {props.v2BuildMode && props.workspaceView === "plan" ? (
        <PlanReadabilityToolbar settings={props.readability} onChange={props.onReadability} />
      ) : null}
      {props.workspaceView !== "model" ? (
        <small>
          {props.workspaceView === "plan" ? "Scale: Fit" : "Presentation Output"} · Units: {props.readability.unit}
        </small>
      ) : (
        <small>Dollhouse · Units: mm</small>
      )}
      {props.workspaceView !== "render" ? (
        <MillworkScheduleActions
          busy={props.exportBusy}
          status={props.exportStatus}
          disabled={props.exportBlocked}
          millworkCount={props.millworkCount}
          readyToExport={props.millworkReady}
          onExportScheduleCsv={props.onExportScheduleCsv}
          onExportSchedulePdf={props.onExportSchedulePdf}
          onExportCutlistCsv={props.onExportCutlistCsv}
          onExportProductionPdf={props.onExportProductionPdf}
        />
      ) : null}
    </div>
  );
}
