import type { CameraEntity, InteriorProject, PackageCameraBookmark } from "../interiorProject";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import { withProposalViewSelection } from "../livingRoom/proposal/proposalViewSelection";
import { frameJoineryCamera } from "./frameJoineryCamera";
import { frameRoomCamera } from "./frameRoomCamera";
import { cutListCabinets } from "./joineryBounds";
import type { ApartmentTemplateSpec } from "./types";

/** Field of view of a hand-authored spec camera (the hero room's three-quarter shot). */
export const AUTHORED_SHOWCASE_FOV = 44;

/**
 * One showcase camera and package bookmark per room: the spec's authored
 * camera when it has one (the hero, D2a), else one fitted to the room's
 * cut-list joinery (D2), else one that looks at the room's busiest wall (D2b).
 * The hero camera becomes the active default, and the proposal's default
 * views are stored as an explicit selection (D1): hero first, then joinery
 * rooms by cabinet count.
 */
export function applyShowcaseCameras(
  project: InteriorProject,
  spec: ApartmentTemplateSpec,
  roomKeyToId: Map<string, string>,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const cameras: CameraEntity[] = [];
  const bookmarks: PackageCameraBookmark[] = [];
  const cabinetCount = new Map<string, number>();
  for (const room of spec.rooms) {
    const roomId = roomKeyToId.get(room.key);
    if (!roomId) continue;
    const pose = room.camera
      ? { position: { ...room.camera.eyeMm }, target: { ...room.camera.targetMm }, fieldOfViewDegrees: AUTHORED_SHOWCASE_FOV }
      : frameJoineryCamera(project, roomId) ?? frameRoomCamera(project, roomId);
    const cameraId = idFactory("camera", `${room.key}-showcase`);
    cameras.push({
      id: cameraId,
      roomId,
      name: `${room.name} Showcase`,
      position: pose.position,
      target: pose.target,
      fieldOfViewDegrees: pose.fieldOfViewDegrees,
      isDefault: room.key === spec.heroRoomKey,
    });
    bookmarks.push({ cameraId, viewName: `${room.name} Showcase` });
    cabinetCount.set(cameraId, cutListCabinets(project, roomId).length);
  }
  if (!cameras.length) return project;
  const hero = cameras.find((camera) => camera.isDefault) ?? cameras[0]!;
  const kept = project.cameras.filter(
    (camera) => !cameras.some((next) => next.id === camera.id),
  );
  const priorBookmarks = project.renderSettings.packageCameraBookmarks ?? [];
  const keptBookmarks = priorBookmarks.filter(
    (bookmark) => !bookmarks.some((next) => next.cameraId === bookmark.cameraId),
  );
  const count = (cameraId: string) => cabinetCount.get(cameraId) ?? 0;
  // Bookmark order is print order: hero, joinery rooms by cabinet count, then the rest in spec order.
  const ordered = [
    hero.id,
    ...cameras.filter((camera) => camera !== hero && count(camera.id) > 0)
      .sort((a, b) => count(b.id) - count(a.id))
      .map((camera) => camera.id),
    ...cameras.filter((camera) => camera !== hero && count(camera.id) === 0).map((camera) => camera.id),
  ];
  const byId = new Map(bookmarks.map((bookmark) => [bookmark.cameraId, bookmark]));
  return withProposalViewSelection(
    {
      ...project,
      cameras: [...kept, ...cameras],
      renderSettings: {
        ...project.renderSettings,
        activeCameraId: hero.id,
        packageCameraBookmarks: [...keptBookmarks, ...ordered.map((cameraId) => byId.get(cameraId)!)],
      },
    },
    ordered.filter((cameraId) => cameraId === hero.id || count(cameraId) > 0),
  );
}
