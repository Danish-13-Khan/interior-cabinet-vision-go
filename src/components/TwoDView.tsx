import { useMemo, useRef } from "react";
import type {
  CabinetPlacement,
  CabinetProject,
} from "../domain/cabinetDimensions";
import type { CabinetRun, CountertopSegment, RunFiller } from "../domain/cabinetLibrary";
import { createTechnicalView, type TechnicalViewKind } from "../domain/technicalViews";
import type { RoomConfig } from "../domain/roomModel";
import {
  clampDraftingDisplay,
  type DraftingDisplayPreferences,
  type DraftingLeader,
  type DraftingNote,
} from "../domain/draftingAnnotations";
import { useTwoDPointer } from "../hooks/useTwoDPointer";
import type { TechnicalViewMetrics } from "./twoDView/placementHelpers";
import type { DraftingTool } from "./twoDView/types";

export type { DraftingTool };

type TwoDViewProps = {
  project: CabinetProject;
  room: RoomConfig;
  view: TechnicalViewKind;
  countertops?: CountertopSegment[];
  runs?: CabinetRun[];
  fillers?: RunFiller[];
  selectedCabinetIds?: string[];
  activeCabinetId?: string | null;
  activeOpeningId?: string | null;
  snapSizeMm?: number;
  showGrid?: boolean;
  draftingDisplay?: DraftingDisplayPreferences;
  draftingTool?: DraftingTool;
  onSelectCabinet?: (cabinetId: string | null, additive: boolean) => void;
  onSelectOpening?: (cabinetId: string, openingId: string) => void;
  onCabinetMove?: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onAddNote?: (note: DraftingNote) => void;
  onAddLeader?: (leader: DraftingLeader) => void;
};

export function TwoDView({
  project,
  room,
  view,
  countertops,
  runs = [],
  fillers = [],
  selectedCabinetIds = [],
  activeCabinetId = null,
  activeOpeningId = null,
  snapSizeMm = 50,
  showGrid = true,
  draftingDisplay,
  draftingTool = "select",
  onSelectCabinet,
  onSelectOpening,
  onCabinetMove,
  onAddNote,
  onAddLeader,
}: TwoDViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const technicalViewRef = useRef<TechnicalViewMetrics>({
    width: 1,
    height: 1,
    originX: 0,
    originY: 0,
    scale: 1,
  });
  const display = clampDraftingDisplay(draftingDisplay ?? project.preferences?.drafting);

  const {
    snapGuides,
    ghostPlacement,
    leaderTarget,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleClick,
  } = useTwoDPointer({
    hostRef,
    technicalViewRef,
    project,
    room,
    view,
    snapSizeMm,
    draftingTool,
    onSelectCabinet,
    onSelectOpening,
    onCabinetMove,
    onAddNote,
    onAddLeader,
  });

  const technicalView = useMemo(
    () =>
      createTechnicalView(project, room, view, countertops, {
        selectedCabinetIds,
        activeCabinetId,
        activeOpeningId,
        mode: "interactive",
        showGrid,
        showDimensionChains: display.showDimensionChains,
        showWallLabels: display.showWallLabels,
        showCabinetTags: display.showCabinetTags,
        showOpeningTags: display.showOpeningTags,
        showApplianceTags: display.showApplianceTags,
        showRunBands: display.showRunBands,
        showRunLabels: display.showRunLabels,
        showFillers: display.showFillers,
        showCountertopSpans: display.showCountertopSpans,
        showElevationDetails: true,
        dimMinSegmentMm: display.dimMinSegmentMm,
        snapGuides,
        ghostPlacement,
        runs,
        fillers,
        countertops,
        drafting: project.drafting,
        showSectionMarkers: true,
      }),
    [
      activeCabinetId,
      activeOpeningId,
      countertops,
      display.dimMinSegmentMm,
      display.showApplianceTags,
      display.showCabinetTags,
      display.showCountertopSpans,
      display.showDimensionChains,
      display.showFillers,
      display.showOpeningTags,
      display.showRunBands,
      display.showRunLabels,
      display.showWallLabels,
      fillers,
      ghostPlacement,
      project,
      room,
      runs,
      selectedCabinetIds,
      showGrid,
      snapGuides,
      view,
    ],
  );

  technicalViewRef.current = {
    width: technicalView.width,
    height: technicalView.height,
    originX: technicalView.originX,
    originY: technicalView.originY,
    scale: technicalView.scale,
  };

  return (
    <div
      ref={hostRef}
      className={`technical-view drafting-tool-${draftingTool} ${snapGuides.length > 0 ? "is-dragging" : ""}`}
      style={{ width: technicalView.width, height: technicalView.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={handleClick}
    >
      {leaderTarget ? (
        <div className="drafting-tool-hint">Leader: click label position</div>
      ) : null}
      <div
        className="technical-view-svg"
        dangerouslySetInnerHTML={{ __html: technicalView.svg }}
      />
    </div>
  );
}
