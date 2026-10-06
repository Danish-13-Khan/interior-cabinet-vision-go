import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "../apartmentTemplates/composers/bareRoom";
import { instantiateApartmentTemplate } from "../apartmentTemplates/instantiateApartmentTemplate";
import type { ApartmentTemplateId } from "../apartmentTemplates/types";
import type { CompiledSceneBounds } from "./sceneTypes";
import { apartmentOverviewAvailable, OVERVIEW_CORNERS, overviewCornerCamera } from "./overviewCameras";
import { floorPointMm, overviewRoomAt, overviewRooms } from "./overviewRooms";

const TEMPLATES: ApartmentTemplateId[] = [
  "template:apartment:studio:v1",
  "template:apartment:1bhk:v1",
  "template:apartment:2bhk:v1",
  "template:apartment:3bhk:v1",
];

const BOUNDS: CompiledSceneBounds = {
  min: { x: 0, y: 0, z: 0 },
  max: { x: 8000, y: 2800, z: 6000 },
  center: { x: 4000, y: 1400, z: 3000 },
  size: { widthMm: 8000, heightMm: 2800, depthMm: 6000 },
};

function insideBox(point: { x: number; y: number; z: number }) {
  return point.x > BOUNDS.min.x && point.x < BOUNDS.max.x
    && point.y > BOUNDS.min.y && point.y < BOUNDS.max.y
    && point.z > BOUNDS.min.z && point.z < BOUNDS.max.z;
}

/** Entering the overview must not gain a document write. Click-to-enter lives in the view. */
const OVERVIEW_SOURCES = [
  "src/hooks/useApartmentOverview.ts",
  "src/domain/livingRoom/overviewCameras.ts",
  "src/domain/livingRoom/overviewRooms.ts",
  "src/domain/livingRoom/overviewWarmup.ts",
  "src/components/livingRoomScene/ApartmentOverviewControls.tsx",
  "src/components/livingRoomScene/ApartmentRoomPick.tsx",
];
const WRITE_PATHS = [
  "onPatchDocument", "commitDocument", "commitSnapshot", "setActiveLivingRoom",
  "setActiveInteriorRoom", "localStorage",
];

describe("apartment overview", () => {
  it("frames four high corners and a top-down camera outside the union bounds", () => {
    expect(apartmentOverviewAvailable(1)).toBe(false);
    expect(apartmentOverviewAvailable(2)).toBe(true);
    for (const corner of OVERVIEW_CORNERS) {
      const camera = overviewCornerCamera(BOUNDS, corner, "room-1");
      expect(camera.id).toBe(`apartment-overview-${corner}`);
      expect(insideBox(camera.position)).toBe(false);
      expect(camera.target.x).toBe(BOUNDS.center.x);
      expect(camera.target.z).toBe(BOUNDS.center.z);
    }
    expect(overviewCornerCamera(BOUNDS, "top", "room-1").position.y).toBeGreaterThan(BOUNDS.max.y);
  });

  it("maps a floor ray to plan millimeters and the room that contains it", () => {
    expect(floorPointMm({ x: 1, y: 4, z: 2 }, { x: 0, y: -1, z: 0 })).toEqual({ x: 1000, z: 2000 });
    expect(floorPointMm({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
    for (const id of TEMPLATES) {
      const project = instantiateApartmentTemplate(id, { now: COMPOSER_TEST_NOW });
      const rooms = overviewRooms(project);
      expect(rooms.length).toBe(project.rooms.length);
      for (const room of rooms) {
        const hit = overviewRoomAt(rooms, room.center);
        expect(hit?.id, `${id} ${room.name}`).toBe(room.id);
      }
    }
  });

  it("overview code has no path to a document or undo write", () => {
    for (const file of OVERVIEW_SOURCES) {
      const source = readFileSync(file, "utf8");
      for (const write of WRITE_PATHS) expect(source.includes(write), `${file} uses ${write}`).toBe(false);
    }
  });
});
