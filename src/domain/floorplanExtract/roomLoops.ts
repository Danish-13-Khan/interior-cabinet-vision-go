import type { DirectedWallUseM, ExtractPolygon, RoomLoopMatch, WallGraph, WallGraphEdge } from "./types";

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const abx = bx - ax, aby = by - ay;
  const den = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / den));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function candidateEdges(ring: [number, number][], graph: WallGraph): WallGraphEdge[] {
  const kept = graph.edges.filter((e) => e.role !== "dropped");
  const out: WallGraphEdge[] = [];
  for (const e of kept) {
    const na = graph.nodes[e.a], nb = graph.nodes[e.b];
    const midX = (na.x + nb.x) * 0.5, midY = (na.y + nb.y) * 0.5;
    let best = Infinity;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      best = Math.min(best, distToSeg(midX, midY, a[0], a[1], b[0], b[1]));
    }
    if (best <= graph.snap + e.thickM * 0.5) out.push(e);
  }
  return out;
}

/** Walk shared nodes among candidate edges; require a simple closed cycle. */
function walkClosedCycle(candidates: WallGraphEdge[]): DirectedWallUseM[] | null {
  if (candidates.length < 3) return null;
  const incident = new Map<number, WallGraphEdge[]>();
  for (const e of candidates) {
    incident.set(e.a, [...(incident.get(e.a) ?? []), e]);
    incident.set(e.b, [...(incident.get(e.b) ?? []), e]);
  }

  const tryStart = (startEdge: WallGraphEdge, forward: boolean): DirectedWallUseM[] | null => {
    const uses: DirectedWallUseM[] = [];
    const used = new Set<number>();
    let edge = startEdge;
    let from = forward ? edge.a : edge.b;
    let to = forward ? edge.b : edge.a;
    const origin = from;
    for (let step = 0; step < candidates.length + 1; step++) {
      uses.push({
        wallSourceId: edge.sourceId,
        direction: edge.a === from ? "forward" : "reverse",
      });
      used.add(edge.id);
      if (to === origin && uses.length >= 3) {
        return used.size === candidates.length ? uses : null;
      }
      const nextOpts = (incident.get(to) ?? []).filter((e) => !used.has(e.id));
      if (nextOpts.length === 0) return null;
      // Prefer continuing with a single unused edge; if branching, try first then fail closed.
      edge = nextOpts[0];
      from = to;
      to = edge.a === from ? edge.b : edge.a;
    }
    return null;
  };

  let best: DirectedWallUseM[] | null = null;
  for (const start of candidates) {
    for (const forward of [true, false]) {
      const cycle = tryStart(start, forward);
      if (!cycle) continue;
      // Must close and be contiguous unique walls
      if (cycle.length < 3) continue;
      const ids = new Set(cycle.map((u) => u.wallSourceId));
      if (ids.size !== cycle.length) continue;
      if (!best || cycle.length > best.length) best = cycle;
    }
  }
  // Require a closed cycle that uses every candidate (no dangling near-miss walls).
  if (!best) return null;
  if (best.length !== candidates.length) return null;
  return best;
}

function matchRing(ring: [number, number][], graph: WallGraph): RoomLoopMatch {
  if (ring.length < 3) return { status: "unmatched", reason: "ring too small" };
  const candidates = candidateEdges(ring, graph);
  if (candidates.length < 3) {
    return { status: "unmatched", reason: "fewer than 3 walls near room boundary" };
  }
  const wallUses = walkClosedCycle(candidates);
  if (!wallUses) {
    return { status: "unmatched", reason: "walls near room are not a closed directed loop" };
  }
  return { status: "matched", wallUses, holeMatches: [] };
}

export function matchRooms(rooms: ExtractPolygon[], graph: WallGraph): Record<string, RoomLoopMatch> {
  const out: Record<string, RoomLoopMatch> = {};
  for (const room of rooms) {
    const id = room.id ?? "room";
    const outer = matchRing(room.outer as [number, number][], graph);
    if (outer.status !== "matched") {
      out[id] = outer;
      continue;
    }
    const holeMatches: RoomLoopMatch[] = [];
    for (const hole of room.holes ?? []) {
      holeMatches.push(matchRing(hole as [number, number][], graph));
    }
    out[id] = { ...outer, holeMatches };
  }
  return out;
}
