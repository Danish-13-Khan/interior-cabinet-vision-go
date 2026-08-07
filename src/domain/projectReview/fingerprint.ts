import type { CabinetProject } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction";
import {
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
} from "../productionCutlist";
import { calculateProjectCost } from "../costing";
import { clampCostingSettings, DEFAULT_COSTING_SETTINGS } from "../costingSettings";
import { buildProjectQuote } from "../projectQuote";
import { clampQuoteSettings, DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import { evaluateProjectRules } from "../manufacturingRules";
import { listProjectRooms } from "../projectRooms";
import type { ReviewNote, RevisionFingerprint } from "./types";

export function createRevisionFingerprint(
  project: CabinetProject,
  openNotes: ReviewNote[] = [],
): RevisionFingerprint {
  const costing = clampCostingSettings(
    project.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
  );
  const quoteSettings = clampQuoteSettings(
    project.preferences?.quote ?? DEFAULT_QUOTE_SETTINGS,
  );
  const cutlist = createProjectProductionCutlist(project);
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
    costing,
  );
  const quote = buildProjectQuote(projectCost, quoteSettings, project.job);
  const manufacturing = evaluateProjectRules(project);
  const unresolvedNotes = openNotes.filter((note) => !note.resolved);
  const blockerCount = unresolvedNotes.filter((note) => note.severity === "blocker").length;
  const errorCount =
    manufacturing.filter((issue) => issue.severity === "error").length +
    unresolvedNotes.filter((note) => note.severity === "error").length;
  const warningCount =
    manufacturing.filter((issue) => issue.severity === "warning").length +
    unresolvedNotes.filter((note) => note.severity === "warning").length;

  const materialKeys = Array.from(
    new Set(
      cutlist.map((line) => `${line.material}|${line.thicknessMm}|${line.finish}`),
    ),
  ).sort();

  return {
    cabinetCount: project.cabinets.length,
    roomCount: listProjectRooms(project).length,
    partLineCount: cutlist.length,
    workshopTotal: Math.round(projectCost.grandTotal),
    sellTotal: Math.round(quote.sellTotal),
    errorCount,
    warningCount,
    blockerCount,
    cabinetNames: project.cabinets.map((cabinet) => cabinet.name).sort(),
    materialKeys,
  };
}
