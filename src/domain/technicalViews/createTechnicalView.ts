import {
  millimetresToMetres,
  type CabinetProject,
} from "../cabinetDimensions";
import type { CountertopSegment } from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";
import { frontView } from "./frontView";
import { topView } from "./planView";
import { sideView } from "./sideView";
import type {
  TechnicalViewKind,
  TechnicalViewOptions,
  TechnicalViewResult,
} from "./types";

export function createTechnicalView(
  project: CabinetProject,
  room: RoomConfig,
  view: TechnicalViewKind,
  countertops: CountertopSegment[] = [],
  options: TechnicalViewOptions = {},
): TechnicalViewResult {
  switch (view) {
    case "front":
      return frontView(project, room, options);
    case "side":
      return sideView(project, room, options);
    default:
      return topView(project, room, countertops, options);
  }
}

export function formatProjectTechnicalSummary(project: CabinetProject, room: RoomConfig) {
  return [
    `Room: ${Math.round(millimetresToMetres(room.dimensions.widthMm) * 1000)} x ${Math.round(millimetresToMetres(room.dimensions.depthMm) * 1000)} x ${Math.round(millimetresToMetres(room.dimensions.heightMm) * 1000)} mm`,
    `Items: ${project.cabinets.length}`,
    `Doors: ${room.doors.length}`,
    `Windows: ${room.windows.length}`,
  ];
}
