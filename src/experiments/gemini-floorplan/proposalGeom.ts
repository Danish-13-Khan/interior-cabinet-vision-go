import type { ProposalPoint } from "./proposalTypes";

export function distMm(a: ProposalPoint, b: ProposalPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function midPoint(a: ProposalPoint, b: ProposalPoint): ProposalPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Undirected wall angle in degrees, range [0, 180). */
export function wallAngleDeg(a: ProposalPoint, b: ProposalPoint): number {
  let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (deg < 0) deg += 180;
  if (deg >= 180) deg -= 180;
  return deg;
}

export function angleDeltaDeg(a: number, b: number): number {
  let d = Math.abs(a - b) % 180;
  if (d > 90) d = 180 - d;
  return d;
}

export function nearestOrthoDeg(angleDeg: number): 0 | 90 {
  return angleDeltaDeg(angleDeg, 0) <= angleDeltaDeg(angleDeg, 90) ? 0 : 90;
}

export function clonePoint(p: ProposalPoint): ProposalPoint {
  return { x: p.x, y: p.y };
}
