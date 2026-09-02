import { hasInteriorsInspectorSelection } from "../../domain/desktopUx";
import { LivingRoomInspectorPanel } from "./LivingRoomInspectorPanel";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { InteriorObjectEntity } from "../../domain/interiorProject";

export function LivingRoomPlanWorkspaceInspector(props: {
  body: LivingRoomPlanWorkspaceBodyProps;
  activeObject: InteriorObjectEntity | null;
}) {
  const { body: p, activeObject } = props;
  const w = p.workspace;
  if (
    !w.inspectorVisible ||
    p.workspaceView === "render" ||
    !hasInteriorsInspectorSelection({
      objectSelected: Boolean(activeObject),
      openingSelected: Boolean(p.activeOpening),
      wallSelected: Boolean(p.activeWallId),
    })
  ) {
    return null;
  }
  return (
    <LivingRoomInspectorPanel mode={p.workspaceView === "model" ? "model" : "plan"} widthPx={w.inspectorWidthPx} project={p.project} room={p.room}
      activeObject={activeObject} activeOpening={p.activeOpening} selectedCount={w.selectedIds.length}
      issues={p.issues} millworkSchedule={p.millwork.schedule} millworkWorkflow={p.millwork.workflow}
      productionReport={p.millwork.productionReport} millworkExportedAt={p.millwork.exportedAt}
      onRoomDimensions={w.onRoomDimensions} onMove={w.onMove} onResize={w.onResize}
      onSetRotation={w.onSetRotation} onSetMaterial={w.onSetMaterial} onSetParameters={w.onSetParameters}
      onUpdateCabinetRun={w.onUpdateCabinetRun}
      onSelect={(objectId) => { p.setActiveOpeningId(null); p.setActiveSurfaceId(null); w.onSelect(objectId); }}
      onUpdateOpening={(openingId, patch) => p.build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
      activeWallId={p.activeWallId}
      onUpdateWall={(wallId, patch) => p.build.dispatchBuildCommand({ type: "updateWall", wallId, patch })}
      onRaiseWalls={w.onRaiseWalls} onOffsetWall={w.onOffsetWall} onOffsetLoop={w.onOffsetLoop}
      onSetWallPlan={w.onSetWallPlan} onImportFinish={w.onImportFinish} onSetFinishUv={w.onSetFinishUv}
      onSetWallMaterial={w.onSetWallMaterial} onSetFloorMaterial={w.onSetFloorMaterial}
      onSetCeilingMaterial={w.onSetCeilingMaterial} onDuplicate={w.onDuplicate} onDelete={w.onDelete}
      unit={p.readability.unit}
    />
  );
}
