import {
  DIM_CHAIN_OFFSET,
  DIM_EXT_LEN,
  DIM_LABEL_GAP,
  DIM_OVERALL_OFFSET,
  DIM_RUN_CHAIN_STEP,
  DIM_TICK_HALF,
  SCALE,
} from "./constants";

export function overallDimY(edgeY: number, outside: "above" | "below") {
  return outside === "above" ? edgeY - DIM_OVERALL_OFFSET : edgeY + DIM_OVERALL_OFFSET;
}

export function overallDimX(edgeX: number, outside: "left" | "right") {
  return outside === "left" ? edgeX - DIM_OVERALL_OFFSET : edgeX + DIM_OVERALL_OFFSET;
}

export function chainLaneY(baseEdgeY: number, laneIndex = 0) {
  return baseEdgeY + DIM_CHAIN_OFFSET + laneIndex * DIM_RUN_CHAIN_STEP;
}

export function chainLaneX(baseEdgeX: number, laneIndex = 0) {
  return baseEdgeX + DIM_CHAIN_OFFSET + laneIndex * DIM_RUN_CHAIN_STEP;
}

export function mmToSvg(ox: number, valueMm: number) {
  return ox + valueMm / SCALE;
}

export function dimTickHalf() {
  return DIM_TICK_HALF;
}

export function dimLabelGap() {
  return DIM_LABEL_GAP;
}

export function dimExtLen() {
  return DIM_EXT_LEN;
}
