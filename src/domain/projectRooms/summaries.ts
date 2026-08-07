import {
  cabinetTypeLabels,
  type CabinetProject,
} from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction";
import {
  calculateProjectCost,
  type ProjectCost,
} from "../costing";
import { DEFAULT_COSTING_SETTINGS, clampCostingSettings } from "../costingSettings";
import { createCabinetPlanningWorkflow } from "../cabinetLibrary";
import {
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
} from "../productionCutlist";
import { DEFAULT_QUOTE_SETTINGS, clampQuoteSettings } from "../quoteSettings";
import { buildProjectQuote } from "../projectQuote";
import { createDefaultJobMeta, clampJobMeta } from "../jobMeta";
import { listProjectRooms, normalizeMultiRoomProject } from "./normalize";
import type { RoomSummary, WholeProjectReport, WholeProjectScheduleRow } from "./types";

const CABINET_TYPES = new Set([
  "base",
  "wall",
  "tall",
  "drawer",
  "sink",
  "corner",
  "open-shelf",
  "almirah",
]);

function roomProjectSlice(
  project: CabinetProject,
  roomId: string,
): CabinetProject | null {
  const normalized = normalizeMultiRoomProject(project);
  const room = normalized.rooms?.find((entry) => entry.id === roomId);
  if (!room) return null;
  return {
    ...normalized,
    cabinets: room.cabinets,
    activeRoomId: room.id,
  };
}

export function summarizeProjectRoom(
  project: CabinetProject,
  roomId: string,
): RoomSummary | null {
  const normalized = normalizeMultiRoomProject(project);
  const room = normalized.rooms?.find((entry) => entry.id === roomId);
  if (!room) return null;

  const slice = roomProjectSlice(project, roomId)!;
  const settings = clampCostingSettings(
    slice.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
  );
  const productionCutlist = createProjectProductionCutlist(slice);
  const constructionMap = new Map(
    slice.cabinets.map(
      (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
    ),
  );
  const cutlistMap = new Map(
    slice.cabinets.map(
      (cabinet, index) =>
        [cabinet.id, createCabinetProductionCutlist(cabinet, index + 1)] as const,
    ),
  );
  const projectCost = calculateProjectCost(
    slice.cabinets,
    constructionMap,
    cutlistMap,
    undefined,
    settings,
  );
  const workflow = createCabinetPlanningWorkflow(slice, {
    widthMm: room.config.dimensions.widthMm,
    depthMm: room.config.dimensions.depthMm,
    heightMm: room.config.dimensions.heightMm,
  });

  return {
    roomId: room.id,
    roomName: room.name,
    itemCount: room.cabinets.length,
    cabinetCount: room.cabinets.filter((cabinet) =>
      CABINET_TYPES.has(cabinet.config.type),
    ).length,
    sizeLabel: `${room.config.dimensions.widthMm} × ${room.config.dimensions.depthMm} × ${room.config.dimensions.heightMm} mm`,
    totalCost: projectCost.grandTotal,
    partLineCount: productionCutlist.length,
    runCount: workflow.runs.length,
  };
}

export function createWholeProjectReport(project: CabinetProject): WholeProjectReport {
  const rooms = listProjectRooms(project);
  const roomSummaries = rooms
    .map((room) => summarizeProjectRoom(project, room.id))
    .filter((summary): summary is RoomSummary => Boolean(summary));

  const schedule: WholeProjectScheduleRow[] = [];
  let totalCost = 0;
  let totalSell = 0;
  let totalPartLineCount = 0;

  rooms.forEach((room, roomIndex) => {
    const slice = roomProjectSlice(project, room.id);
    if (!slice) return;

    const settings = clampCostingSettings(
      slice.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
    );
    const quoteSettings = clampQuoteSettings(
      slice.preferences?.quote ?? DEFAULT_QUOTE_SETTINGS,
    );
    const job = clampJobMeta(slice.job ?? createDefaultJobMeta());
    const productionCutlist = createProjectProductionCutlist(slice);
    const constructionMap = new Map(
      slice.cabinets.map(
        (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
      ),
    );
    const cutlistMap = new Map(
      slice.cabinets.map(
        (cabinet, index) =>
          [cabinet.id, createCabinetProductionCutlist(cabinet, index + 1)] as const,
      ),
    );
    const projectCost: ProjectCost = calculateProjectCost(
      slice.cabinets,
      constructionMap,
      cutlistMap,
      undefined,
      settings,
    );
    const costById = new Map(
      projectCost.cabinets.map((cost) => [cost.cabinetId, cost.totalCost] as const),
    );
    const quote = buildProjectQuote(projectCost, quoteSettings, job);
    totalCost += projectCost.grandTotal;
    totalSell += quote.sellTotal;
    totalPartLineCount += productionCutlist.length;

    const roomMark = `R${String(roomIndex + 1).padStart(2, "0")}`;
    slice.cabinets.forEach((cabinet, cabinetIndex) => {
      schedule.push({
        mark: `${roomMark}-C${String(cabinetIndex + 1).padStart(2, "0")}`,
        roomId: room.id,
        roomName: room.name,
        cabinetId: cabinet.id,
        cabinetName: cabinet.name,
        typeLabel: cabinetTypeLabels[cabinet.config.type],
        widthMm: cabinet.config.dimensions.width,
        heightMm: cabinet.config.dimensions.height,
        depthMm: cabinet.config.dimensions.depth,
        totalCost: costById.get(cabinet.id) ?? 0,
      });
    });
  });

  return {
    roomCount: rooms.length,
    roomSummaries,
    schedule,
    totalItemCount: roomSummaries.reduce((sum, row) => sum + row.itemCount, 0),
    totalCabinetCount: roomSummaries.reduce((sum, row) => sum + row.cabinetCount, 0),
    totalPartLineCount,
    totalCost,
    totalSell,
  };
}
