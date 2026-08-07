import {
  getFootprintDimensions,
  snapMillimetresToGrid,
  type CabinetInstance,
  type CabinetPlacement,
} from "./cabinetDimensions";
import type { CabinetRun } from "./cabinetLibrary";

export type SnapTarget = {
  center: number;
  size: number;
};

export type SnapGuide = {
  axis: "x" | "z" | "y";
  positionMm: number;
  kind: "grid" | "align" | "wall" | "adjacency";
};

export type PlanSnapResult = {
  placement: CabinetPlacement;
  guides: SnapGuide[];
};

export type DimensionChain = {
  positions: number[];
  labels: string[];
};

const ALIGN_THRESHOLD_MM = 25;
const WALL_THRESHOLD_MM = 120;

function uniqueSortedEdges(edges: number[]): number[] {
  return Array.from(new Set(edges.map((value) => Math.round(value)))).sort((a, b) => a - b);
}

function labelsBetween(positions: number[]): string[] {
  const labels: string[] = [];
  for (let index = 0; index < positions.length - 1; index += 1) {
    labels.push(`${positions[index + 1] - positions[index]}`);
  }
  return labels;
}

/** Drop tiny intermediate segments for cleaner shop dimension chains. */
export function filterDimensionChain(
  chain: DimensionChain,
  minSegmentMm = 40,
): DimensionChain {
  if (chain.positions.length < 2) return chain;
  const positions: number[] = [chain.positions[0]];
  for (let index = 1; index < chain.positions.length - 1; index += 1) {
    const previous = positions[positions.length - 1];
    if (Math.abs(chain.positions[index] - previous) >= minSegmentMm) {
      positions.push(chain.positions[index]);
    }
  }
  const last = chain.positions[chain.positions.length - 1];
  if (positions[positions.length - 1] !== last) {
    if (
      positions.length > 1 &&
      Math.abs(last - positions[positions.length - 1]) < minSegmentMm
    ) {
      positions[positions.length - 1] = last;
    } else {
      positions.push(last);
    }
  }
  return { positions, labels: labelsBetween(positions) };
}

export function smartSnapAxis(
  value: number,
  mySize: number,
  targets: SnapTarget[],
  gridSizeMm: number,
): { value: number; guides: SnapGuide[]; axisHint?: number } {
  let best = snapMillimetresToGrid(value, gridSizeMm);
  const guides: SnapGuide[] = [];
  let snappedGuide: number | null = null;
  let kind: SnapGuide["kind"] = "align";

  for (const target of targets) {
    const myLeft = best - mySize / 2;
    const myRight = best + mySize / 2;
    const theirLeft = target.center - target.size / 2;
    const theirRight = target.center + target.size / 2;

    if (Math.abs(myLeft - theirLeft) < ALIGN_THRESHOLD_MM) {
      best = theirLeft + mySize / 2;
      snappedGuide = theirLeft;
      kind = "align";
    } else if (Math.abs(myRight - theirRight) < ALIGN_THRESHOLD_MM) {
      best = theirRight - mySize / 2;
      snappedGuide = theirRight;
      kind = "align";
    } else if (Math.abs(myLeft - theirRight) < ALIGN_THRESHOLD_MM) {
      best = theirRight + mySize / 2;
      snappedGuide = theirRight;
      kind = "adjacency";
    } else if (Math.abs(myRight - theirLeft) < ALIGN_THRESHOLD_MM) {
      best = theirLeft - mySize / 2;
      snappedGuide = theirLeft;
      kind = "adjacency";
    } else if (Math.abs(best - target.center) < ALIGN_THRESHOLD_MM) {
      best = target.center;
      snappedGuide = target.center;
      kind = "align";
    }
  }

  if (snappedGuide !== null) {
    guides.push({
      axis: "x",
      positionMm: snappedGuide,
      kind,
    });
  }

  return { value: best, guides };
}

export function snapElevationHeight(options: {
  proposedY: number;
  heightMm: number;
  others: CabinetInstance[];
  roomHeightMm: number;
  gridSizeMm: number;
  sillHeightsMm?: number[];
}): { y: number; guides: SnapGuide[] } {
  const { proposedY, heightMm, others, roomHeightMm, gridSizeMm, sillHeightsMm = [] } = options;
  const guides: SnapGuide[] = [];
  let y = Math.max(0, Math.min(roomHeightMm - heightMm, proposedY));

  const targets: SnapTarget[] = others.map((item) => ({
    center: item.placement.y + item.config.dimensions.height / 2,
    size: item.config.dimensions.height,
  }));

  for (const sill of sillHeightsMm) {
    targets.push({ center: sill, size: 0 });
  }

  const snapped = smartSnapAxis(y + heightMm / 2, heightMm, targets, gridSizeMm);
  y = Math.max(0, snapped.value - heightMm / 2);

  for (const guide of snapped.guides) {
    guides.push({ ...guide, axis: "y" });
  }

  // Floor / ceiling attraction
  if (Math.abs(y) < ALIGN_THRESHOLD_MM) {
    y = 0;
    guides.push({ axis: "y", positionMm: 0, kind: "wall" });
  }
  if (Math.abs(y + heightMm - roomHeightMm) < WALL_THRESHOLD_MM) {
    y = Math.max(0, roomHeightMm - heightMm);
    guides.push({ axis: "y", positionMm: roomHeightMm, kind: "wall" });
  }

  y = snapMillimetresToGrid(y, gridSizeMm);
  guides.push({ axis: "y", positionMm: y, kind: "grid" });
  guides.push({ axis: "y", positionMm: y + heightMm, kind: "grid" });

  return { y, guides };
}

export function snapPlanPlacement(options: {
  cabinet: CabinetInstance;
  others: CabinetInstance[];
  proposed: CabinetPlacement;
  roomWidthMm: number;
  roomDepthMm: number;
  gridSizeMm: number;
}): PlanSnapResult {
  const { cabinet, others, proposed, roomWidthMm, roomDepthMm, gridSizeMm } = options;
  const footprint = getFootprintDimensions(cabinet.config.dimensions, proposed.rotation);
  const halfW = roomWidthMm / 2;
  const halfD = roomDepthMm / 2;
  const guides: SnapGuide[] = [];

  let x = proposed.x;
  let z = proposed.z;
  let y = proposed.y;

  const xTargets = others.map((item) => {
    const fp = getFootprintDimensions(item.config.dimensions, item.placement.rotation);
    return { center: item.placement.x, size: fp.width };
  });
  const zTargets = others.map((item) => {
    const fp = getFootprintDimensions(item.config.dimensions, item.placement.rotation);
    return { center: item.placement.z, size: fp.depth };
  });

  if (proposed.attachment === "floor" || proposed.attachment === "back-wall") {
    const snappedX = smartSnapAxis(x, footprint.width, xTargets, gridSizeMm);
    x = snappedX.value;
    for (const guide of snappedX.guides) {
      guides.push({ ...guide, axis: "x" });
    }
  }

  if (proposed.attachment === "floor" || proposed.attachment === "left-wall" || proposed.attachment === "right-wall") {
    const snappedZ = smartSnapAxis(z, footprint.depth, zTargets, gridSizeMm);
    z = snappedZ.value;
    for (const guide of snappedZ.guides) {
      guides.push({ ...guide, axis: "z" });
    }
  }

  if (proposed.attachment !== "floor") {
    y = snapMillimetresToGrid(Math.max(0, y), gridSizeMm);
  } else {
    y = 0;
  }

  // Wall attraction
  if (Math.abs(x - footprint.width / 2 - -halfW) < WALL_THRESHOLD_MM) {
    x = -halfW + footprint.width / 2;
    guides.push({ axis: "x", positionMm: -halfW, kind: "wall" });
  }
  if (Math.abs(x + footprint.width / 2 - halfW) < WALL_THRESHOLD_MM) {
    x = halfW - footprint.width / 2;
    guides.push({ axis: "x", positionMm: halfW, kind: "wall" });
  }
  if (Math.abs(z - footprint.depth / 2 - -halfD) < WALL_THRESHOLD_MM) {
    z = -halfD + footprint.depth / 2;
    guides.push({ axis: "z", positionMm: -halfD, kind: "wall" });
  }
  if (Math.abs(z + footprint.depth / 2 - halfD) < WALL_THRESHOLD_MM) {
    z = halfD - footprint.depth / 2;
    guides.push({ axis: "z", positionMm: halfD, kind: "wall" });
  }

  x = snapMillimetresToGrid(x, gridSizeMm);
  z = snapMillimetresToGrid(z, gridSizeMm);

  guides.push({ axis: "x", positionMm: x, kind: "grid" });
  guides.push({ axis: "z", positionMm: z, kind: "grid" });

  return {
    placement: {
      ...proposed,
      x,
      y,
      z,
    },
    guides,
  };
}

export function collectPlanDimensionChain(
  cabinets: CabinetInstance[],
  roomWidthMm: number,
): DimensionChain {
  const halfW = roomWidthMm / 2;
  const edges = [-halfW];

  for (const cabinet of cabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    edges.push(cabinet.placement.x - fp.width / 2);
    edges.push(cabinet.placement.x + fp.width / 2);
  }

  edges.push(halfW);
  const positions = uniqueSortedEdges(edges);
  return { positions, labels: labelsBetween(positions) };
}

export function collectPlanDepthChain(
  cabinets: CabinetInstance[],
  roomDepthMm: number,
): DimensionChain {
  const halfD = roomDepthMm / 2;
  const edges = [-halfD];

  for (const cabinet of cabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    edges.push(cabinet.placement.z - fp.depth / 2);
    edges.push(cabinet.placement.z + fp.depth / 2);
  }

  edges.push(halfD);
  const positions = uniqueSortedEdges(edges);
  return { positions, labels: labelsBetween(positions) };
}

export function collectRunDimensionChain(
  run: CabinetRun,
  cabinets: CabinetInstance[],
): DimensionChain | null {
  const runCabinets = run.cabinetIds
    .map((id) => cabinets.find((cabinet) => cabinet.id === id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .sort((a, b) =>
      run.axis === "x"
        ? a.placement.x - b.placement.x
        : a.placement.z - b.placement.z,
    );

  if (runCabinets.length === 0) return null;

  const edges: number[] = [];
  for (const cabinet of runCabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    if (run.axis === "x") {
      edges.push(cabinet.placement.x - fp.width / 2);
      edges.push(cabinet.placement.x + fp.width / 2);
    } else {
      edges.push(cabinet.placement.z - fp.depth / 2);
      edges.push(cabinet.placement.z + fp.depth / 2);
    }
  }

  const positions = uniqueSortedEdges(edges);
  if (positions.length < 2) return null;
  return { positions, labels: labelsBetween(positions) };
}

export function collectElevationHorizontalChain(
  cabinets: CabinetInstance[],
  roomSpanMm: number,
  axis: "x" | "z",
): DimensionChain {
  const half = roomSpanMm / 2;
  const edges = [-half];

  for (const cabinet of cabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    if (axis === "x") {
      edges.push(cabinet.placement.x - fp.width / 2);
      edges.push(cabinet.placement.x + fp.width / 2);
    } else {
      edges.push(cabinet.placement.z - fp.depth / 2);
      edges.push(cabinet.placement.z + fp.depth / 2);
    }
  }

  edges.push(half);
  const positions = uniqueSortedEdges(edges);
  return { positions, labels: labelsBetween(positions) };
}

/** Positions measured from floor up (mm). */
export function collectElevationVerticalChain(
  cabinets: CabinetInstance[],
  roomHeightMm: number,
): DimensionChain {
  const edges = [0];

  for (const cabinet of cabinets) {
    edges.push(cabinet.placement.y);
    edges.push(cabinet.placement.y + cabinet.config.dimensions.height);
  }

  edges.push(roomHeightMm);
  const positions = uniqueSortedEdges(edges);
  return { positions, labels: labelsBetween(positions) };
}

export function resolveSelectedCabinets(
  cabinets: CabinetInstance[],
  selectedCabinetIds: string[] | undefined,
  activeCabinetId: string | null | undefined,
): CabinetInstance[] {
  const ids = new Set(selectedCabinetIds ?? []);
  if (activeCabinetId) ids.add(activeCabinetId);
  if (ids.size === 0) return [];
  return cabinets.filter((cabinet) => ids.has(cabinet.id));
}
