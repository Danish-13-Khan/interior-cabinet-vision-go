import type { CommandItem } from "../../components/CommandPalette";
import type { DraftingTool } from "../../components/twoDView/types";
import type { AlignmentMode } from "../../domain/cabinetAlignment";
import type { CabinetType } from "../../domain/cabinetDimensions";
import {
  formatShortcutBinding,
  type ShortcutMap,
} from "../../domain/desktopUx";

type DraftingCabinetCommandArgs = {
  shortcutMap: ShortcutMap;
  snapSizeMm: number;
  onSetDraftingTool: (tool: DraftingTool) => void;
  onRotate90: () => void;
  onCycleSnap: () => void;
  onAddCabinet: (type: CabinetType) => void;
  onAlignSelection: (mode: AlignmentMode) => void;
  onToggleSheetBrowser: () => void;
};

/** Drafting tools, cabinet insert, and arrangement commands for the palette. */
export function buildDraftingCabinetCommands({
  shortcutMap,
  snapSizeMm,
  onSetDraftingTool,
  onRotate90,
  onCycleSnap,
  onAddCabinet,
  onAlignSelection,
  onToggleSheetBrowser,
}: DraftingCabinetCommandArgs): CommandItem[] {
  return [
    {
      id: "draft-select",
      label: "Select Tool",
      hint: "Pointer select / move cabinets",
      shortcut: formatShortcutBinding(shortcutMap.draftSelect),
      category: "Drafting",
      keywords: ["pointer", "move"],
      action: () => onSetDraftingTool("select"),
    },
    {
      id: "draft-note",
      label: "Note Tool",
      hint: "Place a drafting note",
      shortcut: formatShortcutBinding(shortcutMap.draftNote),
      category: "Drafting",
      keywords: ["annotate", "text"],
      action: () => onSetDraftingTool("note"),
    },
    {
      id: "draft-leader",
      label: "Leader Tool",
      hint: "Place a leader callout",
      shortcut: formatShortcutBinding(shortcutMap.draftLeader),
      category: "Drafting",
      keywords: ["callout", "arrow"],
      action: () => onSetDraftingTool("leader"),
    },
    {
      id: "rotate-90",
      label: "Rotate Selection 90°",
      hint: "Rotate active cabinet clockwise",
      shortcut: formatShortcutBinding(shortcutMap.rotate90),
      category: "Edit",
      keywords: ["turn", "spin"],
      action: onRotate90,
    },
    {
      id: "cycle-snap",
      label: `Cycle Snap (${snapSizeMm} mm)`,
      hint: "Step through snap grid presets",
      shortcut: formatShortcutBinding(shortcutMap.cycleSnap),
      category: "View",
      keywords: ["grid", "precision"],
      action: onCycleSnap,
    },
    {
      id: "add-base",
      label: "Add Base Cabinet",
      hint: "Insert a base cabinet into the room",
      shortcut: "Rail",
      category: "Cabinets",
      keywords: ["insert", "place"],
      action: () => onAddCabinet("base"),
    },
    {
      id: "add-wall",
      label: "Add Wall Cabinet",
      hint: "Insert a wall cabinet into the room",
      shortcut: "Rail",
      category: "Cabinets",
      keywords: ["insert", "upper"],
      action: () => onAddCabinet("wall"),
    },
    {
      id: "add-tall",
      label: "Add Tall Cabinet",
      hint: "Insert a tall / pantry cabinet",
      shortcut: "Rail",
      category: "Cabinets",
      keywords: ["insert", "pantry"],
      action: () => onAddCabinet("tall"),
    },
    {
      id: "align-center-x",
      label: "Align Center X",
      hint: "Align selection centers horizontally",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("align-center-x"),
    },
    {
      id: "align-right",
      label: "Align Right",
      hint: "Align selection to the right edge",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("align-right"),
    },
    {
      id: "align-top",
      label: "Align Top (Front)",
      hint: "Align selection to the near/top edge in plan",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("align-top"),
    },
    {
      id: "align-center-z",
      label: "Align Center Z",
      hint: "Align selection centers in depth",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("align-center-z"),
    },
    {
      id: "align-bottom",
      label: "Align Bottom (Back)",
      hint: "Align selection to the far/bottom edge in plan",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("align-bottom"),
    },
    {
      id: "distribute-z",
      label: "Distribute Z",
      hint: "Evenly space selected items in depth",
      shortcut: "Toolbar",
      category: "Arrange",
      action: () => onAlignSelection("distribute-z"),
    },
    {
      id: "toggle-sheets",
      label: "Toggle Sheet Browser",
      hint: "Show or hide the drawing sheet manager",
      shortcut: "Workspace",
      category: "View",
      keywords: ["drawings", "documentation"],
      action: onToggleSheetBrowser,
    },
  ];
}
