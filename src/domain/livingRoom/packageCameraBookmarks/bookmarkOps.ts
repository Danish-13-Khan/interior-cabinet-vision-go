import type { CameraEntity, PackageCameraBookmark } from "../../interiorProject";

export type ResolvedPackageCameraView = PackageCameraBookmark & {
  sortOrder: number;
  cameraName: string;
  fieldOfViewDegrees: number;
  isDefault: boolean;
};

function cameraById(cameras: CameraEntity[], cameraId: string) {
  return cameras.find((camera) => camera.id === cameraId);
}

export function sanitizePackageCameraBookmarks(
  bookmarks: PackageCameraBookmark[] | undefined,
  cameras: CameraEntity[],
): PackageCameraBookmark[] {
  const seen = new Set<string>();
  const safe: PackageCameraBookmark[] = [];
  for (const bookmark of bookmarks ?? []) {
    const cameraId = bookmark.cameraId?.trim();
    const viewName = bookmark.viewName?.trim();
    if (!cameraId || !viewName || seen.has(cameraId)) continue;
    const camera = cameraById(cameras, cameraId);
    if (!camera) continue;
    seen.add(cameraId);
    safe.push({ cameraId, viewName: viewName.slice(0, 80) });
  }
  return safe;
}

export function createDefaultPackageCameraBookmarks(
  cameras: CameraEntity[],
): PackageCameraBookmark[] {
  return cameras.map((camera) => ({
    cameraId: camera.id,
    viewName: camera.name,
  }));
}

export function isPackageCameraBookmarked(
  bookmarks: PackageCameraBookmark[],
  cameraId: string,
) {
  return bookmarks.some((bookmark) => bookmark.cameraId === cameraId);
}

export function togglePackageCameraBookmark(
  bookmarks: PackageCameraBookmark[],
  cameras: CameraEntity[],
  cameraId: string,
): PackageCameraBookmark[] {
  if (isPackageCameraBookmarked(bookmarks, cameraId)) {
    return bookmarks.filter((bookmark) => bookmark.cameraId !== cameraId);
  }
  const camera = cameraById(cameras, cameraId);
  if (!camera) return bookmarks;
  return [...bookmarks, { cameraId, viewName: camera.name }];
}

export function setPackageCameraViewName(
  bookmarks: PackageCameraBookmark[],
  cameraId: string,
  viewName: string,
): PackageCameraBookmark[] {
  const draft = viewName.slice(0, 80);
  return bookmarks.map((bookmark) =>
    bookmark.cameraId === cameraId ? { ...bookmark, viewName: draft } : bookmark,
  );
}

export function commitPackageCameraViewName(
  bookmarks: PackageCameraBookmark[],
  cameras: CameraEntity[],
  cameraId: string,
  viewName: string,
): PackageCameraBookmark[] {
  const trimmed = viewName.trim().slice(0, 80);
  const fallback = cameraById(cameras, cameraId)?.name ?? "";
  const committed = trimmed || fallback;
  if (!committed) return bookmarks;
  return setPackageCameraViewName(bookmarks, cameraId, committed);
}

export function movePackageCameraBookmark(
  bookmarks: PackageCameraBookmark[],
  cameraId: string,
  direction: -1 | 1,
): PackageCameraBookmark[] {
  const index = bookmarks.findIndex((bookmark) => bookmark.cameraId === cameraId);
  if (index < 0) return bookmarks;
  const target = index + direction;
  if (target < 0 || target >= bookmarks.length) return bookmarks;
  const next = [...bookmarks];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function resolvePackageCameraViews(
  bookmarks: PackageCameraBookmark[],
  cameras: CameraEntity[],
): ResolvedPackageCameraView[] {
  return sanitizePackageCameraBookmarks(bookmarks, cameras).map((bookmark, index) => {
    const camera = cameraById(cameras, bookmark.cameraId)!;
    return {
      ...bookmark,
      sortOrder: index + 1,
      cameraName: camera.name,
      fieldOfViewDegrees: camera.fieldOfViewDegrees,
      isDefault: Boolean(camera.isDefault),
    };
  });
}
