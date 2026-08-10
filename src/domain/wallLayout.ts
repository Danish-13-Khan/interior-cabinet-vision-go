import {
  cabinetsOverlap,
  getDefaultBottomOffsetMm,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
  type RoomBounds,
} from "./cabinetDimensions";
import {
  getRunExtent,
  inferRunSide,
  runBandForType,
  type CabinetPlanningWorkflow,
  type CabinetRunBand,
  type CabinetRunSide,
} from "./cabinetRuns";
import type { RoomConfig } from "./roomModel";

export type WallLayoutSide = Exclude<CabinetRunSide, "free">;

export type WallLayoutGap = {
  startMm: number;
  endMm: number;
  widthMm: number;
};

export type WallLayoutBandSummary = {
  band: CabinetRunBand;
  cabinetIds: string[];
  occupiedMm: number;
  gaps: WallLayoutGap[];
};

export type WallLayoutSummary = {
  side: WallLayoutSide;
  label: string;
  lengthMm: number;
  cabinetIds: string[];
  runIds: string[];
  bands: WallLayoutBandSummary[];
  availableBaseMm: number;
  fillerCount: number;
  countertopCount: number;
  warnings: string[];
};

export const WALL_LAYOUT_LABELS: Record<WallLayoutSide, string> = {
  "back-wall": "Back Wall",
  "left-wall": "Left Wall",
  "right-wall": "Right Wall",
};

export const WALL_LAYOUT_SIDES: WallLayoutSide[] = [
  "back-wall",
  "left-wall",
  "right-wall",
];

export function normalizeWallLayoutSide(value: unknown): WallLayoutSide {
  return WALL_LAYOUT_SIDES.includes(value as WallLayoutSide)
    ? (value as WallLayoutSide)
    : "back-wall";
}

export function wallLengthMm(side: WallLayoutSide, room: RoomConfig) {
  return side === "back-wall"
    ? room.dimensions.widthMm
    : room.dimensions.depthMm;
}

export function wallPrimaryPosition(
  cabinet: CabinetInstance,
  side: WallLayoutSide,
) {
  return side === "back-wall" ? cabinet.placement.x : cabinet.placement.z;
}

export function cabinetBelongsToWall(
  cabinet: CabinetInstance,
  side: WallLayoutSide,
  roomBounds: RoomBounds,
) {
  return inferRunSide(cabinet, roomBounds) === side;
}

function mergeIntervals(intervals: Array<{ start: number; end: number }>) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }
  return merged;
}

function bandSummary(
  band: CabinetRunBand,
  cabinets: CabinetInstance[],
  side: WallLayoutSide,
  lengthMm: number,
): WallLayoutBandSummary {
  const axis = side === "back-wall" ? "x" : "z";
  const members = cabinets.filter(
    (cabinet) => runBandForType(cabinet.config.type) === band,
  );
  const wallStart = -lengthMm / 2;
  const wallEnd = lengthMm / 2;
  const intervals = mergeIntervals(
    members.map((cabinet) => {
      const extent = getRunExtent(cabinet, axis);
      return {
        start: Math.max(wallStart, extent.start),
        end: Math.min(wallEnd, extent.end),
      };
    }),
  );
  const gaps: WallLayoutGap[] = [];
  let cursor = wallStart;
  for (const interval of intervals) {
    if (interval.start > cursor) {
      gaps.push({
        startMm: cursor,
        endMm: interval.start,
        widthMm: interval.start - cursor,
      });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < wallEnd) {
    gaps.push({ startMm: cursor, endMm: wallEnd, widthMm: wallEnd - cursor });
  }
  return {
    band,
    cabinetIds: members.map((cabinet) => cabinet.id),
    occupiedMm: intervals.reduce((total, interval) => total + interval.end - interval.start, 0),
    gaps,
  };
}

function cabinetsVerticallyOverlap(a: CabinetInstance, b: CabinetInstance) {
  const aTop = a.placement.y + a.config.dimensions.height;
  const bTop = b.placement.y + b.config.dimensions.height;
  return a.placement.y < bTop && b.placement.y < aTop;
}

function cabinetBlocksWallOpening(
  cabinet: CabinetInstance,
  side: WallLayoutSide,
  room: RoomConfig,
) {
  const center = wallPrimaryPosition(cabinet, side);
  const halfWidth = cabinet.config.dimensions.width / 2;
  const start = center - halfWidth;
  const end = center + halfWidth;
  const bottom = cabinet.placement.y;
  const top = bottom + cabinet.config.dimensions.height;
  const doors = room.doors.filter((opening) => opening.side === side);
  const windows = room.windows.filter((opening) => opening.side === side);
  return (
    doors.some((door) =>
      start < door.positionMm + door.widthMm / 2 &&
      end > door.positionMm - door.widthMm / 2 &&
      bottom < door.heightMm &&
      top > 0,
    ) ||
    windows.some((window) =>
      start < window.positionMm + window.widthMm / 2 &&
      end > window.positionMm - window.widthMm / 2 &&
      bottom < window.sillHeightMm + window.heightMm &&
      top > window.sillHeightMm,
    )
  );
}

export function createWallLayoutSummary(options: {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  workflow: CabinetPlanningWorkflow;
  side: WallLayoutSide;
}): WallLayoutSummary {
  const { project, room, roomBounds, workflow, side } = options;
  const cabinets = project.cabinets.filter((cabinet) =>
    cabinetBelongsToWall(cabinet, side, roomBounds),
  );
  const lengthMm = wallLengthMm(side, room);
  const bands = (["base", "wall", "tall"] as CabinetRunBand[]).map((band) =>
    bandSummary(band, cabinets, side, lengthMm),
  );
  const warnings: string[] = [];

  for (let index = 0; index < cabinets.length; index += 1) {
    const cabinet = cabinets[index]!;
    if (cabinetBlocksWallOpening(cabinet, side, room)) {
      warnings.push(`${cabinet.name} blocks a wall opening.`);
    }
    for (let next = index + 1; next < cabinets.length; next += 1) {
      const other = cabinets[next]!;
      if (cabinetsVerticallyOverlap(cabinet, other) && cabinetsOverlap(cabinet, other, 0)) {
        warnings.push(`${cabinet.name} overlaps ${other.name}.`);
      }
    }
  }

  const runIds = workflow.runs
    .filter((run) => run.side === side)
    .map((run) => run.id);
  const floorBands = bands.filter((band) => band.band !== "wall");
  const occupiedFloorMm = Math.min(
    lengthMm,
    floorBands.reduce((total, band) => total + band.occupiedMm, 0),
  );

  return {
    side,
    label: WALL_LAYOUT_LABELS[side],
    lengthMm,
    cabinetIds: cabinets.map((cabinet) => cabinet.id),
    runIds,
    bands,
    availableBaseMm: Math.max(0, lengthMm - occupiedFloorMm),
    fillerCount: workflow.fillers.filter((filler) => runIds.includes(filler.runId)).length,
    countertopCount: workflow.countertops.filter((countertop) =>
      runIds.includes(countertop.runId),
    ).length,
    warnings: [...new Set(warnings)],
  };
}

function placementAt(
  config: CabinetConfig,
  side: WallLayoutSide,
  primary: number,
  roomBounds: RoomBounds,
): CabinetPlacement {
  const isWallMounted = runBandForType(config.type) === "wall";
  const y = isWallMounted ? getDefaultBottomOffsetMm(config.type) : 0;
  if (side === "back-wall") {
    return {
      x: primary,
      y,
      z: -roomBounds.depthMm / 2 + config.dimensions.depth / 2,
      rotation: 0,
      attachment: isWallMounted ? side : "floor",
    };
  }
  return {
    x:
      side === "left-wall"
        ? -roomBounds.widthMm / 2 + config.dimensions.width / 2
        : roomBounds.widthMm / 2 - config.dimensions.width / 2,
    y,
    z: primary,
    rotation: side === "left-wall" ? 90 : 270,
    attachment: isWallMounted ? side : "floor",
  };
}

export function findAvailableWallPlacement(options: {
  project: CabinetProject;
  room: RoomConfig;
  roomBounds: RoomBounds;
  config: CabinetConfig;
  side: WallLayoutSide;
  provisionalId: string;
  preferredPrimaryMm?: number;
  snapMm?: number;
}): CabinetPlacement | null {
  const { project, room, roomBounds, config, side, provisionalId } = options;
  const length = wallLengthMm(side, room);
  const halfSpan = config.dimensions.width / 2;
  const start = -length / 2 + halfSpan;
  const end = length / 2 - halfSpan;
  const snap = Math.max(10, options.snapMm ?? 50);
  const preferred = options.preferredPrimaryMm;
  const positions: number[] = [];
  if (preferred != null && Number.isFinite(preferred)) {
    positions.push(Math.max(start, Math.min(end, Math.round(preferred / snap) * snap)));
  }
  for (let position = start; position <= end; position += snap) positions.push(position);

  for (const position of [...new Set(positions)]) {
    const placement = placementAt(config, side, position, roomBounds);
    const candidate: CabinetInstance = {
      id: provisionalId,
      name: "New cabinet",
      placement,
      config,
      layerId: "layer-default",
      groupId: null,
    };
    const collides = project.cabinets.some(
      (cabinet) => cabinetsVerticallyOverlap(candidate, cabinet) && cabinetsOverlap(candidate, cabinet),
    );
    if (!collides && !cabinetBlocksWallOpening(candidate, side, room)) return placement;
  }
  return null;
}
