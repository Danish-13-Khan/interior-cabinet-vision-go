import type { CabinetInstance } from "./cabinetDimensions";
import type { CabinetConstruction } from "./cabinetConstruction";
import { defaultConstruction } from "./cabinetConstruction";
import type { ProductionCutlistLine } from "./productionCutlist";
import type { CabinetMaterialSpec } from "./materialSystem";
import {
  BOARD_MATERIALS,
  FINISHES,
  EDGE_BANDING_OPTIONS,
  DEFAULT_CABINET_MATERIAL,
  resolveCabinetMaterialSpec,
  type BoardMaterialId,
  type FinishId,
  type EdgeBandingId,
} from "./materialSystem";
import type { CostingSettings } from "./costingSettings";
import {
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
} from "./costingSettings";

export type { CostingSettings, CostingPreset } from "./costingSettings";
export {
  COSTING_PRESETS,
  DEFAULT_COSTING_SETTINGS,
  clampCostingSettings,
  getCostingPreset,
} from "./costingSettings";

export type HardwareItem = {
  id: string;
  label: string;
  costPerUnit: number;
};

export const HARDWARE_CATALOG: HardwareItem[] = [
  { id: "hinge-soft", label: "Soft-close hinge", costPerUnit: 85 },
  { id: "hinge-standard", label: "Standard hinge", costPerUnit: 25 },
  { id: "drawer-slide-soft", label: "Soft-close drawer slide (pair)", costPerUnit: 280 },
  { id: "drawer-slide-standard", label: "Standard drawer slide (pair)", costPerUnit: 120 },
  { id: "handle-bar", label: "Bar handle", costPerUnit: 95 },
  { id: "handle-knob", label: "Knob handle", costPerUnit: 40 },
  { id: "shelf-pin", label: "Shelf support pin", costPerUnit: 8 },
  { id: "leg-adj", label: "Adjustable leg", costPerUnit: 45 },
  { id: "connector", label: "Cam+dowel connector set", costPerUnit: 12 },
  { id: "screw-pack", label: "Screw pack (50pcs)", costPerUnit: 35 },
  { id: "wall-bracket", label: "Wall mounting bracket", costPerUnit: 55 },
];


function getBoardCost(materialId: BoardMaterialId, thicknessMm: number): number {
  const mat = BOARD_MATERIALS.find((item) => item.id === materialId);
  if (!mat) return 0;
  const keys = Object.keys(mat.costPerM2).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - thicknessMm) < Math.abs(prev - thicknessMm) ? curr : prev,
  );
  return mat.costPerM2[closest] ?? 0;
}

function getFinishCost(finishId: FinishId): number {
  return FINISHES.find((item) => item.id === finishId)?.costPerM2 ?? 0;
}

function getEdgeBandCost(edgeBandId: EdgeBandingId): number {
  return EDGE_BANDING_OPTIONS.find((item) => item.id === edgeBandId)?.costPerM ?? 0;
}

function hardwareUnitCost(id: string): number {
  return HARDWARE_CATALOG.find((item) => item.id === id)?.costPerUnit ?? 0;
}

function hardwareLabel(id: string): string {
  return HARDWARE_CATALOG.find((item) => item.id === id)?.label ?? id;
}

function partPerimeterMm(lengthMm: number, widthMm: number): number {
  return (lengthMm + widthMm) * 2;
}

function boardSpecForLine(
  line: ProductionCutlistLine,
  materials: CabinetMaterialSpec,
) {
  switch (line.category) {
    case "Door":
    case "DrawerFront":
      return materials.doorMaterial;
    case "Back":
      return materials.backMaterial;
    case "Shelf":
      return materials.shelfMaterial;
    case "DrawerBox":
      return materials.drawerBoxMaterial;
    default:
      return materials.carcassMaterial;
  }
}

export type HardwareLine = {
  id: string;
  label: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

function buildHardwareLines(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
  settings: CostingSettings,
): HardwareLine[] {
  const doorPart = construction.parts.find((part) => part.category === "Door");
  const drawerFrontPart = construction.parts.find((part) => part.category === "DrawerFront");
  const shelfPart = construction.parts.find((part) => part.category === "Shelf");
  const drawerBoxPartCount = construction.parts
    .filter((part) => part.category === "DrawerBox")
    .reduce((sum, part) => Math.max(sum, Math.ceil(part.quantity / 2)), 0);
  const doorCount = doorPart?.quantity ?? 0;
  const drawerFrontCount = drawerFrontPart?.quantity ?? 0;
  const shelfCount = shelfPart?.quantity ?? 0;

  const lines: HardwareLine[] = [];

  function push(id: string, quantity: number) {
    if (quantity <= 0) return;
    const unitCost = hardwareUnitCost(id);
    lines.push({
      id,
      label: hardwareLabel(id),
      quantity,
      unitCost,
      totalCost: Math.round(unitCost * quantity),
    });
  }

  push(settings.hingeId, doorCount * 2);
  push(settings.drawerSlideId, drawerBoxPartCount);
  push(settings.handleId, doorCount + drawerFrontCount);
  if (construction.constructionSpec.shelfMount === "adjustable-pins") {
    push("shelf-pin", shelfCount * 4);
  }
  push("connector", 8);
  push("screw-pack", 1);
  if (cabinet.placement.attachment === "floor") {
    push("leg-adj", 4);
  } else {
    push("wall-bracket", 2);
  }

  return lines;
}

export type CabinetCost = {
  cabinetId: string;
  cabinetName: string;
  boardCost: number;
  wasteCost: number;
  materialCost: number;
  hardwareCost: number;
  finishCost: number;
  edgeBandCost: number;
  labourCost: number;
  totalCost: number;
  hardwareLines: HardwareLine[];
  breakdown: string[];
};

export function calculateCabinetCost(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
  lines: ProductionCutlistLine[],
  materials: CabinetMaterialSpec = DEFAULT_CABINET_MATERIAL,
  settings: CostingSettings = DEFAULT_COSTING_SETTINGS,
): CabinetCost {
  const safeSettings = clampCostingSettings(settings);
  let boardCost = 0;
  let edgeBandCost = 0;
  let finishCost = 0;
  const breakdown: string[] = [];

  for (const line of lines) {
    const areaM2 = (line.lengthMm * line.widthMm * line.quantity) / 1_000_000;
    const spec = boardSpecForLine(line, materials);
    boardCost +=
      getBoardCost(spec.boardMaterialId, line.thicknessMm) *
      areaM2 *
      safeSettings.materialRateMultiplier;
    finishCost +=
      getFinishCost(spec.finishId) * areaM2 * safeSettings.finishRateMultiplier;
    if (spec.edgeBandingId !== "none") {
      const perimeter = partPerimeterMm(line.lengthMm, line.widthMm);
      edgeBandCost +=
        (getEdgeBandCost(spec.edgeBandingId) * perimeter) / 1000 * line.quantity;
    }
  }

  const wasteCost = boardCost * (safeSettings.wastePercent / 100);
  const hardwareLines = buildHardwareLines(cabinet, construction, safeSettings);
  const hardwareCost = hardwareLines.reduce((sum, line) => sum + line.totalCost, 0);
  const labourCost = (boardCost + wasteCost) * (safeSettings.labourPercent / 100);
  const materialTotal = boardCost + wasteCost + finishCost + edgeBandCost;
  const total = materialTotal + hardwareCost + labourCost;

  breakdown.push(`Board: ₹${Math.round(boardCost).toLocaleString()}`);
  if (wasteCost > 0) {
    breakdown.push(`Waste ${safeSettings.wastePercent}%: ₹${Math.round(wasteCost).toLocaleString()}`);
  }
  breakdown.push(`Finishes: ₹${Math.round(finishCost).toLocaleString()}`);
  breakdown.push(`Edge banding: ₹${Math.round(edgeBandCost).toLocaleString()}`);
  breakdown.push(`Hardware: ₹${Math.round(hardwareCost).toLocaleString()}`);
  breakdown.push(`Labour ${safeSettings.labourPercent}%: ₹${Math.round(labourCost).toLocaleString()}`);

  return {
    cabinetId: cabinet.id,
    cabinetName: cabinet.name,
    boardCost: Math.round(boardCost),
    wasteCost: Math.round(wasteCost),
    materialCost: Math.round(materialTotal),
    hardwareCost: Math.round(hardwareCost),
    finishCost: Math.round(finishCost),
    edgeBandCost: Math.round(edgeBandCost),
    labourCost: Math.round(labourCost),
    totalCost: Math.round(total),
    hardwareLines,
    breakdown,
  };
}

export type ProjectCost = {
  cabinets: CabinetCost[];
  totalMaterial: number;
  totalHardware: number;
  totalLabour: number;
  totalWaste: number;
  totalFinish: number;
  hardwareAllowance: number;
  labourAllowance: number;
  grandTotal: number;
  settings: CostingSettings;
};

export function calculateProjectCost(
  cabinets: CabinetInstance[],
  constructionMap: Map<string, CabinetConstruction>,
  cutlistMap: Map<string, ProductionCutlistLine[]>,
  materials: CabinetMaterialSpec = DEFAULT_CABINET_MATERIAL,
  settings: CostingSettings = DEFAULT_COSTING_SETTINGS,
): ProjectCost {
  const safeSettings = clampCostingSettings(settings);
  let totalMaterial = 0;
  let totalHardware = 0;
  let totalLabour = 0;
  let totalWaste = 0;
  let totalFinish = 0;
  const costs: CabinetCost[] = [];

  for (const cab of cabinets) {
    const construction =
      constructionMap.get(cab.id) ?? defaultConstruction(cab.config.dimensions);
    const cutlist = cutlistMap.get(cab.id) ?? [];
    const resolvedMaterials = cab.config.buildRules
      ? resolveCabinetMaterialSpec(cab.config.buildRules)
      : materials;
    const cost = calculateCabinetCost(
      cab,
      construction,
      cutlist,
      resolvedMaterials,
      safeSettings,
    );
    costs.push(cost);
    totalMaterial += cost.materialCost;
    totalHardware += cost.hardwareCost;
    totalLabour += cost.labourCost;
    totalWaste += cost.wasteCost;
    totalFinish += cost.finishCost;
  }

  const hardwareAllowance = safeSettings.hardwareAllowance;
  const labourAllowance = safeSettings.labourAllowance;
  return {
    cabinets: costs,
    totalMaterial: Math.round(totalMaterial),
    totalHardware: Math.round(totalHardware),
    totalLabour: Math.round(totalLabour),
    totalWaste: Math.round(totalWaste),
    totalFinish: Math.round(totalFinish),
    hardwareAllowance,
    labourAllowance,
    grandTotal: Math.round(
      totalMaterial + totalHardware + totalLabour + hardwareAllowance + labourAllowance,
    ),
    settings: safeSettings,
  };
}
