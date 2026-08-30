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
  openTextProjectFile,
  promptSavePath,
  readTextFile,
  writeBinaryBlob,
  writeTextFile,
} from "../platform/desktopFiles";
import type { ApplySnapshot } from "./projectCommit";
import {
  interiorProjectFromCabinetProject,
  loadInteriorProjectFile,
  serializeInteriorProjectFile,
  type InteriorProject,
} from "../domain/interiorProject";

type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

function snapshotFromParsedFile(
  parsed: unknown,
  fallbackRoom: RoomConfig,
): { document: InteriorProject; project: CabinetProject; room: RoomConfig } {
  const loaded = loadInteriorProjectFile(parsed, fallbackRoom);
  return { document: loaded.document, project: loaded.project, room: loaded.room };
}

function currentInteriorDocument(project: CabinetProject, room: RoomConfig) {
  return interiorProjectFromCabinetProject({
    project,
    activeRoom: room,
  });
}

function persistenceFingerprint(document: InteriorProject) {
  return JSON.stringify({ ...document, updatedAt: "" });
}

function projectFileName(projectName: string) {
  const stem = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "interior-project";
  return `${stem}.json`;
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
        const raw = await readTextFile(session.projectFilePath!);
        const parsed = JSON.parse(raw) as unknown;
        const loaded = snapshotFromParsedFile(
          parsed,
          DEFAULT_ROOM,
        );
        const { project: safeProject, room: activeRoom } = loaded;
        const preferredIds = session.selectedCabinetIds.filter((id) =>
          safeProject.cabinets.some((cabinet) => cabinet.id === id),
        );
        const fallbackId = safeProject.cabinets[0]?.id ?? null;
        applySnapshot({
          project: safeProject,
          room: activeRoom,
          selectedCabinetIds: preferredIds.length
            ? preferredIds
            : fallbackId
              ? [fallbackId]
              : [],
          activeCabinetId: preferredIds[0] ?? fallbackId,
          selectedPanelName: null,
        });
        setProjectFilePath(session.projectFilePath);
        setSavedFingerprint(persistenceFingerprint(loaded.document));
        rememberFile(session.projectFilePath!);
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
    (parsed: unknown, path: string, status: string) => {
      const loaded = snapshotFromParsedFile(parsed, room);
      applySnapshot({
        project: loaded.project,
        room: loaded.room,
        selectedCabinetIds: loaded.project.cabinets[0]?.id
          ? [loaded.project.cabinets[0].id]
          : [],
        activeCabinetId: loaded.project.cabinets[0]?.id ?? null,
        selectedPanelName: null,
      });
      setProjectFilePath(path);
      setSavedFingerprint(persistenceFingerprint(loaded.document));
      rememberFile(path);
      onStatus(status);
    },
    [applySnapshot, onStatus, rememberFile, room, setProjectFilePath],
  );

  const handleSaveProject = useCallback(async () => {
    try {
      const document = currentInteriorDocument(project, room);
      const targetPath =
        projectFilePath ??
        (await promptSavePath({
          title: "Save Interior Project",
          defaultPath: projectFileName(document.name),
          extensions: ["json"],
        }));

      if (!targetPath) {
        onStatus("Save cancelled.");
        return;
      }

      await writeFile(targetPath, serializeInteriorProjectFile(document));

      setProjectFilePath(targetPath);
      setSavedFingerprint(persistenceFingerprint(document));
      rememberFile(targetPath);
      saveCurrentProjectToBrowser(document.name);
      onStatus(
        isTauriRuntime()
          ? "Project saved to JSON file."
          : "Project downloaded as JSON.",
      );
    } catch (error) {
      onStatus(`Save failed: ${getErrorMessage(error)}`);
    }
  }, [
    onStatus,
    project,
    projectFilePath,
    rememberFile,
    room,
    saveCurrentProjectToBrowser,
    setProjectFilePath,
    writeFile,
  ]);

  const handleLoadProject = useCallback(async () => {
    try {
      const opened = await openTextProjectFile({
        title: "Open Cabinet Project",
        extensions: ["json"],
      });
      if (!opened) {
        onStatus("Load cancelled.");
        return;
      }
      applyLoadedFile(
        JSON.parse(opened.contents) as unknown,
        opened.path,
        isTauriRuntime()
          ? "Project loaded from JSON file."
          : "Project loaded from browser file.",
      );
    } catch (error) {
      onStatus(`Load failed: ${getErrorMessage(error)}`);
    }
  }, [applyLoadedFile, onStatus]);

  const handleOpenRecentFile = useCallback(
    async (path: string) => {
      try {
        if (!isTauriRuntime()) {
          onStatus("Recent disk files need the desktop app. Use Open instead.");
          return;
        }
        const raw = await readTextFile(path);
        applyLoadedFile(
          JSON.parse(raw) as unknown,
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

      await writeFile(
        targetPath,
        serializeInteriorProjectFile(currentDocument),
      );
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
    handleLoadProject,
    handleOpenRecentFile,
    handleExportMachineJson,
    handleExportMachineCsv,
    handleExportCutlistCsv,
    handleExportProjectJson,
    handleExportPdf,
  };
}
