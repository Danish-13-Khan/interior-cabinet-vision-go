import type { InteriorProject, InteriorRoomEntity } from "../../domain/interiorProject";
import { finishMapUrl, type FinishUvPatch } from "../../domain/livingRoom";
import type { FinishUvRebind } from "../../domain/catalog/finishRebind";
import { FinishUvFields } from "./FinishUvFields";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";

type ImportApply = { wallId?: string; floor?: boolean; ceiling?: boolean };

type Props = {
  project: InteriorProject;
  room: InteriorRoomEntity;
  onSetFloorMaterial: (materialId: string) => void;
  onSetCeilingMaterial: (materialId: string) => void;
  onImportFinish: (file: File, apply?: ImportApply) => void;
  onSetFinishUv: (materialId: string, patch: FinishUvPatch, rebind?: FinishUvRebind) => void;
};

function surfaceMaterial(project: InteriorProject, roomId: string, kind: "floor" | "ceiling") {
  const zone = project.surfaces.find((surface) => surface.roomId === roomId && surface.kind === kind);
  const key = kind === "floor" ? "floorMaterialId" : "ceilingMaterialId";
  const room = project.rooms.find((item) => item.id === roomId);
  const extension = room?.extensions?.[key];
  return zone?.materialId ?? (typeof extension === "string" ? extension : null);
}

function FinishUv({
  project, materialId, rebind, onSetFinishUv,
}: {
  project: InteriorProject;
  materialId: string | null;
  rebind: FinishUvRebind;
  onSetFinishUv: Props["onSetFinishUv"];
}) {
  const finish = materialId ? project.materials.find((material) => material.id === materialId) : null;
  if (!finish || !finishMapUrl(finish)) return null;
  return (
    <FinishUvFields
      compact
      values={{
        uvScaleMm: Number(finish.extensions?.uvScaleMm) || 1000,
        uvRotationDeg: Number(finish.extensions?.uvRotationDeg) || 0,
        uvOffsetU: Number(finish.extensions?.uvOffsetU) || 0,
        uvOffsetV: Number(finish.extensions?.uvOffsetV) || 0,
      }}
      onChange={(patch) => onSetFinishUv(finish.id, patch, rebind)}
    />
  );
}

export function RoomFinishFields(props: Props) {
  const floorId = surfaceMaterial(props.project, props.room.id, "floor");
  const ceilingId = surfaceMaterial(props.project, props.room.id, "ceiling");
  return (
    <div className="lr-room-finishes">
      <h4>Floor finish</h4>
      <MaterialSwatchGrid materials={props.project.materials} activeMaterialId={floorId} compact
        onPick={props.onSetFloorMaterial}
        onImport={(file) => props.onImportFinish(file, { floor: true })} />
      <FinishUv project={props.project} materialId={floorId} rebind={{ kind: "floor" }} onSetFinishUv={props.onSetFinishUv} />
      <h4>Ceiling finish</h4>
      <MaterialSwatchGrid materials={props.project.materials} activeMaterialId={ceilingId} compact
        onPick={props.onSetCeilingMaterial}
        onImport={(file) => props.onImportFinish(file, { ceiling: true })} />
      <FinishUv project={props.project} materialId={ceilingId} rebind={{ kind: "ceiling" }} onSetFinishUv={props.onSetFinishUv} />
    </div>
  );
}
