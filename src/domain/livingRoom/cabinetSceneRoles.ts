import type { CabinetPanelMaterial } from "../cabinetGeometry/types";
import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import { materialSlot } from "./sceneAdapterTypes";

export const CABINET_SCENE_ROLES = [
  "carcass",
  "fronts",
  "back",
  "shelves",
  "toe-kick",
  "end-panel",
  "filler",
  "countertop",
  "hardware",
  "glass",
  "fallback",
] as const;

export type CabinetSceneRole = (typeof CABINET_SCENE_ROLES)[number];

const SLOT_FOR_ROLE: Record<CabinetSceneRole, string> = {
  carcass: "carcass",
  fronts: "fronts",
  back: "back",
  shelves: "shelves",
  "toe-kick": "carcass",
  "end-panel": "carcass",
  filler: "carcass",
  countertop: "countertop",
  hardware: "hardware",
  glass: "glass",
  fallback: "carcass",
};

/** Map engineering panel names onto semantic visual roles. */
export function cabinetSceneRole(
  panelName: string,
  panelMaterial: CabinetPanelMaterial,
): CabinetSceneRole {
  if (panelName === "fallback-carcass") return "fallback";
  if (panelMaterial === "metal") return "hardware";
  if (panelMaterial === "glass") return "glass";
  if (panelName === "toe-kick" || panelName.startsWith("toe-kick")) return "toe-kick";
  if (panelName.includes("end-panel")) return "end-panel";
  if (panelName.startsWith("filler") || panelName.endsWith("-filler")) return "filler";
  if (panelName.startsWith("shelf-") || panelName.includes("shelf")) return "shelves";
  if (
    panelMaterial === "door"
    || panelName.includes("door")
    || panelName.includes("drawer-front")
    || panelName.startsWith("drawer-")
  ) {
    return "fronts";
  }
  if (panelMaterial === "back" || panelName.includes("back-panel")) return "back";
  return "carcass";
}

export function materialIdForCabinetRole(
  object: InteriorObjectEntity,
  role: CabinetSceneRole,
): string {
  const slot = SLOT_FOR_ROLE[role];
  const fallback = role === "countertop"
    ? LIVING_ROOM_MATERIAL_IDS.warmStone
    : role === "hardware"
      ? LIVING_ROOM_MATERIAL_IDS.charcoalMetal
      : role === "glass"
        ? LIVING_ROOM_MATERIAL_IDS.clearGlass
        : materialSlot(object, "carcass", LIVING_ROOM_MATERIAL_IDS.naturalOak);
  return materialSlot(object, slot, fallback);
}
