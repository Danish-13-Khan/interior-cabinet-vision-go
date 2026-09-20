import type { InteriorObjectEntity } from "../../domain/interiorProject";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";
import { inspectPlanTarget, interiorsCabinetRunStageCommands, interiorsDrawRoomStageCommands } from "./planInspectTarget";
import { interiorsPresentStageCommands } from "./interiorsPresentStage";
import { LivingRoomPlanStage } from "./LivingRoomPlanStage";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";

export function LivingRoomPlanWorkspaceCanvas(props: LivingRoomPlanWorkspaceBodyProps & {
  activeObject: InteriorObjectEntity | null;
  clientPackageBlocked: boolean;
  onTransformPreviewChange: (preview: ModelTransformPreview | null) => void;
}) {
  const { workspace: w, project, build } = props;
  return (
    <LivingRoomPlanStage
      project={project} workspaceView={props.workspaceView} chromeTool={props.chromeTool} selectedIds={w.selectedIds} issues={props.issues}
      snapSizeMm={props.snapSizeMm} showGrid={props.showGrid} canUndo={w.canUndo} canRedo={w.canRedo}
      hasSelection={Boolean(props.activeObject)}
      latestRender={props.renderResults.latest} previousRender={props.renderResults.previous}
      onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize}
      onSelect={(objectId, additive) => inspectPlanTarget(props, { objectId, additive })}
      onClearSelection={() => inspectPlanTarget(props)}
      onSelectRoom={() => inspectPlanTarget(props, { inspectRoom: true })}
      onMove={w.onMove} onMovePreview={w.onMovePreview} onDragEnd={w.onDragEnd} onResize={w.onResize}
      activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
      activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={build.surfaceMaterialId}
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
    />
  );
}
