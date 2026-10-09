import { useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ceilingCutoutSizeMm, compiledCeilingCutouts, readCeilingCutouts, roomPlanPolygon,
  type InteriorProject, type InteriorRoomEntity, type Point2Mm,
} from "../../domain/interiorProject";
import { outerLoopWallsRaised } from "../../domain/interiorProject/wallRaise";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";
import { lightsInCutout, moveCeilingCutoutWithLights } from "../../domain/livingRoom/lightCutoutMount";

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

type Drag = { cutoutId: string; start: Point2Mm; delta: Point2Mm };

/**
 * Ceiling plan layer (Layers → Ceiling, or while the cutout tool is armed): the
 * slab the 3D view compiles and its cutouts. Sits above the object layers so a
 * cutout under a cabinet glyph stays visible. In Select mode a cutout drags;
 * fixtures centred in it follow at read time.
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
  // Only cutouts still inside the room are holes in the slab; a stranded one is drawn as an outline to drag back in.
  const inCeiling = new Set(compiledCeilingCutouts(props.project, props.room).map((cutout) => cutout.id));
  const slabPath = [polygon.outer, ...polygon.holes, ...cutouts.filter((cutout) => inCeiling.has(cutout.id)).map((cutout) => cutout.polygon)]
    .map(loopPath).join(" ");
  const movable = props.interactive && Boolean(props.onPatchDocument);
  const snap = (value: number) => Math.round(value / props.snapSizeMm) * props.snapSizeMm;
  const begin = (event: ReactPointerEvent<SVGGElement>, cutoutId: string) => {
    if (!movable || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ cutoutId, start: worldPoint(event), delta: { x: 0, z: 0 } });
  };
  const move = (event: ReactPointerEvent<SVGGElement>) => {
    if (!drag) return;
    const point = worldPoint(event);
    setDrag({ ...drag, delta: { x: snap(point.x - drag.start.x), z: snap(point.z - drag.start.z) } });
  };
  const finish = (event: ReactPointerEvent<SVGGElement>) => {
    if (!drag) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const { cutoutId, delta } = drag;
    setDrag(null);
    if (delta.x === 0 && delta.z === 0) {
      const hosted = lightsInCutout(props.project, cutoutId)[0];
      if (hosted) props.onSelectLight?.(hosted.id);
      return;
    }
    // Refused moves (out of the room, onto another cutout) are not recorded as a change.
    if (moveCeilingCutoutWithLights(props.project, roomId, cutoutId, delta) === props.project) return;
    props.onPatchDocument?.((current) => moveCeilingCutoutWithLights(current, roomId, cutoutId, delta), "Moved ceiling cutout.");
  };
  return (
    <g className="lr-plan-ceiling-layer" data-testid="lr-plan-ceiling-layer" pointerEvents="none">
      <defs>
        <pattern id="lr-ceiling-hatch" width="420" height="420" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="420" className="lr-ceiling-hatch-line" />
        </pattern>
      </defs>
      <path data-testid="lr-plan-ceiling" className="lr-plan-ceiling" d={slabPath} fillRule="evenodd" />
      {cutouts.map((cutout) => {
        const size = ceilingCutoutSizeMm(cutout);
        const dragging = drag?.cutoutId === cutout.id ? drag.delta : null;
        const stranded = !inCeiling.has(cutout.id);
        return (
          <g key={cutout.id} className={`lr-plan-cutout${movable ? " is-movable" : ""}${dragging ? " is-dragging" : ""}${stranded ? " is-stranded" : ""}`}
            data-stranded={stranded ? "1" : undefined}
            data-ceiling-cutout-id={cutout.id} pointerEvents={movable ? "auto" : "none"}
            transform={dragging ? `translate(${dragging.x} ${dragging.z})` : undefined}
            onPointerDown={(event) => begin(event, cutout.id)} onPointerMove={move}
            onPointerUp={finish} onPointerCancel={finish}>
            <path d={loopPath(cutout.polygon)} />
            <text x={size.centerX} y={size.centerZ}>
              {cutout.label ?? cutout.id} · {formatPlanDimension(size.widthMm, props.unit)} × {formatPlanDimension(size.depthMm, props.unit)}{stranded ? " · not in ceiling" : ""}
            </text>
          </g>
        );
      })}
    </g>
  );
}
