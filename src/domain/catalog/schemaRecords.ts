import {
  FILE_KINDS,
  IMAGE_ROLES,
  isNonEmptyString,
  isNonNegNumber,
  isPositiveNumber,
  isRecord,
  isStringArray,
  LIFECYCLES,
  MATERIAL_KINDS,
  PLACEMENTS,
  pushError,
  TEMPLATE_CATEGORIES,
  type CatalogValidationIssue,
} from "./schemaHelpers";
import {
  validateItemImages,
  validateMaterialFields,
  validateMaterialSlot,
  validateTemplateFields,
} from "./schemaNested";

function validateBounds(
  value: unknown,
  label: string,
  issues: CatalogValidationIssue[],
): void {
  if (!isRecord(value)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  for (const key of ["width", "height", "depth"] as const) {
    if (!isPositiveNumber(value[key])) {
      pushError(issues, "bad-shape", `${label}.${key} must be a positive number`);
    }
  }
}

export function validateFileRecord(
  file: unknown,
  index: number,
  issues: CatalogValidationIssue[],
): void {
  const label = `files[${index}]`;
  if (!isRecord(file)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(file.id)) pushError(issues, "bad-shape", `${label}.id required`);
  if (!FILE_KINDS.has(String(file.kind))) pushError(issues, "bad-enum", `${label}.kind invalid`);
  if (!isNonEmptyString(file.objectKey)) {
    pushError(issues, "bad-shape", `${label}.objectKey required`);
  }
  if (!isNonEmptyString(file.mimeType)) {
    pushError(issues, "bad-shape", `${label}.mimeType required`);
  }
  if (!isPositiveNumber(file.byteSize)) {
    pushError(issues, "bad-shape", `${label}.byteSize must be positive`);
  }
  if (typeof file.contentHash !== "string") {
    pushError(issues, "bad-shape", `${label}.contentHash required`);
  }
  if (file.kind === "model") {
    validateBounds(file.nativeBoundsM, `${label}.nativeBoundsM`, issues);
    if (typeof file.primitiveCount !== "number" || !Number.isFinite(file.primitiveCount)) {
      pushError(issues, "bad-shape", `${label}.primitiveCount required`);
    }
    if (!isNonNegNumber(file.triangleCount)) {
      pushError(issues, "bad-shape", `${label}.triangleCount invalid`);
    }
    if (!isStringArray(file.originalMaterialNames)) {
      pushError(issues, "bad-shape", `${label}.originalMaterialNames must be string[]`);
    }
    if (!isStringArray(file.warnings)) {
      pushError(issues, "bad-shape", `${label}.warnings must be string[]`);
    }
  }
  if (file.kind === "image" && !IMAGE_ROLES.has(String(file.role))) {
    pushError(issues, "bad-enum", `${label}.role invalid`);
  }
  if (file.kind === "texture") {
    if (!isNonEmptyString(file.role)) pushError(issues, "bad-shape", `${label}.role required`);
    if (
      file.colorSpace !== undefined &&
      file.colorSpace !== "srgb" &&
      file.colorSpace !== "linear"
    ) {
      pushError(issues, "bad-enum", `${label}.colorSpace invalid`);
    }
  }
}

export function validateItemRecord(
  item: unknown,
  index: number,
  issues: CatalogValidationIssue[],
): void {
  const label = `items[${index}]`;
  if (!isRecord(item)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  for (const key of ["id", "name", "category", "subcategory", "modelAssetId"] as const) {
    if (!isNonEmptyString(item[key])) pushError(issues, "bad-shape", `${label}.${key} required`);
  }
  if (!isPositiveNumber(item.version)) {
    pushError(issues, "bad-shape", `${label}.version must be a positive number`);
  }
  if (!isStringArray(item.tags)) pushError(issues, "bad-shape", `${label}.tags must be string[]`);
  if (!PLACEMENTS.has(String(item.placement))) {
    pushError(issues, "bad-enum", `${label}.placement invalid`);
  }
  if (!LIFECYCLES.has(String(item.lifecycle))) {
    pushError(issues, "bad-enum", `${label}.lifecycle invalid`);
  }
  validateBounds(item.dimensionsMm, `${label}.dimensionsMm`, issues);
  validateItemImages(item.images, `${label}.images`, issues);
  if (!isRecord(item.visibility)) {
    pushError(issues, "bad-shape", `${label}.visibility required`);
  } else {
    if (typeof item.visibility.objectBrowser !== "boolean") {
      pushError(issues, "bad-shape", `${label}.visibility.objectBrowser must be boolean`);
    }
    if (typeof item.visibility.templateEligible !== "boolean") {
      pushError(issues, "bad-shape", `${label}.visibility.templateEligible must be boolean`);
    }
  }
  if (!isRecord(item.materialSlots)) {
    pushError(issues, "bad-shape", `${label}.materialSlots must be an object`);
  } else {
    for (const [slotName, slot] of Object.entries(item.materialSlots)) {
      validateMaterialSlot(slot, `${label}.materialSlots.${slotName}`, issues);
    }
  }
  if (
    !isRecord(item.source) ||
    item.source.pack !== "kenney-furniture" ||
    item.source.licenseId !== "cc0-1.0"
  ) {
    pushError(issues, "bad-shape", `${label}.source must be kenney-furniture/cc0-1.0`);
  }
}

export function validateMaterialRecord(
  material: unknown,
  index: number,
  issues: CatalogValidationIssue[],
): void {
  const label = `materials[${index}]`;
  if (!isRecord(material)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(material.id) || !isNonEmptyString(material.name)) {
    pushError(issues, "bad-shape", `${label}.id/name required`);
  }
  if (!isPositiveNumber(material.version)) {
    pushError(issues, "bad-shape", `${label}.version must be positive`);
  }
  if (!MATERIAL_KINDS.has(String(material.kind))) {
    pushError(issues, "bad-enum", `${label}.kind invalid`);
  }
  if (!LIFECYCLES.has(String(material.lifecycle))) {
    pushError(issues, "bad-enum", `${label}.lifecycle invalid`);
  }
  if (typeof material.visibleInPicker !== "boolean") {
    pushError(issues, "bad-shape", `${label}.visibleInPicker must be boolean`);
  }
  validateMaterialFields(material, label, issues);
}

export function validateTemplateRecord(
  template: unknown,
  index: number,
  issues: CatalogValidationIssue[],
): void {
  const label = `templates[${index}]`;
  if (!isRecord(template)) {
    pushError(issues, "bad-shape", `${label} must be an object`);
    return;
  }
  if (!isNonEmptyString(template.id) || !isNonEmptyString(template.name)) {
    pushError(issues, "bad-shape", `${label}.id/name required`);
  }
  if (!TEMPLATE_CATEGORIES.has(String(template.category))) {
    pushError(issues, "bad-enum", `${label}.category invalid`);
  }
  validateTemplateFields(template, label, issues);
}
