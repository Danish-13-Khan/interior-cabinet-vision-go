import { resolveCatalogAlias } from "../catalog/aliases";
import {
  catalogSlotPoliciesForObject,
  lookupBuiltInCatalogMaterial,
} from "../catalog/catalogLookup";
import { remapPackMaterialBindings, resolvePackStarterAlias } from "../catalog/compatibility";
import {
  tagsFromMaterialExtensions,
  type CompatibleMaterialCandidate,
} from "../catalog/materialCompatibility";
import type { MaterialSlotPolicy } from "../catalog/types";
import type { InteriorObjectEntity, MaterialEntity } from "../interiorProject";
import { getPackagedImportedAsset, type ImportedAsset } from "./assetImportPipeline";
import { CATALOG_MATERIAL_TO_REGISTRY } from "./catalogMaterialRegistry";
import { livingRoomMaterialById } from "./materials";
import type { RenderBinding } from "./renderAssetContracts";

function importedAssetForObject(object: InteriorObjectEntity): ImportedAsset | null {
  const candidate = object.extensions?.assetImport;
  if (!candidate || typeof candidate !== "object") return null;
  const asset = candidate as Partial<ImportedAsset>;
  if (typeof asset.sourceUrl === "string" && typeof asset.id === "string") {
    return asset as ImportedAsset;
  }
  const packId =
    typeof (candidate as { id?: unknown }).id === "string"
      ? (candidate as { id: string }).id
      : "";
  return getPackagedImportedAsset(packId);
}

function candidateFromEntity(material: MaterialEntity): CompatibleMaterialCandidate {
  return {
    id: material.id,
    kind: material.kind,
    tags: tagsFromMaterialExtensions(material.extensions),
  };
}

export function resolvePackMaterialCandidate(
  materialId: string,
  projectMaterials?: readonly MaterialEntity[],
): CompatibleMaterialCandidate | null {
  const project = projectMaterials?.find((material) => material.id === materialId);
  if (project) return candidateFromEntity(project);
  const catalog = lookupBuiltInCatalogMaterial(materialId);
  if (catalog) return { id: catalog.id, kind: catalog.kind, tags: catalog.tags };
  const living = livingRoomMaterialById(materialId);
  if (!living) return null;
  return candidateFromEntity(living);
}

function localizePackDefaultBindings(
  bindings: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [slot, materialId] of Object.entries(bindings)) {
    next[slot] = CATALOG_MATERIAL_TO_REGISTRY[materialId] ?? materialId;
  }
  return next;
}

/** GLB binding for user imports and Phase 6 pack aliases. */
export function createImportedObjectRenderBinding(
  object: InteriorObjectEntity,
  materialBindings: Record<string, string>,
  uvScaleMm: number,
  slotPolicies?: Record<string, MaterialSlotPolicy>,
  projectMaterials?: readonly MaterialEntity[],
): RenderBinding | null {
  const imported = importedAssetForObject(object);
  if (!imported) return null;
  const packAlias = resolveCatalogAlias(imported.id);
  const resolvedPack = packAlias ? resolvePackStarterAlias(imported.id) : null;
  const aliasPolicies = packAlias
    ? catalogSlotPoliciesForObject({ catalogItemId: packAlias.targetItemId })
    : undefined;
  const bindings = packAlias
    ? localizePackDefaultBindings(
        remapPackMaterialBindings(imported.id, materialBindings, {
          slotPolicies: aliasPolicies,
          resolveMaterial: (materialId) =>
            resolvePackMaterialCandidate(materialId, projectMaterials),
        }),
      )
    : materialBindings;
  return {
    strategy: "glb",
    modelAssetId: resolvedPack?.model.id ?? `import:${imported.id}`,
    modelUrl: resolvedPack?.modelUrl ?? imported.sourceUrl,
    modelMaterialGroups: imported.materialGroups,
    modelTextureUrls: imported.textureUrls,
    materialBindings: bindings,
    uvScaleMm,
    targetSizeMm: { ...object.dimensions },
    slotPolicies: aliasPolicies ?? slotPolicies,
  };
}
