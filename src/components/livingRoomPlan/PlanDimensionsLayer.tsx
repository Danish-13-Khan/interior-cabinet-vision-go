import type { InteriorRoomEntity, WallEntity } from "../../domain/interiorProject";
import {
  formatPlanDimension,
  planDimensionPair,
  wallLabelPose,
  wallLengthMm,
  type PlanReadabilitySettings,
} from "../../domain/livingRoom";

function HorizontalDimension({ y, width, label }: { y: number; width: number; label: string }) {
  return <g><line x1={-width / 2} y1={y} x2={width / 2} y2={y} />
    <line x1={-width / 2} y1={y - 70} x2={-width / 2} y2={y + 70} />
    <line x1={width / 2} y1={y - 70} x2={width / 2} y2={y + 70} />
    <text x="0" y={y - 45}>{label}</text></g>;
}

function VerticalDimension({ x, depth, label }: { x: number; depth: number; label: string }) {
  return <g><line x1={x} y1={-depth / 2} x2={x} y2={depth / 2} />
    <line x1={x - 70} y1={-depth / 2} x2={x + 70} y2={-depth / 2} />
    <line x1={x - 70} y1={depth / 2} x2={x + 70} y2={depth / 2} />
    <text transform={`translate(${x - 45} 0) rotate(-90)`}>{label}</text></g>;
}

export function PlanDimensionsLayer({ room, walls, activeWallId, settings }: {
  room: InteriorRoomEntity; walls: WallEntity[]; activeWallId: string | null; settings: PlanReadabilitySettings;
}) {
  const pair = planDimensionPair(room.dimensions, walls);
  const format = (value: number) => formatPlanDimension(value, settings.unit);
  const widthEdge = room.dimensions.depthMm / 2;
  const depthEdge = -room.dimensions.widthMm / 2;
  return <>
    <g className="lr-plan-dimension-pairs" aria-label="Room dimension pairs">
      <HorizontalDimension y={widthEdge + 250} width={pair.innerWidthMm} label={`Clear ${format(pair.innerWidthMm)}`} />
      <HorizontalDimension y={widthEdge + 500} width={pair.outerWidthMm} label={`Overall ${format(pair.outerWidthMm)}`} />
      <VerticalDimension x={depthEdge - 250} depth={pair.innerDepthMm} label={`Clear ${format(pair.innerDepthMm)}`} />
      <VerticalDimension x={depthEdge - 500} depth={pair.outerDepthMm} label={`Overall ${format(pair.outerDepthMm)}`} />
    </g>
    <g className="lr-wall-length-labels">
      {walls.filter((wall) => wall.visible && (settings.alwaysShowWallLengths || wall.id === activeWallId)).map((wall) => {
        const pose = wallLabelPose(wall);
        return <text key={wall.id} data-wall-length-id={wall.id} transform={`translate(${pose.x} ${pose.z}) rotate(${pose.angle})`}>
          {format(wallLengthMm(wall))}
        </text>;
      })}
    </g>
  </>;
}
