import type { InteriorProject } from "../interiorProject";

/** Showcase bookmark camera for a room, if the apartment template authored one. */
export function showcaseCameraForRoom(project: InteriorProject, roomId: string) {
  const bookmarks = project.renderSettings.packageCameraBookmarks ?? [];
  const bookmarked = new Set(bookmarks.map((bookmark) => bookmark.cameraId));
  const named = project.cameras.find(
    (camera) => camera.roomId === roomId && camera.name.includes("Showcase"),
  );
  if (named && bookmarked.has(named.id)) return named;
  return project.cameras.find((camera) => camera.roomId === roomId && bookmarked.has(camera.id))
    ?? project.cameras.find((camera) => camera.roomId === roomId)
    ?? null;
}
