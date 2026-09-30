import { cycleSnapSizeMm } from "../domain/desktopUx";
import { useAppContextMenus } from "./useAppContextMenus";
import { useAppCommandUi } from "./useAppCommandUi";
import type { useAppControllerCabinets } from "./useAppControllerCabinets";
import type { useAppControllerSession } from "./useAppControllerSession";
import type { useProjectFileIo } from "./useProjectFileIo";
import type { useProjectPreferences } from "./useProjectPreferences";
import type { useReviewWorkflow } from "./useReviewWorkflow";

type Session = ReturnType<typeof useAppControllerSession>;
type FileIo = ReturnType<typeof useProjectFileIo>;
type Cabinets = ReturnType<typeof useAppControllerCabinets>;
type Preferences = ReturnType<typeof useProjectPreferences>;
type Review = ReturnType<typeof useReviewWorkflow>;

type UseAppControllerChromeArgs = {
  session: Session;
  fileIo: FileIo;
  cabinets: Cabinets;
  preferences: Preferences;
  review: Review;
};

export function useAppControllerChrome({
  session: s,
  fileIo,
  cabinets,
  preferences,
  review,
}: UseAppControllerChromeArgs) {
  const menus = useAppContextMenus({
    project: s.project,
    selectedCabinetIds: s.selectedCabinetIds,
    projectPreferences: s.projectPreferences,
    clipboardRef: s.clipboardRef,
    shortcutMap: s.shortcutMap,
    sortedSavedProjects: s.sortedSavedProjects,
    toolRailVisible: s.layout.toolRailVisible,
    inspectorVisible: s.layout.inspectorVisible,
    draftingTool: s.draftingTool,
    setContextMenu: s.setContextMenu,
    replaceSelection: s.replaceSelection,
    handleDuplicateCabinet: cabinets.handleDuplicateCabinet,
    handleCopySelection: cabinets.handleCopySelection,
    handleRenameCabinet: cabinets.handleRenameCabinet,
    handleRemoveCabinet: cabinets.handleRemoveCabinet,
    handlePasteSelection: cabinets.handlePasteSelection,
    handleSelectAll: cabinets.handleSelectAll,
    handleCreateGroup: cabinets.handleCreateGroup,
    handleClearGroup: cabinets.handleClearGroup,
    handleAutoAlignRuns: cabinets.handleAutoAlignRuns,
    handleRotate90: () => {
      const cabinet = s.selectedCabinet;
      if (!cabinet) return;
      cabinets.handleCabinetRotate(
        cabinet.id,
        cabinet.placement.rotation + 90,
      );
    },
    handleProjectPreferenceChange: preferences.handleProjectPreferenceChange,
    setDraftingTool: s.setDraftingTool,
    handleLoadSavedProject: s.handleLoadSavedProject,
    handleDuplicateSavedProject: s.handleDuplicateSavedProject,
    handleRenameSavedProject: s.handleRenameSavedProject,
    handleDeleteSavedProject: s.handleDeleteSavedProject,
    toggleToolRail: s.toggleToolRail,
    toggleInspector: s.toggleInspector,
  });

  const { closeCommandSurfaces, commandItems } = useAppCommandUi({
    shortcutMap: s.shortcutMap,
    showGrid: s.projectPreferences.showGrid,
    snapSizeMm: s.projectPreferences.snapSizeMm,
    setIsCommandBarOpen: s.setIsCommandBarOpen,
    setCommandQuery: s.setCommandQuery,
    setIsShortcutSheetOpen: s.setIsShortcutSheetOpen,
    setLibraryManagerOpen: s.setLibraryManagerOpen,
    setContextMenu: s.setContextMenu,
    setWorkspaceTab: s.setWorkspaceTab,
    setDraftingTool: s.setDraftingTool,
    toggleToolRail: s.toggleToolRail,
    toggleInspector: s.toggleInspector,
    cycleWorkspaceTab: s.cycleWorkspaceTab,
    onUndo: s.handleUndo,
    onRedo: s.handleRedo,
    onSave: () => { void fileIo.handleSaveProject(); },
    onSaveAs: () => { void fileIo.handleSaveAsProject(); },
    onReset: cabinets.handleReset,
    onCopy: cabinets.handleCopySelection,
    onPaste: cabinets.handlePasteSelection,
    onDuplicate: cabinets.handleDuplicateCabinet,
    onSelectAll: cabinets.handleSelectAll,
    onRemove: cabinets.handleRemoveCabinet,
    onCreateGroup: cabinets.handleCreateGroup,
    onClearGroup: cabinets.handleClearGroup,
    onAlignSelection: cabinets.handleAlignSelection,
    onAutoAlignRuns: cabinets.handleAutoAlignRuns,
    onToggleGrid: () =>
      preferences.handleProjectPreferenceChange({
        showGrid: !s.projectPreferences.showGrid,
      }),
    onRotate90: () => {
      const cabinet = s.selectedCabinet;
      if (!cabinet) return;
      cabinets.handleCabinetRotate(
        cabinet.id,
        cabinet.placement.rotation + 90,
      );
    },
    onCycleSnap: () => {
      preferences.handleProjectPreferenceChange({
        snapSizeMm: cycleSnapSizeMm(s.projectPreferences.snapSizeMm),
      });
    },
    onAddCabinet: cabinets.handleAddCabinet,
    onToggleSheetBrowser: () =>
      s.setLayout({
        sheetBrowserVisible: !s.layout.sheetBrowserVisible,
      }),
    onLoadProject: async () => {
      await fileIo.handleLoadProject();
    },
    onSaveProject: fileIo.handleSaveProject,
    onExportProjectJson: fileIo.handleExportProjectJson,
    onExportCutlistCsv: fileIo.handleExportCutlistCsv,
    onExportPdf: fileIo.handleExportPdf,
    onExportMachineJson: fileIo.handleExportMachineJson,
    onFreezeRevision: () => review.handleFreezeRevision("", true),
    onReleaseForProduction: review.handleReleaseForProduction,
    onExportRevisionSummary: review.handleExportRevisionSummary,
  });

  return {
    ...menus,
    closeCommandSurfaces,
    commandItems,
  };
}
