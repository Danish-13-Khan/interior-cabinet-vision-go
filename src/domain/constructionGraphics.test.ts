import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  elevDoorSwingArc,
  handleSideForLeaf,
  hingeSideForLeaf,
  planDoorConvention,
  renderFamilyPlanSymbol,
  resolveDoorLeafCount,
  wallThicknessSvg,
} from "./constructionGraphics";
import { renderElevationFaceGraphics } from "./elevationFaceGraphics";
import { createTechnicalView } from "./technicalViews";
import type { RoomConfig } from "./roomModel";
import type { CabinetInstance, CabinetProject } from "./cabinetDimensions";

describe("constructionGraphics", () => {
  it("resolves door leaf counts by style", () => {
    expect(resolveDoorLeafCount("none", 900)).toBe(0);
    expect(resolveDoorLeafCount("single", 900)).toBe(1);
    expect(resolveDoorLeafCount("double", 900)).toBe(2);
    expect(resolveDoorLeafCount("bi-fold", 900)).toBe(4);
    expect(resolveDoorLeafCount("double", 500)).toBe(1);
  });

  it("places handles opposite hinges", () => {
    expect(handleSideForLeaf("left", 0, 1)).toBe("right");
    expect(handleSideForLeaf("right", 0, 1)).toBe("left");
    expect(hingeSideForLeaf("left", 0, 1)).toBe("left");
    expect(hingeSideForLeaf(undefined, 1, 2)).toBe("right");
  });

  it("emits elevation swing arcs", () => {
    const svg = elevDoorSwingArc(10, 20, 40, 80, "left");
    expect(svg).toContain("twod-door-swing");
    expect(svg).toContain("A ");
  });

  it("builds thickness-aware plan door swings", () => {
    const parts = planDoorConvention(200, 200, 6000, 4000, 20, 6, {
      id: "d1",
      side: "back-wall",
      positionMm: 0,
      widthMm: 900,
      heightMm: 2100,
      swingDirection: "in",
    });
    const svg = parts.join("");
    expect(svg).toContain("twod-opening-door");
    expect(svg).toContain("twod-door-swing");
    expect(wallThicknessSvg(120, 20)).toBeGreaterThan(1);
  });

  it("renders family-specific plan symbols", () => {
    const sink = renderFamilyPlanSymbol("sink", 0, 0, 40, 30).join("");
    expect(sink).toContain("twod-sink-bowl");
    const drawer = renderFamilyPlanSymbol("drawer", 0, 0, 40, 30).join("");
    expect(drawer).toContain("twod-drawer-pull");
    const corner = renderFamilyPlanSymbol("corner", 0, 0, 40, 30).join("");
    expect(corner).toContain("twod-corner-mark");
  });

  it("draws hinge-aware elevation face doors with swings", () => {
    const cabinet: CabinetInstance = {
      id: "cab-1",
      name: "Base",
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    };
    const svg = renderElevationFaceGraphics(cabinet, 10, 10, 45, 36, {
      scale: 20,
      showDetails: true,
    }).join("");
    expect(svg).toContain("twod-door-swing");
    expect(svg).toContain("twod-toe-kick");
    expect(svg).toContain("twod-door-handle");
  });

  it("includes construction classes in plan and front views", () => {
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
        {
          id: "sink-1",
          name: "Sink",
          placement: { x: 1000, y: 0, z: -1500, rotation: 0, attachment: "floor" },
          config: getDefaultCabinetConfig("sink"),
        },
      ],
    };
    const plan = createTechnicalView(project, room, "top", [], {
      showCabinetTags: true,
      showOpeningTags: true,
    });
    expect(plan.svg).toContain("twod-door-swing");
    expect(plan.svg).toContain("twod-family-symbol");
    expect(plan.svg).toContain("twod-line-center");

    const front = createTechnicalView(project, room, "front", [], {
      showElevationDetails: true,
    });
    expect(front.svg).toContain("twod-door-swing");
    expect(front.svg).toContain("twod-ffl-line");
  });
});
