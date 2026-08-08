import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  clampCabinetProject,
  type CabinetConfig,
  type CabinetProject,
} from "../domain/cabinetDimensions";
import {
  getActiveProjectRoom,
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
import { blobToBase64 } from "../utils/blobBase64";
import { getErrorMessage } from "../utils/errors";
import type { ApplySnapshot } from "./projectCommit";

type CutlistItem = ReturnType<typeof createProjectProductionCutlist>[number];
type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

type ParsedProjectFile = {
  project?: CabinetProject;
  config?: CabinetConfig;
  room?: RoomConfig;
};

function snapshotFromParsedFile(
  parsed: ParsedProjectFile,
  fallbackRoom: RoomConfig,
): { project: CabinetProject; room: RoomConfig } {
  if (parsed.project) {
    const safeProject = normalizeMultiRoomProject(
      clampCabinetProject(parsed.project),
      parsed.room ?? DEFAULT_ROOM,
    );
    const activeRoom = getActiveProjectRoom(safeProject);
    return { project: safeProject, room: activeRoom.config };
  }

  if (parsed.config) {
    const migratedProject = clampCabinetProject({
      version: 1,
      cabinets: [
        {
          id: "cabinet-1",
          name: "Cabinet 1",
          placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
          config: parsed.config,
          layerId: "layer-default",
          groupId: null,
        },
      ],
    });
    return { project: migratedProject, room: fallbackRoom };
  }

  throw new Error("Invalid project file format.");
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
    const session = initialSession;
    if (!session.restoreLastFile || !session.projectFilePath) return;
    void (async () => {
      try {
        const raw = await invoke<string>("load_project_file", {
          path: session.projectFilePath,
        });
        const parsed = JSON.parse(raw) as ParsedProjectFile;
        if (!parsed.project) return;
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
    await invoke("save_project_file", { path, contents });
  }, []);

  const applyLoadedFile = useCallback(
    (parsed: ParsedProjectFile, path: string, status: string) => {
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
        (await save({
          title: "Save Cabinet Project",
          defaultPath: "cabinet-project.json",
          filters: [{ name: "Cabinet Project", extensions: ["json"] }],
        }));

      if (!targetPath) {
        onStatus("Save cancelled.");
        return;
      }

      await writeFile(
        targetPath,
        JSON.stringify(
          {
            version: 3,
            savedAt: new Date().toISOString(),
            project: normalizeMultiRoomProject(
              writeActiveRoomState(project, project.cabinets, room),
              room,
            ),
            room,
          },
          null,
          2,
        ),
      );

      setProjectFilePath(targetPath);
      rememberFile(targetPath);
      saveCurrentProjectToBrowser(
        targetPath.split("/").pop()?.replace(/\.json$/i, ""),
      );
      onStatus("Project saved to JSON file.");
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
      const selectedPath = await open({
        title: "Open Cabinet Project",
        multiple: false,
        directory: false,
        filters: [{ name: "Cabinet Project", extensions: ["json"] }],
      });

      if (!selectedPath || Array.isArray(selectedPath)) {
        onStatus("Load cancelled.");
        return;
      }

      const raw = await invoke<string>("load_project_file", {
        path: selectedPath,
      });
      applyLoadedFile(
        JSON.parse(raw) as ParsedProjectFile,
        selectedPath,
        "Project loaded from JSON file.",
      );
    } catch (error) {
      onStatus(`Load failed: ${getErrorMessage(error)}`);
    }
  }, [applyLoadedFile, onStatus]);

  const handleOpenRecentFile = useCallback(
    async (path: string) => {
      try {
        const raw = await invoke<string>("load_project_file", { path });
        applyLoadedFile(
          JSON.parse(raw) as ParsedProjectFile,
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
      const targetPath = await save({
        title: "Export Machine Intent JSON (preview)",
        defaultPath: "cabinet-machine-preview.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
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
      const targetPath = await save({
        title: "Export Machine Operations CSV (preview)",
        defaultPath: "cabinet-machine-ops-preview.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
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
      const targetPath = await save({
        title: "Export Cutlist CSV",
        defaultPath: "cabinet-cutlist.csv",
        filters: [{ name: "CSV", extensions: ["csv"] }],
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
      const targetPath = await save({
        title: "Export Project JSON",
        defaultPath: "cabinet-project-export.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (!targetPath) {
        onStatus("Project export cancelled.");
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
      onStatus("Project exported to JSON.");
    } catch (error) {
      onStatus(`Project export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  const handleExportPdf = useCallback(async () => {
    try {
      const targetPath = await save({
        title: "Export PDF Report",
        defaultPath: "cabinet-project.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
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
      const base64 = await blobToBase64(blob);
      await invoke("save_binary_file", { path: targetPath, base64Data: base64 });
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
