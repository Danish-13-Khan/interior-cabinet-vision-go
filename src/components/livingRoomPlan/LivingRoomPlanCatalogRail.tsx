import { useEffect, useRef } from "react";
import type { InteriorProject, OpeningEntity, Size3Mm } from "../../domain/interiorProject";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import {
  LIVING_ROOM_CATALOG,
  isLivingRoomLayerVisible,
  type LivingRoomCatalogId,
  type ImportedAsset,
} from "../../domain/livingRoom";
import type { BuildTool, StudioPanel } from "./workspaceProps";
import { BuildToolList } from "./BuildToolList";
import { OpeningCatalogPanel } from "./OpeningCatalogPanel";
import { PlanUnderlayControls } from "./PlanUnderlayControls";
import { SurfacePaintPanel } from "./SurfacePaintPanel";
import { PlanAssetLibraryPanel } from "./PlanAssetLibraryPanel";
type LivingRoomPlanCatalogRailProps = {
  widthPx: number;
  toolRailVisible: boolean;
  studioPanel: StudioPanel;
  onStudioPanel: (panel: StudioPanel) => void;
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
  onAddImportedAsset: (asset: ImportedAsset) => void;
  onSetFloorMaterial: (materialId: string) => void;
  onSetWallMaterial: (wallId: string, materialId: string) => void;
  onSetObjectMaterial: (objectId: string, slotName: string, materialId: string) => void;
  onSetLayerVisibility: (layer: "walls" | "openings" | "furniture", visible: boolean) => void;
  onSelect: (objectId: string) => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
  onRegisterUnderlayPicker?: (openPicker: () => void) => void;
  onRoomDimensions: (dimensions: Size3Mm) => void;
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
};
export function LivingRoomPlanCatalogRail(props: LivingRoomPlanCatalogRailProps) {
  const underlayInputRef = useRef<HTMLInputElement | null>(null);
  const visibleAssets = LIVING_ROOM_CATALOG.filter((item) =>
    (props.studioPanel !== "cabinets" || item.kind === "cabinet") &&
    (props.studioPanel !== "furniture" || item.kind !== "cabinet") &&
    (props.assetCategory === "all" || item.category === props.assetCategory) &&
    (!props.assetQuery.trim()
      || `${item.name} ${item.category}`.toLowerCase().includes(props.assetQuery.trim().toLowerCase())),
  );
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId)!;
  const activeWall = props.project.walls.find((wall) => wall.id === props.activeWallId) ?? props.project.walls[0]!;
  const activeOpening = props.project.openings.find((opening) => opening.id === props.activeOpeningId) ?? null;
  const selectedObject = props.selectedIds.length === 1 ? props.project.objects.find((object) => object.id === props.selectedIds[0]) ?? null : null;
  const activePanel = props.v2BuildMode ? "build" : props.studioPanel;
  const tool = props.activeBuildTool ?? "select";

  useEffect(() => {
    props.onRegisterUnderlayPicker?.(() => underlayInputRef.current?.click());
  }, [props.onRegisterUnderlayPicker]);
  return <>
      <nav className="lr-studio-rail" aria-label="Plan tools">
        {!props.v2DesignMode ? <button type="button" className={activePanel === "build" ? "is-active" : ""} onClick={() => props.onStudioPanel("build")} title="Build room"><span>⌗</span>Build<small>Room, walls, openings</small></button> : null}
        {!props.v2BuildMode ? <>
        <button type="button" className={props.studioPanel === "cabinets" ? "is-active" : ""} onClick={() => props.onStudioPanel("cabinets")} title="Cabinets"><span>▤</span>Cabinets<small>Place modules</small></button>
        <button type="button" className={props.studioPanel === "furniture" ? "is-active" : ""} onClick={() => props.onStudioPanel("furniture")} title="Furniture"><span>◇</span>Furniture<small>Room objects</small></button>
        <button type="button" className={props.studioPanel === "materials" ? "is-active" : ""} onClick={() => props.onStudioPanel("materials")} title="Materials"><span>◐</span>Materials<small>Finishes</small></button>
        <button type="button" className={props.studioPanel === "layers" ? "is-active" : ""} onClick={() => props.onStudioPanel("layers")} title="Layers"><span>▱</span>Layers<small>Visibility</small></button>
        {!props.v2DesignMode ? <button type="button" className={props.studioPanel === "advanced" ? "is-active" : ""} onClick={() => props.onStudioPanel("advanced")} title="Advanced Studio"><span>✦</span>Advanced</button> : null}
        </> : null}
      </nav>
      {props.toolRailVisible ? (
      <aside className="lr-catalog lr-studio-panel" style={{ width: props.widthPx }}>
        {activePanel === "cabinets" || activePanel === "furniture" ? (
          <PlanAssetLibraryPanel mode={activePanel} wallName={String(activeWall.extensions?.wallSide ?? "wall")}
            wallId={activeWall.id} assets={visibleAssets} query={props.assetQuery} category={props.assetCategory}
            categories={props.assetCategories} onQuery={props.onAssetQuery} onCategory={props.onAssetCategory}
            onAdd={props.onAddCatalogObject} onImport={props.onAddImportedAsset} />
        ) : activePanel === "materials" ? <>
            <div className="context-panel-heading"><strong>Surface Paint</strong><span>2D paint · synced 3D</span></div>
            <SurfacePaintPanel
              project={props.project}
              activeWallId={activeWall.id}
              selectedObject={selectedObject}
              onFloor={props.onSetFloorMaterial}
              onWall={props.onSetWallMaterial}
              onObject={props.onSetObjectMaterial}
            />
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
            <div className="lr-underlay-panel">
              {props.v2BuildMode && props.onBuildTool ? (
                <BuildToolList
                  activeTool={tool}
                  onTool={props.onBuildTool}
                  canUndo={Boolean(props.canUndo)}
                  canRedo={Boolean(props.canRedo)}
                  onUndo={props.onUndo ?? (() => {})}
                  onRedo={props.onRedo ?? (() => {})}
                />
              ) : null}
              {tool === "draw-surface" ? <p className="lr-build-tool-hint">Surface zones will be enabled after freeform topology authoring.</p> : null}
              {tool === "place-door" || tool === "place-window" ? (
                <section className="lr-room-authoring lr-build-commit">
                  <strong>{tool === "place-door" ? "Place Doors · armed" : "Place Windows · armed"}</strong>
                  <p>Select a wall, then commit placement. Escape cancels the tool.</p>
                  {props.openingCatalogItemId && props.onOpeningCatalogItem ? <OpeningCatalogPanel kind={tool === "place-door" ? "door" : "window"} selectedId={props.openingCatalogItemId} onSelect={props.onOpeningCatalogItem} /> : null}
                  <button type="button" disabled={!activeWall} onClick={() => activeWall && props.onAddOpening(activeWall.id, tool === "place-door" ? "door" : "window")}>
                    {tool === "place-door" ? "+ Place door on selected wall" : "+ Place window on selected wall"}
                  </button>
                </section>
              ) : null}
              {tool === "place-structural" || tool === "draw-wall" ? (
                <section className="lr-room-authoring lr-build-commit">
                  <strong>{tool === "place-structural" ? "Place Structurals · armed" : "Draw Wall"}</strong>
                  <p>{tool === "place-structural" ? "Commit to add a partition wall. Escape cancels." : "Select a wall below, or add a partition."}</p>
                  <button type="button" className="lr-add-partition" onClick={props.onAddPartitionWall}>+ Add partition wall</button>
                </section>
              ) : null}
              <section className="lr-room-authoring">
                <strong>{tool === "draw-room" ? "Draw Room · dimensions" : "1. Room dimensions"}</strong>
                <div className="lr-room-dimension-grid">
                  {(["widthMm", "depthMm", "heightMm"] as const).map((key) => (
                    <label key={key}><span>{key === "widthMm" ? "Width" : key === "depthMm" ? "Depth" : "Height"}</span><input type="number" min="2200" step="50" value={room.dimensions[key]} onChange={(event) => props.onRoomDimensions({ ...room.dimensions, [key]: Number(event.target.value) || room.dimensions[key] })} /></label>
                  ))}
                </div>
              </section>
              <section className="lr-room-authoring">
                <strong>2. Select or add a wall</strong>
                {tool !== "place-structural" && tool !== "draw-wall" ? (
                  <button type="button" className="lr-add-partition" onClick={props.onAddPartitionWall}>+ Add partition wall</button>
                ) : null}
                <div className="lr-wall-tabs">
                  {props.project.walls.map((wall) => <button key={wall.id} type="button" className={wall.id === activeWall.id ? "is-active" : ""} onClick={() => props.onActiveWall(wall.id)}>{String(wall.extensions?.wallSide ?? "wall")}</button>)}
                </div>
                <small className="lr-build-selection">Selected wall: {String(activeWall.extensions?.wallSide ?? activeWall.id)}</small>
                {tool !== "place-door" && tool !== "place-window" ? (
                  <>
                    <strong className="lr-openings-heading">3. Add an opening</strong>
                    <div className="lr-opening-actions"><button type="button" onClick={() => props.onAddOpening(activeWall.id, "door")}>+ Add door</button><button type="button" onClick={() => props.onAddOpening(activeWall.id, "window")}>+ Add window</button></div>
                  </>
                ) : null}
                {props.project.openings.filter((opening) => opening.wallId === activeWall.id).map((opening) => (
                  <button type="button" key={opening.id} className={`lr-opening-row ${opening.id === activeOpening?.id ? "is-active" : ""}`} onClick={() => props.onActiveOpening(opening.id)}><span>{opening.kind}</span><small>{opening.widthMm} mm · {opening.offsetMm} mm</small></button>
                ))}
                {!props.project.openings.some((opening) => opening.wallId === activeWall.id) ? <p>No doors or windows on selected wall.</p> : null}
                {activeOpening?.wallId === activeWall.id ? <div className="lr-opening-fields">
                  {(["offsetMm", "widthMm", "heightMm", "sillHeightMm"] as const).map((key) => <label key={key}><span>{key === "offsetMm" ? "Offset" : key === "widthMm" ? "Width" : key === "heightMm" ? "Height" : "Sill"}</span><input type="number" min="0" step="50" value={activeOpening[key]} onChange={(event) => props.onUpdateOpening(activeOpening.id, { [key]: Number(event.target.value) || activeOpening[key] })} /></label>)}
                  <button type="button" className="is-danger" onClick={() => props.onDeleteOpening(activeOpening.id)}>Remove opening</button>
                </div> : null}
              </section>
              <section className={`lr-room-authoring${tool === "upload-underlay" ? " is-tool-focus" : ""}`}>
                <strong>4. Plan underlay</strong>
                <small>{tool === "upload-underlay" ? "Upload tool armed — choose or replace a plan image." : "Optional: align a supplied floor plan before drawing."}</small>
              </section>
              <input ref={underlayInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void props.onImportUnderlay(event.target.files?.[0] ?? null)} />
              <PlanUnderlayControls underlay={props.underlay} onChange={props.onSetPlanUnderlay} onReplace={() => underlayInputRef.current?.click()} />
              {props.importError ? <p className="lr-import-error">{props.importError}</p> : null}
            </div>
          </>
        )}
      </aside>
      ) : null}
    </>;
}
