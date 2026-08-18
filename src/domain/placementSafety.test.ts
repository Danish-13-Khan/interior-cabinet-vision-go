import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "./cabinetDimensions";
import { placementConflict } from "./placementSafety";
import { DEFAULT_ROOM } from "./roomModel";

function cabinet(id: string, x: number, y = 0): CabinetInstance {
  return {
    id,
    name: id,
    placement: { x, y, z: -1720, rotation: 0, attachment: "floor" },
    config: getDefaultCabinetConfig("base"),
  };
}

describe("placementConflict", () => {
  it("rejects a cabinet that overlaps a door opening", () => {
    const moving = cabinet("moving", 0);
    const room = {
      ...DEFAULT_ROOM,
      doors: [{ ...DEFAULT_ROOM.doors[0]!, side: "back-wall", positionMm: 0 }],
      windows: [],
    };

    expect(placementConflict({
      cabinet: moving,
      others: [],
      placement: { ...moving.placement, x: 0 },
      room,
    })).toBe("opening");
  });

  it("allows vertically separated cabinets but rejects overlapping cabinets", () => {
    const moving = cabinet("moving", -1200);
    const peer = cabinet("peer", -1200, 1000);

    expect(placementConflict({
      cabinet: moving,
      others: [peer],
      placement: moving.placement,
      room: { ...DEFAULT_ROOM, doors: [], windows: [] },
    })).toBeNull();

    expect(placementConflict({
      cabinet: moving,
      others: [cabinet("peer", -1200)],
      placement: moving.placement,
      room: { ...DEFAULT_ROOM, doors: [], windows: [] },
    })).toBe("cabinet");
  });
});
