import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { createLivingRoomObject } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { BedroomComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  offsetTowardSide,
  placeCabinetOnWall,
  placeCatalogInRoom,
  withActiveRoom,
} from "./helpers";
import { applyCabinetFrontOptions } from "./cabinetOptions";
import { addRoomFixtureKinds } from "./roomLights";
import { addDecorOnSide } from "./decorPlacement";
import { placeWallWardrobe } from "./wardrobeModules";
import { objectsCollide } from "./objectBounds";

const BED_TO_SIDE_TABLE_MM = 60;

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
  const piece = longestFreePieceOnSide(next, roomId, wardrobeSide, widthMm + (options.cornerWardrobe ? 120 : 0));
  if (piece && !options.cornerWardrobe) {
    next = placeWallWardrobe(next, {
      roomId, piece, widthMm, idFactory, front: options,
      startAlongMm: piece.startAlongMm + Math.max(0, (piece.lengthMm - widthMm) / 2),
      position: { x: bounds.centerX, z: bounds.centerZ },
    });
  } else if (piece) {
    const wardrobeId = idFactory("object", `${roomId}-wardrobe`);
    // Corner wardrobe: one living:corner-wardrobe carcass. Wall wardrobes (almirah family) go through
    // placeWallWardrobe, which splits hinged ones wider than 900 mm into modules.
    let seed = createLivingRoomObject("living:corner-wardrobe", {
      id: wardrobeId,
      roomId,
      position: { x: bounds.centerX, y: 0, z: bounds.centerZ },
    });
    seed.dimensions = { ...seed.dimensions, widthMm };
    seed = applyCabinetFrontOptions(seed, options);
    // Corner wardrobes tuck into the corner the free piece reaches (inside the return wall).
    const wallLen = Math.hypot(piece.wall.end.x - piece.wall.start.x, piece.wall.end.z - piece.wall.start.z);
    const inset = Math.max(...next.walls.map((wall) => wall.thicknessMm)) / 2;
    const atEnd = piece.startAlongMm > 1 && piece.startAlongMm + piece.lengthMm >= wallLen - 1;
    const along = atEnd
      ? piece.startAlongMm + piece.lengthMm - inset - widthMm / 2
      : piece.startAlongMm + (piece.startAlongMm < 1 ? inset : 0) + widthMm / 2;
    next = placeCabinetOnWall(next, seed, piece.wall, along);
  }

  const bed = offsetTowardSide(bedSide, bounds, 0.22);
  next = placeCatalogInRoom(
    next, roomId, "living:ottoman", `${roomId}-bed-proxy`, idFactory,
    { x: bed.x, z: bed.z, rotationY: bed.rotationY },
    bounds,
  );
  // Side tables near the headboard wall, flanking the bed with a small gap.
  const widthOf = (catalogItemId: "living:ottoman" | "living:side-table") =>
    createLivingRoomObject(catalogItemId, { id: "probe", roomId, position: { x: 0, y: 0, z: 0 } }).dimensions.widthMm;
  const reach = widthOf("living:ottoman") / 2 + BED_TO_SIDE_TABLE_MM + widthOf("living:side-table") / 2;
  const flank = bedSide === "north" || bedSide === "south"
    ? [{ x: bed.x - reach, z: bed.z }, { x: bed.x + reach, z: bed.z }]
    : [{ x: bed.x, z: bed.z - reach }, { x: bed.x, z: bed.z + reach }];
  // A side table that would run into the wardrobe is left out.
  for (const [index, offset] of flank.entries()) {
    const placed = placeCatalogInRoom(
      next, roomId, "living:side-table", `${roomId}-side-${index === 0 ? "l" : "r"}`, idFactory, offset, bounds,
    );
    const table = placed.objects[placed.objects.length - 1]!;
    if (!next.objects.some((other) => other.roomId === roomId && objectsCollide(other, table))) next = placed;
  }

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
