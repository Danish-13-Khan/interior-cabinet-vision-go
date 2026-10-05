import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { attachLightToObject } from "../../livingRoom/lightAttachments";
import { placeCatalogItemWithDefaults } from "../../catalog/placeCatalogItem";
import { placeApplianceInCabinet } from "../../hostedAppliances";
import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import type { KitchenComposeOptions } from "../types";
import { withActiveRoom } from "./helpers";

/** Sink on the first base (index 0, base A) of the primary run. */
export const DEFAULT_SINK_HOST_INDEX = 0;
/**
 * Hob on the drawer base (index 1) by design: pots and utensils live in the
 * drawers directly under the cooktop, while the sink keeps base A (index 0)
 * with its plumbing void. Override with `hobHostIndex`.
 */
export const DEFAULT_HOB_HOST_INDEX = 1;

/** `baseIds` is the primary run in order: [base A, drawer, base B]. */
export function hostKitchenAppliances(
  project: InteriorProject,
  roomId: string,
  baseIds: string[],
  options: KitchenComposeOptions,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const sinkHost = baseIds[options.sinkHostIndex ?? DEFAULT_SINK_HOST_INDEX];
  const hobHost = baseIds[options.hobHostIndex ?? DEFAULT_HOB_HOST_INDEX];
  if (!sinkHost || !hobHost) return project;
  const bounds = roomPlanViewBounds(project, roomId);
  const sinkId = idFactory("object", `${roomId}-sink`);
  const hobId = idFactory("object", `${roomId}-hob`);
  let next = placeCatalogItemWithDefaults(project, "kitchen-sink-1", {
    objectId: sinkId, roomId,
    position: { x: bounds.centerX, y: 0, z: bounds.centerZ },
  });
  next = placeCatalogItemWithDefaults(next, "kitchen-stove-electric-1", {
    objectId: hobId, roomId,
    position: { x: bounds.centerX + 200, y: 0, z: bounds.centerZ },
  });
  next = placeApplianceInCabinet(next, sinkId, sinkHost, "sink-bowl");
  return placeApplianceInCabinet(next, hobId, hobHost, "cooktop");
}

export function addUnderCabinetLights(
  project: InteriorProject,
  roomId: string,
  hostIds: string[],
): InteriorProject {
  let next = withActiveRoom(project, roomId);
  for (const hostId of hostIds) {
    if (!next.objects.some((object) => object.id === hostId)) continue;
    const before = new Set(next.lights.map((light) => light.id));
    next = addRoomLightFixture(next, "under-cabinet", { kind: "object", hostObjectId: hostId });
    const added = next.lights.find((light) => !before.has(light.id));
    if (added) next = attachLightToObject(next, added.id, hostId);
  }
  return next;
}
