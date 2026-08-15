import type { InteriorProject } from "../../interiorProject";
import { isMillworkObject } from "../stillJob/sceneRefs";
import {
  MILLWORK_SCHEDULE_HONESTY_NOTE,
  MILLWORK_SCHEDULE_VERSION,
  type MillworkSchedule,
  type MillworkScheduleLine,
} from "./types";

function slotRecord(slots: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(slots).map(([slot, materialId]) => [slot, materialId]),
  );
}

export function formatMaterialIds(slots: Record<string, string>) {
  return Object.entries(slots)
    .map(([slot, materialId]) => `${slot}=${materialId}`)
    .join("; ");
}

export function millworkScheduleFileBase(projectName: string) {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "living-room";
  return `${slug}-millwork-schedule`;
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
    .map((object) => ({
      objectId: object.id,
      name: object.name,
      category: object.category,
      kind: object.kind,
      roomId: object.roomId,
      widthMm: object.dimensions.widthMm,
      heightMm: object.dimensions.heightMm,
      depthMm: object.dimensions.depthMm,
      materialSlots: slotRecord(object.materialSlots),
      quantity: 1,
    }));
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
