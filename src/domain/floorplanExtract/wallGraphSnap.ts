import { GAP_CLOSE_M, L_JOIN_M, SNAP_TOL_M } from "./meters";
import type { WallGraphEdge, WallGraphNode } from "./types";

export function dist(x0: number, y0: number, x1: number, y1: number) {
  return Math.hypot(x1 - x0, y1 - y0);
}

export function projectOnSegment(
  px: number, py: number, ax: number, ay: number, bx: number, by: number,
): { x: number; y: number; on: boolean } {
  const abx = bx - ax, aby = by - ay;
  const den = abx * abx + aby * aby;
  if (den < 1e-18) return { x: ax, y: ay, on: false };
  const t = ((px - ax) * abx + (py - ay) * aby) / den;
  if (t <= 0 || t >= 1) return { x: ax + abx * t, y: ay + aby * t, on: false };
  return { x: ax + abx * t, y: ay + aby * t, on: true };
}

function unit(dx: number, dy: number): [number, number] {
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

function incident(edges: WallGraphEdge[], ni: number) {
  return edges.filter((e) => e.a === ni || e.b === ni);
}

function stemDir(nodes: WallGraphNode[], e: WallGraphEdge, ni: number): [number, number] {
  const other = e.a === ni ? e.b : e.a;
  return unit(nodes[other].x - nodes[ni].x, nodes[other].y - nodes[ni].y);
}

function lineIntersect(
  a: WallGraphNode, b: WallGraphNode, c: WallGraphNode, d: WallGraphNode,
): [number, number] | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  return [a.x + t * r.x, a.y + t * r.y];
}

function nextSplitSourceId(base: string, reserved: Set<string>): string {
  let n = 0;
  while (reserved.has(`${base}#${n}`)) n += 1;
  const id = `${base}#${n}`;
  reserved.add(id);
  return id;
}

/** Stretch dangling orthogonal stems onto through-walls, then split T-nodes. */
export function snapTJunctions(nodes: WallGraphNode[], edges: WallGraphEdge[], snapTol: number) {
  closeDanglingJunctions(nodes, edges);
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

function closeDanglingJunctions(nodes: WallGraphNode[], edges: WallGraphEdge[]) {
  const ortho = 0.35;
  let changed = true, guard = 0;
  while (changed && guard < 24) {
    changed = false;
    guard += 1;
    for (let ni = 0; ni < nodes.length; ni++) {
      const stems = incident(edges, ni);
      if (stems.length !== 1) continue;
      const n = nodes[ni];
      const sU = stemDir(nodes, stems[0], ni);
      for (const e of edges) {
        if (e.a === ni || e.b === ni) continue;
        const a = nodes[e.a], b = nodes[e.b];
        const eU = unit(b.x - a.x, b.y - a.y);
        if (Math.abs(sU[0] * eU[0] + sU[1] * eU[1]) > ortho) continue;
        const proj = projectOnSegment(n.x, n.y, a.x, a.y, b.x, b.y);
        if (!proj.on) continue;
        const d = dist(n.x, n.y, proj.x, proj.y);
        if (d < 1e-9 || d > GAP_CLOSE_M) continue;
        n.x = proj.x;
        n.y = proj.y;
        changed = true;
      }
    }
    changed = joinOrthogonalEnds(nodes, edges, ortho) || changed;
  }
}

function joinOrthogonalEnds(nodes: WallGraphNode[], edges: WallGraphEdge[], ortho: number) {
  let moved = false;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e0 = edges[i], e1 = edges[j];
      for (const ni of [e0.a, e0.b]) {
        if (incident(edges, ni).length !== 1) continue;
        for (const nj of [e1.a, e1.b]) {
          if (ni === nj || incident(edges, nj).length !== 1) continue;
          const a = nodes[e0.a], b = nodes[e0.b], c = nodes[e1.a], d = nodes[e1.b];
          const u0 = unit(b.x - a.x, b.y - a.y), u1 = unit(d.x - c.x, d.y - c.y);
          if (Math.abs(u0[0] * u1[0] + u0[1] * u1[1]) > ortho) continue;
          const hit = lineIntersect(a, b, c, d);
          if (!hit) continue;
          if (dist(nodes[ni].x, nodes[ni].y, hit[0], hit[1]) > L_JOIN_M) continue;
          if (dist(nodes[nj].x, nodes[nj].y, hit[0], hit[1]) > L_JOIN_M) continue;
          nodes[ni].x = hit[0];
          nodes[ni].y = hit[1];
          nodes[nj].x = hit[0];
          nodes[nj].y = hit[1];
          weldPair(nodes, edges, ni, nj);
          moved = true;
        }
      }
    }
  }
  return moved;
}

function weldPair(nodes: WallGraphNode[], edges: WallGraphEdge[], keep: number, drop: number) {
  if (keep === drop) return;
  nodes[keep].x = (nodes[keep].x + nodes[drop].x) / 2;
  nodes[keep].y = (nodes[keep].y + nodes[drop].y) / 2;
  for (const e of edges) {
    if (e.a === drop) e.a = keep;
    if (e.b === drop) e.b = keep;
  }
}

export function weldNearbyNodes(nodes: WallGraphNode[], edges: WallGraphEdge[], snap = SNAP_TOL_M) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y) > snap) continue;
      if (edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) continue;
      weldPair(nodes, edges, i, j);
    }
  }
  for (let i = edges.length - 1; i >= 0; i--) {
    if (edges[i].a === edges[i].b) edges.splice(i, 1);
  }
}
