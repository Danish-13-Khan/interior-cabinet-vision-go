import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listObjectBrowserCards } from "../catalog";
import { interiorsCabinetRunFamilyItems } from "../desktopUx";
import { LIVING_ROOM_CATALOG } from "./catalog";
import { projectAabbToScreen, screenBoundsInsideFrame } from "./cameraScreenBounds";
import {
  LIVING_ROOM_THUMBNAIL_SIZE,
  livingRoomThumbnailFile,
  livingRoomThumbnailItems,
  livingRoomThumbnailPose,
  livingRoomThumbnailUrl,
} from "./livingRoomThumbnails";
import { livingRoomThumbnailScene } from "./livingRoomThumbnailScene";
import { millworkShortcutsForRoom } from "./millworkShortcuts";

const publicDir = join(process.cwd(), "public");
const aspect = LIVING_ROOM_THUMBNAIL_SIZE.widthPx / LIVING_ROOM_THUMBNAIL_SIZE.heightPx;

describe("catalogue thumbnails — Phase 5 exit gate", () => {
  it("every living-room catalogue item has a rendered PNG on disk", () => {
    const missing = livingRoomThumbnailItems()
      .map((item) => livingRoomThumbnailFile(item.id))
      .filter((file) => !existsSync(join(publicDir, file)));
    expect(missing).toEqual([]);
  });

  it("every cabinet family and millwork shortcut resolves a thumbnail", () => {
    const shown = [
      ...interiorsCabinetRunFamilyItems("cabinet", LIVING_ROOM_CATALOG),
      ...interiorsCabinetRunFamilyItems("shelf", LIVING_ROOM_CATALOG),
      ...millworkShortcutsForRoom("all"),
    ];
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.filter((item) => !livingRoomThumbnailUrl(item.id)).map((item) => item.id)).toEqual([]);
  });

  it("every object-browser card has a thumbnail", () => {
    const cards = listObjectBrowserCards({ categoryId: "all" });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.filter((card) => !card.thumbnailUrl).map((card) => card.id)).toEqual([]);
  });

  it("returns null for unknown items", () => {
    expect(livingRoomThumbnailUrl("not-a-cabinet")).toBeNull();
  });
});

describe("livingRoomThumbnailPose", () => {
  for (const item of livingRoomThumbnailItems()) {
    it(`${item.id} fits the thumbnail frame`, () => {
      const built = livingRoomThumbnailScene(item.id);
      expect(built).not.toBeNull();
      const pose = livingRoomThumbnailPose(built!.box);
      const bounds = projectAabbToScreen(pose, aspect, built!.box);
      expect(screenBoundsInsideFrame(bounds, 0.04)).toBe(true);
      expect(pose.position.z).toBeGreaterThan(built!.box.max.z);
    });
  }
});
