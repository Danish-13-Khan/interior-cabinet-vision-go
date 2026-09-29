import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { clampCabinetProject } from "../domain/cabinetDimensions";
import { getActiveProjectRoom, normalizeMultiRoomProject, writeActiveRoomState } from "../domain/projectRooms";
import { getProjectDisplayName, upsertSavedProjectEntry, type SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import { browserLoading, recoveryOffer, requestPersistentStorage, webDraftRestore } from "../domain/projectDrafts/browserSignals";
import { decideDraftRecovery, type RecoveryPlatform } from "../domain/projectDrafts/recoveryDecision";
import { migrateBrowserDrafts } from "../domain/projectDrafts/migrateBrowserDrafts";
import { hydrateBrowserEntries } from "../domain/projectDrafts/hydrateBrowserEntries";
import { isDraftPending } from "../domain/projectDrafts/pendingMarker";
import { writeProjectIndex } from "../domain/projectDrafts/projectIndex";
import type { ProjectIndexEntry } from "../domain/projectDrafts/types";
import { splitDwgPreviews } from "../domain/projectDrafts/dwgDraftSplit";
import { schemaVersionOf } from "../domain/projectDrafts/draftDocument";
import type { RoomConfig } from "../domain/roomModel";
import type { EditorSnapshot } from "../domain/editorSnapshot";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { isTauriRuntime } from "../platform/desktopFiles";
import { useDraftAutosave } from "./useDraftAutosave";
import { useStoredAssetCleanup } from "./useStoredAssetCleanup";
import { useOpenDocumentWarnings } from "./useStorageWarnings";

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
  captureThumbnailRef.current = captureThumbnail;
  useStoredAssetCleanup(project);
  useOpenDocumentWarnings(project.interiorDocument?.id ?? null);

  useEffect(() => {
    let live = true;
    browserLoading.set(true);
    if (!isTauriRuntime()) requestPersistentStorage();
    void (async () => {
      const index = await migrateBrowserDrafts({ storage: localStorage, blobs: indexedDbAssetBlobStore, drafts: indexedDbDraftStore });
      index.forEach((entry) => thumbnailKeys.current.set(entry.id, entry.thumbnailKey));
      const entries = await hydrateBrowserEntries(index, indexedDbDraftStore, indexedDbAssetBlobStore);
      if (!live) return;
      setSavedProjects(entries);
      const latest = [...entries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
      if (latest) {
        const draft = await indexedDbDraftStore.get(latest.id);
        const decision = decideDraftRecovery({
          platform: platformRef.current ?? (isTauriRuntime() ? "desktop" : "web"),
          filePath: filePathRef.current,
          draftUpdatedAt: latest.updatedAt,
          lastFileSaveAt: draft?.lastFileSaveAt ?? null,
          pending: isDraftPending(localStorage, latest.id),
        });
        if (decision.action === "open-draft") webDraftRestore.set({ entry: latest, notice: decision.notice });
        else if (decision.action === "ask") recoveryOffer.set({ prompt: decision.prompt, entry: latest });
      }
      setReady(true);
      browserLoading.set(false);
    })().catch(() => { if (live) { setReady(true); browserLoading.set(false); } });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const index: ProjectIndexEntry[] = savedProjects.map((entry) => ({
      id: entry.id,
      name: entry.name,
      updatedAt: entry.updatedAt,
      thumbnailKey: thumbnailKeys.current.get(entry.id) ?? null,
    }));
    writeProjectIndex(index, localStorage);
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
    remember({
      id,
      name: nameOverride ?? getProjectDisplayName(safeProject, savedProjects.length + 1),
      thumbnail: captureThumbnailRef.current(),
      thumbnailKey: thumbnailKeys.current.get(id) ?? null,
      updatedAt: new Date().toISOString(),
      project: safeProject,
      room: getActiveProjectRoom(safeProject).config,
    });
    onStatus("Saved current project to the browser.");
  }, [onStatus, project, remember, room, savedProjects.length]);

  const handleLoadSavedProject = useCallback((projectId: string) => {
    const entry = savedProjects.find((item) => item.id === projectId);
    if (!entry) return;
    const same = project.interiorDocument?.id && project.interiorDocument.id === entry.project.interiorDocument?.id;
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
    setSavedProjects((current) => current.filter((item) => item.id !== projectId));
    void indexedDbDraftStore.delete(projectId);
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
