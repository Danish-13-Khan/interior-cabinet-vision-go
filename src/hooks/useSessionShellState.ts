import { useState } from "react";
import type { DraftingTool } from "../components/TwoDView";
import type { ContextMenuItem } from "../components/ContextMenu";
import type { DraftingWorldPoint } from "../domain/draftingAnnotations";
import type { DesktopSessionState } from "../domain/desktopUx";
import { useDesktopLayout } from "./useDesktopLayout";
import { useRecentFiles } from "./useRecentFiles";
import { useShortcutMap } from "./useShortcutMap";
import { useUserTemplates } from "./useUserTemplates";
import { useWorkshopLibrary } from "./useWorkshopLibrary";

/** Chrome that is not the open project: layout, tools, menus, and recent files. */
export function useSessionShellState(initialSession: DesktopSessionState) {
  const layoutState = useDesktopLayout();
  const [draftingTool, setDraftingTool] = useState<DraftingTool>(initialSession.draftingTool);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);
  const [libraryManagerOpen, setLibraryManagerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const [pointerWorld, setPointerWorld] = useState<DraftingWorldPoint | null>(null);
  const workshop = useWorkshopLibrary();
  const templates = useUserTemplates();
  const shortcuts = useShortcutMap();
  const recent = useRecentFiles();
  return {
    ...layoutState,
    workspaceTab: layoutState.layout.workspaceTab,
    statusDockOpen: layoutState.layout.statusDockOpen,
    draftingTool, setDraftingTool,
    isCommandBarOpen, setIsCommandBarOpen,
    commandQuery, setCommandQuery,
    isShortcutSheetOpen, setIsShortcutSheetOpen,
    libraryManagerOpen, setLibraryManagerOpen,
    contextMenu, setContextMenu,
    recentCommandIds, setRecentCommandIds,
    pointerWorld, setPointerWorld,
    workshopLibrary: workshop.library,
    setWorkshopLibrary: workshop.setLibrary,
    userTemplates: templates.templates,
    saveTemplate: templates.saveTemplate,
    deleteTemplate: templates.deleteTemplate,
    shortcutMap: shortcuts.shortcutMap,
    setBinding: shortcuts.setBinding,
    resetShortcuts: shortcuts.resetShortcuts,
    recentFiles: recent.recentFiles,
    rememberFile: recent.rememberFile,
    forgetFile: recent.forgetFile,
  };
}
