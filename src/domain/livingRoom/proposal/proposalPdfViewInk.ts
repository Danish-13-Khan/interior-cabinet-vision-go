import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

export type RasterBound = { minX: number; minY: number; maxX: number; maxY: number };

export type ViewInk = {
  coverage: number;
  bounds: RasterBound;
};

const WHITE_CEILING = 250;

const IMAGE_OPS = new Set<number>([
  OPS.paintImageXObject,
  OPS.paintInlineImageXObject,
  OPS.paintImageXObjectRepeat,
]);

export function pageHasInk(pixels: Uint8ClampedArray, width: number, height: number) {
  const total = width * height;
  if (total <= 0) return false;
  let ink = 0;
  for (let i = 0; i < total; i += 1) {
    const o = i * 4;
    if ((pixels[o] ?? 255) < WHITE_CEILING
      || (pixels[o + 1] ?? 255) < WHITE_CEILING
      || (pixels[o + 2] ?? 255) < WHITE_CEILING) {
      ink += 1;
    }
  }
  return ink / total >= 0.002;
}

export function measureInkBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): RasterBound | null {
  const bounds = { minX: width, minY: height, maxX: 0, maxY: 0 };
  let found = false;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      if ((pixels[o] ?? 255) >= WHITE_CEILING
        && (pixels[o + 1] ?? 255) >= WHITE_CEILING
        && (pixels[o + 2] ?? 255) >= WHITE_CEILING) {
        continue;
      }
      found = true;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }
  return found ? bounds : null;
}

/** Golden view stills are solid red; a missing/clipped XObject leaves no red band. */
export function measureViewInk(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): ViewInk | null {
  const bounds = { minX: width, minY: height, maxX: 0, maxY: 0 };
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      const r = pixels[o] ?? 0;
      const g = pixels[o + 1] ?? 0;
      const b = pixels[o + 2] ?? 0;
      if (r < 180 || g > 160 || b > 160 || g > r - 30 || b > r - 30) continue;
      count += 1;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }
  if (count <= 0) return null;
  return { coverage: count / (width * height), bounds };
}

export function countImagePaints(fnArray: number[]) {
  return fnArray.reduce((sum, fn) => sum + (IMAGE_OPS.has(fn) ? 1 : 0), 0);
}

export function viewInkLooksClipped(ink: ViewInk, width: number, height: number) {
  const pad = 2;
  const { bounds } = ink;
  const flush = bounds.minX <= pad
    || bounds.maxX >= width - pad
    || bounds.maxY >= height - pad;
  const tooShort = bounds.maxY - bounds.minY < height * 0.08;
  return flush || tooShort || ink.coverage < 0.03;
}

type TextLike = {
  str?: string;
  width?: number;
  height?: number;
  transform: number[];
};

export function pageTextMetrics(
  items: TextLike[],
  view: number[],
): { minFontPt: number | null; clipped: boolean } {
  const pad = 2;
  const x0 = view[0] ?? 0;
  const y0 = view[1] ?? 0;
  const x1 = view[2] ?? 0;
  const y1 = view[3] ?? 0;
  let minFontPt: number | null = null;
  let clipped = false;
  for (const item of items) {
    if (!item.str) continue;
    const fontPt = Math.abs(item.height ?? 0)
      || Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0);
    if (fontPt > 0) minFontPt = minFontPt == null ? fontPt : Math.min(minFontPt, fontPt);
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;
    const w = item.width ?? 0;
    if (x < x0 - pad || y < y0 - pad || x + w > x1 + pad || y + fontPt > y1 + pad) {
      clipped = true;
    }
  }
  return { minFontPt, clipped };
}
