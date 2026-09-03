import type { InteriorProject } from "../../domain/interiorProject";
import {
  filterMaterialsForSlot,
  tagsFromMaterialExtensions,
} from "../../domain/catalog";
import type { MaterialSlotPolicy } from "../../domain/catalog";
import { MaterialSwatchGrid } from "./MaterialSwatchGrid";

type Props = {
  slots: Record<string, string>;
  materials: InteriorProject["materials"];
  onSet: (slotName: string, materialId: string) => void;
  allowEmpty?: boolean;
  slotPolicies?: Record<string, MaterialSlotPolicy>;
};

function materialsForSlot(
  materials: InteriorProject["materials"],
  policy: MaterialSlotPolicy | undefined,
  activeId: string,
) {
  if (!policy) return materials;
  const compatible = new Set(
    filterMaterialsForSlot(
      materials.map((material) => ({
        ...material,
        tags: tagsFromMaterialExtensions(material.extensions),
      })),
      policy,
    ).map((material) => material.id),
  );
  return materials.filter((material) => compatible.has(material.id) || material.id === activeId);
}

/** Slot-aware finish editor — shared by object and opening inspectors. */
export function MaterialSlotList({ slots, materials, onSet, allowEmpty, slotPolicies }: Props) {
  const names = Object.keys(slots);
  if (names.length === 0 && !allowEmpty) return <p className="lr-inspector-hint">No material slots on this item.</p>;

  return (
    <div className="lr-material-slot-browser" aria-label="Material slots">
      {names.map((slotName) => {
        const materialId = slots[slotName] ?? "";
        const material = materials.find((item) => item.id === materialId);
        const policy = slotPolicies?.[slotName];
        const locked = policy?.editable === false;
        return (
          <div
            key={slotName}
            className={`lr-material-slot-row${locked ? " is-locked" : ""}`}
            data-material-slot={slotName}
            data-slot-locked={locked ? "true" : "false"}
          >
            <div className="lr-material-slot-heading">
              <i style={{ background: material?.color ?? "#d7ddd8" }} />
              <strong>{slotName}</strong>
              <small>
                {material?.name ?? (allowEmpty && !materialId ? "Default" : materialId)}
                {locked ? " · Locked" : ""}
              </small>
            </div>
            {locked ? (
              <p className="lr-inspector-hint">This surface is locked by the catalog item.</p>
            ) : (
              <MaterialSwatchGrid
                materials={materialsForSlot(materials, policy, materialId)}
                activeMaterialId={materialId || null}
                compact
                onPick={(nextId) => onSet(slotName, nextId)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
