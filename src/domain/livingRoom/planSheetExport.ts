import { jsPDF } from "jspdf";
import type { InteriorProject } from "../interiorProject";
import { roomPlanViewBounds } from "../interiorProject";
import { A4_PRINT_METRICS, fitDrawingToContent } from "../printLayout";
import { escapeXml, line, rect, text } from "../technicalViews/svgPrimitives";
import { svgToPngDataUrl } from "../technicalViews";
import { injectExportStyles } from "./planExportStyles";
import {
  readPlanPrintSettings,
  type PlanPrintLayers,
  type PlanPrintSettings,
} from "./planPrintSettings";
import {
  fitPlanViewToBounds,
  PLAN_VIEW_DEFAULT_MARGIN_MM,
  planViewBoxString,
} from "./planViewTransform";
import { readProposalCommercial } from "./proposal/commercialState";

const SCALE_CANDIDATES_MM = [500, 1000, 2000, 2500, 5000, 10000] as const;

/** Margin so overall dims / wall labels / symbols are not clipped in export viewBox. */
export const EXPORT_PLAN_MARGIN_MM = PLAN_VIEW_DEFAULT_MARGIN_MM;

export type PlanSheetPageSize = {
  widthPx: number;
  heightPx: number;
  marginPx: number;
};

export const PLAN_SHEET_A4_LANDSCAPE_PX: PlanSheetPageSize = {
  widthPx: 1684,
  heightPx: 1190,
  marginPx: 48,
};

/** Nice round scale-bar length relative to room width. */
export function chooseScaleBarLengthMm(roomWidthMm: number): number {
  const target = Math.max(500, roomWidthMm * 0.2);
  let best: number = SCALE_CANDIDATES_MM[0];
  let bestDelta = Math.abs(best - target);
  for (const candidate of SCALE_CANDIDATES_MM) {
    const delta = Math.abs(candidate - target);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

export function formatScaleBarLabel(lengthMm: number): string {
  if (lengthMm >= 1000 && lengthMm % 1000 === 0) return `${lengthMm / 1000} m`;
  return `${Math.round(lengthMm)} mm`;
}

/**
 * Derive scale bar + architectural 1:N text from the meet letterbox transform
 * (sheet-px per world-mm) and optional PDF placement size.
 */
export function planSheetScaleMetrics(args: {
  viewBox: { width: number; height: number };
  drawingW: number;
  drawingH: number;
  roomWidthMm: number;
  pageWidthPx: number;
  /** Actual PDF addImage draw width in mm (preferred) for printed 1:N. */
  pdfContentWidthMm?: number;
}): {
  meetScale: number;
  scaleLengthMm: number;
  scaleBarPx: number;
  scaleRatio: number;
  scaleText: string;
} {
  const vbW = Math.max(1e-9, args.viewBox.width);
  const vbH = Math.max(1e-9, args.viewBox.height);
  const drawingW = Math.max(1, args.drawingW);
  const drawingH = Math.max(1, args.drawingH);
  // Same meet math as clientToPlanPoint (min ratio), inverse of cover max used by planViewWorldPerPx.
  const meetScale = Math.min(drawingW / vbW, drawingH / vbH);
  const worldPerSheetPx = 1 / meetScale;

  const maxBarPx = Math.max(40, Math.min(drawingW * 0.4, 320));
  let scaleLengthMm = chooseScaleBarLengthMm(args.roomWidthMm);
  let scaleBarPx = scaleLengthMm * meetScale;

  if (scaleBarPx > maxBarPx + 1e-6) {
    const fitting = SCALE_CANDIDATES_MM.filter((c) => c * meetScale <= maxBarPx)
      .slice()
      .sort((a, b) => b - a);
    if (fitting.length > 0) {
      scaleLengthMm = fitting[0]!;
      scaleBarPx = scaleLengthMm * meetScale;
    } else {
      scaleBarPx = maxBarPx;
      scaleLengthMm = Math.max(1, Math.round(maxBarPx / meetScale));
    }
  }

  const pdfDrawWidthMm = args.pdfContentWidthMm;
  const worldPerPrintedMm =
    pdfDrawWidthMm != null && pdfDrawWidthMm > 0
      ? worldPerSheetPx * Math.max(1, args.pageWidthPx) / pdfDrawWidthMm
      : worldPerSheetPx;

  const scaleRatio = Math.max(1, Math.round(worldPerPrintedMm));
  return {
    meetScale,
    scaleLengthMm,
    scaleBarPx,
    scaleRatio,
    scaleText: `1:${scaleRatio}`,
  };
}

/** Embed a captured plan `<svg>` into the sheet with a single merged `class` attr. */
export function embedPlanSvgAsSheetDrawing(
  source: string,
  opts: { x: number; y: number; width: number; height: number },
): string {
  const trimmed = source.trim();
  const isFullSvg = /^<svg\b/i.test(trimmed);
  if (!isFullSvg) {
    const viewBoxMatch = trimmed.match(/\sviewBox="([^"]+)"/);
    const planViewBox = viewBoxMatch?.[1] ?? "0 0 1000 800";
    return (
      `<svg x="${opts.x}" y="${opts.y}" width="${opts.width}" height="${opts.height}" ` +
      `viewBox="${planViewBox}" preserveAspectRatio="xMidYMid meet" class="lr-plan-sheet-drawing">` +
      `${trimmed}</svg>`
    );
  }

  const openMatch = trimmed.match(/^<svg\b([^>]*)>/i);
  if (!openMatch) return trimmed;
  const originalAttrs = openMatch[1] ?? "";
  const body = trimmed.slice(openMatch[0].length);

  const classMatch =
    originalAttrs.match(/\sclass="([^"]*)"/i) ??
    originalAttrs.match(/\sclass='([^']*)'/i);
  const existingClass = classMatch?.[1] ?? "";
  const classTokens = `${existingClass} lr-plan-sheet-drawing`
    .split(/\s+/)
    .filter(Boolean);
  const mergedClass = [...new Set(classTokens)].join(" ");

  let attrs = originalAttrs
    .replace(/\s(x|y|width|height|preserveAspectRatio|class)="[^"]*"/gi, "")
    .replace(/\s(x|y|width|height|preserveAspectRatio|class)='[^']*'/gi, "")
    .trim();

  const forced = [
    `x="${opts.x}"`,
    `y="${opts.y}"`,
    `width="${opts.width}"`,
    `height="${opts.height}"`,
    `preserveAspectRatio="xMidYMid meet"`,
    `class="${mergedClass}"`,
  ].join(" ");

  const open = attrs ? `<svg ${forced} ${attrs}>` : `<svg ${forced}>`;
  return `${open}${body}`;
}

/** Default PDF draw width (mm) for the sheet raster on A4, matching exportPlanSheetPdf. */
/** PDF draw width (mm) for landscape A4 placement of the landscape sheet raster. */
export function defaultPlanSheetPdfDrawWidthMm(
  pageWidthPx: number = PLAN_SHEET_A4_LANDSCAPE_PX.widthPx,
  pageHeightPx: number = PLAN_SHEET_A4_LANDSCAPE_PX.heightPx,
): number {
  // jsPDF landscape A4: width = pageHeightMm (297), height = pageWidthMm (210)
  const pageWidthMm = A4_PRINT_METRICS.pageHeightMm;
  const pageHeightMm = A4_PRINT_METRICS.pageWidthMm;
  const margin = A4_PRINT_METRICS.marginMm;
  const contentWidth = pageWidthMm - margin * 2;
  const contentHeight = pageHeightMm - margin * 2;
  return fitDrawingToContent(pageWidthPx, pageHeightPx, contentWidth, contentHeight).drawWidth;
}


export function renderPlanScaleBarSvg(args: {
  x: number;
  y: number;
  lengthPx: number;
  lengthMm: number;
  label?: string;
}): string {
  const label = args.label ?? formatScaleBarLabel(args.lengthMm);
  const h = 10;
  const mid = args.x + args.lengthPx / 2;
  return [
    `<g class="lr-plan-scale-bar" data-testid="lr-plan-scale-bar">`,
    rect(args.x, args.y, args.lengthPx, h, `fill="#0f172a" stroke="#0f172a" stroke-width="1"`),
    rect(args.x, args.y, args.lengthPx / 2, h, `fill="#ffffff" stroke="#0f172a" stroke-width="1"`),
    line(args.x, args.y + h + 2, args.x, args.y + h + 10, `stroke="#0f172a" stroke-width="1.5"`),
    line(args.x + args.lengthPx, args.y + h + 2, args.x + args.lengthPx, args.y + h + 10, `stroke="#0f172a" stroke-width="1.5"`),
    text(mid, args.y + h + 22, label, `font-size="14" text-anchor="middle" fill="#0f172a" font-family="system-ui,sans-serif"`),
    `</g>`,
  ].join("");
}

export function renderSalesTitleStripSvg(args: {
  x: number;
  y: number;
  width: number;
  height: number;
  projectName: string;
  jobName: string;
  dateText: string;
  companyName?: string;
  customerName?: string;
  projectNumber?: string;
  scaleText: string;
}): string {
  // Line 1: project name · project number · optional distinct job name (customer on line 2).
  const titleParts: string[] = [];
  if (args.projectName) titleParts.push(args.projectName);
  if (args.projectNumber && args.projectNumber !== args.projectName) {
    titleParts.push(args.projectNumber);
  }
  // Explicit print jobName is a separate field — keep it even when a project number exists.
  if (
    args.jobName
    && args.jobName !== args.projectName
    && args.jobName !== args.customerName
    && args.jobName !== args.projectNumber
  ) {
    titleParts.push(args.jobName);
  }
  const line1 = titleParts.join(" · ");
  const line2 = [
    args.companyName,
    args.customerName,
    args.dateText,
    `Scale ${args.scaleText}`,
  ].filter(Boolean).join(" · ");
  return [
    `<g class="lr-plan-sales-title" data-testid="lr-plan-sales-title">`,
    rect(args.x, args.y, args.width, args.height, `fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"`),
    text(args.x + 16, args.y + 28, line1.slice(0, 72), `font-size="20" font-weight="600" fill="#0f172a" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(args.x + 16, args.y + 52, line2.slice(0, 96), `font-size="13" fill="#475569" font-family="system-ui,sans-serif" text-anchor="start"`),
    `</g>`,
  ].join("");
}

export function renderTechnicalTitleStripSvg(args: {
  x: number;
  y: number;
  width: number;
  height: number;
  projectName: string;
  jobName: string;
  dateText: string;
  companyName?: string;
  customerName?: string;
  projectNumber?: string;
  scaleText: string;
  sheetCode?: string;
}): string {
  const mid = args.x + args.width * 0.55;
  const right = args.x + args.width * 0.78;
  // projectNumber and explicit jobName are separate; both may appear.
  const jobBits: string[] = [];
  if (args.projectNumber) jobBits.push(args.projectNumber);
  if (
    args.jobName
    && args.jobName !== args.projectName
    && args.jobName !== args.customerName
    && args.jobName !== args.projectNumber
  ) {
    jobBits.push(args.jobName);
  }
  const jobLine = jobBits.length ? `${jobBits.join(" · ")} · Floor plan` : "Floor plan";
  return [
    `<g class="lr-plan-technical-title" data-testid="lr-plan-technical-title">`,
    rect(args.x, args.y, args.width, args.height, `fill="#ffffff" stroke="#334155" stroke-width="1.5"`),
    line(mid, args.y, mid, args.y + args.height, `stroke="#334155" stroke-width="1"`),
    line(right, args.y, right, args.y + args.height, `stroke="#334155" stroke-width="1"`),
    text(args.x + 12, args.y + 22, args.projectName.slice(0, 40), `font-size="16" font-weight="600" fill="#0f172a" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(args.x + 12, args.y + 42, jobLine.slice(0, 48), `font-size="12" fill="#475569" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(args.x + 12, args.y + 58, [args.customerName, args.companyName].filter(Boolean).join(" · ").slice(0, 48) || "—", `font-size="11" fill="#64748b" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(mid + 10, args.y + 24, "PLAN", `font-size="14" font-weight="600" fill="#0f172a" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(mid + 10, args.y + 44, `SCALE ${args.scaleText}`, `font-size="12" fill="#475569" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(mid + 10, args.y + 58, args.dateText, `font-size="11" fill="#64748b" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(right + 10, args.y + 28, args.sheetCode ?? "FP-01", `font-size="14" font-weight="600" fill="#0f172a" font-family="system-ui,sans-serif" text-anchor="start"`),
    text(right + 10, args.y + 48, "SHEET", `font-size="11" fill="#64748b" font-family="system-ui,sans-serif" text-anchor="start"`),
    `</g>`,
  ].join("");
}

export function resolvePlanSheetMeta(project: InteriorProject, settings: PlanPrintSettings) {
  const commercial = readProposalCommercial(project);
  const job = commercial.job;
  const projectName = project.name?.trim() || "Interior plan";
  // Separate fields only — never formatJobTitle (number · customer).
  const jobName = (settings.jobName?.trim() || projectName || "Floor plan").trim();
  const companyName = settings.companyName?.trim() || undefined;
  const customerName = settings.customerName?.trim() || job.customerName.trim() || undefined;
  const projectNumber = job.projectNumber.trim() || undefined;
  const dateText = new Date(project.updatedAt || Date.now()).toLocaleDateString();
  return { jobName, projectName, companyName, customerName, projectNumber, dateText };
}

export function exportPlanViewBoxForProject(project: InteriorProject, cssWidth = 1200, cssHeight = 800): string {
  const bounds = roomPlanViewBounds(project, project.activeRoomId);
  const view = fitPlanViewToBounds(bounds, cssWidth, cssHeight, EXPORT_PLAN_MARGIN_MM);
  return planViewBoxString(view);
}

/** Apply print-layer flags + strip interactive chrome from a captured plan SVG string. */
export function applyPrintLayersToPlanSvg(
  planSvg: string,
  layers: PlanPrintLayers,
  viewBox?: string,
): string {
  let svg = planSvg;
  if (!svg.includes("is-print-export")) {
    svg = svg.replace(
      /class="([^"]*\blr-plan-svg\b[^"]*)"/,
      (_match, classes: string) => `class="${classes} is-print-export"`,
    );
  }
  const attrs = [
    `data-print-furniture="${layers.furniture}"`,
    `data-print-cabinets="${layers.cabinets}"`,
    `data-print-openings="${layers.openings}"`,
    `data-print-dims="${layers.dims}"`,
    `data-print-reference-dims="${layers.referenceDims}"`,
    `data-print-marks="${layers.marks}"`,
    `data-print-labels="${layers.labels}"`,
    `data-print-grid="${layers.grid}"`,
    `data-print-underlay="${layers.underlay}"`,
  ].join(" ");
  // Strip any prior data-print-* so re-applying (e.g. after captureLivePlanSvg) stays well-formed.
  svg = svg.replace(/\sdata-print-[a-z-]+="[^"]*"/g, "");
  svg = svg.replace(/<svg\b/, `<svg ${attrs}`);
  if (viewBox) {
    if (/\sviewBox="[^"]*"/.test(svg)) {
      svg = svg.replace(/\sviewBox="[^"]*"/, ` viewBox="${viewBox}"`);
    } else {
      svg = svg.replace(/<svg\b/, `<svg viewBox="${viewBox}"`);
    }
  }
  const chromeSelectors = [
    /<g[^>]*class="[^"]*\blr-snap-guide-group\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<g[^>]*class="[^"]*\blr-free-wall-segments\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<rect[^>]*class="[^"]*\blr-plan-marquee\b[^"]*"[^/]*\/>/g,
    /<rect[^>]*class="[^"]*\blr-resize-handle\b[^"]*"[^/]*\/>/g,
    /<circle[^>]*class="[^"]*\blr-opening-width-handle\b[^"]*"[^/]*\/>/g,
    /<g[^>]*class="[^"]*\blr-object-warning\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<foreignObject[\s\S]*?<\/foreignObject>/g,
    /<g[^>]*class="[^"]*\blr-measure-overlay\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<g[^>]*class="[^"]*\blr-wall-nodes\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<circle[^>]*class="[^"]*\blr-wall-node-handle\b[^"]*"[^/]*\/>/g,
    /<g[^>]*class="[^"]*\blr-wall-translate-preview\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
    /<g[^>]*class="[^"]*\blr-draft-guide\b[^"]*"[^>]*>[\s\S]*?<\/g>/g,
  ];
  for (const pattern of chromeSelectors) {
    svg = svg.replace(pattern, "");
  }
  if (!layers.furniture) {
    svg = svg.replace(/<g[^>]*data-print-role="furniture"[^>]*>[\s\S]*?<\/g>/g, "");
  }
  if (!layers.cabinets) {
    svg = svg.replace(/<g[^>]*data-print-role="cabinet"[^>]*>[\s\S]*?<\/g>/g, "");
  }
  if (!layers.openings) {
    svg = svg.replace(/<g[^>]*class="[^"]*\blr-plan-openings-layer\b[^"]*"[^>]*>[\s\S]*?<\/g>/g, "");
  }
  if (!layers.dims) {
    svg = svg.replace(/<g[^>]*class="[^"]*\blr-plan-dimension-pairs\b[^"]*"[^>]*>[\s\S]*?<\/g>/g, "");
    svg = svg.replace(/<g[^>]*class="[^"]*\blr-wall-length-labels\b[^"]*"[^>]*>[\s\S]*?<\/g>/g, "");
  }
  if (!layers.referenceDims) {
    svg = svg.replace(/<g[^>]*class="[^"]*\blr-reference-dimensions\b[^"]*"[^>]*>[\s\S]*?<\/g>/g, "");
  }
  if (!layers.marks) {
    svg = svg.replace(/<tspan[^>]*class="[^"]*\blr-plan-mark\b[^"]*"[^>]*>[\s\S]*?<\/tspan>/g, "");
  }
  if (!layers.labels) {
    svg = svg.replace(/<text[^>]*class="[^"]*\blr-object-label\b[^"]*"[^>]*>[\s\S]*?<\/text>/g, "");
  }
  if (!layers.grid) {
    svg = svg.replace(/<rect[^>]*class="[^"]*\blr-plan-grid\b[^"]*"[^/]*\/>/g, "");
  }
  if (!layers.underlay) {
    svg = svg.replace(/<image[^>]*class="[^"]*\blr-plan-underlay-image\b[^"]*"[^/]*\/>/g, "");
  }
  return svg;
}

export function composePlanSheetSvg(args: {
  planSvgInner: string;
  settings: PlanPrintSettings;
  projectName: string;
  jobName: string;
  dateText: string;
  companyName?: string;
  customerName?: string;
  projectNumber?: string;
  roomWidthMm: number;
  pageSize?: PlanSheetPageSize;
  logoDataUrl?: string | null;
}): string {
  const page = args.pageSize ?? PLAN_SHEET_A4_LANDSCAPE_PX;
  const margin = page.marginPx;
  const titleH = args.settings.audience === "technical" ? 72 : 64;
  const drawingTop = margin + titleH + 16;
  const drawingBottomReserve = 56;
  const drawingH = page.heightPx - drawingTop - margin - drawingBottomReserve;
  const drawingW = page.widthPx - margin * 2;

  const source = args.planSvgInner.trim();
  const viewBoxMatch = source.match(/\sviewBox="([^"]+)"/);
  const planViewBox = viewBoxMatch?.[1] ?? "0 0 1000 800";
  const vbParts = planViewBox.trim().split(/[\s,]+/).map(Number);
  const vbW = Number.isFinite(vbParts[2]) && vbParts[2]! > 0 ? vbParts[2]! : 1000;
  const vbH = Number.isFinite(vbParts[3]) && vbParts[3]! > 0 ? vbParts[3]! : 800;

  const pdfDrawWidthMm = defaultPlanSheetPdfDrawWidthMm(page.widthPx, page.heightPx);
  const scaleMetrics = planSheetScaleMetrics({
    viewBox: { width: vbW, height: vbH },
    drawingW,
    drawingH,
    roomWidthMm: args.roomWidthMm,
    pageWidthPx: page.widthPx,
    pdfContentWidthMm: pdfDrawWidthMm,
  });
  const { scaleLengthMm, scaleBarPx, scaleText } = scaleMetrics;
  const titleWidth = drawingW - (args.logoDataUrl ? 120 : 0);

  const titleArgs = {
    x: margin,
    y: margin,
    width: titleWidth,
    height: titleH,
    projectName: args.projectName,
    jobName: args.jobName,
    dateText: args.dateText,
    companyName: args.companyName,
    customerName: args.customerName,
    projectNumber: args.projectNumber,
    scaleText,
  };
  const title = args.settings.audience === "technical"
    ? renderTechnicalTitleStripSvg(titleArgs)
    : renderSalesTitleStripSvg(titleArgs);

  const logo = args.logoDataUrl
    ? `<image href="${escapeXml(args.logoDataUrl)}" x="${page.widthPx - margin - 100}" y="${margin + 4}" width="96" height="56" preserveAspectRatio="xMidYMid meet" class="lr-plan-sheet-logo" />`
    : "";

  const scaleBar = renderPlanScaleBarSvg({
    x: margin,
    y: page.heightPx - margin - 36,
    lengthPx: scaleBarPx,
    lengthMm: scaleLengthMm,
  });

  const planBlock = embedPlanSvgAsSheetDrawing(source, {
    x: margin,
    y: drawingTop,
    width: drawingW,
    height: drawingH,
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${page.widthPx}" height="${page.heightPx}" viewBox="0 0 ${page.widthPx} ${page.heightPx}" class="lr-plan-sheet" data-testid="lr-plan-sheet">`,
    rect(0, 0, page.widthPx, page.heightPx, `fill="#ffffff"`),
    title,
    logo,
    planBlock,
    scaleBar,
    `</svg>`,
  ].join("");
}

export async function exportPlanSheetPng(svg: string): Promise<string> {
  return svgToPngDataUrl(svg);
}

export function planSheetFileBase(project: InteriorProject, settings: PlanPrintSettings): string {
  const meta = resolvePlanSheetMeta(project, settings);
  // Prefer canonical project number so similarly named projects do not collide.
  const identity = meta.projectNumber || meta.jobName || meta.projectName || "floor-plan";
  const raw = `${identity}-${settings.audience}-floor-plan`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return raw || "floor-plan";
}

function buildSheetSvg(
  project: InteriorProject,
  planSvg: string,
  settings: PlanPrintSettings,
): string {
  const meta = resolvePlanSheetMeta(project, settings);
  const bounds = roomPlanViewBounds(project, project.activeRoomId);
  const viewBox = exportPlanViewBoxForProject(project);
  const preparedPlan = injectExportStyles(
    applyPrintLayersToPlanSvg(planSvg, settings.layers, viewBox),
  );
  const sheet = composePlanSheetSvg({
    planSvgInner: preparedPlan,
    settings,
    projectName: meta.projectName,
    jobName: meta.jobName,
    dateText: meta.dateText,
    companyName: meta.companyName,
    customerName: meta.customerName,
    projectNumber: meta.projectNumber,
    roomWidthMm: bounds.widthMm,
    logoDataUrl: settings.logoDataUrl,
  });
  return injectExportStyles(sheet);
}

export async function exportPlanSheetPdf(args: {
  project: InteriorProject;
  planSvg: string;
  settings?: PlanPrintSettings;
}): Promise<Blob> {
  const settings = args.settings ?? readPlanPrintSettings(args.project);
  // Sheet composition is landscape-only (PLAN_SHEET_A4_LANDSCAPE_PX); do not offer
  // portrait — that stretched a landscape PNG into a portrait page and invalidated scale.
  const sheetSvg = buildSheetSvg(args.project, args.planSvg, settings);
  const png = await svgToPngDataUrl(sheetSvg);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = A4_PRINT_METRICS.marginMm;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const { drawWidth, drawHeight } = fitDrawingToContent(
    PLAN_SHEET_A4_LANDSCAPE_PX.widthPx,
    PLAN_SHEET_A4_LANDSCAPE_PX.heightPx,
    contentWidth,
    contentHeight,
  );
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.addImage(
    png,
    "PNG",
    margin + (contentWidth - drawWidth) / 2,
    margin + (contentHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return doc.output("blob");
}

export async function exportPlanSheetPngBlob(args: {
  project: InteriorProject;
  planSvg: string;
  settings?: PlanPrintSettings;
}): Promise<Blob> {
  const settings = args.settings ?? readPlanPrintSettings(args.project);
  const sheetSvg = buildSheetSvg(args.project, args.planSvg, settings);
  const dataUrl = await exportPlanSheetPng(sheetSvg);
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = typeof atob === "function"
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/** Browser helper: clone live .lr-plan-svg and serialize with print layers. */
export function captureLivePlanSvg(
  svgElement: SVGSVGElement,
  layers: PlanPrintLayers,
  viewBox?: string,
): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.classList.add("is-print-export");
  clone.setAttribute("data-print-furniture", String(layers.furniture));
  clone.setAttribute("data-print-cabinets", String(layers.cabinets));
  clone.setAttribute("data-print-openings", String(layers.openings));
  clone.setAttribute("data-print-dims", String(layers.dims));
  clone.setAttribute("data-print-reference-dims", String(layers.referenceDims));
  clone.setAttribute("data-print-marks", String(layers.marks));
  clone.setAttribute("data-print-labels", String(layers.labels));
  clone.setAttribute("data-print-grid", String(layers.grid));
  clone.setAttribute("data-print-underlay", String(layers.underlay));
  if (viewBox) clone.setAttribute("viewBox", viewBox);
  const chrome = clone.querySelectorAll(
    ".lr-snap-guide-group, .lr-free-wall-segments, .lr-plan-marquee, .lr-resize-handle, .lr-opening-width-handle, .lr-object-warning, foreignObject, .lr-measure-overlay, [data-testid='lr-plan-marquee'], .lr-wall-nodes, .lr-wall-node-handle, .lr-wall-translate-preview, .lr-draft-guide",
  );
  chrome.forEach((node) => node.remove());
  const removals: string[] = [];
  if (!layers.furniture) removals.push('.lr-plan-object[data-print-role="furniture"]');
  if (!layers.cabinets) removals.push('.lr-plan-object[data-print-role="cabinet"]');
  if (!layers.openings) removals.push(".lr-plan-openings-layer");
  if (!layers.dims) removals.push(".lr-plan-dimension-pairs, .lr-wall-length-labels");
  if (!layers.referenceDims) removals.push(".lr-reference-dimensions");
  if (!layers.marks) removals.push(".lr-plan-mark");
  if (!layers.labels) removals.push(".lr-object-label");
  if (!layers.grid) removals.push(".lr-plan-grid");
  if (!layers.underlay) removals.push(".lr-plan-underlay-image");
  if (removals.length) {
    clone.querySelectorAll(removals.join(", ")).forEach((node) => node.remove());
  }
  return applyPrintLayersToPlanSvg(clone.outerHTML, layers, viewBox);
}
