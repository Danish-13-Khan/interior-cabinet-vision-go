import { isClientPackageExportBlocked, countResolvedPackageDeckViews } from "../../domain/livingRoom";
import { activeRoomGeometryFallbackIds } from "../../domain/livingRoom/cabinetSceneFallbacks";
import { LivingRoomHomeFromWorkspace } from "./LivingRoomHomeFromWorkspace";
import { LivingRoomPlanCatalogRail } from "./LivingRoomPlanCatalogRail";
import { LivingRoomPlanWorkspaceInspector } from "./LivingRoomPlanWorkspaceInspector";
import { LivingRoomPlanStage } from "./LivingRoomPlanStage";
import { inspectPlanTarget, interiorsCabinetRunStageCommands, interiorsDrawRoomStageCommands } from "./planInspectTarget";
import { InteriorsPresentPanel } from "./InteriorsPresentPanel";
import { interiorsPresentStageCommands } from "./interiorsPresentStage";
import { imageFileToUnderlay } from "../../domain/livingRoom/planUnderlayImport";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";

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

  return (
    <div className={`lr-workspace-body is-${props.workspaceView} is-planner-${props.plannerMode}`}>
      <LivingRoomHomeFromWorkspace workspace={w} open={w.projectHomeOpen} hasCurrentProject />
      {props.workspaceView !== "render" || props.plannerMode === "render" ? (
        <LivingRoomPlanCatalogRail
          widthPx={w.toolRailWidthPx} toolRailVisible={w.toolRailVisible} studioPanel={props.studioPanel}
          onStudioPanel={props.onStudioPanel} chromeTool={props.chromeTool} onChromeTool={props.onChromeTool}
          project={project} roomName={room?.name ?? "No room"} selectedIds={w.selectedIds}
          assetQuery={props.assetQuery} assetCategory={props.assetCategory} assetCategories={props.assetCategories}
          underlay={props.underlay} importError={props.importError} onAssetQuery={props.onAssetQuery}
          onAssetCategory={props.onAssetCategory} onAddCatalogObject={w.onAddCatalogObject}
          onCreateCabinetRun={w.onCreateCabinetRun}
          onAddImportedAsset={w.onAddImportedAsset} onSetFloorMaterial={w.onSetFloorMaterial}
          onSetCeilingMaterial={w.onSetCeilingMaterial} onSetWallMaterial={w.onSetWallMaterial}
          onApplyMaterialToSelection={w.onApplyMaterialToSelection}
          onImportFinish={w.onImportFinish}
          onSetLayerVisibility={w.onSetLayerVisibility}
          onSelect={(objectId) => inspectPlanTarget(props, { objectId })}
          onSetPlanUnderlay={w.onSetPlanUnderlay}
          presenting={props.plannerMode === "render"}
          onRoomDimensions={(dimensions) => build.dispatchBuildCommand({ type: "resizeRoom", dimensions })}
          onActiveRoom={(roomId) => { w.onActiveRoom(roomId); inspectPlanTarget(props, { inspectRoom: true }); }}
          onRenameRoom={w.onRenameRoom}
          onDeleteRoom={w.onDeleteRoom}
          onMergeRooms={w.onMergeRooms}
          onAddPartitionWall={() => build.dispatchBuildCommand({ type: "createWall" })}
          activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
          onActiveWall={(wallId) => inspectPlanTarget(props, { wallId })}
          onActiveOpening={(openingId) => inspectPlanTarget(props, { openingId })}
          onAddOpening={(wallId, kind) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, catalogItemId: build.openingCatalogItemId })}
          onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
          onDeleteOpening={(openingId) => { build.dispatchBuildCommand({ type: "deleteOpening", openingId }); props.setActiveOpeningId(null); }}
          v2BuildMode={props.plannerMode === "build"} v2DesignMode={props.plannerMode === "design"}
          activeBuildTool={props.activeBuildTool} onBuildTool={props.onBuildTool}
          canUndo={w.canUndo} canRedo={w.canRedo} onUndo={w.onUndo} onRedo={w.onRedo}
          openingCatalogItemId={build.openingCatalogItemId} onOpeningCatalogItem={build.setOpeningCatalogItemId}
          roomPolygonPointCount={props.roomPolygonPointCount} onCloseRoomPolygon={props.onRoomPolygonCloseRequest}
          onSplitWall={(wallId) => build.dispatchBuildCommand({ type: "splitWall", wallId })}
          onDeleteWall={(wallId) => {
            build.dispatchBuildCommand({ type: "deleteWall", wallId });
            props.setActiveWallId((current) => (current === wallId ? project.walls.find((wall) => wall.id !== wallId)?.id ?? null : current));
          }}
          onUpdateWallThickness={(wallId, thicknessMm) => build.dispatchBuildCommand({ type: "updateWall", wallId, patch: { thicknessMm } })}
          onJoinCoincidentNodes={() => build.dispatchBuildCommand({ type: "joinCoincidentNodes" })}
          surfaceMaterialId={build.surfaceMaterialId}
          onSurfaceMaterialId={build.setSurfaceMaterialId}
          activeSurfaceId={props.activeSurfaceId}
          onCloseSurfacePolygon={props.onRoomPolygonCloseRequest}
          onUpdateSurface={(surfaceId, materialId) => build.dispatchBuildCommand({ type: "updateSurface", surfaceId, materialId })}
          onDeleteSurface={(surfaceId) => {
            build.dispatchBuildCommand({ type: "deleteSurface", surfaceId });
            props.setActiveSurfaceId((current) => (current === surfaceId ? null : current));
          }}
          onRegisterUnderlayPicker={(openPicker) => { props.underlayPickerRef.current = openPicker; }}
          onImportUnderlay={async (file) => {
            if (!file) return;
            props.onImportError("");
            try {
              w.onSetPlanUnderlay(await imageFileToUnderlay(file, room?.dimensions.widthMm ?? 6200));
              props.onStudioPanel("build");
              build.dispatchBuildCommand({ type: "commitDraft" });
            } catch (error) {
              props.onImportError(error instanceof Error ? error.message : "Plan import failed.");
            }
          }}
        />
      ) : null}
      {props.plannerMode === "render" ? (
        <InteriorsPresentPanel
          proposal={props.proposal}
          handoff={props.handoff}
          onCapture={() => props.onWorkspaceView("render")}
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
        onMove={w.onMove} onResize={w.onResize}         activeWallId={props.activeWallId} activeOpeningId={props.activeOpeningId}
        activeSurfaceId={props.activeSurfaceId} surfaceMaterialId={build.surfaceMaterialId}
        onSelectWall={(wallId) => inspectPlanTarget(props, { wallId })}
        onSelectOpening={(openingId) => inspectPlanTarget(props, { openingId })}
        onSelectSurface={(surfaceId) => inspectPlanTarget(props, { surfaceId })}
        onMoveOpening={(openingId, offsetMm) => build.dispatchBuildCommand({ type: "moveOpening", openingId, offsetMm })}
        onResizeOpening={(openingId, widthMm, offsetMm) => build.dispatchBuildCommand({ type: "resizeOpening", openingId, widthMm, offsetMm })}
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
      />
      <LivingRoomPlanWorkspaceInspector body={props} activeObject={activeObject} />
    </div>
  );
}
