import {
  ceilingCutoutSizeMm, readCeilingCutouts, roomPlanPolygon,
  type InteriorProject, type InteriorRoomEntity, type Point2Mm,
} from "../../domain/interiorProject";
import { outerLoopWallsRaised } from "../../domain/interiorProject/wallRaise";
import { formatPlanDimension, type PlanDisplayUnit } from "../../domain/livingRoom";

function loopPath(points: Point2Mm[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.z}`).join(" ") + " Z";
}

/**
 * Ceiling plan layer (Layers → Ceiling, or while the cutout tool is armed): the
 * slab the 3D view compiles and its cutouts. Sits above the object layers so a
 * cutout under a cabinet glyph stays visible. Never catches the pointer.
 */
export function PlanCeilingLayer(props: {
  project: InteriorProject;
  room: InteriorRoomEntity | null;
  visible: boolean;
  unit: PlanDisplayUnit;
}) {
  if (!props.visible || !props.room) return null;
  const polygon = roomPlanPolygon(props.project, props.room.id);
  if (!polygon || !outerLoopWallsRaised(props.project, props.room)) return null;
  const cutouts = readCeilingCutouts(props.room);
  const slabPath = [polygon.outer, ...polygon.holes, ...cutouts.map((cutout) => cutout.polygon)]
    .map(loopPath).join(" ");
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
        return (
          <g key={cutout.id} className="lr-plan-cutout" data-ceiling-cutout-id={cutout.id}>
            <path d={loopPath(cutout.polygon)} />
            <text x={size.centerX} y={size.centerZ}>
              {cutout.label ?? cutout.id} · {formatPlanDimension(size.widthMm, props.unit)} × {formatPlanDimension(size.depthMm, props.unit)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
