import type {
  CatalogFileRecord,
  CatalogItem,
  CatalogMaterial,
  ProjectTemplate,
} from "./types";
import { isRecord, pushError, type CatalogValidationIssue } from "./schemaHelpers";

export function validateTemplateRefs(
  template: ProjectTemplate,
  itemsById: Map<string, CatalogItem>,
  filesById: Map<string, CatalogFileRecord>,
  materialsById: Map<string, CatalogMaterial>,
  issues: CatalogValidationIssue[],
): void {
  const thumbId = template.images?.thumbnailId;
  if (typeof thumbId !== "string" || thumbId.length === 0) {
    pushError(issues, "missing-template-thumbnail", `${template.id} thumbnail missing`);
  } else {
    const thumb = filesById.get(thumbId);
    if (!thumb || thumb.kind !== "image") {
      pushError(issues, "missing-template-thumbnail", `${template.id} thumbnail ${thumbId} missing`);
    }
  }
  const objects = Array.isArray(template.objects) ? template.objects : [];
  for (const object of objects) {
    if (!object || !isRecord(object)) continue;
    const catalogItemId =
      typeof object.catalogItemId === "string" ? object.catalogItemId : "";
    const item = itemsById.get(catalogItemId);
    if (!item) {
      pushError(
        issues,
        "template-unknown-item",
        `${template.id} references unknown item ${catalogItemId}`,
      );
      continue;
    }
    if (item.lifecycle === "blocked" || !item.visibility?.templateEligible) {
      pushError(
        issues,
        "template-ineligible-item",
        `${template.id} references non-template-eligible item ${catalogItemId}`,
      );
    }
    if (
      typeof object.catalogItemVersion === "number" &&
      object.catalogItemVersion !== item.version
    ) {
      pushError(
        issues,
        "template-item-version-mismatch",
        `${template.id} requests ${catalogItemId} v${object.catalogItemVersion} but catalog has v${item.version}`,
      );
    }
    const overrides =
      object.materialOverrides && isRecord(object.materialOverrides)
        ? object.materialOverrides
        : {};
    for (const [slotName, materialId] of Object.entries(overrides)) {
      if (typeof materialId !== "string") continue;
      const slot = item.materialSlots?.[slotName];
      if (!slot) {
        pushError(
          issues,
          "template-unknown-slot",
          `${template.id} overrides unknown slot ${slotName} on ${item.id}`,
        );
        continue;
      }
      if (!slot.editable) {
        pushError(
          issues,
          "template-locked-slot",
          `${template.id} overrides locked slot ${slotName} on ${item.id}`,
        );
      }
      if (!materialsById.has(materialId)) {
        pushError(
          issues,
          "template-missing-material",
          `${template.id} material ${materialId} missing`,
        );
      }
    }
  }
}
