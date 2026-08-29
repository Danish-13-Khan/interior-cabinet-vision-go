import type { PointerEvent as ReactPointerEvent } from "react";
import { roomPlanPolygon, roomPlanViewBounds, selectWallsForRoom, type InteriorProject, type InteriorRoomEntity, type Point2Mm } from "../../domain/interiorProject";
import { getLivingRoomPlanUnderlay, type PlanVisualStyle } from "../../domain/livingRoom";

export function PlanArchitectureLayer(props: {
  project: InteriorProject; room: InteriorRoomEntity; snapSizeMm: number; showGrid: boolean;
  activeWallId: string | null; visualStyle: PlanVisualStyle;
  previewNodes?: Map<string, Point2Mm>;
  onPaper: (event: ReactPointerEvent<SVGRectElement>) => void; onWall: (event: ReactPointerEvent<SVGLineElement>, wallId: string) => void;
}) {
  const underlay = getLivingRoomPlanUnderlay(props.project);
  const materials = new Map(props.project.materials.map((material) => [material.id, material]));
  const floorId = typeof props.room.extensions?.floorMaterialId === "string" ? props.room.extensions.floorMaterialId : "";
  const floorColor = materials.get(floorId)?.color ?? "#e8dfd0";
  const bounds = roomPlanViewBounds(props.project, props.room.id);
  const polygon = roomPlanPolygon(props.project, props.room.id);
  const loopPath = (points: Point2Mm[]) => points.map((point, index) =>
    `${index ? "L" : "M"}${point.x} ${point.z}`).join(" ") + " Z";
  const floorPath = polygon
    ? [polygon.outer, ...polygon.holes].map(loopPath).join(" ")
    : `M${bounds.minX} ${bounds.minZ} H${bounds.maxX} V${bounds.maxZ} H${bounds.minX} Z`;
  const clipId = "lr-active-room-floor-clip";
  const roomWallIds = new Set(selectWallsForRoom(props.project, props.room.id).map((wall) => wall.id));
  return <>
    <defs>
      <pattern id="lr-grid-small" width={props.snapSizeMm} height={props.snapSizeMm} patternUnits="userSpaceOnUse"><path d={`M ${props.snapSizeMm} 0 L 0 0 0 ${props.snapSizeMm}`} className="lr-grid-line" /></pattern>
      <pattern id="lr-grid-major" width={props.snapSizeMm * 10} height={props.snapSizeMm * 10} patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="url(#lr-grid-small)" /><path d={`M ${props.snapSizeMm * 10} 0 L 0 0 0 ${props.snapSizeMm * 10}`} className="lr-grid-major-line" /></pattern>
      <clipPath id={clipId}><path d={floorPath} fillRule="evenodd" /></clipPath>
    </defs>
    <rect data-plan-paper x={-20000} y={-20000} width={40000} height={40000} className="lr-plan-paper" onPointerDown={props.onPaper} />
    {underlay ? <image href={underlay.dataUrl} x={-underlay.widthMm / 2} y={-underlay.heightMm / 2} width={underlay.widthMm} height={underlay.heightMm}
      opacity={underlay.opacity} preserveAspectRatio="none" className="lr-plan-underlay-image" pointerEvents="none"
      transform={`translate(${underlay.xMm ?? 0} ${underlay.zMm ?? 0}) rotate(${underlay.rotationDeg ?? 0})`} /> : null}
    <path data-room-floor={props.room.id} d={floorPath} fill={floorColor} fillRule="evenodd" opacity={props.visualStyle === "fill" ? ".55" : "0"} pointerEvents="none" />
    {props.showGrid ? <rect x={bounds.minX} y={bounds.minZ} width={bounds.widthMm} height={bounds.depthMm} fill="url(#lr-grid-major)" clipPath={`url(#${clipId})`} pointerEvents="none" /> : null}
    <line x1={bounds.minX} y1={bounds.centerZ} x2={bounds.maxX} y2={bounds.centerZ} className="lr-center-line" pointerEvents="none" />
    <line x1={bounds.centerX} y1={bounds.minZ} x2={bounds.centerX} y2={bounds.maxZ} className="lr-center-line" pointerEvents="none" />
    {props.project.walls.filter((wall) => wall.visible).map((wall) => {
      const start = (wall.startNodeId && props.previewNodes?.get(wall.startNodeId)) || wall.start;
      const end = (wall.endNodeId && props.previewNodes?.get(wall.endNodeId)) || wall.end;
      return <line key={wall.id} data-wall-id={wall.id} data-room-id={roomWallIds.has(wall.id) ? props.room.id : undefined}
        x1={start.x} y1={start.z} x2={end.x} y2={end.z}
        className={`lr-wall-line ${wall.extensions?.isPartition ? "is-partition" : ""} ${wall.id === props.activeWallId ? "is-active" : ""}`}
        style={{ stroke: wall.id === props.activeWallId ? undefined : materials.get(wall.materialId ?? "")?.color }}
        onPointerDown={(event) => props.onWall(event, wall.id)} />;
    })}
  </>;
}
