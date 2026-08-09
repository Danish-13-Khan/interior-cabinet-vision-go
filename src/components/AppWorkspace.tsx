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
import type { SheetViewKind } from "../domain/sheetDocuments";
import { catalogIdFromSheetId } from "../domain/sheetDocuments";
import { WorkspaceSheetBrowser } from "./WorkspaceSheetBrowser";

type AppWorkspaceProps = {
  workspaceTab: WorkspaceTabId;
  activeSheetId: string;
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
  sheetBrowserVisible: boolean;
  onWorkspaceTabChange: (tab: WorkspaceTabId) => void;
  onActiveSheetChange: (sheetId: string) => void;
  onRenameSheet: (sheetId: string, name: string) => void;
  onSetSheetNotes: (sheetId: string, notes: string[]) => void;
  onAddCombinedSheet: () => void;
  onPlaceView: (sheetId: string, viewKind: SheetViewKind) => void;
  onDraftingToolChange: (tool: DraftingTool) => void;
  onSplitPlanWidthChange: (pct: number) => void;
  onSplitTopRowChange: (pct: number) => void;
  onToggleSceneBrowser: () => void;
  onToggleSheetBrowser: () => void;
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
  onSelectCabinetsFromTree: (
    roomId: string,
    cabinetIds: string[],
    activeId: string | null,
    additive: boolean,
  ) => void;
  onRenameCabinet: (cabinetId: string, name: string) => void;
  onRenameRoom: (roomId: string, name: string) => void;
  isolatedCabinetIds: string[] | null;
  onTreeIsolate: (cabinetIds: string[]) => void;
  onTreeFocus: (cabinetIds: string[], activeId: string | null) => void;
  onTreeReorder: (runId: string, cabinetId: string, direction: -1 | 1) => void;
  onElevationOpeningCommand?: (
    cabinetId: string,
    command: ElevationOpeningCommand,
  ) => void;
  onAddNote: (note: DraftingNote) => void;
  onAddLeader: (leader: DraftingLeader) => void;
  onUpdateNote: (note: DraftingNote) => void;
  onUpdateLeader: (leader: DraftingLeader) => void;
  onDeleteNote: (id: string) => void;
  onDeleteLeader: (id: string) => void;
  onUpsertDimOffset: (id: string, dx: number, dy: number) => void;
  onResetDimOffset: (id: string) => void;
  onUpsertTagOffset: (cabinetId: string, dx: number, dy: number) => void;
  onResetTagOffset: (cabinetId: string) => void;
  onWorkspaceContextMenu?: (point: { x: number; y: number }) => void;
  onCabinetContextMenu?: (
    cabinetId: string,
    point: { x: number; y: number },
  ) => void;
  onPointerWorld?: (
    point: import("../domain/draftingAnnotations").DraftingWorldPoint | null,
  ) => void;
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
      activeSheetId,
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
      sheetBrowserVisible,
      onWorkspaceTabChange,
      onActiveSheetChange,
      onRenameSheet,
      onSetSheetNotes,
      onAddCombinedSheet,
      onPlaceView,
      onDraftingToolChange,
      onSplitPlanWidthChange,
      onSplitTopRowChange,
      onToggleSceneBrowser,
      onToggleSheetBrowser,
      onSelectRoom,
      onCabinetMove,
      onCabinetRotate,
      onCabinetResize,
      onReplaceSelection,
      onToggleCabinetSelection,
      onSelectCabinet,
      onSelectOpening,
      onSelectCabinetsFromTree,
      onRenameCabinet,
      onRenameRoom,
      isolatedCabinetIds,
      onTreeIsolate,
      onTreeFocus,
      onTreeReorder,
      onElevationOpeningCommand,
      onAddNote,
      onAddLeader,
      onUpdateNote,
      onUpdateLeader,
      onDeleteNote,
      onDeleteLeader,
      onUpsertDimOffset,
      onResetDimOffset,
      onUpsertTagOffset,
      onResetTagOffset,
      onWorkspaceContextMenu,
      onCabinetContextMenu,
      onPointerWorld,
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
      if (tab === "plan" || tab === "front" || tab === "side") {
        onActiveSheetChange(tab);
      }
    }

    function handleSelectSheet(sheetId: string) {
      onActiveSheetChange(sheetId);
      const catalogId = catalogIdFromSheetId(sheetId, project);
      if (catalogId === "plan" || catalogId === "front" || catalogId === "side") {
        onWorkspaceTabChange(catalogId);
        setMaximizedPane(null);
      } else {
        setMaximizedPane(null);
      }
      onDraftingToolChange("select");
    }

    function handleSelectRun(run: CabinetRun) {
      onReplaceSelection(run.cabinetIds, run.cabinetIds[0] ?? null, null);
      onWorkspaceTabChange("plan");
      onActiveSheetChange("plan");
      setMaximizedPane(null);
    }

    function handleSelectOpening(cabinetId: string, openingId: string) {
      onSelectOpening?.(cabinetId, openingId);
      onWorkspaceTabChange("front");
      onActiveSheetChange("front");
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
                  if (tab.id === "plan" || tab.id === "front" || tab.id === "side") {
                    onActiveSheetChange(tab.id);
                  }
                  setMaximizedPane(null);
                }}
                onDoubleClick={() => {
                  onWorkspaceTabChange(tab.id);
                  if (tab.id === "plan" || tab.id === "front" || tab.id === "side") {
                    onActiveSheetChange(tab.id);
                  }
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
            className={`tb-btn ${sheetBrowserVisible ? "tb-accent" : ""}`}
            title="Toggle sheet browser"
            onClick={onToggleSheetBrowser}
          >
            Sheets
          </button>
          <button
            type="button"
            className={`tb-btn ${sceneBrowserVisible ? "tb-accent" : ""}`}
            title="Toggle scene browser"
            onClick={onToggleSceneBrowser}
          >
            Objects
          </button>
          <span className="workspace-focus-hint">
            Sheets · Plan/Front/Side/Section/Detail/Report
            {maximizedPane ? " · max" : ""}
          </span>
        </div>

        <div className="workspace-body">
          {sheetBrowserVisible ? (
            <WorkspaceSheetBrowser
              project={project}
              activeSheetId={activeSheetId}
              onSelectSheet={handleSelectSheet}
              onRenameSheet={onRenameSheet}
              onSetSheetNotes={onSetSheetNotes}
              onAddCombinedSheet={onAddCombinedSheet}
              onPlaceView={onPlaceView}
            />
          ) : null}

          {sceneBrowserVisible ? (
            <WorkspaceSceneBrowser
              rooms={rooms}
              activeRoomId={activeRoomId}
              runs={planningWorkflow.runs}
              activeCabinetId={activeCabinetId}
              selectedCabinetIds={selectedCabinetIds}
              activeOpeningId={activeOpeningId}
              isolatedCabinetIds={isolatedCabinetIds}
              onSelectRoom={onSelectRoom}
              onSelectCabinet={(cabinetId, additive) =>
                onSelectCabinet(cabinetId, additive)
              }
              onSelectRun={handleSelectRun}
              onSelectOpening={handleSelectOpening}
              onSelectCabinets={onSelectCabinetsFromTree}
              onRenameCabinet={onRenameCabinet}
              onRenameRoom={onRenameRoom}
              onIsolate={onTreeIsolate}
              onFocus={onTreeFocus}
              onReorderCabinet={onTreeReorder}
              onCabinetContextMenu={onCabinetContextMenu}
            />
          ) : null}

          <div className="workspace-canvas">
            <WorkspaceSplitCanvas
              ref={sceneRef}
              workspaceTab={workspaceTab}
              activeSheetId={activeSheetId}
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
              onSelectSheet={handleSelectSheet}
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
              onUpdateNote={onUpdateNote}
              onUpdateLeader={onUpdateLeader}
              onDeleteNote={onDeleteNote}
              onDeleteLeader={onDeleteLeader}
              onUpsertDimOffset={onUpsertDimOffset}
              onResetDimOffset={onResetDimOffset}
              onUpsertTagOffset={onUpsertTagOffset}
              onResetTagOffset={onResetTagOffset}
              onCabinetContextMenu={onCabinetContextMenu}
              onPointerWorld={onPointerWorld}
            />
          </div>
        </div>
      </section>
    );
  },
);
