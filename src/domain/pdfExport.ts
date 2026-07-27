import { jsPDF } from "jspdf";
import type { CabinetProject } from "./cabinetDimensions";
import type { CountertopSegment } from "./cabinetLibrary";
import { type CabinetCutlistItem } from "./cabinetGeometry";
import { createProjectReport } from "./projectReport";
import {
  createTechnicalView,
  formatProjectTechnicalSummary,
  svgToPngDataUrl,
} from "./technicalViews";
import type { RoomConfig } from "./roomModel";

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
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const title = projectName.trim() || "Room Project";
  const optimizedImage = await optimizeSceneImage(sceneScreenshot);
  const report = createProjectReport(project, room);
  let y = margin;

  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFontSize(20);
  doc.setTextColor(34, 44, 59);
  doc.text(title, margin, y);
  y += 7.5;

  doc.setFontSize(9);
  doc.setTextColor(104, 116, 132);
  doc.text(
    `Exported ${new Date().toLocaleString()} | ${project.cabinets.length} room items`,
    margin,
    y,
  );
  y += 8;

  const summaryCardWidth = (contentWidth - 8) / 3;
  drawLabeledValue(doc, margin, y, summaryCardWidth, "Items", String(project.cabinets.length));
  drawLabeledValue(
    doc,
    margin + summaryCardWidth + 4,
    y,
    summaryCardWidth,
    "Cabinets",
    String(report.summary.cabinetCount),
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 2,
    y,
    summaryCardWidth,
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

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Item Summary", margin, y);
  y += 6;

  const headers = ["Name", "Type", "W", "H", "D", "X", "Z", "Rot"];
  const colWidths = [39, 33, 13, 13, 13, 16, 16, 17];
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
  report.itemList.forEach((cabinet, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    const row = [
      cabinet.name.length > 17 ? `${cabinet.name.slice(0, 16)}...` : cabinet.name,
      cabinet.typeLabel,
      String(cabinet.widthMm),
      String(cabinet.heightMm),
      String(cabinet.depthMm),
      String(cabinet.x),
      String(cabinet.z),
      `${cabinet.rotation}°`,
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += colWidths[cellIndex];
    });
    y += rowHeight;
  });

  const topView = createTechnicalView(project, room, "top", countertops, {
    mode: "print",
    showGrid: false,
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    title: "Room Plan",
    projectName: title,
  });
  const frontView = createTechnicalView(project, room, "front", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    title: "Front Elevation",
    projectName: title,
  });
  const sideView = createTechnicalView(project, room, "side", countertops, {
    mode: "print",
    showDimensionChains: true,
    showWallLabels: true,
    showElevationDetails: true,
    title: "Side Elevation",
    projectName: title,
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
    doc.text("Scale 1:100", margin + contentWidth * 0.55 + 3, viewY + 12.5);
    doc.text("TECHNICAL", margin + contentWidth * 0.78 + 3, viewY + 6.5);
    doc.text(new Date().toLocaleDateString(), margin + contentWidth * 0.78 + 3, viewY + 12.5);
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
    doc.text(
      "Mark clearances, appliance models, filler decisions, and approval initials.",
      margin + 3,
      viewY + 7,
    );
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

  y = ensurePageSpace(doc, y + 8, 48, pageHeight, margin);
  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Project Costing", margin, y);
  y += 8;

  drawLabeledValue(doc, margin, y, 42, "Material", `Rs ${report.projectCost.totalMaterial.toLocaleString()}`);
  drawLabeledValue(doc, margin + 46, y, 42, "Hardware", `Rs ${report.projectCost.totalHardware.toLocaleString()}`);
  drawLabeledValue(doc, margin + 92, y, 42, "Labour", `Rs ${report.projectCost.totalLabour.toLocaleString()}`);
  drawLabeledValue(doc, margin + 138, y, 44, "Total", `Rs ${report.projectCost.grandTotal.toLocaleString()}`);
  y += 24;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Full Cutlist", margin, y);
  y += 6;

  const allItems: CabinetCutlistItem[] = report.projectCutlist;

  const cutHeaders = ["Part", "Material", "Thk", "Qty", "Length", "Width"];
  const cutColWidths = [58, 32, 14, 14, 24, 24];
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
      item.label,
      item.material,
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

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(156, 166, 178);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, {
      align: "right",
    });
  }

  return doc.output("blob");
}
