import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { primaryMaterialId } from "./paintSelection";
import type { SurfacePaintTarget } from "./surfacePaintFeedback";

/**
 * The requested target, unless it is Selection and nothing selected has an
 * editable slot — then the swatch grid paints the floor instead of vanishing.
 */
export function effectiveSurfacePaintTarget(
  requested: SurfacePaintTarget,
  canPaintSelection: boolean,
): SurfacePaintTarget {
  return requested === "selection" && !canPaintSelection ? "floor" : requested;
}

function roomSurfaceMaterialId(project: InteriorProject, kind: "floor" | "ceiling"): string | null {
  const surface = project.surfaces.find((item) => item.roomId === project.activeRoomId && item.kind === kind);
  if (surface?.materialId) return surface.materialId;
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  const key = kind === "floor" ? "floorMaterialId" : "ceilingMaterialId";
  const fromRoom = room?.extensions?.[key];
  return typeof fromRoom === "string" ? fromRoom : null;
}

/** Material currently applied to the paint target (the swatch shown as applied). */
export function surfacePaintActiveMaterialId(input: {
  project: InteriorProject;
  target: SurfacePaintTarget;
  wallId: string | null;
  selectedObjects: readonly InteriorObjectEntity[];
  slotName: string;
}): string | null {
  const { project, target } = input;
  if (target === "floor" || target === "ceiling") return roomSurfaceMaterialId(project, target);
  if (target === "wall") return project.walls.find((wall) => wall.id === input.wallId)?.materialId ?? null;
  const first = input.selectedObjects[0];
  if (!first) return null;
  return input.slotName ? first.materialSlots[input.slotName] ?? null : primaryMaterialId(first);
}
