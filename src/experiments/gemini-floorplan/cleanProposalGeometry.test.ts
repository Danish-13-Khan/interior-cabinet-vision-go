import { describe, expect, it } from "vitest";
import {
  cleanProposalGeometry,
  proposalForGeometryMode,
} from "./cleanProposalGeometry";
import { closeOutlineLoop } from "./closeRoomLoops";
import { mergeCollinearWalls } from "./mergeCollinearWalls";
import type { GeminiFloorProposal } from "./proposalTypes";
import { snapOrthoWall } from "./snapOrthoGeometry";

function baseProposal(over: Partial<GeminiFloorProposal> = {}): GeminiFloorProposal {
  return {
    units: "mm",
    scaleConfidence: "medium",
    assumedWallHeightMm: 2700,
    rooms: [],
    walls: [],
    notes: [],
    ...over,
  };
}

describe("snapOrthoWall", () => {
  it("snaps near-horizontal wall to constant y", () => {
    const snapped = snapOrthoWall(
      { id: "w", a: { x: 0, y: 10 }, b: { x: 3000, y: 40 } },
      { toleranceDeg: 10 },
    );
    expect(snapped.a.y).toBeCloseTo(snapped.b.y, 5);
    expect(Math.abs(snapped.a.y - 25)).toBeLessThan(1);
  });

  it("leaves steep diagonal alone when outside tolerance", () => {
    const wall = { id: "w", a: { x: 0, y: 0 }, b: { x: 1000, y: 1000 } };
    const snapped = snapOrthoWall(wall, { toleranceDeg: 10 });
    expect(snapped.a).toEqual(wall.a);
    expect(snapped.b).toEqual(wall.b);
  });
});

describe("mergeCollinearWalls", () => {
  it("dedupes reversed duplicate walls", () => {
    const merged = mergeCollinearWalls([
      { id: "a", a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } },
      { id: "b", a: { x: 1000, y: 0 }, b: { x: 0, y: 0 } },
    ]);
    expect(merged).toHaveLength(1);
  });

  it("merges abutting collinear segments into one", () => {
    const merged = mergeCollinearWalls([
      { id: "a", a: { x: 0, y: 0 }, b: { x: 1000, y: 0 }, thicknessMm: 100 },
      { id: "b", a: { x: 1000, y: 0 }, b: { x: 2500, y: 0 }, thicknessMm: 100 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].a.x).toBeCloseTo(0, 0);
    expect(merged[0].b.x).toBeCloseTo(2500, 0);
  });

  it("does not merge parallel opposite sides of a rectangle", () => {
    const merged = mergeCollinearWalls([
      { id: "top", a: { x: 0, y: 0 }, b: { x: 3600, y: 0 } },
      { id: "bot", a: { x: 3600, y: 3000 }, b: { x: 0, y: 3000 } },
      { id: "right", a: { x: 3600, y: 0 }, b: { x: 3600, y: 3000 } },
      { id: "left", a: { x: 0, y: 3000 }, b: { x: 0, y: 0 } },
    ]);
    expect(merged).toHaveLength(4);
  });
});

describe("closeOutlineLoop", () => {
  it("snaps last point to first when gap is small", () => {
    const closed = closeOutlineLoop(
      [
        { x: 0, y: 0 },
        { x: 3000, y: 0 },
        { x: 3000, y: 2000 },
        { x: 20, y: 15 },
      ],
      { gapMm: 80 },
    );
    expect(closed[closed.length - 1]).toEqual(closed[0]);
  });

  it("does not close when gap is large", () => {
    const open = closeOutlineLoop(
      [
        { x: 0, y: 0 },
        { x: 3000, y: 0 },
        { x: 3000, y: 2000 },
        { x: 500, y: 2000 },
      ],
      { gapMm: 80 },
    );
    expect(open[open.length - 1]).not.toEqual(open[0]);
  });
});

describe("cleanProposalGeometry", () => {
  it("cleans skewed kitchen into ortho rectangle walls", () => {
    const messy = baseProposal({
      rooms: [
        {
          id: "k",
          name: "Kitchen",
          outlineMm: [
            { x: 0, y: 5 },
            { x: 3600, y: -8 },
            { x: 3610, y: 3000 },
            { x: 12, y: 2995 },
          ],
        },
      ],
      walls: [
        { id: "w1", a: { x: 0, y: 8 }, b: { x: 3600, y: -5 }, thicknessMm: 100 },
        { id: "w1b", a: { x: 3600, y: -5 }, b: { x: 1800, y: 2 }, thicknessMm: 100 },
        { id: "w2", a: { x: 3605, y: 0 }, b: { x: 3590, y: 3000 }, thicknessMm: 100 },
        { id: "w3", a: { x: 3600, y: 3005 }, b: { x: 0, y: 2990 }, thicknessMm: 100 },
        { id: "w4", a: { x: 5, y: 3000 }, b: { x: -3, y: 0 }, thicknessMm: 100 },
      ],
    });
    const cleaned = cleanProposalGeometry(messy, { toleranceDeg: 10 });
    expect(cleaned.walls.length).toBeLessThan(messy.walls.length);
    for (const w of cleaned.walls) {
      const horizontal = Math.abs(w.a.y - w.b.y) < 1;
      const vertical = Math.abs(w.a.x - w.b.x) < 1;
      expect(horizontal || vertical).toBe(true);
    }
    expect(cleaned.notes?.some((n) => n.includes("Phase 6A"))).toBe(true);
  });

  it("proposalForGeometryMode returns source for raw", () => {
    const p = baseProposal({
      walls: [{ id: "w", a: { x: 0, y: 0 }, b: { x: 100, y: 5 } }],
    });
    expect(proposalForGeometryMode(p, "raw")).toBe(p);
    const cleaned = proposalForGeometryMode(p, "cleaned");
    expect(cleaned.walls[0].a.y).toBeCloseTo(cleaned.walls[0].b.y, 5);
  });
});
