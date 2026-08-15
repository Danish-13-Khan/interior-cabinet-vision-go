import { useMemo, useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  buildLivingRoomMillworkSchedule,
  exportMillworkSchedulePdf,
  millworkScheduleFileBase,
  millworkScheduleToCsv,
  summarizeMillworkWorkflow,
  type MillworkSchedule,
  type MillworkWorkflowSnapshot,
} from "../domain/livingRoom/millworkSchedule";
import { promptSavePath, writeBinaryBlob, writeTextFile } from "../platform/desktopFiles";

export type MillworkScheduleExportFormat = "csv" | "pdf";

/**
 * Live schedule + workflow summary + CSV/PDF export.
 * Preview is pure domain derivation; export rebuilds at save time.
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

  async function exportSchedule(format: MillworkScheduleExportFormat) {
    if (!project) return;
    setBusy(true);
    setStatus("");
    try {
      const snapshot = buildLivingRoomMillworkSchedule(project);
      const base = millworkScheduleFileBase(project.name);
      if (format === "csv") {
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
    status,
    busy,
    exportedAt,
    exportSchedule,
  };
}
