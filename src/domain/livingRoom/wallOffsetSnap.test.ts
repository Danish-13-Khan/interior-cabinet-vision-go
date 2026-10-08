import { describe, expect, it } from "vitest";
import type { InteriorProject, WallEntity } from "../interiorProject";
import { snapSpanAlongWall, spanSnapMarker, wallOffsetCandidates, wallOffsetOf, wallPointAt } from "./wallOffsetSnap";

const wall: WallEntity = {
  id: "wall", start: { x: 0, z: 0 }, end: { x: 3000, z: 0 }, heightMm: 2800, thicknessMm: 120, visible: true, materialId: null,
};

const project = {
  walls: [wall],
  openings: [{ id: "door", wallId: "wall", kind: "door", offsetMm: 200, widthMm: 900, heightMm: 2100, sillHeightMm: 0 }],
  objects: [{
    id: "base-1", roomId: "room", kind: "cabinet", category: "cabinet", catalogItemId: "x", name: "base",
    position: { x: 2400, y: 0, z: 340 }, rotation: { x: 0, y: 0, z: 0 }, dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    materialSlots: {}, parameters: {}, extensions: { wallAttachment: { wallId: "wall" } },
  }],
} as unknown as InteriorProject;

describe("along-wall snapping (Phase 4)", () => {
  it("projects points along the wall and back", () => {
    expect(wallOffsetOf(wall, { x: 1234, z: 500 })).toBe(1234);
    expect(wallPointAt(wall, 1500)).toEqual({ x: 1500, z: 0 });
    const flipped = { ...wall, start: wall.end, end: wall.start };
    expect(wallOffsetOf(flipped, { x: 1000, z: 0 })).toBe(2000);
  });

  it("collects the midpoint, other openings' edges and attached cabinets' edges", () => {
    const candidates = wallOffsetCandidates(project, wall);
    expect(candidates.map((item) => [item.kind, item.offsetMm, item.label])).toEqual([
      ["midpoint", 1500, "Wall midpoint"],
      ["opening-edge", 200, "Door edge"],
      ["opening-edge", 1100, "Door edge"],
      ["cabinet-edge", 2100, "Cabinet edge"],
      ["cabinet-edge", 2700, "Cabinet edge"],
    ]);
    expect(wallOffsetCandidates(project, wall, { excludeOpeningId: "door", excludeObjectId: "base-1" }))
      .toHaveLength(1);
  });

  it("reads opening edges on the oriented copy of the wall", () => {
    const flipped = { ...wall, start: wall.end, end: wall.start };
    const edges = wallOffsetCandidates(project, flipped).filter((item) => item.kind === "opening-edge").map((item) => item.offsetMm);
    expect(edges).toEqual([2800, 1900]);
  });

  it("centres a 600 cabinet on a 3000 wall at offset 1200", () => {
    const snap = snapSpanAlongWall({
      centreMm: 1530, widthMm: 600, lengthMm: 3000, candidates: wallOffsetCandidates(project, wall), thresholdMm: 40, gridMm: 0,
    });
    expect(snap.centreMm).toBe(1500);
    expect(snap.centreMm - 300).toBe(1200);
    expect(snap.candidate?.label).toBe("Wall midpoint");
    expect(spanSnapMarker(wall, snap)?.point).toEqual({ x: 1500, z: 0 });
  });

  it("abuts an edge with either side, keeps the span inside the wall, and prefers the nearer target", () => {
    const candidates = wallOffsetCandidates(project, wall);
    const after = snapSpanAlongWall({ centreMm: 1420, widthMm: 600, lengthMm: 3000, candidates, thresholdMm: 40, gridMm: 0 });
    expect(after.centreMm).toBe(1400);
    expect(after.candidate?.label).toBe("Door edge");
    const before = snapSpanAlongWall({ centreMm: 1830, widthMm: 600, lengthMm: 3000, candidates, thresholdMm: 40, gridMm: 0 });
    expect(before.centreMm).toBe(1800);
    expect(before.candidate?.label).toBe("Cabinet edge");
    const clamped = snapSpanAlongWall({ centreMm: 100, widthMm: 600, lengthMm: 3000, candidates, thresholdMm: 40, gridMm: 0 });
    expect(clamped.centreMm).toBe(300);
    expect(clamped.candidate).toBeNull();
  });

  it("drops a target the span cannot reach inside the wall", () => {
    const candidates = wallOffsetCandidates(project, wall);
    // Abutting the cabinet edge at 2700 would put a 900 span's centre at 3150, past the 3000 wall.
    const past = snapSpanAlongWall({ centreMm: 3120, widthMm: 900, lengthMm: 3000, candidates, thresholdMm: 40, gridMm: 50 });
    expect(past.candidate).toBeNull();
    expect(past.centreMm).toBe(2550);
  });

  it("falls back to the grid on the start edge, or stays free with no grid", () => {
    const candidates = wallOffsetCandidates(project, wall);
    const gridded = snapSpanAlongWall({ centreMm: 777, widthMm: 900, lengthMm: 3000, candidates, thresholdMm: 20, gridMm: 50 });
    expect(gridded.gridded).toBe(true);
    expect(gridded.centreMm - 450).toBe(350);
    const free = snapSpanAlongWall({ centreMm: 777, widthMm: 900, lengthMm: 3000, candidates, thresholdMm: 20, gridMm: 0 });
    expect(free.centreMm).toBe(777);
    expect(free.gridded).toBe(false);
  });
});
