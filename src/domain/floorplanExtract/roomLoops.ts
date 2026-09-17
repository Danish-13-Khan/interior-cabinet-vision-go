import type { DirectedWallUseM, ExtractPolygon, RoomLoopMatch, WallGraph, WallGraphEdge } from "./types";
import { enumerateInteriorFaces, pointInRing, ringCentroid } from "./roomLoopsFaces";

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
    let best = Infinity;
    for (const p of [[na.x, na.y], [nb.x, nb.y], [(na.x + nb.x) * 0.5, (na.y + nb.y) * 0.5]] as [number, number][]) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        best = Math.min(best, distToSeg(p[0], p[1], a[0], a[1], b[0], b[1]));
      }
    }
    if (best <= graph.snap + e.thickM * 0.5) out.push(e);
  }
  return out;
}

/** Simple cycles among candidates; prefer a cycle whose wall count matches the ring. */
function walkClosedCycle(candidates: WallGraphEdge[], ringVerts: number): DirectedWallUseM[] | null {
  if (candidates.length < 3) return null;
  const incident = new Map<number, WallGraphEdge[]>();
  for (const e of candidates) {
    incident.set(e.a, [...(incident.get(e.a) ?? []), e]);
    incident.set(e.b, [...(incident.get(e.b) ?? []), e]);
  }
  const found: DirectedWallUseM[][] = [];
  const search = (origin: number, at: number, uses: DirectedWallUseM[], used: Set<number>) => {
    if (found.length > 32 || uses.length > 16) return;
    if (at === origin && uses.length >= 3) { found.push(uses); return; }
    if (uses.length >= candidates.length) return;
    for (const edge of incident.get(at) ?? []) {
      if (used.has(edge.id)) continue;
      const next = edge.a === at ? edge.b : edge.a;
      search(origin, next, [...uses, {
        wallSourceId: edge.sourceId,
        direction: edge.a === at ? "forward" : "reverse",
      }], new Set([...used, edge.id]));
    }
  };
  for (const start of candidates) {
    search(start.a, start.b, [{ wallSourceId: start.sourceId, direction: "forward" }], new Set([start.id]));
  }
  const target = Math.max(3, ringVerts);
  let best: DirectedWallUseM[] | null = null, bestScore = Infinity;
  for (const cycle of found) {
    const ids = new Set(cycle.map((u) => u.wallSourceId));
    if (ids.size !== cycle.length) continue;
    const s = Math.abs(cycle.length - target) * 10 + cycle.length;
    if (s < bestScore) { bestScore = s; best = cycle; }
  }
  return best;
}

function matchFromCandidates(ring: [number, number][], graph: WallGraph): RoomLoopMatch {
  const candidates = candidateEdges(ring, graph);
  if (candidates.length < 3) {
    return { status: "unmatched", reason: "fewer than 3 walls near room boundary" };
  }
  const wallUses = walkClosedCycle(candidates, ring.length);
  if (!wallUses) {
    return { status: "unmatched", reason: "walls near room are not a closed directed loop" };
  }
  return { status: "matched", wallUses, holeMatches: [] };
}

function matchRing(ring: [number, number][], graph: WallGraph): RoomLoopMatch {
  if (ring.length < 3) return { status: "unmatched", reason: "ring too small" };
  const [cx, cy] = ringCentroid(ring);
  const face = enumerateInteriorFaces(graph)
    .filter((f) => pointInRing(cx, cy, f.ring))
    .sort((a, b) => a.area - b.area)[0];
  if (face && face.wallUses.length >= 3) {
    return { status: "matched", wallUses: face.wallUses, holeMatches: [] };
  }
  return matchFromCandidates(ring, graph);
}

export function matchRooms(rooms: ExtractPolygon[], graph: WallGraph): Record<string, RoomLoopMatch> {
  const faces = enumerateInteriorFaces(graph);
  const claimed = new Set<number>();
  const ranked = rooms.map((room) => {
    const [cx, cy] = ringCentroid(room.outer as [number, number][]);
    const hits = faces
      .map((f, fi) => ({ fi, f }))
      .filter(({ f }) => pointInRing(cx, cy, f.ring))
      .sort((a, b) => a.f.area - b.f.area);
    return { room, hits };
  }).sort((a, b) => (a.hits[0]?.f.area ?? Infinity) - (b.hits[0]?.f.area ?? Infinity));

  const out: Record<string, RoomLoopMatch> = {};
  for (const row of ranked) {
    const id = row.room.id ?? "room";
    const free = row.hits.find((h) => !claimed.has(h.fi));
    if (free && free.f.wallUses.length >= 3) {
      claimed.add(free.fi);
      const holeMatches = (row.room.holes ?? []).map((hole) => matchRing(hole as [number, number][], graph));
      out[id] = { status: "matched", wallUses: free.f.wallUses, holeMatches };
      continue;
    }
    out[id] = matchFromCandidates(row.room.outer as [number, number][], graph);
  }
  return out;
}
