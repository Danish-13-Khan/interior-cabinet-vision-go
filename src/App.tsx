import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import "./App.css";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./components/CabinetScene";
import { DimensionControls } from "./components/DimensionControls";
import { RoomSettings } from "./components/RoomSettings";
import { WallEditor } from "./components/WallEditor";
import { DoorWindowEditor } from "./components/DoorWindowEditor";
import { ProjectBrowser } from "./components/ProjectBrowser";
import { JobWorkflowPanel } from "./components/JobWorkflowPanel";
import { TwoDView, type DraftingTool } from "./components/TwoDView";
import { DraftingPanel } from "./components/DraftingPanel";
import { ReportCenter } from "./components/ReportCenter";
import { LibraryRail } from "./components/LibraryRail";
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
  getFootprintDimensions,
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
  getPanelDisplayName,
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
  type CostingSettings,
} from "./domain/costingSettings";
import {
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
  type QuoteSettings,
} from "./domain/quoteSettings";
import { createQuoteSnapshotFromQuote } from "./domain/projectQuote";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
  type SheetOptimizerSettings,
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
  loadUserTemplatesFromStorage,
  removeUserTemplate,
  saveUserTemplatesToStorage,
  upsertUserTemplate,
  type CabinetTemplate,
} from "./domain/cabinetTemplates";

type SavedProjectBrowserEntry = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
  project: CabinetProject;
  room: RoomConfig;
};

const PROJECT_BROWSER_STORAGE_KEY = "cabinet-designer-project-browser";
const HISTORY_LIMIT = 80;

type EditorSnapshot = {
  project: CabinetProject;
  room: RoomConfig;
  selectedCabinetIds: string[];
  activeCabinetId: string | null;
  selectedPanelName: PanelName | null;
};

type AlignmentMode =
  | "align-left"
  | "align-center-x"
  | "align-right"
  | "align-top"
  | "align-center-z"
  | "align-bottom"
  | "distribute-x"
  | "distribute-z";

type CommandItem = {
  id: string;
  label: string;
  hint: string;
  shortcut: string;
  action: () => void;
};

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultLayer(): CabinetLayer {
  return {
    id: "layer-default",
    name: "Default Layer",
    visible: true,
    locked: false,
  };
}

function createEditorSnapshot(
  project: CabinetProject,
  room: RoomConfig,
  selectedCabinetIds: string[],
  activeCabinetId: string | null,
  selectedPanelName: PanelName | null,
): EditorSnapshot {
  return deepClone({
    project,
    room,
    selectedCabinetIds,
    activeCabinetId,
    selectedPanelName,
  });
}

function sanitizeSelection(project: CabinetProject, selectedIds: string[], activeId: string | null) {
  const validIds = new Set(project.cabinets.map((cabinet) => cabinet.id));
  const nextSelectedIds = selectedIds.filter((id) => validIds.has(id));
  const nextActiveId =
    activeId && validIds.has(activeId)
      ? activeId
      : nextSelectedIds[0] ?? project.cabinets[0]?.id ?? null;

  return {
    selectedCabinetIds: nextActiveId
      ? Array.from(new Set([nextActiveId, ...nextSelectedIds]))
      : [],
    activeCabinetId: nextActiveId,
  };
}

function getCabinetBounds(cabinet: CabinetInstance) {
  const footprint = getFootprintDimensions(
    cabinet.config.dimensions,
    cabinet.placement.rotation,
  );

  return {
    minX: cabinet.placement.x - footprint.width / 2,
    maxX: cabinet.placement.x + footprint.width / 2,
    minZ: cabinet.placement.z - footprint.depth / 2,
    maxZ: cabinet.placement.z + footprint.depth / 2,
    centerX: cabinet.placement.x,
    centerZ: cabinet.placement.z,
    width: footprint.width,
    depth: footprint.depth,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error);
  }

  return "Unknown error";
}

function createCabinetId() {
  return `cabinet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function createItemName(type: CabinetType, index: number) {
  return `${cabinetTypeLabels[type]} ${index}`;
}

function getProjectDisplayName(project: CabinetProject, count: number) {
  const job = clampJobMeta(project.job);
  if (job.projectNumber || job.customerName) {
    return formatJobTitle(job);
  }
  const lead = project.cabinets[0]?.name ?? "Room Layout";
  return project.cabinets.length > 1 ? `${lead} + ${project.cabinets.length - 1} more` : `${lead} ${count}`;
}

function readSavedProjects(): SavedProjectBrowserEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_BROWSER_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SavedProjectBrowserEntry[];
    return parsed.map((entry) => ({
      ...entry,
      project: clampCabinetProject(entry.project),
    }));
  } catch {
    return [];
  }
}

function persistSavedProjects(projects: SavedProjectBrowserEntry[]) {
  window.localStorage.setItem(PROJECT_BROWSER_STORAGE_KEY, JSON.stringify(projects));
}

function App() {
  const sceneRef = useRef<CabinetSceneHandle | null>(null);
  const historyPastRef = useRef<EditorSnapshot[]>([]);
  const historyFutureRef = useRef<EditorSnapshot[]>([]);
  const clipboardRef = useRef<CabinetInstance[]>([]);
  const [project, setProject] = useState<CabinetProject>(defaultCabinetProject);
  const [room, setRoom] = useState<RoomConfig>(DEFAULT_ROOM);
  const [workspaceTab, setWorkspaceTab] = useState<"plan" | "front" | "side" | "3d">("plan");
  const [draftingTool, setDraftingTool] = useState<DraftingTool>("select");
  const [statusDockOpen, setStatusDockOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProjectBrowserEntry[]>(() =>
    readSavedProjects(),
  );
  const [selectedCabinetIds, setSelectedCabinetIds] = useState<string[]>([
    defaultCabinetProject.cabinets[0]?.id ?? "",
  ].filter(Boolean));
  const [activeCabinetId, setActiveCabinetId] = useState<string | null>(
    defaultCabinetProject.cabinets[0]?.id ?? null,
  );
  const [selectedPanelName, setSelectedPanelName] = useState<PanelName | null>(null);
  const [projectStatus, setProjectStatus] = useState("");
  const [projectFilePath, setProjectFilePath] = useState<string | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<CabinetTemplate[]>(() =>
    loadUserTemplatesFromStorage(),
  );

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
  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;
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

  function refreshHistoryState() {
    setHistoryTick((value) => value + 1);
  }

  function applySnapshot(snapshot: EditorSnapshot) {
    const safeProject = clampCabinetProject(snapshot.project);
    const safeSelection = sanitizeSelection(
      safeProject,
      snapshot.selectedCabinetIds,
      snapshot.activeCabinetId,
    );
    setProject(safeProject);
    setRoom(snapshot.room);
    setSelectedCabinetIds(safeSelection.selectedCabinetIds);
    setActiveCabinetId(safeSelection.activeCabinetId);
    setSelectedPanelName(snapshot.selectedPanelName);
  }

  function captureSnapshot(): EditorSnapshot {
    return createEditorSnapshot(
      project,
      room,
      selectedCabinetIds,
      activeCabinetId,
      selectedPanelName,
    );
  }

  function commitSnapshot(snapshot: EditorSnapshot, status?: string) {
    historyPastRef.current = [...historyPastRef.current, captureSnapshot()].slice(-HISTORY_LIMIT);
    historyFutureRef.current = [];
    applySnapshot(snapshot);
    if (status) {
      setProjectStatus(status);
    }
    refreshHistoryState();
  }

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

  void historyTick;

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

  function setProjectAndPersist(nextProjects: SavedProjectBrowserEntry[]) {
    setSavedProjects(nextProjects);
    persistSavedProjects(nextProjects);
  }

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

  function saveCurrentProjectToBrowser(nameOverride?: string) {
    const safeProject = clampCabinetProject(project);
    const thumbnail = captureThumbnail();
    const entry: SavedProjectBrowserEntry = {
      id: `saved-${Date.now()}`,
      name: nameOverride ?? getProjectDisplayName(safeProject, savedProjects.length + 1),
      thumbnail,
      updatedAt: new Date().toISOString(),
      project: safeProject,
      room,
    };

    const nextProjects = [entry, ...savedProjects].slice(0, 16);
    setProjectAndPersist(nextProjects);
    setProjectStatus("Saved current room to the project browser.");
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

    const safeProject = clampCabinetProject(nextState.project);
    const safeSelection = sanitizeSelection(
      safeProject,
      nextState.selectedCabinetIds ?? selectedCabinetIds,
      nextState.activeCabinetId ?? activeCabinetId,
    );

    commitSnapshot(
      {
        project: safeProject,
        room: nextState.room ?? room,
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

  function handleUndo() {
    const previous = historyPastRef.current.at(-1);
    if (!previous) return;

    historyPastRef.current = historyPastRef.current.slice(0, -1);
    historyFutureRef.current = [captureSnapshot(), ...historyFutureRef.current].slice(0, HISTORY_LIMIT);
    applySnapshot(previous);
    setProjectStatus("Undid the last change.");
    refreshHistoryState();
  }

  function handleRedo() {
    const next = historyFutureRef.current[0];
    if (!next) return;

    historyFutureRef.current = historyFutureRef.current.slice(1);
    historyPastRef.current = [...historyPastRef.current, captureSnapshot()].slice(-HISTORY_LIMIT);
    applySnapshot(next);
    setProjectStatus("Redid the last change.");
    refreshHistoryState();
  }

  function handleCopySelection() {
    if (selectedCabinets.length === 0) return;
    clipboardRef.current = deepClone(selectedCabinets);
    setProjectStatus(`Copied ${selectedCabinets.length} item${selectedCabinets.length === 1 ? "" : "s"}.`);
  }

  function createOffsetDuplicate(
    cabinet: CabinetInstance,
    offsetIndex: number,
    currentProject: CabinetProject,
  ) {
    const basePlacement =
      cabinet.placement.attachment === "floor"
        ? {
            ...cabinet.placement,
            x: cabinet.placement.x + 400 + offsetIndex * 120,
            z: cabinet.placement.z + 200 + offsetIndex * 80,
          }
        : {
            ...cabinet.placement,
            y: cabinet.placement.y + 120 + offsetIndex * 60,
          };

    let placement = clampCabinetPlacement(basePlacement, cabinet.config.dimensions, roomBounds);
    const duplicate: CabinetInstance = {
      ...deepClone(cabinet),
      id: createCabinetId(),
      name: `${cabinet.name} Copy`,
      placement,
    };

    for (let shift = 0; shift < 6; shift += 1) {
      const shiftedPlacement = clampCabinetPlacement(
        cabinet.placement.attachment === "floor"
          ? {
              ...basePlacement,
              x: basePlacement.x + shift * 300,
              z: basePlacement.z + shift * 150,
            }
          : {
              ...basePlacement,
              y: basePlacement.y + shift * 90,
            },
        cabinet.config.dimensions,
        roomBounds,
      );
      const shiftedDuplicate = {
        ...duplicate,
        placement: shiftedPlacement,
      };
      if (
        !currentProject.cabinets.some((existing) => cabinetsOverlap(existing, shiftedDuplicate)) &&
        !cabinetBlocksOpening(shiftedDuplicate, room)
      ) {
        placement = shiftedPlacement;
        break;
      }
    }

    return {
      ...duplicate,
      placement,
    };
  }

  function handlePasteSelection() {
    if (clipboardRef.current.length === 0) return;

    commitProjectChange(
      (currentProject) => {
        const duplicates = clipboardRef.current.map((cabinet, index) =>
          createOffsetDuplicate(cabinet, index, currentProject),
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
    commitSnapshot(
      {
        project: presetProject,
        room,
        selectedCabinetIds: presetProject.cabinets[0]?.id ? [presetProject.cabinets[0].id] : [],
        activeCabinetId: presetProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      },
      `Loaded ${preset.label} room preset.`,
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
    const config = createConfigFromLibraryItem(itemId, projectStandards);
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
    const next = upsertUserTemplate(userTemplates, template);
    setUserTemplates(next);
    saveUserTemplatesToStorage(next);
    setProjectStatus(`Saved template “${template.name}”.`);
  }

  function handleDeleteTemplate(templateId: string) {
    const next = removeUserTemplate(userTemplates, templateId);
    setUserTemplates(next);
    saveUserTemplatesToStorage(next);
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
          createOffsetDuplicate(cabinet, index, currentProject),
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

    const bounds = editable.map((cabinet) => ({
      cabinet,
      bounds: getCabinetBounds(cabinet),
    }));

    const sortedByX = [...bounds].sort((first, second) => first.bounds.centerX - second.bounds.centerX);
    const sortedByZ = [...bounds].sort((first, second) => first.bounds.centerZ - second.bounds.centerZ);
    const left = Math.min(...bounds.map((item) => item.bounds.minX));
    const right = Math.max(...bounds.map((item) => item.bounds.maxX));
    const top = Math.min(...bounds.map((item) => item.bounds.minZ));
    const bottom = Math.max(...bounds.map((item) => item.bounds.maxZ));
    const centerX = bounds.reduce((sum, item) => sum + item.bounds.centerX, 0) / bounds.length;
    const centerZ = bounds.reduce((sum, item) => sum + item.bounds.centerZ, 0) / bounds.length;

    commitProjectChange(
      (currentProject) => ({
        project: {
          ...currentProject,
          cabinets: currentProject.cabinets.map((cabinet) => {
            if (!selectedCabinetIds.includes(cabinet.id) || isCabinetLocked(cabinet)) {
              return cabinet;
            }

            const item = bounds.find((entry) => entry.cabinet.id === cabinet.id);
            if (!item) {
              return cabinet;
            }

            let nextX = cabinet.placement.x;
            let nextZ = cabinet.placement.z;

            switch (mode) {
              case "align-left":
                nextX = left + item.bounds.width / 2;
                break;
              case "align-center-x":
                nextX = centerX;
                break;
              case "align-right":
                nextX = right - item.bounds.width / 2;
                break;
              case "align-top":
                nextZ = top + item.bounds.depth / 2;
                break;
              case "align-center-z":
                nextZ = centerZ;
                break;
              case "align-bottom":
                nextZ = bottom - item.bounds.depth / 2;
                break;
              case "distribute-x": {
                const index = sortedByX.findIndex((entry) => entry.cabinet.id === cabinet.id);
                const span = right - left;
                const step = sortedByX.length > 1 ? span / (sortedByX.length - 1) : 0;
                nextX = left + step * index;
                break;
              }
              case "distribute-z": {
                const index = sortedByZ.findIndex((entry) => entry.cabinet.id === cabinet.id);
                const span = bottom - top;
                const step = sortedByZ.length > 1 ? span / (sortedByZ.length - 1) : 0;
                nextZ = top + step * index;
                break;
              }
            }

            return {
              ...cabinet,
              placement: clampPlacementInRoom(
                {
                  ...cabinet.placement,
                  x: snapMillimetresToGrid(nextX, projectPreferences.snapSizeMm),
                  z: snapMillimetresToGrid(nextZ, projectPreferences.snapSizeMm),
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandBarOpen((value) => !value);
        setIsShortcutSheetOpen(false);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (isTypingTarget) return;
        event.preventDefault();
        void handleSaveProject();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        if (isTypingTarget) return;
        event.preventDefault();
        handleReset();
        return;
      }

      if (!isTypingTarget && event.key === "?") {
        event.preventDefault();
        setIsShortcutSheetOpen((value) => !value);
        setIsCommandBarOpen(false);
        return;
      }

      if (event.key === "Escape") {
        closeCommandSurfaces();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        if (isTypingTarget) return;
        event.preventDefault();
        handleCopySelection();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
        if (isTypingTarget) return;
        event.preventDefault();
        handlePasteSelection();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        if (isTypingTarget) return;
        event.preventDefault();
        handleDuplicateCabinet();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        if (isTypingTarget) return;
        event.preventDefault();
        handleSelectAll();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !isTypingTarget) {
        event.preventDefault();
        handleRemoveCabinet();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, room, selectedCabinets, selectedCabinetIds, projectPreferences.snapSizeMm, activeCabinetId]);

  const commandItems = useMemo<CommandItem[]>(
    () => [
      { id: "new", label: "New Project", hint: "Reset the current project", shortcut: "Cmd/Ctrl+N", action: handleReset },
      { id: "save", label: "Save Project", hint: "Save project JSON to disk", shortcut: "Cmd/Ctrl+S", action: () => { void handleSaveProject(); } },
      { id: "undo", label: "Undo", hint: "Reverse the last change", shortcut: "Cmd/Ctrl+Z", action: handleUndo },
      { id: "redo", label: "Redo", hint: "Reapply the last undone change", shortcut: "Cmd/Ctrl+Shift+Z", action: handleRedo },
      { id: "copy", label: "Copy Selection", hint: "Copy selected items", shortcut: "Cmd/Ctrl+C", action: handleCopySelection },
      { id: "paste", label: "Paste Selection", hint: "Paste copied items", shortcut: "Cmd/Ctrl+V", action: handlePasteSelection },
      { id: "group", label: "Group Selection", hint: "Create a group from selected items", shortcut: "Toolbar", action: handleCreateGroup },
      { id: "ungroup", label: "Ungroup Selection", hint: "Remove selected items from their group", shortcut: "Toolbar", action: handleClearGroup },
      { id: "align-left", label: "Align Left", hint: "Align selected items to the left edge", shortcut: "Toolbar", action: () => handleAlignSelection("align-left") },
      { id: "distribute-x", label: "Distribute X", hint: "Evenly space selected items horizontally", shortcut: "Toolbar", action: () => handleAlignSelection("distribute-x") },
      { id: "toggle-grid", label: "Toggle Grid", hint: "Show or hide the viewport grid", shortcut: "Toolbar", action: () => handleProjectPreferenceChange({ showGrid: !projectPreferences.showGrid }) },
      { id: "shortcuts", label: "Show Shortcuts", hint: "Open keyboard shortcut cheat sheet", shortcut: "?", action: () => setIsShortcutSheetOpen(true) },
    ],
    [projectPreferences.showGrid, selectedCabinetIds.length],
  );

  const filteredCommandItems = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) {
      return commandItems;
    }

    return commandItems.filter((item) =>
      `${item.label} ${item.hint} ${item.shortcut}`.toLowerCase().includes(query),
    );
  }, [commandItems, commandQuery]);

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
            version: 2,
            savedAt: new Date().toISOString(),
            project,
            room,
          },
          null,
          2,
        ),
      );

      setProjectFilePath(targetPath);
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
        const safeProject = clampCabinetProject(parsed.project);
        applySnapshot({
          project: safeProject,
          room: parsed.room ?? room,
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
      setProjectStatus("Project loaded from JSON file.");
    } catch (error) {
      setProjectStatus(`Load failed: ${getErrorMessage(error)}`);
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

  function handleLoadSavedProject(projectId: string) {
    const entry = savedProjects.find((item) => item.id === projectId);

    if (!entry) {
      return;
    }

    const safeProject = clampCabinetProject(entry.project);
    applySnapshot({
      project: safeProject,
      room: entry.room,
      selectedCabinetIds: safeProject.cabinets[0]?.id ? [safeProject.cabinets[0].id] : [],
      activeCabinetId: safeProject.cabinets[0]?.id ?? null,
      selectedPanelName: null,
    });
    setProjectStatus(`Loaded "${entry.name}" from the project browser.`);
  }

  function handleDeleteSavedProject(projectId: string) {
    const nextProjects = savedProjects.filter((item) => item.id !== projectId);
    setProjectAndPersist(nextProjects);
    setProjectStatus("Removed project from the browser.");
  }

  function handleRenameSavedProject(projectId: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const nextProjects = savedProjects.map((item) =>
      item.id === projectId ? { ...item, name: trimmed } : item,
    );
    setProjectAndPersist(nextProjects);
    setProjectStatus(`Renamed project to "${trimmed}".`);
  }

  function handleDuplicateSavedProject(projectId: string) {
    const entry = savedProjects.find((item) => item.id === projectId);
    if (!entry) return;

    const duplicate: SavedProjectBrowserEntry = {
      ...entry,
      id: `saved-${Date.now()}`,
      name: `${entry.name} Copy`,
      updatedAt: new Date().toISOString(),
    };

    const nextProjects = [duplicate, ...savedProjects].slice(0, 16);
    setProjectAndPersist(nextProjects);
    setProjectStatus(`Duplicated "${entry.name}".`);
  }

  const sortedSavedProjects = useMemo(
    () =>
      [...savedProjects]
        .sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .map((entry) => ({
          ...entry,
          job: entry.project.job,
          cabinetCount: entry.project.cabinets.length,
        })),
    [savedProjects],
  );


  const workspaceLabel =
    workspaceTab === "plan"
      ? "Plan"
      : workspaceTab === "front"
        ? "Front Elevation"
        : workspaceTab === "side"
          ? "Side Elevation"
          : "3D View";

  const twoDViewKind =
    workspaceTab === "front" ? "front" : workspaceTab === "side" ? "side" : "top";

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

  return (
    <main className="app-shell">
      <header className="app-ribbon" aria-label="Command ribbon">
        <div className="ribbon-brand">
          <strong>Cabinet Planner</strong>
          <span>{workspaceLabel}</span>
        </div>

        <div className="ribbon-group">
          <span className="ribbon-group-label">File</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={handleReset} title="New project">New</button>
            <button type="button" className="tb-btn" onClick={handleLoadProject} title="Open JSON file">Open</button>
            <button type="button" className="tb-btn" onClick={handleSaveProject} title="Save JSON file">Save</button>
          </div>
        </div>

        <div className="ribbon-group">
          <span className="ribbon-group-label">Edit</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={handleUndo} disabled={!canUndo} title="Undo">Undo</button>
            <button type="button" className="tb-btn" onClick={handleRedo} disabled={!canRedo} title="Redo">Redo</button>
            <button type="button" className="tb-btn" onClick={handleCopySelection} disabled={selectedCabinetIds.length === 0} title="Copy">Copy</button>
            <button type="button" className="tb-btn" onClick={handlePasteSelection} disabled={clipboardRef.current.length === 0} title="Paste">Paste</button>
            <button type="button" className="tb-btn" onClick={handleDuplicateCabinet} disabled={selectedCabinetIds.length === 0} title="Duplicate">Duplicate</button>
          </div>
        </div>

        <div className="ribbon-group">
          <span className="ribbon-group-label">Arrange</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={handleAutoAlignRuns} title="Auto align cabinet runs">Align Runs</button>
            <button type="button" className="tb-btn" onClick={() => handleAlignSelection("align-left")} disabled={selectedCabinetIds.length < 2}>Left</button>
            <button type="button" className="tb-btn" onClick={() => handleAlignSelection("align-center-x")} disabled={selectedCabinetIds.length < 2}>Center X</button>
            <button type="button" className="tb-btn" onClick={() => handleAlignSelection("align-top")} disabled={selectedCabinetIds.length < 2}>Top</button>
            <button type="button" className="tb-btn" onClick={() => handleAlignSelection("distribute-x")} disabled={selectedCabinetIds.length < 3}>Distribute X</button>
          </div>
        </div>

        <div className="ribbon-group">
          <span className="ribbon-group-label">Export</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={handleExportProjectJson} title="Export JSON">JSON</button>
            <button type="button" className="tb-btn" onClick={handleExportCutlistCsv} title="Export CSV">CSV</button>
            <button type="button" className="tb-btn tb-accent" onClick={handleExportPdf} title="Download PDF">PDF</button>
          </div>
        </div>

        {workspaceTab === "3d" ? (
          <div className="ribbon-group">
            <span className="ribbon-group-label">3D Camera</span>
            <div className="ribbon-group-actions">
              <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("iso")} title="ISO view">ISO</button>
              <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("front")} title="Front camera">Front</button>
              <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("side")} title="Side camera">Side</button>
              <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("top")} title="Top camera">Top</button>
            </div>
          </div>
        ) : null}

        <div className="ribbon-group ribbon-group-end">
          <span className="ribbon-group-label">Tools</span>
          <div className="ribbon-group-actions">
            <button type="button" className="tb-btn" onClick={() => { setIsCommandBarOpen(true); setIsShortcutSheetOpen(false); }} title="Command palette">Commands</button>
            <button type="button" className="tb-btn" onClick={() => { setIsShortcutSheetOpen(true); setIsCommandBarOpen(false); }} title="Shortcut help">Shortcuts</button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="tool-rail" aria-label="Tool rail">
          <LibraryRail
            templates={userTemplates}
            onAddFamily={handleAddCabinet}
            onAddLibraryItem={handleAddLibraryItem}
            onAddTemplate={handleAddTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onApplyStarter={handleApplyStarter}
          />

          <div className="rail-section scene-tree-panel">
            <div className="rail-section-title">
              <span>Scene Objects</span>
              <span className="rail-count">{project.cabinets.length}</span>
            </div>
            <div className="scene-tree-list">
              {project.cabinets.map((cabinet) => {
                const isActive = activeCabinetId === cabinet.id;
                const isSelected = selectedCabinetIds.includes(cabinet.id);
                return (
                  <button
                    key={cabinet.id}
                    type="button"
                    className={`scene-tree-item ${isSelected ? "is-selected" : ""} ${isActive ? "is-active" : ""}`}
                    onClick={(event) =>
                      handleWorkspaceSelectCabinet(
                        cabinet.id,
                        event.metaKey || event.ctrlKey || event.shiftKey,
                      )
                    }
                    title={`${cabinet.name} · ${cabinetTypeLabels[cabinet.config.type]}`}
                  >
                    <span className="scene-tree-icon">
                      {cabinetTypeLabels[cabinet.config.type].charAt(0)}
                    </span>
                    <span className="scene-tree-copy">
                      <strong>{cabinet.name}</strong>
                      <small>{cabinetTypeLabels[cabinet.config.type]}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rail-section">
            <div className="rail-section-title">Room Presets</div>
            <div className="preset-rail-list">
              {roomPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="palette-preset-btn"
                  title={preset.description}
                  onClick={() => handleLoadRoomPreset(preset.id)}
                >
                  <span className="palette-preset-icon">
                    {preset.id === "small-bedroom" ? "🛏" : preset.id === "living-room" ? "🛋" : "💼"}
                  </span>
                  <span className="palette-cat-label">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rail-section">
            <ProjectBrowser
              projects={sortedSavedProjects}
              onDeleteProject={handleDeleteSavedProject}
              onDuplicateProject={handleDuplicateSavedProject}
              onLoadProject={handleLoadSavedProject}
              onRenameProject={handleRenameSavedProject}
              onSaveCurrent={saveCurrentProjectToBrowser}
            />
          </div>
        </aside>

        <section className="workspace-panel" aria-label="Drawing workspace">
          <div className="workspace-tabs" role="tablist" aria-label="Workspace views">
            {(
              [
                { id: "plan", label: "Plan" },
                { id: "front", label: "Front Elevation" },
                { id: "side", label: "Side Elevation" },
                { id: "3d", label: "3D" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={workspaceTab === tab.id}
                className={`workspace-tab ${workspaceTab === tab.id ? "is-active" : ""}`}
                onClick={() => {
                  setWorkspaceTab(tab.id);
                  setDraftingTool("select");
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="workspace-canvas">
            {workspaceTab === "3d" ? (
              <div className="viewport-panel" aria-label="3D room viewport">
                <CabinetScene
                  ref={sceneRef}
                  project={getVisibleProject()}
                  room={room}
                  countertops={planningWorkflow.countertops}
                  fillers={planningWorkflow.fillers}
                  snapSizeMm={projectPreferences.snapSizeMm}
                  showGrid={projectPreferences.showGrid}
                  onCabinetMove={handleCabinetMove}
                  onCabinetRotate={handleCabinetRotate}
                  selectedCabinetIds={selectedCabinetIds}
                  activeCabinetId={activeCabinetId}
                  selectedPanelName={selectedPanelName}
                  onCabinetResize={handleCabinetResize}
                  onSelectedCabinetChange={(cabinetId, additive) => {
                    if (!cabinetId) {
                      replaceSelection([], null, null);
                      return;
                    }

                    if (additive) {
                      toggleCabinetSelection(cabinetId);
                      return;
                    }

                    replaceSelection([cabinetId], cabinetId, null);
                  }}
                  onSelectedPanelChange={(cabinetId, name, additive) => {
                    if (!cabinetId) {
                      replaceSelection([], null, null);
                      return;
                    }

                    if (additive) {
                      const nextIds = selectedCabinetIds.includes(cabinetId)
                        ? selectedCabinetIds
                        : [...selectedCabinetIds, cabinetId];
                      replaceSelection(nextIds, cabinetId, name);
                      return;
                    }

                    replaceSelection([cabinetId], cabinetId, name);
                  }}
                  onMarqueeSelect={(cabinetIds, additive) => {
                    if (additive) {
                      replaceSelection(
                        Array.from(new Set([...selectedCabinetIds, ...cabinetIds])),
                        cabinetIds[0] ?? activeCabinetId,
                        null,
                      );
                      return;
                    }

                    replaceSelection(cabinetIds, cabinetIds[0] ?? null, null);
                  }}
                />
              </div>
            ) : (
              <div className="drawing-sheet" aria-label={`${workspaceLabel} drawing`}>
                <div className="drawing-sheet-meta">
                  <span>{workspaceLabel}</span>
                  <span>
                    {draftingTool !== "select"
                      ? draftingTool === "note"
                        ? "Note tool · click to place text note"
                        : "Leader tool · click target, then label"
                      : selectedCabinetIds.length > 0
                        ? `${selectedCabinetIds.length} selected · drag to move · snap ${projectPreferences.snapSizeMm} mm · selected dims on`
                        : "Click to select · drag cabinets · snap guides · dimension chains"}
                  </span>
                  <span className="drawing-drafting-tools">
                    {(
                      [
                        ["select", "Select"],
                        ["note", "Note"],
                        ["leader", "Leader"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={`tb-btn ${draftingTool === id ? "tb-accent" : ""}`}
                        onClick={() => setDraftingTool(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                </div>
                <div className="drawing-sheet-scroll">
                  <TwoDView
                    project={getVisibleProject()}
                    room={room}
                    view={twoDViewKind}
                    countertops={planningWorkflow.countertops}
                    runs={planningWorkflow.runs}
                    selectedCabinetIds={selectedCabinetIds}
                    activeCabinetId={activeCabinetId}
                    snapSizeMm={projectPreferences.snapSizeMm}
                    showGrid={projectPreferences.showGrid}
                    draftingDisplay={draftingDisplay}
                    draftingTool={draftingTool}
                    onSelectCabinet={handleWorkspaceSelectCabinet}
                    onCabinetMove={handleCabinetMove}
                    onAddNote={handleAddDraftingNote}
                    onAddLeader={handleAddDraftingLeader}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="inspector-panel" aria-label="Properties inspector">
          <div className="inspector-header">
            <strong>Properties</strong>
            <span>
              {selectedCabinet
                ? selectedCabinet.name
                : selectedCabinetIds.length > 1
                  ? `${selectedCabinetIds.length} items`
                  : "No selection"}
            </span>
          </div>
          <div className="inspector-scroll">
            <JobWorkflowPanel
              job={project.job ?? defaultCabinetProject.job!}
              onChange={handleJobMetaChange}
            />
            <DraftingPanel
              drafting={projectDrafting}
              display={draftingDisplay}
              onDisplayChange={(patch) =>
                handleProjectPreferenceChange({
                  drafting: clampDraftingDisplay({ ...draftingDisplay, ...patch }),
                })
              }
              onDeleteNote={(id) =>
                handleDraftingChange({
                  ...projectDrafting,
                  notes: projectDrafting.notes.filter((note) => note.id !== id),
                })
              }
              onDeleteLeader={(id) =>
                handleDraftingChange({
                  ...projectDrafting,
                  leaders: projectDrafting.leaders.filter((leader) => leader.id !== id),
                })
              }
            />
            <RoomSettings
              dimensions={room.dimensions}
              onChange={(dims) => setRoom({ ...room, dimensions: dims })}
            />
            <WallEditor
              showBackWall={room.dimensions.showBackWall}
              showLeftWall={room.dimensions.showLeftWall}
              showRightWall={room.dimensions.showRightWall}
              onChange={(walls) => setRoom({ ...room, dimensions: { ...room.dimensions, ...walls } })}
            />
            <DoorWindowEditor
              doors={room.doors}
              windows={room.windows}
              onChangeDoors={(doors) => setRoom({ ...room, doors })}
              onChangeWindows={(windows) => setRoom({ ...room, windows })}
            />
            <DimensionControls
              cabinetCount={project.cabinets.length}
              cabinetCutlistItems={cabinetCutlistItems}
              cabinets={project.cabinets}
              config={selectedConfig}
              constructionParts={selectedConstruction?.parts ?? []}
              derivedMetrics={derivedMetrics}
              cutlistItems={cutlistItems}
              projectFilePath={projectFilePath}
              projectStatus={projectStatus}
              savedProjects={sortedSavedProjects}
              snapSizeMm={projectPreferences.snapSizeMm}
              selectedCabinetIds={selectedCabinetIds}
              activeCabinetId={activeCabinetId}
              selectedPanelName={selectedPanelName}
              selectedPlacement={selectedPlacement}
              selectedLayerId={selectedLayerId}
              selectedGroupId={selectedGroupId}
              layers={layers}
              groups={groups}
              preferences={projectPreferences}
              selectionLabel={selectedPanelName ? getPanelDisplayName(selectedPanelName) : "None"}
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
            />
          </div>
        </aside>
      </div>

      {isCommandBarOpen ? (
        <div className="command-bar-backdrop" onClick={closeCommandSurfaces}>
          <div className="command-bar" onClick={(event) => event.stopPropagation()}>
            <div className="command-bar-header">
              <strong>Command Palette</strong>
              <span>Cmd/Ctrl+K</span>
            </div>
            <input
              className="command-bar-input"
              autoFocus
              placeholder="Search commands, tools, and editor actions"
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.currentTarget.value)}
            />
            <div className="command-bar-list">
              {filteredCommandItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="command-bar-item"
                  onClick={() => {
                    item.action();
                    setIsCommandBarOpen(false);
                    setCommandQuery("");
                  }}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <kbd>{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {isShortcutSheetOpen ? (
        <div className="command-bar-backdrop" onClick={closeCommandSurfaces}>
          <div className="shortcut-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="command-bar-header">
              <strong>Shortcut Cheat Sheet</strong>
              <span>Press ? to toggle</span>
            </div>
            <div className="shortcut-grid">
              {[
                ["Cmd/Ctrl+K", "Open command palette"],
                ["?", "Open shortcut help"],
                ["Cmd/Ctrl+Z", "Undo"],
                ["Cmd/Ctrl+Shift+Z", "Redo"],
                ["Cmd/Ctrl+C", "Copy selection"],
                ["Cmd/Ctrl+V", "Paste selection"],
                ["Cmd/Ctrl+D", "Duplicate selection"],
                ["Cmd/Ctrl+A", "Select all items"],
                ["Shift + Drag", "Marquee select in viewport"],
                ["Delete", "Remove selected items"],
              ].map(([shortcut, description]) => (
                <div key={shortcut} className="shortcut-row">
                  <kbd>{shortcut}</kbd>
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <footer className="status-strip">
        <div className="output-bar">
          <span className="output-status">{projectStatus || "Ready"}</span>
          <span className="output-stats">
            {workspaceLabel} · {formatJobTitle(clampJobMeta(project.job))} ·{" "}
            {JOB_STATUS_LABELS[clampJobMeta(project.job).status]} · {project.cabinets.length} items ·{" "}
            {selectedCabinet
              ? `${selectedCabinet.config.dimensions.width} × ${selectedCabinet.config.dimensions.height} × ${selectedCabinet.config.dimensions.depth} mm`
              : selectedCabinetIds.length > 1
                ? `${selectedCabinetIds.length} selected`
                : "No selection"}
          </span>
          <span className="output-bar-actions">
            <button
              type="button"
              className={`tb-btn ${statusDockOpen ? "tb-accent" : ""}`}
              onClick={() => setStatusDockOpen((open) => !open)}
            >
              {statusDockOpen ? "Hide Reports" : "Reports"}
            </button>
            <button type="button" className="tb-btn" onClick={handleSaveProject}>Save</button>
            <button type="button" className="tb-btn" onClick={handleExportProjectJson}>JSON</button>
            <button type="button" className="tb-btn" onClick={handleExportCutlistCsv}>CSV</button>
            <button type="button" className="tb-btn tb-accent" onClick={handleExportPdf}>PDF</button>
          </span>
        </div>
        {validationMessages.length > 0 ? (
          <div className="output-warnings">
            {validationMessages.map((m) => (
              <span
                key={m}
                className={`output-warn ${m.startsWith("Error:") ? "output-warn-error" : ""}`}
              >
                {m}
              </span>
            ))}
          </div>
        ) : null}
        {statusDockOpen ? (
          <div className="status-dock">
            <ReportCenter
              report={projectReport}
              selectedCabinetId={activeCabinetId}
              costingSettings={costingSettings}
              quoteSettings={quoteSettings}
              sheetOptimizerSettings={sheetOptimizerSettings}
              onCostingChange={(next: CostingSettings) =>
                handleProjectPreferenceChange({
                  costing: clampCostingSettings(next),
                })
              }
              onQuoteChange={(next: QuoteSettings) =>
                handleProjectPreferenceChange({
                  quote: clampQuoteSettings(next),
                })
              }
              onSheetOptimizerChange={(next: SheetOptimizerSettings) =>
                handleProjectPreferenceChange({
                  sheetOptimizer: clampSheetOptimizerSettings(next),
                })
              }
              onFreezeQuote={handleFreezeQuoteSnapshot}
              onSelectCabinet={(cabinetId) => handleWorkspaceSelectCabinet(cabinetId, false)}
            />
          </div>
        ) : null}
      </footer>
    </main>
  );
}

export default App;
