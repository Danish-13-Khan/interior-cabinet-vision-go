import { useEffect, useMemo, useRef } from "react";
import { selectWallsForRoom } from "../../domain/interiorProject";
import { LIVING_ROOM_CATALOG } from "../../domain/livingRoom";
import { PLAN_UNDERLAY_FILE_ACCEPT } from "../../domain/livingRoom/planUnderlayImport";
import {
  designUxShowsCatalogRail,
  designUxShowsToolRail,
  interiorsWorkflowCatalogView,
  isInteriorsDrawRoomTool,
} from "../../domain/desktopUx";
import { InteriorsToolRail } from "./InteriorsToolRail";
import { InteriorsWorkflowAreaPanel } from "./InteriorsWorkflowAreaPanel";
import { CatalogPlanSettingsSlot, SceneListSlot } from "./InspectorPlanSettingsSlot";
import type { LivingRoomPlanCatalogRailProps } from "./livingRoomPlanCatalogRailProps";
import { StudioPaneEdge } from "./StudioPaneEdge";

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
  const showCatalog = designUxShowsCatalogRail({
    area: props.workflowArea,
    toolRailVisible: props.toolRailVisible,
    presenting: props.presenting ?? false,
    drawRoomActive: drawRoom,
  }) && catalogView !== null;
  // Room tools hide the Build Room catalogue (it repeats the room manager and underlay
  // controls), so the same column holds only Room & plan settings. One <aside> for both
  // keeps the portal slot mounted when the tool changes.
  const showSettingsDock = !showCatalog && drawRoom && props.toolRailVisible && !props.presenting;
  const showRail = designUxShowsToolRail({
    area: props.workflowArea,
    toolRailVisible: props.toolRailVisible,
    presenting: props.presenting ?? false,
  });

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
      accept={PLAN_UNDERLAY_FILE_ACCEPT}
      hidden
      data-testid="lr-plan-underlay-input"
      onChange={(event) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = "";
        void props.onImportUnderlay(file);
      }}
    />
    {showCatalog || showSettingsDock ? (
      <aside
        className={`lr-catalog lr-studio-panel${showSettingsDock ? " is-plan-settings-dock" : ""}`}
        style={{ ["--studio-catalog-width" as string]: `${props.widthPx}px` }}
        data-workflow-area={props.workflowArea}
        data-testid={showSettingsDock ? "plan-settings-dock" : undefined}
      >
        <div className="lr-catalog-scroll">
        <CatalogPlanSettingsSlot />
        {showCatalog && catalogView ? <InteriorsWorkflowAreaPanel
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
          floorplanExtract={props.floorplanExtract}
          onRoomDimensions={props.onRoomDimensions}
          onAddPartitionWall={props.onAddPartitionWall}
          onActiveRoom={props.onActiveRoom}
          onRenameRoom={props.onRenameRoom}
          onDeleteRoom={props.onDeleteRoom}
          onMergeRooms={props.onMergeRooms}
          onRenderSettingsChange={props.onRenderSettingsChange}
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
        /> : null}
        </div>
        <SceneListSlot />
        {props.onPaneWidth ? (
          <StudioPaneEdge
            edge="end"
            width={props.widthPx}
            max={props.paneMax ?? props.widthPx}
            onWidth={props.onPaneWidth}
          />
        ) : null}
      </aside>
    ) : null}
  </>;
}
