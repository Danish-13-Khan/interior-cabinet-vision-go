import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { clampCabinetProject } from "../domain/cabinetDimensions";
import { getActiveProjectRoom, normalizeMultiRoomProject, writeActiveRoomState } from "../domain/projectRooms";
import { getProjectDisplayName, upsertSavedProjectEntry, type SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import { browserLoading, projectFileAdoption, recoveryOffer, registerDraftReload, requestPersistentStorage, webDraftRestore } from "../domain/projectDrafts/browserSignals";
import type { RecoveryPlatform } from "../domain/projectDrafts/recoveryDecision";
import { loadSavedBrowser, savedProjectsWarning } from "../domain/projectDrafts/loadSavedBrowser";
import { persistBrowserProjectDraft } from "../domain/projectDrafts/browserDraftSave";
import { reloadSavedDraft } from "../domain/projectDrafts/hydrateBrowserEntries";
import { persistSharedProjectIndex } from "../domain/projectDrafts/sharedProjectIndex";
import type { ProjectIndexEntry } from "../domain/projectDrafts/types";
import { splitDwgPreviews } from "../domain/projectDrafts/dwgDraftSplit";
import { schemaVersionOf } from "../domain/projectDrafts/draftDocument";
import type { RoomConfig } from "../domain/roomModel";
import type { EditorSnapshot } from "../domain/editorSnapshot";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { deleteProjectData } from "../domain/projectDrafts/deleteProjectData";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { indexedDbSnapshotStore } from "../platform/indexedDbSnapshotStore";
import { isTauriRuntime } from "../platform/desktopFiles";
import { useDraftAutosave } from "./useDraftAutosave";
import { useStoredAssetCleanup } from "./useStoredAssetCleanup";
import { setStorageWarning, useOpenDocumentWarnings } from "./useStorageWarnings";

type Args = {
  project: CabinetProject;
  room: RoomConfig;
  captureThumbnail: () => string;
  applySnapshot: (snapshot: EditorSnapshot) => void;
  onStatus: (status: string) => void;
  filePath?: string | null;
  platform?: RecoveryPlatform;
};

export function useSavedProjectBrowser({ project, room, captureThumbnail, applySnapshot, onStatus, filePath = null, platform }: Args) {
  const [savedProjects, setSavedProjects] = useState<SavedProjectBrowserEntry[]>([]);
  const [ready, setReady] = useState(false);
  const thumbnailKeys = useRef(new Map<string, string | null>());
  const filePathRef = useRef(filePath);
  const platformRef = useRef(platform);
  const captureThumbnailRef = useRef(captureThumbnail);
  const loadOk = useRef(false);
  const deletedIds = useRef(new Set<string>());
  captureThumbnailRef.current = captureThumbnail;
  filePathRef.current = filePath;
  useStoredAssetCleanup(project);
  useOpenDocumentWarnings(project.interiorDocument?.id ?? null);

  useEffect(() => registerDraftReload(async (projectId) => {
    await reloadSavedDraft(projectId, indexedDbDraftStore, applySnapshot);
  }), [applySnapshot]);

  useEffect(() => {
    let live = true;
    browserLoading.set(true);
    if (!isTauriRuntime()) requestPersistentStorage();
    const openFilePath = filePathRef.current;
    const openPlatform = platformRef.current ?? (isTauriRuntime() ? "desktop" : "web");
    void loadSavedBrowser({
      storage: localStorage,
      blobs: indexedDbAssetBlobStore,
      drafts: indexedDbDraftStore,
      openFilePath,
      platform: openPlatform,
    }).then((result) => {
      if (!live) return;
      setStorageWarning("saved-projects", savedProjectsWarning(result));
      if (result.ok) {
        result.thumbnails.forEach(([id, key]) => thumbnailKeys.current.set(id, key));
        loadOk.current = true;
        setSavedProjects(result.entries);
        const recovery = result.recovery;
        if (recovery?.decision.action === "open-draft") {
          webDraftRestore.set({ entry: recovery.entry, notice: recovery.decision.notice, filePath: recovery.filePath });
        } else if (recovery?.decision.action === "ask") {
          recoveryOffer.set({ prompt: recovery.decision.prompt, entry: recovery.entry, filePath: recovery.filePath });
        }
      }
      setReady(true);
      browserLoading.set(false);
    }).catch(() => { if (live) { setReady(true); browserLoading.set(false); } });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!ready || !loadOk.current) return;
    const visible: ProjectIndexEntry[] = savedProjects.map((entry) => ({
      id: entry.id,
      name: entry.name,
      updatedAt: entry.updatedAt,
      thumbnailKey: thumbnailKeys.current.get(entry.id) ?? null,
    }));
    persistSharedProjectIndex(localStorage, visible, deletedIds.current, true);
  }, [ready, savedProjects]);

  const remember = useCallback((entry: SavedProjectBrowserEntry & { thumbnailKey?: string | null }) => {
    if ("thumbnailKey" in entry) thumbnailKeys.current.set(entry.id, entry.thumbnailKey ?? null);
    setSavedProjects((current) => {
      const existing = current.find((item) => item.id === entry.id);
      return upsertSavedProjectEntry(current, {
        ...entry,
        name: existing?.name || entry.name,
        thumbnail: entry.thumbnail || existing?.thumbnail || "",
      });
    });
  }, []);

  useDraftAutosave({ enabled: ready, project, room, captureThumbnail, onSaved: remember });

  const sortedSavedProjects = useMemo(() => [...savedProjects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map((entry) => ({
    ...entry, job: entry.project.job, cabinetCount: entry.project.cabinets.length,
  })), [savedProjects]);

  const saveCurrentProjectToBrowser = useCallback((nameOverride?: string) => {
    const safeProject = normalizeMultiRoomProject(writeActiveRoomState(project, project.cabinets, room), room);
    const id = safeProject.interiorDocument?.id;
    if (!id) return;
    const updatedAt = new Date().toISOString();
    const savedRoom = getActiveProjectRoom(safeProject).config;
    void persistBrowserProjectDraft(indexedDbDraftStore, safeProject, savedRoom, updatedAt).then(() => {
      remember({
        id,
        name: nameOverride ?? getProjectDisplayName(safeProject, savedProjects.length + 1),
        thumbnail: captureThumbnailRef.current(),
        thumbnailKey: thumbnailKeys.current.get(id) ?? null,
        updatedAt,
        project: safeProject,
        room: savedRoom,
      });
      onStatus("Saved current project to the browser.");
    }).catch(() => onStatus("Could not save the project to the browser."));
  }, [onStatus, project, remember, room, savedProjects.length]);

  const handleLoadSavedProject = useCallback((projectId: string) => {
    const entry = savedProjects.find((item) => item.id === projectId);
    if (!entry) return;
    const same = project.interiorDocument?.id && project.interiorDocument.id === entry.project.interiorDocument?.id;
    if (!same) projectFileAdoption.set(null);
    const safeProject = clampCabinetProject(same ? normalizeMultiRoomProject(writeActiveRoomState(project, project.cabinets, room), room) : entry.project);
    const activeRoom = getActiveProjectRoom(safeProject);
    applySnapshot({
      project: safeProject,
      room: activeRoom.config,
      selectedCabinetIds: safeProject.cabinets[0]?.id ? [safeProject.cabinets[0].id] : [],
      activeCabinetId: safeProject.cabinets[0]?.id ?? null,
      selectedPanelName: null,
    });
    onStatus(`Loaded "${entry.name}" from the project browser.`);
  }, [applySnapshot, onStatus, project, room, savedProjects]);

  const handleDeleteSavedProject = useCallback((projectId: string) => {
    deletedIds.current.add(projectId);
    setSavedProjects((current) => current.filter((item) => item.id !== projectId));
    void deleteProjectData({
      projectId,
      drafts: indexedDbDraftStore,
      snapshots: indexedDbSnapshotStore,
      blobs: indexedDbAssetBlobStore,
    }).catch(() => onStatus("Removed the project, but some of its stored files could not be deleted."));
    onStatus("Removed project from the browser.");
  }, [onStatus]);

  const handleRenameSavedProject = useCallback((projectId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavedProjects((current) => current.map((item) => item.id === projectId ? { ...item, name: trimmed } : item));
    onStatus(`Renamed project to "${trimmed}".`);
  }, [onStatus]);

  const handleDuplicateSavedProject = useCallback((projectId: string) => {
    const entry = savedProjects.find((item) => item.id === projectId);
    if (!entry) return;
    const copyId = `copy-${Date.now()}`;
    const projectCopy = { ...entry.project, interiorDocument: entry.project.interiorDocument ? { ...entry.project.interiorDocument, id: copyId } : entry.project.interiorDocument };
    const duplicate: SavedProjectBrowserEntry = { ...entry, id: copyId, name: `${entry.name} Copy`, updatedAt: new Date().toISOString(), project: projectCopy };
    const split = splitDwgPreviews({ project: projectCopy, room: entry.room });
    void indexedDbDraftStore.put({ id: copyId, document: split.document, dwgPreviews: split.dwgPreviews, updatedAt: duplicate.updatedAt, schemaVersion: schemaVersionOf(projectCopy), lastFileSaveAt: null });
    setSavedProjects((current) => [duplicate, ...current].slice(0, 16));
    onStatus(`Duplicated "${entry.name}".`);
  }, [onStatus, savedProjects]);

  return { savedProjects, sortedSavedProjects, projectsLoading: !ready, saveCurrentProjectToBrowser, handleLoadSavedProject, handleDeleteSavedProject, handleRenameSavedProject, handleDuplicateSavedProject };
}
