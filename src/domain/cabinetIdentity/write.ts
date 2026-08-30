import {
  clampCabinetConfig,
  getDefaultCabinetConfig,
  type CabinetConfig,
} from "../cabinetDimensions";
import type { InteriorObjectEntity } from "../interiorProject/types";
import { resolveFamilyId } from "./families";
import { parseCabinetType } from "./parseType";
import { readCabinetIdentity, readPlanningExtension } from "./read";
import {
  CABINET_IDENTITY_EXTENSION,
  CABINET_PLANNING_EXTENSION,
  type CabinetIdentityRecord,
} from "./types";

function skuFromObject(object: InteriorObjectEntity, identity: CabinetIdentityRecord) {
  if (identity.sku) return identity.sku;
  return typeof object.parameters.sku === "string" ? object.parameters.sku : undefined;
}

export function configFromIdentity(
  identity: CabinetIdentityRecord,
  object: InteriorObjectEntity,
  existing?: CabinetConfig,
): CabinetConfig {
  const type = parseCabinetType(identity.cabinetType) ?? existing?.type;
  if (!type) {
    throw new Error("Cannot build a cabinet config without an explicit type.");
  }
  const seed = existing ?? getDefaultCabinetConfig(type);
  return clampCabinetConfig({
    ...seed,
    type,
    familyId: resolveFamilyId(identity.familyId, type),
    catalogItemId: identity.catalogItemId || object.catalogItemId,
    sku: skuFromObject(object, identity),
    dimensions: {
      ...seed.dimensions,
      width: object.dimensions.widthMm,
      height: object.dimensions.heightMm,
      depth: object.dimensions.depthMm,
    },
  });
}

export function identityRecordForObject(
  object: InteriorObjectEntity,
  identity: CabinetIdentityRecord,
): CabinetIdentityRecord {
  return {
    ...identity,
    objectId: identity.objectId || object.id,
    catalogItemId: identity.catalogItemId || object.catalogItemId,
    category: identity.category || object.category,
    name: identity.name || object.name,
    roomId: identity.roomId || object.roomId,
  };
}

/** Write explicit identity and normalized config. Does not infer type from category. */
export function persistCabinetIdentityOnObject(
  object: InteriorObjectEntity,
): InteriorObjectEntity {
  if (object.kind !== "cabinet") return object;
  const identity = readCabinetIdentity(object);
  if (!identity) return object;
  const record = identityRecordForObject(object, identity);
  const planning = readPlanningExtension(object.extensions);
  const existing = planning?.config as CabinetConfig | undefined;
  const config = configFromIdentity(record, object, existing);
  return {
    ...object,
    extensions: {
      ...object.extensions,
      [CABINET_IDENTITY_EXTENSION]: record,
      [CABINET_PLANNING_EXTENSION]: {
        ...planning,
        sourceId: typeof planning?.sourceId === "string" ? planning.sourceId : object.id,
        entityId: typeof planning?.entityId === "string" ? planning.entityId : object.id,
        config,
        attachment: planning?.attachment ?? (config.type === "wall" ? "back-wall" : "floor"),
        displayCategory: object.category,
      },
    },
  };
}
