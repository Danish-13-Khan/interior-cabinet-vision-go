import type { BinaryMask, PixelSegment } from "./geometryMode";

export type AxisSegmentOptions = {
  /** Minimum run length in pixels. Default 28. */
  minLengthPx?: number;
  /** Merge parallel runs within this gap (px). Default 6. */
  mergeGapPx?: number;
};

function mergeAxisRuns(
  runs: PixelSegment[],
  axis: "h" | "v",
  mergeGapPx: number,
): PixelSegment[] {
  if (!runs.length) return [];
  const sorted = [...runs].sort((a, b) =>
    axis === "h" ? a.y1 - b.y1 || a.x1 - b.x1 : a.x1 - b.x1 || a.y1 - b.y1,
  );
  const out: PixelSegment[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (axis === "h") {
      const sameRow = Math.abs(n.y1 - cur.y1) <= mergeGapPx;
      const overlap = n.x1 <= cur.x2 + mergeGapPx && n.x2 >= cur.x1 - mergeGapPx;
      if (sameRow && overlap) {
        cur = {
          axis: "h",
          x1: Math.min(cur.x1, n.x1),
          x2: Math.max(cur.x2, n.x2),
          y1: (cur.y1 + n.y1) / 2,
          y2: (cur.y1 + n.y1) / 2,
        };
        continue;
      }
    } else {
      const sameCol = Math.abs(n.x1 - cur.x1) <= mergeGapPx;
      const overlap = n.y1 <= cur.y2 + mergeGapPx && n.y2 >= cur.y1 - mergeGapPx;
      if (sameCol && overlap) {
        cur = {
          axis: "v",
          x1: (cur.x1 + n.x1) / 2,
          x2: (cur.x1 + n.x1) / 2,
          y1: Math.min(cur.y1, n.y1),
          y2: Math.max(cur.y2, n.y2),
        };
        continue;
      }
    }
    out.push(cur);
    cur = { ...n };
  }
  out.push(cur);
  return out;
}

/** Find long horizontal/vertical ink runs (classical wall candidates). */
export function findAxisWallSegments(
  mask: BinaryMask,
  options: AxisSegmentOptions = {},
): PixelSegment[] {
  const minLengthPx = options.minLengthPx ?? 28;
  const mergeGapPx = options.mergeGapPx ?? 6;
  const { width: w, height: h, data } = mask;
  const horiz: PixelSegment[] = [];
  const vert: PixelSegment[] = [];

  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      while (x < w && !data[y * w + x]) x++;
      const x0 = x;
      while (x < w && data[y * w + x]) x++;
      if (x - x0 >= minLengthPx) {
        horiz.push({ axis: "h", x1: x0, y1: y, x2: x - 1, y2: y });
      }
    }
  }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      while (y < h && !data[y * w + x]) y++;
      const y0 = y;
      while (y < h && data[y * w + x]) y++;
      if (y - y0 >= minLengthPx) {
        vert.push({ axis: "v", x1: x, y1: y0, x2: x, y2: y - 1 });
      }
    }
  }

  return [
    ...mergeAxisRuns(horiz, "h", mergeGapPx),
    ...mergeAxisRuns(vert, "v", mergeGapPx),
  ];
}

export function inkBoundingBox(mask: BinaryMask): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const { width: w, height: h, data } = mask;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!data[y * w + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
}

export function inkRatio(mask: BinaryMask): number {
  let n = 0;
  for (let i = 0; i < mask.data.length; i++) n += mask.data[i];
  return n / Math.max(mask.data.length, 1);
}
