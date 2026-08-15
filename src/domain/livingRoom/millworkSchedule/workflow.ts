import type { InteriorProject } from "../../interiorProject";
import { isMillworkObject } from "../stillJob/sceneRefs";
import type { MillworkWorkflowSnapshot } from "./types";

/**
 * Salesperson trust loop readiness from live InteriorProject.
 * Export itself is UI state — domain only knows whether millwork exists to export.
 */
export function summarizeMillworkWorkflow(project: InteriorProject): MillworkWorkflowSnapshot {
  const millworkCount = project.objects.filter(isMillworkObject).length;
  const softGoodsCount = project.objects.length - millworkCount;
  const readyToExport = millworkCount > 0;
  return {
    millworkCount,
    softGoodsCount,
    readyToExport,
    steps: [
      {
        id: "place",
        label: "Place millwork in Plan",
        detail: readyToExport
          ? `${millworkCount} piece${millworkCount === 1 ? "" : "s"} on schedule`
          : "Add a TV unit, bookcase, or cabinet",
        done: readyToExport,
      },
      {
        id: "size-finish",
        label: "Set size & finish in Plan or Model",
        detail: "W × H × D mm and materials stay InteriorProject truth",
        done: readyToExport,
      },
      {
        id: "export",
        label: "Export Millwork Schedule",
        detail: "CSV or PDF — same millimetres as Plan/Model",
        done: false,
      },
    ],
  };
}
