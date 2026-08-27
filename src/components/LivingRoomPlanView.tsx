import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm, Point3Mm, RoomDrawingRequest, Size3Mm } from "../domain/interiorProject";
import { roomPlanViewBounds } from "../domain/interiorProject";
import {
  getOpeningCatalogItem,
  openingOffsetAtPoint,
  type BuildTool,
  type LivingRoomPlanIssue,
  type PlanReadabilitySettings,
} from "../domain/livingRoom";
import { PlanArchitectureLayer } from "./livingRoomPlan/PlanArchitectureLayer";
import { PlanDimensionsLayer } from "./livingRoomPlan/PlanDimensionsLayer";
import { PlanObjectsLayer } from "./livingRoomPlan/PlanObjectsLayer";
import { PlanOpeningsLayer, usePlanOpeningInteraction } from "./livingRoomPlan/PlanOpeningsLayer";
import { PlanSurfaceZonesLayer } from "./livingRoomPlan/PlanSurfaceZonesLayer";
import { RoomDrawingOverlay } from "./livingRoomPlan/RoomDrawingOverlay";
import { WallDrawingOverlay } from "./livingRoomPlan/WallDrawingOverlay";
import { usePlanObjectInteraction } from "./livingRoomPlan/usePlanObjectInteraction";
import { useRoomDrawing } from "./livingRoomPlan/useRoomDrawing";
import { useWallDrawing } from "./livingRoomPlan/useWallDrawing";

type Props = {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  snapSizeMm: number; showGrid: boolean; activeWallId: string | null; activeOpeningId: string | null;
  activeSurfaceId: string | null; surfaceMaterialId: string;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSelectWall: (wallId: string) => void; onSelectOpening: (openingId: string) => void;
  onSelectSurface: (surfaceId: string | null) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  activeBuildTool?: BuildTool; openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
  onCreateRoom: (drawing: RoomDrawingRequest) => void;
  onDrawSurface: (drawing: RoomDrawingRequest, materialId: string) => void;
  onDrawWallSegment: (start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") => void;
  onPlaceColumn: (position: Point2Mm) => void;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
  readability: PlanReadabilitySettings;
};

export function LivingRoomPlanView(props: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId)!;
  const margin = 850;
  const bounds = roomPlanViewBounds(props.project, room.id);
  const viewBox = `${bounds.minX - margin} ${bounds.minZ - margin} ${bounds.widthMm + margin * 2} ${bounds.depthMm + margin * 2}`;
  const tool = props.activeBuildTool ?? "select";
  const drawRoom = tool === "draw-room";
  const drawSurface = tool === "draw-surface";
  const drawWall = tool === "draw-wall";
  const drawPartition = tool === "draw-partition";
  const placeColumn = tool === "place-column";

  function worldPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM()?.inverse();
    if (!svg || !matrix) return { x: 0, z: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const transformed = point.matrixTransform(matrix);
    return { x: transformed.x, z: transformed.y };
  }

  const openings = usePlanOpeningInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, worldPoint,
    onSelectOpening: props.onSelectOpening, onMoveOpening: props.onMoveOpening,
    onResizeOpening: props.onResizeOpening,
  });
  const objects = usePlanObjectInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, worldPoint,
    onSelect: props.onSelect, onMove: props.onMove, onResize: props.onResize,
  });
  const roomDrawing = useRoomDrawing({
    active: drawRoom || drawSurface, snapSizeMm: props.snapSizeMm,
    closeRequest: props.roomPolygonCloseRequest, worldPoint,
    onCommit: (drawing) => {
      if (drawSurface) props.onDrawSurface(drawing, props.surfaceMaterialId);
      else props.onCreateRoom(drawing);
    },
    onPointCount: props.onRoomPolygonPointCount,
  });
  const wallDrawing = useWallDrawing({
    active: drawWall || drawPartition, snapSizeMm: props.snapSizeMm, nodes: props.project.nodes, worldPoint,
    onCommit: (start, end) => props.onDrawWallSegment(start, end, drawPartition ? "partition" : "wall"),
  });

  function handleWall(event: ReactPointerEvent<SVGLineElement>, wallId: string) {
    event.stopPropagation();
    if (tool !== "place-door" && tool !== "place-window") {
      props.onSelectWall(wallId); return;
    }
    const wall = props.project.walls.find((item) => item.id === wallId);
    if (!wall) return;
    const kind = tool === "place-door" ? "door" : "window";
    const catalog = getOpeningCatalogItem(props.openingCatalogItemId);
    const widthMm = catalog.kind === kind ? catalog.defaults.widthMm : kind === "door" ? 900 : 1200;
    const point = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    const offsetMm = openingOffsetAtPoint(wall, point, widthMm, props.snapSizeMm);
    props.onSelectWall(wallId); props.onPlaceOpening(wallId, kind, offsetMm);
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (roomDrawing.move(event)) return;
    if (wallDrawing.move(event)) return;
    if (!openings.openingDragMove(event)) objects.move(event);
  }
  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    if (roomDrawing.finish(event)) return;
    if (wallDrawing.finish(event)) return;
    objects.finish(); openings.finishOpeningDrag();
  }
  function snapPoint(point: Point2Mm): Point2Mm {
    const grid = props.snapSizeMm;
    return { x: Math.round(point.x / grid) * grid, z: Math.round(point.z / grid) * grid };
  }

  function placeColumnAt(event: ReactPointerEvent<SVGElement>) {
    const target = event.target as Element;
    if (target.closest("[data-object-id]")) return;
    event.preventDefault();
    event.stopPropagation();
    props.onPlaceColumn(snapPoint(worldPoint(event as ReactPointerEvent<SVGSVGElement>)));
  }

  function paperDown(event: ReactPointerEvent<SVGRectElement>) {
    if (placeColumn) {
      placeColumnAt(event);
      return;
    }
    if (roomDrawing.start(event)) return;
    if (wallDrawing.begin(event)) return;
    props.onSelect(null);
    props.onSelectSurface(null);
  }

  return <svg ref={svgRef} className={`lr-plan-svg is-${props.readability.visualStyle}-style ${objects.dragging ? "is-dragging" : ""}`}
    viewBox={viewBox} role="application" aria-label="Living room plan editor"
    onPointerDownCapture={(event) => { if (placeColumn) placeColumnAt(event); }}
    onPointerDown={(event) => { if (event.target === event.currentTarget) { props.onSelect(null); props.onSelectSurface(null); } }}
    onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={finish}>
    <PlanArchitectureLayer project={props.project} room={room} snapSizeMm={props.snapSizeMm}
      showGrid={props.showGrid} activeWallId={props.activeWallId} visualStyle={props.readability.visualStyle}
      onPaper={paperDown} onWall={handleWall} />
    <PlanSurfaceZonesLayer project={props.project} roomId={room.id} selectable={tool === "select"}
      activeSurfaceId={props.activeSurfaceId} onSelectSurface={props.onSelectSurface} />
    <RoomDrawingOverlay polygon={roomDrawing.polygon} rectangle={roomDrawing.rectangle} active={drawRoom || drawSurface} />
    <WallDrawingOverlay preview={wallDrawing.preview} active={drawWall || drawPartition} />
    <PlanOpeningsLayer project={props.project} activeOpeningId={props.activeOpeningId}
      openingPreview={openings.openingPreview} onSelectOpening={props.onSelectOpening}
      onStartDrag={openings.startOpeningDrag} unit={props.readability.unit} />
    <PlanObjectsLayer project={props.project} selectedIds={props.selectedIds} issues={props.issues}
      preview={objects.preview} guides={objects.guides} unit={props.readability.unit} onStart={objects.start} />
    <PlanDimensionsLayer project={props.project} room={room} activeWallId={props.activeWallId} settings={props.readability} />
  </svg>;
}
