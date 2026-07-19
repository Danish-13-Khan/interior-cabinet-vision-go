export type CabinetType =
  | "base"
  | "wall"
  | "tall"
  | "almirah"
  | "table"
  | "chair"
  | "sofa"
  | "mirror";

export type CabinetDimensions = {
  width: number;
  height: number;
  depth: number;
  boardThickness: number;
  backPanelThickness: number;
};

export type CabinetConfig = {
  type: CabinetType;
  dimensions: CabinetDimensions;
  shelfCount: number;
  hasDoors: boolean;
  toeKickHeight: number;
  toeKickInset: number;
};

export type CabinetPlacement = {
  x: number;
  y: number;
  z: number;
  rotation: 0 | 90 | 180 | 270;
  attachment: "floor" | "back-wall" | "left-wall" | "right-wall";
};

export type CabinetInstance = {
  id: string;
  name: string;
  placement: CabinetPlacement;
  config: CabinetConfig;
};

export type CabinetProject = {
  version: number;
  cabinets: CabinetInstance[];
};

export const CABINET_WIDTH_MIN_MM = 500;
export const CABINET_WIDTH_MAX_MM = 1800;
export const CABINET_WIDTH_STEP_MM = 10;
export const CABINET_HEIGHT_MIN_MM = 400;
export const CABINET_HEIGHT_MAX_MM = 2400;
export const CABINET_HEIGHT_STEP_MM = 10;
export const CABINET_DEPTH_MIN_MM = 300;
export const CABINET_DEPTH_MAX_MM = 900;
export const CABINET_DEPTH_STEP_MM = 10;
export const CABINET_SHELF_MIN = 0;
export const CABINET_SHELF_MAX = 6;
export const CABINET_TOE_KICK_HEIGHT_MIN_MM = 80;
export const CABINET_TOE_KICK_HEIGHT_MAX_MM = 180;
export const CABINET_TOE_KICK_INSET_MIN_MM = 20;
export const CABINET_TOE_KICK_INSET_MAX_MM = 120;
export const CABINET_GRID_SNAP_MM = 50;
export const CABINET_CLEARANCE_MM = 20;
export const ROOM_WIDTH_MM = 6000;
export const ROOM_DEPTH_MM = 4000;
export const ROOM_HEIGHT_MM = 2800;

export const cabinetTypeLabels: Record<CabinetType, string> = {
  base: "Base Cabinet",
  wall: "Wall Cabinet",
  tall: "Tall Cabinet",
  almirah: "Almirah",
  table: "Table",
  chair: "Chair",
  sofa: "Sofa",
  mirror: "Mirror",
};

const cabinetTypePresets: Record<CabinetType, CabinetConfig> = {
  base: {
    type: "base",
    dimensions: {
      width: 900,
      height: 720,
      depth: 560,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 1,
    hasDoors: true,
    toeKickHeight: 100,
    toeKickInset: 60,
  },
  wall: {
    type: "wall",
    dimensions: {
      width: 900,
      height: 720,
      depth: 320,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 1,
    hasDoors: true,
    toeKickHeight: 0,
    toeKickInset: 0,
  },
  tall: {
    type: "tall",
    dimensions: {
      width: 600,
      height: 2100,
      depth: 600,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 4,
    hasDoors: true,
    toeKickHeight: 100,
    toeKickInset: 60,
  },
  almirah: {
    type: "almirah",
    dimensions: {
      width: 1200,
      height: 2200,
      depth: 600,
      boardThickness: 18,
      backPanelThickness: 6,
    },
    shelfCount: 4,
    hasDoors: true,
    toeKickHeight: 80,
    toeKickInset: 40,
  },
  table: {
    type: "table",
    dimensions: {
      width: 1400,
      height: 760,
      depth: 800,
      boardThickness: 36,
      backPanelThickness: 18,
    },
    shelfCount: 0,
    hasDoors: false,
    toeKickHeight: 0,
    toeKickInset: 0,
  },
  chair: {
    type: "chair",
    dimensions: {
      width: 500,
      height: 900,
      depth: 520,
      boardThickness: 30,
      backPanelThickness: 18,
    },
    shelfCount: 0,
    hasDoors: false,
    toeKickHeight: 0,
    toeKickInset: 0,
  },
  sofa: {
    type: "sofa",
    dimensions: {
      width: 1800,
      height: 820,
      depth: 900,
      boardThickness: 40,
      backPanelThickness: 30,
    },
    shelfCount: 0,
    hasDoors: false,
    toeKickHeight: 0,
    toeKickInset: 0,
  },
  mirror: {
    type: "mirror",
    dimensions: {
      width: 700,
      height: 1800,
      depth: 60,
      boardThickness: 40,
      backPanelThickness: 8,
    },
    shelfCount: 0,
    hasDoors: false,
    toeKickHeight: 0,
    toeKickInset: 0,
  },
};

export const defaultCabinetConfig = getDefaultCabinetConfig("base");

export const defaultCabinetProject: CabinetProject = {
  version: 1,
  cabinets: [
    {
      id: "cabinet-1",
      name: "Cabinet 1",
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: defaultCabinetConfig,
    },
  ],
};

export function getDefaultCabinetConfig(type: CabinetType): CabinetConfig {
  const preset = cabinetTypePresets[type];

  return {
    ...preset,
    dimensions: { ...preset.dimensions },
  };
}

export function isStorageType(type: CabinetType): boolean {
  return type === "base" || type === "wall" || type === "tall" || type === "almirah";
}

export function supportsShelves(type: CabinetType): boolean {
  return isStorageType(type);
}

export function supportsDoors(type: CabinetType): boolean {
  return isStorageType(type);
}

export function supportsToeKick(type: CabinetType): boolean {
  return type === "base" || type === "tall" || type === "almirah";
}

export function supportsWallPlacement(type: CabinetType): boolean {
  return type === "wall" || type === "mirror";
}

export function millimetresToMetres(valueInMillimetres: number): number {
  return valueInMillimetres / 1000;
}

export function normalizeRotationAngle(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(value / 90) * 90) % 360 + 360) % 360;

  if (normalized === 90 || normalized === 180 || normalized === 270) {
    return normalized;
  }

  return 0;
}

export function usesRotatedFootprint(rotation: number): boolean {
  const safeRotation = normalizeRotationAngle(rotation);
  return safeRotation === 90 || safeRotation === 270;
}

export function getFootprintDimensions(
  dimensions: CabinetDimensions,
  rotation: number,
): { width: number; depth: number } {
  return usesRotatedFootprint(rotation)
    ? { width: dimensions.depth, depth: dimensions.width }
    : { width: dimensions.width, depth: dimensions.depth };
}

export function getDefaultBottomOffsetMm(type: CabinetType): number {
  switch (type) {
    case "wall":
      return 1400;
    case "mirror":
      return 300;
    default:
      return 0;
  }
}

function isFiniteWithinRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function clampWithinRange(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampCabinetWidth(width: number): number {
  return clampWithinRange(
    width,
    CABINET_WIDTH_MIN_MM,
    CABINET_WIDTH_MAX_MM,
    defaultCabinetConfig.dimensions.width,
  );
}

export function clampCabinetHeight(height: number): number {
  return clampWithinRange(
    height,
    CABINET_HEIGHT_MIN_MM,
    CABINET_HEIGHT_MAX_MM,
    defaultCabinetConfig.dimensions.height,
  );
}

export function clampCabinetDepth(depth: number): number {
  return clampWithinRange(
    depth,
    CABINET_DEPTH_MIN_MM,
    CABINET_DEPTH_MAX_MM,
    defaultCabinetConfig.dimensions.depth,
  );
}

export function clampShelfCount(shelfCount: number): number {
  return Math.round(
    clampWithinRange(
      shelfCount,
      CABINET_SHELF_MIN,
      CABINET_SHELF_MAX,
      defaultCabinetConfig.shelfCount,
    ),
  );
}

export function clampToeKickHeight(toeKickHeight: number): number {
  return clampWithinRange(
    toeKickHeight,
    CABINET_TOE_KICK_HEIGHT_MIN_MM,
    CABINET_TOE_KICK_HEIGHT_MAX_MM,
    cabinetTypePresets.base.toeKickHeight,
  );
}

export function clampToeKickInset(toeKickInset: number): number {
  return clampWithinRange(
    toeKickInset,
    CABINET_TOE_KICK_INSET_MIN_MM,
    CABINET_TOE_KICK_INSET_MAX_MM,
    cabinetTypePresets.base.toeKickInset,
  );
}

export function clampCabinetDimensions(
  dimensions: CabinetDimensions,
): CabinetDimensions {
  return {
    ...dimensions,
    width: clampCabinetWidth(dimensions.width),
    height: clampCabinetHeight(dimensions.height),
    depth: clampCabinetDepth(dimensions.depth),
    boardThickness: Math.max(1, dimensions.boardThickness),
    backPanelThickness: Math.max(1, dimensions.backPanelThickness),
  };
}

export function clampCabinetConfig(config: CabinetConfig): CabinetConfig {
  const safeDimensions = clampCabinetDimensions(config.dimensions);
  const hasToeKick = supportsToeKick(config.type);
  const hasShelves = supportsShelves(config.type);
  const hasDoors = supportsDoors(config.type);

  return {
    ...config,
    dimensions: safeDimensions,
    shelfCount: hasShelves ? clampShelfCount(config.shelfCount) : 0,
    hasDoors: hasDoors ? Boolean(config.hasDoors) : false,
    toeKickHeight: hasToeKick ? clampToeKickHeight(config.toeKickHeight) : 0,
    toeKickInset: hasToeKick ? clampToeKickInset(config.toeKickInset) : 0,
  };
}

export function clampCabinetProject(project: CabinetProject): CabinetProject {
  return {
    version: 1,
    cabinets: project.cabinets.map((cabinet, index) => ({
      ...cabinet,
      id: cabinet.id || `cabinet-${index + 1}`,
      name: cabinet.name || `Cabinet ${index + 1}`,
      config: clampCabinetConfig(cabinet.config),
      placement: clampCabinetPlacement(
        {
          x: Number.isFinite(cabinet.placement?.x) ? cabinet.placement.x : index * 1200,
          y: Number.isFinite(cabinet.placement?.y)
            ? cabinet.placement.y
            : getDefaultBottomOffsetMm(cabinet.config?.type ?? "base"),
          z: Number.isFinite(cabinet.placement?.z) ? cabinet.placement.z : 0,
          rotation: normalizeRotationAngle(cabinet.placement?.rotation ?? 0),
          attachment:
            cabinet.placement?.attachment === "back-wall" ||
            cabinet.placement?.attachment === "left-wall" ||
            cabinet.placement?.attachment === "right-wall"
              ? cabinet.placement.attachment
              : "floor",
        },
        clampCabinetConfig(cabinet.config).dimensions,
      ),
    })),
  };
}

export function snapMillimetresToGrid(
  value: number,
  gridSize: number = CABINET_GRID_SNAP_MM,
): number {
  return Math.round(value / gridSize) * gridSize;
}

function getCabinetFootprint(
  cabinet: Pick<CabinetInstance, "placement" | "config">,
  dimensions: CabinetDimensions = cabinet.config.dimensions,
) {
  const footprint = getFootprintDimensions(dimensions, cabinet.placement.rotation);

  return {
    minX: cabinet.placement.x - footprint.width / 2,
    maxX: cabinet.placement.x + footprint.width / 2,
    minZ: cabinet.placement.z - footprint.depth / 2,
    maxZ: cabinet.placement.z + footprint.depth / 2,
  };
}

export function clampCabinetPlacement(
  placement: CabinetPlacement,
  dimensions: CabinetDimensions,
): CabinetPlacement {
  const rotation = normalizeRotationAngle(placement.rotation);
  const footprint = getFootprintDimensions(dimensions, rotation);
  const halfWidth = footprint.width / 2;
  const halfDepth = footprint.depth / 2;
  const attachment = placement.attachment;

  const clampedY = Math.min(
    Math.max(Number.isFinite(placement.y) ? placement.y : 0, 0),
    ROOM_HEIGHT_MM - dimensions.height,
  );

  const basePlacement: CabinetPlacement = {
    x: snapMillimetresToGrid(Number.isFinite(placement.x) ? placement.x : 0),
    y: snapMillimetresToGrid(clampedY),
    z: snapMillimetresToGrid(Number.isFinite(placement.z) ? placement.z : 0),
    rotation,
    attachment,
  };

  if (attachment === "back-wall") {
    return {
      ...basePlacement,
      x: Math.min(Math.max(basePlacement.x, -ROOM_WIDTH_MM / 2 + halfWidth), ROOM_WIDTH_MM / 2 - halfWidth),
      z: -ROOM_DEPTH_MM / 2 + halfDepth,
      rotation: 0,
    };
  }

  if (attachment === "left-wall") {
    return {
      ...basePlacement,
      x: -ROOM_WIDTH_MM / 2 + halfDepth,
      z: Math.min(Math.max(basePlacement.z, -ROOM_DEPTH_MM / 2 + halfWidth), ROOM_DEPTH_MM / 2 - halfWidth),
      rotation: 90,
    };
  }

  if (attachment === "right-wall") {
    return {
      ...basePlacement,
      x: ROOM_WIDTH_MM / 2 - halfDepth,
      z: Math.min(Math.max(basePlacement.z, -ROOM_DEPTH_MM / 2 + halfWidth), ROOM_DEPTH_MM / 2 - halfWidth),
      rotation: 270,
    };
  }

  return {
    ...basePlacement,
    y: 0,
    x: Math.min(Math.max(basePlacement.x, -ROOM_WIDTH_MM / 2 + halfWidth), ROOM_WIDTH_MM / 2 - halfWidth),
    z: Math.min(Math.max(basePlacement.z, -ROOM_DEPTH_MM / 2 + halfDepth), ROOM_DEPTH_MM / 2 - halfDepth),
  };
}

export function getWallPlacement(
  currentPlacement: CabinetPlacement,
  type: CabinetType,
  dimensions: CabinetDimensions,
  attachment: CabinetPlacement["attachment"],
): CabinetPlacement {
  return clampCabinetPlacement(
    {
      ...currentPlacement,
      attachment,
      y: attachment === "floor" ? 0 : currentPlacement.y || getDefaultBottomOffsetMm(type),
      rotation:
        attachment === "back-wall"
          ? 0
          : attachment === "left-wall"
            ? 90
            : attachment === "right-wall"
              ? 270
              : currentPlacement.rotation,
    },
    dimensions,
  );
}

export function cabinetsOverlap(
  first: Pick<CabinetInstance, "placement" | "config">,
  second: Pick<CabinetInstance, "placement" | "config">,
  clearanceMm: number = CABINET_CLEARANCE_MM,
  firstDimensions: CabinetDimensions = first.config.dimensions,
  secondDimensions: CabinetDimensions = second.config.dimensions,
): boolean {
  const a = getCabinetFootprint(first, firstDimensions);
  const b = getCabinetFootprint(second, secondDimensions);

  return !(
    a.maxX + clearanceMm <= b.minX ||
    b.maxX + clearanceMm <= a.minX ||
    a.maxZ + clearanceMm <= b.minZ ||
    b.maxZ + clearanceMm <= a.minZ
  );
}

export function projectHasCollision(
  project: CabinetProject,
  cabinetId: string,
  nextPlacement: CabinetPlacement,
  nextDimensions?: CabinetDimensions,
): boolean {
  const activeCabinet = project.cabinets.find((cabinet) => cabinet.id === cabinetId);

  if (!activeCabinet) {
    return false;
  }

  const candidateCabinet = {
    ...activeCabinet,
    placement: nextPlacement,
    config: {
      ...activeCabinet.config,
      dimensions: nextDimensions ?? activeCabinet.config.dimensions,
    },
  };

  return project.cabinets.some((cabinet) => {
    if (cabinet.id === cabinetId) {
      return false;
    }

    const candidateTop = candidateCabinet.placement.y + candidateCabinet.config.dimensions.height;
    const candidateBottom = candidateCabinet.placement.y;
    const otherTop = cabinet.placement.y + cabinet.config.dimensions.height;
    const otherBottom = cabinet.placement.y;

    if (
      candidateTop + CABINET_CLEARANCE_MM <= otherBottom ||
      otherTop + CABINET_CLEARANCE_MM <= candidateBottom
    ) {
      return false;
    }

    return cabinetsOverlap(candidateCabinet, cabinet);
  });
}

export function getCabinetValidationMessages(config: CabinetConfig): string[] {
  const safeConfig = clampCabinetConfig(config);
  const {
    width,
    height,
    depth,
    boardThickness,
    backPanelThickness,
  } = safeConfig.dimensions;
  const toeKickHeight = safeConfig.toeKickHeight;
  const openingWidth = width - boardThickness * 2;
  const openingHeight = height - boardThickness * 2 - toeKickHeight;
  const shelfDepth = depth - backPanelThickness - 30;
  const messages: string[] = [];

  if (!isStorageType(safeConfig.type)) {
    if (!isFiniteWithinRange(width, CABINET_WIDTH_MIN_MM, CABINET_WIDTH_MAX_MM)) {
      messages.push("Width was outside the safe range and has been clamped.");
    }

    if (width < 400 || depth < 300) {
      messages.push("This furniture piece is getting compact for comfortable use.");
    }

    if (height > 2200) {
      messages.push("Tall freestanding pieces may need wall fixing in a real room.");
    }

    return messages;
  }

  if (!isFiniteWithinRange(width, CABINET_WIDTH_MIN_MM, CABINET_WIDTH_MAX_MM)) {
    messages.push("Width was outside the safe range and has been clamped.");
  }

  if (openingWidth < 120) {
    messages.push("Internal width is too small for shelves or doors.");
  }

  if (openingHeight < 180) {
    messages.push("Internal height is too small after the top, bottom, and toe kick.");
  }

  if (shelfDepth < 120) {
    messages.push("Usable shelf depth is getting too shallow.");
  }

  if (safeConfig.shelfCount > 0) {
    const shelfSpacing = openingHeight / (safeConfig.shelfCount + 1);

    if (shelfSpacing < 140) {
      messages.push("Shelf count is high for the current cabinet height.");
    }
  }

  if (safeConfig.hasDoors && width < 450) {
    messages.push("Doors are narrow at this width.");
  }

  return messages;
}
