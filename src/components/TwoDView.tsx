import { useMemo } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { CountertopSegment } from "../domain/cabinetLibrary";
import {
  createTechnicalView,
  type TechnicalViewKind,
} from "../domain/technicalViews";
import type { RoomConfig } from "../domain/roomModel";

type TwoDViewProps = {
  project: CabinetProject;
  room: RoomConfig;
  view: TechnicalViewKind;
  countertops?: CountertopSegment[];
};

export function TwoDView({ project, room, view, countertops }: TwoDViewProps) {
  const technicalView = useMemo(
    () => createTechnicalView(project, room, view, countertops),
    [countertops, project, room, view],
  );

  return (
    <div
      className="technical-view"
      style={{ width: technicalView.width, height: technicalView.height }}
      dangerouslySetInnerHTML={{ __html: technicalView.svg }}
    />
  );
}
