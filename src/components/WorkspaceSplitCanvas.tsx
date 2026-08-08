import { forwardRef, useMemo, useRef, useState } from "react";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./CabinetScene";
import { DrawingSheetChrome } from "./DrawingSheetChrome";
import { DrawingSheetTabs } from "./DrawingSheetTabs";
import { ElevationOpeningToolbar } from "./ElevationOpeningToolbar";
import { TechnicalObjectToolbar } from "./TechnicalObjectToolbar";
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
import type { TechnicalObjectSelection } from "../domain/draftingEdit";
import type { CabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { ElevationOpeningCommand } from "../domain/elevationOpeningEdit";
import type { DrawingSheetId } from "../domain/drawingSheets";
import { getDrawingSheet } from "../domain/drawingSheets";
import type { WorkspaceTabId } from "../domain/desktopUx/layoutPrefs";
import { clampJobMeta, formatJobTitle } from "../domain/jobMeta";
import type { ViewPreset } from "./cabinetScene/types";

type WorkspaceSplitCanvasProps = {
  workspaceTab: WorkspaceTabId;
  activeSheetId: DrawingSheetId;
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
  onSelectSheet: (sheetId: DrawingSheetId) => void;
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
  },
  sceneRef,
) {
  const splitRef = useRef<HTMLDivElement | null>(null);
  const [draftSelection, setDraftSelection] =
    useState<TechnicalObjectSelection>(null);
  const elevTab: WorkspaceTabId = workspaceTab === "side" ? "side" : "front";
  const elevView = elevTab === "side" ? "side" : "front";
  const elevTitle = elevTab === "side" ? "Side Elevation" : "Front Elevation";
  const activeCabinet = project.cabinets.find(
    (cabinet) => cabinet.id === activeCabinetId,
  );
  const maxKey =
    maximizedPane === "side" ? "front" : maximizedPane;
  const sheetMode =
    activeSheetId === "section" ||
    activeSheetId === "detail" ||
    activeSheetId === "report"
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

  const sheetMetaFor = (id: DrawingSheetId) => {
    const def = getDrawingSheet(id);
    return {
      code: def.code,
      title: def.title,
      scaleText: def.scaleText,
      projectName,
      revision,
    };
  };

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
  } as const;

  function setCameraPreset(preset: ViewPreset) {
    const handle =
      sceneRef && typeof sceneRef === "object" ? sceneRef.current : null;
    handle?.setViewPreset(preset);
  }

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

  return (
    <div className="workspace-drafting-root">
      <DrawingSheetTabs
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
          <WorkspaceViewPane
            paneId={activeSheetId}
            title={getDrawingSheet(activeSheetId).title}
            subtitle={getDrawingSheet(activeSheetId).code}
            focused
            maximized
            onFocus={() => onSelectSheet(activeSheetId)}
            onToggleMaximize={() => onFocusPane("plan")}
            toolbar={
              activeSheetId === "section" || activeSheetId === "detail"
                ? draftingTools
                : undefined
            }
          >
            <DrawingSheetChrome
              meta={sheetMetaFor(activeSheetId)}
              active
              banner={objectToolbar}
            >
              <TwoDView
                {...twoDCommon}
                view={
                  activeSheetId === "report"
                    ? "report"
                    : activeSheetId === "detail"
                      ? "detail"
                      : "section"
                }
                draftingTool={
                  activeSheetId === "report" ? "select" : draftingTool
                }
              />
            </DrawingSheetChrome>
          </WorkspaceViewPane>
        ) : (
          <>
            <WorkspaceViewPane
              paneId="plan"
              title="Plan"
              subtitle={getDrawingSheet("plan").code}
              focused={workspaceTab === "plan" || activeSheetId === "plan"}
              maximized={maximizedPane === "plan"}
              onFocus={() => {
                onSelectSheet("plan");
                onFocusPane("plan");
              }}
              onToggleMaximize={() => onToggleMaximize("plan")}
              toolbar={draftingTools}
            >
              <DrawingSheetChrome
                meta={sheetMetaFor("plan")}
                active={activeSheetId === "plan"}
                banner={objectToolbar}
              >
                <TwoDView {...twoDCommon} view="top" />
              </DrawingSheetChrome>
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
              subtitle={getDrawingSheet(elevTab === "side" ? "side" : "front").code}
              focused={
                workspaceTab === "front" ||
                workspaceTab === "side" ||
                activeSheetId === "front" ||
                activeSheetId === "side"
              }
              maximized={maximizedPane === "front" || maximizedPane === "side"}
              onFocus={() => {
                onSelectSheet(elevTab === "side" ? "side" : "front");
                onFocusPane(elevTab);
              }}
              onToggleMaximize={() => onToggleMaximize(elevTab)}
              toolbar={draftingTools}
            >
              <DrawingSheetChrome
                meta={sheetMetaFor(elevTab === "side" ? "side" : "front")}
                active={
                  activeSheetId === "front" || activeSheetId === "side"
                }
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
              >
                <TwoDView {...twoDCommon} view={elevView} />
              </DrawingSheetChrome>
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
              <div
                className="viewport-panel viewport-panel-embedded"
                aria-label="3D room viewport"
              >
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
                        Array.from(
                          new Set([...selectedCabinetIds, ...cabinetIds]),
                        ),
                        cabinetIds[0] ?? activeCabinetId,
                        null,
                      );
                      return;
                    }
                    onReplaceSelection(
                      cabinetIds,
                      cabinetIds[0] ?? null,
                      null,
                    );
                  }}
                />
              </div>
            </WorkspaceViewPane>
          </>
        )}
      </div>
    </div>
  );
});
