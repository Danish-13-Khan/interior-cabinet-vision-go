import { useCallback, useEffect, useRef } from "react";
import {
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  normalizeMultiRoomProject,
  writeActiveRoomState,
} from "../domain/projectRooms";
import { DEFAULT_ROOM, type RoomConfig } from "../domain/roomModel";
import { exportProjectPdf } from "../domain/pdfExport";
import { exportProjectMachineFile } from "../domain/machineExport";
import { csvFromProductionCutlist } from "../domain/productionCutlist";
import { getProjectDisplayName } from "../domain/projectBrowserStorage";
import type { createCabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { createProjectProductionCutlist } from "../domain/productionCutlist";
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
} from "../domain/interiorProject";

type CutlistItem = ReturnType<typeof createProjectProductionCutlist>[number];
type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

function snapshotFromParsedFile(
  parsed: unknown,
  fallbackRoom: RoomConfig,
): { project: CabinetProject; room: RoomConfig } {
  const loaded = loadInteriorProjectFile(parsed, fallbackRoom);
  return { project: loaded.project, room: loaded.room };
}

type UseProjectFileIoArgs = {
  project: CabinetProject;
  room: RoomConfig;
  projectFilePath: string | null;
  setProjectFilePath: (path: string | null) => void;
  cutlistItems: CutlistItem[];
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
  cutlistItems,
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
        const { project: safeProject, room: activeRoom } = snapshotFromParsedFile(
          parsed,
          DEFAULT_ROOM,
        );
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
      rememberFile(path);
      onStatus(status);
    },
    [applySnapshot, onStatus, rememberFile, room, setProjectFilePath],
  );

  const handleSaveProject = useCallback(async () => {
    try {
      const targetPath =
        projectFilePath ??
        (await promptSavePath({
          title: "Save Interior Project",
          defaultPath: "interior-project.json",
          extensions: ["json"],
        }));

      if (!targetPath) {
        onStatus("Save cancelled.");
        return;
      }

      await writeFile(
        targetPath,
        serializeInteriorProjectFile(
          interiorProjectFromCabinetProject({
            project: normalizeMultiRoomProject(
              writeActiveRoomState(project, project.cabinets, room),
              room,
            ),
            activeRoom: room,
          }),
        ),
      );

      setProjectFilePath(targetPath);
      rememberFile(targetPath);
      saveCurrentProjectToBrowser(
        targetPath.split(/[/\\]/).pop()?.replace(/\.json$/i, ""),
      );
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

  const handleExportMachineJson = useCallback(async () => {
    try {
      const exported = exportProjectMachineFile(project, "json-preview");
      const targetPath = await promptSavePath({
        title: "Export Machine Intent JSON (preview)",
        defaultPath: "cabinet-machine-preview.json",
        extensions: ["json"],
      });
      if (!targetPath) {
        onStatus("Machine JSON export cancelled.");
        return;
      }
      await writeFile(targetPath, exported.contents);
      onStatus(
        "Exported machining intent JSON (preview only — not a CNC program).",
      );
    } catch (error) {
      onStatus(`Machine JSON export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  const handleExportMachineCsv = useCallback(async () => {
    try {
      const exported = exportProjectMachineFile(project, "csv-ops-preview");
      const targetPath = await promptSavePath({
        title: "Export Machine Operations CSV (preview)",
        defaultPath: "cabinet-machine-ops-preview.csv",
        extensions: ["csv"],
      });
      if (!targetPath) {
        onStatus("Machine CSV export cancelled.");
        return;
      }
      await writeFile(targetPath, exported.contents);
      onStatus(
        "Exported machining operations CSV (preview only — not a CNC program).",
      );
    } catch (error) {
      onStatus(`Machine CSV export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  const handleExportCutlistCsv = useCallback(async () => {
    try {
      const targetPath = await promptSavePath({
        title: "Export Cutlist CSV",
        defaultPath: "cabinet-cutlist.csv",
        extensions: ["csv"],
      });

      if (!targetPath) {
        onStatus("CSV export cancelled.");
        return;
      }

      await writeFile(targetPath, csvFromProductionCutlist(cutlistItems));
      onStatus("Production cutlist exported to CSV.");
    } catch (error) {
      onStatus(`CSV export failed: ${getErrorMessage(error)}`);
    }
  }, [cutlistItems, onStatus, writeFile]);

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
        serializeInteriorProjectFile(
          interiorProjectFromCabinetProject({ project, activeRoom: room }),
        ),
      );
      onStatus("Project exported to JSON.");
    } catch (error) {
      onStatus(`Project export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, room, writeFile]);

  const handleExportPdf = useCallback(async () => {
    try {
      const targetPath = await promptSavePath({
        title: "Export PDF Report",
        defaultPath: "cabinet-project.pdf",
        extensions: ["pdf"],
      });
      if (!targetPath) {
        onStatus("PDF export cancelled.");
        return;
      }
      onStatus("Generating PDF...");
      const screenshot = captureThumbnail();
      const blob = await exportProjectPdf(
        project,
        screenshot,
        getProjectDisplayName(project, 1),
        room,
        planningWorkflow.countertops,
        planningWorkflow.runs,
      );
      await writeBinaryBlob(targetPath, blob);
      onStatus("PDF report saved.");
    } catch (error) {
      onStatus("PDF export failed: " + getErrorMessage(error));
    }
  }, [captureThumbnail, onStatus, planningWorkflow, project, room]);

  return {
    writeFile,
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
