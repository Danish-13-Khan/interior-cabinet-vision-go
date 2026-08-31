import { describe, expect, it } from "vitest";
import { defaultCabinetProject, getDefaultCabinetConfig } from "./cabinetDimensions";
import { createGoldenCabinetInstance } from "./cabinetIdentity";
import { createCabinetPlanningWorkflow } from "./cabinetRuns";
import { createCabinetConstruction } from "./cabinetConstruction";
import { cabinetProjectFromInteriorProject } from "./interiorProject";
import {
  GOLDEN_RUN_COUNTERTOP_ID,
  GOLDEN_RUN_FILLER_IDS,
  GOLDEN_RUN_OBJECT_IDS,
  createGoldenCabinetRunProject,
} from "./livingRoom/goldenRun";
import { DEFAULT_ROOM } from "./roomModel";
import { exportProjectPdf } from "./pdfExport";
import { verifyProductionPacketPages } from "./pdfExport/packetVerify";
import { createProjectReport } from "./projectReport";
import { ProductionIdentityBlockedError } from "./productionOutputs";
import {
  runCabinetsPdfExport,
  runInteriorsProductionPdfExport,
} from "./productionPdfExport";

function blockedProject() {
  const cabinet = {
    ...createGoldenCabinetInstance("frameless-standard-base"),
    config: {
      ...getDefaultCabinetConfig("base"),
      familyId: "not-a-real-family",
    },
  };
  return { ...defaultCabinetProject, cabinets: [cabinet] };
}

function trackingIo() {
  const prompts: string[] = [];
  const writes: string[] = [];
  const generates: string[] = [];
  return {
    prompts,
    writes,
    generates,
    io: {
      promptPath: async () => {
        prompts.push("prompted");
        return "blocked.pdf";
      },
      writePdf: async (path: string) => {
        writes.push(path);
      },
      generatePdf: async () => {
        generates.push("generated");
        return new Blob(["pdf"]);
      },
    },
  };
}

describe("production packet PDF export gate", () => {
  it("does not prompt or write from the Cabinets PDF entry point when blocked", async () => {
    const project = blockedProject();
    const tracked = trackingIo();
    const result = await runCabinetsPdfExport(project, tracked.io);
    expect(result.prompted).toBe(false);
    expect(result.wrote).toBe(false);
    expect(tracked.prompts).toEqual([]);
    expect(tracked.writes).toEqual([]);
    expect(tracked.generates).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
    expect(result.status).toContain("not-a-real-family");
  });

  it("does not prompt or write from the Interiors Production Packet PDF when blocked", async () => {
    const project = blockedProject();
    const tracked = trackingIo();
    const result = await runInteriorsProductionPdfExport(
      project,
      tracked.io,
      "Production packet exported (0 cut parts).",
    );
    expect(result.prompted).toBe(false);
    expect(result.wrote).toBe(false);
    expect(tracked.prompts).toEqual([]);
    expect(tracked.writes).toEqual([]);
    expect(tracked.generates).toEqual([]);
    expect(result.status).toMatch(/^Production export blocked:/);
  });

  it("throws at the exportProjectPdf boundary when identity is blocked", async () => {
    await expect(
      exportProjectPdf(blockedProject(), null, "Blocked", DEFAULT_ROOM),
    ).rejects.toBeInstanceOf(ProductionIdentityBlockedError);
  });
});

describe("golden run production packet", () => {
  it("exports a packet with ids, construction, hardware, cutlist, and no fallbacks", async () => {
    const document = createGoldenCabinetRunProject();
    const adapted = cabinetProjectFromInteriorProject(document);
    const workflow = createCabinetPlanningWorkflow(adapted.project, {
      widthMm: adapted.room.dimensions.widthMm,
      depthMm: adapted.room.dimensions.depthMm,
      heightMm: adapted.room.dimensions.heightMm,
    });
    const report = createProjectReport(adapted.project, adapted.room, workflow);
    expect(report.productionBlocked).toBe(false);
    expect(report.identityDiagnostics).toEqual([]);
    expect(report.hardwareSchedule.length).toBeGreaterThan(0);
    expect(report.hardwareSchedule.every((row) => row.hardwareId)).toBe(true);
    expect(report.hardwareByCabinet).toHaveLength(report.cabinetSchedule.length);
    expect(report.productionCutlist.length).toBeGreaterThan(0);
    const hostIds = Object.values(GOLDEN_RUN_OBJECT_IDS);
    for (const id of [...hostIds, ...Object.values(GOLDEN_RUN_FILLER_IDS)]) {
      expect(report.cabinetSchedule.some((row) => row.cabinetId === id)).toBe(true);
      expect(report.productionCutlist.some((line) => line.cabinetId === id)).toBe(true);
    }
    for (const row of report.cabinetSchedule) {
      const cabinet = adapted.project.cabinets.find((item) => item.id === row.cabinetId)!;
      expect(createCabinetConstruction(cabinet.config).constructionSpec.carcassStyle).toBe("frameless");
      expect(row.constructionLabel.toLowerCase()).toContain("frameless");
    }
    expect(report.runSummaries.some((run) => run.countertopIds.includes(GOLDEN_RUN_COUNTERTOP_ID))).toBe(true);

    const blob = await exportProjectPdf(
      adapted.project,
      null,
      document.name,
      adapted.room,
      workflow.countertops,
      workflow.runs,
    );
    const visual = await verifyProductionPacketPages(blob, report, [
      GOLDEN_RUN_COUNTERTOP_ID,
      GOLDEN_RUN_FILLER_IDS.start,
      GOLDEN_RUN_FILLER_IDS.end,
      "Frameless",
      "tops 1",
    ]);
    expect(visual.pageCount).toBeGreaterThan(1);
    expect(visual.pages.every((page) => page.nonblank && page.a4 && !page.clipped)).toBe(true);
    expect(visual.pages.every((page) => (page.minFontPt ?? 7) >= 7)).toBe(true);
    expect(
      visual.pages.reduce((sum, page) => sum + page.imagePaintCount, 0),
    ).toBeGreaterThanOrEqual(6);
    expect(visual.missing).toEqual([]);
    expect(visual.ok).toBe(true);
  });
});
