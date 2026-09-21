export type DwgClipBox = { minX: number; maxX: number; minY: number; maxY: number };
export type DwgClipPoint = { x: number; y: number };
export type DwgClipSegment = { a: DwgClipPoint; b: DwgClipPoint };

/** Liang–Barsky clip of a segment to an axis-aligned box. Inclusive on the boundary. */
export function clipSegmentToBox(
  a: DwgClipPoint,
  b: DwgClipPoint,
  box: DwgClipBox,
): DwgClipSegment | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (Math.abs(p) < 1e-12) return q >= -1e-12;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (
    !clip(-dx, a.x - box.minX)
    || !clip(dx, box.maxX - a.x)
    || !clip(-dy, a.y - box.minY)
    || !clip(dy, box.maxY - a.y)
  ) return null;
  return {
    a: { x: a.x + t0 * dx, y: a.y + t0 * dy },
    b: { x: a.x + t1 * dx, y: a.y + t1 * dy },
  };
}
