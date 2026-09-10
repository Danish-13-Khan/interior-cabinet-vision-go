import { useEffect, useMemo, useRef } from "react";
import { selectWallsForRoom } from "../../domain/interiorProject";
import { LIVING_ROOM_CATALOG } from "../../domain/livingRoom";
import {
  interiorsWorkflowCatalogView,
  interiorsWorkflowShowsToolRail,
  isInteriorsDrawRoomTool,
} from "../../domain/desktopUx";
import { InteriorsToolRail } from "./InteriorsToolRail";
import { InteriorsWorkflowAreaPanel } from "./InteriorsWorkflowAreaPanel";
import type { LivingRoomPlanCatalogRailProps } from "./livingRoomPlanCatalogRailProps";

export function LivingRoomPlanCatalogRail(props: LivingRoomPlanCatalogRailProps) {
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const catalogView = interiorsWorkflowCatalogView({
    area: props.workflowArea,
    chromeTool: props.chromeTool,
  });
  const visibleAssets = useMemo(() => {
    const query = props.assetQuery.trim().toLowerCase();
    return LIVING_ROOM_CATALOG.filter((item) =>
      item.kind === "cabinet" &&
      (props.assetCategory === "all" || item.category === props.assetCategory) &&
      (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)),
    );
  }, [props.assetCategory, props.assetQuery]);
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId) ?? null;
  const roomWalls = selectWallsForRoom(props.project, props.project.activeRoomId);
  const activeWall = roomWalls.find((wall) => wall.id === props.activeWallId) ?? roomWalls[0] ?? props.project.walls[0] ?? null;
  const activeOpening = props.project.openings.find((opening) => opening.id === props.activeOpeningId) ?? null;
  const selectedCabinetCount = props.project.objects.filter((object) =>
    props.selectedIds.includes(object.id) && object.kind === "cabinet",
  ).length;
  const drawRoom = props.workflowArea === "room" && isInteriorsDrawRoomTool(props.chromeTool);
  const showRail = props.toolRailVisible && interiorsWorkflowShowsToolRail(props.workflowArea) && !props.presenting;

  useEffect(() => {
    props.onRegisterUnderlayPicker?.(() => underlayInputRef.current?.click());
  }, [props.onRegisterUnderlayPicker]);

  return <>
    {showRail ? (
      <InteriorsToolRail workflowArea={props.workflowArea} activeTool={props.chromeTool} onTool={props.onChromeTool} />
    ) : null}
    <input
      ref={underlayInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
      hidden
      onChange={(event) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        void props.onImportUnderlay(file);
      }}
    />
    {props.toolRailVisible && catalogView && !drawRoom && !props.presenting ? (
      <aside className="lr-catalog lr-studio-panel" style={{ width: props.widthPx }} data-workflow-area={props.workflowArea}>
        <InteriorsWorkflowAreaPanel
          view={catalogView}
          project={props.project}
          roomName={props.roomName}
          tool={props.activeBuildTool ?? "select"}
          activeWall={activeWall}
          activeOpening={activeOpening}
          activeSurfaceId={props.activeSurfaceId ?? null}
          surfaceMaterialId={props.surfaceMaterialId}
          roomDimensions={room?.dimensions ?? { widthMm: 6200, depthMm: 4600, heightMm: 2800 }}
          underlay={props.underlay}
          importError={props.importError}
          openingCatalogItemId={props.openingCatalogItemId}
          roomPolygonPointCount={props.roomPolygonPointCount}
          visibleAssets={visibleAssets}
          assetQuery={props.assetQuery}
          assetCategory={props.assetCategory}
          assetCategories={props.assetCategories}
          selectedIds={props.selectedIds}
          selectedCabinetCount={selectedCabinetCount}
          chromeTool={props.chromeTool}
          issues={props.issues}
          proposal={props.proposal}
          underlayInputRef={underlayInputRef}
          onRoomDimensions={props.onRoomDimensions}
          onAddPartitionWall={props.onAddPartitionWall}
          onActiveRoom={props.onActiveRoom}
          onRenameRoom={props.onRenameRoom}
          onDeleteRoom={props.onDeleteRoom}
          onMergeRooms={props.onMergeRooms}
          onActiveWall={props.onActiveWall}
          onActiveOpening={props.onActiveOpening}
          onAddOpening={props.onAddOpening}
          onUpdateOpening={props.onUpdateOpening}
          onDeleteOpening={props.onDeleteOpening}
          onOpeningCatalogItem={props.onOpeningCatalogItem}
          onCloseRoomPolygon={props.onCloseRoomPolygon}
          onCloseSurfacePolygon={props.onCloseSurfacePolygon}
          onSurfaceMaterialId={props.onSurfaceMaterialId}
          onUpdateSurface={props.onUpdateSurface}
          onDeleteSurface={props.onDeleteSurface}
          onSplitWall={props.onSplitWall}
          onDeleteWall={props.onDeleteWall}
          onUpdateWallThickness={props.onUpdateWallThickness}
          onJoinCoincidentNodes={props.onJoinCoincidentNodes}
          onSetPlanUnderlay={props.onSetPlanUnderlay}
          onImportUnderlay={props.onImportUnderlay}
          onCalibrateUnderlay={props.onCalibrateUnderlay}
          onToggleSiteMeasure={props.onToggleSiteMeasure}
          onAssetQuery={props.onAssetQuery}
          onAssetCategory={props.onAssetCategory}
          onAddCatalogObject={props.onAddCatalogObject}
          onCreateCabinetRun={props.onCreateCabinetRun}
          onAddImportedAsset={props.onAddImportedAsset}
          onSetFloorMaterial={props.onSetFloorMaterial}
          onSetCeilingMaterial={props.onSetCeilingMaterial}
          onSetWallMaterial={props.onSetWallMaterial}
          onApplyMaterialToSelection={props.onApplyMaterialToSelection}
          onApplyMaterialColour={props.onApplyMaterialColour}
          onImportFinish={props.onImportFinish}
          onSelect={props.onSelect}
          onSelectIssue={props.onSelectIssue}
          onPresent={props.onPresent}
        />
      </aside>
    ) : null}
  </>;
}
