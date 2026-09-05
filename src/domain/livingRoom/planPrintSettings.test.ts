import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "./preset";
import {
  applyPlanPrintPreset,
  applyPlanPrintPresetToProject,
  readPlanPrintSettings,
  setPlanPrintSettings,
  SALES_PLAN_PRINT_LAYERS,
  TECHNICAL_PLAN_PRINT_LAYERS,
} from "./planPrintSettings";

describe("planPrintSettings", () => {
  it("applies sales and technical presets", () => {
    expect(applyPlanPrintPreset("sales").layers).toEqual(SALES_PLAN_PRINT_LAYERS);
    expect(applyPlanPrintPreset("technical").layers).toEqual(TECHNICAL_PLAN_PRINT_LAYERS);
    expect(applyPlanPrintPreset("sales").layers.furniture).toBe(true);
    expect(applyPlanPrintPreset("technical").layers.furniture).toBe(false);
    expect(applyPlanPrintPreset("technical").layers.referenceDims).toBe(true);
    expect(applyPlanPrintPreset("sales").layers.grid).toBe(false);
  });

  it("reads and writes planPrint extension round-trip", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    expect(readPlanPrintSettings(source).audience).toBe("sales");
    const patched = setPlanPrintSettings(source, {
      audience: "technical",
      layers: { marks: false, grid: true },
      companyName: "Cabinet Studio",
      jobName: "Rivera Kitchen",
      customerName: "Rivera",
      logoDataUrl: "data:image/png;base64,abc",
    });
    const read = readPlanPrintSettings(patched);
    expect(read.audience).toBe("technical");
    expect(read.layers.marks).toBe(false);
    expect(read.layers.grid).toBe(true);
    expect(read.layers.cabinets).toBe(true);
    expect(read.companyName).toBe("Cabinet Studio");
    expect(read.jobName).toBe("Rivera Kitchen");
    expect(read.logoDataUrl).toBe("data:image/png;base64,abc");
  });

  it("applyPlanPrintPresetToProject preserves branding fields", () => {
    const source = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const branded = setPlanPrintSettings(source, {
      companyName: "Acme Interiors",
      logoDataUrl: "data:image/png;base64,logo",
    });
    const technical = applyPlanPrintPresetToProject(branded, "technical");
    const read = readPlanPrintSettings(technical);
    expect(read.audience).toBe("technical");
    expect(read.layers.furniture).toBe(false);
    expect(read.companyName).toBe("Acme Interiors");
    expect(read.logoDataUrl).toBe("data:image/png;base64,logo");
  });
});
