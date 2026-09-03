import {
  isNonEmptyString,
  isRecord,
  pushError,
  type CatalogValidationIssue,
} from "./schemaHelpers";
import { validateLicense } from "./schemaNested";
import {
  validateFileRecord,
  validateItemRecord,
  validateMaterialRecord,
  validateTemplateRecord,
} from "./schemaRecords";

/** Runtime structural checks before reference integrity. */
export function validateCatalogStructure(raw: unknown): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  if (!isRecord(raw)) {
    pushError(issues, "bad-shape", "manifest must be an object");
    return issues;
  }
  if (raw.schemaVersion !== 1) {
    pushError(issues, "schema-version", `Unsupported schemaVersion ${String(raw.schemaVersion)}`);
  }
  if (!isNonEmptyString(raw.catalogVersion) || !isNonEmptyString(raw.generatedAt)) {
    pushError(issues, "bad-shape", "catalogVersion and generatedAt are required");
  }
  for (const key of ["licenses", "files", "materials", "items", "templates"] as const) {
    if (!Array.isArray(raw[key])) pushError(issues, "bad-shape", `${key} must be an array`);
  }
  if (Array.isArray(raw.licenses)) {
    raw.licenses.forEach((license, i) => validateLicense(license, i, issues));
  }
  if (Array.isArray(raw.files)) {
    raw.files.forEach((file, i) => validateFileRecord(file, i, issues));
  }
  if (Array.isArray(raw.items)) {
    raw.items.forEach((item, i) => validateItemRecord(item, i, issues));
  }
  if (Array.isArray(raw.materials)) {
    raw.materials.forEach((material, i) => validateMaterialRecord(material, i, issues));
  }
  if (Array.isArray(raw.templates)) {
    raw.templates.forEach((template, i) => validateTemplateRecord(template, i, issues));
  }
  return issues;
}
