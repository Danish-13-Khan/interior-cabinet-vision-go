import { useState } from "react";
import type { InteriorProject } from "../domain/interiorProject";
import {
  buildLivingRoomMillworkSchedule,
  exportMillworkSchedulePdf,
  millworkScheduleFileBase,
  millworkScheduleToCsv,
} from "../domain/livingRoom/millworkSchedule";
import { promptSavePath, writeBinaryBlob, writeTextFile } from "../platform/desktopFiles";

export function useMillworkScheduleExport() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportSchedule(project: InteriorProject, format: "csv" | "pdf") {
    setBusy(true);
    setStatus("");
    try {
      const schedule = buildLivingRoomMillworkSchedule(project);
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
        await writeTextFile(path, millworkScheduleToCsv(schedule));
        setStatus(`Millwork schedule CSV exported (${schedule.lines.length} pieces).`);
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
      await writeBinaryBlob(path, exportMillworkSchedulePdf(schedule));
      setStatus(`Millwork schedule PDF exported (${schedule.lines.length} pieces).`);
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

  return { status, busy, exportSchedule };
}
