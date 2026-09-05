import { describe, expect, it } from "vitest";
import type { InteriorProject } from "../interiorProject";
import {
  interiorsChromeBuildTool,
  interiorsDrawRoomCounts,
  interiorsDrawRoomHint,
  interiorsDrawRoomPlacementWallId,
  interiorsDrawRoomRoomCounts,
  interiorsDrawRoomShowArchitecture,
  interiorsDrawRoomShowUnderlay,
  interiorsDrawRoomValidity,
  isInteriorsDrawRoomTool,
} from "./interiorsDrawRoom";

function countsProject(): InteriorProject {
  return {
    activeRoomId: "room-a",
    rooms: [{ id: "room-a", outerLoopId: "loop-a" }, { id: "room-b", outerLoopId: "loop-b" }],
    loops: [
      { id: "loop-a", wallUses: [{ wallId: "wall-a" }] },
      { id: "loop-b", wallUses: [{ wallId: "wall-b" }] },
    ],
    walls: [{ id: "wall-b" }, { id: "wall-a" }],
    openings: [
      { id: "door-b", kind: "door", wallId: "wall-b" },
      { id: "door-a", kind: "door", wallId: "wall-a" },
      { id: "window-a", kind: "window", wallId: "wall-a" },
    ],
  } as InteriorProject;
}

describe("interiorsDrawRoom", () => {
  it("keeps room authoring on the canvas tools", () => {
    expect(isInteriorsDrawRoomTool("select")).toBe(true);
    expect(isInteriorsDrawRoomTool("room")).toBe(true);
    expect(isInteriorsDrawRoomTool("import")).toBe(true);
    expect(isInteriorsDrawRoomTool("cabinet")).toBe(false);
    expect(interiorsChromeBuildTool("room")).toBe("draw-room");
    expect(interiorsChromeBuildTool("door")).toBe("place-door");
  });

  it("hints the next canvas action instead of a panel sermon", () => {
    expect(interiorsDrawRoomHint("select")).toBe("Click a wall to edit");
    expect(interiorsDrawRoomHint("door")).toBe("Click a wall to place a door");
    expect(interiorsDrawRoomHint("select", "draw-partition")).toBe("Drag a partition segment on the plan");
    expect(interiorsDrawRoomHint("select", "calibrate-underlay")).toBe(
      "Click A → B on the underlay, then enter the known length in mm",
    );
  });

  it("summarizes the active room and never falls back to another room wall", () => {
    expect(interiorsDrawRoomCounts({ wallCount: 4, doorCount: 1, windowCount: 1 }))
      .toBe("4 walls · 1 door · 1 window");
    expect(interiorsDrawRoomRoomCounts(countsProject())).toEqual({
      wallCount: 1, doorCount: 1, windowCount: 1,
    });
    expect(interiorsDrawRoomPlacementWallId("wall-b", ["wall-a"])).toBe("wall-a");
    expect(interiorsDrawRoomPlacementWallId("wall-a", ["wall-a", "wall-c"])).toBe("wall-a");
    expect(interiorsDrawRoomValidity(0)).toEqual({ label: "Room valid", ok: true });
    expect(interiorsDrawRoomValidity(2)).toEqual({ label: "2 blocking", ok: false });
    expect(interiorsDrawRoomShowArchitecture("select")).toBe(false);
    expect(interiorsDrawRoomShowArchitecture("wall")).toBe(true);
    expect(interiorsDrawRoomShowArchitecture("select", "draw-partition")).toBe(true);
    expect(interiorsDrawRoomShowUnderlay("import")).toBe(true);
    expect(interiorsDrawRoomShowUnderlay("select")).toBe(false);
  });
});
