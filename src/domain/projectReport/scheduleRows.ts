import { cabinetTypeLabels, type CabinetProject } from "../cabinetDimensions";
import { getConstructionSummary, type CabinetConstruction } from "../cabinetConstruction";
import { familyLabel } from "../cabinetIdentity";
import type { CabinetPlanningWorkflow } from "../cabinetLibrary";
import type { CabinetCost } from "../costing";
import type { ProductionCutlistLine } from "../productionCutlist";
import { estimateRunLengthMm, formatRunLabel } from "./helpers";
import type { CabinetScheduleRow, RunSummaryRow } from "./types";

export function buildReportItemList(project: CabinetProject) {
  return project.cabinets.map((cabinet) => ({
    id: cabinet.id,
    name: cabinet.name,
    typeLabel: cabinetTypeLabels[cabinet.config.type],
    widthMm: cabinet.config.dimensions.width,
    heightMm: cabinet.config.dimensions.height,
    depthMm: cabinet.config.dimensions.depth,
    x: Math.round(cabinet.placement.x),
    z: Math.round(cabinet.placement.z),
    rotation: cabinet.placement.rotation,
  }));
}

export function buildCabinetSchedule(
  project: CabinetProject,
  workflow: CabinetPlanningWorkflow,
  cutlistMap: Map<string, ProductionCutlistLine[]>,
  cabinetCosts: Map<string, CabinetCost>,
  constructions: Map<string, CabinetConstruction>,
): CabinetScheduleRow[] {
  const runByCabinetId = new Map<string, { runId: string; label: string }>();
  workflow.runs.forEach((run, index) => {
    const label = formatRunLabel(run, index);
    for (const cabinetId of run.cabinetIds) {
      runByCabinetId.set(cabinetId, { runId: run.id, label });
    }
  });
  return project.cabinets.map((cabinet, index) => {
    const runInfo = runByCabinetId.get(cabinet.id) ?? null;
    const lines = cutlistMap.get(cabinet.id) ?? [];
    const cost = cabinetCosts.get(cabinet.id);
    return {
      mark: `C${String(index + 1).padStart(2, "0")}`,
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      typeLabel: cabinetTypeLabels[cabinet.config.type],
      familyId: cabinet.config.familyId ?? null,
      familyLabel: familyLabel(cabinet.config.familyId),
      widthMm: cabinet.config.dimensions.width,
      heightMm: cabinet.config.dimensions.height,
      depthMm: cabinet.config.dimensions.depth,
      x: Math.round(cabinet.placement.x),
      z: Math.round(cabinet.placement.z),
      rotation: cabinet.placement.rotation,
      partCount: lines.length,
      totalCost: cost?.totalCost ?? 0,
      runId: runInfo?.runId ?? null,
      runLabel: runInfo?.label ?? null,
      constructionLabel: constructions.has(cabinet.id)
        ? getConstructionSummary(constructions.get(cabinet.id)!)
        : "—",
    };
  });
}

export function buildRunSummaries(
  project: CabinetProject,
  workflow: CabinetPlanningWorkflow,
): RunSummaryRow[] {
  return workflow.runs.map((run, index) => {
    const names = run.cabinetIds
      .map((id) => project.cabinets.find((cabinet) => cabinet.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    return {
      runId: run.id,
      label: formatRunLabel(run, index),
      side: run.side,
      axis: run.axis,
      cabinetCount: run.cabinetIds.length,
      cabinetNames: names,
      lengthMm: Math.round(estimateRunLengthMm(run, project)),
      fillerCount: workflow.fillers.filter((filler) => filler.runId === run.id).length,
      countertopCount: workflow.countertops.filter((top) => top.runId === run.id).length,
      countertopIds: workflow.countertops
        .filter((top) => top.runId === run.id)
        .map((top) => top.id),
      hasCorner: run.cornerTransition,
    };
  });
}
