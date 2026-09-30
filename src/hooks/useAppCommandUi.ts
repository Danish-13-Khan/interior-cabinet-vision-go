import { buildEditorShortcutActions, type UseAppCommandUiArgs } from "./appCommandUiBindings";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { useAppCommandItems } from "./useAppCommandItems";

export function useAppCommandUi(args: UseAppCommandUiArgs) {
  function closeCommandSurfaces() {
    args.setIsCommandBarOpen(false);
    args.setCommandQuery("");
    args.setIsShortcutSheetOpen(false);
  }

  useEditorShortcuts(
    buildEditorShortcutActions(args, closeCommandSurfaces),
    args.shortcutMap,
  );

  const commandItems = useAppCommandItems({
    shortcutMap: args.shortcutMap,
    showGrid: args.showGrid,
    snapSizeMm: args.snapSizeMm,
    onReset: args.onReset,
    onLoadProject: args.onLoadProject,
    onSaveProject: args.onSaveProject,
    onSaveAsProject: args.onSaveAs,
    onUndo: args.onUndo,
    onRedo: args.onRedo,
    onCopy: args.onCopy,
    onPaste: args.onPaste,
    onDuplicate: args.onDuplicate,
    onSelectAll: args.onSelectAll,
    onRemove: args.onRemove,
    onCreateGroup: args.onCreateGroup,
    onClearGroup: args.onClearGroup,
    onAlignSelection: args.onAlignSelection,
    onAutoAlignRuns: args.onAutoAlignRuns,
    onSetWorkspaceTab: args.setWorkspaceTab,
    onSetDraftingTool: args.setDraftingTool,
    onRotate90: args.onRotate90,
    onCycleSnap: args.onCycleSnap,
    onAddCabinet: args.onAddCabinet,
    onToggleSheetBrowser: args.onToggleSheetBrowser,
    onToggleToolRail: args.toggleToolRail,
    onToggleInspector: args.toggleInspector,
    onToggleGrid: args.onToggleGrid,
    onOpenLibraryManager: () => args.setLibraryManagerOpen(true),
    onExportProjectJson: args.onExportProjectJson,
    onExportCutlistCsv: args.onExportCutlistCsv,
    onExportPdf: args.onExportPdf,
    onExportMachineJson: args.onExportMachineJson,
    onFreezeRevision: args.onFreezeRevision,
    onReleaseForProduction: args.onReleaseForProduction,
    onExportRevisionSummary: args.onExportRevisionSummary,
    onOpenShortcuts: () => args.setIsShortcutSheetOpen(true),
  });

  return { closeCommandSurfaces, commandItems };
}
