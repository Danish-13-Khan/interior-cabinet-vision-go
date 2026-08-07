import { jsPDF } from "jspdf";
import type { CabinetProject } from "./cabinetDimensions";
import type { CountertopSegment, CabinetRun } from "./cabinetLibrary";
import { createProjectReport } from "./projectReport";
import {
  createTechnicalView,
  formatProjectTechnicalSummary,
  svgToPngDataUrl,
  TECHNICAL_VIEW_SCALE,
} from "./technicalViews";
import type { RoomConfig } from "./roomModel";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  JOB_STATUS_LABELS,
} from "./jobMeta";
import { clampProjectDrafting } from "./draftingAnnotations";

async function optimizeSceneImage(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl) {
    return null;
  }

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const maxWidth = 1400;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.fillStyle = "#f7f8fa";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function drawLabeledValue(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
) {
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(x, y, width, 15, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(111, 121, 136);
  doc.text(label, x + 3, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(37, 48, 64);
  doc.text(value, x + 3, y + 11.5);
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number, pageHeight: number, margin: number) {
  if (y + needed <= pageHeight - margin) {
    return y;
  }

  doc.addPage();
  return margin;
}

export async function exportProjectPdf(
  project: CabinetProject,
  sceneScreenshot: string | null,
  projectName: string,
  room: RoomConfig,
  countertops: CountertopSegment[] = [],
  runs: CabinetRun[] = [],
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const job = clampJobMeta(project.job ?? createDefaultJobMeta());
  const title =
    formatJobTitle(job, projectName.trim() || "Cabinet Project") ||
    projectName.trim() ||
    "Cabinet Project";
  const optimizedImage = await optimizeSceneImage(sceneScreenshot);
  const report = createProjectReport(project, room);
  let y = margin;

  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFontSize(18);
  doc.setTextColor(34, 44, 59);
  doc.text("Production Packet", margin, y);
  y += 7;

  doc.setFontSize(14);
  doc.text(title, margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(104, 116, 132);
  doc.text(
    `${formatJobSubtitle(job)}  ·  Exported ${new Date().toLocaleString()}  ·  ${project.cabinets.length} items`,
    margin,
    y,
  );
  y += 8;

  const summaryCardWidth = (contentWidth - 12) / 4;
  drawLabeledValue(doc, margin, y, summaryCardWidth, "Project #", report.summary.projectNumber);
  drawLabeledValue(
    doc,
    margin + summaryCardWidth + 4,
    y,
    summaryCardWidth,
    "Customer",
    report.summary.customerName,
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 2,
    y,
    summaryCardWidth,
    "Status",
    JOB_STATUS_LABELS[job.status],
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 3,
    y,
    summaryCardWidth,
    "Revision",
    report.summary.revision,
  );
  y += 19;

  const secondRowWidth = (contentWidth - 8) / 3;
  drawLabeledValue(doc, margin, y, secondRowWidth, "Cabinets", String(report.summary.cabinetCount));
  drawLabeledValue(
    doc,
    margin + secondRowWidth + 4,
    y,
    secondRowWidth,
    "Runs",
    String(report.summary.runCount),
  );
  drawLabeledValue(
    doc,
    margin + (secondRowWidth + 4) * 2,
    y,
    secondRowWidth,
    "Room Size",
    report.summary.roomSizeLabel,
  );
  y += 21;

  if (optimizedImage) {
    const imageHeight = 84;
    const imageWidth = contentWidth;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, imageWidth, imageHeight, 3, 3, "F");
    doc.setDrawColor(225, 230, 236);
    doc.roundedRect(margin, y, imageWidth, imageHeight, 3, 3);
    doc.addImage(optimizedImage, "JPEG", margin + 2, y + 2, imageWidth - 4, imageHeight - 4);
    doc.setFontSize(8);
    doc.setTextColor(113, 123, 137);
    doc.text("3D scene preview", margin + 2, y + imageHeight - 3);
  y += imageHeight + 8;
  }

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Project Summary", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(84, 96, 113);
  for (const line of formatProjectTechnicalSummary(project, room)) {
    doc.text(line, margin, y);
    y += 5;
  }
  y += 2;

  if (job.notes) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const noteLines = doc.splitTextToSize(`Notes: ${job.notes}`, contentWidth);
    for (const line of noteLines.slice(0, 4)) {
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 2;
  }

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Cabinet Schedule", margin, y);
  y += 6;

  const headers = ["Mark", "Name", "Type", "W", "H", "D", "Run"];
  const colWidths = [16, 42, 30, 14, 14, 14, 42];
  const rowHeight = 7;
  const tableWidth = colWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, tableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  let currentX = margin;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += colWidths[index];
  });
  y += rowHeight;

  doc.setTextColor(40, 50, 65);
  report.cabinetSchedule.forEach((cabinet, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    const runLabel = cabinet.runLabel ?? "—";
    const row = [
      cabinet.mark,
      cabinet.cabinetName.length > 20
        ? `${cabinet.cabinetName.slice(0, 19)}…`
        : cabinet.cabinetName,
      cabinet.typeLabel.length > 14 ? `${cabinet.typeLabel.slice(0, 13)}…` : cabinet.typeLabel,
      String(cabinet.widthMm),
      String(cabinet.heightMm),
      String(cabinet.depthMm),
      runLabel.length > 22 ? `${runLabel.slice(0, 21)}…` : runLabel,
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += colWidths[cellIndex];
    });
    y += rowHeight;
  });

  if (report.runSummaries.length > 0) {
    y = ensurePageSpace(doc, y + 8, 24, pageHeight, margin);
    doc.setFontSize(13);
    doc.setTextColor(34, 44, 59);
    doc.text("Room / Run Summary", margin, y);
    y += 6;

    for (const run of report.runSummaries) {
      y = ensurePageSpace(doc, y, 10, pageHeight, margin);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${run.label}  ·  ${run.cabinetCount} cabinets  ·  ${run.lengthMm} mm  ·  fillers ${run.fillerCount}  ·  tops ${run.countertopCount}`,
        margin,
        y,
      );
      y += 4.5;
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(run.cabinetNames.join(", ") || "—", margin + 2, y);
      y += 5.5;
    }
  }

  const drafting = clampProjectDrafting(project.drafting);
  const scaleText = `1:${TECHNICAL_VIEW_SCALE * 25}`;
  const topView = createTechnicalView(project, room, "top", countertops, {
    mode: "print",
    showGrid: false,
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Room Plan",
    projectName: title,
    runs,
    drafting,
  });
  const frontView = createTechnicalView(project, room, "front", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Front Elevation",
    projectName: title,
    drafting,
  });
  const sideView = createTechnicalView(project, room, "side", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    showCabinetTags: true,
    showOpeningTags: true,
    showApplianceTags: true,
    title: "Side Elevation",
    projectName: title,
    drafting,
  });
  const technicalViews = [
    { label: "Room Plan", result: topView, sheetCode: "A-101" },
    { label: "Front Elevation", result: frontView, sheetCode: "A-201" },
    { label: "Side Elevation", result: sideView, sheetCode: "A-202" },
  ];

  for (const view of technicalViews) {
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    let viewY = margin;

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4);
    doc.rect(margin, viewY, contentWidth, 16);
    doc.line(margin + contentWidth * 0.55, viewY, margin + contentWidth * 0.55, viewY + 16);
    doc.line(margin + contentWidth * 0.78, viewY, margin + contentWidth * 0.78, viewY + 16);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 3, viewY + 6.5);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(view.label, margin + 3, viewY + 12.5);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(view.sheetCode, margin + contentWidth * 0.55 + 3, viewY + 6.5);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(scaleText, margin + contentWidth * 0.55 + 3, viewY + 12.5);
    doc.text("TECHNICAL", margin + contentWidth * 0.78 + 3, viewY + 6.5);
    doc.text(
      `Rev ${report.summary.revision}`,
      margin + contentWidth * 0.78 + 3,
      viewY + 12.5,
    );
    viewY += 22;

    const viewImage = await svgToPngDataUrl(view.result.svg);
    const scale = Math.min(contentWidth / view.result.width, 175 / view.result.height);
    const drawWidth = view.result.width * scale;
    const drawHeight = view.result.height * scale;

    doc.setDrawColor(148, 163, 184);
    doc.rect(margin, viewY, contentWidth, drawHeight + 8);
    doc.addImage(
      viewImage,
      "PNG",
      margin + (contentWidth - drawWidth) / 2,
      viewY + 4,
      drawWidth,
      drawHeight,
    );

    viewY += drawHeight + 14;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Revision / Site Notes", margin, viewY);
    viewY += 3;
    doc.setDrawColor(148, 163, 184);
    doc.rect(margin, viewY, contentWidth, 36);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const sheetNotes = drafting.notes
      .filter((note) => note.view === "all" || note.view === (view.label.includes("Plan") ? "top" : view.label.includes("Front") ? "front" : "side"))
      .map((note) => note.text);
    const leaderNotes = drafting.leaders
      .filter((leader) => leader.view === "all" || leader.view === (view.label.includes("Plan") ? "top" : view.label.includes("Front") ? "front" : "side"))
      .map((leader) => leader.text);
    const seeded = [...sheetNotes, ...leaderNotes].slice(0, 4);
    if (seeded.length === 0) {
      doc.text(
        "Mark clearances, appliance models, filler decisions, and approval initials.",
        margin + 3,
        viewY + 7,
      );
    } else {
      seeded.forEach((line, index) => {
        doc.text(`• ${line}`, margin + 3, viewY + 7 + index * 7);
      });
    }
  }

  doc.addPage();
  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  y = margin;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Material Summary", margin, y);
  y += 6;

  const materialHeaders = ["Material", "Thk", "Area m2", "Boards"];
  const materialWidths = [78, 20, 34, 28];
  const materialTableWidth = materialWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, materialTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  materialHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += materialWidths[index];
  });
  y += rowHeight;

  report.materialSummary.forEach((item, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, materialTableWidth, rowHeight, "F");
    }

    const row = [
      item.material,
      String(item.thicknessMm),
      item.totalAreaM2.toFixed(2),
      String(item.estimatedBoards),
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += materialWidths[cellIndex];
    });
    y += rowHeight;
  });

  y = ensurePageSpace(doc, y + 8, 40, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Sheet Yield Planning", margin, y);
  y += 6;
  const yieldPlan = report.sheetYield;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${yieldPlan.sheet.label}  ·  usable ${yieldPlan.usableLengthMm}x${yieldPlan.usableWidthMm}  ·  kerf ${yieldPlan.settings.kerfMm} mm  ·  sheets ${yieldPlan.totalSheets}  ·  yield ${yieldPlan.overallYieldPercent}%  ·  waste ${yieldPlan.totalWasteAreaM2.toFixed(2)} m2  ·  reclaimable offcuts ${yieldPlan.reclaimableOffcutAreaM2.toFixed(2)} m2`,
    margin,
    y,
  );
  y += 6;

  const yieldHeaders = ["Material", "Thk", "Parts", "Sheets", "Yield", "Waste"];
  const yieldWidths = [54, 16, 20, 22, 22, 26];
  const yieldTableWidth = yieldWidths.reduce((sum, value) => sum + value, 0);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, yieldTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  yieldHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += yieldWidths[index];
  });
  y += rowHeight;

  yieldPlan.groups.forEach((group, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, yieldTableWidth, rowHeight, "F");
    }
    const row = [
      group.material,
      String(group.thicknessMm),
      String(group.partCount),
      String(group.sheetsUsed),
      `${group.yieldPercent}%`,
      group.wasteAreaM2.toFixed(2),
    ];
    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += yieldWidths[cellIndex];
    });
    y += rowHeight;
  });

  // Compact per-sheet cut grouping (first few sheets)
  let sheetSamples = 0;
  for (const group of yieldPlan.groups) {
    for (const sheet of group.sheets) {
      if (sheetSamples >= 4) break;
      sheetSamples += 1;
      y = ensurePageSpace(doc, y + 4, 16, pageHeight, margin);
      doc.setFontSize(9);
      doc.setTextColor(34, 44, 59);
      doc.text(
        `${group.material} ${group.thicknessMm}mm · ${sheet.label} · ${sheet.parts.length} cuts · yield ${sheet.yieldPercent}%`,
        margin,
        y,
      );
      y += 4;
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const refs = sheet.parts
        .slice(0, 8)
        .map((part) => part.shopRef)
        .join(", ");
      doc.text(
        refs + (sheet.parts.length > 8 ? ` +${sheet.parts.length - 8} more` : ""),
        margin + 2,
        y,
      );
      y += 4;
      if (sheet.offcuts[0]) {
        doc.text(
          `Offcut e.g. ${sheet.offcuts[0].lengthMm}x${sheet.offcuts[0].widthMm}${sheet.offcuts[0].reclaimable ? " reclaimable" : ""}`,
          margin + 2,
          y,
        );
        y += 4;
      }
    }
    if (sheetSamples >= 4) break;
  }

  y = ensurePageSpace(doc, y + 8, 48, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Project Costing", margin, y);
  y += 8;

  drawLabeledValue(doc, margin, y, 42, "Material", `Rs ${report.projectCost.totalMaterial.toLocaleString()}`);
  drawLabeledValue(doc, margin + 46, y, 42, "Hardware", `Rs ${report.projectCost.totalHardware.toLocaleString()}`);
  drawLabeledValue(doc, margin + 92, y, 42, "Labour", `Rs ${report.projectCost.totalLabour.toLocaleString()}`);
  drawLabeledValue(doc, margin + 138, y, 44, "Workshop", `Rs ${report.projectCost.grandTotal.toLocaleString()}`);
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Waste Rs ${report.projectCost.totalWaste.toLocaleString()}  ·  Finish Rs ${report.projectCost.totalFinish.toLocaleString()}  ·  HW allow Rs ${report.projectCost.hardwareAllowance.toLocaleString()}  ·  Labour allow Rs ${report.projectCost.labourAllowance.toLocaleString()}  ·  Preset ${report.projectCost.settings.presetId}`,
    margin,
    y,
  );
  y += 10;

  y = ensurePageSpace(doc, y, 56, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Quote / Estimate", margin, y);
  y += 8;

  const quote = report.quote;
  drawLabeledValue(doc, margin, y, 42, "Workshop", `Rs ${quote.workshopSubtotal.toLocaleString()}`);
  drawLabeledValue(doc, margin + 46, y, 42, "Markup", `Rs ${quote.markupAmount.toLocaleString()}`);
  drawLabeledValue(doc, margin + 92, y, 42, "Tax", `Rs ${quote.taxAmount.toLocaleString()}`);
  drawLabeledValue(doc, margin + 138, y, 44, "Quote total", `Rs ${quote.sellTotal.toLocaleString()}`);
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Rev ${report.summary.revision}  ·  Finish premium Rs ${quote.finishPremiumTotal.toLocaleString()}  ·  Discount Rs ${quote.discountAmount.toLocaleString()}  ·  Valid ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "—"}`,
    margin,
    y,
  );
  y += 6;
  doc.text(
    `Includes: ${quote.settings.inclusions.slice(0, 110)}`,
    margin,
    y,
  );
  y += 4;
  doc.text(
    `Excludes: ${quote.settings.exclusions.slice(0, 110)}`,
    margin,
    y,
  );
  y += 8;

  const quoteHeaders = ["Mark", "Cabinet", "Workshop", "Sell"];
  const quoteWidths = [18, 70, 36, 36];
  const quoteTableWidth = quoteWidths.reduce((sum, value) => sum + value, 0);
  y = ensurePageSpace(doc, y, rowHeight * 2, pageHeight, margin);
  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, quoteTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  quoteHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += quoteWidths[index];
  });
  y += rowHeight;

  quote.cabinetLines.forEach((line, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, quoteTableWidth, rowHeight, "F");
    }
    const row = [
      line.mark,
      line.cabinetName.length > 28 ? `${line.cabinetName.slice(0, 27)}…` : line.cabinetName,
      String(line.workshopCost),
      String(line.sellPrice),
    ];
    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += quoteWidths[cellIndex];
    });
    y += rowHeight;
  });

  if (report.quoteHistory.length > 0) {
    y = ensurePageSpace(doc, y + 6, 24, pageHeight, margin);
    doc.setFontSize(10);
    doc.setTextColor(34, 44, 59);
    doc.text("Revision Pricing History", margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const snap of report.quoteHistory.slice(0, 6)) {
      y = ensurePageSpace(doc, y, 5, pageHeight, margin);
      doc.text(
        `Rev ${snap.revision}  ·  ${new Date(snap.quotedAt).toLocaleDateString()}  ·  workshop Rs ${snap.workshopTotal.toLocaleString()}  ·  sell Rs ${snap.sellTotal.toLocaleString()}`,
        margin,
        y,
      );
      y += 4.5;
    }
  }

  y += 4;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Production Cutlist", margin, y);
  y += 6;

  const allItems = report.productionCutlist;

  const cutHeaders = ["Ref", "Cabinet", "Part", "Material", "Thk", "Qty", "L", "W"];
  const cutColWidths = [18, 28, 34, 26, 12, 12, 16, 16];
  const cutTableWidth = cutColWidths.reduce((total, value) => total + value, 0);

  doc.setFillColor(232, 237, 243);
  doc.rect(margin, y, cutTableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setTextColor(65, 76, 91);
  currentX = margin;
  cutHeaders.forEach((header, index) => {
    doc.text(header, currentX + 1.3, y + rowHeight - 2.1);
    currentX += cutColWidths[index];
  });
  y += rowHeight;

  allItems.forEach((item, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, cutTableWidth, rowHeight, "F");
    }

    const row = [
      item.shopRef,
      item.cabinetName.length > 12 ? `${item.cabinetName.slice(0, 11)}…` : item.cabinetName,
      item.label.length > 15 ? `${item.label.slice(0, 14)}…` : item.label,
      item.material.length > 11 ? `${item.material.slice(0, 10)}…` : item.material,
      String(item.thicknessMm),
      String(item.quantity),
      String(item.lengthMm),
      String(item.widthMm),
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += cutColWidths[cellIndex];
    });
    y += rowHeight;
  });

  // Grouped by material appendix
  y = ensurePageSpace(doc, y + 10, 20, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Cutlist by Material", margin, y);
  y += 6;

  for (const group of report.groupedByMaterial) {
    y = ensurePageSpace(doc, y, 14, pageHeight, margin);
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${group.title}  ·  ${group.totalQuantity} pcs  ·  ${group.totalAreaM2.toFixed(2)} m2`,
      margin,
      y,
    );
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    for (const line of group.lines.slice(0, 12)) {
      y = ensurePageSpace(doc, y, 5, pageHeight, margin);
      doc.text(
        `${line.shopRef}  ${line.cabinetName}: ${line.label}  ${line.quantity}x  ${line.lengthMm}x${line.widthMm}x${line.thicknessMm}`,
        margin + 2,
        y,
      );
      y += 4.2;
    }
    if (group.lines.length > 12) {
      doc.text(`… +${group.lines.length - 12} more lines`, margin + 2, y);
      y += 5;
    }
    y += 2;
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(156, 166, 178);
    doc.text(
      `${report.summary.projectNumber} · Rev ${report.summary.revision} · ${JOB_STATUS_LABELS[job.status]}`,
      margin,
      pageHeight - 7.5,
    );
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, {
      align: "right",
    });
  }

  return doc.output("blob");
}
