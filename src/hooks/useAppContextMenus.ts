import type { MutableRefObject } from "react";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import type { ContextMenuItem } from "../components/ContextMenu";
import { formatShortcutBinding, type ShortcutMap } from "../domain/desktopUx";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import type { DraftingTool } from "../components/twoDView/types";

type ContextMenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
};

type UseAppContextMenusArgs = {
  project: CabinetProject;
  selectedCabinetIds: string[];
  projectPreferences: NonNullable<CabinetProject["preferences"]>;
  clipboardRef: MutableRefObject<CabinetInstance[]>;
  shortcutMap: ShortcutMap;
  sortedSavedProjects: SavedProjectBrowserEntry[];
  toolRailVisible: boolean;
  inspectorVisible: boolean;
  draftingTool: DraftingTool;
  setContextMenu: (menu: ContextMenuState | null) => void;
  replaceSelection: (
    ids: string[],
    nextActiveId?: string | null,
    nextPanelName?: null,
  ) => void;
  handleDuplicateCabinet: () => void;
  handleCopySelection: () => void;
  handleRenameCabinet: (cabinetId: string, newName: string) => void;
  handleRemoveCabinet: () => void;
  handlePasteSelection: () => void;
  handleSelectAll: () => void;
  handleCreateGroup: () => void;
  handleClearGroup: () => void;
  handleAutoAlignRuns: () => void;
  handleRotate90: () => void;
  handleProjectPreferenceChange: (
    patch: Partial<NonNullable<CabinetProject["preferences"]>>,
  ) => void;
  setDraftingTool: (tool: DraftingTool) => void;
  handleLoadSavedProject: (projectId: string) => void;
  handleDuplicateSavedProject: (projectId: string) => void;
  handleRenameSavedProject: (projectId: string, name: string) => void;
  handleDeleteSavedProject: (projectId: string) => void;
  toggleToolRail: () => void;
  toggleInspector: () => void;
};

function cabinetEditItems(args: {
  shortcutMap: ShortcutMap;
  cabinetId: string;
  project: CabinetProject;
  handleDuplicateCabinet: () => void;
  handleCopySelection: () => void;
  handleRenameCabinet: (cabinetId: string, newName: string) => void;
  handleRemoveCabinet: () => void;
  handleCreateGroup: () => void;
  handleClearGroup: () => void;
  handleAutoAlignRuns: () => void;
  handleRotate90: () => void;
}): ContextMenuItem[] {
  return [
    {
      id: "dup",
      label: "Duplicate",
      shortcut: formatShortcutBinding(args.shortcutMap.duplicate),
      action: args.handleDuplicateCabinet,
    },
    {
      id: "copy",
      label: "Copy",
      shortcut: formatShortcutBinding(args.shortcutMap.copy),
      action: args.handleCopySelection,
    },
    {
      id: "rename",
      label: "Rename…",
      action: () => {
        const cabinet = args.project.cabinets.find(
          (item) => item.id === args.cabinetId,
        );
        if (!cabinet) return;
        const next = window.prompt("Rename cabinet:", cabinet.name);
        if (next && next.trim()) {
          args.handleRenameCabinet(args.cabinetId, next.trim());
        }
      },
    },
    {
      id: "rotate",
      label: "Rotate 90°",
      shortcut: formatShortcutBinding(args.shortcutMap.rotate90),
      action: args.handleRotate90,
    },
    { id: "sep-edit", label: "", separator: true },
    {
      id: "group",
      label: "Group",
      action: args.handleCreateGroup,
    },
    {
      id: "ungroup",
      label: "Ungroup",
      action: args.handleClearGroup,
    },
    {
      id: "align-runs",
      label: "Align Runs",
      action: args.handleAutoAlignRuns,
    },
    { id: "sep-del", label: "", separator: true },
    {
      id: "delete",
      label: "Delete",
      shortcut: formatShortcutBinding(args.shortcutMap.remove),
      danger: true,
      action: args.handleRemoveCabinet,
    },
  ];
}

export function useAppContextMenus({
  project,
  selectedCabinetIds,
  projectPreferences,
  clipboardRef,
  shortcutMap,
  sortedSavedProjects,
  toolRailVisible,
  inspectorVisible,
  draftingTool,
  setContextMenu,
  replaceSelection,
  handleDuplicateCabinet,
  handleCopySelection,
  handleRenameCabinet,
  handleRemoveCabinet,
  handlePasteSelection,
  handleSelectAll,
  handleCreateGroup,
  handleClearGroup,
  handleAutoAlignRuns,
  handleRotate90,
  handleProjectPreferenceChange,
  setDraftingTool,
  handleLoadSavedProject,
  handleDuplicateSavedProject,
  handleRenameSavedProject,
  handleDeleteSavedProject,
  toggleToolRail,
  toggleInspector,
}: UseAppContextMenusArgs) {
  function openCabinetContextMenu(
    cabinetId: string,
    point: { x: number; y: number },
  ) {
    if (!selectedCabinetIds.includes(cabinetId)) {
      replaceSelection([cabinetId], cabinetId, null);
    }
    setContextMenu({
      x: point.x,
      y: point.y,
      items: cabinetEditItems({
        shortcutMap,
        cabinetId,
        project,
        handleDuplicateCabinet,
        handleCopySelection,
        handleRenameCabinet,
        handleRemoveCabinet,
        handleCreateGroup,
        handleClearGroup,
        handleAutoAlignRuns,
        handleRotate90,
      }),
    });
  }

  function openProjectContextMenu(
    projectId: string,
    point: { x: number; y: number },
  ) {
    const entry = sortedSavedProjects.find((item) => item.id === projectId);
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        {
          id: "open",
          label: "Open",
          action: () => handleLoadSavedProject(projectId),
        },
        {
          id: "dup",
          label: "Duplicate",
          action: () => handleDuplicateSavedProject(projectId),
        },
        {
          id: "rename",
          label: "Rename…",
          action: () => {
            const next = window.prompt("Rename job:", entry?.name ?? "");
            if (next && next.trim()) {
              handleRenameSavedProject(projectId, next.trim());
            }
          },
        },
        { id: "sep", label: "", separator: true },
        {
          id: "delete",
          label: "Delete",
          danger: true,
          action: () => handleDeleteSavedProject(projectId),
        },
      ],
    });
  }

  function openWorkspaceContextMenu(point: { x: number; y: number }) {
    const activeId = selectedCabinetIds[0];
    const selectionItems =
      activeId != null
        ? [
            ...cabinetEditItems({
              shortcutMap,
              cabinetId: activeId,
              project,
              handleDuplicateCabinet,
              handleCopySelection,
              handleRenameCabinet,
              handleRemoveCabinet,
              handleCreateGroup,
              handleClearGroup,
              handleAutoAlignRuns,
              handleRotate90,
            }),
            { id: "sep-sel", label: "", separator: true },
          ]
        : [];

    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
        ...selectionItems,
        {
          id: "paste",
          label: "Paste",
          shortcut: formatShortcutBinding(shortcutMap.paste),
          disabled: clipboardRef.current.length === 0,
          action: handlePasteSelection,
        },
        {
          id: "select-all",
          label: "Select All",
          shortcut: formatShortcutBinding(shortcutMap.selectAll),
          action: handleSelectAll,
        },
        { id: "sep-tools", label: "", separator: true },
        {
          id: "tool-select",
          label: "Select Tool",
          shortcut: formatShortcutBinding(shortcutMap.draftSelect),
          disabled: draftingTool === "select",
          action: () => setDraftingTool("select"),
        },
        {
          id: "tool-note",
          label: "Note Tool",
          shortcut: formatShortcutBinding(shortcutMap.draftNote),
          disabled: draftingTool === "note",
          action: () => setDraftingTool("note"),
        },
        {
          id: "tool-leader",
          label: "Leader Tool",
          shortcut: formatShortcutBinding(shortcutMap.draftLeader),
          disabled: draftingTool === "leader",
          action: () => setDraftingTool("leader"),
        },
        { id: "sep-view", label: "", separator: true },
        {
          id: "grid",
          label: projectPreferences.showGrid ? "Hide Grid" : "Show Grid",
          shortcut: formatShortcutBinding(shortcutMap.toggleGrid),
          action: () =>
            handleProjectPreferenceChange({
              showGrid: !projectPreferences.showGrid,
            }),
        },
        {
          id: "toggle-rail",
          label: toolRailVisible ? "Hide Tool Rail" : "Show Tool Rail",
          action: toggleToolRail,
        },
        {
          id: "toggle-inspector",
          label: inspectorVisible ? "Hide Inspector" : "Show Inspector",
          action: toggleInspector,
        },
      ],
    });
  }

  return {
    openCabinetContextMenu,
    openProjectContextMenu,
    openWorkspaceContextMenu,
  };
}
