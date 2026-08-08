import type { MutableRefObject } from "react";
import type { CabinetInstance, CabinetProject } from "../domain/cabinetDimensions";
import type { ContextMenuItem } from "../components/ContextMenu";
import { formatShortcutBinding, type ShortcutMap } from "../domain/desktopUx";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";

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
  handleProjectPreferenceChange: (
    patch: Partial<NonNullable<CabinetProject["preferences"]>>,
  ) => void;
  handleLoadSavedProject: (projectId: string) => void;
  handleDuplicateSavedProject: (projectId: string) => void;
  handleRenameSavedProject: (projectId: string, name: string) => void;
  handleDeleteSavedProject: (projectId: string) => void;
  toggleToolRail: () => void;
  toggleInspector: () => void;
};

export function useAppContextMenus({
  project,
  selectedCabinetIds,
  projectPreferences,
  clipboardRef,
  shortcutMap,
  sortedSavedProjects,
  toolRailVisible,
  inspectorVisible,
  setContextMenu,
  replaceSelection,
  handleDuplicateCabinet,
  handleCopySelection,
  handleRenameCabinet,
  handleRemoveCabinet,
  handlePasteSelection,
  handleSelectAll,
  handleProjectPreferenceChange,
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
      items: [
        {
          id: "dup",
          label: "Duplicate",
          shortcut: formatShortcutBinding(shortcutMap.duplicate),
          action: handleDuplicateCabinet,
        },
        {
          id: "copy",
          label: "Copy",
          shortcut: formatShortcutBinding(shortcutMap.copy),
          action: handleCopySelection,
        },
        {
          id: "rename",
          label: "Rename…",
          action: () => {
            const cabinet = project.cabinets.find((item) => item.id === cabinetId);
            if (!cabinet) return;
            const next = window.prompt("Rename cabinet:", cabinet.name);
            if (next && next.trim()) handleRenameCabinet(cabinetId, next.trim());
          },
        },
        { id: "sep", label: "", separator: true },
        {
          id: "delete",
          label: "Delete",
          shortcut: formatShortcutBinding(shortcutMap.remove),
          danger: true,
          action: handleRemoveCabinet,
        },
      ],
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
            if (next && next.trim()) handleRenameSavedProject(projectId, next.trim());
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
    setContextMenu({
      x: point.x,
      y: point.y,
      items: [
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
        { id: "sep", label: "", separator: true },
        {
          id: "grid",
          label: projectPreferences.showGrid ? "Hide Grid" : "Show Grid",
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
