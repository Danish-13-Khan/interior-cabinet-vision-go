import { useCallback } from "react";
import type { CabinetProject } from "../domain/cabinetDimensions";
import type { createCabinetPlanningWorkflow } from "../domain/cabinetLibrary";
import type { InteriorProject } from "../domain/interiorProject";
import { exportProjectPdf } from "../domain/pdfExport";
import { runCabinetsPdfExport } from "../domain/productionPdfExport";
import { getProjectDisplayName } from "../domain/projectBrowserStorage";
import type { RoomConfig } from "../domain/roomModel";
import { getErrorMessage } from "../utils/errors";
import { promptSavePath, writeBinaryBlob } from "../platform/desktopFiles";
import { portableProjectText } from "./portableProjectFile";
import { useProductionFileExport } from "./useProductionFileExport";

type PlanningWorkflow = ReturnType<typeof createCabinetPlanningWorkflow>;

type Args = {
  project: CabinetProject;
  room: RoomConfig;
  planningWorkflow: PlanningWorkflow;
  currentDocument: InteriorProject;
  onStatus: (status: string) => void;
  writeFile: (path: string, contents: string) => Promise<void>;
  captureThumbnail: () => string;
};

export function useProjectExports(args: Args) {
  const production = useProductionFileExport(args.project, args.writeFile, args.onStatus);
  const handleExportProjectJson = useCallback(async () => {
    try {
      const targetPath = await promptSavePath({
        title: "Export Project JSON",
        defaultPath: "interior-project-export.json",
        extensions: ["json"],
      });
      if (!targetPath) {
        args.onStatus("Project export cancelled.");
        return;
      }
      await args.writeFile(targetPath, await portableProjectText(args.currentDocument));
      args.onStatus("Project exported to JSON.");
    } catch (error) {
      args.onStatus(`Project export failed: ${getErrorMessage(error)}`);
    }
  }, [args]);
  const handleExportPdf = useCallback(async () => {
    try {
      const result = await runCabinetsPdfExport(args.project, {
        promptPath: () => promptSavePath({ title: "Export PDF Report", defaultPath: "cabinet-project.pdf", extensions: ["pdf"] }),
        writePdf: writeBinaryBlob,
        generatePdf: async () => {
          args.onStatus("Generating PDF...");
          return exportProjectPdf(
            args.project,
            args.captureThumbnail(),
            getProjectDisplayName(args.project, 1),
            args.room,
            args.planningWorkflow.countertops,
            args.planningWorkflow.runs,
          );
        },
      });
      args.onStatus(result.status);
    } catch (error) {
      args.onStatus("PDF export failed: " + getErrorMessage(error));
    }
  }, [args]);
  return { ...production, handleExportProjectJson, handleExportPdf };
}
