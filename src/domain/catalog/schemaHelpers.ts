export type CatalogValidationIssue = {
  level: "error" | "warn";
  code: string;
  message: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function pushError(
  issues: CatalogValidationIssue[],
  code: string,
  message: string,
): void {
  issues.push({ level: "error", code, message });
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isNonNegNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export const LIFECYCLES = new Set(["active", "deprecated", "blocked"]);
export const PLACEMENTS = new Set(["floor", "wall", "ceiling", "surface"]);
export const FILE_KINDS = new Set(["model", "image", "texture"]);
export const IMAGE_ROLES = new Set(["thumbnail", "preview", "template-thumbnail"]);
export const MATERIAL_KINDS = new Set([
  "wood",
  "fabric",
  "metal",
  "glass",
  "paint",
  "stone",
  "laminate",
  "custom",
]);
export const TEMPLATE_CATEGORIES = new Set([
  "kitchen",
  "living-room",
  "bedroom",
  "bathroom",
  "empty",
]);
