import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import {
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
  csvFromProductionCutlist,
  groupCutlistByMaterial,
  groupCutlistByThickness,
} from "./productionCutlist";
import { calculateCabinetCost, calculateProjectCost } from "./costing";
import { clampCostingSettings, getCostingPreset } from "./costingSettings";
import { createProjectReport } from "./projectReport";
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
      name: "Drawer Cabinet",
      placement: { x: 1000, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("drawer"),
    },
  ],
  preferences: {
    snapSizeMm: 50,
    showGrid: true,
    autoSaveToBrowser: true,
    costing: getCostingPreset("premium")!.settings,
  },
};

describe("production cutlist", () => {
  it("builds per-cabinet lines with source references", () => {
    const lines = createCabinetProductionCutlist(project.cabinets[0]);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => line.cabinetId === "cab-1")).toBe(true);
    expect(lines.every((line) => line.cabinetName === "Base Cabinet")).toBe(true);
    expect(lines[0].thicknessMm).toBeGreaterThan(0);
  });

  it("groups project cutlist by material and thickness", () => {
    const lines = createProjectProductionCutlist(project);
    const byMaterial = groupCutlistByMaterial(lines);
    const byThickness = groupCutlistByThickness(lines);

    expect(byMaterial.length).toBeGreaterThan(0);
    expect(byThickness.length).toBeGreaterThan(0);
    expect(byMaterial[0].lines[0].cabinetName).toBeTruthy();
    expect(csvFromProductionCutlist(lines)).toContain("Shop Ref");
    expect(csvFromProductionCutlist(lines)).toContain("Cabinet");
    expect(csvFromProductionCutlist(lines)).toContain("Base Cabinet");
    expect(lines[0].shopRef).toMatch(/^C0\d-P/);
  });
});

describe("costing", () => {
  it("applies waste, labour, and hardware settings", () => {
    const cabinet = project.cabinets[0];
    const construction = createCabinetConstruction(cabinet.config);
    const lines = createCabinetProductionCutlist(cabinet);
    const economy = calculateCabinetCost(
      cabinet,
      construction,
      lines,
      undefined,
      getCostingPreset("economy")!.settings,
    );
    const premium = calculateCabinetCost(
      cabinet,
      construction,
      lines,
      undefined,
      getCostingPreset("premium")!.settings,
    );

    expect(economy.totalCost).toBeGreaterThan(0);
    expect(premium.wasteCost).toBeGreaterThan(economy.wasteCost);
    expect(premium.hardwareLines.length).toBeGreaterThan(0);
  });

  it("rolls up project totals with allowance", () => {
    const constructionMap = new Map(
      project.cabinets.map(
        (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
      ),
    );
    const cutlistMap = new Map(
      project.cabinets.map(
        (cabinet) => [cabinet.id, createCabinetProductionCutlist(cabinet)] as const,
      ),
    );
    const cost = calculateProjectCost(
      project.cabinets,
      constructionMap,
      cutlistMap,
      undefined,
      clampCostingSettings(getCostingPreset("premium")!.settings),
    );

    expect(cost.hardwareAllowance).toBe(2500);
    expect(cost.labourAllowance).toBe(1500);
    expect(cost.grandTotal).toBe(
      cost.totalMaterial +
        cost.totalHardware +
        cost.totalLabour +
        cost.hardwareAllowance +
        cost.labourAllowance,
    );
  });
});

describe("project report", () => {
  it("builds production report sections and costing totals", () => {
    const report = createProjectReport(project, room);

    expect(report.summary.itemCount).toBe(2);
    expect(report.productionCutlist.length).toBeGreaterThan(0);
    expect(report.groupedByMaterial.length).toBeGreaterThan(0);
    expect(report.groupedByThickness.length).toBeGreaterThan(0);
    expect(report.groupedByCabinet.length).toBe(2);
    expect(report.projectCost.grandTotal).toBeGreaterThan(0);
    expect(report.perItemCutlists[1].lines.length).toBeGreaterThan(0);
    expect(report.perItemCutlists[1].cost.totalCost).toBeGreaterThan(0);
    expect(report.materialSummary[0].lineCount).toBeGreaterThan(0);
    expect(report.cabinetSchedule).toHaveLength(2);
    expect(report.job).toBeTruthy();
    expect(report.packetSections.length).toBeGreaterThan(0);
  });
});
