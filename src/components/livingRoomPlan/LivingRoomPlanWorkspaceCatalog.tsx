import { toggleSiteMeasureChecklistItem } from "../../domain/livingRoom";
import { LivingRoomPlanCatalogRail } from "./LivingRoomPlanCatalogRail";
import { inspectPlanTarget } from "./planInspectTarget";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";

export function LivingRoomPlanWorkspaceCatalog({
  body,
  onImportUnderlay,
}: {
  body: LivingRoomPlanWorkspaceBodyProps;
  onImportUnderlay: (file: File | null) => void | Promise<void>;
}) {
  const { workspace: w, project, room, build } = body;
  return (
    <LivingRoomPlanCatalogRail
      widthPx={w.toolRailWidthPx} toolRailVisible={w.toolRailVisible}
      workflowArea={body.workflowArea}
      studioPanel={body.studioPanel} onStudioPanel={body.onStudioPanel}
      chromeTool={body.chromeTool} onChromeTool={body.onChromeTool}
      project={project} roomName={room?.name ?? "No room"} selectedIds={w.selectedIds}
      issues={body.issues} proposal={body.proposal} onPresent={body.onPresent}
      assetQuery={body.assetQuery} assetCategory={body.assetCategory} assetCategories={body.assetCategories}
      underlay={body.underlay} importError={body.importError}
      onAssetQuery={body.onAssetQuery} onAssetCategory={body.onAssetCategory} onAddCatalogObject={w.onAddCatalogObject}
      onCreateCabinetRun={w.onCreateCabinetRun}
      onAddImportedAsset={w.onAddImportedAsset} onSetFloorMaterial={w.onSetFloorMaterial}
      onSetCeilingMaterial={w.onSetCeilingMaterial} onSetWallMaterial={w.onSetWallMaterial}
      onApplyMaterialToSelection={w.onApplyMaterialToSelection}
      onApplyMaterialColour={w.onApplyMaterialColour}
      onImportFinish={w.onImportFinish}
      onSetLayerVisibility={w.onSetLayerVisibility}
      onSelect={(objectId) => inspectPlanTarget(body, { objectId })}
      onSelectIssue={(objectId) => inspectPlanTarget(body, objectId ? { objectId } : {})}
      onSetPlanUnderlay={w.onSetPlanUnderlay}
      onCalibrateUnderlay={() => body.onBuildTool("calibrate-underlay")}
      onToggleSiteMeasure={(key, value) => {
        w.onPatchDocument(
          (current) => toggleSiteMeasureChecklistItem(current, key, value),
          "Updated site measure checklist.",
        );
      }}
      presenting={body.plannerMode === "render"}
      onRoomDimensions={(dimensions) => build.dispatchBuildCommand({ type: "resizeRoom", dimensions })}
      onActiveRoom={(roomId) => { w.onActiveRoom(roomId); inspectPlanTarget(body, { inspectRoom: true }); }}
      onRenameRoom={w.onRenameRoom}
      onDeleteRoom={w.onDeleteRoom}
      onMergeRooms={w.onMergeRooms}
      onAddPartitionWall={() => build.dispatchBuildCommand({ type: "createWall" })}
      activeWallId={body.activeWallId} activeOpeningId={body.activeOpeningId}
      onActiveWall={(wallId) => inspectPlanTarget(body, { wallId })}
      onActiveOpening={(openingId) => inspectPlanTarget(body, { openingId })}
      onAddOpening={(wallId, kind) => build.dispatchBuildCommand({ type: "placeOpening", wallId, kind, catalogItemId: build.openingCatalogItemId })}
      onUpdateOpening={(openingId, patch) => build.dispatchBuildCommand({ type: "updateOpening", openingId, patch })}
      onDeleteOpening={(openingId) => { build.dispatchBuildCommand({ type: "deleteOpening", openingId }); body.setActiveOpeningId(null); }}
      activeBuildTool={body.activeBuildTool}
      openingCatalogItemId={build.openingCatalogItemId} onOpeningCatalogItem={build.setOpeningCatalogItemId}
      roomPolygonPointCount={body.roomPolygonPointCount} onCloseRoomPolygon={body.onRoomPolygonCloseRequest}
      onSplitWall={(wallId) => build.dispatchBuildCommand({ type: "splitWall", wallId })}
      onDeleteWall={(wallId) => {
        build.dispatchBuildCommand({ type: "deleteWall", wallId });
        body.setActiveWallId((current) => (current === wallId ? project.walls.find((wall) => wall.id !== wallId)?.id ?? null : current));
      }}
      onUpdateWallThickness={(wallId, thicknessMm) => build.dispatchBuildCommand({ type: "updateWall", wallId, patch: { thicknessMm } })}
      onJoinCoincidentNodes={() => build.dispatchBuildCommand({ type: "joinCoincidentNodes" })}
      surfaceMaterialId={build.surfaceMaterialId}
      onSurfaceMaterialId={build.setSurfaceMaterialId}
      activeSurfaceId={body.activeSurfaceId}
      onCloseSurfacePolygon={body.onRoomPolygonCloseRequest}
      onUpdateSurface={(surfaceId, materialId) => build.dispatchBuildCommand({ type: "updateSurface", surfaceId, materialId })}
      onDeleteSurface={(surfaceId) => {
        build.dispatchBuildCommand({ type: "deleteSurface", surfaceId });
        body.setActiveSurfaceId((current) => (current === surfaceId ? null : current));
      }}
      onRegisterUnderlayPicker={(openPicker) => { body.underlayPickerRef.current = openPicker; }}
      onImportUnderlay={onImportUnderlay}
    />
  );
}
