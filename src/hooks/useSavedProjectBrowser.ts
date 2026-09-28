import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  upsertSavedProjectEntry,
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
  const captureThumbnailRef = useRef(captureThumbnail);
  captureThumbnailRef.current = captureThumbnail;

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

  const upsertCurrentProject = useCallback((options?: {
    nameOverride?: string;
    thumbnail?: string;
  }) => {
    const safeProject = normalizeMultiRoomProject(
      writeActiveRoomState(project, project.cabinets, room),
      room,
    );
    const documentId = safeProject.interiorDocument?.id;
    if (!documentId) return;

    setSavedProjects((current) => {
      const existingIndex = current.findIndex(
        (entry) => entry.project.interiorDocument?.id === documentId,
      );
      const existing = existingIndex >= 0 ? current[existingIndex] : undefined;
      const nextThumbnail = options?.thumbnail ?? captureThumbnailRef.current();
      const entry: SavedProjectBrowserEntry = {
        id: existing?.id ?? `saved-${Date.now()}`,
        name: options?.nameOverride
          ?? existing?.name
          ?? getProjectDisplayName(safeProject, current.length + 1),
        thumbnail: nextThumbnail || existing?.thumbnail || "",
        updatedAt: new Date().toISOString(),
        project: safeProject,
        room: getActiveProjectRoom(safeProject).config,
      };
      const next = upsertSavedProjectEntry(current, entry);
      persistSavedProjects(next);
      return next;
    });
  }, [project, room]);

  useEffect(() => {
    if (!project.interiorDocument || project.preferences?.autoSaveToBrowser === false) return;
    const timer = window.setTimeout(() => upsertCurrentProject(), 900);
    return () => window.clearTimeout(timer);
  }, [project, room, upsertCurrentProject]);

  const saveCurrentProjectToBrowser = useCallback(
    (nameOverride?: string) => {
      upsertCurrentProject({ nameOverride });
      onStatus("Saved current project to the browser.");
    },
    [
      onStatus,
      upsertCurrentProject,
    ],
  );

  const handleLoadSavedProject = useCallback(
    (projectId: string) => {
      const entry = savedProjects.find((item) => item.id === projectId);
      if (!entry) return;
      const currentDocumentId = project.interiorDocument?.id;
      const entryDocumentId = entry.project.interiorDocument?.id;
      const currentProject = currentDocumentId && currentDocumentId === entryDocumentId
        ? normalizeMultiRoomProject(
            writeActiveRoomState(project, project.cabinets, room),
            room,
          )
        : null;
      // Returning through Project Home must never roll the active job back to
      // an older browser snapshot while its autosave is still debouncing.
      const safeProject = clampCabinetProject(currentProject ?? entry.project);
      const activeRoom = getActiveProjectRoom(safeProject);
      applySnapshot({
        project: safeProject,
        room: activeRoom.config,
        selectedCabinetIds: safeProject.cabinets[0]?.id
          ? [safeProject.cabinets[0].id]
          : [],
        activeCabinetId: safeProject.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      });
      onStatus(`Loaded "${entry.name}" from the project browser.`);
    },
    [applySnapshot, onStatus, project, room, savedProjects],
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
