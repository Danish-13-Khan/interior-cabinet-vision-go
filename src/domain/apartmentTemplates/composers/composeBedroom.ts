import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { createLivingRoomObject } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { BedroomComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  offsetTowardSide,
  oppositeSide,
  placeCabinetOnWall,
  placeCatalogInRoom,
  withActiveRoom,
} from "./helpers";
import { applyCabinetFrontOptions } from "./cabinetOptions";
import { addRoomFixtureKinds } from "./roomLights";
import { addDecorOnSide } from "./decorPlacement";

export type ComposeBedroomArgs = BedroomComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Bed, wardrobe (almirah family), optional headboard decor and pendants. */
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

  const widthMm = options.wardrobeWidthMm ?? 1800;
  const piece = longestFreePieceOnSide(next, roomId, wardrobeSide, widthMm);
  if (piece) {
    const wardrobeId = idFactory("object", `${roomId}-wardrobe`);
    // Seed from frameless-standard-almirah via living:wardrobe-wall binding (not tall pantry).
    const catalogId = options.cornerWardrobe ? "living:corner-wardrobe" : "living:wardrobe-wall";
    let seed = createLivingRoomObject(catalogId, {
      id: wardrobeId,
      roomId,
      position: { x: bounds.centerX, y: 0, z: bounds.centerZ },
    });
    seed.dimensions = { ...seed.dimensions, widthMm };
    seed = applyCabinetFrontOptions(seed, options);
    const along = piece.startAlongMm
      + Math.max(0, (piece.lengthMm - widthMm) / 2)
      + widthMm / 2;
    next = placeCabinetOnWall(next, seed, piece.wall, along);
  }

  const bed = offsetTowardSide(bedSide, bounds, 0.22);
  next = placeCatalogInRoom(
    next, roomId, "living:ottoman", `${roomId}-bed-proxy`, idFactory,
    { x: bed.x, z: bed.z, rotationY: bed.rotationY },
    bounds,
  );
  const foot = offsetTowardSide(oppositeSide(bedSide), bounds, 0.12);
  // Side tables near the headboard wall, flanking the bed.
  const flank = bedSide === "north" || bedSide === "south"
    ? [{ x: -bounds.widthMm * 0.22, z: bed.z }, { x: bounds.widthMm * 0.22, z: bed.z }]
    : [{ x: bed.x, z: -bounds.depthMm * 0.22 }, { x: bed.x, z: bounds.depthMm * 0.22 }];
  next = placeCatalogInRoom(
    next, roomId, "living:side-table", `${roomId}-side-l`, idFactory, flank[0]!, bounds,
  );
  next = placeCatalogInRoom(
    next, roomId, "living:side-table", `${roomId}-side-r`, idFactory, flank[1]!, bounds,
  );
  void foot;

  if (options.headboardDecor) {
    next = addDecorOnSide(
      next, roomId, bedSide, options.headboardDecor,
      idFactory("object", `${roomId}-headboard`), 600,
    );
  }

  if (options.pendants !== false) {
    next = withActiveRoom(next, roomId);
    next = addRoomLightFixture(next, "pendant", { kind: "ceiling" });
  }
  const bedLights: Array<"ceiling-downlight" | "cob" | "rope"> = [];
  if (options.downlight) bedLights.push("ceiling-downlight");
  if (options.cobLight) bedLights.push("cob");
  if (bedLights.length) next = addRoomFixtureKinds(next, roomId, bedLights);
  return next;
}
