import { publicAssetUrl } from "../../utils/publicAssetUrl";
import {
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogItem,
  pinnedCatalogItemVersion,
} from "../catalog/catalogLookup";
import type { MaterialSlotPolicy } from "../catalog/types";
import type { InteriorObjectEntity, MaterialEntity } from "../interiorProject";
import type { RenderBinding } from "./renderAssetContracts";

/** True when slotted finishes are absent or still catalog defaults. */
export function shouldPreserveKenneySourceMaterials(
  object: InteriorObjectEntity,
  projectMaterials: readonly MaterialEntity[] | undefined,
  slotPolicies: Record<string, MaterialSlotPolicy> | undefined,
): boolean {
  if (!slotPolicies) return true;
  const entries = Object.entries(slotPolicies);
  if (entries.length === 0) return true;
  const assigned = entries.filter(([slotName]) => Boolean(object.materialSlots[slotName]));
  if (assigned.length === 0) return true;
  if (!projectMaterials?.length) return true;
  for (const [slotName, policy] of assigned) {
    const defaultId = policy.defaultMaterialId;
    if (!defaultId) return false;
    const materialId = object.materialSlots[slotName]!;
    const material = projectMaterials.find((item) => item.id === materialId);
    if (!material || material.extensions?.catalogMaterialCustomized === true) return false;
    if (material.extensions?.catalogMaterialId !== defaultId) return false;
  }
  return true;
}

/** Bind a Kenney catalog item to its bundled GLB. */
export function createKenneyCatalogRenderBinding(
  object: InteriorObjectEntity,
  materialBindings: Record<string, string>,
  uvScaleMm: number,
  slotPolicies?: Record<string, MaterialSlotPolicy>,
  projectMaterials?: readonly MaterialEntity[],
): RenderBinding | null {
  const item = lookupBuiltInCatalogItem(object.catalogItemId, pinnedCatalogItemVersion(object));
  if (!item) return null;
  const file = lookupBuiltInCatalogFile(item.modelAssetId);
  if (!file || file.kind !== "model") return null;
  return {
    strategy: "glb",
    modelAssetId: item.modelAssetId,
    modelUrl: publicAssetUrl(file.objectKey),
    materialBindings,
    uvScaleMm,
    targetSizeMm: { ...object.dimensions },
    slotPolicies,
    preserveSourceMaterials: shouldPreserveKenneySourceMaterials(
      object,
      projectMaterials,
      slotPolicies,
    ),
  };
}
