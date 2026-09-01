import type { CabinetType } from "../cabinetCapabilities";
import { isStorageType } from "../cabinetCapabilities";
import {
  CABINET_FAMILY_IDS,
  GOLDEN_CABINET_FAMILY_IDS,
  type CabinetFamilyId,
  type GoldenCabinetFamilyId,
} from "./types";

export const CABINET_FAMILY_LABELS: Record<CabinetFamilyId, string> = {
  "frameless-standard-base": "Frameless Standard Base",
  "frameless-standard-wall": "Frameless Standard Wall",
  "frameless-standard-tall": "Frameless Standard Tall",
  "frameless-standard-drawer": "Frameless Standard Drawer",
  "frameless-standard-almirah": "Frameless Standard Almirah",
  "frameless-standard-corner": "Frameless Standard Corner",
  "frameless-standard-sink": "Frameless Standard Sink",
  "frameless-standard-open-shelf": "Frameless Standard Open Shelf",
};

const FAMILY_TYPE: Record<CabinetFamilyId, CabinetType> = {
  "frameless-standard-base": "base",
  "frameless-standard-wall": "wall",
  "frameless-standard-tall": "tall",
  "frameless-standard-drawer": "drawer",
  "frameless-standard-almirah": "almirah",
  "frameless-standard-corner": "corner",
  "frameless-standard-sink": "sink",
  "frameless-standard-open-shelf": "open-shelf",
};

const TYPE_FAMILY: Partial<Record<CabinetType, CabinetFamilyId>> = {
  base: "frameless-standard-base",
  wall: "frameless-standard-wall",
  tall: "frameless-standard-tall",
  drawer: "frameless-standard-drawer",
  almirah: "frameless-standard-almirah",
  corner: "frameless-standard-corner",
  sink: "frameless-standard-sink",
  "open-shelf": "frameless-standard-open-shelf",
};

export function isCabinetFamilyId(value: unknown): value is CabinetFamilyId {
  return typeof value === "string" && (CABINET_FAMILY_IDS as readonly string[]).includes(value);
}

export function isGoldenCabinetFamilyId(value: unknown): value is GoldenCabinetFamilyId {
  return typeof value === "string" && (GOLDEN_CABINET_FAMILY_IDS as readonly string[]).includes(value);
}

export function familyType(familyId: CabinetFamilyId): CabinetType {
  return FAMILY_TYPE[familyId];
}

export function defaultFamilyIdForType(type: CabinetType): CabinetFamilyId | undefined {
  return TYPE_FAMILY[type];
}

export function isProductionCabinetType(type: CabinetType): boolean {
  return isStorageType(type);
}

export function declaredFamilyId(familyId: unknown): string | undefined {
  return typeof familyId === "string" && familyId.trim() ? familyId.trim() : undefined;
}

/** Keep explicit unknown values. Default only when family is absent. */
export function resolveFamilyId(familyId: unknown, type: CabinetType): string | undefined {
  if (isCabinetFamilyId(familyId)) return familyId;
  const declared = declaredFamilyId(familyId);
  if (declared) return declared;
  return defaultFamilyIdForType(type);
}

export function completeFamilyId(
  familyId: unknown,
  type: CabinetType,
): CabinetFamilyId | undefined {
  const resolved = resolveFamilyId(familyId, type);
  return isCabinetFamilyId(resolved) ? resolved : undefined;
}

export function familyResolvedFromType(familyId: unknown): boolean {
  return !declaredFamilyId(familyId);
}

export function familyLabel(familyId: string | null | undefined): string | null {
  return familyId && isCabinetFamilyId(familyId) ? CABINET_FAMILY_LABELS[familyId] : null;
}
