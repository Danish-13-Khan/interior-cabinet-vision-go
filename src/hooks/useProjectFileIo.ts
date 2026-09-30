import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type CabinetProject,
} from "../domain/cabinetDimensions";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import { exportProjectPdf } from "../domain/pdfExport";
import { runCabinetsPdfExport } from "../domain/productionPdfExport";
import { getProjectDisplayName } from "../domain/projectBrowserStorage";
import { useProductionFileExport } from "./useProductionFileExport";
import type { createCabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { DesktopSessionState } from "../domain/desktopUx";
import { getErrorMessage } from "../utils/errors";
import {
  isTauriRuntime,
  promptSavePath,
  writeBinaryBlob,
  writeTextFile,
} from "../platform/desktopFiles";
import { openProjectFile, parseSavedProject, readSavedProject, writeSavedProject } from "../platform/savedProjectFile";
import { portableProjectText } from "./portableProjectFile";
import { useCabinetOpenEvent } from "./useCabinetOpenEvent";
import { useProjectSnapshots } from "./useProjectSnapshots";
import type { ApplySnapshot } from "./projectCommit";
import {
  interiorProjectFileName,
  interiorProjectFromCabinetProject,
  loadInteriorProjectFile,
  validateInteriorProject,
  type InteriorProject,
} from "../domain/interiorProject";
import { readProposalCommercial } from "../domain/livingRoom/proposal/commercialState";
import { noteDraftFileSaved } from "../domain/projectDrafts/commitDraft";
import { projectFileAdoption } from "../domain/projectDrafts/browserSignals";
import { settleOpenedFile } from "../domain/projectDrafts/openedFileRecovery";
import { rememberProjectFileBinding } from "../domain/projectDrafts/projectFileBinding";
import { indexedDbAssetBlobStore } from "../platform/assetBlobStore";
import { versionRestorePlan } from "../domain/projectSnapshots/versionRestore";
import { indexedDbDraftStore } from "../platform/indexedDbDraftStore";

type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

function snapshotFromParsedFile(
  parsed: unknown,
  fallbackRoom: RoomConfig,
): { document: InteriorProject; project: CabinetProject; room: RoomConfig } {
  const loaded = loadInteriorProjectFile(parsed, fallbackRoom);
  return { document: loaded.document, project: loaded.project, room: loaded.room };
}

function currentInteriorDocument(project: CabinetProject, room: RoomConfig) {
  if (project.interiorDocument) {
    return validateInteriorProject(project.interiorDocument).project;
  }
  return interiorProjectFromCabinetProject({
    project,
    activeRoom: room,
  });
}

function persistenceFingerprint(document: InteriorProject) {
  return JSON.stringify({ ...document, updatedAt: "" });
}


type UseProjectFileIoArgs = {
  project: CabinetProject;
  room: RoomConfig;
  projectFilePath: string | null;
  setProjectFilePath: (path: string | null) => void;
  planningWorkflow: PlanningWorkflow;
  applySnapshot: ApplySnapshot;
  onStatus: (status: string) => void;
  rememberFile: (path: string) => void;
  forgetFile: (path: string) => void;
  saveCurrentProjectToBrowser: (nameOverride?: string) => void;
  captureThumbnail: () => string;
  initialSession: DesktopSessionState;
};

export function useProjectFileIo({
  project,
  room,
  projectFilePath,
  setProjectFilePath,
  planningWorkflow,
  applySnapshot,
  onStatus,
  rememberFile,
  forgetFile,
  saveCurrentProjectToBrowser,
  captureThumbnail,
  initialSession,
}: UseProjectFileIoArgs) {
  const sessionRestoreAttempted = useRef(false);
  const currentDocument = useMemo(
    () => currentInteriorDocument(project, room),
    [project, room],
  );
  const currentFingerprint = useMemo(
    () => persistenceFingerprint(currentDocument),
    [currentDocument],
  );
  const [savedFingerprint, setSavedFingerprint] = useState(currentFingerprint);

  useEffect(() => {
    if (sessionRestoreAttempted.current) return;
    sessionRestoreAttempted.current = true;
    if (!isTauriRuntime()) return;
    const session = initialSession;
    if (!session.restoreLastFile || !session.projectFilePath) return;
    void (async () => {
      try {
        const parsed = await readSavedProject(session.projectFilePath!);
        const loaded = snapshotFromParsedFile(
          parsed,
          DEFAULT_ROOM,
        );
        const { project: safeProject, room: activeRoom } = loaded;
        const preferredIds = session.selectedCabinetIds.filter((id) =>
          safeProject.cabinets.some((cabinet) => cabinet.id === id),
        );
        const fallbackId = safeProject.cabinets[0]?.id ?? null;
        await settleOpenedFile({
          storage: localStorage,
          blobs: indexedDbAssetBlobStore,
          drafts: indexedDbDraftStore,
          fileDocument: loaded.document,
          filePath: session.projectFilePath!,
          apply: () => {
            applySnapshot({
              project: safeProject,
              room: activeRoom,
              selectedCabinetIds: preferredIds.length ? preferredIds : fallbackId ? [fallbackId] : [],
              activeCabinetId: preferredIds[0] ?? fallbackId,
              selectedPanelName: null,
            });
            setProjectFilePath(session.projectFilePath);
            setSavedFingerprint(persistenceFingerprint(loaded.document));
            rememberFile(session.projectFilePath!);
            rememberProjectFileBinding(localStorage, loaded.document.id, session.projectFilePath!);
          },
        });
        onStatus("Restored previous session file.");
      } catch {
        onStatus("Could not restore previous session file.");
      }
    })();
  }, [applySnapshot, initialSession, onStatus, rememberFile, setProjectFilePath]);

  const writeFile = useCallback(async (path: string, contents: string) => {
    await writeTextFile(path, contents);
  }, []);

  const applyLoadedFile = useCallback(
    async (parsed: unknown, path: string, status: string) => {
      const loaded = snapshotFromParsedFile(parsed, room);
      const stores = { storage: localStorage, blobs: indexedDbAssetBlobStore, drafts: indexedDbDraftStore };
      await settleOpenedFile({ ...stores, fileDocument: loaded.document, filePath: path, apply: () => {
        applySnapshot({
          project: loaded.project,
          room: loaded.room,
          selectedCabinetIds: loaded.project.cabinets[0]?.id ? [loaded.project.cabinets[0].id] : [],
          activeCabinetId: loaded.project.cabinets[0]?.id ?? null,
          selectedPanelName: null,
        });
        setProjectFilePath(path);
        setSavedFingerprint(persistenceFingerprint(loaded.document));
        rememberFile(path);
        rememberProjectFileBinding(localStorage, loaded.document.id, path);
        onStatus(status);
      } });
    },
    [applySnapshot, onStatus, rememberFile, room, setProjectFilePath],
  );

  const saveProject = useCallback(async (saveAs: boolean) => {
    try {
      const document = currentInteriorDocument(project, room);
      const targetPath =
        !saveAs && projectFilePath
          ? projectFilePath
          : (await promptSavePath({
          title: "Save Interior Project",
          defaultPath: interiorProjectFileName(
            document.name,
            readProposalCommercial(document).job,
          ).replace(/\.json$/i, ".cabinet"),
          extensions: ["cabinet", "json"],
        }));

      if (!targetPath) {
        onStatus("Save cancelled.");
        return;
      }

      const written = await writeSavedProject(targetPath, document, captureThumbnail());

      setProjectFilePath(written);
      setSavedFingerprint(persistenceFingerprint(document));
      void noteDraftFileSaved(document.id, indexedDbDraftStore, localStorage).catch(() => undefined);
      rememberFile(written);
      rememberProjectFileBinding(localStorage, document.id, written);
      saveCurrentProjectToBrowser(document.name);
      onStatus(
        written.toLowerCase().endsWith(".json")
          ? (isTauriRuntime() ? "Project saved to JSON file." : "Project downloaded as JSON.")
          : (isTauriRuntime() ? "Project saved as a Cabinet file." : "Project downloaded as a Cabinet file."),
      );
    } catch (error) {
      onStatus(`Save failed: ${getErrorMessage(error)}`);
    }
  }, [
    captureThumbnail,
    onStatus,
    project,
    projectFilePath,
    rememberFile,
    room,
    saveCurrentProjectToBrowser,
    setProjectFilePath,
    writeFile,
  ]);

  useEffect(() => projectFileAdoption.subscribe((path) => {
    if (path === undefined) return;
    setProjectFilePath(path);
  }), [setProjectFilePath]);

  useProjectSnapshots({
    document: currentDocument,
    cabinetCount: project.cabinets.length,
    restore: (parsed) => {
      const loaded = snapshotFromParsedFile(parsed, room);
      const plan = versionRestorePlan({
        currentPath: projectFilePath,
        currentProjectId: currentDocument.id,
        restoredProjectId: loaded.document.id,
      });
      applySnapshot({
        project: loaded.project,
        room: loaded.room,
        selectedCabinetIds: loaded.project.cabinets[0]?.id ? [loaded.project.cabinets[0].id] : [],
        activeCabinetId: loaded.project.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      });
      setProjectFilePath(plan.path);
      if (plan.markClean) setSavedFingerprint(persistenceFingerprint(loaded.document));
      if (plan.rememberPath) rememberFile(plan.rememberPath);
      onStatus("Restored a saved version.");
    },
  });

  const handleSaveProject = useCallback(() => saveProject(false), [saveProject]);
  const handleSaveAsProject = useCallback(() => saveProject(true), [saveProject]);

  const handleLoadProject = useCallback(async () => {
    try {
      const opened = await openProjectFile({ title: "Open Cabinet Project" });
      if (!opened) {
        onStatus("Load cancelled.");
        return false;
      }
      await applyLoadedFile(
        await parseSavedProject(opened),
        opened.path,
        opened.kind === "cabinet" ? "Project loaded from Cabinet file." : "Project loaded from JSON file.",
      );
      return true;
    } catch (error) {
      onStatus(`Load failed: ${getErrorMessage(error)}`);
      return false;
    }
  }, [applyLoadedFile, onStatus]);

  const handleOpenRecentFile = useCallback(
    async (path: string) => {
      try {
        if (!isTauriRuntime()) {
          onStatus("Recent disk files need the desktop app. Use Open instead.");
          return;
        }
        await applyLoadedFile(
          await readSavedProject(path),
          path,
          `Opened recent file “${path.split(/[/\\]/).pop()}”.`,
        );
      } catch (error) {
        forgetFile(path);
        onStatus(`Recent file failed: ${getErrorMessage(error)}`);
      }
    },
    [applyLoadedFile, forgetFile, onStatus],
  );

  useCabinetOpenEvent(handleOpenRecentFile);

  const {
    handleExportMachineJson,
    handleExportMachineCsv,
    handleExportCutlistCsv,
  } = useProductionFileExport(project, writeFile, onStatus);

  const handleExportProjectJson = useCallback(async () => {
    try {
      const targetPath = await promptSavePath({
        title: "Export Project JSON",
        defaultPath: "interior-project-export.json",
        extensions: ["json"],
      });

      if (!targetPath) {
        onStatus("Project export cancelled.");
        return;
      }

      await writeFile(targetPath, await portableProjectText(currentDocument));
      onStatus("Project exported to JSON.");
    } catch (error) {
      onStatus(`Project export failed: ${getErrorMessage(error)}`);
    }
  }, [currentDocument, onStatus, writeFile]);

  const handleExportPdf = useCallback(async () => {
    try {
      const result = await runCabinetsPdfExport(project, {
        promptPath: () => promptSavePath({
          title: "Export PDF Report",
          defaultPath: "cabinet-project.pdf",
          extensions: ["pdf"],
        }),
        writePdf: writeBinaryBlob,
        generatePdf: async () => {
          onStatus("Generating PDF...");
          return exportProjectPdf(
            project,
            captureThumbnail(),
            getProjectDisplayName(project, 1),
            room,
            planningWorkflow.countertops,
            planningWorkflow.runs,
          );
        },
      });
      onStatus(result.status);
    } catch (error) {
      onStatus("PDF export failed: " + getErrorMessage(error));
    }
  }, [captureThumbnail, onStatus, planningWorkflow, project, room]);

  return {
    writeFile,
    isProjectDirty: currentFingerprint !== savedFingerprint,
    handleSaveProject,
    handleSaveAsProject,
    handleLoadProject,
    handleOpenRecentFile,
    handleExportMachineJson,
    handleExportMachineCsv,
    handleExportCutlistCsv,
    handleExportProjectJson,
    handleExportPdf,
  };
}
