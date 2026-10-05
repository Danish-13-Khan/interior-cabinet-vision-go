import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { FoyerComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import { placeCatalogOnWall, withActiveRoom } from "./helpers";

export type ComposeFoyerArgs = FoyerComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/**
 * Foyer shoe storage — reuses `living:console-table` via parameters (catalog cap).
 */
export function composeFoyer(
  project: InteriorProject,
  roomId: string,
  options: ComposeFoyerArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const side: WallSide = options.shoeCabinetSide ?? "east";
  let next = withActiveRoom(project, roomId);
  next = placeCatalogOnWall(
    next, roomId, side, "living:console-table", `${roomId}-shoe`, idFactory, 0.5,
  );
  const shoe = next.objects.find((object) => object.id === idFactory("object", `${roomId}-shoe`));
  if (!shoe) return next;
  return {
    ...next,
    objects: next.objects.map((object) => object.id === shoe.id
      ? {
          ...object,
          name: "Shoe cabinet",
          parameters: { ...object.parameters, apartmentRole: "shoe-cabinet" },
        }
      : object),
  };
}
