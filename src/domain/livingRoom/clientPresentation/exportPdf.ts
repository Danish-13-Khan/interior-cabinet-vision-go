import { jsPDF } from "jspdf";
import type { InteriorProject } from "../../interiorProject";
import { A4_PRINT_METRICS } from "../../printLayout";
import {
  drawLabeledValue,
  optimizeSceneImage,
  type PdfLayout,
} from "../../pdfExport/helpers";
import type { LivingRoomRenderResult } from "../renderStudio";
import {
  buildClientPresentationPackage,
  type ClientPresentationPackage,
} from "./buildPackage";
import { drawPackageViewsSection } from "./exportPdfPackageViews";

function drawRow(
  layout: PdfLayout,
  y: number,
  left: string,
  right: string,
) {
  const { doc, margin, contentWidth } = layout;
  doc.setFontSize(8.5);
  doc.setTextColor(45, 58, 68);
  doc.text(left, margin, y);
  doc.setTextColor(90, 104, 112);
  doc.text(right, margin + contentWidth, y, { align: "right" });
  return y + 5;
}

/** Branded one/two-page client presentation PDF (not workshop production). */
export async function exportClientPresentationPdf(
  project: InteriorProject,
  render: LivingRoomRenderResult | null,
  pack?: ClientPresentationPackage,
): Promise<Blob> {
  const packageData = pack ?? buildClientPresentationPackage(project, render);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const layout: PdfLayout = {
    doc,
    pageWidth: A4_PRINT_METRICS.pageWidthMm,
    pageHeight: A4_PRINT_METRICS.pageHeightMm,
    margin: A4_PRINT_METRICS.marginMm,
    contentWidth: A4_PRINT_METRICS.contentWidthMm,
    rowHeight: 7,
  };
  const { margin, contentWidth, pageWidth, pageHeight } = layout;
  const summary = packageData.roomSummary;
  const hero = await optimizeSceneImage(packageData.heroRenderDataUrl);

  doc.setFillColor(244, 241, 235);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(36, 52, 48);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFontSize(11);
  doc.setTextColor(214, 224, 218);
  doc.text("INTERIORS", margin, 12);
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Client Preview", margin, 21);

  let y = 38;
  doc.setFontSize(18);
  doc.setTextColor(28, 38, 34);
  doc.text(summary.projectName.slice(0, 48), margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(95, 110, 102);
  doc.text(
    `${summary.roomName} · ${summary.styleName} · Exported ${new Date(packageData.manifest.exportedAt).toLocaleString()}`,
    margin,
    y,
  );
  y += 10;

  const card = (contentWidth - 8) / 3;
  drawLabeledValue(doc, margin, y, card, "Room", `${Math.round(summary.widthMm / 10) / 100} × ${Math.round(summary.depthMm / 10) / 100} m`);
  drawLabeledValue(doc, margin + card + 4, y, card, "Objects", String(summary.objectCount));
  drawLabeledValue(doc, margin + (card + 4) * 2, y, card, "Lighting", summary.lightingRecipeId);
  y += 20;

  if (hero) {
    const imageHeight = 92;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, imageHeight, 2, 2, "F");
    doc.setDrawColor(210, 216, 210);
    doc.roundedRect(margin, y, contentWidth, imageHeight, 2, 2);
    doc.addImage(hero, "JPEG", margin + 2, y + 2, contentWidth - 4, imageHeight - 4);
    y += imageHeight + 6;
    doc.setFontSize(8);
    doc.setTextColor(110, 122, 116);
    const caption = packageData.manifest.render
      ? `Hero render · ${packageData.manifest.render.cameraName} · ${packageData.manifest.render.widthPx}×${packageData.manifest.render.heightPx}`
      : "Plan preview — render an image in Render Studio for the final hero frame.";
    doc.text(caption, margin, y);
    y += 8;
  }

  doc.setFontSize(11);
  doc.setTextColor(28, 38, 34);
  doc.text("Material palette", margin, y);
  y += 6;
  for (const material of packageData.materials.slice(0, 8)) {
    y = drawRow(layout, y, material.name, `${material.kind} · ${material.color}`);
  }

  y += 4;
  y = drawPackageViewsSection(layout, y, packageData.manifest.packageViews);
  doc.setFontSize(11);
  doc.setTextColor(28, 38, 34);
  doc.text("Featured objects", margin, y);
  y += 6;
  for (const object of packageData.objects.slice(0, 10)) {
    y = drawRow(
      layout,
      y,
      object.name,
      `${object.category} · ${Math.round(object.widthMm)}×${Math.round(object.depthMm)} mm`,
    );
  }

  doc.setFontSize(7);
  doc.setTextColor(140, 150, 144);
  doc.text(
    "Client presentation · Not a workshop production packet",
    margin,
    pageHeight - 8,
  );
  doc.text("Page 1", pageWidth - margin, pageHeight - 8, { align: "right" });

  return doc.output("blob");
}
