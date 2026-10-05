import {
  arrangeCabinetRun,
  cabinetRunForObject,
  updateCabinetRunLayout,
} from "../../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import {
  alongWallMm,
  mountWallCabinets,
  seedCabinet,
  seedEndFillers,
  WALL_MOUNT_Y_MM,
} from "../../catalog/kitchenTemplateShared";
import { roomPlanViewBounds, type InteriorProject } from "../../interiorProject";
import type { KitchenComposeOptions, KitchenLayout, WallSide } from "../types";
import { apartmentIdFactory } from "../ids";
import {
  applyCabinetFrontOptions,
  applyFinishRolesToCabinets,
} from "./cabinetOptions";
import {
  fixedAlongToRoomAlongMm,
  longestFreePieceOnSide,
  withActiveRoom,
} from "./helpers";
import { addUnderCabinetLights, hostKitchenAppliances } from "./kitchenAppliances";

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
  const layout: KitchenLayout = options.layout ?? "straight";
  let next = withActiveRoom(project, roomId);
  const bounds = roomPlanViewBounds(next, roomId);
  const runWidth = (options.tallPantry ? 600 : 0) + 2700;
  const fillerPad = 280 * 2;
  const piece = longestFreePieceOnSide(next, roomId, runSide, runWidth + fillerPad)
    ?? longestFreePieceOnSide(next, roomId, runSide, runWidth);
  if (!piece) return next;
  const canFill = piece.lengthMm + 0.5 >= runWidth + fillerPad;

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
  const styled = seeds.map((seed) => applyCabinetFrontOptions(seed, options));
  next = { ...next, objects: [...next.objects, ...styled] };
  const floorIds = styled.filter((object) => object.position.y < 100).map((o) => o.id);
  const occupied = canFill ? runWidth + fillerPad : runWidth;
  const fixedStart = piece.startAlongMm
    + (canFill ? 280 : 0)
    + Math.max(0, (piece.lengthMm - occupied) / 2);
  const startAlong = fixedAlongToRoomAlongMm(
    next, roomId, piece.wall, fixedStart, runWidth,
  );
  next = arrangeCabinetRun(next, floorIds, piece.wall.id, {
    alignment: "start",
    startAlongMm: startAlong,
    gapMm: 0,
  });
  const runId = cabinetRunForObject(next.objects.find((o) => o.id === ids.baseA)!)?.runId;
  if (runId && canFill) {
    next = seedEndFillers(
      updateCabinetRunLayout(next, runId, { fillersEnabled: true }),
      runId,
      idFactory,
    );
  }
  if (options.wallCabinets !== false) {
    const baseA = next.objects.find((o) => o.id === ids.baseA)!;
    const drawer = next.objects.find((o) => o.id === ids.drawer)!;
    next = mountWallCabinets(next, piece.wall.id, [
      { id: ids.wallA, alongMm: alongWallMm(next, roomId, piece.wall.id, baseA) },
      { id: ids.wallB, alongMm: alongWallMm(next, roomId, piece.wall.id, drawer) },
    ], roomId);
  }

  if (layout === "L" && options.secondarySide) {
    next = composeSecondaryLeg(next, roomId, options.secondarySide, idFactory, "L", options);
  } else if (layout === "parallel" && options.secondarySide) {
    next = composeSecondaryLeg(next, roomId, options.secondarySide, idFactory, "parallel", options);
  }

  next = hostKitchenAppliances(next, roomId, [ids.baseA, ids.drawer, ids.baseB], options, idFactory);

  if (options.underCabinetLights !== false && options.wallCabinets !== false) {
    next = addUnderCabinetLights(next, roomId, [ids.wallA, ids.wallB]);
  }
  return applyFinishRolesToCabinets(next, roomId);
}

/** L leg starts this far from the corner so it clears the primary run depth. */
const L_CORNER_CLEARANCE_MM = 600;

function composeSecondaryLeg(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  idFactory: LivingRoomIdFactory,
  layout: "L" | "parallel",
  options: ComposeKitchenArgs,
): InteriorProject {
  const needed = layout === "L" ? 1800 : 2700;
  const piece = longestFreePieceOnSide(project, roomId, side, needed);
  if (!piece) return project;
  const bounds = roomPlanViewBounds(project, roomId);
  const count = layout === "L" ? 2 : 3;
  const ids = Array.from({ length: count }, (_, index) =>
    idFactory("object", `${roomId}-leg-${index}`));
  const seeds = ids.map((id, index) => applyCabinetFrontOptions(
    seedCabinet(roomId, "frameless-standard-base", id, {
      x: bounds.centerX + index * 100, y: 0, z: bounds.centerZ + index * 100,
    }),
    options,
  ));
  const next = { ...project, objects: [...project.objects, ...seeds] };
  // Real seeded width (today 2 or 3 × 900 frameless bases), not the search width.
  const legWidth = seeds.reduce((sum, seed) => sum + seed.dimensions.widthMm, 0);
  const slack = Math.max(0, piece.lengthMm - legWidth);
  // L: push away from the corner so the secondary leg does not collide with the primary run.
  const fixedStart = layout === "L"
    ? piece.startAlongMm + Math.min(L_CORNER_CLEARANCE_MM, slack)
    : piece.startAlongMm + slack / 2;
  // Convert with the real leg width (not `needed`) so a stored wall that runs
  // high→low mirrors the leg onto the same fixed-end span.
  const startAlong = fixedAlongToRoomAlongMm(
    next, roomId, piece.wall, fixedStart, legWidth,
  );
  return arrangeCabinetRun(next, ids, piece.wall.id, {
    alignment: "start",
    startAlongMm: startAlong,
    gapMm: 0,
  });
}
