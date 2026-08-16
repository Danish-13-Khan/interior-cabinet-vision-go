import type { MaterialEntity } from "../interiorProject";

/** Returns safe copies so presets never share mutable material records. */
export function createMaterialLibrary(
  materials: readonly MaterialEntity[],
): MaterialEntity[] {
  return materials.map((material) => ({
    ...material,
    extensions: material.extensions ? { ...material.extensions } : undefined,
  }));
}
