import { wallLengthMm } from "./proposalBounds";
import type { GeminiFloorProposal, ProposalPoint } from "./proposalTypes";

function scalePoint(p: ProposalPoint, factor: number): ProposalPoint {
  return { x: p.x * factor, y: p.y * factor };
}

/** Uniformly scale plan coordinates and linear sizes (keeps units mm). */
export function applyUniformScaleMm(
  proposal: GeminiFloorProposal,
  factor: number,
): GeminiFloorProposal {
  if (!Number.isFinite(factor) || factor <= 0) return proposal;
  return {
    ...proposal,
    units: "mm",
    rooms: proposal.rooms.map((room) => ({
      ...room,
      outlineMm: room.outlineMm.map((p) => scalePoint(p, factor)),
    })),
    walls: proposal.walls.map((wall) => ({
      ...wall,
      a: scalePoint(wall.a, factor),
      b: scalePoint(wall.b, factor),
      thicknessMm:
        wall.thicknessMm === undefined ? undefined : wall.thicknessMm * factor,
    })),
    openings: proposal.openings?.map((op) => ({
      ...op,
      widthMm: op.widthMm === undefined ? undefined : op.widthMm * factor,
      heightMm: op.heightMm === undefined ? undefined : op.heightMm * factor,
    })),
  };
}

export type CalibrateResult =
  | { ok: true; proposal: GeminiFloorProposal; factor: number }
  | { ok: false; error: string };

/** Scale whole plan so selected wall matches a known measured length. */
export function calibrateByWallLength(
  proposal: GeminiFloorProposal,
  wallId: string,
  knownLengthMm: number,
): CalibrateResult {
  if (!Number.isFinite(knownLengthMm) || knownLengthMm <= 0) {
    return { ok: false, error: "Known length must be a positive number (mm)." };
  }
  const wall = proposal.walls.find((w) => w.id === wallId);
  if (!wall) return { ok: false, error: `Wall “${wallId}” not found.` };
  const current = wallLengthMm(wall);
  if (current < 1e-6) return { ok: false, error: "Selected wall has zero length." };
  const factor = knownLengthMm / current;
  return {
    ok: true,
    factor,
    proposal: {
      ...applyUniformScaleMm(proposal, factor),
      scaleConfidence: "high",
      notes: [
        ...(proposal.notes ?? []),
        `Calibrated wall ${wallId}: ${Math.round(current)} → ${Math.round(knownLengthMm)} mm (×${factor.toFixed(4)}).`,
      ],
    },
  };
}
