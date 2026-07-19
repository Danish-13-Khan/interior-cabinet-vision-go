import type { CabinetInstance } from "./cabinetDimensions";

// ── Room Model ──────────────────────────────────────────────

export type RoomDimensions = {
  widthMm: number;   // X-axis
  depthMm: number;   // Z-axis
  heightMm: number;  // Y-axis
  wallThicknessMm: number;
  showBackWall: boolean;
  showLeftWall: boolean;
  showRightWall: boolean;
};

export type DoorSide = "left-wall" | "right-wall" | "back-wall";

export type RoomDoor = {
  id: string;
  side: DoorSide;
  positionMm: number;       // offset from wall center along the wall
  widthMm: number;
  heightMm: number;
  swingDirection: "in" | "out";
};

export type WindowSide = "left-wall" | "right-wall" | "back-wall";

export type RoomWindow = {
  id: string;
  side: WindowSide;
  positionMm: number;
  widthMm: number;
  heightMm: number;
  sillHeightMm: number;     // height above floor
};

export type RoomConfig = {
  dimensions: RoomDimensions;
  doors: RoomDoor[];
  windows: RoomWindow[];
};

// ── Defaults ─────────────────────────────────────────────────

export const DEFAULT_ROOM: RoomConfig = {
  dimensions: {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 120,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  },
  doors: [
    {
      id: "door-1",
      side: "right-wall",
      positionMm: 900,
      widthMm: 900,
      heightMm: 2100,
      swingDirection: "in",
    },
  ],
  windows: [
    {
      id: "win-1",
      side: "back-wall",
      positionMm: -1500,
      widthMm: 1200,
      heightMm: 1200,
      sillHeightMm: 900,
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────

export function getWallHalfDimensions(room: RoomConfig): {
  halfW: number;
  halfD: number;
  halfH: number;
  halfThick: number;
} {
  return {
    halfW: room.dimensions.widthMm / 2,
    halfD: room.dimensions.depthMm / 2,
    halfH: room.dimensions.heightMm / 2,
    halfThick: room.dimensions.wallThicknessMm / 2,
  };
}

export function getDoorWorldBounds(door: RoomDoor, room: RoomConfig): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
} {
  const hw = room.dimensions.widthMm / 2;
  const hd = room.dimensions.depthMm / 2;
  const wallHalf = room.dimensions.wallThicknessMm / 2;

  switch (door.side) {
    case "back-wall": {
      const cx = door.positionMm;
      return {
        minX: cx - door.widthMm / 2,
        maxX: cx + door.widthMm / 2,
        minZ: -hd - wallHalf,
        maxZ: -hd + wallHalf,
        minY: 0,
        maxY: door.heightMm,
      };
    }
    case "left-wall": {
      const cz = door.positionMm;
      return {
        minX: -hw - wallHalf,
        maxX: -hw + wallHalf,
        minZ: cz - door.widthMm / 2,
        maxZ: cz + door.widthMm / 2,
        minY: 0,
        maxY: door.heightMm,
      };
    }
    case "right-wall": {
      const cz = door.positionMm;
      return {
        minX: hw - wallHalf,
        maxX: hw + wallHalf,
        minZ: cz - door.widthMm / 2,
        maxZ: cz + door.widthMm / 2,
        minY: 0,
        maxY: door.heightMm,
      };
    }
  }
}

export function getWindowWorldBounds(window: RoomWindow, room: RoomConfig): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
} {
  const hw = room.dimensions.widthMm / 2;
  const hd = room.dimensions.depthMm / 2;
  const wallHalf = room.dimensions.wallThicknessMm / 2;

  switch (window.side) {
    case "back-wall": {
      const cx = window.positionMm;
      return {
        minX: cx - window.widthMm / 2,
        maxX: cx + window.widthMm / 2,
        minZ: -hd - wallHalf,
        maxZ: -hd + wallHalf,
        minY: window.sillHeightMm,
        maxY: window.sillHeightMm + window.heightMm,
      };
    }
    case "left-wall": {
      const cz = window.positionMm;
      return {
        minX: -hw - wallHalf,
        maxX: -hw + wallHalf,
        minZ: cz - window.widthMm / 2,
        maxZ: cz + window.widthMm / 2,
        minY: window.sillHeightMm,
        maxY: window.sillHeightMm + window.heightMm,
      };
    }
    case "right-wall": {
      const cz = window.positionMm;
      return {
        minX: hw - wallHalf,
        maxX: hw + wallHalf,
        minZ: cz - window.widthMm / 2,
        maxZ: cz + window.widthMm / 2,
        minY: window.sillHeightMm,
        maxY: window.sillHeightMm + window.heightMm,
      };
    }
  }
}

// Check whether a cabinet overlaps a door or window opening
export function cabinetBlocksOpening(
  cabinet: CabinetInstance,
  room: RoomConfig,
): boolean {
  for (const door of room.doors) {
    const db = getDoorWorldBounds(door, room);
    const cb = getCabinetRoomBounds(cabinet);
    if (boundsOverlap(cb, db)) return true;
  }
  for (const window of room.windows) {
    const wb = getWindowWorldBounds(window, room);
    const cb = getCabinetRoomBounds(cabinet);
    if (boundsOverlap(cb, wb)) return true;
  }
  return false;
}

function getCabinetRoomBounds(cabinet: CabinetInstance): {
  minX: number; maxX: number; minZ: number; maxZ: number;
  minY: number; maxY: number;
} {
  return {
    minX: cabinet.placement.x - cabinet.config.dimensions.width / 2,
    maxX: cabinet.placement.x + cabinet.config.dimensions.width / 2,
    minZ: cabinet.placement.z - cabinet.config.dimensions.depth / 2,
    maxZ: cabinet.placement.z + cabinet.config.dimensions.depth / 2,
    minY: cabinet.placement.y,
    maxY: cabinet.placement.y + cabinet.config.dimensions.height,
  };
}

function boundsOverlap(
  a: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number },
): boolean {
  return !(
    a.maxX <= b.minX ||
    b.maxX <= a.minX ||
    a.maxZ <= b.minZ ||
    b.maxZ <= a.minZ ||
    a.maxY <= b.minY ||
    b.maxY <= a.minY
  );
}

// Min/max limits for room dimensions
export const ROOM_WIDTH_MIN_MM = 2000;
export const ROOM_WIDTH_MAX_MM = 12000;
export const ROOM_DEPTH_MIN_MM = 2000;
export const ROOM_DEPTH_MAX_MM = 12000;
export const ROOM_HEIGHT_MIN_MM = 2200;
export const ROOM_HEIGHT_MAX_MM = 3500;
export const WALL_THICKNESS_MIN_MM = 60;
export const WALL_THICKNESS_MAX_MM = 300;

export function clampRoomDimensions(dims: RoomDimensions): RoomDimensions {
  return {
    widthMm: Math.max(ROOM_WIDTH_MIN_MM, Math.min(ROOM_WIDTH_MAX_MM, dims.widthMm)),
    depthMm: Math.max(ROOM_DEPTH_MIN_MM, Math.min(ROOM_DEPTH_MAX_MM, dims.depthMm)),
    heightMm: Math.max(ROOM_HEIGHT_MIN_MM, Math.min(ROOM_HEIGHT_MAX_MM, dims.heightMm)),
    wallThicknessMm: Math.max(WALL_THICKNESS_MIN_MM, Math.min(WALL_THICKNESS_MAX_MM, dims.wallThicknessMm)),
    showBackWall: dims.showBackWall,
    showLeftWall: dims.showLeftWall,
    showRightWall: dims.showRightWall,
  };
}
