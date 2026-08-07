import { forwardRef } from "react";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./CabinetScene";
import { TwoDView, type DraftingTool } from "./TwoDView";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { CabinetDimensions, CabinetPlacement } from "../domain/cabinetDimensions";
import type { PanelName } from "../domain/cabinetGeometry";
import type { RoomConfig } from "../domain/roomModel";
import type { DraftingDisplayPreferences, DraftingLeader, DraftingNote } from "../domain/draftingAnnotations";
import type { CabinetPlanningWorkflow } from "../domain/cabinetLibrary";

type WorkspaceTab = "plan" | "front" | "side" | "3d";

type AppWorkspaceProps = {
  workspaceTab: WorkspaceTab;
  workspaceLabel: string;
  draftingTool: DraftingTool;
  project: CabinetProject;
  room: RoomConfig;
  planningWorkflow: CabinetPlanningWorkflow;
  snapSizeMm: number;
  showGrid: boolean;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
  draftingDisplay: DraftingDisplayPreferences;
  onWorkspaceTabChange: (tab: WorkspaceTab) => void;
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
  onAddNote: (note: DraftingNote) => void;
  onAddLeader: (leader: DraftingLeader) => void;
  onWorkspaceContextMenu?: (point: { x: number; y: number }) => void;
  tabShortcutHints?: Partial<Record<WorkspaceTab, string>>;
};

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
      onAddNote,
      onAddLeader,
      onWorkspaceContextMenu,
      tabShortcutHints,
    },
    sceneRef,
  ) {
    const twoDViewKind =
      workspaceTab === "front"
        ? "front"
        : workspaceTab === "side"
          ? "side"
          : "top";

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
        <div className="workspace-tabs" role="tablist" aria-label="Workspace views">
          {(
            [
              { id: "plan", label: "Plan" },
              { id: "front", label: "Front Elevation" },
              { id: "side", label: "Side Elevation" },
              { id: "3d", label: "3D" },
            ] as const
          ).map((tab) => (
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
              onClick={() => onWorkspaceTabChange(tab.id)}
              onDoubleClick={() => {
                onWorkspaceTabChange(tab.id);
                onDraftingToolChange("select");
              }}
            >
              {tab.label}
              {tabShortcutHints?.[tab.id] ? (
                <kbd className="workspace-tab-kbd">{tabShortcutHints[tab.id]}</kbd>
              ) : null}
            </button>
          ))}
        </div>

        <div className="workspace-canvas">
          {workspaceTab === "3d" ? (
            <div className="viewport-panel" aria-label="3D room viewport">
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
          ) : (
            <div className="drawing-sheet" aria-label={`${workspaceLabel} drawing`}>
              <div className="drawing-sheet-meta">
                <span>{workspaceLabel}</span>
                <span>
                  {draftingTool !== "select"
                    ? draftingTool === "note"
                      ? "Note tool · click to place text note"
                      : "Leader tool · click target, then label"
                    : selectedCabinetIds.length > 0
                      ? `${selectedCabinetIds.length} selected · drag to move · snap ${snapSizeMm} mm · selected dims on`
                      : "Click to select · drag cabinets · snap guides · dimension chains"}
                </span>
                <span className="drawing-drafting-tools">
                  {(
                    [
                      ["select", "Select"],
                      ["note", "Note"],
                      ["leader", "Leader"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`tb-btn ${draftingTool === id ? "tb-accent" : ""}`}
                      onClick={() => onDraftingToolChange(id)}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </div>
              <div className="drawing-sheet-scroll">
                <TwoDView
                  project={project}
                  room={room}
                  view={twoDViewKind}
                  countertops={planningWorkflow.countertops}
                  runs={planningWorkflow.runs}
                  selectedCabinetIds={selectedCabinetIds}
                  activeCabinetId={activeCabinetId}
                  snapSizeMm={snapSizeMm}
                  showGrid={showGrid}
                  draftingDisplay={draftingDisplay}
                  draftingTool={draftingTool}
                  onSelectCabinet={onSelectCabinet}
                  onCabinetMove={onCabinetMove}
                  onAddNote={onAddNote}
                  onAddLeader={onAddLeader}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  },
);
