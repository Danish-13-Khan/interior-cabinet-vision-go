import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { finalizeBathroomTemplate } from "../../catalog/bathroomSurfaces";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { attachLightToObject } from "../../livingRoom/lightAttachments";
import { placeCatalogItemWithDefaults } from "../../catalog/placeCatalogItem";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { BathroomComposeOptions, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  longestFreePieceOnSide,
  offsetTowardSide,
  oppositeSide,
  withActiveRoom,
} from "./helpers";
import { addRoomFixtureKinds } from "./roomLights";

export type ComposeBathroomArgs = BathroomComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Vanity + WC relative to vanitySide; mirror + optional rope light. */
export function composeBathroom(
  project: InteriorProject,
  roomId: string,
  options: ComposeBathroomArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const vanitySide: WallSide = options.vanitySide ?? "north";
  let next = withActiveRoom(project, roomId);
  const bounds = roomPlanViewBounds(next, roomId);

  next = finalizeBathroomTemplate(next, { roomId });

  const vanityPose = offsetTowardSide(vanitySide, bounds, 0.28);
  const vanityId = idFactory("object", `${roomId}-vanity`);
  next = placeCatalogItemWithDefaults(next, "bathroom-sink-1", {
    objectId: vanityId,
    roomId,
    position: {
      x: bounds.centerX + vanityPose.x,
      y: 0,
      z: bounds.centerZ + vanityPose.z,
    },
    rotationY: vanityPose.rotationY,
  });

  const wall = longestFreePieceOnSide(next, roomId, vanitySide, 600)?.wall;
  if (wall) {
    next = addWallDecoration(
      withActiveRoom(next, roomId),
      wall.id,
      "mirror",
      { id: idFactory("object", `${roomId}-mirror`) },
    );
  }

  const wcPose = offsetTowardSide(oppositeSide(vanitySide), bounds, 0.28);
  // Nudge WC off-center so it does not sit on top of the vanity axis.
  const wcOffset = vanitySide === "north" || vanitySide === "south"
    ? { x: bounds.widthMm * 0.18, z: wcPose.z }
    : { x: wcPose.x, z: bounds.depthMm * 0.18 };
  next = placeCatalogItemWithDefaults(next, "toilet-1", {
    objectId: idFactory("object", `${roomId}-wc`),
    roomId,
    position: {
      x: bounds.centerX + wcOffset.x,
      y: 0,
      z: bounds.centerZ + wcOffset.z,
    },
    rotationY: wcPose.rotationY,
  });

  if (options.mirrorRopeLight !== false) {
    next = withActiveRoom(next, roomId);
    const before = new Set(next.lights.map((light) => light.id));
    next = addRoomLightFixture(next, "rope", { kind: "object", hostObjectId: vanityId });
    const added = next.lights.find((light) => !before.has(light.id));
    const mirror = next.objects.find(
      (object) => object.roomId === roomId && object.catalogItemId === "living:wall-mirror",
    );
    if (added && mirror) next = attachLightToObject(next, added.id, mirror.id);
    else if (added) next = attachLightToObject(next, added.id, vanityId);
  }
  const bathLights: Array<"ceiling-downlight" | "cob"> = [];
  if (options.downlight) bathLights.push("ceiling-downlight");
  if (options.cobLight) bathLights.push("cob");
  if (bathLights.length) next = addRoomFixtureKinds(next, roomId, bathLights);
  return next;
}
