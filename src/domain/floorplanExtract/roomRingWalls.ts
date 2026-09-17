import { MIN_SEG_LEN_M, MIN_WALL_THICK_M } from "./meters";
import type { ExtractPolygon } from "./types";

function ringArea(ring: [number, number][]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a) * 0.5;
}

/** Axis-aligned wall strips from a room footprint when extract walls cannot close. */
export function wallPolygonsFromRing(
  ring: [number, number][],
  idPrefix: string,
  thick = MIN_WALL_THICK_M,
): ExtractPolygon[] {
  if (ring.length < 3 || ringArea(ring) < 0.5) return [];
  const half = thick / 2;
  const out: ExtractPolygon[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < MIN_SEG_LEN_M) continue;
    const ax = Math.abs(dx) / len, ay = Math.abs(dy) / len;
    if (Math.min(ax, ay) > 0.05) continue;
    const id = `${idPrefix}:edge-${i}`;
    if (ax >= ay) {
      const y = (a[1] + b[1]) * 0.5;
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]);
      out.push({ id, outer: [[x0, y - half], [x1, y - half], [x1, y + half], [x0, y + half]] });
    } else {
      const x = (a[0] + b[0]) * 0.5;
      const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      out.push({ id, outer: [[x - half, y0], [x + half, y0], [x + half, y1], [x - half, y1]] });
    }
  }
  return out.length >= 3 ? out : [];
}
