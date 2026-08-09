import { describe, expect, it } from "vitest";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  formatApplianceTag,
  formatCabinetElevationLabel,
  formatCabinetTag,
  formatFaceOpeningTag,
  formatOpeningTag,
} from "./draftingAnnotations";
import { filterDimensionChain } from "./placementSnap";
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
      id: "sink-1",
      name: "Sink",
      placement: { x: 200, y: 0, z: -1720, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("sink"),
    },
  ],
  drafting: {
    notes: [
      {
        id: "n1",
        view: "top",
        text: "Verify plumbing chase",
        anchor: { x: 0, y: 0, z: 0 },
      },
    ],
    leaders: [
      {
        id: "l1",
        view: "front",
        text: "Hood clear",
        target: { x: 0, y: 1800, z: 0 },
        label: { x: 400, y: 2000, z: 0 },
      },
    ],
  },
};

describe("drafting annotations", () => {
  it("formats cabinet, opening, and appliance tags", () => {
    expect(formatCabinetTag(0)).toBe("C01");
    expect(formatOpeningTag("door", 0, 900, 2100)).toContain("DR-1");
    expect(formatOpeningTag("window", 0, 1200, 900, 950)).toContain("S950");
    expect(formatApplianceTag("sink")).toContain("SINK");
    expect(formatFaceOpeningTag("door", 0)).toBe("OP-1");
    expect(formatFaceOpeningTag("drawer-stack", 2)).toBe("DW-3");
    expect(formatCabinetElevationLabel("C01", "Base Unit", 900, 720)).toContain(
      "C01 · Base Unit",
    );
  });

  it("clamps drafting annotation counts and text", () => {
    const clamped = clampProjectDrafting({
      notes: [{ id: "a", view: "all", text: "  Hello  ", anchor: { x: 1, y: 2, z: 3 } }],
      leaders: [],
    });
    expect(clamped.notes[0].text).toBe("Hello");
  });

  it("defaults run drafting display preferences on", () => {
    const display = clampDraftingDisplay({});
    expect(display.showRunBands).toBe(true);
    expect(display.showRunLabels).toBe(true);
    expect(display.showFillers).toBe(true);
    expect(display.showCountertopSpans).toBe(true);
    expect(clampDraftingDisplay({ showRunLabels: false }).showRunLabels).toBe(false);
  });

  it("filters tiny dimension chain segments", () => {
    const filtered = filterDimensionChain(
      { positions: [0, 10, 500, 520, 1000], labels: ["10", "490", "20", "480"] },
      40,
    );
    expect(filtered.positions.length).toBeLessThan(5);
    expect(filtered.positions[0]).toBe(0);
    expect(filtered.positions[filtered.positions.length - 1]).toBe(1000);
  });

  it("renders tags, notes, and leaders into technical views", () => {
    const plan = createTechnicalView(project, room, "top", [], {
      showCabinetTags: true,
      showOpeningTags: true,
      showApplianceTags: true,
      drafting: project.drafting,
    });
    expect(plan.svg).toContain("C01");
    expect(plan.svg).toContain("DR-1");
    expect(plan.svg).toContain("Verify plumbing chase");
    expect(plan.svg).toContain("APPL");

    const front = createTechnicalView(project, room, "front", [], {
      drafting: project.drafting,
    });
    expect(front.svg).toContain("Hood clear");
    expect(front.svg).toContain("twod-leader");
  });
});
