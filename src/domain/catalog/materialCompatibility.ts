import type { MaterialKind } from "../interiorProject";
import type { CatalogMaterial, MaterialSlotPolicy } from "./types";

export function tagsFromMaterialExtensions(
  extensions?: Record<string, unknown>,
): string[] | undefined {
  const raw = extensions?.tags;
  if (!Array.isArray(raw)) return undefined;
  const tags = raw.filter((tag): tag is string => typeof tag === "string");
  return tags.length > 0 ? tags : undefined;
}

export type CompatibleMaterialCandidate = {
  id: string;
  kind: MaterialKind;
  tags?: string[];
};

/** Kind first; when tags are configured, require at least one overlap. */
export function isMaterialCompatibleWithSlot(
  material: CompatibleMaterialCandidate,
  slot: MaterialSlotPolicy,
): boolean {
  if (!slot.allowedMaterialKinds.includes(material.kind)) return false;
  const required = slot.allowedMaterialTags;
  if (!required || required.length === 0) return true;
  const tags = material.tags ?? [];
  return required.some((tag) => tags.includes(tag));
}

export function filterMaterialsForSlot<T extends CompatibleMaterialCandidate>(
  materials: readonly T[],
  slot: MaterialSlotPolicy,
): T[] {
  return materials.filter((material) => isMaterialCompatibleWithSlot(material, slot));
}

export function isCatalogMaterialCompatible(
  material: CatalogMaterial,
  slot: MaterialSlotPolicy,
): boolean {
  return isMaterialCompatibleWithSlot(
    { id: material.id, kind: material.kind, tags: material.tags },
    slot,
  );
}

export function assertSlotEditable(slot: MaterialSlotPolicy | undefined, slotName: string): void {
  if (slot && !slot.editable) {
    throw new Error(`Material slot "${slotName}" is locked and cannot be changed`);
  }
}
