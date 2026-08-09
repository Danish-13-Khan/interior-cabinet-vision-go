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
  createDimLaneAllocator,
  overallDimX,
  overallDimY,
} from "./technicalViews/dimLayout";
import { resolveDimVisibility } from "./technicalViews/dimVisibility";
import { clampDraftingDisplay } from "./draftingAnnotations";
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

  it("allocates stacked lanes without colliding overall and chain", () => {
    const lanes = createDimLaneAllocator();
    const overall = lanes.overallY(100, "below");
    const chain = lanes.chainY(100, "below");
    const run = lanes.runY(100, "below");
    expect(overall).toBe(100 + DIM_OVERALL_OFFSET);
    expect(chain).toBeGreaterThan(overall);
    expect(run).toBeGreaterThan(chain);
  });
});

describe("dimGraphics", () => {
  it("emits extension, witness, arrow, and grip classes on chains", () => {
    const svg = dimensionChainHorizontal(
      [-900, 0, 900],
      ["900", "900"],
      200,
      120,
      "chain",
      100,
      { dimId: "plan-chain-w" },
    ).join("");
    expect(svg).toContain('data-dim="chain"');
    expect(svg).toContain("twod-dim-ext");
    expect(svg).toContain("twod-dim-witness");
    expect(svg).toContain("twod-dim-arrow");
    expect(svg).toContain("twod-dim-grip");
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

describe("dimVisibility", () => {
  it("gates overall, chain, opening, and selected kinds per view", () => {
    const full = resolveDimVisibility(clampDraftingDisplay({}), "front");
    expect(full.overall).toBe(true);
    expect(full.chain).toBe(true);
    expect(full.opening).toBe(true);
    expect(full.selected).toBe(true);

    const clean = resolveDimVisibility(
      clampDraftingDisplay({
        showOverallDims: false,
        showDimensionChains: false,
        showOpeningDims: false,
        showSelectedDims: false,
      }),
      "front",
    );
    expect(clean.overall).toBe(false);
    expect(clean.chain).toBe(false);
    expect(clean.opening).toBe(false);

    const plan = resolveDimVisibility(clampDraftingDisplay({}), "top");
    expect(plan.opening).toBe(false);
    expect(plan.run).toBe(true);
  });
});
