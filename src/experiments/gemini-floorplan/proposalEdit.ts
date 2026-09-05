import type { GeminiFloorProposal, ProposalPoint } from "./proposalTypes";

export function updateRoomName(
  proposal: GeminiFloorProposal,
  roomId: string,
  name: string,
): GeminiFloorProposal {
  return {
    ...proposal,
    rooms: proposal.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
  };
}

export function updateWallHeight(
  proposal: GeminiFloorProposal,
  assumedWallHeightMm: number,
): GeminiFloorProposal {
  if (!Number.isFinite(assumedWallHeightMm) || assumedWallHeightMm <= 0) return proposal;
  return { ...proposal, assumedWallHeightMm };
}

export function updateWallEndpoint(
  proposal: GeminiFloorProposal,
  wallId: string,
  end: "a" | "b",
  point: ProposalPoint,
): GeminiFloorProposal {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return proposal;
  return {
    ...proposal,
    walls: proposal.walls.map((w) =>
      w.id === wallId ? { ...w, [end]: { x: point.x, y: point.y } } : w,
    ),
  };
}
