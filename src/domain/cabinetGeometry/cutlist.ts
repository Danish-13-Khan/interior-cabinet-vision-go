import {
  clampCabinetConfig,
  isStorageType,
  type CabinetConfig,
  type CabinetProject,
} from "../cabinetDimensions";
import { resolveCabinetBuildRules } from "../cabinetConstruction/buildRules";
import { freestandingCutlist } from "./freestandingCutlist";
import { frontCutlistItems } from "./frontCutlist";
import { getCabinetMeasurements } from "./measurements";
import type { CabinetCutlistItem } from "./types";

export function createCabinetCutlist(
  config: CabinetConfig,
): CabinetCutlistItem[] {
  const safeConfig = clampCabinetConfig(config);

  if (!isStorageType(safeConfig.type)) return freestandingCutlist(safeConfig);

  const { innerWidth, openingHeight, usableShelfDepth } =
    getCabinetMeasurements(config);
  const { dimensions, shelfCount, toeKickHeight } = safeConfig;
  const rules = resolveCabinetBuildRules(safeConfig);

  const items: CabinetCutlistItem[] = [
    {
      key: "side-panels",
      label: "Side Panel",
      quantity: safeConfig.type === "corner" ? 3 : 2,
      lengthMm: dimensions.height,
      widthMm: dimensions.depth,
      thicknessMm: rules.carcassThicknessMm,
      material: "Board",
    },
    {
      key: "top-bottom-panels",
      label: safeConfig.type === "sink" ? "Bottom / Rail Panel" : "Top / Bottom Panel",
      quantity: safeConfig.type === "sink" ? 3 : 2,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: safeConfig.type === "sink" ? Math.round(Math.min(dimensions.depth * 0.16, 90)) : dimensions.depth,
      thicknessMm: rules.carcassThicknessMm,
      material: "Board",
    },
    {
      key: "back-panel",
      label: "Back Panel",
      quantity: 1,
      lengthMm: Math.round(innerWidth * 1000),
      widthMm: Math.round(openingHeight * 1000),
      thicknessMm: rules.backPanelThicknessMm,
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
      thicknessMm: rules.carcassThicknessMm,
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
      thicknessMm: rules.shelfThicknessMm,
      material: "Board",
    });
  }

  items.push(...frontCutlistItems(safeConfig));

  if (safeConfig.leftEndPanel || safeConfig.rightEndPanel) {
    items.push({
      key: "end-panels",
      label: "End Panel",
      quantity: Number(safeConfig.leftEndPanel) + Number(safeConfig.rightEndPanel),
      lengthMm: dimensions.height,
      widthMm: dimensions.depth,
      thicknessMm: rules.carcassThicknessMm,
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
