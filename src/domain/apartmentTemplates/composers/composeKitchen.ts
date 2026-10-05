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
import { COUNTER_WINDOW_SILL_MM } from "./wallPieces";
import { addUnderCabinetLights, hostKitchenAppliances } from "./kitchenAppliances";
import { composeSecondaryLeg, KitchenLegDoesNotFitError } from "./kitchenSecondaryLeg";
import { addRoomFixtureKinds } from "./roomLights";

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
  // Base runs pass under a counter-height window; the overlap check still guards tall / wall units.
  const under = { passUnderWindowsFromMm: COUNTER_WINDOW_SILL_MM };
  const piece = longestFreePieceOnSide(next, roomId, runSide, runWidth + fillerPad, under)
    ?? longestFreePieceOnSide(next, roomId, runSide, runWidth, under);
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
  const styled = seeds.map((seed) => {
    const isWall = seed.position.y >= 1000 || String(seed.catalogItemId).includes("wall")
      || seed.id.includes("-wall-");
    if (isWall && options.wallDoorStyle) {
      return applyCabinetFrontOptions(seed, { ...options, doorStyle: options.wallDoorStyle });
    }
    return applyCabinetFrontOptions(seed, options);
  });
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

  if (layout === "L" || layout === "parallel") {
    if (!options.secondarySide) {
      throw new KitchenLegDoesNotFitError(`${layout} kitchen in ${roomId} needs a secondarySide`);
    }
    next = composeSecondaryLeg(
      next, roomId, options.secondarySide, runSide, piece.wall, idFactory, layout, options,
    );
  }

  next = hostKitchenAppliances(next, roomId, [ids.baseA, ids.drawer, ids.baseB], options, idFactory);

  if (options.underCabinetLights !== false && options.wallCabinets !== false) {
    next = addUnderCabinetLights(next, roomId, [ids.wallA, ids.wallB]);
  }
  const extra: Array<"ceiling-downlight" | "profile" | "cob"> = [];
  if (options.downlight) extra.push("ceiling-downlight");
  if (options.profileLight) extra.push("profile");
  if (options.cobLight) extra.push("cob");
  if (extra.length) next = addRoomFixtureKinds(next, roomId, extra);
  return applyFinishRolesToCabinets(next, roomId);
}
