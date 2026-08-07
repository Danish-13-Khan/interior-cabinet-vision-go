import { describe, expect, it } from "vitest";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  patchJobMeta,
} from "./jobMeta";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import { createProjectReport } from "./projectReport";
import { createProjectProductionCutlist } from "./productionCutlist";
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
      placement: { x: 900, y: 0, z: 300, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
    {
      id: "cab-2",
      name: "Drawer Cabinet",
      placement: { x: 1600, y: 0, z: 300, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("drawer"),
    },
  ],
  job: createDefaultJobMeta({
    customerName: "Rivera Residence",
    projectNumber: "JOB-214",
    revision: "B",
    status: "quoted",
    notes: "Matte white finish",
  }),
};

describe("job meta", () => {
  it("clamps and patches status timestamps", () => {
    const clamped = clampJobMeta({ status: "not-real" as never });
    expect(clamped.status).toBe("draft");
    expect(formatJobTitle(clamped)).toBe("Cabinet Project");

    const quoted = patchJobMeta(clamped, {
      status: "quoted",
      customerName: "Rivera Residence",
      projectNumber: "JOB-214",
    });
    expect(quoted.status).toBe("quoted");
    expect(quoted.quotedAt).toBeTruthy();
    expect(formatJobTitle(quoted)).toBe("JOB-214 · Rivera Residence");
    expect(formatJobSubtitle(quoted)).toContain("Quoted");
  });
});

describe("production packet report", () => {
  it("includes job cover, schedule, runs, and shop refs", () => {
    const lines = createProjectProductionCutlist(project);
    expect(lines[0].shopRef).toMatch(/^C01-P/);
    expect(lines.some((line) => line.shopRef.startsWith("C02-"))).toBe(true);

    const report = createProjectReport(project, room);
    expect(report.job.projectNumber).toBe("JOB-214");
    expect(report.summary.statusLabel).toBe("Quoted");
    expect(report.cabinetSchedule).toHaveLength(2);
    expect(report.cabinetSchedule[0].mark).toBe("C01");
    expect(report.packetSections.length).toBeGreaterThanOrEqual(5);
    expect(report.productionCutlist[0].shopRef).toBeTruthy();
    expect(report.runSummaries.length).toBeGreaterThanOrEqual(0);
  });
});
