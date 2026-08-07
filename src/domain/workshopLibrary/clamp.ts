import { clampCabinetConfig, cabinetTypeLabels } from "../cabinetDimensions";
import type { DoorStyle } from "../cabinetOpeningStructure";
import type { CountertopConfig } from "../countertop";
import type { HardwareKind } from "../hardwareSystem";
import {
  EDGE_BANDING_OPTIONS,
  FINISHES,
  MATERIAL_PRESETS,
  type EdgeBandingId,
  type FinishId,
  type MaterialPresetId,
} from "../materialSystem";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "../projectStandards";
import { DOOR_STYLES } from "./builtins";
import {
  WORKSHOP_LIBRARY_SCHEMA_VERSION,
  type CabinetFamilyLibraryEntry,
  type CountertopLibraryEntry,
  type DoorStyleLibraryEntry,
  type HardwareLibraryEntry,
  type MaterialLibraryEntry,
  type StandardsLibraryEntry,
  type WorkshopLibraryPack,
} from "./types";

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
