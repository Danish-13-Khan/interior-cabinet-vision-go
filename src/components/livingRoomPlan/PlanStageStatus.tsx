import { InteriorsCabinetRunStatus } from "./InteriorsCabinetRunStatus";
import { InteriorsDrawRoomStatus } from "./InteriorsDrawRoomStatus";
import { InteriorsPresentStatus } from "./InteriorsPresentStatus";
import { planStageCabinetRun, planStageDrawRoom, planStagePresent } from "./PlanStageAuthoringChrome";
import type { LivingRoomPlanStageProps } from "./planStageProps";

export function PlanStageStatus(props: LivingRoomPlanStageProps) {
  if (planStagePresent(props) && props.presentCommands) {
    const commands = props.presentCommands;
    return (
      <InteriorsPresentStatus
        sellTotalLabel={commands.sellTotalLabel} revision={commands.revision} frozen={commands.frozen}
        step={commands.step} blockingCount={commands.blockingCount}
      />
    );
  }
  if (planStageDrawRoom(props)) {
    return (
      <InteriorsDrawRoomStatus
        project={props.project} issues={props.issues} unit={props.readability.unit} onSelect={props.onSelect}
      />
    );
  }
  if (planStageCabinetRun(props)) {
    return (
      <InteriorsCabinetRunStatus
        project={props.project} issues={props.issues} selectedIds={props.selectedIds}
        snapSizeMm={props.snapSizeMm} onSelect={props.onSelect}
      />
    );
  }
  return (
    <footer className="lr-plan-status">
      <span>{props.workspaceView === "render" ? "PNG output" : `Snap ${props.snapSizeMm} mm`}</span>
      <span>{props.workspaceView === "plan" ? "Ortho on" : props.workspaceView === "model" ? "Dollhouse ready" : "ACES / sRGB"}</span>
      <span>{props.workspaceView === "render" ? `${props.project.renderSettings.widthPx}×${props.project.renderSettings.heightPx}` : `Grid ${props.showGrid ? "on" : "off"}`}</span>
      {props.v2BuildMode ? <span>mm · Zoom fit</span> : null}
      {props.v2ReviewMode ? <span>Shared 2D / 3D document</span> : null}
      <span className={props.issues.length ? "has-warning" : ""}>
        {props.issues.length ? `${props.issues.length} planning issues` : "Layout checks clear"}
      </span>
    </footer>
  );
}
