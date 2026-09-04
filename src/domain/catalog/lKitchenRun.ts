import {
  clampCabinetConfig,
  getDefaultCabinetConfig,
  type CabinetInstance,
} from "../cabinetDimensions";
import { persistCabinetIdentityOnObject } from "../cabinetIdentity";
import { migrateBoxRoomsToWallGraph } from "../interiorProject/boxRoomGraphMigration";
import { cabinetObject } from "../interiorProject/cabinetAdapterCabinets";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import {
  listRoomWallCorners,
  placeCornerCabinet,
} from "../livingRoom/cornerPlacement";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  updateCabinetRunLayout,
} from "../livingRoom/wardrobePlacement";
import {
  alongWallMm,
  applyKitchenReviewCamera,
  mountWallCabinets,
  seedCabinet,
  seedEndFillers,
  wallBySide,
  WALL_MOUNT_Y_MM,
} from "./kitchenTemplateShared";

const CORNER_FOOTPRINT_MM = 900;

function seedCorner(roomId: string, id: string): InteriorObjectEntity {
  const defaults = getDefaultCabinetConfig("corner");
  const config = clampCabinetConfig({
    ...defaults,
    type: "corner",
    familyId: "frameless-standard-corner",
    catalogItemId: "cabinet:corner",
    dimensions: {
      ...defaults.dimensions,
      width: CORNER_FOOTPRINT_MM,
      height: 720,
      depth: CORNER_FOOTPRINT_MM,
    },
  });
  const instance: CabinetInstance = {
    id,
    name: `corner ${CORNER_FOOTPRINT_MM}`,
    displayCategory: "storage",
    interiorObjectId: id,
    config,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    layerId: "layer-default",
    groupId: null,
  };
  return persistCabinetIdentityOnObject(cabinetObject(roomId, instance));
}

function backRightCorner(project: InteriorProject, roomId: string, backId: string, rightId: string) {
  return listRoomWallCorners(project, roomId).find((corner) =>
    corner.wallIds.includes(backId) && corner.wallIds.includes(rightId)
  ) ?? null;
}

function finalizeRun(
  project: InteriorProject,
  objectIds: string[],
  wallId: string,
  options: { alignment?: "start" | "end"; startAlongMm?: number },
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const arranged = arrangeCabinetRun(project, objectIds, wallId, {
    alignment: options.alignment ?? "start",
    startAlongMm: options.startAlongMm,
    gapMm: 0,
  });
  const runId = cabinetRunForObject(arranged.objects.find((item) => item.id === objectIds[0]!)!)?.runId;
  if (!runId) return arranged;
  return seedEndFillers(
    updateCabinetRunLayout(arranged, runId, {
      fillersEnabled: true,
      startAlongMm: options.startAlongMm,
    }),
    runId,
    idFactory,
  );
}

/** Place L runs (back + right), corner, wall cabinets, and review camera. */
export function finalizeLKitchenTemplate(
  project: InteriorProject,
  options: { roomId: string; idFactory: LivingRoomIdFactory },
): InteriorProject {
  const { roomId, idFactory } = options;
  const review = (next: InteriorProject) => applyKitchenReviewCamera(next, roomId, idFactory, {
    position: { x: -400, y: 1700, z: 900 },
    target: { x: 1600, y: 900, z: -1400 },
  });
  const graph = migrateBoxRoomsToWallGraph(project);
  const back = wallBySide(graph, "back");
  const right = wallBySide(graph, "right");
  if (!back || !right) return review(graph);

  const ids = {
    tall: idFactory("object", "l-tall"),
    baseBack: idFactory("object", "l-base-back"),
    drawer: idFactory("object", "l-drawer"),
    corner: idFactory("object", "l-corner"),
    baseRightA: idFactory("object", "l-base-right-a"),
    baseRightB: idFactory("object", "l-base-right-b"),
    wallBack: idFactory("object", "l-wall-back"),
    wallRight: idFactory("object", "l-wall-right"),
  };
  const junction = backRightCorner(graph, roomId, back.id, right.id);
  const cornerSeed = seedCorner(roomId, ids.corner);
  const placedCorner = junction
    ? placeCornerCabinet(graph, cornerSeed, junction)
    : cornerSeed;
  const seeds = [
    seedCabinet(roomId, "frameless-standard-tall", ids.tall, { x: -1200, y: 0, z: -1000 }),
    seedCabinet(roomId, "frameless-standard-base", ids.baseBack, { x: -200, y: 0, z: -1000 }),
    seedCabinet(roomId, "frameless-standard-drawer", ids.drawer, { x: 700, y: 0, z: -1000 }),
    placedCorner,
    seedCabinet(roomId, "frameless-standard-base", ids.baseRightA, { x: 2000, y: 0, z: -200 }),
    seedCabinet(roomId, "frameless-standard-base", ids.baseRightB, { x: 2000, y: 0, z: 800 }),
    seedCabinet(roomId, "frameless-standard-wall", ids.wallBack, {
      x: -200, y: WALL_MOUNT_Y_MM, z: -1000,
    }),
    seedCabinet(roomId, "frameless-standard-wall", ids.wallRight, {
      x: 2000, y: WALL_MOUNT_Y_MM, z: -200,
    }),
  ];
  let next: InteriorProject = { ...graph, objects: [...graph.objects, ...seeds] };
  // Back leg ends just before the corner; right leg starts past the corner footprint.
  const backRunWidthMm = 600 + 900 + 900;
  const backLen = Math.hypot(back.end.x - back.start.x, back.end.z - back.start.z);
  next = finalizeRun(
    next,
    [ids.tall, ids.baseBack, ids.drawer],
    back.id,
    { startAlongMm: Math.max(0, backLen - CORNER_FOOTPRINT_MM - backRunWidthMm - 80) },
    idFactory,
  );
  next = finalizeRun(
    next,
    [ids.baseRightA, ids.baseRightB],
    right.id,
    { startAlongMm: CORNER_FOOTPRINT_MM + 120 },
    idFactory,
  );

  const baseBack = next.objects.find((item) => item.id === ids.baseBack)!;
  const baseRightA = next.objects.find((item) => item.id === ids.baseRightA)!;
  next = mountWallCabinets(next, back.id, [
    { id: ids.wallBack, alongMm: alongWallMm(next, roomId, back.id, baseBack) },
  ]);
  next = mountWallCabinets(next, right.id, [
    { id: ids.wallRight, alongMm: alongWallMm(next, roomId, right.id, baseRightA) },
  ]);
  return review(next);
}
