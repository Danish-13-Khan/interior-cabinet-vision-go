import { describe, expect, it } from "vitest";
import { SAMPLE_RECT_KITCHEN_MM } from "../sampleProposals";
import { proposalToArchScene } from "./proposalToArchScene";
import { buildWallTopology, joinWallEndpoints, splitWallAt, wallAdjacency } from "./wallTopology";
import type { ArchitecturalWall } from "./archSceneTypes";

function rectWalls(): ArchitecturalWall[] {
  return [
    { id: "w1", start: { x: 0, y: 0 }, end: { x: 3600, y: 0 }, thicknessMm: 100, heightMm: 2700, type: "unknown", openingIds: [], confidence: "medium" },
    { id: "w2", start: { x: 3600, y: 0 }, end: { x: 3600, y: 3000 }, thicknessMm: 100, heightMm: 2700, type: "unknown", openingIds: [], confidence: "medium" },
    { id: "w3", start: { x: 3600, y: 3000 }, end: { x: 0, y: 3000 }, thicknessMm: 100, heightMm: 2700, type: "unknown", openingIds: [], confidence: "medium" },
    { id: "w4", start: { x: 0, y: 3000 }, end: { x: 0, y: 0 }, thicknessMm: 100, heightMm: 2700, type: "unknown", openingIds: [], confidence: "medium" },
  ];
}

describe("Phase 7 wall topology", () => {
  it("builds 4 corner junctions for a rectangle", () => {
    const { walls, junctions } = buildWallTopology(rectWalls());
    expect(junctions).toHaveLength(4);
    expect(junctions.every((j) => j.kind === "corner" || j.wallIds.length === 2)).toBe(true);
    expect(walls.every((w) => w.junctionStartId && w.junctionEndId)).toBe(true);
    const adj = wallAdjacency(junctions);
    expect(adj.get("w1")?.length).toBeGreaterThanOrEqual(1);
  });

  it("proposalToArchScene classifies kitchen walls", () => {
    const scene = proposalToArchScene(SAMPLE_RECT_KITCHEN_MM);
    expect(scene.walls.length).toBe(4);
    expect(scene.wallJunctions.length).toBe(4);
    expect(scene.notes.some((n) => n.includes("Phase 7"))).toBe(true);
  });

  it("join and split repair helpers work", () => {
    const base = rectWalls();
    const joined = joinWallEndpoints(base, "w1", "end", "w2", "start");
    expect(joined.find((w) => w.id === "w1")!.end).toEqual(joined.find((w) => w.id === "w2")!.start);
    const split = splitWallAt(base, "w1", { x: 1800, y: 0 });
    expect(split.filter((w) => w.id.startsWith("w1")).length).toBe(2);
  });
});
