import { useMemo, type MouseEvent } from "react";
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
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  onSelectCabinet?: (cabinetId: string | null, additive: boolean) => void;
};

export function TwoDView({
  project,
  room,
  view,
  countertops,
  selectedCabinetIds = [],
  activeCabinetId = null,
  onSelectCabinet,
}: TwoDViewProps) {
  const technicalView = useMemo(
    () =>
      createTechnicalView(project, room, view, countertops, {
        selectedCabinetIds,
        activeCabinetId,
      }),
    [activeCabinetId, countertops, project, room, selectedCabinetIds, view],
  );

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!onSelectCabinet) return;

    const target = event.target as Element | null;
    const cabinetNode = target?.closest?.("[data-cabinet-id]");
    const cabinetId = cabinetNode?.getAttribute("data-cabinet-id") ?? null;
    const additive = event.metaKey || event.ctrlKey || event.shiftKey;

    if (!cabinetId) {
      if (!additive) {
        onSelectCabinet(null, false);
      }
      return;
    }

    onSelectCabinet(cabinetId, additive);
  }

  return (
    <div
      className="technical-view"
      style={{ width: technicalView.width, height: technicalView.height }}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: technicalView.svg }}
    />
  );
}
