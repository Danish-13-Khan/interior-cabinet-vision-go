import type { InteriorProject } from "../interiorProject";
import { cabinetGeometryFallbackObjectIds } from "./cabinetSceneMeta";
import { compileLivingRoomObjectNode } from "./sceneAdapters";

/** Active-room cabinet IDs that compiled with labeled fallback geometry (VIS-010). */
export function activeRoomGeometryFallbackIds(project: InteriorProject): string[] {
  return cabinetGeometryFallbackObjectIds(
    project.objects.filter((object) => object.roomId === project.activeRoomId),
    compileLivingRoomObjectNode,
  );
}
