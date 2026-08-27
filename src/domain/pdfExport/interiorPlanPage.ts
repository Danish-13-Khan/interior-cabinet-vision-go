import { svgToPngDataUrl } from "../technicalViews";
import { A4_PRINT_METRICS, fitDrawingToContent } from "../printLayout";
import type { PdfLayout } from "./helpers";

/** Adds the topology-authored room plan before cabinet-specific technical sheets. */
export async function drawInteriorPlanPage(
  layout: PdfLayout,
  title: string,
  svg: string | null,
) {
  if (!svg) return;
  const { doc, pageWidth, pageHeight, margin, contentWidth } = layout;
  const image = await svgToPngDataUrl(svg);
  const { drawWidth, drawHeight } = fitDrawingToContent(
    1200,
    800,
    contentWidth,
    A4_PRINT_METRICS.drawingMaxHeightMm,
  );
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(31, 50, 59);
  doc.setFontSize(14);
  doc.text(`${title} · Floor Plan`, margin, margin + 4);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin + 10, contentWidth, drawHeight + 6);
  doc.addImage(
    image,
    "PNG",
    margin + (contentWidth - drawWidth) / 2,
    margin + 13,
    drawWidth,
    drawHeight,
  );
}
