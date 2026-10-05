import {
  arrangeCabinetRun,
  cabinetRunForObject,
  updateCabinetRunLayout,
} from "../../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import { addRoomLightFixture } from "../../livingRoom/roomLightFixtures";
import { attachLightToObject } from "../../livingRoom/lightAttachments";
import {
  alongWallMm,
  mountWallCabinets,
  seedCabinet,
  seedEndFillers,
  WALL_MOUNT_Y_MM,
} from "../../catalog/kitchenTemplateShared";
import type { InteriorProject } from "../../interiorProject";
import { roomPlanViewBounds } from "../../interiorProject";
import type { KitchenComposeOptions, WallSide } from "../types";
import { wallOnSide } from "../wallSide";
import { apartmentIdFactory } from "../ids";
import { withActiveRoom } from "./helpers";

export type ComposeKitchenArgs = KitchenComposeOptions & {
  idFactory?: LivingRoomIdFactory;
};

/** Straight / L / parallel kitchen run addressed by wall side (§3.2). */
export function composeKitchen(
  project: InteriorProject,
  roomId: string,
  options: ComposeKitchenArgs = {},
): InteriorProject {
  const idFactory = options.idFactory ?? apartmentIdFactory("template:apartment:compose");
  const runSide: WallSide = options.runSide ?? "north";
  const layout = options.layout ?? "straight";
  let next = withActiveRoom(project, roomId);
  const wall = wallOnSide(next, roomId, runSide);
  if (!wall) return next;

  const bounds = roomPlanViewBounds(next, roomId);
  const ids = {
    baseA: idFactory("object", `${roomId}-base-a`),
    drawer: idFactory("object", `${roomId}-drawer`),
    baseB: idFactory("object", `${roomId}-base-b`),
    tall: idFactory("object", `${roomId}-tall`),
    wallA: idFactory("object", `${roomId}-wall-a`),
    wallB: idFactory("object", `${roomId}-wall-b`),
  };
  const seeds = [
    seedCabinet(roomId, "frameless-standard-base", ids.baseA, {
      x: bounds.centerX - 600, y: 0, z: bounds.centerZ,
    }),
    seedCabinet(roomId, "frameless-standard-drawer", ids.drawer, {
      x: bounds.centerX, y: 0, z: bounds.centerZ,
    }),
    seedCabinet(roomId, "frameless-standard-base", ids.baseB, {
      x: bounds.centerX + 600, y: 0, z: bounds.centerZ,
    }),
  ];
  if (options.tallPantry) {
    seeds.unshift(seedCabinet(roomId, "frameless-standard-tall", ids.tall, {
      x: bounds.centerX - 1200, y: 0, z: bounds.centerZ,
    }));
  }
  if (options.wallCabinets !== false) {
    seeds.push(
      seedCabinet(roomId, "frameless-standard-wall", ids.wallA, {
        x: bounds.centerX - 600, y: WALL_MOUNT_Y_MM, z: bounds.centerZ,
      }),
      seedCabinet(roomId, "frameless-standard-wall", ids.wallB, {
        x: bounds.centerX, y: WALL_MOUNT_Y_MM, z: bounds.centerZ,
      }),
    );
  }
  next = { ...next, objects: [...next.objects, ...seeds] };
  const floorIds = seeds
    .filter((object) => object.position.y < 100)
    .map((object) => object.id);
  next = arrangeCabinetRun(next, floorIds, wall.id, { alignment: "center", gapMm: 0 });
  const runId = cabinetRunForObject(next.objects.find((o) => o.id === ids.baseA)!)?.runId;
  if (runId) {
    next = seedEndFillers(
      updateCabinetRunLayout(next, runId, { fillersEnabled: true }),
      runId,
      idFactory,
    );
  }
  if (options.wallCabinets !== false) {
    const baseA = next.objects.find((o) => o.id === ids.baseA)!;
    const drawer = next.objects.find((o) => o.id === ids.drawer)!;
    next = mountWallCabinets(next, wall.id, [
      { id: ids.wallA, alongMm: alongWallMm(next, roomId, wall.id, baseA) },
      { id: ids.wallB, alongMm: alongWallMm(next, roomId, wall.id, drawer) },
    ], roomId);
  }

  if (layout === "L" && options.secondarySide) {
    next = composeSecondaryLeg(next, roomId, options.secondarySide, idFactory);
  }
  if (layout === "parallel" && options.secondarySide) {
    next = composeSecondaryLeg(next, roomId, options.secondarySide, idFactory);
  }

  if (options.underCabinetLights !== false && options.wallCabinets !== false) {
    next = addUnderCabinetLights(next, roomId, [ids.wallA, ids.wallB]);
  }
  return next;
}

function composeSecondaryLeg(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const wall = wallOnSide(project, roomId, side);
  if (!wall) return project;
  const bounds = roomPlanViewBounds(project, roomId);
  const ids = [
    idFactory("object", `${roomId}-leg-a`),
    idFactory("object", `${roomId}-leg-b`),
  ];
  const seeds = ids.map((id, index) => seedCabinet(
    roomId,
    "frameless-standard-base",
    id,
    { x: bounds.centerX + index * 100, y: 0, z: bounds.centerZ + index * 100 },
  ));
  let next = { ...project, objects: [...project.objects, ...seeds] };
  return arrangeCabinetRun(next, ids, wall.id, { alignment: "start", gapMm: 0 });
}

function addUnderCabinetLights(
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
