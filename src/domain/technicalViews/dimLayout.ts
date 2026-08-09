import {
  DIM_CHAIN_OFFSET,
  DIM_EXT_LEN,
  DIM_LABEL_GAP,
  DIM_OPENING_OFFSET,
  DIM_OVERALL_OFFSET,
  DIM_RUN_CHAIN_STEP,
  DIM_SELECTED_OFFSET,
  DIM_TICK_HALF,
  SCALE,
} from "./constants";

export type DimStackEdge = "above" | "below" | "left" | "right";

/**
 * Allocates stacked dimension lanes along a geometry edge so overall,
 * chain, run, selected, and opening dims do not collide.
 */
export function createDimLaneAllocator() {
  const used: Record<DimStackEdge, number> = {
    above: 0,
    below: 0,
    left: 0,
    right: 0,
  };

  function nextIndex(edge: DimStackEdge) {
    const index = used[edge];
    used[edge] = index + 1;
    return index;
  }

  return {
    overallY(edgeY: number, outside: "above" | "below") {
      nextIndex(outside);
      return outside === "above"
        ? edgeY - DIM_OVERALL_OFFSET
        : edgeY + DIM_OVERALL_OFFSET;
    },
    overallX(edgeX: number, outside: "left" | "right") {
      nextIndex(outside);
      return outside === "left"
        ? edgeX - DIM_OVERALL_OFFSET
        : edgeX + DIM_OVERALL_OFFSET;
    },
    chainY(edgeY: number, outside: "above" | "below" = "below") {
      const lane = nextIndex(outside);
      const delta = DIM_CHAIN_OFFSET + lane * DIM_RUN_CHAIN_STEP;
      return outside === "above" ? edgeY - delta : edgeY + delta;
    },
    chainX(edgeX: number, outside: "left" | "right" = "right") {
      const lane = nextIndex(outside);
      const delta = DIM_CHAIN_OFFSET + lane * DIM_RUN_CHAIN_STEP;
      return outside === "left" ? edgeX - delta : edgeX + delta;
    },
    runY(edgeY: number, outside: "above" | "below" = "below") {
      return this.chainY(edgeY, outside);
    },
    runX(edgeX: number, outside: "left" | "right" = "right") {
      return this.chainX(edgeX, outside);
    },
    selectedOffset() {
      return DIM_SELECTED_OFFSET;
    },
    openingOffset() {
      return DIM_OPENING_OFFSET;
    },
    counts: () => ({ ...used }),
  };
}

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

/** Stacked lane on either side of an edge (authored feel). */
export function authoredLaneY(
  edgeY: number,
  outside: "above" | "below",
  laneIndex = 0,
  baseOffset = DIM_CHAIN_OFFSET,
) {
  const delta = baseOffset + laneIndex * DIM_RUN_CHAIN_STEP;
  return outside === "above" ? edgeY - delta : edgeY + delta;
}

export function authoredLaneX(
  edgeX: number,
  outside: "left" | "right",
  laneIndex = 0,
  baseOffset = DIM_CHAIN_OFFSET,
) {
  const delta = baseOffset + laneIndex * DIM_RUN_CHAIN_STEP;
  return outside === "left" ? edgeX - delta : edgeX + delta;
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
