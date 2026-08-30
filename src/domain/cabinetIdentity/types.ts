import type { CabinetType } from "../cabinetCapabilities";

export const CABINET_IDENTITY_EXTENSION = "cabinetIdentity";
export const CABINET_PLANNING_EXTENSION = "cabinetPlanning";

export const GOLDEN_CABINET_FAMILY_IDS = [
  "frameless-standard-base",
  "frameless-standard-wall",
  "frameless-standard-tall",
  "frameless-standard-drawer",
] as const;

export const CABINET_FAMILY_IDS = [
  ...GOLDEN_CABINET_FAMILY_IDS,
  "frameless-standard-almirah",
  "frameless-standard-corner",
  "frameless-standard-sink",
  "frameless-standard-open-shelf",
] as const;

export type GoldenCabinetFamilyId = (typeof GOLDEN_CABINET_FAMILY_IDS)[number];
export type CabinetFamilyId = (typeof CABINET_FAMILY_IDS)[number];

export type CabinetIdentityRecord = {
  objectId: string;
  catalogItemId: string;
  sku: string | null;
  cabinetType: CabinetType;
  familyId: string;
  familyResolvedFromType?: boolean;
  category: string;
  name: string;
  roomId: string;
};

export type AdapterDiagnosticSeverity = "warning" | "error";

export type AdapterDiagnosticCode =
  | "missing-explicit-type"
  | "category-is-not-type"
  | "unknown-family"
  | "family-type-mismatch"
  | "skipped-unidentified-cabinet"
  | "identity-hydrated"
  | "family-resolved-from-type"
  | "lossy-field"
  | "silent-fallback-blocked";

export type AdapterDiagnostic = {
  severity: AdapterDiagnosticSeverity;
  code: AdapterDiagnosticCode;
  path: string;
  message: string;
  objectId?: string;
  blocking: boolean;
};

export type AdapterDiagnosticReport = {
  diagnostics: AdapterDiagnostic[];
  blocking: boolean;
};

export type CatalogCabinetBinding = {
  cabinetType: CabinetType;
  familyId: CabinetFamilyId;
  sku: string | null;
  production: boolean;
};
