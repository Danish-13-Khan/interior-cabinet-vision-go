import type { CameraEntity, InteriorProject, PackageCameraBookmark } from "../interiorProject";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import type { ApartmentTemplateSpec } from "./types";

/**
 * One showcase camera bookmark per room that authored `camera` (D4).
 * Hero room camera becomes the active default.
 */
export function applyShowcaseCameras(
  project: InteriorProject,
  spec: ApartmentTemplateSpec,
  roomKeyToId: Map<string, string>,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  const cameras: CameraEntity[] = [];
  const bookmarks: PackageCameraBookmark[] = [];
  for (const room of spec.rooms) {
    if (!room.camera) continue;
    const roomId = roomKeyToId.get(room.key);
    if (!roomId) continue;
    const cameraId = idFactory("camera", `${room.key}-showcase`);
    cameras.push({
      id: cameraId,
      roomId,
      name: `${room.name} Showcase`,
      position: { ...room.camera.eyeMm },
      target: { ...room.camera.targetMm },
      fieldOfViewDegrees: 44,
      isDefault: room.key === spec.heroRoomKey,
    });
    bookmarks.push({ cameraId, viewName: `${room.name} Showcase` });
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
  return {
    ...project,
    cameras: [...kept, ...cameras],
    renderSettings: {
      ...project.renderSettings,
      activeCameraId: hero.id,
      packageCameraBookmarks: [...keptBookmarks, ...bookmarks],
    },
  };
}
