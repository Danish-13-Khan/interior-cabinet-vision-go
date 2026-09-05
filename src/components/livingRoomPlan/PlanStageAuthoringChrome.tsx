import { isInteriorsCabinetRunTool, isInteriorsDrawRoomTool } from "../../domain/desktopUx";
import { InteriorsCabinetRunChrome } from "./InteriorsCabinetRunChrome";
import { InteriorsDrawRoomChrome } from "./InteriorsDrawRoomChrome";
import { InteriorsPresentChrome } from "./InteriorsPresentChrome";
import type { LivingRoomPlanStageProps } from "./planStageProps";
import { PlanStageTitlebar } from "./PlanStageTitlebar";
import { PlanStageToolbar } from "./PlanStageToolbar";

export function planStageDrawRoom(props: LivingRoomPlanStageProps) {
  return Boolean(props.chromeTool && isInteriorsDrawRoomTool(props.chromeTool) && props.workspaceView === "plan");
}

export function planStageCabinetRun(props: LivingRoomPlanStageProps) {
  return Boolean(props.chromeTool && isInteriorsCabinetRunTool(props.chromeTool) && props.workspaceView === "plan");
}

export function planStagePresent(props: LivingRoomPlanStageProps) {
  return Boolean(props.presenting);
}

export function PlanStageAuthoringChrome(props: LivingRoomPlanStageProps) {
  if (props.presenting && props.presentCommands) {
    return (
      <InteriorsPresentChrome
        readability={props.readability} commands={props.presentCommands}
        onReadability={props.onReadability}
      />
    );
  }
  if (planStageDrawRoom(props) && props.chromeTool && props.drawCommands) {
    return (
      <InteriorsDrawRoomChrome
        tool={props.chromeTool} project={props.project} onPatchDocument={props.onPatchDocument!} activeBuildTool={props.activeBuildTool}
        activeWallId={props.activeWallId} openingCatalogItemId={props.openingCatalogItemId}
        roomPolygonPointCount={props.roomPolygonPointCount ?? 0} showGrid={props.showGrid}
        snapSizeMm={props.snapSizeMm} readability={props.readability} commands={props.drawCommands}
        onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize} onReadability={props.onReadability}
        onOpeningCatalogItem={props.onOpeningCatalogItem} onCloseRoomPolygon={props.onCloseRoomPolygon}
        onCommitOpening={props.onCommitOpening}
        onFitPlan={props.onFitPlan} onFitSelection={props.onFitSelection}
        hasSelection={props.hasSelection}
      />
    );
  }
  if (planStageCabinetRun(props) && props.chromeTool && props.cabinetRunCommands) {
    return (
      <InteriorsCabinetRunChrome
        tool={props.chromeTool} showGrid={props.showGrid} snapSizeMm={props.snapSizeMm}
        readability={props.readability} commands={props.cabinetRunCommands}
        project={props.project} onPatchDocument={props.onPatchDocument!}
        onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize} onReadability={props.onReadability}
      />
    );
  }
  return (
    <>
      {props.workspaceView === "plan" ? (
        <PlanStageToolbar canUndo={props.canUndo} canRedo={props.canRedo} hasSelection={props.hasSelection}
          selectedCount={props.selectedIds.length} showGrid={props.showGrid} snapSizeMm={props.snapSizeMm}
          readability={props.readability} onUndo={props.onUndo} onRedo={props.onRedo} onDuplicate={props.onDuplicate}
          onDelete={props.onDelete} onRotate={props.onRotateSelection} onAlign={props.onAlign}
          onCreateRun={props.onCreateCabinetRun} onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize}
          onReadability={props.onReadability}
          onFitPlan={props.onFitPlan} onFitSelection={props.onFitSelection} />
      ) : null}
      <PlanStageTitlebar
        project={props.project} workspaceView={props.workspaceView} selectedCount={props.selectedIds.length}
        v2BuildMode={props.v2BuildMode} readability={props.readability} onReadability={props.onReadability}
        onPatchDocument={props.onPatchDocument}
      />
    </>
  );
}
