import { MIN_SEG_LEN_M, MIN_WALL_THICK_M, SNAP_TOL_M } from "./meters";
import type { ExtractPolygon, WallGraph, WallGraphEdge, WallGraphNode } from "./types";

function dist(x0: number, y0: number, x1: number, y1: number) {
  return Math.hypot(x1 - x0, y1 - y0);
}

/** True if any footprint edge is meaningfully non-axis-aligned. */
export function ringLooksDiagonal(outer: [number, number][]): boolean {
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i], b = outer[(i + 1) % outer.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    const ax = Math.abs(dx) / len, ay = Math.abs(dy) / len;
    // ~3°+ off-axis: both components significant (catches gentle skew AABB would flatten).
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

function projectOnSegment(
  px: number, py: number, ax: number, ay: number, bx: number, by: number,
): { x: number; y: number; on: boolean } {
  const abx = bx - ax, aby = by - ay;
  const den = abx * abx + aby * aby;
  if (den < 1e-18) return { x: ax, y: ay, on: false };
  const t = ((px - ax) * abx + (py - ay) * aby) / den;
  if (t <= 0 || t >= 1) return { x: ax + abx * t, y: ay + aby * t, on: false };
  return { x: ax + abx * t, y: ay + aby * t, on: true };
}

function nextSplitSourceId(base: string, reserved: Set<string>): string {
  let n = 0;
  while (reserved.has(`${base}#${n}`)) n += 1;
  const id = `${base}#${n}`;
  reserved.add(id);
  return id;
}

function snapTJunctions(nodes: WallGraphNode[], edges: WallGraphEdge[], snapTol: number) {
  const reserved = new Set(edges.map((e) => e.sourceId));
  let changed = true, guard = 0;
  while (changed && guard < 64) {
    changed = false;
    guard += 1;
    for (let ni = 0; ni < nodes.length; ni++) {
      const n = nodes[ni];
      for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei];
        if (e.a === ni || e.b === ni) continue;
        const a = nodes[e.a], b = nodes[e.b];
        const proj = projectOnSegment(n.x, n.y, a.x, a.y, b.x, b.y);
        if (!proj.on) continue;
        if (dist(n.x, n.y, proj.x, proj.y) > snapTol) continue;
        if (dist(proj.x, proj.y, a.x, a.y) < snapTol || dist(proj.x, proj.y, b.x, b.y) < snapTol) {
          continue;
        }
        nodes[ni].x = proj.x;
        nodes[ni].y = proj.y;
        const thick = e.thickM, sid = e.sourceId, flags = {
          thickened: e.thickened, diagonalCollapsed: e.diagonalCollapsed, role: e.role,
        };
        reserved.add(sid);
        const sidB = nextSplitSourceId(sid.split("#")[0] ?? sid, reserved);
        edges[ei] = {
          id: e.id, a: e.a, b: ni, thickM: thick,
          lengthM: dist(a.x, a.y, proj.x, proj.y),
          role: flags.role, sourceId: sid,
          thickened: flags.thickened, diagonalCollapsed: flags.diagonalCollapsed,
        };
        edges.push({
          id: edges.length, a: ni, b: e.b, thickM: thick,
          lengthM: dist(proj.x, proj.y, b.x, b.y),
          role: flags.role, sourceId: sidB,
          thickened: flags.thickened, diagonalCollapsed: flags.diagonalCollapsed,
        });
        changed = true;
        break;
      }
      if (changed) break;
    }
  }
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
    if (find(e.a) !== bestRoot) e.role = "dropped";
    else e.role = "interior";
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
  for (const e of edges) {
    const na = nodes[e.a], nb = nodes[e.b];
    e.lengthM = dist(na.x, na.y, nb.x, nb.y);
  }
  markFloatingDropped(nodes, edges);
  return { nodes, edges, snap };
}
