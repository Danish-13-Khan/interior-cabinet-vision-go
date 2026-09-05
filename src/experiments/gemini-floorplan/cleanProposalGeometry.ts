import { closeRoomLoops, type CloseLoopOptions } from "./closeRoomLoops";
import type { GeometryViewMode } from "./geometryMode";
import { mergeCollinearWalls, type MergeWallOptions } from "./mergeCollinearWalls";
import { snapOrthoProposal, type SnapOrthoOptions } from "./snapOrthoGeometry";
import type { GeminiFloorProposal } from "./proposalTypes";

export type { GeometryViewMode } from "./geometryMode";

export type CleanProposalOptions = SnapOrthoOptions &
  MergeWallOptions &
  CloseLoopOptions & {
    /** Append a short note when geometry changes. Default true. */
    annotateNotes?: boolean;
  };

function wallKey(p: GeminiFloorProposal): string {
  return p.walls
    .map((w) => `${w.id}:${w.a.x.toFixed(1)},${w.a.y.toFixed(1)}-${w.b.x.toFixed(1)},${w.b.y.toFixed(1)}`)
    .join("|");
}

function roomKey(p: GeminiFloorProposal): string {
  return p.rooms
    .map(
      (r) =>
        `${r.id}:` +
        r.outlineMm.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(";"),
    )
    .join("|");
}

/** Phase 6A: ortho snap → merge collinear/duplicate walls → close room loops. */
export function cleanProposalGeometry(
  proposal: GeminiFloorProposal,
  options: CleanProposalOptions = {},
): GeminiFloorProposal {
  const snapped = snapOrthoProposal(proposal, options);
  const mergedWalls = mergeCollinearWalls(snapped.walls, options);
  const rooms = closeRoomLoops(snapped.rooms, options);
  let next: GeminiFloorProposal = { ...snapped, walls: mergedWalls, rooms };

  const changed = wallKey(proposal) !== wallKey(next) || roomKey(proposal) !== roomKey(next);
  if (changed && options.annotateNotes !== false) {
    const note = "Phase 6A CV cleanup: ortho snap + wall merge + room loop close.";
    const notes = [...(next.notes ?? [])];
    if (!notes.includes(note)) notes.push(note);
    next = { ...next, notes };
  }
  return next;
}

/** Sync modes only — `cv` is resolved async via buildClassicalCvHybrid. */
export function proposalForGeometryMode(
  source: GeminiFloorProposal,
  mode: GeometryViewMode,
  options?: CleanProposalOptions,
): GeminiFloorProposal {
  if (mode === "raw") return source;
  return cleanProposalGeometry(source, options);
}
