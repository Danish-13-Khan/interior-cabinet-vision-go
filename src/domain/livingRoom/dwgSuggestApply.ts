import {
  createWallSegment,
  drawRoomFromPoints,
  type InteriorProject,
  type Point2Mm,
} from "../interiorProject";
import { ensureDrawnRoomReviewRig } from "./drawnRoomRig";
import { ensureDwgSuggestHostRoom } from "./dwgSuggestApplyHost";
import {
  acceptedDwgSuggestCandidates,
  type DwgSuggestCandidate,
  type DwgSuggestDraft,
} from "./dwgSuggestDraft";

function chainGroups(candidates: DwgSuggestCandidate[]) {
  const groups: DwgSuggestCandidate[][] = [];
  const index = new Map<string, DwgSuggestCandidate[]>();
  for (const candidate of candidates) {
    const existing = index.get(candidate.chainId);
    if (existing) existing.push(candidate);
    else {
      const group = [candidate];
      index.set(candidate.chainId, group);
      groups.push(group);
    }
  }
  return groups;
}

function closedPolygon(group: DwgSuggestCandidate[]): Point2Mm[] | null {
  if (!group[0]?.closed || group.length < 3) return null;
  if (group.some((item) => !item.accepted || (item.overlap ?? "none") !== "none")) return null;
  return [group[0].a, ...group.map((item) => item.b)];
}

function stamp(before: InteriorProject, after: InteriorProject, draft: DwgSuggestDraft): InteriorProject {
  const wallIds = new Set(before.walls.map((wall) => wall.id));
  const roomIds = new Set(before.rooms.map((room) => room.id));
  return {
    ...after,
    rooms: after.rooms.map((room) => (
      roomIds.has(room.id) ? room : {
        ...room,
        wallThicknessMm: draft.thicknessMm,
        dimensions: { ...room.dimensions, heightMm: draft.heightMm },
      }
    )),
    walls: after.walls.map((wall) => (
      wallIds.has(wall.id) ? wall : {
        ...wall,
        thicknessMm: draft.thicknessMm,
        heightMm: draft.heightMm,
        raised: true,
        extensions: { ...wall.extensions, createdBy: "dwg-suggest" },
      }
    )),
  };
}

function addClosedChains(project: InteriorProject, draft: DwgSuggestDraft, used: Set<string>) {
  let next = project;
  for (const group of chainGroups(draft.candidates)) {
    const polygon = closedPolygon(group);
    if (!polygon) continue;
    const drawn = drawRoomFromPoints(next, { kind: "polygon", points: polygon }, { raised: true });
    if (drawn.walls.length === next.walls.length) continue;
    next = stamp(next, drawn, draft);
    for (const item of group) used.add(item.id);
  }
  return next;
}

/** One project patch: closed accepted chains become rooms; leftover runs use createWallSegment. */
export function applyDwgSuggestDraft(
  project: InteriorProject,
  draft: DwgSuggestDraft | null,
): InteriorProject {
  const accepted = acceptedDwgSuggestCandidates(draft);
  if (!draft || !accepted.length) return project;
  const used = new Set<string>();
  let next = addClosedChains(project, draft, used);
  const leftover = accepted.filter((candidate) => !used.has(candidate.id));
  if (leftover.length) next = ensureDwgSuggestHostRoom(next, draft, leftover);
  for (const candidate of leftover) {
    next = stamp(next, createWallSegment(next, {
      start: candidate.a,
      end: candidate.b,
      heightMm: draft.heightMm,
      thicknessMm: draft.thicknessMm,
      raised: true,
    }), draft);
  }
  return ensureDrawnRoomReviewRig(project, next);
}
