import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { LivingComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import { createLivingRoomObject } from "../../livingRoom/catalog";
import {
  longestFreePieceOnSide,
  offsetTowardSide,
  oppositeSide,
  placeCabinetOnWall,
  placeCatalogInRoom,
  placeCatalogOnWall,
  withActiveRoom,
} from "./helpers";
import { addRoomFixtureKinds } from "./roomLights";

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
  if (options.displayNiche) {
    next = placeCatalogOnWall(
      next, roomId, tvSide, "living:display-niche", `${roomId}-niche`, idFactory, 0.75,
    );
  }

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

  if (options.wardrobeSide) {
    const widthMm = options.wardrobeWidthMm ?? 1800;
    const piece = longestFreePieceOnSide(next, roomId, options.wardrobeSide, widthMm);
    if (piece) {
      const wardrobeId = idFactory("object", `${roomId}-wardrobe`);
      const seed = createLivingRoomObject("living:wardrobe-wall", {
        id: wardrobeId,
        roomId,
        position: { x: bounds.centerX, y: 0, z: bounds.centerZ },
      });
      seed.dimensions = { ...seed.dimensions, widthMm };
      const along = piece.startAlongMm
        + Math.max(0, (piece.lengthMm - widthMm) / 2)
        + widthMm / 2;
      next = placeCabinetOnWall(next, seed, piece.wall, along);
    }
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
  if (options.pendantLight) {
    next = addRoomLightFixture(withActiveRoom(next, roomId), "pendant", { kind: "ceiling" });
  }
  if (options.studyCorner) {
    next = placeCatalogOnWall(
      next, roomId, oppositeSide(tvSide), "living:console-table", `${roomId}-desk`, idFactory, 0.3,
    );
    next = placeCatalogOnWall(
      next, roomId, oppositeSide(tvSide), "living:open-shelf-900", `${roomId}-shelf`, idFactory, 0.7,
    );
  }
  const extra: Array<"profile" | "panel" | "ceiling-downlight" | "cob"> = [];
  if (options.profileLight) extra.push("profile");
  if (options.panelLight) extra.push("panel");
  if (options.downlight) extra.push("ceiling-downlight");
  if (options.cobLight) extra.push("cob");
  if (extra.length) next = addRoomFixtureKinds(next, roomId, extra);
  return next;
}
