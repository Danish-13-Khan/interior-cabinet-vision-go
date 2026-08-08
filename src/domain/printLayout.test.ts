import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "./cabinetDimensions";
import {
  A4_PRINT_METRICS,
  PRINTABLE_SHEET_SET,
  buildTitleBlockData,
  collectPrintNoteLines,
  fitDrawingToContent,
  printableSheetIds,
  printChromeSvg,
  renderStandardTitleBlock,
} from "./printLayout";
import { createTechnicalView } from "./technicalViews";
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
  job: {
    customerName: "Acme",
    projectNumber: "P-100",
    revision: "B",
    status: "quoted",
    notes: "Confirm sink cutout; verify filler at left.",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  cabinets: [
    {
      id: "base-1",
      name: "Base",
      placement: { x: 0, y: 0, z: -1500, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    },
  ],
  drafting: {
    notes: [
      {
        id: "n1",
        view: "top",
        text: "Plan clearance OK",
        anchor: { x: 0, y: 0, z: 0 },
      },
    ],
    leaders: [],
  },
};

describe("printLayout", () => {
  it("defines printable multi-sheet set with notes flags", () => {
    expect(printableSheetIds()).toEqual([
      "plan",
      "front",
      "side",
      "section",
      "detail",
      "report",
    ]);
    expect(PRINTABLE_SHEET_SET.find((s) => s.sheetId === "report")?.includeNotesArea).toBe(
      false,
    );
    expect(PRINTABLE_SHEET_SET.find((s) => s.sheetId === "plan")?.includeNotesArea).toBe(
      true,
    );
  });

  it("builds title block data from job meta", () => {
    const data = buildTitleBlockData({
      project,
      sheetTitle: "Room Plan",
      viewLabel: "PLAN",
      scaleText: "1:100",
      sheetCode: "A-101",
    });
    expect(data.revision).toBe("B");
    expect(data.projectNumber).toBe("P-100");
    expect(data.customerName).toBe("Acme");
    expect(data.sheetCode).toBe("A-101");
    expect(data.statusLabel).toBe("Quoted");
  });

  it("renders standard title block cells and notes chrome", () => {
    const data = buildTitleBlockData({
      project,
      sheetTitle: "Room Plan",
      viewLabel: "PLAN",
      scaleText: "1:100",
      sheetCode: "A-101",
    });
    const title = renderStandardTitleBlock(800, data).join("");
    expect(title).toContain("REV B");
    expect(title).toContain("A-101");
    expect(title).toContain("DRN");

    const chrome = printChromeSvg({
      svgWidth: 800,
      svgHeight: 600,
      project,
      options: { mode: "print", projectName: "Acme Job" },
      sheetTitle: "Room Plan",
      viewLabel: "PLAN",
      scaleText: "1:100",
      sheetCode: "A-101",
      noteView: "top",
    }).join("");
    expect(chrome).toContain("twod-notes-area");
    expect(chrome).toContain("twod-info-block");
    expect(chrome).toContain("Plan clearance OK");
  });

  it("collects print notes from drafting and job", () => {
    const lines = collectPrintNoteLines(project.drafting, "top", project.job!.notes);
    expect(lines[0]).toContain("Plan clearance");
    expect(lines.some((line) => line.includes("sink"))).toBe(true);
  });

  it("fits drawings consistently for A4 metrics", () => {
    const fit = fitDrawingToContent(900, 700, A4_PRINT_METRICS.contentWidthMm, A4_PRINT_METRICS.drawingMaxHeightMm);
    expect(fit.drawWidth).toBeLessThanOrEqual(A4_PRINT_METRICS.contentWidthMm + 0.01);
    expect(fit.drawHeight).toBeLessThanOrEqual(A4_PRINT_METRICS.drawingMaxHeightMm + 0.01);
  });

  it("embeds print chrome in printed technical views", () => {
    const plan = createTechnicalView(project, room, "top", [], {
      mode: "print",
      sheetCode: "A-101",
      title: "Room Plan",
      projectName: "Acme Job",
    });
    expect(plan.svg).toContain("twod-titleblock");
    expect(plan.svg).toContain("twod-notes-area");
    expect(plan.svg).toContain("REV B");
    expect(plan.svg).toContain('data-mode="print"');
  });
});
