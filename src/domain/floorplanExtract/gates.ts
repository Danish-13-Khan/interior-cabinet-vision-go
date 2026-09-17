import type { NormalizedFloorplan, NormalizeIssue } from "./types";

/** Walls minted from room footprints (`room-0:edge-3`, splits `…#0`). */
function isSynthRoomEdge(sourceId: string) {
  return sourceId.includes(":edge-");
}

export function collectApplyGates(input: Omit<NormalizedFloorplan, "issues" | "canApply"> & {
  acceptThinWalls?: boolean;
}): { issues: NormalizeIssue[]; canApply: boolean } {
  const issues: NormalizeIssue[] = [];
  for (const e of input.graph.edges) {
    if (e.diagonalCollapsed) {
      issues.push({
        code: "diagonal_wall",
        message: `Wall ${e.sourceId} is not axis-aligned (AABB would rewrite it).`,
        entityId: e.sourceId,
        blocksApply: true,
      });
    }
    if (e.thickened && !input.acceptThinWalls && !isSynthRoomEdge(e.sourceId)) {
      issues.push({
        code: "thin_wall",
        message: `Wall ${e.sourceId} is under 150 mm and would be thickened.`,
        entityId: e.sourceId,
        blocksApply: true,
      });
    } else if (e.thickened && isSynthRoomEdge(e.sourceId)) {
      issues.push({
        code: "thin_wall",
        message: `Wall ${e.sourceId} uses the 150 mm floor (room footprint).`,
        entityId: e.sourceId,
        blocksApply: false,
      });
    }
    if (e.role === "dropped") {
      issues.push({
        code: "dropped_edge",
        message: `Wall ${e.sourceId} is floating/dropped.`,
        entityId: e.sourceId,
        blocksApply: false,
      });
    }
  }
  for (const [id, match] of Object.entries(input.roomMatches)) {
    if (match.status !== "matched") {
      issues.push({ code: "unmatched_room", message: `Room ${id}: ${match.reason}`, entityId: id, blocksApply: true });
      continue;
    }
    for (let i = 0; i < match.holeMatches.length; i++) {
      const hole = match.holeMatches[i];
      if (hole.status !== "matched") {
        issues.push({
          code: "unmatched_hole",
          message: `Room ${id} hole[${i}] unmatched — map or remove before Apply.`,
          entityId: id,
          blocksApply: true,
        });
      }
    }
  }
  for (const [id, att] of Object.entries(input.openingAttachments)) {
    if (att.status === "ambiguous") {
      issues.push({ code: "ambiguous_opening", message: `Opening ${id}: ${att.reason}`, entityId: id, blocksApply: true });
    } else if (att.status === "unmatched") {
      issues.push({
        code: "unmatched_opening",
        message: `Opening ${id}: ${att.reason} (skipped)`,
        entityId: id,
        blocksApply: false,
      });
    } else if (att.status === "matched") {
      if (!(att.widthM > 0)) {
        issues.push({
          code: "unmatched_opening",
          message: `Opening ${id}: nonpositive width after trim`,
          entityId: id,
          blocksApply: true,
        });
      } else {
        const poly = [...input.draft.polygons.doors, ...input.draft.polygons.windows]
          .find((p) => p.id === id);
        const kind = input.draft.polygons.doors.some((d) => d.id === id) ? "door" : "window";
        const heightM = poly?.opening?.height_m ?? (kind === "door" ? 2.1 : 1.2);
        if (!(heightM > 0)) {
          issues.push({
            code: "unmatched_opening",
            message: `Opening ${id}: height_m must be > 0 (got ${heightM})`,
            entityId: id,
            blocksApply: true,
          });
        }
      }
    }
  }
  return { issues, canApply: !issues.some((i) => i.blocksApply) };
}
