// ── Cabinet Costing ──────────────────────────────────────────

import type { CabinetInstance } from "./cabinetDimensions";
import type { CabinetCutlistItem } from "./cabinetGeometry";
import type { CabinetConstruction } from "./cabinetConstruction";
import { defaultConstruction } from "./cabinetConstruction";
import type { CabinetMaterialSpec } from "./materialSystem";
import {
  BOARD_MATERIALS,
  FINISHES,
  EDGE_BANDING_OPTIONS,
  DEFAULT_CABINET_MATERIAL,
  type BoardMaterialId,
  type FinishId,
  type EdgeBandingId,
} from "./materialSystem";

// ── Hardware ──────────────────────────────────────────────────

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

// ── Costing Helpers ───────────────────────────────────────────

function getBoardCost(materialId: BoardMaterialId, thicknessMm: number): number {
  const mat = BOARD_MATERIALS.find((m) => m.id === materialId);
  if (!mat) return 0;
  // Find closest thickness
  const keys = Object.keys(mat.costPerM2).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - thicknessMm) < Math.abs(prev - thicknessMm) ? curr : prev
  );
  return mat.costPerM2[closest] ?? 0;
}

function getFinishCost(finishId: FinishId): number {
  return FINISHES.find((f) => f.id === finishId)?.costPerM2 ?? 0;
}

function getEdgeBandCost(edgeBandId: EdgeBandingId): number {
  return EDGE_BANDING_OPTIONS.find((e) => e.id === edgeBandId)?.costPerM ?? 0;
}

// ── Perimeter for edge banding ────────────────────────────────

function partPerimeterMm(lengthMm: number, widthMm: number, edgeBandedSides: number = 4): number {
  // Assume all 4 sides banded by default, or 2 long sides
  if (edgeBandedSides === 2) return lengthMm * 2;
  return (lengthMm + widthMm) * 2;
}

// ── Hardware count per cabinet ────────────────────────────────

function countHardware(cabinet: CabinetInstance, construction: CabinetConstruction): number {
  let total = 0;

  // Hinges: 2 per door
  const doorCount = construction.hasDoors ? (cabinet.config.dimensions.width < 600 ? 1 : 2) : 0;
  total += doorCount * 2 * HARDWARE_CATALOG.find((h) => h.id === "hinge-soft")!.costPerUnit;

  // Drawer slides: 1 pair per drawer
  total += construction.drawers.length * HARDWARE_CATALOG.find((h) => h.id === "drawer-slide-soft")!.costPerUnit;

  // Handles: 1 per door + 1 per drawer front
  const handleCost = HARDWARE_CATALOG.find((h) => h.id === "handle-bar")!.costPerUnit;
  total += (doorCount + construction.drawerFronts.length) * handleCost;

  // Shelf pins: 4 per shelf
  total += construction.shelves.length * 4 * HARDWARE_CATALOG.find((h) => h.id === "shelf-pin")!.costPerUnit;

  // Connectors: ~8 per cabinet
  total += 8 * HARDWARE_CATALOG.find((h) => h.id === "connector")!.costPerUnit;

  // Screws: 1 pack
  total += HARDWARE_CATALOG.find((h) => h.id === "screw-pack")!.costPerUnit;

  // Legs: 4 if floor-standing
  if (cabinet.placement.attachment === "floor") {
    total += 4 * HARDWARE_CATALOG.find((h) => h.id === "leg-adj")!.costPerUnit;
  } else {
    total += 2 * HARDWARE_CATALOG.find((h) => h.id === "wall-bracket")!.costPerUnit;
  }

  return total;
}

// ── Cabinet Cost ──────────────────────────────────────────────

export type CabinetCost = {
  cabinetId: string;
  cabinetName: string;
  materialCost: number;
  hardwareCost: number;
  finishCost: number;
  edgeBandCost: number;
  labourCost: number;
  totalCost: number;
  breakdown: string[];
};

export function calculateCabinetCost(
  cabinet: CabinetInstance,
  construction: CabinetConstruction,
  cutlistItems: CabinetCutlistItem[],
  materials: CabinetMaterialSpec = DEFAULT_CABINET_MATERIAL,
): CabinetCost {
  let materialCost = 0;
  let edgeBandCost = 0;
  let finishCost = 0;
  const breakdown: string[] = [];

  for (const item of cutlistItems) {
    const areaM2 = (item.lengthMm * item.widthMm * item.quantity) / 1_000_000;

    // Material
    const spec = item.material === "Door"
      ? materials.doorMaterial
      : item.material === "Back Panel"
        ? materials.backMaterial
        : materials.carcassMaterial;

    const boardCost = getBoardCost(spec.boardMaterialId, item.thicknessMm) * areaM2;
    materialCost += boardCost;

    // Finish
    const finishC = getFinishCost(spec.finishId) * areaM2;
    finishCost += finishC;

    // Edge banding
    if (spec.edgeBandingId !== "none") {
      const perimeter = partPerimeterMm(item.lengthMm, item.widthMm);
      edgeBandCost += (getEdgeBandCost(spec.edgeBandingId) * perimeter / 1000) * item.quantity;
    }
  }

  const hardwareCost = countHardware(cabinet, construction);
  const labourCost = materialCost * 0.4; // ~40% of material for labour

  breakdown.push(`Board material: ₹${Math.round(materialCost).toLocaleString()}`);
  breakdown.push(`Finishes: ₹${Math.round(finishCost).toLocaleString()}`);
  breakdown.push(`Edge banding: ₹${Math.round(edgeBandCost).toLocaleString()}`);
  breakdown.push(`Hardware: ₹${Math.round(hardwareCost).toLocaleString()}`);
  breakdown.push(`Labour: ₹${Math.round(labourCost).toLocaleString()}`);

  const materialTotal = materialCost + finishCost + edgeBandCost;
  const total = materialTotal + hardwareCost + labourCost;

  return {
    cabinetId: cabinet.id,
    cabinetName: cabinet.name,
    materialCost: Math.round(materialTotal),
    hardwareCost: Math.round(hardwareCost),
    finishCost: Math.round(finishCost),
    edgeBandCost: Math.round(edgeBandCost),
    labourCost: Math.round(labourCost),
    totalCost: Math.round(total),
    breakdown,
  };
}

// ── Project Cost Summary ──────────────────────────────────────

export type ProjectCost = {
  cabinets: CabinetCost[];
  totalMaterial: number;
  totalHardware: number;
  totalLabour: number;
  grandTotal: number;
};

export function calculateProjectCost(
  cabinets: CabinetInstance[],
  constructionMap: Map<string, CabinetConstruction>,
  cutlistMap: Map<string, CabinetCutlistItem[]>,
  materials: CabinetMaterialSpec = DEFAULT_CABINET_MATERIAL,
): ProjectCost {
  let totalMaterial = 0;
  let totalHardware = 0;
  let totalLabour = 0;
  const costs: CabinetCost[] = [];

  for (const cab of cabinets) {
    const construction = constructionMap.get(cab.id) ?? defaultConstruction(cab.config.dimensions);
    const cutlist = cutlistMap.get(cab.id) ?? [];
    const cost = calculateCabinetCost(cab, construction, cutlist, materials);
    costs.push(cost);
    totalMaterial += cost.materialCost + cost.finishCost + cost.edgeBandCost;
    totalHardware += cost.hardwareCost;
    totalLabour += cost.labourCost;
  }

  return {
    cabinets: costs,
    totalMaterial: Math.round(totalMaterial),
    totalHardware: Math.round(totalHardware),
    totalLabour: Math.round(totalLabour),
    grandTotal: Math.round(totalMaterial + totalHardware + totalLabour),
  };
}

