import {
  clampCabinetConfig,
  isStorageType,
  type CabinetConfig,
  type CabinetProject,
} from "../cabinetDimensions";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetCutlistItem } from "./types";

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
  const drawerCount = safeConfig.drawerCount ?? 0;

  const items: CabinetCutlistItem[] = [
    {
      key: "side-panels",
      label: "Side Panel",
      quantity: safeConfig.type === "corner" ? 3 : 2,
      lengthMm: dimensions.height,
      widthMm: dimensions.depth,
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    },
    {
      key: "top-bottom-panels",
      label: safeConfig.type === "sink" ? "Bottom / Rail Panel" : "Top / Bottom Panel",
      quantity: safeConfig.type === "sink" ? 3 : 2,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: safeConfig.type === "sink" ? Math.round(Math.min(dimensions.depth * 0.16, 90)) : dimensions.depth,
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

  if (drawerCount > 0) {
    items.push({
      key: "drawer-fronts",
      label: "Drawer Front",
      quantity: drawerCount,
      lengthMm: Math.round(dimensions.height / Math.max(drawerCount, 1)),
      widthMm: dimensions.width - 8,
      thicknessMm: dimensions.boardThickness,
      material: "Door",
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

  if (safeConfig.leftEndPanel || safeConfig.rightEndPanel) {
    items.push({
      key: "end-panels",
      label: "End Panel",
      quantity: Number(safeConfig.leftEndPanel) + Number(safeConfig.rightEndPanel),
      lengthMm: dimensions.height,
      widthMm: dimensions.depth,
      thicknessMm: dimensions.boardThickness,
      material: "Board",
    });
  }

  return items;
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
