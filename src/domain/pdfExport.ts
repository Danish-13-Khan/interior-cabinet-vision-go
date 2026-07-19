import { jsPDF } from "jspdf";
import type { CabinetProject } from "./cabinetDimensions";
import { cabinetTypeLabels } from "./cabinetDimensions";
import { createCabinetCutlist, type CabinetCutlistItem } from "./cabinetGeometry";

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
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const title = projectName.trim() || "Room Project";
  const optimizedImage = await optimizeSceneImage(sceneScreenshot);
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
    String(project.cabinets.filter((item) => item.config.type === "base" || item.config.type === "wall" || item.config.type === "tall" || item.config.type === "almirah").length),
  );
  drawLabeledValue(
    doc,
    margin + (summaryCardWidth + 4) * 2,
    y,
    summaryCardWidth,
    "Unique Parts",
    String(
      project.cabinets.reduce(
        (count, cabinet) => count + createCabinetCutlist(cabinet.config).length,
        0,
      ),
    ),
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
  project.cabinets.forEach((cabinet, index) => {
    y = ensurePageSpace(doc, y, rowHeight, pageHeight, margin);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    const row = [
      cabinet.name.length > 17 ? `${cabinet.name.slice(0, 16)}...` : cabinet.name,
      cabinetTypeLabels[cabinet.config.type] ?? cabinet.config.type,
      String(cabinet.config.dimensions.width),
      String(cabinet.config.dimensions.height),
      String(cabinet.config.dimensions.depth),
      String(Math.round(cabinet.placement.x)),
      String(Math.round(cabinet.placement.z)),
      `${cabinet.placement.rotation}°`,
    ];

    currentX = margin;
    row.forEach((value, cellIndex) => {
      doc.text(value, currentX + 1.3, y + rowHeight - 2.1);
      currentX += colWidths[cellIndex];
    });
    y += rowHeight;
  });

  doc.addPage();
  doc.setFillColor(247, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  y = margin;

  doc.setFontSize(13);
  doc.setTextColor(34, 44, 59);
  doc.text("Full Cutlist", margin, y);
  y += 6;

  const allItems: CabinetCutlistItem[] = [];
  for (const cabinet of project.cabinets) {
    const items = createCabinetCutlist(cabinet.config);

    for (const item of items) {
      const existing = allItems.find(
        (candidate) =>
          candidate.key === item.key &&
          candidate.lengthMm === item.lengthMm &&
          candidate.widthMm === item.widthMm &&
          candidate.thicknessMm === item.thicknessMm,
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        allItems.push({ ...item });
      }
    }
  }

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
