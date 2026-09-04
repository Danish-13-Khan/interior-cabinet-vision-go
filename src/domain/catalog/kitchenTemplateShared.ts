import {
  createGoldenCabinetInstance,
  persistCabinetIdentityOnObject,
  RUN_FILLER_CATALOG_ID,
  type GoldenCabinetFamilyId,
} from "../cabinetIdentity";
import { orderRunMembers } from "../cabinetRuns";
import { cabinetObject } from "../interiorProject/cabinetAdapterCabinets";
import {
  orientWallForRoom,
  type InteriorObjectEntity,
  type InteriorProject,
  type Point3Mm,
} from "../interiorProject";
import {
  cabinetRunForObject,
  isCabinetRunFiller,
} from "../livingRoom/wardrobePlacement";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import { attached, placementAt, wallLength } from "../livingRoom/wallSegmentPlacement";
import { createDefaultPackageCameraBookmarks } from "../livingRoom/packageCameraBookmarks";

export { snapCatalogObjectsToWall } from "./kitchenAppliancePlacement";
export const WALL_MOUNT_Y_MM = 1400;
const FILLER_WIDTH_MM = 100;
const FILLER_DEPTH_MM = 18;

export function wallBySide(project: InteriorProject, side: string) {
  return project.walls.find((wall) => wall.extensions?.wallSide === side) ?? null;
}

export function seedCabinet(
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

export function seedEndFillers(
  project: InteriorProject,
  runId: string,
  idFactory: LivingRoomIdFactory,
) {
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
      id: idFactory("object", `filler-${runId}-${side}`),
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
  const without = project.objects.filter((object) => {
    const filler = object.extensions?.cabinetRunFiller as { runId?: string } | undefined;
    return filler?.runId !== runId;
  });
  return {
    ...project,
    objects: [
      ...without,
      make("start", first, along(first) - first.dimensions.widthMm / 2 - FILLER_WIDTH_MM / 2),
      make("end", last, along(last) + last.dimensions.widthMm / 2 + FILLER_WIDTH_MM / 2),
    ],
  };
}

export function mountWallCabinets(
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

export function alongWallMm(
  project: InteriorProject,
  roomId: string,
  wallId: string,
  object: InteriorObjectEntity,
): number {
  const stored = project.walls.find((wall) => wall.id === wallId)!;
  const wall = orientWallForRoom(project, roomId, stored);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  return (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
}

export function applyKitchenReviewCamera(
  project: InteriorProject,
  roomId: string,
  idFactory: LivingRoomIdFactory,
  camera: { position: Point3Mm; target: Point3Mm },
): InteriorProject {
  const entity = {
    id: idFactory("camera", "run-review"),
    roomId,
    name: "Run review",
    position: camera.position,
    target: camera.target,
    fieldOfViewDegrees: 40,
    isDefault: true,
  };
  const others = project.cameras.map((item) => ({ ...item, isDefault: false }));
  const cameras = [entity, ...others];
  return {
    ...project,
    cameras,
    renderSettings: {
      ...project.renderSettings,
      activeCameraId: entity.id,
      lightingRecipeId: "neutral-studio",
      packageCameraBookmarks: createDefaultPackageCameraBookmarks(cameras),
    },
  };
}
