import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { seedCabinet } from "../../catalog/kitchenTemplateShared";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { UtilityComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  placeCabinetOnWall,
  withActiveRoom,
} from "./helpers";

export type ComposeUtilityArgs = UtilityComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Tall utility unit on a chosen wall (washing-machine bay later). */
export function composeUtility(
  project: InteriorProject,
  roomId: string,
  options: ComposeUtilityArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const side: WallSide = options.tallUnitSide ?? "north";
  let next = withActiveRoom(project, roomId);
  const piece = longestFreePieceOnSide(next, roomId, side, 600);
  if (!piece) return next;
  const bounds = roomPlanViewBounds(next, roomId);
  const tallId = idFactory("object", `${roomId}-tall`);
  const seed = seedCabinet(roomId, "frameless-standard-tall", tallId, {
    x: bounds.centerX, y: 0, z: bounds.centerZ,
  });
  seed.catalogItemId = "living:tall-pantry-600";
  seed.name = "Utility tall unit";
  seed.parameters = { ...seed.parameters, apartmentRole: "utility-tall" };
  const along = piece.startAlongMm
    + Math.max(0, (piece.lengthMm - seed.dimensions.widthMm) / 2)
    + seed.dimensions.widthMm / 2;
  return placeCabinetOnWall(next, seed, piece.wall, along);
}
