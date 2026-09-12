import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "../cabinetDimensions";
import { createDefaultJobMeta } from "../jobMeta";
import { createProjectReport } from "../projectReport";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type { RoomConfig } from "../roomModel";
import { boqBoardRole, buildBoqFromReport, csvFromBoqViews } from ".";

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
      placement: { x: 900, y: 0, z: 300, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
  ],
  job: createDefaultJobMeta({
    customerName: "Test",
    projectNumber: "JOB-B",
    revision: "A",
  }),
  preferences: {
    snapSizeMm: 50,
    showGrid: true,
    autoSaveToBrowser: true,
    quote: { ...DEFAULT_QUOTE_SETTINGS },
  },
};

describe("BOQ views (Phase B)", () => {
  it("maps door categories to shutter and sides to carcass", () => {
    expect(boqBoardRole("Door")).toBe("shutter");
    expect(boqBoardRole("DrawerFront")).toBe("shutter");
    expect(boqBoardRole("Side")).toBe("carcass");
    expect(boqBoardRole("Back")).toBe("back");
  });

  it("builds by-cabinet / material / thickness / role views from the report", () => {
    const report = createProjectReport(project, room);
    const views = buildBoqFromReport(report);
    expect(views.lines.length).toBeGreaterThan(0);
    expect(views.byCabinet.length).toBe(1);
    expect(views.byMaterial.length).toBeGreaterThan(0);
    expect(views.byThickness.length).toBeGreaterThan(0);
    expect(views.byRole.some((group) => group.key === "carcass")).toBe(true);
    const csv = csvFromBoqViews(views);
    expect(csv).toContain("Carcass");
    expect(csv).toContain("Base Cabinet");
  });
});
