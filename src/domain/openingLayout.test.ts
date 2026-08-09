import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  createDefaultOpeningStructure,
  createOpeningLeaf,
  splitOpening,
} from "./cabinetOpeningStructure";
import {
  layoutCabinetElevationFace,
  layoutOpeningStructure,
} from "./openingLayout";
import { listFamilyEngineeringSummaries } from "./cabinetFamilyEngineering";
import { resetOpeningIdCounterForTests } from "./cabinetOpeningStructure";

describe("openingLayout", () => {
  it("lays out vertical and horizontal splits into face rects", () => {
    resetOpeningIdCounterForTests();
    let structure = createDefaultOpeningStructure("base", 900);
    structure = splitOpening(structure, structure.activeOpeningId, "vertical", "base", 900);
    const leaves = layoutOpeningStructure(structure, 900, 720);
    expect(leaves.length).toBeGreaterThanOrEqual(2);
    const widthSum = leaves.reduce((sum, leaf) => sum + leaf.widthMm, 0);
    expect(widthSum).toBeCloseTo(900, 0);

    structure = splitOpening(
      {
        root: createOpeningLeaf("door", {
          id: "opening-primary",
          label: "Door",
          ratio: 1,
        }),
        activeOpeningId: "opening-primary",
      },
      "opening-primary",
      "horizontal",
      "base",
      900,
    );
    const stacked = layoutOpeningStructure(structure, 900, 720);
    expect(stacked.length).toBe(2);
    const heightSum = stacked.reduce((sum, leaf) => sum + leaf.heightMm, 0);
    expect(heightSum).toBeCloseTo(720, 0);
  });

  it("includes toe kick and fillers in elevation face layout", () => {
    const config = getDefaultCabinetConfig("base");
    config.composition = {
      ...(config.composition ?? {
        openings: [],
        shelves: { count: 0, adjustable: true },
        dividers: { count: 0 },
        doors: { enabled: true, style: "double", hinge: "left", count: 2 },
        drawers: { count: 0, equalHeights: true },
        toeKick: { enabled: true, heightMm: 100, insetMm: 50 },
        fillers: { leftMm: 0, rightMm: 0 },
        endPanels: { left: false, right: false },
      }),
      toeKick: { enabled: true, heightMm: 100, insetMm: 50 },
      fillers: { leftMm: 40, rightMm: 20 },
      endPanels: { left: true, right: false },
      openingStructure: createDefaultOpeningStructure("base", config.dimensions.width),
    };
    const layout = layoutCabinetElevationFace(config);
    expect(layout.toeKickHeightMm).toBe(100);
    expect(layout.leftFillerMm).toBe(40);
    expect(layout.rightFillerMm).toBe(20);
    expect(layout.leftEndPanel).toBe(true);
    expect(layout.faceHeightMm).toBe(config.dimensions.height - 100);
    expect(layout.faceWidthMm).toBe(config.dimensions.width - 60);
    expect(layout.boardThicknessMm).toBeGreaterThan(0);
    expect(layout.clearWidthMm).toBeLessThan(layout.faceWidthMm);
    expect(layout.clearHeightMm).toBeLessThan(layout.faceHeightMm);
    expect(layout.openings.length).toBeGreaterThan(0);
    expect(layout.openings[0]?.markerIndex).toBe(0);
    expect(layout.openings[0]?.xMm).toBeGreaterThanOrEqual(layout.faceInsetLeftMm - 0.01);
  });
});

describe("cabinetFamilyEngineering", () => {
  it("lists explicit engineering defaults per family", () => {
    const summaries = listFamilyEngineeringSummaries();
    expect(summaries.length).toBeGreaterThanOrEqual(8);
    const base = summaries.find((item) => item.family === "base");
    expect(base?.toeKick).not.toBe("off");
    expect(base?.openings).toContain("door");
  });
});
