import type { CabinetInstance, CabinetProject } from "../cabinetDimensions";

/**
 * Current production cabinets across every room.
 * `project.cabinets` is authoritative for the active room; other rooms use `rooms[].cabinets`.
 */
export function listCurrentProjectCabinets(project: CabinetProject): CabinetInstance[] {
  const rooms = project.rooms ?? [];
  if (rooms.length === 0) return project.cabinets;

  const seen = new Map<string, CabinetInstance>();
  const activeId = project.activeRoomId;

  for (const room of rooms) {
    const source = room.id === activeId ? project.cabinets : room.cabinets;
    for (const cabinet of source) {
      seen.set(cabinet.id, cabinet);
    }
  }

  for (const cabinet of project.cabinets) {
    seen.set(cabinet.id, cabinet);
  }

  return [...seen.values()];
}
