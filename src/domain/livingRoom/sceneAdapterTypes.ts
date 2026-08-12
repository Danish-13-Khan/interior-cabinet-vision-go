import type { InteriorObjectEntity } from "../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "./materials";
import type { CompiledPrimitive } from "./sceneTypes";

export type LivingRoomObjectAdapter = {
  id: string;
  catalogItemId: string;
  compile: (object: InteriorObjectEntity) => CompiledPrimitive[];
};

export const materialSlot = (
  object: InteriorObjectEntity,
  name: string,
  fallback: string = LIVING_ROOM_MATERIAL_IDS.naturalOak,
) => object.materialSlots[name] ?? fallback;
