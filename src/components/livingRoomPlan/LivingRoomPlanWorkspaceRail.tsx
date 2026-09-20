import { toggleSiteMeasureChecklistItem } from "../../domain/livingRoom";
import { inspectPlanTarget } from "./planInspectTarget";
import { LivingRoomPlanCatalogRail } from "./LivingRoomPlanCatalogRail";
import type { LivingRoomPlanWorkspaceBodyProps } from "./workspaceBodyProps";

export function LivingRoomPlanWorkspaceRail(props: LivingRoomPlanWorkspaceBodyProps & {
  onImportUnderlay: (file: File | null) => void | Promise<void>;
}) {
  const { workspace: w, project, room, build } = props;
  return (
    <LivingRoomPlanCatalogRail
      widthPx={w.toolRailWidthPx} toolRailVisible={w.toolRailVisible}
      workflowArea={props.workflowArea}
      studioPanel={props.studioPanel} onStudioPanel={props.onStudioPanel}
      chromeTool={props.chromeTool} onChromeTool={props.onChromeTool}
      project={project} roomName={room?.name ?? "No room"} selectedIds={w.selectedIds}
      issues={props.issues} proposal={props.proposal} onPresent={props.onPresent}
      assetQuery={props.assetQuery} assetCategory={props.assetCategory} assetCategories={props.assetCategories}
      underlay={props.underlay} importError={props.importError}
      onAssetQuery={props.onAssetQuery} onAssetCategory={props.onAssetCategory} onAddCatalogObject={w.onAddCatalogObject}
      onCreateCabinetRun={w.onCreateCabinetRun}
      onAddImportedAsset={w.onAddImportedAsset} onSetFloorMaterial={w.onSetFloorMaterial}
      onSetCeilingMaterial={w.onSetCeilingMaterial} onSetWallMaterial={w.onSetWallMaterial}
      onApplyMaterialToSelection={w.onApplyMaterialToSelection}
      onApplyMaterialColour={w.onApplyMaterialColour}
      onImportFinish={w.onImportFinish}
      onSetLayerVisibility={w.onSetLayerVisibility}
      onSelect={(objectId) => inspectPlanTarget(props, { objectId })}
      onSelectIssue={(objectId) => inspectPlanTarget(props, objectId ? { objectId } : {})}
      onSetPlanUnderlay={w.onSetPlanUnderlay}
      onCalibrateUnderlay={() => props.onBuildTool("calibrate-underlay")}
      onToggleSiteMeasure={(key, value) => {
        w.onPatchDocument(
          (current) => toggleSiteMeasureChecklistItem(current, key, value),
          "Updated site measure checklist.",
        );
      }}
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
      activeBuildTool={props.activeBuildTool}
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
      onImportUnderlay={props.onImportUnderlay}
    />
  );
}
