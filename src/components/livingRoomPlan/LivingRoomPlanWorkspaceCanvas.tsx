import { memo, useRef } from "react";
import type { InteriorObjectEntity } from "../../domain/interiorProject";
import { wallLengthMm } from "../../domain/livingRoom";
import { cutOpeningOffsetMm } from "../../domain/livingRoom/cutOpening";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { inspectPlanTarget, interiorsCabinetRunStageCommands, interiorsDrawRoomStageCommands } from "./planInspectTarget";
import { interiorsPresentStageCommands } from "./interiorsPresentStage";
import { LivingRoomPlanStage } from "./LivingRoomPlanStage";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import { useViewportCovered } from "../../hooks/useViewportCovered";

type WorkspaceCanvasProps = LivingRoomPlanWorkspaceBodyProps & {
  activeObject: InteriorObjectEntity | null;
  clientPackageBlocked: boolean;
  onTransformPreviewChange: (preview: ModelTransformPreview | null) => void;
};

/**
 * While a modal dialog covers the workspace, keep handing the stage the props
 * it last drew with, so edits made in the dialog do not re-render the hidden
 * plan or 3D scene. The stage catches up once when the dialog closes.
 */
export function LivingRoomPlanWorkspaceCanvas(props: WorkspaceCanvasProps) {
  const covered = useViewportCovered();
  const held = useRef(props);
  if (!covered) held.current = props;
  return <WorkspaceCanvasStage {...held.current} />;
}

const WorkspaceCanvasStage = memo(function WorkspaceCanvasStage(props: WorkspaceCanvasProps) {
  const { workspace: w, project, build } = props;
  return (
    <LivingRoomPlanStage
      project={project} workspaceView={props.workspaceView} chromeTool={props.chromeTool} workflowArea={props.workflowArea} selectedIds={w.selectedIds} issues={props.issues}
      snapSizeMm={props.snapSizeMm} showGrid={props.showGrid} canUndo={w.canUndo} canRedo={w.canRedo}
      hasSelection={Boolean(props.activeObject)}
      latestRender={props.renderResults.latest} previousRender={props.renderResults.previous}
      onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize} snapEnabled={props.snapEnabled} onSnapEnabled={props.onSnapEnabled}
      onSelect={(objectId, additive) => inspectPlanTarget(props, { objectId, additive })}
      onClearSelection={() => inspectPlanTarget(props)}
      onSelectRoom={() => inspectPlanTarget(props, { inspectRoom: true })}
      onMove={w.onMove} onMovePreview={w.onMovePreview} onDragEnd={w.onDragEnd} onResize={w.onResize}
      activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
      activeSurfaceId={props.activeSurfaceId} activeLightId={props.activeLightId}
      surfaceMaterialId={build.surfaceMaterialId}
      onSelectLight={(lightId) => inspectPlanTarget(props, { lightId })}
      lightActions={w.lightActions}
      onSelectWall={(wallId) => inspectPlanTarget(props, { wallId })}
      onSelectOpening={(openingId) => inspectPlanTarget(props, { openingId })}
      onSelectSurface={(surfaceId) => inspectPlanTarget(props, { surfaceId })}
      onMoveOpening={(openingId, offsetMm) => build.dispatchBuildCommand({ type: "moveOpening", openingId, offsetMm })}
      onResizeOpening={(openingId, widthMm, offsetMm) => build.dispatchBuildCommand({ type: "resizeOpening", openingId, widthMm, offsetMm })}
      onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
      onTransformPreviewChange={props.onTransformPreviewChange}
      onMoveNode={(nodeId, position) => build.dispatchBuildCommand({ type: "moveNode", nodeId, position })}
      onTranslateWall={(wallId, delta) => build.dispatchBuildCommand({ type: "moveWall", wallId, delta })}
      activeBuildTool={props.activeBuildTool} openingCatalogItemId={build.openingCatalogItemId}
      roomPolygonPointCount={props.roomPolygonPointCount} onOpeningCatalogItem={build.setOpeningCatalogItemId}
      onCloseRoomPolygon={props.onRoomPolygonCloseRequest}
      onCommitOpening={(wallId, kind) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, catalogItemId: build.openingCatalogItemId })}
      onPlaceOpening={(wallId, kind, offsetMm) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, offsetMm, catalogItemId: build.openingCatalogItemId })}
      onCreateRoom={(drawing) => build.dispatchBuildCommand({ type: "createRoom", drawing })}
      onDrawSurface={(drawing, materialId) => build.dispatchBuildCommand({ type: "createSurface", drawing, materialId })}
      onDrawCeilingCutout={(drawing) => build.dispatchBuildCommand({ type: "createCeilingCutout", drawing })}
      onDrawWallSegment={(start, end, wallKind) => build.dispatchBuildCommand({ type: "createWallSegment", start, end, wallKind })}
      onPlaceColumn={(position) => build.dispatchBuildCommand({ type: "placeColumn", position })}
      roomPolygonCloseRequest={props.roomPolygonCloseRequest} onRoomPolygonPointCount={props.onRoomPolygonPointCount}
      onSetRotation={w.onSetRotation} onSetParameters={w.onSetParameters} onApplyStyle={w.onApplyStyle}
      onUndo={w.onUndo} onRedo={w.onRedo} onDuplicate={w.onDuplicate} onDelete={w.onDelete}
      onRotateSelection={w.onRotateSelection} onAlign={w.onAlign}
      onCreateCabinetRun={() => props.activeWallId && w.onCreateCabinetRun(props.activeWallId)}
      onRenderSettingsChange={w.onRenderSettingsChange} onLightingChange={w.onLightingChange}
      onRenderBrowserThumbnail={w.onRenderBrowserThumbnail}
      onRendered={props.onRenderResults}
      acceptedStillAssets={props.acceptedStillAssets}
      onAcceptedStillAssetsChange={props.onAcceptedStillAssetsChange}
      clientExport={props.clientExport}
      clientPackageBlocked={props.clientPackageBlocked}
      v2BuildMode={props.plannerMode === "build"} v2ReviewMode={props.workspaceView === "model"}
      readability={props.readability} onReadability={props.onReadability}
      drawCommands={interiorsDrawRoomStageCommands(props)}
      cabinetRunCommands={interiorsCabinetRunStageCommands(props)}
      presentCommands={interiorsPresentStageCommands(props)}
      presenting={props.plannerMode === "render"}
      onSelectMany={props.workspace.onSelectMany}
      onSetWallLength={(wallId, lengthMm, anchor) => props.workspace.onSetWallPlan(wallId, { lengthMm, lengthAnchor: anchor })}
      onSetCabinetInlineDims={props.workspace.onSetCabinetInlineDims}
      preDropReason={props.workspace.preDropReason}
      onRegisterViewControls={props.onRegisterViewControls}
      onFitPlan={props.onFitPlan}
      onFitSelection={props.onFitSelection}
      onZoomIn={props.onZoomIn}
      onZoomOut={props.onZoomOut}
      onSetPlanUnderlay={w.onSetPlanUnderlay}
      onCalibrateComplete={() => props.onBuildTool("select")}
      onPatchDocument={w.onPatchDocument}
      onChromeTool={props.onChromeTool}
      onBuildTool={props.onBuildTool}
      onWorkspaceView={props.onWorkspaceView}
      onAddWallPanel={w.onAddWallPanel}
      onCutOpening={(wallId) => {
        const wall = project.walls.find((item) => item.id === wallId);
        if (!wall) return;
        build.dispatchBuildCommand({
          type: "placeOpening", wallId, kind: "opening", offsetMm: cutOpeningOffsetMm(wallLengthMm(wall)),
        });
      }}
    />
  );
});
