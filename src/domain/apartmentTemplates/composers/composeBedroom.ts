import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { arrangeCabinetRun } from "../../livingRoom/wardrobePlacement";
import {
  seedCabinet,
} from "../../catalog/kitchenTemplateShared";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { BedroomComposeOptions, WallSide } from "../types";
import { wallOnSide } from "../wallSide";
import { apartmentIdFactory } from "../ids";
import {
  placeCatalogInRoom,
  withActiveRoom,
} from "./helpers";

export type ComposeBedroomArgs = BedroomComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Bed, wardrobe on a side, optional headboard decor and pendants. */
export function composeBedroom(
  project: InteriorProject,
  roomId: string,
  options: ComposeBedroomArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const wardrobeSide: WallSide = options.wardrobeSide ?? "east";
  const bedSide: WallSide = options.bedAlongSide ?? "north";
  let next = withActiveRoom(project, roomId);
  const bounds = roomPlanViewBounds(next, roomId);

  const wardrobeWall = wallOnSide(next, roomId, wardrobeSide);
  if (wardrobeWall) {
    const wardrobeId = idFactory("object", `${roomId}-wardrobe`);
    const widthMm = options.wardrobeWidthMm ?? 1800;
    const seed = seedCabinet(roomId, "frameless-standard-tall", wardrobeId, {
      x: bounds.centerX, y: 0, z: bounds.centerZ,
    });
    seed.dimensions = { ...seed.dimensions, widthMm };
    seed.catalogItemId = "living:wardrobe-wall";
    seed.name = "Wardrobe Wall";
    next = { ...next, objects: [...next.objects, seed] };
    next = arrangeCabinetRun(next, [wardrobeId], wardrobeWall.id, {
      alignment: "center",
      gapMm: 0,
    });
  }

  next = placeCatalogInRoom(
    next, roomId, "living:ottoman", `${roomId}-bed-proxy`, idFactory,
    { x: 0, z: -bounds.depthMm * 0.15, rotationY: bedSide === "north" ? 180 : 0 },
    bounds,
  );
  next = placeCatalogInRoom(
    next, roomId, "living:side-table", `${roomId}-side-l`, idFactory,
    { x: -bounds.widthMm * 0.22, z: -bounds.depthMm * 0.22 },
    bounds,
  );
  next = placeCatalogInRoom(
    next, roomId, "living:side-table", `${roomId}-side-r`, idFactory,
    { x: bounds.widthMm * 0.22, z: -bounds.depthMm * 0.22 },
    bounds,
  );

  if (options.headboardDecor) {
    const wall = wallOnSide(next, roomId, bedSide);
    if (wall) next = addWallDecoration(withActiveRoom(next, roomId), wall.id, options.headboardDecor);
  }

  if (options.pendants !== false) {
    next = withActiveRoom(next, roomId);
    next = addRoomLightFixture(next, "pendant", { kind: "ceiling" });
  }
  return next;
}
