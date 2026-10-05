import type { FinishId } from "../../materialSystem";
import type { FinishRole } from "../types";
import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";

/** Generic finish roles (D9) — remap later via finish packs. Render materials for 3D. */
export const DEFAULT_FINISH_ROLES: Record<FinishRole, string> = {
  carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
  "front-primary": LIVING_ROOM_MATERIAL_IDS.naturalOak,
  "front-accent": LIVING_ROOM_MATERIAL_IDS.walnut,
  worktop: LIVING_ROOM_MATERIAL_IDS.warmStone,
  "wall-panel": LIVING_ROOM_MATERIAL_IDS.naturalOak,
  floor: LIVING_ROOM_MATERIAL_IDS.warmStone,
};

/** Millwork FinishId per role (cut list / quote), parallel to render materials. */
export const DEFAULT_FINISH_IDS: Record<FinishRole, FinishId> = {
  carcass: "wood-oak",
  "front-primary": "wood-oak",
  "front-accent": "wood-walnut",
  worktop: "grey",
  "wall-panel": "wood-oak",
  floor: "grey",
};

/**
 * Closest production FinishId for each render material a role may use.
 * Fabrics, glass and rugs are deliberately absent: they are not joinery finishes.
 */
const MATERIAL_TO_FINISH_ID: Record<string, FinishId> = {
  [LIVING_ROOM_MATERIAL_IDS.naturalOak]: "wood-oak",
  [LIVING_ROOM_MATERIAL_IDS.walnut]: "wood-walnut",
  [LIVING_ROOM_MATERIAL_IDS.charcoalMetal]: "grey",
  [LIVING_ROOM_MATERIAL_IDS.warmStone]: "grey",
  [LIVING_ROOM_MATERIAL_IDS.wallPaint]: "white-matte",
  [LIVING_ROOM_MATERIAL_IDS.ceilingPaint]: "white-matte",
};

/** Render materials a finish role can bind to (each maps to a production FinishId). */
export const ROLE_MAPPABLE_MATERIAL_IDS: readonly string[] = Object.keys(MATERIAL_TO_FINISH_ID);

/**
 * Resolve production FinishId for a role's render material (D9). Throws on an
 * unmapped material so a template can never show one finish in 3D and quote another.
 */
export function finishIdForRoleMaterial(materialId: string | undefined): FinishId {
  if (!materialId) return "wood-oak";
  const finishId = MATERIAL_TO_FINISH_ID[materialId];
  if (!finishId) {
    throw new Error(`Finish role material "${materialId}" has no production FinishId mapping`);
  }
  return finishId;
}

/** Build FinishId map from role → material bindings. */
export function finishIdsFromRoles(
  roles: Partial<Record<FinishRole, string>>,
): Record<FinishRole, FinishId> {
  const id = (role: FinishRole) => finishIdForRoleMaterial(roles[role] ?? DEFAULT_FINISH_ROLES[role]);
  return {
    carcass: id("carcass"),
    "front-primary": id("front-primary"),
    "front-accent": id("front-accent"),
    worktop: id("worktop"),
    "wall-panel": id("wall-panel"),
    floor: id("floor"),
  };
}
