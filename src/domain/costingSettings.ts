export type CostingSettings = {
  presetId: string;
  wastePercent: number;
  labourPercent: number;
  hardwareAllowance: number;
  labourAllowance: number;
  materialRateMultiplier: number;
  finishRateMultiplier: number;
  hingeId: string;
  drawerSlideId: string;
  handleId: string;
};

export const DEFAULT_COSTING_SETTINGS: CostingSettings = {
  presetId: "standard",
  wastePercent: 10,
  labourPercent: 40,
  hardwareAllowance: 0,
  labourAllowance: 0,
  materialRateMultiplier: 1,
  finishRateMultiplier: 1,
  hingeId: "hinge-soft",
  drawerSlideId: "drawer-slide-soft",
  handleId: "handle-bar",
};

const KNOWN_HINGES = new Set(["hinge-soft", "hinge-standard"]);
const KNOWN_SLIDES = new Set(["drawer-slide-soft", "drawer-slide-standard"]);
const KNOWN_HANDLES = new Set(["handle-bar", "handle-knob"]);

export type CostingPreset = {
  id: string;
  label: string;
  description: string;
  settings: CostingSettings;
};

export const COSTING_PRESETS: CostingPreset[] = [
  {
    id: "economy",
    label: "Economy",
    description: "Standard hardware, lower waste allowance",
    settings: {
      presetId: "economy",
      wastePercent: 8,
      labourPercent: 35,
      hardwareAllowance: 0,
      labourAllowance: 0,
      materialRateMultiplier: 0.95,
      finishRateMultiplier: 0.95,
      hingeId: "hinge-standard",
      drawerSlideId: "drawer-slide-standard",
      handleId: "handle-knob",
    },
  },
  {
    id: "standard",
    label: "Standard workshop",
    description: "Soft-close hardware with typical waste and labour",
    settings: { ...DEFAULT_COSTING_SETTINGS },
  },
  {
    id: "premium",
    label: "Premium",
    description: "Soft-close hardware, higher waste and labour buffers",
    settings: {
      presetId: "premium",
      wastePercent: 12,
      labourPercent: 45,
      hardwareAllowance: 2500,
      labourAllowance: 1500,
      materialRateMultiplier: 1.05,
      finishRateMultiplier: 1.15,
      hingeId: "hinge-soft",
      drawerSlideId: "drawer-slide-soft",
      handleId: "handle-bar",
    },
  },
];

export function clampCostingSettings(
  settings: Partial<CostingSettings> | undefined,
): CostingSettings {
  const seed = {
    ...DEFAULT_COSTING_SETTINGS,
    ...(settings ?? {}),
  };

  return {
    presetId: seed.presetId || "standard",
    wastePercent: Math.min(40, Math.max(0, Number(seed.wastePercent) || 0)),
    labourPercent: Math.min(100, Math.max(0, Number(seed.labourPercent) || 0)),
    hardwareAllowance: Math.max(0, Math.round(Number(seed.hardwareAllowance) || 0)),
    labourAllowance: Math.max(0, Math.round(Number(seed.labourAllowance) || 0)),
    materialRateMultiplier: Math.min(
      2,
      Math.max(0.5, Number(seed.materialRateMultiplier) || 1),
    ),
    finishRateMultiplier: Math.min(
      2,
      Math.max(0.5, Number(seed.finishRateMultiplier) || 1),
    ),
    hingeId: KNOWN_HINGES.has(seed.hingeId)
      ? seed.hingeId
      : DEFAULT_COSTING_SETTINGS.hingeId,
    drawerSlideId: KNOWN_SLIDES.has(seed.drawerSlideId)
      ? seed.drawerSlideId
      : DEFAULT_COSTING_SETTINGS.drawerSlideId,
    handleId: KNOWN_HANDLES.has(seed.handleId)
      ? seed.handleId
      : DEFAULT_COSTING_SETTINGS.handleId,
  };
}

export function getCostingPreset(id: string): CostingPreset | null {
  return COSTING_PRESETS.find((preset) => preset.id === id) ?? null;
}
