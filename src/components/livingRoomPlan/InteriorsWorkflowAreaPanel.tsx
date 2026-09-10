import type { InteriorProject } from "../../domain/interiorProject";
import { isLivingRoomLayerVisible } from "../../domain/livingRoom";
import { InteriorsCabinetRunCatalog } from "./InteriorsCabinetRunCatalog";
import { BuildRoomCatalogPanel } from "./BuildRoomCatalogPanel";
import { CatalogObjectBrowser } from "./CatalogObjectBrowser";
import { InteriorsReviewPanel } from "./InteriorsReviewPanel";
import { PlanAssetLibraryPanel } from "./PlanAssetLibraryPanel";
import { SurfacePaintPanel } from "./SurfacePaintPanel";
import type { InteriorsWorkflowAreaPanelProps } from "./interiorsWorkflowAreaPanelProps";

export function InteriorsWorkflowAreaPanel(props: InteriorsWorkflowAreaPanelProps) {
  const selectedObjects = props.project.objects.filter((object) => props.selectedIds.includes(object.id));
  const wallId = props.activeWall?.id ?? "";

  switch (props.view) {
    case "review":
      return (
        <InteriorsReviewPanel
          project={props.project}
          issues={props.issues}
          proposal={props.proposal}
          onSelectIssue={props.onSelectIssue}
          onPresent={props.onPresent}
        />
      );
    case "materials":
      return <>
        <div className="context-panel-heading"><strong>Material Browser</strong><span>Swatches · slots · selection</span></div>
        <SurfacePaintPanel project={props.project} activeWallId={props.activeWall?.id ?? null}
          selectedObjects={selectedObjects}
          onFloor={props.onSetFloorMaterial} onCeiling={props.onSetCeilingMaterial} onWall={props.onSetWallMaterial}
          onApplyToSelection={props.onApplyMaterialToSelection}
          onApplyColour={props.onApplyMaterialColour}
          onImportFinish={props.onImportFinish} />
      </>;
    case "object-browser":
      return <CatalogObjectBrowser onPlace={(catalogItemId) => props.onAddCatalogObject(catalogItemId)} />;
    case "cabinet-run":
      return <InteriorsCabinetRunCatalog tool={props.chromeTool} wallId={wallId} onAdd={props.onAddCatalogObject} />;
    case "cabinet-library":
      return (
        <PlanAssetLibraryPanel mode="cabinets" wallName={String(props.activeWall?.extensions?.wallSide ?? "wall")}
          wallId={wallId} assets={props.visibleAssets} query={props.assetQuery} category={props.assetCategory}
          categories={props.assetCategories} onQuery={props.onAssetQuery} onCategory={props.onAssetCategory}
          selectedCabinetCount={props.selectedCabinetCount} onCreateRun={props.onCreateCabinetRun}
          onAdd={props.onAddCatalogObject} onImport={props.onAddImportedAsset} />
      );
    case "room-build":
    default:
      return <>
        <div className="context-panel-heading"><strong>Build Room</strong><span>2D room authoring</span></div>
        <BuildRoomCatalogPanel tool={props.tool} project={props.project} roomDimensions={props.roomDimensions}
          activeWall={props.activeWall} activeOpening={props.activeOpening}
          activeSurfaceId={props.activeSurfaceId} underlay={props.underlay} importError={props.importError}
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
          onSetPlanUnderlay={props.onSetPlanUnderlay} onImportUnderlay={props.onImportUnderlay}
          underlayInputRef={props.underlayInputRef}
          onCalibrateUnderlay={props.onCalibrateUnderlay} onToggleSiteMeasure={props.onToggleSiteMeasure} />
      </>;
  }
}

export function InteriorsWorkflowLayersPanel(props: {
  project: InteriorProject;
  roomName: string;
  selectedIds: string[];
  onSelect: (objectId: string) => void;
  onSetLayerVisibility: (layer: "walls" | "openings" | "furniture", visible: boolean) => void;
}) {
  return <>
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
  </>;
}
