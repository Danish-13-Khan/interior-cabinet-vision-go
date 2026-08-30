import type { CabinetProject } from "../cabinetDimensions";
import { diagnoseProjectIdentity } from "../cabinetIdentity";
import { createCabinetConstruction } from "../cabinetConstruction";
import {
  calculateCabinetCost,
  calculateProjectCost,
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "../costing";
import {
  computeProductionMaterialSummary,
  groupCutlistByCabinet,
  groupCutlistByMaterial,
  groupCutlistByThickness,
} from "../productionCutlist";
import {
  createExportableCabinetCutlistMap,
  createExportableProjectCutlist,
} from "../productionOutputs";
import type { RoomConfig } from "../roomModel";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  JOB_STATUS_LABELS,
} from "../jobMeta";
import {
  createCabinetPlanningWorkflow,
  type CabinetPlanningWorkflow,
} from "../cabinetLibrary";
import { buildProjectQuote } from "../projectQuote";
import {
  clampQuoteHistory,
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
} from "../quoteSettings";
import { planSheetYield } from "../sheetYield";
import {
  clampSheetOptimizerSettings,
  DEFAULT_SHEET_OPTIMIZER,
} from "../sheetStock";
import { createHardwareSchedule } from "../hardwareSystem";
import {
  createRevisionFingerprint,
  getProjectReviewState,
} from "../projectReview";
import { roomBoundsFromConfig } from "./helpers";
import { PROJECT_REPORT_PACKET_SECTIONS } from "./packetSections";
import {
  buildCabinetSchedule,
  buildReportItemList,
  buildRunSummaries,
} from "./scheduleRows";
import type { ProjectReport } from "./types";

export function createProjectReport(
  project: CabinetProject,
  room: RoomConfig,
  planning?: CabinetPlanningWorkflow,
): ProjectReport {
  const settings = clampCostingSettings(
    project.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
  );
  const quoteSettings = clampQuoteSettings(
    project.preferences?.quote ?? DEFAULT_QUOTE_SETTINGS,
  );
  const job = clampJobMeta(project.job ?? createDefaultJobMeta());
  const identity = diagnoseProjectIdentity(project);
  const productionCutlist = createExportableProjectCutlist(project);
  const constructionMap = new Map(
    project.cabinets.map(
      (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
    ),
  );
  const cutlistMap = createExportableCabinetCutlistMap(project);
  const projectCost = calculateProjectCost(
    project.cabinets,
    constructionMap,
    cutlistMap,
    undefined,
    settings,
  );
  const cabinetCosts = new Map(
    projectCost.cabinets.map((cost) => [cost.cabinetId, cost] as const),
  );

  const workflow =
    planning ?? createCabinetPlanningWorkflow(project, roomBoundsFromConfig(room));
  const itemList = buildReportItemList(project);
  const perItemCutlists = project.cabinets.map((cabinet) => {
    const lines = cutlistMap.get(cabinet.id) ?? [];
    const construction = constructionMap.get(cabinet.id)!;
    return {
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      lines,
      cost:
        cabinetCosts.get(cabinet.id) ??
        calculateCabinetCost(cabinet, construction, lines, undefined, settings),
    };
  });
  const cabinetSchedule = buildCabinetSchedule(
    project,
    workflow,
    cutlistMap,
    cabinetCosts,
  );

  const cabinetMarks = new Map(
    cabinetSchedule.map((row) => [row.cabinetId, row.mark] as const),
  );
  const quote = buildProjectQuote(projectCost, quoteSettings, job, {
    quotedAt: job.quotedAt ?? new Date().toISOString(),
    cabinetMarks,
  });
  const quoteHistory = clampQuoteHistory(project.quoteHistory);
  const review = getProjectReviewState(project);
  const currentFingerprint = createRevisionFingerprint(project, review.notes);

  const runSummaries = buildRunSummaries(project, workflow);

  const sheetOptimizer = clampSheetOptimizerSettings(
    project.preferences?.sheetOptimizer ?? DEFAULT_SHEET_OPTIMIZER,
  );
  const sheetYield = planSheetYield(productionCutlist, sheetOptimizer);
  const materialSummary = computeProductionMaterialSummary(productionCutlist).map((row) => {
    const yieldGroup = sheetYield.groups.find(
      (group) =>
        group.material === row.material && group.thicknessMm === row.thicknessMm,
    );
    return {
      ...row,
      estimatedBoards: yieldGroup?.sheetsUsed ?? row.estimatedBoards,
    };
  });

  const hardwareLinesByCabinet = new Map(
    projectCost.cabinets.map((cost) => [cost.cabinetId, cost.hardwareLines] as const),
  );
  const hardwareScheduleBundle = createHardwareSchedule(
    project.cabinets,
    hardwareLinesByCabinet,
    cabinetMarks,
  );

  return {
    job,
    jobTitle: formatJobTitle(job, "Cabinet Project"),
    jobSubtitle: formatJobSubtitle(job),
    summary: {
      itemCount: project.cabinets.length,
      cabinetCount: project.cabinets.filter((cabinet) =>
        cabinet.config.type === "base" ||
        cabinet.config.type === "wall" ||
        cabinet.config.type === "tall" ||
        cabinet.config.type === "drawer" ||
        cabinet.config.type === "sink" ||
        cabinet.config.type === "corner" ||
        cabinet.config.type === "open-shelf" ||
        cabinet.config.type === "almirah",
      ).length,
      roomSizeLabel: `${room.dimensions.widthMm} x ${room.dimensions.depthMm} x ${room.dimensions.heightMm} mm`,
      partLineCount: productionCutlist.length,
      runCount: workflow.runs.length,
      statusLabel: JOB_STATUS_LABELS[job.status],
      projectNumber: job.projectNumber || "—",
      revision: job.revision,
      customerName: job.customerName || "—",
    },
    itemList,
    cabinetSchedule,
    runSummaries,
    perItemCutlists,
    productionCutlist,
    materialSummary,
    sheetYield,
    hardwareSchedule: hardwareScheduleBundle.project,
    hardwareByCabinet: hardwareScheduleBundle.byCabinet,
    groupedByMaterial: groupCutlistByMaterial(productionCutlist),
    groupedByThickness: groupCutlistByThickness(productionCutlist),
    groupedByCabinet: groupCutlistByCabinet(productionCutlist),
    projectCost,
    quote,
    quoteHistory,
    review,
    currentFingerprint,
    packetSections: PROJECT_REPORT_PACKET_SECTIONS,
    identityDiagnostics: identity.diagnostics,
    productionBlocked: identity.blocking,
  };
}
