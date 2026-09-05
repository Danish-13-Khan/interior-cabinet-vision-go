import type { InteriorProject } from "../../domain/interiorProject";
import { interiorsStageTitle } from "../../domain/desktopUx";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { PlanReadabilityToolbar } from "./PlanReadabilityToolbar";
import { PlanPrintExportControls } from "./PlanPrintExportControls";

type PlanStageTitlebarProps = {
  project: InteriorProject;
  workspaceView: LivingRoomWorkspaceView;
  selectedCount: number;
  v2BuildMode?: boolean;
  readability: PlanReadabilitySettings;
  onReadability: (patch: Partial<PlanReadabilitySettings>) => void;
  onPatchDocument?: (
    update: (current: InteriorProject) => InteriorProject,
    status: string,
  ) => void;
};

export function PlanStageTitlebar(props: PlanStageTitlebarProps) {
  const title = interiorsStageTitle(props.workspaceView);
  return (
    <div className={`lr-plan-titlebar${props.workspaceView === "model" ? " is-model-presence" : ""}${props.v2BuildMode && props.workspaceView === "plan" ? " has-readability" : ""}`}>
      <strong>{title}</strong>
      <span>
        {props.workspaceView === "model"
          ? `${props.project.name} · staged concept`
          : `${props.project.name} · ${props.project.objects.length} objects · ${props.selectedCount} selected`}
      </span>
      {props.v2BuildMode && props.workspaceView === "plan" ? (
        <PlanReadabilityToolbar settings={props.readability} onChange={props.onReadability} />
      ) : null}
      {props.workspaceView === "plan" && props.onPatchDocument ? (
        <PlanPrintExportControls project={props.project} onPatchDocument={props.onPatchDocument} />
      ) : null}
      {props.workspaceView !== "model" ? (
        <small>
          {props.workspaceView === "plan" ? "Scale: Fit" : "Client view"} · Units: {props.readability.unit}
        </small>
      ) : (
        <small>Dollhouse · Units: mm</small>
      )}
    </div>
  );
}
