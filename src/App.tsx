import "./App.css";
import { AppRibbon } from "./components/AppRibbon";
import { AppCommandSurfaces } from "./components/AppCommandSurfaces";
import { AppStatusDock } from "./components/AppStatusDock";
import { AppMainBody } from "./components/AppMainBody";
import { ReportCenter } from "./components/ReportCenter";
import { JobWorkspace } from "./components/JobWorkspace";
import { LivingRoomPlanWorkspace } from "./components/LivingRoomPlanWorkspace";
import { createWallLayoutSummary, type WallLayoutSide } from "./domain/wallLayout";
import { useAppController } from "./hooks/useAppController";
import { getProjectSheetSet } from "./domain/sheetDocuments";
import {
  cycleSnapSizeMm,
  workbenchBreadcrumb,
  WORKBENCH_LABELS,
  type WorkbenchMode,
} from "./domain/desktopUx";

function App() {
  const c = useAppController();
  const workbenchMode = c.layout.workbenchMode;
  const activeRoom = c.projectRooms.find(
    (room) => room.id === (c.project.activeRoomId ?? c.projectRooms[0]?.id),
  );
  const breadcrumb = workbenchBreadcrumb(
    workbenchMode,
    activeRoom?.name ?? "Room",
    c.selectedCabinet?.name,
  );
  const activeWallSide = c.layout.activeWallSide;
  const wallLayout = createWallLayoutSummary({
    project: c.project,
    room: c.room,
    roomBounds: c.roomBounds,
    workflow: c.planningWorkflow,
    side: activeWallSide,
  });
  const activeWallRun =
    c.planningWorkflow.runs.find(
      (run) =>
        run.side === activeWallSide &&
        Boolean(c.activeCabinetId && run.cabinetIds.includes(c.activeCabinetId)),
    ) ?? null;

  function handleActiveWallChange(side: WallLayoutSide) {
    const view = side === "back-wall" ? "front" : "side";
    c.setLayout({ activeWallSide: side, workspaceTab: view });
    c.handleSelectSheetDocument(view);
    c.setDraftingTool("select");
  }

  function handleWorkbenchModeChange(mode: WorkbenchMode) {
    const patch: Parameters<typeof c.setLayout>[0] = {
      workbenchMode: mode,
      statusDockOpen: false,
    };
    if (mode === "room") {
      patch.workspaceTab = "plan";
      patch.sheetBrowserVisible = false;
    } else if (mode === "cabinets") {
      patch.workspaceTab = c.activeOpeningId ? "front" : c.workspaceTab;
      patch.sheetBrowserVisible = false;
    } else if (mode === "drawings") {
      patch.sheetBrowserVisible = true;
      patch.sceneBrowserVisible = false;
    } else if (mode === "interiors") {
      patch.workspaceTab = "plan";
      patch.sceneBrowserVisible = false;
      patch.sheetBrowserVisible = false;
      if (!c.livingRoomDocument) c.openLivingRoomProjectHome();
    }
    c.setLayout(patch);
    c.setDraftingTool("select");
  }

  return (
    <main
      className={`app-shell${workbenchMode === "interiors" ? " app-shell-interiors" : ""}`}
      style={{
        ["--tool-rail-width" as string]: `${c.layout.toolRailWidthPx}px`,
        ["--inspector-width" as string]: `${c.layout.inspectorWidthPx}px`,
        ["--status-dock-height" as string]: `${c.layout.statusDockHeightPx}px`,
      }}
    >
      {workbenchMode !== "interiors" ? <AppRibbon
        workbenchMode={workbenchMode}
        workspaceLabel={
          workbenchMode === "room" ||
          workbenchMode === "cabinets" ||
          workbenchMode === "drawings"
            ? c.workspaceLabel
            : activeRoom?.name ?? "Project"
        }
        workspaceTab={c.workspaceTab}
        canUndo={c.canUndo}
        canRedo={c.canRedo}
        hasSelection={c.selectedCabinetIds.length > 0}
        hasClipboard={c.clipboardRef.current.length > 0}
        selectionCount={c.selectedCabinetIds.length}
        toolRailVisible={c.layout.toolRailVisible}
        inspectorVisible={c.layout.inspectorVisible}
        recentFiles={c.recentFiles}
        isDirty={c.isProjectDirty}
        onNew={c.handleReset}
        onOpen={c.handleLoadProject}
        onSave={c.handleSaveProject}
        onOpenRecent={(path) => { void c.handleOpenRecentFile(path); }}
        onClearRecent={c.forgetFile}
        onUndo={c.handleUndo}
        onRedo={c.handleRedo}
        onCopy={c.handleCopySelection}
        onPaste={c.handlePasteSelection}
        onDuplicate={c.handleDuplicateCabinet}
        onAlignRuns={c.handleAutoAlignRuns}
        onAlign={c.handleAlignSelection}
        onExportJson={c.handleExportProjectJson}
        onExportCsv={c.handleExportCutlistCsv}
        onExportPdf={c.handleExportPdf}
        onSetViewPreset={(preset) => c.sceneRef.current?.setViewPreset(preset)}
        onToggleToolRail={c.toggleToolRail}
        onToggleInspector={c.toggleInspector}
        onOpenCommands={() => {
          c.setIsCommandBarOpen(true);
          c.setIsShortcutSheetOpen(false);
        }}
        onOpenShortcuts={() => {
          c.setIsShortcutSheetOpen(true);
          c.setIsCommandBarOpen(false);
        }}
        onWorkbenchModeChange={handleWorkbenchModeChange}
      /> : null}

      <AppMainBody
        workbenchMode={workbenchMode}
        reportWorkspace={(
          <section className="workflow-output-workspace" aria-label={`${WORKBENCH_LABELS[workbenchMode]} workspace`}>
            <header className="workflow-output-header">
              <div>
                <strong>{WORKBENCH_LABELS[workbenchMode]}</strong>
                <span>{breadcrumb}</span>
              </div>
              <small>{workbenchMode === "production" ? "Workshop preparation and costing" : "Project documents and approvals"}</small>
            </header>
            <ReportCenter
              key={workbenchMode}
              mode={workbenchMode === "production" ? "production" : "reports"}
              report={c.projectReport}
              wholeProject={c.wholeProjectReport}
              machineJob={c.machineJobDocument}
              onExportMachineJson={() => { void c.handleExportMachineJson(); }}
              onExportMachineCsv={() => { void c.handleExportMachineCsv(); }}
              selectedCabinetId={c.activeCabinetId}
              costingSettings={c.costingSettings}
              quoteSettings={c.quoteSettings}
              sheetOptimizerSettings={c.sheetOptimizerSettings}
              onCostingChange={(costing) => c.handleProjectPreferenceChange({ costing })}
              onQuoteChange={(quote) => c.handleProjectPreferenceChange({ quote })}
              onSheetOptimizerChange={(sheetOptimizer) => c.handleProjectPreferenceChange({ sheetOptimizer })}
              onFreezeQuote={c.handleFreezeQuoteSnapshot}
              onSelectCabinet={(cabinetId) => {
                c.handleWorkspaceSelectCabinet(cabinetId, false);
                handleWorkbenchModeChange("cabinets");
              }}
              onFreezeRevision={c.handleFreezeRevision}
              onAddReviewNote={c.handleAddReviewNote}
              onResolveReviewNote={c.handleResolveReviewNote}
              onApproveReview={c.handleApproveReview}
              onReleaseForProduction={c.handleReleaseForProduction}
              onExportRevisionSummary={() => { void c.handleExportRevisionSummary(); }}
              approvalBlockedReasons={c.approvalGate.reasons}
              releaseBlockedReasons={c.releaseGate.reasons}
              sheets={getProjectSheetSet(c.project).sheets}
              onOpenSheet={(sheetId) => {
                c.handleSelectSheetDocument(sheetId);
                handleWorkbenchModeChange("drawings");
              }}
            />
          </section>
        )}
        jobWorkspace={(
          <JobWorkspace
            job={c.project.job ?? c.defaultCabinetProject.job!}
            roomCount={c.projectRooms.length}
            cabinetCount={c.project.cabinets.length}
            projectStatus={c.projectStatus}
            onNew={c.handleReset}
            onOpen={c.handleLoadProject}
            onSave={c.handleSaveProject}
            onNavigate={handleWorkbenchModeChange}
          />
        )}
        interiorWorkspace={(
          <LivingRoomPlanWorkspace
            project={c.livingRoomDocument}
            selectedIds={c.selectedInteriorObjectIds}
            selectedObjects={c.selectedInteriorObjects}
            issues={c.livingRoomIssues}
            canUndo={c.canUndo}
            canRedo={c.canRedo}
            toolRailVisible={c.layout.toolRailVisible}
            inspectorVisible={c.layout.inspectorVisible}
            toolRailWidthPx={c.layout.toolRailWidthPx}
            inspectorWidthPx={c.layout.inspectorWidthPx}
            projectHomeOpen={c.livingRoomProjectHomeOpen}
            isDirty={c.isProjectDirty}
            autosaveState={c.autosaveState}
            lastAutosavedAt={c.lastAutosavedAt}
            recovery={c.recovery}
            recentProjects={c.sortedSavedProjects}
            onCreateStarter={(options) => {
              c.setProjectFilePath(null);
              c.createLivingRoomStarter(options);
            }}
            onOpenDemo={() => {
              c.setProjectFilePath(null);
              c.discardRecovery();
              c.openLivingRoomReleaseDemo();
            }}
            onOpenPhase1Benchmark={(benchmarkId) => {
              c.setProjectFilePath(null);
              c.discardRecovery();
              c.openPhase1Benchmark(benchmarkId);
            }}
            onOpenProjectHome={c.openLivingRoomProjectHome}
            onCloseProjectHome={c.closeLivingRoomProjectHome}
            onOpenRecentProject={(projectId) => {
              c.setProjectFilePath(null);
              c.handleLoadSavedProject(projectId);
              c.closeLivingRoomProjectHome();
            }}
            onDeleteRecentProject={c.handleDeleteSavedProject}
            onRestoreRecovery={() => {
              c.setProjectFilePath(null);
              c.restoreRecovery();
            }}
            onDiscardRecovery={c.discardRecovery}
            onSelect={c.selectInteriorObject}
            onMove={c.moveInteriorObject}
            onResize={c.resizeInteriorObject}
            onSetRotation={c.setInteriorObjectRotation}
            onSetMaterial={c.setInteriorObjectMaterial}
            onSetParameters={c.setInteriorObjectParameters}
            onRotateSelection={c.rotateInteriorSelection}
            onAddCatalogObject={c.addLivingRoomCatalogObject}
            onDuplicate={c.duplicateInteriorSelection}
            onDelete={c.deleteInteriorSelection}
            onAlign={c.alignInteriorSelection}
            onCreateCabinetRun={c.createLivingRoomCabinetRun}
            onNudge={c.nudgeInteriorSelection}
            onRoomDimensions={c.setLivingRoomDimensions}
            onAddOpening={c.addLivingRoomOpening}
            onUpdateOpening={c.updateLivingRoomOpening}
            onDeleteOpening={c.deleteLivingRoomOpening}
            onSetPlanUnderlay={c.setLivingRoomPlanUnderlay}
            onApplyStyle={c.setLivingRoomStyle}
            onRenderSettingsChange={c.setLivingRoomRenderSettings}
            onLightingChange={c.setLivingRoomLightingRecipe}
            onRenderBrowserThumbnail={(dataUrl) => {
              void c.setLivingRoomBrowserThumbnail(dataUrl);
            }}
            onUndo={c.handleUndo}
            onRedo={c.handleRedo}
            onOpenProject={c.handleLoadProject}
            onSaveProject={c.handleSaveProject}
            onExportProject={c.handleExportProjectJson}
            onWorkbenchModeChange={handleWorkbenchModeChange}
          />
        )}
        toolRailVisible={c.layout.toolRailVisible}
        inspectorVisible={c.layout.inspectorVisible}
        toolRailWidthPx={c.layout.toolRailWidthPx}
        inspectorWidthPx={c.layout.inspectorWidthPx}
        onToolRailWidthChange={(toolRailWidthPx) => c.setLayout({ toolRailWidthPx })}
        onInspectorWidthChange={(inspectorWidthPx) => c.setLayout({ inspectorWidthPx })}
        sceneRef={c.sceneRef}
        toolRailProps={{
          workbenchMode,
          activeWall: activeWallSide,
          wallLayout,
          onActiveWallChange: handleActiveWallChange,
          onSelectWallCabinets: () =>
            c.replaceSelection(
              wallLayout.cabinetIds,
              wallLayout.cabinetIds[0] ?? null,
              null,
            ),
          onAutoPackWallRuns: () => c.handleAutoAlignWallRuns(activeWallSide),
          onFinishWallRunEnds: () => c.handleCompleteWallRuns(activeWallSide),
          templates: c.userTemplates,
          userCabinetPresets: c.workshopLibrary.cabinetPresets,
          rooms: c.projectRooms,
          activeRoomId: c.project.activeRoomId ?? c.projectRooms[0]?.id ?? null,
          runs: c.planningWorkflow.runs,
          activeCabinetId: c.activeCabinetId,
          activeOpeningId: c.activeOpeningId,
          selectedCabinetIds: c.selectedCabinetIds,
          isolatedCabinetIds: c.isolatedCabinetIds,
          savedProjects: c.sortedSavedProjects,
          onAddFamily: (type) => c.handleAddCabinetToWall(type, activeWallSide),
          onAddLibraryItem: (itemId) =>
            c.handleAddLibraryItemToWall(itemId, activeWallSide),
          onAddTemplate: (templateId) =>
            c.handleAddTemplateToWall(templateId, activeWallSide),
          onDeleteTemplate: c.handleDeleteTemplate,
          onApplyStarter: c.handleApplyStarter,
          onOpenLibraryManager: () => c.setLibraryManagerOpen(true),
          onSelectCabinet: c.handleWorkspaceSelectCabinet,
          onSelectRoom: c.handleSelectProjectRoom,
          onSelectRun: (run) => {
            c.replaceSelection(run.cabinetIds, run.cabinetIds[0] ?? null, null);
            c.setWorkspaceTab("plan");
            c.handleSelectSheetDocument("plan");
          },
          onSelectOpening: (cabinetId, openingId) => {
            c.handleSelectOpening(cabinetId, openingId);
            handleWorkbenchModeChange("cabinets");
          },
          onSelectCabinets: c.handleTreeSelectCabinets,
          onRenameCabinet: c.handleRenameCabinet,
          onRenameRoomTo: c.handleRenameProjectRoomTo,
          onIsolate: c.handleTreeIsolate,
          onFocus: c.handleTreeFocus,
          onReorderCabinet: c.handleTreeReorder,
          onAddRoom: c.handleAddProjectRoom,
          onDuplicateRoom: c.handleDuplicateProjectRoom,
          onRenameRoom: c.handleRenameProjectRoom,
          onRemoveRoom: c.handleRemoveProjectRoom,
          onAddFromTemplate: c.handleAddRoomFromTemplate,
          onLoadRoomPreset: c.handleLoadRoomPreset,
          onDeleteSavedProject: c.handleDeleteSavedProject,
          onDuplicateSavedProject: c.handleDuplicateSavedProject,
          onLoadSavedProject: c.handleLoadSavedProject,
          onRenameSavedProject: c.handleRenameSavedProject,
          onSaveCurrentProject: c.saveCurrentProjectToBrowser,
          onProjectContextMenu: c.openProjectContextMenu,
        }}
        workspaceProps={{
          workbenchMode,
          breadcrumb,
          splitViewEnabled: c.layout.splitViewEnabled,
          activeWallSide,
          wallCabinetIds: wallLayout.cabinetIds,
          wallLengthMm: wallLayout.lengthMm,
          onCatalogDrop: (item, preferredPrimaryMm) => {
            if (item.kind === "family") {
              c.handleAddCabinetToWall(
                item.id as import("./domain/cabinetDimensions").CabinetType,
                activeWallSide,
                preferredPrimaryMm,
              );
            } else if (item.kind === "library") {
              c.handleAddLibraryItemToWall(item.id, activeWallSide, preferredPrimaryMm);
            } else {
              c.handleAddTemplateToWall(item.id, activeWallSide, preferredPrimaryMm);
            }
          },
          workspaceTab: c.workspaceTab,
          activeSheetId: getProjectSheetSet(c.project).activeSheetId,
          workspaceLabel: c.workspaceLabel,
          draftingTool: c.draftingTool,
          project: c.getVisibleProject(),
          room: c.room,
          planningWorkflow: c.planningWorkflow,
          rooms: c.projectRooms,
          activeRoomId: c.project.activeRoomId ?? c.projectRooms[0]?.id ?? null,
          snapSizeMm: c.projectPreferences.snapSizeMm,
          showGrid: c.projectPreferences.showGrid,
          selectedCabinetIds: c.selectedCabinetIds,
          activeCabinetId: c.activeCabinetId,
          activeOpeningId: c.activeOpeningId,
          selectedPanelName: c.selectedPanelName,
          draftingDisplay: c.draftingDisplay,
          splitPlanWidthPct: c.layout.splitPlanWidthPct,
          splitTopRowPct: c.layout.splitTopRowPct,
          sceneBrowserVisible: c.layout.sceneBrowserVisible,
          sheetBrowserVisible: c.layout.sheetBrowserVisible,
          onWorkspaceTabChange: (tab) => {
            c.setWorkspaceTab(tab);
            if (tab === "plan" || tab === "front" || tab === "side") {
              c.handleSelectSheetDocument(tab);
            }
            c.setDraftingTool("select");
          },
          onActiveSheetChange: c.handleSelectSheetDocument,
          onRenameSheet: c.handleRenameSheet,
          onSetSheetNotes: c.handleSetSheetNotes,
          onAddCombinedSheet: c.handleAddCombinedSheet,
          onPlaceView: c.handlePlaceView,
          onDraftingToolChange: c.setDraftingTool,
          onSplitPlanWidthChange: (splitPlanWidthPct) =>
            c.setLayout({ splitPlanWidthPct }),
          onSplitTopRowChange: (splitTopRowPct) =>
            c.setLayout({ splitTopRowPct }),
          onSplitViewEnabledChange: (splitViewEnabled) =>
            c.setLayout({ splitViewEnabled }),
          onToggleSceneBrowser: () =>
            c.setLayout({
              sceneBrowserVisible: !c.layout.sceneBrowserVisible,
            }),
          onToggleSheetBrowser: () =>
            c.setLayout({
              sheetBrowserVisible: !c.layout.sheetBrowserVisible,
            }),
          onSelectRoom: c.handleSelectProjectRoom,
          onCabinetMove: c.handleCabinetMove,
          onCabinetRotate: c.handleCabinetRotate,
          onCabinetResize: c.handleCabinetResize,
          onReplaceSelection: c.replaceSelection,
          onToggleCabinetSelection: c.toggleCabinetSelection,
          onSelectCabinet: c.handleWorkspaceSelectCabinet,
          onSelectOpening: (cabinetId, openingId) => {
            c.handleSelectOpening(cabinetId, openingId);
            handleWorkbenchModeChange("cabinets");
          },
          onSelectCabinetsFromTree: c.handleTreeSelectCabinets,
          onRenameCabinet: c.handleRenameCabinet,
          onRenameRoom: c.handleRenameProjectRoomTo,
          isolatedCabinetIds: c.isolatedCabinetIds,
          onTreeIsolate: c.handleTreeIsolate,
          onTreeFocus: c.handleTreeFocus,
          onTreeReorder: c.handleTreeReorder,
          onElevationOpeningCommand: c.handleElevationOpeningCommand,
          onAddNote: c.handleAddDraftingNote,
          onAddLeader: c.handleAddDraftingLeader,
          onUpdateNote: c.handleUpdateDraftingNote,
          onUpdateLeader: c.handleUpdateDraftingLeader,
          onDeleteNote: c.handleDeleteDraftingNote,
          onDeleteLeader: c.handleDeleteDraftingLeader,
          onUpsertDimOffset: c.handleUpsertDimOffset,
          onResetDimOffset: c.handleResetDimOffset,
          onUpsertTagOffset: c.handleUpsertTagOffset,
          onResetTagOffset: c.handleResetTagOffset,
          onWorkspaceContextMenu: c.openWorkspaceContextMenu,
          onCabinetContextMenu: c.openCabinetContextMenu,
          onPointerWorld: c.setPointerWorld,
          tabShortcutHints: c.tabShortcutHints,
        }}
        inspectorProps={{
          workbenchMode,
          activeWallRun,
          wallLayout,
          activeWallRunFillerCount: activeWallRun
            ? c.planningWorkflow.fillers.filter((item) => item.runId === activeWallRun.id).length
            : 0,
          activeWallRunCountertopCount: activeWallRun
            ? c.planningWorkflow.countertops.filter((item) => item.runId === activeWallRun.id).length
            : 0,
          onSelectActiveWallRun: () => {
            if (!activeWallRun) return;
            c.replaceSelection(
              activeWallRun.cabinetIds,
              activeWallRun.cabinetIds[0] ?? null,
              null,
            );
          },
          onAutoPackWallRuns: () => c.handleAutoAlignWallRuns(activeWallSide),
          onCompleteWallRuns: () => c.handleCompleteWallRuns(activeWallSide),
          onReplaceCabinetInRun: c.handleReplaceCabinetInRun,
          onSplitCabinetInRun: c.handleSplitCabinetInRun,
          onToggleCountertopBreak: c.handleToggleCountertopBreak,
          selectedCabinet: c.selectedCabinet,
          selectedCabinetIds: c.selectedCabinetIds,
          job: c.project.job ?? c.defaultCabinetProject.job!,
          onJobChange: c.handleJobMetaChange,
          projectDrafting: c.projectDrafting,
          draftingDisplay: c.draftingDisplay,
          onDraftingDisplayChange: (patch) =>
            c.handleProjectPreferenceChange({ drafting: patch }),
          onDraftingChange: c.handleDraftingChange,
          room: c.room,
          onRoomConfigChange: c.handleRoomConfigChange,
          project: c.project,
          cabinetCutlistItems: c.cabinetCutlistItems,
          selectedConfig: c.selectedConfig,
          constructionParts: c.selectedConstruction?.parts ?? [],
          derivedMetrics: c.derivedMetrics,
          cutlistItems: c.cutlistItems,
          projectFilePath: c.projectFilePath,
          projectStatus: c.projectStatus,
          savedProjects: c.sortedSavedProjects,
          snapSizeMm: c.projectPreferences.snapSizeMm,
          activeCabinetId: c.activeCabinetId,
          activeOpeningId: c.activeOpeningId,
          selectedPanelName: c.selectedPanelName,
          selectedPlacement: c.selectedPlacement,
          selectedLayerId: c.selectedLayerId,
          selectedGroupId: c.selectedGroupId,
          layers: c.layers,
          groups: c.groups,
          preferences: c.projectPreferences,
          validationMessages: c.validationMessages,
          manufacturingIssues: c.manufacturingIssues,
          onAttachmentChange: c.handleAttachmentChange,
          onAlignSelection: c.handleAlignSelection,
          onAssignLayer: c.handleAssignLayer,
          onConfigChange: c.handleConfigChange,
          onCopySelection: c.handleCopySelection,
          onCreateGroup: c.handleCreateGroup,
          onCreateLayer: c.handleDuplicateLayer,
          onClearGroup: c.handleClearGroup,
          onDeleteSavedProject: c.handleDeleteSavedProject,
          onDuplicateCabinet: c.handleDuplicateCabinet,
          onDuplicateSavedProject: c.handleDuplicateSavedProject,
          onExportCutlistCsv: c.handleExportCutlistCsv,
          onExportProjectJson: c.handleExportProjectJson,
          onExportPdf: c.handleExportPdf,
          onLayerChange: c.handleLayerChange,
          onLoadProject: c.handleLoadProject,
          onLoadSavedProject: c.handleLoadSavedProject,
          onPasteSelection: c.handlePasteSelection,
          onPlacementChange: c.handlePlacementChange,
          onPreferenceChange: c.handleProjectPreferenceChange,
          onSaveCabinetTemplate: c.handleSaveCabinetTemplate,
          onRemoveCabinet: c.handleRemoveCabinet,
          onRenameCabinet: c.handleRenameCabinet,
          onRenameSavedProject: c.handleRenameSavedProject,
          onReset: c.handleReset,
          onRotationChange: c.handleRotationChange,
          onSaveProject: c.handleSaveProject,
          onSaveToProjectBrowser: c.saveCurrentProjectToBrowser,
          onSelectCabinet: (cabinetId, additive) => {
            if (additive) {
              c.toggleCabinetSelection(cabinetId);
              return;
            }
            c.replaceSelection([cabinetId], cabinetId, null);
          },
          onSelectOpening: c.handleSelectOpening,
          onSelectAll: c.handleSelectAll,
          onUndo: c.handleUndo,
          onRedo: c.handleRedo,
        }}
      />

      <AppCommandSurfaces
        libraryManagerOpen={c.libraryManagerOpen}
        workshopLibrary={c.workshopLibrary}
        projectStandards={c.projectStandards}
        selectedConfig={c.selectedCabinet?.config ?? null}
        onLibraryChange={c.setWorkshopLibrary}
        onApplyStandardsPack={(standards) => {
          c.handleProjectPreferenceChange({ standards });
          c.setProjectStatus("Applied standards pack from library.");
        }}
        onCloseLibraryManager={() => c.setLibraryManagerOpen(false)}
        isCommandBarOpen={c.isCommandBarOpen}
        commandQuery={c.commandQuery}
        commandItems={c.commandItems}
        recentCommandIds={c.recentCommandIds}
        onQueryChange={c.setCommandQuery}
        onCloseCommandSurfaces={c.closeCommandSurfaces}
        onRunCommand={(commandId) =>
          c.setRecentCommandIds((ids) => c.upsertRecentCommandId(ids, commandId))
        }
        isShortcutSheetOpen={c.isShortcutSheetOpen}
        shortcutMap={c.shortcutMap}
        onChangeBinding={c.setBinding}
        onResetShortcuts={c.resetShortcuts}
        contextMenu={c.contextMenu}
        onCloseContextMenu={() => c.setContextMenu(null)}
      />

      {workbenchMode !== "interiors" ? <AppStatusDock
        workbenchMode={workbenchMode}
        project={c.project}
        projectStatus={c.projectStatus}
        workspaceLabel={WORKBENCH_LABELS[workbenchMode]}
        selectedCabinet={c.selectedCabinet}
        selectedCabinetIds={c.selectedCabinetIds}
        validationMessages={c.validationMessages}
        statusDockOpen={false}
        dockHeightPx={c.layout.statusDockHeightPx}
        onToggleStatusDock={() => handleWorkbenchModeChange("reports")}
        onDockHeightChange={(statusDockHeightPx) => c.setLayout({ statusDockHeightPx })}
        onSave={c.handleSaveProject}
        onExportJson={c.handleExportProjectJson}
        onExportCsv={c.handleExportCutlistCsv}
        onExportPdf={c.handleExportPdf}
        report={c.projectReport}
        wholeProject={c.wholeProjectReport}
        machineJob={c.machineJobDocument}
        onExportMachineJson={() => { void c.handleExportMachineJson(); }}
        onExportMachineCsv={() => { void c.handleExportMachineCsv(); }}
        selectedCabinetId={c.activeCabinetId}
        costingSettings={c.costingSettings}
        quoteSettings={c.quoteSettings}
        sheetOptimizerSettings={c.sheetOptimizerSettings}
        onPreferencePatch={c.handleProjectPreferenceChange}
        onFreezeQuote={c.handleFreezeQuoteSnapshot}
        onSelectCabinet={(cabinetId) => c.handleWorkspaceSelectCabinet(cabinetId, false)}
        onFreezeRevision={c.handleFreezeRevision}
        onAddReviewNote={c.handleAddReviewNote}
        onResolveReviewNote={c.handleResolveReviewNote}
        onApproveReview={c.handleApproveReview}
        onReleaseForProduction={c.handleReleaseForProduction}
        onExportRevisionSummary={() => { void c.handleExportRevisionSummary(); }}
        approvalBlockedReasons={c.approvalGate.reasons}
        releaseBlockedReasons={c.releaseGate.reasons}
        onOpenSheet={(sheetId) => {
          c.handleSelectSheetDocument(sheetId);
          c.setLayout({ sheetBrowserVisible: true, statusDockOpen: false });
        }}
        hud={{
          pointer: c.pointerWorld,
          snapSizeMm: c.projectPreferences.snapSizeMm,
          showGrid: c.projectPreferences.showGrid,
          draftingTool: c.draftingTool,
          workspaceTab: c.workspaceTab,
          sheetLabel: getProjectSheetSet(c.project).sheets.find(
            (sheet) =>
              sheet.id === getProjectSheetSet(c.project).activeSheetId,
          )?.code,
        }}
        onCycleSnap={() =>
          c.handleProjectPreferenceChange({
            snapSizeMm: cycleSnapSizeMm(c.projectPreferences.snapSizeMm),
          })
        }
        onToggleGrid={() =>
          c.handleProjectPreferenceChange({
            showGrid: !c.projectPreferences.showGrid,
          })
        }
      /> : null}
    </main>
  );
}

export default App;
