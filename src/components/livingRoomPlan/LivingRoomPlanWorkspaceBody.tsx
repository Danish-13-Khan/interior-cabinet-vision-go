import {
  countResolvedPackageDeckViews,
  isClientPackageExportBlocked,
} from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { useEffect, useState } from "react";
import { usePlanUnderlayImport } from "../../hooks/usePlanUnderlayImport";
import { LivingRoomPlanPdfImportSlot } from "./LivingRoomPlanPdfImportSlot";
import { LivingRoomPlanWorkspaceCatalog } from "./LivingRoomPlanWorkspaceCatalog";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanStage } from "./LivingRoomPlanStage";
import { inspectPlanTarget, interiorsCabinetRunStageCommands, interiorsDrawRoomStageCommands } from "./planInspectTarget";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import { interiorsPresentStageCommands } from "./interiorsPresentStage";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";
import type { ModelTransformPreview } from "../livingRoomScene/ModelMoveGizmo";

export function LivingRoomPlanWorkspaceBody(props: LivingRoomPlanWorkspaceBodyProps) {
  const { workspace: w, project, room, build } = props;
  const activeObject = w.selectedObjects[0] ?? null;
  const readyToExport = props.millwork.workflow?.readyToExport ?? false;
  const acceptedStillCount = props.acceptedStillAssets.length;
  const clientPackageBlocked = isClientPackageExportBlocked(props.issues, readyToExport, {
    millworkCount: props.millwork.workflow?.millworkCount ?? 0,
    packageDeckCount: countResolvedPackageDeckViews(project),
    acceptedStillCount,
    geometryFallbackIds: activeRoomGeometryFallbackIds(project),
  });
  const [modelTransformPreview, setModelTransformPreview] = useState<ModelTransformPreview | null>(null);
  const underlayImport = usePlanUnderlayImport({
    roomWidthMm: room?.dimensions.widthMm ?? 6200,
    onSetPlanUnderlay: w.onSetPlanUnderlay,
    onImportError: props.onImportError,
    onImported: () => {
      props.onStudioPanel("build");
      build.dispatchBuildCommand({ type: "commitDraft" });
    },
  });
  useEffect(() => {
    if (props.workspaceView !== "model") setModelTransformPreview(null);
  }, [props.workspaceView]);

  return (
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanWorkspaceCatalog body={props} onImportUnderlay={underlayImport.importUnderlay} />
      ) : null}
      {props.plannerMode === "render" ? (
        <InteriorsPresentPanel
          proposal={props.proposal}
          handoff={props.handoff}
          onCapture={() => props.onWorkspaceView("render")}
          onReturnToReview={props.onReturnToReview}
        />
      ) : null}
      <LivingRoomPlanStage
        project={project} workspaceView={props.workspaceView} chromeTool={props.chromeTool} selectedIds={w.selectedIds} issues={props.issues}
        snapSizeMm={props.snapSizeMm} showGrid={props.showGrid} canUndo={w.canUndo} canRedo={w.canRedo}
        hasSelection={Boolean(activeObject)}
        latestRender={props.renderResults.latest} previousRender={props.renderResults.previous}
        onShowGrid={props.onShowGrid} onSnapSize={props.onSnapSize}
        onSelect={(objectId, additive) => inspectPlanTarget(props, { objectId, additive })}
        onClearSelection={() => inspectPlanTarget(props)}
        onSelectRoom={() => inspectPlanTarget(props, { inspectRoom: true })}
        onMove={w.onMove} onMovePreview={w.onMovePreview} onDragEnd={w.onDragEnd} onResize={w.onResize}         activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
        activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={build.surfaceMaterialId}
        onSelectWall={(wallId) => inspectPlanTarget(props, { wallId })}
        onSelectOpening={(openingId) => inspectPlanTarget(props, { openingId })}
        onSelectSurface={(surfaceId) => inspectPlanTarget(props, { surfaceId })}
        onMoveOpening={(openingId, offsetMm) => build.dispatchBuildCommand({ type: "moveOpening", openingId, offsetMm })}
        onResizeOpening={(openingId, widthMm, offsetMm) => build.dispatchBuildCommand({ type: "resizeOpening", openingId, widthMm, offsetMm })}
        onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
        onTransformPreviewChange={setModelTransformPreview}
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
        clientPackageBlocked={clientPackageBlocked}
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
      <LivingRoomPlanWorkspaceInspector body={props} activeObject={activeObject} transformPreview={modelTransformPreview} />
      <LivingRoomPlanPdfImportSlot
        file={underlayImport.pdfImportFile}
        roomWidthMm={room?.dimensions.widthMm ?? 6200}
        onCancel={() => underlayImport.setPdfImportFile(null)}
        onConfirm={(underlay) => {
          underlayImport.setPdfImportFile(null);
          w.onSetPlanUnderlay(underlay);
          props.onStudioPanel("build");
          build.dispatchBuildCommand({ type: "commitDraft" });
        }}
        onError={(message) => { underlayImport.setPdfImportFile(null); props.onImportError(message); }}
      />
    </div>
  );
}
