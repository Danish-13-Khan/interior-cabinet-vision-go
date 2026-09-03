import { type CatalogValidationIssue } from "./schemaHelpers";
import { asCatalogManifest, validateCatalogRelations } from "./schemaRelations";
import { validateCatalogStructure } from "./schemaStructure";

export type { CatalogValidationIssue } from "./schemaHelpers";

function crashIssue(error: unknown): CatalogValidationIssue {
  const message = error instanceof Error ? error.message : String(error);
  return {
    level: "error",
    code: "validation-crash",
    message: `Catalog validation crashed: ${message}`,
  };
}

/** Validate provider-neutral catalog manifest. Accepts unknown JSON; never throws. */
export function validateCatalogManifest(raw: unknown): CatalogValidationIssue[] {
  try {
    const structural = validateCatalogStructure(raw);
    if (structural.some((issue) => issue.level === "error")) return structural;
    const manifest = asCatalogManifest(raw);
    if (!manifest) {
      return [{ level: "error", code: "bad-shape", message: "manifest must be an object" }];
    }
    return [...structural, ...validateCatalogRelations(manifest)];
  } catch (error) {
    return [crashIssue(error)];
  }
}

export function assertValidCatalogManifest(raw: unknown): void {
  const errors = validateCatalogManifest(raw).filter((issue) => issue.level === "error");
  if (errors.length) {
    throw new Error(errors.map((issue) => issue.message).join("; "));
  }
}
