import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
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
};

describe("project report", () => {
  it("builds grouped cutlists and costing totals", () => {
    const report = createProjectReport(project, room);

    expect(report.summary.itemCount).toBe(2);
    expect(report.groupedByMaterial.length).toBeGreaterThan(0);
    expect(report.groupedByThickness.length).toBeGreaterThan(0);
    expect(report.projectCost.grandTotal).toBeGreaterThan(0);
    expect(report.perItemCutlists[1].cost.totalCost).toBeGreaterThan(0);
  });
});
