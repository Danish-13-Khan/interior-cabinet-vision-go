import { useCallback, useMemo } from "react";
import type { InteriorProject, RenderSettings } from "../domain/interiorProject";
import {
  commitPackageCameraViewName,
  movePackageCameraBookmark,
  resolvePackageCameraViews,
  togglePackageCameraBookmark,
} from "../domain/livingRoom";

export function usePackageCameraBookmarkSettings(
  project: InteriorProject,
  onSettingsChange: (patch: Partial<RenderSettings>) => void,
) {
  const bookmarks = project.renderSettings.packageCameraBookmarks;
  const packageViews = useMemo(
    () => resolvePackageCameraViews(bookmarks, project.cameras),
    [bookmarks, project.cameras],
  );
  const bookmarkedCameraIds = useMemo(
    () => new Set(bookmarks.map((item) => item.cameraId)),
    [bookmarks],
  );
  const updateBookmarks = useCallback(
    (next: typeof bookmarks) => onSettingsChange({ packageCameraBookmarks: next }),
    [onSettingsChange],
  );

  return {
    packageViews,
    bookmarkedCameraIds,
    onToggleBookmark: useCallback(
      (cameraId: string) => updateBookmarks(
        togglePackageCameraBookmark(bookmarks, project.cameras, cameraId),
      ),
      [bookmarks, project.cameras, updateBookmarks],
    ),
    onCommitViewName: useCallback(
      (cameraId: string, viewName: string) => updateBookmarks(
        commitPackageCameraViewName(bookmarks, project.cameras, cameraId, viewName),
      ),
      [bookmarks, project.cameras, updateBookmarks],
    ),
    onMoveView: useCallback(
      (cameraId: string, direction: -1 | 1) => updateBookmarks(
        movePackageCameraBookmark(bookmarks, cameraId, direction),
      ),
      [bookmarks, updateBookmarks],
    ),
    onRemoveView: useCallback(
      (cameraId: string) => updateBookmarks(
        togglePackageCameraBookmark(bookmarks, project.cameras, cameraId),
      ),
      [bookmarks, project.cameras, updateBookmarks],
    ),
  };
}
