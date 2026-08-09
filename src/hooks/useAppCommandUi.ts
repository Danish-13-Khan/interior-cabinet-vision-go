import type { Dispatch, SetStateAction } from "react";
import type { DraftingTool } from "../components/TwoDView";
import type { ContextMenuItem } from "../components/ContextMenu";
import type { ShortcutMap } from "../domain/desktopUx";
import type { DesktopLayoutPrefs } from "../domain/desktopUx";
import type { CabinetType } from "../domain/cabinetDimensions";
import { useEditorShortcuts } from "./useEditorShortcuts";
import { useAppCommandItems } from "./useAppCommandItems";
import type { AlignmentMode } from "../domain/cabinetAlignment";

type UseAppCommandUiArgs = {
  shortcutMap: ShortcutMap;
  showGrid: boolean;
  snapSizeMm: number;
  setIsCommandBarOpen: Dispatch<SetStateAction<boolean>>;
  setCommandQuery: Dispatch<SetStateAction<string>>;
  setIsShortcutSheetOpen: Dispatch<SetStateAction<boolean>>;
  setLibraryManagerOpen: Dispatch<SetStateAction<boolean>>;
  setContextMenu: Dispatch<
    SetStateAction<{ x: number; y: number; items: ContextMenuItem[] } | null>
  >;
  setWorkspaceTab: (tab: DesktopLayoutPrefs["workspaceTab"]) => void;
  setDraftingTool: Dispatch<SetStateAction<DraftingTool>>;
  toggleToolRail: () => void;
  toggleInspector: () => void;
  cycleWorkspaceTab: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onReset: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  onRemove: () => void;
  onCreateGroup: () => void;
  onClearGroup: () => void;
  onAlignSelection: (mode: AlignmentMode) => void;
  onAutoAlignRuns: () => void;
  onToggleGrid: () => void;
  onRotate90: () => void;
  onCycleSnap: () => void;
  onAddCabinet: (type: CabinetType) => void;
  onToggleSheetBrowser: () => void;
  onLoadProject: () => void | Promise<void>;
  onSaveProject: () => void | Promise<void>;
  onExportProjectJson: () => void | Promise<void>;
  onExportCutlistCsv: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  onExportMachineJson: () => void | Promise<void>;
  onFreezeRevision: () => void;
  onReleaseForProduction: () => void;
  onExportRevisionSummary: () => void | Promise<void>;
};

export function useAppCommandUi({
  shortcutMap,
  showGrid,
  snapSizeMm,
  setIsCommandBarOpen,
  setCommandQuery,
  setIsShortcutSheetOpen,
  setLibraryManagerOpen,
  setContextMenu,
  setWorkspaceTab,
  setDraftingTool,
  toggleToolRail,
  toggleInspector,
  cycleWorkspaceTab,
  onUndo,
  onRedo,
  onSave,
  onReset,
  onCopy,
  onPaste,
  onDuplicate,
  onSelectAll,
  onRemove,
  onCreateGroup,
  onClearGroup,
  onAlignSelection,
  onAutoAlignRuns,
  onToggleGrid,
  onRotate90,
  onCycleSnap,
  onAddCabinet,
  onToggleSheetBrowser,
  onLoadProject,
  onSaveProject,
  onExportProjectJson,
  onExportCutlistCsv,
  onExportPdf,
  onExportMachineJson,
  onFreezeRevision,
  onReleaseForProduction,
  onExportRevisionSummary,
}: UseAppCommandUiArgs) {
  function closeCommandSurfaces() {
    setIsCommandBarOpen(false);
    setCommandQuery("");
    setIsShortcutSheetOpen(false);
  }

  useEditorShortcuts(
    {
      onUndo,
      onRedo,
      onSave: () => {
        void onSave();
      },
      onNew: onReset,
      onCopy,
      onPaste,
      onDuplicate,
      onSelectAll,
      onRemove,
      onToggleCommandPalette: () => {
        setIsCommandBarOpen((value) => !value);
        setIsShortcutSheetOpen(false);
        setContextMenu(null);
      },
      onToggleShortcuts: () => {
        setIsShortcutSheetOpen((value) => !value);
        setIsCommandBarOpen(false);
        setContextMenu(null);
      },
      onEscape: () => {
        closeCommandSurfaces();
        setContextMenu(null);
        setDraftingTool("select");
      },
      onViewPlan: () => {
        setWorkspaceTab("plan");
        setDraftingTool("select");
      },
      onViewFront: () => {
        setWorkspaceTab("front");
        setDraftingTool("select");
      },
      onViewSide: () => {
        setWorkspaceTab("side");
        setDraftingTool("select");
      },
      onView3d: () => {
        setWorkspaceTab("3d");
        setDraftingTool("select");
      },
      onToggleToolRail: toggleToolRail,
      onToggleInspector: toggleInspector,
      onCycleWorkspace: () => {
        cycleWorkspaceTab();
        setDraftingTool("select");
      },
      onDraftSelect: () => setDraftingTool("select"),
      onDraftNote: () => setDraftingTool("note"),
      onDraftLeader: () => setDraftingTool("leader"),
      onToggleGrid,
      onRotate90,
      onCycleSnap,
    },
    shortcutMap,
  );

  const commandItems = useAppCommandItems({
    shortcutMap,
    showGrid,
    snapSizeMm,
    onReset,
    onLoadProject,
    onSaveProject,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onSelectAll,
    onRemove,
    onCreateGroup,
    onClearGroup,
    onAlignSelection,
    onAutoAlignRuns,
    onSetWorkspaceTab: setWorkspaceTab,
    onSetDraftingTool: setDraftingTool,
    onRotate90,
    onCycleSnap,
    onAddCabinet,
    onToggleSheetBrowser,
    onToggleToolRail: toggleToolRail,
    onToggleInspector: toggleInspector,
    onToggleGrid,
    onOpenLibraryManager: () => setLibraryManagerOpen(true),
    onExportProjectJson,
    onExportCutlistCsv,
    onExportPdf,
    onExportMachineJson,
    onFreezeRevision,
    onReleaseForProduction,
    onExportRevisionSummary,
    onOpenShortcuts: () => setIsShortcutSheetOpen(true),
  });

  return { closeCommandSurfaces, commandItems };
}
