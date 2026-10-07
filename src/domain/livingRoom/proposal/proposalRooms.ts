import type { InteriorProject } from "../../interiorProject";
import type { QuoteCabinetLine } from "../../projectQuote";
import type {
  ProposalCabinetLine,
  ProposalMaterialLine,
  ProposalNamedView,
  ProposalRoomPage,
} from "./types";

const INTERIOR_MARK = /^I\d+$/;

function planningSourceId(object: InteriorProject["objects"][number]): string | null {
  const planning = object.extensions?.cabinetPlanning;
  const sourceId = planning && typeof planning === "object" ? (planning as { sourceId?: unknown }).sourceId : null;
  return typeof sourceId === "string" && sourceId ? sourceId : null;
}

/**
 * Which room each client line belongs to. Cabinet marks are the live quote's
 * marks, so a frozen payload that still matches the design resolves through
 * the same objects; room-finish lines carry their room name in the label.
 */
function lineRoomResolver(document: InteriorProject, liveCabinetLines: QuoteCabinetLine[]) {
  const objectRoom = new Map<string, string>();
  for (const object of document.objects) {
    objectRoom.set(object.id, object.roomId);
    const source = planningSourceId(object);
    if (source && !objectRoom.has(source)) objectRoom.set(source, object.roomId);
  }
  const markRoom = new Map(liveCabinetLines.map((line) => [line.mark, objectRoom.get(line.cabinetId) ?? null]));
  const roomByName = new Map(document.rooms.map((room) => [room.name.trim().toLowerCase(), room.id]));
  return (line: ProposalCabinetLine): string | null => {
    if (INTERIOR_MARK.test(line.mark)) {
      const room = line.name.split(" · ")[0]?.trim().toLowerCase() ?? "";
      return roomByName.get(room) ?? null;
    }
    return markRoom.get(line.mark) ?? null;
  };
}

/**
 * One page per printed view (roadmap D3): the view's room, the client lines
 * that sit in it, the finishes used there, and the itemized subtotal.
 * Project-wide lines never appear here; they belong to the price page.
 */
export function proposalRoomPages(
  document: InteriorProject,
  input: {
    views: ProposalNamedView[];
    cabinets: ProposalCabinetLine[];
    materials: ProposalMaterialLine[];
    liveCabinetLines: QuoteCabinetLine[];
    itemized: boolean;
  },
): ProposalRoomPage[] {
  const roomName = new Map(document.rooms.map((room) => [room.id, room.name]));
  const roomOf = lineRoomResolver(document, input.liveCabinetLines);
  return input.views.flatMap((view) => {
    const camera = document.cameras.find((item) => item.id === view.cameraId);
    if (!camera) return [];
    const name = roomName.get(camera.roomId) ?? "Room";
    const cabinets = input.cabinets.filter((line) => roomOf(line) === camera.roomId);
    const finishes = input.materials.filter((line) => line.rooms?.includes(name));
    return [{
      roomId: camera.roomId,
      roomName: name,
      cameraId: view.cameraId,
      viewName: view.viewName,
      cabinets,
      finishes,
      subtotal: input.itemized ? cabinets.reduce((sum, line) => sum + line.sellPrice, 0) : null,
    }];
  });
}
