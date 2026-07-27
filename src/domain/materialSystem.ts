// ── Material System ──────────────────────────────────────────

export type MaterialPresetId = "ply-premium" | "mdf-painted" | "particle-economy";

// ── Board Material ───────────────────────────────────────────

export type BoardMaterialId = "mdf" | "ply" | "particle" | "hdhmr";

export type BoardMaterial = {
  id: BoardMaterialId;
  label: string;
  description: string;
  density: "standard" | "high";
  moistureResistant: boolean;
  costPerM2: Record<number, number>; // thicknessMm → cost
};

export const BOARD_MATERIALS: BoardMaterial[] = [
  {
    id: "mdf",
    label: "MDF",
    description: "Medium-density fibreboard. Smooth, paintable, good for painted finishes.",
    density: "standard",
    moistureResistant: false,
    costPerM2: { 12: 18, 16: 22, 18: 25, 25: 35 },
  },
  {
    id: "hdhmr",
    label: "HDHMR",
    description: "High-density high-moisture-resistant board. Ideal for kitchens and bathrooms.",
    density: "high",
    moistureResistant: true,
    costPerM2: { 12: 28, 16: 35, 18: 38, 25: 52 },
  },
  {
    id: "ply",
    label: "Plywood",
    description: "Multi-ply hardwood. Strong, holds screws well.",
    density: "high",
    moistureResistant: true,
    costPerM2: { 12: 42, 16: 48, 18: 52, 25: 72 },
  },
  {
    id: "particle",
    label: "Particle Board",
    description: "Economy engineered board. Pre-laminated options available.",
    density: "standard",
    moistureResistant: false,
    costPerM2: { 12: 12, 16: 15, 18: 16, 25: 22 },
  },
];

// ── Thickness Presets ─────────────────────────────────────────

export type ThicknessPreset = {
  label: string;
  valueMm: number;
  usage: "carcass" | "back" | "door" | "drawer" | "shelf";
};

export const THICKNESS_PRESETS: ThicknessPreset[] = [
  { label: "18mm Carcass", valueMm: 18, usage: "carcass" },
  { label: "16mm Carcass", valueMm: 16, usage: "carcass" },
  { label: "8mm Back", valueMm: 8, usage: "back" },
  { label: "6mm Back", valueMm: 6, usage: "back" },
  { label: "3mm Back", valueMm: 3, usage: "back" },
  { label: "18mm Door", valueMm: 18, usage: "door" },
  { label: "22mm Door", valueMm: 22, usage: "door" },
  { label: "12mm Drawer", valueMm: 12, usage: "drawer" },
  { label: "18mm Shelf", valueMm: 18, usage: "shelf" },
  { label: "25mm Shelf", valueMm: 25, usage: "shelf" },
];

// ── Finishes ──────────────────────────────────────────────────

export type FinishId = "white-matte" | "white-gloss" | "wood-oak" | "wood-walnut" | "grey" | "laminate";

export type Finish = {
  id: FinishId;
  label: string;
  color: string;
  costPerM2: number;
};

export const FINISHES: Finish[] = [
  { id: "white-matte", label: "White Matte", color: "#f5f2ed", costPerM2: 0 },
  { id: "white-gloss", label: "White Gloss", color: "#faf9f6", costPerM2: 120 },
  { id: "wood-oak", label: "Oak Woodgrain", color: "#c9a87c", costPerM2: 80 },
  { id: "wood-walnut", label: "Walnut", color: "#5c3d2e", costPerM2: 140 },
  { id: "grey", label: "Grey Matte", color: "#b0aba0", costPerM2: 40 },
  { id: "laminate", label: "Laminate", color: "#e0d8c8", costPerM2: 0 },
];

// ── Edge Banding ──────────────────────────────────────────────

export type EdgeBandingId = "abs-1mm" | "abs-2mm" | "pvc-0.5mm" | "pvc-1mm" | "veneer" | "none";

export type EdgeBanding = {
  id: EdgeBandingId;
  label: string;
  thicknessMm: number;
  costPerM: number;
  color: string;
};

export const EDGE_BANDING_OPTIONS: EdgeBanding[] = [
  { id: "abs-1mm", label: "ABS 1mm", thicknessMm: 1, costPerM: 8, color: "#e8e0d4" },
  { id: "abs-2mm", label: "ABS 2mm", thicknessMm: 2, costPerM: 14, color: "#e8e0d4" },
  { id: "pvc-0.5mm", label: "PVC 0.5mm", thicknessMm: 0.5, costPerM: 4, color: "#f0ebe0" },
  { id: "pvc-1mm", label: "PVC 1mm", thicknessMm: 1, costPerM: 7, color: "#f0ebe0" },
  { id: "veneer", label: "Veneer", thicknessMm: 0.6, costPerM: 16, color: "#c4a67a" },
  { id: "none", label: "None", thicknessMm: 0, costPerM: 0, color: "transparent" },
];

// ── Grain Direction ───────────────────────────────────────────

export type GrainDirection = "lengthwise" | "crosswise" | "none";

export const GRAIN_LABELS: Record<GrainDirection, string> = {
  lengthwise: "Lengthwise (↓)",
  crosswise: "Crosswise (→)",
  none: "No grain",
};

// ── Back Panel Rules ──────────────────────────────────────────

export type BackPanelType = "grooved" | "screwed" | "none";

export const BACK_PANEL_RULES: Record<BackPanelType, { rebateMm: number; description: string }> = {
  grooved: { rebateMm: 12, description: "Grooved into side panels (12mm rebate)" },
  screwed: { rebateMm: 0, description: "Screwed flush to back edges" },
  none: { rebateMm: 0, description: "No back panel (open cabinet)" },
};

// ── Material Spec for a single part ───────────────────────────

export type PartMaterialSpec = {
  boardMaterialId: BoardMaterialId;
  thicknessMm: number;
  finishId: FinishId;
  edgeBandingId: EdgeBandingId;
  grainDirection: GrainDirection;
  backPanelType: BackPanelType;
};

export const DEFAULT_PART_MATERIAL: PartMaterialSpec = {
  boardMaterialId: "mdf",
  thicknessMm: 18,
  finishId: "white-matte",
  edgeBandingId: "abs-1mm",
  grainDirection: "lengthwise",
  backPanelType: "grooved",
};

// ── Material spec for an entire cabinet ───────────────────────

export type CabinetMaterialSpec = {
  carcassMaterial: PartMaterialSpec;
  backMaterial: PartMaterialSpec;
  doorMaterial: PartMaterialSpec;
  drawerBoxMaterial: PartMaterialSpec;
  shelfMaterial: PartMaterialSpec;
};

export const DEFAULT_CABINET_MATERIAL: CabinetMaterialSpec = {
  carcassMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "hdhmr", thicknessMm: 18, finishId: "laminate", edgeBandingId: "pvc-0.5mm" },
  backMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "hdhmr", thicknessMm: 6, finishId: "laminate", edgeBandingId: "none", backPanelType: "grooved" },
  doorMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 18, finishId: "white-matte", edgeBandingId: "abs-2mm" },
  drawerBoxMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 12, finishId: "laminate", edgeBandingId: "none" },
  shelfMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "hdhmr", thicknessMm: 18, finishId: "laminate", edgeBandingId: "abs-1mm" },
};

export type MaterialPreset = {
  id: MaterialPresetId;
  label: string;
  description: string;
  spec: CabinetMaterialSpec;
};

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "ply-premium",
    label: "Plywood Premium",
    description: "Moisture-resistant ply carcass with painted MDF shutters.",
    spec: {
      carcassMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 18, finishId: "wood-oak", edgeBandingId: "abs-1mm", grainDirection: "lengthwise" },
      backMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 6, finishId: "laminate", edgeBandingId: "none", backPanelType: "grooved", grainDirection: "crosswise" },
      doorMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 18, finishId: "white-matte", edgeBandingId: "abs-2mm", grainDirection: "lengthwise" },
      drawerBoxMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 12, finishId: "laminate", edgeBandingId: "none", grainDirection: "crosswise" },
      shelfMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 18, finishId: "wood-oak", edgeBandingId: "abs-1mm", grainDirection: "lengthwise" },
    },
  },
  {
    id: "mdf-painted",
    label: "MDF Painted",
    description: "Paint-grade MDF exterior with MDF/HDHMR carcass parts.",
    spec: {
      carcassMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 18, finishId: "white-matte", edgeBandingId: "abs-1mm", grainDirection: "none" },
      backMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 6, finishId: "white-matte", edgeBandingId: "none", backPanelType: "grooved", grainDirection: "none" },
      doorMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 18, finishId: "white-gloss", edgeBandingId: "abs-2mm", grainDirection: "none" },
      drawerBoxMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "ply", thicknessMm: 12, finishId: "laminate", edgeBandingId: "none", grainDirection: "crosswise" },
      shelfMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "mdf", thicknessMm: 18, finishId: "white-matte", edgeBandingId: "abs-1mm", grainDirection: "none" },
    },
  },
  {
    id: "particle-economy",
    label: "Particle Economy",
    description: "Budget particle board layout with laminate finish.",
    spec: {
      carcassMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "particle", thicknessMm: 18, finishId: "laminate", edgeBandingId: "pvc-0.5mm", grainDirection: "lengthwise" },
      backMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "particle", thicknessMm: 6, finishId: "laminate", edgeBandingId: "none", backPanelType: "screwed", grainDirection: "crosswise" },
      doorMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "particle", thicknessMm: 18, finishId: "grey", edgeBandingId: "pvc-1mm", grainDirection: "lengthwise" },
      drawerBoxMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "particle", thicknessMm: 12, finishId: "laminate", edgeBandingId: "none", grainDirection: "crosswise" },
      shelfMaterial: { ...DEFAULT_PART_MATERIAL, boardMaterialId: "particle", thicknessMm: 18, finishId: "laminate", edgeBandingId: "pvc-0.5mm", grainDirection: "lengthwise" },
    },
  },
];

export type CabinetBuildRules = {
  materialPresetId: MaterialPresetId;
  carcassThicknessMm: number;
  backPanelThicknessMm: number;
  shelfThicknessMm: number;
  drawerBoxThicknessMm: number;
  finishId: FinishId;
  edgeBandingId: EdgeBandingId;
  grainDirection: GrainDirection;
  backPanelType: BackPanelType;
};

export const DEFAULT_BUILD_RULES: CabinetBuildRules = {
  materialPresetId: "ply-premium",
  carcassThicknessMm: 18,
  backPanelThicknessMm: 6,
  shelfThicknessMm: 18,
  drawerBoxThicknessMm: 12,
  finishId: "wood-oak",
  edgeBandingId: "abs-1mm",
  grainDirection: "lengthwise",
  backPanelType: "grooved",
};

export function getMaterialPreset(id: MaterialPresetId): MaterialPreset {
  return MATERIAL_PRESETS.find((preset) => preset.id === id) ?? MATERIAL_PRESETS[0];
}

export function resolveCabinetMaterialSpec(
  rules: Partial<CabinetBuildRules> | undefined,
): CabinetMaterialSpec {
  const mergedRules = { ...DEFAULT_BUILD_RULES, ...(rules ?? {}) };
  const preset = getMaterialPreset(mergedRules.materialPresetId);

  return {
    carcassMaterial: {
      ...preset.spec.carcassMaterial,
      thicknessMm: mergedRules.carcassThicknessMm,
      finishId: mergedRules.finishId,
      edgeBandingId: mergedRules.edgeBandingId,
      grainDirection: mergedRules.grainDirection,
      backPanelType: mergedRules.backPanelType,
    },
    backMaterial: {
      ...preset.spec.backMaterial,
      thicknessMm: mergedRules.backPanelThicknessMm,
      finishId: mergedRules.finishId,
      backPanelType: mergedRules.backPanelType,
      grainDirection: mergedRules.grainDirection === "none" ? "crosswise" : mergedRules.grainDirection,
    },
    doorMaterial: {
      ...preset.spec.doorMaterial,
      finishId: mergedRules.finishId,
      edgeBandingId: mergedRules.edgeBandingId,
      grainDirection: mergedRules.grainDirection,
    },
    drawerBoxMaterial: {
      ...preset.spec.drawerBoxMaterial,
      thicknessMm: mergedRules.drawerBoxThicknessMm,
      grainDirection: mergedRules.grainDirection === "none" ? "crosswise" : mergedRules.grainDirection,
    },
    shelfMaterial: {
      ...preset.spec.shelfMaterial,
      thicknessMm: mergedRules.shelfThicknessMm,
      finishId: mergedRules.finishId,
      edgeBandingId: mergedRules.edgeBandingId,
      grainDirection: mergedRules.grainDirection,
    },
  };
}
