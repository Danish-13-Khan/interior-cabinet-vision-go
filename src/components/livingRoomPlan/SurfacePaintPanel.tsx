import { useMemo, useState } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import {
  commonMaterialSlots,
  editableCommonMaterialSlots,
  isSelectionSlotEditable,
  materialsCompatibleWithSelectionSlot,
  primaryMaterialId,
} from "../../domain/livingRoom";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";

type Props = {
  project: InteriorProject;
  activeWallId: string | null;
  selectedObjects: InteriorObjectEntity[];
  onFloor: (materialId: string) => void;
  onCeiling: (materialId: string) => void;
  onWall: (wallId: string, materialId: string) => void;
  onApplyToSelection: (materialId: string, slotName?: string) => void;
  onImportFinish?: (file: File, apply?: { wallId?: string; floor?: boolean; ceiling?: boolean }) => void;
};

type PaintTarget = "floor" | "ceiling" | "wall" | "selection";

export function SurfacePaintPanel({
  project, activeWallId, selectedObjects, onFloor, onCeiling, onWall, onApplyToSelection, onImportFinish,
}: Props) {
  const wall = project.walls.find((item) => item.id === activeWallId) ?? project.walls[0] ?? null;
  const [target, setTarget] = useState<PaintTarget>(selectedObjects.length ? "selection" : "floor");
  const [slot, setSlot] = useState("");
  const sharedSlots = useMemo(() => commonMaterialSlots(selectedObjects), [selectedObjects]);
  const editableSlots = useMemo(() => editableCommonMaterialSlots(selectedObjects), [selectedObjects]);
  const activeSlot = editableSlots.includes(slot) ? slot : editableSlots[0] ?? "";
  const canPaintSelection = selectedObjects.length > 0 && editableSlots.length > 0;
  const selectionMaterials = useMemo(() => {
    if (target !== "selection" || !activeSlot) return project.materials;
    const compatible = materialsCompatibleWithSelectionSlot(
      project.materials,
      selectedObjects,
      activeSlot,
    );
    const activeId = selectedObjects[0]?.materialSlots[activeSlot];
    if (!activeId || compatible.some((material) => material.id === activeId)) return compatible;
    const current = project.materials.find((material) => material.id === activeId);
    return current ? [...compatible, current] : compatible;
  }, [target, activeSlot, project.materials, selectedObjects]);

  const activeMaterialId = target === "floor"
    ? project.surfaces.find((surface) => surface.roomId === project.activeRoomId && surface.kind === "floor")?.materialId
      ?? (project.rooms.find((room) => room.id === project.activeRoomId)?.extensions?.floorMaterialId as string | undefined)
    : target === "ceiling"
      ? project.surfaces.find((surface) => surface.roomId === project.activeRoomId && surface.kind === "ceiling")?.materialId
        ?? (project.rooms.find((room) => room.id === project.activeRoomId)?.extensions?.ceilingMaterialId as string | undefined)
    : target === "wall" ? wall?.materialId
      : selectedObjects[0] && activeSlot ? selectedObjects[0].materialSlots[activeSlot]
        : selectedObjects[0] ? primaryMaterialId(selectedObjects[0]) : null;

  function apply(materialId: string) {
    if (target === "floor") onFloor(materialId);
    if (target === "ceiling") onCeiling(materialId);
    if (target === "wall" && wall) onWall(wall.id, materialId);
    if (target === "selection" && canPaintSelection) onApplyToSelection(materialId, activeSlot || undefined);
  }

  return (
    <section className="lr-surface-painter" aria-label="Surface paint">
      <div className="lr-paint-targets" role="tablist" aria-label="Paint target">
        <button type="button" role="tab" className={target === "floor" ? "is-active" : ""} onClick={() => setTarget("floor")}>Floor</button>
        <button type="button" role="tab" className={target === "ceiling" ? "is-active" : ""} onClick={() => setTarget("ceiling")}>Ceiling</button>
        <button type="button" role="tab" disabled={!wall} className={target === "wall" ? "is-active" : ""} onClick={() => setTarget("wall")}>Wall</button>
        <button type="button" role="tab" disabled={!canPaintSelection} className={target === "selection" ? "is-active" : ""}
          onClick={() => setTarget("selection")}>Selection{selectedObjects.length > 1 ? ` (${selectedObjects.length})` : ""}</button>
      </div>
      {target === "wall" && wall ? <small>Painting {String(wall.extensions?.wallSide ?? "active wall")}</small> : null}
      {target === "selection" && sharedSlots.length > 0 ? (
        <label className="lr-select-field"><span>Slot on {selectedObjects.length} selected</span>
          <select value={activeSlot || sharedSlots[0] || ""} onChange={(event) => setSlot(event.target.value)}
            aria-label="Selection material slot" disabled={editableSlots.length === 0}>
            {sharedSlots.map((name) => {
              const locked = !isSelectionSlotEditable(selectedObjects, name);
              return <option key={name} value={name} disabled={locked}>{locked ? `${name} (locked)` : name}</option>;
            })}
          </select>
        </label>
      ) : null}
      {target === "selection" && selectedObjects.length > 0 && sharedSlots.length === 0
        ? <p>Select one or more objects that share a material slot.</p> : null}
      {target === "selection" && sharedSlots.length > 0 && editableSlots.length === 0
        ? <p>Shared slots on this selection are locked by the catalog.</p> : null}
      {target === "selection" && !canPaintSelection ? null : (
        <>
          <MaterialSwatchGrid
            materials={target === "selection" ? selectionMaterials : project.materials}
            activeMaterialId={activeMaterialId ?? null}
            onPick={apply}
            onImport={onImportFinish ? (file) => onImportFinish(file, target === "floor"
              ? { floor: true }
              : target === "ceiling" ? { ceiling: true }
              : target === "wall" && wall ? { wallId: wall.id } : undefined) : undefined}
          />
          <p>Swatches save the project material ID. Plan tint follows fronts (or another face slot) when present; carcass-only edits still persist for 3D.</p>
        </>
      )}
    </section>
  );
}
