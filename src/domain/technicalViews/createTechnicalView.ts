import {
  millimetresToMetres,
  type CabinetProject,
} from "../cabinetDimensions";
import type { CountertopSegment } from "../cabinetLibrary";
import type { RoomConfig } from "../roomModel";
import { frontView } from "./frontView";
import { topView } from "./planView";
import { detailView } from "./detailView";
import { reportSheetView } from "./reportSheetView";
import { sectionView } from "./sectionView";
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
  const withTops: TechnicalViewOptions = {
    ...options,
    countertops: options.countertops ?? countertops,
  };
  switch (view) {
    case "front":
      return frontView(project, room, withTops);
    case "side":
      return sideView(project, room, withTops);
    case "section":
      return sectionView(project, room, withTops);
    case "detail":
      return detailView(project, room, withTops);
    case "report":
      return reportSheetView(project, room, withTops);
    default:
      return topView(project, room, countertops, withTops);
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
