import { isGeneratedRoomSurface, type InteriorProject, type Point2Mm } from "../../domain/interiorProject";

function loopPath(points: Point2Mm[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.z}`).join(" ") + " Z";
}

export function PlanSurfaceZonesLayer(props: {
  project: InteriorProject;
  roomId: string;
  activeSurfaceId: string | null;
  selectable: boolean;
  onSelectSurface: (surfaceId: string | null) => void;
}) {
  const materials = new Map(props.project.materials.map((material) => [material.id, material]));
  const zones = props.project.surfaces.filter((surface) =>
    surface.roomId === props.roomId
    && !isGeneratedRoomSurface(surface)
    && (surface.polygon?.length ?? 0) >= 3);
  return (
    <g className="lr-surface-zones" aria-label="Surface zones" pointerEvents={props.selectable ? "auto" : "none"}>
      {zones.map((surface) => {
        const color = materials.get(surface.materialId ?? "")?.color ?? "#c8b087";
        const active = surface.id === props.activeSurfaceId;
        return (
          <path
            key={surface.id}
            data-surface-zone-id={surface.id}
            d={loopPath(surface.polygon!)}
            fill={color}
            fillOpacity={active ? ".72" : ".48"}
            stroke={active ? "#263940" : "#7a8a84"}
            strokeWidth={active ? 16 : 10}
            className={active ? "is-active" : ""}
            onPointerDown={(event) => {
              event.stopPropagation();
              props.onSelectSurface(surface.id);
            }}
          />
        );
      })}
    </g>
  );
}
