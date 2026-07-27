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
import { CutlistPanel } from "./components/CutlistPanel";
import { ProjectBrowser } from "./components/ProjectBrowser";
import { TwoDView } from "./components/TwoDView";
import {
  CABINET_GRID_SNAP_MM,
  cabinetTypeLabels,
  clampCabinetConfig,
  clampCabinetPlacement,
  clampCabinetProject,
  defaultCabinetProject,
  getCabinetValidationMessages,
  getDefaultCabinetConfig,
  getWallPlacement,
  normalizeRotationAngle,
  projectHasCollision,
  cabinetsOverlap,
  supportsWallPlacement,
  type CabinetConfig,
  type CabinetDimensions,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type CabinetType,
} from "./domain/cabinetDimensions";
import {
  createCabinetCutlist,
  createCabinetDerivedMetrics,
  createProjectCutlist,
  getPanelDisplayName,
  type CabinetCutlistItem,
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
  cabinetLibrary,
  createCabinetPlanningWorkflow,
  createRunAlignedPlacements,
} from "./domain/cabinetLibrary";

type SavedProjectBrowserEntry = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
  project: CabinetProject;
  room: RoomConfig;
};

const PROJECT_BROWSER_STORAGE_KEY = "cabinet-designer-project-browser";

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

function createCutlistCsv(items: CabinetCutlistItem[]): string {
  const rows = [
    ["Part", "Material", "Quantity", "LengthMm", "WidthMm", "ThicknessMm"],
    ...items.map((item) => [
      item.label,
      item.material,
      String(item.quantity),
      String(item.lengthMm),
      String(item.widthMm),
      String(item.thicknessMm),
    ]),
  ];

  return rows
    .map((row) => row.map((value) => `"${value.split('"').join('""')}"`).join(","))
    .join("\n");
}

function getProjectDisplayName(project: CabinetProject, count: number) {
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
  const [project, setProject] = useState<CabinetProject>(defaultCabinetProject);
  const [room, setRoom] = useState<RoomConfig>(DEFAULT_ROOM);
  const [planView, setPlanView] = useState<"top" | "front" | "side">("top");
  const [savedProjects, setSavedProjects] = useState<SavedProjectBrowserEntry[]>(() =>
    readSavedProjects(),
  );
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    defaultCabinetProject.cabinets[0]?.id ?? null,
  );
  const [selectedPanelName, setSelectedPanelName] = useState<PanelName | null>(null);
  const [projectStatus, setProjectStatus] = useState("");
  const [projectFilePath, setProjectFilePath] = useState<string | null>(null);

  const selectedCabinet =
    project.cabinets.find((cabinet) => cabinet.id === selectedCabinetId) ?? null;
  const selectedConfig = selectedCabinet?.config ?? defaultCabinetProject.cabinets[0].config;
  const selectedPlacement =
    selectedCabinet?.placement ?? defaultCabinetProject.cabinets[0].placement;
  const validationMessages = useMemo(
    () => getCabinetValidationMessages(selectedConfig),
    [selectedConfig],
  );
  const cutlistItems = useMemo(() => createProjectCutlist(project), [project]);
  const cabinetCutlistItems = useMemo(
    () => (selectedCabinet ? createCabinetCutlist(selectedCabinet.config) : []),
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

  function updateCabinet(cabinetId: string, updater: (cabinet: CabinetInstance) => CabinetInstance) {
    setProject((currentProject) =>
      clampCabinetProject({
        ...currentProject,
        cabinets: currentProject.cabinets.map((cabinet) =>
          cabinet.id === cabinetId ? updater(cabinet) : cabinet,
        ),
      }),
    );
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

  function handleAutoAlignRuns() {
    setProject((currentProject) => {
      const alignedPlacements = new Map<string, CabinetPlacement>();

      for (const run of createCabinetPlanningWorkflow(currentProject, roomBounds).runs) {
        const placements = createRunAlignedPlacements(run, currentProject, roomBounds);
        for (const [cabinetId, placement] of Object.entries(placements)) {
          alignedPlacements.set(cabinetId, placement);
        }
      }

      if (alignedPlacements.size === 0) {
        return currentProject;
      }

      return {
        ...currentProject,
        cabinets: currentProject.cabinets.map((cabinet) => ({
          ...cabinet,
          placement: alignedPlacements.get(cabinet.id) ?? cabinet.placement,
        })),
      };
    });

    setProjectStatus("Aligned cabinets into planning runs.");
  }

  function handleLoadRoomPreset(presetId: RoomPresetId) {
    const preset = roomPresets.find((p) => p.id === presetId);
    if (!preset) return;

    const presetProject = createRoomPresetProject(preset);
    setProject(presetProject);
    setSelectedCabinetId(presetProject.cabinets[0]?.id ?? null);
    setSelectedPanelName(null);
    setProjectStatus(`Loaded ${preset.label} room preset.`);
  }

  function handleConfigChange(updatedConfig: Partial<CabinetConfig>) {
    if (!selectedCabinetId || !selectedCabinet) {
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
      projectHasCollision(project, selectedCabinetId, nextPlacement, nextConfig.dimensions) ||
      cabinetWouldBlockOpening(selectedCabinetId, nextPlacement, nextConfig.dimensions)
    ) {
      setProjectStatus("Change blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(selectedCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
      config: nextConfig,
    }));
  }

  function handlePlacementChange(axis: "x" | "y" | "z", value: number) {
    if (!selectedCabinetId || !selectedCabinet || !Number.isFinite(value)) {
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
      projectHasCollision(project, selectedCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(selectedCabinetId, nextPlacement)
    ) {
      setProjectStatus("Placement blocked: room items cannot overlap or block openings.");
      return;
    }

    updateCabinet(selectedCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }));
  }

  function handleRotationChange(rotation: number) {
    if (!selectedCabinetId || !selectedCabinet) {
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
      projectHasCollision(project, selectedCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(selectedCabinetId, nextPlacement)
    ) {
      setProjectStatus("Rotation blocked: item would collide or block an opening.");
      return;
    }

    updateCabinet(selectedCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }));
  }

  function handleAttachmentChange(attachment: CabinetPlacement["attachment"]) {
    if (!selectedCabinetId || !selectedCabinet) {
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
      projectHasCollision(project, selectedCabinetId, nextPlacement) ||
      cabinetWouldBlockOpening(selectedCabinetId, nextPlacement)
    ) {
      setProjectStatus("Wall placement blocked: item would overlap or block an opening.");
      return;
    }

    updateCabinet(selectedCabinetId, (cabinet) => ({
      ...cabinet,
      placement: nextPlacement,
    }));
  }

  function handleCabinetResize(cabinetId: string, dimensions: CabinetDimensions) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
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
    }));
  }

  function handleCabinetMove(cabinetId: string, placement: CabinetPlacement) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
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
    }));

    return true;
  }

  function handleCabinetRotate(cabinetId: string, rotation: number) {
    const cabinet = project.cabinets.find((item) => item.id === cabinetId);

    if (!cabinet) {
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
    }));

    return true;
  }

  function cabinetsOverlapAny(p: CabinetProject, candidate: CabinetInstance): boolean {
    return p.cabinets.some((c) => cabinetsOverlap(c, candidate));
  }

  function handleAddCabinet(type: CabinetType = "base") {
    const config = getDefaultCabinetConfig(type);

    // Try up to 5 placement offsets to avoid collision
    const tmpCab: CabinetInstance = {
      id: createCabinetId(),
      name: createItemName(type, project.cabinets.length + 1),
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config,
    };
    let placement: CabinetPlacement | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
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
      if (!cabinetsOverlapAny(project, testCab) && !cabinetBlocksOpening(testCab, room)) {
        placement = candidate;
        break;
      }
    }
    if (!placement) {
      placement = clampCabinetPlacement(
        { x: project.cabinets.length * 700 - 1000, y: 0, z: 0, rotation: 0, attachment: "floor" },
        config.dimensions,
        roomBounds,
      );
    }

    const newCabinet: CabinetInstance = {
      id: tmpCab.id,
      name: tmpCab.name,
      placement,
      config,
    };

    setProject((currentProject) =>
      clampCabinetProject({
        ...currentProject,
        cabinets: [...currentProject.cabinets, newCabinet],
      }),
    );
    setSelectedCabinetId(newCabinet.id);
    setSelectedPanelName(null);
    setProjectStatus(`Added ${cabinetTypeLabels[type].toLowerCase()} to the room scene.`);
  }

  function handleDuplicateCabinet() {
    if (!selectedCabinet) {
      return;
    }

    const offsetPlacement =
      selectedCabinet.placement.attachment === "floor"
        ? {
            ...selectedCabinet.placement,
            x: selectedCabinet.placement.x + 700,
          }
        : {
            ...selectedCabinet.placement,
            y: selectedCabinet.placement.y + 150,
          };

    const duplicate: CabinetInstance = {
      ...selectedCabinet,
      id: createCabinetId(),
      name: `${selectedCabinet.name} Copy`,
      placement: clampCabinetPlacement(offsetPlacement, selectedCabinet.config.dimensions, roomBounds),
    };

    // Try shifting if the duplicate overlaps
    if (cabinetsOverlapAny(project, duplicate) || cabinetBlocksOpening(duplicate, room)) {
      for (let shift = 1; shift <= 4; shift++) {
        const shifted = clampCabinetPlacement(
          {
            ...offsetPlacement,
            x: offsetPlacement.x + shift * 500,
            y: offsetPlacement.y + shift * 100,
          },
          selectedCabinet.config.dimensions,
          roomBounds,
        );
        const shiftedDup = { ...duplicate, placement: shifted };
        if (!cabinetsOverlapAny(project, shiftedDup) && !cabinetBlocksOpening(shiftedDup, room)) {
          duplicate.placement = shifted;
          break;
        }
      }
    }

    setProject((currentProject) =>
      clampCabinetProject({
        ...currentProject,
        cabinets: [...currentProject.cabinets, duplicate],
      }),
    );
    setSelectedCabinetId(duplicate.id);
    setSelectedPanelName(null);
    setProjectStatus("Duplicated the selected room item.");
  }

  function handleRemoveCabinet() {
    if (!selectedCabinetId || project.cabinets.length === 1) {
      return;
    }

    const nextCabinets = project.cabinets.filter(
      (cabinet) => cabinet.id !== selectedCabinetId,
    );

    setProject((currentProject) => ({
      ...currentProject,
      cabinets: nextCabinets,
    }));
    setSelectedCabinetId(nextCabinets[0]?.id ?? null);
    setSelectedPanelName(null);
    setProjectStatus("Removed the selected room item.");
  }

  function handleReset() {
    setProject(defaultCabinetProject);
    setSelectedCabinetId(defaultCabinetProject.cabinets[0]?.id ?? null);
    setSelectedPanelName(null);
    setProjectFilePath(null);
    setProjectStatus("Reset the whole project.");
  }

  function handleRenameCabinet(cabinetId: string, newName: string) {
    updateCabinet(cabinetId, (cabinet) => ({
      ...cabinet,
      name: newName.trim() || cabinet.name,
    }));
  }

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
        setProject(safeProject);
        setSelectedCabinetId(safeProject.cabinets[0]?.id ?? null);
        if (parsed.room) setRoom(parsed.room);
      } else if (parsed.config) {
        const migratedProject = clampCabinetProject({
          version: 1,
          cabinets: [
            {
              id: "cabinet-1",
              name: "Cabinet 1",
              placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
              config: parsed.config,
            },
          ],
        });
        setProject(migratedProject);
        setSelectedCabinetId(migratedProject.cabinets[0]?.id ?? null);
      } else {
        throw new Error("Invalid project file format.");
      }

      setSelectedPanelName(null);
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

      await writeFile(targetPath, createCutlistCsv(cutlistItems));
      setProjectStatus("Cutlist exported to CSV.");
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
        "Cabinet Project",
        room,
        planningWorkflow.countertops,
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
    setProject(safeProject);
    setRoom(entry.room);
    setSelectedCabinetId(safeProject.cabinets[0]?.id ?? null);
    setSelectedPanelName(null);
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
      [...savedProjects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [savedProjects],
  );

  return (
    <main className="app-shell">
      <header className="app-toolbar">
        <div className="toolbar-left">
          <button type="button" className="tb-btn" onClick={handleReset} title="New project">New</button>
          <button type="button" className="tb-btn" onClick={handleLoadProject} title="Open JSON file">Open</button>
          <button type="button" className="tb-btn" onClick={handleSaveProject} title="Save JSON file">Save</button>
          <span className="tb-sep" />
          <button type="button" className="tb-btn" onClick={handleAutoAlignRuns} title="Auto align cabinet runs">Align Runs</button>
          <button type="button" className="tb-btn" onClick={handleExportProjectJson} title="Export JSON">Export JSON</button>
          <button type="button" className="tb-btn" onClick={handleExportCutlistCsv} title="Export CSV">Export CSV</button>
          <button type="button" className="tb-btn tb-accent" onClick={handleExportPdf} title="Download PDF">Export PDF</button>
          <span className="tb-sep" />
          <button type="button" className="tb-btn" disabled title="Undo (coming soon)">↩</button>
          <button type="button" className="tb-btn" disabled title="Redo (coming soon)">↪</button>
        </div>
        <div className="toolbar-right">
          <span className="tb-label">View:</span>
          <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("iso")} title="ISO view">ISO</button>
          <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("front")} title="Front view">Front</button>
          <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("side")} title="Side view">Side</button>
          <button type="button" className="tb-btn" onClick={() => sceneRef.current?.setViewPreset("top")} title="Top view">Top</button>
        </div>
      </header>
      <div className="app-body">
      <aside className="library-sidebar">
        <div className="palette-header">Add Items</div>
        {cabinetLibrary.map((category) => (
          <div key={category.id} className="palette-library-group">
            <div className="palette-section-label">{category.label}</div>
            <div className="palette-family-grid">
              {category.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="palette-family-btn"
                  title={`Add ${cabinetTypeLabels[type]}`}
                  onClick={() => handleAddCabinet(type)}
                >
                  <span className="palette-cat-icon">
                    {type === "drawer" ? "▤" : type === "sink" ? "◫" : type === "corner" ? "◩" : type === "open-shelf" ? "☰" : type === "wall" ? "⬒" : type === "tall" || type === "almirah" ? "▥" : "▦"}
                  </span>
                  <span className="palette-cat-label">{cabinetTypeLabels[type]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="palette-divider" />

        <div className="palette-section-label">Presets</div>
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
        <div className="palette-divider" />
        <ProjectBrowser
          projects={sortedSavedProjects}
          onDeleteProject={handleDeleteSavedProject}
          onDuplicateProject={handleDuplicateSavedProject}
          onLoadProject={handleLoadSavedProject}
          onRenameProject={handleRenameSavedProject}
          onSaveCurrent={saveCurrentProjectToBrowser}
        />
      </aside>

      <section className="viewport-panel" aria-label="3D room viewport">
        <CabinetScene
          ref={sceneRef}
          project={project}
          room={room}
          countertops={planningWorkflow.countertops}
          fillers={planningWorkflow.fillers}
          snapSizeMm={CABINET_GRID_SNAP_MM}
          onCabinetMove={handleCabinetMove}
          onCabinetRotate={handleCabinetRotate}
          selectedCabinetId={selectedCabinetId}
          selectedPanelName={selectedPanelName}
          onCabinetResize={handleCabinetResize}
          onSelectedCabinetChange={setSelectedCabinetId}
          onSelectedPanelChange={(cabinetId, name) => {
            setSelectedCabinetId(cabinetId);
            setSelectedPanelName(name);
          }}
        />
      </section>

      <aside className="properties-panel">
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
          snapSizeMm={CABINET_GRID_SNAP_MM}
          selectedCabinetId={selectedCabinetId}
          selectedPanelName={selectedPanelName}
          selectedPlacement={selectedPlacement}
          selectionLabel={selectedPanelName ? getPanelDisplayName(selectedPanelName) : "None"}
          validationMessages={validationMessages}
          onAttachmentChange={handleAttachmentChange}
          onConfigChange={handleConfigChange}
          onDeleteSavedProject={handleDeleteSavedProject}
          onDuplicateCabinet={handleDuplicateCabinet}
          onDuplicateSavedProject={handleDuplicateSavedProject}
          onExportCutlistCsv={handleExportCutlistCsv}
          onExportProjectJson={handleExportProjectJson}
          onExportPdf={handleExportPdf}
          onLoadProject={handleLoadProject}
          onLoadSavedProject={handleLoadSavedProject}
          onPlacementChange={handlePlacementChange}
          onRemoveCabinet={handleRemoveCabinet}
          onRenameCabinet={handleRenameCabinet}
          onRenameSavedProject={handleRenameSavedProject}
          onReset={handleReset}
          onRotationChange={handleRotationChange}
          onSaveProject={handleSaveProject}
          onSaveToProjectBrowser={saveCurrentProjectToBrowser}
          onSelectCabinet={setSelectedCabinetId}
        />
      </aside>

      </div>
      <footer className="output-panel">
        <div className="output-bar">
          <span className="output-status">{projectStatus || "Ready"}</span>
          <span className="output-stats">{project.cabinets.length} items &middot; {selectedCabinet ? selectedCabinet.config.dimensions.width + " × " + selectedCabinet.config.dimensions.height + " × " + selectedCabinet.config.dimensions.depth + " mm" : "No selection"}</span>
          <span className="output-bar-actions">
            <button type="button" className="tb-btn" onClick={handleSaveProject}>Save JSON</button>
            <button type="button" className="tb-btn" onClick={handleExportProjectJson}>Export JSON</button>
            <button type="button" className="tb-btn" onClick={handleExportCutlistCsv}>Export CSV</button>
            <button type="button" className="tb-btn tb-accent" onClick={handleExportPdf}>Export PDF</button>
          </span>
        </div>
        {validationMessages.length > 0 ? (
          <div className="output-warnings">
            {validationMessages.map((m) => <span key={m} className="output-warn">{m}</span>)}
          </div>
        ) : null}
        <div className="plans-panel">
          <div className="plans-panel-header">
            <span className="plans-panel-title">2D Planning Views</span>
            <div className="plans-panel-tabs">
              {(["top", "front", "side"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`tb-btn ${planView === view ? "tb-accent" : ""}`}
                  onClick={() => setPlanView(view)}
                >
                  {view === "top" ? "Top" : view === "front" ? "Front" : "Side"}
                </button>
              ))}
            </div>
          </div>
          <div className="plans-panel-canvas">
            <TwoDView
              project={project}
              room={room}
              view={planView}
              countertops={planningWorkflow.countertops}
            />
          </div>
        </div>
        <div className="output-cutlists">
          <CutlistPanel items={cabinetCutlistItems} title="Selected Item" />
          <CutlistPanel items={cutlistItems} title="Project Total" />
        </div>
      </footer>

    </main>
  );
}

export default App;
