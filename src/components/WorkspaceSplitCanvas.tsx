import { forwardRef, useMemo, useRef, useState } from "react";
import type { CabinetSceneHandle } from "./CabinetScene";
import { DrawingSheetTabs } from "./DrawingSheetTabs";
import { ElevationOpeningToolbar } from "./ElevationOpeningToolbar";
import { TechnicalObjectToolbar } from "./TechnicalObjectToolbar";
import { WorkspaceDrawingPane } from "./WorkspaceDrawingPane";
import { WorkspaceScenePane } from "./WorkspaceScenePane";
import { WorkspaceSplitHandle } from "./WorkspaceSplitHandle";
import { DraftingToolButtons } from "./WorkspacePaneTools";
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
import type { TechnicalObjectSelection } from "../domain/draftingEdit";
import type { CabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { ElevationOpeningCommand } from "../domain/elevationOpeningEdit";
import type { DrawingSheetId } from "../domain/drawingSheets";
import {
  catalogIdFromSheetId,
  findSheetDocument,
  getProjectSheetSet,
} from "../domain/sheetDocuments";
import type { WorkspaceTabId } from "../domain/desktopUx/layoutPrefs";
import { clampJobMeta, formatJobTitle } from "../domain/jobMeta";

type WorkspaceSplitCanvasProps = {
  workspaceTab: WorkspaceTabId;
  activeSheetId: string;
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
  onSelectSheet: (sheetId: string) => void;
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
  onUpdateNote: (note: DraftingNote) => void;
  onUpdateLeader: (leader: DraftingLeader) => void;
  onDeleteNote: (id: string) => void;
  onDeleteLeader: (id: string) => void;
  onUpsertDimOffset: (id: string, dx: number, dy: number) => void;
  onResetDimOffset: (id: string) => void;
  onUpsertTagOffset: (cabinetId: string, dx: number, dy: number) => void;
  onResetTagOffset: (cabinetId: string) => void;
  onCabinetContextMenu?: (
    cabinetId: string,
    point: { x: number; y: number },
  ) => void;
  onPointerWorld?: (
    point: import("../domain/draftingAnnotations").DraftingWorldPoint | null,
  ) => void;
};

export const WorkspaceSplitCanvas = forwardRef<
  CabinetSceneHandle,
  WorkspaceSplitCanvasProps
>(function WorkspaceSplitCanvas(
  {
    workspaceTab,
    activeSheetId,
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
    onSelectSheet,
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
    onUpdateNote,
    onUpdateLeader,
    onDeleteNote,
    onDeleteLeader,
    onUpsertDimOffset,
    onResetDimOffset,
    onUpsertTagOffset,
    onResetTagOffset,
    onCabinetContextMenu,
    onPointerWorld,
  },
  sceneRef,
) {
  const splitRef = useRef<HTMLDivElement | null>(null);
  const [draftSelection, setDraftSelection] =
    useState<TechnicalObjectSelection>(null);
  const elevTab: WorkspaceTabId = workspaceTab === "side" ? "side" : "front";
  const elevView = elevTab === "side" ? "side" : "front";
  const elevSheetId: DrawingSheetId = elevTab === "side" ? "side" : "front";
  const elevTitle = elevTab === "side" ? "Side Elevation" : "Front Elevation";
  const activeCabinet = project.cabinets.find(
    (cabinet) => cabinet.id === activeCabinetId,
  );
  const maxKey =
    maximizedPane === "side" ? "front" : maximizedPane;
  const activeDoc = useMemo(
    () => findSheetDocument(getProjectSheetSet(project), activeSheetId),
    [project, activeSheetId],
  );
  const catalogSheetId = catalogIdFromSheetId(activeSheetId);
  const isComposition = (activeDoc?.viewports.length ?? 0) > 1;
  const sheetMode =
    workspaceTab !== "3d" &&
    (isComposition ||
      catalogSheetId === "section" ||
      catalogSheetId === "detail" ||
      catalogSheetId === "report")
      ? "single"
      : "split";
  const splitClass = [
    "workspace-split",
    maxKey ? `is-max-${maxKey}` : "",
    sheetMode === "single" ? "is-sheet-single" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const projectName = useMemo(() => {
    const job = clampJobMeta(project.job);
    return formatJobTitle(job);
  }, [project.job]);
  const revision = useMemo(
    () => clampJobMeta(project.job).revision,
    [project.job],
  );

  const twoDCommon = {
    project,
    room,
    countertops: planningWorkflow.countertops,
    runs: planningWorkflow.runs,
    fillers: planningWorkflow.fillers,
    selectedCabinetIds,
    activeCabinetId,
    activeOpeningId,
    draftSelection,
    snapSizeMm,
    showGrid,
    draftingDisplay,
    draftingTool,
    onSelectCabinet,
    onSelectOpening,
    onSelectDraftObject: setDraftSelection,
    onCabinetMove,
    onAddNote,
    onAddLeader,
    onUpdateNote,
    onUpdateLeader,
    onUpsertDimOffset,
    onUpsertTagOffset,
    onPointerWorld,
    onCabinetContextMenu,
  } as const;

  const draftingTools = (
    <DraftingToolButtons
      draftingTool={draftingTool}
      onDraftingToolChange={onDraftingToolChange}
    />
  );

  const objectToolbar = (
    <TechnicalObjectToolbar
      selection={draftSelection}
      drafting={project.drafting}
      draftingTool={draftingTool}
      onUpdateNoteText={(id, text) => {
        const note = project.drafting?.notes?.find((item) => item.id === id);
        if (!note) return;
        onUpdateNote({ ...note, text });
      }}
      onUpdateLeaderText={(id, text) => {
        const leader = project.drafting?.leaders?.find((item) => item.id === id);
        if (!leader) return;
        onUpdateLeader({ ...leader, text });
      }}
      onDeleteNote={(id) => {
        onDeleteNote(id);
        setDraftSelection(null);
      }}
      onDeleteLeader={(id) => {
        onDeleteLeader(id);
        setDraftSelection(null);
      }}
      onResetDimOffset={onResetDimOffset}
      onResetTagOffset={onResetTagOffset}
    />
  );

  const restoreSheetId: DrawingSheetId =
    workspaceTab === "plan" || workspaceTab === "front" || workspaceTab === "side"
      ? workspaceTab
      : "front";

  const singleView =
    catalogSheetId === "report"
      ? "report"
      : catalogSheetId === "detail"
        ? "detail"
        : catalogSheetId === "section"
          ? "section"
          : activeDoc?.primaryView === "front"
            ? "front"
            : activeDoc?.primaryView === "side"
              ? "side"
              : "top";
  const singleSheetId = activeDoc?.id ?? catalogSheetId;

  return (
    <div className="workspace-drafting-root">
      <DrawingSheetTabs
        project={project}
        activeSheetId={activeSheetId}
        onSelectSheet={onSelectSheet}
      />

      <div
        ref={splitRef}
        className={splitClass}
        style={{
          ["--split-plan-pct" as string]: `${splitPlanWidthPct}%`,
          ["--split-top-pct" as string]: `${splitTopRowPct}%`,
        }}
      >
        {sheetMode === "single" ? (
          <WorkspaceDrawingPane
            paneId={singleSheetId}
            sheetId={singleSheetId}
            title={activeDoc?.name}
            focused
            maximized
            projectName={projectName}
            revision={revision}
            view={singleView}
            draftingToolbar={
              catalogSheetId === "section" ||
              catalogSheetId === "detail" ||
              isComposition
                ? draftingTools
                : undefined
            }
            banner={objectToolbar}
            onFocus={() => onSelectSheet(singleSheetId)}
            onToggleMaximize={() => {
              onSelectSheet(restoreSheetId);
              onFocusPane(workspaceTab);
            }}
            twoDProps={{
              ...twoDCommon,
              draftingTool:
                catalogSheetId === "report" ? "select" : draftingTool,
            }}
          />
        ) : (
          <>
            <WorkspaceDrawingPane
              paneId="plan"
              sheetId="plan"
              title="Plan"
              focused={workspaceTab === "plan" || catalogSheetId === "plan"}
              maximized={maximizedPane === "plan"}
              projectName={projectName}
              revision={revision}
              view="top"
              draftingToolbar={draftingTools}
              banner={objectToolbar}
              onFocus={() => {
                onSelectSheet("plan");
                onFocusPane("plan");
              }}
              onToggleMaximize={() => onToggleMaximize("plan")}
              twoDProps={twoDCommon}
            />

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

            <WorkspaceDrawingPane
              paneId="front"
              sheetId={elevSheetId}
              title={elevTitle}
              focused={
                workspaceTab === "front" ||
                workspaceTab === "side" ||
                catalogSheetId === "front" ||
                catalogSheetId === "side"
              }
              maximized={maximizedPane === "front" || maximizedPane === "side"}
              projectName={projectName}
              revision={revision}
              view={elevView}
              draftingToolbar={draftingTools}
              banner={
                <>
                  {objectToolbar}
                  {elevView === "front" && onElevationOpeningCommand ? (
                    <ElevationOpeningToolbar
                      config={activeCabinet?.config ?? null}
                      activeOpeningId={
                        activeCabinetId === activeCabinet?.id
                          ? activeOpeningId
                          : null
                      }
                      draftingTool={draftingTool}
                      onCommand={(command) => {
                        if (!activeCabinetId) return;
                        onElevationOpeningCommand(activeCabinetId, command);
                      }}
                    />
                  ) : null}
                </>
              }
              onFocus={() => {
                onSelectSheet(elevSheetId);
                onFocusPane(elevTab);
              }}
              onToggleMaximize={() => onToggleMaximize(elevTab)}
              twoDProps={twoDCommon}
            />

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

            <WorkspaceScenePane
              sceneRef={sceneRef}
              focused={workspaceTab === "3d"}
              maximized={maximizedPane === "3d"}
              project={project}
              room={room}
              countertops={planningWorkflow.countertops}
              fillers={planningWorkflow.fillers}
              snapSizeMm={snapSizeMm}
              showGrid={showGrid}
              selectedCabinetIds={selectedCabinetIds}
              activeCabinetId={activeCabinetId}
              selectedPanelName={selectedPanelName}
              onFocus={() => onFocusPane("3d")}
              onToggleMaximize={() => onToggleMaximize("3d")}
              onCabinetMove={onCabinetMove}
              onCabinetRotate={onCabinetRotate}
              onCabinetResize={onCabinetResize}
              onReplaceSelection={onReplaceSelection}
              onToggleCabinetSelection={onToggleCabinetSelection}
            />
          </>
        )}
      </div>
    </div>
  );
});
