import { MIN_SEG_LEN_M, MIN_WALL_THICK_M, SNAP_TOL_M } from "./meters";
import { dist, snapTJunctions, weldNearbyNodes } from "./wallGraphSnap";
import type { ExtractPolygon, WallGraph, WallGraphEdge, WallGraphNode } from "./types";

/** True if any footprint edge is meaningfully non-axis-aligned. */
export function ringLooksDiagonal(outer: [number, number][]): boolean {
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i], b = outer[(i + 1) % outer.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    const ax = Math.abs(dx) / len, ay = Math.abs(dy) / len;
    if (Math.min(ax, ay) > 0.05) return true;
  }
  return false;
}

export function centerlineFromWall(outer: [number, number][]): {
  a: [number, number]; b: [number, number]; thick: number; ok: boolean; diagonalCollapsed: boolean;
} {
  if (outer.length < 2) return { a: [0, 0], b: [0, 0], thick: 0, ok: false, diagonalCollapsed: false };
  let minX = outer[0][0], minY = outer[0][1], maxX = minX, maxY = minY;
  for (const p of outer) {
    minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
    maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
  }
  const dx = maxX - minX, dy = maxY - minY;
  if (dx < 1e-9 && dy < 1e-9) return { a: [0, 0], b: [0, 0], thick: 0, ok: false, diagonalCollapsed: false };
  const diagonalCollapsed = ringLooksDiagonal(outer);
  if (dx >= dy) {
    let thick = dy;
    if (thick < 1e-6) thick = MIN_WALL_THICK_M;
    return { a: [minX, (minY + maxY) * 0.5], b: [maxX, (minY + maxY) * 0.5], thick, ok: true, diagonalCollapsed };
  }
  let thick = dx;
  if (thick < 1e-6) thick = MIN_WALL_THICK_M;
  return { a: [(minX + maxX) * 0.5, minY], b: [(minX + maxX) * 0.5, maxY], thick, ok: true, diagonalCollapsed };
}

function markFloatingDropped(nodes: WallGraphNode[], edges: WallGraphEdge[]) {
  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const unite = (a: number, b: number) => { parent[find(a)] = find(b); };
  for (const e of edges) unite(e.a, e.b);
  const lenBy = new Map<number, number>();
  for (const e of edges) {
    const r = find(e.a);
    lenBy.set(r, (lenBy.get(r) ?? 0) + e.lengthM);
  }
  let bestRoot = -1, bestLen = -1;
  for (const [r, len] of lenBy) {
    if (len > bestLen) { bestLen = len; bestRoot = r; }
  }
  for (const e of edges) {
    e.role = find(e.a) !== bestRoot ? "dropped" : "interior";
  }
}

export function buildWallGraph(walls: ExtractPolygon[], snapTol = SNAP_TOL_M, minSegLen = MIN_SEG_LEN_M): WallGraph {
  const nodes: WallGraphNode[] = [];
  const edges: WallGraphEdge[] = [];
  const snap = snapTol > 0 ? snapTol : SNAP_TOL_M;
  const minLen = minSegLen > 0 ? minSegLen : MIN_SEG_LEN_M;

  const nodeOf = (p: [number, number]) => {
    let best = -1, bestD = snap;
    for (let i = 0; i < nodes.length; i++) {
      const d = dist(p[0], p[1], nodes[i].x, nodes[i].y);
      if (d <= bestD) { bestD = d; best = i; }
    }
    if (best >= 0) {
      nodes[best].x = (nodes[best].x * 2 + p[0]) / 3;
      nodes[best].y = (nodes[best].y * 2 + p[1]) / 3;
      return best;
    }
    const id = nodes.length;
    nodes.push({ id, x: p[0], y: p[1] });
    return id;
  };

  for (const w of walls) {
    const cl = centerlineFromWall(w.outer as [number, number][]);
    if (!cl.ok) continue;
    const ai = nodeOf(cl.a), bi = nodeOf(cl.b);
    if (ai === bi) continue;
    if (edges.some((e) => (e.a === ai && e.b === bi) || (e.a === bi && e.b === ai))) continue;
    const lengthM = dist(nodes[ai].x, nodes[ai].y, nodes[bi].x, nodes[bi].y);
    if (lengthM < minLen) continue;
    let thick = cl.thick;
    const thickened = thick < MIN_WALL_THICK_M;
    if (thickened) thick = MIN_WALL_THICK_M;
    edges.push({
      id: edges.length, a: ai, b: bi, thickM: thick, lengthM,
      role: "interior", sourceId: w.id ?? `wall-${edges.length}`,
      thickened, diagonalCollapsed: cl.diagonalCollapsed,
    });
  }

  snapTJunctions(nodes, edges, snap);
  weldNearbyNodes(nodes, edges, snap);
  for (let i = 0; i < edges.length; i++) edges[i].id = i;
  for (const e of edges) {
    const na = nodes[e.a], nb = nodes[e.b];
    e.lengthM = dist(na.x, na.y, nb.x, nb.y);
  }
  markFloatingDropped(nodes, edges);
  return { nodes, edges, snap };
}
