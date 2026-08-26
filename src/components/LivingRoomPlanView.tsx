import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point3Mm, Size3Mm } from "../domain/interiorProject";
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
import { RoomDrawingOverlay } from "./livingRoomPlan/RoomDrawingOverlay";
import { usePlanObjectInteraction } from "./livingRoomPlan/usePlanObjectInteraction";
import { useRoomDrawing } from "./livingRoomPlan/useRoomDrawing";
import type { RoomDrawingRequest } from "../domain/interiorProject";

type Props = {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  snapSizeMm: number; showGrid: boolean; activeWallId: string | null; activeOpeningId: string | null;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSelectWall: (wallId: string) => void; onSelectOpening: (openingId: string) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  activeBuildTool?: BuildTool; openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
  onCreateRoom: (drawing: RoomDrawingRequest) => void;
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
    active: props.activeBuildTool === "draw-room", snapSizeMm: props.snapSizeMm,
    closeRequest: props.roomPolygonCloseRequest, worldPoint, onCommit: props.onCreateRoom,
    onPointCount: props.onRoomPolygonPointCount,
  });

  function handleWall(event: ReactPointerEvent<SVGLineElement>, wallId: string) {
    event.stopPropagation();
    const tool = props.activeBuildTool ?? "select";
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
    if (!openings.openingDragMove(event)) objects.move(event);
  }
  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    if (roomDrawing.finish(event)) return;
    objects.finish(); openings.finishOpeningDrag();
  }
  function paperDown(event: ReactPointerEvent<SVGRectElement>) {
    if (roomDrawing.start(event)) return;
    props.onSelect(null);
  }

  return <svg ref={svgRef} className={`lr-plan-svg is-${props.readability.visualStyle}-style ${objects.dragging ? "is-dragging" : ""}`}
    viewBox={viewBox} role="application" aria-label="Living room plan editor"
    onPointerDown={(event) => { if (event.target === event.currentTarget) props.onSelect(null); }}
    onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={finish}>
    <PlanArchitectureLayer project={props.project} room={room} snapSizeMm={props.snapSizeMm}
      showGrid={props.showGrid} activeWallId={props.activeWallId} visualStyle={props.readability.visualStyle}
      onPaper={paperDown} onWall={handleWall} />
    <RoomDrawingOverlay polygon={roomDrawing.polygon} rectangle={roomDrawing.rectangle} active={props.activeBuildTool === "draw-room"} />
    <PlanOpeningsLayer project={props.project} activeOpeningId={props.activeOpeningId}
      openingPreview={openings.openingPreview} onSelectOpening={props.onSelectOpening}
      onStartDrag={openings.startOpeningDrag} unit={props.readability.unit} />
    <PlanObjectsLayer project={props.project} selectedIds={props.selectedIds} issues={props.issues}
      preview={objects.preview} guides={objects.guides} unit={props.readability.unit} onStart={objects.start} />
    <PlanDimensionsLayer room={room} walls={props.project.walls} activeWallId={props.activeWallId} settings={props.readability} />
  </svg>;
}
