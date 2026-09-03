import {
  isNonEmptyString,
  isNonNegNumber,
  isPositiveNumber,
  isRecord,
  isStringArray,
  MATERIAL_KINDS,
  pushError,
  type CatalogValidationIssue,
} from "./schemaHelpers";

export function validateVec3Mm(
  value: unknown,
  label: string,
  issues: CatalogValidationIssue[],
  allowZero = true,
): void {
  if (!isRecord(value)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  for (const key of ["x", "y", "z"] as const) {
    const ok = allowZero
      ? typeof value[key] === "number" && Number.isFinite(value[key])
      : isPositiveNumber(value[key]);
    if (!ok) pushError(issues, "bad-shape", `${label}.${key} must be a finite number`);
  }
}

export function validateLicense(
  license: unknown,
  index: number,
  issues: CatalogValidationIssue[],
): void {
  const label = `licenses[${index}]`;
  if (!isRecord(license)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  for (const key of ["id", "name", "sourceUrl", "licenseFileObjectKey"] as const) {
    if (!isNonEmptyString(license[key])) {
      pushError(issues, "bad-shape", `${label}.${key} required`);
    }
  }
  if (typeof license.attributionRequired !== "boolean") {
    pushError(issues, "bad-shape", `${label}.attributionRequired must be boolean`);
  }
}

export function validateMaterialSlot(
  slot: unknown,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isRecord(slot)) {
    pushError(issues, "bad-slot", `${label} must be an object`);
    return;
  }
  if (!isStringArray(slot.sourceMaterialNames)) {
    pushError(issues, "bad-slot", `${label}.sourceMaterialNames must be string[]`);
  }
  if (
    !Array.isArray(slot.allowedMaterialKinds) ||
    !slot.allowedMaterialKinds.every((kind) => MATERIAL_KINDS.has(String(kind)))
  ) {
    pushError(issues, "bad-slot", `${label}.allowedMaterialKinds invalid`);
  }
  if (slot.allowedMaterialTags !== undefined && !isStringArray(slot.allowedMaterialTags)) {
    pushError(issues, "bad-slot", `${label}.allowedMaterialTags must be string[]`);
  }
  if (slot.defaultMaterialId !== undefined && !isNonEmptyString(slot.defaultMaterialId)) {
    pushError(issues, "bad-slot", `${label}.defaultMaterialId must be a string`);
  }
  if (typeof slot.editable !== "boolean") {
    pushError(issues, "bad-slot", `${label}.editable must be boolean`);
  }
}

export function validateItemImages(
  images: unknown,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isRecord(images)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  if (images.thumbnailId !== undefined && !isNonEmptyString(images.thumbnailId)) {
    pushError(issues, "bad-shape", `${label}.thumbnailId must be a string`);
  }
  if (images.galleryIds !== undefined && !isStringArray(images.galleryIds)) {
    pushError(issues, "bad-shape", `${label}.galleryIds must be string[]`);
  }
}

export function validateMaterialFields(
  material: Record<string, unknown>,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isStringArray(material.tags)) {
    pushError(issues, "bad-shape", `${label}.tags must be string[]`);
  }
  for (const key of ["swatchColor", "baseColor"] as const) {
    if (!isNonEmptyString(material[key])) {
      pushError(issues, "bad-shape", `${label}.${key} required`);
    }
  }
  for (const key of ["roughness", "metalness", "opacity"] as const) {
    if (!isNonNegNumber(material[key])) {
      pushError(issues, "bad-shape", `${label}.${key} must be a non-negative number`);
    }
  }
  if (!isPositiveNumber(material.uvScaleMm)) {
    pushError(issues, "bad-shape", `${label}.uvScaleMm must be positive`);
  }
  if (material.textureAssetIds !== undefined) {
    if (!isRecord(material.textureAssetIds)) {
      pushError(issues, "bad-shape", `${label}.textureAssetIds must be an object`);
    } else {
      for (const [role, textureId] of Object.entries(material.textureAssetIds)) {
        if (textureId !== undefined && !isNonEmptyString(textureId)) {
          pushError(issues, "bad-shape", `${label}.textureAssetIds.${role} must be a string`);
        }
      }
    }
  }
}

export function validateTemplateObject(
  object: unknown,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isRecord(object)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(object.templateObjectId)) {
    pushError(issues, "bad-shape", `${label}.templateObjectId required`);
  }
  if (!isNonEmptyString(object.catalogItemId)) {
    pushError(issues, "bad-shape", `${label}.catalogItemId required`);
  }
  if (
    object.catalogItemVersion !== undefined &&
    !isPositiveNumber(object.catalogItemVersion)
  ) {
    pushError(issues, "bad-shape", `${label}.catalogItemVersion must be positive`);
  }
  validateVec3Mm(object.positionMm, `${label}.positionMm`, issues);
  if (typeof object.rotationY !== "number" || !Number.isFinite(object.rotationY)) {
    pushError(issues, "bad-shape", `${label}.rotationY must be a finite number`);
  }
  if (object.materialOverrides !== undefined) {
    if (!isRecord(object.materialOverrides)) {
      pushError(issues, "bad-shape", `${label}.materialOverrides must be an object`);
    } else {
      for (const [slot, materialId] of Object.entries(object.materialOverrides)) {
        if (!isNonEmptyString(materialId)) {
          pushError(issues, "bad-shape", `${label}.materialOverrides.${slot} must be a string`);
        }
      }
    }
  }
}

export function validateTemplateFields(
  template: Record<string, unknown>,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isPositiveNumber(template.version)) {
    pushError(issues, "bad-shape", `${label}.version must be positive`);
  }
  if (typeof template.description !== "string") {
    pushError(issues, "bad-shape", `${label}.description must be a string`);
  }
  if (!isRecord(template.images) || !isNonEmptyString(template.images.thumbnailId)) {
    pushError(issues, "bad-shape", `${label}.images.thumbnailId required`);
  }
  if (!isRecord(template.room)) {
    pushError(issues, "bad-shape", `${label}.room required`);
  } else {
    for (const key of ["widthMm", "depthMm", "heightMm"] as const) {
      if (!isPositiveNumber(template.room[key])) {
        pushError(issues, "bad-shape", `${label}.room.${key} must be positive`);
      }
    }
  }
  if (!Array.isArray(template.objects)) {
    pushError(issues, "bad-shape", `${label}.objects must be an array`);
    return;
  }
  template.objects.forEach((object, index) => {
    validateTemplateObject(object, `${label}.objects[${index}]`, issues);
  });
}
