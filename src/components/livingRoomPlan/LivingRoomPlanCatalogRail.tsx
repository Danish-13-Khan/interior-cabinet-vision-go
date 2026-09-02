import { useEffect, useMemo, useRef } from "react";
import type { InteriorProject, OpeningEntity, Size3Mm } from "../../domain/interiorProject";
import { selectWallsForRoom } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import { LIVING_ROOM_CATALOG, isLivingRoomLayerVisible, type LivingRoomCatalogId, type ImportedAsset } from "../../domain/livingRoom";
import { isInteriorsCabinetRunTool, isInteriorsDrawRoomTool, type InteriorsChromeTool } from "../../domain/desktopUx";
import { InteriorsCabinetRunCatalog } from "./InteriorsCabinetRunCatalog";
import type { BuildTool, StudioPanel } from "./workspaceProps";
import { BuildRoomCatalogPanel } from "./BuildRoomCatalogPanel";
import { InteriorsToolRail } from "./InteriorsToolRail";
import { PlanAssetLibraryPanel } from "./PlanAssetLibraryPanel";
import { SurfacePaintPanel } from "./SurfacePaintPanel";

type LivingRoomPlanCatalogRailProps = {
  widthPx: number;
  toolRailVisible: boolean;
  studioPanel: StudioPanel;
  onStudioPanel: (panel: StudioPanel) => void;
  chromeTool: InteriorsChromeTool;
  onChromeTool: (tool: InteriorsChromeTool) => void;
  project: InteriorProject;
  roomName: string;
  selectedIds: string[];
  assetQuery: string;
  assetCategory: string;
  assetCategories: string[];
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  onAssetQuery: (value: string) => void;
  onAssetCategory: (value: string) => void;
  onAddCatalogObject: (catalogItemId: LivingRoomCatalogId, wallId?: string) => void;
  onCreateCabinetRun: (wallId: string) => void;
  onAddImportedAsset: (asset: ImportedAsset) => void;
  onSetFloorMaterial: (materialId: string) => void;
  onSetCeilingMaterial: (materialId: string) => void;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
  onApplyMaterialToSelection: (materialId: string, slotName?: string) => void;
  onImportFinish?: (file: File, apply?: { wallId?: string; floor?: boolean; ceiling?: boolean }) => void;
  onSetLayerVisibility: (layer: "walls" | "openings" | "furniture", visible: boolean) => void;
  onSelect: (objectId: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
  onRegisterUnderlayPicker?: (openPicker: () => void) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onActiveRoom?: (roomId: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  onAddPartitionWall: () => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onActiveWall: (wallId: string) => void;
  onActiveOpening: (openingId: string) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots">>) => void;
  onDeleteOpening: (openingId: string) => void;
  v2BuildMode?: boolean;
  v2DesignMode?: boolean;
  activeBuildTool?: BuildTool;
  onBuildTool?: (tool: BuildTool) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  openingCatalogItemId?: string;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  roomPolygonPointCount?: number;
  onCloseRoomPolygon?: () => void;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onUpdateWallThickness?: (wallId: string, thicknessMm: number) => void;
  onJoinCoincidentNodes?: () => void;
  activeSurfaceId?: string | null;
  surfaceMaterialId?: string;
  onSurfaceMaterialId?: (materialId: string) => void;
  onCloseSurfacePolygon?: () => void;
  onUpdateSurface?: (surfaceId: string, materialId: string) => void;
  onDeleteSurface?: (surfaceId: string) => void;
};

export function LivingRoomPlanCatalogRail(props: LivingRoomPlanCatalogRailProps) {
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const visibleAssets = useMemo(() => {
    const query = props.assetQuery.trim().toLowerCase();
    return LIVING_ROOM_CATALOG.filter((item) =>
      (props.studioPanel !== "cabinets" || item.kind === "cabinet") &&
      (props.studioPanel !== "furniture" || item.kind !== "cabinet") &&
      (props.assetCategory === "all" || item.category === props.assetCategory) &&
      (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)),
    );
  }, [props.assetCategory, props.assetQuery, props.studioPanel]);
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId) ?? null;
  const roomWalls = selectWallsForRoom(props.project, props.project.activeRoomId);
  const activeWall = roomWalls.find((wall) => wall.id === props.activeWallId) ?? roomWalls[0] ?? props.project.walls[0] ?? null;
  const activeOpening = props.project.openings.find((opening) => opening.id === props.activeOpeningId) ?? null;
  const selectedCabinetCount = props.project.objects.filter((object) =>
    props.selectedIds.includes(object.id) && object.kind === "cabinet",
  ).length;
  const activePanel = props.studioPanel;
  const tool = props.activeBuildTool ?? "select";
  const drawRoom = isInteriorsDrawRoomTool(props.chromeTool);
  const cabinetRun = isInteriorsCabinetRunTool(props.chromeTool);
  useEffect(() => {
    props.onRegisterUnderlayPicker?.(() => underlayInputRef.current?.click());
  }, [props.onRegisterUnderlayPicker]);

  return <>
    <InteriorsToolRail activeTool={props.chromeTool} onTool={props.onChromeTool} />
    <input ref={underlayInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void props.onImportUnderlay(event.target.files?.[0] ?? null)} />
    {props.toolRailVisible && !drawRoom ? (
      <aside className="lr-catalog lr-studio-panel" style={{ width: props.widthPx }}>
        {cabinetRun && (activePanel === "materials" || props.chromeTool === "material") ? <>
          <div className="context-panel-heading"><strong>Material Browser</strong><span>Swatches · slots · selection</span></div>
          <SurfacePaintPanel project={props.project} activeWallId={activeWall?.id ?? null}
            selectedObjects={props.project.objects.filter((object) => props.selectedIds.includes(object.id))}
            onFloor={props.onSetFloorMaterial} onCeiling={props.onSetCeilingMaterial} onWall={props.onSetWallMaterial}
            onApplyToSelection={props.onApplyMaterialToSelection} onImportFinish={props.onImportFinish} />
        </> : cabinetRun ? (
          <InteriorsCabinetRunCatalog tool={props.chromeTool} wallId={activeWall?.id ?? ""} onAdd={props.onAddCatalogObject} />
        ) : activePanel === "cabinets" || activePanel === "furniture" ? (
          <PlanAssetLibraryPanel mode={activePanel} wallName={String(activeWall?.extensions?.wallSide ?? "wall")}
            wallId={activeWall?.id ?? ""} assets={visibleAssets} query={props.assetQuery} category={props.assetCategory}
            categories={props.assetCategories} onQuery={props.onAssetQuery} onCategory={props.onAssetCategory}
            selectedCabinetCount={selectedCabinetCount} onCreateRun={props.onCreateCabinetRun}
            onAdd={props.onAddCatalogObject} onImport={props.onAddImportedAsset} />
        ) : activePanel === "materials" ? <>
          <div className="context-panel-heading"><strong>Material Browser</strong><span>Swatches · slots · selection</span></div>
          <SurfacePaintPanel project={props.project} activeWallId={activeWall?.id ?? null}
            selectedObjects={props.project.objects.filter((object) => props.selectedIds.includes(object.id))}
            onFloor={props.onSetFloorMaterial} onCeiling={props.onSetCeilingMaterial} onWall={props.onSetWallMaterial}
            onApplyToSelection={props.onApplyMaterialToSelection} onImportFinish={props.onImportFinish} />
        </> : activePanel === "layers" ? (
          <>
            <div className="context-panel-heading"><strong>Layers</strong><span>Scene structure</span></div>
            <div className="lr-layer-tree">
              <div><b>⌄</b><strong>{props.roomName}</strong><small>Room</small></div>
              <div><b>⌄</b><strong>Architecture</strong><small>{props.project.walls.length + props.project.openings.length}</small></div>
              <label>Walls <input type="checkbox" checked={isLivingRoomLayerVisible(props.project, "walls")} onChange={(event) => props.onSetLayerVisibility("walls", event.target.checked)} /></label>
              <label>Doors &amp; windows <input type="checkbox" checked={isLivingRoomLayerVisible(props.project, "openings")} onChange={(event) => props.onSetLayerVisibility("openings", event.target.checked)} /></label>
              <div><b>⌄</b><strong>Furniture &amp; decor</strong><small>{props.project.objects.length}</small></div>
              <label>Visible objects <input type="checkbox" checked={isLivingRoomLayerVisible(props.project, "furniture")} onChange={(event) => props.onSetLayerVisibility("furniture", event.target.checked)} /></label>
              {props.project.objects.map((object) => (
                <button type="button" key={object.id} className={props.selectedIds.includes(object.id) ? "is-selected" : ""} onClick={() => props.onSelect(object.id)}><i>◇</i><span>{object.name}</span><small>{object.category}</small></button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="context-panel-heading"><strong>Build Room</strong><span>2D room authoring</span></div>
            <BuildRoomCatalogPanel tool={tool} project={props.project} roomDimensions={room?.dimensions ?? { widthMm: 6200, depthMm: 4600, heightMm: 2800 }} activeWall={activeWall}
              activeOpening={activeOpening} activeSurfaceId={props.activeSurfaceId ?? null} underlay={props.underlay} importError={props.importError}
              openingCatalogItemId={props.openingCatalogItemId} roomPolygonPointCount={props.roomPolygonPointCount}
              surfaceMaterialId={props.surfaceMaterialId}
              onRoomDimensions={props.onRoomDimensions} onAddPartitionWall={props.onAddPartitionWall}
              onActiveRoom={props.onActiveRoom} onRenameRoom={props.onRenameRoom}
              onDeleteRoom={props.onDeleteRoom} onMergeRooms={props.onMergeRooms}
              onActiveWall={props.onActiveWall} onActiveOpening={props.onActiveOpening} onAddOpening={props.onAddOpening}
              onUpdateOpening={props.onUpdateOpening} onDeleteOpening={props.onDeleteOpening}
              onOpeningCatalogItem={props.onOpeningCatalogItem} onCloseRoomPolygon={props.onCloseRoomPolygon}
              onCloseSurfacePolygon={props.onCloseSurfacePolygon} onSurfaceMaterialId={props.onSurfaceMaterialId}
              onUpdateSurface={props.onUpdateSurface} onDeleteSurface={props.onDeleteSurface}
              onSplitWall={props.onSplitWall} onDeleteWall={props.onDeleteWall}
              onUpdateWallThickness={props.onUpdateWallThickness} onJoinCoincidentNodes={props.onJoinCoincidentNodes}
              onSetPlanUnderlay={props.onSetPlanUnderlay} onImportUnderlay={props.onImportUnderlay} underlayInputRef={underlayInputRef} />
          </>
        )}
      </aside>
    ) : null}
  </>;
}
