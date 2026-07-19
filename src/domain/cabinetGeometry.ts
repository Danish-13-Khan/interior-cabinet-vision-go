import {
  clampCabinetConfig,
  type CabinetInstance,
  type CabinetProject,
  isStorageType,
  millimetresToMetres,
  type CabinetConfig,
} from "./cabinetDimensions";

export type PanelName = string;
export type Vector3Tuple = [number, number, number];

export type CabinetPanelGeometry = {
  name: PanelName;
  label: string;
  size: Vector3Tuple;
  position: Vector3Tuple;
  material: "board" | "back" | "door";
};

export type CabinetDimensionGuide = {
  id: "width" | "height" | "depth";
  label: string;
  points: [Vector3Tuple, Vector3Tuple];
  labelPosition: Vector3Tuple;
};

export type CabinetCutlistItem = {
  key: string;
  label: string;
  quantity: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  material: "Board" | "Back Panel" | "Door";
};

export type CabinetDerivedMetrics = {
  openingWidthMm: number;
  openingHeightMm: number;
  usableShelfDepthMm: number;
  estimatedPanelCount: number;
};

export type CabinetSceneItem = CabinetInstance & {
  metrics: CabinetDerivedMetrics;
  panels: CabinetPanelGeometry[];
};

function toPanelLabel(name: string): string {
  return name
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getPanelDisplayName(name: PanelName): string {
  return toPanelLabel(name);
}

function getCabinetMeasurements(config: CabinetConfig) {
  const safeConfig = clampCabinetConfig(config);
  const { dimensions, shelfCount, toeKickHeight, toeKickInset, hasDoors } =
    safeConfig;
  const outerWidth = millimetresToMetres(dimensions.width);
  const outerHeight = millimetresToMetres(dimensions.height);
  const outerDepth = millimetresToMetres(dimensions.depth);
  const boardThickness = millimetresToMetres(dimensions.boardThickness);
  const backPanelThickness = millimetresToMetres(dimensions.backPanelThickness);
  const toeKickHeightM = millimetresToMetres(toeKickHeight);
  const toeKickInsetM = millimetresToMetres(toeKickInset);
  const innerWidth = outerWidth - boardThickness * 2;
  const topY = outerHeight / 2 - boardThickness / 2;
  const bottomY =
    -outerHeight / 2 + toeKickHeightM + boardThickness / 2;
  const openingBottomY = bottomY + boardThickness / 2;
  const openingTopY = topY - boardThickness / 2;
  const openingHeight = openingTopY - openingBottomY;
  const backPanelHeight = openingHeight;
  const backPanelY = openingBottomY + openingHeight / 2;
  const usableShelfDepth =
    outerDepth - backPanelThickness - millimetresToMetres(30);
  const shelfCenterZ = -outerDepth / 2 + backPanelThickness + usableShelfDepth / 2;
  const frontDoorGap = millimetresToMetres(4);
  const doorBottomY =
    -outerHeight / 2 +
    (toeKickHeightM > 0 ? toeKickHeightM + frontDoorGap : frontDoorGap);
  const doorTopY = outerHeight / 2 - frontDoorGap;
  const doorHeight = doorTopY - doorBottomY;
  const doorWidth = (outerWidth - frontDoorGap * 3) / 2;

  return {
    safeConfig,
    dimensions,
    shelfCount,
    hasDoors,
    outerWidth,
    outerHeight,
    outerDepth,
    boardThickness,
    backPanelThickness,
    toeKickHeightM,
    toeKickInsetM,
    innerWidth,
    topY,
    bottomY,
    openingBottomY,
    openingHeight,
    backPanelHeight,
    backPanelY,
    usableShelfDepth,
    shelfCenterZ,
    doorWidth,
    doorHeight,
    doorCenterY: doorBottomY + doorHeight / 2,
  };
}

function createFreestandingGeometry(config: CabinetConfig): CabinetPanelGeometry[] {
  const safeConfig = clampCabinetConfig(config);
  const { width, height, depth, boardThickness, backPanelThickness } = safeConfig.dimensions;
  const outerWidth = millimetresToMetres(width);
  const outerHeight = millimetresToMetres(height);
  const outerDepth = millimetresToMetres(depth);
  const board = millimetresToMetres(boardThickness);
  const accent = millimetresToMetres(Math.max(backPanelThickness, 12));

  switch (safeConfig.type) {
    case "table": {
      const legSize = Math.min(board, 0.08);
      const topThickness = Math.max(board, 0.03);
      const topY = outerHeight / 2 - topThickness / 2;
      const legHeight = outerHeight - topThickness;
      const legY = -outerHeight / 2 + legHeight / 2;
      const legInsetX = outerWidth / 2 - legSize * 1.15;
      const legInsetZ = outerDepth / 2 - legSize * 1.15;

      return [
        {
          name: "table-top",
          label: "Table Top",
          size: [outerWidth, topThickness, outerDepth],
          position: [0, topY, 0],
          material: "board",
        },
        ...[
          [-legInsetX, legY, -legInsetZ],
          [legInsetX, legY, -legInsetZ],
          [-legInsetX, legY, legInsetZ],
          [legInsetX, legY, legInsetZ],
        ].map((position, index) => ({
          name: `leg-${index + 1}`,
          label: `Leg ${index + 1}`,
          size: [legSize, legHeight, legSize] as Vector3Tuple,
          position: position as Vector3Tuple,
          material: "board" as const,
        })),
      ];
    }
    case "chair": {
      const seatThickness = Math.max(board, 0.028);
      const legSize = Math.min(board * 0.75, 0.05);
      const seatWidth = outerWidth;
      const seatDepth = outerDepth * 0.7;
      const seatY = -outerHeight / 2 + outerHeight * 0.48;
      const legHeight = seatY - seatThickness / 2 + outerHeight / 2;
      const backHeight = outerHeight - legHeight - seatThickness;
      const backY = seatY + seatThickness / 2 + backHeight / 2;
      const legInsetX = seatWidth / 2 - legSize * 1.2;
      const legInsetZ = seatDepth / 2 - legSize * 1.2;
      const backZ = -(outerDepth / 2) + board / 2;

      return [
        {
          name: "seat",
          label: "Seat",
          size: [seatWidth, seatThickness, seatDepth],
          position: [0, seatY, 0],
          material: "board",
        },
        {
          name: "back-rest",
          label: "Back Rest",
          size: [seatWidth, backHeight, board],
          position: [0, backY, backZ],
          material: "back",
        },
        ...[
          [-legInsetX, -outerHeight / 2 + legHeight / 2, -legInsetZ],
          [legInsetX, -outerHeight / 2 + legHeight / 2, -legInsetZ],
          [-legInsetX, -outerHeight / 2 + legHeight / 2, legInsetZ],
          [legInsetX, -outerHeight / 2 + legHeight / 2, legInsetZ],
        ].map((position, index) => ({
          name: `leg-${index + 1}`,
          label: `Leg ${index + 1}`,
          size: [legSize, legHeight, legSize] as Vector3Tuple,
          position: position as Vector3Tuple,
          material: "board" as const,
        })),
      ];
    }
    case "sofa": {
      const baseHeight = outerHeight * 0.34;
      const seatHeight = outerHeight * 0.14;
      const armWidth = Math.min(outerWidth * 0.12, 0.14);
      const backHeight = outerHeight * 0.62;
      const backThickness = Math.min(outerDepth * 0.18, 0.16);

      return [
        {
          name: "base",
          label: "Base",
          size: [outerWidth, baseHeight, outerDepth],
          position: [0, -outerHeight / 2 + baseHeight / 2, 0],
          material: "board",
        },
        {
          name: "seat-cushion",
          label: "Seat Cushion",
          size: [outerWidth - armWidth * 2, seatHeight, outerDepth * 0.68],
          position: [0, -outerHeight / 2 + baseHeight + seatHeight / 2, outerDepth * 0.05],
          material: "door",
        },
        {
          name: "back-rest",
          label: "Back Rest",
          size: [outerWidth, backHeight, backThickness],
          position: [0, -outerHeight / 2 + baseHeight + backHeight / 2, -(outerDepth / 2) + backThickness / 2],
          material: "back",
        },
        {
          name: "left-arm",
          label: "Left Arm",
          size: [armWidth, backHeight, outerDepth * 0.92],
          position: [-(outerWidth / 2) + armWidth / 2, -outerHeight / 2 + baseHeight + backHeight / 2, 0],
          material: "board",
        },
        {
          name: "right-arm",
          label: "Right Arm",
          size: [armWidth, backHeight, outerDepth * 0.92],
          position: [(outerWidth / 2) - armWidth / 2, -outerHeight / 2 + baseHeight + backHeight / 2, 0],
          material: "board",
        },
      ];
    }
    case "mirror": {
      const frame = Math.min(board, Math.min(outerWidth, outerHeight) * 0.1);
      const glassThickness = Math.max(accent, 0.012);
      const frameDepth = Math.max(board, 0.03);

      return [
        {
          name: "mirror-glass",
          label: "Mirror Glass",
          size: [outerWidth - frame * 2, outerHeight - frame * 2, glassThickness],
          position: [0, 0, 0],
          material: "door",
        },
        {
          name: "frame-left",
          label: "Frame Left",
          size: [frame, outerHeight, frameDepth],
          position: [-(outerWidth / 2) + frame / 2, 0, 0],
          material: "board",
        },
        {
          name: "frame-right",
          label: "Frame Right",
          size: [frame, outerHeight, frameDepth],
          position: [(outerWidth / 2) - frame / 2, 0, 0],
          material: "board",
        },
        {
          name: "frame-top",
          label: "Frame Top",
          size: [outerWidth - frame * 2, frame, frameDepth],
          position: [0, outerHeight / 2 - frame / 2, 0],
          material: "board",
        },
        {
          name: "frame-bottom",
          label: "Frame Bottom",
          size: [outerWidth - frame * 2, frame, frameDepth],
          position: [0, -(outerHeight / 2) + frame / 2, 0],
          material: "board",
        },
      ];
    }
    default:
      return [];
  }
}

export function createCabinetGeometry(
  config: CabinetConfig,
): CabinetPanelGeometry[] {
  if (!isStorageType(config.type)) {
    return createFreestandingGeometry(config);
  }

  const {
    shelfCount,
    hasDoors,
    outerWidth,
    outerHeight,
    outerDepth,
    boardThickness,
    backPanelThickness,
    toeKickHeightM,
    toeKickInsetM,
    innerWidth,
    topY,
    bottomY,
    openingBottomY,
    openingHeight,
    backPanelHeight,
    backPanelY,
    usableShelfDepth,
    shelfCenterZ,
    doorWidth,
    doorHeight,
    doorCenterY,
  } = getCabinetMeasurements(config);

  const panels: CabinetPanelGeometry[] = [
    {
      name: "left-side-panel",
      label: "Left Side Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [-(outerWidth / 2) + boardThickness / 2, 0, 0],
      material: "board",
    },
    {
      name: "right-side-panel",
      label: "Right Side Panel",
      size: [boardThickness, outerHeight, outerDepth],
      position: [(outerWidth / 2) - boardThickness / 2, 0, 0],
      material: "board",
    },
    {
      name: "top-panel",
      label: "Top Panel",
      size: [innerWidth, boardThickness, outerDepth],
      position: [0, topY, 0],
      material: "board",
    },
    {
      name: "bottom-panel",
      label: "Bottom Panel",
      size: [innerWidth, boardThickness, outerDepth],
      position: [0, bottomY, 0],
      material: "board",
    },
    {
      name: "back-panel",
      label: "Back Panel",
      size: [innerWidth, backPanelHeight, backPanelThickness],
      position: [0, backPanelY, -(outerDepth / 2) + backPanelThickness / 2],
      material: "back",
    },
  ];

  if (toeKickHeightM > 0) {
    panels.push({
      name: "toe-kick",
      label: "Toe Kick",
      size: [innerWidth, toeKickHeightM, boardThickness],
      position: [
        0,
        -(outerHeight / 2) + toeKickHeightM / 2,
        outerDepth / 2 - toeKickInsetM - boardThickness / 2,
      ],
      material: "board",
    });
  }

  if (shelfCount > 0) {
    const shelfSpacing = openingHeight / (shelfCount + 1);

    for (let index = 0; index < shelfCount; index += 1) {
      panels.push({
        name: `shelf-${index + 1}`,
        label: `Shelf ${index + 1}`,
        size: [innerWidth, boardThickness, usableShelfDepth],
        position: [
          0,
          openingBottomY + shelfSpacing * (index + 1),
          shelfCenterZ,
        ],
        material: "board",
      });
    }
  }

  if (hasDoors) {
    const doorZ = outerDepth / 2 + boardThickness / 2;
    const doorOffsetX = outerWidth / 4 + millimetresToMetres(1);

    panels.push(
      {
        name: "left-door",
        label: "Left Door",
        size: [doorWidth, doorHeight, boardThickness],
        position: [-doorOffsetX, doorCenterY, doorZ],
        material: "door",
      },
      {
        name: "right-door",
        label: "Right Door",
        size: [doorWidth, doorHeight, boardThickness],
        position: [doorOffsetX, doorCenterY, doorZ],
        material: "door",
      },
    );
  }

  return panels;
}

export function createCabinetDimensionGuides(
  config: CabinetConfig,
): CabinetDimensionGuide[] {
  const { safeConfig, outerWidth, outerHeight, outerDepth } =
    getCabinetMeasurements(config);

  const widthGuideY = -(outerHeight / 2) - 0.11;
  const widthGuideZ = (outerDepth / 2) + 0.08;
  const heightGuideX = -(outerWidth / 2) - 0.12;
  const heightGuideZ = (outerDepth / 2) + 0.05;
  const depthGuideX = (outerWidth / 2) + 0.12;
  const depthGuideY = -(outerHeight / 2) - 0.01;

  return [
    {
      id: "width",
      label: `${safeConfig.dimensions.width} mm`,
      points: [
        [-(outerWidth / 2), widthGuideY, widthGuideZ],
        [outerWidth / 2, widthGuideY, widthGuideZ],
      ],
      labelPosition: [0, widthGuideY - 0.04, widthGuideZ],
    },
    {
      id: "height",
      label: `${safeConfig.dimensions.height} mm`,
      points: [
        [heightGuideX, -(outerHeight / 2), heightGuideZ],
        [heightGuideX, outerHeight / 2, heightGuideZ],
      ],
      labelPosition: [heightGuideX - 0.08, 0, heightGuideZ],
    },
    {
      id: "depth",
      label: `${safeConfig.dimensions.depth} mm`,
      points: [
        [depthGuideX, depthGuideY, -(outerDepth / 2)],
        [depthGuideX, depthGuideY, outerDepth / 2],
      ],
      labelPosition: [depthGuideX + 0.08, depthGuideY, 0],
    },
  ];
}

export function createCabinetCutlist(
  config: CabinetConfig,
): CabinetCutlistItem[] {
  const safeConfig = clampCabinetConfig(config);

  if (!isStorageType(safeConfig.type)) {
    const { width, height, depth, boardThickness, backPanelThickness } = safeConfig.dimensions;

    switch (safeConfig.type) {
      case "table":
        return [
          {
            key: "table-top",
            label: "Table Top",
            quantity: 1,
            lengthMm: width,
            widthMm: depth,
            thicknessMm: boardThickness,
            material: "Board",
          },
          {
            key: "table-legs",
            label: "Table Leg",
            quantity: 4,
            lengthMm: height - boardThickness,
            widthMm: Math.min(boardThickness, 80),
            thicknessMm: Math.min(boardThickness, 80),
            material: "Board",
          },
        ];
      case "chair":
        return [
          {
            key: "chair-seat",
            label: "Chair Seat",
            quantity: 1,
            lengthMm: width,
            widthMm: Math.round(depth * 0.7),
            thicknessMm: boardThickness,
            material: "Board",
          },
          {
            key: "chair-back",
            label: "Chair Back",
            quantity: 1,
            lengthMm: Math.round(height * 0.42),
            widthMm: width,
            thicknessMm: boardThickness,
            material: "Board",
          },
          {
            key: "chair-legs",
            label: "Chair Leg",
            quantity: 4,
            lengthMm: Math.round(height * 0.45),
            widthMm: Math.min(boardThickness, 50),
            thicknessMm: Math.min(boardThickness, 50),
            material: "Board",
          },
        ];
      case "sofa":
        return [
          {
            key: "sofa-base",
            label: "Sofa Base",
            quantity: 1,
            lengthMm: width,
            widthMm: depth,
            thicknessMm: boardThickness,
            material: "Board",
          },
          {
            key: "sofa-arms",
            label: "Sofa Arm",
            quantity: 2,
            lengthMm: height,
            widthMm: depth,
            thicknessMm: Math.round(width * 0.12),
            material: "Board",
          },
          {
            key: "sofa-back",
            label: "Sofa Back",
            quantity: 1,
            lengthMm: width,
            widthMm: Math.round(height * 0.62),
            thicknessMm: Math.round(depth * 0.18),
            material: "Back Panel",
          },
        ];
      case "mirror":
        return [
          {
            key: "mirror-glass",
            label: "Mirror Glass",
            quantity: 1,
            lengthMm: width,
            widthMm: height,
            thicknessMm: backPanelThickness,
            material: "Door",
          },
          {
            key: "mirror-frame",
            label: "Mirror Frame",
            quantity: 4,
            lengthMm: height,
            widthMm: Math.round(Math.min(boardThickness, width * 0.1)),
            thicknessMm: boardThickness,
            material: "Board",
          },
        ];
      default:
        return [];
    }
  }

  const { innerWidth, openingHeight, usableShelfDepth } =
    getCabinetMeasurements(config);
  const { dimensions, shelfCount, hasDoors, toeKickHeight } = safeConfig;

  const items: CabinetCutlistItem[] = [
    {
      key: "side-panels",
      label: "Side Panel",
      quantity: 2,
      lengthMm: dimensions.height,
      widthMm: dimensions.depth,
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    },
    {
      key: "top-bottom-panels",
      label: "Top / Bottom Panel",
      quantity: 2,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: dimensions.depth,
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    },
    {
      key: "back-panel",
      label: "Back Panel",
      quantity: 1,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: Math.round(openingHeight * 1000),
      thicknessMm: dimensions.backPanelThickness,
      material: "Back Panel",
    },
  ];

  if (toeKickHeight > 0) {
    items.push({
      key: "toe-kick",
      label: "Toe Kick",
      quantity: 1,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: toeKickHeight,
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    });
  }

  if (shelfCount > 0) {
    items.push({
      key: "shelves",
      label: "Adjustable Shelf",
      quantity: shelfCount,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: Math.round(usableShelfDepth * 1000),
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    });
  }

  if (hasDoors) {
    const doorGapMm = 4;
    const doorWidthMm = Math.round((dimensions.width - doorGapMm * 3) / 2);
    const doorHeightMm = Math.round(
      dimensions.height - (toeKickHeight > 0 ? toeKickHeight : 0) - doorGapMm * 2,
    );

    items.push({
      key: "doors",
      label: "Door",
      quantity: 2,
      lengthMm: doorHeightMm,
      widthMm: doorWidthMm,
      thicknessMm: dimensions.boardThickness,
      material: "Door",
    });
  }

  return items;
}

export function createCabinetDerivedMetrics(
  config: CabinetConfig,
): CabinetDerivedMetrics {
  const safeConfig = clampCabinetConfig(config);

  if (!isStorageType(safeConfig.type)) {
    return {
      openingWidthMm: safeConfig.dimensions.width,
      openingHeightMm: safeConfig.dimensions.height,
      usableShelfDepthMm: safeConfig.dimensions.depth,
      estimatedPanelCount: createCabinetGeometry(safeConfig).length,
    };
  }

  const { safeConfig: measuredConfig, innerWidth, openingHeight, usableShelfDepth } =
    getCabinetMeasurements(config);

  return {
    openingWidthMm: Math.round(innerWidth * 1000),
    openingHeightMm: Math.round(openingHeight * 1000),
    usableShelfDepthMm: Math.round(usableShelfDepth * 1000),
    estimatedPanelCount: createCabinetGeometry(measuredConfig).length,
  };
}

export function createCabinetSceneItem(cabinet: CabinetInstance): CabinetSceneItem {
  return {
    ...cabinet,
    config: clampCabinetConfig(cabinet.config),
    panels: createCabinetGeometry(cabinet.config),
    metrics: createCabinetDerivedMetrics(cabinet.config),
  };
}

export function createProjectCutlist(project: CabinetProject): CabinetCutlistItem[] {
  const groupedItems = new Map<string, CabinetCutlistItem>();

  for (const cabinet of project.cabinets) {
    const items = createCabinetCutlist(cabinet.config);

    for (const item of items) {
      const existing = groupedItems.get(item.key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        groupedItems.set(item.key, { ...item });
      }
    }
  }

  return Array.from(groupedItems.values());
}
