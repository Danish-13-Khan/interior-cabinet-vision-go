import type { CabinetProject, RoomBounds } from "./cabinetDimensions";
import { cabinetTypeLabels } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import {
  calculateCabinetCost,
  calculateProjectCost,
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
  type CabinetCost,
  type ProjectCost,
} from "./costing";
import {
  computeProductionMaterialSummary,
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
  groupCutlistByCabinet,
  groupCutlistByMaterial,
  groupCutlistByThickness,
  type MaterialBoardEstimate,
  type ProductionCutlistGroup,
  type ProductionCutlistLine,
} from "./productionCutlist";
import type { RoomConfig } from "./roomModel";
import {
  clampJobMeta,
  createDefaultJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  JOB_STATUS_LABELS,
  type ProjectJobMeta,
} from "./jobMeta";
import {
  createCabinetPlanningWorkflow,
  type CabinetPlanningWorkflow,
} from "./cabinetLibrary";
import {
  buildProjectQuote,
  type ProjectQuote,
} from "./projectQuote";
import {
  clampQuoteHistory,
  clampQuoteSettings,
  DEFAULT_QUOTE_SETTINGS,
  type QuoteSnapshot,
} from "./quoteSettings";

export type CabinetScheduleRow = {
  mark: string;
  cabinetId: string;
  cabinetName: string;
  typeLabel: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  x: number;
  z: number;
  rotation: number;
  partCount: number;
  totalCost: number;
  runId: string | null;
  runLabel: string | null;
};

export type RunSummaryRow = {
  runId: string;
  label: string;
  side: string;
  axis: string;
  cabinetCount: number;
  cabinetNames: string[];
  lengthMm: number;
  fillerCount: number;
  countertopCount: number;
  hasCorner: boolean;
};

export type ProjectReport = {
  job: ProjectJobMeta;
  jobTitle: string;
  jobSubtitle: string;
  summary: {
    itemCount: number;
    cabinetCount: number;
    roomSizeLabel: string;
    partLineCount: number;
    runCount: number;
    statusLabel: string;
    projectNumber: string;
    revision: string;
    customerName: string;
  };
  itemList: Array<{
    id: string;
    name: string;
    typeLabel: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    x: number;
    z: number;
    rotation: number;
  }>;
  cabinetSchedule: CabinetScheduleRow[];
  runSummaries: RunSummaryRow[];
  perItemCutlists: Array<{
    cabinetId: string;
    cabinetName: string;
    lines: ProductionCutlistLine[];
    cost: CabinetCost;
  }>;
  productionCutlist: ProductionCutlistLine[];
  materialSummary: MaterialBoardEstimate[];
  groupedByMaterial: ProductionCutlistGroup[];
  groupedByThickness: ProductionCutlistGroup[];
  groupedByCabinet: ProductionCutlistGroup[];
  projectCost: ProjectCost;
  quote: ProjectQuote;
  quoteHistory: QuoteSnapshot[];
  packetSections: Array<{ id: string; title: string; description: string }>;
};

function roomBoundsFromConfig(room: RoomConfig): RoomBounds {
  return {
    widthMm: room.dimensions.widthMm,
    depthMm: room.dimensions.depthMm,
    heightMm: room.dimensions.heightMm,
  };
}

function formatRunLabel(run: CabinetPlanningWorkflow["runs"][number], index: number) {
  const sideLabel =
    run.side === "back-wall"
      ? "Back wall"
      : run.side === "left-wall"
        ? "Left wall"
        : run.side === "right-wall"
          ? "Right wall"
          : "Free run";
  return `Run ${index + 1} · ${sideLabel}`;
}

function estimateRunLengthMm(
  run: CabinetPlanningWorkflow["runs"][number],
  project: CabinetProject,
): number {
  const cabinets = run.cabinetIds
    .map((id) => project.cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is NonNullable<typeof cabinet> => Boolean(cabinet));

  if (cabinets.length === 0) return 0;

  return cabinets.reduce((sum, cabinet) => {
    const dim =
      run.axis === "x"
        ? cabinet.config.dimensions.width
        : cabinet.config.dimensions.depth;
    return sum + dim;
  }, 0);
}

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
  const productionCutlist = createProjectProductionCutlist(project);
  const constructionMap = new Map(
    project.cabinets.map(
      (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
    ),
  );
  const cutlistMap = new Map(
    project.cabinets.map(
      (cabinet, index) =>
        [cabinet.id, createCabinetProductionCutlist(cabinet, index + 1)] as const,
    ),
  );
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
  const runByCabinetId = new Map<string, { runId: string; label: string }>();
  workflow.runs.forEach((run, index) => {
    const label = formatRunLabel(run, index);
    for (const cabinetId of run.cabinetIds) {
      runByCabinetId.set(cabinetId, { runId: run.id, label });
    }
  });

  const itemList = project.cabinets.map((cabinet) => ({
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

  const cabinetSchedule: CabinetScheduleRow[] = project.cabinets.map((cabinet, index) => {
    const runInfo = runByCabinetId.get(cabinet.id) ?? null;
    const lines = cutlistMap.get(cabinet.id) ?? [];
    const cost = cabinetCosts.get(cabinet.id);
    return {
      mark: `C${String(index + 1).padStart(2, "0")}`,
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      typeLabel: cabinetTypeLabels[cabinet.config.type],
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
    };
  });

  const cabinetMarks = new Map(
    cabinetSchedule.map((row) => [row.cabinetId, row.mark] as const),
  );
  const quote = buildProjectQuote(projectCost, quoteSettings, job, {
    quotedAt: job.quotedAt ?? new Date().toISOString(),
    cabinetMarks,
  });
  const quoteHistory = clampQuoteHistory(project.quoteHistory);

  const runSummaries: RunSummaryRow[] = workflow.runs.map((run, index) => {
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
      hasCorner: run.cornerTransition,
    };
  });

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
    materialSummary: computeProductionMaterialSummary(productionCutlist),
    groupedByMaterial: groupCutlistByMaterial(productionCutlist),
    groupedByThickness: groupCutlistByThickness(productionCutlist),
    groupedByCabinet: groupCutlistByCabinet(productionCutlist),
    projectCost,
    quote,
    quoteHistory,
    packetSections: [
      {
        id: "cover",
        title: "Job Cover",
        description: "Customer, project number, revision, and status",
      },
      {
        id: "schedule",
        title: "Cabinet Schedule",
        description: "Marks, sizes, runs, and unit costs",
      },
      {
        id: "runs",
        title: "Room / Run Summary",
        description: "Detected runs, fillers, and countertops",
      },
      {
        id: "materials",
        title: "Material Takeoff",
        description: "Board estimates by material and thickness",
      },
      {
        id: "cutlist",
        title: "Workshop Cutlist",
        description: "Shop refs, part sizes, and grouping",
      },
      {
        id: "costing",
        title: "Costing Summary",
        description: "Material, hardware, labour, and totals",
      },
      {
        id: "quote",
        title: "Quote / Estimate",
        description: "Itemized sell prices, markup, tax, and revision snapshots",
      },
    ],
  };
}
