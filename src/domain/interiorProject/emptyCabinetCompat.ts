import { DEFAULT_ROOM, type RoomConfig } from "../roomModel";
import type { CabinetProject } from "../cabinetDimensions";
import type { InteriorProject } from "./types";

/** Compatibility editor model for an interiors document with no rooms yet. */
export function emptyCabinetProjectFromInterior(
  document: InteriorProject,
  shell: Partial<CabinetProject> = {},
): { project: CabinetProject; room: RoomConfig } {
  return {
    project: {
      version: 1,
      ...shell,
      cabinets: [],
      rooms: [],
      activeRoomId: "",
      interiorDocument: document,
    },
    room: DEFAULT_ROOM,
  };
}
