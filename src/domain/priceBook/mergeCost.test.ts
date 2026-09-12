import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "../cabinetDimensions";
import { createDefaultJobMeta } from "../jobMeta";
import { createProjectReport } from "../projectReport";
import { DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type { RoomConfig } from "../roomModel";
import {
  clampPriceBook,
  createDefaultPriceBook,
  patchBoardRate,
  patchHardwareRate,
  resolveCommercialInputs,
} from "./index";

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

function sampleProject(overrides: Partial<CabinetProject["preferences"]> = {}): CabinetProject {
  return {
    version: 1,
    cabinets: [
      {
        id: "cab-1",
        name: "Base Cabinet",
        placement: { x: 900, y: 0, z: 300, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("base"),
      },
    ],
    job: createDefaultJobMeta({ customerName: "Shop", projectNumber: "A-1" }),
    preferences: {
      snapSizeMm: 50,
      showGrid: true,
      autoSaveToBrowser: true,
      costing: { ...DEFAULT_COSTING_SETTINGS },
      quote: { ...DEFAULT_QUOTE_SETTINGS },
      ...overrides,
    },
  };
}

describe("price book merge with design cost path", () => {
  it("leaves factory reports unchanged when no book is passed", () => {
    const project = sampleProject();
    const withBook = createProjectReport(project, room);
    const explicit = createProjectReport(project, room, undefined, { priceBook: null });
    expect(withBook.projectCost.grandTotal).toBe(explicit.projectCost.grandTotal);
    expect(withBook.projectCost.settings.labourPercent).toBe(40);
  });

  it("applies book workshop labour % when project costing is factory-default", () => {
    const project = sampleProject();
    const baseline = createProjectReport(project, room);
    const book = clampPriceBook({ labour: { workshopPercent: 45 } });
    const next = createProjectReport(project, room, undefined, { priceBook: book });
    expect(next.projectCost.settings.labourPercent).toBe(45);
    expect(next.projectCost.totalLabour).toBeGreaterThan(baseline.projectCost.totalLabour);
  });

  it("keeps a project-custom labour % instead of the book", () => {
    const project = sampleProject({
      costing: { ...DEFAULT_COSTING_SETTINGS, labourPercent: 20, presetId: "custom" },
    });
    const book = clampPriceBook({ labour: { workshopPercent: 45, workshopAllowance: 900 } });
    const merged = resolveCommercialInputs(project.preferences, book);
    expect(merged.costing.labourPercent).toBe(20);
    expect(merged.costing.labourAllowance).toBe(900);
    const report = createProjectReport(project, room, undefined, { priceBook: book });
    expect(report.projectCost.settings.labourPercent).toBe(20);
    expect(report.projectCost.labourAllowance).toBe(900);
  });

  it("prices boards and hardware from the book through calculateProjectCost", () => {
    const project = sampleProject();
    const baseline = createProjectReport(project, room);
    let book = createDefaultPriceBook();
    const ply18 = book.boards.find((row) => row.materialId === "ply" && row.thicknessMm === 18);
    book = patchBoardRate(book, "ply", 18, (ply18?.costPerM2 ?? 52) * 4);
    book = patchHardwareRate(book, "hinge-soft", 400);
    const next = createProjectReport(project, room, undefined, { priceBook: book });
    expect(next.projectCost.totalMaterial + next.projectCost.totalHardware).toBeGreaterThan(
      baseline.projectCost.totalMaterial + baseline.projectCost.totalHardware,
    );
  });

  it("uses book markup / tax defaults unless the project quote was customized", () => {
    const factory = sampleProject();
    const book = clampPriceBook({
      quoteDefaults: { markupPercent: 25, taxPercent: 12, discountPercent: 0 },
      labour: { quoteAllowance: 500 },
    });
    const fromBook = resolveCommercialInputs(factory.preferences, book);
    expect(fromBook.quote.markupPercent).toBe(25);
    expect(fromBook.quote.taxPercent).toBe(12);
    expect(fromBook.quote.labourAllowance).toBe(500);

    const custom = sampleProject({
      quote: { ...DEFAULT_QUOTE_SETTINGS, markupPercent: 10 },
    });
    const mixed = resolveCommercialInputs(custom.preferences, book);
    expect(mixed.quote.markupPercent).toBe(10);
    expect(mixed.quote.taxPercent).toBe(12);
  });
});
