import { angleDeltaDeg, distMm, wallAngleDeg } from "./proposalGeom";
import type { ProposalPoint, ProposalWall } from "./proposalTypes";

export type MergeWallOptions = {
  /** Endpoints closer than this (mm) count as the same junction. Default 40. */
  junctionMm?: number;
  /** Max angle delta for collinear merge. Default 8. */
  collinearDeg?: number;
};

function samePoint(a: ProposalPoint, b: ProposalPoint, junctionMm: number): boolean {
  return distMm(a, b) <= junctionMm;
}

function wallLength(w: ProposalWall): number {
  return distMm(w.a, w.b);
}

/** True if walls share the same undirected segment (possibly reversed). */
function isDuplicate(a: ProposalWall, b: ProposalWall, junctionMm: number): boolean {
  return (
    (samePoint(a.a, b.a, junctionMm) && samePoint(a.b, b.b, junctionMm)) ||
    (samePoint(a.a, b.b, junctionMm) && samePoint(a.b, b.a, junctionMm))
  );
}

function projectParam(origin: ProposalPoint, dir: ProposalPoint, p: ProposalPoint): number {
  const dx = dir.x - origin.x;
  const dy = dir.y - origin.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return 0;
  return ((p.x - origin.x) * dx + (p.y - origin.y) * dy) / len2;
}

function perpDistToSegmentLine(p: ProposalPoint, a: ProposalPoint, b: ProposalPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return distMm(p, a);
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

function pointOnAxis(origin: ProposalPoint, dir: ProposalPoint, t: number): ProposalPoint {
  return {
    x: origin.x + (dir.x - origin.x) * t,
    y: origin.y + (dir.y - origin.y) * t,
  };
}

function tryMergePair(
  a: ProposalWall,
  b: ProposalWall,
  junctionMm: number,
  collinearDeg: number,
): ProposalWall | null {
  if (wallLength(a) < 1 || wallLength(b) < 1) return null;
  if (angleDeltaDeg(wallAngleDeg(a.a, a.b), wallAngleDeg(b.a, b.b)) > collinearDeg) return null;

  // Parallel but offset (opposite room sides) must not merge.
  const offset = Math.max(
    perpDistToSegmentLine(b.a, a.a, a.b),
    perpDistToSegmentLine(b.b, a.a, a.b),
  );
  if (offset > junctionMm) return null;

  const origin = a.a;
  const dir = a.b;
  const params = [
    projectParam(origin, dir, a.a),
    projectParam(origin, dir, a.b),
    projectParam(origin, dir, b.a),
    projectParam(origin, dir, b.b),
  ];
  const minT = Math.min(...params);
  const maxT = Math.max(...params);
  const aMin = Math.min(params[0], params[1]);
  const aMax = Math.max(params[0], params[1]);
  const bMin = Math.min(params[2], params[3]);
  const bMax = Math.max(params[2], params[3]);
  const gap = Math.max(aMin, bMin) - Math.min(aMax, bMax);
  const axisLen = wallLength(a);
  const gapMm = gap * axisLen;
  if (gapMm > junctionMm) return null;

  const thicknessMm = a.thicknessMm ?? b.thicknessMm;
  return {
    id: a.id,
    a: pointOnAxis(origin, dir, minT),
    b: pointOnAxis(origin, dir, maxT),
    ...(thicknessMm !== undefined ? { thicknessMm } : {}),
  };
}

export function mergeCollinearWalls(
  walls: ProposalWall[],
  options: MergeWallOptions = {},
): ProposalWall[] {
  const junctionMm = options.junctionMm ?? 40;
  const collinearDeg = options.collinearDeg ?? 8;
  const remaining = walls.map((w) => ({ ...w, a: { ...w.a }, b: { ...w.b } }));
  const result: ProposalWall[] = [];

  while (remaining.length) {
    let current = remaining.shift()!;
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < remaining.length; i++) {
        const other = remaining[i];
        if (isDuplicate(current, other, junctionMm)) {
          remaining.splice(i, 1);
          merged = true;
          break;
        }
        const combo = tryMergePair(current, other, junctionMm, collinearDeg);
        if (combo) {
          current = combo;
          remaining.splice(i, 1);
          merged = true;
          break;
        }
      }
    }
    result.push(current);
  }
  return result;
}
