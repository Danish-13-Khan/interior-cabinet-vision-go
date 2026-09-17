import type { DirectedWallUseM, WallGraph, WallGraphEdge } from "./types";

export type GraphFace = {
  wallUses: DirectedWallUseM[];
  area: number;
  ring: [number, number][];
};

function signedArea(ring: [number, number][]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a * 0.5;
}

export function pointInRing(px: number, py: number, ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const hit = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-18) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

type Out = { edge: WallGraphEdge; to: number; angle: number };

function outgoing(graph: WallGraph, kept: WallGraphEdge[], node: number): Out[] {
  const n = graph.nodes[node];
  const out: Out[] = [];
  for (const e of kept) {
    if (e.a !== node && e.b !== node) continue;
    const to = e.a === node ? e.b : e.a;
    const t = graph.nodes[to];
    out.push({ edge: e, to, angle: Math.atan2(t.y - n.y, t.x - n.x) });
  }
  return out.sort((a, b) => a.angle - b.angle);
}

/** Bounded CCW faces of the axis-aligned wall graph (exterior discarded). */
export function enumerateInteriorFaces(graph: WallGraph): GraphFace[] {
  const kept = graph.edges.filter((e) => e.role !== "dropped");
  const used = new Set<string>();
  const faces: GraphFace[] = [];
  const half = (id: number, from: number) => `${id}:${from}`;

  const walk = (start: WallGraphEdge, from: number) => {
    const uses: DirectedWallUseM[] = [];
    const ring: [number, number][] = [];
    let edge = start;
    let at = from;
    let closed = false;
    for (let step = 0; step < kept.length + 2; step++) {
      const to = edge.a === at ? edge.b : edge.a;
      used.add(half(edge.id, at));
      uses.push({
        wallSourceId: edge.sourceId,
        direction: edge.a === at ? "forward" : "reverse",
      });
      ring.push([graph.nodes[at].x, graph.nodes[at].y]);
      if (to === from && uses.length >= 3) {
        closed = true;
        break;
      }
      const outs = outgoing(graph, kept, to);
      if (!outs.length) return;
      const rev = outs.findIndex((o) => o.edge.id === edge.id && o.to === at);
      const next = outs[(Math.max(rev, 0) + 1) % outs.length];
      at = to;
      edge = next.edge;
    }
    const area = signedArea(ring);
    if (closed && area > 0.2 && uses.length >= 3) faces.push({ wallUses: uses, area, ring });
  };

  for (const e of kept) {
    if (!used.has(half(e.id, e.a))) walk(e, e.a);
    if (!used.has(half(e.id, e.b))) walk(e, e.b);
  }
  return faces;
}

export function ringCentroid(ring: [number, number][]): [number, number] {
  let x = 0, y = 0;
  for (const p of ring) { x += p[0]; y += p[1]; }
  const n = ring.length || 1;
  return [x / n, y / n];
}
