import { useMemo, useState } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { commonMaterialSlots, primaryMaterialId } from "../../domain/livingRoom";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";

type Props = {
  project: InteriorProject;
  activeWallId: string | null;
  selectedObjects: InteriorObjectEntity[];
  onFloor: (materialId: string) => void;
  onWall: (wallId: string, materialId: string) => void;
  onApplyToSelection: (materialId: string, slotName?: string) => void;
};

type PaintTarget = "floor" | "wall" | "selection";

export function SurfacePaintPanel({
  project, activeWallId, selectedObjects, onFloor, onWall, onApplyToSelection,
}: Props) {
  const wall = project.walls.find((item) => item.id === activeWallId) ?? project.walls[0] ?? null;
  const [target, setTarget] = useState<PaintTarget>(selectedObjects.length ? "selection" : "floor");
  const [slot, setSlot] = useState("");
  const sharedSlots = useMemo(() => commonMaterialSlots(selectedObjects), [selectedObjects]);
  const activeSlot = sharedSlots.includes(slot) ? slot : sharedSlots[0] ?? "";
  const canPaintSelection = selectedObjects.length > 0 && sharedSlots.length > 0;

  const activeMaterialId = target === "floor"
    ? project.surfaces.find((surface) => surface.roomId === project.activeRoomId && surface.kind === "floor")?.materialId
      ?? (project.rooms.find((room) => room.id === project.activeRoomId)?.extensions?.floorMaterialId as string | undefined)
    : target === "wall" ? wall?.materialId
      : selectedObjects[0] && activeSlot ? selectedObjects[0].materialSlots[activeSlot]
        : selectedObjects[0] ? primaryMaterialId(selectedObjects[0]) : null;

  function apply(materialId: string) {
    if (target === "floor") onFloor(materialId);
    if (target === "wall" && wall) onWall(wall.id, materialId);
    if (target === "selection" && canPaintSelection) onApplyToSelection(materialId, activeSlot || undefined);
  }

  return (
    <section className="lr-surface-painter" aria-label="Surface paint">
      <div className="lr-paint-targets" role="tablist" aria-label="Paint target">
        <button type="button" role="tab" className={target === "floor" ? "is-active" : ""} onClick={() => setTarget("floor")}>Floor</button>
        <button type="button" role="tab" disabled={!wall} className={target === "wall" ? "is-active" : ""} onClick={() => setTarget("wall")}>Wall</button>
        <button type="button" role="tab" disabled={!canPaintSelection} className={target === "selection" ? "is-active" : ""}
          onClick={() => setTarget("selection")}>Selection{selectedObjects.length > 1 ? ` (${selectedObjects.length})` : ""}</button>
      </div>
      {target === "wall" && wall ? <small>Painting {String(wall.extensions?.wallSide ?? "active wall")}</small> : null}
      {target === "selection" && canPaintSelection ? (
        <label className="lr-select-field"><span>Slot on {selectedObjects.length} selected</span>
          <select value={activeSlot} onChange={(event) => setSlot(event.target.value)} aria-label="Selection material slot">
            {sharedSlots.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      ) : null}
      {target === "selection" && !canPaintSelection ? <p>Select one or more objects that share a material slot.</p> : null}
      <MaterialSwatchGrid materials={project.materials} activeMaterialId={activeMaterialId ?? null} onPick={apply} />
      <p>Swatches save the project material ID. Plan tint follows fronts (or another face slot) when present; carcass-only edits still persist for 3D.</p>
    </section>
  );
}
