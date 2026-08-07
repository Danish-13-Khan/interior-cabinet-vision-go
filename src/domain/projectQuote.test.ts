import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import { createDefaultJobMeta } from "./jobMeta";
import { createProjectReport } from "./projectReport";
import {
  buildProjectQuote,
  createQuoteSnapshotFromQuote,
  csvFromProjectQuote,
} from "./projectQuote";
import { clampQuoteSettings, DEFAULT_QUOTE_SETTINGS } from "./quoteSettings";
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
      config: {
        ...getDefaultCabinetConfig("base"),
        buildRules: {
          finishId: "wood-walnut",
        },
      },
    },
    {
      id: "cab-2",
      name: "Wall Cabinet",
      placement: { x: 900, y: 1500, z: -1700, rotation: 0, attachment: "back-wall" },
      config: getDefaultCabinetConfig("wall"),
    },
  ],
  job: createDefaultJobMeta({
    customerName: "Rivera Residence",
    projectNumber: "JOB-317",
    revision: "B",
    status: "quoted",
  }),
  preferences: {
    snapSizeMm: 50,
    showGrid: true,
    autoSaveToBrowser: true,
    quote: {
      ...DEFAULT_QUOTE_SETTINGS,
      markupPercent: 20,
      taxPercent: 18,
      discountPercent: 5,
      finishPremiumPercent: 15,
      labourAllowance: 1000,
    },
  },
};

describe("quote + estimating", () => {
  it("clamps commercial quote settings", () => {
    const clamped = clampQuoteSettings({
      markupPercent: 500,
      taxPercent: -2,
      validityDays: 0,
      inclusions: "  Included  ",
    });
    expect(clamped.markupPercent).toBe(100);
    expect(clamped.taxPercent).toBe(0);
    expect(clamped.validityDays).toBe(1);
    expect(clamped.inclusions).toBe("Included");
  });

  it("builds itemized quote with markup, tax, and finish premium", () => {
    const report = createProjectReport(project, room);
    expect(report.quote.cabinetLines).toHaveLength(2);
    expect(report.quote.workshopSubtotal).toBe(report.projectCost.grandTotal);
    expect(report.quote.finishPremiumTotal).toBeGreaterThan(0);
    expect(report.quote.markupAmount).toBeGreaterThan(0);
    expect(report.quote.taxAmount).toBeGreaterThan(0);
    expect(report.quote.sellTotal).toBeGreaterThan(report.quote.workshopSubtotal);
    expect(report.quote.estimateLines.some((line) => line.kind === "cabinet")).toBe(true);
    expect(
      report.quote.estimateLines.reduce((sum, line) => sum + line.amount, 0),
    ).toBe(report.quote.sellTotal);
    expect(report.packetSections.some((section) => section.id === "quote")).toBe(true);
  });

  it("creates revision-aware snapshots and CSV", () => {
    const report = createProjectReport(project, room);
    const snapshot = createQuoteSnapshotFromQuote(report.quote);
    expect(snapshot.revision).toBe("B");
    expect(snapshot.sellTotal).toBe(report.quote.sellTotal);
    expect(snapshot.summaryLines.length).toBeGreaterThan(0);

    const csv = csvFromProjectQuote(report.quote);
    expect(csv).toContain("Quote total");
    expect(csv).toContain("cabinet");
  });

  it("applies finish rate and labour allowance in workshop costing", () => {
    const report = createProjectReport(
      {
        ...project,
        preferences: {
          snapSizeMm: 50,
          showGrid: true,
          autoSaveToBrowser: true,
          costing: {
            presetId: "custom",
            wastePercent: 10,
            labourPercent: 40,
            hardwareAllowance: 500,
            labourAllowance: 750,
            materialRateMultiplier: 1,
            finishRateMultiplier: 1.5,
            hingeId: "hinge-soft",
            drawerSlideId: "drawer-slide-soft",
            handleId: "handle-bar",
          },
        },
      },
      room,
    );
    expect(report.projectCost.labourAllowance).toBe(750);
    expect(report.projectCost.hardwareAllowance).toBe(500);
    expect(report.projectCost.totalFinish).toBeGreaterThan(0);
    expect(report.projectCost.grandTotal).toBe(
      report.projectCost.totalMaterial +
        report.projectCost.totalHardware +
        report.projectCost.totalLabour +
        report.projectCost.hardwareAllowance +
        report.projectCost.labourAllowance,
    );

    const quote = buildProjectQuote(
      report.projectCost,
      report.quote.settings,
      report.job,
    );
    expect(quote.sellTotal).toBeGreaterThan(0);
  });
});
