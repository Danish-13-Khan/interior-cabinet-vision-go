import { OPENING_END_TOL_M } from "./meters";
import type { ExtractPolygon, OpeningAttachment, WallGraph } from "./types";

function aabb(outer: [number, number][]) {
  let minX = outer[0][0], minY = outer[0][1], maxX = minX, maxY = minY;
  for (const p of outer) {
    minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
  }
  return { minX, minY, maxX, maxY, dx: maxX - minX, dy: maxY - minY };
}

/** Attach openings with orientation + full containment (OPENING_END_TOL_M). */
export function attachOpenings(
  openings: ExtractPolygon[],
  graph: WallGraph,
): Record<string, OpeningAttachment> {
  const out: Record<string, OpeningAttachment> = {};
  for (const op of openings) {
    const id = op.id ?? "opening";
    if (!op.outer?.length) {
      out[id] = { status: "unmatched", reason: "missing outer" };
      continue;
    }
    const box = aabb(op.outer as [number, number][]);
    const horizontal = box.dx >= box.dy;
    const t0 = horizontal ? box.minX : box.minY;
    const t1 = horizontal ? box.maxX : box.maxY;
    const cy = horizontal ? (box.minY + box.maxY) * 0.5 : (box.minX + box.maxX) * 0.5;

    type Cand = { edge: (typeof graph.edges)[0]; perp: number; overshoot: number };
    const cands: Cand[] = [];
    for (const e of graph.edges) {
      if (e.role === "dropped") continue;
      const na = graph.nodes[e.a], nb = graph.nodes[e.b];
      const edgeH = Math.abs(na.y - nb.y) < Math.abs(na.x - nb.x);
      if (edgeH !== horizontal) continue;
      const w0 = horizontal ? Math.min(na.x, nb.x) : Math.min(na.y, nb.y);
      const w1 = horizontal ? Math.max(na.x, nb.x) : Math.max(na.y, nb.y);
      const perp = horizontal
        ? Math.abs(((na.y + nb.y) * 0.5) - cy)
        : Math.abs(((na.x + nb.x) * 0.5) - cy);
      if (perp > graph.snap) continue;
      const low = Math.min(t0, t1), high = Math.max(t0, t1);
      const overshootLow = Math.max(0, w0 - low);
      const overshootHigh = Math.max(0, high - w1);
      const overshoot = Math.max(overshootLow, overshootHigh);
      if (overshoot > OPENING_END_TOL_M) continue; // not fully contained within tolerance
      cands.push({ edge: e, perp, overshoot });
    }
    cands.sort((a, b) => a.perp - b.perp || a.overshoot - b.overshoot);
    if (cands.length === 0) {
      out[id] = { status: "unmatched", reason: "no host wall fully contains opening" };
      continue;
    }
    if (cands.length > 1 && Math.abs(cands[0].perp - cands[1].perp) < 1e-4) {
      out[id] = { status: "ambiguous", reason: "multiple host walls" };
      continue;
    }
    const best = cands[0];
    const na = graph.nodes[best.edge.a], nb = graph.nodes[best.edge.b];
    const w0 = horizontal ? Math.min(na.x, nb.x) : Math.min(na.y, nb.y);
    const w1 = horizontal ? Math.max(na.x, nb.x) : Math.max(na.y, nb.y);
    const trimmedLow = Math.max(Math.min(t0, t1), w0);
    const trimmedHigh = Math.min(Math.max(t0, t1), w1);
    const widthM = trimmedHigh - trimmedLow;
    // Do not invent length past the host — reject tiny/empty remaining intervals.
    if (!(widthM > 1e-6)) {
      out[id] = { status: "unmatched", reason: "insufficient width remains inside host wall after trim" };
      continue;
    }
    // Re-check full containment of the trimmed interval within host (+ tol already applied upstream).
    if (trimmedLow < w0 - 1e-9 || trimmedHigh > w1 + 1e-9) {
      out[id] = { status: "unmatched", reason: "trimmed opening extends outside host wall" };
      continue;
    }
    const trimmed = best.overshoot > 0;
    out[id] = {
      status: "matched",
      wallSourceId: best.edge.sourceId,
      offsetM: trimmedLow - w0,
      widthM,
      trimmed,
    };
  }
  return out;
}
