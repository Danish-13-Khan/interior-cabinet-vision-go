import { describe, expect, it } from "vitest";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { slidingLeaves } from "../cabinetConstruction/slidingFronts";
import { createCabinetCutlist, createCabinetGeometry } from "../cabinetGeometry";
import { SLIDING_DEFAULTS, slidingLeafCount, slidingLeafWidth } from "./slidingDefaults";
import { slidingWardrobe } from "./slidingTestSupport";

const T = SLIDING_DEFAULTS.trackAllowanceMm;
const leavesOf = (widthMm: number, leafCount?: 2 | 3) =>
  slidingLeaves(resolveFrontGaps(slidingWardrobe(widthMm, { leafCount })).openings);

describe("Phase 3 sliding shutters: leaf maths (§3.4)", () => {
  it("defaults match the roadmap (Q4 unanswered → flagged)", () => {
    expect(SLIDING_DEFAULTS).toMatchObject({
      trackKind: "bottom-roll", overlapMm: 40, trackAllowanceMm: 90, heightDeductionMm: 40,
      maxLeafWidthMm: 1000, confirmed: false,
    });
  });

  it("leaf count picks 2 / 3 from width unless overridden", () => {
    expect(slidingLeafCount(1200, {})).toBe(2);
    expect(slidingLeafCount(1800, {})).toBe(2);
    expect(slidingLeafCount(2000, {})).toBe(2);
    expect(slidingLeafCount(2001, {})).toBe(3);
    expect(slidingLeafCount(2400, {})).toBe(3);
    expect(slidingLeafCount(2400, { leafCount: 2 })).toBe(2);
    expect(slidingLeafCount(1500, { leafCount: 3 })).toBe(3);
  });

  it("a 2400 wardrobe with 2 and with 3 leaves gives (W + overlap × (n − 1)) / n", () => {
    expect(slidingLeafWidth(2400, 2, 40)).toBe(1220);
    expect(slidingLeafWidth(2400, 3, 40)).toBeCloseTo(826.667, 2);
    const two = leavesOf(2400, 2);
    const three = leavesOf(2400);
    expect(two.map((leaf) => leaf.widthMm)).toEqual([1220, 1220]);
    expect(three).toHaveLength(3);
    for (const leaf of three) expect(leaf.widthMm).toBeCloseTo(2480 / 3, 6);
  });

  it.each([[1200, 2], [1800, 2], [2100, 3], [2400, 3]])(
    "%i mm: leaves alternate planes, overlap by 40 and cover exactly the width", (width, count) => {
      const leaves = leavesOf(width);
      expect(leaves).toHaveLength(count);
      expect(leaves.map((leaf) => leaf.slidingPlane)).toEqual(count === 2 ? [0, 1] : [0, 1, 0]);
      const left = leaves[0]!.xMm;
      const right = leaves.at(-1)!.xMm + leaves.at(-1)!.widthMm;
      expect(right - left).toBeCloseTo(width, 6);
      for (let i = 1; i < leaves.length; i += 1) {
        const prev = leaves[i - 1]!;
        expect(prev.xMm + prev.widthMm - leaves[i]!.xMm).toBeCloseTo(40, 6);
      }
      for (const leaf of leaves) expect(leaf.heightMm).toBe(2400 - 80 - SLIDING_DEFAULTS.heightDeductionMm);
    },
  );
});

describe("Phase 3 sliding shutters: one resolver for production, cut list and 3D", () => {
  for (const width of [1800, 2400]) {
    it(`${width} mm: production, legacy cut list and 3D give the resolver's leaf sizes`, () => {
      const config = slidingWardrobe(width);
      const leaves = leavesOf(width);
      const parts = createCabinetConstruction(config).parts;
      const doors = parts.filter((part) => part.category === "Door");
      expect(doors).toHaveLength(1);
      expect(doors[0]).toMatchObject({ label: "Sliding shutter", quantity: leaves.length });
      expect(doors[0]!.widthMm).toBe(Math.round(leaves[0]!.widthMm)); // production rounds to whole mm
      expect(doors[0]!.lengthMm).toBe(leaves[0]!.heightMm);
      expect(doors[0]!.finishLabel).toBe("grey");

      const cutlist = createCabinetCutlist(config);
      const shutters = cutlist.find((item) => item.key === "sliding-shutters");
      expect(shutters).toMatchObject({ quantity: leaves.length, widthMm: Math.round(leaves[0]!.widthMm) });
      expect(cutlist.some((item) => item.key === "doors")).toBe(false);

      const drawn = createCabinetGeometry(config).filter((panel) => panel.name.startsWith("sliding-shutter-"));
      expect(drawn).toHaveLength(leaves.length);
      for (const panel of drawn) expect(panel.size[0] * 1000).toBeCloseTo(leaves[0]!.widthMm, 6);
    });
  }

  it("carcass is depth − track allowance; end panels keep the full depth", () => {
    const config = slidingWardrobe(1800);
    const parts = createCabinetConstruction(config).parts;
    expect(parts.find((part) => part.category === "Side")!.widthMm).toBe(600 - T);
    expect(parts.filter((part) => part.category === "EndPanel").map((part) => part.widthMm)).toEqual([600, 600]);
    const cutlist = createCabinetCutlist(config);
    expect(cutlist.find((item) => item.key === "side-panels")!.widthMm).toBe(600 - T);
    expect(cutlist.find((item) => item.key === "end-panels")!.widthMm).toBe(600);
  });

  it("3D leaves never intersect, stay inside the overall depth and in front of the carcass", () => {
    for (const width of [1200, 1800, 2400]) {
      const panels = createCabinetGeometry(slidingWardrobe(width));
      const zRange = (name: string) => {
        const panel = panels.find((item) => item.name === name)!;
        return [panel.position[2] - panel.size[2] / 2, panel.position[2] + panel.size[2] / 2] as const;
      };
      const half = 0.3;
      const leafNames = panels.filter((panel) => /^sliding-shutter-\d+$/.test(panel.name)).map((panel) => panel.name);
      const ranges = leafNames.map(zRange);
      for (const [lo, hi] of ranges) {
        expect(lo).toBeGreaterThanOrEqual(half - T / 1000 - 1e-9);
        expect(hi).toBeLessThanOrEqual(half + 1e-9);
      }
      for (let i = 1; i < ranges.length; i += 1) {
        const [aLo, aHi] = ranges[i - 1]!;
        const [bLo, bHi] = ranges[i]!;
        expect(aHi <= bLo || bHi <= aLo, `${width} leaves ${i}/${i + 1}`).toBe(true);
      }
      const carcass = panels.filter((panel) => panel.material === "board" && !panel.name.includes("end-panel"));
      for (const panel of carcass) expect(panel.position[2] + panel.size[2] / 2).toBeLessThanOrEqual(half - T / 1000 + 1e-9);
      for (const panel of panels) {
        expect(panel.position[2] - panel.size[2] / 2, panel.name).toBeGreaterThanOrEqual(-half - 1e-9);
        expect(panel.position[2] + panel.size[2] / 2, panel.name).toBeLessThanOrEqual(half + 1e-9);
      }
      expect(panels.filter((panel) => panel.name.startsWith("handle-"))).toHaveLength(0);
      expect(panels.filter((panel) => panel.name.startsWith("sliding-pull-"))).toHaveLength(leafNames.length);
    }
  });
});
