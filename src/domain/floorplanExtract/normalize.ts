import { attachOpenings } from "./openings";
import { ensureCollisionFreeIds } from "./ids";
import { collectApplyGates } from "./gates";
import { matchRooms } from "./roomLoops";
import { buildWallGraph } from "./wallGraph";
import { coerceExtractionToMeters } from "./units";
import type { ExtractionResult, NormalizedFloorplan } from "./types";

export type NormalizeOptions = { acceptThinWalls?: boolean };

/** Full pipeline — re-run after every scale/polygon patch. */
export function normalizeExtraction(
  raw: ExtractionResult,
  options: NormalizeOptions = {},
): NormalizedFloorplan {
  const meters = coerceExtractionToMeters(raw);
  const draft = ensureCollisionFreeIds(meters);
  const graph = buildWallGraph(draft.polygons.walls);
  const roomMatches = matchRooms(draft.polygons.rooms, graph);
  const openingAttachments = attachOpenings(
    [...draft.polygons.doors, ...draft.polygons.windows],
    graph,
  );
  const gated = collectApplyGates({
    draft, graph, roomMatches, openingAttachments, acceptThinWalls: options.acceptThinWalls,
  });
  const issues = gated.issues;
  // Apply also requires ≥1 matched room
  if (!Object.values(roomMatches).some((m) => m.status === "matched")) {
    issues.push({
      code: "unmatched_room",
      message: "No closed room loop available for Apply.",
      blocksApply: true,
    });
  }
  return {
    draft,
    graph,
    roomMatches,
    openingAttachments,
    issues,
    canApply: !issues.some((i) => i.blocksApply),
  };
}
