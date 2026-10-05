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

/**
 * Render-settings patch for "Showcase view" on a room: its showcase camera,
 * or a cleared camera when the room has none (never keep the previous
 * room's). Null when nothing would change, so callers skip an empty undo step.
 */
export function showcaseCameraPatch(
  project: InteriorProject,
  roomId: string,
): { activeCameraId: string | null } | null {
  const next = showcaseCameraForRoom(project, roomId)?.id ?? null;
  return next === (project.renderSettings.activeCameraId ?? null) ? null : { activeCameraId: next };
}
