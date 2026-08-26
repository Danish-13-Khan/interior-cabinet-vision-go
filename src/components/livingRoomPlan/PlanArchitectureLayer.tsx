import type { PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, InteriorRoomEntity } from "../../domain/interiorProject";
import { getLivingRoomPlanUnderlay, type PlanVisualStyle } from "../../domain/livingRoom";

export function PlanArchitectureLayer(props: {
  project: InteriorProject; room: InteriorRoomEntity; snapSizeMm: number; showGrid: boolean;
  activeWallId: string | null; visualStyle: PlanVisualStyle;
  onPaper: () => void; onWall: (event: ReactPointerEvent<SVGLineElement>, wallId: string) => void;
}) {
  const underlay = getLivingRoomPlanUnderlay(props.project);
  const materials = new Map(props.project.materials.map((material) => [material.id, material]));
  const floorId = typeof props.room.extensions?.floorMaterialId === "string" ? props.room.extensions.floorMaterialId : "";
  const floorColor = materials.get(floorId)?.color ?? "#e8dfd0";
  const width = props.room.dimensions.widthMm;
  const depth = props.room.dimensions.depthMm;
  return <>
    <defs>
      <pattern id="lr-grid-small" width={props.snapSizeMm} height={props.snapSizeMm} patternUnits="userSpaceOnUse"><path d={`M ${props.snapSizeMm} 0 L 0 0 0 ${props.snapSizeMm}`} className="lr-grid-line" /></pattern>
      <pattern id="lr-grid-major" width={props.snapSizeMm * 10} height={props.snapSizeMm * 10} patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="url(#lr-grid-small)" /><path d={`M ${props.snapSizeMm * 10} 0 L 0 0 0 ${props.snapSizeMm * 10}`} className="lr-grid-major-line" /></pattern>
    </defs>
    <rect x={-20000} y={-20000} width={40000} height={40000} className="lr-plan-paper" onPointerDown={props.onPaper} />
    {underlay ? <image href={underlay.dataUrl} x={-underlay.widthMm / 2} y={-underlay.heightMm / 2} width={underlay.widthMm} height={underlay.heightMm}
      opacity={underlay.opacity} preserveAspectRatio="none" className="lr-plan-underlay-image"
      transform={`translate(${underlay.xMm ?? 0} ${underlay.zMm ?? 0}) rotate(${underlay.rotationDeg ?? 0})`} /> : null}
    <rect x={-width / 2} y={-depth / 2} width={width} height={depth} fill={floorColor} opacity={props.visualStyle === "fill" ? ".55" : "0"} pointerEvents="none" />
    {props.showGrid ? <rect x={-width / 2} y={-depth / 2} width={width} height={depth} fill="url(#lr-grid-major)" /> : null}
    <line x1={-width / 2} y1="0" x2={width / 2} y2="0" className="lr-center-line" />
    <line x1="0" y1={-depth / 2} x2="0" y2={depth / 2} className="lr-center-line" />
    {props.project.walls.filter((wall) => wall.visible).map((wall) => <line key={wall.id} data-wall-id={wall.id}
      x1={wall.start.x} y1={wall.start.z} x2={wall.end.x} y2={wall.end.z}
      className={`lr-wall-line ${wall.id === props.activeWallId ? "is-active" : ""}`}
      style={{ stroke: wall.id === props.activeWallId ? undefined : materials.get(wall.materialId ?? "")?.color }}
      onPointerDown={(event) => props.onWall(event, wall.id)} />)}
  </>;
}
