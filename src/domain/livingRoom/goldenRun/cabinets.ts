import {
  createGoldenCabinetInstance,
  persistCabinetIdentityOnObject,
  type GoldenCabinetFamilyId,
} from "../../cabinetIdentity";
import { cabinetObject } from "../../interiorProject/cabinetAdapterCabinets";
import type { InteriorObjectEntity, InteriorProject, Point3Mm } from "../../interiorProject";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  updateCabinetRunLayout,
} from "../wardrobePlacement";
import { finalizeGoldenRunObjects } from "./cabinetsLossless";
import { seedGoldenRunFillers } from "./fillers";
import {
  GOLDEN_RUN_FLOOR_IDS,
  GOLDEN_RUN_OBJECT_IDS,
  GOLDEN_RUN_ROOM,
  GOLDEN_RUN_ROOM_ID,
  GOLDEN_RUN_WALL_BACK_ID,
  GOLDEN_RUN_WALL_MOUNT_Y_MM,
  GOLDEN_RUN_WALL_RIGHT_ID,
} from "./types";

function seedCabinet(
  familyId: GoldenCabinetFamilyId,
  id: string,
  position: Point3Mm,
): InteriorObjectEntity {
  const instance = createGoldenCabinetInstance(familyId, id);
  return cabinetObject(GOLDEN_RUN_ROOM_ID, {
    ...instance,
    placement: {
      ...instance.placement,
      x: position.x,
      y: position.y,
      z: position.z,
    },
  });
}

function persistGolden(object: InteriorObjectEntity) {
  return persistCabinetIdentityOnObject(object);
}

function mountWallRun(project: InteriorProject): InteriorProject {
  const wallX = GOLDEN_RUN_ROOM.widthMm / 2 - 175;
  const poses: Record<string, Point3Mm> = {
    [GOLDEN_RUN_OBJECT_IDS.wallA]: { x: wallX, y: GOLDEN_RUN_WALL_MOUNT_Y_MM, z: -500 },
    [GOLDEN_RUN_OBJECT_IDS.wallB]: { x: wallX, y: GOLDEN_RUN_WALL_MOUNT_Y_MM, z: 500 },
  };
  return {
    ...project,
    objects: project.objects.map((object) => {
      const position = poses[object.id];
      if (!position) return object;
      return persistGolden({
        ...object,
        position,
        rotation: { ...object.rotation, y: 270 },
        extensions: {
          ...object.extensions,
          wallAttachment: { wallId: GOLDEN_RUN_WALL_RIGHT_ID },
        },
      });
    }),
  };
}

export function placeGoldenRunCabinets(project: InteriorProject): InteriorProject {
  const seeds = [
    seedCabinet("frameless-standard-tall", GOLDEN_RUN_OBJECT_IDS.tall, { x: -1400, y: 0, z: 0 }),
    seedCabinet("frameless-standard-base", GOLDEN_RUN_OBJECT_IDS.baseA, { x: -500, y: 0, z: 0 }),
    seedCabinet("frameless-standard-drawer", GOLDEN_RUN_OBJECT_IDS.drawer, { x: 400, y: 0, z: 0 }),
    seedCabinet("frameless-standard-base", GOLDEN_RUN_OBJECT_IDS.baseB, { x: 1300, y: 0, z: 0 }),
    seedCabinet("frameless-standard-wall", GOLDEN_RUN_OBJECT_IDS.wallA, {
      x: 2000, y: GOLDEN_RUN_WALL_MOUNT_Y_MM, z: 400,
    }),
    seedCabinet("frameless-standard-wall", GOLDEN_RUN_OBJECT_IDS.wallB, {
      x: 2000, y: GOLDEN_RUN_WALL_MOUNT_Y_MM, z: 1400,
    }),
  ].map((object) => {
    if (object.id !== GOLDEN_RUN_OBJECT_IDS.baseB) return object;
    return persistGolden({
      ...object,
      parameters: { ...object.parameters, doorStyle: "shaker" },
    });
  });
  const sourced = { ...project, objects: seeds };
  const arranged = arrangeCabinetRun(sourced, [...GOLDEN_RUN_FLOOR_IDS], GOLDEN_RUN_WALL_BACK_ID, {
    alignment: "center",
    gapMm: 0,
  });
  const runId = cabinetRunForObject(
    arranged.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseA)!,
  )?.runId;
  if (!runId) throw new Error("Golden run failed to form on the back wall.");
  const mounted = mountWallRun(updateCabinetRunLayout(arranged, runId, { fillersEnabled: true }));
  const withFillers = seedGoldenRunFillers(mounted, runId);
  return { ...withFillers, objects: finalizeGoldenRunObjects(withFillers.objects) };
}
