import type { InteriorProject, Point2Mm } from "../interiorProject";
import type { DwgSuggestCandidate, DwgSuggestDraft } from "./dwgSuggestDraft";

function nextId(prefix: string, used: Set<string>) {
  let index = 1;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function boundsOf(points: Point2Mm[]) {
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  return {
    widthMm: Math.max(1, Math.max(...xs) - Math.min(...xs)),
    depthMm: Math.max(1, Math.max(...zs) - Math.min(...zs)),
  };
}

/** Room entity for createWallSegment on a blank site. Does not invent closing walls. */
export function ensureDwgSuggestHostRoom(
  project: InteriorProject,
  draft: DwgSuggestDraft,
  accepted: readonly DwgSuggestCandidate[],
): InteriorProject {
  const active = project.rooms.find((room) => room.id === project.activeRoomId);
  if (active) return project;
  const existing = project.rooms[0];
  if (existing) return { ...project, activeRoomId: existing.id };
  if (!accepted.length) return project;
  const roomId = nextId("room", new Set(project.rooms.map((room) => room.id)));
  const size = boundsOf(accepted.flatMap((item) => [item.a, item.b]));
  return {
    ...project,
    activeRoomId: roomId,
    rooms: [...project.rooms, {
      id: roomId,
      name: "Room 1",
      roomType: "living-room",
      dimensions: { ...size, heightMm: draft.heightMm },
      wallThicknessMm: draft.thicknessMm,
      extensions: { createdBy: "dwg-suggest" },
    }],
  };
}
