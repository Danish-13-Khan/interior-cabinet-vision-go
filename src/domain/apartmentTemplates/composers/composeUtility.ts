import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { arrangeCabinetRun } from "../../livingRoom/wardrobePlacement";
import { seedCabinet } from "../../catalog/kitchenTemplateShared";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { UtilityComposeOptions, WallSide } from "../types";
import { wallOnSide } from "../wallSide";
import { apartmentIdFactory } from "../ids";
import { withActiveRoom } from "./helpers";

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
  const wall = wallOnSide(next, roomId, side);
  if (!wall) return next;
  const bounds = roomPlanViewBounds(next, roomId);
  const tallId = idFactory("object", `${roomId}-tall`);
  const seed = seedCabinet(roomId, "frameless-standard-tall", tallId, {
    x: bounds.centerX, y: 0, z: bounds.centerZ,
  });
  seed.catalogItemId = "living:tall-pantry-600";
  seed.name = "Utility tall unit";
  seed.parameters = { ...seed.parameters, apartmentRole: "utility-tall" };
  next = { ...next, objects: [...next.objects, seed] };
  return arrangeCabinetRun(next, [tallId], wall.id, { alignment: "center", gapMm: 0 });
}
