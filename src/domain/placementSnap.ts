import {
  getFootprintDimensions,
  snapMillimetresToGrid,
  type CabinetInstance,
  type CabinetPlacement,
} from "./cabinetDimensions";

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

const ALIGN_THRESHOLD_MM = 25;
const WALL_THRESHOLD_MM = 120;

export function smartSnapAxis(
  value: number,
  mySize: number,
  targets: SnapTarget[],
  gridSizeMm: number,
): { value: number; guides: SnapGuide[]; axisHint?: number } {
  let best = snapMillimetresToGrid(value, gridSizeMm);
  const guides: SnapGuide[] = [];
  let snappedGuide: number | null = null;

  for (const target of targets) {
    const myLeft = best - mySize / 2;
    const myRight = best + mySize / 2;
    const theirLeft = target.center - target.size / 2;
    const theirRight = target.center + target.size / 2;

    if (Math.abs(myLeft - theirLeft) < ALIGN_THRESHOLD_MM) {
      best = theirLeft + mySize / 2;
      snappedGuide = theirLeft;
    } else if (Math.abs(myRight - theirRight) < ALIGN_THRESHOLD_MM) {
      best = theirRight - mySize / 2;
      snappedGuide = theirRight;
    } else if (Math.abs(myLeft - theirRight) < ALIGN_THRESHOLD_MM) {
      best = theirRight + mySize / 2;
      snappedGuide = theirRight;
    } else if (Math.abs(myRight - theirLeft) < ALIGN_THRESHOLD_MM) {
      best = theirLeft - mySize / 2;
      snappedGuide = theirLeft;
    } else if (Math.abs(best - target.center) < ALIGN_THRESHOLD_MM) {
      best = target.center;
      snappedGuide = target.center;
    }
  }

  if (snappedGuide !== null) {
    guides.push({
      axis: "x",
      positionMm: snappedGuide,
      kind: "align",
    });
  }

  return { value: best, guides };
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
): { positions: number[]; labels: string[] } {
  const halfW = roomWidthMm / 2;
  const edges = [-halfW];

  for (const cabinet of cabinets) {
    const fp = getFootprintDimensions(cabinet.config.dimensions, cabinet.placement.rotation);
    edges.push(cabinet.placement.x - fp.width / 2);
    edges.push(cabinet.placement.x + fp.width / 2);
  }

  edges.push(halfW);
  const unique = Array.from(new Set(edges.map((value) => Math.round(value)))).sort((a, b) => a - b);
  const labels: string[] = [];
  for (let index = 0; index < unique.length - 1; index += 1) {
    labels.push(`${unique[index + 1] - unique[index]}`);
  }
  return { positions: unique, labels };
}
