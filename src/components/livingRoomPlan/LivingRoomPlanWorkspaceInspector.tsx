import { hasInteriorsInspectorSelection, isInteriorsCabinetRunTool, isInteriorsDrawRoomTool } from "../../domain/desktopUx";
import { LivingRoomInspectorPanel } from "./LivingRoomInspectorPanel";
import { StudioPaneEdge } from "./StudioPaneEdge";
import { STUDIO_INSPECTOR_MIN } from "./useStudioPanes";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { isWallCabinetObject } from "../../domain/livingRoom/cabinetSceneMount";
import { resolveLightAttachment } from "../../domain/livingRoom/lightAttachments";
import { inspectPlanTarget } from "./planInspectTarget";

export function LivingRoomPlanWorkspaceInspector(props: {
  body: LivingRoomPlanWorkspaceBodyProps;
  activeObject: InteriorObjectEntity | null;
  transformPreview: ModelTransformPreview | null;
  widthPx?: number;
  maximized?: boolean;
  paneMax?: number;
  onPaneWidth?: (widthPx: number) => void;
  onPaneMaximize?: () => void;
}) {
  const { body: p, transformPreview } = props;
  const activeObject = props.activeObject && transformPreview?.kind === "object" && transformPreview.id === props.activeObject.id
    ? {
        ...props.activeObject,
        position: transformPreview.positionMm,
        parameters: isWallCabinetObject(props.activeObject)
          ? { ...props.activeObject.parameters, mountHeightMm: transformPreview.positionMm.y }
          : props.activeObject.parameters,
      }
    : props.activeObject;
  const openingPositionOverride = p.activeOpening && transformPreview?.kind === "opening" && transformPreview.id === p.activeOpening.id
    ? transformPreview.positionMm
    : null;
  const w = p.workspace;
  const widthPx = props.widthPx ?? w.inspectorWidthPx;
  const activeSurface = p.project.surfaces.find((surface) => surface.id === p.activeSurfaceId) ?? null;
  const emptyRoomEssentials =
    p.workflowArea === "room" &&
    Boolean(p.room) &&
    !activeObject &&
    !p.activeOpening &&
    !p.activeWallId &&
    !activeSurface &&
    !p.activeLightId;
  const reviewEssentials = p.workflowArea === "review" && Boolean(p.room);
  if (
    !w.inspectorVisible ||
    p.workspaceView === "render" ||
    p.plannerMode === "render" ||
    !hasInteriorsInspectorSelection({
      objectSelected: Boolean(activeObject),
      openingSelected: Boolean(p.activeOpening),
      wallSelected: Boolean(p.activeWallId),
      surfaceSelected: Boolean(activeSurface),
      lightSelected: Boolean(p.activeLightId),
      roomSelected: Boolean(p.inspectRoom && p.room) || emptyRoomEssentials || reviewEssentials,
    })
  ) {
    return null;
  }
  return (
    <LivingRoomInspectorPanel mode={p.workspaceView === "model" ? "model" : "plan"} widthPx={widthPx}
      maximized={props.maximized} paneEdge={props.onPaneWidth && props.onPaneMaximize ? (
        <StudioPaneEdge edge="start" width={widthPx} min={STUDIO_INSPECTOR_MIN} max={props.paneMax ?? widthPx} maximized={props.maximized === true} onWidth={props.onPaneWidth} onMaximize={props.onPaneMaximize} />
      ) : null} project={p.project} room={p.room} drawRoom={isInteriorsDrawRoomTool(p.chromeTool)}
      cabinetRun={isInteriorsCabinetRunTool(p.chromeTool)}
      runToolActive={p.chromeTool === "run"}
      workflowArea={p.workflowArea}
      inspectRoom={p.inspectRoom || emptyRoomEssentials || reviewEssentials} activeObject={activeObject} activeOpening={p.activeOpening}
      openingPositionOverride={openingPositionOverride} snapSizeMm={p.snapSizeMm} activeSurface={activeSurface}
      selectedCount={w.selectedIds.length}
      issues={p.issues}
      onRoomDimensions={w.onRoomDimensions} onSetFloorBuild={w.onSetFloorBuild} onMove={w.onMove} onResize={w.onResize}
      onSetRotation={w.onSetRotation} onSetMaterial={w.onSetMaterial} onSetParameters={w.onSetParameters}
      onUpdateCabinetRun={w.onUpdateCabinetRun}
      onCompleteCabinetRun={w.onCompleteCabinetRun}
      onSelect={(objectId, additive) => { p.setActiveOpeningId(null); p.setActiveSurfaceId(null); p.setActiveLightId(null); w.onSelect(objectId, additive); }}
      activeLight={(() => {
        const light = p.project.lights.find((item) => item.id === p.activeLightId) ?? null;
        return light ? resolveLightAttachment(p.project, light) : null;
      })()}
      lightActions={w.lightActions}
      onSelectLight={(lightId) => inspectPlanTarget(p, { lightId })}
      onRemovedLight={() => p.setActiveLightId(null)}
      onUpdateOpening={(openingId, patch) => p.build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
      onDeleteOpening={(openingId) => { p.build.dispatchBuildCommand({ type: "deleteOpening", openingId }); p.setActiveOpeningId(null); }}
      onUpdateSurface={(surfaceId, materialId) => p.build.dispatchBuildCommand({ type: "updateSurface", surfaceId, materialId })}
      onDeleteSurface={(surfaceId) => { p.build.dispatchBuildCommand({ type: "deleteSurface", surfaceId }); p.setActiveSurfaceId(null); }}
      activeWallId={p.activeWallId}
      onUpdateWall={(wallId, patch) => p.build.dispatchBuildCommand({ type: "updateWall", wallId, patch })}
      onSplitWall={(wallId) => p.build.dispatchBuildCommand({ type: "splitWall", wallId })}
      onDeleteWall={(wallId) => {
        p.build.dispatchBuildCommand({ type: "deleteWall", wallId });
        p.setActiveWallId((current) => (current === wallId ? p.project.walls.find((wall) => wall.id !== wallId)?.id ?? null : current));
      }}
      onJoinNodes={() => p.build.dispatchBuildCommand({ type: "joinCoincidentNodes" })}
      onAddWallPanel={w.onAddWallPanel}
      wallEditing={{
        onAddOpening: (wallId, kind, offset) => p.build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, offsetMm: offset }),
        onAddDecoration: w.onAddWallDecoration,
      }}
      onUpdatePanelAttachment={w.onUpdatePanelAttachment}
      onSetPanelVisible={w.onSetPanelVisible}
      onRaiseWalls={w.onRaiseWalls} onOffsetWall={w.onOffsetWall} onOffsetLoop={w.onOffsetLoop}
      onSetWallPlan={w.onSetWallPlan} onImportFinish={w.onImportFinish} onSetFinishUv={w.onSetFinishUv}
      onSetWallMaterial={w.onSetWallMaterial} onSetFloorMaterial={w.onSetFloorMaterial}
      onSetCeilingMaterial={w.onSetCeilingMaterial} onDuplicate={w.onDuplicate} onDelete={w.onDelete}
      unit={p.readability.unit}
    />
  );
}
