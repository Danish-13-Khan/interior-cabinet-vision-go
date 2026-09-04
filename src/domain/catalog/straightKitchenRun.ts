import {
  createGoldenCabinetInstance,
  persistCabinetIdentityOnObject,
  RUN_FILLER_CATALOG_ID,
  type GoldenCabinetFamilyId,
} from "../cabinetIdentity";
import { orderRunMembers } from "../cabinetRuns";
import { cabinetObject } from "../interiorProject/cabinetAdapterCabinets";
import { orientWallForRoom, type InteriorObjectEntity, type InteriorProject, type Point3Mm } from "../interiorProject";
import {
  arrangeCabinetRun,
  cabinetRunForObject,
  isCabinetRunFiller,
  updateCabinetRunLayout,
} from "../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import { attached, placementAt, wallLength } from "../livingRoom/wallSegmentPlacement";
import { createDefaultPackageCameraBookmarks } from "../livingRoom/packageCameraBookmarks";

const WALL_MOUNT_Y_MM = 1400;
const FILLER_WIDTH_MM = 100;
const FILLER_DEPTH_MM = 18;

function wallBySide(project: InteriorProject, side: string) {
  return project.walls.find((wall) => wall.extensions?.wallSide === side) ?? null;
}

function seedCabinet(
  roomId: string,
  familyId: GoldenCabinetFamilyId,
  id: string,
  position: Point3Mm,
): InteriorObjectEntity {
  const instance = createGoldenCabinetInstance(familyId, id);
  return persistCabinetIdentityOnObject(cabinetObject(roomId, {
    ...instance,
    placement: { ...instance.placement, x: position.x, y: position.y, z: position.z },
  }));
}

function seedEndFillers(project: InteriorProject, runId: string, idFactory: LivingRoomIdFactory) {
  const members = project.objects.filter((object) => {
    const meta = cabinetRunForObject(object);
    return meta?.runId === runId && !isCabinetRunFiller(object);
  });
  const wallId = cabinetRunForObject(members[0]!)?.wallId;
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!stored || members.length < 2) return project;
  const wall = orientWallForRoom(project, members[0]!.roomId, stored);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const along = (object: InteriorObjectEntity) =>
    (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const ordered = orderRunMembers(members, along);
  const first = ordered[0]!;
  const last = ordered[ordered.length - 1]!;
  const make = (side: "start" | "end", member: InteriorObjectEntity, center: number) => {
    const draft: InteriorObjectEntity = {
      id: idFactory("object", `filler-${side}`),
      roomId: member.roomId,
      kind: "cabinet",
      category: "filler",
      catalogItemId: RUN_FILLER_CATALOG_ID,
      name: "Run filler",
      position: { ...member.position },
      rotation: { ...member.rotation },
      dimensions: {
        widthMm: FILLER_WIDTH_MM,
        heightMm: member.dimensions.heightMm,
        depthMm: FILLER_DEPTH_MM,
      },
      materialSlots: {},
      parameters: { filler: true },
      extensions: {
        placement: "wall",
        wallAttachment: { wallId: wall.id },
        cabinetRunFiller: { runId, side },
      },
    };
    return persistCabinetIdentityOnObject(attached(draft, placementAt(wall, draft, center)));
  };
  const without = project.objects.filter((object) => !isCabinetRunFiller(object));
  return {
    ...project,
    objects: [
      ...without,
      make("start", first, along(first) - first.dimensions.widthMm / 2 - FILLER_WIDTH_MM / 2),
      make("end", last, along(last) + last.dimensions.widthMm / 2 + FILLER_WIDTH_MM / 2),
    ],
  };
}

function mountWallCabinets(
  project: InteriorProject,
  wallId: string,
  wallCabinets: Array<{ id: string; alongMm: number }>,
): InteriorProject {
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!stored) return project;
  const roomId = project.activeRoomId ?? project.rooms[0]?.id;
  if (!roomId) return project;
  const wall = orientWallForRoom(project, roomId, stored);
  return {
    ...project,
    objects: project.objects.map((object) => {
      const target = wallCabinets.find((item) => item.id === object.id);
      if (!target) return object;
      return persistCabinetIdentityOnObject(attached(object, placementAt(wall, object, target.alongMm)));
    }),
  };
}

function applyReviewCamera(
  project: InteriorProject,
  roomId: string,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const camera = {
    id: idFactory("camera", "run-review"),
    roomId,
    name: "Run review",
    position: { x: 0, y: 1600, z: 1500 },
    target: { x: 0, y: 900, z: -1700 },
    fieldOfViewDegrees: 40,
    isDefault: true,
  };
  const others = project.cameras.map((item) => ({ ...item, isDefault: false }));
  const cameras = [camera, ...others];
  return {
    ...project,
    cameras,
    renderSettings: {
      ...project.renderSettings,
      activeCameraId: camera.id,
      lightingRecipeId: "neutral-studio",
      packageCameraBookmarks: createDefaultPackageCameraBookmarks(cameras),
    },
  };
}

/** Place smart production cabinets + review camera on a Straight Kitchen shell. */
export function finalizeStraightKitchenTemplate(
  project: InteriorProject,
  options: { roomId: string; idFactory: LivingRoomIdFactory },
): InteriorProject {
  const { roomId, idFactory } = options;
  const back = wallBySide(project, "back");
  if (!back) return applyReviewCamera(project, roomId, idFactory);

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
  if (!runId) return applyReviewCamera(arranged, roomId, idFactory);

  const withFillers = seedEndFillers(
    updateCabinetRunLayout(arranged, runId, { fillersEnabled: true }),
    runId,
    idFactory,
  );
  const baseA = withFillers.objects.find((item) => item.id === ids.baseA)!;
  const drawer = withFillers.objects.find((item) => item.id === ids.drawer)!;
  const wall = orientWallForRoom(withFillers, roomId, back);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const along = (object: InteriorObjectEntity) =>
    (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const mounted = mountWallCabinets(withFillers, back.id, [
    { id: ids.wallA, alongMm: along(baseA) },
    { id: ids.wallB, alongMm: along(drawer) },
  ]);
  return applyReviewCamera(mounted, roomId, idFactory);
}
