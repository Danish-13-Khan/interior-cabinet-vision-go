import { describe, expect, it } from "vitest";
import {
  buildProductionOutputsPackage,
  productionPackageSlug,
  serializeProductionOutputsPackage,
} from "./productionOutputsPackage";
import type { ProjectReport } from "./projectReport";

function report(): ProjectReport {
  return {
    jobTitle: "TV wall",
    summary: {
      projectNumber: "JOB-001",
      customerName: "David",
      revision: "A",
      cabinetCount: 1,
      roomSizeLabel: "4200 × 3600",
    },
    job: { status: "approved" },
    productionCutlist: [],
    materialSummary: [{ material: "Plywood", thicknessMm: 18, totalAreaM2: 1.2, estimatedBoards: 1, lineCount: 4 }],
    sheetYield: { groups: [], overallYieldPercent: 0, totalSheets: 0, totalPartAreaM2: 0, totalWasteAreaM2: 0, totalOffcutAreaM2: 0, reclaimableOffcutAreaM2: 0, sheet: { label: "2440x1220" }, usableLengthMm: 2400, usableWidthMm: 1200 },
    hardwareSchedule: [],
    projectCost: {
      cabinets: [{ cabinetName: "TV Cabinet", materialCost: 10, wasteCost: 1, finishCost: 2, hardwareCost: 3, labourCost: 4, totalCost: 20 }],
      totalMaterial: 10,
      totalWaste: 1,
      totalFinish: 2,
      totalHardware: 3,
      totalLabour: 4,
      grandTotal: 20,
    },
    quote: { estimateLines: [], sellTotal: 20, job: { revision: "A" }, workshopSubtotal: 20 },
  } as unknown as ProjectReport;
}

describe("productionOutputsPackage", () => {
  it("names the package from client, job, and revision", () => {
    expect(productionPackageSlug(report())).toBe("job-001-david-rev-a");
  });

  it("includes every production tab plus client details", () => {
    const files = buildProductionOutputsPackage(report(), null);
    expect(files.map((file) => file.name)).toEqual([
      "job-001-david-rev-a-00-client.csv",
      "job-001-david-rev-a-01-materials.csv",
      "job-001-david-rev-a-02-nesting.csv",
      "job-001-david-rev-a-03-hardware.csv",
      "job-001-david-rev-a-04-cutlist.csv",
      "job-001-david-rev-a-05-machining.csv",
      "job-001-david-rev-a-06-costing.csv",
      "job-001-david-rev-a-07-quote.csv",
    ]);
    const joined = serializeProductionOutputsPackage(files);
    expect(joined).toContain("David");
    expect(joined).toContain("Plywood");
    expect(joined).toContain("TV Cabinet");
  });
});
