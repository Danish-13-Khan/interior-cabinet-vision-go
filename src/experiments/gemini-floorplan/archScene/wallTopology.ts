import { distMm } from "../proposalGeom";
import type { ArchPoint, ArchitecturalWall, JunctionKind, WallJunction } from "./archSceneTypes";

export type TopologyOptions = {
  /** Endpoints within this distance share a junction. Default 80. */
  junctionMm?: number;
};

function roundPt(p: ArchPoint, step = 1): ArchPoint {
  return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
}

function keyOf(p: ArchPoint, junctionMm: number): string {
  const q = Math.max(1, Math.round(junctionMm / 2));
  return `${Math.round(p.x / q) * q},${Math.round(p.y / q) * q}`;
}

function classifyJunction(degree: number): JunctionKind {
  if (degree <= 1) return "end";
  if (degree === 2) return "corner";
  if (degree === 3) return "T";
  if (degree >= 4) return "X";
  return "unknown";
}

export type WallTopology = {
  walls: ArchitecturalWall[];
  junctions: WallJunction[];
};

/**
 * Phase 7: snap wall endpoints into shared junctions and build adjacency.
 */
export function buildWallTopology(
  wallsIn: ArchitecturalWall[],
  options: TopologyOptions = {},
): WallTopology {
  const junctionMm = options.junctionMm ?? 80;
  const buckets = new Map<string, { point: ArchPoint; wallEnds: Array<{ wallId: string; end: "start" | "end" }> }>();

  const walls = wallsIn.map((w) => ({
    ...w,
    start: roundPt(w.start),
    end: roundPt(w.end),
    openingIds: [...w.openingIds],
  }));

  function touch(wallId: string, end: "start" | "end", p: ArchPoint) {
    const k = keyOf(p, junctionMm);
    let b = buckets.get(k);
    if (!b) {
      b = { point: p, wallEnds: [] };
      buckets.set(k, b);
    } else {
      // Average into cluster center
      const n = b.wallEnds.length + 1;
      b.point = {
        x: (b.point.x * (n - 1) + p.x) / n,
        y: (b.point.y * (n - 1) + p.y) / n,
      };
    }
    b.wallEnds.push({ wallId, end });
  }

  for (const w of walls) {
    touch(w.id, "start", w.start);
    touch(w.id, "end", w.end);
  }

  const junctions: WallJunction[] = [];
  let ji = 0;
  const wallPatch = new Map<string, Partial<ArchitecturalWall>>();

  for (const b of buckets.values()) {
    ji += 1;
    const id = `j${ji}`;
    const wallIds = [...new Set(b.wallEnds.map((e) => e.wallId))];
    const point = roundPt(b.point);
    junctions.push({
      id,
      point,
      kind: classifyJunction(wallIds.length),
      wallIds,
    });
    for (const { wallId, end } of b.wallEnds) {
      const prev = wallPatch.get(wallId) ?? {};
      if (end === "start") {
        wallPatch.set(wallId, { ...prev, start: point, junctionStartId: id });
      } else {
        wallPatch.set(wallId, { ...prev, end: point, junctionEndId: id });
      }
    }
  }

  const outWalls = walls.map((w) => {
    const patch = wallPatch.get(w.id);
    return patch ? { ...w, ...patch } : w;
  });

  return { walls: outWalls, junctions };
}

/** Adjacency: walls that share a junction. */
export function wallAdjacency(junctions: WallJunction[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>();
  for (const j of junctions) {
    for (const a of j.wallIds) {
      if (!map.has(a)) map.set(a, new Set());
      for (const b of j.wallIds) {
        if (a !== b) map.get(a)!.add(b);
      }
    }
  }
  const out = new Map<string, string[]>();
  for (const [k, v] of map) out.set(k, [...v]);
  return out;
}

export function joinWallEndpoints(
  walls: ArchitecturalWall[],
  wallIdA: string,
  endA: "start" | "end",
  wallIdB: string,
  endB: "start" | "end",
): ArchitecturalWall[] {
  const a = walls.find((w) => w.id === wallIdA);
  const b = walls.find((w) => w.id === wallIdB);
  if (!a || !b) return walls;
  const pa = endA === "start" ? a.start : a.end;
  const pb = endB === "start" ? b.start : b.end;
  const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
  return walls.map((w) => {
    if (w.id === wallIdA) {
      return endA === "start" ? { ...w, start: mid } : { ...w, end: mid };
    }
    if (w.id === wallIdB) {
      return endB === "start" ? { ...w, start: mid } : { ...w, end: mid };
    }
    return w;
  });
}

export function splitWallAt(
  walls: ArchitecturalWall[],
  wallId: string,
  point: ArchPoint,
): ArchitecturalWall[] {
  const w = walls.find((x) => x.id === wallId);
  if (!w) return walls;
  if (distMm(w.start, point) < 1 || distMm(w.end, point) < 1) return walls;
  const a: ArchitecturalWall = {
    ...w,
    id: `${w.id}-a`,
    end: point,
    openingIds: [],
  };
  const b: ArchitecturalWall = {
    ...w,
    id: `${w.id}-b`,
    start: point,
    openingIds: [],
  };
  return walls.filter((x) => x.id !== wallId).concat([a, b]);
}
