import type { CabinetConfig, CabinetType } from "./cabinetDimensions";
import { clampCabinetConfig, cabinetTypeLabels } from "./cabinetDimensions";
import type { DoorStyle } from "./cabinetOpeningStructure";
import type { CountertopConfig } from "./countertop";
import { DEFAULT_COUNTERTOP_CONFIG } from "./countertop";
import {
  HARDWARE_CATALOG,
  type HardwareItem,
  type HardwareKind,
} from "./hardwareSystem";
import {
  EDGE_BANDING_OPTIONS,
  FINISHES,
  MATERIAL_PRESETS,
  type EdgeBandingId,
  type FinishId,
  type MaterialPresetId,
} from "./materialSystem";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
  type ProjectStandards,
} from "./projectStandards";
import type { CabinetTemplate } from "./cabinetTemplates";
import { clampCabinetTemplate } from "./cabinetTemplates";

export const WORKSHOP_LIBRARY_STORAGE_KEY = "cabinet-designer-workshop-library";
export const WORKSHOP_LIBRARY_SCHEMA_VERSION = 1;

export type DoorStyleLibraryEntry = {
  id: string;
  label: string;
  doorStyle: DoorStyle;
  description: string;
  version: number;
};

export type MaterialLibraryEntry = {
  id: string;
  label: string;
  materialPresetId: MaterialPresetId;
  finishId: FinishId;
  edgeBandingId: EdgeBandingId;
  description: string;
  version: number;
};

export type HardwareLibraryEntry = HardwareItem & {
  userDefined: true;
  version: number;
};

export type CountertopLibraryEntry = {
  id: string;
  label: string;
  thicknessMm: number;
  overhangFrontMm: number;
  overhangSidesMm: number;
  materialLabel: string;
  description: string;
  version: number;
};

export type StandardsLibraryEntry = {
  id: string;
  label: string;
  description: string;
  standards: ProjectStandards;
  version: number;
  updatedAt: string;
};

export type CabinetFamilyLibraryEntry = {
  id: string;
  label: string;
  family: CabinetType;
  description: string;
  config: CabinetConfig;
  version: number;
  updatedAt: string;
};

export type WorkshopLibraryPack = {
  schemaVersion: number;
  updatedAt: string;
  doorStyles: DoorStyleLibraryEntry[];
  materials: MaterialLibraryEntry[];
  hardware: HardwareLibraryEntry[];
  countertops: CountertopLibraryEntry[];
  standardsPacks: StandardsLibraryEntry[];
  cabinetPresets: CabinetFamilyLibraryEntry[];
};

const DOOR_STYLES: DoorStyle[] = ["none", "single", "double", "bi-fold"];

export const BUILTIN_DOOR_STYLE_LIBRARY: DoorStyleLibraryEntry[] = [
  {
    id: "door-single",
    label: "Single door",
    doorStyle: "single",
    description: "One hinged leaf",
    version: 1,
  },
  {
    id: "door-double",
    label: "Double doors",
    doorStyle: "double",
    description: "Paired leaves",
    version: 1,
  },
  {
    id: "door-bifold",
    label: "Bi-fold",
    doorStyle: "bi-fold",
    description: "Folding leaf pair",
    version: 1,
  },
];

export const BUILTIN_MATERIAL_LIBRARY: MaterialLibraryEntry[] = MATERIAL_PRESETS.map(
  (preset) => ({
    id: `material-${preset.id}`,
    label: preset.label,
    materialPresetId: preset.id,
    finishId: preset.spec.doorMaterial.finishId,
    edgeBandingId: preset.spec.carcassMaterial.edgeBandingId,
    description: preset.description,
    version: 1,
  }),
);

export const BUILTIN_COUNTERTOP_LIBRARY: CountertopLibraryEntry[] = [
  {
    id: "ct-standard-laminate",
    label: "Standard laminate 28 mm",
    thicknessMm: 28,
    overhangFrontMm: 30,
    overhangSidesMm: 20,
    materialLabel: "Laminate",
    description: "Default kitchen worktop",
    version: 1,
  },
  {
    id: "ct-compact-20",
    label: "Compact 20 mm",
    thicknessMm: 20,
    overhangFrontMm: 25,
    overhangSidesMm: 15,
    materialLabel: "Compact laminate",
    description: "Thinner commercial top",
    version: 1,
  },
  {
    id: "ct-stone-30",
    label: "Stone look 30 mm",
    thicknessMm: 30,
    overhangFrontMm: 35,
    overhangSidesMm: 20,
    materialLabel: "Quartz / stone",
    description: "Heavier visual top profile",
    version: 1,
  },
];

export const BUILTIN_STANDARDS_PACKS: StandardsLibraryEntry[] = [
  {
    id: "standards-workshop-default",
    label: "Workshop default",
    description: "Standard 18 mm carcass with painted finish",
    standards: { ...DEFAULT_PROJECT_STANDARDS },
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "standards-economy",
    label: "Economy particle",
    description: "16 mm carcass, laminate economy pack",
    standards: clampProjectStandards({
      ...DEFAULT_PROJECT_STANDARDS,
      carcassThicknessMm: 16,
      materialPresetId: "particle-economy",
      finishId: "laminate",
      edgeBandingId: "abs-1mm",
    }),
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "standards-premium-ply",
    label: "Premium plywood",
    description: "18 mm ply carcass with walnut finish",
    standards: clampProjectStandards({
      ...DEFAULT_PROJECT_STANDARDS,
      materialPresetId: "ply-premium",
      finishId: "wood-walnut",
      edgeBandingId: "veneer",
    }),
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function createEmptyWorkshopLibrary(): WorkshopLibraryPack {
  return {
    schemaVersion: WORKSHOP_LIBRARY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    doorStyles: [],
    materials: [],
    hardware: [],
    countertops: [],
    standardsPacks: [],
    cabinetPresets: [],
  };
}

function clampDoorStyle(value: unknown): DoorStyle {
  return DOOR_STYLES.includes(value as DoorStyle) ? (value as DoorStyle) : "single";
}

function clampCountertopDims(entry: Partial<CountertopLibraryEntry>): CountertopConfig {
  return {
    thicknessMm: Math.min(60, Math.max(12, Math.round(Number(entry.thicknessMm) || 28))),
    overhangFrontMm: Math.min(80, Math.max(0, Math.round(Number(entry.overhangFrontMm) || 30))),
    overhangSidesMm: Math.min(60, Math.max(0, Math.round(Number(entry.overhangSidesMm) || 20))),
  };
}

export function clampDoorStyleEntry(
  entry: Partial<DoorStyleLibraryEntry> | undefined,
): DoorStyleLibraryEntry | null {
  if (!entry?.id || !entry.label) return null;
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Door style",
    doorStyle: clampDoorStyle(entry.doorStyle),
    description: String(entry.description ?? "").trim().slice(0, 200),
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
  };
}

export function clampMaterialEntry(
  entry: Partial<MaterialLibraryEntry> | undefined,
): MaterialLibraryEntry | null {
  if (!entry?.id || !entry.label) return null;
  const materialIds = new Set(MATERIAL_PRESETS.map((item) => item.id));
  const finishIds = new Set(FINISHES.map((item) => item.id));
  const edgeIds = new Set(EDGE_BANDING_OPTIONS.map((item) => item.id));
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Material",
    materialPresetId: materialIds.has(entry.materialPresetId as MaterialPresetId)
      ? (entry.materialPresetId as MaterialPresetId)
      : DEFAULT_PROJECT_STANDARDS.materialPresetId,
    finishId: finishIds.has(entry.finishId as FinishId)
      ? (entry.finishId as FinishId)
      : DEFAULT_PROJECT_STANDARDS.finishId,
    edgeBandingId: edgeIds.has(entry.edgeBandingId as EdgeBandingId)
      ? (entry.edgeBandingId as EdgeBandingId)
      : DEFAULT_PROJECT_STANDARDS.edgeBandingId,
    description: String(entry.description ?? "").trim().slice(0, 200),
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
  };
}

export function clampHardwareEntry(
  entry: Partial<HardwareLibraryEntry> | undefined,
): HardwareLibraryEntry | null {
  if (!entry?.id || !entry.label) return null;
  const kinds: HardwareKind[] = [
    "hinge",
    "slide",
    "handle",
    "leg",
    "bracket",
    "shelf-pin",
    "accessory",
    "consumable",
  ];
  const kind = kinds.includes(entry.kind as HardwareKind)
    ? (entry.kind as HardwareKind)
    : "accessory";
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Hardware",
    kind,
    costPerUnit: Math.max(0, Math.round(Number(entry.costPerUnit) || 0)),
    description: String(entry.description ?? "").trim().slice(0, 200),
    lengthMm: entry.lengthMm ? Math.round(Number(entry.lengthMm)) : undefined,
    softClose: Boolean(entry.softClose),
    pair: Boolean(entry.pair),
    userDefined: true,
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
  };
}

export function clampCountertopEntry(
  entry: Partial<CountertopLibraryEntry> | undefined,
): CountertopLibraryEntry | null {
  if (!entry?.id || !entry.label) return null;
  const dims = clampCountertopDims(entry);
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Countertop",
    ...dims,
    materialLabel: String(entry.materialLabel ?? "Laminate").trim().slice(0, 60) || "Laminate",
    description: String(entry.description ?? "").trim().slice(0, 200),
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
  };
}

export function clampStandardsEntry(
  entry: Partial<StandardsLibraryEntry> | undefined,
): StandardsLibraryEntry | null {
  if (!entry?.id || !entry.label) return null;
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Standards pack",
    description: String(entry.description ?? "").trim().slice(0, 200),
    standards: clampProjectStandards(entry.standards),
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

export function clampCabinetFamilyEntry(
  entry: Partial<CabinetFamilyLibraryEntry> | undefined,
): CabinetFamilyLibraryEntry | null {
  if (!entry?.id || !entry.label || !entry.config || !entry.family) return null;
  return {
    id: String(entry.id),
    label: String(entry.label).trim().slice(0, 80) || "Cabinet preset",
    family: entry.family,
    description:
      String(entry.description ?? "").trim().slice(0, 200) ||
      `User ${cabinetTypeLabels[entry.family]} preset`,
    config: clampCabinetConfig(entry.config),
    version: Math.max(1, Math.round(Number(entry.version) || 1)),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

export function clampWorkshopLibrary(
  pack: Partial<WorkshopLibraryPack> | undefined,
): WorkshopLibraryPack {
  const empty = createEmptyWorkshopLibrary();
  if (!pack) return empty;
  return {
    schemaVersion: WORKSHOP_LIBRARY_SCHEMA_VERSION,
    updatedAt: pack.updatedAt || new Date().toISOString(),
    doorStyles: (pack.doorStyles ?? [])
      .map((item) => clampDoorStyleEntry(item))
      .filter((item): item is DoorStyleLibraryEntry => Boolean(item))
      .slice(0, 40),
    materials: (pack.materials ?? [])
      .map((item) => clampMaterialEntry(item))
      .filter((item): item is MaterialLibraryEntry => Boolean(item))
      .slice(0, 40),
    hardware: (pack.hardware ?? [])
      .map((item) => clampHardwareEntry(item))
      .filter((item): item is HardwareLibraryEntry => Boolean(item))
      .slice(0, 60),
    countertops: (pack.countertops ?? [])
      .map((item) => clampCountertopEntry(item))
      .filter((item): item is CountertopLibraryEntry => Boolean(item))
      .slice(0, 40),
    standardsPacks: (pack.standardsPacks ?? [])
      .map((item) => clampStandardsEntry(item))
      .filter((item): item is StandardsLibraryEntry => Boolean(item))
      .slice(0, 20),
    cabinetPresets: (pack.cabinetPresets ?? [])
      .map((item) => clampCabinetFamilyEntry(item))
      .filter((item): item is CabinetFamilyLibraryEntry => Boolean(item))
      .slice(0, 60),
  };
}

export function loadWorkshopLibrary(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): WorkshopLibraryPack {
  if (!storage) return createEmptyWorkshopLibrary();
  try {
    const raw = storage.getItem(WORKSHOP_LIBRARY_STORAGE_KEY);
    if (!raw) return createEmptyWorkshopLibrary();
    return clampWorkshopLibrary(JSON.parse(raw) as WorkshopLibraryPack);
  } catch {
    return createEmptyWorkshopLibrary();
  }
}

export function saveWorkshopLibrary(
  pack: WorkshopLibraryPack,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
) {
  if (!storage) return;
  const next = clampWorkshopLibrary({
    ...pack,
    updatedAt: new Date().toISOString(),
  });
  storage.setItem(WORKSHOP_LIBRARY_STORAGE_KEY, JSON.stringify(next));
}

export function exportWorkshopLibraryJson(pack: WorkshopLibraryPack): string {
  return JSON.stringify(clampWorkshopLibrary(pack), null, 2);
}

export function importWorkshopLibraryJson(raw: string): WorkshopLibraryPack {
  const parsed = JSON.parse(raw) as WorkshopLibraryPack;
  return clampWorkshopLibrary(parsed);
}

export function mergeWorkshopLibraries(
  base: WorkshopLibraryPack,
  incoming: WorkshopLibraryPack,
): WorkshopLibraryPack {
  const mergeById = <T extends { id: string; version: number }>(
    current: T[],
    next: T[],
  ): T[] => {
    const map = new Map(current.map((item) => [item.id, item]));
    for (const item of next) {
      const existing = map.get(item.id);
      if (!existing || item.version >= existing.version) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  };

  return clampWorkshopLibrary({
    schemaVersion: WORKSHOP_LIBRARY_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    doorStyles: mergeById(base.doorStyles, incoming.doorStyles),
    materials: mergeById(base.materials, incoming.materials),
    hardware: mergeById(base.hardware, incoming.hardware),
    countertops: mergeById(base.countertops, incoming.countertops),
    standardsPacks: mergeById(base.standardsPacks, incoming.standardsPacks),
    cabinetPresets: mergeById(base.cabinetPresets, incoming.cabinetPresets),
  });
}

export function listDoorStyleLibrary(pack: WorkshopLibraryPack): DoorStyleLibraryEntry[] {
  const map = new Map(BUILTIN_DOOR_STYLE_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.doorStyles) map.set(item.id, item);
  return Array.from(map.values());
}

export function listMaterialLibrary(pack: WorkshopLibraryPack): MaterialLibraryEntry[] {
  const map = new Map(BUILTIN_MATERIAL_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.materials) map.set(item.id, item);
  return Array.from(map.values());
}

export function listHardwareLibrary(pack: WorkshopLibraryPack): HardwareItem[] {
  const map = new Map<string, HardwareItem>(
    HARDWARE_CATALOG.map((item) => [item.id, item]),
  );
  for (const item of pack.hardware) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function listCountertopLibrary(pack: WorkshopLibraryPack): CountertopLibraryEntry[] {
  const map = new Map(BUILTIN_COUNTERTOP_LIBRARY.map((item) => [item.id, item]));
  for (const item of pack.countertops) map.set(item.id, item);
  return Array.from(map.values());
}

export function listStandardsLibrary(pack: WorkshopLibraryPack): StandardsLibraryEntry[] {
  const map = new Map(BUILTIN_STANDARDS_PACKS.map((item) => [item.id, item]));
  for (const item of pack.standardsPacks) map.set(item.id, item);
  return Array.from(map.values());
}

export function countertopConfigFromEntry(entry: CountertopLibraryEntry): CountertopConfig {
  return {
    thicknessMm: entry.thicknessMm,
    overhangFrontMm: entry.overhangFrontMm,
    overhangSidesMm: entry.overhangSidesMm,
  };
}

export function standardsFromMaterialEntry(entry: MaterialLibraryEntry): ProjectStandards {
  return clampProjectStandards({
    ...DEFAULT_PROJECT_STANDARDS,
    materialPresetId: entry.materialPresetId,
    finishId: entry.finishId,
    edgeBandingId: entry.edgeBandingId,
  });
}

export function createCabinetPresetFromConfig(
  config: CabinetConfig,
  name: string,
  description = "",
): CabinetFamilyLibraryEntry {
  const now = new Date().toISOString();
  return clampCabinetFamilyEntry({
    id: `user-preset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    label: name.trim() || `${cabinetTypeLabels[config.type]} preset`,
    family: config.type,
    description: description.trim() || `Saved ${cabinetTypeLabels[config.type]} library preset`,
    config: clampCabinetConfig(config),
    version: 1,
    updatedAt: now,
  })!;
}

export function bumpCabinetPresetVersion(
  entry: CabinetFamilyLibraryEntry,
  config: CabinetConfig,
): CabinetFamilyLibraryEntry {
  return {
    ...entry,
    config: clampCabinetConfig(config),
    version: entry.version + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function bumpTemplateVersion(template: CabinetTemplate): CabinetTemplate {
  return clampCabinetTemplate({
    ...template,
    version: (template.version ?? 1) + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function createDoorStyleEntry(
  label: string,
  doorStyle: DoorStyle,
  description = "",
): DoorStyleLibraryEntry {
  return clampDoorStyleEntry({
    id: `door-user-${Date.now()}`,
    label,
    doorStyle,
    description,
    version: 1,
  })!;
}

export function createMaterialEntry(
  label: string,
  materialPresetId: MaterialPresetId,
  finishId: FinishId,
  edgeBandingId: EdgeBandingId,
  description = "",
): MaterialLibraryEntry {
  return clampMaterialEntry({
    id: `material-user-${Date.now()}`,
    label,
    materialPresetId,
    finishId,
    edgeBandingId,
    description,
    version: 1,
  })!;
}

export function createHardwareEntry(
  label: string,
  kind: HardwareKind,
  costPerUnit: number,
  description = "",
): HardwareLibraryEntry {
  return clampHardwareEntry({
    id: `hw-user-${Date.now()}`,
    label,
    kind,
    costPerUnit,
    description,
    userDefined: true,
    version: 1,
  })!;
}

export function createCountertopEntry(
  label: string,
  config: CountertopConfig = DEFAULT_COUNTERTOP_CONFIG,
  materialLabel = "Laminate",
): CountertopLibraryEntry {
  return clampCountertopEntry({
    id: `ct-user-${Date.now()}`,
    label,
    ...config,
    materialLabel,
    description: `${materialLabel} worktop preset`,
    version: 1,
  })!;
}

export function createStandardsPackEntry(
  label: string,
  standards: ProjectStandards,
  description = "",
): StandardsLibraryEntry {
  return clampStandardsEntry({
    id: `std-user-${Date.now()}`,
    label,
    description,
    standards,
    version: 1,
    updatedAt: new Date().toISOString(),
  })!;
}

export function librarySummary(pack: WorkshopLibraryPack) {
  return {
    doorStyles: listDoorStyleLibrary(pack).length,
    materials: listMaterialLibrary(pack).length,
    hardware: listHardwareLibrary(pack).length,
    countertops: listCountertopLibrary(pack).length,
    standardsPacks: listStandardsLibrary(pack).length,
    cabinetPresets: pack.cabinetPresets.length,
    userOwned:
      pack.doorStyles.length +
      pack.materials.length +
      pack.hardware.length +
      pack.countertops.length +
      pack.standardsPacks.length +
      pack.cabinetPresets.length,
  };
}
