import { forwardRef, useEffect, useState } from "react";
import { type CabinetSceneHandle } from "./CabinetScene";
import { WorkspaceSplitCanvas } from "./WorkspaceSplitCanvas";
import { WorkspaceSceneBrowser } from "./WorkspaceSceneBrowser";
import type { DraftingTool } from "./TwoDView";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { CabinetDimensions, CabinetPlacement } from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import type {
  DraftingDisplayPreferences,
  DraftingLeader,
  DraftingNote,
} from "../domain/draftingAnnotations";
import type { CabinetPlanningWorkflow, CabinetRun } from "../domain/cabinetLibrary";
import type { ElevationOpeningCommand } from "../domain/elevationOpeningEdit";
import type { WorkspaceTabId } from "../domain/desktopUx/layoutPrefs";
import type { ProjectRoom } from "../domain/projectRooms";

type AppWorkspaceProps = {
  workspaceTab: WorkspaceTabId;
  workspaceLabel: string;
  draftingTool: DraftingTool;
  project: CabinetProject;
  room: RoomConfig;
  planningWorkflow: CabinetPlanningWorkflow;
  rooms: ProjectRoom[];
  activeRoomId: string | null;
  snapSizeMm: number;
  showGrid: boolean;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  activeOpeningId: string | null;
  selectedPanelName: PanelName | null;
  draftingDisplay: DraftingDisplayPreferences;
  splitPlanWidthPct: number;
  splitTopRowPct: number;
  sceneBrowserVisible: boolean;
  onWorkspaceTabChange: (tab: WorkspaceTabId) => void;
  onDraftingToolChange: (tool: DraftingTool) => void;
  onSplitPlanWidthChange: (pct: number) => void;
  onSplitTopRowChange: (pct: number) => void;
  onToggleSceneBrowser: () => void;
  onSelectRoom: (roomId: string) => void;
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
  onWorkspaceContextMenu?: (point: { x: number; y: number }) => void;
  tabShortcutHints?: Partial<Record<WorkspaceTabId, string>>;
};

const FOCUS_TABS: Array<{ id: WorkspaceTabId; label: string }> = [
  { id: "plan", label: "Plan" },
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "3d", label: "3D" },
];

export const AppWorkspace = forwardRef<CabinetSceneHandle, AppWorkspaceProps>(
  function AppWorkspace(
    {
      workspaceTab,
      workspaceLabel,
      draftingTool,
      project,
      room,
      planningWorkflow,
      rooms,
      activeRoomId,
      snapSizeMm,
      showGrid,
      selectedCabinetIds,
      activeCabinetId,
      activeOpeningId,
      selectedPanelName,
      draftingDisplay,
      splitPlanWidthPct,
      splitTopRowPct,
      sceneBrowserVisible,
      onWorkspaceTabChange,
      onDraftingToolChange,
      onSplitPlanWidthChange,
      onSplitTopRowChange,
      onToggleSceneBrowser,
      onSelectRoom,
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
      onWorkspaceContextMenu,
      tabShortcutHints,
    },
    sceneRef,
  ) {
    const [maximizedPane, setMaximizedPane] = useState<WorkspaceTabId | null>(null);

    useEffect(() => {
      if (!maximizedPane) return;
      if (maximizedPane === "front" || maximizedPane === "side") {
        if (workspaceTab !== "front" && workspaceTab !== "side") {
          setMaximizedPane(null);
        }
        return;
      }
      if (maximizedPane !== workspaceTab) {
        setMaximizedPane(null);
      }
    }, [maximizedPane, workspaceTab]);

    function handleToggleMaximize(tab: WorkspaceTabId) {
      setMaximizedPane((current) => (current === tab ? null : tab));
      onWorkspaceTabChange(tab);
    }

    function handleSelectRun(run: CabinetRun) {
      onReplaceSelection(run.cabinetIds, run.cabinetIds[0] ?? null, null);
      onWorkspaceTabChange("plan");
      setMaximizedPane(null);
    }

    function handleSelectOpening(cabinetId: string, openingId: string) {
      onSelectOpening?.(cabinetId, openingId);
      onWorkspaceTabChange("front");
      setMaximizedPane(null);
    }

    return (
      <section
        className="workspace-panel"
        aria-label="Drawing workspace"
        onContextMenu={(event) => {
          if (!onWorkspaceContextMenu) return;
          const target = event.target as HTMLElement | null;
          if (target?.closest("button, input, textarea, select, a")) return;
          event.preventDefault();
          onWorkspaceContextMenu({ x: event.clientX, y: event.clientY });
        }}
      >
        <div className="workspace-focus-bar" role="tablist" aria-label="Focus viewport">
          <span className="workspace-focus-label">{workspaceLabel}</span>
          <div className="workspace-tabs">
            {FOCUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={workspaceTab === tab.id}
                className={`workspace-tab ${workspaceTab === tab.id ? "is-active" : ""}`}
                title={
                  tabShortcutHints?.[tab.id]
                    ? `${tab.label} (${tabShortcutHints[tab.id]})`
                    : tab.label
                }
                onClick={() => {
                  onWorkspaceTabChange(tab.id);
                  setMaximizedPane(null);
                }}
                onDoubleClick={() => {
                  onWorkspaceTabChange(tab.id);
                  onDraftingToolChange("select");
                  setMaximizedPane(tab.id);
                }}
              >
                {tab.label}
                {tabShortcutHints?.[tab.id] ? (
                  <kbd className="workspace-tab-kbd">{tabShortcutHints[tab.id]}</kbd>
                ) : null}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`tb-btn ${sceneBrowserVisible ? "tb-accent" : ""}`}
            title="Toggle scene browser"
            onClick={onToggleSceneBrowser}
          >
            Objects
          </button>
          <span className="workspace-focus-hint">
            Split · Plan + Elev + 3D
            {maximizedPane ? " · max" : ""}
          </span>
        </div>

        <div className="workspace-body">
          {sceneBrowserVisible ? (
            <WorkspaceSceneBrowser
              rooms={rooms}
              activeRoomId={activeRoomId}
              cabinets={project.cabinets}
              runs={planningWorkflow.runs}
              activeCabinetId={activeCabinetId}
              selectedCabinetIds={selectedCabinetIds}
              activeOpeningId={activeOpeningId}
              onSelectRoom={onSelectRoom}
              onSelectCabinet={(cabinetId, additive) =>
                onSelectCabinet(cabinetId, additive)
              }
              onSelectRun={handleSelectRun}
              onSelectOpening={handleSelectOpening}
            />
          ) : null}

          <div className="workspace-canvas">
            <WorkspaceSplitCanvas
              ref={sceneRef}
              workspaceTab={workspaceTab}
              maximizedPane={maximizedPane}
              splitPlanWidthPct={splitPlanWidthPct}
              splitTopRowPct={splitTopRowPct}
              draftingTool={draftingTool}
              project={project}
              room={room}
              planningWorkflow={planningWorkflow}
              snapSizeMm={snapSizeMm}
              showGrid={showGrid}
              selectedCabinetIds={selectedCabinetIds}
              activeCabinetId={activeCabinetId}
              activeOpeningId={activeOpeningId}
              selectedPanelName={selectedPanelName}
              draftingDisplay={draftingDisplay}
              onFocusPane={onWorkspaceTabChange}
              onToggleMaximize={handleToggleMaximize}
              onSplitPlanWidthChange={onSplitPlanWidthChange}
              onSplitTopRowChange={onSplitTopRowChange}
              onDraftingToolChange={onDraftingToolChange}
              onCabinetMove={onCabinetMove}
              onCabinetRotate={onCabinetRotate}
              onCabinetResize={onCabinetResize}
              onReplaceSelection={onReplaceSelection}
              onToggleCabinetSelection={onToggleCabinetSelection}
              onSelectCabinet={onSelectCabinet}
              onSelectOpening={onSelectOpening}
              onElevationOpeningCommand={onElevationOpeningCommand}
              onAddNote={onAddNote}
              onAddLeader={onAddLeader}
            />
          </div>
        </div>
      </section>
    );
  },
);
