import type { InteriorProject } from "../../interiorProject";
import {
  buildLivingRoomMillworkSchedule,
  exportMillworkSchedulePdf,
  millworkScheduleToCsv,
} from "../millworkSchedule";
import type { ClientPresentationFile } from "./assembleFiles";
import { clientPresentationSlug, type ClientWorkshopScheduleManifest } from "./buildPackageTypes";

/** Workshop schedule files bundled with the client presentation package (L2). */
export function buildMillworkSchedulePackageFiles(
  project: InteriorProject,
  now: string,
): {
  files: ClientPresentationFile[];
  workshopSchedule: ClientWorkshopScheduleManifest;
} {
  const schedule = buildLivingRoomMillworkSchedule(project, now);
  const slug = clientPresentationSlug(project.name);
  const pdfFile = `${slug}-millwork-schedule.pdf`;
  const csvFile = `${slug}-millwork-schedule.csv`;
  return {
    files: [
      { fileName: pdfFile, kind: "pdf", contents: exportMillworkSchedulePdf(schedule) },
      { fileName: csvFile, kind: "json", contents: millworkScheduleToCsv(schedule) },
    ],
    workshopSchedule: {
      version: 1,
      lineCount: schedule.lines.length,
      exportedAt: schedule.exportedAt,
      pdfFile,
      csvFile,
    },
  };
}
