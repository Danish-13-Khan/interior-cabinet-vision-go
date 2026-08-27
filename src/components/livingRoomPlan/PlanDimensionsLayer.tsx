import { roomPlanViewBounds, selectRoomWalls, type InteriorProject, type InteriorRoomEntity } from "../../domain/interiorProject";
import {
  formatPlanDimension,
  topologyPlanDimensionPair,
  wallLabelPose,
  wallLengthMm,
  type PlanReadabilitySettings,
} from "../../domain/livingRoom";

function HorizontalDimension({ x, y, width, label }: { x: number; y: number; width: number; label: string }) {
  return <g><line x1={x - width / 2} y1={y} x2={x + width / 2} y2={y} />
    <line x1={x - width / 2} y1={y - 70} x2={x - width / 2} y2={y + 70} />
    <line x1={x + width / 2} y1={y - 70} x2={x + width / 2} y2={y + 70} />
    <text x={x} y={y - 45}>{label}</text></g>;
}

function VerticalDimension({ x, z, depth, label }: { x: number; z: number; depth: number; label: string }) {
  return <g><line x1={x} y1={z - depth / 2} x2={x} y2={z + depth / 2} />
    <line x1={x - 70} y1={z - depth / 2} x2={x + 70} y2={z - depth / 2} />
    <line x1={x - 70} y1={z + depth / 2} x2={x + 70} y2={z + depth / 2} />
    <text transform={`translate(${x - 45} ${z}) rotate(-90)`}>{label}</text></g>;
}

export function PlanDimensionsLayer({ project, room, activeWallId, settings }: {
  project: InteriorProject; room: InteriorRoomEntity; activeWallId: string | null; settings: PlanReadabilitySettings;
}) {
  const pair = topologyPlanDimensionPair(project, room.id);
  const bounds = roomPlanViewBounds(project, room.id);
  const walls = selectRoomWalls(project, room.id);
  const format = (value: number) => formatPlanDimension(value, settings.unit);
  const widthEdge = bounds.maxZ;
  const depthEdge = bounds.minX;
  return <>
    <g className="lr-plan-dimension-pairs" aria-label="Room dimension pairs" pointerEvents="none">
      <HorizontalDimension x={bounds.centerX} y={widthEdge + 250} width={pair.innerWidthMm} label={`Clear ${format(pair.innerWidthMm)}`} />
      <HorizontalDimension x={bounds.centerX} y={widthEdge + 500} width={pair.outerWidthMm} label={`Overall ${format(pair.outerWidthMm)}`} />
      <VerticalDimension x={depthEdge - 250} z={bounds.centerZ} depth={pair.innerDepthMm} label={`Clear ${format(pair.innerDepthMm)}`} />
      <VerticalDimension x={depthEdge - 500} z={bounds.centerZ} depth={pair.outerDepthMm} label={`Overall ${format(pair.outerDepthMm)}`} />
    </g>
    <g className="lr-wall-length-labels" pointerEvents="none">
      {walls.filter((wall) => wall.visible && (settings.alwaysShowWallLengths || wall.id === activeWallId)).map((wall) => {
        const pose = wallLabelPose(wall);
        return <text key={wall.id} data-wall-length-id={wall.id} transform={`translate(${pose.x} ${pose.z}) rotate(${pose.angle})`}>
          {format(wallLengthMm(wall))}
        </text>;
      })}
    </g>
  </>;
}
