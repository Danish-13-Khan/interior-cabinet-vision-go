import type { jsPDF } from "jspdf";
import type { PdfLayout } from "../../pdfExport/helpers";

export type Rgb = readonly [number, number, number];

/** The proposal's palette: one dark ink, two greys, a dark band and a pale card. */
export const INK = {
  title: [28, 38, 34],
  body: [45, 58, 48],
  muted: [95, 110, 102],
  faint: [140, 150, 144],
  band: [36, 52, 48],
  bandText: [214, 224, 218],
  card: [247, 249, 244],
  rule: [180, 190, 182],
  warn: [250, 204, 166],
  white: [255, 255, 255],
} as const satisfies Record<string, Rgb>;

/** The font the page writes with: the embedded Unicode sans, or jsPDF's core font with sanitised text. */
export type ProposalTypeface = {
  family: string;
  embedded: boolean;
  text: (value: string) => string;
};

export type ProposalPdfLayout = PdfLayout & { face: ProposalTypeface };

export function setType(
  layout: ProposalPdfLayout,
  sizePt: number,
  ink: Rgb,
  weight: "normal" | "bold" = "normal",
) {
  layout.doc.setFont(layout.face.family, weight);
  layout.doc.setFontSize(sizePt);
  layout.doc.setTextColor(ink[0], ink[1], ink[2]);
}

export function writeText(
  layout: ProposalPdfLayout,
  value: string,
  x: number,
  y: number,
  options: { align?: "left" | "right" | "center"; maxChars?: number } = {},
) {
  const text = layout.face.text(value);
  layout.doc.text(
    options.maxChars ? text.slice(0, options.maxChars) : text,
    x,
    y,
    options.align ? { align: options.align } : undefined,
  );
}

/** Wrapped body copy; returns the y after the last line. */
export function writeParagraph(layout: ProposalPdfLayout, value: string, x: number, y: number, width: number, lineMm = 4.5) {
  const lines: string[] = layout.doc.splitTextToSize(layout.face.text(value), width);
  for (const line of lines) {
    layout.doc.text(line, x, y);
    y += lineMm;
  }
  return y;
}

export function fill(doc: jsPDF, ink: Rgb) {
  doc.setFillColor(ink[0], ink[1], ink[2]);
}

export function stroke(doc: jsPDF, ink: Rgb) {
  doc.setDrawColor(ink[0], ink[1], ink[2]);
}

export function imageFormat(dataUrl: string): "PNG" | "JPEG" {
  return /^data:image\/png/i.test(dataUrl) ? "PNG" : "JPEG";
}

export function imageAspect(doc: jsPDF, dataUrl: string, fallback = 16 / 9): number {
  try {
    const { width, height } = doc.getImageProperties(dataUrl);
    if (width > 0 && height > 0) return width / height;
  } catch {
    /* unreadable header: fall back */
  }
  return fallback;
}

/** `#rrggbb` to a jsPDF colour, or null for anything else. */
export function hexToRgb(value: string | undefined): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  if (!match) return null;
  const hex = match[1]!;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

export function newPage(layout: ProposalPdfLayout): number {
  layout.doc.addPage();
  return layout.margin;
}

/** Small brand line at the foot of every page but the cover. */
export function drawPageFooter(layout: ProposalPdfLayout, left: string, right = "") {
  setType(layout, 7.5, INK.faint);
  writeText(layout, left, layout.margin, layout.pageHeight - 8, { maxChars: 90 });
  if (right) writeText(layout, right, layout.margin + layout.contentWidth, layout.pageHeight - 8, { align: "right" });
}
