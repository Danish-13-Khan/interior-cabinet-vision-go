import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import { createProjectProductionCutlist } from "./productionCutlist";
import { createProjectReport } from "./projectReport";
import {
  clampSheetOptimizerSettings,
  getSheetStockDefinition,
  sheetUsableSizeMm,
} from "./sheetStock";
import {
  csvFromSheetYield,
  expandCutlistToParts,
  planSheetYield,
} from "./sheetYield";
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
      id: "cab-1",
      name: "Base Cabinet",
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
    {
      id: "cab-2",
      name: "Wall Cabinet",
      placement: { x: 900, y: 1400, z: -1700, rotation: 0, attachment: "back-wall" },
      config: getDefaultCabinetConfig("wall"),
    },
  ],
};

describe("sheet stock + yield planning", () => {
  it("defines usable sheet area after trim", () => {
    const sheet = getSheetStockDefinition("sheet-2440x1220");
    const usable = sheetUsableSizeMm(sheet, 10);
    expect(usable.lengthMm).toBe(2420);
    expect(usable.widthMm).toBe(1200);
    expect(usable.areaM2).toBeGreaterThan(2.8);
  });

  it("clamps optimizer settings to known sheet stock", () => {
    const clamped = clampSheetOptimizerSettings({
      sheetId: "missing",
      kerfMm: 99,
      trimMm: -4,
    });
    expect(clamped.sheetId).toBe("sheet-2440x1220");
    expect(clamped.kerfMm).toBe(12);
    expect(clamped.trimMm).toBe(0);
  });

  it("expands cutlist quantities into part instances and packs by material", () => {
    const lines = createProjectProductionCutlist(project);
    const parts = expandCutlistToParts(lines);
    expect(parts.length).toBeGreaterThan(lines.length);

    const plan = planSheetYield(lines, {
      sheetId: "sheet-2440x1220",
      kerfMm: 3,
      trimMm: 10,
      allowRotateFreeGrain: true,
    });

    expect(plan.groups.length).toBeGreaterThan(0);
    expect(plan.totalSheets).toBeGreaterThan(0);
    expect(plan.overallYieldPercent).toBeGreaterThan(0);
    expect(plan.groups.every((group) => group.sheetsUsed > 0)).toBe(true);
    expect(plan.groups.some((group) => group.sheets[0]?.parts.length > 0)).toBe(true);
    expect(plan.totalOffcutAreaM2).toBeGreaterThanOrEqual(0);

    const csv = csvFromSheetYield(plan);
    expect(csv).toContain("Shop Ref");
    expect(csv.split("\n").length).toBeGreaterThan(2);
  });

  it("attaches sheet yield to project reports and material board counts", () => {
    const report = createProjectReport(project, room);
    expect(report.sheetYield.totalSheets).toBeGreaterThan(0);
    expect(report.packetSections.some((section) => section.id === "optimize")).toBe(true);
    expect(report.materialSummary[0].estimatedBoards).toBeGreaterThan(0);
    const matched = report.sheetYield.groups.find(
      (group) =>
        group.material === report.materialSummary[0].material &&
        group.thicknessMm === report.materialSummary[0].thicknessMm,
    );
    expect(matched?.sheetsUsed).toBe(report.materialSummary[0].estimatedBoards);
  });
});
