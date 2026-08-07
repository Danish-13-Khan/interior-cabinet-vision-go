import { useCallback, useMemo, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { clampCabinetProject } from "../domain/cabinetDimensions";
import {
  getActiveProjectRoom,
  normalizeMultiRoomProject,
  writeActiveRoomState,
} from "../domain/projectRooms";
import {
  getProjectDisplayName,
  persistSavedProjects,
  readSavedProjects,
  type SavedProjectBrowserEntry,
} from "../domain/projectBrowserStorage";
import type { RoomConfig } from "../domain/roomModel";
import type { EditorSnapshot } from "../domain/editorSnapshot";

type UseSavedProjectBrowserArgs = {
  project: CabinetProject;
  room: RoomConfig;
  captureThumbnail: () => string;
  applySnapshot: (snapshot: EditorSnapshot) => void;
  onStatus: (status: string) => void;
};

export function useSavedProjectBrowser({
  project,
  room,
  captureThumbnail,
  applySnapshot,
  onStatus,
}: UseSavedProjectBrowserArgs) {
  const [savedProjects, setSavedProjects] = useState<SavedProjectBrowserEntry[]>(
    () => readSavedProjects(),
  );

  const setProjectAndPersist = useCallback(
    (nextProjects: SavedProjectBrowserEntry[]) => {
      setSavedProjects(nextProjects);
      persistSavedProjects(nextProjects);
    },
    [],
  );

  const sortedSavedProjects = useMemo(
    () =>
      [...savedProjects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .map((entry) => ({
          ...entry,
          job: entry.project.job,
          cabinetCount: entry.project.cabinets.length,
        })),
    [savedProjects],
  );

  const saveCurrentProjectToBrowser = useCallback(
    (nameOverride?: string) => {
      const safeProject = normalizeMultiRoomProject(
        writeActiveRoomState(project, project.cabinets, room),
        room,
      );
      const entry: SavedProjectBrowserEntry = {
        id: `saved-${Date.now()}`,
        name:
          nameOverride ??
          getProjectDisplayName(safeProject, savedProjects.length + 1),
        thumbnail: captureThumbnail(),
        updatedAt: new Date().toISOString(),
        project: safeProject,
        room: getActiveProjectRoom(safeProject).config,
      };
      setProjectAndPersist([entry, ...savedProjects].slice(0, 16));
      onStatus("Saved current project to the browser.");
    },
    [
      captureThumbnail,
      onStatus,
      project,
      room,
      savedProjects,
      setProjectAndPersist,
    ],
  );

  const handleLoadSavedProject = useCallback(
    (projectId: string) => {
      const entry = savedProjects.find((item) => item.id === projectId);
      if (!entry) return;
      const safeProject = clampCabinetProject(entry.project);
      applySnapshot({
        project: safeProject,
        room: entry.room,
        selectedCabinetIds: safeProject.cabinets[0]?.id
          ? [safeProject.cabinets[0].id]
          : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      });
      onStatus(`Loaded "${entry.name}" from the project browser.`);
    },
    [applySnapshot, onStatus, savedProjects],
  );

  const handleDeleteSavedProject = useCallback(
    (projectId: string) => {
      setProjectAndPersist(
        savedProjects.filter((item) => item.id !== projectId),
      );
      onStatus("Removed project from the browser.");
    },
    [onStatus, savedProjects, setProjectAndPersist],
  );

  const handleRenameSavedProject = useCallback(
    (projectId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      setProjectAndPersist(
        savedProjects.map((item) =>
          item.id === projectId ? { ...item, name: trimmed } : item,
        ),
      );
      onStatus(`Renamed project to "${trimmed}".`);
    },
    [onStatus, savedProjects, setProjectAndPersist],
  );

  const handleDuplicateSavedProject = useCallback(
    (projectId: string) => {
      const entry = savedProjects.find((item) => item.id === projectId);
      if (!entry) return;
      const duplicate: SavedProjectBrowserEntry = {
        ...entry,
        id: `saved-${Date.now()}`,
        name: `${entry.name} Copy`,
        updatedAt: new Date().toISOString(),
      };
      setProjectAndPersist([duplicate, ...savedProjects].slice(0, 16));
      onStatus(`Duplicated "${entry.name}".`);
    },
    [onStatus, savedProjects, setProjectAndPersist],
  );

  return {
    savedProjects,
    sortedSavedProjects,
    saveCurrentProjectToBrowser,
    handleLoadSavedProject,
    handleDeleteSavedProject,
    handleRenameSavedProject,
    handleDuplicateSavedProject,
  };
}
