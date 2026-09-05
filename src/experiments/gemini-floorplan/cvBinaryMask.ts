import type { BinaryMask, GrayBuffer } from "./geometryMode";

/** Otsu threshold on 8-bit grayscale histogram. */
export function otsuThreshold(gray: GrayBuffer): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < gray.data.length; i++) hist[gray.data[i]]++;
  const total = gray.data.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let maxVar = -1;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > maxVar) {
      maxVar = v;
      threshold = t;
    }
  }
  return threshold;
}

/** Dark ink on light paper → 1. Flips if image looks light-on-dark. */
export function thresholdToBinary(gray: GrayBuffer, threshold?: number): BinaryMask {
  const t = threshold ?? otsuThreshold(gray);
  const data = new Uint8Array(gray.data.length);
  let ink = 0;
  for (let i = 0; i < gray.data.length; i++) {
    const v = gray.data[i] <= t ? 1 : 0;
    data[i] = v;
    ink += v;
  }
  // If >55% ink, plan is likely inverted (dark bg) — flip.
  if (ink / data.length > 0.55) {
    for (let i = 0; i < data.length; i++) data[i] = data[i] ? 0 : 1;
  }
  return { width: gray.width, height: gray.height, data };
}

function morph(
  mask: BinaryMask,
  kind: "dilate" | "erode",
): BinaryMask {
  const { width: w, height: h, data } = mask;
  const out = new Uint8Array(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = kind === "erode" ? 1 : 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const p = data[yy * w + xx];
          if (kind === "dilate") v = v || p;
          else v = v && p;
        }
      }
      out[y * w + x] = v ? 1 : 0;
    }
  }
  return { width: w, height: h, data: out };
}

/** Close: bridge small gaps in wall strokes without wiping thin lines. */
export function morphClean(mask: BinaryMask): BinaryMask {
  return morph(morph(mask, "dilate"), "erode");
}

export function rgbaToGray(rgba: Uint8ClampedArray, width: number, height: number): GrayBuffer {
  const data = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    data[i] = Math.round(0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2]);
  }
  return { width, height, data };
}
