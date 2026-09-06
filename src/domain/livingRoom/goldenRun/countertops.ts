import {
  countertopSegmentId,
  createCabinetPlanningWorkflow,
  DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM,
  type CountertopSegment,
} from "../../cabinetRuns";
import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorProject } from "../../interiorProject";
import {
  GOLDEN_RUN_COUNTERTOP_CABINET_IDS,
  GOLDEN_RUN_ORIGINAL_WIDTH_MM,
} from "./types";

export const GOLDEN_RUN_COUNTERTOP_ID = countertopSegmentId([
  ...GOLDEN_RUN_COUNTERTOP_CABINET_IDS,
]);

/**
 * Countertop width after the inspector/run reflow path: packed host widths + side overhangs.
 * Hosts are baseA (editable) + drawer + baseB; drawer/baseB stay at the original golden width.
 * (Older half-delta math assumed a center-preserving in-place resize without run reflow.)
 */
export function goldenRunCountertopWidthMm(
  baseAWidthMm = GOLDEN_RUN_ORIGINAL_WIDTH_MM,
) {
  return (
    baseAWidthMm +
    GOLDEN_RUN_ORIGINAL_WIDTH_MM * 2 +
    DEFAULT_COUNTERTOP_OVERHANG_SIDE_MM * 2
  );
}

export const GOLDEN_RUN_COUNTERTOP_WIDTH_MM = goldenRunCountertopWidthMm();

function hostsMatch(cabinetIds: readonly string[]) {
  return cabinetIds.join("+") === GOLDEN_RUN_COUNTERTOP_CABINET_IDS.join("+");
}

/** Planning-workflow countertop that covers the golden base/drawer hosts. */
export function readGoldenRunCountertop(project: InteriorProject): CountertopSegment {
  const adapted = cabinetProjectFromInteriorProject(project);
  const room = adapted.room;
  const workflow = createCabinetPlanningWorkflow(adapted.project, {
    widthMm: room.dimensions.widthMm,
    depthMm: room.dimensions.depthMm,
    heightMm: room.dimensions.heightMm,
  });
  const match = workflow.countertops.find((top) => hostsMatch(top.cabinetIds));
  if (!match) {
    throw new Error("Golden run is missing the derived host countertop.");
  }
  return match;
}
