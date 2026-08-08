import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import {
  DRAWING_SHEETS,
  getDrawingSheet,
  normalizeDrawingSheetId,
} from "./drawingSheets";
import {
  cabinetsIntersectingCut,
  resolveSectionCutPlane,
} from "./sectionCut";
import { createTechnicalView } from "./technicalViews";
import type { RoomConfig } from "./roomModel";
import { clampDesktopLayout } from "./desktopUx";

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
      placement: { x: -200, y: 0, z: -1500, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
    {
      id: "wall-1",
      name: "Wall",
      placement: { x: -200, y: 1400, z: -1700, rotation: 0, attachment: "back-wall" },
      config: getDefaultCabinetConfig("wall"),
    },
  ],
};

describe("drawingSheets catalog", () => {
  it("includes section and detail sheets with codes", () => {
    expect(DRAWING_SHEETS.map((sheet) => sheet.id)).toContain("detail");
    expect(getDrawingSheet("section").code).toBe("A-301");
    expect(getDrawingSheet("detail").code).toBe("A-501");
    expect(normalizeDrawingSheetId("detail")).toBe("detail");
  });
});

describe("section cut plane", () => {
  it("resolves cut through active cabinet and finds intersections", () => {
    const plane = resolveSectionCutPlane(project, { activeCabinetId: "base-1" });
    expect(plane.mark).toBe("A");
    expect(plane.xMm).toBe(-200);
    expect(plane.detailRef).toBe("DET-1");
    expect(cabinetsIntersectingCut(project.cabinets, plane).map((c) => c.id)).toEqual(
      expect.arrayContaining(["base-1", "wall-1"]),
    );
  });
});

describe("section and detail rendering", () => {
  it("draws cabinet carcass section cuts and detail callout", () => {
    const view = createTechnicalView(project, room, "section", [], {
      activeCabinetId: "base-1",
      showWallLabels: true,
    });
    expect(view.svg).toContain("twod-section-carcass");
    expect(view.svg).toContain("twod-section-board");
    expect(view.svg).toContain("twod-detail-bubble");
    expect(view.svg).toContain("DET-1");
  });

  it("renders interior construction detail sheet", () => {
    const view = createTechnicalView(project, room, "detail", [], {
      activeCabinetId: "base-1",
      mode: "print",
    });
    expect(view.svg).toContain('data-view="detail"');
    expect(view.svg).toContain("A-501");
    expect(view.svg).toContain("ELEVATION DETAIL");
    expect(view.svg).toContain("SECTION DETAIL");
    expect(view.svg).toContain("INTERIOR CONSTRUCTION");
    expect(view.svg).toContain("twod-detail-frame");
  });

  it("places section markers on plan and front", () => {
    const plan = createTechnicalView(project, room, "top", [], {
      activeCabinetId: "base-1",
      showSectionMarkers: true,
    });
    const front = createTechnicalView(project, room, "front", [], {
      activeCabinetId: "base-1",
      showSectionMarkers: true,
    });
    expect(plan.svg).toContain("twod-section-cut-line");
    expect(plan.svg).toContain("SECTION A-A");
    expect(front.svg).toContain("twod-section-marker");
  });
});

describe("desktop layout detail sheet", () => {
  it("accepts detail as activeSheetId", () => {
    expect(clampDesktopLayout({ activeSheetId: "detail" }).activeSheetId).toBe(
      "detail",
    );
  });
});
