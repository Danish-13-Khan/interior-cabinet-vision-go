import type { CabinetConfig } from "../cabinetDimensions";
import type { EntityExtensions, InteriorObjectEntity } from "../interiorProject/types";
import { catalogBindingFor } from "./catalogBindings";
import { familyResolvedFromType, resolveFamilyId } from "./families";
import { parseCabinetType } from "./parseType";
import {
  CABINET_IDENTITY_EXTENSION,
  CABINET_PLANNING_EXTENSION,
  type CabinetIdentityRecord,
} from "./types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function extensionRecord(
  extensions: EntityExtensions | undefined,
  key: string,
): Record<string, unknown> | null {
  return record(extensions?.[key]);
}

export function readPlanningExtension(extensions: EntityExtensions | undefined) {
  return extensionRecord(extensions, CABINET_PLANNING_EXTENSION);
}

function identityFromRecord(value: Record<string, unknown>): CabinetIdentityRecord | null {
  const cabinetType = parseCabinetType(value.cabinetType);
  if (!cabinetType) return null;
  const familyId = resolveFamilyId(value.familyId, cabinetType);
  if (!familyId) return null;
  return {
    objectId: typeof value.objectId === "string" ? value.objectId : "",
    catalogItemId: typeof value.catalogItemId === "string" ? value.catalogItemId : "",
    sku: typeof value.sku === "string" ? value.sku : null,
    cabinetType,
    familyId,
    familyResolvedFromType: familyResolvedFromType(value.familyId),
    category: typeof value.category === "string" ? value.category : "",
    name: typeof value.name === "string" ? value.name : "",
    roomId: typeof value.roomId === "string" ? value.roomId : "",
  };
}

export function readIdentityExtension(
  extensions: EntityExtensions | undefined,
): CabinetIdentityRecord | null {
  const raw = extensionRecord(extensions, CABINET_IDENTITY_EXTENSION);
  return raw ? identityFromRecord(raw) : null;
}

export function identityFromConfig(
  config: CabinetConfig | undefined,
  fallback: Partial<CabinetIdentityRecord> = {},
): CabinetIdentityRecord | null {
  if (!config) return null;
  const cabinetType = parseCabinetType(config.type);
  const familyId = resolveFamilyId(config.familyId, config.type);
  if (!cabinetType || !familyId) return null;
  return {
    objectId: fallback.objectId ?? "",
    catalogItemId: config.catalogItemId ?? fallback.catalogItemId ?? `cabinet:${cabinetType}`,
    sku: config.sku ?? fallback.sku ?? null,
    cabinetType,
    familyId,
    familyResolvedFromType: familyResolvedFromType(config.familyId),
    category: fallback.category ?? "",
    name: fallback.name ?? "",
    roomId: fallback.roomId ?? "",
  };
}

/** Resolve identity without using display category as type. */
export function readCabinetIdentity(object: InteriorObjectEntity): CabinetIdentityRecord | null {
  const fromExtension = readIdentityExtension(object.extensions);
  if (fromExtension) {
    return {
      ...fromExtension,
      objectId: fromExtension.objectId || object.id,
      catalogItemId: fromExtension.catalogItemId || object.catalogItemId,
      category: fromExtension.category || object.category,
      name: fromExtension.name || object.name,
      roomId: fromExtension.roomId || object.roomId,
    };
  }
  const planning = readPlanningExtension(object.extensions);
  const config = planning?.config as CabinetConfig | undefined;
  const fromConfig = identityFromConfig(config, {
    objectId: typeof planning?.sourceId === "string" ? planning.sourceId : object.id,
    catalogItemId: object.catalogItemId,
    category: object.category,
    name: object.name,
    roomId: object.roomId,
    sku: typeof object.parameters.sku === "string" ? object.parameters.sku : null,
  });
  if (fromConfig) return fromConfig;
  const binding = catalogBindingFor(object.catalogItemId);
  if (!binding) return null;
  return {
    objectId: object.id,
    catalogItemId: object.catalogItemId,
    sku: binding.sku ?? (typeof object.parameters.sku === "string" ? object.parameters.sku : null),
    cabinetType: binding.cabinetType,
    familyId: binding.familyId,
    category: object.category,
    name: object.name,
    roomId: object.roomId,
  };
}
