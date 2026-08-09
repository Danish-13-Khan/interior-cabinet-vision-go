import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance, type CabinetProject } from "./cabinetDimensions";
import type { CabinetRun } from "./cabinetLibrary";
import {
  collectElevationVerticalChain,
  collectPlanDepthChain,
  collectPlanDimensionChain,
  collectRunDimensionChain,
  snapElevationHeight,
  snapPlanPlacement,
} from "./placementSnap";
import { createTechnicalView } from "./technicalViews";
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
  doors: [
    {
      id: "door-1",
      side: "back-wall",
      positionMm: 0,
      widthMm: 900,
      heightMm: 2100,
      swingDirection: "in",
    },
  ],
  windows: [
    {
      id: "window-1",
      side: "back-wall",
      positionMm: -1200,
      widthMm: 1200,
      heightMm: 900,
      sillHeightMm: 950,
    },
  ],
};

const project: CabinetProject = {
  version: 1,
  cabinets: [
    {
      id: "base-1",
      name: "Base Cabinet",
      placement: { x: -900, y: 0, z: -1720, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
    {
      id: "base-2",
      name: "Base Cabinet B",
      placement: { x: 0, y: 0, z: -1720, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
    {
      id: "wall-1",
      name: "Wall Cabinet",
      placement: { x: 600, y: 1400, z: -1840, rotation: 0, attachment: "back-wall" },
      config: getDefaultCabinetConfig("wall"),
    },
  ],
};

function makeCabinet(
  id: string,
  x: number,
  z: number,
  width = 900,
): CabinetInstance {
  const config = getDefaultCabinetConfig("base");
  return {
    id,
    name: id,
    placement: { x, y: 0, z, rotation: 0, attachment: "floor" },
    config: {
      ...config,
      dimensions: { ...config.dimensions, width },
    },
  };
}

describe("placement snap", () => {
  it("snaps cabinet centers toward neighboring edges", () => {
    const moving = makeCabinet("a", 0, 0);
    const neighbor = makeCabinet("b", 950, 0);
    const result = snapPlanPlacement({
      cabinet: moving,
      others: [neighbor],
      proposed: {
        x: 40,
        y: 0,
        z: 12,
        rotation: 0,
        attachment: "floor",
      },
      roomWidthMm: 6000,
      roomDepthMm: 4000,
      gridSizeMm: 50,
    });

    expect(result.placement.x % 50).toBe(0);
    expect(result.placement.z % 50).toBe(0);
    expect(result.guides.length).toBeGreaterThan(0);
  });

  it("builds plan width and depth dimension chains", () => {
    const cabinets = [makeCabinet("a", -900, -500), makeCabinet("b", 900, 500)];
    const widthChain = collectPlanDimensionChain(cabinets, 6000);
    const depthChain = collectPlanDepthChain(cabinets, 4000);

    expect(widthChain.positions[0]).toBe(-3000);
    expect(widthChain.positions[widthChain.positions.length - 1]).toBe(3000);
    expect(widthChain.labels.length).toBe(widthChain.positions.length - 1);
    expect(depthChain.positions[0]).toBe(-2000);
    expect(depthChain.positions[depthChain.positions.length - 1]).toBe(2000);
  });

  it("builds run and elevation vertical chains", () => {
    const cabinets = [makeCabinet("a", -900, 0), makeCabinet("b", 0, 0)];
    const run: CabinetRun = {
      id: "run-1",
      side: "back-wall",
      axis: "x",
      band: "base",
      cabinetIds: ["a", "b"],
      cornerTransition: false,
    };
    const runChain = collectRunDimensionChain(run, cabinets);
    expect(runChain).not.toBeNull();
    expect(runChain!.labels.length).toBeGreaterThan(0);

    const vertical = collectElevationVerticalChain(
      [
        {
          ...makeCabinet("wall", 0, 0),
          placement: { x: 0, y: 1400, z: 0, rotation: 0, attachment: "back-wall" },
          config: getDefaultCabinetConfig("wall"),
        },
      ],
      2800,
    );
    expect(vertical.positions).toContain(0);
    expect(vertical.positions).toContain(2800);
    expect(vertical.positions).toContain(1400);
  });

  it("snaps elevation heights to neighbors and grid", () => {
    const wall = getDefaultCabinetConfig("wall");
    const result = snapElevationHeight({
      proposedY: 1388,
      heightMm: wall.dimensions.height,
      others: [
        {
          id: "peer",
          name: "peer",
          placement: { x: 0, y: 1400, z: 0, rotation: 0, attachment: "back-wall" },
          config: wall,
        },
      ],
      roomHeightMm: 2800,
      gridSizeMm: 50,
      sillHeightsMm: [950],
    });

    expect(result.y % 50).toBe(0);
    expect(result.guides.some((guide) => guide.axis === "y")).toBe(true);
  });
});

describe("technical view rendering", () => {
  it("renders a top view with labels and room dimensions", () => {
    const result = createTechnicalView(project, room, "top", []);

    expect(result.svg).toContain("Base Cabinet");
    expect(result.svg).toContain("6000 mm");
    expect(result.svg).toContain("twod-wall");
    expect(result.width).toBeGreaterThan(1000);
  });

  it("renders front elevation content for wall mounted items", () => {
    const result = createTechnicalView(project, room, "front", []);

    expect(result.svg).toContain("Wall Cabinet");
    expect(result.svg).toContain("2800 mm");
    expect(result.svg).toContain("twod-cabinet-wall");
  });

  it("hides elevation cabinet marks when cabinet tags are disabled", () => {
    const result = createTechnicalView(project, room, "front", [], {
      showCabinetTags: false,
    });

    expect(result.svg).not.toContain("twod-elev-mark");
    expect(result.svg).not.toContain("twod-tag-cabinet");
  });

  it("renders side elevation depth annotations", () => {
    const result = createTechnicalView(project, room, "side", []);

    expect(result.svg).toContain("560 mm");
    expect(result.height).toBeGreaterThan(700);
  });

  it("highlights selected cabinets and draws selected dimensions", () => {
    const result = createTechnicalView(project, room, "top", [], {
      selectedCabinetIds: ["base-1"],
      activeCabinetId: "base-1",
    });

    expect(result.svg).toContain('data-cabinet-id="base-1"');
    expect(result.svg).toContain("twod-active");
    expect(result.svg).toContain("twod-dim-selected");
    expect(result.svg).toContain("twod-selected");
  });

  it("adds wall labels, dimension chains, run chains, and print title blocks", () => {
    const interactive = createTechnicalView(project, room, "top", [], {
      mode: "interactive",
      showWallLabels: true,
      showDimensionChains: true,
      showRunBands: true,
      showRunLabels: true,
      showFillers: true,
      showCountertopSpans: true,
      runs: [
        {
          id: "run-1",
          side: "back-wall",
          axis: "x",
          band: "base",
          cabinetIds: ["base-1", "base-2"],
          cornerTransition: false,
        },
      ],
      fillers: [
        {
          id: "filler-1",
          runId: "run-1",
          side: "end",
          widthMm: 60,
          position: { x: -200, y: 0, z: -1720 },
          size: { width: 60, height: 720, depth: 560 },
        },
      ],
    });
    expect(interactive.svg).toContain("BACK WALL");
    expect(interactive.svg).toContain("LEFT");
    expect(interactive.svg).toContain("twod-dim");
    expect(interactive.svg).toContain("twod-run-band");
    expect(interactive.svg).toContain("twod-run-label");
    expect(interactive.svg).toContain("twod-run-filler");
    expect(interactive.originX).toBeGreaterThan(0);

    const reorderedFillers = createTechnicalView(project, room, "top", [], {
      mode: "interactive",
      showRunLabels: true,
      showFillers: true,
      runs: [
        {
          id: "run-1",
          side: "back-wall",
          axis: "x",
          band: "base",
          cabinetIds: ["base-1", "base-2"],
          cornerTransition: false,
        },
      ],
      fillers: [
        {
          id: "filler-1",
          runId: "run-1",
          side: "end",
          widthMm: 60,
          position: { x: -200, y: 0, z: -1720 },
          size: { width: 60, height: 720, depth: 560 },
        },
        {
          id: "filler-0",
          runId: "run-1",
          side: "start",
          widthMm: 80,
          position: { x: -1600, y: 0, z: -1720 },
          size: { width: 80, height: 720, depth: 560 },
        },
      ],
    });
    expect(reorderedFillers.svg).toContain("FL-1 80");
    expect(reorderedFillers.svg).toContain("FL-2 60");

    const front = createTechnicalView(project, room, "front", [], {
      mode: "interactive",
      showDimensionChains: true,
      showGrid: true,
      selectedCabinetIds: ["wall-1"],
      activeCabinetId: "wall-1",
      showElevationDetails: true,
      showRunLabels: true,
      showRunBands: true,
      runs: [
        {
          id: "run-1",
          side: "back-wall",
          axis: "x",
          band: "base",
          cabinetIds: ["base-1", "base-2"],
          cornerTransition: false,
        },
      ],
    });
    expect(front.svg).toContain("twod-dim-selected");
    expect(front.svg).toContain("twod-grid");
    expect(front.svg).toContain("data-opening-id");
    expect(front.svg).toContain("twod-opening-face");
    expect(front.svg).toContain("twod-opening-chrome");
    expect(front.svg).toContain("twod-opening-label");
    expect(front.svg).toContain("data-content-type");
    expect(front.svg).toContain("twod-run-label");
    expect(front.svg).toContain("twod-run-baseline");

    const printSheet = createTechnicalView(project, room, "front", [], {
      mode: "print",
      title: "Front Elevation",
      projectName: "Demo Kitchen",
      showElevationDetails: true,
    });
    expect(printSheet.svg).toContain("A-201");
    expect(printSheet.svg).toContain("Demo Kitchen");
    expect(printSheet.svg).toContain("FRONT ELEV.");
  });
});
