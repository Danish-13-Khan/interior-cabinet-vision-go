import type { MaterialEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";

/**
 * Catalog seed IDs → living-room registry assets (with texture maps).
 * Template / Kenney snapshots use `proj-*` ids + `extensions.catalogMaterialId`.
 */
export const CATALOG_MATERIAL_TO_REGISTRY: Record<string, string> = {
  "material:core:fabric-oatmeal:v1": LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
  "material:core:fabric-olive:v1": LIVING_ROOM_MATERIAL_IDS.oliveFabric,
  "material:core:fabric-bedding-white:v1": LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
  "material:core:fabric-rug-wool:v1": LIVING_ROOM_MATERIAL_IDS.woolRug,
  "material:core:fabric-shade-linen:v1": LIVING_ROOM_MATERIAL_IDS.oatmealFabric,
  "material:core:wood-natural-oak:v1": LIVING_ROOM_MATERIAL_IDS.naturalOak,
  "material:core:wood-walnut:v1": LIVING_ROOM_MATERIAL_IDS.walnut,
  "material:core:metal-charcoal:v1": LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
  "material:core:metal-appliance-steel:v1": LIVING_ROOM_MATERIAL_IDS.charcoalMetal,
  "material:core:glass-clear:v1": LIVING_ROOM_MATERIAL_IDS.clearGlass,
  "material:core:glass-frosted:v1": LIVING_ROOM_MATERIAL_IDS.clearGlass,
  "material:core:glass-dark:v1": LIVING_ROOM_MATERIAL_IDS.clearGlass,
  "material:core:glass-mirror:v1": LIVING_ROOM_MATERIAL_IDS.clearGlass,
  "material:core:ceramic-white:v1": LIVING_ROOM_MATERIAL_IDS.warmStone,
  "material:core:tile-ceramic-soft-gray:v1": LIVING_ROOM_MATERIAL_IDS.warmStone,
  "material:core:planter-terracotta:v1": LIVING_ROOM_MATERIAL_IDS.warmStone,
  "material:core:foliage-green:v1": LIVING_ROOM_MATERIAL_IDS.oliveFabric,
};

export function registryMaterialIdForCatalogId(
  catalogMaterialId: string,
): string | undefined {
  return CATALOG_MATERIAL_TO_REGISTRY[catalogMaterialId];
}

/** Resolve a project or catalog material id to a registry asset id when aliased. */
export function resolveMaterialAssetId(
  materialId: string,
  material?: Pick<MaterialEntity, "extensions"> | null,
): string {
  const catalogId =
    typeof material?.extensions?.catalogMaterialId === "string"
      ? material.extensions.catalogMaterialId
      : null;
  if (catalogId) {
    const aliased = CATALOG_MATERIAL_TO_REGISTRY[catalogId];
    if (aliased) return aliased;
  }
  return CATALOG_MATERIAL_TO_REGISTRY[materialId] ?? materialId;
}
