import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { createLivingRoomObject, type LivingRoomCatalogId } from "../../livingRoom/catalog";
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
import { addDecorOnSide } from "./decorPlacement";
import { addRoomFixtureKinds } from "./roomLights";
import { placeWallWardrobe } from "./wardrobeModules";
import { standClearOfWallPanels } from "./wallPanelClearance";

/** Knee room between the sofa front and the coffee table. */
const SEAT_TO_TABLE_MM = 350;

const catalogDepthMm = (catalogItemId: LivingRoomCatalogId) =>
  createLivingRoomObject(catalogItemId, { id: "probe", roomId: "probe", position: { x: 0, y: 0, z: 0 } }).dimensions.depthMm;

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

  const tvId = idFactory("object", `${roomId}-tv`);
  const nicheId = idFactory("object", `${roomId}-niche`);
  next = placeCatalogOnWall(
    next, roomId, tvSide, "living:tv-unit", `${roomId}-tv`, idFactory, 0.45,
  );
  const tv = next.objects.find((object) => object.id === tvId);
  if (options.displayNiche) {
    next = placeCatalogOnWall(
      next, roomId, tvSide, "living:display-niche", `${roomId}-niche`, idFactory, 0.75,
    );
  }

  if (options.featureWallPreset) {
    next = addDecorOnSide(
      next, roomId, tvSide, options.featureWallPreset,
      idFactory("object", `${roomId}-feature-decor`), 600, tv?.position,
    );
  } else {
    next = placeCatalogOnWall(
      next, roomId, tvSide, "living:feature-wall-fluted", `${roomId}-feature`, idFactory, 0.5,
    );
  }
  next = standClearOfWallPanels(next, [tvId, nicheId]);

  if (options.wardrobeSide) {
    const widthMm = options.wardrobeWidthMm ?? 1800;
    const piece = longestFreePieceOnSide(next, roomId, options.wardrobeSide, widthMm);
    if (piece) {
      // Hinged wardrobes wider than 900 mm become a run of almirah modules; sliding stays one carcass.
      next = placeWallWardrobe(next, {
        roomId, piece, widthMm, idFactory,
        front: { wardrobeDoors: options.wardrobeDoors, slidingLeafCount: options.slidingLeafCount },
        startAlongMm: piece.startAlongMm + Math.max(0, (piece.lengthMm - widthMm) / 2),
        position: { x: bounds.centerX, z: bounds.centerZ },
      });
    }
  }

  if (options.sofaSet !== false) {
    const sofa = offsetTowardSide(oppositeSide(tvSide), bounds, 0.18);
    next = placeCatalogInRoom(
      next, roomId, "living:sofa-3-seat", `${roomId}-sofa`, idFactory,
      { x: sofa.x, z: sofa.z, rotationY: sofa.rotationY },
      bounds,
    );
    // Coffee table in front of the sofa, toward the TV, turned to match it.
    const sofaReach = Math.hypot(sofa.x, sofa.z) || 1;
    const tableGap = catalogDepthMm("living:sofa-3-seat") / 2 + SEAT_TO_TABLE_MM + catalogDepthMm("living:coffee-table") / 2;
    const toTable = (sofaReach - tableGap) / sofaReach;
    next = placeCatalogInRoom(
      next, roomId, "living:coffee-table", `${roomId}-coffee`, idFactory,
      { x: sofa.x * toTable, z: sofa.z * toTable, rotationY: sofa.rotationY },
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
