import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
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
      id: "wall-1",
      name: "Wall Cabinet",
      placement: { x: 600, y: 1400, z: -1840, rotation: 0, attachment: "back-wall" },
      config: getDefaultCabinetConfig("wall"),
    },
  ],
};

describe("technical view rendering", () => {
  it("renders a top view with labels and room dimensions", () => {
    const result = createTechnicalView(project, room, "top", []);

    expect(result.svg).toContain("Base Cabinet");
    expect(result.svg).toContain("6000 mm");
    expect(result.width).toBeGreaterThan(1000);
  });

  it("renders front elevation content for wall mounted items", () => {
    const result = createTechnicalView(project, room, "front", []);

    expect(result.svg).toContain("Wall Cabinet");
    expect(result.svg).toContain("2800 mm");
  });

  it("renders side elevation depth annotations", () => {
    const result = createTechnicalView(project, room, "side", []);

    expect(result.svg).toContain("560 mm");
    expect(result.height).toBeGreaterThan(700);
  });

  it("highlights selected cabinets in technical views", () => {
    const result = createTechnicalView(project, room, "top", [], {
      selectedCabinetIds: ["base-1"],
      activeCabinetId: "base-1",
    });

    expect(result.svg).toContain('data-cabinet-id="base-1"');
    expect(result.svg).toContain("#1d4ed8");
  });

  it("adds wall labels, dimension chains, and print title blocks", () => {
    const interactive = createTechnicalView(project, room, "top", [], {
      mode: "interactive",
      showWallLabels: true,
      showDimensionChains: true,
    });
    expect(interactive.svg).toContain("BACK WALL");
    expect(interactive.svg).toContain("LEFT");
    expect(interactive.originX).toBeGreaterThan(0);

    const printSheet = createTechnicalView(project, room, "front", [], {
      mode: "print",
      title: "Front Elevation",
      projectName: "Demo Kitchen",
      showElevationDetails: true,
    });
    expect(printSheet.svg).toContain("TECHNICAL SHEET");
    expect(printSheet.svg).toContain("Demo Kitchen");
    expect(printSheet.svg).toContain("FRONT ELEV.");
  });
});
