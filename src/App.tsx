import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import "./App.css";
import {
  CabinetScene,
  type CabinetSceneHandle,
} from "./components/CabinetScene";
import { DimensionControls } from "./components/DimensionControls";
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
  objectCategories,
  roomPresets,
  type RoomPresetId,
} from "./domain/roomPresets";

type SavedProjectBrowserEntry = {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: string;
  project: CabinetProject;
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
  const [savedProjects, setSavedProjects] = useState<SavedProjectBrowserEntry[]>(() =>
    readSavedProjects(),
  );
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(
    defaultCabinetProject.cabinets[0]?.id ?? null,
  );
  const [selectedPanelName, setSelectedPanelName] = useState<PanelName | null>(null);
  const [projectStatus, setProjectStatus] = useState("");
  const [projectFilePath, setProjectFilePath] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("storage");

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProjectStatus("");
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [projectStatus]);

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
    };

    const nextProjects = [entry, ...savedProjects].slice(0, 16);
    setProjectAndPersist(nextProjects);
    setProjectStatus("Saved current room to the project browser.");
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
    );

    if (projectHasCollision(project, selectedCabinetId, nextPlacement, nextConfig.dimensions)) {
      setProjectStatus("Change blocked: item would collide after this update.");
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

    const nextPlacement = clampCabinetPlacement(
      {
        ...selectedCabinet.placement,
        [axis]: value,
      },
      selectedCabinet.config.dimensions,
    );

    if (projectHasCollision(project, selectedCabinetId, nextPlacement)) {
      setProjectStatus("Placement blocked: room items cannot overlap.");
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

    const nextPlacement = clampCabinetPlacement(
      {
        ...selectedCabinet.placement,
        rotation: normalizeRotationAngle(rotation),
      },
      selectedCabinet.config.dimensions,
    );

    if (projectHasCollision(project, selectedCabinetId, nextPlacement)) {
      setProjectStatus("Rotation blocked: item would collide at that angle.");
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
    );

    if (projectHasCollision(project, selectedCabinetId, nextPlacement)) {
      setProjectStatus("Wall placement blocked: item would overlap another object.");
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
    const nextPlacement = clampCabinetPlacement(cabinet.placement, nextConfig.dimensions);

    if (projectHasCollision(project, cabinetId, nextPlacement, nextConfig.dimensions)) {
      setProjectStatus("Resize blocked: item would collide with another object.");
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

    const nextPlacement = clampCabinetPlacement(placement, cabinet.config.dimensions);

    if (projectHasCollision(project, cabinetId, nextPlacement)) {
      setProjectStatus("Move blocked: room items cannot overlap.");
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

    const nextPlacement = clampCabinetPlacement(
      { ...cabinet.placement, rotation: normalizeRotationAngle(rotation) },
      cabinet.config.dimensions,
    );

    if (projectHasCollision(project, cabinetId, nextPlacement)) {
      setProjectStatus("Rotation blocked: item would collide at that angle.");
      return false;
    }

    updateCabinet(cabinetId, (currentCabinet) => ({
      ...currentCabinet,
      placement: nextPlacement,
    }));

    return true;
  }

  function handleAddCabinet(type: CabinetType = "base") {
    const basePlacement: CabinetPlacement = {
      x: project.cabinets.length * 700 - 1000,
      y: 0,
      z: 0,
      rotation: 0,
      attachment: "floor",
    };
    const config = getDefaultCabinetConfig(type);
    const placement =
      supportsWallPlacement(type)
        ? getWallPlacement(basePlacement, type, config.dimensions, "back-wall")
        : clampCabinetPlacement(basePlacement, config.dimensions);

    const newCabinet: CabinetInstance = {
      id: createCabinetId(),
      name: createItemName(type, project.cabinets.length + 1),
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
      placement: clampCabinetPlacement(offsetPlacement, selectedCabinet.config.dimensions),
    };

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
            version: 1,
            savedAt: new Date().toISOString(),
            project,
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
        | { project?: CabinetProject; config?: CabinetConfig };

      if (parsed.project) {
        const safeProject = clampCabinetProject(parsed.project);
        setProject(safeProject);
        setSelectedCabinetId(safeProject.cabinets[0]?.id ?? null);
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

  function handleLoadSavedProject(projectId: string) {
    const entry = savedProjects.find((item) => item.id === projectId);

    if (!entry) {
      return;
    }

    const safeProject = clampCabinetProject(entry.project);
    setProject(safeProject);
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
      <aside className="object-palette">
        <div className="palette-header">Add Items</div>
        {objectCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`palette-category-btn ${activeCategory === category.id ? "active" : ""}`}
            title={`Add ${category.label.toLowerCase()} item`}
            onClick={() => {
              setActiveCategory(category.id);
              const defaultType = category.types[0];
              if (defaultType) handleAddCabinet(defaultType);
            }}
          >
            <span className="palette-cat-icon">
              {category.id === "storage" ? "▦" : category.id === "seating" ? "🪑" : category.id === "tables" ? "⬜" : "🖼"}
            </span>
            <span className="palette-cat-label">{category.label}</span>
          </button>
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
      </aside>

      <aside className="settings-panel">
        <DimensionControls
          cabinetCount={project.cabinets.length}
          cabinetCutlistItems={cabinetCutlistItems}
          cabinets={project.cabinets}
          config={selectedConfig}
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

      <section className="viewport-panel" aria-label="3D room viewport">
        <CabinetScene
          ref={sceneRef}
          project={project}
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
    </main>
  );
}

export default App;
