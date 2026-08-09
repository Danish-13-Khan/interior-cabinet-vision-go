import "./App.css";
import { AppRibbon } from "./components/AppRibbon";
import { AppCommandSurfaces } from "./components/AppCommandSurfaces";
import { AppStatusDock } from "./components/AppStatusDock";
import { AppMainBody } from "./components/AppMainBody";
import { useAppController } from "./hooks/useAppController";
import { getProjectSheetSet } from "./domain/sheetDocuments";

function App() {
  const c = useAppController();

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
        workspaceLabel={c.workspaceLabel}
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
      />

      <AppMainBody
        toolRailVisible={c.layout.toolRailVisible}
        inspectorVisible={c.layout.inspectorVisible}
        toolRailWidthPx={c.layout.toolRailWidthPx}
        inspectorWidthPx={c.layout.inspectorWidthPx}
        onToolRailWidthChange={(toolRailWidthPx) => c.setLayout({ toolRailWidthPx })}
        onInspectorWidthChange={(inspectorWidthPx) => c.setLayout({ inspectorWidthPx })}
        sceneRef={c.sceneRef}
        toolRailProps={{
          templates: c.userTemplates,
          userCabinetPresets: c.workshopLibrary.cabinetPresets,
          rooms: c.projectRooms,
          activeRoomId: c.project.activeRoomId ?? c.projectRooms[0]?.id ?? null,
          runs: c.planningWorkflow.runs,
          activeCabinetId: c.activeCabinetId,
          selectedCabinetIds: c.selectedCabinetIds,
          activeOpeningId: c.activeOpeningId,
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
          onSelectOpening: c.handleSelectOpening,
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
          onSelectOpening: c.handleSelectOpening,
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
          tabShortcutHints: c.tabShortcutHints,
        }}
        inspectorProps={{
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
        project={c.project}
        projectStatus={c.projectStatus}
        workspaceLabel={c.workspaceLabel}
        selectedCabinet={c.selectedCabinet}
        selectedCabinetIds={c.selectedCabinetIds}
        validationMessages={c.validationMessages}
        statusDockOpen={c.statusDockOpen}
        dockHeightPx={c.layout.statusDockHeightPx}
        onToggleStatusDock={() => c.setLayout({ statusDockOpen: !c.statusDockOpen })}
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
      />
    </main>
  );
}

export default App;
