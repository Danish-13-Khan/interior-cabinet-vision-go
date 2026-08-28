import type { InteriorProject } from "../../domain/interiorProject";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";

type Props = {
  slots: Record<string, string>;
  materials: InteriorProject["materials"];
  onSet: (slotName: string, materialId: string) => void;
  allowEmpty?: boolean;
};

/** Slot-aware finish editor — shared by object and opening inspectors. */
export function MaterialSlotList({ slots, materials, onSet, allowEmpty }: Props) {
  const names = Object.keys(slots);
  if (names.length === 0 && !allowEmpty) return <p className="lr-inspector-hint">No material slots on this item.</p>;

  return (
    <div className="lr-material-slot-browser" aria-label="Material slots">
      {names.map((slotName) => {
        const materialId = slots[slotName] ?? "";
        const material = materials.find((item) => item.id === materialId);
        return (
          <div key={slotName} className="lr-material-slot-row" data-material-slot={slotName}>
            <div className="lr-material-slot-heading">
              <i style={{ background: material?.color ?? "#d7ddd8" }} />
              <strong>{slotName}</strong>
              <small>{material?.name ?? (allowEmpty && !materialId ? "Default" : materialId)}</small>
            </div>
            <MaterialSwatchGrid
              materials={materials}
              activeMaterialId={materialId || null}
              compact
              onPick={(nextId) => onSet(slotName, nextId)}
            />
          </div>
        );
      })}
    </div>
  );
}
