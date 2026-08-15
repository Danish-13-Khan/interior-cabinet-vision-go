import type { InteriorProject } from "../../interiorProject";
import { isMillworkObject } from "../stillJob/sceneRefs";
import { resolveMaterialLabels, slotRecord } from "./formatMaterials";
import {
  MILLWORK_SCHEDULE_HONESTY_NOTE,
  MILLWORK_SCHEDULE_VERSION,
  type MillworkSchedule,
  type MillworkScheduleLine,
} from "./types";

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
      const materialSlots = slotRecord(object.materialSlots);
      return {
        objectId: object.id,
        name: object.name,
        category: object.category,
        kind: object.kind,
        roomId: object.roomId,
        widthMm: object.dimensions.widthMm,
        heightMm: object.dimensions.heightMm,
        depthMm: object.dimensions.depthMm,
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
