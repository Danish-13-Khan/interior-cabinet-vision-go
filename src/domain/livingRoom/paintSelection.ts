import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { paintLivingRoomSurface } from "./materialLayerCommands";

/** Prefer finishes that read as the object’s face on the 2D plan. */
const PLAN_TINT_SLOT_PRIORITY = ["fronts", "upholstery", "leaf", "surface"] as const;

/** Slots shared by every selected object (intersection of materialSlots keys). */
export function commonMaterialSlots(objects: readonly InteriorObjectEntity[]): string[] {
  if (objects.length === 0) return [];
  const [first, ...rest] = objects;
  return Object.keys(first!.materialSlots).filter((slot) =>
    rest.every((object) => Object.prototype.hasOwnProperty.call(object.materialSlots, slot)),
  );
}

/** Resolves a paint slot; returns null when a requested slot is missing (object is skipped). */
function resolveSlot(object: InteriorObjectEntity, slotName?: string) {
  if (slotName) {
    return Object.prototype.hasOwnProperty.call(object.materialSlots, slotName) ? slotName : null;
  }
  return Object.keys(object.materialSlots)[0] ?? null;
}

/** One undoable paint across the selection; skips objects without the chosen/primary slot. */
export function applyMaterialToSelection(
  project: InteriorProject,
  objectIds: readonly string[],
  materialId: string,
  slotName?: string,
): InteriorProject {
  if (!project.materials.some((material) => material.id === materialId)) return project;
  return objectIds.reduce((next, objectId) => {
    const object = next.objects.find((item) => item.id === objectId);
    if (!object) return next;
    const slot = resolveSlot(object, slotName);
    if (!slot) return next;
    return paintLivingRoomSurface(next, { kind: "object", objectId, slotName: slot }, materialId);
  }, project);
}

/** Material ID used for 2D plan tint (face-first slot when present). */
export function primaryMaterialId(object: InteriorObjectEntity): string | null {
  for (const preferred of PLAN_TINT_SLOT_PRIORITY) {
    if (Object.prototype.hasOwnProperty.call(object.materialSlots, preferred)) {
      return object.materialSlots[preferred] ?? null;
    }
  }
  const slot = Object.keys(object.materialSlots)[0];
  return slot ? object.materialSlots[slot] ?? null : null;
}
