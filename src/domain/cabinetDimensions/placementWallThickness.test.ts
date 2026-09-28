import { describe, expect, it } from "vitest";
import { cabinetRoomBounds } from "../cabinetRoomBounds";
import { normalizeMultiRoomProject } from "../projectRooms/normalize";
import { DEFAULT_ROOM } from "../roomModel";
import type { RoomDimensions } from "../roomModel";
import { defaultCabinetProject, getDefaultCabinetConfig } from "./defaults";
import { clampCabinetPlacement } from "./placement";
import type { CabinetPlacement, RoomBounds } from "./types";

const dimensions = getDefaultCabinetConfig("wall").dimensions;
const room: RoomBounds = { widthMm: 6000, depthMm: 4000, heightMm: 2800 };

function place(attachment: CabinetPlacement["attachment"], bounds: RoomBounds) {
  return clampCabinetPlacement({ x: 0, y: 1400, z: 0, rotation: 0, attachment }, dimensions, bounds);
}

describe("wall-attached placement honours the room wall thickness", () => {
  it("puts the cabinet back on the inner face of 200 mm walls", () => {
    const bounds = { ...room, wallThicknessMm: 200 };
    const innerBack = -room.depthMm / 2 + 100;
    const innerRight = room.widthMm / 2 - 100;
    const innerLeft = -room.widthMm / 2 + 100;
    expect(place("back-wall", bounds).z - dimensions.depth / 2).toBe(innerBack);
    expect(place("right-wall", bounds).x + dimensions.depth / 2).toBe(innerRight);
    expect(place("left-wall", bounds).x - dimensions.depth / 2).toBe(innerLeft);
  });

  it("differs from the 120 mm default by half the extra thickness", () => {
    const thick = place("back-wall", { ...room, wallThicknessMm: 200 });
    const standard = place("back-wall", room);
    expect(thick.z - standard.z).toBe(40);
  });

  it("builds clamp bounds that carry a custom room wall thickness", () => {
    const dims: RoomDimensions = { ...room, wallThicknessMm: 200, showBackWall: true, showLeftWall: true, showRightWall: true };
    const bounds = cabinetRoomBounds(dims);
    expect(bounds.wallThicknessMm).toBe(200);
    expect(place("back-wall", bounds).z - dimensions.depth / 2).toBe(-dims.depthMm / 2 + 100);
  });

  it("keeps loaded rooms on their own wall thickness when normalising", () => {
    const config = { ...DEFAULT_ROOM, dimensions: { ...DEFAULT_ROOM.dimensions, wallThicknessMm: 200 } };
    const cabinet = {
      ...defaultCabinetProject.cabinets[0]!,
      id: "wall-a",
      config: getDefaultCabinetConfig("wall"),
      placement: { x: 0, y: 1400, z: 0, rotation: 0, attachment: "back-wall" as const },
    };
    const project = normalizeMultiRoomProject({
      version: 1,
      cabinets: [cabinet],
      rooms: [{ id: "room-1", name: "Room 1", config, cabinets: [cabinet] }],
      activeRoomId: "room-1",
    });
    const placed = project.rooms![0]!.cabinets[0]!.placement;
    expect(placed.z - dimensions.depth / 2).toBe(-config.dimensions.depthMm / 2 + 100);
  });

  it("stops floor cabinets at the inner wall face, not the centreline", () => {
    const base = getDefaultCabinetConfig("base").dimensions;
    const bounds = { ...room, wallThicknessMm: 200 };
    const pushed = clampCabinetPlacement({ x: 9000, y: 0, z: -9000, rotation: 0, attachment: "floor" }, base, bounds);
    expect(pushed.x + base.width / 2).toBeLessThanOrEqual(room.widthMm / 2 - 100);
    expect(pushed.z - base.depth / 2).toBeGreaterThanOrEqual(-room.depthMm / 2 + 100);
  });
});

