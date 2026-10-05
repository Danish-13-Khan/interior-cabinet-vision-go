import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import { isWallPanelObject } from "../../livingRoom/panelAttachment";
import type { FinishRole } from "../types";

type Roles = Partial<Record<FinishRole, string>>;

/** Display joinery that takes the accent front finish instead of the primary one. */
const ACCENT_JOINERY = new Set(["living:tv-unit", "living:display-niche", "living:open-shelf-900", "living:bookcase"]);
/** Main face of a decor panel → wall-panel role; secondary faces → front-accent. */
const PANEL_FACE_SLOTS = ["face", "field", "slats", "surface", "finish"];
const PANEL_ACCENT_SLOTS = ["groove", "trim", "backing", "frame"];

function rolePatch(object: InteriorObjectEntity, roles: Roles): Record<string, string> | null {
  const slots = object.materialSlots ?? {};
  const patch: Record<string, string> = {};
  // Planned cabinets always carry carcass / fronts / countertop; other items only the slots they declare.
  const cabinet = object.kind === "cabinet";
  const set = (slot: string, role: FinishRole) => {
    const id = roles[role];
    if (id && (slot in slots || (cabinet && ["carcass", "fronts", "countertop"].includes(slot)))) patch[slot] = id;
  };
  if ("mirror" in slots) return null;
  if (isWallPanelObject(object) || object.catalogItemId?.startsWith("living:wall-panel")) {
    PANEL_FACE_SLOTS.forEach((slot) => set(slot, "wall-panel"));
    PANEL_ACCENT_SLOTS.forEach((slot) => set(slot, "front-accent"));
    return patch;
  }
  if (!cabinet && !("carcass" in slots) && !("fronts" in slots)) return null;
  set("carcass", "carcass");
  set("fronts", ACCENT_JOINERY.has(String(object.catalogItemId)) ? "front-accent" : "front-primary");
  set("countertop", "worktop");
  return patch;
}

/**
 * Apply the template finish roles (D9) to joinery and decor in one room:
 * kitchens, wardrobes, vanities, TV units, niches, shelves and wall panels.
 */
export function applyFinishRolesToRoom(project: InteriorProject, roomId: string): InteriorProject {
  const roles = project.extensions?.finishRoles as Roles | undefined;
  if (!roles) return project;
  return {
    ...project,
    objects: project.objects.map((object) => {
      if (object.roomId !== roomId) return object;
      const patch = rolePatch(object, roles);
      if (!patch || Object.keys(patch).length === 0) return object;
      return { ...object, materialSlots: { ...object.materialSlots, ...patch } };
    }),
  };
}

export function applyFinishRolesToAllRooms(project: InteriorProject): InteriorProject {
  return project.rooms.reduce((next, room) => applyFinishRolesToRoom(next, room.id), project);
}
