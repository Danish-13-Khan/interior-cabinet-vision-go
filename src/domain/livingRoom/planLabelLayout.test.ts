import { describe, expect, it } from "vitest";
import {
  countPlanLabelOverlaps,
  planLabelBox,
  planLabelBoxesOverlap,
} from "./planLabelBoxes";
import { layoutPlanLabels, type PlanLabelRequest } from "./planLabelLayout";

function request(id: string, priority: number, anchors: Array<[number, number]>): PlanLabelRequest {
  return {
    id,
    text: "Ref 1200 mm",
    fontSizeMm: 100,
    priority,
    candidates: anchors.map(([x, z]) => ({ x, z })),
  };
}

describe("plan label boxes", () => {
  it("centres the box on x with the baseline near the bottom", () => {
    const box = planLabelBox(0, 0, "ABCD", 100);
    expect(box.minX).toBeCloseTo(-box.maxX);
    expect(box.minZ).toBeLessThan(0);
    expect(box.maxZ).toBeGreaterThan(0);
    expect(Math.abs(box.minZ)).toBeGreaterThan(box.maxZ);
  });

  it("counts overlapping pairs", () => {
    const a = planLabelBox(0, 0, "Ref 100", 100);
    const b = planLabelBox(50, 0, "Ref 100", 100);
    const c = planLabelBox(5000, 0, "Ref 100", 100);
    expect(planLabelBoxesOverlap(a, b)).toBe(true);
    expect(countPlanLabelOverlaps([a, b, c])).toBe(1);
  });
});

describe("layoutPlanLabels", () => {
  it("keeps the preferred anchor when it is clear", () => {
    const [placed] = layoutPlanLabels([request("a", 1, [[0, 0], [0, 500]])]);
    expect(placed).toMatchObject({ hidden: false, x: 0, z: 0 });
  });

  it("moves a colliding label to its next clear anchor", () => {
    const placed = layoutPlanLabels([
      request("a", 1, [[0, 0]]),
      request("b", 1, [[0, 0], [0, 400]]),
    ]);
    expect(placed[1]).toMatchObject({ hidden: false, z: 400 });
    expect(countPlanLabelOverlaps(placed.map((label) => label.box))).toBe(0);
  });

  it("places higher priority first and hides a label with no clear anchor", () => {
    const placed = layoutPlanLabels([
      request("low", 1, [[0, 0]]),
      request("high", 2, [[0, 0]]),
    ]);
    expect(placed.map((label) => label.id)).toEqual(["low", "high"]);
    expect(placed[1].hidden).toBe(false);
    expect(placed[0].hidden).toBe(true);
  });

  it("avoids obstacles such as cabinet tags", () => {
    const tag = planLabelBox(0, 0, "Base 600", 88);
    const [placed] = layoutPlanLabels([request("a", 1, [[0, 0], [0, 600]])], [tag]);
    expect(placed.z).toBe(600);
    expect(planLabelBoxesOverlap(placed.box, tag)).toBe(false);
  });

  it("caps visible labels", () => {
    const placed = layoutPlanLabels(
      [request("a", 1, [[0, 0]]), request("b", 1, [[0, 2000]])],
      [],
      { maxVisible: 1 },
    );
    expect(placed.filter((label) => !label.hidden)).toHaveLength(1);
  });

  it("hides low-priority labels that would be unreadable at low zoom", () => {
    const placed = layoutPlanLabels(
      [request("ref", 1, [[0, 0]]), request("key", 2, [[0, 2000]])],
      [],
      { pxPerMm: 0.05, minReadablePx: 8 },
    );
    expect(placed[0].hidden).toBe(true);
    expect(placed[1].hidden).toBe(false);
  });
});
