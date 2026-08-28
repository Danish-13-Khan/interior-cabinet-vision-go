import type { PdfLayout } from "../../pdfExport/helpers";
import type { ClientPresentationHonesty } from "../renderTierHonesty";

export function drawPresentationHonestySection(
  layout: PdfLayout,
  y: number,
  honesty: ClientPresentationHonesty | undefined,
) {
  if (!honesty?.tiers.length) return y;
  const { doc, margin, contentWidth } = layout;
  doc.setFontSize(10);
  doc.setTextColor(28, 38, 34);
  doc.text("Presentation honesty", margin, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(95, 110, 102);
  const disclaimer = doc.splitTextToSize(honesty.disclaimer, contentWidth);
  doc.text(disclaimer, margin, y);
  y += disclaimer.length * 3.5 + 2;
  for (const tier of honesty.tiers) {
    doc.setFontSize(8);
    doc.setTextColor(45, 58, 68);
    doc.text(tier.headline, margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(95, 110, 102);
    const subline = doc.splitTextToSize(tier.subline, contentWidth);
    doc.text(subline, margin, y);
    y += subline.length * 3.2 + 2;
  }
  return y + 2;
}
