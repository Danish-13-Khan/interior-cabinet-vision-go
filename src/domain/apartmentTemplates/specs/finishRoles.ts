import type { FinishRole } from "../types";
import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";

/** Generic finish roles (D9) — remap later via finish packs. */
export const DEFAULT_FINISH_ROLES: Record<FinishRole, string> = {
  carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
  "front-primary": LIVING_ROOM_MATERIAL_IDS.naturalOak,
  "front-accent": LIVING_ROOM_MATERIAL_IDS.walnut,
  worktop: LIVING_ROOM_MATERIAL_IDS.warmStone,
  "wall-panel": LIVING_ROOM_MATERIAL_IDS.wallPaint,
  floor: LIVING_ROOM_MATERIAL_IDS.warmStone,
};
