import { describe, expect, it } from "vitest";
import {
  DIM_CHAIN_OFFSET,
  DIM_OVERALL_OFFSET,
  DIM_RUN_CHAIN_STEP,
  TECHNICAL_VIEW_MARGIN,
} from "./technicalViews/constants";
import {
  dimensionChainHorizontal,
  overallSpanHorizontal,
} from "./technicalViews/dimGraphics";
import {
  chainLaneY,
  overallDimX,
  overallDimY,
} from "./technicalViews/dimLayout";
import { computeSheetFrame, wrapTechnicalSvg } from "./technicalViews/sheetFrame";
import { createTechnicalView } from "./technicalViews";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import type { RoomConfig } from "./roomModel";

const room: RoomConfig = {
  dimensions: {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 120,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  },
  doors: [],
  windows: [],
};

const project: CabinetProject = {
  version: 1,
  cabinets: [
    {
      id: "base-1",
      name: "Base",
      placement: { x: 0, y: 0, z: -1500, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
  ],
};

describe("dimLayout", () => {
  it("offsets overall and chain lanes consistently", () => {
    expect(overallDimY(100, "above")).toBe(100 - DIM_OVERALL_OFFSET);
    expect(overallDimY(100, "below")).toBe(100 + DIM_OVERALL_OFFSET);
    expect(overallDimX(50, "left")).toBe(50 - DIM_OVERALL_OFFSET);
    expect(chainLaneY(200, 1)).toBe(200 + DIM_CHAIN_OFFSET + DIM_RUN_CHAIN_STEP);
  });
});

describe("dimGraphics", () => {
  it("emits extension and witness classes on chains", () => {
    const svg = dimensionChainHorizontal([-900, 0, 900], ["900", "900"], 200, 120, "chain", 100).join("");
    expect(svg).toContain('data-dim="chain"');
    expect(svg).toContain("twod-dim-ext");
    expect(svg).toContain("twod-dim-witness");
    expect(svg).toContain("900 mm");
  });

  it("places overall labels relative to geometry edge", () => {
    const above = overallSpanHorizontal(10, 110, 20, "4000", 40).join("");
    const below = overallSpanHorizontal(10, 110, 60, "4000", 40).join("");
    expect(above).toContain("twod-dim-overall");
    expect(below).toContain("4000 mm");
  });
});

describe("sheetFrame", () => {
  it("uses tightened margins and print title pad", () => {
    const interactive = computeSheetFrame({ spanMm: 6000, crossMm: 4000 });
    expect(interactive.svgWidth).toBeGreaterThan(TECHNICAL_VIEW_MARGIN * 2);
    expect(interactive.print).toBe(false);

    const print = computeSheetFrame({
      spanMm: 6000,
      crossMm: 4000,
      mode: "print",
    });
    expect(print.print).toBe(true);
    expect(print.svgHeight).toBeGreaterThan(interactive.svgHeight);
    expect(print.oy).toBeGreaterThan(interactive.oy);
  });

  it("wraps svg with view and mode metadata", () => {
    const frame = computeSheetFrame({ spanMm: 1000, crossMm: 1000 });
    const svg = wrapTechnicalSvg(frame, "plan", ["<g/>"]);
    expect(svg).toContain('data-view="plan"');
    expect(svg).toContain('data-mode="interactive"');
    expect(svg).toContain("twod-draft");
  });
});

describe("technical view drafting fidelity", () => {
  it("emits class-driven cabinets and dimensions without app-blue selection paints", () => {
    const view = createTechnicalView(project, room, "top", [], {
      activeCabinetId: "base-1",
      selectedCabinetIds: ["base-1"],
      showDimensionChains: true,
    });
    expect(view.svg).toContain("twod-cabinet");
    expect(view.svg).toContain("twod-active");
    expect(view.svg).toContain("twod-selected");
    expect(view.svg).toContain("twod-dim-overall");
    expect(view.svg).toContain("twod-dim-ext");
    expect(view.svg).not.toContain('stroke="#1d4ed8"');
    expect(view.svg).toContain('data-view="plan"');
  });

  it("prints with title block classes", () => {
    const view = createTechnicalView(project, room, "front", [], {
      mode: "print",
      title: "Front Elevation",
      projectName: "Test Job",
    });
    expect(view.svg).toContain("twod-titleblock");
    expect(view.svg).toContain('data-mode="print"');
    expect(view.svg).toContain("FRONT ELEV.");
  });
});
