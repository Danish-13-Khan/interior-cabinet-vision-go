import type { PdfLayout } from "../../pdfExport/helpers";

export function drawPackageViewsSection(
  layout: PdfLayout,
  y: number,
  views: { viewName: string; fieldOfViewDegrees: number; acceptedStillJobId: string | null }[],
) {
  if (!views.length) return y;
  const { doc, margin } = layout;
  doc.setFontSize(11);
  doc.setTextColor(28, 38, 34);
  doc.text("Client deck views", margin, y);
  y += 6;
  for (const view of views.slice(0, 6)) {
    doc.setFontSize(8.5);
    doc.setTextColor(45, 58, 68);
    doc.text(view.viewName, margin, y);
    doc.setTextColor(90, 104, 112);
    const stillNote = view.acceptedStillJobId ? "accepted still attached" : "render or still pending";
    doc.text(`${view.fieldOfViewDegrees}° · ${stillNote}`, margin + 72, y);
    y += 5;
  }
  return y + 2;
}
