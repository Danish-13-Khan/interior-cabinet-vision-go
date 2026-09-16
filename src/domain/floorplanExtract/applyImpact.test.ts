import { describe, expect, it } from "vitest";
import { summarizeFloorplanApplyImpact } from "./applyImpact";
import { createEmptyInteriorProject } from "../interiorProject/defaults";

describe("summarizeFloorplanApplyImpact", () => {
  it("flags furniture and walls when no prior snapshot", () => {
    const p = createEmptyInteriorProject({ id: "p1" });
    p.walls = [{
      id: "wall-0", start: { x: 0, z: 0 }, end: { x: 4000, z: 0 },
      heightMm: 2700, thicknessMm: 150, visible: true,
    }];
    p.rooms = [{
      id: "room-1", name: "R", roomType: "custom",
      dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 4000 }, wallThicknessMm: 150,
    }];
    p.objects = [{ id: "o1" } as (typeof p.objects)[0]];
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "objects")).toBe(true);
    expect(f.some((x) => x.code === "walls")).toBe(true);
  });

  it("detects wall edits since snapshot", () => {
    const p = createEmptyInteriorProject({ id: "p1" });
    p.extensions = {
      floorplanApplySnapshot: {
        wallIds: ["wall-0"],
        openingIds: [],
        roomIds: ["room-1"],
        objectCount: 0,
      },
    };
    p.rooms = [{
      id: "room-1", name: "R", roomType: "custom",
      dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 4000 }, wallThicknessMm: 150,
    }];
    p.walls = [
      { id: "wall-0", start: { x: 0, z: 0 }, end: { x: 4000, z: 0 }, heightMm: 2700, thicknessMm: 150, visible: true },
      { id: "wall-1", start: { x: 0, z: 0 }, end: { x: 0, z: 4000 }, heightMm: 2700, thicknessMm: 150, visible: true },
    ];
    const f = summarizeFloorplanApplyImpact(p);
    expect(f.some((x) => x.code === "walls_changed")).toBe(true);
  });
});
