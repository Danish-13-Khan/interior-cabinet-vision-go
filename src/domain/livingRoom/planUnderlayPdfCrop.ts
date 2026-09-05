/** Pure crop-rect math for PDF underlay (no pdf.js). */

export type PdfCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Normalize a crop rect in page-pixel space.
 * Accepts inverted drag (negative width/height), clamps to the page, and
 * returns null when the result is empty or invalid.
 */
export function normalizeCropRect(
  rect: Partial<PdfCropRect> | null | undefined,
  pageWidth: number,
  pageHeight: number,
): PdfCropRect | null {
  if (!rect) return null;
  const pw = Math.max(0, Number(pageWidth));
  const ph = Math.max(0, Number(pageHeight));
  if (!(pw > 0 && ph > 0)) return null;

  const x0 = Number(rect.x);
  const y0 = Number(rect.y);
  const w0 = Number(rect.width);
  const h0 = Number(rect.height);
  if (![x0, y0, w0, h0].every((n) => Number.isFinite(n))) return null;

  let left = x0;
  let top = y0;
  let right = x0 + w0;
  let bottom = y0 + h0;
  if (right < left) [left, right] = [right, left];
  if (bottom < top) [top, bottom] = [bottom, top];

  left = Math.max(0, Math.min(pw, left));
  top = Math.max(0, Math.min(ph, top));
  right = Math.max(0, Math.min(pw, right));
  bottom = Math.max(0, Math.min(ph, bottom));

  const width = right - left;
  const height = bottom - top;
  if (!(width >= 1 && height >= 1)) return null;
  return { x: left, y: top, width, height };
}
