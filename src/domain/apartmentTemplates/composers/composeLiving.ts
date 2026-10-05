import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { LivingComposeOptions, WallSide } from "../types";
import { wallOnSide } from "../wallSide";
import { apartmentIdFactory } from "../ids";
import {
  placeCatalogInRoom,
  placeCatalogOnWall,
  withActiveRoom,
} from "./helpers";

export type ComposeLivingArgs = LivingComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** TV wall, sofa set, optional feature wall and cove/track lights. */
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
    const wall = wallOnSide(next, roomId, tvSide);
    if (wall) {
      next = addWallDecoration(
        withActiveRoom(next, roomId), wall.id, options.featureWallPreset,
      );
    }
  } else {
    next = placeCatalogOnWall(
      next, roomId, tvSide, "living:feature-wall-fluted", `${roomId}-feature`, idFactory, 0.5,
    );
  }

  if (options.sofaSet !== false) {
    next = placeCatalogInRoom(
      next, roomId, "living:sofa-3-seat", `${roomId}-sofa`, idFactory,
      { x: 0, z: bounds.depthMm * 0.18, rotationY: 0 },
      bounds,
    );
    next = placeCatalogInRoom(
      next, roomId, "living:coffee-table", `${roomId}-coffee`, idFactory,
      { x: 0, z: 0 },
      bounds,
    );
    next = placeCatalogInRoom(
      next, roomId, "living:area-rug", `${roomId}-rug`, idFactory,
      { x: 0, z: bounds.depthMm * 0.05 },
      bounds,
    );
  }

  next = withActiveRoom(next, roomId);
  if (options.coveLight !== false) {
    const wall = wallOnSide(next, roomId, tvSide);
    if (wall) {
      next = addRoomLightFixture(next, "cove", { kind: "wall", wallId: wall.id });
    }
  }
  if (options.trackLight) {
    next = addRoomLightFixture(next, "track", { kind: "ceiling" });
  }
  return next;
}
