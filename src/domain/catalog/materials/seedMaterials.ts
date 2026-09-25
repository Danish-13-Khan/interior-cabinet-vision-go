import type { CatalogMaterial } from "../types";
import seedMaterials from "./seedMaterials.data.json" with { type: "json" };
import seedMaterialsPhase3 from "./seedMaterialsPhase3.data.json" with { type: "json" };
import seedMaterialsPhase4 from "./seedMaterialsPhase4.data.json" with { type: "json" };
import seedMaterialsSurfaces from "./seedMaterialsSurfaces.data.json" with { type: "json" };
import seedMaterialsGlass from "./seedMaterialsGlass.data.json" with { type: "json" };

/** Seed finishes used as catalog slot defaults and compatibility candidates. */
export const CATALOG_SEED_MATERIALS = [
  ...seedMaterials,
  ...seedMaterialsPhase3,
  ...seedMaterialsPhase4,
  ...seedMaterialsSurfaces,
  ...seedMaterialsGlass,
] as CatalogMaterial[];

export function getCatalogSeedMaterial(id: string): CatalogMaterial | undefined {
  return CATALOG_SEED_MATERIALS.find((material) => material.id === id);
}
