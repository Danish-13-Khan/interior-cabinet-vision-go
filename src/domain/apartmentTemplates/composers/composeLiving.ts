import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { LivingComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  offsetTowardSide,
  oppositeSide,
  placeCatalogInRoom,
  placeCatalogOnWall,
  withActiveRoom,
} from "./helpers";

export type ComposeLivingArgs = LivingComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** TV wall, sofa set facing it, optional feature wall and cove/track lights. */
export function composeLiving(
  project: InteriorProject,
  roomId: string,
  options: ComposeLivingArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const tvSide: WallSide = options.tvWallSide ?? "north";
  let next = withActiveRoom(project, roomId);
  const bounds = roomPlanViewBounds(next, roomId);

  next = placeCatalogOnWall(
    next, roomId, tvSide, "living:tv-unit", `${roomId}-tv`, idFactory, 0.45,
  );
  next = placeCatalogOnWall(
    next, roomId, tvSide, "living:display-niche", `${roomId}-niche`, idFactory, 0.75,
  );

  if (options.featureWallPreset) {
    const wall = longestFreePieceOnSide(next, roomId, tvSide, 600)?.wall;
    if (wall) {
      next = addWallDecoration(
        withActiveRoom(next, roomId),
        wall.id,
        options.featureWallPreset,
        { id: idFactory("object", `${roomId}-feature-decor`) },
      );
    }
  } else {
    next = placeCatalogOnWall(
      next, roomId, tvSide, "living:feature-wall-fluted", `${roomId}-feature`, idFactory, 0.5,
    );
  }

  if (options.sofaSet !== false) {
    const sofa = offsetTowardSide(oppositeSide(tvSide), bounds, 0.18);
    next = placeCatalogInRoom(
      next, roomId, "living:sofa-3-seat", `${roomId}-sofa`, idFactory,
      { x: sofa.x, z: sofa.z, rotationY: sofa.rotationY },
      bounds,
    );
    next = placeCatalogInRoom(
      next, roomId, "living:coffee-table", `${roomId}-coffee`, idFactory,
      { x: 0, z: 0 },
      bounds,
    );
    next = placeCatalogInRoom(
      next, roomId, "living:area-rug", `${roomId}-rug`, idFactory,
      { x: sofa.x * 0.4, z: sofa.z * 0.4 },
      bounds,
    );
  }

  next = withActiveRoom(next, roomId);
  if (options.coveLight !== false) {
    const wall = longestFreePieceOnSide(next, roomId, tvSide, 400)?.wall;
    if (wall) {
      next = addRoomLightFixture(next, "cove", { kind: "wall", wallId: wall.id });
    }
  }
  if (options.trackLight) {
    next = addRoomLightFixture(next, "track", { kind: "ceiling" });
  }
  return next;
}
