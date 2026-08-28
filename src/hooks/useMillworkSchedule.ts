import { useMemo, useState } from "react";
import {
  cabinetProjectFromInteriorProject,
  createInteriorTechnicalPlanSvg,
  type InteriorProject,
} from "../domain/interiorProject";
import {
  buildLivingRoomMillworkSchedule,
  exportMillworkSchedulePdf,
  millworkScheduleFileBase,
  millworkScheduleToCsv,
  summarizeMillworkWorkflow,
  type MillworkSchedule,
  type MillworkWorkflowSnapshot,
} from "../domain/livingRoom/millworkSchedule";
import { createProjectReport, type ProjectReport } from "../domain/projectReport";
import { csvFromProductionCutlist } from "../domain/productionCutlist";
import { exportProjectPdf } from "../domain/pdfExport";
import { promptSavePath, writeBinaryBlob, writeTextFile } from "../platform/desktopFiles";

export type MillworkScheduleExportFormat =
  | "schedule-csv"
  | "schedule-pdf"
  | "cutlist-csv"
  | "production-pdf";

/**
 * Live schedule + workflow summary + workshop export.
 * Schedule CSV/PDF is the default workshop output; production exports are secondary.
 */
export function useMillworkSchedule(project: InteriorProject | null) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportedAt, setExportedAt] = useState<string | null>(null);

  const schedule: MillworkSchedule | null = useMemo(
    () => (project ? buildLivingRoomMillworkSchedule(project) : null),
    [project],
  );

  const workflow: MillworkWorkflowSnapshot | null = useMemo(
    () => (project ? summarizeMillworkWorkflow(project) : null),
    [project],
  );

  const productionReport: ProjectReport | null = useMemo(() => {
    if (!project) return null;
    const compatible = cabinetProjectFromInteriorProject(project);
    return createProjectReport(compatible.project, compatible.room);
  }, [project]);

  async function exportSchedule(format: MillworkScheduleExportFormat) {
    if (!project) return;
    setBusy(true);
    setStatus("");
    try {
      const snapshot = buildLivingRoomMillworkSchedule(project);
      const base = millworkScheduleFileBase(project.name);
      if (format === "schedule-csv") {
        const path = await promptSavePath({
          title: "Export Millwork Schedule CSV",
          defaultPath: `${base}.csv`,
          extensions: ["csv"],
        });
        if (!path) {
          setStatus("Millwork schedule export cancelled.");
          return;
        }
        await writeTextFile(path, millworkScheduleToCsv(snapshot));
        setExportedAt(snapshot.exportedAt);
        setStatus(`Millwork schedule CSV exported (${snapshot.lines.length} pieces).`);
        return;
      }
      if (format === "schedule-pdf") {
        const path = await promptSavePath({
          title: "Export Millwork Schedule PDF",
          defaultPath: `${base}.pdf`,
          extensions: ["pdf"],
        });
        if (!path) {
          setStatus("Millwork schedule export cancelled.");
          return;
        }
        await writeBinaryBlob(path, exportMillworkSchedulePdf(snapshot));
        setExportedAt(snapshot.exportedAt);
        setStatus(`Millwork schedule PDF exported (${snapshot.lines.length} pieces).`);
        return;
      }
      const compatible = cabinetProjectFromInteriorProject(project);
      const report = createProjectReport(compatible.project, compatible.room);
      if (format === "cutlist-csv") {
        const path = await promptSavePath({
          title: "Export Production Cutlist CSV",
          defaultPath: `${base}-cutlist.csv`,
          extensions: ["csv"],
        });
        if (!path) {
          setStatus("Production cutlist export cancelled.");
          return;
        }
        await writeTextFile(path, csvFromProductionCutlist(report.productionCutlist));
        setStatus(`Production cutlist exported (${report.productionCutlist.length} parts).`);
        return;
      }
      const path = await promptSavePath({
        title: "Export Production Packet PDF",
        defaultPath: `${base}-production-packet.pdf`,
        extensions: ["pdf"],
      });
      if (!path) {
        setStatus("Production packet export cancelled.");
        return;
      }
      await writeBinaryBlob(
        path,
        await exportProjectPdf(
          compatible.project,
          null,
          project.name,
          compatible.room,
          [],
          [],
          createInteriorTechnicalPlanSvg(project),
        ),
      );
      setStatus(`Production packet exported (${report.productionCutlist.length} cut parts).`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `Millwork schedule failed: ${error.message}`
          : "Millwork schedule export failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    schedule,
    workflow,
    productionReport,
    status,
    busy,
    exportedAt,
    exportSchedule,
  };
}
