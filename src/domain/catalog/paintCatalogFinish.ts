import type { InteriorProject } from "../interiorProject";
import {
  lookupBuiltInCatalogMaterial,
  lookupBuiltInCatalogMaterials,
} from "./catalogLookup";
import { paintObjectSlotWithPolicy } from "./finishCommands";
import {
  filterMaterialsForSlot,
  isCatalogMaterialCompatible,
} from "./materialCompatibility";
import { ensureCatalogMaterialSnapshot, snapshotCatalogMaterial } from "./materialSnapshots";
import type { CatalogMaterial, MaterialSlotPolicy } from "./types";

/** Picker-visible catalog finishes compatible with a semantic slot. */
export function catalogSwatchesForSlot(policy: MaterialSlotPolicy): CatalogMaterial[] {
  return filterMaterialsForSlot(
    lookupBuiltInCatalogMaterials().filter(
      (material) => material.lifecycle === "active" && material.visibleInPicker,
    ),
    policy,
  );
}

/** Display snapshots for inspector swatches (catalog id as temporary display id). */
export function catalogSwatchEntitiesForSlot(policy: MaterialSlotPolicy) {
  return catalogSwatchesForSlot(policy).map((material) =>
    snapshotCatalogMaterial(material, material.id),
  );
}

/** Snapshot a catalog finish into the project, then paint the object slot. */
export function paintObjectSlotFromCatalog(
  project: InteriorProject,
  args: { objectId: string; slotName: string; catalogMaterialId: string },
): InteriorProject {
  const catalogMaterial = lookupBuiltInCatalogMaterial(args.catalogMaterialId);
  if (!catalogMaterial) {
    throw new Error(`Unknown catalog material ${args.catalogMaterialId}`);
  }
  const ensured = ensureCatalogMaterialSnapshot(project, catalogMaterial);
  return paintObjectSlotWithPolicy(ensured.project, {
    objectId: args.objectId,
    slotName: args.slotName,
    materialId: ensured.materialId,
  });
}

/** Resolve a picker id that may be a project material or a catalog material id. */
export function resolveFinishPickToProjectMaterial(
  project: InteriorProject,
  materialOrCatalogId: string,
): { project: InteriorProject; materialId: string } {
  if (project.materials.some((material) => material.id === materialOrCatalogId)) {
    return { project, materialId: materialOrCatalogId };
  }
  const catalogMaterial = lookupBuiltInCatalogMaterial(materialOrCatalogId);
  if (!catalogMaterial) {
    throw new Error(`Unknown material ${materialOrCatalogId}`);
  }
  return ensureCatalogMaterialSnapshot(project, catalogMaterial);
}

export function isCatalogMaterialAllowedForSlot(
  catalogMaterialId: string,
  policy: MaterialSlotPolicy,
): boolean {
  const material = lookupBuiltInCatalogMaterial(catalogMaterialId);
  if (!material) return false;
  return isCatalogMaterialCompatible(material, policy);
}
