import type { InteriorProject } from "../../domain/interiorProject";
import {
  catalogSwatchEntitiesForSlot,
  type MaterialSlotPolicy,
} from "../../domain/catalog";
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
  const catalog = catalogSwatchEntitiesForSlot(policy);
  const active = materials.find((material) => material.id === activeId);
  const activeCatalogId = active?.extensions?.catalogMaterialId;
  if (
    active
    && typeof activeCatalogId !== "string"
    && !catalog.some((material) => material.id === active.id)
  ) {
    return [active, ...catalog];
  }
  return catalog;
}

function activeSwatchId(
  materials: InteriorProject["materials"],
  materialId: string,
): string | null {
  if (!materialId) return null;
  const material = materials.find((item) => item.id === materialId);
  const catalogId = material?.extensions?.catalogMaterialId;
  return typeof catalogId === "string" ? catalogId : materialId;
}

/** Slot-aware finish editor — shared by object and opening inspectors. */
export function MaterialSlotList({ slots, materials, onSet, allowEmpty, slotPolicies }: Props) {
  const names = Object.keys(slots);
  if (names.length === 0 && !allowEmpty) {
    return <p className="lr-inspector-hint">No material slots on this item.</p>;
  }

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
                activeMaterialId={activeSwatchId(materials, materialId)}
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
