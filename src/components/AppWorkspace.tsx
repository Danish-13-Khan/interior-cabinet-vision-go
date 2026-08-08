import { forwardRef, useEffect, useState } from "react";
import {
  type CabinetSceneHandle,
} from "./CabinetScene";
import { WorkspaceSplitCanvas } from "./WorkspaceSplitCanvas";
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
import type { CabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { ElevationOpeningCommand } from "../domain/elevationOpeningEdit";
import type { WorkspaceTabId } from "../domain/desktopUx/layoutPrefs";

type AppWorkspaceProps = {
  workspaceTab: WorkspaceTabId;
  workspaceLabel: string;
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
  onWorkspaceTabChange: (tab: WorkspaceTabId) => void;
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
      snapSizeMm,
      showGrid,
      selectedCabinetIds,
      activeCabinetId,
      activeOpeningId,
      selectedPanelName,
      draftingDisplay,
      onWorkspaceTabChange,
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
      setMaximizedPane((current) => {
        if (current === tab) return null;
        if (
          (current === "front" || current === "side") &&
          (tab === "front" || tab === "side")
        ) {
          return current === tab ? null : tab;
        }
        return tab;
      });
      onWorkspaceTabChange(tab);
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
          <span className="workspace-focus-hint">
            Split · Plan + Elevation + 3D
            {maximizedPane ? " · maximized" : ""}
          </span>
        </div>

        <div className="workspace-canvas">
          <WorkspaceSplitCanvas
            ref={sceneRef}
            workspaceTab={workspaceTab}
            maximizedPane={maximizedPane}
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
            onFocusPane={(tab) => {
              onWorkspaceTabChange(tab);
            }}
            onToggleMaximize={handleToggleMaximize}
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
      </section>
    );
  },
);
