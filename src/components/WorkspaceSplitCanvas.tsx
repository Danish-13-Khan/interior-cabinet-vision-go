import { forwardRef, useRef } from "react";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./CabinetScene";
import { ElevationOpeningToolbar } from "./ElevationOpeningToolbar";
import { TwoDView, type DraftingTool } from "./TwoDView";
import { WorkspaceViewPane } from "./WorkspaceViewPane";
import { WorkspaceSplitHandle } from "./WorkspaceSplitHandle";
import {
  DraftingToolButtons,
  SceneCameraButtons,
} from "./WorkspacePaneTools";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { CabinetDimensions, CabinetPlacement } from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import type {
  DraftingDisplayPreferences,
  DraftingLeader,
  DraftingNote,
} from "../domain/draftingAnnotations";
import type { CabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { ElevationOpeningCommand } from "../domain/elevationOpeningEdit";
import type { WorkspaceTabId } from "../domain/desktopUx/layoutPrefs";
import type { ViewPreset } from "./cabinetScene/types";

type WorkspaceSplitCanvasProps = {
  workspaceTab: WorkspaceTabId;
  maximizedPane: WorkspaceTabId | null;
  splitPlanWidthPct: number;
  splitTopRowPct: number;
  draftingTool: DraftingTool;
  project: CabinetProject;
  room: RoomConfig;
  planningWorkflow: CabinetPlanningWorkflow;
  snapSizeMm: number;
  showGrid: boolean;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  activeOpeningId: string | null;
  selectedPanelName: PanelName | null;
  draftingDisplay: DraftingDisplayPreferences;
  onFocusPane: (tab: WorkspaceTabId) => void;
  onToggleMaximize: (tab: WorkspaceTabId) => void;
  onSplitPlanWidthChange: (pct: number) => void;
  onSplitTopRowChange: (pct: number) => void;
  onDraftingToolChange: (tool: DraftingTool) => void;
  onCabinetMove: (cabinetId: string, placement: CabinetPlacement) => boolean;
  onCabinetRotate: (cabinetId: string, rotation: number) => boolean;
  onCabinetResize: (cabinetId: string, dimensions: CabinetDimensions) => void;
  onReplaceSelection: (
    ids: string[],
    activeId?: string | null,
    panelName?: PanelName | null,
  ) => void;
  onToggleCabinetSelection: (cabinetId: string) => void;
  onSelectCabinet: (cabinetId: string | null, additive: boolean) => void;
  onSelectOpening?: (cabinetId: string, openingId: string) => void;
  onElevationOpeningCommand?: (
    cabinetId: string,
    command: ElevationOpeningCommand,
  ) => void;
  onAddNote: (note: DraftingNote) => void;
  onAddLeader: (leader: DraftingLeader) => void;
};

export const WorkspaceSplitCanvas = forwardRef<
  CabinetSceneHandle,
  WorkspaceSplitCanvasProps
>(function WorkspaceSplitCanvas(
  {
    workspaceTab,
    maximizedPane,
    splitPlanWidthPct,
    splitTopRowPct,
    draftingTool,
    project,
    room,
    planningWorkflow,
    snapSizeMm,
    showGrid,
    selectedCabinetIds,
    activeCabinetId,
    activeOpeningId,
    selectedPanelName,
    draftingDisplay,
    onFocusPane,
    onToggleMaximize,
    onSplitPlanWidthChange,
    onSplitTopRowChange,
    onDraftingToolChange,
    onCabinetMove,
    onCabinetRotate,
    onCabinetResize,
    onReplaceSelection,
    onToggleCabinetSelection,
    onSelectCabinet,
    onSelectOpening,
    onElevationOpeningCommand,
    onAddNote,
    onAddLeader,
  },
  sceneRef,
) {
  const splitRef = useRef<HTMLDivElement | null>(null);
  const elevTab: WorkspaceTabId = workspaceTab === "side" ? "side" : "front";
  const elevView = elevTab === "side" ? "side" : "front";
  const elevTitle = elevTab === "side" ? "Side Elevation" : "Front Elevation";
  const activeCabinet = project.cabinets.find(
    (cabinet) => cabinet.id === activeCabinetId,
  );
  const maxKey =
    maximizedPane === "side" ? "front" : maximizedPane;
  const splitClass = [
    "workspace-split",
    maxKey ? `is-max-${maxKey}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const twoDCommon = {
    project,
    room,
    countertops: planningWorkflow.countertops,
    runs: planningWorkflow.runs,
    fillers: planningWorkflow.fillers,
    selectedCabinetIds,
    activeCabinetId,
    activeOpeningId,
    snapSizeMm,
    showGrid,
    draftingDisplay,
    draftingTool,
    onSelectCabinet,
    onSelectOpening,
    onCabinetMove,
    onAddNote,
    onAddLeader,
  } as const;

  function setCameraPreset(preset: ViewPreset) {
    const handle =
      sceneRef && typeof sceneRef === "object" ? sceneRef.current : null;
    handle?.setViewPreset(preset);
  }

  return (
    <div
      ref={splitRef}
      className={splitClass}
      style={{
        ["--split-plan-pct" as string]: `${splitPlanWidthPct}%`,
        ["--split-top-pct" as string]: `${splitTopRowPct}%`,
      }}
    >
      <WorkspaceViewPane
        paneId="plan"
        title="Plan"
        subtitle="Top"
        focused={workspaceTab === "plan"}
        maximized={maximizedPane === "plan"}
        onFocus={() => onFocusPane("plan")}
        onToggleMaximize={() => onToggleMaximize("plan")}
        toolbar={
          <DraftingToolButtons
            draftingTool={draftingTool}
            onDraftingToolChange={onDraftingToolChange}
          />
        }
      >
        <div className="drawing-sheet drawing-sheet-embedded">
          <div className="drawing-sheet-scroll">
            <TwoDView {...twoDCommon} view="top" />
          </div>
        </div>
      </WorkspaceViewPane>

      {!maximizedPane ? (
        <WorkspaceSplitHandle
          axis="x"
          valuePct={splitPlanWidthPct}
          containerRef={splitRef}
          ariaLabel="Resize plan and elevation"
          className="workspace-split-v"
          onChange={onSplitPlanWidthChange}
        />
      ) : null}

      <WorkspaceViewPane
        paneId="front"
        title={elevTitle}
        subtitle={elevTab === "side" ? "Side" : "Front"}
        focused={workspaceTab === "front" || workspaceTab === "side"}
        maximized={maximizedPane === "front" || maximizedPane === "side"}
        onFocus={() => onFocusPane(elevTab)}
        onToggleMaximize={() => onToggleMaximize(elevTab)}
        toolbar={
          <DraftingToolButtons
            draftingTool={draftingTool}
            onDraftingToolChange={onDraftingToolChange}
          />
        }
      >
        <div className="drawing-sheet drawing-sheet-embedded">
          {elevView === "front" && onElevationOpeningCommand ? (
            <ElevationOpeningToolbar
              config={activeCabinet?.config ?? null}
              activeOpeningId={
                activeCabinetId === activeCabinet?.id ? activeOpeningId : null
              }
              draftingTool={draftingTool}
              onCommand={(command) => {
                if (!activeCabinetId) return;
                onElevationOpeningCommand(activeCabinetId, command);
              }}
            />
          ) : null}
          <div className="drawing-sheet-scroll">
            <TwoDView {...twoDCommon} view={elevView} />
          </div>
        </div>
      </WorkspaceViewPane>

      {!maximizedPane ? (
        <WorkspaceSplitHandle
          axis="y"
          valuePct={splitTopRowPct}
          containerRef={splitRef}
          ariaLabel="Resize drafting and 3D"
          className="workspace-split-h"
          onChange={onSplitTopRowChange}
        />
      ) : null}

      <WorkspaceViewPane
        paneId="3d"
        title="3D"
        subtitle="Perspective"
        focused={workspaceTab === "3d"}
        maximized={maximizedPane === "3d"}
        onFocus={() => onFocusPane("3d")}
        onToggleMaximize={() => onToggleMaximize("3d")}
        toolbar={<SceneCameraButtons onSetViewPreset={setCameraPreset} />}
      >
        <div className="viewport-panel viewport-panel-embedded" aria-label="3D room viewport">
          <CabinetScene
            ref={sceneRef}
            project={project}
            room={room}
            countertops={planningWorkflow.countertops}
            fillers={planningWorkflow.fillers}
            snapSizeMm={snapSizeMm}
            showGrid={showGrid}
            onCabinetMove={onCabinetMove}
            onCabinetRotate={onCabinetRotate}
            selectedCabinetIds={selectedCabinetIds}
            activeCabinetId={activeCabinetId}
            selectedPanelName={selectedPanelName}
            onCabinetResize={onCabinetResize}
            onSelectedCabinetChange={(cabinetId, additive) => {
              if (!cabinetId) {
                onReplaceSelection([], null, null);
                return;
              }
              if (additive) {
                onToggleCabinetSelection(cabinetId);
                return;
              }
              onReplaceSelection([cabinetId], cabinetId, null);
            }}
            onSelectedPanelChange={(cabinetId, name, additive) => {
              if (!cabinetId) {
                onReplaceSelection([], null, null);
                return;
              }
              if (additive) {
                const nextIds = selectedCabinetIds.includes(cabinetId)
                  ? selectedCabinetIds
                  : [...selectedCabinetIds, cabinetId];
                onReplaceSelection(nextIds, cabinetId, name);
                return;
              }
              onReplaceSelection([cabinetId], cabinetId, name);
            }}
            onMarqueeSelect={(cabinetIds, additive) => {
              if (additive) {
                onReplaceSelection(
                  Array.from(new Set([...selectedCabinetIds, ...cabinetIds])),
                  cabinetIds[0] ?? activeCabinetId,
                  null,
                );
                return;
              }
              onReplaceSelection(cabinetIds, cabinetIds[0] ?? null, null);
            }}
          />
        </div>
      </WorkspaceViewPane>
    </div>
  );
});
