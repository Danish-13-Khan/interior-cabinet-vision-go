import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import type { createCabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { DesktopSessionState } from "../domain/desktopUx";
import { cleanProjectId, projectFileAdoption } from "../domain/projectDrafts/browserSignals";
import { rememberProjectFileBinding } from "../domain/projectDrafts/projectFileBinding";
import { settleOpenedFile } from "../domain/projectDrafts/openedFileRecovery";
import { versionRestorePlan } from "../domain/projectSnapshots/versionRestore";
import { getErrorMessage } from "../utils/errors";
import { askDiscardUnsaved, confirmDiscardUnsaved } from "../platform/confirmDiscardUnsaved";
import { isTauriRuntime, writeTextFile } from "../platform/desktopFiles";
import { openProjectFile, parseSavedProject, readSavedProject } from "../platform/savedProjectFile";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";
import { cabinetOpenSettled, useCabinetOpenEvent } from "./useCabinetOpenEvent";
import { useProjectExports } from "./useProjectExports";
import { useProjectFileSave } from "./useProjectFileSave";
import { useProjectSnapshots } from "./useProjectSnapshots";
import { currentInteriorDocument, persistenceFingerprint, snapshotFromParsedFile } from "./projectFileDocument";
import type { ApplySnapshot } from "./projectCommit";

type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

type Args = {
  project: CabinetProject;
  room: RoomConfig;
  projectFilePath: string | null;
  setProjectFilePath: (path: string | null) => void;
  planningWorkflow: PlanningWorkflow;
  applySnapshot: ApplySnapshot;
  onStatus: (status: string) => void;
  rememberFile: (path: string) => void;
  forgetFile: (path: string) => void;
  saveCurrentProjectToBrowser: (nameOverride?: string, savedAt?: string) => void;
  captureThumbnail: () => string;
  initialSession: DesktopSessionState;
};

export function useProjectFileIo(args: Args) {
  const attempted = useRef(false);
  const openGeneration = useRef(0);
  const currentDocument = useMemo(() => currentInteriorDocument(args.project, args.room), [args.project, args.room]);
  const currentFingerprint = useMemo(() => persistenceFingerprint(currentDocument), [currentDocument]);
  const [savedFingerprint, setSavedFingerprint] = useState(currentFingerprint);
  const dirtyRef = useRef(false);
  dirtyRef.current = currentFingerprint !== savedFingerprint;
  const pendingCleanId = useRef<string | null>(null);

  useEffect(() => cleanProjectId.subscribe((id) => { if (id) pendingCleanId.current = id; }), []);
  useEffect(() => {
    if (!pendingCleanId.current || pendingCleanId.current !== currentDocument.id) return;
    setSavedFingerprint(currentFingerprint);
    pendingCleanId.current = null;
    cleanProjectId.set(null);
  }, [currentDocument, currentFingerprint]);

  const applyLoadedFile = useCallback(async (parsed: unknown, path: string, status: string) => {
    const loaded = snapshotFromParsedFile(parsed, args.room);
    const generation = openGeneration.current;
    await settleOpenedFile({
      storage: localStorage, blobs: indexedDbAssetBlobStore, drafts: indexedDbDraftStore,
      fileDocument: loaded.document, filePath: path, apply: () => {
        if (generation !== openGeneration.current) return;
        args.applySnapshot({
          project: loaded.project, room: loaded.room,
          selectedCabinetIds: loaded.project.cabinets[0]?.id ? [loaded.project.cabinets[0].id] : [],
          activeCabinetId: loaded.project.cabinets[0]?.id ?? null, selectedPanelName: null,
        });
        args.setProjectFilePath(path);
        setSavedFingerprint(persistenceFingerprint(loaded.document));
        args.rememberFile(path);
        rememberProjectFileBinding(localStorage, loaded.document.id, path);
        args.onStatus(status);
      },
    });
  }, [args]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const generation = openGeneration.current;
    void (async () => {
      const external = await cabinetOpenSettled();
      if (external || generation !== openGeneration.current) return;
      const session = args.initialSession;
      if (!isTauriRuntime() || !session.restoreLastFile || !session.projectFilePath) return;
      try {
        const parsed = await readSavedProject(session.projectFilePath);
        if (generation !== openGeneration.current) return;
        const loaded = snapshotFromParsedFile(parsed, DEFAULT_ROOM);
        const preferredIds = session.selectedCabinetIds.filter((id) => loaded.project.cabinets.some((cabinet) => cabinet.id === id));
        const fallbackId = loaded.project.cabinets[0]?.id ?? null;
        await settleOpenedFile({
          storage: localStorage, blobs: indexedDbAssetBlobStore, drafts: indexedDbDraftStore,
          fileDocument: loaded.document, filePath: session.projectFilePath, apply: () => {
            if (generation !== openGeneration.current) return;
            args.applySnapshot({
              project: loaded.project, room: loaded.room,
              selectedCabinetIds: preferredIds.length ? preferredIds : fallbackId ? [fallbackId] : [],
              activeCabinetId: preferredIds[0] ?? fallbackId, selectedPanelName: null,
            });
            args.setProjectFilePath(session.projectFilePath);
            setSavedFingerprint(persistenceFingerprint(loaded.document));
            args.rememberFile(session.projectFilePath!);
            rememberProjectFileBinding(localStorage, loaded.document.id, session.projectFilePath!);
          },
        });
        args.onStatus("Restored previous session file.");
      } catch {
        args.onStatus("Could not restore previous session file.");
      }
    })();
  }, [args]);

  const writeFile = useCallback(async (path: string, contents: string) => { await writeTextFile(path, contents); }, []);
  const save = useProjectFileSave({ ...args, setSavedFingerprint });
  useEffect(() => projectFileAdoption.subscribe((path) => { if (path !== undefined) args.setProjectFilePath(path); }), [args]);
  useProjectSnapshots({
    document: currentDocument,
    cabinetCount: args.project.cabinets.length,
    restore: (parsed) => {
      const loaded = snapshotFromParsedFile(parsed, args.room);
      const plan = versionRestorePlan({ currentPath: args.projectFilePath, currentProjectId: currentDocument.id, restoredProjectId: loaded.document.id });
      args.applySnapshot({
        project: loaded.project, room: loaded.room,
        selectedCabinetIds: loaded.project.cabinets[0]?.id ? [loaded.project.cabinets[0].id] : [],
        activeCabinetId: loaded.project.cabinets[0]?.id ?? null, selectedPanelName: null,
      });
      args.setProjectFilePath(plan.path);
      if (plan.markClean) setSavedFingerprint(persistenceFingerprint(loaded.document));
      if (plan.rememberPath) args.rememberFile(plan.rememberPath);
      args.onStatus("Restored a saved version.");
    },
  });

  const handleLoadProject = useCallback(async () => {
    try {
      const opened = await openProjectFile({ title: "Open Cabinet Project" });
      if (!opened) { args.onStatus("Load cancelled."); return false; }
      await applyLoadedFile(await parseSavedProject(opened), opened.path, opened.kind === "cabinet" ? "Project loaded from Cabinet file." : "Project loaded from JSON file.");
      return true;
    } catch (error) {
      args.onStatus(`Load failed: ${getErrorMessage(error)}`);
      return false;
    }
  }, [applyLoadedFile, args]);

  const handleOpenRecentFile = useCallback(async (path: string) => {
    try {
      if (!isTauriRuntime()) { args.onStatus("Recent disk files need the desktop app. Use Open instead."); return; }
      await applyLoadedFile(await readSavedProject(path), path, `Opened recent file “${path.split(/[/\\]/).pop()}”.`);
    } catch (error) {
      args.forgetFile(path);
      args.onStatus(`Recent file failed: ${getErrorMessage(error)}`);
    }
  }, [applyLoadedFile, args]);

  useCabinetOpenEvent((path) => {
    const open = () => {
      openGeneration.current += 1;
      void handleOpenRecentFile(path);
    };
    if (!dirtyRef.current) {
      open();
      return true;
    }
    // Wait for the answer; nothing is replaced until the user picks "Discard and open".
    void confirmDiscardUnsaved(true, askDiscardUnsaved)
      .then((discard) => {
        if (discard) open();
        else args.onStatus("Kept your unsaved changes. The other file was not opened.");
      })
      .catch(() => args.onStatus("Could not ask about unsaved changes, so the other file was not opened."));
    return true;
  });

  const exports = useProjectExports({
    project: args.project, room: args.room, planningWorkflow: args.planningWorkflow,
    currentDocument, onStatus: args.onStatus, writeFile, captureThumbnail: args.captureThumbnail,
  });

  return {
    writeFile,
    isProjectDirty: currentFingerprint !== savedFingerprint,
    ...save,
    handleLoadProject,
    handleOpenRecentFile,
    ...exports,
  };
}
