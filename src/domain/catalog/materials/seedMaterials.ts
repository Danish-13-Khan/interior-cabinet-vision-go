import type { CatalogMaterial } from "../types";
import seedMaterials from "./seedMaterials.data.json";
import seedMaterialsPhase3 from "./seedMaterialsPhase3.data.json";

/** Seed finishes used as catalog slot defaults and compatibility candidates. */
export const CATALOG_SEED_MATERIALS = [
  ...seedMaterials,
  ...seedMaterialsPhase3,
] as CatalogMaterial[];

export function getCatalogSeedMaterial(id: string): CatalogMaterial | undefined {
  return CATALOG_SEED_MATERIALS.find((material) => material.id === id);
}
