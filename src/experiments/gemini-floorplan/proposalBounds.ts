import type { GeminiFloorProposal, ProposalPoint, ProposalWall } from "./proposalTypes";

export type ProposalBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

function collectPoints(proposal: GeminiFloorProposal): ProposalPoint[] {
  const pts: ProposalPoint[] = [];
  for (const wall of proposal.walls) {
    pts.push(wall.a, wall.b);
  }
  for (const room of proposal.rooms) {
    pts.push(...room.outlineMm);
  }
  return pts;
}

export function proposalBounds(proposal: GeminiFloorProposal): ProposalBounds | null {
  const pts = collectPoints(proposal);
  if (!pts.length) return null;
  let minX = pts[0].x;
  let minY = pts[0].y;
  let maxX = pts[0].x;
  let maxY = pts[0].y;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  return { minX, minY, maxX, maxY, width, height };
}

export function wallLengthMm(wall: ProposalWall): number {
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  return Math.hypot(dx, dy);
}

/** SVG viewBox string with padding around proposal bounds. */
export function proposalViewBox(proposal: GeminiFloorProposal, padRatio = 0.08): string | null {
  const b = proposalBounds(proposal);
  if (!b) return null;
  const pad = Math.max(b.width, b.height) * padRatio;
  return `${b.minX - pad} ${b.minY - pad} ${b.width + pad * 2} ${b.height + pad * 2}`;
}
