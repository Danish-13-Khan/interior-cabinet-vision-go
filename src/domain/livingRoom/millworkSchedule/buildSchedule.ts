import { readCabinetIdentity } from "../../cabinetIdentity";
import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import { isMillworkObject } from "../stillJob/sceneRefs";
import { LIVING_ROOM_CATALOG } from "../catalog";
import { resolveMaterialLabels, slotRecord } from "./formatMaterials";
import {
  MILLWORK_SCHEDULE_HONESTY_NOTE,
  MILLWORK_SCHEDULE_VERSION,
  type MillworkSchedule,
  type MillworkScheduleLine,
} from "./types";

function materialSlotsFor(object: InteriorObjectEntity) {
  const own = slotRecord(object.materialSlots);
  if (Object.keys(own).length > 0) return own;
  const catalog = LIVING_ROOM_CATALOG.find((item) => item.id === object.catalogItemId);
  return catalog ? slotRecord(catalog.materialSlots) : own;
}

/** One row per millwork instance from live InteriorProject entities. */
export function buildLivingRoomMillworkSchedule(
  project: InteriorProject,
  now = new Date().toISOString(),
): MillworkSchedule {
  const room = project.rooms.find((item) => item.id === project.activeRoomId)
    ?? project.rooms[0];
  const lines: MillworkScheduleLine[] = project.objects
    .filter(isMillworkObject)
    .map((object) => {
      const materialSlots = materialSlotsFor(object);
      return {
        objectId: object.id,
        name: object.name,
        category: object.category,
        kind: object.kind,
        cabinetType: readCabinetIdentity(object)?.cabinetType ?? null,
        familyId: readCabinetIdentity(object)?.familyId ?? null,
        roomId: object.roomId,
        widthMm: object.dimensions.widthMm,
        heightMm: object.dimensions.heightMm,
        depthMm: object.dimensions.depthMm,
        sku: typeof object.parameters.sku === "string" ? object.parameters.sku : null,
        materialSlots,
        materialLabels: resolveMaterialLabels(materialSlots, project.materials),
        quantity: 1 as const,
      };
    });
  return {
    version: MILLWORK_SCHEDULE_VERSION,
    projectId: project.id,
    projectName: project.name,
    exportedAt: now,
    roomId: room?.id ?? "",
    roomName: room?.name ?? "Living Room",
    honestyNote: MILLWORK_SCHEDULE_HONESTY_NOTE,
    lines,
  };
}
