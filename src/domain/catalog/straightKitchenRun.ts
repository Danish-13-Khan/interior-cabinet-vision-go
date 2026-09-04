import type { InteriorProject } from "../interiorProject";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  updateCabinetRunLayout,
} from "../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import {
  alongWallMm,
  applyKitchenReviewCamera,
  mountWallCabinets,
  seedCabinet,
  seedEndFillers,
  wallBySide,
  WALL_MOUNT_Y_MM,
} from "./kitchenTemplateShared";

/** Place smart production cabinets + review camera on a Straight Kitchen shell. */
export function finalizeStraightKitchenTemplate(
  project: InteriorProject,
  options: { roomId: string; idFactory: LivingRoomIdFactory },
): InteriorProject {
  const { roomId, idFactory } = options;
  const review = (next: InteriorProject) => applyKitchenReviewCamera(next, roomId, idFactory, {
    position: { x: 0, y: 1600, z: 1500 },
    target: { x: 0, y: 900, z: -1700 },
  });
  const back = wallBySide(project, "back");
  if (!back) return review(project);

  const ids = {
    tall: idFactory("object", "run-tall"),
    baseA: idFactory("object", "run-base-a"),
    drawer: idFactory("object", "run-drawer"),
    baseB: idFactory("object", "run-base-b"),
    wallA: idFactory("object", "run-wall-a"),
    wallB: idFactory("object", "run-wall-b"),
  };
  const seeds = [
    seedCabinet(roomId, "frameless-standard-tall", ids.tall, { x: -1000, y: 0, z: 0 }),
    seedCabinet(roomId, "frameless-standard-base", ids.baseA, { x: -200, y: 0, z: 0 }),
    seedCabinet(roomId, "frameless-standard-drawer", ids.drawer, { x: 700, y: 0, z: 0 }),
    seedCabinet(roomId, "frameless-standard-base", ids.baseB, { x: 1600, y: 0, z: 0 }),
    seedCabinet(roomId, "frameless-standard-wall", ids.wallA, { x: -200, y: WALL_MOUNT_Y_MM, z: 0 }),
    seedCabinet(roomId, "frameless-standard-wall", ids.wallB, { x: 700, y: WALL_MOUNT_Y_MM, z: 0 }),
  ];
  const sourced = { ...project, objects: [...project.objects, ...seeds] };
  const floorIds = [ids.tall, ids.baseA, ids.drawer, ids.baseB];
  const arranged = arrangeCabinetRun(sourced, floorIds, back.id, { alignment: "center", gapMm: 0 });
  const runId = cabinetRunForObject(arranged.objects.find((item) => item.id === ids.baseA)!)?.runId;
  if (!runId) return review(arranged);

  const withFillers = seedEndFillers(
    updateCabinetRunLayout(arranged, runId, { fillersEnabled: true }),
    runId,
    idFactory,
  );
  const baseA = withFillers.objects.find((item) => item.id === ids.baseA)!;
  const drawer = withFillers.objects.find((item) => item.id === ids.drawer)!;
  const mounted = mountWallCabinets(withFillers, back.id, [
    { id: ids.wallA, alongMm: alongWallMm(withFillers, roomId, back.id, baseA) },
    { id: ids.wallB, alongMm: alongWallMm(withFillers, roomId, back.id, drawer) },
  ]);
  return review(mounted);
}
