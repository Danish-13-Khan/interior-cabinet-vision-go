import { attachOpenings } from "./openings";
import { ensureCollisionFreeIds } from "./ids";
import { collectApplyGates } from "./gates";
import { matchRooms } from "./roomLoops";
import { buildWallGraph } from "./wallGraph";
import { wallPolygonsFromRing } from "./roomRingWalls";
import { coerceExtractionToMeters } from "./units";
import type { ExtractPolygon, ExtractionResult, NormalizedFloorplan, RoomLoopMatch } from "./types";

export type NormalizeOptions = { acceptThinWalls?: boolean };

function unmatchedRooms(
  rooms: ExtractPolygon[],
  matches: Record<string, RoomLoopMatch>,
): ExtractPolygon[] {
  return rooms.filter((room) => {
    const id = room.id ?? "room";
    return matches[id]?.status !== "matched";
  });
}

function synthWallsFromRooms(rooms: ExtractPolygon[]): ExtractPolygon[] {
  const extra: ExtractPolygon[] = [];
  for (const room of rooms) {
    extra.push(...wallPolygonsFromRing(room.outer as [number, number][], room.id ?? "room"));
  }
  return extra;
}

/** Full pipeline — re-run after every scale/polygon patch. */
export function normalizeExtraction(
  raw: ExtractionResult,
  options: NormalizeOptions = {},
): NormalizedFloorplan {
  const meters = coerceExtractionToMeters(raw);
  const draft = ensureCollisionFreeIds(meters);
  const sourceWalls = [...draft.polygons.walls];
  let graph = buildWallGraph(sourceWalls);
  let roomMatches = matchRooms(draft.polygons.rooms, graph);

  // Vision extracts often omit walls for some rooms while others match.
  // Synth footprint edges for Apply graph only — never bake into draft.polygons
  // (GLB export must stay raw-extract parity with Desktop curl).
  const need = unmatchedRooms(draft.polygons.rooms, roomMatches);
  if (need.length) {
    const extra = synthWallsFromRooms(need);
    if (extra.length) {
      graph = buildWallGraph([...sourceWalls, ...extra]);
      roomMatches = matchRooms(draft.polygons.rooms, graph);
    }
  }

  const openingAttachments = attachOpenings(
    [...draft.polygons.doors, ...draft.polygons.windows],
    graph,
  );
  const gated = collectApplyGates({
    draft, graph, roomMatches, openingAttachments, acceptThinWalls: options.acceptThinWalls,
  });
  const issues = gated.issues;
  if (unmatchedRooms(draft.polygons.rooms, roomMatches).length === draft.polygons.rooms.length
    && draft.polygons.rooms.length > 0) {
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
