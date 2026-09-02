import type { RefObject } from "react";
import {
  selectWallsForRoom,
  type InteriorProject,
  type OpeningEntity,
  type Size3Mm,
  type WallEntity,
} from "../../domain/interiorProject";
import type { BuildTool } from "../../domain/livingRoom/buildToolCommands";
import { BuildRoomManager } from "./BuildRoomManager";
import { OpeningCatalogPanel } from "./OpeningCatalogPanel";
import { PlanUnderlayControls } from "./PlanUnderlayControls";
import type { LivingRoomPlanUnderlay } from "../../domain/livingRoom/planUnderlay";
import { RoomDrawingPanel } from "./RoomDrawingPanel";
import { StructuralBuildPanel } from "./StructuralBuildPanel";
import { SurfaceDrawingPanel } from "./SurfaceDrawingPanel";
import { WallDrawingPanel } from "./WallDrawingPanel";

type BuildRoomCatalogPanelProps = {
  tool: BuildTool;
  project: InteriorProject;
  roomDimensions: Size3Mm;
  activeWall: WallEntity | null;
  activeOpening: OpeningEntity | null;
  activeSurfaceId: string | null;
  underlay: LivingRoomPlanUnderlay | null;
  importError: string;
  openingCatalogItemId?: string;
  roomPolygonPointCount?: number;
  surfaceMaterialId?: string;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onAddPartitionWall: () => void;
  onActiveRoom?: (roomId: string) => void;
  onRenameRoom?: (roomId: string, name: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  onMergeRooms?: (targetRoomId: string, absorbedRoomId: string) => void;
  onActiveWall: (wallId: string) => void;
  onActiveOpening: (openingId: string) => void;
  onAddOpening: (wallId: string, kind: "door" | "window") => void;
  onUpdateOpening: (openingId: string, patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "materialSlots">>) => void;
  onDeleteOpening: (openingId: string) => void;
  onOpeningCatalogItem?: (catalogItemId: string) => void;
  onCloseRoomPolygon?: () => void;
  onCloseSurfacePolygon?: () => void;
  onSurfaceMaterialId?: (materialId: string) => void;
  onUpdateSurface?: (surfaceId: string, materialId: string) => void;
  onDeleteSurface?: (surfaceId: string) => void;
  onSplitWall?: (wallId: string) => void;
  onDeleteWall?: (wallId: string) => void;
  onUpdateWallThickness?: (wallId: string, thicknessMm: number) => void;
  onJoinCoincidentNodes?: () => void;
  onSetPlanUnderlay: (underlay: LivingRoomPlanUnderlay | null) => void;
  onImportUnderlay: (file: File | null) => void;
  underlayInputRef: RefObject<HTMLInputElement | null>;
};

export function BuildRoomCatalogPanel(props: BuildRoomCatalogPanelProps) {
  const { tool, project, activeWall, activeOpening } = props;
  const activeSurface = project.surfaces.find((surface) => surface.id === props.activeSurfaceId) ?? null; const polygonCount = props.roomPolygonPointCount ?? 0;
  const roomWalls = selectWallsForRoom(project, project.activeRoomId);
  return (
    <div className="lr-underlay-panel">
      {props.onActiveRoom && props.onRenameRoom ? (
        <BuildRoomManager project={project}
          onActiveRoom={props.onActiveRoom}
          onRenameRoom={props.onRenameRoom}
          onDeleteRoom={props.onDeleteRoom}
          onMergeRooms={props.onMergeRooms}
        />
      ) : null}
      {tool === "draw-surface" ? (
        <section className="lr-room-authoring lr-build-commit">
          <strong>Draw Surface · armed</strong>
          <SurfaceDrawingPanel
            pointCount={polygonCount}
            materialId={props.surfaceMaterialId ?? project.materials[0]?.id ?? ""}
            materials={project.materials}
            onMaterialId={props.onSurfaceMaterialId ?? (() => {})}
            onClosePolygon={props.onCloseSurfacePolygon}
          />
        </section>
      ) : null}
      {tool === "draw-partition" || tool === "place-column" ? (
        <StructuralBuildPanel
          tool={tool}
          thicknessMm={activeWall?.thicknessMm ?? 120}
          canEditWall={Boolean(activeWall)}
          onAddPartitionWall={props.onAddPartitionWall}
          onThickness={(thicknessMm) => activeWall && props.onUpdateWallThickness?.(activeWall.id, thicknessMm)}
          onSplit={() => activeWall && props.onSplitWall?.(activeWall.id)}
          onDelete={() => activeWall && props.onDeleteWall?.(activeWall.id)}
          onJoinNodes={() => props.onJoinCoincidentNodes?.()}
        />
      ) : null}
      {tool === "place-door" || tool === "place-window" ? (
        <section className="lr-room-authoring lr-build-commit">
          <strong>{tool === "place-door" ? "Place Doors · armed" : "Place Windows · armed"}</strong>
          <p>Select a wall, then commit placement. Escape cancels the tool.</p>
          {props.openingCatalogItemId && props.onOpeningCatalogItem ? (
            <OpeningCatalogPanel kind={tool === "place-door" ? "door" : "window"} selectedId={props.openingCatalogItemId} onSelect={props.onOpeningCatalogItem} />
          ) : null}
          <button type="button" disabled={!activeWall} onClick={() => activeWall && props.onAddOpening(activeWall.id, tool === "place-door" ? "door" : "window")}>
            {tool === "place-door" ? "+ Place door on selected wall" : "+ Place window on selected wall"}
          </button>
        </section>
      ) : null}
      {tool === "draw-wall" ? (
        <section className="lr-room-authoring lr-build-commit">
          <strong>Draw Wall · armed</strong>
          <WallDrawingPanel
            thicknessMm={activeWall?.thicknessMm ?? 120}
            canEdit={Boolean(activeWall)}
            onThickness={(thicknessMm) => activeWall && props.onUpdateWallThickness?.(activeWall.id, thicknessMm)}
            onSplit={() => activeWall && props.onSplitWall?.(activeWall.id)}
            onDelete={() => activeWall && props.onDeleteWall?.(activeWall.id)}
            onJoinNodes={() => props.onJoinCoincidentNodes?.()}
          />
        </section>
      ) : null}
      {activeSurface && tool === "select" ? (
        <section className="lr-room-authoring lr-build-commit">
          <strong>Surface zone · {activeSurface.id}</strong>
          <label>
            <span>Material</span>
            <select
              value={activeSurface.materialId ?? ""}
              onChange={(event) => props.onUpdateSurface?.(activeSurface.id, event.target.value)}
            >
              {project.materials.map((material) => (
                <option key={material.id} value={material.id}>{material.name}</option>
              ))}
            </select>
          </label>
          <button type="button" className="is-danger" onClick={() => props.onDeleteSurface?.(activeSurface.id)}>Delete surface zone</button>
        </section>
      ) : null}
      <section className="lr-room-authoring">
        <strong>{tool === "draw-room" ? "Draw Room · dimensions" : "1. Room dimensions"}</strong>
        {tool === "draw-room" ? <RoomDrawingPanel pointCount={polygonCount} onClosePolygon={props.onCloseRoomPolygon} /> : null}
        <div className="lr-room-dimension-grid">
          {(["widthMm", "depthMm", "heightMm"] as const).map((key) => (
            <label key={key}>
              <span>{key === "widthMm" ? "Width" : key === "depthMm" ? "Depth" : "Height"}</span>
              <input type="number" min="2200" step="50" value={props.roomDimensions[key]}
                onChange={(event) => props.onRoomDimensions({ ...props.roomDimensions, [key]: Number(event.target.value) || props.roomDimensions[key] })} />
            </label>
          ))}
        </div>
      </section>
      <section className="lr-room-authoring">
        <strong>2. Select or add a wall</strong>
        {tool !== "draw-partition" && tool !== "draw-wall" ? (
          <button type="button" className="lr-add-partition" onClick={props.onAddPartitionWall}>+ Add partition wall</button>
        ) : null}
        <div className="lr-wall-tabs">
          {roomWalls.map((wall) => (
            <button key={wall.id} type="button" className={wall.id === activeWall?.id ? "is-active" : ""} onClick={() => props.onActiveWall(wall.id)}>
              {wall.extensions?.isPartition ? "partition" : String(wall.extensions?.wallSide ?? "wall")}
            </button>
          ))}
        </div>
        <small className="lr-build-selection">Selected wall: {activeWall ? String(activeWall.extensions?.wallSide ?? activeWall.id) : "None — draw a room first"}</small>
        {tool !== "place-door" && tool !== "place-window" ? (
          <>
            <strong className="lr-openings-heading">3. Add an opening</strong>
            <div className="lr-opening-actions">
              <button type="button" disabled={!activeWall} onClick={() => activeWall && props.onAddOpening(activeWall.id, "door")}>+ Add door</button>
              <button type="button" disabled={!activeWall} onClick={() => activeWall && props.onAddOpening(activeWall.id, "window")}>+ Add window</button>
            </div>
          </>
        ) : null}
        {activeWall ? project.openings.filter((opening) => opening.wallId === activeWall.id).map((opening) => (
          <button type="button" key={opening.id} className={`lr-opening-row ${opening.id === activeOpening?.id ? "is-active" : ""}`} onClick={() => props.onActiveOpening(opening.id)}>
            <span>{opening.kind}</span><small>{opening.widthMm} mm · {opening.offsetMm} mm</small>
          </button>
        )) : null}
        {activeWall && !project.openings.some((opening) => opening.wallId === activeWall.id) ? <p>No doors or windows on selected wall.</p> : null}
        {activeWall && activeOpening?.wallId === activeWall.id ? (
          <div className="lr-opening-fields">
            {(["offsetMm", "widthMm", "heightMm", "sillHeightMm"] as const).map((key) => (
              <label key={key}>
                <span>{key === "offsetMm" ? "Offset" : key === "widthMm" ? "Width" : key === "heightMm" ? "Height" : "Sill"}</span>
                <input type="number" min="0" step="50" value={activeOpening[key]}
                  onChange={(event) => props.onUpdateOpening(activeOpening.id, { [key]: Number(event.target.value) || activeOpening[key] })} />
              </label>
            ))}
            <button type="button" className="is-danger" onClick={() => props.onDeleteOpening(activeOpening.id)}>Remove opening</button>
          </div>
        ) : null}
      </section>
      <section className={`lr-room-authoring${tool === "upload-underlay" ? " is-tool-focus" : ""}`}>
        <strong>4. Plan underlay</strong>
        <small>{tool === "upload-underlay" ? "Upload tool armed — choose or replace a plan image." : "Optional: align a supplied floor plan before drawing."}</small>
      </section>
      <PlanUnderlayControls underlay={props.underlay} onChange={props.onSetPlanUnderlay} onReplace={() => props.underlayInputRef.current?.click()} />
      {props.importError ? <p className="lr-import-error">{props.importError}</p> : null}
    </div>
  );
}
