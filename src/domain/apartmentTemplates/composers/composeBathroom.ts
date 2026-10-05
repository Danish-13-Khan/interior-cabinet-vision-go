import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import { finalizeBathroomTemplate } from "../../catalog/bathroomSurfaces";
import { addWallDecoration } from "../../livingRoom/wallDecorations";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { attachLightToObject } from "../../livingRoom/lightAttachments";
import { placeCatalogItemWithDefaults } from "../../catalog/placeCatalogItem";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import type { BathroomComposeOptions, WallSide } from "../types";
import { wallOnSide } from "../wallSide";
import { apartmentIdFactory } from "../ids";
import { withActiveRoom } from "./helpers";

export type ComposeBathroomArgs = BathroomComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Vanity, mirror + optional rope light; wet-room finishes. */
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

  const vanityId = idFactory("object", `${roomId}-vanity`);
  next = placeCatalogItemWithDefaults(next, "bathroom-sink-1", {
    objectId: vanityId,
    roomId,
    position: { x: bounds.centerX - 400, y: 0, z: bounds.centerZ - bounds.depthMm * 0.25 },
  });

  const wall = wallOnSide(next, roomId, vanitySide);
  if (wall) {
    next = addWallDecoration(withActiveRoom(next, roomId), wall.id, "mirror");
  }

  next = placeCatalogItemWithDefaults(next, "toilet-1", {
    objectId: idFactory("object", `${roomId}-wc`),
    roomId,
    position: { x: bounds.centerX + 400, y: 0, z: bounds.centerZ - bounds.depthMm * 0.25 },
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
  return next;
}
