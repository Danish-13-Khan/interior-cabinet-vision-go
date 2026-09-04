import { publicAssetUrl } from "../../utils/publicAssetUrl";
import { PACK_STARTER_SLOT_REMAP, resolveCatalogAlias } from "./aliases";
import {
  lookupBuiltInCatalogFile,
  lookupBuiltInCatalogItem,
  lookupBuiltInCatalogMaterial,
} from "./catalogLookup";
import type { CompatibleMaterialCandidate } from "./materialCompatibility";
import { isPackLegacyMaterialCompatibleWithSlot } from "./materialCompatibility";
import type { CatalogItem, CatalogModelFile, MaterialSlotPolicy } from "./types";

export type ResolvedPackAlias = {
  aliasId: string;
  item: CatalogItem;
  model: CatalogModelFile;
  modelUrl: string;
};

export type RemapPackMaterialOptions = {
  slotPolicies?: Record<string, MaterialSlotPolicy>;
  /** Resolve project or catalog material ids to kind/tags for compatibility checks. */
  resolveMaterial?: (materialId: string) => CompatibleMaterialCandidate | null;
};

/** Resolve a pack starter alias to its Kenney catalog item and bundled GLB URL. */
export function resolvePackStarterAlias(aliasId: string): ResolvedPackAlias | null {
  const alias = resolveCatalogAlias(aliasId);
  if (!alias) return null;
  const item = lookupBuiltInCatalogItem(alias.targetItemId);
  if (!item) return null;
  const file = lookupBuiltInCatalogFile(item.modelAssetId);
  if (!file || file.kind !== "model") return null;
  return {
    aliasId: alias.aliasId,
    item,
    model: file,
    modelUrl: publicAssetUrl(file.objectKey),
  };
}

/** Lookup catalog items, following a single pack-alias hop when present. */
export function lookupCatalogItemResolvingAliases(
  id: string,
  version?: number,
): CatalogItem | null {
  const canonical = resolveCatalogAlias(id)?.targetItemId ?? id;
  return lookupBuiltInCatalogItem(canonical, version);
}

function resolveCandidate(
  materialId: string,
  resolveMaterial?: (id: string) => CompatibleMaterialCandidate | null,
): CompatibleMaterialCandidate | null {
  const custom = resolveMaterial?.(materialId);
  if (custom) return custom;
  const catalog = lookupBuiltInCatalogMaterial(materialId);
  if (!catalog) return null;
  return { id: catalog.id, kind: catalog.kind, tags: catalog.tags };
}

/**
 * Copy legacy pack finishes onto replacement slots when kinds are compatible.
 * Incompatible finishes fall back to the slot default, otherwise the slot is omitted
 * so embedded GLB materials remain.
 */
export function remapPackMaterialBindings(
  packId: string,
  bindings: Record<string, string>,
  options: RemapPackMaterialOptions = {},
): Record<string, string> {
  const remap = PACK_STARTER_SLOT_REMAP[packId];
  if (!remap || Object.keys(remap).length === 0) return bindings;
  const next = { ...bindings };
  for (const [legacySlot, canonicalSlot] of Object.entries(remap)) {
    if (next[canonicalSlot] !== undefined) continue;
    const policy = options.slotPolicies?.[canonicalSlot];
    const legacyId = bindings[legacySlot];
    if (legacyId) {
      const candidate = resolveCandidate(legacyId, options.resolveMaterial);
      if (candidate && (!policy || isPackLegacyMaterialCompatibleWithSlot(candidate, policy))) {
        next[canonicalSlot] = legacyId;
        continue;
      }
    }
    if (policy?.defaultMaterialId) next[canonicalSlot] = policy.defaultMaterialId;
  }
  return next;
}
