import type { InteriorProject } from "../../domain/interiorProject";
import { interiorsStageTitle } from "../../domain/desktopUx";
import type { PlanReadabilitySettings } from "../../domain/livingRoom";
import type { LivingRoomWorkspaceView } from "./workspaceProps";
import { PlanOnDemandChrome } from "./PlanOnDemandChrome";
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
  const meta = props.workspaceView === "model"
    ? `${props.project.name} · staged concept`
    : `${props.project.name} · ${props.project.objects.length} objects · ${props.selectedCount} selected`;
  return (
    <div className={`lr-plan-titlebar${props.workspaceView === "model" ? " is-model-presence" : ""}${props.v2BuildMode && props.workspaceView === "plan" ? " has-readability" : ""}`}>
      <p className="lr-plan-title-copy">
        <strong>{title}</strong>
        <span className="lr-plan-title-sep" aria-hidden>·</span>
        <span className="lr-plan-title-hint">{meta}</span>
      </p>
      <div className="lr-plan-title-actions">
        {props.workspaceView === "plan" && (props.v2BuildMode || props.onPatchDocument) ? (
          <PlanOnDemandChrome
            layers={props.v2BuildMode
              ? <PlanReadabilityToolbar settings={props.readability} onChange={props.onReadability} />
              : null}
            exportPanel={props.onPatchDocument
              ? <PlanPrintExportControls project={props.project} onPatchDocument={props.onPatchDocument} />
              : null}
          />
        ) : null}
        <span className="lr-plan-units">
          {props.workspaceView === "model"
            ? "Dollhouse · Units: mm"
            : `${props.workspaceView === "plan" ? "Scale: Fit" : "Client view"} · Units: ${props.readability.unit}`}
        </span>
      </div>
    </div>
  );
}
