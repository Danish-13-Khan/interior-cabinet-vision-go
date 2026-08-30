import { jsPDF } from "jspdf";
import type { CabinetProject } from "../cabinetDimensions";
import type { CountertopSegment, CabinetRun } from "../cabinetLibrary";
import { createProjectReport } from "../projectReport";
import type { RoomConfig } from "../roomModel";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobTitle,
  JOB_STATUS_LABELS,
} from "../jobMeta";
import { A4_PRINT_METRICS } from "../printLayout";
import { optimizeSceneImage, type PdfLayout } from "./helpers";
import { drawCoverSection } from "./coverSection";
import { drawTechnicalPages } from "./technicalPages";
import { drawMaterialsSection } from "./materialsSection";
import { drawCostingSection } from "./costingSection";
import { drawCutlistSection } from "./cutlistSection";
import { drawInteriorPlanPage } from "./interiorPlanPage";
import { assertProductionExportAllowed } from "../productionOutputs";

export async function exportProjectPdf(
  project: CabinetProject,
  sceneScreenshot: string | null,
  projectName: string,
  room: RoomConfig,
  countertops: CountertopSegment[] = [],
  runs: CabinetRun[] = [],
  interiorPlanSvg: string | null = null,
): Promise<Blob> {
  assertProductionExportAllowed(project);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = A4_PRINT_METRICS.pageWidthMm;
  const pageHeight = A4_PRINT_METRICS.pageHeightMm;
  const margin = A4_PRINT_METRICS.marginMm;
  const contentWidth = A4_PRINT_METRICS.contentWidthMm;
  const job = clampJobMeta(project.job ?? createDefaultJobMeta());
  const title =
    formatJobTitle(job, projectName.trim() || "Cabinet Project") ||
    projectName.trim() ||
    "Cabinet Project";
  const optimizedImage = await optimizeSceneImage(sceneScreenshot);
  const report = createProjectReport(project, room);
  const layout: PdfLayout = {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    rowHeight: 7,
  };

  let y = margin;
  y = drawCoverSection(layout, y, {
    title,
    job,
    project,
    room,
    report,
    optimizedImage,
  });

  await drawInteriorPlanPage(layout, title, interiorPlanSvg);

  await drawTechnicalPages(layout, {
    title,
    project,
    room,
    countertops,
    runs,
    report,
  });

  y = drawMaterialsSection(layout, y, report);
  y = drawCostingSection(layout, y, report);
  y = drawCutlistSection(layout, y, report);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7);
    doc.setTextColor(156, 166, 178);
    doc.text(
      `${report.summary.projectNumber} · Rev ${report.summary.revision} · ${JOB_STATUS_LABELS[job.status]}`,
      margin,
      pageHeight - 7.5,
    );
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 7.5, {
      align: "right",
    });
  }

  return doc.output("blob");
}
