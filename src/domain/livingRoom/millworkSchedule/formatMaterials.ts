import type { MaterialEntity } from "../../interiorProject";

export function slotRecord(slots: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(slots).map(([slot, materialId]) => [slot, materialId]),
  );
}

/** Stable `slot=id` string for CSV / machine handoff. */
export function formatMaterialIds(slots: Record<string, string>) {
  return Object.entries(slots)
    .map(([slot, materialId]) => `${slot}=${materialId}`)
    .join("; ");
}

/** Resolve slot → display name from project materials (falls back to id). */
export function resolveMaterialLabels(
  slots: Record<string, string>,
  materials: readonly MaterialEntity[],
): Record<string, string> {
  const byId = new Map(materials.map((material) => [material.id, material.name]));
  return Object.fromEntries(
    Object.entries(slots).map(([slot, materialId]) => [
      slot,
      byId.get(materialId) ?? materialId,
    ]),
  );
}

/** Shop-facing `slot=Natural Oak` string. */
export function formatMaterialLabels(labels: Record<string, string>) {
  return Object.entries(labels)
    .map(([slot, name]) => `${slot}=${name}`)
    .join("; ");
}
