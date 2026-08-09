import { useMemo } from "react";
import type { CommandItem } from "../components/CommandPalette";
import type { DraftingTool } from "../components/twoDView/types";
import { formatShortcutBinding, type ShortcutMap } from "../domain/desktopUx";
import type { AlignmentMode } from "../domain/cabinetAlignment";
import type { CabinetType } from "../domain/cabinetDimensions";
import { buildDraftingCabinetCommands } from "./commandItems/draftingCabinetCommands";

type UseAppCommandItemsArgs = {
  shortcutMap: ShortcutMap;
  showGrid: boolean;
  snapSizeMm: number;
  onReset: () => void;
  onLoadProject: () => void | Promise<void>;
  onSaveProject: () => void | Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  onRemove: () => void;
  onCreateGroup: () => void;
  onClearGroup: () => void;
  onAlignSelection: (mode: AlignmentMode) => void;
  onAutoAlignRuns: () => void;
  onSetWorkspaceTab: (tab: "plan" | "front" | "side" | "3d") => void;
  onSetDraftingTool: (tool: DraftingTool) => void;
  onRotate90: () => void;
  onCycleSnap: () => void;
  onAddCabinet: (type: CabinetType) => void;
  onToggleSheetBrowser: () => void;
  onToggleToolRail: () => void;
  onToggleInspector: () => void;
  onToggleGrid: () => void;
  onOpenLibraryManager: () => void;
  onExportProjectJson: () => void | Promise<void>;
  onExportCutlistCsv: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  onExportMachineJson: () => void | Promise<void>;
  onFreezeRevision: () => void;
  onReleaseForProduction: () => void;
  onExportRevisionSummary: () => void | Promise<void>;
  onOpenShortcuts: () => void;
};

export function useAppCommandItems({
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
  onSetWorkspaceTab,
  onSetDraftingTool,
  onRotate90,
  onCycleSnap,
  onAddCabinet,
  onToggleSheetBrowser,
  onToggleToolRail,
  onToggleInspector,
  onToggleGrid,
  onOpenLibraryManager,
  onExportProjectJson,
  onExportCutlistCsv,
  onExportPdf,
  onExportMachineJson,
  onFreezeRevision,
  onReleaseForProduction,
  onExportRevisionSummary,
  onOpenShortcuts,
}: UseAppCommandItemsArgs): CommandItem[] {
  return useMemo<CommandItem[]>(
    () => [
      { id: "new", label: "New Project", hint: "Reset the current project", shortcut: formatShortcutBinding(shortcutMap.new), category: "File", keywords: ["reset"], action: onReset },
      { id: "open", label: "Open Project", hint: "Open a project JSON from disk", shortcut: "File", category: "File", keywords: ["load"], action: () => { void onLoadProject(); } },
      { id: "save", label: "Save Project", hint: "Save project JSON to disk", shortcut: formatShortcutBinding(shortcutMap.save), category: "File", action: () => { void onSaveProject(); } },
      { id: "undo", label: "Undo", hint: "Reverse the last change", shortcut: formatShortcutBinding(shortcutMap.undo), category: "Edit", action: onUndo },
      { id: "redo", label: "Redo", hint: "Reapply the last undone change", shortcut: formatShortcutBinding(shortcutMap.redo), category: "Edit", action: onRedo },
      { id: "copy", label: "Copy Selection", hint: "Copy selected items", shortcut: formatShortcutBinding(shortcutMap.copy), category: "Edit", action: onCopy },
      { id: "paste", label: "Paste Selection", hint: "Paste copied items", shortcut: formatShortcutBinding(shortcutMap.paste), category: "Edit", action: onPaste },
      { id: "duplicate", label: "Duplicate Selection", hint: "Duplicate selected cabinets", shortcut: formatShortcutBinding(shortcutMap.duplicate), category: "Edit", action: onDuplicate },
      { id: "select-all", label: "Select All", hint: "Select every cabinet in the room", shortcut: formatShortcutBinding(shortcutMap.selectAll), category: "Edit", action: onSelectAll },
      { id: "remove", label: "Remove Selection", hint: "Delete selected cabinets", shortcut: formatShortcutBinding(shortcutMap.remove), category: "Edit", keywords: ["delete"], action: onRemove },
      { id: "group", label: "Group Selection", hint: "Create a group from selected items", shortcut: "Toolbar", category: "Edit", action: onCreateGroup },
      { id: "ungroup", label: "Ungroup Selection", hint: "Remove selected items from their group", shortcut: "Toolbar", category: "Edit", action: onClearGroup },
      { id: "align-left", label: "Align Left", hint: "Align selected items to the left edge", shortcut: "Toolbar", category: "Arrange", action: () => onAlignSelection("align-left") },
      { id: "distribute-x", label: "Distribute X", hint: "Evenly space selected items horizontally", shortcut: "Toolbar", category: "Arrange", action: () => onAlignSelection("distribute-x") },
      { id: "align-runs", label: "Align Runs", hint: "Auto-align cabinet runs along walls", shortcut: "Toolbar", category: "Arrange", action: onAutoAlignRuns },
      ...buildDraftingCabinetCommands({
        shortcutMap,
        snapSizeMm,
        onSetDraftingTool,
        onRotate90,
        onCycleSnap,
        onAddCabinet,
        onAlignSelection,
        onToggleSheetBrowser,
      }),
      { id: "view-plan", label: "Plan View", hint: "Switch workspace to plan", shortcut: formatShortcutBinding(shortcutMap.viewPlan), category: "View", action: () => { onSetWorkspaceTab("plan"); onSetDraftingTool("select"); } },
      { id: "view-front", label: "Front Elevation", hint: "Switch workspace to front", shortcut: formatShortcutBinding(shortcutMap.viewFront), category: "View", action: () => { onSetWorkspaceTab("front"); onSetDraftingTool("select"); } },
      { id: "view-side", label: "Side Elevation", hint: "Switch workspace to side", shortcut: formatShortcutBinding(shortcutMap.viewSide), category: "View", action: () => { onSetWorkspaceTab("side"); onSetDraftingTool("select"); } },
      { id: "view-3d", label: "3D View", hint: "Switch workspace to 3D", shortcut: formatShortcutBinding(shortcutMap.view3d), category: "View", action: () => { onSetWorkspaceTab("3d"); onSetDraftingTool("select"); } },
      { id: "toggle-rail", label: "Toggle Tool Rail", hint: "Show or hide the left tool rail", shortcut: formatShortcutBinding(shortcutMap.toggleToolRail), category: "View", action: onToggleToolRail },
      { id: "toggle-inspector", label: "Toggle Inspector", hint: "Show or hide the properties inspector", shortcut: formatShortcutBinding(shortcutMap.toggleInspector), category: "View", action: onToggleInspector },
      {
        id: "toggle-grid",
        label: showGrid ? "Hide Grid" : "Show Grid",
        hint: "Show or hide the viewport grid",
        shortcut: formatShortcutBinding(shortcutMap.toggleGrid),
        category: "View",
        action: onToggleGrid,
      },
      { id: "library-manager", label: "Library Manager", hint: "Manage door, material, hardware, and cabinet libraries", shortcut: "Rail", category: "Tools", action: onOpenLibraryManager },
      { id: "export-json", label: "Export Project JSON", hint: "Download project JSON", shortcut: "Export", category: "Export", action: () => { void onExportProjectJson(); } },
      { id: "export-csv", label: "Export Cutlist CSV", hint: "Download production cutlist CSV", shortcut: "Export", category: "Export", action: () => { void onExportCutlistCsv(); } },
      { id: "export-pdf", label: "Export PDF", hint: "Download project PDF report", shortcut: "Export", category: "Export", action: () => { void onExportPdf(); } },
      { id: "export-machine-json", label: "Export Machine JSON (preview)", hint: "Machining intent metadata — not a CNC program", shortcut: "Export", category: "Export", action: () => { void onExportMachineJson(); } },
      { id: "freeze-revision", label: "Freeze Revision", hint: "Snapshot revision fingerprint and change log", shortcut: "Review", category: "Review", action: onFreezeRevision },
      { id: "release-production", label: "Release for Production", hint: "Mark approved revision released for shop", shortcut: "Review", category: "Review", action: onReleaseForProduction },
      { id: "export-revision-summary", label: "Export Revision Summary PDF", hint: "Printable approval and change log", shortcut: "Review", category: "Review", action: () => { void onExportRevisionSummary(); } },
      { id: "shortcuts", label: "Configure Shortcuts", hint: "Open keyboard shortcut editor", shortcut: formatShortcutBinding(shortcutMap.shortcutHelp), category: "Tools", action: onOpenShortcuts },
    ],
    [showGrid, snapSizeMm, shortcutMap],
  );
}
