import { polygonBounds, roomPlanPolygon, type InteriorProject, type InteriorRoomEntity, type Size3Mm, type WallEntity } from "../../domain/interiorProject";
import { formatPlanDimension, wallLengthMm, type PlanDisplayUnit } from "../../domain/livingRoom";
import { NumberField } from "./NumberField";

type Props = {
  project: InteriorProject;
  room: InteriorRoomEntity;
  wall: WallEntity | null;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onUpdateWall: (wallId: string, patch: { thicknessMm?: number; heightMm?: number }) => void;
  unit: PlanDisplayUnit;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
};

export function PlanArchitectureInspector(props: Props) {
  const { room, wall } = props;
  const polygon = roomPlanPolygon(props.project, room.id)?.outer ?? [];
  const bounds = polygon.length ? polygonBounds(polygon) : null;
  const previewPath = polygon.map((point, index) => {
    const x = 18 + ((point.x - (bounds?.minX ?? 0)) / Math.max(1, bounds?.widthMm ?? 1)) * 144;
    const y = 16 + ((point.z - (bounds?.minZ ?? 0)) / Math.max(1, bounds?.depthMm ?? 1)) * 78;
    return `${index ? "L" : "M"}${x} ${y}`;
  }).join(" ") + (polygon.length ? " Z" : "");
  return <>
    <section className="lr-architecture-inspector">
      <div className="lr-inspector-section-heading"><h3>Room</h3><span>{room.name}</span></div>
      <div className="lr-room-preview" aria-label={`${room.name} room preview`}>
        <svg viewBox="0 0 180 110" aria-hidden="true"><path d={previewPath} />
          <text x="90" y="59">{formatPlanDimension(room.dimensions.widthMm, props.unit)} × {formatPlanDimension(room.dimensions.depthMm, props.unit)}</text></svg>
      </div>
      <NumberField label="Width" value={room.dimensions.widthMm}
        onChange={(widthMm) => props.onRoomDimensions({ ...room.dimensions, widthMm })} />
      <NumberField label="Depth" value={room.dimensions.depthMm}
        onChange={(depthMm) => props.onRoomDimensions({ ...room.dimensions, depthMm })} />
      <NumberField label="Height" value={room.dimensions.heightMm}
        onChange={(heightMm) => props.onRoomDimensions({ ...room.dimensions, heightMm })} />
    </section>
    {wall ? <section className="lr-architecture-inspector lr-wall-inspector">
      <div className="lr-inspector-section-heading"><h3>Wall</h3><span>{wall.extensions?.isPartition ? "Partition" : "Architecture"}</span></div>
      <div className="lr-wall-preview" aria-label={`Wall ${wall.id} preview`}>
        <span className="lr-wall-preview-line" style={{ background: props.project.materials.find((material) => material.id === wall.materialId)?.color ?? "#7d8c80" }} />
        <strong>{formatPlanDimension(wallLengthMm(wall), props.unit)}</strong><small>Length</small>
      </div>
      <NumberField label="Thickness" value={wall.thicknessMm}
        onChange={(thicknessMm) => props.onUpdateWall(wall.id, { thicknessMm })} />
      <NumberField label="Height" value={wall.heightMm}
        onChange={(heightMm) => props.onUpdateWall(wall.id, { heightMm })} />
      <label className="lr-select-field"><span>Wall material</span>
        <select value={wall.materialId ?? ""} onChange={(event) => props.onSetWallMaterial(wall.id, event.target.value || null)}>
          <option value="">No material</option>
          {props.project.materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
        </select>
      </label>
    </section> : <section className="lr-inspector-empty"><h3>Wall</h3><p>Select a wall in the plan to edit its construction and finish.</p></section>}
  </>;
}
