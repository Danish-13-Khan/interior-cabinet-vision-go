import builtinCatalogJson from "../../../public/catalog/builtin-catalog.v1.json" with { type: "json" };
import type {
  CatalogFileRecord,
  CatalogItem,
  CatalogManifest,
  CatalogMaterial,
  MaterialSlotPolicy,
  ProjectTemplate,
} from "./types";

const MANIFEST = builtinCatalogJson as unknown as CatalogManifest;

export function lookupBuiltInCatalogItem(id: string, version?: number): CatalogItem | null {
  const item = MANIFEST.items.find((candidate) => candidate.id === id) ?? null;
  if (!item) return null;
  if (version !== undefined && item.version !== version) return null;
  return item;
}

export function lookupBuiltInCatalogFile(id: string): CatalogFileRecord | undefined {
  return MANIFEST.files.find((file) => file.id === id);
}

export function lookupBuiltInCatalogMaterials(): CatalogMaterial[] {
  return MANIFEST.materials;
}

export function lookupBuiltInCatalogMaterial(id: string): CatalogMaterial | undefined {
  return MANIFEST.materials.find((material) => material.id === id);
}

export function lookupBuiltInCatalogTemplates(): ProjectTemplate[] {
  return MANIFEST.templates;
}

export function lookupBuiltInCatalogTemplate(id: string, version?: number): ProjectTemplate | null {
  const template = MANIFEST.templates.find((candidate) => candidate.id === id) ?? null;
  if (!template) return null;
  if (version !== undefined && template.version !== version) return null;
  return template;
}

/** Model file IDs referenced by a template — for lazy GLB loading scopes. */
export function templateModelAssetIds(templateId: string): string[] {
  const template = lookupBuiltInCatalogTemplate(templateId);
  if (!template) return [];
  const ids: string[] = [];
  for (const object of template.objects) {
    const item = lookupBuiltInCatalogItem(object.catalogItemId, object.catalogItemVersion);
    if (item?.modelAssetId) ids.push(item.modelAssetId);
  }
  return [...new Set(ids)];
}

export function pinnedCatalogItemVersion(object: {
  catalogItemVersion?: number;
  extensions?: Record<string, unknown>;
}): number | undefined {
  if (typeof object.catalogItemVersion === "number" && Number.isFinite(object.catalogItemVersion)) {
    return object.catalogItemVersion;
  }
  const value = object.extensions?.catalogItemVersion;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function catalogVersionPinFallbackWarning(object: {
  catalogItemId: string;
  catalogItemVersion?: number;
  extensions?: Record<string, unknown>;
}): string | undefined {
  const pinned = pinnedCatalogItemVersion(object);
  if (pinned === undefined) return undefined;
  if (lookupBuiltInCatalogItem(object.catalogItemId, pinned)) return undefined;
  return `Pinned catalog version ${pinned} for ${object.catalogItemId} is unavailable; using a safe fallback.`;
}

export function catalogSlotPoliciesForObject(object: {
  catalogItemId: string;
  catalogItemVersion?: number;
  extensions?: Record<string, unknown>;
}): Record<string, MaterialSlotPolicy> | undefined {
  const item = lookupBuiltInCatalogItem(object.catalogItemId, pinnedCatalogItemVersion(object));
  if (!item || Object.keys(item.materialSlots).length === 0) return undefined;
  return item.materialSlots;
}
