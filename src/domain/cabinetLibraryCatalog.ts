import {
  clampCabinetConfig,
  cabinetTypeLabels,
  getDefaultCabinetConfig,
  type CabinetConfig,
  type CabinetType,
} from "./cabinetDimensions";
import { supportsToeKick } from "./cabinetCapabilities";
import {
  ENGINEERED_CABINET_PRESETS,
  getEngineeredCabinetPreset,
  listEngineeredPresetsForFamily,
  type EngineeredCabinetPreset,
} from "./cabinetPresets";
import { cabinetLibrary } from "./cabinetLibrary";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
  type ProjectStandards,
} from "./projectStandards";
import type { CabinetFamilyLibraryEntry } from "./workshopLibrary";

export type CabinetLibraryItemSource = "engineered" | "family-default" | "user";

export type CabinetLibraryItem = {
  id: string;
  label: string;
  family: CabinetType;
  description: string;
  source: CabinetLibraryItemSource;
  /** Engineered preset id when source is engineered; otherwise family type. */
  presetId?: string;
  version?: number;
};

function familyDefaultId(type: CabinetType) {
  return `family-${type}`;
}

export function listFamilyLibraryItems(): CabinetLibraryItem[] {
  const types = cabinetLibrary.flatMap((category) => category.types);
  const unique = Array.from(new Set(types));
  return unique.map((type) => ({
    id: familyDefaultId(type),
    label: `${cabinetTypeLabels[type]} · Default`,
    family: type,
    description: `Family default ${cabinetTypeLabels[type].toLowerCase()} with standard openings and construction.`,
    source: "family-default" as const,
  }));
}

export function listEngineeredLibraryItems(): CabinetLibraryItem[] {
  return ENGINEERED_CABINET_PRESETS.map((preset) => ({
    id: `engineered-${preset.id}`,
    label: preset.label,
    family: preset.family,
    description: preset.description,
    source: "engineered" as const,
    presetId: preset.id,
  }));
}

export function listUserCabinetLibraryItems(
  presets: CabinetFamilyLibraryEntry[] = [],
): CabinetLibraryItem[] {
  return presets.map((preset) => ({
    id: `user-${preset.id}`,
    label: preset.label,
    family: preset.family,
    description: `${preset.description} · v${preset.version}`,
    source: "user" as const,
    presetId: preset.id,
    version: preset.version,
  }));
}

export function listCabinetLibraryItems(
  userPresets: CabinetFamilyLibraryEntry[] = [],
): CabinetLibraryItem[] {
  return [
    ...listFamilyLibraryItems(),
    ...listEngineeredLibraryItems(),
    ...listUserCabinetLibraryItems(userPresets),
  ];
}

export function listCabinetLibraryItemsForFamily(
  family: CabinetType,
  userPresets: CabinetFamilyLibraryEntry[] = [],
): CabinetLibraryItem[] {
  return listCabinetLibraryItems(userPresets).filter((item) => item.family === family);
}

export function getCabinetLibraryItem(
  id: string,
  userPresets: CabinetFamilyLibraryEntry[] = [],
): CabinetLibraryItem | null {
  return listCabinetLibraryItems(userPresets).find((item) => item.id === id) ?? null;
}

export function applyStandardsToConfig(
  config: CabinetConfig,
  standards: ProjectStandards = DEFAULT_PROJECT_STANDARDS,
): CabinetConfig {
  const safe = clampProjectStandards(standards);
  const toeKickEnabled = supportsToeKick(config.type) && safe.toeKickHeightMm > 0;
  const composition = config.composition
    ? {
        ...config.composition,
        toeKick: {
          ...config.composition.toeKick,
          enabled: toeKickEnabled,
          heightMm: toeKickEnabled ? safe.toeKickHeightMm : 0,
          insetMm: toeKickEnabled ? safe.toeKickInsetMm : 0,
        },
      }
    : undefined;

  return clampCabinetConfig({
    ...config,
    dimensions: {
      ...config.dimensions,
      boardThickness: safe.carcassThicknessMm,
      backPanelThickness: safe.backPanelThicknessMm,
    },
    toeKickHeight: toeKickEnabled ? safe.toeKickHeightMm : 0,
    toeKickInset: toeKickEnabled ? safe.toeKickInsetMm : 0,
    buildRules: {
      ...(config.buildRules ?? {}),
      materialPresetId: safe.materialPresetId,
      carcassThicknessMm: safe.carcassThicknessMm,
      backPanelThicknessMm: safe.backPanelThicknessMm,
      shelfThicknessMm: safe.shelfThicknessMm,
      drawerBoxThicknessMm: safe.drawerBoxThicknessMm,
      finishId: safe.finishId,
      edgeBandingId: safe.edgeBandingId,
    },
    composition,
  });
}

export function resolveLibraryItemConfig(
  item: CabinetLibraryItem,
  userPresets: CabinetFamilyLibraryEntry[] = [],
): CabinetConfig {
  if (item.source === "engineered" && item.presetId) {
    const preset = getEngineeredCabinetPreset(item.presetId);
    if (preset) return clampCabinetConfig(preset.config);
  }
  if (item.source === "user" && item.presetId) {
    const preset = userPresets.find((entry) => entry.id === item.presetId);
    if (preset) return clampCabinetConfig(preset.config);
  }
  return getDefaultCabinetConfig(item.family);
}

export function createConfigFromLibraryItem(
  itemId: string,
  standards: ProjectStandards = DEFAULT_PROJECT_STANDARDS,
  userPresets: CabinetFamilyLibraryEntry[] = [],
): CabinetConfig | null {
  const item = getCabinetLibraryItem(itemId, userPresets);
  if (!item) return null;
  return applyStandardsToConfig(resolveLibraryItemConfig(item, userPresets), standards);
}

export function createConfigFromFamily(
  family: CabinetType,
  standards: ProjectStandards = DEFAULT_PROJECT_STANDARDS,
): CabinetConfig {
  return applyStandardsToConfig(getDefaultCabinetConfig(family), standards);
}

export function listLibraryGroups(userPresets: CabinetFamilyLibraryEntry[] = []) {
  return cabinetLibrary.map((category) => ({
    id: category.id,
    label: category.label,
    families: category.types,
    items: category.types.flatMap((family) => [
      ...listCabinetLibraryItemsForFamily(family, userPresets).filter(
        (item) => item.source === "family-default",
      ),
      ...listEngineeredPresetsForFamily(family).map((preset: EngineeredCabinetPreset) => ({
        id: `engineered-${preset.id}`,
        label: preset.label,
        family: preset.family,
        description: preset.description,
        source: "engineered" as const,
        presetId: preset.id,
      })),
      ...listUserCabinetLibraryItems(userPresets).filter((item) => item.family === family),
    ]),
  }));
}
