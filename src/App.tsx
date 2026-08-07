import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import "./App.css";
import { type CabinetSceneHandle } from "./components/CabinetScene";
import { type DraftingTool } from "./components/TwoDView";
import { LibraryManagerPanel } from "./components/LibraryManagerPanel";
import { AppRibbon } from "./components/AppRibbon";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { ShortcutSheet } from "./components/ShortcutSheet";
import { StatusStrip } from "./components/StatusStrip";
import { patchJobMeta, formatJobTitle, clampJobMeta, JOB_STATUS_LABELS, type ProjectJobMeta } from "./domain/jobMeta";
import {
  clampDraftingDisplay,
  clampProjectDrafting,
  DEFAULT_DRAFTING,
  DEFAULT_DRAFTING_DISPLAY,
  type DraftingLeader,
  type DraftingNote,
} from "./domain/draftingAnnotations";
import {
  CABINET_GRID_SNAP_MM,
  cabinetTypeLabels,
  clampCabinetConfig,
  clampCabinetPlacement,
  clampCabinetProject,
  defaultCabinetProject,
  getCabinetValidationMessages,
  getWallPlacement,
  normalizeRotationAngle,
  projectHasCollision,
  cabinetsOverlap,
  snapMillimetresToGrid,
  supportsWallPlacement,
  type CabinetGroup,
  type CabinetConfig,
  type CabinetDimensions,
  type CabinetInstance,
  type CabinetLayer,
  type CabinetPlacement,
  type CabinetProject,
  type CabinetType,
} from "./domain/cabinetDimensions";
import {
  createCabinetDerivedMetrics,
  type PanelName,
} from "./domain/cabinetGeometry";
import {
  createRoomPresetProject,
  roomPresets,
  type RoomPresetId,
} from "./domain/roomPresets";
import {
  DEFAULT_ROOM,
  cabinetBlocksOpening,
  type RoomConfig,
} from "./domain/roomModel";
import { exportProjectPdf } from "./domain/pdfExport";
import { createCabinetConstruction } from "./domain/cabinetConstruction";
import {
  createCabinetPlanningWorkflow,
  createRunAlignedPlacements,
} from "./domain/cabinetLibrary";
import { createProjectReport } from "./domain/projectReport";
import {
  createMachineJobDocument,
  exportProjectMachineFile,
} from "./domain/machineExport";
import {
  addEmptyProjectRoom,
  addRoomFromTemplate,
  createWholeProjectReport,
  duplicateProjectRoom,
  getActiveProjectRoom,
  getRoomTemplate,
  listProjectRooms,
  normalizeMultiRoomProject,
  removeProjectRoom,
  renameProjectRoom,
  switchProjectRoom,
  writeActiveRoomState,
  type RoomTemplateId,
} from "./domain/projectRooms";
import {
  evaluateCabinetRules,
  type ManufacturingIssue,
} from "./domain/manufacturingRules";
import {
  csvFromProductionCutlist,
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
} from "./domain/productionCutlist";
import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "./domain/costingSettings";
import {
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
} from "./domain/quoteSettings";
import { createQuoteSnapshotFromQuote } from "./domain/projectQuote";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
} from "./domain/sheetStock";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "./domain/projectStandards";
import {
  createConfigFromFamily,
  createConfigFromLibraryItem,
} from "./domain/cabinetLibraryCatalog";
import {
  createConfigFromTemplate,
  createProjectFromStarter,
  createTemplateFromCabinet,
} from "./domain/cabinetTemplates";
import { useWorkshopLibrary } from "./hooks/useWorkshopLibrary";
import { AppToolRail } from "./components/AppToolRail";
import { AppWorkspace } from "./components/AppWorkspace";
import { AppInspector } from "./components/AppInspector";
import { createOffsetDuplicate } from "./domain/cabinetDuplication";
import { useEditorHistory, captureEditorSnapshot } from "./hooks/useEditorHistory";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useUserTemplates } from "./hooks/useUserTemplates";
import { useSavedProjectBrowser } from "./hooks/useSavedProjectBrowser";
import { useDesktopLayout } from "./hooks/useDesktopLayout";
import { useShortcutMap } from "./hooks/useShortcutMap";
import { useRecentFiles } from "./hooks/useRecentFiles";
import { loadInitialSessionState, useSessionPersist } from "./hooks/useSessionPersist";
import { PaneResizeHandle } from "./components/PaneResizeHandle";
import { ContextMenu, type ContextMenuItem } from "./components/ContextMenu";
import {
  formatShortcutBinding,
  upsertRecentCommandId,
} from "./domain/desktopUx";

import {
  createDefaultLayer,
  sanitizeSelection,
  type EditorSnapshot,
} from "./domain/editorSnapshot";
import { getProjectDisplayName } from "./domain/projectBrowserStorage";
import { createCabinetId, createItemName } from "./domain/cabinetIds";
import {
  computeAlignmentTargets,
  type AlignmentMode,
} from "./domain/cabinetAlignment";
import { deepClone } from "./utils/clone";
import { getErrorMessage } from "./utils/errors";

function App() {
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
  const sessionRestoreAttempted = useRef(false);
  const { library: workshopLibrary, setLibrary: setWorkshopLibrary } =
    useWorkshopLibrary();
  const { templates: userTemplates, saveTemplate, deleteTemplate } = useUserTemplates();
  const { shortcutMap, setBinding, resetShortcuts } = useShortcutMap();
  const { recentFiles, rememberFile, forgetFile } = useRecentFiles();

  const selectedCabinet =
    project.cabinets.find((cabinet) => cabinet.id === activeCabinetId) ?? null;
  const selectedCabinets = useMemo(
    () => project.cabinets.filter((cabinet) => selectedCabinetIds.includes(cabinet.id)),
    [project.cabinets, selectedCabinetIds],
  );
  const selectedConfig = selectedCabinet?.config ?? defaultCabinetProject.cabinets[0].config;
  const selectedPlacement =
    selectedCabinet?.placement ?? defaultCabinetProject.cabinets[0].placement;
  const selectedLayerId = selectedCabinet?.layerId ?? project.layers?.[0]?.id ?? "layer-default";
  const selectedGroupId = selectedCabinet?.groupId ?? null;
  const projectPreferences =
    project.preferences ?? defaultCabinetProject.preferences ?? {
      snapSizeMm: CABINET_GRID_SNAP_MM,
      showGrid: true,
      autoSaveToBrowser: true,
      costing: DEFAULT_COSTING_SETTINGS,
      quote: DEFAULT_QUOTE_SETTINGS,
      sheetOptimizer: DEFAULT_SHEET_OPTIMIZER,
      standards: DEFAULT_PROJECT_STANDARDS,
      drafting: DEFAULT_DRAFTING_DISPLAY,
    };
  const costingSettings = clampCostingSettings(projectPreferences.costing);
  const quoteSettings = clampQuoteSettings(projectPreferences.quote);
  const sheetOptimizerSettings = clampSheetOptimizerSettings(
    projectPreferences.sheetOptimizer,
  );
  const projectStandards = clampProjectStandards(projectPreferences.standards);
  const draftingDisplay = clampDraftingDisplay(projectPreferences.drafting);
  const projectDrafting = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
  const layers = project.layers ?? [createDefaultLayer()];
  const groups = project.groups ?? [];
  const validationMessages = useMemo(
    () =>
      getCabinetValidationMessages(
        selectedConfig,
        selectedCabinet?.placement ?? null,
        room.dimensions.heightMm,
      ),
    [room.dimensions.heightMm, selectedCabinet?.placement, selectedConfig],
  );
  const manufacturingIssues = useMemo((): ManufacturingIssue[] => {
    if (!selectedCabinet) return [];
    return evaluateCabinetRules(selectedCabinet.config, {
      placement: selectedCabinet.placement,
      roomHeightMm: room.dimensions.heightMm,
    }).filter((issue) => issue.severity === "error" || issue.severity === "warning");
  }, [room.dimensions.heightMm, selectedCabinet]);
  const cutlistItems = useMemo(() => createProjectProductionCutlist(project), [project]);
  const cabinetCutlistItems = useMemo(
    () => (selectedCabinet ? createCabinetProductionCutlist(selectedCabinet) : []),
    [selectedCabinet],
  );
  const derivedMetrics = useMemo(
    () =>
      selectedCabinet
        ? createCabinetDerivedMetrics(selectedCabinet.config)
        : createCabinetDerivedMetrics(defaultCabinetProject.cabinets[0].config),
    [selectedCabinet],
  );
  const selectedConstruction = useMemo(
    () => (selectedCabinet ? createCabinetConstruction(selectedCabinet.config) : null),
    [selectedCabinet],
  );
  const roomBounds = useMemo(
    () => ({
      widthMm: room.dimensions.widthMm,
      depthMm: room.dimensions.depthMm,
      heightMm: room.dimensions.heightMm,
    }),
    [room.dimensions.depthMm, room.dimensions.heightMm, room.dimensions.widthMm],
  );
  const planningWorkflow = useMemo(
    () => createCabinetPlanningWorkflow(project, roomBounds),
    [project, roomBounds],
  );
  const projectReport = useMemo(
    () => createProjectReport(project, room, planningWorkflow),
    [planningWorkflow, project, room],
  );
  const wholeProjectReport = useMemo(
    () => createWholeProjectReport(project),
    [project],
  );
  const machineJobDocument = useMemo(
    () => createMachineJobDocument(project, cutlistItems),
    [cutlistItems, project],
  );
  const projectRooms = useMemo(() => listProjectRooms(project), [project]);

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

  useEffect(() => {
    if (sessionRestoreAttempted.current) return;
    sessionRestoreAttempted.current = true;
    const session = initialSession;
    if (!session.restoreLastFile || !session.projectFilePath) return;
    void (async () => {
      try {
        const raw = await invoke<string>("load_project_file", {
          path: session.projectFilePath,
        });
        const parsed = JSON.parse(raw) as {
          project?: CabinetProject;
          room?: RoomConfig;
        };
        if (!parsed.project) return;
        const safeProject = normalizeMultiRoomProject(
          clampCabinetProject(parsed.project),
          parsed.room ?? DEFAULT_ROOM,
        );
        const activeRoom = getActiveProjectRoom(safeProject);
        const preferredIds = session.selectedCabinetIds.filter((id) =>
          safeProject.cabinets.some((cabinet) => cabinet.id === id),
        );
        const fallbackId = safeProject.cabinets[0]?.id ?? null;
        applySnapshot({
          project: safeProject,
          room: activeRoom.config,
          selectedCabinetIds: preferredIds.length
            ? preferredIds
            : fallbackId
              ? [fallbackId]
              : [],
          activeCabinetId: preferredIds[0] ?? fallbackId,
          selectedPanelName: null,
        });
        setProjectFilePath(session.projectFilePath);
        rememberFile(session.projectFilePath!);
        setProjectStatus("Restored previous session file.");
      } catch {
        setProjectStatus("Could not restore previous session file.");
      }
    })();
  }, [initialSession, rememberFile]);

  function replaceSelection(ids: string[], nextActiveId?: string | null, nextPanelName: PanelName | null = null) {
    const safeSelection = sanitizeSelection(project, ids, nextActiveId ?? ids[0] ?? null);
    setSelectedCabinetIds(safeSelection.selectedCabinetIds);
    setActiveCabinetId(safeSelection.activeCabinetId);
    setSelectedPanelName(nextPanelName);
  }

  function toggleCabinetSelection(cabinetId: string) {
    const isSelected = selectedCabinetIds.includes(cabinetId);
    if (isSelected && selectedCabinetIds.length === 1) {
      replaceSelection([cabinetId], cabinetId, null);
      return;
    }

    const nextIds = isSelected
      ? selectedCabinetIds.filter((id) => id !== cabinetId)
      : [...selectedCabinetIds, cabinetId];

    replaceSelection(nextIds, isSelected ? nextIds[0] ?? null : cabinetId, null);
  }

  function getLayerForCabinet(cabinet: CabinetInstance) {
    return layers.find((layer) => layer.id === cabinet.layerId) ?? layers[0];
  }

  function isCabinetLocked(cabinet: CabinetInstance) {
    return getLayerForCabinet(cabinet)?.locked ?? false;
  }

  function getVisibleProject(): CabinetProject {
    return {
      ...project,
      cabinets: project.cabinets.filter((cabinet) => getLayerForCabinet(cabinet)?.visible !== false),
    };
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProjectStatus("");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [projectStatus]);

  useEffect(() => {
    setProject((currentProject) => {
      let changed = false;

      const cabinets = currentProject.cabinets.map((cabinet) => {
        const placement = clampCabinetPlacement(
          cabinet.placement,
          cabinet.config.dimensions,
          roomBounds,
        );

        if (
          placement.x !== cabinet.placement.x ||
          placement.y !== cabinet.placement.y ||
          placement.z !== cabinet.placement.z ||
          placement.rotation !== cabinet.placement.rotation ||
          placement.attachment !== cabinet.placement.attachment
        ) {
          changed = true;
          return { ...cabinet, placement };
        }

        return cabinet;
      });

      return changed ? { ...currentProject, cabinets } : currentProject;
    });
  }, [roomBounds]);

  function clampPlacementInRoom(
    placement: CabinetPlacement,
    dimensions: CabinetDimensions,
  ) {
    return clampCabinetPlacement(placement, dimensions, roomBounds);
  }

  function cabinetWouldBlockOpening(
    cabinetId: string,
    placement: CabinetPlacement,
    dimensions?: CabinetDimensions,
  ) {
    const currentCabinet = project.cabinets.find((cabinet) => cabinet.id === cabinetId);

    if (!currentCabinet) {
      return false;
    }

    return cabinetBlocksOpening(
      {
        ...currentCabinet,
        placement,
        config: {
          ...currentCabinet.config,
          dimensions: dimensions ?? currentCabinet.config.dimensions,
        },
      },
      room,
    );
  }

  function captureThumbnail() {
    return sceneRef.current?.captureThumbnail() ?? "";
  }

  function commitProjectChange(
    updater: (currentProject: CabinetProject, currentRoom: RoomConfig) => {
      project: CabinetProject;
      room?: RoomConfig;
      selectedCabinetIds?: string[];
      activeCabinetId?: string | null;
      selectedPanelName?: PanelName | null;
    } | null,
    status?: string,
  ) {
    const nextState = updater(project, room);

    if (!nextState) {
      return;
    }

    const nextRoom = nextState.room ?? room;
    const synced = writeActiveRoomState(
      nextState.project,
      nextState.project.cabinets,
      nextRoom,
    );
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(synced),
      nextRoom,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    const safeSelection = sanitizeSelection(
      safeProject,
      nextState.selectedCabinetIds ?? selectedCabinetIds,
      nextState.activeCabinetId ?? activeCabinetId,
    );

    commitSnapshot(
      {
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: safeSelection.selectedCabinetIds,
        activeCabinetId: safeSelection.activeCabinetId,
        selectedPanelName:
          nextState.selectedPanelName === undefined
            ? selectedPanelName
            : nextState.selectedPanelName,
      },
      status,
    );
  }

  function commitRoomProject(
    nextProject: CabinetProject,
    status: string,
  ) {
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(nextProject),
      room,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    commitSnapshot(
      {
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: safeProject.cabinets[0]?.id
          ? [safeProject.cabinets[0].id]
          : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      status,
    );
  }

  function handleRoomConfigChange(nextRoom: RoomConfig) {
    commitProjectChange(
      (currentProject) => ({
        project: currentProject,
        room: nextRoom,
      }),
      "Updated room configuration.",
    );
  }

  function handleSelectProjectRoom(roomId: string) {
    if (roomId === project.activeRoomId) return;
    commitRoomProject(
      switchProjectRoom(project, roomId, project.cabinets, room),
      "Switched active room.",
    );
  }

  function handleAddProjectRoom() {
    commitRoomProject(
      addEmptyProjectRoom(project, project.cabinets, room),
      "Added a new room.",
    );
  }

  function handleDuplicateProjectRoom(roomId: string) {
    commitRoomProject(
      duplicateProjectRoom(project, roomId, project.cabinets, room),
      "Duplicated room.",
    );
  }

  function handleRenameProjectRoom(roomId: string) {
    const current = listProjectRooms(project).find((entry) => entry.id === roomId);
    const name = window.prompt("Room name", current?.name ?? "Room");
    if (!name?.trim()) return;
    commitRoomProject(
      renameProjectRoom(project, roomId, name.trim(), project.cabinets, room),
      `Renamed room to “${name.trim()}”.`,
    );
  }

  function handleRemoveProjectRoom(roomId: string) {
    if (listProjectRooms(project).length <= 1) {
      setProjectStatus("Keep at least one room in the project.");
      return;
    }
    if (!window.confirm("Delete this room and its cabinets?")) return;
    commitRoomProject(
      removeProjectRoom(project, roomId, project.cabinets, room),
      "Removed room.",
    );
  }

  function handleAddRoomFromTemplate(templateId: RoomTemplateId) {
    const template = getRoomTemplate(templateId);
    if (!template) return;
    commitRoomProject(
      addRoomFromTemplate(project, project.cabinets, room, template.build()),
      `Added room from “${template.label}” template.`,
    );
  }

  function updateCabinet(cabinetId: string, updater: (cabinet: CabinetInstance) => CabinetInstance, status?: string) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            cabinet.id === cabinetId ? updater(cabinet) : cabinet,
          ),
        },
      }),
      status,
    );
  }

  function getSelectedEditableCabinets() {
    return selectedCabinets.filter((cabinet) => !isCabinetLocked(cabinet));
  }

  function selectionContainsLockedCabinet() {
    return selectedCabinets.some((cabinet) => isCabinetLocked(cabinet));
  }

  function handleCopySelection() {
    if (selectedCabinets.length === 0) return;
    clipboardRef.current = deepClone(selectedCabinets);
    setProjectStatus(`Copied ${selectedCabinets.length} item${selectedCabinets.length === 1 ? "" : "s"}.`);
  }

  function handlePasteSelection() {
    if (clipboardRef.current.length === 0) return;

    commitProjectChange(
      (currentProject) => {
        const duplicates = clipboardRef.current.map((cabinet, index) =>
          createOffsetDuplicate(cabinet, index, currentProject, room, roomBounds),
        );

        return {
          project: {
            ...currentProject,
            cabinets: [...currentProject.cabinets, ...duplicates],
          },
          selectedCabinetIds: duplicates.map((cabinet) => cabinet.id),
          activeCabinetId: duplicates[0]?.id ?? null,
          selectedPanelName: null,
        };
      },
      `Pasted ${clipboardRef.current.length} item${clipboardRef.current.length === 1 ? "" : "s"}.`,
    );
  }

  function handleSelectAll() {
    replaceSelection(project.cabinets.map((cabinet) => cabinet.id), project.cabinets[0]?.id ?? null, null);
    setProjectStatus("Selected all scene items.");
  }

  function handleAutoAlignRuns() {
    commitProjectChange(
      (currentProject) => {
        const alignedPlacements = new Map<string, CabinetPlacement>();

        for (const run of createCabinetPlanningWorkflow(currentProject, roomBounds).runs) {
          const placements = createRunAlignedPlacements(run, currentProject, roomBounds);
          for (const [cabinetId, placement] of Object.entries(placements)) {
            alignedPlacements.set(cabinetId, placement);
          }
        }

        if (alignedPlacements.size === 0) {
          return null;
        }

        return {
          project: {
            ...currentProject,
            cabinets: currentProject.cabinets.map((cabinet) => ({
              ...cabinet,
              placement: alignedPlacements.get(cabinet.id) ?? cabinet.placement,
            })),
          },
        };
      },
      "Aligned cabinets into planning runs.",
    );
  }

  function handleLoadRoomPreset(presetId: RoomPresetId) {
    const preset = roomPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const presetProject = createRoomPresetProject(preset);
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: presetProject.cabinets,
        },
        room,
        selectedCabinetIds: presetProject.cabinets[0]?.id
          ? [presetProject.cabinets[0].id]
          : [],
        activeCabinetId: presetProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      }),
      `Loaded ${preset.label} into the active room.`,
    );
  }

  function handleConfigChange(updatedConfig: Partial<CabinetConfig>) {
    if (!activeCabinetId || !selectedCabinet) {
      return;
    }
    if (isCabinetLocked(selectedCabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return;
    }

    const nextConfig = clampCabinetConfig({
      ...selectedCabinet.config,
      ...updatedConfig,
      dimensions: {
        ...selectedCabinet.config.dimensions,
        ...(updatedConfig.dimensions ?? {}),
      },
    });

    const nextAttachment =
      supportsWallPlacement(nextConfig.type) || selectedCabinet.placement.attachment === "floor"
        ? selectedCabinet.placement.attachment
        : "floor";

    const nextPlacement = clampCabinetPlacement(
      {
        ...selectedCabinet.placement,
        attachment: nextAttachment,
      },
      nextConfig.dimensions,
      roomBounds,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement, nextConfig.dimensions) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement, nextConfig.dimensions)
    ) {
      setProjectStatus("Change blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(activeCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
      config: nextConfig,
    }), "Updated the selected item.");
  }

  function handlePlacementChange(axis: "x" | "y" | "z", value: number) {
    if (!activeCabinetId || !selectedCabinet || !Number.isFinite(value)) {
      return;
    }
    if (isCabinetLocked(selectedCabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return;
    }

    const nextPlacement = clampPlacementInRoom(
      {
        ...selectedCabinet.placement,
        [axis]: value,
      },
      selectedCabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      setProjectStatus("Placement blocked: room items cannot overlap or block openings.");
      return;
    }

    updateCabinet(activeCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }), "Moved the selected item.");
  }

  function handleRotationChange(rotation: number) {
    if (!activeCabinetId || !selectedCabinet) {
      return;
    }
    if (isCabinetLocked(selectedCabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return;
    }

    const nextPlacement = clampPlacementInRoom(
      {
        ...selectedCabinet.placement,
        rotation: normalizeRotationAngle(rotation),
      },
      selectedCabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      setProjectStatus("Rotation blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(activeCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }), "Rotated the selected item.");
  }

  function handleAttachmentChange(attachment: CabinetPlacement["attachment"]) {
    if (!activeCabinetId || !selectedCabinet) {
      return;
    }
    if (isCabinetLocked(selectedCabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return;
    }

    if (attachment !== "floor" && !supportsWallPlacement(selectedCabinet.config.type)) {
      return;
    }

    const nextPlacement = getWallPlacement(
      selectedCabinet.placement,
      selectedCabinet.config.type,
      selectedCabinet.config.dimensions,
      attachment,
      roomBounds,
    );

    if (
      projectHasCollision(project, activeCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(activeCabinetId, nextPlacement)
    ) {
      setProjectStatus("Wall placement blocked: item would overlap or block an opening.");
      return;
    }

    updateCabinet(activeCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }), "Updated the wall attachment.");
  }

  function handleCabinetResize(cabinetId: string, dimensions: CabinetDimensions) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
      return;
    }
    if (isCabinetLocked(cabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return;
    }

    const nextConfig = clampCabinetConfig({
      ...cabinet.config,
      dimensions,
    });
    const nextPlacement = clampPlacementInRoom(cabinet.placement, nextConfig.dimensions);

    if (
      projectHasCollision(project, cabinetId, nextPlacement, nextConfig.dimensions) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement, nextConfig.dimensions)
    ) {
      setProjectStatus("Resize blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(cabinetId, (currentCabinet) => ({
      ...currentCabinet,
      placement: nextPlacement,
      config: nextConfig,
    }), "Resized the selected item.");
  }

  function handleCabinetMove(cabinetId: string, placement: CabinetPlacement) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
      return false;
    }
    if (isCabinetLocked(cabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return false;
    }

    const nextPlacement = clampPlacementInRoom(placement, cabinet.config.dimensions);

    if (
      projectHasCollision(project, cabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement)
    ) {
      setProjectStatus("Move blocked: room items cannot overlap or block openings.");
      return false;
    }

    updateCabinet(cabinetId, (currentCabinet) => ({
      ...currentCabinet,
      placement: nextPlacement,
    }), "Moved the selected item.");

    return true;
  }

  function handleCabinetRotate(cabinetId: string, rotation: number) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
      return false;
    }
    if (isCabinetLocked(cabinet)) {
      setProjectStatus("This item is on a locked layer.");
      return false;
    }

    const nextPlacement = clampPlacementInRoom(
      { ...cabinet.placement, rotation: normalizeRotationAngle(rotation) },
      cabinet.config.dimensions,
    );

    if (
      projectHasCollision(project, cabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(cabinetId, nextPlacement)
    ) {
      setProjectStatus("Rotation blocked: item would collide or block an opening.");
      return false;
    }

    updateCabinet(cabinetId, (currentCabinet) => ({
      ...currentCabinet,
      placement: nextPlacement,
    }), "Rotated the selected item.");

    return true;
  }

  function placeNewCabinet(config: CabinetConfig, nameHint: string) {
    const type = config.type;
    const defaultLayerId = layers[0]?.id ?? "layer-default";
    const tmpCab: CabinetInstance = {
      id: createCabinetId(),
      name: createItemName(type, project.cabinets.length + 1),
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config,
      layerId: defaultLayerId,
      groupId: null,
    };
    let placement: CabinetPlacement | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const basePlacement: CabinetPlacement = {
        x: project.cabinets.length * 700 - 1000 + attempt * 400,
        y: 0,
        z: 0,
        rotation: 0,
        attachment: "floor",
      };
      const candidate = supportsWallPlacement(type)
        ? getWallPlacement(basePlacement, type, config.dimensions, "back-wall", roomBounds)
        : clampCabinetPlacement(basePlacement, config.dimensions, roomBounds);
      const testCab = { ...tmpCab, placement: candidate };
      if (
        !project.cabinets.some((existing) => cabinetsOverlap(existing, testCab)) &&
        !cabinetBlocksOpening(testCab, room)
      ) {
        placement = candidate;
        break;
      }
    }
    if (!placement) {
      placement = clampCabinetPlacement(
        {
          x: project.cabinets.length * 700 - 1000,
          y: 0,
          z: 0,
          rotation: 0,
          attachment: "floor",
        },
        config.dimensions,
        roomBounds,
      );
    }

    const newCabinet: CabinetInstance = {
      id: tmpCab.id,
      name: tmpCab.name,
      placement,
      config,
      layerId: defaultLayerId,
      groupId: null,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: [...currentProject.cabinets, newCabinet],
        },
        selectedCabinetIds: [newCabinet.id],
        activeCabinetId: newCabinet.id,
        selectedPanelName: null,
      }),
      `Added ${nameHint} to the room scene.`,
    );
  }

  function handleAddCabinet(type: CabinetType = "base") {
    placeNewCabinet(
      createConfigFromFamily(type, projectStandards),
      cabinetTypeLabels[type].toLowerCase(),
    );
  }

  function handleAddLibraryItem(itemId: string) {
    const config = createConfigFromLibraryItem(
      itemId,
      projectStandards,
      workshopLibrary.cabinetPresets,
    );
    if (!config) {
      setProjectStatus("Library item could not be resolved.");
      return;
    }
    placeNewCabinet(config, config.type);
  }

  function handleAddTemplate(templateId: string) {
    const template = userTemplates.find((item) => item.id === templateId);
    if (!template) {
      setProjectStatus("Template not found.");
      return;
    }
    placeNewCabinet(
      createConfigFromTemplate(template, projectStandards),
      template.name.toLowerCase(),
    );
  }

  function handleSaveCabinetTemplate(name?: string) {
    if (!selectedCabinet) {
      setProjectStatus("Select a cabinet to save as a template.");
      return;
    }
    const template = createTemplateFromCabinet(selectedCabinet, name);
    saveTemplate(template);
    setProjectStatus(`Saved template “${template.name}”.`);
  }

  function handleDeleteTemplate(templateId: string) {
    deleteTemplate(templateId);
    setProjectStatus("Deleted cabinet template.");
  }

  function handleApplyStarter(starterId: string) {
    const starter = createProjectFromStarter(starterId, projectStandards);
    if (!starter) {
      setProjectStatus("Starter template not found.");
      return;
    }
    const safeProject = clampCabinetProject({
      ...starter.project,
      preferences: {
        ...projectPreferences,
        ...starter.project.preferences,
        standards: projectStandards,
      },
    });
    commitSnapshot(
      {
        project: safeProject,
        room: starter.room,
        selectedCabinetIds: safeProject.cabinets[0]?.id ? [safeProject.cabinets[0].id] : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      `Loaded starter “${starterId}”.`,
    );
    setProjectFilePath(null);
  }

  function handleDuplicateCabinet() {
    if (selectedCabinets.length === 0) {
      return;
    }
    const editable = getSelectedEditableCabinets();
    if (editable.length === 0) {
      setProjectStatus("Selected items are on locked layers.");
      return;
    }

    commitProjectChange(
      (currentProject) => {
        const duplicates = editable.map((cabinet, index) =>
          createOffsetDuplicate(cabinet, index, currentProject, room, roomBounds),
        );

        return {
          project: {
            ...currentProject,
            cabinets: [...currentProject.cabinets, ...duplicates],
          },
          selectedCabinetIds: duplicates.map((cabinet) => cabinet.id),
          activeCabinetId: duplicates[0]?.id ?? null,
          selectedPanelName: null,
        };
      },
      `Duplicated ${editable.length} item${editable.length === 1 ? "" : "s"}.`,
    );
  }

  function handleRemoveCabinet() {
    if (selectedCabinetIds.length === 0 || project.cabinets.length <= selectedCabinetIds.length) {
      return;
    }
    if (selectionContainsLockedCabinet()) {
      setProjectStatus("Locked-layer items cannot be removed.");
      return;
    }

    const nextCabinets = project.cabinets.filter(
      (cabinet) => !selectedCabinetIds.includes(cabinet.id),
    );

    commitProjectChange(
      () => ({
        project: {
          ...project,
          cabinets: nextCabinets,
        },
        selectedCabinetIds: nextCabinets[0]?.id ? [nextCabinets[0].id] : [],
        activeCabinetId: nextCabinets[0]?.id ?? null,
        selectedPanelName: null,
      }),
      `Removed ${selectedCabinetIds.length} item${selectedCabinetIds.length === 1 ? "" : "s"}.`,
    );
  }

  function handleReset() {
    commitSnapshot(
      {
        project: defaultCabinetProject,
        room: DEFAULT_ROOM,
        selectedCabinetIds: defaultCabinetProject.cabinets[0]?.id
          ? [defaultCabinetProject.cabinets[0].id]
          : [],
        activeCabinetId: defaultCabinetProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      "Reset the whole project.",
    );
    setProjectFilePath(null);
  }

  function handleRenameCabinet(cabinetId: string, newName: string) {
    updateCabinet(cabinetId, (cabinet) => ({
      ...cabinet,
      name: newName.trim() || cabinet.name,
    }), "Renamed the selected item.");
  }

  function handleDuplicateLayer() {
    const nextLayer: CabinetLayer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          layers: [...(currentProject.layers ?? [createDefaultLayer()]), nextLayer],
        },
      }),
      "Added a new layer.",
    );
  }

  function handleLayerChange(layerId: string, patch: Partial<CabinetLayer>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          layers: (currentProject.layers ?? [createDefaultLayer()]).map((layer) =>
            layer.id === layerId ? { ...layer, ...patch } : layer,
          ),
        },
      }),
      "Updated layer settings.",
    );
  }

  function handleAssignLayer(layerId: string) {
    if (selectedCabinets.length === 0) return;
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, layerId }
              : cabinet,
          ),
        },
      }),
      "Assigned the selection to a layer.",
    );
  }

  function handleCreateGroup() {
    if (selectedCabinetIds.length < 2) return;
    const group: CabinetGroup = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
    };

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          groups: [...(currentProject.groups ?? []), group],
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, groupId: group.id }
              : cabinet,
          ),
        },
      }),
      "Grouped the selected items.",
    );
  }

  function handleClearGroup() {
    if (selectedCabinetIds.length === 0) return;
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) =>
            selectedCabinetIds.includes(cabinet.id)
              ? { ...cabinet, groupId: null }
              : cabinet,
          ),
        },
      }),
      "Removed the selected items from their group.",
    );
  }

  function handleJobMetaChange(patch: Partial<ProjectJobMeta>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          job: patchJobMeta(currentProject.job, patch),
        },
      }),
      "Updated job workflow.",
    );
  }

  function handleProjectPreferenceChange(
    patch: Partial<NonNullable<CabinetProject["preferences"]>>,
  ) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          preferences: {
            snapSizeMm:
              currentProject.preferences?.snapSizeMm ??
              defaultCabinetProject.preferences?.snapSizeMm ??
              CABINET_GRID_SNAP_MM,
            showGrid:
              currentProject.preferences?.showGrid ??
              defaultCabinetProject.preferences?.showGrid ??
              true,
            autoSaveToBrowser:
              currentProject.preferences?.autoSaveToBrowser ??
              defaultCabinetProject.preferences?.autoSaveToBrowser ??
              true,
            costing: clampCostingSettings(
              currentProject.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
            ),
            quote: clampQuoteSettings(
              currentProject.preferences?.quote ?? DEFAULT_QUOTE_SETTINGS,
            ),
            sheetOptimizer: clampSheetOptimizerSettings(
              currentProject.preferences?.sheetOptimizer ?? DEFAULT_SHEET_OPTIMIZER,
            ),
            standards: clampProjectStandards(
              currentProject.preferences?.standards ?? DEFAULT_PROJECT_STANDARDS,
            ),
            drafting: clampDraftingDisplay(
              currentProject.preferences?.drafting ?? DEFAULT_DRAFTING_DISPLAY,
            ),
            ...patch,
          },
        },
      }),
      "Updated project preferences.",
    );
  }

  function handleFreezeQuoteSnapshot() {
    const snapshot = createQuoteSnapshotFromQuote(projectReport.quote);
    commitProjectChange(
      (currentProject) => {
        const nextHistory = [snapshot, ...(currentProject.quoteHistory ?? [])].slice(0, 12);
        const shouldMarkQuoted =
          !currentProject.job?.status || currentProject.job.status === "draft";
        return {
          project: {
            ...currentProject,
            quoteHistory: nextHistory,
            job: shouldMarkQuoted
              ? patchJobMeta(currentProject.job, { status: "quoted" })
              : clampJobMeta(currentProject.job),
          },
        };
      },
      `Froze quote snapshot for revision ${snapshot.revision}.`,
    );
  }

  function handleDraftingChange(next: ReturnType<typeof clampProjectDrafting>) {
    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          drafting: clampProjectDrafting(next),
        },
      }),
      "Updated drafting annotations.",
    );
  }

  function handleAddDraftingNote(note: DraftingNote) {
    const current = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
    handleDraftingChange({
      ...current,
      notes: [...current.notes, note],
    });
    setDraftingTool("select");
    setProjectStatus("Added drawing note.");
  }

  function handleAddDraftingLeader(leader: DraftingLeader) {
    const current = clampProjectDrafting(project.drafting ?? DEFAULT_DRAFTING);
    handleDraftingChange({
      ...current,
      leaders: [...current.leaders, leader],
    });
    setDraftingTool("select");
    setProjectStatus("Added leader callout.");
  }

  function closeCommandSurfaces() {
    setIsCommandBarOpen(false);
    setCommandQuery("");
    setIsShortcutSheetOpen(false);
  }

  function handleAlignSelection(mode: AlignmentMode) {
    const editable = getSelectedEditableCabinets();
    if (editable.length < 2) return;

    const targets = computeAlignmentTargets(editable, mode);
    const targetById = new Map(targets.map((item) => [item.id, item]));

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) => {
            if (!selectedCabinetIds.includes(cabinet.id) || isCabinetLocked(cabinet)) {
              return cabinet;
            }

            const target = targetById.get(cabinet.id);
            if (!target) {
              return cabinet;
            }

            return {
              ...cabinet,
              placement: clampPlacementInRoom(
                {
                  ...cabinet.placement,
                  x: snapMillimetresToGrid(target.x, projectPreferences.snapSizeMm),
                  z: snapMillimetresToGrid(target.z, projectPreferences.snapSizeMm),
                },
                cabinet.config.dimensions,
              ),
            };
          }),
        },
      }),
      "Aligned the selected items.",
    );
  }

  useEditorShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => { void handleSaveProject(); },
    onNew: handleReset,
    onCopy: handleCopySelection,
    onPaste: handlePasteSelection,
    onDuplicate: handleDuplicateCabinet,
    onSelectAll: handleSelectAll,
    onRemove: handleRemoveCabinet,
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
  }, shortcutMap);

  const commandItems = useMemo<CommandItem[]>(
    () => [
      { id: "new", label: "New Project", hint: "Reset the current project", shortcut: formatShortcutBinding(shortcutMap.new), category: "File", keywords: ["reset"], action: handleReset },
      { id: "open", label: "Open Project", hint: "Open a project JSON from disk", shortcut: "File", category: "File", keywords: ["load"], action: () => { void handleLoadProject(); } },
      { id: "save", label: "Save Project", hint: "Save project JSON to disk", shortcut: formatShortcutBinding(shortcutMap.save), category: "File", action: () => { void handleSaveProject(); } },
      { id: "undo", label: "Undo", hint: "Reverse the last change", shortcut: formatShortcutBinding(shortcutMap.undo), category: "Edit", action: handleUndo },
      { id: "redo", label: "Redo", hint: "Reapply the last undone change", shortcut: formatShortcutBinding(shortcutMap.redo), category: "Edit", action: handleRedo },
      { id: "copy", label: "Copy Selection", hint: "Copy selected items", shortcut: formatShortcutBinding(shortcutMap.copy), category: "Edit", action: handleCopySelection },
      { id: "paste", label: "Paste Selection", hint: "Paste copied items", shortcut: formatShortcutBinding(shortcutMap.paste), category: "Edit", action: handlePasteSelection },
      { id: "duplicate", label: "Duplicate Selection", hint: "Duplicate selected cabinets", shortcut: formatShortcutBinding(shortcutMap.duplicate), category: "Edit", action: handleDuplicateCabinet },
      { id: "select-all", label: "Select All", hint: "Select every cabinet in the room", shortcut: formatShortcutBinding(shortcutMap.selectAll), category: "Edit", action: handleSelectAll },
      { id: "remove", label: "Remove Selection", hint: "Delete selected cabinets", shortcut: formatShortcutBinding(shortcutMap.remove), category: "Edit", keywords: ["delete"], action: handleRemoveCabinet },
      { id: "group", label: "Group Selection", hint: "Create a group from selected items", shortcut: "Toolbar", category: "Edit", action: handleCreateGroup },
      { id: "ungroup", label: "Ungroup Selection", hint: "Remove selected items from their group", shortcut: "Toolbar", category: "Edit", action: handleClearGroup },
      { id: "align-left", label: "Align Left", hint: "Align selected items to the left edge", shortcut: "Toolbar", category: "Arrange", action: () => handleAlignSelection("align-left") },
      { id: "distribute-x", label: "Distribute X", hint: "Evenly space selected items horizontally", shortcut: "Toolbar", category: "Arrange", action: () => handleAlignSelection("distribute-x") },
      { id: "align-runs", label: "Align Runs", hint: "Auto-align cabinet runs along walls", shortcut: "Toolbar", category: "Arrange", action: handleAutoAlignRuns },
      { id: "view-plan", label: "Plan View", hint: "Switch workspace to plan", shortcut: formatShortcutBinding(shortcutMap.viewPlan), category: "View", action: () => { setWorkspaceTab("plan"); setDraftingTool("select"); } },
      { id: "view-front", label: "Front Elevation", hint: "Switch workspace to front", shortcut: formatShortcutBinding(shortcutMap.viewFront), category: "View", action: () => { setWorkspaceTab("front"); setDraftingTool("select"); } },
      { id: "view-side", label: "Side Elevation", hint: "Switch workspace to side", shortcut: formatShortcutBinding(shortcutMap.viewSide), category: "View", action: () => { setWorkspaceTab("side"); setDraftingTool("select"); } },
      { id: "view-3d", label: "3D View", hint: "Switch workspace to 3D", shortcut: formatShortcutBinding(shortcutMap.view3d), category: "View", action: () => { setWorkspaceTab("3d"); setDraftingTool("select"); } },
      { id: "toggle-rail", label: "Toggle Tool Rail", hint: "Show or hide the left tool rail", shortcut: formatShortcutBinding(shortcutMap.toggleToolRail), category: "View", action: toggleToolRail },
      { id: "toggle-inspector", label: "Toggle Inspector", hint: "Show or hide the properties inspector", shortcut: formatShortcutBinding(shortcutMap.toggleInspector), category: "View", action: toggleInspector },
      { id: "toggle-grid", label: "Toggle Grid", hint: "Show or hide the viewport grid", shortcut: "View", category: "View", action: () => handleProjectPreferenceChange({ showGrid: !projectPreferences.showGrid }) },
      { id: "library-manager", label: "Library Manager", hint: "Manage door, material, hardware, and cabinet libraries", shortcut: "Rail", category: "Tools", action: () => setLibraryManagerOpen(true) },
      { id: "export-json", label: "Export Project JSON", hint: "Download project JSON", shortcut: "Export", category: "Export", action: () => { void handleExportProjectJson(); } },
      { id: "export-csv", label: "Export Cutlist CSV", hint: "Download production cutlist CSV", shortcut: "Export", category: "Export", action: () => { void handleExportCutlistCsv(); } },
      { id: "export-pdf", label: "Export PDF", hint: "Download project PDF report", shortcut: "Export", category: "Export", action: () => { void handleExportPdf(); } },
      { id: "export-machine-json", label: "Export Machine JSON (preview)", hint: "Machining intent metadata — not a CNC program", shortcut: "Export", category: "Export", action: () => { void handleExportMachineJson(); } },
      { id: "shortcuts", label: "Configure Shortcuts", hint: "Open keyboard shortcut editor", shortcut: formatShortcutBinding(shortcutMap.shortcutHelp), category: "Tools", action: () => setIsShortcutSheetOpen(true) },
    ],
    [projectPreferences.showGrid, selectedCabinetIds.length, shortcutMap],
  );

  async function writeFile(path: string, contents: string) {
    await invoke("save_project_file", {
      path,
      contents,
    });
  }

  async function handleSaveProject() {
    try {
      const targetPath =
        projectFilePath ??
        (await save({
          title: "Save Cabinet Project",
          defaultPath: "cabinet-project.json",
          filters: [{ name: "Cabinet Project", extensions: ["json"] }],
        }));

      if (!targetPath) {
        setProjectStatus("Save cancelled.");
        return;
      }

      await writeFile(
        targetPath,
        JSON.stringify(
          {
            version: 3,
            savedAt: new Date().toISOString(),
            project: normalizeMultiRoomProject(
              writeActiveRoomState(project, project.cabinets, room),
              room,
            ),
            room,
          },
          null,
          2,
        ),
      );

      setProjectFilePath(targetPath);
      rememberFile(targetPath);
      saveCurrentProjectToBrowser(targetPath.split("/").pop()?.replace(/\.json$/i, ""));
      setProjectStatus("Project saved to JSON file.");
    } catch (error) {
      setProjectStatus(`Save failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleLoadProject() {
    try {
      const selectedPath = await open({
        title: "Open Cabinet Project",
        multiple: false,
        directory: false,
        filters: [{ name: "Cabinet Project", extensions: ["json"] }],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        setProjectStatus("Load cancelled.");
        return;
      }

      const raw = await invoke<string>("load_project_file", {
        path: selectedPath,
      });
      const parsed = JSON.parse(raw) as
        | { project?: CabinetProject; config?: CabinetConfig; room?: RoomConfig };

      if (parsed.project) {
        const safeProject = normalizeMultiRoomProject(
          clampCabinetProject(parsed.project),
          parsed.room ?? DEFAULT_ROOM,
        );
        const activeRoom = getActiveProjectRoom(safeProject);
        applySnapshot({
          project: safeProject,
          room: activeRoom.config,
          selectedCabinetIds: safeProject.cabinets[0]?.id ? [safeProject.cabinets[0].id] : [],
          activeCabinetId: safeProject.cabinets[0]?.id ?? null,
          selectedPanelName: null,
        });
      } else if (parsed.config) {
        const migratedProject = clampCabinetProject({
          version: 1,
          cabinets: [
            {
              id: "cabinet-1",
              name: "Cabinet 1",
              placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
              config: parsed.config,
              layerId: "layer-default",
              groupId: null,
            },
          ],
        });
        applySnapshot({
          project: migratedProject,
          room,
          selectedCabinetIds: migratedProject.cabinets[0]?.id ? [migratedProject.cabinets[0].id] : [],
          activeCabinetId: migratedProject.cabinets[0]?.id ?? null,
          selectedPanelName: null,
        });
      } else {
        throw new Error("Invalid project file format.");
      }

      setProjectFilePath(selectedPath);
      rememberFile(selectedPath);
      setProjectStatus("Project loaded from JSON file.");
    } catch (error) {
      setProjectStatus(`Load failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleOpenRecentFile(path: string) {
    try {
      const raw = await invoke<string>("load_project_file", { path });
      const parsed = JSON.parse(raw) as {
        project?: CabinetProject;
        config?: CabinetConfig;
        room?: RoomConfig;
      };
      if (parsed.project) {
        const safeProject = normalizeMultiRoomProject(
          clampCabinetProject(parsed.project),
          parsed.room ?? DEFAULT_ROOM,
        );
        const activeRoom = getActiveProjectRoom(safeProject);
        applySnapshot({
          project: safeProject,
          room: activeRoom.config,
          selectedCabinetIds: safeProject.cabinets[0]?.id ? [safeProject.cabinets[0].id] : [],
          activeCabinetId: safeProject.cabinets[0]?.id ?? null,
          selectedPanelName: null,
        });
      } else if (parsed.config) {
        const migratedProject = clampCabinetProject({
          version: 1,
          cabinets: [
            {
              id: "cabinet-1",
              name: "Cabinet 1",
              placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
              config: parsed.config,
              layerId: "layer-default",
              groupId: null,
            },
          ],
        });
        applySnapshot({
          project: migratedProject,
          room,
          selectedCabinetIds: migratedProject.cabinets[0]?.id
            ? [migratedProject.cabinets[0].id]
            : [],
          activeCabinetId: migratedProject.cabinets[0]?.id ?? null,
          selectedPanelName: null,
        });
      } else {
        throw new Error("Invalid project file format.");
      }
      setProjectFilePath(path);
      rememberFile(path);
      setProjectStatus(`Opened recent file “${path.split(/[/\\]/).pop()}”.`);
    } catch (error) {
      forgetFile(path);
      setProjectStatus(`Recent file failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleExportMachineJson() {
    try {
      const exported = exportProjectMachineFile(project, "json-preview");
      const targetPath = await save({
        title: "Export Machine Intent JSON (preview)",
        defaultPath: "cabinet-machine-preview.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!targetPath) {
        setProjectStatus("Machine JSON export cancelled.");
        return;
      }
      await writeFile(targetPath, exported.contents);
      setProjectStatus(
        "Exported machining intent JSON (preview only — not a CNC program).",
      );
    } catch (error) {
      setProjectStatus(`Machine JSON export failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleExportMachineCsv() {
    try {
      const exported = exportProjectMachineFile(project, "csv-ops-preview");
      const targetPath = await save({
        title: "Export Machine Operations CSV (preview)",
        defaultPath: "cabinet-machine-ops-preview.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!targetPath) {
        setProjectStatus("Machine CSV export cancelled.");
        return;
      }
      await writeFile(targetPath, exported.contents);
      setProjectStatus(
        "Exported machining operations CSV (preview only — not a CNC program).",
      );
    } catch (error) {
      setProjectStatus(`Machine CSV export failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleExportCutlistCsv() {
    try {
      const targetPath = await save({
        title: "Export Cutlist CSV",
        defaultPath: "cabinet-cutlist.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });

      if (!targetPath) {
        setProjectStatus("CSV export cancelled.");
        return;
      }

      await writeFile(targetPath, csvFromProductionCutlist(cutlistItems));
      setProjectStatus("Production cutlist exported to CSV.");
    } catch (error) {
      setProjectStatus(`CSV export failed: ${getErrorMessage(error)}`);
    }
  }

  async function handleExportProjectJson() {
    try {
      const targetPath = await save({
        title: "Export Project JSON",
        defaultPath: "cabinet-project-export.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!targetPath) {
        setProjectStatus("Project export cancelled.");
        return;
      }

      await writeFile(
        targetPath,
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            project,
          },
          null,
          2,
        ),
      );
      setProjectStatus("Project exported to JSON.");
    } catch (error) {
      setProjectStatus(`Project export failed: ${getErrorMessage(error)}`);
    }
  }
  async function handleExportPdf() {
    try {
      const targetPath = await save({
        title: "Export PDF Report",
        defaultPath: "cabinet-project.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!targetPath) {
        setProjectStatus("PDF export cancelled.");
        return;
      }
      setProjectStatus("Generating PDF...");
      const screenshot = captureThumbnail();
      const blob = await exportProjectPdf(
        project,
        screenshot,
        getProjectDisplayName(project, 1),
        room,
        planningWorkflow.countertops,
        planningWorkflow.runs,
      );
      const arrayBuf = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      // Base64-encode for Tauri's string-based IPC
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      await invoke("save_binary_file", { path: targetPath, base64Data: base64 });
      setProjectStatus("PDF report saved.");
    } catch (error) {
      setProjectStatus("PDF export failed: " + getErrorMessage(error));
    }
  }



  const activeRoomName = getActiveProjectRoom(project).name;
  const workspaceLabel =
    workspaceTab === "plan"
      ? `${activeRoomName} · Plan`
      : workspaceTab === "front"
        ? `${activeRoomName} · Front`
        : workspaceTab === "side"
          ? `${activeRoomName} · Side`
          : `${activeRoomName} · 3D`;

  function handleWorkspaceSelectCabinet(cabinetId: string | null, additive: boolean) {
    if (!cabinetId) {
      replaceSelection([], null, null);
      return;
    }

    if (additive) {
      toggleCabinetSelection(cabinetId);
      return;
    }

    replaceSelection([cabinetId], cabinetId, null);
  }

  function openCabinetContextMenu(cabinetId: string, point: { x: number; y: number }) {
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

  function openProjectContextMenu(projectId: string, point: { x: number; y: number }) {
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
            handleProjectPreferenceChange({ showGrid: !projectPreferences.showGrid }),
        },
        {
          id: "toggle-rail",
          label: layout.toolRailVisible ? "Hide Tool Rail" : "Show Tool Rail",
          action: toggleToolRail,
        },
        {
          id: "toggle-inspector",
          label: layout.inspectorVisible ? "Hide Inspector" : "Show Inspector",
          action: toggleInspector,
        },
      ],
    });
  }

  const tabShortcutHints = {
    plan: formatShortcutBinding(shortcutMap.viewPlan),
    front: formatShortcutBinding(shortcutMap.viewFront),
    side: formatShortcutBinding(shortcutMap.viewSide),
    "3d": formatShortcutBinding(shortcutMap.view3d),
  };

  return (
    <main
      className="app-shell"
      style={{
        ["--tool-rail-width" as string]: `${layout.toolRailWidthPx}px`,
        ["--inspector-width" as string]: `${layout.inspectorWidthPx}px`,
        ["--status-dock-height" as string]: `${layout.statusDockHeightPx}px`,
      }}
    >
      <AppRibbon
        workspaceLabel={workspaceLabel}
        workspaceTab={workspaceTab}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={selectedCabinetIds.length > 0}
        hasClipboard={clipboardRef.current.length > 0}
        selectionCount={selectedCabinetIds.length}
        toolRailVisible={layout.toolRailVisible}
        inspectorVisible={layout.inspectorVisible}
        recentFiles={recentFiles}
        onNew={handleReset}
        onOpen={handleLoadProject}
        onSave={handleSaveProject}
        onOpenRecent={(path) => { void handleOpenRecentFile(path); }}
        onClearRecent={forgetFile}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopySelection}
        onPaste={handlePasteSelection}
        onDuplicate={handleDuplicateCabinet}
        onAlignRuns={handleAutoAlignRuns}
        onAlign={handleAlignSelection}
        onExportJson={handleExportProjectJson}
        onExportCsv={handleExportCutlistCsv}
        onExportPdf={handleExportPdf}
        onSetViewPreset={(preset) => sceneRef.current?.setViewPreset(preset)}
        onToggleToolRail={toggleToolRail}
        onToggleInspector={toggleInspector}
        onOpenCommands={() => {
          setIsCommandBarOpen(true);
          setIsShortcutSheetOpen(false);
        }}
        onOpenShortcuts={() => {
          setIsShortcutSheetOpen(true);
          setIsCommandBarOpen(false);
        }}
      />

      <div className="app-body">
        {layout.toolRailVisible ? (
          <>
        <AppToolRail
          templates={userTemplates}
          userCabinetPresets={workshopLibrary.cabinetPresets}
          cabinets={project.cabinets}
          activeCabinetId={activeCabinetId}
          selectedCabinetIds={selectedCabinetIds}
          rooms={projectRooms}
          activeRoomId={project.activeRoomId ?? projectRooms[0]?.id ?? null}
          savedProjects={sortedSavedProjects}
          onAddFamily={handleAddCabinet}
          onAddLibraryItem={handleAddLibraryItem}
          onAddTemplate={handleAddTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onApplyStarter={handleApplyStarter}
          onOpenLibraryManager={() => setLibraryManagerOpen(true)}
          onSelectCabinet={handleWorkspaceSelectCabinet}
          onSelectRoom={handleSelectProjectRoom}
          onAddRoom={handleAddProjectRoom}
          onDuplicateRoom={handleDuplicateProjectRoom}
          onRenameRoom={handleRenameProjectRoom}
          onRemoveRoom={handleRemoveProjectRoom}
          onAddFromTemplate={handleAddRoomFromTemplate}
          onLoadRoomPreset={handleLoadRoomPreset}
          onDeleteSavedProject={handleDeleteSavedProject}
          onDuplicateSavedProject={handleDuplicateSavedProject}
          onLoadSavedProject={handleLoadSavedProject}
          onRenameSavedProject={handleRenameSavedProject}
          onSaveCurrentProject={saveCurrentProjectToBrowser}
          onCabinetContextMenu={openCabinetContextMenu}
          onProjectContextMenu={openProjectContextMenu}
          style={{ width: layout.toolRailWidthPx }}
        />
        <PaneResizeHandle
          axis="x"
          value={layout.toolRailWidthPx}
          ariaLabel="Resize tool rail"
          onChange={(toolRailWidthPx) => setLayout({ toolRailWidthPx })}
        />
          </>
        ) : null}

        <AppWorkspace
          ref={sceneRef}
          workspaceTab={workspaceTab}
          workspaceLabel={workspaceLabel}
          draftingTool={draftingTool}
          project={getVisibleProject()}
          room={room}
          planningWorkflow={planningWorkflow}
          snapSizeMm={projectPreferences.snapSizeMm}
          showGrid={projectPreferences.showGrid}
          selectedCabinetIds={selectedCabinetIds}
          activeCabinetId={activeCabinetId}
          selectedPanelName={selectedPanelName}
          draftingDisplay={draftingDisplay}
          onWorkspaceTabChange={(tab) => {
            setWorkspaceTab(tab);
            setDraftingTool("select");
          }}
          onDraftingToolChange={setDraftingTool}
          onCabinetMove={handleCabinetMove}
          onCabinetRotate={handleCabinetRotate}
          onCabinetResize={handleCabinetResize}
          onReplaceSelection={replaceSelection}
          onToggleCabinetSelection={toggleCabinetSelection}
          onSelectCabinet={handleWorkspaceSelectCabinet}
          onAddNote={handleAddDraftingNote}
          onAddLeader={handleAddDraftingLeader}
          onWorkspaceContextMenu={openWorkspaceContextMenu}
          tabShortcutHints={tabShortcutHints}
        />

        {layout.inspectorVisible ? (
          <>
        <PaneResizeHandle
          axis="x"
          value={layout.inspectorWidthPx}
          invert
          ariaLabel="Resize inspector"
          onChange={(inspectorWidthPx) => setLayout({ inspectorWidthPx })}
        />
        <AppInspector
          selectedCabinet={selectedCabinet}
          selectedCabinetIds={selectedCabinetIds}
          job={project.job ?? defaultCabinetProject.job!}
          onJobChange={handleJobMetaChange}
          projectDrafting={projectDrafting}
          draftingDisplay={draftingDisplay}
          onDraftingDisplayChange={(patch) =>
            handleProjectPreferenceChange({ drafting: patch })
          }
          onDraftingChange={handleDraftingChange}
          room={room}
          onRoomConfigChange={handleRoomConfigChange}
          project={project}
          cabinetCutlistItems={cabinetCutlistItems}
          selectedConfig={selectedConfig}
          constructionParts={selectedConstruction?.parts ?? []}
          derivedMetrics={derivedMetrics}
          cutlistItems={cutlistItems}
          projectFilePath={projectFilePath}
          projectStatus={projectStatus}
          savedProjects={sortedSavedProjects}
          snapSizeMm={projectPreferences.snapSizeMm}
          activeCabinetId={activeCabinetId}
          selectedPanelName={selectedPanelName}
          selectedPlacement={selectedPlacement}
          selectedLayerId={selectedLayerId}
          selectedGroupId={selectedGroupId}
          layers={layers}
          groups={groups}
          preferences={projectPreferences}
          validationMessages={validationMessages}
          manufacturingIssues={manufacturingIssues}
          onAttachmentChange={handleAttachmentChange}
          onAlignSelection={handleAlignSelection}
          onAssignLayer={handleAssignLayer}
          onConfigChange={handleConfigChange}
          onCopySelection={handleCopySelection}
          onCreateGroup={handleCreateGroup}
          onCreateLayer={handleDuplicateLayer}
          onClearGroup={handleClearGroup}
          onDeleteSavedProject={handleDeleteSavedProject}
          onDuplicateCabinet={handleDuplicateCabinet}
          onDuplicateSavedProject={handleDuplicateSavedProject}
          onExportCutlistCsv={handleExportCutlistCsv}
          onExportProjectJson={handleExportProjectJson}
          onExportPdf={handleExportPdf}
          onLayerChange={handleLayerChange}
          onLoadProject={handleLoadProject}
          onLoadSavedProject={handleLoadSavedProject}
          onPasteSelection={handlePasteSelection}
          onPlacementChange={handlePlacementChange}
          onPreferenceChange={handleProjectPreferenceChange}
          onSaveCabinetTemplate={handleSaveCabinetTemplate}
          onRemoveCabinet={handleRemoveCabinet}
          onRenameCabinet={handleRenameCabinet}
          onRenameSavedProject={handleRenameSavedProject}
          onReset={handleReset}
          onRotationChange={handleRotationChange}
          onSaveProject={handleSaveProject}
          onSaveToProjectBrowser={saveCurrentProjectToBrowser}
          onSelectCabinet={(cabinetId, additive) => {
            if (additive) {
              toggleCabinetSelection(cabinetId);
              return;
            }
            replaceSelection([cabinetId], cabinetId, null);
          }}
          onSelectAll={handleSelectAll}
          onUndo={handleUndo}
          onRedo={handleRedo}
          style={{ width: layout.inspectorWidthPx }}
        />
          </>
        ) : null}
      </div>

      {libraryManagerOpen ? (
        <div
          className="command-bar-backdrop"
          onClick={() => setLibraryManagerOpen(false)}
        >
          <div
            className="library-manager-shell"
            onClick={(event) => event.stopPropagation()}
          >
            <LibraryManagerPanel
              library={workshopLibrary}
              projectStandards={projectStandards}
              selectedConfig={selectedCabinet?.config ?? null}
              onLibraryChange={setWorkshopLibrary}
              onApplyStandardsPack={(standards) => {
                handleProjectPreferenceChange({
                  standards: clampProjectStandards(standards),
                });
                setProjectStatus("Applied standards pack from library.");
              }}
              onClose={() => setLibraryManagerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {isCommandBarOpen ? (
        <CommandPalette
          query={commandQuery}
          items={commandItems}
          recentCommandIds={recentCommandIds}
          onQueryChange={setCommandQuery}
          onClose={closeCommandSurfaces}
          onRunCommand={(commandId) =>
            setRecentCommandIds((ids) => upsertRecentCommandId(ids, commandId))
          }
        />
      ) : null}
      {isShortcutSheetOpen ? (
        <ShortcutSheet
          shortcutMap={shortcutMap}
          onClose={closeCommandSurfaces}
          onChangeBinding={setBinding}
          onReset={resetShortcuts}
        />
      ) : null}
      {contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      ) : null}

      <div className="status-dock-shell">
      <StatusStrip
        projectStatus={projectStatus}
        workspaceLabel={workspaceLabel}
        jobTitle={formatJobTitle(clampJobMeta(project.job))}
        jobStatusLabel={JOB_STATUS_LABELS[clampJobMeta(project.job).status]}
        cabinetCount={project.cabinets.length}
        selectionSummary={
          selectedCabinet
            ? `${selectedCabinet.config.dimensions.width} × ${selectedCabinet.config.dimensions.height} × ${selectedCabinet.config.dimensions.depth} mm`
            : selectedCabinetIds.length > 1
              ? `${selectedCabinetIds.length} selected`
              : "No selection"
        }
        validationMessages={validationMessages}
        statusDockOpen={statusDockOpen}
        dockHeightPx={layout.statusDockHeightPx}
        onToggleStatusDock={() => setLayout({ statusDockOpen: !statusDockOpen })}
        onDockHeightChange={(statusDockHeightPx) => setLayout({ statusDockHeightPx })}
        onSave={handleSaveProject}
        onExportJson={handleExportProjectJson}
        onExportCsv={handleExportCutlistCsv}
        onExportPdf={handleExportPdf}
        report={projectReport}
        wholeProject={wholeProjectReport}
        machineJob={machineJobDocument}
        onExportMachineJson={() => {
          void handleExportMachineJson();
        }}
        onExportMachineCsv={() => {
          void handleExportMachineCsv();
        }}
        selectedCabinetId={activeCabinetId}
        costingSettings={costingSettings}
        quoteSettings={quoteSettings}
        sheetOptimizerSettings={sheetOptimizerSettings}
        onCostingChange={(next) =>
          handleProjectPreferenceChange({
            costing: clampCostingSettings(next),
          })
        }
        onQuoteChange={(next) =>
          handleProjectPreferenceChange({
            quote: clampQuoteSettings(next),
          })
        }
        onSheetOptimizerChange={(next) =>
          handleProjectPreferenceChange({
            sheetOptimizer: clampSheetOptimizerSettings(next),
          })
        }
        onFreezeQuote={handleFreezeQuoteSnapshot}
        onSelectCabinet={(cabinetId) => handleWorkspaceSelectCabinet(cabinetId, false)}
      />
      </div>
    </main>
  );
}

export default App;
