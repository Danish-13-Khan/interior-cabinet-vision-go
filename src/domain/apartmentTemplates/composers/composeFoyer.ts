import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { seedCabinet } from "../../catalog/kitchenTemplateShared";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { FoyerComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  placeCabinetOnWall,
  withActiveRoom,
} from "./helpers";

export type ComposeFoyerArgs = FoyerComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/**
 * Foyer shoe storage as a base cabinet so it appears in the cut list.
 */
export function composeFoyer(
  project: InteriorProject,
  roomId: string,
  options: ComposeFoyerArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const side: WallSide = options.shoeCabinetSide ?? "east";
  let next = withActiveRoom(project, roomId);
  const piece = longestFreePieceOnSide(next, roomId, side, 900);
  if (!piece) return next;
  const bounds = roomPlanViewBounds(next, roomId);
  const shoeId = idFactory("object", `${roomId}-shoe`);
  const seed = seedCabinet(roomId, "frameless-standard-base", shoeId, {
    x: bounds.centerX, y: 0, z: bounds.centerZ,
  });
  seed.name = "Shoe cabinet";
  seed.parameters = { ...seed.parameters, apartmentRole: "shoe-cabinet" };
  const along = piece.startAlongMm
    + Math.max(0, (piece.lengthMm - seed.dimensions.widthMm) / 2)
    + seed.dimensions.widthMm / 2;
  return placeCabinetOnWall(next, seed, piece.wall, along);
}
