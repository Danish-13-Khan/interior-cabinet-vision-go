import type { GeminiFloorProposal, ProposalPoint, ProposalUnits } from "./proposalTypes";

const TO_MM: Record<ProposalUnits, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

function scalePoint(p: ProposalPoint, factor: number): ProposalPoint {
  return { x: p.x * factor, y: p.y * factor };
}

/** Convert proposal coordinates and sizes into mm; sets units to "mm". */
export function normalizeProposalToMm(proposal: GeminiFloorProposal): GeminiFloorProposal {
  const factor = TO_MM[proposal.units];
  if (factor === 1 && proposal.units === "mm") return proposal;

  return {
    ...proposal,
    units: "mm",
    assumedWallHeightMm:
      proposal.units === "mm"
        ? proposal.assumedWallHeightMm
        : proposal.assumedWallHeightMm * factor,
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
