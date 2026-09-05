import {
  angleDeltaDeg,
  clonePoint,
  nearestOrthoDeg,
  wallAngleDeg,
} from "./proposalGeom";
import type { GeminiFloorProposal, ProposalPoint, ProposalWall } from "./proposalTypes";

export type SnapOrthoOptions = {
  /** Degrees from 0/90 within which a wall is snapped. Default 10. */
  toleranceDeg?: number;
};

function snapSegment(
  a: ProposalPoint,
  b: ProposalPoint,
  toleranceDeg: number,
): { a: ProposalPoint; b: ProposalPoint } {
  const angle = wallAngleDeg(a, b);
  const target = nearestOrthoDeg(angle);
  if (angleDeltaDeg(angle, target) > toleranceDeg) {
    return { a: clonePoint(a), b: clonePoint(b) };
  }
  if (target === 0) {
    const y = (a.y + b.y) / 2;
    return { a: { x: a.x, y }, b: { x: b.x, y } };
  }
  const x = (a.x + b.x) / 2;
  return { a: { x, y: a.y }, b: { x, y: b.y } };
}

export function snapOrthoWall(wall: ProposalWall, options: SnapOrthoOptions = {}): ProposalWall {
  const toleranceDeg = options.toleranceDeg ?? 10;
  const snapped = snapSegment(wall.a, wall.b, toleranceDeg);
  return { ...wall, a: snapped.a, b: snapped.b };
}

export function snapOrthoOutline(
  outline: ProposalPoint[],
  options: SnapOrthoOptions = {},
): ProposalPoint[] {
  if (outline.length < 2) return outline.map(clonePoint);
  const toleranceDeg = options.toleranceDeg ?? 10;
  const out = outline.map(clonePoint);
  for (let i = 0; i < out.length; i++) {
    const j = (i + 1) % out.length;
    if (i === out.length - 1 && out.length < 3) break;
    // Only snap consecutive edges; for open polylines skip wrap unless closed-ish later.
    if (i === out.length - 1) continue;
    const snapped = snapSegment(out[i], out[j], toleranceDeg);
    out[i] = snapped.a;
    out[j] = snapped.b;
  }
  return out;
}

export function snapOrthoProposal(
  proposal: GeminiFloorProposal,
  options: SnapOrthoOptions = {},
): GeminiFloorProposal {
  return {
    ...proposal,
    walls: proposal.walls.map((w) => snapOrthoWall(w, options)),
    rooms: proposal.rooms.map((r) => ({
      ...r,
      outlineMm: snapOrthoOutline(r.outlineMm, options),
    })),
  };
}
