import { describe, expect, it } from "vitest";
import {
  browserFootprintFitsRoom,
  defaultBrowserPlacementPosition,
  findInteriorBrowserPlanPoint,
  kenneyItemId,
  lookupBuiltInCatalogItem,
  rectangleBoundsAsPolygon,
  searchBrowserFootprintFit,
} from ".";
import {
  pointInRoomPolygon,
  roomPlanViewBounds,
  type InteriorProject,
  type Point2Mm,
} from "../interiorProject";

const NOW = "2026-09-04T00:00:00.000Z";

function dimensionalRoom(widthMm: number, depthMm: number): InteriorProject {
  return {
    schemaVersion: 1,
    id: "p",
    name: "t",
    createdAt: NOW,
    updatedAt: NOW,
    unitSystem: "mm",
    activeRoomId: "room-1",
    rooms: [{
      id: "room-1",
      name: "Room",
      heightMm: 2700,
      dimensions: { widthMm, depthMm, heightMm: 2700 },
    }],
    walls: [],
    openings: [],
    objects: [],
    materials: [],
    lights: [],
    cameras: [],
    surfaces: [],
  } as InteriorProject;
}

/** Square room with a large centered hole — usable floor is a narrow offset frame. */
function offsetFramePolygon(frameMm: number) {
  const outer = 2000;
  const hole = outer - frameMm;
  return {
    outer: [
      { x: -outer, z: -outer }, { x: outer, z: -outer },
      { x: outer, z: outer }, { x: -outer, z: outer },
    ] satisfies Point2Mm[],
    holes: [[
      { x: -hole, z: -hole }, { x: hole, z: -hole },
      { x: hole, z: hole }, { x: -hole, z: hole },
    ] satisfies Point2Mm[]],
  };
}

describe("object browser placement fallbacks", () => {
  it("rejects out-of-shell stagger on dimensional rooms without topology", () => {
    const project = dimensionalRoom(900, 900);
    const table = lookupBuiltInCatalogItem(kenneyItemId("sideTable"))!;
    const bounds = roomPlanViewBounds(project, "room-1");
    const polygon = rectangleBoundsAsPolygon(bounds);
    const invalidStagger = { x: bounds.centerX - 225, z: bounds.centerZ - 150 };
    expect(browserFootprintFitsRoom(
      polygon, invalidStagger, table.dimensionsMm.width, table.dimensionsMm.depth,
    )).toBe(false);
    const position = findInteriorBrowserPlanPoint(project, "room-1", table, 0);
    expect(browserFootprintFitsRoom(
      polygon, position, table.dimensionsMm.width, table.dimensionsMm.depth,
    )).toBe(true);
    expect(position).toEqual({ x: 0, z: 0 });
    expect(defaultBrowserPlacementPosition(project, "room-1", table)).toMatchObject(position);
  });

  it("keeps oversized items at the rectangle center instead of inventing an exterior origin", () => {
    const project = dimensionalRoom(800, 800);
    const sofa = lookupBuiltInCatalogItem(kenneyItemId("loungeSofa"))!;
    const position = findInteriorBrowserPlanPoint(project, "room-1", sofa, 3);
    expect(position).toEqual({ x: 0, z: 0 });
  });

  it("fine-searches an offset bay and never returns a footprint that crosses a hole", () => {
    const polygon = offsetFramePolygon(700);
    const cutoutCenter = { x: 0, z: 0 };
    expect(pointInRoomPolygon(cutoutCenter, polygon)).toBe(false);
    const nearHole = { x: -1350, z: 0 };
    expect(pointInRoomPolygon(nearHole, polygon)).toBe(true);
    expect(browserFootprintFitsRoom(polygon, nearHole, 480, 480)).toBe(false);

    const fit = searchBrowserFootprintFit(polygon, 480, 480, 0);
    expect(fit).not.toBeNull();
    expect(browserFootprintFitsRoom(polygon, fit!, 480, 480)).toBe(true);
    expect(pointInRoomPolygon(fit!, polygon)).toBe(true);
  });
});
