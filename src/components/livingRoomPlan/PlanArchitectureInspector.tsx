import {
  polygonBounds,
  roomPlanPolygon,
  selectWallsForRoom,
  STANDARD_WALL_HEIGHTS_MM,
  STANDARD_WALL_THICKNESSES_MM,
  type InteriorProject,
  type InteriorRoomEntity,
  type Size3Mm,
  type WallEntity,
  type WallPlanPatch,
} from "../../domain/interiorProject";
import {
  formatPlanDimension,
  finishMapUrl,
  wallLengthMm,
  type PlanDisplayUnit,
} from "../../domain/livingRoom";
import { NumberField } from "./NumberField";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";
import { HeightPresetRow } from "./HeightPresetRow";
import { WallRaiseControls } from "./WallRaiseControls";
import { WallGeometryFields } from "./WallGeometryFields";
import { RoomFinishFields } from "./RoomFinishFields";

type ImportApply = { wallId?: string; floor?: boolean; ceiling?: boolean };

type Props = {
  project: InteriorProject;
  room: InteriorRoomEntity;
  wall: WallEntity | null;
  onRoomDimensions: (dimensions: Size3Mm) => void;
  onUpdateWall: (wallId: string, patch: { thicknessMm?: number; heightMm?: number }) => void;
  unit: PlanDisplayUnit;
  onSetWallMaterial: (wallId: string, materialId: string | null) => void;
  onSetFloorMaterial: (materialId: string) => void;
  onSetCeilingMaterial: (materialId: string) => void;
  onRaiseWalls: (wallIds: string[], raised: boolean, heightMm?: number) => void;
  onOffsetWall: (wallId: string, offsetMm: number) => void;
  onOffsetLoop: (offsetMm: number) => void;
  onSetWallPlan: (wallId: string, patch: WallPlanPatch) => void;
  onImportFinish: (file: File, apply?: ImportApply) => void;
  onSetFinishUv: (materialId: string, patch: { uvScaleMm?: number; uvRotationDeg?: number }) => void;
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
  const roomWallIds = selectWallsForRoom(props.project, room.id).map((item) => item.id);
  const finish = wall?.materialId
    ? props.project.materials.find((material) => material.id === wall.materialId)
    : null;
  return <>
    <section className="lr-architecture-inspector">
      <div className="lr-inspector-section-heading"><h3>Room</h3><span>{room.name}</span></div>
      <p className="lr-authoring-hint">2D plan stays independent. Raise walls to generate 3D. Units are millimetres.</p>
      <div className="lr-room-preview" aria-label={`${room.name} room preview`}>
        <svg viewBox="0 0 180 110" aria-hidden="true"><path d={previewPath} />
          <text x="90" y="59">{formatPlanDimension(room.dimensions.widthMm, props.unit)} × {formatPlanDimension(room.dimensions.depthMm, props.unit)}</text></svg>
      </div>
      <NumberField label="Width" value={room.dimensions.widthMm}
        onChange={(widthMm) => props.onRoomDimensions({ ...room.dimensions, widthMm })} />
      <NumberField label="Depth" value={room.dimensions.depthMm}
        onChange={(depthMm) => props.onRoomDimensions({ ...room.dimensions, depthMm })} />
      <NumberField label="Ceiling height" value={room.dimensions.heightMm}
        onChange={(heightMm) => props.onRoomDimensions({ ...room.dimensions, heightMm })} />
      <HeightPresetRow label="Standard ceiling" values={STANDARD_WALL_HEIGHTS_MM} value={room.dimensions.heightMm}
        onChange={(heightMm) => props.onRoomDimensions({ ...room.dimensions, heightMm })} />
      {!wall ? <WallRaiseControls wall={null} roomWallIds={roomWallIds} heightMm={room.dimensions.heightMm}
        onRaise={props.onRaiseWalls} onOffsetLoop={props.onOffsetLoop} /> : null}
      {!wall ? <RoomFinishFields project={props.project} room={room}
        onSetFloorMaterial={props.onSetFloorMaterial} onSetCeilingMaterial={props.onSetCeilingMaterial}
        onImportFinish={props.onImportFinish} onSetFinishUv={props.onSetFinishUv} /> : null}
    </section>
    {wall ? <section className="lr-architecture-inspector lr-wall-inspector">
      <div className="lr-inspector-section-heading"><h3>Wall</h3><span>{wall.extensions?.isPartition ? "Partition" : "Architecture"}</span></div>
      <div className="lr-wall-preview" aria-label={`Wall ${wall.id} preview`}>
        <span className="lr-wall-preview-line" style={{ background: props.project.materials.find((material) => material.id === wall.materialId)?.color ?? "#7d8c80" }} />
        <strong>{formatPlanDimension(wallLengthMm(wall), props.unit)}</strong><small>Length</small>
      </div>
      <WallGeometryFields wall={wall} unit={props.unit} onChange={(patch) => props.onSetWallPlan(wall.id, patch)} />
      <NumberField label="Thickness" value={wall.thicknessMm}
        onChange={(thicknessMm) => props.onUpdateWall(wall.id, { thicknessMm })} />
      <HeightPresetRow label="Thickness" values={STANDARD_WALL_THICKNESSES_MM} value={wall.thicknessMm}
        onChange={(thicknessMm) => props.onUpdateWall(wall.id, { thicknessMm })} />
      <NumberField label="Height" value={wall.heightMm}
        onChange={(heightMm) => props.onUpdateWall(wall.id, { heightMm })} />
      <HeightPresetRow label="Standard height" values={STANDARD_WALL_HEIGHTS_MM} value={wall.heightMm}
        onChange={(heightMm) => props.onUpdateWall(wall.id, { heightMm })} />
      <WallRaiseControls wall={wall} roomWallIds={roomWallIds} heightMm={wall.heightMm}
        onRaise={props.onRaiseWalls} onOffset={(offsetMm) => props.onOffsetWall(wall.id, offsetMm)} />
      <h4>Wall material</h4>
      <MaterialSwatchGrid materials={props.project.materials} activeMaterialId={wall.materialId ?? null} compact
        onPick={(materialId) => props.onSetWallMaterial(wall.id, materialId)}
        onImport={(file) => props.onImportFinish(file, { wallId: wall.id })} />
      {finish && finishMapUrl(finish) ? <>
        <NumberField label="Tile mm" value={Number(finish.extensions?.uvScaleMm) || 1000}
          onChange={(uvScaleMm) => props.onSetFinishUv(finish.id, { uvScaleMm })} />
        <NumberField label="Rotate °" value={Number(finish.extensions?.uvRotationDeg) || 0}
          onChange={(uvRotationDeg) => props.onSetFinishUv(finish.id, { uvRotationDeg })} />
      </> : null}
      <button type="button" className="lr-clear-material" onClick={() => props.onSetWallMaterial(wall.id, null)}>Clear wall material</button>
    </section> : <section className="lr-inspector-empty"><h3>Wall</h3><p>Select a wall to edit length, angle, thickness, height, and raise it into 3D.</p></section>}
  </>;
}
