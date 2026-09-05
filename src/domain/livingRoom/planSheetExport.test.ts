import { describe, expect, it } from "vitest";
import { roomPlanViewBounds } from "../interiorProject";
import { createLivingRoomStarterProject } from "./preset";
import { injectExportStyles, PLAN_EXPORT_STYLESHEET } from "./planExportStyles";
import { applyPlanPrintPreset, readPlanPrintSettings } from "./planPrintSettings";
import { patchProposalJob } from "./proposal/commercialState";
import {
  applyPrintLayersToPlanSvg,
  chooseScaleBarLengthMm,
  composePlanSheetSvg,
  embedPlanSvgAsSheetDrawing,
  exportPlanViewBoxForProject,
  formatScaleBarLabel,
  planSheetFileBase,
  planSheetScaleMetrics,
  renderPlanScaleBarSvg,
  renderSalesTitleStripSvg,
  renderTechnicalTitleStripSvg,
  resolvePlanSheetMeta,
} from "./planSheetExport";

describe("planSheetExport", () => {
  it("chooses nice scale bar lengths", () => {
    expect(chooseScaleBarLengthMm(3000)).toBe(500);
    expect(chooseScaleBarLengthMm(12000)).toBe(2500);
    expect(chooseScaleBarLengthMm(40000)).toBe(10000);
    expect(formatScaleBarLabel(1000)).toBe("1 m");
    expect(formatScaleBarLabel(500)).toBe("500 mm");
  });

  it("renders scale bar svg fragment", () => {
    const svg = renderPlanScaleBarSvg({ x: 10, y: 20, lengthPx: 120, lengthMm: 1000 });
    expect(svg).toContain("lr-plan-scale-bar");
    expect(svg).toContain("1 m");
  });

  it("derives meet scale bar geometry from viewBox + drawing viewport", () => {
    const metrics = planSheetScaleMetrics({
      viewBox: { width: 4000, height: 3000 },
      drawingW: 800,
      drawingH: 600,
      roomWidthMm: 5000,
      pageWidthPx: 1684,
      pdfContentWidthMm: 263,
    });
    expect(metrics.meetScale).toBeCloseTo(0.2, 6);
    expect(metrics.scaleLengthMm).toBe(1000);
    expect(metrics.scaleBarPx).toBeCloseTo(200, 6);
    expect(metrics.scaleText).toMatch(/^1:\d+$/);
    expect(metrics.scaleRatio).toBeGreaterThan(1);
    // Not the old 0.35 fudge: roomWidth / (drawingW * 0.35) for 5000/800.
    expect(metrics.scaleRatio).not.toBe(Math.round(5000 / (800 * 0.35)));
  });

  it("merges class attrs when embedding a full plan svg", () => {
    const source =
      `<svg class="lr-plan-svg is-fill-style" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="10" height="10" /></svg>`;
    const embedded = embedPlanSvgAsSheetDrawing(source, { x: 10, y: 20, width: 400, height: 300 });
    const open = embedded.match(/^<svg\b[^>]*>/i)?.[0] ?? "";
    expect((open.match(/\bclass="/g) ?? []).length).toBe(1);
    expect(open).toContain("lr-plan-svg");
    expect(open).toContain("lr-plan-sheet-drawing");
    expect(open).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(open).toContain('viewBox="0 0 100 100"');
    expect(open).toContain('x="10"');
    expect(open).toContain('width="400"');
  });

  it("compose includes title and scale for sales and technical without duplicate class", () => {
    const fixturePlan =
      `<svg class="lr-plan-svg is-fill-style" viewBox="0 0 4000 3000"><rect x="0" y="0" width="100" height="100" /></svg>`;
    const sales = composePlanSheetSvg({
      planSvgInner: applyPrintLayersToPlanSvg(fixturePlan, applyPlanPrintPreset("sales").layers, "0 0 4000 3000"),
      settings: applyPlanPrintPreset("sales"),
      projectName: "Demo Kitchen",
      jobName: "JOB-1",
      dateText: "9/5/2026",
      companyName: "Cabinet Studio",
      roomWidthMm: 3600,
    });
    expect(sales).toContain("lr-plan-sheet");
    expect(sales).toContain("lr-plan-sales-title");
    expect(sales).toContain("Demo Kitchen");
    expect(sales).toContain("lr-plan-scale-bar");
    expect(applyPrintLayersToPlanSvg(fixturePlan, applyPlanPrintPreset("sales").layers)).toContain('data-print-furniture="true"');

    const nestedOpen = sales.match(/<svg\b[^>]*class="[^"]*lr-plan-sheet-drawing[^"]*"[^>]*>/i)?.[0] ?? "";
    expect(nestedOpen).toBeTruthy();
    expect((nestedOpen.match(/\bclass="/g) ?? []).length).toBe(1);
    expect(nestedOpen).toContain("lr-plan-svg");
    expect(nestedOpen).toContain("lr-plan-sheet-drawing");

    const technical = composePlanSheetSvg({
      planSvgInner: applyPrintLayersToPlanSvg(fixturePlan, applyPlanPrintPreset("technical").layers),
      settings: applyPlanPrintPreset("technical"),
      projectName: "Demo Kitchen",
      jobName: "JOB-1",
      dateText: "9/5/2026",
      roomWidthMm: 3600,
    });
    expect(technical).toContain("lr-plan-technical-title");
    expect(applyPrintLayersToPlanSvg(fixturePlan, applyPlanPrintPreset("technical").layers)).toContain('data-print-furniture="false"');
  });

  it("injectExportStyles embeds critical plan CSS", () => {
    const raw = `<svg class="lr-plan-svg" viewBox="0 0 100 100"><rect class="lr-wall-line" /></svg>`;
    const styled = injectExportStyles(raw);
    expect(styled).toContain("<style");
    expect(styled).toContain("lr-plan-export-styles");
    expect(styled).toContain(".lr-opening");
    expect(styled).toContain(".lr-wall-line");
    expect(PLAN_EXPORT_STYLESHEET).toContain(".lr-wall-line");
    expect(PLAN_EXPORT_STYLESHEET).toContain(".lr-plan-dimension-pairs");
    expect(PLAN_EXPORT_STYLESHEET).toContain(".is-driving-dim");
    expect(PLAN_EXPORT_STYLESHEET).toContain(".lr-plan-symbol");
    expect(styled).toContain(".lr-plan-dimension-pairs");
    expect(styled).toContain(".is-driving-dim");
    expect(styled).toContain(".lr-plan-symbol");

    const composed = composePlanSheetSvg({
      planSvgInner: injectExportStyles(raw),
      settings: applyPlanPrintPreset("sales"),
      projectName: "Demo",
      jobName: "JOB",
      dateText: "9/5/2026",
      roomWidthMm: 4000,
    });
    expect(composed).toContain("<style");
    expect(composed).toContain(".lr-opening");
  });

  it("strips interactive chrome from captured svg", () => {
    const dirty = `<svg class="lr-plan-svg" viewBox="1 2 3 4"><g class="lr-snap-guide-group"><line /></g><rect class="lr-resize-handle" /><g class="lr-wall-nodes"><circle class="lr-wall-node-handle" /></g><rect x="0" y="0" width="10" height="10" /></svg>`;
    const cleaned = applyPrintLayersToPlanSvg(dirty, applyPlanPrintPreset("sales").layers, "0 0 1000 800");
    expect(cleaned).toContain("is-print-export");
    expect(cleaned).toContain('viewBox="0 0 1000 800"');
    expect(cleaned).not.toContain("lr-snap-guide-group");
    expect(cleaned).not.toContain("lr-resize-handle");
    expect(cleaned).not.toContain("lr-wall-nodes");
    expect(cleaned).not.toContain("lr-wall-node-handle");
  });

  it("strips wall-node chrome groups from print layers", () => {
    const dirty =
      `<svg class="lr-plan-svg" viewBox="0 0 100 100">` +
      `<g class="lr-wall-nodes"><circle class="lr-wall-node-handle" cx="1" cy="2" r="3" /></g>` +
      `<rect x="0" y="0" width="10" height="10" />` +
      `</svg>`;
    const cleaned = applyPrintLayersToPlanSvg(dirty, applyPlanPrintPreset("technical").layers);
    expect(cleaned).not.toContain('<g class="lr-wall-nodes">');
    expect(cleaned).not.toContain("lr-wall-nodes");
    expect(cleaned).toContain('width="10"');
  });

  it("does not duplicate data-print attrs when re-applied", () => {
    const once = applyPrintLayersToPlanSvg(
      `<svg class="lr-plan-svg" viewBox="0 0 10 10"></svg>`,
      applyPlanPrintPreset("sales").layers,
    );
    const twice = applyPrintLayersToPlanSvg(once, applyPlanPrintPreset("sales").layers);
    expect((twice.match(/data-print-furniture="/g) ?? []).length).toBe(1);
  });

  it("builds file base from project settings", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const base = planSheetFileBase(project, applyPlanPrintPreset("sales"));
    expect(base).toMatch(/floor-plan/);
    expect(base).toMatch(/sales/);
  });

  it("resolvePlanSheetMeta uses canonical commercial job fields", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = patchProposalJob(
      { ...starter, name: "Golden Cabinet Run" },
      { projectNumber: "GCR-001", customerName: "Acme" },
    );
    const settings = readPlanPrintSettings(project);
    expect(settings.jobName).toBeFalsy();
    expect(settings.customerName).toBeFalsy();
    const meta = resolvePlanSheetMeta(project, settings);
    expect(meta.customerName).toBe("Acme");
    expect(meta.projectNumber).toBe("GCR-001");
    expect(meta.jobName).toBe("Golden Cabinet Run"); // not formatJobTitle
    expect(meta.projectName).toBe("Golden Cabinet Run");
    const sales = renderSalesTitleStripSvg({
      x: 0,
      y: 0,
      width: 800,
      height: 64,
      projectName: meta.projectName,
      jobName: meta.jobName,
      dateText: meta.dateText,
      customerName: meta.customerName,
      projectNumber: meta.projectNumber,
      scaleText: "1:50",
    });
    expect(sales).toContain("Acme");
    expect(sales).toContain("GCR-001");
    expect(sales).toContain("Golden Cabinet Run · GCR-001");
    expect(sales).not.toContain("Golden Cabinet Run · GCR-001 · Golden Cabinet Run");
    expect(sales).not.toContain("Golden Cabinet Run · Golden Cabinet Run");
    // Customer only on secondary line once — not also stuffed into jobName.
    expect(meta.jobName).not.toContain("Acme");
  });

  it("resolvePlanSheetMeta avoids duplicated project name when job falls back to name", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = { ...starter, name: "Golden Cabinet Run" };
    const meta = resolvePlanSheetMeta(project, readPlanPrintSettings(project));
    expect(meta.jobName).toBe("Golden Cabinet Run");
    const sales = renderSalesTitleStripSvg({
      x: 0,
      y: 0,
      width: 800,
      height: 64,
      projectName: meta.projectName,
      jobName: meta.jobName,
      dateText: meta.dateText,
      projectNumber: meta.projectNumber,
      scaleText: "1:50",
    });
    expect(sales).toContain("Golden Cabinet Run");
    expect(sales).not.toContain("Golden Cabinet Run · Golden Cabinet Run");
  });


  it("sales/technical titles keep explicit jobName alongside projectNumber", () => {
    const sales = renderSalesTitleStripSvg({
      x: 0, y: 0, width: 800, height: 64,
      projectName: "Golden Cabinet Run",
      jobName: "Rivera Kitchen",
      dateText: "9/5/2026",
      customerName: "Acme",
      projectNumber: "GCR-001",
      scaleText: "1:50",
    });
    expect(sales).toContain("Golden Cabinet Run · GCR-001 · Rivera Kitchen");
    expect(sales).toContain("Acme");
    const tech = renderTechnicalTitleStripSvg({
      x: 0, y: 0, width: 800, height: 72,
      projectName: "Golden Cabinet Run",
      jobName: "Rivera Kitchen",
      dateText: "9/5/2026",
      customerName: "Acme",
      projectNumber: "GCR-001",
      scaleText: "1:50",
    });
    expect(tech).toContain("GCR-001 · Rivera Kitchen · Floor plan");
  });

  it("planSheetFileBase prefers canonical projectNumber", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = patchProposalJob(
      { ...starter, name: "Golden Cabinet Run" },
      { projectNumber: "GCR-001", customerName: "Acme" },
    );
    const base = planSheetFileBase(project, applyPlanPrintPreset("sales"));
    expect(base).toMatch(/^gcr-001-sales-floor-plan$/);
  });

  it("sales title keeps customer separate when customer equals project name", () => {
    const starter = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const project = patchProposalJob(
      { ...starter, name: "Golden Cabinet Run" },
      { projectNumber: "GCR-001", customerName: "Golden Cabinet Run" },
    );
    const meta = resolvePlanSheetMeta(project, readPlanPrintSettings(project));
    expect(meta.jobName).toBe("Golden Cabinet Run");
    expect(meta.projectNumber).toBe("GCR-001");
    expect(meta.customerName).toBe("Golden Cabinet Run");
    const sales = renderSalesTitleStripSvg({
      x: 0,
      y: 0,
      width: 800,
      height: 64,
      projectName: meta.projectName,
      jobName: meta.jobName,
      dateText: meta.dateText,
      customerName: meta.customerName,
      projectNumber: meta.projectNumber,
      scaleText: "1:50",
    });
    expect(sales).toContain("Golden Cabinet Run · GCR-001");
    expect(sales).not.toMatch(/Golden Cabinet Run · GCR-001 · Golden Cabinet Run/);
  });

  it("exportPlanViewBoxForProject pads enough for outer dimensions", () => {
    const project = createLivingRoomStarterProject({ now: "2026-09-05T00:00:00.000Z" });
    const bounds = roomPlanViewBounds(project, project.activeRoomId);
    const viewBox = exportPlanViewBoxForProject(project, 1200, 800);
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    const vbW = parts[2]!;
    const vbH = parts[3]!;
    expect(vbW).toBeGreaterThanOrEqual(bounds.widthMm + 1000);
    expect(vbH).toBeGreaterThanOrEqual(bounds.depthMm + 1000);
  });
});
