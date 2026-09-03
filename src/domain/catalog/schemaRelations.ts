import type {
  CatalogFileRecord,
  CatalogItem,
  CatalogManifest,
  CatalogMaterial,
  CatalogModelFile,
} from "./types";
import { isRecord, pushError, type CatalogValidationIssue } from "./schemaHelpers";
import { validateTemplateRefs } from "./schemaTemplateRefs";

function isSha256(hash: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(hash);
}

function validateItemRefs(
  item: CatalogItem,
  filesById: Map<string, CatalogFileRecord>,
  materialsById: Map<string, CatalogMaterial>,
  issues: CatalogValidationIssue[],
): void {
  const model = filesById.get(item.modelAssetId);
  if (!model || model.kind !== "model") {
    pushError(issues, "missing-model", `${item.id} references missing model ${item.modelAssetId}`);
  }
  if (!item.images || !isRecord(item.images)) return;
  const thumbId = item.images.thumbnailId;
  if (typeof thumbId === "string" && thumbId.length > 0) {
    const thumb = filesById.get(thumbId);
    if (!thumb || thumb.kind !== "image") {
      pushError(issues, "missing-thumbnail", `${item.id} thumbnail ${thumbId} missing`);
    }
  } else if (item.visibility?.objectBrowser || item.visibility?.templateEligible) {
    pushError(issues, "visible-without-thumbnail", `${item.id} is visible but has no thumbnail`);
  }
  const galleryIds = Array.isArray(item.images.galleryIds) ? item.images.galleryIds : [];
  for (const galleryId of galleryIds) {
    if (typeof galleryId !== "string") continue;
    const image = filesById.get(galleryId);
    if (!image || image.kind !== "image") {
      pushError(issues, "missing-gallery-image", `${item.id} gallery image ${galleryId} missing`);
    }
  }
  const dims = item.dimensionsMm;
  if (!dims || !(dims.width > 0 && dims.height > 0 && dims.depth > 0)) {
    pushError(issues, "invalid-dimensions", `${item.id} has invalid dimensions`);
  }
  if (!item.materialSlots || !isRecord(item.materialSlots)) return;
  for (const [slotName, slot] of Object.entries(item.materialSlots)) {
    if (!slot || !isRecord(slot)) {
      pushError(issues, "bad-slot", `${item.id} slot ${slotName} is malformed`);
      continue;
    }
    if (!Array.isArray(slot.sourceMaterialNames) || !Array.isArray(slot.allowedMaterialKinds)) {
      pushError(issues, "bad-slot", `${item.id} slot ${slotName} is malformed`);
      continue;
    }
    if (typeof slot.editable !== "boolean") {
      pushError(issues, "bad-slot", `${item.id} slot ${slotName}.editable must be boolean`);
    }
    if (typeof slot.defaultMaterialId === "string" && slot.defaultMaterialId.length > 0) {
      const material = materialsById.get(slot.defaultMaterialId);
      if (!material) {
        pushError(
          issues,
          "missing-default-material",
          `${item.id} slot ${slotName} default ${slot.defaultMaterialId} missing`,
        );
      } else if (!(slot.allowedMaterialKinds as string[]).includes(material.kind)) {
        pushError(
          issues,
          "incompatible-default-material",
          `${item.id} slot ${slotName} default kind ${material.kind} not allowed`,
        );
      }
    }
  }
}

function validateMaterialRefs(
  material: CatalogMaterial,
  filesById: Map<string, CatalogFileRecord>,
  issues: CatalogValidationIssue[],
): void {
  const textures = material.textureAssetIds;
  if (!textures || !isRecord(textures)) return;
  for (const [role, textureId] of Object.entries(textures)) {
    if (typeof textureId !== "string" || textureId.length === 0) continue;
    const file = filesById.get(textureId);
    if (!file || file.kind !== "texture") {
      pushError(issues, "missing-texture", `${material.id} texture ${role}=${textureId} missing`);
    }
  }
}

/** Reference integrity once structure looks like a CatalogManifest. */
export function validateCatalogRelations(manifest: CatalogManifest): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  if (!manifest.licenses.some((license) => license.id === "cc0-1.0")) {
    pushError(issues, "missing-license", "Required license cc0-1.0 is missing");
  }

  const seen = new Set<string>();
  const checkUnique = (id: string) => {
    if (seen.has(id)) pushError(issues, "duplicate-id", `Duplicate ID ${id}`);
    else seen.add(id);
  };
  for (const file of manifest.files) checkUnique(file.id);
  for (const material of manifest.materials) checkUnique(material.id);
  for (const item of manifest.items) checkUnique(item.id);
  for (const template of manifest.templates) checkUnique(template.id);

  const filesById = new Map(manifest.files.map((file) => [file.id, file]));
  const materialsById = new Map(manifest.materials.map((material) => [material.id, material]));
  const itemsById = new Map(manifest.items.map((item) => [item.id, item]));

  for (const file of manifest.files) {
    if (!isSha256(file.contentHash) || file.byteSize < 1) {
      pushError(issues, "bad-file-integrity", `${file.id} has invalid hash or byteSize`);
    }
    if (file.kind === "model" && (file as CatalogModelFile).primitiveCount < 1) {
      pushError(issues, "no-primitives", `${file.id} has no renderable primitives`);
    }
  }
  for (const item of manifest.items) validateItemRefs(item, filesById, materialsById, issues);
  for (const material of manifest.materials) validateMaterialRefs(material, filesById, issues);
  for (const template of manifest.templates) {
    validateTemplateRefs(template, itemsById, filesById, materialsById, issues);
  }
  return issues;
}

export function asCatalogManifest(raw: unknown): CatalogManifest | null {
  return isRecord(raw) ? (raw as CatalogManifest) : null;
}
