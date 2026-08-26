import type { PointerEvent as ReactPointerEvent } from "react";
import { roomPlanViewBounds, type InteriorProject, type InteriorRoomEntity } from "../../domain/interiorProject";
import { getLivingRoomPlanUnderlay, type PlanVisualStyle } from "../../domain/livingRoom";

export function PlanArchitectureLayer(props: {
  project: InteriorProject; room: InteriorRoomEntity; snapSizeMm: number; showGrid: boolean;
  activeWallId: string | null; visualStyle: PlanVisualStyle;
  onPaper: (event: ReactPointerEvent<SVGRectElement>) => void; onWall: (event: ReactPointerEvent<SVGLineElement>, wallId: string) => void;
}) {
  const underlay = getLivingRoomPlanUnderlay(props.project);
  const materials = new Map(props.project.materials.map((material) => [material.id, material]));
  const floorId = typeof props.room.extensions?.floorMaterialId === "string" ? props.room.extensions.floorMaterialId : "";
  const floorColor = materials.get(floorId)?.color ?? "#e8dfd0";
  const bounds = roomPlanViewBounds(props.project, props.room.id);
  return <>
    <defs>
      <pattern id="lr-grid-small" width={props.snapSizeMm} height={props.snapSizeMm} patternUnits="userSpaceOnUse"><path d={`M ${props.snapSizeMm} 0 L 0 0 0 ${props.snapSizeMm}`} className="lr-grid-line" /></pattern>
      <pattern id="lr-grid-major" width={props.snapSizeMm * 10} height={props.snapSizeMm * 10} patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="url(#lr-grid-small)" /><path d={`M ${props.snapSizeMm * 10} 0 L 0 0 0 ${props.snapSizeMm * 10}`} className="lr-grid-major-line" /></pattern>
    </defs>
    <rect data-plan-paper x={-20000} y={-20000} width={40000} height={40000} className="lr-plan-paper" onPointerDown={props.onPaper} />
    {underlay ? <image href={underlay.dataUrl} x={-underlay.widthMm / 2} y={-underlay.heightMm / 2} width={underlay.widthMm} height={underlay.heightMm}
      opacity={underlay.opacity} preserveAspectRatio="none" className="lr-plan-underlay-image" pointerEvents="none"
      transform={`translate(${underlay.xMm ?? 0} ${underlay.zMm ?? 0}) rotate(${underlay.rotationDeg ?? 0})`} /> : null}
    <rect x={bounds.minX} y={bounds.minZ} width={bounds.widthMm} height={bounds.depthMm} fill={floorColor} opacity={props.visualStyle === "fill" ? ".55" : "0"} pointerEvents="none" />
    {props.showGrid ? <rect x={bounds.minX} y={bounds.minZ} width={bounds.widthMm} height={bounds.depthMm} fill="url(#lr-grid-major)" pointerEvents="none" /> : null}
    <line x1={bounds.minX} y1={bounds.centerZ} x2={bounds.maxX} y2={bounds.centerZ} className="lr-center-line" pointerEvents="none" />
    <line x1={bounds.centerX} y1={bounds.minZ} x2={bounds.centerX} y2={bounds.maxZ} className="lr-center-line" pointerEvents="none" />
    {props.project.walls.filter((wall) => wall.visible).map((wall) => <line key={wall.id} data-wall-id={wall.id}
      x1={wall.start.x} y1={wall.start.z} x2={wall.end.x} y2={wall.end.z}
      className={`lr-wall-line ${wall.id === props.activeWallId ? "is-active" : ""}`}
      style={{ stroke: wall.id === props.activeWallId ? undefined : materials.get(wall.materialId ?? "")?.color }}
      onPointerDown={(event) => props.onWall(event, wall.id)} />)}
  </>;
}
