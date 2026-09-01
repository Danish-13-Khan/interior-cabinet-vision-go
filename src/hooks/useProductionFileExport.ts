import { useCallback } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import {
  prepareCutlistCsvExport,
  prepareMachineFileExport,
} from "../domain/productionFileExport";
import { getErrorMessage } from "../utils/errors";
import { promptSavePath } from "../platform/desktopFiles";

type WriteText = (path: string, contents: string) => Promise<void>;

export function useProductionFileExport(
  project: CabinetProject,
  writeFile: WriteText,
  onStatus: (status: string) => void,
) {
  const handleExportMachineJson = useCallback(async () => {
    try {
      const prepared = prepareMachineFileExport(project, "json-preview");
      if (!prepared.ok) {
        onStatus(prepared.status);
        return;
      }
      const targetPath = await promptSavePath({
        title: "Export Machine Intent JSON (preview)",
        defaultPath: "cabinet-machine-preview.json",
        extensions: ["json"],
      });
      if (!targetPath) {
        onStatus("Machine JSON export cancelled.");
        return;
      }
      await writeFile(targetPath, prepared.contents);
      onStatus("Exported machining intent JSON (preview only — not a CNC program).");
    } catch (error) {
      onStatus(`Machine JSON export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  const handleExportMachineCsv = useCallback(async () => {
    try {
      const prepared = prepareMachineFileExport(project, "csv-ops-preview");
      if (!prepared.ok) {
        onStatus(prepared.status);
        return;
      }
      const targetPath = await promptSavePath({
        title: "Export Machine Operations CSV (preview)",
        defaultPath: "cabinet-machine-ops-preview.csv",
        extensions: ["csv"],
      });
      if (!targetPath) {
        onStatus("Machine CSV export cancelled.");
        return;
      }
      await writeFile(targetPath, prepared.contents);
      onStatus("Exported machining operations CSV (preview only — not a CNC program).");
    } catch (error) {
      onStatus(`Machine CSV export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  const handleExportCutlistCsv = useCallback(async () => {
    try {
      const prepared = prepareCutlistCsvExport(project);
      if (!prepared.ok) {
        onStatus(prepared.status);
        return;
      }
      const targetPath = await promptSavePath({
        title: "Export Cutlist CSV",
        defaultPath: "cabinet-cutlist.csv",
        extensions: ["csv"],
      });
      if (!targetPath) {
        onStatus("CSV export cancelled.");
        return;
      }
      await writeFile(targetPath, prepared.contents);
      onStatus("Production cutlist exported to CSV.");
    } catch (error) {
      onStatus(`CSV export failed: ${getErrorMessage(error)}`);
    }
  }, [onStatus, project, writeFile]);

  return {
    handleExportMachineJson,
    handleExportMachineCsv,
    handleExportCutlistCsv,
  };
}
