import {
  getDefaultCabinetConfig,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
} from "../cabinetDimensions";
import {
  CABINET_IDENTITY_EXTENSION,
  resolveFamilyId,
  persistCabinetIdentityOnObject,
  readCabinetIdentity,
  readPlanningExtension,
} from "../cabinetIdentity";
import {
  collectOpeningLeaves,
  setOpeningContentType,
  type OpeningStructure,
} from "../cabinetOpeningStructure";
import { CABINET_EXTENSION } from "./cabinetAdapterShared";
import { objectId } from "./cabinetAdapterIds";
import type { InteriorObjectEntity } from "./types";

export type CabinetObjectExtension = {
  sourceId: string;
  entityId?: string;
  config: CabinetConfig;
  layerId?: string;
  groupId?: string | null;
  attachment: CabinetPlacement["attachment"];
  displayCategory?: string;
  runFiller?: {
    runId: string;
    side: "start" | "end" | "between";
    index?: number;
  };
};

function readRunFiller(
  object: InteriorObjectEntity,
  planning: ReturnType<typeof readPlanningExtension>,
): CabinetObjectExtension["runFiller"] {
  const raw = (planning?.runFiller as CabinetObjectExtension["runFiller"] | undefined)
    ?? (object.extensions?.cabinetRunFiller as CabinetObjectExtension["runFiller"] | undefined);
  if (!raw || typeof raw !== "object") return undefined;
  if (typeof raw.runId !== "string") return undefined;
  if (raw.side !== "start" && raw.side !== "end" && raw.side !== "between") return undefined;
  return {
    runId: raw.runId,
    side: raw.side,
    ...(typeof raw.index === "number" ? { index: raw.index } : {}),
  };
}

function numericParameter(
  parameters: InteriorObjectEntity["parameters"],
  key: string,
  fallback: number,
) {
  const value = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function syncDoorStructure(
  structure: OpeningStructure | undefined,
  type: CabinetConfig["type"],
  widthMm: number,
  hasDoors: boolean,
) {
  if (!structure) return structure;
  const leaves = collectOpeningLeaves(structure.root);
  if (!hasDoors) {
    return leaves
      .filter((leaf) => leaf.contentType === "door")
      .reduce(
        (next, leaf) => setOpeningContentType(next, leaf.id, "open-shelf", type, widthMm),
        structure,
      );
  }
  if (leaves.some((leaf) => leaf.contentType === "door")) return structure;
  return setOpeningContentType(structure, structure.activeOpeningId, "door", type, widthMm);
}

export function cabinetObject(roomId: string, cabinet: CabinetInstance): InteriorObjectEntity {
  const catalogItemId = cabinet.config.catalogItemId ?? `cabinet:${cabinet.config.type}`;
  const familyId = resolveFamilyId(cabinet.config.familyId, cabinet.config.type);
  const runFiller = cabinet.runFiller;
  const extension: CabinetObjectExtension = {
    sourceId: cabinet.id,
    entityId: cabinet.interiorObjectId,
    config: { ...cabinet.config, familyId, catalogItemId },
    layerId: cabinet.layerId,
    groupId: cabinet.groupId,
    attachment: cabinet.placement.attachment,
    displayCategory: cabinet.displayCategory,
    ...(runFiller ? { runFiller } : {}),
  };
  const object: InteriorObjectEntity = {
    id: cabinet.interiorObjectId || objectId(roomId, cabinet.id),
    roomId,
    kind: "cabinet",
    category: cabinet.displayCategory ?? cabinet.config.type,
    catalogItemId,
    name: cabinet.name,
    position: { x: cabinet.placement.x, y: cabinet.placement.y, z: cabinet.placement.z },
    rotation: { x: 0, y: cabinet.placement.rotation, z: 0 },
    dimensions: {
      widthMm: cabinet.config.dimensions.width,
      heightMm: cabinet.config.dimensions.height,
      depthMm: cabinet.config.dimensions.depth,
    },
    materialSlots: {},
    parameters: {
      shelfCount: cabinet.config.shelfCount,
      drawerCount: cabinet.config.drawerCount ?? 0,
      hasDoors: cabinet.config.hasDoors,
      ...(cabinet.config.sku ? { sku: cabinet.config.sku } : {}),
      ...(runFiller ? { filler: true } : {}),
    },
    extensions: {
      [CABINET_EXTENSION]: extension,
      [CABINET_IDENTITY_EXTENSION]: familyId
        ? {
            objectId: cabinet.id,
            catalogItemId,
            sku: cabinet.config.sku ?? null,
            cabinetType: cabinet.config.type,
            familyId,
            category: cabinet.displayCategory ?? cabinet.config.type,
            name: cabinet.name,
            roomId,
          }
        : undefined,
      ...(runFiller ? { cabinetRunFiller: runFiller } : {}),
    },
  };
  return persistCabinetIdentityOnObject(object);
}

export function cabinetFromObject(object: InteriorObjectEntity): CabinetInstance | null {
  const identity = readCabinetIdentity(object);
  if (!identity) return null;
  const planning = readPlanningExtension(object.extensions);
  const payload = (planning?.config as CabinetConfig | undefined)
    ?? getDefaultCabinetConfig(identity.cabinetType);
  const type = identity.cabinetType;
  const shelfCount = numericParameter(object.parameters, "shelfCount", payload.shelfCount);
  const drawerCount = numericParameter(object.parameters, "drawerCount", payload.drawerCount ?? 0);
  const hasDoors = typeof object.parameters.hasDoors === "boolean"
    ? object.parameters.hasDoors
    : payload.hasDoors;
  const openingStructure = syncDoorStructure(
    payload.composition?.openingStructure,
    type,
    object.dimensions.widthMm,
    hasDoors,
  );
  const config: CabinetConfig = {
    ...payload,
    type,
    familyId: identity.familyId,
    catalogItemId: identity.catalogItemId || object.catalogItemId,
    ...(identity.sku || payload.sku ? { sku: identity.sku ?? payload.sku } : {}),
    dimensions: {
      ...payload.dimensions,
      width: object.dimensions.widthMm,
      height: object.dimensions.heightMm,
      depth: object.dimensions.depthMm,
    },
    shelfCount,
    drawerCount,
    hasDoors,
    composition: payload.composition
      ? {
          ...payload.composition,
          openingStructure,
          shelves: { ...payload.composition.shelves, count: shelfCount },
          drawers: { ...payload.composition.drawers, count: drawerCount },
          doors: {
            ...payload.composition.doors,
            enabled: hasDoors,
            style: hasDoors
              ? payload.composition.doors.style === "none"
                ? object.dimensions.widthMm < 600 ? "single" : "double"
                : payload.composition.doors.style
              : "none",
          },
        }
      : undefined,
  };
  const rotation = Math.round(object.rotation.y / 90) * 90;
  const attachment = planning?.attachment;
  const runFiller = readRunFiller(object, planning);
  return {
    id: typeof planning?.sourceId === "string" && planning.sourceId ? planning.sourceId : object.id,
    name: object.name,
    displayCategory: object.category,
    interiorObjectId: typeof planning?.entityId === "string" ? planning.entityId : object.id,
    ...(runFiller ? { runFiller } : {}),
    config,
    placement: {
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
      rotation: ((rotation % 360) + 360) % 360 as CabinetPlacement["rotation"],
      attachment:
        attachment === "back-wall" || attachment === "left-wall" || attachment === "right-wall"
          ? attachment
          : "floor",
    },
    layerId: typeof planning?.layerId === "string" ? planning.layerId : undefined,
    groupId: planning?.groupId === null || typeof planning?.groupId === "string"
      ? planning.groupId
      : undefined,
  };
}
