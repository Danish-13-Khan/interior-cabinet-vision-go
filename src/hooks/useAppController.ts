import {
  defaultCabinetProject,
} from "../domain/cabinetDimensions";
import {
  getActiveProjectRoom,
} from "../domain/projectRooms";
import {
  formatShortcutBinding,
  upsertRecentCommandId,
  cycleSnapSizeMm,
} from "../domain/desktopUx";
import { useProjectFileIo } from "./useProjectFileIo";
import { useRoomProjectOps } from "./useRoomProjectOps";
import { useReviewWorkflow } from "./useReviewWorkflow";
import { useProjectPreferences } from "./useProjectPreferences";
import { useAppContextMenus } from "./useAppContextMenus";
import { useAppCommandUi } from "./useAppCommandUi";
import { useAppControllerCabinets } from "./useAppControllerCabinets";
import { useAppControllerSession } from "./useAppControllerSession";
import { useSceneTreeOps } from "./useSceneTreeOps";
import { useSheetDocumentOps } from "./useSheetDocumentOps";
import type { DrawingSheetId } from "../domain/drawingSheets";

export function useAppController() {
  const s = useAppControllerSession();

  const fileIo = useProjectFileIo({
    project: s.project,
    room: s.room,
    projectFilePath: s.projectFilePath,
    setProjectFilePath: s.setProjectFilePath,
    cutlistItems: s.cutlistItems,
    planningWorkflow: s.planningWorkflow,
    applySnapshot: s.applySnapshot,
    onStatus: s.setProjectStatus,
    rememberFile: s.rememberFile,
    forgetFile: s.forgetFile,
    saveCurrentProjectToBrowser: s.saveCurrentProjectToBrowser,
    captureThumbnail: () => s.sceneRef.current?.captureThumbnail() ?? "",
    initialSession: s.initialSession,
  });

  const rooms = useRoomProjectOps({
    project: s.project,
    room: s.room,
    commitProjectChange: s.commitProjectChange,
    commitSnapshot: s.commitSnapshot,
    onStatus: s.setProjectStatus,
  });

  const cabinets = useAppControllerCabinets({
    project: s.project,
    room: s.room,
    roomBounds: s.roomBounds,
    activeCabinetId: s.activeCabinetId,
    activeOpeningId: s.activeOpeningId,
    selectedCabinet: s.selectedCabinet,
    selectedCabinets: s.selectedCabinets,
    selectedCabinetIds: s.selectedCabinetIds,
    layers: s.layers,
    groups: s.groups,
    projectPreferences: s.projectPreferences,
    projectStandards: s.projectStandards,
    workshopCabinetPresets: s.workshopLibrary.cabinetPresets,
    userTemplates: s.userTemplates,
    clipboardRef: s.clipboardRef,
    commitProjectChange: s.commitProjectChange,
    commitSnapshot: s.commitSnapshot,
    replaceSelection: s.replaceSelection,
    setActiveOpeningId: s.setActiveOpeningId,
    isCabinetLocked: s.isCabinetLocked,
    setProjectFilePath: s.setProjectFilePath,
    saveTemplate: s.saveTemplate,
    deleteTemplate: s.deleteTemplate,
    onStatus: s.setProjectStatus,
  });

  const sceneTree = useSceneTreeOps({
    project: s.project,
    roomBounds: s.roomBounds,
    activeRoomId: s.project.activeRoomId ?? null,
    runs: s.planningWorkflow.runs,
    selectedCabinetIds: s.selectedCabinetIds,
    isolatedCabinetIds: s.isolatedCabinetIds,
    setIsolatedCabinetIds: s.setIsolatedCabinetIds,
    commitProjectChange: s.commitProjectChange,
    replaceSelection: s.replaceSelection,
    selectCabinetsInRoom: rooms.handleSelectCabinetsInRoom,
    fitView: () => s.sceneRef.current?.fitView(),
    onStatus: s.setProjectStatus,
  });

  const sheets = useSheetDocumentOps({
    commitProjectChange: s.commitProjectChange,
    onSelectCatalogSheet: (sheetId: DrawingSheetId) => {
      s.setLayout({ activeSheetId: sheetId });
      if (sheetId === "plan" || sheetId === "front" || sheetId === "side") {
        s.setWorkspaceTab(sheetId);
      }
    },
    onStatus: s.setProjectStatus,
  });

  const review = useReviewWorkflow({
    project: s.project,
    projectReport: s.projectReport,
    commitProjectChange: s.commitProjectChange,
    onStatus: s.setProjectStatus,
  });

  const preferences = useProjectPreferences({
    project: s.project,
    commitProjectChange: s.commitProjectChange,
    setDraftingTool: s.setDraftingTool,
    onStatus: s.setProjectStatus,
  });

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
    onLoadProject: fileIo.handleLoadProject,
    onSaveProject: fileIo.handleSaveProject,
    onExportProjectJson: fileIo.handleExportProjectJson,
    onExportCutlistCsv: fileIo.handleExportCutlistCsv,
    onExportPdf: fileIo.handleExportPdf,
    onExportMachineJson: fileIo.handleExportMachineJson,
    onFreezeRevision: () => review.handleFreezeRevision("", true),
    onReleaseForProduction: review.handleReleaseForProduction,
    onExportRevisionSummary: review.handleExportRevisionSummary,
  });

  const activeRoomName = getActiveProjectRoom(s.project).name;
  const workspaceLabel =
    s.workspaceTab === "plan"
      ? `${activeRoomName} · Plan`
      : s.workspaceTab === "front"
        ? `${activeRoomName} · Front`
        : s.workspaceTab === "side"
          ? `${activeRoomName} · Side`
          : `${activeRoomName} · 3D`;

  const tabShortcutHints = {
    plan: formatShortcutBinding(s.shortcutMap.viewPlan),
    front: formatShortcutBinding(s.shortcutMap.viewFront),
    side: formatShortcutBinding(s.shortcutMap.viewSide),
    "3d": formatShortcutBinding(s.shortcutMap.view3d),
  };

  return {
    ...s,
    ...fileIo,
    ...rooms,
    ...cabinets,
    ...sceneTree,
    ...sheets,
    ...review,
    ...preferences,
    ...menus,
    closeCommandSurfaces,
    commandItems,
    workspaceLabel,
    tabShortcutHints,
    upsertRecentCommandId,
    defaultCabinetProject,
  };
}
