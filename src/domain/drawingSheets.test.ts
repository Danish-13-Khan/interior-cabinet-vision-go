import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import {
  DRAWING_SHEETS,
  getDrawingSheet,
  normalizeDrawingSheetId,
} from "./drawingSheets";
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
      placement: { x: 0, y: 0, z: -1500, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
  ],
};

describe("drawingSheets catalog", () => {
  it("defines plan/front/side/section/detail/report with sheet codes", () => {
    expect(DRAWING_SHEETS.map((sheet) => sheet.id)).toEqual([
      "plan",
      "front",
      "side",
      "section",
      "detail",
      "report",
    ]);
    expect(getDrawingSheet("plan").code).toBe("A-101");
    expect(getDrawingSheet("front").code).toBe("A-201");
    expect(getDrawingSheet("side").code).toBe("A-202");
    expect(getDrawingSheet("section").code).toBe("A-301");
    expect(getDrawingSheet("detail").code).toBe("A-501");
    expect(getDrawingSheet("report").code).toBe("A-401");
    expect(getDrawingSheet("plan").scaleText).toMatch(/^1:/);
    expect(getDrawingSheet("report").scaleText).toBe("NTS");
  });

  it("normalizes unknown sheet ids", () => {
    expect(normalizeDrawingSheetId("nope")).toBe("plan");
    expect(normalizeDrawingSheetId("section")).toBe("section");
    expect(normalizeDrawingSheetId("detail")).toBe("detail");
  });
});

describe("section and report sheets", () => {
  it("renders section A-A with cut marks", () => {
    const view = createTechnicalView(project, room, "section", [], {
      mode: "interactive",
      showWallLabels: true,
    });
    expect(view.svg).toContain('data-view="section"');
    expect(view.svg).toContain("twod-section-cut");
    expect(view.svg).toContain("SECTION A-A");
  });

  it("renders report schedule sheet", () => {
    const view = createTechnicalView(project, room, "report", [], {
      mode: "print",
      projectName: "Test Job",
      sheetCode: "A-401",
    });
    expect(view.svg).toContain('data-view="report"');
    expect(view.svg).toContain("A-401");
    expect(view.svg).toContain("twod-schedule-header");
    expect(view.svg).toContain("CABINET");
  });
});

describe("desktop layout sheets", () => {
  it("persists activeSheetId and sheet browser visibility", () => {
    const layout = clampDesktopLayout({
      activeSheetId: "section",
      sheetBrowserVisible: false,
    });
    expect(layout.activeSheetId).toBe("section");
    expect(layout.sheetBrowserVisible).toBe(false);
    expect(clampDesktopLayout({}).sheetBrowserVisible).toBe(false);
    expect(clampDesktopLayout({}).activeSheetId).toBe("front");
  });
});
