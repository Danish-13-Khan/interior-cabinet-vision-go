import { useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  anchorForDraggedEdge, compiledCeilingCutouts, polygonBounds, readCeilingCutouts, roomPlanPolygon,
  type CeilingCutout, type InteriorProject, type InteriorRoomEntity, type Point2Mm,
} from "../../domain/interiorProject";
import { outerLoopWallsRaised } from "../../domain/interiorProject/wallRaise";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";
import {
  MIN_CUTOUT_SIDE_MM, lightsInCutout, moveCeilingCutoutWithLights, resizeCeilingCutoutWithLights,
} from "../../domain/livingRoom/lightCutoutMount";

/** Active-room lights centred in a cutout still in the ceiling; their plan glyphs defer to the cutout beneath. */
export function cutoutHostedLightIds(project: InteriorProject): ReadonlySet<string> {
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  const cutoutIds = new Set(room ? compiledCeilingCutouts(project, room).map((cutout) => cutout.id) : []);
  return new Set(project.lights
    .filter((light) => light.roomId === project.activeRoomId && light.parameters.hostSurface === "ceiling"
      && typeof light.parameters.hostCutoutId === "string" && cutoutIds.has(light.parameters.hostCutoutId))
    .map((light) => light.id));
}

function loopPath(points: Point2Mm[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.z}`).join(" ") + " Z";
}

function worldPoint(event: ReactPointerEvent<SVGElement>): Point2Mm {
  const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM()?.inverse();
  const point = matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix) : { x: 0, y: 0 };
  return { x: point.x, z: point.y };
}

type Edge = "minX" | "maxX" | "minZ" | "maxZ";
type Drag = { cutoutId: string; start: Point2Mm; delta: Point2Mm; edge: Edge | null; symmetric: boolean };
const EDGES: Edge[] = ["minX", "maxX", "minZ", "maxZ"];

/** Four axis-aligned points; the only cutouts that get edge handles. */
function isRectangle(cutout: CeilingCutout) {
  const b = polygonBounds(cutout.polygon);
  return cutout.polygon.length === 4 && cutout.polygon.every((p) =>
    (p.x === b.minX || p.x === b.maxX) && (p.z === b.minZ || p.z === b.maxZ));
}

/** Bounds after a handle drag: the dragged edge follows, its opposite stays (or mirrors with Alt). */
function draggedBounds(cutout: CeilingCutout, drag: Drag) {
  const b = polygonBounds(cutout.polygon);
  const box = { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
  if (!drag.edge) return { minX: b.minX + drag.delta.x, maxX: b.maxX + drag.delta.x, minZ: b.minZ + drag.delta.z, maxZ: b.maxZ + drag.delta.z };
  const axis = drag.edge.endsWith("X") ? "x" : "z";
  const d = drag.delta[axis];
  const signed = drag.edge.startsWith("max") ? d : -d;
  const grow = drag.symmetric ? signed * 2 : signed;
  const size = Math.max(MIN_CUTOUT_SIDE_MM, (axis === "x" ? b.widthMm : b.depthMm) + grow);
  const lo = axis === "x" ? "minX" : "minZ"; const hi = axis === "x" ? "maxX" : "maxZ";
  if (drag.symmetric) { const c = (box[lo] + box[hi]) / 2; box[lo] = c - size / 2; box[hi] = c + size / 2; }
  else if (drag.edge.startsWith("max")) box[hi] = box[lo] + size;
  else box[lo] = box[hi] - size;
  return box;
}

/**
 * Ceiling plan layer (Layers → Ceiling, or while the cutout tool is armed): the
 * slab the 3D view compiles and its cutouts. Sits above the object layers so a
 * cutout under a cabinet glyph stays visible. In Select mode a cutout drags and
 * a rectangular one resizes from its edge handles (Alt keeps the centre);
 * fixtures centred in it follow.
 */
export function PlanCeilingLayer(props: {
  project: InteriorProject;
  room: InteriorRoomEntity | null;
  visible: boolean;
  unit: PlanDisplayUnit;
  snapSizeMm: number;
  interactive: boolean;
  onPatchDocument?: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
  /** A click (no drag) on a cutout selects the fixture it hosts. */
  onSelectLight?: (lightId: string) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  if (!props.visible || !props.room) return null;
  const polygon = roomPlanPolygon(props.project, props.room.id);
  if (!polygon || !outerLoopWallsRaised(props.project, props.room)) return null;
  const roomId = props.room.id;
  const cutouts = readCeilingCutouts(props.room);
  const inCeiling = new Set(compiledCeilingCutouts(props.project, props.room).map((cutout) => cutout.id));
  const slabPath = [polygon.outer, ...polygon.holes, ...cutouts.filter((cutout) => inCeiling.has(cutout.id)).map((cutout) => cutout.polygon)]
    .map(loopPath).join(" ");
  const movable = props.interactive && Boolean(props.onPatchDocument);
  const snap = (value: number) => Math.round(value / props.snapSizeMm) * props.snapSizeMm;
  const begin = (event: ReactPointerEvent<SVGElement>, cutoutId: string, edge: Edge | null) => {
    if (!movable || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ cutoutId, start: worldPoint(event), delta: { x: 0, z: 0 }, edge, symmetric: event.altKey });
  };
  const move = (event: ReactPointerEvent<SVGElement>) => {
    if (!drag) return;
    const point = worldPoint(event);
    setDrag({ ...drag, delta: { x: snap(point.x - drag.start.x), z: snap(point.z - drag.start.z) }, symmetric: event.altKey });
  };
  const finish = (event: ReactPointerEvent<SVGElement>) => {
    if (!drag) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const { cutoutId, delta, edge, symmetric } = drag;
    setDrag(null);
    if (delta.x === 0 && delta.z === 0) {
      const hosted = lightsInCutout(props.project, cutoutId)[0];
      if (!edge && hosted) props.onSelectLight?.(hosted.id);
      return;
    }
    const cutout = cutouts.find((item) => item.id === cutoutId);
    const apply = (current: InteriorProject) => {
      if (!edge || !cutout) return moveCeilingCutoutWithLights(current, roomId, cutoutId, delta);
      const next = draggedBounds(cutout, drag);
      const anchors = edge.endsWith("X")
        ? { x: anchorForDraggedEdge(edge === "maxX" ? "max" : "min", symmetric) }
        : { z: anchorForDraggedEdge(edge === "maxZ" ? "max" : "min", symmetric) };
      return resizeCeilingCutoutWithLights(current, roomId, cutoutId, { widthMm: next.maxX - next.minX, depthMm: next.maxZ - next.minZ }, anchors);
    };
    // Refused edits (out of the room, onto another cutout) are not recorded as a change.
    if (apply(props.project) === props.project) return;
    props.onPatchDocument?.(apply, edge ? "Resized ceiling cutout." : "Moved ceiling cutout.");
  };
  const handleMm = Math.max(60, props.snapSizeMm * 2.4);
  return (
    <g className="lr-plan-ceiling-layer" data-testid="lr-plan-ceiling-layer" pointerEvents="none">
      <defs>
        <pattern id="lr-ceiling-hatch" width="420" height="420" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="420" className="lr-ceiling-hatch-line" />
        </pattern>
      </defs>
      <path data-testid="lr-plan-ceiling" className="lr-plan-ceiling" d={slabPath} fillRule="evenodd" />
      {cutouts.map((cutout) => {
        const dragging = drag?.cutoutId === cutout.id ? drag : null;
        const stranded = !inCeiling.has(cutout.id);
        const rect = isRectangle(cutout);
        const box = dragging ? draggedBounds(cutout, dragging) : polygonBounds(cutout.polygon);
        const path = dragging && rect
          ? loopPath([{ x: box.minX, z: box.minZ }, { x: box.maxX, z: box.minZ }, { x: box.maxX, z: box.maxZ }, { x: box.minX, z: box.maxZ }])
          : loopPath(cutout.polygon);
        const midX = (box.minX + box.maxX) / 2; const midZ = (box.minZ + box.maxZ) / 2;
        const handleAt: Record<Edge, Point2Mm> = { minX: { x: box.minX, z: midZ }, maxX: { x: box.maxX, z: midZ }, minZ: { x: midX, z: box.minZ }, maxZ: { x: midX, z: box.maxZ } };
        return (
          <g key={cutout.id} className={`lr-plan-cutout${movable ? " is-movable" : ""}${dragging ? " is-dragging" : ""}${stranded ? " is-stranded" : ""}`}
            data-ceiling-cutout-id={cutout.id} data-stranded={stranded ? "1" : undefined} pointerEvents={movable ? "auto" : "none"}
            transform={dragging && !dragging.edge && !rect ? `translate(${dragging.delta.x} ${dragging.delta.z})` : undefined}
            onPointerDown={(event) => begin(event, cutout.id, null)} onPointerMove={move}
            onPointerUp={finish} onPointerCancel={finish}>
            <path d={path} />
            <text x={midX} y={midZ}>
              {cutout.label ?? cutout.id} · {formatPlanDimension(box.maxX - box.minX, props.unit)} × {formatPlanDimension(box.maxZ - box.minZ, props.unit)}{stranded ? " · not in ceiling" : ""}
            </text>
            {movable && rect ? EDGES.map((edge) => (
              <rect key={edge} className={`lr-plan-cutout-handle is-${edge.endsWith("X") ? "x" : "z"}`} data-cutout-edge={edge}
                x={handleAt[edge].x - handleMm / 2} y={handleAt[edge].z - handleMm / 2} width={handleMm} height={handleMm}
                onPointerDown={(event) => begin(event, cutout.id, edge)} />
            )) : null}
          </g>
        );
      })}
    </g>
  );
}
