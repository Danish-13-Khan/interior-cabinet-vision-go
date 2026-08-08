import { useEffect, useRef, useState } from "react";
import { type CabinetSceneHandle } from "../components/CabinetScene";
import { type DraftingTool } from "../components/TwoDView";
import { type ContextMenuItem } from "../components/ContextMenu";
import {
  clampCabinetProject,
  defaultCabinetProject,
  type CabinetInstance,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import { type PanelName } from "../domain/cabinetGeometry";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import {
  getActiveProjectRoom,
  normalizeMultiRoomProject,
} from "../domain/projectRooms";
import {
  sanitizeSelection,
  type EditorSnapshot,
} from "../domain/editorSnapshot";
import { useWorkshopLibrary } from "./useWorkshopLibrary";
import { useEditorHistory, captureEditorSnapshot } from "./useEditorHistory";
import { useUserTemplates } from "./useUserTemplates";
import { useSavedProjectBrowser } from "./useSavedProjectBrowser";
import { useDesktopLayout } from "./useDesktopLayout";
import { useShortcutMap } from "./useShortcutMap";
import { useRecentFiles } from "./useRecentFiles";
import { loadInitialSessionState, useSessionPersist } from "./useSessionPersist";
import { useProjectCommit } from "./useProjectCommit";
import { useAppDerivedState } from "./useAppDerivedState";

export function useAppControllerSession() {
  const sceneRef = useRef<CabinetSceneHandle | null>(null);
  const clipboardRef = useRef<CabinetInstance[]>([]);
  const initialSession = useRef(loadInitialSessionState()).current;
  const [project, setProject] = useState<CabinetProject>(defaultCabinetProject);
  const [room, setRoom] = useState<RoomConfig>(DEFAULT_ROOM);
  const {
    layout,
    setLayout,
    setWorkspaceTab,
    toggleToolRail,
    toggleInspector,
    cycleWorkspaceTab,
  } = useDesktopLayout();
  const workspaceTab = layout.workspaceTab;
  const statusDockOpen = layout.statusDockOpen;
  const [draftingTool, setDraftingTool] = useState<DraftingTool>(
    initialSession.draftingTool,
  );
  const [selectedCabinetIds, setSelectedCabinetIds] = useState<string[]>([
    defaultCabinetProject.cabinets[0]?.id ?? "",
  ].filter(Boolean));
  const [activeCabinetId, setActiveCabinetId] = useState<string | null>(
    defaultCabinetProject.cabinets[0]?.id ?? null,
  );
  const [selectedPanelName, setSelectedPanelName] = useState<PanelName | null>(null);
  const [projectStatus, setProjectStatus] = useState("");
  const [projectFilePath, setProjectFilePath] = useState<string | null>(
    initialSession.projectFilePath,
  );
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);
  const [libraryManagerOpen, setLibraryManagerOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const { library: workshopLibrary, setLibrary: setWorkshopLibrary } =
    useWorkshopLibrary();
  const { templates: userTemplates, saveTemplate, deleteTemplate } = useUserTemplates();
  const { shortcutMap, setBinding, resetShortcuts } = useShortcutMap();
  const { recentFiles, rememberFile, forgetFile } = useRecentFiles();

  const derived = useAppDerivedState({
    project,
    room,
    activeCabinetId,
    selectedCabinetIds,
  });

  function applySnapshot(snapshot: EditorSnapshot) {
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(snapshot.project),
      snapshot.room,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    const safeSelection = sanitizeSelection(
      safeProject,
      snapshot.selectedCabinetIds,
      snapshot.activeCabinetId,
    );
    setProject(safeProject);
    setRoom(activeRoom.config);
    setSelectedCabinetIds(safeSelection.selectedCabinetIds);
    setActiveCabinetId(safeSelection.activeCabinetId);
    setSelectedPanelName(snapshot.selectedPanelName);
  }

  function captureSnapshot(): EditorSnapshot {
    return captureEditorSnapshot(
      project,
      room,
      selectedCabinetIds,
      activeCabinetId,
      selectedPanelName,
    );
  }

  const { canUndo, canRedo, commitSnapshot, handleUndo, handleRedo } = useEditorHistory({
    captureCurrent: captureSnapshot,
    applySnapshot,
    onStatus: setProjectStatus,
  });

  const {
    sortedSavedProjects,
    saveCurrentProjectToBrowser,
    handleLoadSavedProject,
    handleDeleteSavedProject,
    handleRenameSavedProject,
    handleDuplicateSavedProject,
  } = useSavedProjectBrowser({
    project,
    room,
    captureThumbnail: () => sceneRef.current?.captureThumbnail() ?? "",
    applySnapshot,
    onStatus: setProjectStatus,
  });

  useSessionPersist({
    projectFilePath,
    workspaceTab,
    draftingTool,
    selectedCabinetIds,
    activeCabinetId,
    layout,
  });

  const {
    replaceSelection,
    toggleCabinetSelection,
    isCabinetLocked,
    getVisibleProject,
    handleWorkspaceSelectCabinet,
    commitProjectChange,
  } = useProjectCommit({
    project,
    room,
    roomBounds: derived.roomBounds,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
    layers: derived.layers,
    setProject,
    setSelectedCabinetIds,
    setActiveCabinetId,
    setSelectedPanelName,
    commitSnapshot,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProjectStatus("");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [projectStatus]);

  return {
    sceneRef,
    clipboardRef,
    initialSession,
    project,
    room,
    layout,
    setLayout,
    setWorkspaceTab,
    toggleToolRail,
    toggleInspector,
    cycleWorkspaceTab,
    workspaceTab,
    statusDockOpen,
    draftingTool,
    setDraftingTool,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
    projectStatus,
    setProjectStatus,
    projectFilePath,
    setProjectFilePath,
    isCommandBarOpen,
    setIsCommandBarOpen,
    commandQuery,
    setCommandQuery,
    isShortcutSheetOpen,
    setIsShortcutSheetOpen,
    libraryManagerOpen,
    setLibraryManagerOpen,
    contextMenu,
    setContextMenu,
    recentCommandIds,
    setRecentCommandIds,
    workshopLibrary,
    setWorkshopLibrary,
    userTemplates,
    saveTemplate,
    deleteTemplate,
    shortcutMap,
    setBinding,
    resetShortcuts,
    recentFiles,
    rememberFile,
    forgetFile,
    ...derived,
    applySnapshot,
    canUndo,
    canRedo,
    commitSnapshot,
    handleUndo,
    handleRedo,
    sortedSavedProjects,
    saveCurrentProjectToBrowser,
    handleLoadSavedProject,
    handleDeleteSavedProject,
    handleRenameSavedProject,
    handleDuplicateSavedProject,
    replaceSelection,
    toggleCabinetSelection,
    isCabinetLocked,
    getVisibleProject,
    handleWorkspaceSelectCabinet,
    commitProjectChange,
  };
}
