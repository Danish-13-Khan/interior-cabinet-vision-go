import "./App.css";
import { AppRibbon } from "./components/AppRibbon";
import { AppCommandSurfaces } from "./components/AppCommandSurfaces";
import { AppStatusDock } from "./components/AppStatusDock";
import { AppMainBody } from "./components/AppMainBody";
import { ReportCenter } from "./components/ReportCenter";
import { JobWorkspace } from "./components/JobWorkspace";
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
    }
    c.setLayout(patch);
    c.setDraftingTool("select");
  }

  return (
    <main
      className="app-shell"
      style={{
        ["--tool-rail-width" as string]: `${c.layout.toolRailWidthPx}px`,
        ["--inspector-width" as string]: `${c.layout.inspectorWidthPx}px`,
        ["--status-dock-height" as string]: `${c.layout.statusDockHeightPx}px`,
      }}
    >
      <AppRibbon
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
      />

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
        toolRailVisible={c.layout.toolRailVisible}
        inspectorVisible={c.layout.inspectorVisible}
        toolRailWidthPx={c.layout.toolRailWidthPx}
        inspectorWidthPx={c.layout.inspectorWidthPx}
        onToolRailWidthChange={(toolRailWidthPx) => c.setLayout({ toolRailWidthPx })}
        onInspectorWidthChange={(inspectorWidthPx) => c.setLayout({ inspectorWidthPx })}
        sceneRef={c.sceneRef}
        toolRailProps={{
          workbenchMode,
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
          onAddFamily: c.handleAddCabinet,
          onAddLibraryItem: c.handleAddLibraryItem,
          onAddTemplate: c.handleAddTemplate,
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

      <AppStatusDock
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
      />
    </main>
  );
}

export default App;
