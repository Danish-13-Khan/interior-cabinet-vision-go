import type { InteriorProject } from "../interiorProject";
import { lookupApartmentTemplate } from "./instantiateApartmentTemplate";
import { showcaseCameraForRoom } from "./showcaseCamera";

/** One room the Showcase tour visits, with the camera it frames the room through. */
export type ShowcaseTourStop = {
  roomId: string;
  roomName: string;
  cameraId: string;
};

function roomKey(room: InteriorProject["rooms"][number]): string {
  return String(room.extensions?.apartmentRoomKey ?? "");
}

/**
 * Room order for the tour: the template spec's room order, rotated so the
 * hero (main) room comes first — e.g. 3 BHK: living, kitchen, utility, study,
 * balcony, passage, guest, kids, master, baths, walk-in, then foyer. Rooms the
 * user added after instantiating follow in project order. Projects that are not
 * apartments use project order starting from the active room.
 */
export function showcaseTourRoomOrder(project: InteriorProject): string[] {
  const templateId = String(project.extensions?.apartmentTemplateId ?? "");
  const spec = templateId ? lookupApartmentTemplate(templateId) : undefined;
  const byKey = new Map(project.rooms.map((room) => [roomKey(room), room.id]));
  const ordered = spec
    ? spec.rooms.map((room) => byKey.get(room.key)).filter((id): id is string => Boolean(id))
    : [];
  const rest = project.rooms.map((room) => room.id).filter((id) => !ordered.includes(id));
  const all = [...ordered, ...rest];
  const heroId = (spec ? byKey.get(spec.heroRoomKey) : undefined) ?? project.activeRoomId;
  const start = Math.max(0, all.indexOf(heroId ?? ""));
  return [...all.slice(start), ...all.slice(0, start)];
}

/**
 * Tour stops in room order. Rooms without a camera are skipped, so the tour
 * never lingers in a room on the previous room's camera.
 */
export function showcaseTourStops(project: InteriorProject): ShowcaseTourStop[] {
  const stops: ShowcaseTourStop[] = [];
  for (const roomId of showcaseTourRoomOrder(project)) {
    const camera = showcaseCameraForRoom(project, roomId);
    if (!camera) continue;
    const room = project.rooms.find((entry) => entry.id === roomId)!;
    stops.push({ roomId, roomName: room.name, cameraId: camera.id });
  }
  return stops;
}

/** The tour is offered when it would visit at least two rooms. */
export function showcaseTourAvailable(stops: readonly ShowcaseTourStop[]): boolean {
  return stops.length >= 2;
}
