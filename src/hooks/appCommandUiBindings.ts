import type { Dispatch, SetStateAction } from "react";
import type { DraftingTool } from "../components/TwoDView";
import type { ContextMenuItem } from "../components/ContextMenu";
import type { DesktopLayoutPrefs, ShortcutMap } from "../domain/desktopUx";
import type { CabinetType } from "../domain/cabinetDimensions";
import type { AlignmentMode } from "../domain/cabinetAlignment";

export type UseAppCommandUiArgs = {
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
  onSaveAs: () => void;
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

export function buildEditorShortcutActions(
  args: UseAppCommandUiArgs,
  closeCommandSurfaces: () => void,
) {
  return {
    onUndo: args.onUndo,
    onRedo: args.onRedo,
    onSave: () => {
      void args.onSave();
    },
    onSaveAs: () => {
      void args.onSaveAs();
    },
    onNew: args.onReset,
    onCopy: args.onCopy,
    onPaste: args.onPaste,
    onDuplicate: args.onDuplicate,
    onSelectAll: args.onSelectAll,
    onRemove: args.onRemove,
    onToggleCommandPalette: () => {
      args.setIsCommandBarOpen((value) => !value);
      args.setIsShortcutSheetOpen(false);
      args.setContextMenu(null);
    },
    onToggleShortcuts: () => {
      args.setIsShortcutSheetOpen((value) => !value);
      args.setIsCommandBarOpen(false);
      args.setContextMenu(null);
    },
    onEscape: () => {
      closeCommandSurfaces();
      args.setContextMenu(null);
      args.setDraftingTool("select");
    },
    onViewPlan: () => {
      args.setWorkspaceTab("plan");
      args.setDraftingTool("select");
    },
    onViewFront: () => {
      args.setWorkspaceTab("front");
      args.setDraftingTool("select");
    },
    onViewSide: () => {
      args.setWorkspaceTab("side");
      args.setDraftingTool("select");
    },
    onView3d: () => {
      args.setWorkspaceTab("3d");
      args.setDraftingTool("select");
    },
    onToggleToolRail: args.toggleToolRail,
    onToggleInspector: args.toggleInspector,
    onCycleWorkspace: () => {
      args.cycleWorkspaceTab();
      args.setDraftingTool("select");
    },
    onDraftSelect: () => args.setDraftingTool("select"),
    onDraftNote: () => args.setDraftingTool("note"),
    onDraftLeader: () => args.setDraftingTool("leader"),
    onToggleGrid: args.onToggleGrid,
    onRotate90: args.onRotate90,
    onCycleSnap: args.onCycleSnap,
  };
}
