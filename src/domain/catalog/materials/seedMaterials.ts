import type { CatalogMaterial } from "../types";
import seedMaterials from "./seedMaterials.data.json";

/** Phase 2 seed finishes used as catalog slot defaults and compatibility candidates. */
export const CATALOG_SEED_MATERIALS = seedMaterials as CatalogMaterial[];

export function getCatalogSeedMaterial(id: string): CatalogMaterial | undefined {
  return CATALOG_SEED_MATERIALS.find((material) => material.id === id);
}
