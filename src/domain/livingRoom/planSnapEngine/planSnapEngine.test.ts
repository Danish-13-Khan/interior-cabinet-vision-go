import { describe, expect, it } from "vitest";
import type { InteriorProject, OpeningEntity, PlanNodeEntity, WallEntity } from "../../interiorProject";
import { createLivingRoomStarterProject } from "../preset";
import { collectPlanSnapCandidates, pickPlanSnap, wallLineIntersection } from "./index";

function node(id: string, x: number, z: number): PlanNodeEntity {
  return { id, position: { x, z } };
}

function wall(id: string, a: PlanNodeEntity, b: PlanNodeEntity): WallEntity {
  return {
    id, start: { ...a.position }, end: { ...b.position }, startNodeId: a.id, endNodeId: b.id,
    heightMm: 2700, thicknessMm: 120, visible: true, materialId: null,
  };
}

/**
 * A free-standing wall graph on top of the starter project:
 *   n1 (0,0) ── w1 ── n2 (4000,0)
 *   n3 (2000,-1000) ── w2 ── n4 (2000,1000)      (crosses w1 at 2000,0)
 *   n5 (0,2000) ── w3 ── n6 (3000,2000)         (stops 1000 short of x = 4000)
 *   n2 ── w4 ── n6                               (makes n2 a degree-2 corner)
 */
function graphProject(): InteriorProject {
  const base = createLivingRoomStarterProject({ now: "2026-10-08T00:00:00.000Z" });
  const n1 = node("n1", 0, 0);
  const n2 = node("n2", 4000, 0);
  const n3 = node("n3", 2000, -1000);
  const n4 = node("n4", 2000, 1000);
  const n5 = node("n5", 0, 2000);
  const n6 = node("n6", 3000, 2000);
  return {
    ...base,
    nodes: [n1, n2, n3, n4, n5, n6],
    walls: [wall("w1", n1, n2), wall("w2", n3, n4), wall("w3", n5, n6), wall("w4", n2, n6)],
    loops: [],
    rooms: [],
    openings: [],
    objects: [],
  };
}

describe("plan snap engine", () => {
  const project = graphProject();
  const ctx = { project, roomId: null, gridMm: 50 };

  it("snaps to the nearest node, not the first one in range", () => {
    const close = { ...project, nodes: [node("a", 0, 0), node("b", 40, 0)], walls: [] };
    const hit = pickPlanSnap({ project: close, roomId: null, gridMm: 100 }, { x: 32, z: 3 }, 60);
    expect(hit.candidate?.kind).toBe("node");
    expect(hit.candidate?.sourceId).toBe("b");
    expect(hit.point).toEqual({ x: 40, z: 0 });
  });

  it("measures the threshold from the raw pointer, not the grid-rounded point", () => {
    const hit = pickPlanSnap(ctx, { x: 4012, z: 9 }, 20);
    expect(hit.candidate?.kind).toBe("node");
    expect(hit.point).toEqual({ x: 4000, z: 0 });
    const miss = pickPlanSnap(ctx, { x: 4040, z: 30 }, 20);
    expect(miss.candidate?.kind).toBe("grid");
    expect(miss.point).toEqual({ x: 4050, z: 50 });
  });

  it("offers wall midpoints", () => {
    const hit = pickPlanSnap(ctx, { x: 1510, z: 1995 }, 30);
    expect(hit.candidate?.kind).toBe("midpoint");
    expect(hit.candidate?.sourceId).toBe("w3");
    expect(hit.point).toEqual({ x: 1500, z: 2000 });
  });

  it("offers the crossing of two walls and drops it when it coincides with a node", () => {
    const hit = pickPlanSnap(ctx, { x: 1990, z: 12 }, 30);
    expect(hit.candidate?.kind).toBe("intersection");
    expect(hit.point).toEqual({ x: 2000, z: 0 });
    const candidates = collectPlanSnapCandidates(ctx);
    const atNode = candidates.filter((item) => Math.hypot(item.point.x - 0, item.point.z - 0) < 0.5);
    expect(atNode).toHaveLength(1);
    expect(atNode[0]!.kind).toBe("node");
  });

  it("extends centrelines by the threshold so near-misses still cross", () => {
    const a = project.walls[1]!; // vertical x = 2000, z -1000…1000
    const short: WallEntity = { ...project.walls[2]!, start: { x: 0, z: 980 }, end: { x: 1960, z: 980 } };
    expect(wallLineIntersection(a, short, 0)).toBeNull();
    expect(wallLineIntersection(a, short, 50)).toEqual({ x: 2000, z: 980 });
  });

  it("projects onto a wall when no point candidate is near", () => {
    const hit = pickPlanSnap(ctx, { x: 1000, z: 14 }, 20);
    expect(hit.candidate?.kind).toBe("on-wall");
    expect(hit.candidate?.sourceId).toBe("w1");
    expect(hit.point).toEqual({ x: 1000, z: 0 });
  });

  it("snaps each axis to a guide, with a combined label when both apply", () => {
    const guides = [
      { id: "ga", axis: "x" as const, positionMm: 1000, label: "A" },
      { id: "g1", axis: "z" as const, positionMm: -500, label: "1" },
    ];
    const one = pickPlanSnap({ ...ctx, guides }, { x: 1030, z: 310 }, 50);
    expect(one.candidate?.kind).toBe("guide");
    expect(one.candidate?.label).toBe("Guide A");
    expect(one.point).toEqual({ x: 1000, z: 300 });
    const both = pickPlanSnap({ ...ctx, guides }, { x: 970, z: -470 }, 50);
    expect(both.point).toEqual({ x: 1000, z: -500 });
    expect(both.candidate?.label).toBe("Guide A × 1");
  });

  it("keeps a node over a guide so new walls still join exactly", () => {
    const guides = [{ id: "ga", axis: "x" as const, positionMm: 4020 }];
    const hit = pickPlanSnap({ ...ctx, guides }, { x: 4015, z: 5 }, 30);
    expect(hit.candidate?.kind).toBe("node");
    expect(hit.point).toEqual({ x: 4000, z: 0 });
  });

  it("locks to the horizontal or vertical axis through the anchor within 2°", () => {
    const anchor = { x: 0, z: 0 };
    const horizontal = pickPlanSnap({ ...ctx, anchor, gridMm: 0 }, { x: 3000, z: 60 }, 20);
    expect(horizontal.candidate?.kind).toBe("axis-h");
    expect(horizontal.candidate?.label).toBe("Horizontal");
    expect(horizontal.point).toEqual({ x: 3000, z: 0 });
    const vertical = pickPlanSnap({ ...ctx, anchor, gridMm: 0 }, { x: -40, z: 2500 }, 20);
    expect(vertical.candidate?.kind).toBe("axis-v");
    expect(vertical.point).toEqual({ x: 0, z: 2500 });
    const diagonal = pickPlanSnap({ ...ctx, anchor, gridMm: 0 }, { x: 3000, z: 400 }, 20);
    expect(diagonal.candidate).toBeNull();
    expect(diagonal.point).toEqual({ x: 3000, z: 400 });
  });

  it("falls back to the grid within the pick radius, else to the raw pointer", () => {
    const grid = pickPlanSnap(ctx, { x: 1234, z: 2567 }, 20);
    expect(grid.candidate?.kind).toBe("grid");
    expect(grid.point).toEqual({ x: 1250, z: 2550 });
    const beyond = pickPlanSnap(ctx, { x: 1234, z: 2567 }, 10);
    expect(beyond.candidate).toBeNull();
    expect(beyond.point).toEqual({ x: 1234, z: 2567 });
    const oneAxis = pickPlanSnap(ctx, { x: 1248, z: 2567 }, 10);
    expect(oneAxis.candidate?.kind).toBe("grid");
    expect(oneAxis.point).toEqual({ x: 1250, z: 2567 });
    const free = pickPlanSnap({ ...ctx, gridMm: 0 }, { x: 1234, z: 2567 }, 20);
    expect(free.candidate).toBeNull();
    expect(free.point).toEqual({ x: 1234, z: 2567 });
  });

  it("restricts kinds through allow, as the calibrate tool does", () => {
    const dwgEndpoints = [{ x: -2000, z: 1500 }];
    const calibrate = { ...ctx, gridMm: 0, dwgEndpoints, allow: ["dwg-end" as const] };
    expect(pickPlanSnap(calibrate, { x: -1988, z: 1492 }, 25).candidate?.kind).toBe("dwg-end");
    const nearNode = pickPlanSnap(calibrate, { x: 5, z: 5 }, 25);
    expect(nearNode.candidate).toBeNull();
    expect(nearNode.point).toEqual({ x: 5, z: 5 });
  });

  it("excludes the dragged node and its walls' own lines, but keeps their crossings", () => {
    const dragging = { ...ctx, exclude: { nodeIds: ["n2"] } };
    const candidates = collectPlanSnapCandidates(dragging);
    expect(candidates.some((item) => item.sourceId === "n2")).toBe(false);
    expect(candidates.some((item) => item.kind === "midpoint" && item.sourceId === "w1")).toBe(false);
    expect(candidates.some((item) => item.kind === "midpoint" && item.sourceId === "w3")).toBe(true);
    // n2 is an end of w1; dragging it near where w1 crosses w2 still reads "Intersection".
    const hit = pickPlanSnap(dragging, { x: 1990, z: 12 }, 30);
    expect(hit.candidate?.kind).toBe("intersection");
    expect(hit.point).toEqual({ x: 2000, z: 0 });
    // The projection onto w1 itself is not offered while its node moves.
    const own = pickPlanSnap({ ...dragging, gridMm: 0 }, { x: 1000, z: 14 }, 20);
    expect(own.candidate).toBeNull();
    // The corner being dragged (w1 meets w4 at n2) is not offered as an "Intersection".
    const corner = pickPlanSnap({ ...dragging, gridMm: 0 }, { x: 4010, z: 8 }, 30);
    expect(corner.candidate?.kind).not.toBe("intersection");
    expect(collectPlanSnapCandidates(dragging).some((item) =>
      item.kind === "intersection" && Math.hypot(item.point.x - 4000, item.point.z) < 1)).toBe(false);
    // A translated wall is dropped entirely.
    const translating = { ...ctx, exclude: { nodeIds: ["n1", "n2"], wallIds: ["w1"] } };
    expect(collectPlanSnapCandidates(translating).some((item) => item.kind === "intersection")).toBe(false);
  });

  it("collects opening centres and edges on the host wall", () => {
    const opening: OpeningEntity = {
      id: "o1", wallId: "w1", kind: "door", offsetMm: 1000, widthMm: 900, heightMm: 2100, sillHeightMm: 0,
    };
    const candidates = collectPlanSnapCandidates({ ...ctx, project: { ...project, openings: [opening] } });
    expect(candidates.find((item) => item.kind === "opening-centre")?.point).toEqual({ x: 1450, z: 0 });
    expect(candidates.filter((item) => item.kind === "opening-edge").map((item) => item.point.x)).toEqual([1000, 1900]);
    expect(candidates.find((item) => item.kind === "opening-centre")?.label).toBe("Door centre");
  });

  it("collects cabinet edges and centres from the starter project without a grid lattice", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-10-08T00:00:00.000Z" });
    const candidates = collectPlanSnapCandidates({ project: starter, gridMm: 25 });
    expect(candidates.every((item) => item.kind !== "grid")).toBe(true);
    expect(candidates.some((item) => item.kind === "node")).toBe(true);
    expect(candidates.some((item) => item.kind === "midpoint")).toBe(true);
    expect(candidates.length).toBeLessThan(2000);
  });
});
