import { describe, expect, it } from "vitest";
import type { CameraEntity } from "../../interiorProject";
import {
  commitPackageCameraViewName,
  createDefaultPackageCameraBookmarks,
  movePackageCameraBookmark,
  resolvePackageCameraViews,
  sanitizePackageCameraBookmarks,
  setPackageCameraViewName,
  togglePackageCameraBookmark,
} from "./bookmarkOps";

const CAMERAS: CameraEntity[] = [
  {
    id: "cam-a",
    roomId: "room-1",
    name: "Wide Room",
    position: { x: 0, y: 1500, z: 3000 },
    target: { x: 0, y: 800, z: 0 },
    fieldOfViewDegrees: 44,
    isDefault: true,
  },
  {
    id: "cam-b",
    roomId: "room-1",
    name: "TV Wall",
    position: { x: 0, y: 1500, z: 2000 },
    target: { x: 0, y: 900, z: -1800 },
    fieldOfViewDegrees: 42,
    isDefault: false,
  },
];

describe("package camera bookmarks", () => {
  it("creates defaults from saved cameras", () => {
    expect(createDefaultPackageCameraBookmarks(CAMERAS)).toEqual([
      { cameraId: "cam-a", viewName: "Wide Room" },
      { cameraId: "cam-b", viewName: "TV Wall" },
    ]);
  });

  it("toggles, renames, and reorders deck views", () => {
    let bookmarks = togglePackageCameraBookmark([], CAMERAS, "cam-b");
    expect(bookmarks).toHaveLength(1);
    bookmarks = togglePackageCameraBookmark(bookmarks, CAMERAS, "cam-a");
    bookmarks = setPackageCameraViewName(bookmarks, "cam-b", "Media Wall Hero");
    bookmarks = movePackageCameraBookmark(bookmarks, "cam-b", -1);
    expect(resolvePackageCameraViews(bookmarks, CAMERAS).map((view) => view.viewName)).toEqual([
      "Media Wall Hero",
      "Wide Room",
    ]);
  });

  it("preserves trailing spaces while editing and trims on commit", () => {
    let bookmarks = createDefaultPackageCameraBookmarks(CAMERAS);
    bookmarks = setPackageCameraViewName(bookmarks, "cam-a", "Client Hero ");
    expect(bookmarks[0]?.viewName).toBe("Client Hero ");
    bookmarks = commitPackageCameraViewName(bookmarks, CAMERAS, "cam-a", "Client Hero ");
    expect(bookmarks[0]?.viewName).toBe("Client Hero");
  });

  it("restores the camera name when an empty name is committed", () => {
    let bookmarks = createDefaultPackageCameraBookmarks(CAMERAS);
    bookmarks = commitPackageCameraViewName(bookmarks, CAMERAS, "cam-a", "");
    expect(bookmarks[0]?.viewName).toBe("Wide Room");
    expect(resolvePackageCameraViews(bookmarks, CAMERAS)).toHaveLength(2);
  });

  it("drops stale camera ids during sanitize", () => {
    expect(
      sanitizePackageCameraBookmarks(
        [
          { cameraId: "cam-a", viewName: "Wide Room" },
          { cameraId: "missing", viewName: "Ghost" },
        ],
        CAMERAS,
      ),
    ).toEqual([{ cameraId: "cam-a", viewName: "Wide Room" }]);
  });
});
