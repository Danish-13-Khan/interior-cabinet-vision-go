import { useEffect, useRef } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { splitDwgPreviews } from "../domain/projectDrafts/dwgDraftSplit";
import { projectIdOf, schemaVersionOf } from "../domain/projectDrafts/draftDocument";
import { commitDraftSave } from "../domain/projectDrafts/commitDraft";
import { markDraftPending } from "../domain/projectDrafts/pendingMarker";
import { autosaveStatus, draftWritesSuspended, registerDraftFlush } from "../domain/projectDrafts/browserSignals";
import { DRAFT_AUTOSAVE_MS, type ProjectDraft } from "../domain/projectDrafts/types";
import type { RoomConfig } from "../domain/roomModel";
import type { SavedProjectBrowserEntry } from "../domain/projectBrowserStorage";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { dataUrlToBlob } from "../utils/dataUrl";
import { storeProjectThumbnail } from "../domain/projectDrafts/projectThumbnail";

type Args = {
  enabled: boolean;
  project: CabinetProject;
  room: RoomConfig;
  captureThumbnail: () => string;
  onSaved: (entry: SavedProjectBrowserEntry & { thumbnailKey: string | null }) => void;
};

async function thumbnailKey(projectId: string, dataUrl: string, previous: string | null): Promise<string | null> {
  if (!dataUrl) return previous;
  try { return await storeProjectThumbnail(indexedDbAssetBlobStore, projectId, dataUrlToBlob(dataUrl)); } catch { return previous; }
}

export function useDraftAutosave({ enabled, project, room, captureThumbnail, onSaved }: Args) {
  const generation = useRef(0);
  const baseline = useRef<string | null>(null);
  const projectRef = useRef(project);
  const roomRef = useRef(room);
  const onSavedRef = useRef(onSaved);
  const thumbRef = useRef(captureThumbnail);
  projectRef.current = project;
  roomRef.current = room;
  onSavedRef.current = onSaved;
  thumbRef.current = captureThumbnail;
  const fingerprint = JSON.stringify({ project, room });
  const fingerprintRef = useRef(fingerprint);
  fingerprintRef.current = fingerprint;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  async function write(gen: number, currentFingerprint: string) {
    if (draftWritesSuspended()) return;
    const currentProject = projectRef.current;
    const currentRoom = roomRef.current;
    const id = projectIdOf(currentProject, "");
    if (!id) return;
    autosaveStatus.set({ state: "saving", at: autosaveStatus.get().at });
    const updatedAt = new Date().toISOString();
    const existing = await indexedDbDraftStore.get(id).catch(() => null);
    const split = splitDwgPreviews({ project: currentProject, room: currentRoom });
    const draft: ProjectDraft = {
      id,
      document: split.document,
      dwgPreviews: split.dwgPreviews,
      updatedAt,
      schemaVersion: schemaVersionOf(currentProject),
      lastFileSaveAt: existing?.lastFileSaveAt ?? null,
    };
    const storage = window.localStorage;
    await commitDraftSave(draft, indexedDbDraftStore, storage, gen, generation.current);
    const thumbnail = thumbRef.current();
    const key = await thumbnailKey(id, thumbnail, null);
    onSavedRef.current({
      id,
      name: currentProject.interiorDocument?.name || "Project",
      thumbnail,
      thumbnailKey: key,
      updatedAt,
      project: currentProject,
      room: currentRoom,
    });
    if (generation.current === gen) baseline.current = currentFingerprint;
    autosaveStatus.set({ state: "saved", at: updatedAt });
  }

  useEffect(() => {
    if (!enabled || draftWritesSuspended()) return;
    if (baseline.current === null) { baseline.current = fingerprint; return; }
    if (baseline.current === fingerprint) return;
    const id = projectIdOf(project, "");
    if (!id || project.preferences?.autoSaveToBrowser === false) return;
    generation.current += 1;
    const gen = generation.current;
    markDraftPending(window.localStorage, id);
    autosaveStatus.set({ state: "idle", at: autosaveStatus.get().at });
    const timer = window.setTimeout(() => { void write(gen, fingerprint).catch(() => autosaveStatus.set({ state: "error", at: null })); }, DRAFT_AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, fingerprint, project]);

  useEffect(() => registerDraftFlush(async () => {
    if (!enabledRef.current || baseline.current === null || baseline.current === fingerprintRef.current) return;
    generation.current += 1;
    const gen = generation.current;
    const id = projectIdOf(projectRef.current, "");
    if (id) markDraftPending(window.localStorage, id);
    await write(gen, fingerprintRef.current);
  }), [enabled]);

  useEffect(() => {
    const flush = () => { void flushHidden(); };
    const flushHidden = () => { void (async () => {
      if (!enabledRef.current || baseline.current === null || baseline.current === fingerprintRef.current) return;
      generation.current += 1;
      await write(generation.current, fingerprintRef.current).catch(() => undefined);
    })(); };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}
